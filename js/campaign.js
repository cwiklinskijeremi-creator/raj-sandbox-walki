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
      "Arcykapłan, umierając, szepcze lokalizację: Wieża Rady, najwyższe piętro. Ale zanim zdążysz ruszyć w tamtą stronę, wyczuwasz, że ktoś już depcze ci po piętach — Rada nie zamierza czekać bezczynnie, aż dotrzesz do jej progu.",
    ],
    reward: { currency: "Fiolki Światła", amount: 20 },
  },
  {
    id: "shadow",
    title: "Cień Rady",
    icon: "🌑",
    locationKey: "cien_rady",
    intro: [
      "Rada, ostrzeżona przez umierającego Arcykapłana zanim jeszcze wydał ostatnie tchnienie, nie zamierza ryzykować — wysyła kogoś, kto nigdy nie chybia.",
      "Cichy Egzekutor Rady odnajduje cię, zanim zdążysz dotrzeć do Wieży. To nie jest walka o prawdę. To walka o przetrwanie.",
    ],
    outro: [
      "Egzekutor pada, a z jego rzeczy wypada pieczęć Rady i lista imion — twoich dawnych towarzyszy z wygnania, oznaczonych jako „do wyeliminowania”. Dorian nie jest jedynym, kto chce cię martwym.",
    ],
    reward: { currency: "Nagroda Gildii", amount: 25 },
  },
  {
    id: "discarded",
    title: "Odrzucony Eksperyment",
    icon: "🧪",
    locationKey: "odrzucony_eksperyment",
    intro: [
      "Lista imion prowadzi cię do zapomnianego laboratorium pod samą Wieżą Rady — miejsca, gdzie Dorian testował swoje „oczyszczenia”, zanim przeniósł je do Skażonego Lasu.",
      "To, co tam zastajesz, nie powinno już żyć. Odrzucony — pierwszy udany eksperyment Doriana, porzucony, gdy przestał być posłuszny.",
    ],
    outro: [
      "Gdy Odrzucony w końcu pada, w jego szczątkach znajdujesz coś, co przyprawia cię o mdłości — fragment raportu z twoim imieniem. Byłeś następny na liście, zanim uciekłeś na wygnanie. Teraz nie ma już odwrotu: wchodzisz po schodach Wieży Rady.",
    ],
    reward: { currency: "Kryształy Esencji", amount: 25 },
  },
  {
    id: "finale",
    title: "Wieża Rady",
    icon: "🏰",
    locationKey: null,
    isFinale: true,
    intro: [
      "Siedem lat wygnania, długi łańcuch tropów i krwi, i w końcu stoisz u progu Wieży Rady. Dorian Vex czeka na szczycie — dokładnie tam, gdzie kiedyś zdradził cię przed całą Radą.",
      "Twoi towarzysze nie znają całej prawdy o tym, kim jesteś i dlaczego tu jesteś. Może to już nie ma znaczenia. Liczy się tylko to, co czeka na górze.",
    ],
    outro: [
      "Dorian pada, a jego ostatnie słowa — „Rada... i tak cię... nie przyjmie...” — milkną wraz z nim. Stoisz nad ciałem człowieka, który zniszczył ci życie, a jednak nie czujesz ulgi, jakiej się spodziewałeś.",
      "Możesz teraz obrać dowolną ścieżkę: dokończyć zemstę i sięgnąć po miejsce w Radzie, którego cię pozbawiono — albo odwrócić się od tronu zbudowanego na kościach niewolników. Ta opowieść, jak wszystkie w Raju, nie ma jednej dobrej odpowiedzi. Ale przynajmniej jest już twoja.",
    ],
    reward: { currency: "Kryształy Esencji", amount: 60 },
  },
];

