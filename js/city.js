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
  {
    key: "kult_spaczenia",
    name: "Kult Spaczenia",
    icon: "🌀",
    description: "Ukryta w piwnicach pod miastem sekta wierzy, że spaczenie many to nie klątwa, lecz dar — krok w stronę czegoś więcej niż człowiek. Zakon Światła nazwałby ich heretykami, gdyby wiedział, gdzie szukać.",
  },
];

// One named NPC per city location — pure flavor/gossip dialogue (a random
// line re-rolls each time the player talks) plus a one-time side quest, each
// using a different progress type (kills/level/bestiary/resource x2) for
// variety. Reuses the same progress-tracking state as the Guild quest board
// (totalKills/level/discoveredCount) and, for "resource" quests, the same
// read-only-threshold pattern as companion recruitment — except here the
// resource is actually spent on claim, since it's framed as a sale.
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
    quest: {
      type: "level", goal: 4,
      description: "Wróć, gdy udowodnisz, że potrafisz udźwignąć to, co kujemy — osiągnij 4. poziom doświadczenia, a dorzucę ci coś z warsztatu.",
      reward: { currency: "Kryształy Esencji", amount: 20 },
    },
    highCorruptionLine: "Ręce ci się zmieniają, wędrowcze. Widziałam już takie zmiany u górników z Kopalni — zwykle na gorsze.",
    questResolutionLines: {
      honest: "Rada wciąż nie wie, że to ode mnie wyszła ta wiadomość o Kopalniach. Dzięki, że nie musiałam mówić tego sama.",
      dark: "Trzymamy to, co widzieliśmy w Kopalniach, między sobą. Dobrze, że przynajmniej ty rozumiesz, czemu milczę.",
    },
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
    quest: {
      type: "bestiary", goal: 6,
      description: "Aby zrozumieć plagę tego świata, musisz najpierw ją poznać. Odkryj 6 różnych stworzeń w Bestiariuszu, a pobłogosławię cię za to poświęcenie.",
      reward: { currency: "Fiolki Światła", amount: 20 },
    },
    highCorruptionLine: "Modlę się za twoją duszę, wędrowcze. Sądząc po bliznach spaczenia, potrzebujesz tego bardziej niż inni.",
    questResolutionLines: {
      honest: "Odkąd powiedziałeś mi prawdę o Tomaszu, śpię spokojniej — nawet jeśli ta prawda była ciężka.",
      dark: "Wciąż opłakuję Tomasza jako bohatera poległego w kopalniach. Czasem myślę, że wiesz o tym więcej, niż mówisz.",
    },
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
    highCorruptionLine: "Widziałem, jak spaczenie zmienia zawodników na tej arenie. Niektórzy walczą lepiej. Żaden nie wraca taki sam.",
    questResolutionLines: {
      honest: "Od tamtej walki z wysłannikiem Rady wciąż mówią o tobie na Arenie. Dobrze zrobiłeś, kończąc to na oczach tłumu.",
      dark: "Nie pytam, co wyciągnąłeś z tamtego wysłannika. Widziałem tylko, że wygrałeś, i to mi wystarcza.",
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
    highCorruptionLine: "Spaczenie na twojej skórze to towar, na który zawsze znajdę kupca. Nie pytaj, kto go szuka.",
    questResolutionLines: {
      honest: "Ten urzędnik Rady, którego wsypałeś moimi dowodami? Wciąż płaci za to gniewem, którego nie umie ukryć. Dobra robota.",
      dark: "Ludzie, którzy myślą jak ty, zawsze u mnie zarabiają więcej. Ten konwój Rady wciąż nam się opłaca.",
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
    quest: {
      type: "resource", currency: "Nagroda Gildii", goal: 40,
      description: "Przynieś mi 40 Nagrody Gildii, a wytoczę ci coś specjalnego zza baru — coś, czego nie ma w oficjalnym menu.",
      reward: { currency: "Spaczone Zioła", amount: 20 },
    },
    highCorruptionLine: "Nalewam ci to samo co zawsze, ale patrzysz na mnie inaczej niż kiedyś. Spaczenie robi to każdemu, prędzej czy później.",
  },
  kult_spaczenia: {
    name: "Matka Esencja",
    icon: "👁️",
    lines: [
      "Zakon nazywa to skażeniem. My nazywamy to przebudzeniem.",
      "Widziałam bliznę spaczenia na twojej skórze, wędrowcze. To nie wstyd — to znak, że esencja cię wybrała.",
      "Egzekutorzy Wiary już dwa razy próbowali nas znaleźć. Wciąż szukają.",
      "Im głębiej schodzisz w kopalnie, tym głośniej esencja szepcze. Niektórzy z nas już nie chcą, żeby przestała.",
    ],
    quest: {
      type: "corruption", goal: 40,
      description: "Udowodnij, że nie boisz się przemiany — osiągnij 40% spaczenia many, a podzielimy się z tobą sekretem esencji.",
      reward: { currency: "Spaczone Zioła", amount: 25 },
    },
    highCorruptionLine: "Esencja szepcze do ciebie już wyraźniej niż do większości, prawda? Widzę to w twoich oczach. Witaj bliżej domu.",
  },
};
