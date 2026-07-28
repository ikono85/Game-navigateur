import Phaser from 'phaser';
import Portal from '../entities/Portal.js';
import { PORTAL, COLORS } from '../config.js';

// PortalSystem : pose, expiration et traversée des portails.
//
// Règles :
//  - chaque joueur possède 2 emplacements (A et B), reposer écrase l'ancien
//  - 15s de cooldown PAR EMPLACEMENT, 30s de durée de vie
//
// NB : le plan disait « 15s entre chaque pose ». Pris à la lettre, il faut
// attendre 15s entre A et B, or A n'en vit que 30 : la paire n'est utilisable
// que la moitié de sa durée. Le cooldown est donc par emplacement — même
// protection contre le spam, mécanique réellement jouable.
//  - la téléportation ne marche que si les DEUX portails existent
//  - tout le monde peut emprunter un portail, y compris l'ennemi (risque assumé)
//  - les projectiles traversent en conservant direction et portée restante
export default class PortalSystem {
  constructor(scene, combat, walls, mapInfo) {
    this.scene = scene;
    this.combat = combat;
    this.walls = walls;
    this.map = mapInfo; // { grid, tileSize, cols, rows }
    this.portals = [];
    this.nextPlaceAt = new Map(); // owner -> { A: timestamp, B: timestamp }
  }

  // --- Pose ---

  slotTimers(owner) {
    if (!this.nextPlaceAt.has(owner)) this.nextPlaceAt.set(owner, { A: 0, B: 0 });
    return this.nextPlaceAt.get(owner);
  }

  canPlace(owner, slot) {
    return this.scene.time.now >= this.slotTimers(owner)[slot];
  }

  placeCooldownRemaining(owner, slot) {
    return Math.max(0, this.slotTimers(owner)[slot] - this.scene.time.now);
  }

  // Refuse la pose dans un mur : sinon le joueur se téléporterait hors-jeu.
  isFreeSpot(x, y) {
    const { grid, tileSize } = this.map;
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return false;
    return grid[r][c] === 0;
  }

  place(owner, slot) {
    if (!this.canPlace(owner, slot)) return null;
    if (!this.isFreeSpot(owner.x, owner.y)) return null;

    // Refuse une pose trop proche de la bouche opposée : sinon la sortie tombe
    // dans le rayon de déclenchement du jumeau et l'entité oscille en boucle.
    const otherSlot = slot === 'A' ? 'B' : 'A';
    const twin = this.portals.find((p) => p.owner === owner && p.slot === otherSlot);
    if (twin && Phaser.Math.Distance.Between(owner.x, owner.y, twin.x, twin.y) < PORTAL.minSeparation) {
      return null;
    }

    this.slotTimers(owner)[slot] = this.scene.time.now + PORTAL.placeCooldown;

    // écrase le portail existant du même emplacement
    this.removeSlot(owner, slot);

    const color = owner.team === 'blue' ? COLORS.portalSelf : COLORS.portalEnemy;
    const portal = new Portal(this.scene, owner.x, owner.y, owner, slot, color);
    this.portals.push(portal);

    this.relink(owner);
    return portal;
  }

  removeSlot(owner, slot) {
    const existing = this.portals.find((p) => p.owner === owner && p.slot === slot);
    if (existing) this.destroyPortal(existing);
  }

  destroyPortal(portal) {
    this.portals = this.portals.filter((p) => p !== portal);
    if (portal.link) portal.link.link = null;
    portal.destroy();
  }

  // (Re)lie les portails A et B d'un même propriétaire.
  relink(owner) {
    const a = this.portals.find((p) => p.owner === owner && p.slot === 'A');
    const b = this.portals.find((p) => p.owner === owner && p.slot === 'B');
    if (a) a.link = b || null;
    if (b) b.link = a || null;
  }

  portalsOf(owner) {
    return this.portals.filter((p) => p.owner === owner);
  }

  // --- Traversée ---

  // Renvoie le portail chevauché par une entité, ou null.
  overlapping(entity) {
    return (
      this.portals.find(
        (p) =>
          p.isLinked &&
          p.spawnProgress >= 1 &&
          Phaser.Math.Distance.Between(entity.x, entity.y, p.x, p.y) <= PORTAL.triggerRadius,
      ) || null
    );
  }

  teleport(entity, from) {
    const to = from.link;
    const now = this.scene.time.now;

    // conserve la direction de déplacement pour placer la sortie devant
    let angle;
    if (entity.body && (entity.body.velocity.x || entity.body.velocity.y)) {
      angle = Math.atan2(entity.body.velocity.y, entity.body.velocity.x);
    } else {
      angle = entity.rotation || 0;
    }

    let x = to.x + Math.cos(angle) * PORTAL.exitOffset;
    let y = to.y + Math.sin(angle) * PORTAL.exitOffset;

    // si la sortie tomberait dans un mur, on sort sur le portail lui-même
    if (!this.isFreeSpot(x, y)) {
      x = to.x;
      y = to.y;
    }

    entity.setPosition(x, y);
    // empêche le rebond immédiat entre les deux bouches
    entity.portalLockUntil = now + PORTAL.teleportCooldown;

    this.showTeleportFx(from);
    this.showTeleportFx(to);
    return to;
  }

  showTeleportFx(portal) {
    const g = this.scene.add.graphics().setDepth(345);
    let life = 0;
    const ev = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        life += 16;
        const p = Math.min(1, life / 240);
        g.clear();
        g.lineStyle(3 * (1 - p) + 1, portal.color, 1 - p);
        g.strokeCircle(portal.x, portal.y, PORTAL.radius + 18 * p);
        if (p >= 1) {
          g.destroy();
          ev.remove();
        }
      },
    });
  }

  // --- Boucle ---

  update(time, delta) {
    // expiration
    for (let i = this.portals.length - 1; i >= 0; i -= 1) {
      const p = this.portals[i];
      if (p.isExpired) {
        const { owner } = p;
        this.destroyPortal(p);
        this.relink(owner);
      } else {
        p.update(delta);
      }
    }
    if (this.portals.length === 0) return;

    // acteurs (joueur ET bots : l'ennemi peut emprunter tes portails)
    this.combat.liveActors.forEach((actor) => {
      if (time < (actor.portalLockUntil || 0)) return;
      const p = this.overlapping(actor);
      if (p) this.teleport(actor, p);
    });

    // projectiles : traversent en gardant direction et portée restante
    this.combat.projectiles.getChildren().forEach((proj) => {
      if (!proj.active) return;
      if (time < (proj.portalLockUntil || 0)) return;
      const p = this.overlapping(proj);
      if (p) this.teleport(proj, p);
    });
  }
}
