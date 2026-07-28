// Ligne de vue sur une grille de tuiles. Module volontairement PUR (aucune
// dépendance à Phaser) : c'est la logique testable en isolation, et la brique
// qui empêche les bots de cibler / tirer à travers les murs.
//
// Convention de la grille : 0 = sol traversable, 1 = mur. Hors des limites =
// traité comme un mur (rien n'est visible au-delà du monde).

// Valeur de la tuile contenant le point monde (x, y). Hors carte → 1 (mur).
export function tileAt(grid, tileSize, x, y) {
  const c = Math.floor(x / tileSize);
  const r = Math.floor(y / tileSize);
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return 1;
  return grid[r][c];
}

// Vrai si le segment [(x0,y0) → (x1,y1)] ne traverse aucun mur.
//
// On échantillonne le segment par pas d'un peu moins d'une demi-tuile : les
// murs occupant une tuile pleine, aucun ne peut se glisser entre deux points
// d'échantillonnage. Suffisant et bien plus simple qu'un DDA, pour un appel qui
// n'a lieu qu'au rythme des re-choix de cible (pas à chaque frame).
export function lineOfSightClear(grid, tileSize, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / (tileSize * 0.45)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (tileAt(grid, tileSize, x, y) === 1) return false;
  }
  return true;
}
