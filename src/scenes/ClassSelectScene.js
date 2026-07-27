import Phaser from 'phaser';
import { CLASSES } from '../classes/index.js';
import ClassCard, { CARD_W, CARD_H } from '../ui/ClassCard.js';

const GAP = 22;

// Écran de sélection de classe. La rangée de cartes se recentre sur la largeur
// disponible, et se resserre si la fenêtre est trop étroite.
export default class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  create() {
    this.backdrop = this.add.graphics();

    this.title = this.add
      .text(0, 0, 'Choisis ta classe', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '40px',
        color: '#c9a24a',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 10, false, true);

    this.selectedId = CLASSES[0].id;

    this.cards = CLASSES.map(
      (def) => new ClassCard(this, 0, 0, def, (id) => this.select(id)),
    );

    this.startBtn = this.add
      .text(0, 0, '▶  Entrer dans l\'arène', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        color: '#e8e0d0',
        backgroundColor: '#1d1d28',
        padding: { x: 28, y: 13 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.startBtn.setStyle({ backgroundColor: '#2c2c3c' }))
      .on('pointerout', () => this.startBtn.setStyle({ backgroundColor: '#1d1d28' }))
      .on('pointerdown', () => this.startGame());

    this.hint = this.add
      .text(
        0,
        0,
        'Clic G : attaquer   •   Clic D / Espace : spécial   •   3 : bouclier   •   E / R : portails   •   Échap : retour',
        {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '13px',
          color: '#6a6478',
        },
      )
      .setOrigin(0.5);

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    this.select(this.selectedId);
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    this.backdrop.clear();
    this.backdrop.fillStyle(0x181228, 0.45);
    this.backdrop.fillCircle(cx, h * 0.42, Math.max(w, h) * 0.38);

    this.title.setPosition(cx, Math.max(34, h * 0.06));

    // Si la fenêtre est trop étroite pour la rangée, on réduit l'échelle plutôt
    // que de laisser les cartes se chevaucher ou sortir de l'écran.
    const n = this.cards.length;
    const naturalW = n * CARD_W + (n - 1) * GAP;
    const available = w - 48;
    const scale = Math.min(1, available / naturalW);

    const stepX = (CARD_W + GAP) * scale;
    const rowW = naturalW * scale;
    const startX = cx - rowW / 2 + (CARD_W * scale) / 2;

    const rowCenterY = this.title.y + 34 + (CARD_H * scale) / 2;

    this.cards.forEach((card, i) => {
      card.container.setScale(scale);
      card.setPosition(startX + i * stepX, rowCenterY);
    });

    const rowBottom = rowCenterY + (CARD_H * scale) / 2;
    this.startBtn.setPosition(cx, Math.min(h - 62, rowBottom + 44));
    this.hint.setPosition(cx, Math.min(h - 20, rowBottom + 92));
  }

  select(id) {
    this.selectedId = id;
    this.cards.forEach((c) => c.setSelected(c.classDef.id === id));
  }

  startGame() {
    this.scene.start('GameScene', { classId: this.selectedId });
  }
}
