import Phaser from 'phaser';
import { defineClass } from './BaseClass.js';

// Guerrier : tank de mêlée. Encaisse, colle à l'adversaire, et referme la
// distance avec sa Charge.
export default defineClass({
  id: 'warrior',
  name: 'Guerrier',
  color: 0xc98a3a,
  blurb: 'Tank de mêlée. Encaisse les coups et referme la distance.',

  stats: { maxHp: 140, speed: 235, maxMana: 60, manaRegen: 8 },

  attack: {
    type: 'melee',
    name: "Coup d'épée",
    damage: 24,
    cooldown: 460,
    manaCost: 0,
    range: 78,
    arc: Math.PI * 0.7, // épée large
    knockback: 240,
  },

  special: {
    name: 'Charge',
    description: 'Fonce en avant et blesse tout sur le passage.',
    cooldown: 5000,
    manaCost: 0,
    damage: 20,
    speed: 900,
    duration: 260, // ms de dash
    radius: 46,

    execute(player, { scene, combat, angle }) {
      const spec = this;
      const endAt = scene.time.now + spec.duration;
      const alreadyHit = new Set();

      player.setVelocity(Math.cos(angle) * spec.speed, Math.sin(angle) * spec.speed);
      player.isDashing = true;

      // traînée visuelle
      const trail = scene.add.graphics().setDepth(380);

      const ev = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (!player.active || scene.time.now >= endAt) {
            player.isDashing = false;
            trail.destroy();
            ev.remove();
            return;
          }

          trail.clear();
          trail.fillStyle(0xc98a3a, 0.25);
          trail.fillCircle(player.x, player.y, 22);

          // dégâts au contact pendant le dash (une fois par cible)
          combat.liveActors.forEach((t) => {
            if (t.team === player.team || alreadyHit.has(t)) return;
            const d = Phaser.Math.Distance.Between(player.x, player.y, t.x, t.y);
            if (d <= spec.radius) {
              alreadyHit.add(t);
              t.takeDamage(spec.damage, player, 320);
            }
          });
        },
      });
    },
  },

  // la Charge sert à combler la distance, pas à finir au corps à corps
  bot: {
    useSpecial: (dist) => dist > 130 && dist < 400,
  },

  passive: {
    name: 'Peau de fer',
    description: 'Réduit de 25% tous les dégâts subis.',
    damageReduction: 0.25,
  },
});
