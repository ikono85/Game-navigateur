// Tableau des scores, ancré en haut à droite.
//
// Il ne se redessine que sur élimination, pas à chaque frame : rien d'autre ne
// le fait bouger.
export default class Scoreboard {
  constructor(scene, roster, target) {
    this.scene = scene;
    this.roster = roster;
    this.target = target;

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.rows = roster.map(() =>
      scene.add
        .text(0, 0, '', {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '14px',
          color: '#c9c2d4',
        })
        .setScrollFactor(0)
        .setDepth(1001),
    );
    this.scoreTexts = roster.map(() =>
      scene.add
        .text(0, 0, '', {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '14px',
          color: '#e8e0d0',
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1001),
    );

    this.title = scene.add
      .text(0, 0, `Premier à ${target}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11px',
        color: '#8a8398',
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.onResize = () => this.update();
    scene.scale.on('resize', this.onResize, this);
    this.update();
  }

  update() {
    const w = 188;
    const rowH = 21;
    const x = this.scene.scale.width - w - 20;
    const y = 16;
    const h = 30 + this.roster.length * rowH + 8;

    const g = this.gfx;
    g.clear();
    g.fillStyle(0x0a0a0f, 0.82);
    g.fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, 0xffffff, 0.09);
    g.strokeRoundedRect(x, y, w, h, 8);

    this.title.setPosition(x + 12, y + 9);

    // classement décroissant, le joueur reste identifiable par sa couleur
    const ordered = this.roster
      .map((e, i) => ({ e, i }))
      .sort((a, b) => b.e.score - a.e.score);

    ordered.forEach(({ e }, rank) => {
      const ry = y + 30 + rank * rowH;
      const label = this.rows[rank];
      const score = this.scoreTexts[rank];

      label.setText(e.isPlayer ? e.name : `${e.name}`);
      label.setColor(e.isPlayer ? '#c9a24a' : '#9a93a8');
      label.setPosition(x + 12, ry);

      score.setText(`${e.score}`);
      score.setColor(e.isPlayer ? '#c9a24a' : '#c9c2d4');
      score.setPosition(x + w - 12, ry);

      // liseré à la couleur de la classe
      g.fillStyle(e.classDef.color, e.isPlayer ? 1 : 0.7);
      g.fillRect(x + 5, ry + 4, 3, 12);
    });
  }

  destroy() {
    this.scene.scale.off('resize', this.onResize, this);
    this.gfx.destroy();
    this.title.destroy();
    this.rows.forEach((t) => t.destroy());
    this.scoreTexts.forEach((t) => t.destroy());
  }
}
