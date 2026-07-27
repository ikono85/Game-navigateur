import Phaser from 'phaser';
import { CLASSES } from '../classes/index.js';

// BootScene : charge le pack d'assets peints (personnages, environnement, VFX,
// projectiles, UI menu) puis démarre le menu.
//
// Historique : les modules src/gfx/{characters,lights,particles}.js contenaient
// des générateurs Canvas 2D qui produisaient toutes ces textures à la volée.
// Ils sont conservés dans l'arbre à titre d'archive/référence mais ne sont
// plus appelés — les PNG peints les remplacent point par point.

const A = 'assets';

// Les 16 tuiles du mur autotile : nom = wall_N_E_S_W avec 1 = voisin mur
// présent dans cette direction. Chargées une fois pour toutes ici, sélection
// dans src/gfx/tileset.js.
const WALL_KEYS = [];
for (let n = 0; n < 2; n += 1) {
  for (let e = 0; e < 2; e += 1) {
    for (let s = 0; s < 2; s += 1) {
      for (let w = 0; w < 2; w += 1) {
        WALL_KEYS.push(`${n}_${e}_${s}_${w}`);
      }
    }
  }
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // --- Pack A — Personnages ---
    CLASSES.forEach((c) => {
      this.load.image(`player_${c.id}`, `${A}/characters/player_${c.id}.png`);
      this.load.image(`enemy_${c.id}`, `${A}/characters/enemy_${c.id}.png`);
    });
    this.load.image('actorShadow', `${A}/characters/actor_shadow.png`);

    // --- Pack B — Environnement ---
    // Sols : 4 variantes séparées, le rendu choisit per-tile via un hash
    for (let i = 1; i <= 4; i += 1) {
      const n = String(i).padStart(2, '0');
      this.load.image(`floor_${n}`, `${A}/environment/floor_stone_${n}.png`);
    }
    // Murs : 16 combinaisons N/E/S/W
    WALL_KEYS.forEach((k) => {
      this.load.image(`wall_${k}`, `${A}/environment/wall_${k}.png`);
    });
    // Décor mural
    ['torch', 'banner_red', 'banner_blue', 'chains', 'crack', 'moss'].forEach((k) => {
      this.load.image(`wall_decor_${k}`, `${A}/environment/wall_decor_${k}.png`);
    });
    // Props au sol
    ['barrel', 'crate', 'pillar_broken', 'statue_broken', 'bones',
      'bloodstain_01', 'bloodstain_02', 'rug_torn', 'coins', 'candle'].forEach((k) => {
      this.load.image(`prop_${k}`, `${A}/environment/prop_${k}.png`);
    });

    // --- Pack C — VFX ---
    // Alias 'sconce' vers le décor mural torch : Torch.js n'a pas à savoir
    // que le sconce vient du pack Environnement, il attend juste la clé.
    this.load.image('sconce', `${A}/environment/wall_decor_torch.png`);
    this.load.image('flame', `${A}/vfx/flame_torch.png`);
    this.load.image('lightRadial', `${A}/vfx/light_radial.png`);
    this.load.image('vignette', `${A}/vfx/vignette.png`);
    this.load.image('speck', `${A}/vfx/particle_speck.png`);
    this.load.image('smoke', `${A}/vfx/particle_smoke.png`);
    this.load.image('blood', `${A}/vfx/particle_blood.png`);
    this.load.image('dust', `${A}/vfx/particle_dust.png`);
    this.load.image('leaf', `${A}/vfx/particle_leaf.png`);
    this.load.image('shockwave', `${A}/vfx/shockwave.png`);
    this.load.image('slash_arc', `${A}/vfx/slash_arc.png`);
    this.load.image('portal', `${A}/vfx/portal_ring.png`);
    this.load.image('portalSwirl', `${A}/vfx/portal_swirl.png`);
    for (let i = 1; i <= 4; i += 1) {
      this.load.image(`portal_gate_${i}`, `${A}/vfx/portal_gate_${i}.png`);
    }

    // --- Pack D — Projectiles ---
    this.load.image('arrow', `${A}/projectiles/arrow.png`);
    this.load.image('arrow_glow', `${A}/projectiles/arrow_glow.png`);
    this.load.image('fireball', `${A}/projectiles/fireball.png`);
    // La clé 'spark' est utilisée par le pool procédural historique — mappée
    // sur fireball_core (petit coeur d'orbe) pour les usages secondaires.
    this.load.image('spark', `${A}/projectiles/fireball_core.png`);
    this.load.image('spell_shield', `${A}/projectiles/spell_shield.png`);
    this.load.image('spell_nova_wave', `${A}/projectiles/spell_nova_wave.png`);
    this.load.image('spell_dagger_trail', `${A}/projectiles/spell_dagger_trail.png`);

    // --- Pack E — UI du menu ---
    this.load.image('logo_title', `${A}/ui/logo_title.png`);
    this.load.image('crest_shadowgate', `${A}/ui/crest_shadowgate.png`);
    this.load.image('menu_bg', `${A}/ui/menu_bg_atmosphere.png`);
    CLASSES.forEach((c) => {
      this.load.image(`portrait_${c.id}`, `${A}/ui/class_portrait_${c.id}.png`);
    });
  }

  create() {
    // Curseur global : croix dorée du pack UI, avec fallback crosshair CSS
    // si l'image n'est pas encore chargée par le navigateur.
    this.game.canvas.style.cursor = "url('assets/ui/cursor_crosshair.png') 16 16, crosshair";
    this.scene.start('MenuScene');
  }
}
