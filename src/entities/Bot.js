import Phaser from 'phaser';
import Actor from './Actor.js';
import MeleeAttack from '../combat/MeleeAttack.js';
import { BOT_STATS } from '../config.js';

// Bot : joue une des quatre classes, exactement comme le joueur.
//
// Il lit la même définition de classe (stats, attaque, spécial, passif) et
// n'ajoute qu'une chose : décider quoi faire. Un bot Mage tient donc ses
// distances et lâche sa Nova de près, là où un bot Assassin fonce et disparaît
// quand il est bas — sans une ligne de code spécifique ici, les préférences
// vivent dans src/classes/.
//
// Chaque bot a son propre camp : ils se battent aussi entre eux.
export default class Bot extends Actor {
  constructor(scene, x, y, combat, classDef, team) {
    super(scene, x, y, `enemy_${classDef.id}`, {
      maxHp: classDef.stats.maxHp,
      team,
    });

    this.combat = combat;
    this.classDef = classDef;

    const { stats, passive } = classDef;
    this.speed = stats.speed * BOT_STATS.speedFactor;
    this.maxMana = stats.maxMana;
    this.mana = stats.maxMana;
    this.manaRegen = stats.manaRegen;
    this.damageReduction = passive.damageReduction || 0;

    this.cooldowns = { attack: 0, special: 0 };
    this.state = 'IDLE';
    this.target = null;
    this.nextTargetScanAt = 0;
    this.nextWanderAt = 0;
    this.wanderAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // sens de contournement, réévalué régulièrement pour éviter le va-et-vient
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.nextStrafeFlipAt = 0;
  }

  get isRanged() {
    return this.classDef.attack.type === 'projectile';
  }

  // Ligne de vue vers une cible. Les scènes sans murs (fond de menu) ne
  // fournissent pas hasLineOfSight : dans ce cas tout est visible.
  canSee(target) {
    if (typeof this.scene.hasLineOfSight !== 'function') return true;
    return this.scene.hasLineOfSight(this.x, this.y, target.x, target.y);
  }

  // Cible la plus proche, tous camps adverses confondus. Un ennemi invisible
  // est ignoré : c'est tout l'intérêt de l'Assassin.
  pickTarget() {
    let best = null;
    let bestDist = BOT_STATS.aggroRange;

    this.combat.liveActors.forEach((a) => {
      if (a === this || a.team === this.team || a.isInvisible) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
      // distance pondérée : le joueur attire davantage l'attention
      const weighted = a.isPlayerControlled ? d * BOT_STATS.playerBias : d;
      if (weighted >= bestDist) return;
      // on ne cible pas un ennemi derrière un mur : plus de chasse ni de tir à
      // l'aveugle contre une cible invisible pour le bot.
      if (!this.canSee(a)) return;
      bestDist = weighted;
      best = a;
    });
    return best;
  }

  update(time, delta) {
    if (this.isDead || !this.active) return;

    this.mana = Math.min(this.maxMana, this.mana + (this.manaRegen * delta) / 1000);

    // on ne rebalaye pas les cibles à chaque frame
    if (time >= this.nextTargetScanAt) {
      this.nextTargetScanAt = time + BOT_STATS.targetScanInterval;
      this.target = this.pickTarget();
    }

    const t = this.target;
    const valid = t && t.active && !t.isDead && !t.isInvisible;
    if (!valid) {
      this.target = null;
      this.wander(time);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, t.x, t.y);
    this.rotation = angle;

    const band = this.classDef.bot.preferredRange;
    this.move(time, angle, dist, band);

    if (time >= this.nextStrafeFlipAt) {
      this.nextStrafeFlipAt = time + Phaser.Math.Between(1100, 2600);
      this.strafeDir *= -1;
    }

    this.trySpecial(dist);
    this.tryAttack(time, angle, dist);
  }

  // Se replace par rapport à sa distance de confort : trop loin on avance,
  // trop près on recule, et dans la bonne zone on contourne.
  move(time, angle, dist, band) {
    let vx = 0;
    let vy = 0;

    if (dist > band * 1.15) {
      this.state = 'CHASE';
      vx = Math.cos(angle) * this.speed;
      vy = Math.sin(angle) * this.speed;
    } else if (this.isRanged && dist < band * 0.6) {
      this.state = 'KITE';
      vx = -Math.cos(angle) * this.speed;
      vy = -Math.sin(angle) * this.speed;
    } else {
      this.state = 'STRAFE';
      const side = angle + (Math.PI / 2) * this.strafeDir;
      vx = Math.cos(side) * this.speed * 0.62;
      vy = Math.sin(side) * this.speed * 0.62;
    }

    this.setVelocity(vx, vy);
  }

  tryAttack(time, angle, dist) {
    const spec = this.classDef.attack;
    if (time < this.cooldowns.attack) return;

    // portée utile : l'arc pour la mêlée, la portée max pour un projectile
    const reach = spec.type === 'melee' ? spec.range : spec.maxRange;
    if (dist > reach) return;
    if (this.mana < (spec.manaCost || 0)) return;
    // pas de tir à travers un mur si la cible s'est déplacée à couvert depuis le
    // dernier balayage de cibles
    if (this.target && !this.canSee(this.target)) return;

    this.cooldowns.attack = time + spec.cooldown * BOT_STATS.cooldownFactor;
    if (spec.manaCost) this.mana -= spec.manaCost;
    this.breakInvisibility();

    // les bots frappent moins fort que le joueur : affronter trois classes
    // complètes à pleine puissance est intenable
    const damage = spec.damage * BOT_STATS.damageFactor;

    if (spec.type === 'melee') {
      MeleeAttack.showSwing(this.scene, this, angle, spec);
      MeleeAttack.resolve(this, angle, spec, this.combat.liveActors).forEach((h) => {
        h.takeDamage(damage, this, spec.knockback);
        MeleeAttack.hitSparks(this.scene, this, h);
      });
    } else {
      this.combat.fireProjectile(this, angle, { ...spec, damage }, spec.projectile);
    }
  }

  trySpecial(dist) {
    const spec = this.classDef.special;
    const now = this.scene.time.now;
    if (now < this.cooldowns.special) return;
    if (this.mana < (spec.manaCost || 0)) return;
    if (!this.classDef.bot.useSpecial(dist, this)) return;

    this.cooldowns.special = now + spec.cooldown;
    if (spec.manaCost) this.mana -= spec.manaCost;

    spec.execute(this, {
      scene: this.scene,
      combat: this.combat,
      angle: this.rotation,
      // les sorts ciblés (Pluie de flèches) visent la position de la cible
      pointer: this.target ? { x: this.target.x, y: this.target.y } : { x: this.x, y: this.y },
    });
  }

  wander(time) {
    this.state = 'IDLE';
    if (time >= this.nextWanderAt) {
      this.nextWanderAt = time + Phaser.Math.Between(900, 2200);
      this.wanderAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    }
    const slow = this.speed * 0.35;
    this.setVelocity(Math.cos(this.wanderAngle) * slow, Math.sin(this.wanderAngle) * slow);
    this.rotation = this.wanderAngle;
  }
}
