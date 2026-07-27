import { defineClass } from './BaseClass.js';

// Assassin : très rapide et très fragile. Frappe vite, disparaît, et punit
// quiconque lui tourne le dos.
export default defineClass({
  id: 'assassin',
  name: 'Assassin',
  color: 0x4a8ad8,
  blurb: 'Très rapide, très fragile. Frappe dans le dos et disparaît.',

  stats: { maxHp: 70, speed: 330, maxMana: 70, manaRegen: 10 },

  attack: {
    type: 'melee',
    name: 'Dague',
    damage: 13,
    cooldown: 200, // très rapide
    manaCost: 0,
    range: 52, // courte portée
    arc: Math.PI * 0.5,
    knockback: 110,
  },

  special: {
    name: 'Invisibilité',
    description: 'Devient invisible 3s. Les ennemis perdent ta trace.',
    cooldown: 8000,
    manaCost: 35,
    duration: 3000,

    execute(player, { scene }) {
      const spec = this;
      player.invisibleUntil = scene.time.now + spec.duration;
      player.setAlpha(0.22);

      // petit nuage de fumée à l'entrée en invisibilité
      for (let i = 0; i < 8; i += 1) {
        const puff = scene.add.image(player.x, player.y, 'spark').setDepth(370);
        puff.setTint(0x2a2a3a);
        const a = Math.random() * Math.PI * 2;
        scene.tweens.add({
          targets: puff,
          x: player.x + Math.cos(a) * 34,
          y: player.y + Math.sin(a) * 34,
          alpha: 0,
          scale: 2.2,
          duration: 420,
          onComplete: () => puff.destroy(),
        });
      }

      scene.time.delayedCall(spec.duration, () => {
        if (player.active) player.setAlpha(1);
      });
    },
  },

  // disparaît pour fuir quand il est bas, ou pour approcher de loin
  bot: {
    useSpecial: (dist, self) => self.hp < self.maxHp * 0.45 || dist > 240,
  },

  passive: {
    name: 'Coup dans le dos',
    description: 'Dégâts doublés en frappant un ennemi par derrière.',
    backstabMultiplier: 2,
    backstabAngle: Math.PI * 0.6, // cône arrière de la cible
  },
});
