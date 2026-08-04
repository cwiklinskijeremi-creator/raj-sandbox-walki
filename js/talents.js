// Talent trees, one per subclass — inspired directly by the branch/rank
// layout of Dragon Age: Origins/Awakening talent & spell trees
// (https://dragonage.fandom.com/wiki/Talents_(Origins),
// https://dragonage.fandom.com/wiki/Spells_(Origins)): each tree has 3
// branches ("rows"), each branch a chain of 4 ranks. Unlocking rank N in a
// branch requires rank N-1 already unlocked IN THAT SAME BRANCH (rank 1
// only needs a spendable point) — see canUnlockTalent() in main.js.
//
// Every node has a `kind`:
//   "passive"   — flat stat/combat bonus, shape identical to equipment
//                 bonuses (see equipment.js EQUIPMENT_ITEMS), merged in
//                 main.js getTalentStatBonuses().
//   "active"    — a real combat ability with its own cooldown, resolved by
//                 the exact same engine as the 2 base subclass spells
//                 (classes.js skills[]) — see main.js playerSkills()/
//                 getUnlockedActiveTalents()/castSkill(). Same fields:
//                 minDmg/maxDmg/range/cooldown/effectType/...
//   "sustained" — mechanically identical to "active" (same engine, same
//                 fields), just flavored as a longer-lasting effect with a
//                 longer cooldown — no separate resource/toggle system.
//
// Structure: TALENT_TREES[subclassName] = { icon, name, branches: [
//   { name, nodes: [rank1, rank2, rank3, rank4] }, ... 3 branches ] }

