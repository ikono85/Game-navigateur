import Phaser from 'phaser';
import Particles from './Particles.js';

// Attaque de mélée : détection d'un arc devant l'attaquant (portée + ouverture
// angulaire), plus un visuel de balayage d'épée.
export default class MeleeAttack {
  // Gerbe d'étincelles à un impact : appelé depuis le code qui infligeait déjà
  // les dégâts (Player.resolveMelee et Bot). Isolé ici pour rester cohérent avec
  // les deux autres méthodes de la classe.
  static hitSparks(scene, attacker, target) {
    const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y);
    Particles.sparks(scene, target.x, target.y, angle);
  }

  // Renvoie la liste des cibles touchées dans l'arc.
  static resolve(attacker, angle, spec, targets) {
    const hits = [];
    const halfArc = spec.arc / 2;

    targets.forEach((t) => {
      if (!t.active || t.isDead || t === attacker) return;
      if (t.team === attacker.team) return;

      const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, t.x, t.y);
      if (dist > spec.range) return;

      const toTarget = Phaser.Math.Angle.Between(attacker.x, attacker.y, t.x, t.y);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(toTarget - angle));
      if (diff <= halfArc) hits.push(t);
    });

    return hits;
  }

  // Visuel : arc peint (slash_arc.png, 108°, teintable) orienté dans la
  // direction du coup, qui s'étend légèrement et s'estompe.
  static showSwing(scene, attacker, angle, spec) {
    const img = scene.add
      .image(attacker.x, attacker.y, 'slash_arc')
      .setRotation(angle)
      .setDepth(400)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.9);
    // la texture 128×128 couvre un rayon ~64 : on la met à l'échelle de la
    // portée réelle de l'arme
    const scale = (spec.range * 2) / 128;
    img.setScale(scale * 0.88);

    scene.tweens.add({
      targets: img,
      alpha: 0,
      scale: scale * 1.06,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => img.destroy(),
    });
  }
}
