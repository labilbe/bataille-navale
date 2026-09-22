/**
 * L'adversaire. Deux modes : il ratisse la grille en damier tant qu'il n'a rien
 * touche (le plus petit navire fait deux cases, une case sur deux suffit donc a
 * le trouver), puis il traque le navire touche en suivant l'axe des impacts.
 */

import { HIT, SIZE, SUNK, index, inside } from './constants.js';

export function createBrain() {
  return { queue: [], hits: [] };
}

const untried = (board, cell) => inside(cell.row, cell.col)
  && board.shots[index(cell.row, cell.col)] === null;

const neighbours = ({ row, col }) => [
  { row: row - 1, col }, { row: row + 1, col },
  { row, col: col - 1 }, { row, col: col + 1 },
];

/** Les deux prolongements d'une serie d'impacts alignes. */
function extremities(hits) {
  const sameRow = hits.every((cell) => cell.row === hits[0].row);
  const sorted = [...hits].sort((a, b) => (sameRow ? a.col - b.col : a.row - b.row));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return sameRow
    ? [{ row: first.row, col: first.col - 1 }, { row: last.row, col: last.col + 1 }]
    : [{ row: first.row - 1, col: first.col }, { row: last.row + 1, col: last.col }];
}

/** La case que l'IA vise, ou null si la grille est entierement couverte. */
export function chooseTarget(brain, board, rng) {
  const fromQueue = brain.queue.filter((cell) => untried(board, cell));
  if (fromQueue.length > 0) return fromQueue[0];

  const free = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board.shots[index(row, col)] === null) free.push({ row, col });
    }
  }
  if (free.length === 0) return null;

  const checkered = free.filter((cell) => (cell.row + cell.col) % 2 === 0);
  const pool = checkered.length > 0 ? checkered : free;
  return pool[Math.floor(rng() * pool.length)];
}

/** Met a jour la memoire de l'IA apres son tir. Rend un nouveau cerveau. */
export function notify(brain, board, cell, result) {
  if (result === SUNK) return createBrain();
  if (result !== HIT) {
    return { ...brain, queue: brain.queue.filter((c) => untried(board, c)) };
  }

  const hits = [...brain.hits, cell];
  const aligned = hits.length >= 2
    && (hits.every((c) => c.row === hits[0].row) || hits.every((c) => c.col === hits[0].col));
  const candidates = aligned ? extremities(hits) : neighbours(cell);

  return { hits, queue: candidates.filter((c) => untried(board, c)) };
}