const TALENT_TREES = {
  "Arcymag": {
    icon: "🔮", name: "Ścieżka Arcymaga",
    branches: [
      {
        name: "Ścieżka Ognia",
        nodes: [
          { id: "arcymag_ogien_r1", name: "Płomienny Impuls", icon: "🔥", kind: "active", colorClass: "spell-fire", description: "Szybki pocisk ognia o krótkim odnowieniu.", minDmg: 8, maxDmg: 12, range: 6, cooldown: 2 },
          { id: "arcymag_ogien_r2", name: "Fala Ognia", icon: "🔥", kind: "active", colorClass: "spell-fire", description: "Ogień rozlewa się na sąsiednie cele.", minDmg: 10, maxDmg: 15, range: 5, cooldown: 3, effectType: "aoe_damage", effectValue: 0.5, effectRadius: 1 },
          { id: "arcymag_ogien_r3", name: "Zapłon", icon: "🔥", kind: "passive", description: "Żar twoich zaklęć przepala pancerz wroga.", bonus: { przebicie: 0.08 } },
          { id: "arcymag_ogien_r4", name: "Inferno", icon: "🌋", kind: "active", colorClass: "spell-fire", description: "Wybuch ognia obejmujący szeroki obszar.", minDmg: 16, maxDmg: 22, range: 6, cooldown: 5, effectType: "aoe_damage", effectValue: 0.8, effectRadius: 2 },
        ],
      },
      {
        name: "Opanowanie Arkanum",
        nodes: [
          { id: "arcymag_arkana_r1", name: "Głębsza Studnia Many", icon: "🔮", kind: "passive", description: "Więcej mocy w każdym zaklęciu.", bonus: { int: 2 } },
          { id: "arcymag_arkana_r2", name: "Uparta Wola", icon: "👑", kind: "passive", description: "Twoja obecność onieśmiela nawet demony.", bonus: { int: 2, cha: 1 } },
          { id: "arcymag_arkana_r3", name: "Tarcza Arkanum", icon: "🌀", kind: "sustained", colorClass: "spell-elixir", description: "Podtrzymywana osłona z czystej many, trwa kilka tur.", minDmg: 9, maxDmg: 14, range: 5, cooldown: 6, effectType: "self_buff", stat: "pancerz", effectValue: 0.12, effectTurns: 6, label: "tarcza arkanum" },
          { id: "arcymag_arkana_r4", name: "Arcymistrzostwo Esencji", icon: "✨", kind: "passive", description: "Twoje zrozumienie magii przekracza akademickie normy.", bonus: { int: 4, cha: 2 } },
        ],
      },
      {
        name: "Mistrzostwo Mrozu",
        nodes: [
          { id: "arcymag_mroz_r1", name: "Chłodny Umysł", icon: "❄️", kind: "passive", description: "Zimna krew pozwala szybciej rzucać zaklęcia.", bonus: { zre: 1, int: 1 } },
          { id: "arcymag_mroz_r2", name: "Uścisk Mrozu", icon: "🧊", kind: "active", colorClass: "spell-elixir", description: "Lód spowalnia ruchy przeciwnika.", minDmg: 9, maxDmg: 13, range: 5, cooldown: 3, effectType: "debuff_enemy_stat", stat: "zre", effectValue: 2, effectTurns: 2, label: "spowolniony" },
          { id: "arcymag_mroz_r3", name: "Chłód Absolutny", icon: "❄️", kind: "passive", description: "Mróz kruszy każdą zbroję.", bonus: { przebicie: 0.05, int: 2 } },
          { id: "arcymag_mroz_r4", name: "Zamieć Wieczności", icon: "🌨️", kind: "active", colorClass: "spell-elixir", description: "Potężna zamieć zamraża wroga, który traci następną turę.", minDmg: 14, maxDmg: 20, range: 6, cooldown: 6, effectType: "stun" },
        ],
      },
    ],
  },
  "Apostata": {
    icon: "🖤", name: "Ścieżka Apostaty",
    branches: [
      {
        name: "Ścieżka Entropii",
        nodes: [
          { id: "apostata_entropia_r1", name: "Osłabienie", icon: "🌀", kind: "active", colorClass: "spell-dark", description: "Entropia wysysa siłę z ciała wroga.", minDmg: 8, maxDmg: 12, range: 6, cooldown: 2, effectType: "debuff_enemy_stat", stat: "str", effectValue: 2, effectTurns: 2, label: "osłabiony" },
          { id: "apostata_entropia_r2", name: "Miazma", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Trująca mgła entropii ogarnia okolicznych wrogów.", minDmg: 10, maxDmg: 14, range: 5, cooldown: 3, effectType: "aoe_poison", effectValue: 4, effectTurns: 2, effectRadius: 1 },
          { id: "apostata_entropia_r3", name: "Skażenie", icon: "🖤", kind: "passive", description: "Twoja magia przesiąka złowrogą mocą.", bonus: { int: 2, przebicie: 0.05 } },
          { id: "apostata_entropia_r4", name: "Masowe Osłabienie", icon: "🌀", kind: "active", colorClass: "spell-dark", description: "Fala entropii łamie ciało i wolę przeciwnika.", minDmg: 13, maxDmg: 18, range: 6, cooldown: 5, effectType: "debuff_enemy_stat", stat: "str", effectValue: 4, effectTurns: 3, label: "sparaliżowany osłabieniem" },
        ],
      },
      {
        name: "Nekromancja",
        nodes: [
          { id: "apostata_nekromancja_r1", name: "Dotyk Śmierci", icon: "💀", kind: "active", colorClass: "spell-dark", description: "Wysysasz odrobinę życia z każdego trafienia.", minDmg: 9, maxDmg: 13, range: 5, cooldown: 2, effectType: "lifesteal", effectValue: 0.3 },
          { id: "apostata_nekromancja_r2", name: "Chodząca Bomba", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Naznaczasz wroga klątwą, która eksploduje zgnilizną.", minDmg: 11, maxDmg: 16, range: 5, cooldown: 4, effectType: "poison_dot", effectValue: 8, effectTurns: 3 },
          { id: "apostata_nekromancja_r3", name: "Pakt z Otchłanią", icon: "🖤", kind: "passive", description: "Otchłań szepcze ci sekrety mocy.", bonus: { int: 2, cha: 1 } },
          { id: "apostata_nekromancja_r4", name: "Aura Rozkładu", icon: "💀", kind: "sustained", colorClass: "spell-dark", description: "Podtrzymywana klątwa zwiększa wysysanie życia na czas starcia.", minDmg: 12, maxDmg: 17, range: 5, cooldown: 6, effectType: "lifesteal", effectValue: 0.55 },
        ],
      },
      {
        name: "Zew Otchłani",
        nodes: [
          { id: "apostata_otchlan_r1", name: "Mroczna Wytrzymałość", icon: "🖤", kind: "passive", description: "Ciemność hartuje ciało.", bonus: { wyt: 2 } },
          { id: "apostata_otchlan_r2", name: "Krzyk Rozpaczy", icon: "😱", kind: "active", colorClass: "spell-dark", description: "Przeraźliwy krzyk paraliżuje wroga ze strachu.", minDmg: 10, maxDmg: 14, range: 5, cooldown: 3, effectType: "stun" },
          { id: "apostata_otchlan_r3", name: "Głód Duszy", icon: "🖤", kind: "passive", description: "Im więcej dusz pochłoniesz, tym silniejszy się stajesz.", bonus: { int: 3, przebicie: 0.05 } },
          { id: "apostata_otchlan_r4", name: "Zew Otchłani", icon: "👁️", kind: "active", colorClass: "spell-dark", description: "Rozdzierasz zasłonę między światami, wysysając ogromne ilości życia.", minDmg: 16, maxDmg: 23, range: 6, cooldown: 6, effectType: "lifesteal", effectValue: 0.7 },
        ],
      },
    ],
  },
  "Świetlisty obrońca": {
    icon: "😇", name: "Ścieżka Świetlistego Obrońcy",
    branches: [
      {
        name: "Sztuka Uzdrawiania",
        nodes: [
          { id: "swietlisty_uzdrawianie_r1", name: "Dotyk Uzdrowienia", icon: "✨", kind: "active", colorClass: "spell-holy", description: "Światło spływa przez twoje ciało.", minDmg: 8, maxDmg: 12, range: 5, cooldown: 2, effectType: "heal_self", effectValue: 0.12 },
          { id: "swietlisty_uzdrawianie_r2", name: "Odnowienie", icon: "🌟", kind: "active", colorClass: "spell-holy", description: "Głębsze skupienie przywraca więcej zdrowia.", minDmg: 9, maxDmg: 13, range: 5, cooldown: 3, effectType: "heal_self", effectValue: 0.2 },
          { id: "swietlisty_uzdrawianie_r3", name: "Błogosławieństwo", icon: "😇", kind: "passive", description: "Światło wzmacnia twoje ciało i ducha.", bonus: { wyt: 2, cha: 1 } },
          { id: "swietlisty_uzdrawianie_r4", name: "Więź Życia", icon: "💞", kind: "active", colorClass: "spell-holy", description: "Rozlewasz uzdrawiające światło na całą drużynę.", minDmg: 10, maxDmg: 14, range: 5, cooldown: 5, effectType: "party_heal", effectValue: 0.2 },
        ],
      },
      {
        name: "Osąd Światła",
        nodes: [
          { id: "swietlisty_osad_r1", name: "Uderzenie Osądu", icon: "⚔️", kind: "active", colorClass: "spell-holy", description: "Uderzasz z pewnością słusznego gniewu.", minDmg: 11, maxDmg: 15, range: 1, cooldown: 2, effectType: "guaranteed_crit" },
          { id: "swietlisty_osad_r2", name: "Karząca Dłoń", icon: "✋", kind: "active", colorClass: "spell-holy", description: "Miażdżysz zbroję przeciwnika świętą mocą.", minDmg: 12, maxDmg: 16, range: 1, cooldown: 3, effectType: "armor_shred", effectValue: 0.15, effectTurns: 2 },
          { id: "swietlisty_osad_r3", name: "Gniew Sprawiedliwych", icon: "😇", kind: "passive", description: "Twój gniew przebija się przez każdą obronę.", bonus: { str: 2, przebicie: 0.05 } },
          { id: "swietlisty_osad_r4", name: "Piorun Osądu", icon: "⚡", kind: "active", colorClass: "spell-holy", description: "Uderzenie z niebios ogłusza przeciwnika.", minDmg: 15, maxDmg: 20, range: 3, cooldown: 5, effectType: "stun" },
        ],
      },
      {
        name: "Tarcza Wiary",
        nodes: [
          { id: "swietlisty_tarcza_r1", name: "Niezłomność", icon: "🛡️", kind: "passive", description: "Twoja wiara jest twoją zbroją.", bonus: { pancerz: 0.04 } },
          { id: "swietlisty_tarcza_r2", name: "Aura Ochrony", icon: "🛡️", kind: "sustained", colorClass: "spell-holy", description: "Podtrzymywana aura wzmacnia twój pancerz na czas starcia.", minDmg: 9, maxDmg: 13, range: 1, cooldown: 6, effectType: "self_buff", stat: "pancerz", effectValue: 0.15, effectTurns: 6, label: "aura ochrony" },
          { id: "swietlisty_tarcza_r3", name: "Kamienna Skóra", icon: "🛡️", kind: "passive", description: "Twoje ciało twardnieje jak kamień.", bonus: { pancerz: 0.05, wyt: 2 } },
          { id: "swietlisty_tarcza_r4", name: "Tarcza Wiary", icon: "✝️", kind: "sustained", colorClass: "spell-holy", description: "Ostateczna, podtrzymywana bariera światła chroni cię przez większość starcia.", minDmg: 12, maxDmg: 17, range: 1, cooldown: 7, effectType: "self_buff", stat: "pancerz", effectValue: 0.25, effectTurns: 7, label: "tarcza wiary" },
        ],
      },
    ],
  },
  "Mroczny rycerz": {
    icon: "🌑", name: "Ścieżka Mrocznego Rycerza",
    branches: [
      {
        name: "Krew i Ból",
        nodes: [
          { id: "mroczny_krew_r1", name: "Nacięcie", icon: "🩸", kind: "active", colorClass: "spell-dark", description: "Krew wroga karmi twoją moc.", minDmg: 11, maxDmg: 16, range: 1, cooldown: 2, effectType: "lifesteal", effectValue: 0.25 },
          { id: "mroczny_krew_r2", name: "Krwawy Rytuał", icon: "🩸", kind: "active", colorClass: "spell-dark", description: "Poświęcasz część własnej krwi, by wyssać więcej z wroga.", minDmg: 13, maxDmg: 18, range: 1, cooldown: 4, effectType: "lifesteal", effectValue: 0.55 },
          { id: "mroczny_krew_r3", name: "Żyła Mroku", icon: "🌑", kind: "passive", description: "Twoje ciało znosi rany, których inni by nie przeżyli.", bonus: { wyt: 2, str: 1 } },
          { id: "mroczny_krew_r4", name: "Pakt Krwi", icon: "🩸", kind: "sustained", colorClass: "spell-dark", description: "Podtrzymywany pakt czyni z każdego ciosu źródło uzdrowienia.", minDmg: 14, maxDmg: 19, range: 1, cooldown: 6, effectType: "lifesteal", effectValue: 0.7 },
        ],
      },
      {
        name: "Niszczyciel",
        nodes: [
          { id: "mroczny_niszczyciel_r1", name: "Druzgocący Cios", icon: "🔨", kind: "active", colorClass: "spell-physical", description: "Miażdżysz zbroję przeciwnika.", minDmg: 12, maxDmg: 17, range: 1, cooldown: 2, effectType: "armor_shred", effectValue: 0.12, effectTurns: 2 },
          { id: "mroczny_niszczyciel_r2", name: "Rozłupanie Pancerza", icon: "🔨", kind: "active", colorClass: "spell-physical", description: "Głębsze pęknięcia w zbroi wroga.", minDmg: 14, maxDmg: 19, range: 1, cooldown: 4, effectType: "armor_shred", effectValue: 0.22, effectTurns: 3 },
          { id: "mroczny_niszczyciel_r3", name: "Bezwzględność", icon: "🌑", kind: "passive", description: "Twoje ciosy nie znają litości.", bonus: { str: 2, przebicie: 0.05 } },
          { id: "mroczny_niszczyciel_r4", name: "Wyrok", icon: "⚔️", kind: "active", colorClass: "spell-physical", description: "Miażdżący cios ogłusza przeciwnika.", minDmg: 17, maxDmg: 23, range: 1, cooldown: 5, effectType: "stun" },
        ],
      },
      {
        name: "Mroczny Pakt",
        nodes: [
          { id: "mroczny_pakt_r1", name: "Znak Zdrady", icon: "🌑", kind: "passive", description: "Twoja zdrada wyryła się w twojej duszy, dając ci mroczną charyzmę.", bonus: { str: 1, cha: 1 } },
          { id: "mroczny_pakt_r2", name: "Uderzenie Rozpaczy", icon: "💢", kind: "active", colorClass: "spell-dark", description: "Łamiesz wolę walki przeciwnika.", minDmg: 13, maxDmg: 18, range: 1, cooldown: 3, effectType: "debuff_enemy_stat", stat: "str", effectValue: 3, effectTurns: 2, label: "złamany" },
          { id: "mroczny_pakt_r3", name: "Nienawiść", icon: "🌑", kind: "passive", description: "Twoja nienawiść do zdrajców wzmacnia każdy cios.", bonus: { str: 3, przebicie: 0.05 } },
          { id: "mroczny_pakt_r4", name: "Mroczny Pakt", icon: "👹", kind: "active", colorClass: "spell-dark", description: "Przyzywasz mroczną moc paktu, zadając druzgocący, wysysający życie cios.", minDmg: 18, maxDmg: 25, range: 1, cooldown: 6, effectType: "lifesteal", effectValue: 0.6 },
        ],
      },
    ],
  },
  "Najemnik bractwa": {
    icon: "🪓", name: "Ścieżka Najemnika Bractwa",
    branches: [
      {
        name: "Tarcza i Miecz",
        nodes: [
          { id: "najemnik_tarcza_r1", name: "Uderzenie Tarczą", icon: "🛡️", kind: "active", colorClass: "spell-physical", description: "Odpychasz wroga uderzeniem tarczy, osłabiając jego obronę.", minDmg: 10, maxDmg: 14, range: 1, cooldown: 2, effectType: "armor_shred", effectValue: 0.1, effectTurns: 2 },
          { id: "najemnik_tarcza_r2", name: "Napór", icon: "🛡️", kind: "active", colorClass: "spell-physical", description: "Wbijasz się tarczą w przeciwnika, zbijając go z nóg.", minDmg: 12, maxDmg: 16, range: 1, cooldown: 3, effectType: "stun" },
          { id: "najemnik_tarcza_r3", name: "Mistrzostwo Tarczy", icon: "🛡️", kind: "passive", description: "Lata treningu czynią z tarczy drugą naturę.", bonus: { pancerz: 0.05 } },
          { id: "najemnik_tarcza_r4", name: "Szturm", icon: "⚔️", kind: "active", colorClass: "spell-physical", description: "Druzgocący szturm ignorujący pancerz wroga.", minDmg: 15, maxDmg: 20, range: 1, cooldown: 4, effectType: "ignore_armor" },
        ],
      },
      {
        name: "Okrzyk Dowódcy",
        nodes: [
          { id: "najemnik_okrzyk_r1", name: "Duch Bractwa", icon: "📯", kind: "passive", description: "Twoja obecność podnosi morale.", bonus: { str: 1, cha: 1 } },
          { id: "najemnik_okrzyk_r2", name: "Zew Bitwy", icon: "📯", kind: "active", colorClass: "spell-physical", description: "Twój okrzyk wzmacnia twoje uderzenia.", minDmg: 11, maxDmg: 15, range: 4, cooldown: 3, effectType: "self_buff", stat: "str", effectValue: 4, effectTurns: 3, label: "zew bitwy" },
          { id: "najemnik_okrzyk_r3", name: "Autorytet", icon: "📯", kind: "passive", description: "Wrogowie czują twoją siłę, zanim jeszcze uderzysz.", bonus: { cha: 2, str: 1 } },
          { id: "najemnik_okrzyk_r4", name: "Chwała Bractwa", icon: "🏆", kind: "sustained", colorClass: "spell-physical", description: "Podtrzymywany okrzyk utrzymuje twoją siłę na wysokim poziomie przez całe starcie.", minDmg: 13, maxDmg: 18, range: 4, cooldown: 6, effectType: "self_buff", stat: "str", effectValue: 7, effectTurns: 6, label: "chwała bractwa" },
        ],
      },
      {
        name: "Nieugięty",
        nodes: [
          { id: "najemnik_nieugiety_r1", name: "Twarda Skóra", icon: "🛡️", kind: "passive", description: "Blizny po dawnych bitwach czynią cię twardszym.", bonus: { pancerz: 0.04, wyt: 1 } },
          { id: "najemnik_nieugiety_r2", name: "Kontratak", icon: "⚔️", kind: "active", colorClass: "spell-physical", description: "Wykorzystujesz otwarcie przeciwnika bezbłędnym ciosem.", minDmg: 13, maxDmg: 18, range: 1, cooldown: 3, effectType: "guaranteed_crit" },
          { id: "najemnik_nieugiety_r3", name: "Weteran Bractwa", icon: "🪓", kind: "passive", description: "Doświadczenie dziesiątek starć hartuje ciało i wolę.", bonus: { str: 2, wyt: 2 } },
          { id: "najemnik_nieugiety_r4", name: "Ostatnia Twierdza", icon: "🏰", kind: "sustained", colorClass: "spell-physical", description: "Stajesz się niewzruszoną twierdzą na resztę starcia.", minDmg: 16, maxDmg: 21, range: 1, cooldown: 7, effectType: "self_buff", stat: "pancerz", effectValue: 0.2, effectTurns: 7, label: "ostatnia twierdza" },
        ],
      },
    ],
  },
  "Berserk": {
    icon: "😡", name: "Ścieżka Berserka",
    branches: [
      {
        name: "Furia Berserka",
        nodes: [
          { id: "berserk_furia_r1", name: "Nawał Ciosów", icon: "🪓", kind: "active", colorClass: "spell-physical", description: "Pierwsza fala szału zwiększa twoją siłę.", minDmg: 15, maxDmg: 21, range: 1, cooldown: 2, effectType: "self_buff", stat: "str", effectValue: 3, effectTurns: 2, label: "nawał ciosów" },
          { id: "berserk_furia_r2", name: "Krwawa Furia", icon: "😡", kind: "active", colorClass: "spell-physical", description: "Głębszy szał czyni cię jeszcze silniejszym.", minDmg: 16, maxDmg: 22, range: 1, cooldown: 3, effectType: "self_buff", stat: "str", effectValue: 6, effectTurns: 3, label: "krwawa furia" },
          { id: "berserk_furia_r3", name: "Odporność na Ból", icon: "😡", kind: "passive", description: "Ból tylko cię napędza.", bonus: { wyt: 2 } },
          { id: "berserk_furia_r4", name: "Niepohamowany Szał", icon: "🔥", kind: "sustained", colorClass: "spell-physical", description: "Podtrzymywany szał utrzymuje ogromną siłę przez całe starcie.", minDmg: 18, maxDmg: 24, range: 1, cooldown: 6, effectType: "self_buff", stat: "str", effectValue: 10, effectTurns: 6, label: "niepohamowany szał" },
        ],
      },
      {
        name: "Niszczycielskie Cięcia",
        nodes: [
          { id: "berserk_ciecia_r1", name: "Szerokie Cięcie", icon: "🪓", kind: "active", colorClass: "spell-physical", description: "Zamaszyste cięcie trafia też sąsiednie cele.", minDmg: 14, maxDmg: 19, range: 1, cooldown: 3, effectType: "aoe_damage", effectValue: 0.5, effectRadius: 1 },
          { id: "berserk_ciecia_r2", name: "Wirujący Topór", icon: "🪓", kind: "active", colorClass: "spell-physical", description: "Obracasz się, siekąc wszystko dookoła.", minDmg: 16, maxDmg: 21, range: 1, cooldown: 4, effectType: "aoe_damage", effectValue: 0.7, effectRadius: 1 },
          { id: "berserk_ciecia_r3", name: "Miażdżąca Siła", icon: "😡", kind: "passive", description: "Twoje ciosy miażdżą kości i zbroje jednakowo.", bonus: { str: 2, przebicie: 0.05 } },
          { id: "berserk_ciecia_r4", name: "Trzęsienie Ziemi", icon: "💥", kind: "active", colorClass: "spell-physical", description: "Uderzenie ziemi wstrząsa całym polem walki.", minDmg: 19, maxDmg: 25, range: 1, cooldown: 5, effectType: "aoe_damage", effectValue: 0.9, effectRadius: 2 },
        ],
      },
      {
        name: "Ostateczny Cios",
        nodes: [
          { id: "berserk_ostateczny_r1", name: "Bezgraniczna Wytrzymałość", icon: "😡", kind: "passive", description: "Twoje ciało znosi więcej, niż powinno być możliwe.", bonus: { wyt: 2, str: 1 } },
          { id: "berserk_ostateczny_r2", name: "Ogłuszający Cios", icon: "💢", kind: "active", colorClass: "spell-physical", description: "Miażdżący cios odbiera przeciwnikowi zmysły.", minDmg: 17, maxDmg: 23, range: 1, cooldown: 4, effectType: "stun" },
          { id: "berserk_ostateczny_r3", name: "Żądza Krwi", icon: "😡", kind: "passive", description: "Im dłużej walczysz, tym silniejszy się stajesz.", bonus: { str: 3, przebicie: 0.05 } },
          { id: "berserk_ostateczny_r4", name: "Ostateczny Cios", icon: "⚡", kind: "active", colorClass: "spell-physical", description: "Cios skupiający całą twoją furię, przebijający każdą obronę.", minDmg: 22, maxDmg: 30, range: 1, cooldown: 6, effectType: "ignore_armor" },
        ],
      },
    ],
  },
  "Łowca": {
    icon: "🏹", name: "Ścieżka Łowcy",
    branches: [
      {
        name: "Precyzja Łucznika",
        nodes: [
          { id: "lowca_precyzja_r1", name: "Wycelowany Strzał", icon: "🎯", kind: "active", colorClass: "spell-physical", description: "Chwila skupienia gwarantuje trafienie w słaby punkt.", minDmg: 12, maxDmg: 17, range: 7, cooldown: 2, effectType: "guaranteed_crit" },
          { id: "lowca_precyzja_r2", name: "Sokole Oko", icon: "🦅", kind: "passive", description: "Twój wzrok wyostrza się jak u drapieżnego ptaka.", bonus: { zre: 2 } },
          { id: "lowca_precyzja_r3", name: "Strzała Rozdzierająca", icon: "🏹", kind: "active", colorClass: "spell-physical", description: "Strzała przebija każdą zbroję.", minDmg: 14, maxDmg: 19, range: 7, cooldown: 3, effectType: "ignore_armor" },
          { id: "lowca_precyzja_r4", name: "Śmiertelny Strzał", icon: "☠️", kind: "active", colorClass: "spell-physical", description: "Strzał wymierzony z chirurgiczną precyzją w najsłabszy punkt.", minDmg: 17, maxDmg: 23, range: 7, cooldown: 4, effectType: "guaranteed_crit" },
        ],
      },
      {
        name: "Pułapki i Osłabienia",
        nodes: [
          { id: "lowca_pulapki_r1", name: "Strzała Usidlająca", icon: "🪤", kind: "active", colorClass: "spell-physical", description: "Strzała oplata nogi przeciwnika liną.", minDmg: 10, maxDmg: 15, range: 7, cooldown: 3, effectType: "debuff_enemy_stat", stat: "zre", effectValue: 2, effectTurns: 2, label: "usidlony" },
          { id: "lowca_pulapki_r2", name: "Zatruty Grot", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Grot nasączony trucizną wywołuje powolną agonię.", minDmg: 11, maxDmg: 16, range: 7, cooldown: 3, effectType: "poison_dot", effectValue: 5, effectTurns: 3 },
          { id: "lowca_pulapki_r3", name: "Tropiciel", icon: "🏹", kind: "passive", description: "Znasz słabości każdej zdobyczy.", bonus: { zre: 1, int: 2 } },
          { id: "lowca_pulapki_r4", name: "Pułapka na Niedźwiedzia", icon: "🪤", kind: "active", colorClass: "spell-physical", description: "Ukryta pułapka miażdży kończynę przeciwnika.", minDmg: 13, maxDmg: 18, range: 6, cooldown: 4, effectType: "stun" },
        ],
      },
      {
        name: "Strzała Zagłady",
        nodes: [
          { id: "lowca_zaglada_r1", name: "Instynkt Łowcy", icon: "🏹", kind: "passive", description: "Lata polowań wyostrzyły twoje odruchy.", bonus: { zre: 2, str: 1 } },
          { id: "lowca_zaglada_r2", name: "Deszcz Strzał", icon: "🏹", kind: "active", colorClass: "spell-physical", description: "Salwa strzał spada na grupę wrogów.", minDmg: 12, maxDmg: 17, range: 6, cooldown: 3, effectType: "aoe_damage", effectValue: 0.5, effectRadius: 1 },
          { id: "lowca_zaglada_r3", name: "Mistrz Łucznictwa", icon: "🏹", kind: "passive", description: "Żadna zdobycz nie umknie twojej cięciwie.", bonus: { zre: 2, przebicie: 0.05 } },
          { id: "lowca_zaglada_r4", name: "Strzała Zagłady", icon: "💥", kind: "active", colorClass: "spell-physical", description: "Legendarny strzał, przed którym nic się nie ochroni.", minDmg: 20, maxDmg: 27, range: 7, cooldown: 6, effectType: "ignore_armor" },
        ],
      },
    ],
  },
  "Skrytobójca": {
    icon: "🥷", name: "Ścieżka Skrytobójcy",
    branches: [
      {
        name: "Podwójne Ostrza",
        nodes: [
          { id: "skrytobojca_ostrza_r1", name: "Podwójne Cięcie", icon: "🗡️", kind: "active", colorClass: "spell-physical", description: "Dwa szybkie cięcia trafiają cel i najbliższego sąsiada.", minDmg: 10, maxDmg: 15, range: 1, cooldown: 2, effectType: "aoe_damage", effectValue: 0.4, effectRadius: 1 },
          { id: "skrytobojca_ostrza_r2", name: "Wir Ostrzy", icon: "🌀", kind: "active", colorClass: "spell-physical", description: "Seria wirujących cięć sieje spustoszenie.", minDmg: 12, maxDmg: 17, range: 1, cooldown: 3, effectType: "aoe_damage", effectValue: 0.6, effectRadius: 1 },
          { id: "skrytobojca_ostrza_r3", name: "Zwinność Ostrzy", icon: "🥷", kind: "passive", description: "Twoje dłonie poruszają się szybciej niż wzrok wroga.", bonus: { zre: 2 } },
          { id: "skrytobojca_ostrza_r4", name: "Nawałnica Ciosów", icon: "⚡", kind: "active", colorClass: "spell-physical", description: "Seria ciosów skierowana dokładnie w słaby punkt.", minDmg: 15, maxDmg: 20, range: 1, cooldown: 4, effectType: "guaranteed_crit" },
        ],
      },
      {
        name: "Skrytobójstwo",
        nodes: [
          { id: "skrytobojca_skryto_r1", name: "Cios z Cienia", icon: "🌑", kind: "active", colorClass: "spell-physical", description: "Uderzasz zanim przeciwnik zdąży zareagować.", minDmg: 11, maxDmg: 16, range: 1, cooldown: 3, effectType: "guaranteed_crit" },
          { id: "skrytobojca_skryto_r2", name: "Chód Cienia", icon: "🥷", kind: "passive", description: "Poruszasz się bezszelestnie jak cień.", bonus: { zre: 2, str: 1 } },
          { id: "skrytobojca_skryto_r3", name: "Trucizna na Ostrzu", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Twoje ostrza nigdy nie są suche.", minDmg: 12, maxDmg: 17, range: 1, cooldown: 3, effectType: "poison_dot", effectValue: 7, effectTurns: 3 },
          { id: "skrytobojca_skryto_r4", name: "Śmiertelny Odłam", icon: "💀", kind: "active", colorClass: "spell-physical", description: "Uderzenie w splot nerwowy paraliżuje ofiarę.", minDmg: 16, maxDmg: 21, range: 1, cooldown: 4, effectType: "stun" },
        ],
      },
      {
        name: "Znak Śmierci",
        nodes: [
          { id: "skrytobojca_znak_r1", name: "Oko Zabójcy", icon: "🥷", kind: "passive", description: "Widzisz słabości, których inni nie dostrzegają.", bonus: { zre: 2, int: 1 } },
          { id: "skrytobojca_znak_r2", name: "Naznaczenie", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Naznaczasz ofiarę, obnażając jej słabe punkty.", minDmg: 13, maxDmg: 18, range: 1, cooldown: 3, effectType: "armor_shred", effectValue: 0.18, effectTurns: 3 },
          { id: "skrytobojca_znak_r3", name: "Bezlitosność", icon: "🥷", kind: "passive", description: "Nie dajesz przeciwnikom drugiej szansy.", bonus: { zre: 2, przebicie: 0.08 } },
          { id: "skrytobojca_znak_r4", name: "Znak Śmierci", icon: "💀", kind: "active", colorClass: "spell-physical", description: "Naznaczasz ofiarę na śmierć — ostateczne uderzenie zawsze trafia w najsłabszy punkt.", minDmg: 19, maxDmg: 26, range: 1, cooldown: 6, effectType: "guaranteed_crit" },
        ],
      },
    ],
  },
  "Truciciel": {
    icon: "🧪", name: "Ścieżka Truciciela",
    branches: [
      {
        name: "Toksyny",
        nodes: [
          { id: "truciciel_toksyny_r1", name: "Zatruta Fiolka", icon: "🧪", kind: "active", colorClass: "spell-poison", description: "Prosta, ale skuteczna mieszanka trucizny.", minDmg: 9, maxDmg: 14, range: 4, cooldown: 2, effectType: "poison_dot", effectValue: 5, effectTurns: 2 },
          { id: "truciciel_toksyny_r2", name: "Wzmocniona Toksyna", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Silniejsza receptura zadaje więcej obrażeń co turę.", minDmg: 10, maxDmg: 15, range: 4, cooldown: 3, effectType: "poison_dot", effectValue: 8, effectTurns: 3 },
          { id: "truciciel_toksyny_r3", name: "Odporność na Trucizny", icon: "🧪", kind: "passive", description: "Lata eksperymentów uodporniły twoje ciało.", bonus: { wyt: 2, int: 1 } },
          { id: "truciciel_toksyny_r4", name: "Śmiertelna Mieszanka", icon: "☠️", kind: "active", colorClass: "spell-poison", description: "Najsilniejsza trucizna w twoim arsenale.", minDmg: 12, maxDmg: 17, range: 4, cooldown: 4, effectType: "poison_dot", effectValue: 12, effectTurns: 3 },
        ],
      },
      {
        name: "Klątwy Alchemika",
        nodes: [
          { id: "truciciel_klatwy_r1", name: "Osłabiająca Mikstura", icon: "🧫", kind: "active", colorClass: "spell-poison", description: "Chemikalia osłabiają mięśnie wroga.", minDmg: 8, maxDmg: 13, range: 4, cooldown: 3, effectType: "debuff_enemy_stat", stat: "str", effectValue: 2, effectTurns: 2, label: "osłabiony" },
          { id: "truciciel_klatwy_r2", name: "Kwas Trawiący", icon: "🧪", kind: "active", colorClass: "spell-poison", description: "Kwas roztapia zbroję przeciwnika.", minDmg: 10, maxDmg: 15, range: 4, cooldown: 3, effectType: "armor_shred", effectValue: 0.15, effectTurns: 3 },
          { id: "truciciel_klatwy_r3", name: "Mistrz Receptur", icon: "🧪", kind: "passive", description: "Twoje receptury stają się coraz skuteczniejsze.", bonus: { int: 2, przebicie: 0.05 } },
          { id: "truciciel_klatwy_r4", name: "Paraliżująca Fiolka", icon: "💫", kind: "active", colorClass: "spell-poison", description: "Neurotoksyna chwilowo paraliżuje ofiarę.", minDmg: 11, maxDmg: 16, range: 4, cooldown: 4, effectType: "stun" },
        ],
      },
      {
        name: "Zaraza",
        nodes: [
          { id: "truciciel_zaraza_r1", name: "Odporność Alchemiczna", icon: "🧪", kind: "passive", description: "Twoje ciało toleruje najsilniejsze toksyny.", bonus: { wyt: 1, int: 2 } },
          { id: "truciciel_zaraza_r2", name: "Chmura Zarazy", icon: "☣️", kind: "active", colorClass: "spell-poison", description: "Trująca chmura ogarnia grupę wrogów.", minDmg: 11, maxDmg: 16, range: 5, cooldown: 4, effectType: "aoe_poison", effectValue: 7, effectTurns: 3, effectRadius: 1 },
          { id: "truciciel_zaraza_r3", name: "Toksyczna Aura", icon: "🧪", kind: "passive", description: "Sama twoja obecność jest trująca.", bonus: { int: 3, przebicie: 0.05 } },
          { id: "truciciel_zaraza_r4", name: "Epidemia", icon: "☣️", kind: "active", colorClass: "spell-poison", description: "Uwalniasz zarazę, która dziesiątkuje całą grupę przeciwników.", minDmg: 14, maxDmg: 19, range: 5, cooldown: 6, effectType: "aoe_poison", effectValue: 12, effectTurns: 4, effectRadius: 2 },
        ],
      },
    ],
  },
  "Medyk": {
    icon: "💊", name: "Ścieżka Medyka",
    branches: [
      {
        name: "Sztuka Uzdrawiania",
        nodes: [
          { id: "medyk_uzdrawianie_r1", name: "Balsam Leczniczy", icon: "💊", kind: "active", colorClass: "spell-elixir", description: "Prosta mikstura przyspiesza gojenie ran.", minDmg: 7, maxDmg: 11, range: 3, cooldown: 2, effectType: "heal_self", effectValue: 0.12 },
          { id: "medyk_uzdrawianie_r2", name: "Eliksir Regeneracji", icon: "💉", kind: "active", colorClass: "spell-elixir", description: "Silniejsza mikstura odbudowuje uszkodzone tkanki.", minDmg: 8, maxDmg: 12, range: 3, cooldown: 3, effectType: "heal_self", effectValue: 0.22 },
          { id: "medyk_uzdrawianie_r3", name: "Wiedza Medyczna", icon: "💊", kind: "passive", description: "Znasz ciało lepiej niż niejeden chirurg.", bonus: { int: 2, wyt: 1 } },
          { id: "medyk_uzdrawianie_r4", name: "Więź Życia", icon: "💞", kind: "active", colorClass: "spell-elixir", description: "Dzielisz swoją miksturę z całą drużyną.", minDmg: 9, maxDmg: 13, range: 3, cooldown: 5, effectType: "party_heal", effectValue: 0.22 },
        ],
      },
      {
        name: "Eliksiry Ochronne",
        nodes: [
          { id: "medyk_eliksiry_r1", name: "Eliksir Wytrzymałości", icon: "🧫", kind: "active", colorClass: "spell-elixir", description: "Chwilowo wzmacnia twoją odporność na obrażenia.", minDmg: 7, maxDmg: 11, range: 3, cooldown: 3, effectType: "self_buff", stat: "wyt", effectValue: 4, effectTurns: 3, label: "eliksir wytrzymałości" },
          { id: "medyk_eliksiry_r2", name: "Stabilne Receptury", icon: "💊", kind: "passive", description: "Twoje mikstury działają dłużej i pewniej.", bonus: { wyt: 2 } },
          { id: "medyk_eliksiry_r3", name: "Pancerna Mikstura", icon: "🛡️", kind: "sustained", colorClass: "spell-elixir", description: "Podtrzymywana formuła wzmacnia twoją skórę na czas starcia.", minDmg: 8, maxDmg: 12, range: 3, cooldown: 6, effectType: "self_buff", stat: "pancerz", effectValue: 0.12, effectTurns: 6, label: "pancerna mikstura" },
          { id: "medyk_eliksiry_r4", name: "Alchemiczna Doskonałość", icon: "💊", kind: "passive", description: "Twoje eliksiry osiągnęły niemal doskonałą formułę.", bonus: { wyt: 2, int: 2 } },
        ],
      },
      {
        name: "Dar Życia",
        nodes: [
          { id: "medyk_dar_r1", name: "Empatia", icon: "💊", kind: "passive", description: "Rozumiesz ból innych, jakby był twoim własnym.", bonus: { cha: 2, int: 1 } },
          { id: "medyk_dar_r2", name: "Oczyszczająca Mikstura", icon: "✨", kind: "active", colorClass: "spell-elixir", description: "Neutralizuje trucizny i osłabienia działające na ciebie.", minDmg: 7, maxDmg: 11, range: 1, cooldown: 4, effectType: "cleanse_self" },
          { id: "medyk_dar_r3", name: "Mistrzostwo Alchemii", icon: "💊", kind: "passive", description: "Twoje receptury osiągnęły szczyt ludzkiej wiedzy.", bonus: { int: 3, wyt: 1 } },
          { id: "medyk_dar_r4", name: "Cud Alchemii", icon: "🌟", kind: "active", colorClass: "spell-elixir", description: "Ostateczna formuła przywraca drużynę niemal do pełni sił.", minDmg: 10, maxDmg: 14, range: 3, cooldown: 6, effectType: "party_heal", effectValue: 0.35 },
        ],
      },
    ],
  },
};

function findTalentNode(nodeId) {
  for (const tree of Object.values(TALENT_TREES)) {
    for (const branch of tree.branches) {
      const node = branch.nodes.find((n) => n.id === nodeId);
      if (node) return node;
    }
  }
  return null;
}

function findTalentNodePosition(nodeId) {
  for (const tree of Object.values(TALENT_TREES)) {
    for (let branchIndex = 0; branchIndex < tree.branches.length; branchIndex++) {
      const tierIndex = tree.branches[branchIndex].nodes.findIndex((n) => n.id === nodeId);
      if (tierIndex !== -1) return { branchIndex, tierIndex };
    }
  }
  return null;
}
