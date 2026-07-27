import Warrior from './Warrior.js';
import Mage from './Mage.js';
import Archer from './Archer.js';
import Assassin from './Assassin.js';

export const CLASSES = [Warrior, Mage, Archer, Assassin];

export const CLASS_BY_ID = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

export function getClass(id) {
  return CLASS_BY_ID[id] || Warrior;
}

export { Warrior, Mage, Archer, Assassin };
