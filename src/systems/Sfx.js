// Effets sonores synthétisés à la volée via l'API Web Audio.
//
// Aucun fichier audio binaire : dans l'esprit du reste du projet (textures
// peintes au Canvas, sons générés au runtime). Chaque effet est une courte
// enveloppe d'oscillateur et/ou de bruit blanc filtré.
//
// Politique d'autoplay : les navigateurs interdisent le son tant que
// l'utilisateur n'a pas interagi. Le contexte audio est donc créé paresseusement
// et « débloqué » au premier geste (voir Sfx.unlock, appelé depuis main.js).

import { getSetting } from './Settings.js';

let ctx = null;
let master = null;

function ensure() {
  if (getSetting('sound') === false) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35; // volume global modéré
    master.connect(ctx.destination);
  }
  // Reprend le contexte suspendu (onglet réactivé, premier geste).
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Un oscillateur avec enveloppe d'amplitude, éventuel glissando de fréquence.
function tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.3, freqEnd = null, delay = 0 }) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  // exponentialRamp ne peut pas viser 0 : on part/retombe sur une valeur ténue.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Une bouffée de bruit blanc filtré (impacts, explosions).
function noise({ dur = 0.2, gain = 0.3, type = 'lowpass', freq = 1000, delay = 0 }) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

const Sfx = {
  // Débloque le contexte audio (à appeler sur un geste utilisateur).
  unlock() {
    ensure();
  },
  // Coup d'épée / dague : descente courte + friction.
  melee() {
    tone({ freq: 320, type: 'triangle', dur: 0.09, gain: 0.22, freqEnd: 150 });
    noise({ dur: 0.05, gain: 0.1, freq: 2600 });
  },
  // Tir de projectile (flèche, boule de feu).
  shoot() {
    tone({ freq: 880, type: 'square', dur: 0.08, gain: 0.13, freqEnd: 480 });
  },
  // Capacité spéciale : montée arcanique.
  special() {
    tone({ freq: 180, type: 'sawtooth', dur: 0.3, gain: 0.22, freqEnd: 520 });
  },
  // Explosion de zone.
  explosion() {
    noise({ dur: 0.35, gain: 0.38, freq: 640 });
    tone({ freq: 120, type: 'sine', dur: 0.35, gain: 0.28, freqEnd: 42 });
  },
  // Mort d'un acteur : glissando descendant sombre.
  death() {
    tone({ freq: 300, type: 'triangle', dur: 0.5, gain: 0.26, freqEnd: 70 });
  },
  // Pose d'un portail : montée cristalline.
  portal() {
    tone({ freq: 520, type: 'sine', dur: 0.24, gain: 0.18, freqEnd: 1180 });
  },
  // Clic d'interface.
  ui() {
    tone({ freq: 660, type: 'sine', dur: 0.06, gain: 0.13 });
  },
};

export default Sfx;
