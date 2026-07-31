const MAX_COMPANIONS = 3;

const COMPANION_NAMES = [
  "Elara", "Torvin", "Sylas", "Maren", "Doran", "Ivy", "Kael", "Brenna",
  "Osric", "Talia", "Fenwick", "Sable", "Garrick", "Wren",
];

// One personal recruitment quest per subclass — the reason a companion
// gives for testing you before joining, not just an anonymous body count.
const COMPANION_QUESTS = {
  "Arcymag": {
    type: "bestiary", goal: 4, label: "odkrytych przeciwników w Bestiariuszu",
    flavor: "Zanim powierzę ci swoją magię, chcę wiedzieć, że rozumiesz, z czym walczymy. Odkryj w Bestiariuszu przynajmniej 4 różne stworzenia Aetherionu.",
  },
  "Apostata": {
    type: "resource", currency: "Kryształy Esencji", goal: 15, label: "× Kryształy Esencji",
    flavor: "Mój rytuał wymaga czystej esencji, nie tej, którą sprzedają oszuści z targu. Przynieś mi 15 Kryształów Esencji, a zobaczę, czy jesteś wart mojego mroku.",
  },
  "Świetlisty obrońca": {
    type: "level", goal: 3, label: "poziom doświadczenia",
    flavor: "Światło chroni tych, którzy potrafili przetrwać próby. Udowodnij, że dotarłeś do 3. poziomu doświadczenia, a dołączę do twojej krucjaty.",
  },
  "Mroczny rycerz": {
    type: "kills", goal: 6, label: "pokonanych przeciwników",
    flavor: "Zdrada nauczyła mnie nie ufać słowom — tylko czynom. Pokonaj 6 przeciwników, a przekonam się, że twoje ostrze mówi prawdę.",
  },
  "Najemnik bractwa": {
    type: "resource", currency: "Nagroda Gildii", goal: 20, label: "× Nagroda Gildii",
    flavor: "W Bractwie nikt nie pracuje za darmo — nawet dla przyszłego towarzysza. Zdobądź 20 Nagrody Gildii, a podpiszę kontrakt.",
  },
  "Berserk": {
    type: "kills", goal: 7, label: "pokonanych przeciwników",
    flavor: "Chcę zobaczyć krew na twoich rękach, zanim zawierzę ci plecy w bitwie. Pokonaj 7 przeciwników.",
  },
  "Łowca": {
    type: "bestiary", goal: 5, label: "odkrytych przeciwników w Bestiariuszu",
    flavor: "Dobry łowca zna swoją zwierzynę. Odkryj 5 różnych przeciwników w Bestiariuszu, a nauczę cię tropić resztę.",
  },
  "Skrytobójca": {
    type: "level", goal: 4, label: "poziom doświadczenia",
    flavor: "Zaufanie buduje się latami, ale siłę widać od razu. Osiągnij 4. poziom doświadczenia, a wyjdę z cienia.",
  },
  "Truciciel": {
    type: "resource", currency: "Spaczone Zioła", goal: 15, label: "× Spaczone Zioła",
    flavor: "Moje receptury wymagają rzadkich ziół, nie byle chwastów. Przynieś mi 15 Spaczonych Ziół, a zabiorę się do warzenia dla ciebie.",
  },
  "Medyk": {
    type: "resource", currency: "Fiolki Światła", goal: 12, label: "× Fiolki Światła",
    flavor: "Leczę tylko tych, którzy potrafią przetrwać na tyle długo, by mnie potrzebować. Zdobądź 12 Fiolek Światła, a dołączę jako twój medyk.",
  },
};

