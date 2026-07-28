import Projectile from './Projectile.js';
import Spell from './Spell.js';
import { WEAPONS } from '../config.js';

// CombatSystem : possède le pool de projectiles et câble toutes les collisions
// (projectile ↔ mur, projectile ↔ acteur). Centralise aussi le registre des
// acteurs pour les résolutions de zone / mélée.
export default class CombatSystem {
  constructor(scene, walls) {
    this.scene = scene;
    this.walls = walls;
    this.actors = [];
    // Cache de la liste des acteurs vivants : `liveActors` était re-filtré à
    // chaque accès (chaque frame par PortalSystem, chaque zone, chaque dash),
    // soit une allocation par frame qui nourrissait le GC. Invalidé dès que la
    // composition change (register/unregister) ou qu'un acteur meurt.
    this._liveCache = null;

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: 120,
      runChildUpdate: true,
    });

    // Les projectiles s'arrêtent sur les murs
    scene.physics.add.collider(this.projectiles, walls, (a, b) => {
      const { proj } = CombatSystem.sortPair(a, b);
      if (proj) this.onProjectileHit(proj, null);
    });
  }

  registerActor(actor) {
    this.actors.push(actor);
    this._liveCache = null;
    // Collision projectile ↔ acteur (on filtre les alliés dans le process).
    // NB : Phaser peut inverser l'ordre des arguments du callback selon qu'il
    // passe par collideSpriteVsGroup ou l'inverse — d'où la normalisation.
    //
    // Le Collider retourné est mémorisé sur l'acteur : sans ça, il survivait à
    // la mort de l'acteur (Phaser ne retire pas un collider quand le GameObject
    // est détruit) et s'accumulait à chaque respawn. unregisterActor le détruit.
    actor._projOverlap = this.scene.physics.add.overlap(
      this.projectiles,
      actor,
      (a, b) => {
        const { proj, target } = CombatSystem.sortPair(a, b);
        this.onProjectileHit(proj, target);
      },
      (a, b) => {
        const { proj, target } = CombatSystem.sortPair(a, b);
        if (!proj || !target) return false;
        return proj.active && !target.isDead && proj.team !== target.team;
      },
      this,
    );
  }

  // Identifie lequel des deux objets est le projectile.
  static sortPair(a, b) {
    if (a instanceof Projectile) return { proj: a, target: b };
    if (b instanceof Projectile) return { proj: b, target: a };
    return { proj: null, target: null };
  }

  unregisterActor(actor) {
    this.actors = this.actors.filter((a) => a !== actor);
    this._liveCache = null;
    // Détruit l'overlap projectile↔acteur créé dans registerActor, sinon il
    // fuit (broadphase qui grossit à chaque respawn).
    if (actor._projOverlap) {
      actor._projOverlap.destroy();
      actor._projOverlap = null;
    }
  }

  // Invalide le cache : appelé par Actor.die() pour que l'acteur mort quitte
  // immédiatement la liste, même s'il n'est désenregistré qu'un peu plus tard.
  invalidateLiveCache() {
    this._liveCache = null;
  }

  get liveActors() {
    if (this._liveCache) return this._liveCache;
    this._liveCache = this.actors.filter((a) => a.active && !a.isDead);
    return this._liveCache;
  }

  onProjectileHit(proj, target) {
    if (!proj.active) return;
    const { x, y, spec } = proj;

    if (target && typeof target.takeDamage === 'function') {
      target.takeDamage(proj.damage, proj.owner, 140);
    }

    // Boule de feu : explosion AoE à l'impact. On passe le propriétaire du tir
    // (proj.owner) et non seulement son camp : c'est lui qui doit être crédité
    // de l'élimination, sinon les kills de zone ne sont attribués à personne.
    if (spec && spec.aoeRadius) {
      Spell.explode(this.scene, x, y, spec, proj.owner, this.liveActors);
    }

    proj.kill();
  }

  // --- API de tir ---

  // Tir générique : la spec vient de la classe du joueur.
  fireProjectile(owner, angle, spec, textureKey) {
    const p = this.projectiles.get(owner.x, owner.y, textureKey);
    if (p) p.fire(owner, angle, spec, textureKey);
    return p;
  }

  castShield(owner) {
    Spell.shield(this.scene, owner, WEAPONS.shield);
  }
}
