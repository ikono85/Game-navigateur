import Phaser from 'phaser';

// Registre des touches réassignables.
//
// Les valeurs stockées sont des NOMS de constantes de `Phaser.Input.Keyboard.KeyCodes`
// (ex. 'Z', 'SPACE', 'THREE'). C'est ce que `addKeys` attend et c'est facilement
// sérialisable — bien plus stable qu'un keyCode numérique dépendant du navigateur.
//
// Persistance dans localStorage. Version dans la clé pour pouvoir invalider les
// anciens formats sans risquer un crash au chargement.

const STORAGE_KEY = 'shadowgate.keybindings.v1';

// Liste ordonnée : le panneau UI la parcourt telle quelle.
export const ACTIONS = [
  { id: 'moveUp',    label: 'Avancer',          defaultKey: 'Z' },
  { id: 'moveDown',  label: 'Reculer',          defaultKey: 'S' },
  { id: 'moveLeft',  label: 'Aller à gauche',   defaultKey: 'Q' },
  { id: 'moveRight', label: 'Aller à droite',   defaultKey: 'D' },
  { id: 'special',   label: 'Capacité spéciale', defaultKey: 'SPACE' },
  { id: 'shield',    label: 'Bouclier',         defaultKey: 'THREE' },
  { id: 'portalA',   label: 'Portail A',        defaultKey: 'E' },
  { id: 'portalB',   label: 'Portail B',        defaultKey: 'R' },
];

const KC = Phaser.Input.Keyboard.KeyCodes;

function isValidKeyName(name) {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(KC, name);
}

function defaults() {
  const o = {};
  ACTIONS.forEach((a) => { o[a.id] = a.defaultKey; });
  return o;
}

// Sanitise : une valeur inconnue (typo, ancien schéma) retombe sur le défaut.
function sanitize(obj) {
  const d = defaults();
  const out = {};
  ACTIONS.forEach((a) => {
    const v = obj && obj[a.id];
    out[a.id] = isValidKeyName(v) ? v : d[a.id];
  });
  return out;
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    return sanitize(JSON.parse(raw));
  } catch (_e) {
    return defaults();
  }
}

function persist() {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_e) { /* quota / private mode */ }
}

const state = load();

export function getBinding(actionId) {
  return state[actionId];
}

export function allBindings() {
  return { ...state };
}

// Assigne une touche à une action. Si la touche appartenait déjà à une autre
// action, on échange : c'est le comportement attendu d'un menu de bindings et
// ça évite qu'un slot devienne muet sans que l'utilisateur s'en rende compte.
export function setBinding(actionId, keyName) {
  if (!isValidKeyName(keyName)) return;
  if (state[actionId] === keyName) return;

  const conflict = ACTIONS.find((a) => a.id !== actionId && state[a.id] === keyName);
  if (conflict) {
    state[conflict.id] = state[actionId];
  }
  state[actionId] = keyName;
  persist();
}

export function resetBindings() {
  Object.assign(state, defaults());
  persist();
}

// Rendu lisible d'un nom de KeyCode. Les touches physiques sont montrées avec
// leur symbole (flèches, chiffres) ou leur nom francisé (Espace, Échap).
const DISPLAY = {
  SPACE: 'Espace',
  SHIFT: 'Maj',
  CONTROL: 'Ctrl',
  ALT: 'Alt',
  ENTER: 'Entrée',
  BACKSPACE: '←Suppr',
  TAB: 'Tab',
  ESC: 'Échap',
  UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→',
  ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
  FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9',
  NUMPAD_ZERO: 'Pav 0', NUMPAD_ONE: 'Pav 1', NUMPAD_TWO: 'Pav 2',
  NUMPAD_THREE: 'Pav 3', NUMPAD_FOUR: 'Pav 4', NUMPAD_FIVE: 'Pav 5',
  NUMPAD_SIX: 'Pav 6', NUMPAD_SEVEN: 'Pav 7', NUMPAD_EIGHT: 'Pav 8',
  NUMPAD_NINE: 'Pav 9',
  OPEN_BRACKET: '[', CLOSED_BRACKET: ']',
  SEMICOLON: ';', COMMA: ',', PERIOD: '.', QUOTES: "'",
  MINUS: '-', PLUS: '+',
};

export function keyDisplayName(name) {
  if (!name) return '—';
  if (DISPLAY[name]) return DISPLAY[name];
  return name; // A..Z, F1..F12
}

// Utilitaire pour l'écran de rebind : donne le NOM PhaserKeyCode à partir du
// keyCode numérique livré par l'événement DOM.
const CODE_TO_NAME = (() => {
  const out = {};
  Object.entries(KC).forEach(([name, code]) => {
    if (typeof code === 'number' && !(code in out)) out[code] = name;
  });
  return out;
})();

export function keyCodeToName(code) {
  return CODE_TO_NAME[code] || null;
}

// Touches non-liables : modificateurs seuls (inutiles) et Tab (accessibilité).
// Escape a un usage réservé (annulation) et n'est pas non plus assignable.
const UNBINDABLE = new Set([
  KC.SHIFT, KC.CONTROL, KC.ALT,
  KC.TAB, KC.ESC,
  93, 91, // Meta / Windows keys (pas dans KeyCodes)
]);

export function isBindable(code) {
  return !UNBINDABLE.has(code);
}
