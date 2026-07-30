const MAX_COMPANIONS = 3;

const COMPANION_NAMES = [
  "Elara", "Torvin", "Sylas", "Maren", "Doran", "Ivy", "Kael", "Brenna",
  "Osric", "Talia", "Fenwick", "Sable", "Garrick", "Wren",
];

function generateCompanion(excludeClassName) {
  const availableClasses = CLASS_DATA.filter((c) => c.name !== excludeClassName);
  const cls = availableClasses[Math.floor(Math.random() * availableClasses.length)];
  const sub = cls.subclasses[Math.floor(Math.random() * cls.subclasses.length)];
  const name = COMPANION_NAMES[Math.floor(Math.random() * COMPANION_NAMES.length)];

  const companion = createCharacter({
    name: `${name} (${sub.name})`,
    str: sub.str, wyt: sub.wyt, zre: sub.zre, int: sub.int, cha: sub.cha,
    weapons: sub.weapons,
    pancerz: sub.pancerz, przebicie: sub.przebicie, hp: sub.hp,
    icon: sub.icon, team: "player",
  });
  companion.isCompanion = true;
  companion.className = cls.name;
  companion.subclassName = sub.name;
  return companion;
}

// Recomputes every stat fresh from the subclass's fixed base numbers rather
// than multiplying the companion's current (already-scaled) stats — since
// companions persist across battles unlike freshly-created enemies, a
// scaleEnemyForLevel-style in-place multiply would compound every battle.
function scaleCompanionToLevel(companion, level) {
  const cls = CLASS_DATA.find((c) => c.name === companion.className);
  const sub = cls.subclasses.find((s) => s.name === companion.subclassName);
  const tier = Math.max(0, level - 1);
  const statMult = 1 + tier * 0.10;
  const hpMult = 1 + tier * 0.12;

  const str = Math.round(sub.str * statMult);
  const wyt = Math.round(sub.wyt * statMult);
  const zre = Math.round(sub.zre * statMult);
  const int = Math.round(sub.int * statMult);
  const cha = Math.round(sub.cha * statMult);
  const derived = computeDerivedStats({ zre, int, cha, przebicie: sub.przebicie });

  companion.str = str;
  companion.wyt = wyt;
  companion.zre = zre;
  companion.int = int;
  companion.cha = cha;
  companion.pancerz = sub.pancerz;
  companion.przebicie = derived.totalPrzebicie;
  companion.extraD20Rolls = derived.extraD20Rolls;
  companion.extraActions = derived.extraActions;
  companion.d6Bonus = derived.d6Bonus;
  companion.d20Bonus = derived.d20Bonus;
  companion.charismaExponent = derived.charismaExponent;
  companion.moveRange = derived.moveRange;
  companion.maxHP = Math.round(sub.hp * hpMult);
  companion.currentHP = companion.maxHP;
}
