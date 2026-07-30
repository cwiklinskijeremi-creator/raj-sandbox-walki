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

function generateCompanion(excludeClassName) {
  const availableClasses = CLASS_DATA.filter((c) => c.name !== excludeClassName);
  const cls = availableClasses[Math.floor(Math.random() * availableClasses.length)];
  const sub = cls.subclasses[Math.floor(Math.random() * cls.subclasses.length)];
  const name = COMPANION_NAMES[Math.floor(Math.random() * COMPANION_NAMES.length)];

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
  return companion;
}

// Recomputes every stat fresh from the subclass's fixed base numbers rather
// than multiplying the companion's current (already-scaled) stats — since
// companions persist across battles unlike freshly-created enemies, a
// scaleEnemyForLevel-style in-place multiply would compound every battle.
function scaleCompanionToLevel(companion, level) {
  const cls = CLASS_DATA.find((c) => c.name === companion.className);
  const sub = cls.subclasses.find((s) => s.name === companion.subclassName);
  const tier = Math.max(0, level - 1);
  const statMult = 1 + tier * 0.10;
  const hpMult = 1 + tier * 0.12;

  const str = Math.round(sub.str * statMult);
  const wyt = Math.round(sub.wyt * statMult);
  const zre = Math.round(sub.zre * statMult);
  const int = Math.round(sub.int * statMult);
  const cha = Math.round(sub.cha * statMult);
  const derived = computeDerivedStats({ zre, int, cha, przebicie: sub.przebicie });

  companion.str = str;
  companion.wyt = wyt;
  companion.zre = zre;
  companion.int = int;
  companion.cha = cha;
  companion.pancerz = sub.pancerz;
  companion.przebicie = derived.totalPrzebicie;
  companion.extraD20Rolls = derived.extraD20Rolls;
  companion.extraActions = derived.extraActions;
  companion.d6Bonus = derived.d6Bonus;
  companion.d20Bonus = derived.d20Bonus;
  companion.charismaExponent = derived.charismaExponent;
  companion.moveRange = derived.moveRange;
  companion.maxHP = Math.round(sub.hp * hpMult);
  companion.currentHP = companion.maxHP;
}
