import Phaser from 'phaser';
import '../ui/class-select/class-select.css';

// Correspondance carte → id de classe du jeu. Les visuels parlent français
// (« guerrier ») alors que les définitions de classes sont en anglais.
const CARDS = [
  { slot: 'guerrier', classId: 'warrior', label: 'LE GUERRIER' },
  { slot: 'mage', classId: 'mage', label: 'LE MAGE' },
  { slot: 'archer', classId: 'archer', label: "L'ARCHER" },
  { slot: 'assassin', classId: 'assassin', label: "L'ASSASSIN" },
];

// Écran de sélection de classe en HTML/CSS superposé au canvas Phaser.
// La scène Phaser ne rend rien elle-même : elle monte l'overlay DOM à
// l'entrée et le démonte à la sortie (shutdown).
export default class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  create() {
    this.selectedId = null;
    this.buildOverlay();

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.events.once('shutdown', () => this.destroyOverlay());
  }

  buildOverlay() {
    const cardHtml = (c) => `
      <article class="cs-card" data-class="${c.slot}" data-class-id="${c.classId}" tabindex="0" role="button" aria-pressed="false">
        <div class="cs-art">
          <span class="cs-ember cs-ember--tl"></span>
          <span class="cs-ember cs-ember--tr"></span>
          <span class="cs-ember cs-ember--bl"></span>
          <span class="cs-ember cs-ember--br"></span>
        </div>
        <div class="cs-plate">
          <span class="cs-runes">ᛗ ᚱ ᚦ</span>
          <span class="cs-name">${c.label}</span>
          <span class="cs-runes">ᚲ ᚹ ᛊ</span>
        </div>
        <button type="button" class="cs-btn">SÉLECTIONNER</button>
      </article>`;

    this.overlay = document.createElement('div');
    this.overlay.className = 'cs-overlay';
    this.overlay.innerHTML = `
      <section class="cs-root">
        <div class="cs-panel">
          <div class="cs-banner">
            <div class="cs-banner__inner">
              <h1 class="cs-title">CHOISISSEZ VOTRE CLASSE</h1>
            </div>
          </div>
          <div class="cs-grid">${CARDS.map(cardHtml).join('')}</div>
          <p class="cs-status">Le sort n'est pas encore jeté…</p>
          <button type="button" class="cs-start" disabled>ENTRER DANS L'ARÈNE</button>
          <p class="cs-hint">Clic G : attaquer • Clic D / Espace : spécial • 3 : bouclier • E / R : portails • Échap : retour</p>
        </div>
      </section>`;
    document.body.appendChild(this.overlay);

    const cards = Array.from(this.overlay.querySelectorAll('.cs-card'));
    const status = this.overlay.querySelector('.cs-status');
    const startBtn = this.overlay.querySelector('.cs-start');

    const select = (card) => {
      const id = card.dataset.classId;
      const name = card.querySelector('.cs-name').textContent.trim();
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-pressed', String(on));
        c.querySelector('.cs-btn').textContent = on ? 'CHOISI ✓' : 'SÉLECTIONNER';
      });
      this.selectedId = id;
      status.textContent = `Votre destin : ${name}`;
      startBtn.disabled = false;
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => select(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(card);
        }
      });
    });
    startBtn.addEventListener('click', () => this.startGame());
  }

  destroyOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  startGame() {
    if (!this.selectedId) return;
    this.scene.start('GameScene', { classId: this.selectedId });
  }
}
