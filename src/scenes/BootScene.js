import Phaser from 'phaser';
import { COLORS, PORTAL } from '../config.js';
import { CLASSES } from '../classes/index.js';
import { makeCharacterTexture, makeShadowTexture } from '../gfx/characters.js';
import {
  makeLightTexture,
  makeFlameTexture,
  makeSconceTexture,
  makeVignetteTexture,
} from '../gfx/lights.js';
import {
  makeSpeckTexture,
  makeSmokeTexture,
  makeBloodTexture,
} from '../gfx/particles.js';

// BootScene : charge les tuiles de donjon (CC0) et dessine tout le reste au
// Canvas 2D — personnages, portails, projectiles.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  // Tuiles de donjon téléchargées (CC0, Screaming Brain Studios). Chemins
  // relatifs : le site est servi depuis un sous-dossier.
  preload() {
    this.load.spritesheet('floorSheet', 'assets/tiles/floor-stone.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('wallSheet', 'assets/tiles/wall-stone.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    // Deux sprites par classe : le tien, et la version hostile cerclée de rouge.
    // Les bots jouent les mêmes classes que toi, il faut pouvoir les distinguer
    // d'un coup d'œil au milieu de la mêlée.
    CLASSES.forEach((c) => {
      makeCharacterTexture(this, `player_${c.id}`, c, false);
      makeCharacterTexture(this, `enemy_${c.id}`, c, true);
    });
    makeShadowTexture(this);
    // Éclairage : halo radial, flamme, sconce, vignette écran
    makeLightTexture(this);
    makeFlameTexture(this);
    makeSconceTexture(this);
    makeVignetteTexture(this);
    // Particules : étincelles, fumée, sang
    makeSpeckTexture(this);
    makeSmokeTexture(this);
    makeBloodTexture(this);
    this.makePortalTextures();
    this.makeArrowTexture('arrow');
    this.makeOrbTexture('fireball', COLORS.fireball, 9);
    this.makeOrbTexture('spark', 0xffd08a, 4);

    this.scene.start('MenuScene');
  }

  // Flèche : petit trait effilé pointant vers la droite (angle 0)
  makeArrowTexture(key) {
    const w = 22;
    const h = 8;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(COLORS.arrow, 1);
    g.fillRect(0, h / 2 - 1, w - 6, 2);
    g.fillTriangle(w - 8, 0, w - 8, h, w, h / 2);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // Orbe lumineux (boule de feu, particules) : dégradé simulé par cercles
  makeOrbTexture(key, color, radius) {
    const size = radius * 2 + 6;
    const c = size / 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 0.25);
    g.fillCircle(c, c, radius + 3);
    g.fillStyle(color, 1);
    g.fillCircle(c, c, radius);
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(c, c, Math.max(1, radius * 0.4));
    g.generateTexture(key, size, size);
    g.destroy();
  }

  // Portail : un anneau + une spirale, générés en blanc pour être teintés
  // à la couleur du propriétaire.
  makePortalTextures() {
    const r = PORTAL.radius;
    const size = r * 2 + 6;
    const c = size / 2;

    const ring = this.make.graphics({ x: 0, y: 0, add: false });
    ring.lineStyle(4, 0xffffff, 1);
    ring.strokeCircle(c, c, r);
    ring.lineStyle(2, 0xffffff, 0.45);
    ring.strokeCircle(c, c, r - 6);
    // encoches sur l'anneau, pour rendre la rotation lisible
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ring.lineStyle(3, 0xffffff, 0.9);
      ring.beginPath();
      ring.moveTo(c + Math.cos(a) * (r - 3), c + Math.sin(a) * (r - 3));
      ring.lineTo(c + Math.cos(a) * (r + 3), c + Math.sin(a) * (r + 3));
      ring.strokePath();
    }
    ring.generateTexture('portal', size, size);
    ring.destroy();

    // spirale : trois bras incurvés
    const swirl = this.make.graphics({ x: 0, y: 0, add: false });
    for (let arm = 0; arm < 3; arm += 1) {
      const base = (arm / 3) * Math.PI * 2;
      swirl.lineStyle(3, 0xffffff, 0.75);
      swirl.beginPath();
      for (let t = 0; t <= 1; t += 0.08) {
        const a = base + t * 2.2;
        const rad = t * (r - 4);
        const px = c + Math.cos(a) * rad;
        const py = c + Math.sin(a) * rad;
        if (t === 0) swirl.moveTo(px, py);
        else swirl.lineTo(px, py);
      }
      swirl.strokePath();
    }
    swirl.generateTexture('portalSwirl', size, size);
    swirl.destroy();
  }

}
