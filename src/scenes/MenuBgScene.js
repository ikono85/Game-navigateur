import Phaser from 'phaser';
import { TILE_SIZE } from '../config.js';
import Bot from '../entities/Bot.js';
import CombatSystem from '../combat/CombatSystem.js';
import { CLASSES } from '../classes/index.js';
import { DONJON_XS } from '../maps/arena.js';
import { floorKey, wallKey } from '../gfx/tileset.js';

const DEMO_BOTS = 3;
const RESPAWN_DELAY = 2200;

// Aperçu animé derrière le menu : trois bots s'affrontent dans l'arène,
// sans joueur, sans HUD ni éclairage. La scène tourne sous MenuScene, qui
// pose son voile sombre par-dessus. Lancée / arrêtée par MenuScene.
export default class MenuBgScene extends Phaser.Scene {
  constructor() {
    super('MenuBgScene');
  }

  create() {
    const map = DONJON_XS;
    this.map = map;
    this.worldW = map[0].length * TILE_SIZE;
    this.worldH = map.length * TILE_SIZE;

    this.walls = this.physics.add.staticGroup();
    for (let r = 0; r < map.length; r += 1) {
      for (let c = 0; c < map[r].length; c += 1) {
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        this.add.image(x, y, floorKey(r, c)).setDisplaySize(TILE_SIZE, TILE_SIZE);
        if (map[r][c] === 1) {
          const wall = this.walls.create(x, y, wallKey(map, r, c));
          wall.setDisplaySize(TILE_SIZE, TILE_SIZE).setDepth(5);
          wall.body.setSize(TILE_SIZE, TILE_SIZE, true);
        }
      }
    }
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    this.combat = new CombatSystem(this, this.walls);

    this.bots = [];
    for (let i = 0; i < DEMO_BOTS; i += 1) {
      this.spawnBot(CLASSES[i % CLASSES.length], `demo${i + 1}`);
    }
    this.physics.add.collider(this.bots, this.bots);

    // Caméra : couvre toujours l'écran (pas de bords noirs) et dérive
    // doucement vers le barycentre du combat.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    this.camX = this.worldW / 2;
    this.camY = this.worldH / 2;
    cam.centerOn(this.camX, this.camY);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.applyZoom, this));
  }

  applyZoom() {
    const cover = Math.max(this.scale.width / this.worldW, this.scale.height / this.worldH);
    // léger zoom au-delà du cover : l'action paraît plus proche
    this.cameras.main.setZoom(cover * 1.15);
  }

  spawnBot(classDef, team) {
    const pos = this.randomFloorTile();
    const bot = new Bot(this, pos.x, pos.y, this.combat, classDef, team);
    this.physics.add.collider(bot, this.walls);
    this.combat.registerActor(bot);
    this.bots.push(bot);

    bot.once('died', () => {
      const idx = this.bots.indexOf(bot);
      if (idx !== -1) this.bots.splice(idx, 1);
      this.combat.unregisterActor(bot);
      this.time.delayedCall(RESPAWN_DELAY, () => {
        if (this.scene.isActive()) this.spawnBot(classDef, team);
      });
    });
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

  update(time, delta) {
    this.bots.slice().forEach((b) => b.update(time, delta));

    // Barycentre des bots vivants, suivi avec un fort amorti pour une
    // dérive lente de caméra plutôt qu'un suivi nerveux.
    const live = this.bots.filter((b) => b.active && !b.isDead);
    if (live.length) {
      const tx = live.reduce((s, b) => s + b.x, 0) / live.length;
      const ty = live.reduce((s, b) => s + b.y, 0) / live.length;
      const k = 1 - Math.exp(-delta / 1600);
      this.camX += (tx - this.camX) * k;
      this.camY += (ty - this.camY) * k;
      this.cameras.main.centerOn(this.camX, this.camY);
    }
  }
}
