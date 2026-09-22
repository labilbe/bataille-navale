import test from 'node:test';
import assert from 'node:assert/strict';

import { FLEET, HIT, HORIZONTAL, MISS, PHASE, SIZE, SUNK, VERTICAL, index } from '../src/engine/constants.js';
import { allSunk, canPlace, cellsOf, createBoard, fire, place, placeFleet } from '../src/engine/board.js';
import { chooseTarget, createBrain, notify } from '../src/engine/ai.js';
import { createState, pendingShip, reduce } from '../src/engine/state.js';

/** Generateur deterministe, pour que les tests ne dependent pas du hasard. */
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


test('un navire pose deborde de la grille est refuse', () => {
  const board = createBoard();
  assert.equal(canPlace(board, { size: 5, row: 0, col: 6, dir: HORIZONTAL }), false);
  assert.equal(canPlace(board, { size: 5, row: 6, col: 0, dir: VERTICAL }), false);
  assert.equal(canPlace(board, { size: 5, row: 0, col: 5, dir: HORIZONTAL }), true);
});

test('deux navires ne peuvent pas se chevaucher', () => {
  const board = place(createBoard(), { id: 'croiseur', row: 4, col: 2, dir: HORIZONTAL });
  const refused = place(board, { id: 'torpilleur', row: 4, col: 3, dir: VERTICAL });
  assert.equal(refused, board, 'le placement invalide rend la grille inchangee');
  assert.equal(board.ships.length, 1);
});

test('place ne modifie pas la grille d origine', () => {
  const board = createBoard();
  place(board, { id: 'torpilleur', row: 0, col: 0, dir: HORIZONTAL });
  assert.equal(board.ships.length, 0);
});

test('un tir manque, touche, puis coule', () => {
  let board = place(createBoard(), { id: 'torpilleur', row: 3, col: 3, dir: HORIZONTAL });

  const missed = fire(board, 0, 0);
  assert.equal(missed.result, MISS);
  assert.equal(missed.board.shots[index(0, 0)], MISS);

  const touched = fire(missed.board, 3, 3);
  assert.equal(touched.result, HIT);

  const sunk = fire(touched.board, 3, 4);
  assert.equal(sunk.result, SUNK);
  assert.equal(sunk.ship.id, 'torpilleur');
  assert.equal(allSunk(sunk.board), true);
  board = sunk.board;

  assert.equal(fire(board, 3, 4).result, 'already');
});

test('placeFleet pose toute la flotte sans chevauchement', () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const board = placeFleet(seeded(seed));
    assert.equal(board.ships.length, FLEET.length);
    const cells = board.ships.flatMap((ship) => cellsOf(ship).map((c) => index(c.row, c.col)));
    assert.equal(new Set(cells).size, cells.length, `chevauchement avec la graine ${seed}`);
    assert.ok(cells.every((i) => i >= 0 && i < SIZE * SIZE));
  }
});

test('l IA traque en ligne apres deux impacts alignes', () => {
  const board = place(createBoard(), { id: 'contre-torpilleur', row: 5, col: 4, dir: HORIZONTAL });
  let brain = createBrain();
  let grid = board;

  ({ board: grid } = fire(grid, 5, 4));
  brain = notify(brain, grid, { row: 5, col: 4 }, HIT);
  assert.deepEqual(new Set(brain.queue.map((c) => `${c.row},${c.col}`)),
    new Set(['4,4', '6,4', '5,3', '5,5']));

  ({ board: grid } = fire(grid, 5, 5));
  brain = notify(brain, grid, { row: 5, col: 5 }, HIT);
  assert.deepEqual(brain.queue.map((c) => `${c.row},${c.col}`), ['5,3', '5,6']);
});

test('l IA oublie sa piste quand le navire coule', () => {
  const brain = notify({ queue: [{ row: 1, col: 1 }], hits: [{ row: 0, col: 1 }] },
    createBoard(), { row: 1, col: 1 }, SUNK);
  assert.deepEqual(brain, createBrain());
});

test('l IA finit par couvrir toute la grille', () => {
  const rng = seeded(7);
  let board = placeFleet(seeded(3));
  let brain = createBrain();
  let shots = 0;

  while (!allSunk(board) && shots < SIZE * SIZE) {
    const cell = chooseTarget(brain, board, rng);
    assert.ok(cell, 'l IA doit trouver une case libre');
    const { board: next, result } = fire(board, cell.row, cell.col);
    brain = notify(brain, next, cell, result);
    board = next;
    shots += 1;
  }
  assert.equal(allSunk(board), true, `flotte non coulee en ${shots} tirs`);
  assert.ok(shots < 80, `l IA devrait gagner en moins de 80 tirs, elle en a mis ${shots}`);
});

test('la partie ne commence pas tant que la flotte est incomplete', () => {
  const state = reduce(createState(seeded(1)), { type: 'start' });
  assert.equal(state.phase, PHASE.PLACEMENT);
});

test('placement puis bataille : le tour passe a l ennemi apres un tir a l eau', () => {
  let state = reduce(createState(seeded(11)), { type: 'randomize' });
  assert.equal(pendingShip(state), null);

  state = reduce(state, { type: 'start' });
  assert.equal(state.phase, PHASE.BATTLE);
  assert.equal(state.ai.ships.length, FLEET.length);

  const empty = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!state.ai.ships.some((s) => cellsOf(s).some((c) => c.row === row && c.col === col))) {
        empty.push({ row, col });
      }
    }
  }

  const after = reduce(state, { type: 'fire', ...empty[0] });
  assert.equal(after.turn, 'ai');
  assert.equal(reduce(after, { type: 'fire', ...empty[1] }), after, 'le joueur ne rejoue pas hors tour');
});

test('couler toute la flotte adverse termine la partie', () => {
  let state = reduce(reduce(createState(seeded(5)), { type: 'randomize' }), { type: 'start' });
  for (const ship of state.ai.ships) {
    for (const cell of cellsOf(ship)) {
      state = { ...state, turn: 'player' };
      state = reduce(state, { type: 'fire', ...cell });
    }
  }
  assert.equal(state.phase, PHASE.OVER);
  assert.equal(state.winner, 'player');
});

test('le placement manuel enchaine les navires de la flotte', () => {
  let state = createState(seeded(2));
  assert.equal(pendingShip(state).id, FLEET[0].id);
  state = reduce(state, { type: 'place', row: 0, col: 0 });
  assert.equal(pendingShip(state).id, FLEET[1].id);
  state = reduce(state, { type: 'place', row: 0, col: 0 });
  assert.equal(pendingShip(state).id, FLEET[1].id, 'un placement refuse ne fait pas avancer la flotte');
  state = reduce(state, { type: 'clear' });
  assert.equal(state.player.ships.length, 0);
});
