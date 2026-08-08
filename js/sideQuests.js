// Wieloetapowe misje fabularne w stylu Wiedźmina/Dragon Age — w przeciwieństwie
// do płaskich zleceń CITY_NPCS[].quest (jeden cel, jedna nagroda), każda z tych
// 4 misji ma: dialog wprowadzający -> prawdziwy cel do wykonania w świecie
// (mierzony tymi samymi metrykami co reszta gry: kills/level/resource/
// corruption — patrz getTrackableMetric() w main.js) -> powrót do NPC -> wybór
// z dwiema opcjami o różnych konsekwencjach (reputacja tej lokacji kontra
// wzrost spaczenia) -> zakończenie z tym samym unikalnym przedmiotem
// niezależnie od wyboru (wybór różnicuje konsekwencję i tekst, nie nagrodę).
//
// Stan gracza w misji (main.js: sideQuestProgress[questId]) trzyma tylko
// nazwę bieżącego stage'u (klucz w stages{}) + objectiveStartValue (wartość
// metryki zanotowana w momencie wejścia w stage typu objective, żeby cel był
// liczony jako przyrost od tego momentu, nie licznik przez całą grę).
const SIDE_QUESTS = {
  brenna_krew_w_stali: {
    npcKey: "kuznia",
    name: "Krew w Stali",
    icon: "🔨",
    prerequisite: { type: "level", goal: 2 },
    stages: {
      start: {
        text: [
          "Zamykasz za sobą drzwi kuźni, gdy Brenna odkłada młot i ścisza głos. „Muszę ci coś powiedzieć, ale nie tutaj, gdzie słyszą to czeladnicy.”",
          "„Ostatnia dostawa rudy z Kopalni była… inna. Cięższa, ciemniejsza, jakby przesiąknięta czymś więcej niż esencją. Nie chcę pytać dostawcy wprost — Rada ma uszy wszędzie. Ale ty wracasz stamtąd żywy raz za razem. Rozejrzyj się. Pokonaj kolejnych wrogów, obojętne gdzie, i miej oczy otwarte na to, co się tam naprawdę dzieje.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "kills",
        goal: 3,
        text: "Wytrop i pokonaj przynajmniej 3 kolejnych przeciwników, gdziekolwiek się natkniesz — Brenna czeka na wieści z kuźni.",
        next: "choice",
      },
      choice: {
        text: "Wracasz do kuźni. Brenna słucha w milczeniu, gdy opowiadasz, co widziałeś — ślady kajdan pod rudą, znaki należące nie do górników, a do czegoś, co niegdyś było ludźmi. „Więc to prawda” mówi w końcu. „Co teraz zrobisz z tą wiedzą?”",
        options: [
          {
            label: "Zgłoś to Radzie",
            resultText: "Idziesz z tym prosto do urzędnika Rady. Zapisuje wszystko bez mrugnięcia okiem i każe ci wracać do pracy — ale w mieście zaczynają krążyć plotki, że ktoś wreszcie zadał niewygodne pytania. Brenna kiwa głową z ulgą. „Przynajmniej ktoś to zrobił.”",
            reputation: 10,
            next: "resolution_honest",
          },
          {
            label: "Zatrzymaj to dla siebie",
            resultText: "Nie mówisz nikomu poza Brenną. Ona w zamian przemyca ci coś z zapasów kuźni, o które nikt nie będzie pytał — ale wiedza o tym, co widziałeś i przemilczałeś, zostaje z tobą, cięższa niż niejeden pancerz.",
            corruption: 10,
            next: "resolution_silent",
          },
        ],
      },
      resolution_honest: {
        text: ["Kilka dni później Brenna wręcza ci zawiniątek. „To z resztek starej rudy, zanim spalono dowody. Zasłużyłeś.” W środku leży młot, którego stal wygląda, jakby pamiętała każde uderzenie."],
        reward: { itemId: "quest_brenna_mlot" },
        final: true,
      },
      resolution_silent: {
        text: ["Brenna nie pyta więcej. Kładzie przed tobą zawiniątek bez słowa — to samo, co dostałbyś tak czy inaczej, tylko cięższe od milczenia, które teraz dzielicie."],
        reward: { itemId: "quest_brenna_mlot" },
        final: true,
      },
    },
  },

  aldric_zaginiona_owieczka: {
    npcKey: "swiatynia",
    name: "Zaginiona Owieczka",
    icon: "🕊️",
    prerequisite: { type: "bestiary", goal: 2 },
    stages: {
      start: {
        text: [
          "Brat Aldric zniża głos, gdy podchodzisz do ołtarza. „Jeden z naszych młodszych braci, Tomasz, zniknął dwa tygodnie temu. Ostatni raz widziano go, jak szedł w stronę Kultu Spaczenia — bez błogosławieństwa, bez zgody przełożonych.”",
          "„Zakon oficjalnie twierdzi, że uciekł. Ja w to nie wierzę. Tomasz nie był tchórzem, był ciekawski — może zbyt ciekawski. Musisz zrozumieć, jak głęboko sięga spaczenie, zanim znajdziesz jego ślad. Zejdź w mroczniejsze zakątki tego świata, ile potrafisz znieść, i wróć do mnie, gdy będziesz gotów.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "corruption",
        goal: 25,
        text: "Zanurz się głębiej w spaczenie many — osiągnij 25% spaczenia (przez „Mutuj się”, pożeranie szczątków albo Rytuał Wchłonięcia), zanim wrócisz do Aldrica.",
        next: "choice",
      },
      choice: {
        text: "Wracasz do Świątyni. Aldric widzi ślad spaczenia na twojej skórze i blednie. „Znalazłeś go, prawda?” Faktycznie — w Kulcie natrafiłeś na Tomasza, żywego, ale odmienionego, oddanego już nowej wierze esencji. Nie chce wracać. Co powiesz Aldricowi?",
        options: [
          {
            label: "Powiedz mu prawdę",
            resultText: "Aldric słucha w milczeniu, gdy opisujesz, kim się stał Tomasz. Ból na jego twarzy jest szczery, ale i tak dziękuje ci za uczciwość. „Przynajmniej teraz mogę się za niego modlić, zamiast łudzić się nadzieją.” Zakon zaczyna traktować cię z większym zaufaniem.",
            reputation: 10,
            next: "resolution_honest",
          },
          {
            label: "Powiedz, że zginął w mrokach kopalni",
            resultText: "Kłamiesz — mówisz, że Tomasz zginął, walcząc z aberracją, zanim zdążył dotrzeć do Kultu. Aldric wierzy ci bez wahania, opłakuje go jak bohatera. Ty jeden wiesz, że prawda jest mroczniejsza — i że sam podszedłeś bliżej niej, niż powinieneś.",
            corruption: 10,
            next: "resolution_silent",
          },
        ],
      },
      resolution_honest: {
        text: ["Kilka dni później Aldric wręcza ci amulet należący niegdyś do Tomasza. „Niech chroni cię tam, gdzie jego wiara go zawiodła.”"],
        reward: { itemId: "quest_aldric_amulet" },
        final: true,
      },
      resolution_silent: {
        text: ["Aldric zawiesza ci na szyi amulet Tomasza jako relikwię „poległego bohatera”. Nosisz go, wiedząc, że kłamstwo waży więcej niż sam przedmiot."],
        reward: { itemId: "quest_aldric_amulet" },
        final: true,
      },
    },
  },

  grom_ostatni_przeciwnik: {
    npcKey: "arena",
    name: "Ostatni Przeciwnik",
    icon: "🥊",
    prerequisite: { type: "kills", goal: 5 },
    stages: {
      start: {
        text: [
          "Grom odciąga cię na bok, gdy tłum na Arenie się rozchodzi. „Rada przysłała kogoś. Nie zwykłego zawodnika — kogoś, kto ma mnie przetestować, sprawdzić, czy Arena wciąż jest tylko rozrywką, czy czymś więcej.”",
          "„Nie stawię się do walki, dopóki nie będę pewien, że masz na to siłę. Udowodnij mi to na poziomie doświadczenia, jaki osiągnąłeś — nie w jednej walce, ale w całej drodze, którą przeszedłeś.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "level",
        goal: 5,
        text: "Osiągnij 5. poziom doświadczenia — Grom chce widzieć, że naprawdę jesteś gotów, zanim wystawi cię przeciw wysłannikowi Rady.",
        next: "choice",
      },
      choice: {
        text: "Wracasz na Arenę. Grom kiwa głową z uznaniem i prowadzi cię na środek piasku, gdzie czeka już wysłannik Rady — silny, opanowany, wyraźnie nieprzypadkowy. Walka jest brutalna, ale wygrywasz. Wysłannik leży u twoich stóp, żywy, patrząc na ciebie z czymś między nienawiścią a szacunkiem. Co robisz?",
        options: [
          {
            label: "Dobij go na oczach tłumu",
            resultText: "Tłum wyje z zachwytu, gdy kończysz walkę ostatecznie. Grom klepie cię po ramieniu. „Rada dostanie jasny sygnał: Arena nie jest już ich zabawką.” Twoja reputacja tutaj rośnie gwałtownie.",
            reputation: 12,
            next: "resolution_honest",
          },
          {
            label: "Oszczędź go i wyciągnij informacje",
            resultText: "Zamiast zadać ostatni cios, przystawiasz mu ostrze do gardła i żądasz odpowiedzi. Wysłannik, przerażony, szepcze więcej, niż powinien, o planach Rady wobec Gildii — wiedza, której nie powinieneś posiadać, i która ciąży ci odtąd jak brzemię.",
            corruption: 8,
            next: "resolution_silent",
          },
        ],
      },
      resolution_honest: {
        text: ["Po walce Grom wręcza ci rękawice po dawnym mistrzu Areny, zdjęte specjalnie na tę okazję. „Zasłużyłeś na nie bardziej niż on kiedykolwiek.”"],
        reward: { itemId: "quest_grom_rekawice" },
        final: true,
      },
      resolution_silent: {
        text: ["Grom nie pyta, co usłyszałeś od wysłannika — widzi tylko, że wygrałeś, i wręcza ci rękawice należące niegdyś do mistrza Areny. Informacje, które zdobyłeś, zostają tylko twoje — na razie."],
        reward: { itemId: "quest_grom_rekawice" },
        final: true,
      },
    },
  },

  riven_kontrabanda_rady: {
    npcKey: "czarny_rynek",
    name: "Kontrabanda Rady",
    icon: "🗝️",
    prerequisite: { type: "level", goal: 3 },
    stages: {
      start: {
        text: [
          "Riven rozgląda się, zanim zniża głos. „Rada przewozi przez miasto ładunek, o którym oficjalnie nic nie wiadomo. Chcę wiedzieć, co w nim jest, zanim trafi tam, gdzie ma trafić.”",
          "„Zbierz mi trochę Nagrody Gildii — to nie dla mnie, to dla strażników, którzy patrzą w drugą stronę, kiedy trzeba. Im więcej zbierzesz, tym głębiej mogę wejść w ich trasę.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "resource",
        currency: "Nagroda Gildii",
        goal: 25,
        text: "Zbierz 25 × Nagroda Gildii — Riven potrzebuje ich, żeby przekupić odpowiednich strażników.",
        next: "choice",
      },
      choice: {
        text: "Wracasz do Rivena z zebraną Nagrodą Gildii. Kilka dni później zdobywa dokładną trasę konwoju Rady — i skrzynię przemyconych dóbr, których Rada wolałaby nie widzieć w niepowołanych rękach. „Co robimy z tym?” pyta, choć już zna twoją odpowiedź.",
        options: [
          {
            label: "Sprzedaj łup i zatrzymaj zysk",
            resultText: "Riven uśmiecha się szeroko i dzieli się zyskiem po równo. Twoja sakiewka jest cięższa, ale wiesz, że przez ciebie ktoś w Radzie będzie miał bardzo zły dzień, gdy zauważy braki.",
            corruption: 8,
            next: "resolution_silent",
          },
          {
            label: "Przekaż dowody urzędnikom Rady",
            resultText: "Zamiast czerpać zysk, oddajesz część łupu jako dowód nadużyć konkretnego urzędnika Rady. Riven kręci głową, rozbawiony twoją uczciwością w niewłaściwym miejscu — ale i tak dotrzymuje słowa.",
            reputation: 10,
            next: "resolution_honest",
          },
        ],
      },
      resolution_honest: {
        text: ["Riven wręcza ci mimo wszystko obiecaną zapłatę — parę butów, które podobno noszono podczas dziesiątek nieudokumentowanych „spacerów” przez mur miasta."],
        reward: { itemId: "quest_riven_buty" },
        final: true,
      },
      resolution_silent: {
        text: ["Riven wręcza ci buty i dorzuca coś ekstra do sakiewki. „Ludzie, którzy myślą jak ja, zawsze u mnie zarabiają więcej.”"],
        reward: { itemId: "quest_riven_buty" },
        final: true,
      },
    },
  },

  yolanda_ostatnia_stawka: {
    npcKey: "tawerna",
    name: "Ostatnia Stawka",
    icon: "🎲",
    prerequisite: { type: "resource", currency: "Nagroda Gildii", goal: 20 },
    stages: {
      start: {
        text: [
          "Yolanda odstawia dzban z piwem i zniża głos, mimo że w tawernie i tak nikt nie słucha nikogo poza sobą. „Cichy Marek nie zjawił się tu od dwóch tygodni. Winien mi tyle, że powinien się bać wracać — ale winien jest też ludziom gorszym ode mnie, a tacy nie zapominają.”",
          "„Ostatniej nocy, zanim zniknął, przechwalał się przy kościach, że znalazł w lasach coś, co spłaci każdy dług — jakąś bestię, którą podobno oswoił. Nikt mu nie uwierzył, ale nikt też go więcej nie widział. Zejdź tam, gdzie chełpił się, że był, i powiedz mi, czy kłamał, czy naprawdę znalazł coś, co go zabiło.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "bestiary",
        goal: 3,
        text: "Odkryj w Bestiariuszu przynajmniej 3 kolejne stworzenia, których jeszcze nie znasz — tylko tak dowiesz się, czy historia Marka o oswojonej bestii miała choć ziarno prawdy.",
        next: "choice",
      },
      choice: {
        text: "Wracasz do tawerny z tym, czego się dowiedziałeś. Yolanda słucha, przecierając ten sam kufel od dziesięciu minut. Prawda jest prosta i brzydka: nic, co widziałeś, nie dało się oswoić, a chełpliwa opowieść Marka była zwykłym kłamstwem dłużnika kupującego sobie czas. Co powiesz Yolandzie?",
        options: [
          {
            label: "Powiedz jej prawdę",
            resultText: "Yolanda kiwa głową bez zdziwienia. „Wiedziałam. Ale przynajmniej teraz mogę spisać ten dług na straty, zamiast czekać na kogoś, kto nie wróci.” Dzieli się z tobą tym, co uważa za sprawiedliwą zapłatę za uczciwość.",
            reputation: 10,
            next: "resolution_honest",
          },
          {
            label: "Powiedz jej, że Marek naprawdę oswoił bestię i uciekł z nią gdzieś dalej",
            resultText: "Kłamiesz — mówisz, że Marek żyje, wolny, gdzieś poza zasięgiem swoich wierzycieli. Yolanda uśmiecha się, chce w to uwierzyć, i to jej wystarcza, żeby przestać szukać dalej. Zostawiasz ją z nadzieją zbudowaną na niczym, a sam czujesz ciężar tego kłamstwa dłużej, niż powinieneś.",
            corruption: 8,
            next: "resolution_silent",
          },
        ],
      },
      resolution_honest: {
        text: ["Yolanda wyciąga zza baru mały, oklejony pieczęciami woreczek. „Marek zostawił to jako zastaw, zanim zniknął. Teraz już wiem, że nikt po niego nie wróci — a tobie przyda się bardziej niż jemu.” W środku brzęczą kości oprawione w srebro, cięższe, niż powinny być."],
        reward: { itemId: "quest_yolanda_kosci" },
        final: true,
      },
      resolution_silent: {
        text: ["Yolanda wręcza ci mimo wszystko zastaw Marka — kości oprawione w srebro — z uśmiechem, który nie sięga jej oczu. „Powiedz mu, żeby wrócił i je odebrał, kiedy indziej.” Nigdy nie wróci, a ty jesteś jedyną osobą, która o tym wie."],
        reward: { itemId: "quest_yolanda_kosci" },
        final: true,
      },
    },
  },

  matka_esencja_szept_esencji: {
    npcKey: "kult_spaczenia",
    name: "Szept Esencji",
    icon: "🌒",
    prerequisite: { type: "corruption", goal: 10 },
    stages: {
      start: {
        text: [
          "Matka Esencja przygląda się bliznom spaczenia na twojej skórze dłużej niż zwykle. „Widzę, że esencja zaczyna w tobie szeptać. To dobry moment, żebyś poznał, jak daleko sięga nasza troska o własnych.”",
          "„Jedna z naszych, Sira, zbyt szybko poszła za głosem esencji — jej przemiana przyspiesza, ciało nie nadąża za tym, czym się staje. Możemy ją ustabilizować, ale rytuał wymaga czystych Spaczonych Ziół, zerwanych tam, gdzie skażenie lasu jest najgłębsze. Przynieś nam 30, zanim będzie za późno.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "resource",
        currency: "Spaczone Zioła",
        goal: 30,
        text: "Zbierz 30 × Spaczone Zioła w Skażonym Lesie — Kult potrzebuje ich, żeby ustabilizować przemianę Siry, zanim pochłonie ją całkowicie.",
        next: "choice",
      },
      choice: {
        text: "Wracasz z workiem ziół. Matka Esencja prowadzi cię do izby, gdzie na posłaniu leży Sira, drżąca, na wpół już nierozpoznawalna. „Mogę przeprowadzić rytuał łagodnie — spowolnić przemianę, dać jej więcej czasu jako sobą. Albo mogę pozwolić esencji dokończyć to, co zaczęła, w pełni, na raz. Sira się nie sprzeciwi — już dawno przestała się bać.” Co robisz?",
        options: [
          {
            label: "Nalegaj na łagodniejszy rytuał",
            resultText: "Matka Esencja niechętnie się zgadza. Rytuał spowalnia przemianę Siry, dając jej twarz, która wciąż przypomina człowieka, chociaż na jak długo — nikt nie wie. „Kupiłeś jej czas. Miejmy nadzieję, że to była łaska, nie tylko odwłoka.”",
            reputation: 10,
            next: "resolution_honest",
          },
          {
            label: "Pozwól na pełny rytuał przebudzenia",
            resultText: "Nie sprzeciwiasz się. Rytuał przechodzi w pełni, a esencja kończy to, co zaczęła w Sirze, w ciągu jednej nocy pełnej krzyku, który stopniowo cichnie w coś, co nie brzmi już jak ból. Rano Sira patrzy na ciebie oczami, które nie są już całkiem ludzkie — i dziękuje ci za to, cicho, z czymś, co mogłoby być spokojem.",
            corruption: 10,
            next: "resolution_silent",
          },
        ],
      },
      resolution_honest: {
        text: ["Kilka dni później Matka Esencja wręcza ci naszyjnik zdjęty z szyi Siry, zanim zaczęła się przemiana — pamiątkę po tym, kim była, zanim zdecydowała się wybrać coś innego. „Nosisz dowód, że łagodność wciąż ma tu miejsce.”"],
        reward: { itemId: "quest_matka_wisior" },
        final: true,
      },
      resolution_silent: {
        text: ["Matka Esencja wręcza ci ten sam naszyjnik, ale jej słowa brzmią inaczej. „Sira nie żałuje. Może ty też pewnego dnia przestaniesz.” Nosisz go, wiedząc dokładnie, na co się zgodziłeś tamtej nocy."],
        reward: { itemId: "quest_matka_wisior" },
        final: true,
      },
    },
  },
};
