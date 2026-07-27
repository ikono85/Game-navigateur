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

  // Visuel : arc lumineux qui balaye devant l'attaquant puis s'estompe.
  static showSwing(scene, attacker, angle, spec) {
    const g = scene.add.graphics();
    g.setDepth(400);

    const draw = (progress) => {
      g.clear();
      const alpha = 1 - progress;
      g.fillStyle(0xffffff, 0.18 * alpha);
      g.lineStyle(2, 0xe8e0d0, 0.7 * alpha);
      g.beginPath();
      g.moveTo(attacker.x, attacker.y);
      g.arc(
        attacker.x,
        attacker.y,
        spec.range,
        angle - spec.arc / 2,
        angle + spec.arc / 2,
        false,
      );
      g.closePath();
      g.fillPath();
      g.strokePath();
    };

    draw(0);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 160,
      onUpdate: (tw) => draw(tw.getValue()),
      onComplete: () => g.destroy(),
    });
  }
}
