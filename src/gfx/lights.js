// Textures utilisées par le système d'éclairage : le halo radial qu'on estampe
// pour chaque source, la flamme et le sconce d'une torche, et le voile de
// vignette. Toutes dessinées au Canvas 2D à la génération.
//
// Le halo est BLANC : les couleurs (chaud, froid, magique) sont appliquées via
// setTint sur le stamp au moment du dessin. Une seule texture pour toutes les
// lumières du jeu.

export function makeLightTexture(scene, key = 'lightRadial') {
  if (scene.textures.exists(key)) return;
  const size = 256;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  // Falloff quadratique : centre franc, bord doux — sans quoi les lumières
  // se voient comme des disques nets sur le masque MULTIPLY.
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

// Flamme d'une torche : goutte inversée, dégradé jaune-blanc chaud vers orange.
export function makeFlameTexture(scene, key = 'flame') {
  if (scene.textures.exists(key)) return;
  const w = 16;
  const h = 24;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();

  // silhouette : goutte pointe vers le haut
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.bezierCurveTo(w * 0.95, h * 0.35, w * 0.9, h * 0.85, w / 2, h - 1);
  ctx.bezierCurveTo(w * 0.1, h * 0.85, w * 0.05, h * 0.35, w / 2, 0);
  ctx.closePath();

  const g = ctx.createRadialGradient(w / 2, h * 0.75, 1, w / 2, h * 0.55, h * 0.6);
  g.addColorStop(0, 'rgba(255,246,190,1)');
  g.addColorStop(0.5, 'rgba(255,168,74,0.9)');
  g.addColorStop(1, 'rgba(120,40,0,0)');
  ctx.fillStyle = g;
  ctx.fill();
  tex.refresh();
}

// Sconce : le petit bol de fer accroché au mur qui porte la flamme.
export function makeSconceTexture(scene, key = 'sconce') {
  if (scene.textures.exists(key)) return;
  const w = 18;
  const h = 12;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();

  // fixation au mur
  ctx.fillStyle = '#242428';
  ctx.fillRect(w / 2 - 1.5, 0, 3, 4);

  // bol : demi-cercle vers le bas
  ctx.beginPath();
  ctx.moveTo(1, 3);
  ctx.quadraticCurveTo(w / 2, h + 3, w - 1, 3);
  ctx.closePath();
  ctx.fillStyle = '#2a2a30';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // liseré supérieur : reflet du bord du bol
  ctx.strokeStyle = 'rgba(190,190,210,0.55)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(1, 3);
  ctx.lineTo(w - 1, 3);
  ctx.stroke();

  tex.refresh();
}

// Vignette écran : voile radial sombre transparent au centre, noir aux coins.
// Le rayon transparent est large pour que la zone jouable ne perde pas de détail.
export function makeVignetteTexture(scene, key = 'vignette') {
  if (scene.textures.exists(key)) return;
  const size = 512;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, size * 0.32, c, c, size * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}
