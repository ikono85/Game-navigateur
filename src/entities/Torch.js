import Phaser from 'phaser';

// Torche murale : un sconce en fer, une flamme animée, et une lumière chaude qui
// vacille. Le vacillement combine deux sinus déphasés (bruit approché) pour
// éviter le tempo régulier d'un simple `sin(t)`.
//
// Le sprite de flamme est en blend ADD : posée sur le mur sombre, elle
// apparaît vraiment lumineuse au lieu de se lire comme une décalcomanie.
export default class Torch {
  constructor(scene, x, y, lighting, opts = {}) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.phase = Math.random() * Math.PI * 2;

    // La torche est légèrement au-dessus du sol de la tuile, sur le mur.
    const sconceY = y;
    const flameY = y - 8;

    this.sconce = scene.add.image(x, sconceY, 'sconce').setDepth(6);
    this.flame = scene.add
      .image(x, flameY, 'flame')
      .setDepth(7)
      .setOrigin(0.5, 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    const baseRadius = opts.radius || 170;
    const color = opts.color || 0xffaa60;
    this.light = lighting.addLight(x, flameY - 2, baseRadius, color, 1);
    this.baseRadius = baseRadius;

    this.onUpdate = (time) => this.update(time);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy(lighting));
  }

  update(time) {
    const t = time / 1000;
    // deux fréquences pour un vacillement irrégulier
    const flick =
      0.5 +
      0.3 * Math.sin(t * 8.7 + this.phase) +
      0.2 * Math.sin(t * 19.3 + this.phase * 1.7);

    // flamme : légèrement plus haute qu'étirée en largeur (respire vers le haut)
    this.flame.setScale(0.9 + 0.12 * flick, 0.85 + 0.22 * flick);
    this.flame.setAlpha(0.85 + 0.15 * flick);

    // lumière : rayon et intensité vibrent modérément
    this.light.radius = this.baseRadius * (0.92 + 0.13 * flick);
    this.light.intensity = 0.88 + 0.14 * flick;
  }

  destroy(lighting) {
    if (this._destroyed) return;
    this._destroyed = true;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    if (lighting) lighting.removeLight(this.light);
    if (this.sconce) this.sconce.destroy();
    if (this.flame) this.flame.destroy();
  }
}