// Dorian's opening taunt on the campaign board, shown once chapter 7
// unlocks (js/ui.js: renderCampaignBoard) — appended after finale.intro,
// before the fight itself. Reacts to the same two threads as the epilogue
// (main.js: getStoryChoicesSummary): how far the player's own spaczenie
// went, and light-vs-dark on the NPC side quests / companion story arcs.
// Corruption always shows one of its two variants; the choices taunt only
// appears once the player has actually completed one of those threads —
// mirrors buildStoryChoicesAddendum in js/prologue.js exactly, so the same
// light/dark/balanced verdict a player earns here echoes again in the
// epilogue after the fight.
const DORIAN_CORRUPTION_TAUNTS = {
  high: "Dorian mierzy cię wzrokiem, a kącik jego ust unosi się w czymś na kształt uznania. „Spaczenie... widzę je na tobie wyraźniej niż na jakimkolwiek innym eksperymencie z Kopalni. Może w końcu rozumiesz, co próbowałem osiągnąć — zamiast tylko mnie za to nienawidzić.”",
  low: "Dorian mierzy cię wzrokiem, szukając śladów tego, co przydarzyło się innym, którzy stanęli mu na drodze. „Nietknięty. Ciekawe. Rzadko widuję kogoś, kto przeszedł przez to wszystko i wciąż wygląda... normalnie.”",
};
const DORIAN_CHOICES_TAUNTS = {
  light: "„Słyszałem o tobie w mieście, zanim jeszcze tu dotarłeś” dodaje Dorian. „Uczciwy. Lojalny wobec tych, którzy ci zaufali. Rada uczyła mnie, że takich ludzi łamie się najłatwiej — mieli zbyt wiele do stracenia.”",
  dark: "„Słyszałem o tobie w mieście, zanim jeszcze tu dotarłeś” dodaje Dorian. „Milczenie, zysk, cienie zamiast prawdy. Rada byłaby z ciebie dumna, może bardziej, niż chciałbyś przyznać.”",
  balanced: "„Słyszałem o tobie w mieście, zanim jeszcze tu dotarłeś” dodaje Dorian. „Ani światły, ani mroczny do końca. Trudno cię przejrzeć — a ja lubię wiedzieć, z kim mam do czynienia, zanim umrę.”",
};

function getFinaleTaunts(corruptionValue, storyChoicesSummary) {
  const taunts = [(corruptionValue || 0) >= CORRUPTION_EPILOGUE_HIGH_THRESHOLD
    ? DORIAN_CORRUPTION_TAUNTS.high
    : DORIAN_CORRUPTION_TAUNTS.low];

  if (storyChoicesSummary) {
    const light = storyChoicesSummary.honestQuests + storyChoicesSummary.lightCompanions;
    const dark = storyChoicesSummary.darkQuests + storyChoicesSummary.darkCompanions;
    if (light > 0 || dark > 0) {
      const variant = light > dark ? "light" : dark > light ? "dark" : "balanced";
      taunts.push(DORIAN_CHOICES_TAUNTS[variant]);
    }
  }
  return taunts;
}

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

// Campaign-only locations for the two mini-boss chapters (like the finale
// above, not part of the world map's LOCATIONS array).
const CAMPAIGN_EXTRA_LOCATIONS = {
  cien_rady: {
    key: "cien_rady",
    name: "Cień Rady",
    icon: "🌑",
    description: "Wąskie uliczki Aetherionu o zmierzchu, gdzie Rada wysyła tych, o których wolałaby nie mówić głośno.",
    enemyKeys: null,
    obstacleBias: "rock",
    resource: { name: "Nagroda Gildii", icon: "🪙", min: 10, max: 18 },
    bossKey: "boss_cien_rady",
  },
  odrzucony_eksperyment: {
    key: "odrzucony_eksperyment",
    name: "Zapomniane Laboratorium",
    icon: "🧪",
    description: "Zalane, opuszczone podziemia pod Wieżą Rady, gdzie Dorian prowadził swoje pierwsze eksperymenty z oczyszczeniem.",
    enemyKeys: null,
    obstacleBias: "lake",
    resource: { name: "Kryształy Esencji", icon: "💎", min: 10, max: 18 },
    bossKey: "boss_odrzucony",
  },
};

function getCampaignChapterLocation(chapter) {
  if (chapter.isFinale) return CAMPAIGN_FINALE_LOCATION;
  return LOCATIONS.find((l) => l.key === chapter.locationKey) || CAMPAIGN_EXTRA_LOCATIONS[chapter.locationKey] || null;
}
