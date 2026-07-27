import Phaser from 'phaser';

export const CARD_W = 262;
export const CARD_H = 408;

const PAD = 18;
const LABEL = '#c9c2d4';
const MUTED = '#8a8398';

// Carte de sélection d'une classe.
//
// La hauteur est calculée à partir d'un curseur vertical, et chaque bloc de
// texte a une largeur de retour à la ligne bornée : c'est ce qui manquait avant,
// les descriptions longues (Archer, Assassin) débordaient sous la bordure.
export default class ClassCard {
  constructor(scene, x, y, classDef, onSelect) {
    this.scene = scene;
    this.classDef = classDef;
    this.selected = false;
    this.hover = false;
    this.baseY = y;

    this.container = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.container.add(this.bg);

    const left = -CARD_W / 2 + PAD;
    const wrapW = CARD_W - PAD * 2;
    const top = -CARD_H / 2;
    let cy = top + 20;

    // aperçu du personnage
    const preview = scene.add.image(0, cy + 20, `player_${classDef.id}`).setScale(1.55);
    this.container.add(preview);
    cy += 48;

    const name = scene.add
      .text(0, cy, classDef.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '25px',
        color: '#e8e0d0',
      })
      .setOrigin(0.5, 0);
    this.container.add(name);
    cy += 34;

    const blurb = scene.add
      .text(0, cy, classDef.blurb, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '12px',
        color: MUTED,
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: wrapW },
      })
      .setOrigin(0.5, 0);
    this.container.add(blurb);
    cy += blurb.height + 12;

    this.dividers = [];
    this.dividers.push(cy);
    cy += 12;

    // --- statistiques, normalisées pour comparer les classes entre elles ---
    const stats = [
      { label: 'PV', value: classDef.stats.maxHp / 140 },
      { label: 'Vitesse', value: classDef.stats.speed / 330 },
      { label: 'Mana', value: classDef.stats.maxMana / 130 },
    ];
    this.statBars = [];
    stats.forEach((s) => {
      const label = scene.add
        .text(left, cy, s.label, {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '12px',
          color: LABEL,
        })
        .setOrigin(0, 0);
      this.container.add(label);

      const barX = left + 58;
      const barW = CARD_W - PAD * 2 - 58;
      this.statBars.push({ x: barX, y: cy + 4, w: barW, ratio: Phaser.Math.Clamp(s.value, 0, 1) });
      cy += 22;
    });

    cy += 2;
    this.dividers.push(cy);
    cy += 12;

    // --- capacités ---
    const attack = scene.add
      .text(left, cy, `⚔  ${classDef.attack.name}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '12.5px',
        color: LABEL,
      })
      .setOrigin(0, 0);
    this.container.add(attack);
    cy += 20;

    const special = scene.add
      .text(left, cy, `✦  ${classDef.special.name}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '12.5px',
        color: LABEL,
      })
      .setOrigin(0, 0);
    this.container.add(special);
    cy += 18;

    const specialDesc = scene.add
      .text(left, cy, classDef.special.description, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11.5px',
        color: MUTED,
        lineSpacing: 3,
        wordWrap: { width: wrapW },
      })
      .setOrigin(0, 0);
    this.container.add(specialDesc);
    cy += specialDesc.height + 12;

    this.dividers.push(cy);
    cy += 12;

    // --- passif, mis en avant à la couleur de la classe ---
    const passive = scene.add
      .text(left, cy, `◆  ${classDef.passive.name}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '12.5px',
        color: '#c9a24a',
      })
      .setOrigin(0, 0);
    this.container.add(passive);
    cy += 18;

    const passiveDesc = scene.add
      .text(left, cy, classDef.passive.description, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11.5px',
        color: '#a89878',
        lineSpacing: 3,
        wordWrap: { width: wrapW },
      })
      .setOrigin(0, 0);
    this.container.add(passiveDesc);

    // Garde-fou : si un texte dépasse le cadre, on le saura en développement
    // plutôt qu'à l'écran.
    const bottom = cy + passiveDesc.height;
    if (bottom > CARD_H / 2 - 8) {
      // eslint-disable-next-line no-console
      console.warn(
        `ClassCard ${classDef.id} : contenu trop haut (${Math.round(bottom)} > ${CARD_H / 2 - 8})`,
      );
    }

    this.container.setSize(CARD_W, CARD_H);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains,
    );
    this.container.on('pointerover', () => {
      this.hover = true;
      this.redraw();
    });
    this.container.on('pointerout', () => {
      this.hover = false;
      this.redraw();
    });
    this.container.on('pointerdown', () => onSelect(classDef.id));

    this.redraw();
  }

  setPosition(x, y) {
    this.baseY = y;
    this.container.setPosition(x, y + (this.hover || this.selected ? -4 : 0));
  }

  setSelected(value) {
    this.selected = value;
    this.redraw();
  }

  redraw() {
    const g = this.bg;
    const { color } = this.classDef;
    g.clear();

    const x = -CARD_W / 2;
    const y = -CARD_H / 2;
    const r = 12;

    // léger soulèvement au survol / à la sélection
    this.container.y = this.baseY + (this.hover || this.selected ? -4 : 0);

    // halo derrière la carte sélectionnée
    if (this.selected) {
      g.fillStyle(color, 0.1);
      g.fillRoundedRect(x - 5, y - 5, CARD_W + 10, CARD_H + 10, r + 4);
    }

    g.fillStyle(0x111119, this.selected ? 0.99 : 0.94);
    g.fillRoundedRect(x, y, CARD_W, CARD_H, r);

    // liseré haut à la couleur de la classe
    g.fillStyle(color, this.selected ? 1 : 0.55);
    g.fillRoundedRect(x + 1, y + 1, CARD_W - 2, 4, { tl: r, tr: r, bl: 0, br: 0 });

    let border = 0x2a2a38;
    let width = 1.5;
    if (this.selected) {
      border = color;
      width = 2.5;
    } else if (this.hover) {
      border = 0x5a5a72;
    }
    g.lineStyle(width, border, 1);
    g.strokeRoundedRect(x, y, CARD_W, CARD_H, r);

    // séparateurs
    g.lineStyle(1, 0xffffff, 0.07);
    this.dividers.forEach((dy) => {
      g.beginPath();
      g.moveTo(x + PAD, dy);
      g.lineTo(x + CARD_W - PAD, dy);
      g.strokePath();
    });

    // barres de stats
    this.statBars.forEach((b) => {
      g.fillStyle(0x14141c, 1);
      g.fillRoundedRect(b.x, b.y, b.w, 9, 4);
      g.fillStyle(color, this.selected ? 1 : 0.8);
      g.fillRoundedRect(b.x, b.y, Math.max(6, b.w * b.ratio), 9, 4);
    });
  }
}
