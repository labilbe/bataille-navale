/**
 * Cablage : le seul module qui connaisse a la fois le DOM, l'horloge et le
 * moteur. Il garde l'etat courant, le redessine, et laisse l'IA jouer apres un
 * court delai pour qu'on suive ce qui se passe.
 */

import { FLEET, HORIZONTAL, PHASE, SIZE, inside } from './engine/constants.js';
import { canPlace } from './engine/board.js';
import { createState, pendingShip, reduce } from './engine/state.js';
import { coordLabel, createGrid, paint } from './view/grid.js';
import { mountDefs } from './view/silhouettes.js';
import { createFleetPanel } from './view/fleet.js';

const AI_DELAY = 550;

const $ = (id) => document.getElementById(id);

mountDefs(document.body);

let state = createState();
let hover = null;

const playerGrid = createGrid($('player-grid'), onPlayerCell);
const enemyGrid = createGrid($('enemy-grid'), onEnemyCell);
const updatePlayerFleet = createFleetPanel($('player-fleet'), { reveal: true });
const updateEnemyFleet = createFleetPanel($('enemy-fleet'), { reveal: false });

function onPlayerCell(row, col, isHover = false) {
  if (isHover) {
    hover = inside(row, col) ? { row, col } : null;
    if (state.phase === PHASE.PLACEMENT) render();
    return;
  }
  dispatch({ type: 'place', row, col });
}

function onEnemyCell(row, col, isHover = false) {
  if (isHover) return;
  dispatch({ type: 'fire', row, col });
}

function dispatch(action) {
  const before = state;
  state = reduce(state, action);
  if (state === before) return;
  render();
  if (state.phase === PHASE.BATTLE && state.turn === 'ai') {
    setTimeout(() => dispatch({ type: 'ai-fire' }), AI_DELAY);
  }
}

/** Le navire en attente, pose sous le pointeur : l'apercu du placement. */
function ghostShip() {
  const model = pendingShip(state);
  if (!hover || !model || state.phase !== PHASE.PLACEMENT) return null;
  const ghost = {
    ...model, row: hover.row, col: hover.col, dir: state.dir, hits: Array(model.size).fill(false),
  };
  return { ...ghost, valid: canPlace(state.player, ghost) };
}

function render() {
  const placing = state.phase === PHASE.PLACEMENT;
  const over = state.phase === PHASE.OVER;

  paint(playerGrid, state.player, { reveal: true, ghost: ghostShip() });
  paint(enemyGrid, state.ai, { reveal: over });
  updatePlayerFleet(state.player);
  updateEnemyFleet(state.ai);

  $('enemy-grid').classList.toggle('locked', state.phase !== PHASE.BATTLE || state.turn !== 'player');
  $('player-grid').classList.toggle('placing', placing);

  const model = pendingShip(state);
  $('placement-controls').hidden = !placing;
  $('battle-controls').hidden = placing;
  $('start').disabled = state.fleetIndex < FLEET.length;
  $('clear').disabled = state.fleetIndex === 0;
  $('rotate').textContent = state.dir === HORIZONTAL ? 'Horizontal (R)' : 'Vertical (R)';

  $('status').textContent = placing
    ? (model ? `A poser : ${model.name} (${model.size} cases)` : 'Flotte prete : lancez la partie.')
    : over
      ? (state.winner === 'player' ? 'Victoire.' : 'Defaite.')
      : state.turn === 'player' ? 'A vous de tirer.' : 'L\'ennemi vise...';

  $('log').innerHTML = state.log.map((line) => `<li>${line}</li>`).join('');
}

$('rotate').addEventListener('click', () => dispatch({ type: 'rotate' }));
$('random').addEventListener('click', () => dispatch({ type: 'randomize' }));
$('clear').addEventListener('click', () => dispatch({ type: 'clear' }));
$('start').addEventListener('click', () => dispatch({ type: 'start' }));
$('replay').addEventListener('click', () => dispatch({ type: 'reset' }));

document.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') dispatch({ type: 'rotate' });
});

// Les reperes A-J et 1-10 autour des grilles.
for (const grid of document.querySelectorAll('.grid-frame')) {
  const cols = grid.querySelector('.ruler-cols');
  const rows = grid.querySelector('.ruler-rows');
  for (let i = 0; i < SIZE; i += 1) {
    cols.insertAdjacentHTML('beforeend', `<span>${coordLabel(0, i)[0]}</span>`);
    rows.insertAdjacentHTML('beforeend', `<span>${i + 1}</span>`);
  }
}

render();
