// Configuration globale du jeu ShadowGate Arena

// 64 = taille native des tuiles du pack. Les afficher à leur résolution évite
// une réduction qui gâchait le détail de la pierre, et agrandit l'arène
// (1024 x 896) pour qu'elle remplisse l'écran.
export const TILE_SIZE = 64;

export const COLORS = {
  floor: 0x1a1a24,
  floorAlt: 0x15151d,
  wall: 0x3a3a4a,
  wallTop: 0x4a4a5e,
  enemy: 0xc44a4a,
  arrow: 0xd8c89a,
  fireball: 0xff7a2a,
  shield: 0x6ad8ff,
  portalSelf: 0x4aa3ff, // portails du joueur
  portalEnemy: 0xd84a4a, // portails adverses
  hpFill: 0x4ad86a,
  hpLow: 0xd84a4a,
  manaFill: 0x4a7ad8,
  barBack: 0x14141c,
};

// --- Statistiques de combat ---
//
// Les stats du joueur ne sont pas ici : chaque classe porte les siennes dans
// src/classes/<Classe>.js.

// Réglages de l'IA. Les bots jouent les vraies classes : ces facteurs sont le
// seul curseur de difficulté.
export const BOT_STATS = {
  // Mesuré : encerclé par les trois adversaires et sans bouger, le joueur doit
  // tenir ~4 s en classe fragile et ~10 s en Guerrier. En dessous, la moindre
  // erreur est fatale et on n'a pas le temps de viser.
  speedFactor: 0.92, // légèrement plus lents que toi
  damageFactor: 0.45, // frappent moins fort
  cooldownFactor: 1.7, // et nettement moins souvent
  aggroRange: 460,
  targetScanInterval: 500, // ms entre deux choix de cible
  // Les bots préfèrent le joueur à distance égale. Sans ce biais ils
  // s'entretuent et le joueur regarde le match se jouer sans lui.
  playerBias: 0.6,
};

// --- Portails (mécanique signature du jeu) ---
export const PORTAL = {
  lifetime: 30000, // durée de vie d'un portail
  placeCooldown: 15000, // délai entre deux poses
  teleportCooldown: 1000, // délai avant qu'une entité puisse re-téléporter
  triggerRadius: 30, // rayon de déclenchement
  exitOffset: 34, // distance de sortie, pour ne pas re-déclencher la sortie
  radius: 26, // rayon visuel
  // Écart minimum entre les deux bouches d'un même joueur : trop proches, on
  // ressort dans le rayon de déclenchement du jumeau et on oscille en boucle.
  minSeparation: 120,
};

// Armes / sorts communs à toutes les classes. `cooldown` en ms, `manaCost` en
// points. Les armes propres à une classe (flèche, boule de feu, dague...) sont
// définies dans src/classes/<Classe>.js.
export const WEAPONS = {
  // attaque de base des bots
  melee: {
    name: 'Épée',
    damage: 22,
    cooldown: 420,
    manaCost: 0,
    range: 68, // portée de l'arc
    arc: Math.PI * 0.6, // ouverture de l'arc (~108°)
    knockback: 220,
  },
  shield: {
    name: 'Bouclier',
    cooldown: 6000,
    manaCost: 30,
    duration: 3000, // ms d'invulnérabilité partielle
    reduction: 0.7, // 70% de dégâts en moins
  },
};
