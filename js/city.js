const CITY_PLACES = [
  {
    key: "kuznia",
    name: "Kuźnia Gildii Rzemieślników",
    icon: "⚒️",
    description: "Kowale, alchemicy i architekci Gildii Rzemieślników kują broń i pancerze na zamówienie Rady. Za odpowiednią cenę coś z ich warsztatu trafia też w ręce niższych stanem — takich jak Ty. Przyjmą też do ulepszenia ekwipunek, który już posiadasz.",
  },
  {
    key: "swiatynia",
    name: "Świątynia Zakonu Światła",
    icon: "⛪",
    description: "Zakon Światła sprzedaje błogosławione talizmany i relikwie tym, którzy mogą zapłacić — ich „miłosierdzie” zawsze ma swoją cenę. Za dodatkową opłatą kapłani zetrą też ślad Twojego dotychczasowego treningu, pozwalając rozdać punkty statystyk od nowa.",
  },
  {
    key: "arena",
    name: "Arena Krwi",
    icon: "⚔️",
    description: "Prowizoryczna arena na tyłach miasta, gdzie najemnicy ćwiczą się na sobie nawzajem, zanim wyruszą po prawdziwą zdobycz. Można tu stoczyć szybki pojedynek bez wyprawy i lochu — mniejsza nagroda, ale zero ryzyka po drodze.",
  },
  {
    key: "czarny_rynek",
    name: "Czarny Rynek",
    icon: "🏴",
    description: "Przekupieni strażnicy patrzą w inną stronę, kiedy handlarze rozkładają towar zdobyty nie do końca legalnie. Kupią też od Ciebie to, czego już nie potrzebujesz.",
  },
  {
    key: "tawerna",
    name: "Tawerna Pod Pękniętym Kryształem",
    icon: "🍺",
    description: "Najemnicy, przemytnicy i oszuści grają tu w kości do białego rana. Rada nie zabrania hazardu — pobiera od niego podatek.",
  },
];

// One named NPC per city location — pure flavor/gossip dialogue (a random
// line re-rolls each time the player talks), plus an optional one-time side
// quest on two of them. Reuses the same progress-tracking state as the Guild
// quest board (totalKills/level/discoveredCount) and, for "resource" quests,
// the same read-only-threshold pattern as companion recruitment — except
// here the resource is actually spent on claim, since it's framed as a sale.
const CITY_NPCS = {
  kuznia: {
    name: "Brenna Żelazna Dłoń",
    icon: "👩‍🔧",
    lines: [
      "Rada płaci nam za każdy miecz, który potrafi przebić skórę aberracji. Nie pytaj, skąd bierzemy próbki do testów.",
      "Mistrz Gildii mówi, że najlepsza broń rodzi się z rozpaczy klienta. Chyba nie mylił się co do większości z was.",
      "Widziałam, jak wracałeś z Kopalni okryty pyłem esencji. Miej się na baczności — to nie znika, nawet gdy pancerz już dawno rdzewieje.",
      "Kuźnia nigdy nie gaśnie. Nawet w nocy słychać młoty — podobno robią coś dla samej Rady, ale nikt z nas tego nie widział.",
    ],
  },
  swiatynia: {
    name: "Brat Aldric",
    icon: "🕊️",
    lines: [
      "Światło leczy tylko tych, którzy jeszcze mogą pracować. Reszta trafia do naszych modłów, nie do naszych eliksirów.",
      "Zakon mówi o miłosierdziu, ale ja widziałem księgi rachunkowe. Miłosierdzie ma cennik, tak jak wszystko inne w Raju.",
      "Niektórzy szepczą, że dawno temu Zakon ukrywał zbiegów z kopalni. Ja w to nie wierzę — ale też się nie afiszuję z pytaniami.",
      "Modlę się za twoją duszę, wędrowcze. Sądząc po bliznach spaczenia, potrzebujesz tego bardziej niż inni.",
    ],
  },
  arena: {
    name: "Grom",
    icon: "🥊",
    lines: [
      "Tu nikt nie pyta, skąd jesteś ani dlaczego uciekłeś. Liczy się tylko, ile razy wstaniesz po upadku.",
      "Widziałem lepszych od ciebie, jak kończyli na piasku areny. Ale widziałem też gorszych, jak zostawali legendami.",
      "Rada zabrania prawdziwych walk na śmierć i życie w mieście — Arena to jedyna szczelina, gdzie napięcie znajduje ujście.",
    ],
    quest: {
      type: "kills", goal: 15,
      description: "Udowodnij, że Arena to dla ciebie za mało — pokonaj 15 przeciwników w dowolnych walkach.",
      reward: { currency: "Nagroda Gildii", amount: 25 },
    },
  },
  czarny_rynek: {
    name: "Riven Cichy Krok",
    icon: "🗝️",
    lines: [
      "Nie pytam skąd bierzesz towar, ty nie pytaj skąd ja biorę kupców.",
      "Strażnicy widzą tylko to, za co im płacimy, żeby nie widzieli. Reszta to twój problem.",
      "Krążą plotki o zniknięciu jednego z synów Rady przed laty. Ktoś twierdzi, że wrócił. Ja bym się takim gadaniem nie przejmował, gdybym był tobą.",
      "Kryształy Esencji zawsze znajdą kupca. Nawet skradzione. Zwłaszcza skradzione.",
    ],
    quest: {
      type: "resource", currency: "Kryształy Esencji", goal: 30,
      description: "Riven kupi od Ciebie 30 Kryształów Esencji z pominięciem podatku Rady — przynieś je, a zapłaci w towarze, którego nie znajdziesz legalnie.",
      reward: { currency: "Fiolki Światła", amount: 25 },
    },
  },
  tawerna: {
    name: "Yolanda Dwa Kielichy",
    icon: "🍷",
    lines: [
      "Kości nie kłamią, ale ludzie przy nich owszem. Pilnuj swoich kieszeni, wędrowcze.",
      "Podatek od hazardu też trafia do Rady. Nawet nasza rozpacz ich wzbogaca.",
      "Słyszałam więcej sekretów przy tym barze niż niejeden szpieg Rady. Ale barmanka, która gada, szybko zostaje bezrobotna.",
      "Pęknięty Kryształ w nazwie? Podobno pierwszy właściciel rozbił go o głowę oszusta przy kościach. Od tego czasu nikt tu nie oszukuje… otwarcie.",
    ],
  },
};
