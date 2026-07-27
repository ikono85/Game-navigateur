import Phaser from 'phaser';
import {
  ACTIONS,
  getBinding,
  setBinding,
  resetBindings,
  keyDisplayName,
  keyCodeToName,
  isBindable,
} from '../systems/Keybindings.js';

// Écran titre.
//
// Ambiance dark fantasy : torches vacillantes de chaque côté, halo pourpre
// central, blason doré et titre gravé, boutons parchemin en colonne. Rien
// n'utilise le LightingSystem (multiply mask) — le menu doit rester lisible,
// on simule l'atmosphère avec un fond dégradé, une vignette, et des lumières
// additives autour des torches.
//
// Toute la mise en page se recalcule dans layout() : le canvas suit la fenêtre.

const GOLD = '#c9a24a';
const GOLD_HEX = 0xc9a24a;
const GOLD_DARK = 0x6a5a2a;
const PARCHMENT = '#e8d8b0';
const IRON_DEEP = 0x0a0a12;
const IRON_MID = 0x1a1a22;

const BTN_W = 320;
const BTN_H = 54;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // 1. Fond : noir de garde + image d'ambiance (salle du trône) en cover
    this.bg = this.add.rectangle(0, 0, 4000, 3000, IRON_DEEP).setOrigin(0).setDepth(0);
    this.bgImage = this.add.image(0, 0, 'menu_bg').setDepth(0).setAlpha(0.9);
    this.backdrop = this.add.graphics().setDepth(1);

    // 2. Vignette écran, subtile (sous les torches pour ne pas les éteindre)
    this.vignette = this.add.image(0, 0, 'vignette').setDepth(5).setAlpha(0.9);

    // 3. Torches (sconce + flamme ADD + halo ADD). État conservé pour flicker.
    this.torches = [this.makeTorch(0), this.makeTorch(1)];

    // 4. Embers qui remontent du bas : petit souffle chaud continu
    this.embers = this.add.particles(0, 0, 'speck', {
      x: { min: -180, max: 180 },
      speedY: { min: -55, max: -25 },
      speedX: { min: -10, max: 10 },
      lifespan: { min: 2400, max: 4200 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.65, end: 0 },
      tint: [0xffb050, 0xff8030, 0xffd080],
      blendMode: 'ADD',
      frequency: 180,
      quantity: 1,
    }).setDepth(15);

    // 5. Blason peint (image du pack UI)
    this.crest = this.add
      .image(0, 0, 'crest_shadowgate')
      .setOrigin(0.5)
      .setDepth(100);

    // 6. Logo peint (image du pack UI, 720×160)
    this.title = this.add
      .image(0, 0, 'logo_title')
      .setOrigin(0.5)
      .setDepth(100);

    this.subtitle = this.add
      .text(0, 0, 'Arène du Portail — Dark Fantasy médiévale', {
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: '18px',
        color: '#9a8a70',
      })
      .setOrigin(0.5)
      .setDepth(100);

    // 7. Boutons du menu
    this.buttons = [
      this.makeButton('▶  JOUER', () => this.scene.start('ClassSelectScene')),
      this.makeButton('⚔  COMMANDES', () => this.openCommandsPanel()),
      this.makeButton('✧  CRÉDITS', () => this.openCreditsPanel()),
    ];

    // 8. Footer
    this.footer = this.add
      .text(0, 0, 'v0.1 — Phase 4', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#5a5464',
      })
      .setOrigin(1, 1)
      .setDepth(120);

    // Layout initial + suivi de resize
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
    });

    // Raccourcis clavier : ENTRÉE / ESPACE pour lancer, C pour commandes.
    // Les handlers vérifient l'absence de panneau ouvert pour ne pas voler
    // les touches destinées à une saisie de rebind.
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.panel) this.scene.start('ClassSelectScene');
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.panel) this.scene.start('ClassSelectScene');
    });
    this.input.keyboard.on('keydown-C', () => {
      if (!this.panel) this.openCommandsPanel();
    });

    // Animation continue des flammes
    this.events.on(Phaser.Scenes.Events.UPDATE, this.tickTorches, this);
  }

  // --- Torche : sconce + flamme + halo lumineux additif ---
  makeTorch(index) {
    const sconce = this.add.image(0, 0, 'sconce').setDepth(10).setScale(1.6);
    const halo = this.add
      .image(0, 0, 'lightRadial')
      .setDepth(11)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffaa60)
      .setAlpha(0.55)
      .setScale(1.1);
    const flame = this.add
      .image(0, 0, 'flame')
      .setDepth(12)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setOrigin(0.5, 1)
      .setScale(1.8);
    return {
      sconce,
      halo,
      flame,
      phase: Math.random() * Math.PI * 2 + index * 1.3,
    };
  }

  tickTorches(time) {
    const t = time / 1000;
    this.torches.forEach((torch) => {
      const flick =
        0.5 +
        0.3 * Math.sin(t * 8.7 + torch.phase) +
        0.2 * Math.sin(t * 19.3 + torch.phase * 1.7);
      torch.flame.setScale(1.7 + 0.22 * flick, 1.6 + 0.4 * flick);
      torch.flame.setAlpha(0.85 + 0.15 * flick);
      torch.halo.setAlpha(0.45 + 0.2 * flick);
      torch.halo.setScale(1.0 + 0.15 * flick);
    });
  }

  // --- Bouton parchemin/iron doré ---
  //
  // Pattern éprouvé : la cible de clic est une Rectangle GameObject invisible
  // ajoutée AU-DESSUS du fond visuel. Une Rectangle a son propre hit-test avec
  // origine 0.5 par défaut, donc parfaitement centrée sur la position du
  // container. Éviter Container.setInteractive(Geom.Rectangle) qui, combiné
  // à setSize, décale le hit-test vers le coin haut-gauche selon les versions.
  makeButton(label, onClick) {
    const c = this.add.container(0, 0).setDepth(110);
    const bg = this.add.graphics();
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: PARCHMENT,
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 6, false, true);

    const drawBg = (state) => {
      bg.clear();
      const fillColor = state === 'hover' ? 0x22222e : IRON_MID;
      bg.fillStyle(fillColor, 0.92);
      bg.fillRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 6);

      bg.lineStyle(2, state === 'hover' ? GOLD_HEX : GOLD_DARK, state === 'hover' ? 1 : 0.9);
      bg.strokeRoundedRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 6);
      bg.lineStyle(1, 0x3a3a44, 0.6);
      bg.strokeRoundedRect(-BTN_W / 2 + 4, -BTN_H / 2 + 4, BTN_W - 8, BTN_H - 8, 4);

      const orn = 9;
      bg.lineStyle(1.4, state === 'hover' ? GOLD_HEX : 0x8a7a4a, 1);
      const corners = [
        [-BTN_W / 2 + 6, -BTN_H / 2 + 6, 1, 1],
        [BTN_W / 2 - 6, -BTN_H / 2 + 6, -1, 1],
        [-BTN_W / 2 + 6, BTN_H / 2 - 6, 1, -1],
        [BTN_W / 2 - 6, BTN_H / 2 - 6, -1, -1],
      ];
      corners.forEach(([x, y, sx, sy]) => {
        bg.beginPath();
        bg.moveTo(x, y + sy * orn);
        bg.lineTo(x, y);
        bg.lineTo(x + sx * orn, y);
        bg.strokePath();
      });
    };
    drawBg('idle');

    // Rectangle transparente au centre du container — c'est ELLE qui écoute.
    const hit = this.add
      .rectangle(0, 0, BTN_W, BTN_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // bg (fond) → hit (au-dessus, invisible) → txt (au-dessus, cliquable)
    c.add([bg, hit, txt]);

    hit.on('pointerover', () => {
      drawBg('hover');
      txt.setColor(GOLD);
    });
    hit.on('pointerout', () => {
      drawBg('idle');
      txt.setColor(PARCHMENT);
    });
    hit.on('pointerdown', () => {
      drawBg('hover');
      txt.setColor('#fff2c0');
    });
    hit.on('pointerup', () => {
      if (this.panel) return;
      onClick();
    });

    return c;
  }

  // Positionne le blason peint (l'image du pack UI). Ancienne version dessinée
  // au Graphics remplacée par crest_shadowgate.png.
  drawCrest(x, y) {
    this.crest.setPosition(x, y);
  }

  // --- Layout global ---
  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    // fond noir : couvre tout l'écran quelle que soit la taille
    this.bg.setSize(w, h);

    // image d'ambiance en cover : remplit l'écran sans déformer
    const cover = Math.max(w / this.bgImage.width, h / this.bgImage.height);
    this.bgImage.setScale(cover).setPosition(cx, h / 2);

    // vignette : centrée, un peu plus grande que l'écran
    const vSize = Math.max(w, h) * 1.4;
    this.vignette.setPosition(cx, h / 2).setDisplaySize(vSize, vSize);

    // halo pourpre derrière le titre
    this.backdrop.clear();
    this.backdrop.fillStyle(0x1a1428, 0.55);
    this.backdrop.fillCircle(cx, h * 0.42, Math.max(w, h) * 0.42);
    this.backdrop.fillStyle(0x241a33, 0.35);
    this.backdrop.fillCircle(cx, h * 0.42, Math.max(w, h) * 0.22);

    // Torches sur les colonnes latérales, à ~13% et 87% de la largeur, en
    // hauteur alignée sur le titre pour créer une composition symétrique.
    const torchY = h * 0.35;
    const positions = [
      { x: w * 0.13, y: torchY },
      { x: w * 0.87, y: torchY },
    ];
    this.torches.forEach((t, i) => {
      const p = positions[i];
      t.sconce.setPosition(p.x, p.y);
      t.flame.setPosition(p.x, p.y - 10);
      t.halo.setPosition(p.x, p.y - 4);
    });

    // Embers depuis le bord bas
    this.embers.setPosition(cx, h + 20);

    // Logo : borné à 60 % de la largeur pour ne pas dominer sur un écran
    // étroit, et on positionne crest/sous-titre en partant de sa hauteur
    // rendue plutôt que d'offsets fixes qui écrasaient les deux voisins.
    const logoScale = Math.min(1, (w * 0.6) / this.title.width);
    this.title.setScale(logoScale);
    const logoH = this.title.height * logoScale;
    const logoY = h * 0.32;
    this.title.setPosition(cx, logoY);

    // Blason au-dessus : réduit, et positionné depuis SA demi-hauteur pour
    // que son bord bas reste à distance du bord haut du logo.
    const crestScale = 0.72;
    this.crest.setScale(crestScale);
    const crestHalf = (this.crest.height * crestScale) / 2;
    this.drawCrest(cx, logoY - logoH / 2 - crestHalf - 12);

    // Sous-titre juste sous le logo
    this.subtitle.setPosition(cx, logoY + logoH / 2 + 18);

    // Colonne de boutons centrée
    const btnStart = h * 0.52;
    const gap = 68;
    this.buttons.forEach((b, i) => b.setPosition(cx, btnStart + i * gap));

    this.footer.setPosition(w - 14, h - 8);

    // Un panneau ouvert doit se recentrer
    if (this.panel) {
      this.panel.setPosition(cx, h / 2);
    }
  }

  // --- Cadre commun aux modales : voile + fond + bordure + croix fermer ---
  // Retourne { container, W, H } — l'appelant y ajoute son contenu.
  makePanelFrame(W, H, titleText) {
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.add.container(w / 2, h / 2).setDepth(200);

    const veil = this.add
      .rectangle(-w * 2, -h * 2, w * 4, h * 4, 0x000000, 0.55)
      .setOrigin(0)
      .setInteractive();
    c.add(veil);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f18, 0.96);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 10);
    bg.lineStyle(2, GOLD_HEX, 0.9);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 10);
    bg.lineStyle(1, GOLD_DARK, 0.6);
    bg.strokeRoundedRect(-W / 2 + 5, -H / 2 + 5, W - 10, H - 10, 8);
    bg.lineStyle(1, GOLD_HEX, 0.65);
    bg.beginPath();
    bg.moveTo(-W / 2 + 40, -H / 2 + 62);
    bg.lineTo(W / 2 - 40, -H / 2 + 62);
    bg.strokePath();

    const title = this.add
      .text(0, -H / 2 + 34, titleText, {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: GOLD,
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000', 8, false, true);

    const closeBtn = this.add
      .text(W / 2 - 22, -H / 2 + 22, '✕', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#8a7a4a',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor(GOLD));
    closeBtn.on('pointerout', () => closeBtn.setColor('#8a7a4a'));
    closeBtn.on('pointerdown', () => this.closePanel());

    c.add([bg, title, closeBtn]);
    this.panel = c;
    return { container: c, W, H };
  }

  // --- Panneau CRÉDITS (statique) ---
  openCreditsPanel() {
    if (this.panel) this.closePanel();
    const W = Math.min(560, this.scale.width * 0.86);
    const H = Math.min(440, this.scale.height * 0.78);
    const { container: c } = this.makePanelFrame(W, H, 'CRÉDITS');

    const body = this.add
      .text(
        0, -H / 2 + 84,
        [
          'ShadowGate Arena',
          'Prototype solo — Phase 4',
          '',
          'Moteur       Phaser 3',
          'Bundler      Vite',
          '',
          'Tuiles de donjon',
          '   Top Down Dungeon Pack',
          '   Screaming Brain Studios (CC0)',
          '',
          'Personnages, portails, particules,',
          'lumières  :  dessinés au Canvas 2D',
        ].join('\n'),
        {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '14px',
          color: PARCHMENT,
          align: 'left',
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5, 0);
    c.add(body);

    this.registerPanelEsc();
  }

  // --- Panneau COMMANDES (interactif : chaque touche est réassignable) ---
  openCommandsPanel() {
    if (this.panel) this.closePanel();
    const W = Math.min(580, this.scale.width * 0.9);
    const H = Math.min(580, this.scale.height * 0.92);
    const { container: c } = this.makePanelFrame(W, H, 'COMMANDES');

    this.keySlots = {};
    const rowY0 = -H / 2 + 90;
    const rowH = 40;

    ACTIONS.forEach((action, i) => {
      const y = rowY0 + i * rowH;
      const label = this.add
        .text(-W / 2 + 40, y, action.label, {
          fontFamily: 'Georgia, serif',
          fontSize: '17px',
          color: PARCHMENT,
        })
        .setOrigin(0, 0.5);
      const slot = this.makeKeySlot(action.id, W / 2 - 100, y);
      c.add([label, slot.container]);
      this.keySlots[action.id] = slot;
    });

    // Info souris — non éditable, séparée du reste par un petit espace
    const infoY = rowY0 + ACTIONS.length * rowH + 12;
    const mouseInfo = this.add
      .text(
        0, infoY,
        'Souris  —  clic gauche : attaque   ·   clic droit : spécial',
        {
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '13px',
          color: '#7a7284',
        },
      )
      .setOrigin(0.5);
    c.add(mouseInfo);

    // Bouton Réinitialiser + astuce
    const resetY = infoY + 36;
    const resetBtn = this.makeSmallButton('↺  Réinitialiser', 0, resetY, () => {
      if (this.rebinding) this.cancelRebind();
      resetBindings();
      this.refreshKeySlots();
    });
    c.add(resetBtn);

    const tipY = resetY + 34;
    const tip = this.add
      .text(0, tipY, 'Clique sur une touche pour la modifier · Échap pour annuler', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#5a5464',
      })
      .setOrigin(0.5);
    c.add(tip);

    this.registerPanelEsc();
  }

  // ESC : ferme le panneau, sauf si un rebind est en cours (auquel cas il
  // annule le rebind sans fermer). Le handler est réattaché à chaque ouverture.
  registerPanelEsc() {
    this.panelEscHandler = (event) => {
      if (this.rebinding) {
        // On laisse le handler de rebind s'en charger : il annule et sort.
        return;
      }
      this.closePanel();
    };
    this.input.keyboard.on('keydown-ESC', this.panelEscHandler);
  }

  // --- Key slot : bouton qui montre la touche courante et démarre un rebind ---
  makeKeySlot(actionId, x, y) {
    const SW = 130;
    const SH = 32;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const txt = this.add
      .text(0, 0, keyDisplayName(getBinding(actionId)), {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '15px',
        color: GOLD,
      })
      .setOrigin(0.5);

    const drawBg = (state) => {
      bg.clear();
      const fill =
        state === 'waiting' ? 0x33231a
          : state === 'hover' ? 0x22222e
            : IRON_MID;
      bg.fillStyle(fill, 0.94);
      bg.fillRoundedRect(-SW / 2, -SH / 2, SW, SH, 5);
      const border =
        state === 'waiting' ? 0xffa040
          : state === 'hover' ? GOLD_HEX
            : GOLD_DARK;
      bg.lineStyle(1.6, border, 1);
      bg.strokeRoundedRect(-SW / 2, -SH / 2, SW, SH, 5);
    };
    drawBg('idle');

    // Cible de clic centrée sur (0,0) — même raison que makeButton.
    const hit = this.add
      .rectangle(0, 0, SW, SH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    container.add([bg, hit, txt]);

    const slot = { container, txt, actionId, state: 'idle' };
    slot.setState = (state) => {
      slot.state = state;
      drawBg(state);
    };
    slot.setLabel = (name) => txt.setText(keyDisplayName(name));

    hit.on('pointerover', () => {
      if (slot.state !== 'waiting') drawBg('hover');
    });
    hit.on('pointerout', () => {
      if (slot.state !== 'waiting') drawBg('idle');
    });
    hit.on('pointerdown', () => this.startRebind(actionId));

    return slot;
  }

  // --- Cycle de vie du rebind ---
  startRebind(actionId) {
    // Un clic sur un autre slot annule la saisie en cours
    if (this.rebinding && this.rebinding !== actionId) this.cancelRebind();

    this.rebinding = actionId;
    const slot = this.keySlots[actionId];
    slot.setState('waiting');
    slot.txt.setText('…');

    this.rebindHandler = (event) => {
      const code = event.keyCode;
      // Escape annule sans changer le binding, et sans fermer le panneau
      if (code === Phaser.Input.Keyboard.KeyCodes.ESC) {
        // Empêche l'ESC de remonter au handler qui fermerait le panneau
        event.stopPropagation && event.stopPropagation();
        if (event.originalEvent && event.originalEvent.stopImmediatePropagation) {
          event.originalEvent.stopImmediatePropagation();
        }
        this.cancelRebind();
        return;
      }
      if (!isBindable(code)) return; // modificateurs seuls, Tab
      const name = keyCodeToName(code);
      if (!name) return;
      this.commitRebind(name);
    };
    this.input.keyboard.on('keydown', this.rebindHandler);
  }

  commitRebind(name) {
    const actionId = this.rebinding;
    if (!actionId) return;
    setBinding(actionId, name);
    this.stopRebind();
    // Un swap peut avoir modifié plusieurs slots : on rafraîchit tout.
    this.refreshKeySlots();
  }

  cancelRebind() {
    const actionId = this.rebinding;
    this.stopRebind();
    if (actionId && this.keySlots && this.keySlots[actionId]) {
      const s = this.keySlots[actionId];
      s.setState('idle');
      s.setLabel(getBinding(actionId));
    }
  }

  stopRebind() {
    if (this.rebindHandler) {
      this.input.keyboard.off('keydown', this.rebindHandler);
      this.rebindHandler = null;
    }
    this.rebinding = null;
  }

  refreshKeySlots() {
    if (!this.keySlots) return;
    Object.entries(this.keySlots).forEach(([actionId, slot]) => {
      slot.setState('idle');
      slot.setLabel(getBinding(actionId));
    });
  }

  // Petit bouton compact utilisé dans les panneaux (Réinitialiser…).
  makeSmallButton(label, x, y, onClick) {
    const W = 180;
    const H = 34;
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: PARCHMENT,
      })
      .setOrigin(0.5);
    const drawBg = (state) => {
      bg.clear();
      const fill = state === 'hover' ? 0x22222e : IRON_MID;
      bg.fillStyle(fill, 0.9);
      bg.fillRoundedRect(-W / 2, -H / 2, W, H, 5);
      bg.lineStyle(1.4, state === 'hover' ? GOLD_HEX : GOLD_DARK, 1);
      bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 5);
    };
    drawBg('idle');
    const hit = this.add
      .rectangle(0, 0, W, H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    c.add([bg, hit, txt]);
    hit.on('pointerover', () => { drawBg('hover'); txt.setColor(GOLD); });
    hit.on('pointerout', () => { drawBg('idle'); txt.setColor(PARCHMENT); });
    hit.on('pointerup', onClick);
    return c;
  }

  closePanel() {
    if (!this.panel) return;
    if (this.rebinding) this.stopRebind();
    this.panel.destroy();
    this.panel = null;
    this.keySlots = null;
    if (this.panelEscHandler) {
      this.input.keyboard.off('keydown-ESC', this.panelEscHandler);
      this.panelEscHandler = null;
    }
  }
}
