const LORE_DATA = {
  world: {
    title: "Raj",
    icon: "🏰",
    paragraphs: [
      "W sercu zdewastowanego kontynentu rozciąga się „Raj” — despotyczne imperium rządzone przez Rokę Arcymagów, radę potężnych czarodziejów, którzy przed wiekami podbili świat za pomocą surowej many. Magia to ich boski dar, a reszta ludzkości to jedynie narzędzia.",
      "Kryształy esencji, pulsujące kamienie wydobywane z głębin ziemi, są sercem gospodarki: walutą, źródłem many i przekleństwem. Niewolnicy kopią je w piekle podziemnych szybów, gdzie promieniowanie esencji mutuje ich ciała — skóra pęka, kości wykrzywiają się, a umysły pogrążają się w szaleństwie. Wielu staje się bestiami, inni zyskują groteskowe „dary”: kły, pazury czy łuski, ale za cenę człowieczeństwa.",
      "Stolica, Aetherion, to forteca z kryształowych wież, gdzie magowie żyją w luksusie, eksperymentując na niewolnikach. Poza murami fauna jest zdegenerowana: zwierzęta przemienione w abominacje, a lasy pełne aberracji many. Powietrze poza miastem trzeszczy od niestabilnej many, powodując halucynacje.",
      "Gildia Poszukiwaczy Przygód powstała jako zawór bezpieczeństwa Rady — miejsce, gdzie odważni, zdesperowani albo po prostu niemający dokąd pójść mogą polować na aberracje many i odzyskiwać zaginione kryształy w zamian za ochłapy esencji i odrobinę wolności, jakiej nie zaznają niewolnicy w kopalniach. Nikt w Gildii nie pyta, skąd przybywasz ani co zostawiłeś za sobą — liczy się tylko, ile potrafisz przetrwać i ile esencji przyniesiesz z powrotem.",
      "Dziś do bram Aetherionu zbliża się kolejny nowy rekrut. Ma za sobą historię, której nikt tu nie zna, i cel, którego nie zdradzi nikomu, dopóki nie będzie gotów. Ta historia właśnie się zaczyna.",
    ],
  },
  castes: {
    title: "Kasty i frakcje",
    icon: "⚖️",
    entries: [
      {
        name: "Magowie",
        icon: "🔮",
        description: "Elita, nieśmiertelni nearly, rządzący dekretami śmierci.",
      },
      {
        name: "Nie-magowie",
        icon: "⛓️",
        description: "Niewolnicy w kopalniach lub „słudzy” na usługach Rady — w trzech frakcjach, które udają wolność, ale są smyczą magów.",
      },
      {
        name: "Gildia Poszukiwaczy Przygód",
        icon: "🗺️",
        description: "Zabijają aberracje many, odzyskują zaginione kryształy. Brutalni łowcy nagród, lojalni za ochłapy esencji.",
      },
      {
        name: "Zakon Światła",
        icon: "✨",
        description: "Pomagają ubogim (głównie niewolnikom), lecząc słabymi czarami światła. Ich „miłosierdzie” to propaganda — leczą, by niewolnicy mogli dalej pracować. Makiaweliczna grupa, skłonna zrobić wszystko, by utrzymać swoją marną przeszłość przy życiu.",
      },
      {
        name: "Gildia Rzemieślników",
        icon: "⚒️",
        description: "Kowale, alchemicy i architekci tworzą broń i artefakty dla magów. Ich warsztaty to fabryki śmierci.",
      },
    ],
  },
  hero: {
    title: "Twoja historia",
    icon: "📖",
    paragraphs: [
      "Jesteś piątym dzieckiem Arcymag Liriel Thalor, jednej z dziewięciu członków Rady w Aetherionie. Jako mag, od urodzenia korzystałeś z przywilejów elity: kryształowych komnat w wieży matki, niewolników do eksperymentów, nieograniczonego dostępu do esencji many. Matka wychowała cię na narzędzie — ale prawo krwi Rady jest bezlitosne: tron dziedziczy pierwszy potomek o czystej esencji, a ty, jako piąty, jesteś jedynie „rezerwą”. Twoje starsze rodzeństwo blokuje ścieżkę. Spiskowałeś latami: trucizny w eliksirach, iluzje w snach, sabotaże rytuałów. Wykorzystywałeś niewolników z kopalni jako testerów, paląc ich żywcem dla „danych”.",
      "Próba zabójstwa drugiego dziedzica, twojego brata Kaelona, nie powiodła się. Zorganizowałeś pułapkę w akademii — portal many z trucizną esencji. Zdradził cię przyjaciel z lat studiów, Dorian Vex, z którym dzieliłeś sekrety. Dorian, ambitny czarodziej, doniósł Radzie za obietnicę stanowiska doradcy. Skazano cię na wieczne wygnanie poza mury Aetherionu — najgorszą karę dla maga: kontakt z zdegenerowanym światem many, gdzie esencja mutuje ciało i duszę.",
      "Poza murami, w lasach przesiąkniętych aberracjami, przetrwałeś piekło. Bezlitosna fauna nauczyła cię brutalnej adaptacji. Twoja magia żywiołów została spaczona, a świat niekontrolowanej many na zawsze odcisnął swoje brzemię na twoim ciele i duszy. Skóra poorana bliznami spaczenia, oczy lśniące fioletem przypominają ci, jaki jest cel: przejąć władzę.",
      "Po 7 latach wracasz do Aetherionu — nie jako wygnaniec, lecz jako „nowy rekrut” Gildii Poszukiwaczy. Ukrywasz tożsamość pod magiczną zasłoną. Gildia, smycz Rady, poluje na bestie many za ochłapy esencji — idealne alibi. Spotykasz tu pozostałe postacie, twoich przyszłych „sojuszników”, pionki w twoim planie.",
      "Jesteś pomocny, ale wyrachowany: leczysz ich słabymi czarami światła (udając „łagodnego apostatę”), dzielisz łupy, ale zawsze bierzesz najcenniejsze kryształy. Cel: zemsta na Dorianie i przejęcie Rady. Lecz czy empatia to dla ciebie jedynie dawno zapomniane słowo? Możesz wybaczyć światu i naprawić swoje grzechy — albo do końca kroczyć, zostawiając po sobie pożogę.",
    ],
  },
  classFlavor: {
    "Arcymag": "Wychowanek Roki, biegły w surowej mana — ogień, który rzuca, płonie równie gorąco jak jego ambicje.",
    "Apostata": "Odstępca od doktryny Rady, czerpiący moc z zakazanych, mrocznych rytuałów esencji.",
    "Świetlisty obrońca": "Tarcza Zakonu Światła — jego „miłosierne” czary leczą tylko tych, którzy jeszcze mogą pracować.",
    "Mroczny rycerz": "Rycerz, którego przysięga dawno pękła — walczy klątwami krwi, nie honorem.",
    "Najemnik bractwa": "Miecz na wynajem dla Gildii Rzemieślników, płatny w ochłapach esencji, nie w zaufaniu.",
    "Berserk": "Ofiara mutacji z kopalń, która zamieniła ból w furię — im głębsze rany, tym cięższy topór.",
    "Łowca": "Tropiciel aberracji many dla Gildii Poszukiwaczy Przygód, celny z dystansu, bezlitosny z bliska.",
    "Skrytobójca": "Cień pustkowi, który nauczył się, że trucizna zabija ciszej niż stal.",
    "Truciciel": "Alchemik, dla którego każda fiolka to pytanie: lek czy trucizna? Odpowiedź zależy od klienta.",
    "Medyk": "Ostatnia deska ratunku na polu bitwy — i dowód, że w Raju nawet litość ma swoją cenę.",
  },
};
