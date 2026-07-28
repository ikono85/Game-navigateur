import Phaser from 'phaser';
import { fxCount } from '../systems/Settings.js';

// Effets de particules. Regroupés en helpers statiques pour éviter d'éparpiller
// les configs d'emitters dans les entités qui les demandent.
//
// Convention : les effets one-shot (sparks, blood, explosion) sont "explode" et
// laissent Phaser détruire l'emitter à la fin ; les effets continus (embers de
// projectile, wisps de portail) renvoient l'emitter — c'est à l'appelant de le
// stopper/détruire quand la source disparaît.

export default class Particles {
  // Gerbe d'étincelles à l'impact d'une arme mêlée. La cone est orientée
  // dans la direction du coup pour lire d'où venait la frappe.
  static sparks(scene, x, y, angle, count = 12) {
    const spread = 0.7; // radians de dispersion autour de l'angle
    const em = scene.add.particles(x, y, 'speck', {
      speed: { min: 80, max: 220 },
      angle: { min: Phaser.Math.RadToDeg(angle - spread), max: Phaser.Math.RadToDeg(angle + spread) },
      lifespan: { min: 180, max: 380 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xfff2c0, 0xffb050, 0xffe090],
      blendMode: 'ADD',
      emitting: false,
    });
    em.setDepth(430);
    em.explode(fxCount(count));
    scene.time.delayedCall(500, () => em.destroy());
  }

  // Traînée continue attachée à un projectile en vol. Retourne l'emitter :
  // l'appelant appelle .stop() quand le projectile meurt.
  static embers(scene, target) {
    const em = scene.add.particles(0, 0, 'speck', {
      speed: { min: 10, max: 40 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 200, max: 380 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xffcc60, 0xff9040, 0xffe090],
      blendMode: 'ADD',
      frequency: 25,
      quantity: 2,
    });
    em.setDepth(420);
    em.startFollow(target);
    return em;
  }

  // Bouffée d'explosion : gerbe de braises éjectées radialement + fumée noire
  // qui monte et se dilate.
  static explosion(scene, x, y, radius) {
    // braises
    const embers = scene.add.particles(x, y, 'speck', {
      speed: { min: radius * 1.5, max: radius * 3.5 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 260, max: 520 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffdd80, 0xff9040, 0xffb050],
      blendMode: 'ADD',
      emitting: false,
    });
    embers.setDepth(430);
    embers.explode(fxCount(Math.round(radius / 2.5)));

    // fumée : plus lente, plus grosse, sans additif — se lit comme un voile
    const smoke = scene.add.particles(x, y, 'smoke', {
      speed: { min: 30, max: 90 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 500, max: 900 },
      scale: { start: 0.8, end: 2.2 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x2a2a30, 0x3a3238, 0x1a1a20],
      emitting: false,
    });
    smoke.setDepth(415);
    smoke.explode(fxCount(Math.round(radius / 6)));

    scene.time.delayedCall(1000, () => {
      embers.destroy();
      smoke.destroy();
    });
  }

  // Wisps colorés qui orbitent autour d'un point (centre du portail). Retourne
  // l'emitter — à détruire quand le portail disparaît.
  static wisps(scene, x, y, radius, color) {
    const em = scene.add.particles(x, y, 'speck', {
      // pas de vitesse : les particules apparaissent sur un cercle et fondent
      // sur place. La rotation du portail suffit à donner du mouvement à l'œil.
      speed: { min: 0, max: 15 },
      lifespan: { min: 450, max: 800 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: color,
      blendMode: 'ADD',
      frequency: 45,
      quantity: 1,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, radius),
        quantity: 1,
      },
    });
    em.setDepth(345);
    return em;
  }

  // Gerbe de sang à la mort. Petite gravité pour que les gouttes retombent.
  static blood(scene, x, y) {
    const em = scene.add.particles(x, y, 'blood', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 400, max: 700 },
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      gravityY: 220,
      emitting: false,
    });
    em.setDepth(15);
    em.explode(fxCount(14));
    scene.time.delayedCall(800, () => em.destroy());
  }
}
