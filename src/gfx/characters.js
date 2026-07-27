// Sprites de personnages, dessinés au Canvas 2D à la génération.
//
// Vue du dessus stricte, orientés vers la droite (angle 0) : le jeu fait pivoter
// le sprite en continu vers la souris, donc la silhouette doit rester lisible
// sous n'importe quel angle. C'est précisément ce que les packs pixel art
// gratuits ne permettent pas — ils sont dessinés de profil ou en 8 directions.
//
// Ce qu'on voit d'en haut : les épaules, le sommet du crâne ou la capuche, et
// l'arme tenue sur le côté.

const SIZE = 64;
const CX = SIZE / 2;
const CY = SIZE / 2;

const STEEL = '#b9b4c4';
const STEEL_DARK = '#6c6878';
const LEATHER = '#5a4634';
const SHADOW = 'rgba(0,0,0,0.55)';

// Éclaircit ou assombrit une couleur hexadécimale.
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = cl(((n >> 16) & 255) * (1 + amount));
  const g = cl(((n >> 8) & 255) * (1 + amount));
  const b = cl((n & 255) * (1 + amount));
  return `rgb(${r},${g},${b})`;
}

function ellipse(ctx, x, y, rx, ry, rot, fill, stroke, lw = 1.5) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

// Cape, en éventail derrière le personnage.
function drawCloak(ctx, color, { width = 16, length = 20 } = {}) {
  const grad = ctx.createLinearGradient(CX - length, CY, CX + 6, CY);
  grad.addColorStop(0, shade(color, -0.72));
  grad.addColorStop(1, shade(color, -0.42));
  ctx.beginPath();
  ctx.moveTo(CX + 2, CY - width);
  ctx.quadraticCurveTo(CX - length, CY - width - 4, CX - length - 3, CY);
  ctx.quadraticCurveTo(CX - length, CY + width + 4, CX + 2, CY + width);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Corps d'un seul tenant : épaules intégrées au tracé du torse.
//
// Les versions précédentes empilaient torse, tête et épaules en ellipses
// séparées de tailles voisines — ça se lisait comme un tas de cercles. Ici tout
// le buste est UN seul chemin, avec un contour sombre unique : la silhouette
// se lit d'un bloc, même à trente pixels.
function drawBody(ctx, color, { shoulder = 13, waist = 9, front = 18, back = 13 } = {}) {
  ctx.beginPath();
  ctx.moveTo(CX + front, CY); // pointe avant
  // flanc gauche : rétrécit vers l'avant, s'élargit à l'épaule
  ctx.bezierCurveTo(CX + front - 4, CY - waist, CX + 6, CY - shoulder, CX - 1, CY - shoulder);
  ctx.bezierCurveTo(CX - 7, CY - shoulder, CX - back, CY - shoulder + 3, CX - back - 1, CY);
  // flanc droit, symétrique
  ctx.bezierCurveTo(CX - back, CY + shoulder - 3, CX - 7, CY + shoulder, CX - 1, CY + shoulder);
  ctx.bezierCurveTo(CX + 6, CY + shoulder, CX + front - 4, CY + waist, CX + front, CY);
  ctx.closePath();

  // lumière rasante depuis l'avant-gauche, ombre à l'arrière-droit
  const grad = ctx.createLinearGradient(CX + front, CY - shoulder, CX - back, CY + shoulder);
  grad.addColorStop(0, shade(color, 0.5));
  grad.addColorStop(0.5, shade(color, -0.02));
  grad.addColorStop(1, shade(color, -0.55));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.78)';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Tête : petite, dans les teintes du costume et non en gris neutre, posée à
// l'avant. Une capuche est un simple capuchon plus sombre par-dessus.
function drawHead(ctx, color, { hood = false, r = 5.2, metal = false } = {}) {
  const hx = CX + 6;

  // Vue du dessus, le crâne est la surface la plus proche de la lumière : il
  // doit ressortir CLAIR sur le buste. Les versions précédentes l'assombrissaient
  // et il se lisait comme un trou au milieu du sprite.
  const base = metal ? STEEL : shade(color, 0.35);

  const grad = ctx.createRadialGradient(hx + 1.6, CY - 1.8, 0.4, hx, CY, r + 1.5);
  grad.addColorStop(0, shade(base, 0.35));
  grad.addColorStop(0.7, base);
  grad.addColorStop(1, shade(base, -0.4));
  ellipse(ctx, hx, CY, r, r, 0, grad, 'rgba(0,0,0,0.8)', 1.6);

  if (hood) {
    // liseré de capuche : un croissant fin à l'arrière, pas un aplat
    ctx.beginPath();
    ctx.arc(hx, CY, r + 1.4, Math.PI * 0.55, Math.PI * 1.45);
    ctx.strokeStyle = shade(color, -0.5);
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
}

// Lame effilée pointant vers +X, dessinée depuis son manche.
function blade(ctx, len, halfW, light = '#eceaf2') {
  const g = ctx.createLinearGradient(0, -halfW, len, halfW);
  g.addColorStop(0, light);
  g.addColorStop(0.6, STEEL);
  g.addColorStop(1, STEEL_DARK);
  ctx.beginPath();
  ctx.moveTo(0, -halfW);
  ctx.lineTo(len - 4, -halfW * 0.7);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 4, halfW * 0.7);
  ctx.lineTo(0, halfW);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

const PAINTERS = {
  warrior(ctx, color) {
    drawCloak(ctx, color, { width: 15, length: 17 });

    // grand bouclier, à gauche, débordant vers l'avant
    ctx.save();
    ctx.translate(CX + 3, CY - 14);
    ellipse(ctx, 0, 0, 9.5, 8, -0.25, STEEL_DARK, 'rgba(0,0,0,0.75)', 2);
    ellipse(ctx, -0.5, -1, 5.5, 4.5, -0.25, shade(color, -0.1));
    ellipse(ctx, -0.5, -1, 2, 2, 0, STEEL);
    ctx.restore();

    // épée à droite, pointe bien devant la silhouette
    ctx.save();
    ctx.translate(CX + 8, CY + 13);
    ctx.rotate(-0.28);
    ctx.fillStyle = LEATHER;
    ctx.fillRect(-6, -2.5, 6, 5);
    ctx.fillStyle = shade(color, 0.1);
    ctx.fillRect(0, -4, 3, 8); // garde
    ctx.translate(3, 0);
    blade(ctx, 22, 2.8);
    ctx.restore();

    drawBody(ctx, color, { shoulder: 14, waist: 9, front: 19, back: 13 });

    // heaume d'acier à crête colorée
    drawHead(ctx, color, { r: 6, metal: true });
    ctx.beginPath();
    ctx.moveTo(CX + 2, CY);
    ctx.lineTo(CX + 11, CY);
    ctx.strokeStyle = shade(color, 0.25);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  mage(ctx, color) {
    drawCloak(ctx, color, { width: 17, length: 21 });
    drawBody(ctx, color, { shoulder: 12.5, waist: 8, front: 18, back: 14 });

    // bâton tenu en travers, orbe devant
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(-0.62);
    ctx.strokeStyle = '#6b4f2e';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 13);
    ctx.lineTo(13, -9);
    ctx.stroke();
    ctx.restore();

    drawHead(ctx, color, { hood: true, r: 6 });

    const ox = CX + 17;
    const oy = CY - 13;
    const glow = ctx.createRadialGradient(ox, oy, 0.5, ox, oy, 11);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(0.3, shade(color, 0.6));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ellipse(ctx, ox, oy, 11, 11, 0, glow);
  },

  archer(ctx, color) {
    drawCloak(ctx, color, { width: 13, length: 16 });

    // carquois en travers du dos
    ctx.save();
    ctx.translate(CX - 11, CY + 6);
    ctx.rotate(0.6);
    ctx.fillStyle = LEATHER;
    ctx.fillRect(-4, -3.5, 12, 7);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -3.5, 12, 7);
    ctx.fillStyle = '#d8c89a';
    [-2, 0.4, 2.8].forEach((o) => ctx.fillRect(6, o - 0.8, 5, 1.6));
    ctx.restore();

    drawBody(ctx, color, { shoulder: 12, waist: 7.5, front: 18, back: 12 });

    // arc tenu bras tendu : grand arc devant, corde tendue
    ctx.save();
    ctx.translate(CX + 13, CY);
    ctx.strokeStyle = '#8a6531';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 15, -1.25, 1.25);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,236,224,0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-1.25) * 15, Math.sin(-1.25) * 15);
    ctx.lineTo(Math.cos(1.25) * 15, Math.sin(1.25) * 15);
    ctx.stroke();
    ctx.restore();

    drawHead(ctx, color, { hood: true, r: 5.8 });
  },

  assassin(ctx, color) {
    // écharpe, derrière
    ctx.beginPath();
    ctx.moveTo(CX - 8, CY - 2);
    ctx.quadraticCurveTo(CX - 19, CY - 9, CX - 25, CY - 1);
    ctx.strokeStyle = shade(color, -0.05);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    drawCloak(ctx, color, { width: 11, length: 13 });
    drawBody(ctx, color, { shoulder: 10.5, waist: 7, front: 17, back: 11 });

    // deux dagues croisées vers l'avant
    [-1, 1].forEach((s) => {
      ctx.save();
      ctx.translate(CX + 9, CY + 10 * s);
      ctx.rotate(-0.3 * s);
      ctx.fillStyle = LEATHER;
      ctx.fillRect(-5, -2, 5, 4);
      blade(ctx, 14, 2.4, '#f2f0f7');
      ctx.restore();
    });

    drawHead(ctx, color, { hood: true, r: 5.6 });
  },
};

// Dessine un personnage dans une texture canvas Phaser.
export function makeCharacterTexture(scene, key, classDef, hostile) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, SIZE, SIZE);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Halo rouge des adversaires : posé sous la silhouette, il se lit sans
  // masquer les détails du personnage.
  if (hostile) {
    const ring = ctx.createRadialGradient(CX, CY, 15, CX, CY, 30);
    ring.addColorStop(0, 'rgba(196,74,74,0)');
    ring.addColorStop(0.55, 'rgba(196,74,74,0.5)');
    ring.addColorStop(1, 'rgba(196,74,74,0)');
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  ctx.save();
  ctx.shadowColor = SHADOW;
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;
  (PAINTERS[classDef.id] || PAINTERS.warrior)(ctx, `#${classDef.color.toString(16).padStart(6, '0')}`);
  ctx.restore();

  tex.refresh();
}

// Ombre portée au sol, dessinée sous l'acteur. Séparée du sprite : elle ne doit
// pas tourner avec lui.
export function makeShadowTexture(scene, key = 'actorShadow') {
  if (scene.textures.exists(key)) return;
  const s = 44;
  const tex = scene.textures.createCanvas(key, s, s);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(s / 2, s / 2, 1, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  tex.refresh();
}
