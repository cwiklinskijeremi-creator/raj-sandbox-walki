const QUESTS = [
  {
    id: "pierwsza_krew",
    name: "Pierwsza Krew",
    icon: "⚔️",
    description: "Pokonaj 5 przeciwników w dowolnej walce.",
    goal: 5,
    progressKey: "totalKills",
    reward: { currency: "Nagroda Gildii", amount: 20 },
  },
  {
    id: "lowca_nagrod",
    name: "Łowca Nagród",
    icon: "📈",
    description: "Osiągnij 3. poziom doświadczenia.",
    goal: 3,
    progressKey: "level",
    reward: { currency: "Kryształy Esencji", amount: 20 },
  },
  {
    id: "poznaj_wroga",
    name: "Poznaj Wroga",
    icon: "📜",
    description: "Odkryj 3 różnych przeciwników w Bestiariuszu.",
    goal: 3,
    progressKey: "discoveredCount",
    reward: { currency: "Fiolki Światła", amount: 20 },
  },
];
