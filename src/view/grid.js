/**
 * Rendu d'une grille en DOM. Les cases sont des boutons : le clavier et les
 * lecteurs d'ecran traversent le jeu sans traitement particulier.
 */

import { HIT, MISS, SIZE, index, inside } from '../engine/constants.js';
import { cellsOf, isSunk } from '../engine/board.js';

const LETTERS = 'ABCDEFGHIJ';

export const coordLabel = (row, col) => `${LETTERS[col]}${row + 1}`;

/** Construit les 100 boutons une fois pour toutes et rend un accesseur. */
export function createGrid(container, onCell) {
  const cells = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.addEventListener('click', () => onCell(row, col));
      cell.addEventListener('mouseenter', () => onCell(row, col, true));
      container.append(cell);
      cells.push(cell);
    }
  }
  container.addEventListener('mouseleave', () => onCell(-1, -1, true));
  return cells;
}

/**
 * Peint une grille. `reveal` montre les navires intacts : vrai pour la flotte
 * du joueur, faux pour celle de l'adversaire tant que la partie dure.
 */
export function paint(cells, board, { reveal, preview = [], previewValid = true }) {
  const occupied = new Map();
  for (const ship of board.ships) {
    const sunk = isSunk(ship);
    for (const { row, col } of cellsOf(ship)) occupied.set(index(row, col), sunk);
  }
  // Un navire qui deborde a droite a des cases hors grille : sans ce filtre,
  // leur index retomberait sur la ligne suivante.
  const previewSet = new Set(preview
    .filter(({ row, col }) => inside(row, col))
    .map(({ row, col }) => index(row, col)));

  cells.forEach((cell, i) => {
    const shot = board.shots[i];
    const sunk = occupied.get(i);
    const classes = ['cell'];
    if (occupied.has(i) && (reveal || sunk)) classes.push(sunk ? 'sunk' : 'ship');
    if (shot === HIT) classes.push('hit');
    if (shot === MISS) classes.push('miss');
    if (previewSet.has(i)) classes.push(previewValid ? 'preview' : 'preview-bad');
    cell.className = classes.join(' ');
    cell.disabled = shot !== null && !reveal;

    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const state = shot === HIT ? (sunk ? 'coule' : 'touche') : shot === MISS ? 'a l\'eau' : 'inconnu';
    cell.setAttribute('aria-label', `${coordLabel(row, col)} : ${state}`);
  });
}
