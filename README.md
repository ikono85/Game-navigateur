https://ikono85.github.io/Game-navigateur/

# ShadowGate Arena

Jeu multijoueur top-down 2D en dark fantasy médiévale (navigateur).
Voir le plan complet dans `../SHADOWGATE-PLAN.md`.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173

## État actuel — Phases 1 à 4 ✅

**Phase 1 — Setup + déplacement**

- [x] Projet Vite + Phaser
- [x] Scènes Boot / Menu / Game
- [x] Sprite joueur (placeholder généré au runtime)
- [x] Déplacement ZQSD (vitesse constante, diagonale normalisée)
- [x] Le perso regarde vers la souris
- [x] Caméra smooth-follow bornée au monde
- [x] Arène (plan de tuiles) + collisions murs

**Phase 2 — Système de combat**

- [x] Attaque mélée en arc (portée + ouverture angulaire, recul, cooldown)
- [x] Tir à distance : flèche (portée max, s'arrête sur mur/cible)
- [x] Sorts : boule de feu (projectile + AoE), bouclier
- [x] Système de mana (coût par sort + régénération passive)
- [x] Barres de vie flottantes + HUD (vie, mana, cooldowns)
- [x] Feedback : flash rouge, animation de mort, shake caméra
- [x] Bot ennemi (IA à états : IDLE → CHASE → ATTACK)
- [x] Compteur d'éliminations + réapparition des bots

**Phase 3 — Les 4 classes**

- [x] Architecture de classes pilotée par données (`src/classes/`)
- [x] Guerrier, Mage, Archer, Assassin avec stats distinctes
- [x] Une capacité spéciale par classe
- [x] Un passif par classe
- [x] Écran de sélection de classe (stats comparées, aperçu, description)
- [x] Équilibrage initial centralisé

### Les 4 classes

| Classe | PV | Vitesse | Mana | Attaque | Spécial | Passif |
|--------|----|---------|------|---------|---------|--------|
| **Guerrier** | 140 | 235 | 60 | Épée large (24) | Charge (dash + 20) | Peau de fer : −25% dégâts |
| **Mage** | 75 | 215 | 130 | Boule de feu (24 + AoE) | Nova (42 autour de soi) | Flux arcanique : régén mana rapide |
| **Archer** | 100 | 275 | 80 | Flèche précise (18) | Pluie de flèches (34 en zone) | Vision étendue : caméra élargie |
| **Assassin** | 70 | 330 | 70 | Dague rapide (13) | Invisibilité 3s | Coup dans le dos : dégâts ×2 |

**Phase 4 — Les portails**

- [x] Pose : **E** = portail A, **R** = portail B, animation d'apparition
- [x] Téléportation du joueur, avec verrou de 1s contre le rebond
- [x] Les projectiles traversent en gardant direction et portée restante
- [x] Les ennemis peuvent emprunter tes portails (risque assumé)
- [x] Durée de vie 30s, cooldown 15s, timer visible
- [x] Visuels : anneau + spirale contrarotatifs, couleur par joueur, clignotement
- [x] Pose refusée dans un mur ; un portail sans partenaire est inerte

> **Écart assumé avec le plan.** Le plan prévoyait « 15s entre chaque pose ».
> Pris à la lettre, il faut attendre 15s entre A et B alors que A ne vit que
> 30s : la paire n'est utilisable que la moitié de sa durée. Le cooldown est
> donc **par emplacement** — même protection contre le spam, mécanique jouable.
> Le partage des portails entre coéquipiers arrivera avec les modes d'équipe.

> Les textures sont générées à la volée (pas d'assets binaires). Elles seront
> remplacées par de l'Aseprite (sprites) et du Tiled (tilemaps) plus tard.

## Contrôles

| Touche | Action |
|--------|--------|
| Z Q S D | Déplacement |
| Souris | Visée / direction |
| Clic gauche | Attaque de la classe |
| Clic droit / Espace | Capacité spéciale de la classe |
| 3 | Bouclier (30 mana, commun à toutes les classes) |
| E / R | Poser le portail A / B |
| Échap | Retour menu |

## Structure

```
src/
├── config.js              # constantes + stats d'armes/sorts
├── main.js                # config Phaser + lancement
├── scenes/
│   ├── BootScene.js       # génère les textures placeholder
│   ├── MenuScene.js       # écran titre
│   ├── ClassSelectScene.js# choix de la classe
│   └── GameScene.js       # arène, acteurs, caméra
├── classes/               # définitions de classes (données, pas de sous-classes)
│   ├── BaseClass.js       # fabrique + utilitaire de dégâts de zone
│   ├── Warrior.js  Mage.js  Archer.js  Assassin.js
│   └── index.js
├── entities/
│   ├── Actor.js           # base commune : PV, dégâts, mort, bouclier
│   ├── Player.js          # joueur piloté par sa définition de classe
│   ├── Portal.js          # un portail (anneau, timer, lien vers son jumeau)
│   └── Bot.js             # IA à états (IDLE / CHASE / ATTACK)
├── combat/
│   ├── CombatSystem.js    # pool de projectiles + collisions
│   ├── MeleeAttack.js     # détection en arc + visuel de balayage
│   ├── Projectile.js      # flèche / boule de feu
│   ├── Spell.js           # explosion AoE, bouclier
│   └── HealthBar.js       # barre de vie flottante
├── systems/
│   └── PortalSystem.js    # pose, expiration, traversée des portails
├── ui/
│   ├── Hud.js             # vie, mana, cooldowns, état des portails
│   └── ClassCard.js       # carte de sélection d'une classe
└── maps/
    └── arena.js           # plan de tuiles (0=sol, 1=mur)
```

Équilibrage : les stats communes sont dans `src/config.js` (`WEAPONS`,
`BOT_STATS`), et chaque classe porte les siennes dans `src/classes/<Classe>.js`.

> Note d'architecture : une classe est une **donnée**, pas une sous-classe de
> `Player`. Il n'existe qu'une implémentation de joueur, qui lit sa définition.
> C'est volontaire pour la Phase 5 : le serveur devra rejouer exactement la même
> logique que le client.

**Solo — mode Deathmatch**

- [x] Les bots jouent les 4 classes, avec leurs vraies stats et capacités
- [x] Chacun-pour-soi : chaque adversaire a son camp, les bots se battent aussi entre eux
- [x] Premier à 15 éliminations ; réapparition en 2,5 s, identités et scores conservés
- [x] Tableau des scores, attribution au dernier attaquant, écran de fin

> **Équilibrage mesuré.** Immobile et encerclé par les trois adversaires, le
> joueur tient 3 à 5 s en classe fragile, ~17 s en Guerrier. Les curseurs sont
> `damageFactor`, `cooldownFactor` et `playerBias` dans `config.js`.
>
> `playerBias` mérite une explication : sans lui, les bots s'entretuaient et le
> joueur assistait au match sans y participer. Les adversaires privilégient
> désormais l'humain à distance égale — ils le ciblent à 2,5–2,9 sur 3.

## Assets et crédits

| Élément | Origine | Licence |
|---------|---------|---------|
| Tuiles de donjon (sols, murs) | [Top Down Dungeon Pack](https://opengameart.org/content/top-down-dungeon-pack) — Screaming Brain Studios | CC0 (domaine public) |
| Personnages, portails, projectiles, effets | Dessinés au Canvas 2D dans `src/gfx/` | — |

La CC0 n'exige aucune attribution ; celle-ci est volontaire.

**Pourquoi les personnages ne sont pas téléchargés.** Le jeu est en vue du dessus
avec rotation libre : le personnage pivote en continu vers la souris. Or les packs
pixel art dark fantasy gratuits sont dessinés de profil ou en 8 directions — les
faire tourner à 360° donnerait un résultat pire que des formes simples. Le décor,
lui, ne pivote pas : d'où ce partage.

Les murs utilisent l'**autotiling** : la table de `src/gfx/tileset.js` est
transcrite des métadonnées Tiled du pack, si bien que les angles, extrémités et
croisements se raccordent au lieu de répéter un même bloc.

## Prochaine étape — Phase 5

Le multijoueur : serveur Node.js + Socket.io, architecture *authoritative
server*, prédiction client et interpolation.
