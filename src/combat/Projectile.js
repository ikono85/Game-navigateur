import Phaser from 'phaser';
import Particles from './Particles.js';

// Plafond du pas d'intégration (~3 frames à 60 fps).
const MAX_STEP_MS = 50;

// Projectile générique (flèche, boule de feu). Se détruit au contact d'un mur,
// d'une cible ennemie, ou une fois sa portée max parcourue.
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  // (Re)lance le projectile depuis un tireur vers un angle donné.
  fire(owner, angle, spec, textureKey) {
    this.setTexture(textureKey);
    this.owner = owner;
    this.spec = spec;
    this.damage = spec.damage;
    this.maxRange = spec.maxRange;
    this.traveled = 0;
    this.team = owner.team;

    // Les projectiles à zone (boule de feu) et étincelles émettent une lumière
    // qui les suit. Les flèches non — leur trace n'a pas besoin d'éclat.
    if (this.scene.lighting && (spec.aoeRadius || textureKey === 'fireball')) {
      this.light = this.scene.lighting.attach(this, {
        radius: 150,
        color: 0xff9a48,
        intensity: 1,
      });
    }

    // Traînée de braises pour la boule de feu. L'emitter suit le projectile
    // et sera stoppé dans kill() pour laisser les braises finir leur vie.
    if (spec.aoeRadius || textureKey === 'fireball') {
      this.trail = Particles.embers(this.scene, this);
    }

    // part légèrement devant le tireur pour ne pas se toucher soi-même
    const offset = 22;
    this.enableBody(
      true,
      owner.x + Math.cos(angle) * offset,
      owner.y + Math.sin(angle) * offset,
      true,
      true,
    );
    // Hitbox circulaire centrée sur la texture : l'offset doit compenser la
    // différence entre la taille du frame et le diamètre du cercle, sinon la
    // hitbox se retrouve décalée vers le coin haut-gauche.
    const fw = this.frame.realWidth;
    const fh = this.frame.realHeight;
    this.body.setCircle(spec.radius, fw / 2 - spec.radius, fh / 2 - spec.radius);
    this.body.setAllowGravity(false);
    this.setVelocity(Math.cos(angle) * spec.speed, Math.sin(angle) * spec.speed);
    this.rotation = angle;
    return this;
  }

  kill() {
    if (!this.active) return;
    if (this.light && this.scene.lighting) {
      this.scene.lighting.removeLight(this.light);
      this.light = null;
    }
    if (this.trail) {
      // stop() coupe l'émission mais laisse les particules déjà nées finir. On
      // détruit l'emitter après la durée de vie max des particules.
      const trail = this.trail;
      this.trail = null;
      trail.stop();
      this.scene.time.delayedCall(500, () => trail.destroy());
    }
    this.disableBody(true, true);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    // Portée max. Le delta est borné : après un alt-tab ou un pic de lag, Phaser
    // livre une frame de plusieurs secondes, et sans ce plafond le projectile
    // consommerait toute sa portée d'un coup et disparaîtrait sur place.
    const step = (this.body.speed * Math.min(delta, MAX_STEP_MS)) / 1000;
    this.traveled += step;
    if (this.traveled >= this.maxRange) this.kill();
  }
}
