import Phaser from 'phaser';

// Fabrique de définitions de classe.
//
// Une classe n'est pas une sous-classe de Player : c'est une *donnée* décrivant
// stats, attaque principale, capacité spéciale et passif. Player lit cette
// définition. Ça garde une seule implémentation de joueur (utile pour le
// multijoueur en Phase 5, où le serveur doit rejouer la même logique).

export function defineClass(def) {
  return {
    ...def,
    stats: {
      maxHp: 100,
      speed: 260,
      maxMana: 100,
      manaRegen: 12,
      ...def.stats,
    },
    special: {
      cooldown: 6000,
      manaCost: 0,
      ...def.special,
    },
    passive: {
      ...def.passive,
    },
    // Indices pour l'IA. Ils vivent ici et non dans Bot.js : chaque classe sait
    // seule à quelle distance elle est dangereuse et quand lâcher son spécial.
    bot: {
      preferredRange:
        def.attack.type === 'melee' ? Math.max(38, def.attack.range * 0.72) : 300,
      useSpecial: (dist) => dist < 300,
      ...def.bot,
    },
  };
}

// Utilitaire partagé : dégâts de zone centrés sur un point.
export function areaDamage(scene, combat, { x, y, radius, damage, team, falloff = 0.5, knockback = 120 }) {
  combat.liveActors.forEach((t) => {
    if (t.team === team) return;
    const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
    if (d > radius) return;
    const mult = 1 - (d / radius) * falloff;
    t.takeDamage(damage * mult, { x, y }, knockback);
  });
}
