import Phaser from 'phaser';
import Actor from './Actor.js';
import MeleeAttack from '../combat/MeleeAttack.js';
import { WEAPONS } from '../config.js';
import { getBinding } from '../systems/Keybindings.js';

// Player : une seule implémentation, pilotée par une définition de classe
// (voir src/classes/). Les stats, l'attaque, le spécial et le passif viennent
// tous de `classDef`.
export default class Player extends Actor {
  constructor(scene, x, y, combat, classDef) {
    super(scene, x, y, `player_${classDef.id}`, {
      maxHp: classDef.stats.maxHp,
      team: 'blue',
    });

    this.combat = combat;
    this.classDef = classDef;
    this.isPlayerControlled = true; // les bots le ciblent en priorité

    const { stats, passive } = classDef;
    this.speed = stats.speed;
    this.maxMana = stats.maxMana;
    this.mana = stats.maxMana;
    this.manaRegen = stats.manaRegen;

    // Passifs appliqués une fois à la création
    this.damageReduction = passive.damageReduction || 0;

    this.cooldowns = { attack: 0, special: 0, shield: 0 };

    // Bindings dynamiques : lus depuis le module Keybindings au moment de la
    // création du joueur. Les changer dans le menu prend effet au prochain
    // spawn (retour au menu → replay).
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      up: KC[getBinding('moveUp')],
      down: KC[getBinding('moveDown')],
      left: KC[getBinding('moveLeft')],
      right: KC[getBinding('moveRight')],
      special: KC[getBinding('special')],
      shield: KC[getBinding('shield')],
      portalA: KC[getBinding('portalA')],
      portalB: KC[getBinding('portalB')],
    });

    scene.input.mouse.disableContextMenu();
    this.onPointerDown = (pointer) => {
      if (this.isDead) return;
      if (pointer.leftButtonDown()) this.tryAttack();
      else if (pointer.rightButtonDown()) this.trySpecial();
    };
    scene.input.on('pointerdown', this.onPointerDown);
    this.once('destroy', () => scene.input.off('pointerdown', this.onPointerDown));
  }

  ready(key) {
    return this.scene.time.now >= this.cooldowns[key];
  }

  canAfford(spec) {
    return this.mana >= (spec.manaCost || 0);
  }

  spend(key, spec) {
    this.cooldowns[key] = this.scene.time.now + spec.cooldown;
    if (spec.manaCost) this.mana = Math.max(0, this.mana - spec.manaCost);
  }

  // Position de la souris en coordonnées monde
  pointerWorld() {
    return this.scene.input.activePointer.positionToCamera(this.scene.cameras.main);
  }

  // --- Attaque principale (dépend du type défini par la classe) ---
  tryAttack() {
    const spec = this.classDef.attack;
    if (!this.ready('attack') || !this.canAfford(spec)) return false;
    this.spend('attack', spec);

    // attaquer révèle l'assassin
    this.breakInvisibility();

    if (spec.type === 'melee') this.resolveMelee(spec);
    else this.combat.fireProjectile(this, this.rotation, spec, spec.projectile);
    return true;
  }

  resolveMelee(spec) {
    MeleeAttack.showSwing(this.scene, this, this.rotation, spec);
    const hits = MeleeAttack.resolve(this, this.rotation, spec, this.combat.liveActors);

    hits.forEach((t) => {
      let dmg = spec.damage;
      if (this.isBackstab(t)) dmg *= this.classDef.passive.backstabMultiplier;
      t.takeDamage(dmg, this, spec.knockback);
      MeleeAttack.hitSparks(this.scene, this, t);
    });
  }

  // Passif Assassin : la cible est-elle frappée par derrière ?
  isBackstab(target) {
    const { backstabMultiplier, backstabAngle } = this.classDef.passive;
    if (!backstabMultiplier) return false;

    // angle depuis la cible vers l'attaquant, comparé à l'orientation de la cible
    const toAttacker = Phaser.Math.Angle.Between(target.x, target.y, this.x, this.y);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(toAttacker - target.rotation));
    return diff > Math.PI - backstabAngle / 2;
  }

  // --- Capacité spéciale de la classe ---
  trySpecial() {
    const spec = this.classDef.special;
    if (!this.ready('special') || !this.canAfford(spec)) return false;
    this.spend('special', spec);

    spec.execute(this, {
      scene: this.scene,
      combat: this.combat,
      angle: this.rotation,
      pointer: this.pointerWorld(),
    });
    return true;
  }

  // --- Bouclier : utilitaire commun à toutes les classes ---
  tryShield() {
    const spec = WEAPONS.shield;
    if (!this.ready('shield') || !this.canAfford(spec)) return false;
    this.spend('shield', spec);
    this.combat.castShield(this);
    return true;
  }

  placePortal(slot) {
    return this.scene.portals.place(this, slot);
  }

  update(time, delta) {
    if (this.isDead) return;

    this.mana = Math.min(this.maxMana, this.mana + (this.manaRegen * delta) / 1000);

    // Le dash du Guerrier pilote la vélocité : on ne l'écrase pas.
    if (!this.isDashing) {
      const k = this.keys;
      let vx = 0;
      let vy = 0;
      if (k.left.isDown) vx -= 1;
      if (k.right.isDown) vx += 1;
      if (k.up.isDown) vy -= 1;
      if (k.down.isDown) vy += 1;

      const len = Math.hypot(vx, vy);
      if (len > 0) {
        vx = (vx / len) * this.speed;
        vy = (vy / len) * this.speed;
      }
      this.setVelocity(vx, vy);
    }

    const world = this.pointerWorld();
    this.rotation = Phaser.Math.Angle.Between(this.x, this.y, world.x, world.y);

    if (Phaser.Input.Keyboard.JustDown(this.keys.special)) this.trySpecial();
    if (Phaser.Input.Keyboard.JustDown(this.keys.shield)) this.tryShield();
    if (Phaser.Input.Keyboard.JustDown(this.keys.portalA)) this.placePortal('A');
    if (Phaser.Input.Keyboard.JustDown(this.keys.portalB)) this.placePortal('B');
  }
}