// Three-beat recruitment scene per subclass, shown once the quest goal is
// met: greeting (references the completed task), an unexpected complication,
// then a resolution where helping through it earns the companion's trust.
const COMPANION_SCENES = {
  "Arcymag": [
    "Widzę, że naprawdę przestudiowałeś bestie Aetherionu, tak jak prosiłem. Usiądź, chcę ci pokazać coś w mojej pracowni.",
    "Zanim zdąży dokończyć zdanie, jeden z zapieczętowanych tomów na półce zaczyna drżeć — pieczęć powstrzymująca uwięzionego ducha pęka z trzaskiem.",
    "Wspólnie odpychacie zjawę za krawędź kręgu, zanim zdąży się w pełni zmaterializować. Arcymag otrzepuje szaty. „Cóż. Skoro już oswoiłeś się z potworami z książek, czas byś poznał te prawdziwe. Ruszam z tobą.”",
  ],
  "Apostata": [
    "Piętnaście kryształów, czyste jak łza. Rzadko kto dotrzymuje takiej obietnicy.",
    "Gdy wysypuje je na ołtarz, esencja zaczyna pulsować własnym rytmem — przyzwane echo z Otchłani przeciska się przez powietrze w stronę płomienia.",
    "Gasicie rytuał obiema parami rąk, zanim echo zdąży przybrać kształt. Apostata patrzy na ciebie inaczej niż wcześniej. „Mrok cię nie odrzucił. To rzadkość. Chodźmy.”",
  ],
  "Świetlisty obrońca": [
    "Trzeci poziom. Widziałam gorszych rycerzy dowodzących całymi oddziałami. Dobrze.",
    "Zanim zdąży dokończyć zdanie, dzwon na wieży bije na alarm — coś skalanego przekroczyło mur świątyni.",
    "Stajecie ramię w ramię przy bramie, odpierając napór, aż światło znów zapanuje nad murami. „Krucjata potrzebuje takich rąk jak twoje” mówi, chowając miecz. „Dołączam.”",
  ],
  "Mroczny rycerz": [
    "Sześciu przeciwników. Ostrze nie kłamie, nawet jeśli usta potrafią.",
    "W tej samej chwili z cienia wyłania się ktoś, kogo rycerz najwyraźniej rozpoznaje — dawny brat broni, ten sam, który go zdradził.",
    "Walczycie plecy w plecy, aż zdrajca ucieka w mrok. Rycerz chowa miecz z twardym spojrzeniem. „Dziś stanąłeś tam, gdzie on kiedyś stał. Może to coś znaczy. Jadę z tobą.”",
  ],
  "Najemnik bractwa": [
    "Dwadzieścia sztuk Nagrody Gildii. Kontrakt się zgadza.",
    "Zanim zdąży go podpisać, do gospody wpada dłużnik Bractwa błagający o pomoc — ścigają go ludzie, którym jest winien znacznie więcej niż tobie.",
    "Odpędzacie ścigających razem, choć to nie wasza sprawa. Najemnik chowa pióro. „Podoba mi się, jak pracujesz nawet bez kontraktu. Bractwo cię zatwierdza.”",
  ],
  "Berserk": [
    "Siedmiu. Czuję krew na twoich rękach nawet stąd.",
    "W tej samej chwili z lasu dobiega ryk — coś większego niż zwykły przeciwnik zwietrzyło krew i rusza w waszą stronę.",
    "Rzucacie się na bestię razem, topór przy topór, aż pada. Berserk śmieje się, otrzepując krew z pancerza. „To były najlepsze łowy, jakie miałem od miesięcy. Idę z tobą.”",
  ],
  "Łowca": [
    "Pięć różnych bestii w twoim rejestrze. Niezłe jak na kogoś, kto jeszcze nie zna tych lasów.",
    "Ślady na ziemi mówią co innego niż spokój wokół — coś tropi was od dłuższego czasu, krążąc, nie atakując.",
    "Zastawiacie razem prostą pułapkę i wywabiacie prześladowcę na otwarte pole, gdzie traci przewagę. Łowca chowa łuk z uśmiechem. „Dobre oko. Umiem rozpoznać kogoś, kto się nadaje. Ruszamy.”",
  ],
  "Skrytobójca": [
    "Czwarty poziom. W cieniu i tak było już o tobie głośno.",
    "Zanim zdąży wyjść z zaułka, ktoś rzuca w jej stronę nożem — kontrakt na jej głowę wciąż jest aktualny.",
    "Odbijacie zamach i wypłaszacie napastnika w kilka uderzeń serca. Skrytobójczyni chowa ostrze. „Ktoś, kto reaguje szybciej niż mój wróg. To rzadkie. Biorę cię.”",
  ],
  "Truciciel": [
    "Piętnaście Spaczonych Ziół, świeże, nie zwiędłe. Ktoś w końcu wie, gdzie szukać.",
    "Gdy zaczyna je przesypywać do moździerza, jedno z ziół uwalnia zarodniki silniejsze, niż się spodziewał — powietrze gęstnieje trującą mgłą.",
    "Wynosicie się z pracowni, zanim opary zrobią więcej szkody, i wietrzycie pomieszczenie razem. Truciciel kaszle, ale się śmieje. „Przeżyłeś moją pomyłkę. Dobry znak. Chodź ze mną.”",
  ],
  "Medyk": [
    "Dwanaście Fiolek Światła. Starczy na tydzień ciężkich obrażeń, jeśli dobrze rozdzielić.",
    "Zanim zdąży je schować, do namiotu wnoszą rannego z pobliskiej potyczki — krwawi szybciej, niż medyk zdąży przygotować opatrunek.",
    "Trzymasz rannego w bezruchu, podczas gdy medyk pracuje, i razem udaje się go ustabilizować. Ociera pot z czoła. „Dobre ręce w kryzysie liczą się bardziej niż CV. Dołączam do drużyny.”",
  ],
};

