/** Le tableau de bord des deux flottes. */

import { FLEET } from '../engine/constants.js';
import { isSunk } from '../engine/board.js';

export function createFleetPanel(container, { reveal }) {
  const rows = new Map();
  for (const model of FLEET) {
    const row = document.createElement('li');
    row.className = 'fleet-row';
    row.innerHTML = `<span class="fleet-name">${model.name}</span><span class="pips"></span>`;
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
      row.querySelector('.pips').innerHTML = Array.from({ length: model.size }, (_, i) => {
        // Sur la flotte adverse on ne trahit rien tant que le navire flotte :
        // c'est le naufrage qui se voit, pas le detail des impacts.
        const filled = reveal ? Boolean(ship && ship.hits[i]) : sunk;
        return `<i class="${filled ? 'pip hit' : 'pip'}"></i>`;
      }).join('');
    }
  };
}
