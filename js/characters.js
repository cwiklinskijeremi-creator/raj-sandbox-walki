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
  weapons, pancerz = 0, przebicie = 0, hp = null, isPlayer = false, icon = "❓", gender = null,
  team = "enemy", mutated = false,
}) {
  const maxHP = hp !== null ? hp : 50 + str * 5 + wyt * 5;
  const derived = computeDerivedStats({ zre, int, cha, przebicie });

  return {
    name,
    gender,
    str,
    wyt,
    zre,
    int,
    cha,
    weapons,
    weaponIndex: 0,
    weapon: weapons[0],
    icon,
    mutated,
    devoured: false,
    pancerz,
    przebicie: derived.totalPrzebicie,
    extraD20Rolls: derived.extraD20Rolls,
    extraActions: derived.extraActions,
    d6Bonus: derived.d6Bonus,
    d20Bonus: derived.d20Bonus,
    charismaExponent: derived.charismaExponent,
    isPlayer,
    team,
    maxHP,
    currentHP: maxHP,
    moveRange: derived.moveRange,
    pos: null,
    activeEffects: [],
    poison: null,
    skillCooldowns: [],
  };
}

function switchWeapon(character) {
  if (character.weapons.length < 2) return false;
  character.weaponIndex = (character.weaponIndex + 1) % character.weapons.length;
  character.weapon = character.weapons[character.weaponIndex];
  return true;
}

