/**
 * Regles du jeu. Rien ici ne depend du navigateur : ce fichier est lu aussi
 * bien par le moteur que par les tests sous Node.
 */

export const SIZE = 10;

export const FLEET = [
  { id: 'porte-avions', name: 'Porte-avions', size: 5 },
  { id: 'croiseur', name: 'Croiseur', size: 4 },
  { id: 'contre-torpilleur', name: 'Contre-torpilleur', size: 3 },
  { id: 'sous-marin', name: 'Sous-marin', size: 3 },
  { id: 'torpilleur', name: 'Torpilleur', size: 2 },
];

export const HORIZONTAL = 'H';
export const VERTICAL = 'V';

export const MISS = 'miss';
export const HIT = 'hit';
export const SUNK = 'sunk';
export const ALREADY = 'already';

export const PHASE = {
  PLACEMENT: 'placement',
  BATTLE: 'battle',
  OVER: 'over',
};

export const index = (row, col) => row * SIZE + col;
export const inside = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;
