// Autotiling des murs.
//
// Le pack fournit un « Wang tileset » : chaque case du sheet correspond à une
// configuration de voisins précise. La table ci-dessous est transcrite des
// métadonnées Tiled livrées avec le pack (Wall - Stone 1 64x64.tsx), où chaque
// tuile porte un wangid [haut, hd, droite, bd, bas, bg, gauche, hg].
//
// Résultat : les murs se raccordent — angles, extrémités, croisements — au lieu
// d'être un même bloc répété.

// masque des voisins : Nord 1, Est 2, Sud 4, Ouest 8
export const WALL_TILE_BY_MASK = {
  0: 30, // isolé : bloc plein
  1: 6, // N
  2: 14, // E
  3: 8, // N+E
  4: 13, // S
  5: 2, // N+S
  6: 0, // E+S
  7: 11, // N+E+S
  8: 5, // O
  9: 9, // N+O
  10: 10, // E+O
  11: 4, // N+E+O
  12: 1, // S+O
  13: 12, // N+S+O
  14: 3, // E+S+O
  15: 7, // les quatre
};

// Frames de sol jugées les plus lisibles du sheet (dalles nettes, sans motif
// trop marqué qui se répéterait à l'œil).
export const FLOOR_FRAMES = [0, 1, 2, 8, 9, 10, 16, 17];

// Renvoie l'index de tuile à utiliser pour un mur, d'après ses voisins.
export function wallFrame(grid, r, c) {
  const isWall = (rr, cc) => {
    if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid[0].length) return true; // hors carte = mur
    return grid[rr][cc] === 1;
  };

  let mask = 0;
  if (isWall(r - 1, c)) mask |= 1;
  if (isWall(r, c + 1)) mask |= 2;
  if (isWall(r + 1, c)) mask |= 4;
  if (isWall(r, c - 1)) mask |= 8;

  return WALL_TILE_BY_MASK[mask];
}
