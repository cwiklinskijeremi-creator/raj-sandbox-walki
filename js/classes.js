const CLASS_DATA = [
  {
    name: "Mag",
    icon: "🧙",
    subclasses: [
      {
        name: "Arcymag",
        icon: "🔮",
        str: 4, wyt: 5, zre: 8, int: 20, cha: 16,
        hp: 110, pancerz: 0.05, przebicie: 0.05,
        weapons: [
          { name: "Różdżka Ognia", minDmg: 10, maxDmg: 16, range: 6 },
          { name: "Laska Maga", minDmg: 5, maxDmg: 8, range: 1 },
        ],
        skills: [
          {
            name: "Kula Ognia", icon: "🔥", colorClass: "spell-fire",
            minDmg: 12, maxDmg: 18, range: 6, cooldown: 3,
            effectType: "aoe_damage", effectValue: 0.6, effectRadius: 1,
          },
          {
            name: "Tarcza Many", icon: "🔷", colorClass: "spell-elixir",
            minDmg: 10, maxDmg: 15, range: 5, cooldown: 4,
            effectType: "self_buff", stat: "pancerz", effectValue: 0.15, effectTurns: 3,
            label: "tarcza many",
          },
        ],
      },
      {
        name: "Apostata",
        icon: "🖤",
        str: 5, wyt: 5, zre: 9, int: 18, cha: 12,
        hp: 115, pancerz: 0.05, przebicie: 0.1,
        weapons: [
          { name: "Mroczny Płomień", minDmg: 11, maxDmg: 18, range: 6 },
          { name: "Sztylet Rytualny", minDmg: 6, maxDmg: 10, range: 1 },
        ],
        skills: [
          {
            name: "Mroczny Pocisk", icon: "🌀", colorClass: "spell-dark",
            minDmg: 13, maxDmg: 19, range: 6, cooldown: 3,
            effectType: "armor_shred", effectValue: 0.15, effectTurns: 2,
          },
          {
            name: "Wysysanie Życia", icon: "🧛", colorClass: "spell-dark",
            minDmg: 12, maxDmg: 17, range: 5, cooldown: 3,
            effectType: "lifesteal", effectValue: 0.45,
          },
        ],
      },
    ],
  },
  {
    name: "Paladyn",
    icon: "🛡️",
    subclasses: [
      {
        name: "Świetlisty obrońca",
        icon: "😇",
        str: 9, wyt: 12, zre: 6, int: 6, cha: 10,
        hp: 180, pancerz: 0.22, przebicie: 0.05,
        weapons: [
          { name: "Miecz Światła", minDmg: 11, maxDmg: 16, range: 1 },
          { name: "Tarcza Uderzeniowa", minDmg: 6, maxDmg: 9, range: 1 },
        ],
        skills: [
          {
            name: "Promień Osądu", icon: "✨", colorClass: "spell-holy",
            minDmg: 10, maxDmg: 15, range: 5, cooldown: 4,
            effectType: "heal_self", effectValue: 0.2,
          },
          {
            name: "Tarcza Światła", icon: "🌟", colorClass: "spell-holy",
            minDmg: 9, maxDmg: 14, range: 5, cooldown: 4,
            effectType: "self_buff", stat: "pancerz", effectValue: 0.18, effectTurns: 3,
            label: "tarcza światła",
          },
        ],
      },
      {
        name: "Mroczny rycerz",
        icon: "🌑",
        str: 11, wyt: 10, zre: 7, int: 4, cha: 8,
        hp: 170, pancerz: 0.18, przebicie: 0.1,
        weapons: [
          { name: "Czarny Miecz", minDmg: 13, maxDmg: 19, range: 1 },
          { name: "Rękawica Mroku", minDmg: 8, maxDmg: 12, range: 1 },
        ],
        skills: [
          {
            name: "Klątwa Krwi", icon: "🩸", colorClass: "spell-dark",
            minDmg: 12, maxDmg: 17, range: 5, cooldown: 3,
            effectType: "lifesteal", effectValue: 0.5,
          },
          {
            name: "Mroczna Aura", icon: "💀", colorClass: "spell-dark",
            minDmg: 11, maxDmg: 16, range: 5, cooldown: 4,
            effectType: "self_buff", stat: "str", effectValue: 5, effectTurns: 3,
            label: "mroczna aura",
          },
        ],
      },
    ],
  },
  {
    name: "Wojownik",
    icon: "⚔️",
    subclasses: [
      {
        name: "Najemnik bractwa",
        icon: "🪓",
        str: 12, wyt: 8, zre: 10, int: 3, cha: 6,
        hp: 150, pancerz: 0.15, przebicie: 0.15,
        weapons: [
          { name: "Miecz Najemnika", minDmg: 12, maxDmg: 18, range: 1 },
          { name: "Kusza Ręczna", minDmg: 8, maxDmg: 12, range: 5 },
        ],
        skills: [
          {
            name: "Celny Rzut", icon: "🔪", colorClass: "spell-physical",
            minDmg: 10, maxDmg: 14, range: 5, cooldown: 3,
            effectType: "ignore_armor",
          },
          {
            name: "Bojowy Okrzyk", icon: "📯", colorClass: "spell-physical",
            minDmg: 9, maxDmg: 13, range: 5, cooldown: 4,
            effectType: "self_buff", stat: "str", effectValue: 5, effectTurns: 3,
            label: "bojowy okrzyk",
          },
        ],
      },
      {
        name: "Berserk",
        icon: "😡",
        str: 15, wyt: 5, zre: 9, int: 2, cha: 5,
        hp: 140, pancerz: 0.05, przebicie: 0.2,
        weapons: [
          { name: "Wielki Topór", minDmg: 16, maxDmg: 24, range: 1 },
          { name: "Dwa Topory", minDmg: 12, maxDmg: 16, range: 1 },
        ],
        skills: [
          {
            name: "Rzucony Topór", icon: "🪓", colorClass: "spell-physical",
            minDmg: 14, maxDmg: 20, range: 4, cooldown: 4,
            effectType: "self_buff", stat: "str", effectValue: 6, effectTurns: 2,
            label: "wściekłość",
          },
          {
            name: "Krwawy Szał", icon: "🩸", colorClass: "spell-physical",
            minDmg: 13, maxDmg: 19, range: 4, cooldown: 3,
            effectType: "lifesteal", effectValue: 0.4,
          },
        ],
      },
    ],
  },
  {
    name: "Łotrzyk",
    icon: "🗡️",
    subclasses: [
      {
        name: "Łowca",
        icon: "🏹",
        str: 7, wyt: 5, zre: 16, int: 8, cha: 6,
        hp: 120, pancerz: 0.1, przebicie: 0.1,
        weapons: [
          { name: "Długi Łuk", minDmg: 10, maxDmg: 15, range: 7 },
          { name: "Krótki Miecz", minDmg: 7, maxDmg: 11, range: 1 },
        ],
        skills: [
          {
            name: "Precyzyjny Strzał", icon: "🏹", colorClass: "spell-physical",
            minDmg: 11, maxDmg: 16, range: 7, cooldown: 3,
            effectType: "guaranteed_crit",
          },
          {
            name: "Usidlająca Strzała", icon: "🪤", colorClass: "spell-physical",
            minDmg: 10, maxDmg: 15, range: 7, cooldown: 3,
            effectType: "armor_shred", effectValue: 0.15, effectTurns: 2,
          },
        ],
      },
      {
        name: "Skrytobójca",
        icon: "🥷",
        str: 9, wyt: 4, zre: 18, int: 6, cha: 8,
        hp: 115, pancerz: 0.08, przebicie: 0.25,
        weapons: [
          { name: "Zatrute Sztylety", minDmg: 9, maxDmg: 14, range: 1 },
          { name: "Shuriken", minDmg: 6, maxDmg: 9, range: 3 },
        ],
        skills: [
          {
            name: "Zatruty Sztylet", icon: "☠️", colorClass: "spell-poison",
            minDmg: 10, maxDmg: 15, range: 4, cooldown: 3,
            effectType: "poison_dot", effectValue: 6, effectTurns: 2,
          },
          {
            name: "Cios w Plecy", icon: "🗡️", colorClass: "spell-physical",
            minDmg: 9, maxDmg: 14, range: 4, cooldown: 4,
            effectType: "guaranteed_crit",
          },
        ],
      },
    ],
  },
  {
    name: "Alchemik",
    icon: "⚗️",
    subclasses: [
      {
        name: "Truciciel",
        icon: "🧪",
        str: 5, wyt: 6, zre: 10, int: 14, cha: 9,
        hp: 120, pancerz: 0.08, przebicie: 0.15,
        weapons: [
          { name: "Butelki z Trucizną", minDmg: 9, maxDmg: 14, range: 4 },
          { name: "Zatruty Sztylet", minDmg: 6, maxDmg: 10, range: 1 },
        ],
        skills: [
          {
            name: "Kwasowa Fiolka", icon: "🧪", colorClass: "spell-poison",
            minDmg: 11, maxDmg: 16, range: 5, cooldown: 4,
            effectType: "aoe_poison", effectValue: 5, effectTurns: 2, effectRadius: 1,
          },
          {
            name: "Eliksir Odporności", icon: "🧫", colorClass: "spell-elixir",
            minDmg: 10, maxDmg: 15, range: 5, cooldown: 4,
            effectType: "self_buff", stat: "wyt", effectValue: 5, effectTurns: 3,
            label: "eliksir odporności",
          },
        ],
      },
      {
        name: "Medyk",
        icon: "💊",
        str: 5, wyt: 9, zre: 8, int: 13, cha: 12,
        hp: 130, pancerz: 0.12, przebicie: 0.08,
        weapons: [
          { name: "Skalpel Alchemiczny", minDmg: 7, maxDmg: 11, range: 1 },
          { name: "Rzucany Eliksir", minDmg: 6, maxDmg: 10, range: 3 },
        ],
        skills: [
          {
            name: "Wybuchowy Eliksir", icon: "💥", colorClass: "spell-elixir",
            minDmg: 9, maxDmg: 14, range: 5, cooldown: 4,
            effectType: "heal_self", effectValue: 0.25,
          },
          {
            name: "Kwas Żrący", icon: "🧪", colorClass: "spell-poison",
            minDmg: 8, maxDmg: 13, range: 5, cooldown: 3,
            effectType: "armor_shred", effectValue: 0.12, effectTurns: 2,
          },
        ],
      },
    ],
  },
];