function generateCompanion(excludeClassName, excludeSubclassNames = [], excludeNames = []) {
  const availableClasses = CLASS_DATA.filter((c) => c.name !== excludeClassName);
  const availablePairs = [];
  availableClasses.forEach((cls) => {
    cls.subclasses.forEach((sub) => {
      if (!excludeSubclassNames.includes(sub.name)) availablePairs.push({ cls, sub });
    });
  });
  // Fall back to allowing a repeat subclass only if every option is already taken.
  const pairPool = availablePairs.length > 0
    ? availablePairs
    : availableClasses.flatMap((cls) => cls.subclasses.map((sub) => ({ cls, sub })));
  const { cls, sub } = pairPool[Math.floor(Math.random() * pairPool.length)];

  const availableNames = COMPANION_NAMES.filter((n) => !excludeNames.includes(n));
  const namePool = availableNames.length > 0 ? availableNames : COMPANION_NAMES;
  const name = namePool[Math.floor(Math.random() * namePool.length)];

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
  companion.baseName = name;
  companion.equipped = defaultEquippedState();
  return companion;
}

// Recomputes every stat fresh from the subclass's fixed base numbers rather
// than multiplying the companion's current (already-scaled) stats — since
// companions persist across battles unlike freshly-created enemies, a
// scaleEnemyForLevel-style in-place multiply would compound every battle.
// Equipment bonuses are folded in the same way buildPlayerCharacter() does
// it for the player, so gear on a companion behaves identically.
function scaleCompanionToLevel(companion, level) {
  if (!companion.equipped) companion.equipped = defaultEquippedState();
  const cls = CLASS_DATA.find((c) => c.name === companion.className);
  const sub = cls.subclasses.find((s) => s.name === companion.subclassName);
  const tier = Math.max(0, level - 1);
  const statMult = 1 + tier * 0.10;
  const hpMult = 1 + tier * 0.12;
  const equipBonus = getEquipmentStatBonusesFor(companion.equipped);

  const str = Math.round(sub.str * statMult) + equipBonus.str;
  const wyt = Math.round(sub.wyt * statMult) + equipBonus.wyt;
  const zre = Math.round(sub.zre * statMult) + equipBonus.zre;
  const int = Math.round(sub.int * statMult) + equipBonus.int;
  const cha = Math.round(sub.cha * statMult) + equipBonus.cha;
  const derived = computeDerivedStats({ zre, int, cha, przebicie: sub.przebicie });

  companion.str = str;
  companion.wyt = wyt;
  companion.zre = zre;
  companion.int = int;
  companion.cha = cha;
  companion.pancerz = sub.pancerz + equipBonus.pancerz;
  companion.przebicie = derived.totalPrzebicie + equipBonus.przebicie;
  companion.extraD20Rolls = derived.extraD20Rolls;
  companion.extraActions = derived.extraActions;
  companion.d6Bonus = derived.d6Bonus;
  companion.d20Bonus = derived.d20Bonus;
  companion.charismaExponent = derived.charismaExponent;
  companion.moveRange = derived.moveRange;
  companion.maxHP = Math.round(sub.hp * hpMult);
  companion.currentHP = companion.maxHP;
  companion.weapons = [...sub.weapons, ...getEquippedWeaponItemsFor(companion.equipped)];
}
