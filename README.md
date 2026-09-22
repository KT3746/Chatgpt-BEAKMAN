# Beakman

[Jogar Beakman](https://oficina-maluca.chat2026-utopia002.chatgpt.site)

Jogo de desafios de física no navegador com cinco fases. O objetivo é construir soluções com tábuas, molas, ventiladores e ímãs para conduzir uma carga até o ponto de entrega.

## Como jogar

1. Escolha uma peça no painel lateral.
2. Posicione e gire as peças na bancada.
3. Pressione **Testar invenção** para iniciar a simulação.
4. Complete cada fase usando poucas peças para conquistar três estrelas.

Depois de cada tentativa, uma linha azul mantém a trajetória anterior na bancada. Use-a para comparar o efeito dos ajustes. O caderno de fases guarda o melhor tempo e a montagem com menos peças em cada desafio.

## Controles

- Mouse ou toque: escolher uma peça, tocar e arrastar para instalar. Com nenhuma ferramenta escolhida, toque numa peça existente para editar.
- Setas da interface: ajustar a peça em passos de 4 unidades, sem esconder a posição com o dedo.
- `↶` / `↷`: girar 15° em ambos os sentidos. O ângulo aparece acima dos controles.
- `?`: ler o objetivo e a dica completos, inclusive com o celular de lado.
- Botão de ampliar: ocupar a tela com a bancada e os controles. Funciona mesmo em navegadores sem suporte a tela cheia.
- **Desfazer**: recuperar até 25 posicionamentos, movimentos, giros, remoções ou uma bancada limpa por engano.
- `1` a `4`: escolher uma peça.
- Setas: mover a peça ou o cursor pelo teclado.
- `R` / `Shift + R`: girar no sentido horário / anti-horário.
- `Delete`: remover.
- `Ctrl + Z` / `Cmd + Z`: desfazer.
- `Esc`: cancelar a seleção.

Ao trocar de aplicativo ou abrir uma ajuda, o teste pausa sem perder a construção ou a trajetória. Toque em **Retomar teste** para continuar. **Parar teste** conserva as peças; **Recomeçar** limpa a bancada e pode ser desfeito.

Em telas de computador, a bancada e os controles se ajustam à altura disponível para que o botão de teste não fique abaixo da área visível.

## Verificação

Execute `node tests/game-check.mjs`. O teste usa a física real do jogo para verificar soluções de três estrelas nas cinco fases a 30, 60 e 120 quadros por segundo, recordes locais, trajetória anterior, devolução do orçamento, histórico de desfazer, controles de toque e pausa/retomada.

## Executar localmente

Abra `dist/index.html` em um navegador moderno. O jogo não precisa de instalação nem de servidor.

## Estrutura

- `dist/index.html`: interface do jogo.
- `dist/styles.css`: layout e identidade visual.
- `dist/game.js`: fases, interação, renderização e física.
- `dist/workshop-bg.webp`: cenário da bancada.
