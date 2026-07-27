import { COLORS, WEAPONS, PORTAL } from '../config.js';

// HUD fixé à l'écran : vie, mana, et pastilles de cooldown des capacités de la
// classe jouée.
export default class Hud {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    const def = player.classDef;

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(1000);

    this.classLabel = scene.add
      .text(16, 16, def.name.toUpperCase(), {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#c9a24a',
        backgroundColor: '#0a0a0fcc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.hint = scene.add
      .text(
        16,
        52,
        'ZQSD bouger  •  Clic G : ' +
          def.attack.name +
          '  •  Clic D / Espace : ' +
          def.special.name +
          '  •  3 : Bouclier  •  E / R : portails  •  Échap : menu',
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '14px',
          color: '#8a8398',
          backgroundColor: '#0a0a0fcc',
          padding: { x: 8, y: 5 },
        },
      )
      .setScrollFactor(0)
      .setDepth(1000);

    // Les 3 emplacements dépendent de la classe
    this.slots = [
      { key: 'attack', label: 'Clic G', spec: def.attack, title: def.attack.name },
      { key: 'special', label: 'Clic D', spec: def.special, title: def.special.name },
      { key: 'shield', label: '3', spec: WEAPONS.shield, title: 'Bouclier' },
    ];

    // libellés des deux portails (positionnés dans drawPortalStatus)
    this.portalLabels = ['A', 'B'].map(() =>
      scene.add
        .text(0, 0, '', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#8a8398',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001),
    );
    this.portalKeys = ['E', 'R'].map((k) =>
      scene.add
        .text(0, 0, k, {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '12px',
          color: '#c9c2d4',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001),
    );

    this.slotTexts = [];
    this.slots.forEach((s, i) => {
      this.slotTexts.push(
        scene.add
          .text(this.slotX(i) + 26, this.slotY() + 62, s.label, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '12px',
            color: '#c9c2d4',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1001),
      );
      this.slotTexts.push(
        scene.add
          .text(this.slotX(i) + 26, this.slotY() - 12, s.title, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '11px',
            color: '#8a8398',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1001),
      );
    });
  }

  // État des deux portails (E / R) : posé + secondes restantes, ou cooldown.
  drawPortalStatus(g) {
    const sys = this.scene.portals;
    if (!sys) return;

    const p = this.player;
    const baseX = this.slotX(this.slots.length) + 14;
    const y = this.slotY();
    const size = 52;

    ['A', 'B'].forEach((slot, i) => {
      const x = baseX + i * 62;
      const cdRemaining = sys.placeCooldownRemaining(p, slot);
      const portal = sys.portalsOf(p).find((q) => q.slot === slot);

      g.fillStyle(COLORS.barBack, 0.92);
      g.fillRect(x, y, size, size);

      if (portal) {
        // jauge de durée de vie restante
        const ratio = portal.remaining / PORTAL.lifetime;
        g.fillStyle(COLORS.portalSelf, 0.28);
        g.fillRect(x, y + size * (1 - ratio), size, size * ratio);
      } else if (cdRemaining > 0) {
        g.fillStyle(0x000000, 0.62);
        g.fillRect(x, y, size, size * (cdRemaining / PORTAL.placeCooldown));
      }

      const linked = portal && portal.isLinked;
      g.lineStyle(2, linked ? COLORS.portalSelf : 0x4a4a5e, 1);
      g.strokeRect(x, y, size, size);

      const label = this.portalLabels[i];
      label.setPosition(x + size / 2, y + size / 2);
      if (portal) label.setText(`${slot}\n${Math.ceil(portal.remaining / 1000)}s`);
      else if (cdRemaining > 0) label.setText(`${slot}\n${Math.ceil(cdRemaining / 1000)}s`);
      else label.setText(slot);
      label.setColor(linked ? '#8ec7ff' : '#8a8398');

      const key = this.portalKeys[i];
      key.setPosition(x + size / 2, y + size + 10);
    });
  }

  // Le joueur est recréé à chaque réapparition : le HUD doit suivre la nouvelle
  // instance. La classe ne change pas en cours de match, donc les emplacements
  // restent valides.
  attach(player) {
    this.player = player;
  }

  slotX(i) {
    return 24 + i * 62;
  }

  slotY() {
    return this.scene.scale.height - 90;
  }

  update() {
    const g = this.gfx;
    const p = this.player;
    g.clear();

    const barW = 260;
    const barH = 16;
    const x = 24;
    const yHp = this.scene.scale.height - 160;
    const yMana = yHp + 24;

    // barre de vie
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    g.fillStyle(COLORS.barBack, 0.9);
    g.fillRect(x - 2, yHp - 2, barW + 4, barH + 4);
    g.fillStyle(hpRatio > 0.35 ? COLORS.hpFill : COLORS.hpLow, 1);
    g.fillRect(x, yHp, barW * hpRatio, barH);

    // barre de mana
    const manaRatio = Math.max(0, p.mana / p.maxMana);
    g.fillStyle(COLORS.barBack, 0.9);
    g.fillRect(x - 2, yMana - 2, barW + 4, barH + 4);
    g.fillStyle(COLORS.manaFill, 1);
    g.fillRect(x, yMana, barW * manaRatio, barH);

    this.drawPortalStatus(g);

    // pastilles de cooldown
    const now = this.scene.time.now;
    this.slots.forEach((slot, i) => {
      const sx = this.slotX(i);
      const sy = this.slotY();
      const size = 52;

      const endAt = p.cooldowns[slot.key] || 0;
      const remaining = Math.max(0, endAt - now);
      const ratio = remaining > 0 ? remaining / slot.spec.cooldown : 0;
      const affordable = p.mana >= (slot.spec.manaCost || 0);

      g.fillStyle(COLORS.barBack, 0.92);
      g.fillRect(sx, sy, size, size);
      if (ratio > 0) {
        g.fillStyle(0x000000, 0.62);
        g.fillRect(sx, sy, size, size * ratio);
      }

      let border = p.classDef.color;
      if (ratio > 0) border = 0x4a4a5e;
      else if (!affordable) border = 0x8a3a3a;
      g.lineStyle(2, border, 1);
      g.strokeRect(sx, sy, size, size);
    });
  }
}
