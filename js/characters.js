function computeDerivedStats({ zre, int, cha, przebicie }) {
  const extraD20Rolls = Math.floor(zre / 10);
  const extraActions = Math.floor(zre / 5);
  const totalPrzebicie = przebicie + Math.floor(zre / 10) * 0.05;
  const d6Bonus = Math.floor(int / 10);
  const d20Bonus = Math.floor(int / 5);
  const charismaExponent = 1 + Math.floor(cha / 10);
  const moveRange = 2 + Math.floor(zre / 8);
  return { extraD20Rolls, extraActions, totalPrzebicie, d6Bonus, d20Bonus, charismaExponent, moveRange };
}

function createCharacter({
  name, str, wyt, zre = 0, int = 0, cha = 0,
  weapons, pancerz = 0, przebicie = 0, hp = null, isPlayer = false, icon = "❓",
}) {
  const maxHP = hp !== null ? hp : 50 + str * 5 + wyt * 5;
  const derived = computeDerivedStats({ zre, int, cha, przebicie });

  return {
    name,
    str,
    wyt,
    zre,
    int,
    cha,
    weapons,
    weaponIndex: 0,
    weapon: weapons[0],
    icon,
    pancerz,
    przebicie: derived.totalPrzebicie,
    extraD20Rolls: derived.extraD20Rolls,
    extraActions: derived.extraActions,
    d6Bonus: derived.d6Bonus,
    d20Bonus: derived.d20Bonus,
    charismaExponent: derived.charismaExponent,
    isPlayer,
    maxHP,
    currentHP: maxHP,
    moveRange: derived.moveRange,
    pos: null,
  };
}

function switchWeapon(character) {
  if (character.weapons.length < 2) return false;
  character.weaponIndex = (character.weaponIndex + 1) % character.weapons.length;
  character.weapon = character.weapons[character.weaponIndex];
  return true;
}

function applyClassProfile(character, profile) {
  const derived = computeDerivedStats({
    zre: profile.zre, int: profile.int, cha: profile.cha, przebicie: profile.przebicie,
  });

  character.str = profile.str;
  character.wyt = profile.wyt;
  character.zre = profile.zre;
  character.int = profile.int;
  character.cha = profile.cha;
  character.weapons = profile.weapons;
  character.weaponIndex = 0;
  character.weapon = profile.weapons[0];
  character.icon = profile.icon;
  character.pancerz = profile.pancerz;
  character.przebicie = derived.totalPrzebicie;
  character.extraD20Rolls = derived.extraD20Rolls;
  character.extraActions = derived.extraActions;
  character.d6Bonus = derived.d6Bonus;
  character.d20Bonus = derived.d20Bonus;
  character.charismaExponent = derived.charismaExponent;
  character.moveRange = derived.moveRange;
  character.maxHP = profile.hp;
  character.currentHP = profile.hp;
}

function createPlayer() {
  return createCharacter({
    name: "Ty",
    str: 8,
    wyt: 6,
    zre: 12,
    int: 15,
    cha: 15,
    weapons: [
      { name: "Miecz", minDmg: 12, maxDmg: 17, range: 1 },
      { name: "Kusza", minDmg: 8, maxDmg: 13, range: 6 },
    ],
    pancerz: 0.15,
    przebicie: 0.15,
    hp: 145,
    isPlayer: true,
    icon: "🤺",
  });
}

const ENEMY_TEMPLATES = {
  gornik: () => createCharacter({
    name: "Zmutowany Górnik",
    str: 5,
    wyt: 5,
    zre: 8,
    int: 0,
    cha: 0,
    weapons: [
      { name: "Kilof", minDmg: 6, maxDmg: 11, range: 1 },
      { name: "Rzucony Kamień", minDmg: 4, maxDmg: 8, range: 2 },
    ],
    pancerz: 0.056,
    przebicie: 0,
    hp: 118,
    icon: "🧟",
  }),
  lowca: () => createCharacter({
    name: "Łowca Gildii",
    str: 6,
    wyt: 6,
    zre: 10,
    int: 5,
    cha: 10,
    weapons: [
      { name: "Kusza", minDmg: 9, maxDmg: 14, range: 6 },
      { name: "Sztylet", minDmg: 7, maxDmg: 11, range: 1 },
    ],
    pancerz: 0.124,
    przebicie: 0.056,
    hp: 155,
    icon: "🏹",
  }),
  aberracja: () => createCharacter({
    name: "Aberracja Many",
    str: 7,
    wyt: 4,
    zre: 10,
    int: 0,
    cha: 5,
    weapons: [
      { name: "Szpony", minDmg: 8, maxDmg: 14, range: 1 },
      { name: "Skok i Ugryzienie", minDmg: 6, maxDmg: 10, range: 2 },
    ],
    pancerz: 0.03,
    przebicie: 0.05,
    hp: 100,
    icon: "👹",
  }),
  adept: () => createCharacter({
    name: "Adept Zakonu Światła",
    str: 4,
    wyt: 5,
    zre: 6,
    int: 12,
    cha: 8,
    weapons: [
      { name: "Promień Światła", minDmg: 7, maxDmg: 12, range: 6 },
      { name: "Laska Kapłańska", minDmg: 5, maxDmg: 9, range: 1 },
    ],
    pancerz: 0.08,
    przebicie: 0.1,
    hp: 95,
    icon: "🧙",
  }),
};

function createEnemies(location = null) {
  const keys = location && location.enemyKeys ? location.enemyKeys : Object.keys(ENEMY_TEMPLATES);
  const count = 1 + Math.floor(Math.random() * 4);
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    chosen.push(ENEMY_TEMPLATES[key]());
  }

  const nameCounts = {};
  for (const enemy of chosen) nameCounts[enemy.name] = (nameCounts[enemy.name] || 0) + 1;

  const seen = {};
  for (const enemy of chosen) {
    if (nameCounts[enemy.name] > 1) {
      seen[enemy.name] = (seen[enemy.name] || 0) + 1;
      enemy.name = `${enemy.name} #${seen[enemy.name]}`;
    }
  }

  return chosen;
}
