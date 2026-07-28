import { describe, it, expect } from 'vitest';
import { tileAt, lineOfSightClear } from '../src/systems/los.js';

// Grille de test 5×5, murs (1) sur le pourtour + un mur central en (2,2).
// tileSize = 10 pour des maths simples.
const GRID = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];
const TS = 10;

describe('tileAt', () => {
  it('lit la tuile contenant un point monde', () => {
    expect(tileAt(GRID, TS, 15, 15)).toBe(0); // centre de (1,1)
    expect(tileAt(GRID, TS, 25, 25)).toBe(1); // mur central (2,2)
  });

  it('traite le hors-carte comme un mur', () => {
    expect(tileAt(GRID, TS, -5, 15)).toBe(1);
    expect(tileAt(GRID, TS, 15, 999)).toBe(1);
  });
});

describe('lineOfSightClear', () => {
  it('voit en ligne droite dans un couloir dégagé', () => {
    // de (1,1) à (3,1) : rangée 1, que du sol
    expect(lineOfSightClear(GRID, TS, 15, 15, 35, 15)).toBe(true);
  });

  it('est bloqué par le mur central', () => {
    // de (1,2) à (3,2) : traverse le mur (2,2)
    expect(lineOfSightClear(GRID, TS, 15, 25, 35, 25)).toBe(false);
  });

  it('contourne : la diagonale évitant le mur central passe', () => {
    // de (1,1) à (3,3) en passant par la rangée 1 puis colonne 3 — mais la
    // droite (1,1)->(3,3) traverse (2,2), donc bloquée : on le vérifie.
    expect(lineOfSightClear(GRID, TS, 15, 15, 35, 35)).toBe(false);
  });

  it("un point vers lui-même est toujours dégagé", () => {
    expect(lineOfSightClear(GRID, TS, 15, 15, 15, 15)).toBe(true);
  });
});
