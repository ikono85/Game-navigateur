import Phaser from 'phaser';
import HealthBar from '../combat/HealthBar.js';
import Particles from '../combat/Particles.js';
import Sfx from '../systems/Sfx.js';

// Actor : base commune au joueur et aux bots. Gère PV, prise de dégâts,
// feedback visuel (flash rouge), recul, bouclier et mort.
export default class Actor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, { maxHp = 100, team = 'neutral' } = {}) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHp = maxHp;
    this.hp = maxHp;
    this.team = team;
    this.isDead = false;

    // Bouclier magique : réduit les dégâts tant que actif
    this.shieldUntil = 0;
    this.shieldReduction = 0;

    // Invisibilité (Assassin). Sur Actor et non sur Player : un bot Assassin
    // doit pouvoir disparaître, et sortir du radar des autres bots.
    this.invisibleUntil = 0;

    // Hitbox calculée depuis la taille réelle du sprite : elle reste centrée
    // même si l'art change de dimensions.
    const r = 16;
    this.setCircle(r, this.frame.realWidth / 2 - r, this.frame.realHeight / 2 - r);
    this.setCollideWorldBounds(true);
    this.setDepth(20);

    // Ombre au sol, posée sous l'acteur. Objet distinct du sprite : elle ne doit
    // pas pivoter avec lui.
    this.shadow = scene.add.image(x, y, 'actorShadow').setDepth(10).setAlpha(0.75);

    this.healthBar = new HealthBar(scene, this);
  }

  get hasShield() {
    return this.scene.time.now < this.shieldUntil;
  }

  get isInvisible() {
    return this.scene.time.now < this.invisibleUntil;
  }

  breakInvisibility() {
    if (!this.isInvisible) return;
    this.invisibleUntil = 0;
    this.setAlpha(1);
  }

  applyShield(duration, reduction) {
    this.shieldUntil = this.scene.time.now + duration;
    this.shieldReduction = reduction;
  }

  // Inflige des dégâts.
  //  - `from`         : l'auteur du coup, crédité de l'élimination (un acteur).
  //  - `knockback`    : intensité du recul.
  //  - `knockbackFrom`: origine géométrique du recul, distincte de `from` pour
  //    les dégâts de zone (le recul part du centre de l'explosion, mais le kill
  //    est crédité à l'attaquant qui se trouve ailleurs). Défaut = `from`.
  takeDamage(amount, from = null, knockback = 0, knockbackFrom = from) {
    if (this.isDead || !this.active) return;

    let dmg = amount;
    // passif de classe (ex. Peau de fer du Guerrier)
    if (this.damageReduction) dmg *= 1 - this.damageReduction;
    if (this.hasShield) dmg *= 1 - this.shieldReduction;

    this.hp = Math.max(0, this.hp - dmg);

    // Mémorise l'auteur du coup pour attribuer l'élimination. `from` est parfois
    // un simple point (centre d'une explosion) : on ne garde que les acteurs.
    if (from && from.team && from !== this) this.lastAttacker = from;

    // flash rouge
    this.setTintFill(0xff5555);
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.clearTint();
    });

    if (knockbackFrom && knockback > 0 && this.body) {
      const angle = Phaser.Math.Angle.Between(knockbackFrom.x, knockbackFrom.y, this.x, this.y);
      this.body.velocity.x += Math.cos(angle) * knockback;
      this.body.velocity.y += Math.sin(angle) * knockback;
    }

    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    // Quitte immédiatement la liste des acteurs vivants (cache) : évite qu'un
    // mort continue d'être ciblé ou touché dans la même frame.
    if (this.scene && this.scene.combat) this.scene.combat.invalidateLiveCache();
    if (this.body) this.body.enable = false;
    this.setVelocity(0, 0);

    // Gerbe de sang à la position du corps
    Particles.blood(this.scene, this.x, this.y);
    Sfx.death();

    // animation de mort : rétrécit + fond au noir
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.4,
      angle: this.angle + 180,
      duration: 420,
      ease: 'Quad.easeIn',
      onComplete: () => this.onDeathComplete(),
    });

    this.emit('died', this);
  }

  onDeathComplete() {
    this.healthBar.destroy();
    this.shadow.destroy();
    this.destroy();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.healthBar.update();
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 3);
      this.shadow.setAlpha(this.alpha * 0.75); // suit l'invisibilité et la mort
    }
  }
}
