import Phaser from 'phaser';

// PauseScene : voile de pause affiché par-dessus GameScene, qui est mise en
// pause (this.scene.pause) — sa boucle update ET son horloge sont gelées, donc
// les cooldowns ne défilent pas pendant l'arrêt. On lance cette scène en
// parallèle et elle seule écoute le clavier tant que le jeu est suspendu.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x05050a, 0.72).setScrollFactor(0);

    this.add
      .text(w / 2, h / 2 - 70, 'PAUSE', {
        fontFamily: 'Georgia, serif',
        fontSize: '52px',
        color: '#c9a24a',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h / 2 + 6, 'Reprendre', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#e8e0d0',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h / 2 + 40, 'Échap — reprendre     •     Q — quitter', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#8a8398',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.once('keydown-Q', () => this.quitToMenu());
    // Clic n'importe où = reprendre, plus accessible que de viser une touche.
    this.input.once('pointerdown', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  quitToMenu() {
    // Stoppe la partie (déclenche son shutdown/nettoyage) puis retour menu.
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