function applyClassProfile(character, profile, bonusStats = null) {
  const bonus = bonusStats || { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  const str = profile.str + (bonus.str || 0);
  const wyt = profile.wyt + (bonus.wyt || 0);
  const zre = profile.zre + (bonus.zre || 0);
  const int = profile.int + (bonus.int || 0);
  const cha = profile.cha + (bonus.cha || 0);
  const derived = computeDerivedStats({ zre, int, cha, przebicie: profile.przebicie });

  character.str = str;
  character.wyt = wyt;
  character.zre = zre;
  character.int = int;
  character.cha = cha;
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
  character.maxHP = profile.hp + ((bonus.str || 0) + (bonus.wyt || 0)) * 5;
  character.currentHP = character.maxHP;
}

function createPlayer(name, gender) {
  return createCharacter({
    name: name && name.trim() ? name.trim() : "Bezimienny",
    gender: gender || null,
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
    team: "player",
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
    mutated: true,
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
    mutated: true,
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

  // Kopalnie Esencji
  kopacz: () => createCharacter({
    name: "Skażony Kopacz",
    str: 6, wyt: 7, zre: 6, int: 0, cha: 0,
    weapons: [
      { name: "Zardzewiały Oskard", minDmg: 7, maxDmg: 12, range: 1 },
      { name: "Toczący Głaz", minDmg: 5, maxDmg: 9, range: 2 },
    ],
    pancerz: 0.09, przebicie: 0, hp: 130, icon: "🧟‍♂️", mutated: true,
  }),
  pelzacz: () => createCharacter({
    name: "Kryształowy Pełzacz",
    str: 8, wyt: 3, zre: 13, int: 0, cha: 3,
    weapons: [
      { name: "Kolce Kryształu", minDmg: 7, maxDmg: 13, range: 1 },
      { name: "Odłamek Esencji", minDmg: 5, maxDmg: 9, range: 3 },
    ],
    pancerz: 0.02, przebicie: 0.08, hp: 85, icon: "🦂", mutated: true,
  }),
  nadzorca: () => createCharacter({
    name: "Nadzorca Niewolników",
    str: 9, wyt: 7, zre: 9, int: 2, cha: 8,
    weapons: [
      { name: "Bicz Kolczasty", minDmg: 8, maxDmg: 13, range: 1 },
      { name: "Rzucony Hak", minDmg: 6, maxDmg: 10, range: 2 },
    ],
    pancerz: 0.10, przebicie: 0.05, hp: 135, icon: "🦹",
  }),
  pijawka: () => createCharacter({
    name: "Esencjowa Pijawka",
    str: 4, wyt: 6, zre: 8, int: 0, cha: 0,
    weapons: [
      { name: "Wysysające Szczęki", minDmg: 6, maxDmg: 11, range: 1 },
      { name: "Pluskanie Kwasem", minDmg: 5, maxDmg: 9, range: 2 },
    ],
    pancerz: 0.04, przebicie: 0.02, hp: 105, icon: "🐛", mutated: true,
  }),
  kolos: () => createCharacter({
    name: "Głębinowy Kolos",
    str: 12, wyt: 11, zre: 4, int: 0, cha: 0,
    weapons: [
      { name: "Kamienna Pięść", minDmg: 12, maxDmg: 18, range: 1 },
      { name: "Uderzenie Ogonem", minDmg: 9, maxDmg: 14, range: 1 },
    ],
    pancerz: 0.14, przebicie: 0, hp: 170, icon: "🗿", mutated: true,
  }),

  // Skażony Las
  wilk: () => createCharacter({
    name: "Splamiony Wilk",
    str: 8, wyt: 4, zre: 15, int: 0, cha: 4,
    weapons: [
      { name: "Zębiska", minDmg: 8, maxDmg: 13, range: 1 },
      { name: "Skok Drapieżnika", minDmg: 6, maxDmg: 10, range: 2 },
    ],
    pancerz: 0.03, przebicie: 0.06, hp: 95, icon: "🐺", mutated: true,
  }),
  konstrukt: () => createCharacter({
    name: "Pnączowy Konstrukt",
    str: 7, wyt: 9, zre: 5, int: 0, cha: 0,
    weapons: [
      { name: "Zaciskające Pnącze", minDmg: 7, maxDmg: 12, range: 2 },
      { name: "Kolce", minDmg: 6, maxDmg: 10, range: 1 },
    ],
    pancerz: 0.10, przebicie: 0, hp: 140, icon: "🥀", mutated: true,
  }),
  szarancza: () => createCharacter({
    name: "Szarańcza Many",
    str: 5, wyt: 3, zre: 14, int: 0, cha: 6,
    weapons: [
      { name: "Żądło", minDmg: 6, maxDmg: 10, range: 1 },
      { name: "Rój", minDmg: 5, maxDmg: 8, range: 2 },
    ],
    pancerz: 0.02, przebicie: 0.10, hp: 80, icon: "🦗", mutated: true,
  }),
  pomiot: () => createCharacter({
    name: "Leśny Pomiot",
    str: 6, wyt: 5, zre: 11, int: 0, cha: 2,
    weapons: [
      { name: "Jadowite Ukąszenie", minDmg: 7, maxDmg: 12, range: 1 },
      { name: "Owinięcie", minDmg: 5, maxDmg: 9, range: 1 },
    ],
    pancerz: 0.05, przebicie: 0.05, hp: 100, icon: "🐍", mutated: true,
  }),
  traper: () => createCharacter({
    name: "Zdziczały Traper",
    str: 6, wyt: 6, zre: 9, int: 3, cha: 4,
    weapons: [
      { name: "Wnyki", minDmg: 6, maxDmg: 11, range: 2 },
      { name: "Nóż Myśliwski", minDmg: 7, maxDmg: 11, range: 1 },
    ],
    pancerz: 0.08, przebicie: 0.05, hp: 115, icon: "🪤",
  }),

  // Szlak Gildii
  zwiadowca: () => createCharacter({
    name: "Zwiadowca Gildii",
    str: 6, wyt: 5, zre: 12, int: 4, cha: 7,
    weapons: [
      { name: "Rzutki", minDmg: 7, maxDmg: 11, range: 3 },
      { name: "Krótki Miecz", minDmg: 6, maxDmg: 10, range: 1 },
    ],
    pancerz: 0.09, przebicie: 0.06, hp: 110, icon: "🔪",
  }),
  egzekutor: () => createCharacter({
    name: "Egzekutor Gildii",
    str: 11, wyt: 8, zre: 8, int: 1, cha: 5,
    weapons: [
      { name: "Buława Bojowa", minDmg: 10, maxDmg: 16, range: 1 },
      { name: "Pięści Wzmocnione", minDmg: 8, maxDmg: 12, range: 1 },
    ],
    pancerz: 0.13, przebicie: 0.10, hp: 150, icon: "👊",
  }),
  tropiciel: () => createCharacter({
    name: "Tropiciel Bestii",
    str: 7, wyt: 6, zre: 11, int: 5, cha: 6,
    weapons: [
      { name: "Oszczep", minDmg: 8, maxDmg: 13, range: 3 },
      { name: "Topór Rzucany", minDmg: 7, maxDmg: 11, range: 2 },
    ],
    pancerz: 0.08, przebicie: 0.05, hp: 120, icon: "🐾",
  }),
  strzelec: () => createCharacter({
    name: "Najemny Ostrzał",
    str: 6, wyt: 5, zre: 10, int: 6, cha: 8,
    weapons: [
      { name: "Kusza Snajperska", minDmg: 10, maxDmg: 16, range: 7 },
      { name: "Sztylet", minDmg: 6, maxDmg: 9, range: 1 },
    ],
    pancerz: 0.10, przebicie: 0.08, hp: 105, icon: "🎯",
  }),
  kapitan: () => createCharacter({
    name: "Kapitan Patrolu",
    str: 10, wyt: 9, zre: 10, int: 6, cha: 11,
    weapons: [
      { name: "Miecz Kapitański", minDmg: 10, maxDmg: 16, range: 1 },
      { name: "Kusza Boczna", minDmg: 7, maxDmg: 11, range: 5 },
    ],
    pancerz: 0.14, przebicie: 0.09, hp: 160, icon: "🎖️",
  }),

  // Placówka Zakonu Światła
  nowicjusz: () => createCharacter({
    name: "Nowicjusz Światła",
    str: 3, wyt: 4, zre: 5, int: 9, cha: 6,
    weapons: [
      { name: "Iskra Światła", minDmg: 6, maxDmg: 10, range: 5 },
      { name: "Laska Nowicjusza", minDmg: 4, maxDmg: 8, range: 1 },
    ],
    pancerz: 0.05, przebicie: 0.05, hp: 80, icon: "🕯️",
  }),
  egzekutorwiary: () => createCharacter({
    name: "Egzekutor Wiary",
    str: 10, wyt: 8, zre: 6, int: 4, cha: 6,
    weapons: [
      { name: "Młot Sądu", minDmg: 10, maxDmg: 15, range: 1 },
      { name: "Tarcza Okuta", minDmg: 7, maxDmg: 11, range: 1 },
    ],
    pancerz: 0.12, przebicie: 0.08, hp: 140, icon: "🔨",
  }),
  inkwizytor: () => createCharacter({
    name: "Inkwizytor",
    str: 6, wyt: 6, zre: 7, int: 13, cha: 9,
    weapons: [
      { name: "Płomień Oczyszczający", minDmg: 9, maxDmg: 14, range: 6 },
      { name: "Sztylet Rytualny", minDmg: 6, maxDmg: 10, range: 1 },
    ],
    pancerz: 0.09, przebicie: 0.10, hp: 115, icon: "📿",
  }),
  straznik: () => createCharacter({
    name: "Strażnik Relikwii",
    str: 9, wyt: 12, zre: 5, int: 3, cha: 5,
    weapons: [
      { name: "Halabarda Strażnicza", minDmg: 9, maxDmg: 14, range: 1 },
      { name: "Uderzenie Tarczą", minDmg: 6, maxDmg: 10, range: 1 },
    ],
    pancerz: 0.16, przebicie: 0.03, hp: 155, icon: "🏛️",
  }),
  kaplanka: () => createCharacter({
    name: "Kapłanka Oczyszczenia",
    str: 4, wyt: 6, zre: 7, int: 12, cha: 13,
    weapons: [
      { name: "Promień Oczyszczenia", minDmg: 8, maxDmg: 13, range: 6 },
      { name: "Laska Kapłańska", minDmg: 5, maxDmg: 9, range: 1 },
    ],
    pancerz: 0.07, przebicie: 0.06, hp: 110, icon: "🕊️",
  }),
};

const BOSS_TEMPLATES = {
  boss_kopalnie: () => {
    const c = createCharacter({
      name: "Pradawny Strażnik Kryształów",
      str: 16, wyt: 14, zre: 6, int: 4, cha: 6,
      weapons: [
        { name: "Kryształowa Pięść", minDmg: 16, maxDmg: 24, range: 1 },
        { name: "Fala Wstrząsu", minDmg: 11, maxDmg: 17, range: 2 },
      ],
      pancerz: 0.20, przebicie: 0.10, hp: 320, icon: "🗿",
    });
    c.isBoss = true;
    c.mutated = true;
    c.specialCooldown = 0;
    c.special = {
      name: "Krystalizacja", icon: "💠", cooldown: 4,
      effectType: "self_buff", stat: "pancerz", effectValue: 0.20, effectTurns: 3,
      label: "krystalizacja",
    };
    return c;
  },
  boss_las: () => {
    const c = createCharacter({
      name: "Matka Rojowiska",
      str: 11, wyt: 9, zre: 12, int: 3, cha: 5,
      weapons: [
        { name: "Żądła Rojowiska", minDmg: 13, maxDmg: 19, range: 1 },
        { name: "Plucie Jadem", minDmg: 9, maxDmg: 14, range: 3 },
      ],
      pancerz: 0.10, przebicie: 0.12, hp: 260, icon: "🕷️",
    });
    c.isBoss = true;
    c.mutated = true;
    c.specialCooldown = 0;
    c.special = {
      name: "Zaraza Rojowiska", icon: "☠️", cooldown: 4,
      minDmg: 6, maxDmg: 10, range: 4,
      effectType: "poison_dot", effectValue: 12, effectTurns: 3,
      label: "zaraza rojowiska",
    };
    return c;
  },
  boss_szlak: () => {
    const c = createCharacter({
      name: "Zdradziecki Łowca-Mistrz",
      str: 13, wyt: 10, zre: 14, int: 6, cha: 10,
      weapons: [
        { name: "Zaklęta Kusza", minDmg: 14, maxDmg: 20, range: 6 },
        { name: "Katowski Topór", minDmg: 12, maxDmg: 17, range: 1 },
      ],
      pancerz: 0.16, przebicie: 0.18, hp: 290, icon: "🏹",
    });
    c.isBoss = true;
    c.specialCooldown = 0;
    c.special = {
      name: "Rozdzierający Strzał", icon: "🎯", cooldown: 4,
      minDmg: 10, maxDmg: 15, range: 6,
      effectType: "armor_shred", effectValue: 0.20, effectTurns: 3,
      label: "rozdarty pancerz",
    };
    return c;
  },
  boss_placowka: () => {
    const c = createCharacter({
      name: "Skorumpowany Arcykapłan",
      str: 9, wyt: 10, zre: 8, int: 14, cha: 14,
      weapons: [
        { name: "Spaczony Promień", minDmg: 12, maxDmg: 18, range: 6 },
        { name: "Rytualny Sztylet", minDmg: 9, maxDmg: 14, range: 1 },
      ],
      pancerz: 0.14, przebicie: 0.12, hp: 270, icon: "🕯️",
    });
    c.isBoss = true;
    c.specialCooldown = 0;
    c.special = {
      name: "Mroczne Wysysanie", icon: "🩸", cooldown: 4,
      minDmg: 11, maxDmg: 16, range: 5,
      effectType: "lifesteal", effectValue: 0.6,
      label: "mroczne wysysanie",
    };
    return c;
  },
  // Unique finale boss for the story campaign (js/campaign.js) — not tied to
  // any LOCATIONS entry, so it never appears in the roaming bestiary and is
  // noticeably stronger than the four world bosses above.
  boss_dorian: () => {
    const c = createCharacter({
      name: "Dorian Vex",
      str: 13, wyt: 12, zre: 11, int: 18, cha: 15,
      weapons: [
        { name: "Iluzoryczny Sztylet", minDmg: 13, maxDmg: 19, range: 1 },
        { name: "Rozdzierający Impuls Many", minDmg: 15, maxDmg: 22, range: 6 },
      ],
      pancerz: 0.18, przebicie: 0.20, hp: 380, icon: "🎭",
    });
    c.isBoss = true;
    c.specialCooldown = 0;
    c.special = {
      name: "Zdrada Iluzji", icon: "🎭", cooldown: 4,
      minDmg: 12, maxDmg: 18, range: 6,
      effectType: "armor_shred", effectValue: 0.25, effectTurns: 3,
      label: "roztrzaskana obrona",
    };
    return c;
  },
};

function createEnemies(location = null) {
  const keys = location && location.enemyKeys ? location.enemyKeys : Object.keys(ENEMY_TEMPLATES);
  const count = 1 + Math.floor(Math.random() * 4);
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    const enemy = ENEMY_TEMPLATES[key]();
    enemy.templateKey = key;
    chosen.push(enemy);
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

function scaleEnemyForLevel(enemy, level) {
  const tier = level - 1;
  if (tier <= 0) return enemy;

  const statMult = 1 + tier * 0.12;
  const hpMult = 1 + tier * 0.15;
  const defenseMult = 1 + tier * 0.08;
  const mindMult = 1 + tier * 0.06;

  enemy.str = Math.round(enemy.str * statMult);
  enemy.wyt = Math.round(enemy.wyt * statMult);
  enemy.maxHP = Math.round(enemy.maxHP * hpMult);
  enemy.currentHP = enemy.maxHP;
  enemy.pancerz = Math.min(0.6, enemy.pancerz * defenseMult);
  enemy.przebicie = Math.min(0.6, enemy.przebicie * defenseMult);

  // ZRE/INT/CHA scale slower than STR/WYT (enemies shouldn't snowball extra
  // actions/rerolls too), but they must scale at all — otherwise the
  // player's own charismaExponent growth from leveling races ahead
  // unopposed and the game gets easier with level instead of harder
  // (confirmed via battle simulation across levels 1-25).
  enemy.zre = Math.round(enemy.zre * mindMult);
  enemy.int = Math.round(enemy.int * mindMult);
  enemy.cha = Math.round(enemy.cha * mindMult);
  enemy.extraD20Rolls = Math.floor(enemy.zre / 10);
  enemy.extraActions = Math.floor(enemy.zre / 5);
  enemy.moveRange = 2 + Math.floor(enemy.zre / 8);
  enemy.d6Bonus = Math.floor(enemy.int / 10);
  enemy.d20Bonus = Math.floor(enemy.int / 5);
  enemy.charismaExponent = 1 + Math.floor(enemy.cha / 10);

  return enemy;
}
