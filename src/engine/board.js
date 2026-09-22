/**
 * Une grille et sa flotte. Toutes les fonctions sont pures : elles rendent une
 * nouvelle grille plutot que de modifier celle qu'on leur passe.
 */

import {
  ALREADY, FLEET, HIT, HORIZONTAL, MISS, SIZE, SUNK, VERTICAL, index, inside,
} from './constants.js';

export function createBoard() {
  return { ships: [], shots: Array(SIZE * SIZE).fill(null) };
}

export function cloneBoard(board) {
  return {
    ships: board.ships.map((ship) => ({ ...ship, hits: [...ship.hits] })),
    shots: [...board.shots],
  };
}

/** Les cases occupees par un navire, de la proue a la poupe. */
export function cellsOf(ship) {
  const cells = [];
  for (let i = 0; i < ship.size; i += 1) {
    cells.push(ship.dir === HORIZONTAL
      ? { row: ship.row, col: ship.col + i }
      : { row: ship.row + i, col: ship.col });
  }
  return cells;
}

export function isSunk(ship) {
  return ship.hits.every(Boolean);
}

export function allSunk(board) {
  return board.ships.length > 0 && board.ships.every(isSunk);
}

/** Vrai si le navire tient dans la grille sans chevaucher un autre. */
export function canPlace(board, ship) {
  const cells = cellsOf(ship);
  if (!cells.every(({ row, col }) => inside(row, col))) return false;
  const occupied = new Set(board.ships.flatMap((other) => cellsOf(other).map((c) => index(c.row, c.col))));
  return cells.every(({ row, col }) => !occupied.has(index(row, col)));
}

export function place(board, { id, row, col, dir }) {
  const model = FLEET.find((entry) => entry.id === id);
  if (!model) throw new Error(`Navire inconnu : ${id}`);
  const ship = { ...model, row, col, dir, hits: Array(model.size).fill(false) };
  if (!canPlace(board, ship)) return board;
  return { ...cloneBoard(board), ships: [...board.ships.map((s) => ({ ...s, hits: [...s.hits] })), ship] };
}

/** Dispose la flotte entiere au hasard. `rng` rend un flottant dans [0, 1[. */
export function placeFleet(rng) {
  let board = createBoard();
  for (const model of FLEET) {
    let placed = board;
    do {
      const dir = rng() < 0.5 ? HORIZONTAL : VERTICAL;
      const row = Math.floor(rng() * SIZE);
      const col = Math.floor(rng() * SIZE);
      placed = place(board, { id: model.id, row, col, dir });
    } while (placed === board);
    board = placed;
  }
  return board;
}

/** Le navire touche par un tir en (row, col), ou undefined. */
export function shipAt(board, row, col) {
  return board.ships.find((ship) => cellsOf(ship)
    .some((cell) => cell.row === row && cell.col === col));
}

/**
 * Tire sur une case. Rend la nouvelle grille et le resultat : `already` si la
 * case avait deja ete visee, sinon `miss`, `hit` ou `sunk`.
 */
export function fire(board, row, col) {
  if (!inside(row, col)) return { board, result: ALREADY, ship: null };
  if (board.shots[index(row, col)] !== null) return { board, result: ALREADY, ship: null };

  const next = cloneBoard(board);
  const ship = next.ships.find((candidate) => cellsOf(candidate)
    .some((cell) => cell.row === row && cell.col === col));

  if (!ship) {
    next.shots[index(row, col)] = MISS;
    return { board: next, result: MISS, ship: null };
  }

  const offset = cellsOf(ship).findIndex((cell) => cell.row === row && cell.col === col);
  ship.hits[offset] = true;
  next.shots[index(row, col)] = HIT;
  return { board: next, result: isSunk(ship) ? SUNK : HIT, ship };
}
