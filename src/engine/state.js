/**
 * L'etat d'une partie et ses transitions. Le hasard arrive par `rng`, jamais
 * par Math.random : une partie rejouee avec le meme tirage se deroule a
 * l'identique, ce qui rend le moteur testable.
 */

import {
  ALREADY, FLEET, HIT, HORIZONTAL, MISS, PHASE, SUNK, VERTICAL,
} from './constants.js';
import { allSunk, createBoard, fire, place, placeFleet } from './board.js';
import { chooseTarget, createBrain, notify } from './ai.js';

const LOG_MAX = 8;

export function createState(rng = Math.random) {
  return {
    rng,
    phase: PHASE.PLACEMENT,
    player: createBoard(),
    ai: createBoard(),
    brain: createBrain(),
    fleetIndex: 0,
    dir: HORIZONTAL,
    turn: 'player',
    winner: null,
    log: ['Placez votre flotte : cliquez sur votre grille.'],
  };
}

/** Le navire qu'il reste a poser, ou null quand la flotte est complete. */
export function pendingShip(state) {
  return FLEET[state.fleetIndex] ?? null;
}

const say = (state, message) => [...state.log, message].slice(-LOG_MAX);

const describe = (result, ship) => {
  if (result === SUNK) return `${ship.name} coule !`;
  if (result === HIT) return 'Touche.';
  return 'A l\'eau.';
};

function playerFires(state, row, col) {
  const { board, result, ship } = fire(state.ai, row, col);
  if (result === ALREADY) return state;

  const next = { ...state, ai: board, log: say(state, `Vous : ${describe(result, ship)}`) };
  if (allSunk(board)) {
    return { ...next, phase: PHASE.OVER, winner: 'player', log: say(next, 'Flotte ennemie detruite. Vous gagnez.') };
  }
  return result === MISS ? { ...next, turn: 'ai' } : next;
}

function aiFires(state) {
  const cell = chooseTarget(state.brain, state.player, state.rng);
  if (!cell) return { ...state, turn: 'player' };

  const { board, result, ship } = fire(state.player, cell.row, cell.col);
  const next = {
    ...state,
    player: board,
    brain: notify(state.brain, board, cell, result),
    log: say(state, `Ennemi : ${describe(result, ship)}`),
  };
  if (allSunk(board)) {
    return { ...next, phase: PHASE.OVER, winner: 'ai', log: say(next, 'Votre flotte est coulee. Vous perdez.') };
  }
  return result === MISS ? { ...next, turn: 'player' } : next;
}

export function reduce(state, action) {
  switch (action.type) {
    case 'rotate':
      return { ...state, dir: state.dir === HORIZONTAL ? VERTICAL : HORIZONTAL };

    case 'place': {
      const model = pendingShip(state);
      if (state.phase !== PHASE.PLACEMENT || !model) return state;
      const player = place(state.player, {
        id: model.id, row: action.row, col: action.col, dir: state.dir,
      });
      if (player === state.player) return state;
      const fleetIndex = state.fleetIndex + 1;
      const next = FLEET[fleetIndex];
      return {
        ...state,
        player,
        fleetIndex,
        log: say(state, next ? `${model.name} en place. Au tour du ${next.name.toLowerCase()}.` : 'Flotte complete. A vous de jouer.'),
      };
    }

    case 'randomize':
      if (state.phase !== PHASE.PLACEMENT) return state;
      return {
        ...state,
        player: placeFleet(state.rng),
        fleetIndex: FLEET.length,
        log: say(state, 'Flotte disposee au hasard.'),
      };

    case 'clear':
      if (state.phase !== PHASE.PLACEMENT || state.fleetIndex === 0) return state;
      return createState(state.rng);

    case 'start':
      if (state.phase !== PHASE.PLACEMENT || state.fleetIndex < FLEET.length) return state;
      return {
        ...state,
        phase: PHASE.BATTLE,
        ai: placeFleet(state.rng),
        turn: 'player',
        log: say(state, 'Contact. Choisissez une case sur la grille ennemie.'),
      };

    case 'fire':
      if (state.phase !== PHASE.BATTLE || state.turn !== 'player') return state;
      return playerFires(state, action.row, action.col);

    case 'ai-fire':
      if (state.phase !== PHASE.BATTLE || state.turn !== 'ai') return state;
      return aiFires(state);

    case 'reset':
      return createState(state.rng);

    default:
      return state;
  }
}
