// Osobiste wątki fabularne towarzyszy — w przeciwieństwie do jednorazowej
// COMPANION_SCENES (kończy się rekrutacją i nigdy więcej nie wraca), każdy
// wątek tutaj otwiera się dopiero PO dołączeniu towarzysza do drużyny i ma
// dokładnie ten sam kształt co js/sideQuests.js: dialog wprowadzający ->
// prawdziwy cel w świecie (progressType/goal, mierzony przez
// getTrackableMetric() w main.js) -> wybór z dwiema opcjami o różnych
// konsekwencjach -> zakończenie z unikalnym przedmiotem.
//
// Różnica względem SIDE_QUESTS: te wątki nie mają npcKey (towarzysz nie jest
// przypisany do miejsca w mieście — otwiera się z arkusza towarzysza) i nie
// mają prerequisite (towarzysz już "zdał egzamin" przy rekrutacji, wątek
// odblokowuje się od razu). Wybór różnicuje konsekwencję inaczej niż u NPC:
// zamiast reputacja-vs-spaczenie, tutaj to trwały bonus staty tego
// towarzysza (opcja lojalna/jasna) kontra wzrost Twojego spaczenia (opcja
// mroczna) — patrz main.js: chooseSideQuestOption() obsługuje pole
// option.bonusStat analogicznie do option.reputation/option.corruption.
//
// Klucz obiektu = subclassName (tak samo jak COMPANION_QUESTS/COMPANION_SCENES
// w js/companions.js) — wątek jest przypisany do specjalizacji, nie do
// konkretnej instancji towarzysza, więc działa niezależnie od tego, który
// konkretnie "Elara" czy "Torvin" trafi akurat do drużyny.
const COMPANION_STORY_QUESTS = {
  "Arcymag": {
    name: "Cichy Głos z Wieży",
    icon: "📖",
    stages: {
      start: {
        text: [
          "Pewnej nocy zastajesz Arcymaga pochylonego nad tomem, którego wcześniej nie widziałeś w jego pracowni — okładka bez tytułu, strony poruszające się, jakby oddychały. „Mój dawny nauczyciel zostawił mi to przed śmiercią. Kazał nigdy nie otwierać. Oczywiście otworzyłem.”",
          "„Głos w środku wie rzeczy, których nie powinien wiedzieć — o tobie, o mnie, o tym, co czeka nas obu. Muszę zrozumieć, ile z tego to prawda, a ile pułapka. Potrzebuję czasu zanurzonego w esencji tego świata, zanim zdecyduję, co dalej.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "corruption",
        goal: 20,
        text: "Zanurz się w spaczeniu many na tyle głęboko, by Arcymag mógł porównać to, co czujesz, z tym, co szepcze głos z tomu — osiągnij 20% spaczenia.",
        next: "choice",
      },
      choice: {
        text: "Arcymag zamyka tom, gdy wracasz. „To, co czujesz, pasuje do jego słów co do joty. Głos nie kłamie — a to gorsze, niż gdyby kłamał.” Trzyma księgę tak, jakby ważyła więcej niż powinna. „Co robimy z prawdą, której nikt nie chciał nam dać?”",
        options: [
          {
            label: "Spal tom, zanim pochłonie więcej",
            resultText: "Płomienie biorą księgę bez oporu — jakby sama chciała skończyć. Arcymag patrzy w ogień długo, w milczeniu, a potem odwraca się do ciebie z czymś jak ulga. „Wiedza, której nie musisz nosić, to też wiedza. Dziękuję.” Coś w jego skupieniu staje się wyraźniej ostrzejsze.",
            bonusStat: { key: "int", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Zatrzymaj tom i naucz się go czytać",
            resultText: "Arcymag waha się, ale w końcu wręcza ci księgę. „Skoro i tak już wiesz za dużo, lepiej, żebyś wiedział wszystko.” Głos z tomu zaczyna szeptać także do ciebie, cicho, po nocach — obietnice mocy, których nie prosiłeś, by składano.",
            corruption: 10,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Kilka dni później Arcymag wręcza ci wisior przetopiony z okładki spalonego tomu. „Ostatnie, co z niego zostało, niech chociaż będzie użyteczne, zamiast niebezpieczne.”"],
        reward: { itemId: "companion_arcymag_wisior" },
        final: true,
      },
      resolution_dark: {
        text: ["Arcymag daje ci wisior wykuty z klamry tomu — mówi, że pomoże wyciszyć szept, gdy stanie się zbyt głośny. Nie mówi, co zrobić, gdy nie pomoże."],
        reward: { itemId: "companion_arcymag_wisior" },
        final: true,
      },
    },
  },

  "Apostata": {
    name: "Dług Wobec Otchłani",
    icon: "🖤",
    stages: {
      start: {
        text: [
          "Apostata budzi się w środku nocy z krzykiem, którego nie chce wyjaśnić — dopiero rano przyznaje, że coś z Otchłani domaga się spłaty za moc, którą od dawna pożycza. „To nie prośba. To wezwanie. Muszę nakarmić dług, zanim dług nakarmi się mną.”",
          "„Krew wystarczy — cudza, nie moja, przynajmniej na razie. Pomóż mi zebrać ją szybko, zanim wezwanie stanie się czymś gorszym niż krzyk.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "kills",
        goal: 5,
        text: "Pokonaj przynajmniej 5 kolejnych przeciwników — Apostata liczy każdą kroplę, jakby to ona miała go ocalić.",
        next: "choice",
      },
      choice: {
        text: "Apostata wchłania echo bitew, które za tobą stoczyliście, i wezwanie cichnie — na razie. „Dług spłacony. Ale on zawsze wraca.” Patrzy na ciebie z czymś między wdzięcznością a wstydem. „Powinienem zerwać ten pakt, póki jeszcze mogę. Albo pogłębić go, żeby przestał mnie osaczać niespodziankami.”",
        options: [
          {
            label: "Namów go, by zerwał pakt",
            resultText: "Apostata długo milczy, w końcu kiwa głową. Rytuał zerwania boli — krzyczy, pada na kolana, ale wstaje bez tego ciężaru w oczach, który nosił od dawna. „Pierwszy raz od lat czuję się jak ja, a nie jak dłużnik.”",
            bonusStat: { key: "cha", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Pomóż mu pogłębić pakt zamiast go zrywać",
            resultText: "Zamiast zrywać więź, wzmacniacie ją razem — łatwiej, szybciej, bez bólu zerwania. Apostata wygląda na spokojniejszego, ale coś w powietrzu wokół niego gęstnieje, jakby Otchłań podeszła bliżej, słysząc, że nikt nie ma zamiaru odejść.",
            corruption: 10,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Apostata wręcza ci pierścień, który nosił od pierwszego dnia paktu. „Nie potrzebuję już przypomnienia. Może tobie się przyda bardziej niż mnie.”"],
        reward: { itemId: "companion_apostata_pierscien" },
        final: true,
      },
      resolution_dark: {
        text: ["Apostata oddaje ci pierścień jako część nowego, głębszego paktu — twierdzi, że teraz chroni was oboje. Nosisz go, nie do końca pewien, przed czym dokładnie."],
        reward: { itemId: "companion_apostata_pierscien" },
        final: true,
      },
    },
  },

  "Świetlisty obrońca": {
    name: "Litera i Duch Prawa",
    icon: "😇",
    stages: {
      start: {
        text: [
          "Świetlisty obrońca wraca z Zakonu wyraźnie poruszony. „Kazano mi odmówić schronienia rodzinie, która uciekła z wioski dotkniętej spaczeniem — ryzyko skażenia, mówią przełożeni. Prawo Zakonu jest jasne. Moje sumienie nie jest.”",
          "„Muszę zrozumieć, jak głęboko sięga to, co ich dotknęło, zanim zdecyduję, czy prawo ma rację. Pomóż mi poznać wrogów, którzy niosą spaczenie, żebym mógł ocenić, czy ci ludzie naprawdę są zagrożeniem.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "bestiary",
        goal: 4,
        text: "Odkryj w Bestiariuszu przynajmniej 4 różne stworzenia Aetherionu — obrońca chce znać naturę zagrożenia, zanim osądzi ludzi, którzy przed nim uciekli.",
        next: "choice",
      },
      choice: {
        text: "Wracasz z odpowiedziami. „Rozumiem teraz, co ich dotknęło — i to nie jest to samo, co czai się w lochach.” Obrońca zaciska pięść na rękojeści miecza. „Prawo każe mi ich odesłać. Sumienie każe mi ich ukryć. Co robimy?”",
        options: [
          {
            label: "Ukryj rodzinę wbrew prawu Zakonu",
            resultText: "Znajdujecie im razem bezpieczne miejsce poza murami, z dala od patroli Zakonu. Obrońca łamie przysięgę po raz pierwszy w życiu — i wygląda na to, że śpi tej nocy spokojniej niż od tygodni.",
            bonusStat: { key: "wyt", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Zgłoś ich Zakonowi zgodnie z przepisami",
            resultText: "Obrońca dotrzymuje przysięgi i zgłasza rodzinę władzom Zakonu, choć głos mu się łamie przy raporcie. Wie, że postąpił „słusznie” — i wie też, że to słowo będzie go odtąd prześladować bardziej niż jakikolwiek wróg.",
            corruption: 8,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Obrońca zdejmuje część własnej zbroi i wręcza ci hełm noszony od święceń. „Prawo bez sumienia to tylko kolejny miecz. Dziękuję, że przypomniałeś mi, czym różni się jedno od drugiego.”"],
        reward: { itemId: "companion_swietlisty_helm" },
        final: true,
      },
      resolution_dark: {
        text: ["Obrońca wręcza ci mimo wszystko swój hełm — mówi, że nie zasługuje już, by go nosić z czystym sumieniem. Przyjmujesz go, wiedząc, ile go to kosztowało."],
        reward: { itemId: "companion_swietlisty_helm" },
        final: true,
      },
    },
  },

  "Mroczny rycerz": {
    name: "Cień Starego Brata Broni",
    icon: "🌑",
    stages: {
      start: {
        text: [
          "Mroczny rycerz rozpoznaje ślady na drodze — te same, które zostawiał dawny brat broni, zdrajca, którego ścigacie od miesięcy. „Jest bliżej, niż myślałem. I chyba wie, że go szukam.”",
          "„Nie chcę go osaczyć w przypadkowej potyczce — chcę być gotów, kiedy w końcu staniemy naprzeciw siebie. Pokonaj ze mną więcej wrogów. Muszę wiedzieć, że moje ostrze nie zawaha się, kiedy przyjdzie czas.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "kills",
        goal: 6,
        text: "Pokonaj przynajmniej 6 kolejnych przeciwników u boku rycerza — trening przed nieuniknionym starciem z dawnym bratem broni.",
        next: "choice",
      },
      choice: {
        text: "Trop w końcu prowadzi was do zdrajcy, osaczonego w ruinach, bez odwrotu. Nie sięga po broń. „Wiedziałem, że w końcu mnie znajdziesz” mówi do rycerza. „Pytanie, co teraz z tym zrobisz.” Rycerz patrzy na dawnego brata długo, w milczeniu.",
        options: [
          {
            label: "Pozwól mu odejść bez walki",
            resultText: "Rycerz opuszcza miecz. „Zabicie cię nie zwróci mi tego, co straciłem przez twoją zdradę. Idź. I módl się, żebyśmy się więcej nie spotkali.” Zdrajca znika w ruinach, a rycerz wygląda, jakby zrzucił z barków coś cięższego niż zbroja.",
            bonusStat: { key: "str", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Zabij go razem, bez litości",
            resultText: "Kończycie sprawę razem, ostrze przy ostrzu. Rycerz nie wygląda na zaskoczonego własnym spokojem po fakcie — raczej na człowieka, który dawno pogodził się z tym, kim się stanie w tej chwili. Nie mówi nic przez resztę dnia.",
            corruption: 10,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Rycerz wręcza ci łańcuch, który nosił od zdrady jako przypomnienie. „Nie potrzebuję już przypominania o nienawiści. Może tobie posłuży lepiej, jako coś innego.”"],
        reward: { itemId: "companion_mroczny_lancuch" },
        final: true,
      },
      resolution_dark: {
        text: ["Rycerz zdejmuje łańcuch dawnego brata broni z ciała zdrajcy i wręcza ci go bez słowa. Nosisz go, wiedząc dokładnie, skąd pochodzi."],
        reward: { itemId: "companion_mroczny_lancuch" },
        final: true,
      },
    },
  },

  "Najemnik bractwa": {
    name: "Kontrakt Bez Nazwiska",
    icon: "🪓",
    stages: {
      start: {
        text: [
          "Najemnik dostaje kontrakt bez podpisu zleceniodawcy — rzadkość w Bractwie, gdzie każdy kontrakt ma imię i twarz. „Ktoś płaci bardzo dobrze za to, żeby nikt nie wiedział, kto płaci. To zwykle znaczy, że robota jest brudniejsza niż zwykle.”",
          "„Bractwo każe mi przyjąć — pieniądze są za dobre, żeby odmówić. Ale zanim to zrobię, chcę zebrać własną nagrodę z uczciwszych zleceń, na wypadek gdyby to poszło źle i musiał zniknąć bez wsparcia Bractwa.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "resource",
        currency: "Nagroda Gildii",
        goal: 20,
        text: "Zbierz 20 × Nagroda Gildii — najemnik chce mieć własną poduszkę bezpieczeństwa, zanim weźmie kontrakt bez nazwiska.",
        next: "choice",
      },
      choice: {
        text: "Z zebraną nagrodą w kieszeni najemnik w końcu otwiera zapieczętowaną kopertę kontraktu. Cel to znany kupiec, który — jak się okazuje — właśnie zerwał umowę z samą Radą. „To nie kontrakt. To zemsta w przebraniu pracy.” Patrzy na ciebie. „Bractwo i tak każe mi go przyjąć.”",
        options: [
          {
            label: "Odrzuć kontrakt wbrew Bractwu",
            resultText: "Najemnik pierwszy raz w karierze odsyła kontrakt niewykonany — ryzykując gniew Bractwa. „Nie jestem cudzą pięścią. Niech szukają kogoś innego do brudnej roboty.” Wygląda na spiętego, ale i wyprostowanego bardziej niż zwykle.",
            bonusStat: { key: "zre", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Przyjmij kontrakt i wykonaj go bez pytań",
            resultText: "Kończycie robotę tak, jak zlecono — szybko, cicho, bez zbędnych pytań o to, kto tak naprawdę za tym stoi. Najemnik chowa zapłatę bez satysfakcji, jaką zwykle czuje po udanym zleceniu.",
            corruption: 8,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Bractwo w końcu przymyka oko na odmowę, gdy najemnik dzieli się z tobą częścią swojej rezerwy jako podziękowaniem. Wręcza ci pieczęć, którą nosił od pierwszego kontraktu. „Rzadko spotykam kogoś, kto rozumie, kiedy odmówić.”"],
        reward: { itemId: "companion_najemnik_pieczec" },
        final: true,
      },
      resolution_dark: {
        text: ["Najemnik dzieli się zapłatą z kontraktu bez nazwiska i wręcza ci przy okazji swoją starą pieczęć — mówi, że i tak nie chce już na nią patrzeć."],
        reward: { itemId: "companion_najemnik_pieczec" },
        final: true,
      },
    },
  },

  "Berserk": {
    name: "Głód, Którego Nie Karmię",
    icon: "😡",
    stages: {
      start: {
        text: [
          "Berserk budzi się po bitwie nie pamiętając ostatnich chwil walki — znowu. „To się pogłębia. Kiedyś traciłem się na sekundy. Teraz to minuty. Wkrótce może być cała bitwa, a ja nie będę wiedział, kogo w niej zraniłem.”",
          "„Chcę to opanować, zanim stracę coś, czego nie da się odzyskać. Walcz ze mną więcej. Muszę wiedzieć, gdzie dokładnie jest granica, zanim ją przekroczę na dobre.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "kills",
        goal: 8,
        text: "Pokonaj przynajmniej 8 kolejnych przeciwników u boku berserka — im więcej bitew, tym wyraźniej widać, gdzie traci nad sobą kontrolę.",
        next: "choice",
      },
      choice: {
        text: "Po ósmym starciu berserk siada na ziemi, wyczerpany, ale przytomny — dłużej niż zwykle. „Widziałem granicę. Wiem już, gdzie jest.” Podnosi wzrok. „Pytanie, czy chcę ją okiełznać, czy przestać próbować i po prostu jej pozwolić.”",
        options: [
          {
            label: "Pomóż mu ćwiczyć kontrolę nad furią",
            resultText: "Zaczynacie razem prostą dyscyplinę — oddech przed atakiem, liczenie ciosów, cokolwiek, co trzyma go po tej stronie granicy. To powolne i frustrujące, ale po raz pierwszy od dawna kończy bitwę pamiętając każdą jej chwilę.",
            bonusStat: { key: "wyt", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Powiedz mu, żeby przestał walczyć z naturą",
            resultText: "„Może furia po prostu jest tym, kim jesteś” mówisz. Berserk śmieje się gorzko, ale przestaje się opierać. Następna bitwa jest szybsza, brutalniejsza, skuteczniejsza — i zostawia go z jeszcze mniejszą liczbą wspomnień niż wcześniej.",
            corruption: 12,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Berserk zdejmuje naszyjnik z zębów pierwszej bestii, jaką kiedykolwiek pokonał. „Noszę go, odkąd przestałem liczyć, ile razy się zgubiłem. Teraz liczę, ile razy wróciłem. Weź go.”"],
        reward: { itemId: "companion_berserk_naszyjnik" },
        final: true,
      },
      resolution_dark: {
        text: ["Berserk wciąż wręcza ci naszyjnik z zębów bestii — mówi, że nie ma już dla kogo go nosić jako przypomnienia. Furia i on stają się coraz trudniejsi do odróżnienia."],
        reward: { itemId: "companion_berserk_naszyjnik" },
        final: true,
      },
    },
  },

  "Łowca": {
    name: "Zwierzyna, Która Nie Powinna Istnieć",
    icon: "🏹",
    stages: {
      start: {
        text: [
          "Łowca znajduje ślady, których nie potrafi rozpoznać — zbyt duże, zbyt regularne, prowadzące w kółko, jakby coś świadomie unikało bycia wytropionym. „Trzydzieści lat w tym fachu i pierwszy raz nie wiem, na co patrzę.”",
          "„Zanim zaryzykuję trop tak dziwnej zwierzyny, muszę poznać wszystko inne, co żyje w tych lasach — żeby wiedzieć na pewno, że to naprawdę coś nowego, a nie coś, co już znam pod inną postacią.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "bestiary",
        goal: 6,
        text: "Odkryj w Bestiariuszu przynajmniej 6 różnych stworzeń Aetherionu — łowca chce mieć pewność, zanim zaryzykuje trop nieznanej zwierzyny.",
        next: "choice",
      },
      choice: {
        text: "„To nie jest nic z rejestru. To coś nowego — albo coś bardzo starego, co obudziło się na nowo.” Trop w końcu prowadzi was do jaskini, z której dobiega dźwięk, jakiego żadne z was wcześniej nie słyszało. Łowca napina cięciwę. „Ubijamy to, czy obserwujemy z bezpiecznej odległości?”",
        options: [
          {
            label: "Obserwuj i spisz, zamiast zabijać",
            resultText: "Zamiast strzelać, siedzicie w ukryciu godzinami, spisując każdy ruch stworzenia. Łowca jest w swoim żywiole — rejestr zyskuje wpis, jakiego nie miał wcześniej żaden bestiariusz Aetherionu, a zwierzyna żyje dalej, nieświadoma, jak blisko była śmierci.",
            bonusStat: { key: "zre", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Zabij je, zanim zdąży kogoś skrzywdzić",
            resultText: "Strzelacie razem, zanim stworzenie zdąży się zbliżyć. Pada szybko, ciszej, niż się spodziewaliście — ale coś w sposobie, w jaki umiera, zostaje z wami dłużej niż zwykły łup, jakby zabiliście coś, co nie powinno było jeszcze istnieć.",
            corruption: 8,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Łowca wręcza ci parę butów uszytych z materiału tak cichego, że sam ledwo słyszy własne kroki. „Ktoś, kto potrafi czekać zamiast strzelać, zasługuje na ciszę, która to ułatwia.”"],
        reward: { itemId: "companion_lowca_buty" },
        final: true,
      },
      resolution_dark: {
        text: ["Łowca wciąż wręcza ci ciche buty uszyte z futra nieznanej bestii — mówi, że i tak nie ma serca, by nosić trofeum z czegoś, co może było ostatnim w swoim rodzaju."],
        reward: { itemId: "companion_lowca_buty" },
        final: true,
      },
    },
  },

  "Skrytobójca": {
    name: "Kontrakt, Którego Nikt Nie Odwołał",
    icon: "🥷",
    stages: {
      start: {
        text: [
          "Skrytobójca zauważa kogoś obserwującego z dachów — zbyt uważnie, zbyt cierpliwie, jak ktoś, kto czeka na idealny moment. „Stary kontrakt na moją głowę. Myślałam, że dawno wygasł. Ktoś najwyraźniej postanowił go odnowić.”",
          "„Muszę być szybsza i pewniejsza, zanim on zdecyduje się uderzyć. Potrzebuję czasu, żeby dojść do formy, jakiej nie miałam od lat.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "level",
        goal: 6,
        text: "Osiągnij 6. poziom doświadczenia — skrytobójczyni chce mieć u boku kogoś naprawdę gotowego, zanim dawny kontrakt w końcu uderzy.",
        next: "choice",
      },
      choice: {
        text: "Zamachowiec w końcu robi ruch — osaczacie go razem w zaułku, zanim zdąży cokolwiek zrobić. Nie jest zawodowcem. Jest przerażonym chłopakiem, który wziął kontrakt, bo desperacko potrzebował pieniędzy na leczenie matki. Skrytobójczyni patrzy na niego z ostrzem w dłoni. „Co robimy?”",
        options: [
          {
            label: "Puść go wolno i daj mu pieniądze",
            resultText: "Skrytobójczyni chowa ostrze i wciska chłopakowi sakiewkę cięższą niż powinna być. „Wracaj do matki. I nigdy więcej nie bierz kontraktów na ludzi, którzy mogliby cię zabić bez mrugnięcia okiem.” Chłopak znika, zanim zdąży podziękować.",
            bonusStat: { key: "cha", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Dokończ kontrakt, zanim zrobi to ktoś inny",
            resultText: "Skrytobójczyni kończy sprawę szybko, bez zbędnych słów — profesjonalnie, tak jak ją nauczono. Nie mówi nic o chłopcu ani o jego matce przez resztę dnia, ale coś w jej milczeniu jest cięższe niż zwykle po zleceniu.",
            corruption: 10,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Skrytobójczyni wręcza ci sztylet, który nosiła jako zabezpieczenie na wypadek, gdyby kontrakt się powiódł. „Nie będę już go potrzebować do tego celu. Niech posłuży czemuś lepszemu.”"],
        reward: { itemId: "companion_skrytobojca_sztylet" },
        final: true,
      },
      resolution_dark: {
        text: ["Skrytobójczyni wciąż wręcza ci ten sam sztylet — mówi, że skoro kontrakt jednak dobiegł końca, nie ma już powodu, by go dłużej nosić przy sobie."],
        reward: { itemId: "companion_skrytobojca_sztylet" },
        final: true,
      },
    },
  },

  "Truciciel": {
    name: "Recepta na Dwoje",
    icon: "🧪",
    stages: {
      start: {
        text: [
          "Truciciel wraca z targu wstrząśnięty — dawny uczeń, ten sam, który kiedyś ukradł mu recepturę i zniknął, właśnie sprzedaje w mieście silniejszą, bardziej niestabilną wersję jego trucizn. Ludzie już zaczynają chorować. „To moja wina. Powinienem był go zatrzymać, kiedy jeszcze mogłem.”",
          "„Muszę uwarzyć odtrutkę, zanim zbierze więcej ofiar. Potrzebuję rzadszych składników, niż mam pod ręką. Pomóż mi je zebrać, zanim będzie za późno dla kogokolwiek innego.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "resource",
        currency: "Spaczone Zioła",
        goal: 15,
        text: "Zbierz 15 × Spaczone Zioła — truciciel potrzebuje ich do odtrutki na truciznę swojego dawnego ucznia.",
        next: "choice",
      },
      choice: {
        text: "Odtrutka jest gotowa. Truciciel trzyma dwie fiolki — jedną z lekarstwem, drugą, o której nie wspominał wcześniej, z czymś znacznie silniejszym. „Mogę uzdrowić chorych. Albo mogę użyć tego, czego się nauczyłem, żeby odnaleźć go i zakończyć to na dobre, zanim skrzywdzi kogoś jeszcze.”",
        options: [
          {
            label: "Skup się na leczeniu chorych",
            resultText: "Rozdajecie odtrutkę wszystkim, których dosięgła trucizna dawnego ucznia, dom po domu, bez pytania o zapłatę. Truciciel wygląda na wyczerpanego, ale spokojniejszego niż od tygodni. „Uczeń może poczekać. Oni nie mogli.”",
            bonusStat: { key: "int", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Wytrop dawnego ucznia i użyj przeciw niemu jego własnej broni",
            resultText: "Zostawiacie leczenie na później i ruszacie tropem dawnego ucznia. Znajdujecie go szybciej, niż się spodziewał — truciciel kończy sprawę jego własną recepturą, obróconą przeciwko niemu. Skuteczne. Ale zimniejsze, niż truciciel kiedykolwiek chciał być.",
            corruption: 8,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Truciciel warzy dla ciebie osobny eliksir na sznurku, mieszankę, którą nazywa „podwójną receptą” — trucizna i lekarstwo w jednej fiolce, do wyboru w zależności od potrzeby. „Rzadko mam okazję dawać komuś wybór, zamiast go odbierać.”"],
        reward: { itemId: "companion_truciciel_amulet" },
        final: true,
      },
      resolution_dark: {
        text: ["Truciciel wciąż warzy dla ciebie podwójną recepturę — mówi, że po tym, co zrobił dawnemu uczniowi, sam potrzebuje przypomnienia, że lekarstwo wciąż jest opcją, nie tylko trucizna."],
        reward: { itemId: "companion_truciciel_amulet" },
        final: true,
      },
    },
  },

  "Medyk": {
    name: "Wybór, Którego Nie Uczono w Szkole",
    icon: "💊",
    stages: {
      start: {
        text: [
          "Do obozu przybiega posłaniec z pobliskiej osady — gorączka rozprzestrzenia się szybciej, niż ktokolwiek zdąży opatrzeć. Medyk blednie. „Za mało rąk, za mało zapasów. Będę musiał wybierać, komu pomóc najpierw. Nie uczono mnie tego w żadnej szkole.”",
          "„Zbierz ze mną tyle Fiolek Światła, ile się da. Im więcej ich będę mieć, tym mniej wyborów będę musiał podejmować na miejscu — a te, które zostaną, będą wystarczająco ciężkie.”",
        ],
        next: "objective",
      },
      objective: {
        progressType: "resource",
        currency: "Fiolki Światła",
        goal: 15,
        text: "Zbierz 15 × Fiolki Światła — medyk potrzebuje jak największego zapasu, zanim dotrze do osady dotkniętej gorączką.",
        next: "choice",
      },
      choice: {
        text: "Nawet z pełnym zapasem fiolek liczby się nie zgadzają — chorych jest więcej, niż medyk zdoła uratować w porę. Musi wybrać: rozdzielić lekarstwo równo między wszystkich, ryzykując, że nikt nie dostanie dość, albo skupić się na tych, którzy mają największe szanse przeżyć. „Powiedz mi, co robić. Nie potrafię zdecydować sam.”",
        options: [
          {
            label: "Rozdziel lekarstwo równo między wszystkich",
            resultText: "Dzielicie fiolki po równo, dom po domu, bez wyjątków. Część chorych i tak nie przeżywa — dawka była zbyt słaba dla najciężej dotkniętych — ale nikt nie może powiedzieć, że medyk kogokolwiek spisał na straty. Wraca z obozu wyczerpany, ale z czystym sumieniem.",
            bonusStat: { key: "cha", amount: 1 },
            next: "resolution_light",
          },
          {
            label: "Skup lekarstwo na tych, którzy mają szansę",
            resultText: "Medyk podejmuje decyzję, jakiej nienawidzi — koncentruje fiolki na chorych z realną szansą przeżycia, zostawiając resztę bez pomocy. Ratuje więcej istnień w liczbach bezwzględnych. Nie odzywa się do nikogo przez całą drogę powrotną.",
            corruption: 10,
            next: "resolution_dark",
          },
        ],
      },
      resolution_light: {
        text: ["Osada, ocalona choćby częściowo, składa się na prezent dla medyka — kamizelkę wzmocnioną szkłem z rozbitych fiolek, które opróżnił, by ich ratować. Wręcza ją tobie. „Nie zasłużyłem na to bardziej niż ty, który zbierałeś dla mnie te fiolki.”"],
        reward: { itemId: "companion_medyk_kamizelka" },
        final: true,
      },
      resolution_dark: {
        text: ["Medyk wciąż wręcza ci kamizelkę wzmocnioną szkłem z fiolek — mówi, że skoro musiał policzyć, ile istnień jest „warte” ratowania, przynajmniej niech coś z tego dnia posłuży ochronie kogoś, kogo nie musi już wybierać."],
        reward: { itemId: "companion_medyk_kamizelka" },
        final: true,
      },
    },
  },
};
