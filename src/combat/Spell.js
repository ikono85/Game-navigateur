import Phaser from 'phaser';
import Particles from './Particles.js';
import { screenShake } from '../systems/Settings.js';
import Sfx from '../systems/Sfx.js';

// Effets de sorts non-projectiles. Les projectiles magiques (boule de feu)
// passent par Projectile ; ici on gère l'explosion à l'impact et le bouclier.
export default class Spell {
  // Explosion AoE à l'impact d'une boule de feu. `attacker` est l'acteur qui a
  // tiré : il porte l'AoE pour que l'élimination lui soit créditée (et non à un
  // simple point sans camp, ce qui laissait les kills de zone non attribués).
  static explode(scene, x, y, spec, attacker, targets) {
    const attackerTeam = attacker && attacker.team;
    // Onde de choc peinte (shockwave.png teintable), qui s'étend et s'estompe
    const wave = scene.add
      .image(x, y, 'shockwave')
      .setDepth(420)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffbb60)
      .setAlpha(0.9);
    const startScale = (spec.aoeRadius * 0.6) / 256;
    const endScale = (spec.aoeRadius * 2.1) / 256;
    wave.setScale(startScale);

    // Flash lumineux : vraie source de lumière — pas un rendu par-dessus le
    // masque de ténèbres.
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
        wave.setScale(startScale + (endScale - startScale) * p);
        wave.setAlpha(0.9 * (1 - p));
        if (flash) flash.intensity = 1.4 * (1 - p);
      },
      onComplete: () => {
        wave.destroy();
        if (flash && scene.lighting) scene.lighting.removeLight(flash);
      },
    });

    screenShake(scene, 120, 0.004);
    Sfx.explosion();

    targets.forEach((t) => {
      if (!t.active || t.isDead || t.team === attackerTeam) return;
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d <= spec.aoeRadius) {
        // dégâts dégressifs vers le bord de la zone. Crédit à l'attaquant, mais
        // recul depuis le centre de l'explosion (4e argument).
        const falloff = 1 - (d / spec.aoeRadius) * 0.5;
        t.takeDamage(spec.aoeDamage * falloff, attacker || { x, y }, 120, { x, y });
      }
    });
  }

  // Bouclier magique : aura peinte (spell_shield.png) qui suit le lanceur et
  // pulse doucement, + réduction de dégâts.
  static shield(scene, caster, spec) {
    caster.applyShield(spec.duration, spec.reduction);

    const aura = scene.add
      .image(caster.x, caster.y, 'spell_shield')
      .setDepth(390)
      .setBlendMode(Phaser.BlendModes.ADD);
    const endAt = scene.time.now + spec.duration;

    const ev = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!caster.active || scene.time.now >= endAt) {
          aura.destroy();
          ev.remove();
          return;
        }
        const t = scene.time.now;
        aura.setPosition(caster.x, caster.y);
        aura.setAlpha(0.65 + 0.2 * Math.sin(t / 120));
        aura.setScale(0.92 + 0.05 * Math.sin(t / 160));
        aura.rotation += 0.004;
      },
    });
  }

}
