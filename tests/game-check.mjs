import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shipped game code, without duplicating its physics equations.
const source = fs.readFileSync(new URL('../dist/game.js', import.meta.url), 'utf8');
function game() {
  const elements = new Map();
  const documentListeners = new Map();
  let focusedId = null;
  const element = id => {
    const handlers = new Map(), classes = new Set();
    return {
      id, dataset: {}, disabled: false, hidden: false, style: {}, children: [],
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle(name, force = !classes.has(name)) { force ? classes.add(name) : classes.delete(name); },
      },
      addEventListener(type, fn) { handlers.set(type, fn); },
      dispatch(type, fields = {}) { handlers.get(type)?.({ preventDefault() {}, target: this, ...fields }); },
      click() { if (!this.disabled) this.dispatch('click'); },
      attributes: new Map(),
      setAttribute(name, value) { this.attributes.set(name, String(value)); },
      getAttribute(name) { return this.attributes.get(name) ?? null; },
      appendChild(child) { this.children.push(child); },
      showModal() { this.open = true; }, close() { this.open = false; },
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return true; },
      focus() { focusedId = id; },
    };
  };
  const get = id => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  };
  const cards = ['plank', 'spring', 'fan', 'magnet'].map(type => {
    const card = get(`card-${type}`); card.dataset.tool = type; return card;
  });
  const moveButtons = ['left', 'up', 'down', 'right'].map(direction => {
    const button = get(`move-${direction}`); button.dataset.move = direction; return button;
  });
  const ctx = new Proxy({}, { get: (_, name) => name.includes('Gradient')
    ? () => ({ addColorStop() {} }) : name === 'measureText' ? () => ({ width: 90 }) : () => {} });
  const canvas = get('gameCanvas');
  Object.assign(canvas, { width: 960, height: 540, getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }) });
  const storage = new Map();
  let raf, clock = 0;
  const document = {
    activeElement: null, hidden: false, fullscreenElement: null, body: get('body'),
    getElementById: get, querySelector: s => s === '.game-shell' ? get('game-shell')
      : cards.find(c => s.includes(c.dataset.tool)),
    querySelectorAll: s => s === '.part-card' ? cards : s === '[data-move]' ? moveButtons : [],
    createElement: () => element('new'),
    addEventListener: (type, fn) => documentListeners.set(type, fn),
  };
  const sandbox = {
    document, window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    performance: { now: () => clock }, requestAnimationFrame: fn => { raf = fn; },
    setTimeout() {}, console,
    Image: class { addEventListener() {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace('  loadLevel(0);', `
    globalThis.testGame = {
      loadLevel, placePart, startTest, updatePhysics, stopTest,
      configure(index, pieces) {
        loadLevel(index);
        pieces.forEach(p => { placePart(p.type, p.x, p.y); placed.at(-1).angle = p.angle; });
      },
      state: () => ({mode, runTime, ball: {...ball}, placed: placed.map(p => ({...p})),
        budget, inventory: {...inventory}, stars: [...progress.stars]}),
      select: id => { selectedId = id; selectedTool = null; updateUI(); },
    };
    loadLevel(0);`), sandbox);
  return { ...sandbox.testGame, get, document, focusedId: () => focusedId,
    event: (type, fields = {}) => documentListeners.get(type)?.(fields),
    frame(dt) { clock += dt * 1000; raf(clock); },
  };
}

const deg = n => n * Math.PI / 180;
const solutions = [
  [{ type: 'plank', x: 413, y: 405, angle: deg(15) },
   { type: 'plank', x: 580, y: 430, angle: 0 }],
  [{ type: 'fan', x: 253.54, y: 357.15, angle: deg(-45) },
   { type: 'fan', x: 458.71, y: 447.77, angle: deg(-90) },
   { type: 'spring', x: 574.9, y: 415.17, angle: deg(15) }],
  [{ type: 'fan', x: 246.86, y: 326.71, angle: deg(45) },
   { type: 'fan', x: 289.88, y: 318.52, angle: deg(-15) },
   { type: 'magnet', x: 768.38, y: 118.27, angle: 0 },
   { type: 'magnet', x: 350.46, y: 170.88, angle: 0 }],
  [{ type: 'fan', x: 326.19617609230505, y: 373.96472824949325, angle: 0 },
   { type: 'fan', x: 123.49119551318145, y: 413.13890788925426, angle: deg(30) },
   { type: 'spring', x: 164.12015424516596, y: 416.1893292402312, angle: deg(135) },
   { type: 'plank', x: 530.9313396792037, y: 276.737220414184, angle: deg(165) }],
  [{ type: 'fan', x: 715.5, y: 363.8, angle: deg(-15) },
   { type: 'fan', x: 179.9, y: 382.6, angle: deg(-30) },
   { type: 'spring', x: 187.7, y: 448.1, angle: 0 }],
];

for (const [index, pieces] of solutions.entries()) {
  const result = [];
  for (const fps of [30, 60, 120]) {
    const g = game(); g.configure(index, pieces);
    assert.ok(g.state().budget >= 0);
    assert.ok(Object.values(g.state().inventory).every(n => n >= 0));
    g.startTest();
    for (let i = 0; i < 31 * fps && g.state().mode === 'running'; i++) g.frame(1 / fps);
    const state = g.state();
    assert.equal(state.mode, 'won', `Level ${index + 1} must be solvable at ${fps} fps`);
    assert.equal(state.stars[index], 3);
    result.push(state.runTime);
  }
  assert.ok(Math.max(...result) - Math.min(...result) < .02, 'Frame rate must not change the solution');
  console.log(`Level ${index + 1}: 3 stars at 30/60/120 fps (${result[0].toFixed(2)} s)`);
}

const g = game();
g.configure(0, solutions[0]);
g.select(g.state().placed[0].id);
g.get('deleteButton').click();
assert.equal(g.state().budget, 75);
assert.equal(g.state().inventory.plank, 2);
g.startTest(); g.frame(.2);
const before = g.state();
g.document.hidden = true; g.event('visibilitychange');
g.frame(1);
assert.equal(g.state().mode, 'paused');
assert.equal(g.state().runTime, before.runTime);
g.document.hidden = false; g.get('playButton').click();
assert.equal(g.state().mode, 'running');
assert.equal(g.state().runTime, before.runTime);
g.stopTest();
assert.equal(g.state().placed.length, 1, 'Stopping must preserve construction');
console.log('Budget refunds, pause/resume, and preservation of construction: OK');

// Touch coordinates must follow the CSS display size, not the canvas resolution.
const mobile = game();
mobile.get('gameCanvas').getBoundingClientRect = () => ({ left: 10, top: 20, width: 360, height: 202.5 });
const pointer = (id, x, y) => ({ pointerId: id, pointerType: 'touch', button: 0,
  clientX: 10 + x * 360 / 960, clientY: 20 + y * 202.5 / 540 });
mobile.get('card-plank').click();
mobile.get('gameCanvas').dispatch('pointerdown', pointer(1, 400, 400));
mobile.get('gameCanvas').dispatch('pointermove', pointer(2, 200, 200));
assert.equal(mobile.state().placed[0].x, 400, 'A second finger must not move the captured piece');
mobile.get('gameCanvas').dispatch('pointermove', pointer(1, 440, 420));
assert.equal(mobile.state().placed[0].x, 440, 'A new piece must be draggable immediately');
mobile.get('gameCanvas').dispatch('pointerup', pointer(1, 440, 420));
mobile.get('gameCanvas').dispatch('pointerdown', pointer(3, 455, 420));
assert.equal(mobile.state().placed.length, 2, 'Choosing a tool must allow placement beside another piece');
mobile.get('gameCanvas').dispatch('pointerup', pointer(3, 455, 420));
mobile.get('rotateBackButton').click();
assert.ok(Math.abs(mobile.state().placed[1].angle + deg(15)) < 1e-9);
mobile.get('rotateButton').click();
assert.ok(Math.abs(mobile.state().placed[1].angle) < 1e-9);
mobile.get('move-right').click();
assert.equal(mobile.state().placed[1].x, 459);
mobile.get('undoButton').click();
assert.equal(mobile.state().placed[1].x, 455, 'Undo must restore a fine movement');
mobile.get('deleteButton').click();
assert.equal(mobile.state().placed.length, 1);
mobile.get('undoButton').click();
assert.equal(mobile.state().placed.length, 2, 'Undo must restore a removed piece');
mobile.get('resetButton').click();
assert.equal(mobile.state().placed.length, 0);
mobile.get('undoButton').click();
assert.equal(mobile.state().placed.length, 2, 'Undo must restore a cleared workbench');
mobile.get('fullscreenButton').click();
assert.ok(mobile.get('game-shell').classList.contains('expanded'), 'Enlargement must work without native fullscreen');
assert.ok(mobile.get('fullscreenButton').classList.contains('active'));
assert.equal(mobile.get('fullscreenButton').getAttribute('aria-pressed'), 'true');
mobile.get('fullscreenButton').click();
assert.ok(!mobile.get('game-shell').classList.contains('expanded'));
assert.ok(!mobile.get('fullscreenButton').classList.contains('active'));
mobile.startTest(); mobile.frame(.1);
mobile.get('helpButton').click();
assert.equal(mobile.state().mode, 'paused', 'Help must pause the active attempt');
mobile.get('card-plank').click();
assert.equal(mobile.state().placed.length, 2, 'The paused attempt must not be editable');
console.log('Mobile touch scaling, multitouch, placement, undo history, and fullscreen fallback: OK');

const failure = game(); failure.startTest();
for (let frame = 0; frame < 1800 && failure.state().mode === 'running'; frame++) failure.frame(1 / 60);
assert.equal(failure.state().mode, 'failed');
assert.equal(failure.get('hint').textContent, 'A carga caiu. Ajuste as peças e tente de novo.');
console.log('Falling load reports the correct reason: OK');

const flow = game(); flow.configure(0, solutions[0]); flow.startTest();
for (let frame = 0; frame < 1800 && flow.state().mode === 'running'; frame++) flow.frame(1 / 60);
assert.equal(flow.state().mode, 'won');
assert.equal(flow.get('resultCard').hidden, false);
assert.equal(flow.focusedId(), 'nextLevelButton', 'Victory must focus the next action');
flow.get('nextLevelButton').click();
assert.equal(flow.state().mode, 'build');
assert.equal(flow.get('resultCard').hidden, true);
assert.equal(flow.focusedId(), 'gameCanvas', 'The next level must return keyboard focus to the board');
console.log('Victory, next level, and keyboard focus: OK');
