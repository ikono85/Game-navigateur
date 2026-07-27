// Textures de particules. Chacune est un petit disque doux avec un dégradé
// radial — le rendu se fait ensuite en tint + blend depuis Phaser (ADD pour ce
// qui brille, NORMAL pour la fumée et le sang).
//
// Les couleurs sont neutres à la génération : on teinte au moment de l'emission
// pour ne pas dupliquer des textures quasi identiques.

function radial(scene, key, size, inner, outer) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

// Petite tache blanche — servira pour étincelles, braises, wisps (via tint).
export function makeSpeckTexture(scene, key = 'speck') {
  radial(scene, key, 10, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
}

// Fumée : gris moyen, bords très diffus.
export function makeSmokeTexture(scene, key = 'smoke') {
  radial(scene, key, 32, 'rgba(80,80,80,0.85)', 'rgba(60,60,60,0)');
}

// Sang : rouge sombre, bords un peu plus francs.
export function makeBloodTexture(scene, key = 'blood') {
  radial(scene, key, 12, 'rgba(180,20,20,1)', 'rgba(90,0,0,0)');
}
