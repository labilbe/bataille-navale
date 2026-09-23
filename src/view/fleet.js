/**
 * Le tableau de bord des deux flottes : chaque navire s'y montre de profil, a
 * l'echelle de sa longueur.
 */

import { FLEET } from '../engine/constants.js';
import { isSunk } from '../engine/board.js';
import { sideView } from './silhouettes.js';

export function createFleetPanel(container, { reveal }) {
  const rows = new Map();

  for (const model of FLEET) {
    const row = document.createElement('li');
    row.className = 'fleet-row';
    row.style.setProperty('--len', String(model.size));
    row.innerHTML = `<span class="fleet-name">${model.name}</span>`
      + `<span class="silhouette">${sideView(model.id, model.size)}<span class="damage"></span></span>`;
    container.append(row);
    rows.set(model.id, row);
  }

  return function update(board) {
    for (const model of FLEET) {
      const row = rows.get(model.id);
      const ship = board.ships.find((s) => s.id === model.id);
      const sunk = ship ? isSunk(ship) : false;
      row.classList.toggle('sunk', sunk);
      row.classList.toggle('absent', !ship);

      // Sur la flotte adverse on ne trahit rien tant que le navire flotte :
      // c'est le naufrage qui se voit, pas le detail des impacts.
      const touches = reveal && ship ? ship.hits : [];
      row.querySelector('.damage').innerHTML = touches
        .map((touche, i) => (touche
          ? `<i style="left:${(i * 100) / model.size}%;width:${100 / model.size}%"></i>`
          : ''))
        .join('');
    }
  };
}
