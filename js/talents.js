// Passive talent trees, one per subclass — inspired by the Dragon Age:
// Origins/Awakening talent trees (tiered nodes, must invest in earlier tiers
// before the capstone unlocks). Every node is a flat stat/combat bonus using
// the exact same {str,wyt,zre,int,cha,pancerz,przebicie} shape as equipment
// bonuses (see equipment.js), so no new combat.js resolution logic is
// needed — main.js just merges unlocked nodes into buildPlayerCharacter()
// the same way it already merges equipped-item bonuses.
//
// Structure: TALENT_TREES[subclassName] = { icon, name, tiers: [tier0, tier1, tier2] }
// tier0/tier1 have 2 nodes each (no prereq beyond having a point to spend on
// tier0; tier1 nodes require at least one tier0 node already unlocked).
// tier2 is a single capstone node requiring every tier0 and tier1 node
// unlocked first.
const TALENT_TREES = {
  "Arcymag": {
    icon: "🔮",
    name: "Ścieżka Arcymaga",
    tiers: [
      [
        { id: "arcymag_t1_studnia", name: "Głębsza Studnia Many", icon: "🔮", description: "Więcej surowej mocy do rzucania zaklęć.", bonus: { int: 2 } },
        { id: "arcymag_t1_wola", name: "Uparta Wola", icon: "👑", description: "Silniejsza obecność wzmacnia siłę charyzmy.", bonus: { cha: 2 } },
      ],
      [
        { id: "arcymag_t2_skupienie", name: "Skupienie Arkanum", icon: "📖", description: "Wyostrzony umysł i większa wytrzymałość na kontrataki.", bonus: { int: 3, wyt: 1 } },
        { id: "arcymag_t2_plaszcz", name: "Płaszcz Mocy", icon: "🌀", description: "Otaczająca aura many częściowo chroni przed ciosami.", bonus: { pancerz: 0.05, cha: 1 } },
      ],
      [
        { id: "arcymag_t3_arcymistrzostwo", name: "Arcymistrzostwo Esencji", icon: "✨", description: "Pełne opanowanie esencji — szczyt mocy Arcymaga.", bonus: { int: 5, cha: 3 } },
      ],
    ],
  },
  "Apostata": {
    icon: "🖤",
    name: "Ścieżka Apostaty",
    tiers: [
      [
        { id: "apostata_t1_wiedza", name: "Zakazana Wiedza", icon: "📕", description: "Zgłębianie zakazanych ksiąg wzmacnia umysł.", bonus: { int: 2 } },
        { id: "apostata_t1_pakt", name: "Mroczny Pakt", icon: "🩸", description: "Pakt z mrokiem osłabia obronę wrogów, których dotkniesz.", bonus: { przebicie: 0.03 } },
      ],
      [
        { id: "apostata_t2_glod", name: "Głód Duszy", icon: "👁️", description: "Nienasycone pragnienie mocy i przebicia obrony.", bonus: { int: 3, przebicie: 0.03 } },
        { id: "apostata_t2_cien", name: "Cień Umysłu", icon: "🌀", description: "Zwinność cienia i przytłaczająca obecność.", bonus: { cha: 2, zre: 2 } },
      ],
      [
        { id: "apostata_t3_panowanie", name: "Panowanie nad Otchłanią", icon: "🖤", description: "Otchłań odpowiada na każde twoje wezwanie.", bonus: { int: 5, przebicie: 0.06 } },
      ],
    ],
  },
  "Świetlisty obrońca": {
    icon: "😇",
    name: "Ścieżka Świetlistego Obrońcy",
    tiers: [
      [
        { id: "obronca_t1_wiara", name: "Żelazna Wiara", icon: "🛡️", description: "Niezachwiana wiara hartuje ciało.", bonus: { wyt: 2 } },
        { id: "obronca_t1_tarcza", name: "Błogosławiona Tarcza", icon: "✨", description: "Poświęcona tarcza odbija część ciosów.", bonus: { pancerz: 0.03 } },
      ],
      [
        { id: "obronca_t2_niezlomnosc", name: "Niezłomność", icon: "⚔️", description: "Nic nie jest w stanie cię powalić.", bonus: { wyt: 3, str: 1 } },
        { id: "obronca_t2_aura", name: "Aura Ochrony", icon: "🌟", description: "Emanujące światło wzmacnia twoją obronę.", bonus: { pancerz: 0.05 } },
      ],
      [
        { id: "obronca_t3_bastion", name: "Bastion Światła", icon: "😇", description: "Stajesz się żywym murem obronnym Zakonu.", bonus: { wyt: 5, pancerz: 0.08 } },
      ],
    ],
  },
  "Mroczny rycerz": {
    icon: "🌑",
    name: "Ścieżka Mrocznego Rycerza",
    tiers: [
      [
        { id: "mroczny_t1_krew", name: "Czarna Krew", icon: "🩸", description: "Skażona krew wzmacnia mięśnie.", bonus: { str: 2 } },
        { id: "mroczny_t1_zbroja", name: "Zbroja Cierni", icon: "🥀", description: "Kolczaste narośla twardnieją w pancerz.", bonus: { pancerz: 0.03 } },
      ],
      [
        { id: "mroczny_t2_nienawisc", name: "Nienawiść", icon: "😡", description: "Wściekłość napędza każdy cios.", bonus: { str: 3, wyt: 1 } },
        { id: "mroczny_t2_wytrzymalosc", name: "Mroczna Wytrzymałość", icon: "🌑", description: "Mrok hartuje ciało i przebija obronę wroga.", bonus: { wyt: 2, przebicie: 0.02 } },
      ],
      [
        { id: "mroczny_t3_grozy", name: "Uosobienie Grozy", icon: "💀", description: "Sama twoja obecność budzi trwogę na polu bitwy.", bonus: { str: 5, przebicie: 0.06 } },
      ],
    ],
  },
  "Najemnik bractwa": {
    icon: "🪓",
    name: "Ścieżka Najemnika",
    tiers: [
      [
        { id: "najemnik_t1_reka", name: "Twarda Ręka", icon: "✊", description: "Lata w bractwie zahartowały twoje ciosy.", bonus: { str: 2 } },
        { id: "najemnik_t1_bitwa", name: "Zaprawiony w Boju", icon: "🛡️", description: "Doświadczenie w boju uczy przetrwania.", bonus: { wyt: 2 } },
      ],
      [
        { id: "najemnik_t2_bezlitosny", name: "Bezlitosny Cios", icon: "🗡️", description: "Uderzasz tam, gdzie boli najbardziej.", bonus: { str: 3, przebicie: 0.02 } },
        { id: "najemnik_t2_weteran", name: "Weteran Bractwa", icon: "🎖️", description: "Blizny po dawnych starciach chronią jak zbroja.", bonus: { wyt: 3, pancerz: 0.03 } },
      ],
      [
        { id: "najemnik_t3_mistrz", name: "Mistrz Najemników", icon: "🪓", description: "Twoje imię budzi respekt w każdej gildii.", bonus: { str: 5, wyt: 3 } },
      ],
    ],
  },
  "Berserk": {
    icon: "😡",
    name: "Ścieżka Berserka",
    tiers: [
      [
        { id: "berserk_t1_krew", name: "Wrząca Krew", icon: "🔥", description: "Krew wrze w żyłach przed każdą walką.", bonus: { str: 2 } },
        { id: "berserk_t1_bol", name: "Pogarda dla Bólu", icon: "💢", description: "Ból to tylko kolejny bodziec do walki.", bonus: { wyt: 2 } },
      ],
      [
        { id: "berserk_t2_szal", name: "Szał Bitewny", icon: "😤", description: "Im dłużej walczysz, tym silniejszy się stajesz.", bonus: { str: 4 } },
        { id: "berserk_t2_nienasycenie", name: "Nienasycenie", icon: "🩸", description: "Głód krwi prowadzi ostrze prosto do celu.", bonus: { przebicie: 0.04 } },
      ],
      [
        { id: "berserk_t3_furia", name: "Ucieleśniona Furia", icon: "😡", description: "Stajesz się żywym uosobieniem furii pola bitwy.", bonus: { str: 6, przebicie: 0.05 } },
      ],
    ],
  },
  "Łowca": {
    icon: "🏹",
    name: "Ścieżka Łowcy",
    tiers: [
      [
        { id: "lowca_t1_oko", name: "Sokole Oko", icon: "🦅", description: "Ostrzejszy wzrok prowadzi każdą strzałę.", bonus: { zre: 2 } },
        { id: "lowca_t1_grunt", name: "Twardy Grunt", icon: "🥾", description: "Lata w terenie hartują ciało.", bonus: { wyt: 2 } },
      ],
      [
        { id: "lowca_t2_precyzja", name: "Precyzja Łowcy", icon: "🎯", description: "Każdy strzał celuje w najsłabszy punkt.", bonus: { zre: 3, przebicie: 0.02 } },
        { id: "lowca_t2_tropiciel", name: "Tropiciel", icon: "🐾", description: "Znajomość zwierzyny przekłada się na taktykę.", bonus: { zre: 2, int: 1 } },
      ],
      [
        { id: "lowca_t3_mistrz", name: "Mistrz Polowania", icon: "🏹", description: "Żadna zdobycz nie umyka twojej strzale.", bonus: { zre: 5, przebicie: 0.05 } },
      ],
    ],
  },
  "Skrytobójca": {
    icon: "🥷",
    name: "Ścieżka Skrytobójcy",
    tiers: [
      [
        { id: "skrytobojca_t1_dlonie", name: "Szybkie Dłonie", icon: "🖐️", description: "Ręce poruszają się szybciej niż wzrok przeciwnika.", bonus: { zre: 2 } },
        { id: "skrytobojca_t1_ostrza", name: "Trujące Ostrza", icon: "☠️", description: "Nasączone ostrza łatwiej znajdują lukę w pancerzu.", bonus: { przebicie: 0.02 } },
      ],
      [
        { id: "skrytobojca_t2_precyzja", name: "Śmiertelna Precyzja", icon: "🗡️", description: "Każdy ruch jest wyliczony co do milimetra.", bonus: { zre: 3 } },
        { id: "skrytobojca_t2_krew", name: "Chłodna Krew", icon: "🧊", description: "Opanowanie w starciu i nienagannie zimna prezencja.", bonus: { wyt: 2, cha: 1 } },
      ],
      [
        { id: "skrytobojca_t3_mistrz", name: "Mistrz Cienia", icon: "🥷", description: "Stajesz się niewidzialnym wyrokiem śmierci.", bonus: { zre: 5, przebicie: 0.06 } },
      ],
    ],
  },
  "Truciciel": {
    icon: "🧪",
    name: "Ścieżka Truciciela",
    tiers: [
      [
        { id: "truciciel_t1_toksyny", name: "Stężone Toksyny", icon: "🧪", description: "Silniejsze mikstury wymagają głębszej wiedzy.", bonus: { int: 2 } },
        { id: "truciciel_t1_odpornosc", name: "Odporność na Jad", icon: "🐍", description: "Lata pracy z truciznami zahartowały ciało.", bonus: { wyt: 2 } },
      ],
      [
        { id: "truciciel_t2_formuly", name: "Zabójcze Formuły", icon: "⚗️", description: "Receptury zoptymalizowane pod maksymalny efekt.", bonus: { int: 3, przebicie: 0.02 } },
        { id: "truciciel_t2_zoladek", name: "Żelazny Żołądek", icon: "🫀", description: "Ciało odporne na własne, niebezpieczne eksperymenty.", bonus: { wyt: 3 } },
      ],
      [
        { id: "truciciel_t3_arcytruciciel", name: "Arcytruciciel", icon: "☠️", description: "Twoje trucizny nie mają już sobie równych.", bonus: { int: 5, przebicie: 0.05 } },
      ],
    ],
  },
  "Medyk": {
    icon: "💊",
    name: "Ścieżka Medyka",
    tiers: [
      [
        { id: "medyk_t1_reka", name: "Wprawna Dłoń", icon: "🩹", description: "Doświadczenie w polowych opatrunkach.", bonus: { int: 2 } },
        { id: "medyk_t1_bandaze", name: "Zapas Bandaży", icon: "🧻", description: "Zawsze masz coś, by opatrzyć ranę — własną też.", bonus: { wyt: 2 } },
      ],
      [
        { id: "medyk_t2_terapia", name: "Skuteczna Terapia", icon: "💉", description: "Twoje kuracje działają szybciej i pewniej.", bonus: { int: 3, cha: 1 } },
        { id: "medyk_t2_precyzja", name: "Chirurgiczna Precyzja", icon: "🔪", description: "Wiedza anatomiczna pomaga trafiać w słabe punkty.", bonus: { przebicie: 0.03 } },
      ],
      [
        { id: "medyk_t3_mistrz", name: "Mistrz Uzdrawiania", icon: "💊", description: "Żaden alchemik w Aetherionie nie dorównuje twojej wiedzy.", bonus: { int: 5, wyt: 3 } },
      ],
    ],
  },
};

function findTalentNode(nodeId) {
  for (const tree of Object.values(TALENT_TREES)) {
    for (const tier of tree.tiers) {
      const node = tier.find((n) => n.id === nodeId);
      if (node) return node;
    }
  }
  return null;
}
