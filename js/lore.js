const LORE_DATA = {
  world: {
    title: "Raj",
    icon: "🏰",
    paragraphs: [
      "W sercu zdewastowanego kontynentu rozciąga się „Raj” — despotyczne imperium rządzone przez Rokę Arcymagów, radę potężnych czarodziejów, którzy przed wiekami podbili świat za pomocą surowej many. Magia to ich boski dar, a reszta ludzkości to jedynie narzędzia.",
      "Podbój nazywa się dziś Wojną Esencji, choć to była bardziej rzeź niż wojna: dawne królestwa i wolne miasta padały jedno po drugim pod naporem magii, jakiej nikt wcześniej nie widział. Zwycięzcy zrównali stolice pokonanych z ziemią i zbudowali na ich gruzach coś nowego — sieć strzeżonych dróg i posterunków łączących Aetherion z odległymi zakątkami kontynentu: dymiącymi Kopalniami Esencji, Skażonym Lasem pełnym aberracji, Szlakiem patrolowanym przez Gildię, skromną Placówką Zakonu Światła i Zatopionymi Kryptami, gdzie Rada chowała zmarłych, zanim jeszcze pękła żyła wodna. Poza tą siecią nie ma już nic, co zasługiwałoby na miano cywilizacji — tylko pustkowia, w których giną ci, którzy się zgubią.",
      "Kryształy esencji, pulsujące kamienie wydobywane z głębin ziemi, są sercem gospodarki: walutą, źródłem many i przekleństwem. Niewolnicy kopią je w piekle podziemnych szybów, gdzie promieniowanie esencji mutuje ich ciała — skóra pęka, kości wykrzywiają się, a umysły pogrążają się w szaleństwie. Wielu staje się bestiami, inni zyskują groteskowe „dary”: kły, pazury czy łuski, ale za cenę człowieczeństwa.",
      "Stolica, Aetherion, to forteca z kryształowych wież, gdzie magowie żyją w luksusie, eksperymentując na niewolnikach. Poza murami fauna jest zdegenerowana: zwierzęta przemienione w abominacje, a lasy pełne aberracji many. Powietrze poza miastem trzeszczy od niestabilnej many, powodując halucynacje.",
      "Zakon Światła nazywa to, co esencja robi z ciałem i umysłem, „skażeniem” — chorobą, którą trzeba oczyścić, najlepiej zanim stanie się widoczna. Ale w zaułkach Aetherionu i głębiej w pustkowiach rośnie w cieniu inna odpowiedź: Kult Spaczenia, garstka wyznawców Matki Esencji, dla których te same blizny i szepty w głowie to nie choroba, lecz przebudzenie — dowód, że esencja w końcu kogoś wybrała. Egzekutorzy Wiary polują na nich od lat i wciąż nie potrafią ich znaleźć, co samo w sobie mówi więcej o tym, jak głęboko spaczenie zapuściło korzenie w Raju, niż potrafiłaby powiedzieć jakakolwiek kazanie z ambony Zakonu.",
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
        paragraphs: [
          "Roka Arcymagów rządzi Rajem od czasów Wojny Esencji — dziewięciu członków Rady, każde z krwi, w której esencja płynie najczyściej. Tron i miejsce w Radzie dziedziczy pierwszy potomek o nieskażonej krwi; reszta rodzeństwa zostaje „rezerwą”, skazaną na cień własnego nazwiska, dopóki nie znajdzie innego sposobu, by się wybić — spiskiem, zdradą albo, jak w niejednym przypadku, wygnaniem, które miało być karą.",
          "Poza murami Wieży niewiele ich obchodzi, co dzieje się z tymi, którzy nie mają ich krwi. Niewolnicy z kopalni, słudzy Zakonu, najemnicy Gildii — to narzędzia, wymienialne i tanie, dopóki przynoszą esencję. Nawet ci z Rady, którzy mówią o „porządku” czy „ochronie”, rzadko widzą różnicę między rządzeniem a hodowlą.",
        ],
      },
      {
        name: "Nie-magowie",
        icon: "⛓️",
        paragraphs: [
          "Pod magami żyje reszta Raju, podzielona na tych, którzy jeszcze udają wolność, i tych, którym nawet na to nie pozwolono. Niewolnicy z Kopalni Esencji nie mają złudzeń — kopią, aż esencja ich zmieni albo zabije, cokolwiek nastąpi pierwsze.",
          "Trzy frakcje — Gildia Poszukiwaczy Przygód, Zakon Światła i Gildia Rzemieślników — noszą się z większą godnością, ale wszystkie trzy odpowiadają w końcu przed tą samą Radą. Różnica między nimi a niewolnikiem z szybu bywa cieńsza, niż którakolwiek z nich chciałaby przyznać.",
        ],
      },
      {
        name: "Gildia Poszukiwaczy Przygód",
        icon: "🗺️",
        paragraphs: [
          "Gildia poluje na aberracje many i odzyskuje zaginione kryształy w zamian za ochłapy esencji — brudna, niebezpieczna robota, którą Rada chętnie zleca komuś innemu. To właśnie w jej szeregach, pod maską „nowego rekruta”, ukrywa się niejeden uciekinier i garstka towarzyszy, których zwerbował po drodze.",
          "Nikt w Gildii nie pyta o przeszłość — liczy się tylko, ile potrafisz przetrwać. To czyni ją jedynym miejscem w Raju, gdzie reputacja buduje się czynami, a nie krwią w żyłach, choć nawet tutaj każdy sukces ostatecznie zasila skarbiec Rady.",
        ],
      },
      {
        name: "Zakon Światła",
        icon: "✨",
        paragraphs: [
          "Zakon leczy ubogich i niewolników słabymi czarami światła, a jego kapłani mówią o miłosierdziu tak często, że niemal brzmi to szczerze. W praktyce ich „łaska” istnieje po to, by robotnik wrócił do kopania choć jeden dzień dłużej.",
          "Egzekutorzy Wiary Zakonu polują na Kult Spaczenia z gorliwością bliską obsesji, przekonani, że tępią herezję, nie konkurencję. A jednak nie każdy w habicie jest taki sam — bywają wśród nich tacy, dla których wiara wciąż znaczy więcej niż polityka Zakonu.",
        ],
      },
      {
        name: "Gildia Rzemieślników",
        icon: "⚒️",
        paragraphs: [
          "Kowale, alchemicy i architekci Gildii Rzemieślników kują broń i pancerze na zamówienie Rady — ich warsztaty to fabryki, które zbroją zarówno strażników kopalni, jak i tych, którzy próbują z nich uciec.",
          "Za odpowiednią cenę, albo odrobinę zaufania, coś z ich warsztatu trafia też w ręce niższych stanem. Im więcej wie się o tym, skąd naprawdę pochodzi ruda w ich piecach, tym trudniej nie zauważyć, że niejeden rzemieślnik zamyka oczy na więcej, niż przyznaje.",
        ],
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
  // Jedno zdanie fabularne per zwykły przeciwnik (bossowie mają już własną
  // charakterystykę przez zdolność specjalną) — pokazywane w Bestiariuszu
  // dopiero po odkryciu, pogrupowane tu według lokacji dla porządku, choć
  // klucz to templateKey z ENEMY_TEMPLATES (characters.js), nie nazwa lokacji.
  enemyFlavor: {
    gornik: "Kiedyś po prostu kopał rudę; teraz kopie, bo ciało zapomniało robić cokolwiek innego.",
    lowca: "Poluje na to, czym mógłby się stać, gdyby Gildia kiedyś przestała mu płacić.",
    aberracja: "Nikt nie pamięta, czym była, zanim mana przepisała ją od nowa.",
    adept: "Wierzy, że każde światło, które rzuca, jest miłosierdziem — nie pytaniem, komu naprawdę służy.",

    kopacz: "Wciela rozkaz nadzorcy głębiej niż własne imię, którego już nie pamięta.",
    pelzacz: "Zrósł się z żyłą esencji tak dawno, że nikt nie wie, gdzie kończy się kamień, a zaczyna stworzenie.",
    nadzorca: "Bicz w jego dłoni kupiła mu Rada — resztę okrucieństwa dorzucił sam, za darmo.",
    pijawka: "Żywi się tym samym blaskiem, który zabił każdego górnika, jakiego dotąd spotkała.",
    kolos: "Skała, mięso i esencja stopiły się w nim tak dawno, że żadne z nich już nie pamięta różnicy.",
    rdzawyautomat: "Zbudowany przez Gildię Rzemieślników, żeby kopał szybciej niż niewolnik i nie potrzebował snu.",
    iskiernikesencji: "Każde wyładowanie to fragment krzyku, który uwiązł w nim, zanim jeszcze przestał być człowiekiem.",
    skalnysluga: "Nie służy Radzie ani Gildii — służy czemuś starszemu, co śpi głębiej niż sięgnął jeszcze żaden szyb.",

    wilk: "Poluje w watahach, które esencja rozerwała na pojedyncze, głodne cienie.",
    konstrukt: "Las oplótł czyjeś kości tak dawno, że trudno powiedzieć, kogo właściwie dusi teraz jego uścisk.",
    szarancza: "Jedna nie znaczy nic. Chmura tysięcy potrafi obedrzeć wzgórze do gołej ziemi w jedno popołudnie.",
    pomiot: "Wylągł się z jaja, które nigdy nie powinno dojrzeć w skażonej ziemi lasu.",
    traper: "Rozstawiał sidła na aberracje tak długo, że sam zaczął polować bardziej jak jedna z nich.",
    pajeczydozorca: "Pilnuje sieci większej, niż jakikolwiek pojedynczy łowca zdołałby utkać sam.",
    spaczonymotyl: "Pyłek z jego skrzydeł usypia ofiarę łagodniej, niż na to zasługuje to, co robi potem.",
    fungalnypomiot: "Rośnie tam, gdzie ktoś inny już przegrał z tym samym lasem.",

    zwiadowca: "Pierwszy dostrzega zdobycz i ostatni dostaje za nią zapłatę.",
    egzekutor: "Rozstrzyga spory Gildii tak, jak Rada rozstrzyga spory z całym światem — pięścią, nie słowem.",
    tropiciel: "Sprzedaje swoje umiejętności każdemu, kto zapłaci — łowcom, kupcom, czasem samej zwierzynie.",
    strzelec: "Nigdy nie pyta, do kogo strzela, tylko ile za to dostanie.",
    kapitan: "Dowodzi patrolem, który Rada uznaje za konieczny koszt utrzymania szlaku otwartym.",
    tarczownikgildii: "Stoi tam, gdzie inni uciekają, bo to jedyna praca, jaką Gildia mu jeszcze powierza.",
    jezdziecgildii: "Pokonuje szlak szybciej niż wieści o tym, co go pokonało.",
    sabotazysta: "Woli zniszczyć most, niż walczyć na nim — most nie krwawi, nie płacze, nie pamięta.",

    nowicjusz: "Wciąż wierzy, że światło, którym leczy, należy do niego, a nie do Zakonu.",
    egzekutorwiary: "Poluje na heretyków Kultu Spaczenia z gorliwością, która sama zaczyna przypominać obsesję.",
    inkwizytor: "Osądza duszę szybciej, niż zdąży wysłuchać jednego zdania w jej obronie.",
    straznik: "Broni relikwii, których znaczenia nikt już nie pamięta — tylko to, że trzeba ich bronić.",
    kaplanka: "Jej promień oczyszcza duszę równie skutecznie, co wszelkie pytania, które mogłaby zadać Zakonowi.",
    kustoszrelikwii: "Katalogował świętości Zakonu tak długo, że przestał odróżniać wiarę od inwentarza.",
    flagellant: "Wierzy, że każdy bicz, którym się smaga, spłaca dług, którego Zakon nigdy nie nazwał po imieniu.",
    straznikllancuchow: "Pilnuje więźniów, o których Zakon woli nie mówić głośno przy niewolnikach z kopalni.",
    inkwizycyjnypodpalacz: "Ogień oczyszczający pali tak samo dowody, jak i tych, którzy je znaleźli.",

    utopiony: "Grzebał zmarłych Rady, zanim krypty zatopiła pęknięta żyła wodna — teraz nie potrafi przestać, nawet pod wodą.",
    widmokrypty: "Jęczy imieniem, którego nikt żywy już nie pamięta wystarczająco dobrze, by je odpowiedzieć.",
    kostotwor: "Zbudowany z kości tylu zmarłych, że żaden pojedynczy szkielet nie mógłby rościć sobie do niego prawa.",
    mackaglebin: "Wypełzła z wody, która zatopiła krypty — i jak dotąd nikt nie wypełznął z powrotem.",
    straznikkrypty: "Stoi na warcie od czasów sprzed Wojny Esencji i nikt nie zdążył go jeszcze zluzować.",
    zjawabagienna: "Ślizga się po wodzie, która zalała groby, jakby wciąż szukała drogi na powierzchnię.",
    nekromantaodrzuconych: "Wskrzesza tych, których Rada odrzuciła za życia, dając im jedyną karierę, jaka im jeszcze pozostała — służbę po śmierci.",
  },
  // Jedno zdanie fabularne per boss (klucz = bossKey z BOSS_TEMPLATES,
  // characters.js) — analogicznie do enemyFlavor powyżej, ale dla ośmiu
  // najważniejszych narracyjnie stworzeń w grze.
  bossFlavor: {
    boss_kopalnie: "Strzegł żyły esencji, zanim jeszcze Rada nazwała ją swoją — i nie zamierza ustąpić temu, co przyszło później.",
    boss_las: "Utkała swoje królestwo z sieci i jadu głęboko w Skażonym Lesie, gdzie nawet aberracje wolą nie zapuszczać się bez zaproszenia.",
    boss_szlak: "Znaczy każdą ofiarę przed ciosem, bo dla niego polowanie bez rytuału to tylko rzeźnictwo.",
    boss_placowka: "Modli się do tego samego światła co reszta Zakonu — tyle że jego modlitwy dawno przestały być skierowane w górę.",
    boss_krypty: "Rządziła czymś, zanim krypty zatopiła pęknięta żyła wodna, i wciąż uważa, że rządzi tym dalej.",
    boss_dorian: "Doniósł Radzie za obietnicę stanowiska doradcy — i dostał więcej władzy, niż potrafił unieść bez złamania się w środku.",
    boss_cien_rady: "Rada nie wysyła go, żeby negocjował. Wysyła go, kiedy negocjacje przestały być opcją.",
    boss_odrzucony: "Pierwszy eksperyment Doriana, porzucony, zanim zdążył zostać czymkolwiek — a mimo to przetrwał dłużej, niż ktokolwiek zakładał.",
  },
};
