// The main story campaign: five chapters tracing the player's revenge on
// Dorian Vex, the friend who betrayed them to the Rada (see js/lore.js for
// the full backstory). Chapters 1-4 reuse the four existing world locations
// and their bosses — the campaign just reframes them with narrative context
// and its own rewards. Chapter 5 is a unique finale fight against Dorian
// himself at a dedicated location.
const CAMPAIGN_CHAPTERS = [
  {
    id: "trail",
    title: "Ślady zdrady",
    icon: "🗺️",
    locationKey: "szlak",
    intro: [
      "Siedem lat wygnania nauczyło cię cierpliwości. Teraz, ukryty pod maską rekruta Gildii, zaczynasz węszyć — Dorian Vex musiał zostawić ślady, gdy piął się do władzy.",
      "Plotki prowadzą do Zdradzieckiego Łowcy-Mistrza, patrolującego Szlak Gildii. Podobno to on przekazywał Radzie informacje o wygnańcach. Może wie coś o twoim dawnym przyjacielu.",
    ],
    outro: [
      "Łowca pada, zanim zdąży wyjawić więcej niż jedno imię — ale to wystarczy: Dorian Vex nadal działa w cieniu Kopalni Esencji, testując coś, co Rada wolałaby ukryć.",
    ],
    reward: { currency: "Nagroda Gildii", amount: 20 },
  },
  {
    id: "mines",
    title: "Krew w kopalniach",
    icon: "⛏️",
    locationKey: "kopalnie",
    intro: [
      "Kopalnie, gdzie niegdyś paliłeś niewolników „dla danych”, teraz kryją coś nowego — Strażnika Kryształów, prastarą konstrukcję obudzoną przez eksperymenty Doriana.",
      "Jeśli Dorian naprawdę bawi się esencją na taką skalę, zostawił tu ślady swojej obecności — i może odpowiedzi, dlaczego Rada wciąż go chroni.",
    ],
    outro: [
      "Wśród rozbitego kryształu Strażnika znajdujesz spalone notatki — charakter pisma Doriana, plany „oczyszczenia” niewolników w Skażonym Lesie. Twój żołądek się ściska, choć nie jesteś pewien, czy to gniew, czy wspomnienie własnych grzechów.",
    ],
    reward: { currency: "Kryształy Esencji", amount: 20 },
  },
  {
    id: "forest",
    title: "Zaraza w lesie",
    icon: "🌲",
    locationKey: "las",
    intro: [
      "Notatki prowadzą do lasu — miejsca, gdzie Dorian testował „oczyszczanie” na uciekinierach z kopalń. To, co z nich zostało, dawno przestało być ludźmi.",
      "Matka Rojowiska, zdegenerowana forma jednej z ofiar, broni resztek tego, co Dorian tam zostawił.",
    ],
    outro: [
      "Pokonana bestia rozsypuje się w pył esencji, odsłaniając spalony medalion Zakonu Światła. Trop prowadzi do Placówki — może kapłani wiedzieli więcej, niż udawali.",
    ],
    reward: { currency: "Spaczone Zioła", amount: 20 },
  },
  {
    id: "outpost",
    title: "Fałszywe miłosierdzie",
    icon: "⛪",
    locationKey: "placowka",
    intro: [
      "Zakon Światła zawsze udawał litość — teraz wiesz, że przynajmniej część ich „miłosierdzia” była przykrywką dla eksperymentów Doriana.",
      "Skorumpowany Arcykapłan zna prawdę. Pytanie, czy odda ją dobrowolnie, czy trzeba będzie ją wyrwać siłą.",
    ],
    outro: [
      "Arcykapłan, umierając, szepcze lokalizację: Wieża Rady, najwyższe piętro. Dorian nie ukrywa się już w cieniu — czeka tam, jakby wiedział, że przyjdziesz.",
    ],
    reward: { currency: "Fiolki Światła", amount: 20 },
  },
  {
    id: "finale",
    title: "Wieża Rady",
    icon: "🏰",
    locationKey: null,
    isFinale: true,
    intro: [
      "Siedem lat wygnania, cztery rozdarte tropy, i w końcu stoisz u progu Wieży Rady. Dorian Vex czeka na szczycie — dokładnie tam, gdzie kiedyś zdradził cię przed całą Radą.",
      "Twoi towarzysze nie znają całej prawdy o tym, kim jesteś i dlaczego tu jesteś. Może to już nie ma znaczenia. Liczy się tylko to, co czeka na górze.",
    ],
    outro: [
      "Dorian pada, a jego ostatnie słowa — „Rada... i tak cię... nie przyjmie...” — milkną wraz z nim. Stoisz nad ciałem człowieka, który zniszczył ci życie, a jednak nie czujesz ulgi, jakiej się spodziewałeś.",
      "Możesz teraz obrać dowolną ścieżkę: dokończyć zemstę i sięgnąć po miejsce w Radzie, którego cię pozbawiono — albo odwrócić się od tronu zbudowanego na kościach niewolników. Ta opowieść, jak wszystkie w Raju, nie ma jednej dobrej odpowiedzi. Ale przynajmniej jest już twoja.",
    ],
    reward: { currency: "Kryształy Esencji", amount: 60 },
  },
];

const CAMPAIGN_FINALE_LOCATION = {
  key: "wieza_rady",
  name: "Wieża Rady",
  icon: "🏰",
  description: "Serce Aetherionu — szczyt kryształowej wieży, gdzie Dorian Vex czeka na ciebie, otoczony ciszą sali obrad Rady.",
  enemyKeys: null,
  obstacleBias: "rock",
  resource: { name: "Kryształy Esencji", icon: "💎", min: 10, max: 18 },
  bossKey: "boss_dorian",
};

function getCampaignChapterLocation(chapter) {
  if (chapter.isFinale) return CAMPAIGN_FINALE_LOCATION;
  return LOCATIONS.find((l) => l.key === chapter.locationKey);
}
