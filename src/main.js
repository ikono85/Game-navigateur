import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import ClassSelectScene from './scenes/ClassSelectScene.js';
import GameScene from './scenes/GameScene.js';

// Rendu net : le canvas fait exactement la taille de la fenêtre (mode RESIZE),
// donc aucune mise à l'échelle. C'est ce qui pixelisait tout auparavant : le jeu
// était rendu en 1280x720 puis étiré, et `pixelArt: true` imposait en plus un
// filtrage nearest + `image-rendering: pixelated` sur le canvas.
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a0a0f',
  antialias: true,
  antialiasGL: true,
  roundPixels: true, // sprites alignés sur la grille de pixels, sans flou
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Dimensions numériques obligatoires : en mode RESIZE, '100%' n'est pas
    // interprété et Phaser en déduit un canvas de 0x0. Il suit ensuite la
    // fenêtre tout seul.
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MenuScene, ClassSelectScene, GameScene],
};

const game = new Phaser.Game(config);

// Exposé en local uniquement, pratique pour inspecter l'état depuis la console.
// Test sur l'hôte plutôt que sur import.meta.env : ce fichier doit aussi pouvoir
// tourner sans Vite (voir l'import map dans index.html), où import.meta.env
// n'existe pas et lèverait une erreur.
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.__game = game;
}
