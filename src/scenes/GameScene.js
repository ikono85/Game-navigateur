import Phaser from 'phaser';
import { TILE_SIZE } from '../config.js';
import Player from '../entities/Player.js';
import Bot from '../entities/Bot.js';
import CombatSystem from '../combat/CombatSystem.js';
import Hud from '../ui/Hud.js';
import Scoreboard from '../ui/Scoreboard.js';
import PortalSystem from '../systems/PortalSystem.js';
import LightingSystem from '../systems/LightingSystem.js';
import Torch from '../entities/Torch.js';
import { getClass, CLASSES } from '../classes/index.js';
import { DONJON_XS } from '../maps/arena.js';
import { FLOOR_FRAMES, wallFrame } from '../gfx/tileset.js';

// Les tuiles du pack sont assez claires : cette teinte les ramène dans
// l'ambiance dark fantasy sans perdre le détail de la pierre.
const FLOOR_TINT = 0x6b6478;
const WALL_TINT = 0x8a8496;

const OPPONENTS = 3;
const SCORE_TO_WIN = 15;
const RESPAWN_DELAY = 2500;

// GameScene : arène, joueur, bots, combat et HUD.
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.classDef = getClass(data && data.classId);
  }

  create() {
    const map = DONJON_XS;
    this.map = map;
    this.worldW = map[0].length * TILE_SIZE;
    this.worldH = map.length * TILE_SIZE;

    this.walls = this.physics.add.staticGroup();
    this.buildArena(map);
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    // Éclairage : masque de ténèbres, halos, vignette. Instancié AVANT les
    // acteurs et projectiles pour que ceux-ci puissent y attacher leurs
    // lumières dès la création.
    this.lighting = new LightingSystem(this, {
      worldW: this.worldW,
      worldH: this.worldH,
      ambientColor: 0x2a2a36,
    });
    this.seedTorches(map);

    // Système de combat (pool de projectiles + collisions)
    this.combat = new CombatSystem(this, this.walls);

    // Système de portails
    this.portals = new PortalSystem(this, this.combat, this.walls, {
      grid: map,
      tileSize: TILE_SIZE,
    });

    // Joueur
    const spawn = this.findSpawn(map);
    this.player = new Player(this, spawn.x, spawn.y, this.combat, this.classDef);
    this.physics.add.collider(this.player, this.walls);
    this.combat.registerActor(this.player);
    this.player.once('died', () => this.onPlayerDeath());
    this.attachPlayerLight();

    // Feuille de match : chaque concurrent garde son identité et son score
    // d'une réapparition à l'autre.
    this.matchOver = false;
    this.roster = [{ team: 'blue', name: 'Toi', classDef: this.classDef, score: 0, isPlayer: true }];
    const pool = CLASSES.filter((c) => c.id !== this.classDef.id);
    for (let i = 0; i < OPPONENTS; i += 1) {
      const def = pool[i % pool.length];
      this.roster.push({ team: `bot${i + 1}`, name: def.name, classDef: def, score: 0 });
    }

    this.bots = [];
    this.roster.filter((e) => !e.isPlayer).forEach((entry) => this.spawnBot(entry));

    // Les acteurs se bloquent entre eux
    this.physics.add.collider(this.player, this.bots);
    this.physics.add.collider(this.bots, this.bots);

    // Caméra
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));

    this.hud = new Hud(this, this.player);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

    this.scoreboard = new Scoreboard(this, this.roster, SCORE_TO_WIN);
    this.events.once('shutdown', () => this.scoreboard.destroy());

    // Voile radial sombre attaché à la caméra : renforce le côté "grotte" sur
    // les bords sans obscurcir la zone d'action au centre.
    this.setupVignette();
  }

  // Attache une lumière chaude au joueur. Retire l'ancienne avant d'en poser
  // une nouvelle : appelé aussi bien au démarrage qu'après un respawn.
  attachPlayerLight() {
    if (this.playerLight) this.lighting.removeLight(this.playerLight);
    this.playerLight = this.lighting.attach(this.player, {
      radius: 300,
      color: 0xffe0a4,
      intensity: 1,
    });
  }

  // Vignette écran, redimensionnée avec la fenêtre.
  setupVignette() {
    const place = () => {
      const w = this.scale.width;
      const h = this.scale.height;
      const size = Math.max(w, h) * 1.4;
      if (!this.vignette) {
        this.vignette = this.add
          .image(w / 2, h / 2, 'vignette')
          .setScrollFactor(0)
          .setDepth(1100);
      }
      this.vignette.setPosition(w / 2, h / 2).setDisplaySize(size, size);
    };
    place();
    this.scale.on('resize', place);
    this.events.once('shutdown', () => this.scale.off('resize', place));
  }

  // Sème des torches sur les murs qui bordent du sol par le bas. Un espacement
  // minimum en tuiles évite l'accumulation.
  seedTorches(map) {
    const candidates = [];
    for (let r = 0; r < map.length - 1; r += 1) {
      for (let c = 0; c < map[r].length; c += 1) {
        if (map[r][c] === 1 && map[r + 1][c] === 0) {
          candidates.push({ r, c });
        }
      }
    }
    const chosen = [];
    const minDist = 3.5; // en tuiles
    // Le hash sert de tri déterministe pour éviter que l'ordre de la grille
    // biaise la sélection vers le coin haut-gauche.
    candidates.sort((a, b) => ((a.r * 73 + a.c * 131) % 97) - ((b.r * 73 + b.c * 131) % 97));
    candidates.forEach(({ r, c }) => {
      const tooClose = chosen.some((t) => Math.hypot(t.r - r, t.c - c) < minDist);
      if (!tooClose) chosen.push({ r, c });
    });
    chosen.forEach(({ r, c }) => {
      const x = c * TILE_SIZE + TILE_SIZE / 2;
      const y = r * TILE_SIZE + TILE_SIZE * 0.72;
      new Torch(this, x, y, this.lighting);
    });
  }

  // --- Mort et réapparition du joueur ---

  onPlayerDeath() {
    if (this.matchOver) return;
    this.creditKill(this.player);
    if (this.matchOver) return;

    this.cameras.main.flash(200, 90, 0, 0);
    this.banner(`Éliminé — retour dans ${RESPAWN_DELAY / 1000}s`, '#d86a6a', RESPAWN_DELAY - 200);
    this.time.delayedCall(RESPAWN_DELAY, () => {
      if (this.scene.isActive() && !this.matchOver) this.respawnPlayer();
    });
  }

  respawnPlayer() {
    const pos = this.spawnPointAwayFromPlayer();
    this.player = new Player(this, pos.x, pos.y, this.combat, this.classDef);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.bots);
    this.combat.registerActor(this.player);
    this.player.once('died', () => this.onPlayerDeath());

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.hud.attach(this.player);
    this.attachPlayerLight();
    // brève invulnérabilité pour ne pas mourir dans la seconde
    this.player.applyShield(1500, 0.8);
  }

  // --- Fin de match ---

  endMatch(winner) {
    if (this.matchOver) return;
    this.matchOver = true;

    this.physics.pause();
    const won = !!winner.isPlayer;
    this.banner(
      won ? 'VICTOIRE' : `${winner.name} l'emporte`,
      won ? '#c9a24a' : '#d86a6a',
      3200,
      44,
    );

    this.time.delayedCall(3400, () => {
      if (this.scene.isActive()) this.scene.start('MenuScene');
    });
  }

  // Message centré, éphémère.
  banner(text, color, duration, size = 26) {
    const t = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 60, text, {
        fontFamily: 'Georgia, serif',
        fontSize: `${size}px`,
        color,
        backgroundColor: '#0a0a0fdd',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1200);
    this.time.delayedCall(duration, () => t.destroy());
    return t;
  }

  // La caméra ne doit jamais laisser de vide autour de l'arène : sur un grand
  // écran, il faut zoomer au moins assez pour la couvrir. Le champ de vision
  // élargi de l'Archer ne s'applique que s'il reste dans cette limite.
  applyZoom() {
    const fill = Math.max(this.scale.width / this.worldW, this.scale.height / this.worldH);
    const wanted = this.classDef.passive.cameraZoom || 1;
    this.cameras.main.setZoom(Math.max(fill, wanted));
  }

  spawnBot(entry) {
    const pos = this.spawnPointAwayFromPlayer();

    // Chaque adversaire a son propre camp : tout le monde est hostile à tout le
    // monde, les bots se battent aussi entre eux.
    const bot = new Bot(this, pos.x, pos.y, this.combat, entry.classDef, entry.team);
    bot.rosterEntry = entry;
    this.physics.add.collider(bot, this.walls);
    this.combat.registerActor(bot);
    this.bots.push(bot);

    bot.once('died', () => {
      // Retrait en place : les colliders gardent une référence vers CE tableau,
      // le réassigner (filter) les laisserait pointer sur l'ancien.
      const idx = this.bots.indexOf(bot);
      if (idx !== -1) this.bots.splice(idx, 1);
      this.combat.unregisterActor(bot);
      this.creditKill(bot);

      this.time.delayedCall(RESPAWN_DELAY, () => {
        if (this.scene.isActive() && !this.matchOver) this.spawnBot(entry);
      });
    });

    return bot;
  }

  spawnPointAwayFromPlayer() {
    let pos;
    let tries = 0;
    do {
      pos = this.randomFloorTile();
      tries += 1;
    } while (
      tries < 40 &&
      this.player &&
      Phaser.Math.Distance.Between(pos.x, pos.y, this.player.x, this.player.y) < 260
    );
    return pos;
  }

  // Attribue l'élimination à l'auteur du dernier coup, quel qu'il soit.
  creditKill(victim) {
    const killer = victim.lastAttacker;
    if (!killer || killer.team === victim.team) return;

    const entry = this.roster.find((e) => e.team === killer.team);
    if (!entry) return;

    entry.score += 1;
    this.scoreboard.update();
    if (entry.score >= SCORE_TO_WIN) this.endMatch(entry);
  }

  randomFloorTile() {
    const m = this.map;
    for (let i = 0; i < 200; i += 1) {
      const r = Phaser.Math.Between(1, m.length - 2);
      const c = Phaser.Math.Between(1, m[0].length - 2);
      if (m[r][c] === 0) {
        return { x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2 };
      }
    }
    return { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };
  }

  buildArena(map) {
    // Les tuiles font 64 px, la grille de jeu 48 : on les réduit à l'affichage
    // plutôt que de toucher aux distances de gameplay.
    for (let r = 0; r < map.length; r += 1) {
      for (let c = 0; c < map[r].length; c += 1) {
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;

        // sol partout, avec une variante tirée au sort pour casser la répétition
        const frame = FLOOR_FRAMES[(r * 7 + c * 3) % FLOOR_FRAMES.length];
        this.add
          .image(x, y, 'floorSheet', frame)
          .setDisplaySize(TILE_SIZE, TILE_SIZE)
          .setTint(FLOOR_TINT);

        if (map[r][c] === 1) {
          const wall = this.walls.create(x, y, 'wallSheet', wallFrame(map, r, c));
          wall.setDisplaySize(TILE_SIZE, TILE_SIZE).setTint(WALL_TINT).setDepth(5);
          // le corps physique suit l'échelle d'affichage
          wall.body.setSize(TILE_SIZE, TILE_SIZE, true);
        }
      }
    }
  }

  findSpawn(map) {
    for (let r = 0; r < map.length; r += 1) {
      for (let c = 0; c < map[r].length; c += 1) {
        if (map[r][c] === 0) {
          return { x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2 };
        }
      }
    }
    return { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };
  }

  update(time, delta) {
    if (this.matchOver) return;
    if (this.player && this.player.active) this.player.update(time, delta);
    // copie : un bot peut mourir et quitter le tableau pendant l'itération
    this.bots.slice().forEach((b) => b.update(time, delta));
    this.portals.update(time, delta);
    this.hud.update();
  }
}
