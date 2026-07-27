// Choix des textures de sol et mur, adapté au pack peint (4 sols + 16 murs).
//
// Les 16 tuiles de mur sont nommées wall_N_E_S_W avec 1 = voisin mur présent
// dans cette direction. L'espace hors carte est considéré comme mur, pour que
// les murs de bord se raccordent à eux-mêmes plutôt que d'afficher une
// extrémité ouverte.
//
// Les 4 sols sont choisis via un hash déterministe basé sur (r, c) — même
// tuile toujours même variante à chaque partie, et la répartition n'a pas
// l'air alignée sur des lignes ou des colonnes.

export const FLOOR_KEYS = ['floor_01', 'floor_02', 'floor_03', 'floor_04'];

// Renvoie la clé de texture de sol à utiliser pour la case (r, c).
export function floorKey(r, c) {
  const idx = ((r * 73 + c * 131) % FLOOR_KEYS.length + FLOOR_KEYS.length) % FLOOR_KEYS.length;
  return FLOOR_KEYS[idx];
}

// Renvoie la clé de texture de mur à utiliser pour la case (r, c) d'après ses
// 4 voisins orthogonaux.
export function wallKey(grid, r, c) {
  const isWall = (rr, cc) => {
    if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid[0].length) return true;
    return grid[rr][cc] === 1;
  };
  const n = isWall(r - 1, c) ? 1 : 0;
  const e = isWall(r, c + 1) ? 1 : 0;
  const s = isWall(r + 1, c) ? 1 : 0;
  const w = isWall(r, c - 1) ? 1 : 0;
  return `wall_${n}_${e}_${s}_${w}`;
}
