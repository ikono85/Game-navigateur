import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import MenuBgScene from './scenes/MenuBgScene.js';
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
  scene: [BootScene, MenuBgScene, MenuScene, ClassSelectScene, GameScene],
};

const game = new Phaser.Game(config);

// Garde-fou global. Une exception non rattrapée dans une boucle update() fige
// Phaser en silence (écran noir, aucun indice). On affiche au moins un bandeau
// lisible par-dessus le canvas au lieu de laisser l'utilisateur devant du noir.
function showFatal(message) {
  if (document.getElementById('fatal-error')) return;
  const box = document.createElement('div');
  box.id = 'fatal-error';
  box.textContent = `Une erreur est survenue : ${message}. Rechargez la page.`;
  box.style.cssText =
    'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;' +
    'max-width:90vw;padding:12px 18px;border-radius:8px;background:#2a0f12;' +
    "color:#ffb4b4;font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;" +
    'box-shadow:0 4px 24px #000a;';
  document.body.appendChild(box);
}
window.addEventListener('error', (e) => showFatal(e.message || 'inconnue'));
window.addEventListener('unhandledrejection', (e) =>
  showFatal((e.reason && e.reason.message) || 'promesse rejetée'),
);

// Exposé en local uniquement, pratique pour inspecter l'état depuis la console.
// Test sur l'hôte plutôt que sur import.meta.env : ce fichier doit aussi pouvoir
// tourner sans Vite (voir l'import map dans index.html), où import.meta.env
// n'existe pas et lèverait une erreur.
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.__game = game;
}
