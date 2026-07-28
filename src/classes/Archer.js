import { defineClass, areaDamage } from './BaseClass.js';
import { screenShake } from '../systems/Settings.js';

// Archer : équilibré, dégâts constants à longue portée. Sa Pluie de flèches
// zone le terrain à l'endroit visé.
export default defineClass({
  id: 'archer',
  name: 'Archer',
  color: 0x4aa86a,
  blurb: 'Équilibré. Dégâts constants à longue portée.',

  stats: { maxHp: 100, speed: 275, maxMana: 80, manaRegen: 11 },

  attack: {
    type: 'projectile',
    projectile: 'arrow',
    name: 'Flèche précise',
    damage: 18,
    cooldown: 330,
    manaCost: 0,
    speed: 780,
    maxRange: 700,
    radius: 5,
  },

  special: {
    name: 'Pluie de flèches',
    description: 'Fait pleuvoir des flèches sur la zone visée.',
    cooldown: 6500,
    manaCost: 30,
    damage: 34,
    radius: 110,
    delay: 650, // temps avant impact (esquivable)
    maxCastRange: 420,

    execute(player, { scene, combat, pointer }) {
      const spec = this;

      // la zone est plafonnée à la portée max autour du joueur
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const dist = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(dist, spec.maxCastRange);
      const tx = player.x + (dx / dist) * clamped;
      const ty = player.y + (dy / dist) * clamped;

      // marqueur au sol qui se remplit avant l'impact
      const g = scene.add.graphics().setDepth(360);
      scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: spec.delay,
        onUpdate: (tw) => {
          const p = tw.getValue();
          g.clear();
          g.lineStyle(2, 0x4aa86a, 0.9);
          g.strokeCircle(tx, ty, spec.radius);
          g.fillStyle(0x4aa86a, 0.12 + 0.18 * p);
          g.fillCircle(tx, ty, spec.radius * p);
        },
        onComplete: () => {
          g.clear();

          // volée de flèches : quelques traits qui tombent dans la zone
          for (let i = 0; i < 14; i += 1) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * spec.radius;
            const px = tx + Math.cos(a) * r;
            const py = ty + Math.sin(a) * r;
            const shaft = scene.add.image(px, py - 60, 'arrow').setDepth(440);
            shaft.rotation = Math.PI / 2;
            scene.tweens.add({
              targets: shaft,
              y: py,
              duration: 140,
              delay: i * 12,
              onComplete: () => shaft.destroy(),
            });
          }

          screenShake(scene, 140, 0.004);
          areaDamage(scene, combat, {
            x: tx,
            y: ty,
            radius: spec.radius,
            damage: spec.damage,
            team: player.team,
            falloff: 0.35,
            knockback: 90,
          });

          scene.time.delayedCall(400, () => g.destroy());
        },
      });
    },
  },

  // tient la distance maximale et arrose la zone
  bot: {
    preferredRange: 350,
    useSpecial: (dist) => dist < 420,
  },

  passive: {
    name: 'Vision étendue',
    description: 'Champ de vision élargi (caméra plus large).',
    cameraZoom: 0.85,
  },
});
