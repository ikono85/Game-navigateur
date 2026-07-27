import Phaser from 'phaser';
import { COLORS } from '../config.js';
import Particles from './Particles.js';

// Effets de sorts non-projectiles. Les projectiles magiques (boule de feu)
// passent par Projectile ; ici on gère l'explosion à l'impact et le bouclier.
export default class Spell {
  // Explosion AoE à l'impact d'une boule de feu.
  static explode(scene, x, y, spec, attackerTeam, targets) {
    // visuel : cercle qui grandit et s'estompe
    const g = scene.add.graphics();
    g.setDepth(420);

    // Flash lumineux : rayon suivant le cercle visible, intensité qui décroît.
    // Vraie source de lumière — pas un rendu par-dessus le masque de ténèbres.
    const flash =
      scene.lighting &&
      scene.lighting.addLight(x, y, spec.aoeRadius * 2.2, 0xffbb60, 1.4);

    // Gerbe de braises + fumée
    Particles.explosion(scene, x, y, spec.aoeRadius);

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 260,
      onUpdate: (tw) => {
        const p = tw.getValue();
        g.clear();
        g.fillStyle(COLORS.fireball, 0.35 * (1 - p));
        g.fillCircle(x, y, spec.aoeRadius * (0.3 + 0.7 * p));
        g.lineStyle(3, 0xffd08a, 0.8 * (1 - p));
        g.strokeCircle(x, y, spec.aoeRadius * (0.3 + 0.7 * p));
        if (flash) flash.intensity = 1.4 * (1 - p);
      },
      onComplete: () => {
        g.destroy();
        if (flash && scene.lighting) scene.lighting.removeLight(flash);
      },
    });

    scene.cameras.main.shake(120, 0.004);

    targets.forEach((t) => {
      if (!t.active || t.isDead || t.team === attackerTeam) return;
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d <= spec.aoeRadius) {
        // dégâts dégressifs vers le bord de la zone
        const falloff = 1 - (d / spec.aoeRadius) * 0.5;
        t.takeDamage(spec.aoeDamage * falloff, { x, y }, 120);
      }
    });
  }

  // Bouclier magique : aura visuelle + réduction de dégâts sur le lanceur.
  static shield(scene, caster, spec) {
    caster.applyShield(spec.duration, spec.reduction);

    const g = scene.add.graphics();
    g.setDepth(390);
    const endAt = scene.time.now + spec.duration;

    const ev = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        g.clear();
        if (!caster.active || scene.time.now >= endAt) {
          g.destroy();
          ev.remove();
          return;
        }
        const pulse = 0.6 + 0.2 * Math.sin(scene.time.now / 120);
        g.lineStyle(2, COLORS.shield, pulse);
        g.strokeCircle(caster.x, caster.y, 26);
        g.fillStyle(COLORS.shield, 0.1);
        g.fillCircle(caster.x, caster.y, 26);
      },
    });
  }

}
