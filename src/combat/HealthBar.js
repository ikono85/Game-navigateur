import Phaser from 'phaser';
import { COLORS } from '../config.js';

// Barre de vie flottante au-dessus d'un acteur. Dessinée en Graphics pour
// rester légère (pas de texture par acteur).
export default class HealthBar {
  constructor(scene, owner, { width = 40, height = 5, offsetY = 28 } = {}) {
    this.scene = scene;
    this.owner = owner;
    this.width = width;
    this.height = height;
    this.offsetY = offsetY;

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(500);
  }

  update() {
    const g = this.gfx;
    g.clear();

    if (!this.owner.active || this.owner.hp <= 0) return;

    const ratio = Phaser.Math.Clamp(this.owner.hp / this.owner.maxHp, 0, 1);
    const x = this.owner.x - this.width / 2;
    const y = this.owner.y - this.offsetY;

    // fond
    g.fillStyle(COLORS.barBack, 0.85);
    g.fillRect(x - 1, y - 1, this.width + 2, this.height + 2);
    // remplissage (vert → rouge sous 35%)
    g.fillStyle(ratio > 0.35 ? COLORS.hpFill : COLORS.hpLow, 1);
    g.fillRect(x, y, this.width * ratio, this.height);
  }

  destroy() {
    this.gfx.destroy();
  }
}
