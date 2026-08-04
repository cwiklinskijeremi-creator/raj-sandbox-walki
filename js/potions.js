const POTION_ITEMS = [
  {
    id: "mikstura_lecznicza",
    name: "Mikstura Lecznicza",
    icon: "🧪",
    description: "Podstawowy wywar Alchemików Gildii — szybko zasklepia rany.",
    effectType: "heal_self",
    effectValue: 0.25,
    cost: { currency: "Kryształy Esencji", amount: 6 },
  },
  {
    id: "mikstura_odrodzenia",
    name: "Mikstura Odrodzenia",
    icon: "❤️‍🩹",
    description: "Rzadki eliksir warzony z kryształów esencji — niemal w pełni regeneruje ciało.",
    effectType: "heal_self",
    effectValue: 0.5,
    cost: { currency: "Kryształy Esencji", amount: 16 },
  },
  {
    id: "eliksir_mocy",
    name: "Eliksir Wielkiej Mocy",
    icon: "💪",
    description: "Krew berserkerów w płynnej postaci — na chwilę czynisz się dużo silniejszy.",
    effectType: "self_buff",
    stat: "str",
    effectValue: 5,
    effectTurns: 3,
    label: "wzmocnienie",
    cost: { currency: "Kryształy Esencji", amount: 10 },
  },
  {
    id: "eliksir_zelaznej_skory",
    name: "Eliksir Żelaznej Skóry",
    icon: "🛡️",
    description: "Alchemiczna maź stwardniająca skórę niczym płyty pancerza.",
    effectType: "self_buff",
    stat: "pancerz",
    effectValue: 0.15,
    effectTurns: 3,
    label: "żelazna skóra",
    cost: { currency: "Kryształy Esencji", amount: 10 },
  },
  {
    id: "eliksir_hartu",
    name: "Eliksir Hartu",
    icon: "❤️‍🔥",
    description: "Napar błogosławiony przez Zakon Światła — hartuje ciało na ból.",
    effectType: "self_buff",
    stat: "wyt",
    effectValue: 5,
    effectTurns: 3,
    label: "hart ciała",
    cost: { currency: "Kryształy Esencji", amount: 10 },
  },
];

function formatPotionEffect(potion) {
  if (potion.effectType === "heal_self") {
    return `Leczy ${Math.round(potion.effectValue * 100)}% maksymalnego HP.`;
  }
  if (potion.effectType === "self_buff") {
    const amountText = potion.stat === "pancerz" ? `${Math.round(potion.effectValue * 100)}%` : `+${potion.effectValue}`;
    return `${amountText} ${potion.stat.toUpperCase()} na ${potion.effectTurns} tury.`;
  }
  return "";
}
