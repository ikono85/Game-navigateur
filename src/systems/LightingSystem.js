import Phaser from 'phaser';

// Éclairage 2D par masque MULTIPLY.
//
// Principe : une RenderTexture de la taille du monde est remplie chaque frame
// avec la couleur ambiante (sombre). Chaque lumière y est estampée par-dessus
// avec un blend ADD, ce qui éclaircit le masque là où elle brille. La RT est
// affichée sur la scène en MULTIPLY : sceneColor × maskColor. Là où le masque
// est sombre, la scène s'assombrit ; là où il est clair, la scène apparaît
// normalement ; là où il est teinté (torche chaude), la scène prend la teinte.
//
// Un seul GameObject Image (le "stamp") est alloué et réutilisé pour toutes les
// lumières : on ne fait que déplacer/teinter/mettre à l'échelle avant chaque
// draw. Bien plus rapide que d'instancier N sprites.
//
// La texture radiale (256×256) a un rayon effectif de 128 : `radius / 128` donne
// le facteur d'échelle à appliquer au stamp pour obtenir la portée voulue.

const LIGHT_TEX = 'lightRadial';
const LIGHT_TEX_HALF = 128;

export default class LightingSystem {
  constructor(scene, { worldW, worldH, ambientColor = 0x2c2c38, depth = 900 } = {}) {
    this.scene = scene;
    this.ambientColor = ambientColor;
    this.lights = new Set();

    this.rt = scene.add
      .renderTexture(0, 0, worldW, worldH)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Stamp partagé, jamais ajouté à la display list — sert uniquement de
    // source pour rt.draw().
    this.stamp = scene.make.image({ key: LIGHT_TEX, add: false });
    this.stamp.setBlendMode(Phaser.BlendModes.ADD).setOrigin(0.5);

    this.onUpdate = () => this.render();
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // Lumière statique. Retourne un handle qu'on peut modifier ou retirer.
  addLight(x, y, radius, color = 0xffffff, intensity = 1) {
    const light = {
      x, y, radius, color, intensity,
      follow: null, followOffsetX: 0, followOffsetY: 0,
    };
    this.lights.add(light);
    return light;
  }

  // Lumière qui suit un GameObject : sa position est recalculée chaque frame.
  attach(target, opts = {}) {
    const light = this.addLight(
      target.x, target.y,
      opts.radius || 220,
      opts.color || 0xffffff,
      opts.intensity || 1,
    );
    light.follow = target;
    light.followOffsetX = opts.offsetX || 0;
    light.followOffsetY = opts.offsetY || 0;
    return light;
  }

  removeLight(light) {
    if (light) this.lights.delete(light);
  }

  render() {
    const rt = this.rt;
    rt.clear();
    rt.fill(this.ambientColor);

    const stamp = this.stamp;
    this.lights.forEach((l) => {
      if (l.follow) {
        // La cible peut avoir été détruite sans qu'on ait retiré la lumière
        // (mort d'un projectile). On la saute silencieusement.
        if (!l.follow.active) return;
        l.x = l.follow.x + l.followOffsetX;
        l.y = l.follow.y + l.followOffsetY;
      }
      const scale = l.radius / LIGHT_TEX_HALF;
      stamp.setScale(scale).setTint(l.color).setAlpha(l.intensity);
      rt.draw(stamp, l.x, l.y);
    });
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    if (this.rt) { this.rt.destroy(); this.rt = null; }
    if (this.stamp) { this.stamp.destroy(); this.stamp = null; }
    this.lights.clear();
  }
}
