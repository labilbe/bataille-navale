/**
 * Rendu d'une grille en DOM. Les cases sont des boutons : le clavier et les
 * lecteurs d'ecran traversent le jeu sans traitement particulier.
 *
 * Les navires ne sont pas peints case par case : chaque navire est une
 * silhouette posee par-dessus la grille, calee sur les cases qu'il occupe. Les
 * impacts, eux, restent portes par les cases.
 */

import { HIT, MISS, SIZE, index } from '../engine/constants.js';
import { cellsOf, isSunk } from '../engine/board.js';
import { topView } from './silhouettes.js';

const LETTERS = 'ABCDEFGHIJ';

export const coordLabel = (row, col) => `${LETTERS[col]}${row + 1}`;

/** Construit les 100 boutons et la couche des silhouettes, une fois pour toutes. */
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

  const sprites = document.createElement('div');
  sprites.className = 'sprites';
  container.append(sprites);

  return { cells, sprites };
}

/**
 * Pose une silhouette sur la grille. Les cases mesurent `--cell`, separees de
 * `--gap` et decalees de `--pad` : le calcul reste en CSS, donc juste a toutes
 * les tailles d'ecran.
 */
function sprite({ id, size, row, col, dir }, extra = '') {
  const el = document.createElement('div');
  el.className = `sprite ${extra}`.trim();
  const along = `calc(${size} * var(--cell) + ${size - 1} * var(--gap))`;
  el.style.left = `calc(var(--pad) + ${col} * (var(--cell) + var(--gap)))`;
  el.style.top = `calc(var(--pad) + ${row} * (var(--cell) + var(--gap)))`;
  el.style.width = dir === 'H' ? along : 'var(--cell)';
  el.style.height = dir === 'H' ? 'var(--cell)' : along;
  el.innerHTML = topView(id, size, dir);
  return el;
}

/**
 * Peint une grille. `reveal` montre les navires intacts : vrai pour la flotte
 * du joueur, faux pour celle de l'adversaire, ou seules les epaves se voient.
 * `ghost` est le navire en cours de placement, suivi par le pointeur.
 */
export function paint({ cells, sprites }, board, { reveal, ghost = null }) {
  const sunkCells = new Set();
  sprites.replaceChildren();

  for (const ship of board.ships) {
    const sunk = isSunk(ship);
    if (sunk) for (const c of cellsOf(ship)) sunkCells.add(index(c.row, c.col));
    if (reveal || sunk) sprites.append(sprite(ship, sunk ? 'sunk' : ''));
  }

  if (ghost) {
    sprites.append(sprite(ghost, ghost.valid ? 'ghost' : 'ghost ghost-bad'));
  }

  cells.forEach((cell, i) => {
    const shot = board.shots[i];
    const classes = ['cell'];
    if (shot === HIT) classes.push(sunkCells.has(i) ? 'hit sunk' : 'hit');
    if (shot === MISS) classes.push('miss');
    cell.className = classes.join(' ');
    cell.disabled = shot !== null && !reveal;

    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const state = shot === HIT ? (sunkCells.has(i) ? 'coule' : 'touche')
      : shot === MISS ? 'a l\'eau' : 'inconnu';
    cell.setAttribute('aria-label', `${coordLabel(row, col)} : ${state}`);
  });
}
