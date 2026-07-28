// Réglages persistants (localStorage) + helpers pour les points du code qui
// en dépendent. Centralisé ici pour que le panneau Options du menu et le
// gameplay lisent la même source.

const KEY = 'shadowgate-settings';

const DEFAULTS = {
  effectsQuality: 'high', // 'high' | 'low'
  screenShake: true,
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch (e) {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function getSetting(key) {
  return load()[key];
}

export function setSetting(key, value) {
  const s = load();
  s[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    // stockage indisponible (navigation privée) : le réglage vaut pour la session
  }
}

// Nombre de particules ajusté à la qualité choisie.
export function fxCount(n) {
  return getSetting('effectsQuality') === 'low' ? Math.max(1, Math.round(n / 2)) : n;
}

// Secousse caméra débrayable — remplace les appels directs à cameras.main.shake.
export function screenShake(scene, duration, intensity) {
  if (getSetting('screenShake')) scene.cameras.main.shake(duration, intensity);
}
