import Phaser from 'phaser';
import { PORTAL } from '../config.js';
import Particles from '../combat/Particles.js';

// Portail : un anneau tourbillonnant avec son timer. Les deux portails d'un même
// joueur (A et B) sont liés entre eux — entrer dans l'un fait sortir par l'autre.
//
// Le tourbillon est animé dans update(delta) plutôt qu'avec un tween : les tweens
// de Phaser avancent au temps réel (Date.now()), ce qui les rend intestables et
// les désynchroniserait d'une simulation serveur en Phase 5.
export default class Portal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, owner, slot, color) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(340);

    this.owner = owner;
    this.slot = slot; // 'A' ou 'B'
    this.color = color;
    this.expiresAt = scene.time.now + PORTAL.lifetime;
    this.link = null; // portail partenaire

    // anneau extérieur
    this.ring = scene.add.image(0, 0, 'portal').setTint(color);
    this.add(this.ring);

    // spirale intérieure (tourne en sens inverse)
    this.swirl = scene.add.image(0, 0, 'portalSwirl').setTint(color).setScale(0.72);
    this.add(this.swirl);

    this.letter = scene.add
      .text(0, 0, slot, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add(this.letter);

    this.timerText = scene.add
      .text(0, -PORTAL.radius - 14, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#c9c2d4',
      })
      .setOrigin(0.5);
    this.add(this.timerText);

    // apparition
    this.setScale(0.2);
    this.spawnProgress = 0;

    // Lumière propre au portail : intensifiée quand la paire est active.
    if (scene.lighting) {
      this.light = scene.lighting.addLight(x, y, PORTAL.radius * 3.2, color, 0.75);
    }

    // Wisps qui orbitent sur le bord de l'anneau. Emitter fixe en world-space
    // (le portail ne se déplace pas), on ne le rattache pas au container.
    this.wisps = Particles.wisps(scene, x, y, PORTAL.radius - 3, color);

    this.once('destroy', () => {
      if (scene.lighting && this.light) scene.lighting.removeLight(this.light);
      if (this.wisps) {
        const w = this.wisps;
        this.wisps = null;
        w.stop();
        scene.time.delayedCall(900, () => w.destroy());
      }
    });
  }

  get remaining() {
    return Math.max(0, this.expiresAt - this.scene.time.now);
  }

  get isExpired() {
    return this.scene.time.now >= this.expiresAt;
  }

  // Un portail n'est utilisable que s'il a un partenaire encore vivant.
  get isLinked() {
    return !!(this.link && this.link.active);
  }

  update(delta) {
    this.ring.rotation += 0.0016 * delta;
    this.swirl.rotation -= 0.0029 * delta;

    // animation d'apparition
    if (this.spawnProgress < 1) {
      this.spawnProgress = Math.min(1, this.spawnProgress + delta / 260);
      const e = Phaser.Math.Easing.Back.Out(this.spawnProgress);
      this.setScale(0.2 + 0.8 * e);
    }

    const secs = this.remaining / 1000;
    this.timerText.setText(secs >= 1 ? `${Math.ceil(secs)}s` : '');

    // clignote dans les 5 dernières secondes
    if (secs < 5) {
      const blink = 0.45 + 0.55 * Math.abs(Math.sin(this.scene.time.now / 130));
      this.ring.setAlpha(blink);
      this.swirl.setAlpha(blink);
    }

    // un portail sans partenaire est inerte : on le montre en grisé
    const inert = !this.isLinked;
    this.letter.setAlpha(inert ? 0.35 : 1);
    this.swirl.setVisible(!inert);

    if (this.light) {
      // pulsation légère quand actif, à peine visible quand inerte
      const pulse = 0.85 + 0.15 * Math.sin(this.scene.time.now / 220);
      this.light.intensity = inert ? 0.35 : 0.9 * pulse;
    }
    // wisps invisibles quand le portail est inerte
    if (this.wisps) this.wisps.setVisible(!inert);
  }
}
