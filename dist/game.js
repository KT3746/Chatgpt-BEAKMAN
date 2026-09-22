(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const physicsStep = 1 / 180;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const costs = { plank: 25, spring: 30, fan: 35, magnet: 40 };
  const labels = { plank: "Tábua", spring: "Mola", fan: "Ventilador", magnet: "Ímã" };
  const progressKey = "beakman-progress";
  const legacyProgressKey = "oficina-maluca-progress";
  const workshopBackground = new Image();
  let backgroundReady = false;
  workshopBackground.addEventListener("load", () => { backgroundReady = true; });
  workshopBackground.src = "workshop-bg.webp";

  const levels = [
    {
      title: "A ponte improvisada",
      text: "Leve a bolinha até a caixa de entrega sem deixá-la cair no vão.",
      hint: "Duas tábuas bem posicionadas formam uma ponte.",
      budget: 100,
      inventory: { plank: 3, spring: 1, fan: 0, magnet: 0 },
      spawn: { x: 105, y: 338, vx: 72, vy: 0 },
      goal: { x: 848, y: 398 },
      platforms: [
        [20, 382, 330, 382], [650, 440, 940, 440]
      ],
      marks: [{ x: 175, y: 310, text: "SAÍDA" }, { x: 490, y: 485, text: "CUIDADO: VÃO" }],
      par: 2
    },
    {
      title: "Entrega no mezanino",
      text: "Lance a carga até a plataforma alta usando impulso e vento.",
      hint: "Gire o ventilador para empurrar a bolinha para cima.",
      budget: 140,
      inventory: { plank: 2, spring: 2, fan: 2, magnet: 0 },
      spawn: { x: 90, y: 428, vx: 64, vy: 0 },
      goal: { x: 826, y: 177 },
      platforms: [
        [20, 470, 940, 470], [675, 220, 940, 220], [675, 220, 675, 330]
      ],
      marks: [{ x: 165, y: 402, text: "PISTA" }, { x: 805, y: 135, text: "MEZANINO" }],
      par: 3
    },
    {
      title: "O labirinto magnético",
      text: "Guie a esfera metálica por baixo e por cima das barreiras até o coletor.",
      hint: "Puxe a esfera com ímãs e use o vento para vencer os dois desvios.",
      budget: 180,
      inventory: { plank: 2, spring: 1, fan: 2, magnet: 3 },
      spawn: { x: 82, y: 152, vx: 58, vy: 0 },
      goal: { x: 855, y: 420 },
      platforms: [
        [20, 205, 260, 205], [360, 420, 600, 420], [700, 465, 940, 465],
        [330, 20, 330, 300], [650, 450, 650, 525]
      ],
      marks: [
        { x: 130, y: 118, text: "METAL" },
        { x: 455, y: 382, text: "PASSAGEM BAIXA" },
        { x: 820, y: 385, text: "COLETOR" }
      ],
      par: 4
    },
    {
      title: "O salto da torre",
      text: "Cruze as duas alturas e entregue a carga no alto da torre.",
      hint: "Combine impulso, vento e uma rampa para alcançar a plataforma final.",
      budget: 170,
      inventory: { plank: 2, spring: 2, fan: 2, magnet: 1 },
      spawn: { x: 90, y: 428, vx: 64, vy: 0 },
      goal: { x: 850, y: 217 },
      platforms: [
        [20, 470, 300, 470], [430, 400, 560, 400],
        [700, 260, 940, 260], [700, 260, 700, 385]
      ],
      marks: [
        { x: 145, y: 400, text: "LANÇAMENTO" },
        { x: 492, y: 365, text: "APOIO" },
        { x: 820, y: 180, text: "TORRE" }
      ],
      par: 4
    },
    {
      title: "O reator de vento",
      text: "Suba três níveis usando uma mola e correntes de ar bem direcionadas.",
      hint: "Lance primeiro; depois use dois ventiladores inclinados para sustentar a subida.",
      budget: 160,
      inventory: { plank: 1, spring: 1, fan: 3, magnet: 1 },
      spawn: { x: 90, y: 428, vx: 80, vy: 0 },
      goal: { x: 850, y: 137 },
      platforms: [
        [20, 470, 270, 470], [390, 360, 550, 360],
        [700, 180, 940, 180], [640, 180, 640, 330]
      ],
      marks: [
        { x: 145, y: 400, text: "CÂMARA 1" },
        { x: 470, y: 325, text: "CÂMARA 2" },
        { x: 810, y: 100, text: "REATOR" }
      ],
      par: 3
    }
  ];

  const els = {
    levelNumber: document.getElementById("levelNumber"),
    totalStars: document.getElementById("totalStars"),
    missionTitle: document.getElementById("missionTitle"),
    missionText: document.getElementById("missionText"),
    budgetValue: document.getElementById("budgetValue"),
    hint: document.getElementById("hint"),
    statusText: document.getElementById("statusText"),
    statusLight: document.getElementById("statusLight"),
    playButton: document.getElementById("playButton"),
    playIcon: document.getElementById("playIcon"),
    playLabel: document.getElementById("playLabel"),
    undoButton: document.getElementById("undoButton"),
    resetButton: document.getElementById("resetButton"),
    rotateButton: document.getElementById("rotateButton"),
    rotateBackButton: document.getElementById("rotateBackButton"),
    selectionInfo: document.getElementById("selectionInfo"),
    gameShell: document.querySelector(".game-shell"),
    deleteButton: document.getElementById("deleteButton"),
    canvasWrap: document.getElementById("canvasWrap"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    benchLabel: document.getElementById("benchLabel"),
    runChip: document.getElementById("runChip"),
    runTimeValue: document.getElementById("runTimeValue"),
    resultCard: document.getElementById("resultCard"),
    resultStars: document.getElementById("resultStars"),
    resultTitle: document.getElementById("resultTitle"),
    resultText: document.getElementById("resultText"),
    nextLevelButton: document.getElementById("nextLevelButton"),
    levelButton: document.getElementById("levelButton"),
    levelDialog: document.getElementById("levelDialog"),
    closeDialog: document.getElementById("closeDialog"),
    levelList: document.getElementById("levelList"),
    helpButton: document.getElementById("helpButton"),
    helpDialog: document.getElementById("helpDialog"),
    helpTitle: document.getElementById("helpTitle"),
    helpText: document.getElementById("helpText"),
    helpHint: document.getElementById("helpHint"),
    helpPar: document.getElementById("helpPar"),
    closeHelp: document.getElementById("closeHelp")
  };

  let currentLevel = 0;
  let inventory = {};
  let budget = 0;
  let placed = [];
  let selectedTool = null;
  let selectedId = null;
  let draggingId = null;
  let activePointerId = null;
  let accumulator = 0;
  let expanded = false;
  let dragOffset = { x: 0, y: 0 };
  let mode = "build";
  let ball = null;
  let runTime = 0;
  let lastFrame = performance.now();
  let nextId = 1;
  let history = [];
  let dragSnapshot = null;
  let progress = loadProgress();
  let particles = [];
  let audioCtx = null;
  let keyboardCursor = { x: W / 2, y: H / 2 };
  let ballTrail = [];
  let trailClock = 0;
  let impactCooldown = 0;
  let screenShake = 0;
  let pointerInside = false;
  let pointerCursor = { x: W / 2, y: H / 2 };
  const ambientMotes = Array.from({ length: 28 }, (_, index) => ({
    x: (index * 137.3) % W,
    y: (index * 71.7) % H,
    size: 1 + (index % 3) * .55,
    speed: 7 + (index % 5) * 2,
    phase: index * .83
  }));

  function loadProgress() {
    try {
      const stored = localStorage.getItem(progressKey) ?? localStorage.getItem(legacyProgressKey);
      const saved = JSON.parse(stored);
      if (saved && Array.isArray(saved.stars)) {
        const normalized = {
          stars: Array.from({ length: levels.length }, (_, index) => {
            const value = Number(saved.stars[index]);
            return Number.isFinite(value) ? clamp(Math.round(value), 0, 3) : 0;
          })
        };
        if (!localStorage.getItem(progressKey)) localStorage.setItem(progressKey, JSON.stringify(normalized));
        return normalized;
      }
    } catch (_) { /* local progress is optional */ }
    return { stars: Array(levels.length).fill(0) };
  }

  function saveProgress() {
    try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch (_) { /* optional */ }
  }

  function tone(freq, duration = 0.08, type = "square", gain = 0.035) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      const osc = audioCtx.createOscillator();
      const volume = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      volume.gain.setValueAtTime(gain, audioCtx.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(volume).connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (_) { /* sound is a bonus */ }
  }

  function loadLevel(index) {
    releaseDrag();
    currentLevel = Math.max(0, Math.min(levels.length - 1, index));
    const level = levels[currentLevel];
    inventory = { ...level.inventory };
    budget = level.budget;
    placed = [];
    particles = [];
    ballTrail = [];
    selectedTool = null;
    selectedId = null;
    mode = "build";
    ball = makeBall();
    runTime = 0;
    accumulator = 0;
    history = [];
    dragSnapshot = null;
    els.resultCard.hidden = true;
    els.levelNumber.textContent = `${String(currentLevel + 1).padStart(2, "0")}/${String(levels.length).padStart(2, "0")}`;
    els.benchLabel.textContent = `BANCADA ${String(currentLevel + 1).padStart(2, "0")}`;
    els.missionTitle.textContent = level.title;
    els.missionText.textContent = level.text;
    els.helpTitle.textContent = level.title;
    els.helpText.textContent = level.text;
    els.helpHint.textContent = `Dica: ${level.hint}`;
    els.helpPar.textContent = `Ganhe 3 estrelas usando ${level.par} peças ou menos. Remover uma peça devolve seu custo.`;
    els.hint.textContent = level.hint;
    updateUI();
    renderLevelList();
  }

  function makeBall() {
    const s = levels[currentLevel].spawn;
    return { x: s.x, y: s.y, vx: s.vx, vy: s.vy, r: 16, springLock: 0, rotation: 0 };
  }

  function usedCount() { return placed.length; }

  function canEdit() { return mode === "build" || mode === "failed"; }

  function isUnlocked(index) {
    return index === 0 || progress.stars.slice(0, index).every(value => value > 0);
  }

  function updateUI() {
    Object.keys(costs).forEach(type => {
      const count = document.getElementById(`count-${type}`);
      const button = document.querySelector(`[data-tool="${type}"]`);
      count.textContent = inventory[type] ?? 0;
      button.classList.toggle("selected", selectedTool === type);
      button.disabled = !canEdit() || (inventory[type] ?? 0) <= 0 || budget < costs[type];
    });
    const selected = placed.find(item => item.id === selectedId);
    els.rotateButton.disabled = !canEdit() || !selected || selected.type === "magnet";
    els.rotateBackButton.disabled = els.rotateButton.disabled;
    els.deleteButton.disabled = !canEdit() || !selected;
    els.undoButton.disabled = !canEdit() || history.length === 0;
    els.resetButton.disabled = !canEdit() || placed.length === 0;
    document.querySelectorAll("[data-move]").forEach(button => { button.disabled = !canEdit() || !selected; });
    updateSelectionInfo();
    els.budgetValue.textContent = `$ ${budget}`;
    const total = progress.stars.reduce((a, b) => a + b, 0);
    els.totalStars.textContent = `★ ${total}/${levels.length * 3}`;

    const states = {
      build: ["MODO CONSTRUÇÃO", "▶", "Testar invenção"],
      running: ["TESTE EM ANDAMENTO", "■", "Parar teste"],
      paused: ["TESTE PAUSADO", "▶", "Retomar teste"],
      failed: ["PROJETO FALHOU", "↻", "Tentar de novo"],
      won: ["PROJETO APROVADO", "✓", "Concluído"]
    };
    const state = states[mode];
    els.statusText.textContent = state[0];
    els.playIcon.textContent = state[1];
    els.playLabel.textContent = state[2];
    els.statusLight.classList.toggle("running", mode === "running" || mode === "won");
    els.statusLight.classList.toggle("failed", mode === "failed");
    els.statusLight.classList.toggle("won", mode === "won");
    els.playButton.disabled = mode === "won";
    els.playButton.classList.toggle("running", mode === "running");
    els.canvasWrap.classList.toggle("running", mode === "running");
    canvas.classList.toggle("placing", Boolean(selectedTool) && canEdit());
    els.runChip.hidden = mode !== "running" && mode !== "paused";
    els.runTimeValue.textContent = `${runTime.toFixed(1)} s`;
    els.hint.style.opacity = mode === "running" ? "0" : "1";
    document.querySelectorAll(".part-card").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.tool === selectedTool));
    });
  }

  function renderLevelList() {
    els.levelList.innerHTML = "";
    levels.forEach((level, index) => {
      const unlocked = isUnlocked(index);
      const button = document.createElement("button");
      button.className = `level-option${!unlocked ? " locked" : ""}${index === currentLevel ? " current" : ""}`;
      button.disabled = !unlocked;
      button.innerHTML = `<span class="level-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${level.title}</strong><small>${unlocked ? level.text : "Conclua a fase anterior"}</small></span><span class="level-score">${unlocked ? "★".repeat(progress.stars[index]) + "☆".repeat(3 - progress.stars[index]) : "🔒"}</span>`;
      button.addEventListener("click", () => { els.levelDialog.close(); loadLevel(index); canvas.focus(); });
      els.levelList.appendChild(button);
    });
  }

  function startTest() {
    releaseDrag();
    ball = makeBall();
    runTime = 0;
    particles = [];
    ballTrail = [];
    trailClock = 0;
    accumulator = 0;
    lastFrame = performance.now();
    selectedId = null;
    selectedTool = null;
    mode = "running";
    tone(330, 0.07, "square");
    setTimeout(() => tone(440, 0.08, "square"), 70);
    updateUI();
  }

  function stopTest(failed = false) {
    releaseDrag();
    mode = failed ? "failed" : "build";
    ball = makeBall();
    ballTrail = [];
    runTime = 0;
    accumulator = 0;
    updateUI();
  }

  function winLevel() {
    if (mode !== "running") return;
    mode = "won";
    const par = levels[currentLevel].par;
    const score = usedCount() <= par ? 3 : usedCount() === par + 1 ? 2 : 1;
    progress.stars[currentLevel] = Math.max(progress.stars[currentLevel] || 0, score);
    saveProgress();
    els.resultStars.textContent = "★".repeat(score) + "☆".repeat(3 - score);
    els.resultTitle.textContent = score === 3 ? "Engenharia de primeira!" : "Entrega concluída!";
    els.resultText.textContent = score === 3
      ? `Você resolveu em ${runTime.toFixed(1)} s usando ${usedCount()} peça${usedCount() === 1 ? "" : "s"}. Projeto econômico e eficiente.`
      : `Funcionou em ${runTime.toFixed(1)} s com ${usedCount()} peças. Tente usar ${par} ou menos para ganhar 3 estrelas.`;
    els.nextLevelButton.textContent = currentLevel < levels.length - 1 ? "Próxima fase" : "Jogar novamente";
    els.resultCard.hidden = false;
    els.nextLevelButton.focus();
    screenShake = 10;
    for (let i = 0; i < 44; i++) particles.push({
      x: levels[currentLevel].goal.x, y: levels[currentLevel].goal.y,
      vx: (Math.random() - .5) * 330, vy: -80 - Math.random() * 260,
      life: .8 + Math.random() * .8, color: ["#ffd235", "#ff7043", "#58e0b2", "#8ae0ff"][i % 4]
    });
    tone(523, .12, "triangle", .05);
    setTimeout(() => tone(659, .12, "triangle", .05), 100);
    setTimeout(() => tone(784, .25, "triangle", .05), 200);
    updateUI();
    renderLevelList();
  }

  function placePart(type, x, y) {
    if (!canEdit() || (inventory[type] ?? 0) <= 0 || budget < costs[type]) return;
    pushHistory();
    const defaults = { plank: 0, spring: 0, fan: -Math.PI / 2, magnet: 0 };
    const item = { id: nextId++, type, x: clamp(x, 45, W - 45), y: clamp(y, 45, H - 45), angle: defaults[type], born: performance.now() };
    placed.push(item);
    inventory[type]--;
    budget -= costs[type];
    selectedId = item.id;
    for (let i = 0; i < 7; i++) particles.push({
      x: item.x + (Math.random() - .5) * 30, y: item.y + (Math.random() - .5) * 14,
      vx: (Math.random() - .5) * 70, vy: -20 - Math.random() * 45,
      life: .25 + Math.random() * .24, color: "#d7b477", size: 3, gravity: 120
    });
    if (inventory[type] <= 0 || budget < costs[type]) selectedTool = null;
    tone(type === "spring" ? 520 : 220, .06, "square", .025);
    updateUI();
    return item;
  }

  function deleteSelected() {
    if (!canEdit()) return;
    const index = placed.findIndex(item => item.id === selectedId);
    if (index < 0) return;
    pushHistory();
    const [item] = placed.splice(index, 1);
    inventory[item.type]++;
    budget += costs[item.type];
    selectedId = null;
    tone(150, .06, "sawtooth", .025);
    updateUI();
    els.hint.textContent = `${labels[item.type]} devolvida. O valor voltou ao orçamento.`;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  function updateSelectionInfo() {
    const item = placed.find(part => part.id === selectedId);
    const angle = item ? Math.round(item.angle * 180 / Math.PI) : 0;
    els.selectionInfo.textContent = item
      ? `${labels[item.type]}${item.type === "magnet" ? "" : ` · ${angle}°`}`
      : selectedTool ? `${labels[selectedTool]}: toque e arraste` : "Toque numa peça para ajustar";
  }

  function moveSelected(dx, dy, remember = true) {
    if (!canEdit()) return;
    const item = placed.find(part => part.id === selectedId);
    if (!item) return;
    if (remember) pushHistory();
    item.x = clamp(item.x + dx, 35, W - 35);
    item.y = clamp(item.y + dy, 35, H - 35);
    updateUI();
  }

  function buildSnapshot() {
    return {
      placed: placed.map(item => ({ ...item })),
      inventory: { ...inventory }, budget, selectedId
    };
  }

  function pushHistory(snapshot = buildSnapshot()) {
    history.push(snapshot);
    if (history.length > 25) history.shift();
  }

  function undoBuild() {
    if (!canEdit() || history.length === 0) return;
    const snapshot = history.pop();
    placed = snapshot.placed.map(item => ({ ...item }));
    inventory = { ...snapshot.inventory };
    budget = snapshot.budget;
    selectedId = placed.some(item => item.id === snapshot.selectedId) ? snapshot.selectedId : null;
    selectedTool = null;
    particles = [];
    ball = makeBall();
    mode = "build";
    tone(300, .06, "triangle", .02);
    els.hint.textContent = "Última alteração desfeita.";
    updateUI();
  }

  function resetBuild() {
    if (!canEdit() || placed.length === 0) return;
    pushHistory();
    const level = levels[currentLevel];
    inventory = { ...level.inventory };
    budget = level.budget;
    placed = [];
    selectedId = null;
    selectedTool = null;
    particles = [];
    ball = makeBall();
    mode = "build";
    els.hint.textContent = "Bancada limpa. Desfazer recupera a montagem.";
    updateUI();
  }

  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1) : 0;
    const x = x1 + t * dx, y = y1 + t * dy;
    return { distance: Math.hypot(px - x, py - y), x, y };
  }

  function partLength(type) { return type === "plank" ? 180 : type === "spring" ? 100 : 70; }

  function segmentFor(item) {
    const half = partLength(item.type) / 2;
    const dx = Math.cos(item.angle) * half, dy = Math.sin(item.angle) * half;
    return [item.x - dx, item.y - dy, item.x + dx, item.y + dy];
  }

  function hitPart(item, point, touch = false) {
    const rect = canvas.getBoundingClientRect();
    const radius = touch ? 22 * W / rect.width : 28;
    if (item.type === "plank" || item.type === "spring") {
      const s = segmentFor(item);
      return distanceToSegment(point.x, point.y, ...s).distance < Math.max(28, radius);
    }
    return Math.hypot(point.x - item.x, point.y - item.y) < Math.max(42, radius);
  }

  canvas.addEventListener("pointerdown", event => {
    if (!canEdit() || activePointerId !== null || event.button > 0 || event.isPrimary === false) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    activePointerId = event.pointerId;
    const point = canvasPoint(event);
    pointerCursor = point;
    pointerInside = true;
    const hit = [...placed].reverse().find(item => hitPart(item, point, event.pointerType === "touch"));
    if (selectedTool) {
      const item = placePart(selectedTool, point.x, point.y);
      if (item) {
        draggingId = item.id;
        dragOffset = { x: item.x - point.x, y: item.y - point.y };
      }
    } else if (hit) {
      selectedId = hit.id;
      selectedTool = null;
      draggingId = hit.id;
      dragSnapshot = { snapshot: buildSnapshot(), x: hit.x, y: hit.y };
      dragOffset = { x: hit.x - point.x, y: hit.y - point.y };
      updateUI();
      els.hint.textContent = "Peça selecionada — arraste, gire ou remova.";
    } else {
      selectedId = null;
      updateUI();
    }
  });

  canvas.addEventListener("pointermove", event => {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    const point = canvasPoint(event);
    pointerCursor = point;
    pointerInside = true;
    if (!draggingId || !canEdit()) return;
    event.preventDefault();
    const item = placed.find(part => part.id === draggingId);
    if (item) {
      if (dragSnapshot && (Math.abs(point.x + dragOffset.x - dragSnapshot.x) > 1 || Math.abs(point.y + dragOffset.y - dragSnapshot.y) > 1)) {
        pushHistory(dragSnapshot.snapshot);
        dragSnapshot = null;
      }
      item.x = clamp(point.x + dragOffset.x, 35, W - 35);
      item.y = clamp(point.y + dragOffset.y, 35, H - 35);
      updateUI();
    }
  });
  function releaseDrag(event) {
    if (event && event.pointerId !== activePointerId) return;
    const pointerId = activePointerId;
    draggingId = null;
    dragSnapshot = null;
    activePointerId = null;
    if (pointerId !== null && canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture(pointerId);
    if (event?.pointerType === "touch") pointerInside = false;
  }
  canvas.addEventListener("pointerup", releaseDrag);
  canvas.addEventListener("pointercancel", releaseDrag);
  canvas.addEventListener("lostpointercapture", releaseDrag);
  canvas.addEventListener("pointerenter", () => { pointerInside = true; });
  canvas.addEventListener("pointerleave", () => { if (!draggingId) pointerInside = false; });

  canvas.addEventListener("keydown", event => {
    if (!canEdit()) return;
    const directions = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault(); undoBuild();
    } else if (directions[event.key]) {
      event.preventDefault();
      const [dx, dy] = directions[event.key];
      const selected = placed.find(part => part.id === selectedId);
      if (selected) moveSelected(dx, dy);
      else {
        keyboardCursor.x = clamp(keyboardCursor.x + dx, 35, W - 35);
        keyboardCursor.y = clamp(keyboardCursor.y + dy, 35, H - 35);
      }
    } else if (event.key === "Enter" && selectedTool) {
      event.preventDefault(); placePart(selectedTool, keyboardCursor.x, keyboardCursor.y);
    } else if ((event.key === "r" || event.key === "R") && selectedId) {
      event.preventDefault(); (event.shiftKey ? els.rotateBackButton : els.rotateButton).click();
    } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
      event.preventDefault(); deleteSelected();
    } else if (/^[1-4]$/.test(event.key)) {
      const type = ["plank", "spring", "fan", "magnet"][Number(event.key) - 1];
      const button = document.querySelector(`[data-tool="${type}"]`);
      if (button && !button.disabled) { event.preventDefault(); button.click(); }
    } else if (event.key === "Escape") {
      event.preventDefault(); selectedTool = null; selectedId = null; updateUI();
    }
  });

  document.querySelectorAll(".part-card").forEach(button => {
    button.addEventListener("click", () => {
      if (!canEdit()) return;
      const type = button.dataset.tool;
      selectedTool = selectedTool === type ? null : type;
      selectedId = null;
      tone(260, .045, "square", .02);
      updateUI();
      els.hint.textContent = selectedTool
        ? `${labels[selectedTool]} selecionada — toque na bancada para instalar.`
        : levels[currentLevel].hint;
    });
  });

  function rotateSelected(direction) {
    if (!canEdit()) return;
    const item = placed.find(part => part.id === selectedId);
    if (!item || item.type === "magnet") return;
    pushHistory();
    item.angle = Math.atan2(Math.sin(item.angle + direction * Math.PI / 12), Math.cos(item.angle + direction * Math.PI / 12));
    updateSelectionInfo();
    tone(360, .04, "square", .018);
  }
  els.rotateButton.addEventListener("click", () => rotateSelected(1));
  els.rotateBackButton.addEventListener("click", () => rotateSelected(-1));
  document.querySelectorAll("[data-move]").forEach(button => {
    const directions = { left: [-4, 0], up: [0, -4], down: [0, 4], right: [4, 0] };
    button.addEventListener("click", () => moveSelected(...directions[button.dataset.move]));
  });
  els.deleteButton.addEventListener("click", deleteSelected);
  els.undoButton.addEventListener("click", undoBuild);
  els.playButton.addEventListener("click", () => {
    if (mode === "running") stopTest(false);
    else if (mode === "paused") {
      mode = "running";
      lastFrame = performance.now();
      accumulator = 0;
      tone(440, .06, "triangle", .02);
      updateUI();
    }
    else if (mode === "build" || mode === "failed") startTest();
  });
  els.resetButton.addEventListener("click", resetBuild);
  function pauseTest() {
    releaseDrag();
    if (mode !== "running") return;
    mode = "paused";
    accumulator = 0;
    updateUI();
    els.hint.textContent = "Teste pausado. Toque em Retomar teste para continuar.";
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseTest(); });
  window.addEventListener("blur", pauseTest);
  els.levelButton.addEventListener("click", () => { pauseTest(); renderLevelList(); els.levelDialog.showModal(); });
  els.closeDialog.addEventListener("click", () => els.levelDialog.close());
  els.levelDialog.addEventListener("click", event => { if (event.target === els.levelDialog) els.levelDialog.close(); });
  els.helpButton.addEventListener("click", () => { pauseTest(); els.helpDialog.showModal(); });
  els.closeHelp.addEventListener("click", () => els.helpDialog.close());
  function setExpanded(active) {
    expanded = active;
    els.gameShell.classList.toggle("expanded", active);
    document.body.classList.toggle("game-expanded", active);
    els.fullscreenButton.classList.toggle("active", active);
    els.fullscreenButton.setAttribute("aria-label", active ? "Sair do jogo ampliado" : "Ampliar jogo com controles");
    els.fullscreenButton.setAttribute("aria-pressed", String(active));
    releaseDrag();
  }
  els.fullscreenButton.addEventListener("click", async () => {
    const active = !expanded;
    setExpanded(active);
    try {
      if (!active && document.fullscreenElement) await document.exitFullscreen();
      else if (active && els.gameShell.requestFullscreen) await els.gameShell.requestFullscreen();
    } catch (_) { /* CSS enlargement also works without the fullscreen API, including iOS. */ }
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) setExpanded(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && expanded && !els.levelDialog.open && !els.helpDialog.open) setExpanded(false);
  });
  els.nextLevelButton.addEventListener("click", () => {
    const next = currentLevel < levels.length - 1 ? currentLevel + 1 : 0;
    loadLevel(next);
    canvas.focus();
  });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function updatePhysics(dt) {
    if (mode !== "running") return;
    runTime += dt;
    ball.springLock = Math.max(0, ball.springLock - dt);
    impactCooldown = Math.max(0, impactCooldown - dt);

    placed.forEach(item => {
      const dx = ball.x - item.x, dy = ball.y - item.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (item.type === "magnet" && distance < 205 && distance > 22) {
        const force = 1050 * (1 - distance / 205);
        ball.vx += dx / distance * -force * dt;
        ball.vy += dy / distance * -force * dt;
      }
      if (item.type === "fan") {
        const dirX = Math.cos(item.angle), dirY = Math.sin(item.angle);
        const forward = dx * dirX + dy * dirY;
        const side = Math.abs(-dx * dirY + dy * dirX);
        if (forward > 0 && forward < 205 && side < 42 + forward * .26) {
          const force = 700 * (1 - forward / 260);
          ball.vx += dirX * force * dt;
          ball.vy += dirY * force * dt;
          if (Math.random() < .3) particles.push({
            x: item.x + dirX * 28 + (Math.random() - .5) * side,
            y: item.y + dirY * 28 + (Math.random() - .5) * side,
            vx: dirX * 130, vy: dirY * 130, life: .35, color: "#8ae0ff"
          });
        }
      }
    });

    ball.vy += 570 * dt;
    ball.vx *= Math.pow(.99985, dt * 60);
    ball.vy *= Math.pow(.999, dt * 60);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.rotation += ball.vx * dt / ball.r;
    trailClock += dt;
    if (trailClock > .035 && Math.hypot(ball.vx, ball.vy) > 85) {
      trailClock = 0;
      ballTrail.push({ x: ball.x, y: ball.y, r: ball.r, life: .34 });
      if (ballTrail.length > 12) ballTrail.shift();
    }

    const level = levels[currentLevel];
    level.platforms.forEach(segment => collideSegment(segment, false));
    placed.forEach(item => {
      if (item.type === "plank" || item.type === "spring") collideSegment(segmentFor(item), item.type === "spring");
    });

    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * .5; }
    if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * .5; }

    const goal = level.goal;
    if (Math.hypot(ball.x - goal.x, ball.y - goal.y) < 31) { winLevel(); return; }
    if (ball.y > H + 70 || runTime > 30) {
      const fell = ball.y > H + 70;
      tone(110, .2, "sawtooth", .025);
      stopTest(true);
      els.hint.textContent = fell ? "A carga caiu. Ajuste as peças e tente de novo." : "O tempo acabou. Reposicione a invenção.";
      els.statusText.textContent = fell ? "A CARGA CAIU" : "TEMPO ESGOTADO";
    }
  }

  function collideSegment(segment, spring) {
    const [x1, y1, x2, y2] = segment;
    const nearest = distanceToSegment(ball.x, ball.y, x1, y1, x2, y2);
    const thickness = spring ? 8 : 11;
    const minDistance = ball.r + thickness;
    if (nearest.distance >= minDistance) return;
    let nx = (ball.x - nearest.x) / (nearest.distance || 1);
    let ny = (ball.y - nearest.y) / (nearest.distance || 1);
    if (nearest.distance < .001) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      nx = -dy / len; ny = dx / len;
      if (ny > 0) { nx *= -1; ny *= -1; }
    }
    ball.x += nx * (minDistance - nearest.distance);
    ball.y += ny * (minDistance - nearest.distance);
    const normalVelocity = ball.vx * nx + ball.vy * ny;
    if (normalVelocity < 0) {
      if (normalVelocity < -95 && impactCooldown <= 0) {
        impactCooldown = .09;
        screenShake = Math.min(8, 2.5 + Math.abs(normalVelocity) / 75);
        const tx = -ny, ty = nx;
        for (let i = 0; i < (spring ? 10 : 5); i++) {
          const scatter = (Math.random() - .5) * 130;
          particles.push({
            x: nearest.x + nx * 5, y: nearest.y + ny * 5,
            vx: nx * (40 + Math.random() * 100) + tx * scatter,
            vy: ny * (40 + Math.random() * 100) + ty * scatter,
            life: .18 + Math.random() * .34,
            color: spring ? "#ffd235" : "#b7c7cd",
            size: spring ? 4 : 2.5,
            gravity: 220
          });
        }
        if (!spring) tone(115 + Math.min(90, Math.abs(normalVelocity) * .25), .035, "triangle", .009);
      }
      const bounce = spring ? 1.08 : .28;
      ball.vx -= (1 + bounce) * normalVelocity * nx;
      ball.vy -= (1 + bounce) * normalVelocity * ny;
      const tx = -ny, ty = nx;
      const tangent = ball.vx * tx + ball.vy * ty;
      // Preserve rolling momentum; heavy per-contact friction stopped the ball on level 1.
      const friction = .0002;
      ball.vx -= tangent * tx * friction;
      ball.vy -= tangent * ty * friction;
      if (spring && ball.springLock <= 0) {
        ball.vx += nx * 240;
        ball.vy += ny * 240;
        ball.springLock = .22;
        screenShake = Math.max(screenShake, 7);
        tone(620, .08, "triangle", .025);
      }
    }
  }

  function updateParticles(dt) {
    ballTrail.forEach(p => { p.life -= dt; });
    ballTrail = ballTrail.filter(p => p.life > 0);
    particles.forEach(p => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.gravity ?? (p.color === "#8ae0ff" ? 0 : 330)) * dt;
      p.vx *= Math.pow(.985, dt * 60);
    });
    particles = particles.filter(p => p.life > 0);
    screenShake = Math.max(0, screenShake - dt * 30);
  }

  function draw() {
    ctx.save();
    if (!reducedMotion && screenShake > .05) ctx.translate((Math.random() - .5) * screenShake, (Math.random() - .5) * screenShake);
    drawBackground();
    drawLevel();
    drawBallTrail();
    placed.forEach(drawPart);
    if (selectedTool && canEdit() && pointerInside && !draggingId) drawPlacementPreview();
    drawGoal(levels[currentLevel].goal);
    drawBall();
    drawParticles();
    if (selectedTool && mode !== "running" && document.activeElement === canvas) drawKeyboardCursor();
    drawForeground();
    ctx.restore();
  }

  function drawPlacementPreview() {
    const x = clamp(pointerCursor.x, 45, W - 45);
    const y = clamp(pointerCursor.y, 45, H - 45);
    const defaults = { plank: 0, spring: 0, fan: -Math.PI / 2, magnet: 0 };
    ctx.save();
    ctx.globalAlpha = .58;
    drawPart({ id: -1, type: selectedTool, x, y, angle: defaults[selectedTool], born: 0 });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,241,114,.86)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    const caption = `${labels[selectedTool]}  •  $ ${costs[selectedTool]}`;
    ctx.font = "900 12px system-ui";
    const width = ctx.measureText(caption).width + 18;
    const labelY = clamp(y - 54, 30, H - 24);
    ctx.fillStyle = "rgba(3,11,19,.84)";
    roundRect(x - width / 2, labelY - 16, width, 24, 5); ctx.fill();
    ctx.strokeStyle = "rgba(255,210,53,.62)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#fff4bd"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(caption, x, labelY - 4);
    ctx.restore();
  }

  function drawKeyboardCursor() {
    ctx.save(); ctx.translate(keyboardCursor.x, keyboardCursor.y);
    ctx.strokeStyle = "#fff5a8"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke();
    ctx.restore();
  }

  function drawBackground() {
    if (backgroundReady) {
      ctx.drawImage(workshopBackground, 0, 0, W, H);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, "#12355b"); fallback.addColorStop(1, "#071522");
      ctx.fillStyle = fallback; ctx.fillRect(0, 0, W, H);
    }

    const tint = ctx.createLinearGradient(0, 0, 0, H);
    tint.addColorStop(0, "rgba(3,12,22,.22)");
    tint.addColorStop(.58, "rgba(4,20,31,.38)");
    tint.addColorStop(1, "rgba(2,9,15,.58)");
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);

    const accents = ["rgba(255,170,61,.045)", "rgba(73,180,231,.055)", "rgba(255,89,60,.045)"];
    ctx.fillStyle = accents[currentLevel]; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(139,204,227,.055)"; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const time = performance.now() / 1000;
    ctx.fillStyle = "rgba(255,225,167,.42)";
    ambientMotes.forEach(mote => {
      const x = (mote.x + Math.sin(time * .35 + mote.phase) * 18 + W) % W;
      const y = (mote.y - time * mote.speed + H * 3) % H;
      ctx.globalAlpha = .14 + (Math.sin(time + mote.phase) + 1) * .1;
      ctx.beginPath(); ctx.arc(x, y, mote.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawLevel() {
    const level = levels[currentLevel];
    ctx.save();
    level.platforms.forEach(segment => {
      const [x1, y1, x2, y2] = segment;
      const vertical = Math.abs(y2 - y1) > Math.abs(x2 - x1);
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
      ctx.lineWidth = 34; ctx.strokeStyle = "#07101a";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 26; ctx.strokeStyle = "#273846"; ctx.stroke();
      ctx.lineWidth = 18; ctx.strokeStyle = vertical ? "#526471" : "#617985"; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(205,232,238,.58)"; ctx.stroke();

      const length = Math.hypot(x2 - x1, y2 - y1);
      const bolts = Math.max(2, Math.floor(length / 70));
      for (let i = 0; i <= bolts; i++) {
        const t = bolts ? i / bolts : 0;
        const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        ctx.fillStyle = "#15222c"; ctx.strokeStyle = "#a8bcc4"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "rgba(215,230,234,.55)"; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.stroke();
      }
      if (vertical) {
        ctx.strokeStyle = "rgba(255,196,32,.85)"; ctx.lineWidth = 5;
        for (let d = 28; d < length - 18; d += 42) {
          const t = d / length, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
          ctx.beginPath(); ctx.moveTo(x - 9, y - 7); ctx.lineTo(x + 9, y + 7); ctx.stroke();
        }
      }
    });
    drawStartPad(level.spawn);
    level.marks.forEach(mark => {
      ctx.font = "900 12px system-ui"; ctx.textAlign = "center";
      const width = ctx.measureText(mark.text).width + 22;
      ctx.fillStyle = "rgba(5,14,23,.68)"; roundRect(mark.x - width / 2, mark.y - 17, width, 24, 5); ctx.fill();
      ctx.strokeStyle = "rgba(170,215,230,.24)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(225,241,246,.8)";
      ctx.fillText(mark.text, mark.x, mark.y);
    });
    ctx.restore();
  }

  function drawStartPad(spawn) {
    const y = spawn.y + 31;
    ctx.save(); ctx.translate(spawn.x, y);
    ctx.shadowColor = "rgba(255,196,45,.45)"; ctx.shadowBlur = 16;
    ctx.fillStyle = "#17232d"; ctx.strokeStyle = "#e7a827"; ctx.lineWidth = 3;
    roundRect(-39, -7, 78, 14, 4); ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#ffd459"; ctx.lineWidth = 3;
    [-18, 0, 18].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 7, -3); ctx.lineTo(x, 3); ctx.lineTo(x + 7, -3); ctx.stroke(); });
    ctx.restore();
  }

  function drawPart(item) {
    ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.angle);
    const age = clamp((performance.now() - (item.born ?? 0)) / 180, 0, 1);
    const pop = age < 1 ? .76 + age * .24 + Math.sin(age * Math.PI) * .13 : 1;
    ctx.scale(pop, pop);
    const selected = item.id === selectedId && mode !== "running";
    if (item.type === "plank") {
      ctx.shadowColor = "rgba(0,0,0,.58)"; ctx.shadowBlur = 13; ctx.shadowOffsetY = 8;
      const wood = ctx.createLinearGradient(0, -13, 0, 13);
      wood.addColorStop(0, "#efb86e"); wood.addColorStop(.48, "#c67a34"); wood.addColorStop(1, "#7e421d");
      ctx.fillStyle = wood; ctx.strokeStyle = "#4c260f"; ctx.lineWidth = 5;
      roundRect(-90, -11, 180, 22, 4); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(89,43,15,.42)"; ctx.lineWidth = 1.5;
      [-4, 3, 7].forEach((y, i) => { ctx.beginPath(); ctx.moveTo(-78, y); ctx.bezierCurveTo(-30, y - 3 + i, 30, y + 4 - i, 77, y - 1); ctx.stroke(); });
      [-66, 66].forEach(x => { ctx.fillStyle = "#30231d"; ctx.strokeStyle = "#e7c18b"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    } else if (item.type === "spring") {
      ctx.shadowColor = "rgba(255,205,49,.5)"; ctx.shadowBlur = mode === "running" ? 15 : 8;
      ctx.fillStyle = "#273640"; ctx.strokeStyle = "#9badb5"; ctx.lineWidth = 2;
      roundRect(-57, -18, 12, 36, 3); ctx.fill(); ctx.stroke(); roundRect(45, -18, 12, 36, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#5d3707"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-48, 0);
      for (let i = 0; i < 11; i++) ctx.lineTo(-42 + i * 8.4, i % 2 ? 14 : -14);
      ctx.lineTo(48, 0); ctx.stroke();
      ctx.strokeStyle = "#ffd235"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-50, 0);
      for (let i = 0; i < 11; i++) ctx.lineTo(-42 + i * 8.4, i % 2 ? 14 : -14);
      ctx.lineTo(50, 0); ctx.stroke();
      ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(255,255,213,.78)"; ctx.lineWidth = 2; ctx.stroke();
    } else if (item.type === "fan") {
      const active = mode === "running";
      const wind = ctx.createLinearGradient(18, 0, 205, 0); wind.addColorStop(0, "rgba(108,220,255,.18)"); wind.addColorStop(1, "rgba(108,220,255,0)");
      ctx.fillStyle = wind; ctx.beginPath(); ctx.moveTo(18, -20); ctx.lineTo(205, -72); ctx.lineTo(205, 72); ctx.lineTo(18, 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = active ? "rgba(145,235,255,.58)" : "rgba(138,224,255,.22)"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const offset = (performance.now() / (active ? 4 : 14) + i * 48) % 190;
        ctx.beginPath(); ctx.moveTo(28 + offset, -23 + i * 15); ctx.lineTo(52 + offset, -23 + i * 15); ctx.stroke();
      }
      ctx.shadowColor = "rgba(76,199,238,.45)"; ctx.shadowBlur = active ? 18 : 7;
      const metal = ctx.createRadialGradient(-8, -10, 2, 0, 0, 34); metal.addColorStop(0, "#d9edf1"); metal.addColorStop(.5, "#708d9a"); metal.addColorStop(1, "#263b49");
      ctx.fillStyle = metal; ctx.strokeStyle = "#101d27"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent"; ctx.fillStyle = "#174d68";
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * Math.PI * .4 + performance.now() / (active ? 105 : 900)); ctx.beginPath(); ctx.ellipse(13, 0, 16, 7, -.24, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.strokeStyle = "rgba(210,236,242,.44)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 27, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#ffd235"; ctx.strokeStyle = "#6d4608"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#536c78"; ctx.strokeStyle = "#172731"; ctx.lineWidth = 3; roundRect(-22, 28, 44, 12, 4); ctx.fill(); ctx.stroke();
    } else if (item.type === "magnet") {
      const pulse = .25 + (Math.sin(performance.now() / 180) + 1) * .12;
      ctx.strokeStyle = `rgba(255,106,67,${pulse})`; ctx.lineWidth = 2; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -performance.now() / 35;
      [105, 155, 205].forEach(radius => { ctx.beginPath(); ctx.arc(0, 0, radius, -.72, .72); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI - .72, Math.PI + .72); ctx.stroke(); });
      ctx.setLineDash([]); ctx.shadowColor = "rgba(255,86,52,.52)"; ctx.shadowBlur = mode === "running" ? 18 : 9;
      ctx.strokeStyle = "#751f18"; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(0, 1, 29, Math.PI, 0); ctx.lineTo(29, 29); ctx.stroke();
      ctx.strokeStyle = "#f04f37"; ctx.lineWidth = 17; ctx.beginPath(); ctx.arc(0, 1, 29, Math.PI, 0); ctx.lineTo(29, 29); ctx.stroke();
      ctx.shadowColor = "transparent"; ctx.strokeStyle = "#e9f0f1"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(-29, 0); ctx.lineTo(-29, 28); ctx.moveTo(29, 0); ctx.lineTo(29, 28); ctx.stroke();
      ctx.fillStyle = "#0f202b"; ctx.font = "1000 9px system-ui"; ctx.textAlign = "center"; ctx.fillText("N       S", 0, 8);
    }
    if (selected) {
      ctx.shadowColor = "rgba(255,225,78,.7)"; ctx.shadowBlur = 12;
      ctx.strokeStyle = "#fff172"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -performance.now() / 50;
      const size = item.type === "plank" ? [200, 48] : item.type === "spring" ? [125, 55] : [88, 88];
      ctx.strokeRect(-size[0] / 2, -size[1] / 2, size[0], size[1]); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawGoal(goal) {
    ctx.save(); ctx.translate(goal.x, goal.y);
    const pulse = 1 + Math.sin(performance.now() / 280) * .06;
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "rgba(88,224,178,.58)"; ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(11,40,42,.82)"; ctx.strokeStyle = "#71f0c4"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(152,255,219,.64)"; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.lineDashOffset = performance.now() / 45;
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#71f0c4"; ctx.font = "1000 23px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("✓", 0, 1);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.fillStyle = "#ffcb31"; ctx.fillRect(-3, -49, 6, 9); ctx.restore(); }
    ctx.restore();
  }

  function drawBallTrail() {
    ctx.save();
    ballTrail.forEach((point, index) => {
      ctx.globalAlpha = clamp(point.life / .34, 0, 1) * .18 * (index + 1) / Math.max(1, ballTrail.length);
      ctx.fillStyle = "#ffd65a";
      ctx.beginPath(); ctx.arc(point.x, point.y, point.r * (.35 + index / Math.max(1, ballTrail.length) * .35), 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawBall() {
    if (!ball) return;
    const visualRadius = ball.r + 1.5;
    ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.rotation);
    ctx.shadowColor = "rgba(0,0,0,.58)"; ctx.shadowBlur = 13; ctx.shadowOffsetY = 7;
    const gradient = ctx.createRadialGradient(-7, -9, 2, 0, 0, visualRadius + 1);
    gradient.addColorStop(0, "#fff5c4"); gradient.addColorStop(.22, "#e7bd45"); gradient.addColorStop(.58, "#bd6f20"); gradient.addColorStop(1, "#4a2716");
    ctx.fillStyle = gradient; ctx.strokeStyle = "#20140f"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0, 0, visualRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, visualRadius - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(26,35,38,.78)"; ctx.fillRect(-24, -4, 48, 8);
    ctx.fillStyle = "#ffd447"; ctx.fillRect(-24, -2, 48, 4); ctx.restore();
    ctx.strokeStyle = "rgba(255,249,218,.58)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-3, -4, visualRadius - 5, 3.55, 5.1); ctx.stroke();
    [0, Math.PI].forEach(angle => { ctx.fillStyle = "#172128"; ctx.strokeStyle = "#e7c66d"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.cos(angle) * 11, Math.sin(angle) * 11, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    particles.forEach(p => {
      ctx.globalAlpha = clamp(p.life * 1.3, 0, 1); ctx.fillStyle = p.color;
      const size = p.size ?? (p.color === "#8ae0ff" ? 4 : 6);
      if (p.color === "#8ae0ff") {
        ctx.fillRect(p.x - 3, p.y - 1, 14, 2.5);
      } else {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillRect(-size / 2, -size / 2, size * 1.7, size); ctx.restore();
      }
    });
    ctx.restore();
  }

  function drawForeground() {
    const vignette = ctx.createRadialGradient(W / 2, H * .46, H * .12, W / 2, H * .48, W * .66);
    vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(.72, "rgba(0,7,13,.08)"); vignette.addColorStop(1, "rgba(0,4,8,.57)");
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,190,91,.055)"; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(290, 0); ctx.lineTo(405, H); ctx.lineTo(170, H); ctx.closePath(); ctx.fill();
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function loop(now) {
    const dt = Math.max(0, Math.min((now - lastFrame) / 1000, .1));
    lastFrame = now;
    if (mode === "running") {
      accumulator += dt;
      while (accumulator + 1e-9 >= physicsStep && mode === "running") {
        accumulator -= physicsStep;
        updatePhysics(physicsStep);
      }
      els.runTimeValue.textContent = `${runTime.toFixed(1)} s`;
    }
    updateParticles(dt);
    draw();
    requestAnimationFrame(loop);
  }

  loadLevel(0);
  requestAnimationFrame(loop);
})();
