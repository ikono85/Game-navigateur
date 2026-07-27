import { defineClass, areaDamage } from './BaseClass.js';
import { COLORS } from '../config.js';

// Mage : fragile et lent, mais énorme puissance de zone. Punit les groupes et
// se dégage avec sa Nova.
export default defineClass({
  id: 'mage',
  name: 'Mage',
  color: 0x8a5ad8,
  blurb: 'Fragile et lent, mais dévastateur en zone.',

  stats: { maxHp: 75, speed: 215, maxMana: 130, manaRegen: 20 },

  attack: {
    type: 'projectile',
    projectile: 'fireball',
    name: 'Boule de feu',
    damage: 24,
    cooldown: 780,
    manaCost: 18,
    speed: 430,
    maxRange: 560,
    radius: 9,
    aoeRadius: 84,
    aoeDamage: 16,
  },

  special: {
    name: 'Nova',
    description: 'Explosion tout autour de soi. Repousse violemment.',
    cooldown: 7000,
    manaCost: 40,
    damage: 42,
    radius: 165,

    execute(player, { scene, combat }) {
      const spec = this;

      // onde de choc visuelle
      const g = scene.add.graphics().setDepth(430);
      scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 340,
        onUpdate: (tw) => {
          const p = tw.getValue();
          g.clear();
          g.lineStyle(5 * (1 - p) + 1, COLORS.fireball, 1 - p);
          g.strokeCircle(player.x, player.y, spec.radius * p);
          g.lineStyle(2, 0x8a5ad8, 0.8 * (1 - p));
          g.strokeCircle(player.x, player.y, spec.radius * p * 0.7);
        },
        onComplete: () => g.destroy(),
      });

      scene.cameras.main.shake(180, 0.007);

      areaDamage(scene, combat, {
        x: player.x,
        y: player.y,
        radius: spec.radius,
        damage: spec.damage,
        team: player.team,
        falloff: 0.4,
        knockback: 380,
      });
    },
  },

  // garde ses distances, mais lâche la Nova si on lui colle dessus
  bot: {
    preferredRange: 310,
    useSpecial: (dist) => dist < 150,
  },

  passive: {
    name: 'Flux arcanique',
    description: 'Régénération de mana très rapide.',
  },
});
