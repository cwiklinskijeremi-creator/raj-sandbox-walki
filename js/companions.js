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

// Small ambient reactions shown in the companion sheet (js/ui.js:
// renderCompanionSheet) — corruptionLine fires once the player's own
// spaczenie crosses CORRUPTION_EPILOGUE_HIGH_THRESHOLD (js/prologue.js),
// story{Light,Dark}Line reflects how that companion's own personal thread
// (js/companionStory.js) resolved. Story reaction takes priority over the
// corruption one when both apply — it is the more specific, earned reaction.
const COMPANION_REACTIONS = {
  "Arcymag": {
    corruptionLine: "Widzę zmianę w tobie, jakiej nie da się cofnąć zaklęciem. Nawet ja nie mam na to receptury.",
    storyLightLine: "Odkąd spaliliśmy ten tom, śpię lepiej. Dziękuję, że pomogłeś mi wybrać spokój zamiast wiedzy.",
    storyDarkLine: "Czasem po nocach słyszę ten szept, o którym ci mówiłem. Cieszę się, że przynajmniej nie słyszę go sam.",
  },
  "Apostata": {
    corruptionLine: "Rozpoznaję ten ciężar w twoich oczach. Otchłań szepcze do ciebie tak, jak kiedyś do mnie.",
    storyLightLine: "Od czasu zerwania paktu czuję się bardziej sobą, niż od lat. To wciąż twoja zasługa.",
    storyDarkLine: "Pakt, który pogłębiliśmy, wciąż trzyma się mocno. Mam nadzieję, że nie pożałujesz, że mi pomogłeś.",
  },
  "Świetlisty obrońca": {
    corruptionLine: "Zakon nazwałby to, co widzę na twojej skórze, herezją. Ja nazywam to twoim wyborem, nie moim.",
    storyLightLine: "Rodzina, którą ukryliśmy przed Zakonem, wciąż żyje bezpiecznie. Złamałem przysięgę i nie żałuję.",
    storyDarkLine: "Wciąż myślę o tej rodzinie, którą zgłosiłem zgodnie z prawem. Litera prawa nie koi sumienia tak, jak sądziłem.",
  },
  "Mroczny rycerz": {
    corruptionLine: "Widziałem, co spaczenie robi z ludźmi silniejszymi od ciebie. Uważaj, komu oddajesz swoje ciało.",
    storyLightLine: "Puściłem wolno dawnego brata broni dzięki tobie. Nie wiem, czy to mądrość, czy słabość — ale czuję się lżejszy.",
    storyDarkLine: "Zabiliśmy go razem, bez wahania. Nie żałuję tego czynu tak bardzo, jak sądziłem, że będę.",
  },
  "Najemnik bractwa": {
    corruptionLine: "Bractwo płaci dobrze za ciała takie jak twoje, zanim spaczenie zrobi z nich coś bezużytecznego. Pilnuj się.",
    storyLightLine: "Odrzuciłem tamten kontrakt bez nazwiska dzięki tobie. Bractwo wciąż na mnie krzywo patrzy, ale sypiam spokojnie.",
    storyDarkLine: "Kontrakt wykonany, zapłata odebrana. Nie pytaj, co dokładnie zrobiliśmy temu kupcowi — lepiej dla nas obojga.",
  },
  "Berserk": {
    corruptionLine: "Czuję furię inną niż moją, kiedy jesteś blisko. Spaczenie i szał to bliscy kuzyni, wiedziałeś?",
    storyLightLine: "Ta dyscyplina oddechu, którą razem ćwiczymy, naprawdę działa. Pamiętam teraz każdą bitwę do końca.",
    storyDarkLine: "Przestałem walczyć z furią, tak jak radziłeś. Jest szybsza, silniejsza — i coraz trudniej ją odróżnić ode mnie.",
  },
  "Łowca": {
    corruptionLine: "Tropię zwierzynę od lat i rozpoznaję zmianę zapachu. Ty pachniesz teraz inaczej, niż powinieneś.",
    storyLightLine: "Ta nieznana bestia wciąż żyje w swojej jaskini dzięki tobie. Rejestr zyskał wpis, a ona życie. Dobry układ.",
    storyDarkLine: "Ubiliśmy ją szybko, zanim zdążyła kogoś skrzywdzić. Wciąż myślę, czy to było naprawdę konieczne.",
  },
  "Skrytobójca": {
    corruptionLine: "W cieniu widać więcej, niż myślisz. To, co rośnie w tobie, nie jest już całkiem ludzkie.",
    storyLightLine: "Ten chłopak z kontraktu wciąż gdzieś tam żyje razem z matką, dzięki tobie. Rzadko żałuję litości — tym razem nie żałuję wcale.",
    storyDarkLine: "Kontrakt dokończony, tak jak mnie nauczono. Staram się nie myśleć o tym chłopcu i jego matce.",
  },
  "Truciciel": {
    corruptionLine: "Znam się na truciznach lepiej niż ktokolwiek — i to, co widzę w tobie, nie jest żadną z moich receptur.",
    storyLightLine: "Uratowaliśmy razem tę osadę, zamiast ścigać mojego dawnego ucznia. Sypiam spokojniej, wiedząc, że wybrałem dobrze.",
    storyDarkLine: "Dopadliśmy go jego własną trucizną. Skuteczne, owszem. Wciąż nie czuję się z tym tak dobrze, jak sądziłem.",
  },
  "Medyk": {
    corruptionLine: "Badałam niejedno ciało dotknięte spaczeniem. Twoje zmienia się szybciej, niż powinno — uważaj na siebie.",
    storyLightLine: "Rozdzieliliśmy lekarstwo równo między wszystkich w tamtej osadzie. Niektórzy i tak nie przeżyli, ale nikogo nie spisaliśmy na straty.",
    storyDarkLine: "Musiałam wybierać, komu pomóc najpierw. Ocaliłam więcej istnień niż inaczej — ale wciąż widzę twarze tych pominiętych.",
  },
};

// Party banter — a curated set of exchanges between specific pairs of
// specializations, triggered once each at the start of a battle when both
// are in the active party (main.js: maybeTriggerCompanionBanter(), fired
// from startNewBattle()). Not every one of the 45 possible pairs has an
// entry — only the combinations with enough friction or chemistry to be
// worth writing, same "curated over exhaustive" scope call as elsewhere
// this session. Key is the two subclass names alphabetically sorted and
// joined with "|" (order-independent lookup), value is the exchange in
// speaking order — each line's `speaker` picks out whichever of the two
// present companions holds that subclass, so the dialogue itself stays
// gender-neutral quoted speech (no narrator verb to conjugate).
const COMPANION_BANTER = {
  "Mroczny rycerz|Świetlisty obrońca": [
    { speaker: "Świetlisty obrońca", text: "Czuję krew twojego miecza stąd. Zemsta nie jest ścieżką, którą Zakon by pochwalił." },
    { speaker: "Mroczny rycerz", text: "Twój Zakon chował zbiegów z kopalni i nazywał to miłosierdziem. Nie potrzebuję jego pochwały." },
    { speaker: "Świetlisty obrońca", text: "...Może masz rację. Ale wciąż wolę stać obok ciebie niż naprzeciw." },
  ],
  "Apostata|Świetlisty obrońca": [
    { speaker: "Świetlisty obrońca", text: "Czuję Otchłań na twojej skórze. Nie wiem, jak śpisz spokojnie, wiedząc, czym się zajmujesz." },
    { speaker: "Apostata", text: "A ja nie wiem, jak ty śpisz, wiedząc, ile Zakon przemilczał w imię tego samego spokoju." },
    { speaker: "Świetlisty obrońca", text: "Może żadne z nas nie śpi tak dobrze, jak udaje." },
  ],
  "Berserk|Skrytobójca": [
    { speaker: "Berserk", text: "Skradasz się, szepczesz, znikasz. Nudne. Ja wolę, żeby wróg wiedział, że nadchodzę." },
    { speaker: "Skrytobójca", text: "Ja wolę, żeby wróg w ogóle się nie dowiedział, że przyszłam. Twój sposób zostawia więcej blizn." },
    { speaker: "Berserk", text: "Blizny się liczą. Cisza nie zostawia niczego, czym można się pochwalić." },
  ],
  "Najemnik bractwa|Skrytobójca": [
    { speaker: "Najemnik bractwa", text: "Bractwo bierze kontrakt, wykonuje robotę, płaci się uczciwie. Twoja robota nie ma takich zasad." },
    { speaker: "Skrytobójca", text: "Moja robota ma zasady — po prostu nie zapisuje się ich w księgach Gildii." },
    { speaker: "Najemnik bractwa", text: "Uczciwe. Dopóki żadna z tych niezapisanych zasad nie dotyczy mnie." },
  ],
  "Truciciel|Łowca": [
    { speaker: "Łowca", text: "Widziałam, co Spaczone Zioła robią zwierzynie, którą zbierasz. To nie jest polowanie, to trucie na zapas." },
    { speaker: "Truciciel", text: "To nie polowanie, zgadza się. To medycyna, która czasem wygląda jak trucizna, zanim zdąży komuś pomóc." },
    { speaker: "Łowca", text: "Dopilnuj, żeby ta różnica nie umknęła ci w złym momencie." },
  ],
  "Apostata|Arcymag": [
    { speaker: "Arcymag", text: "Twoja magia cuchnie Otchłanią na milę. Nie rozumiem, jak ktoś może świadomie wybrać takie źródło mocy." },
    { speaker: "Apostata", text: "A ja nie rozumiem, jak ktoś może studiować potwory z bezpiecznej odległości bibliotecznego regału." },
    { speaker: "Arcymag", text: "Uczciwa wymiana zarzutów. Może to jest podstawa jakiegoś szacunku." },
  ],
  "Berserk|Mroczny rycerz": [
    { speaker: "Mroczny rycerz", text: "Twoja furia jest chaotyczna. Moja zimna. Ciekawe, które z nas skrzywdzi więcej niewłaściwych ludzi." },
    { speaker: "Berserk", text: "Moja przynajmniej krzyczy, zanim uderzy. Twoja podkrada się jak zdrada, o której lubisz gadać." },
    { speaker: "Mroczny rycerz", text: "...Trafione. Może dlatego wolę walczyć obok ciebie niż obok kogoś cichego." },
  ],
  "Medyk|Świetlisty obrońca": [
    { speaker: "Świetlisty obrońca", text: "Twoje ręce ratują więcej istnień niż moje ostrze kiedykolwiek zdoła. Zazdroszczę ci tego czasem." },
    { speaker: "Medyk", text: "Twoje ostrze pozwala mi w ogóle dotrzeć do rannych, zanim będzie za późno. Nie ma tu powodu do zazdrości." },
    { speaker: "Świetlisty obrońca", text: "Może po prostu dobrze się uzupełniamy. Zapiszę to jako błogosławieństwo, nie przypadek." },
  ],
  "Arcymag|Skrytobójca": [
    { speaker: "Skrytobójca", text: "Nigdy nie rozumiałam magów. Cała ta moc, a i tak wolicie czytać o niej, zamiast jej używać na ulicy." },
    { speaker: "Arcymag", text: "Ulica nie wybacza błędów tak, jak biblioteka. Wolę zrozumieć zaklęcie, zanim ono zrozumie mnie — źle." },
    { speaker: "Skrytobójca", text: "Rozsądne. Nudne, ale rozsądne." },
  ],
  "Medyk|Truciciel": [
    { speaker: "Medyk", text: "Warzysz trucizny w tym samym moździerzu, w którym ja warzę lekarstwa. To mnie nie uspokaja." },
    { speaker: "Truciciel", text: "To ten sam moździerz, bo to ta sama wiedza. Różnica to tylko proporcje i intencja." },
    { speaker: "Medyk", text: "Intencja, którą znasz tylko ty. Pilnuj proporcji, dla nas obojga." },
  ],
  "Mroczny rycerz|Łowca": [
    { speaker: "Łowca", text: "Tropię aberracje many dla Gildii. Czasem trudno mi znaleźć różnicę między nimi a klątwami, którymi walczysz." },
    { speaker: "Mroczny rycerz", text: "Różnica jest taka, że ja wciąż wybieram, kogo nimi tnę. Aberracja nie wybiera niczego." },
    { speaker: "Łowca", text: "Dopilnuj, żeby ten wybór wciąż coś dla ciebie znaczył. Ja będę patrzeć." },
  ],
  "Najemnik bractwa|Łowca": [
    { speaker: "Najemnik bractwa", text: "Gildia Poszukiwaczy płaci w ochłapach esencji. Bractwo płaci w srebrze. Kiedyś zapytam, dlaczego wybrałaś gorszy interes." },
    { speaker: "Łowca", text: "Bo wasze srebro nie kupuje mi tego, czego szukam między drzewami. Twój kontrakt kończy się na zapłacie. Mój nie." },
    { speaker: "Najemnik bractwa", text: "Romantyczne. I tak zapytam o cenę, jeśli kiedyś się znudzisz." },
  ],
  "Arcymag|Łowca": [
    { speaker: "Arcymag", text: "Tropisz aberracje po zapachu i śladach. Ja bym po prostu przeczytał, czym są, zanim wyruszyłbym w las." },
    { speaker: "Łowca", text: "Księgi się mylą, kiedy aberracja zmieni się, zanim ktoś zdąży ją opisać. Ślady nie kłamią." },
    { speaker: "Arcymag", text: "Uczciwy argument. Może przy następnej wyprawie zabiorę notatnik zamiast tomu teorii." },
  ],
  "Apostata|Łowca": [
    { speaker: "Łowca", text: "Tropię aberracje many, żeby Gildia mogła spać spokojnie. Czasem zastanawiam się, czy pewnego dnia nie dopiszą cię do mojej listy." },
    { speaker: "Apostata", text: "Dopiszą, jeśli kiedyś przestanę panować nad tym, co pożyczyłem od Otchłani. Na razie to ja panuję, nie ono." },
    { speaker: "Łowca", text: "'Na razie' to niewiele, ale wystarczy, żebym na razie odłożyła kuszę." },
  ],
  "Najemnik bractwa|Truciciel": [
    { speaker: "Najemnik bractwa", text: "Ufam stali, bo wiem, jak pęka. Twoim fiolkom nie ufam, bo nigdy nie wiem, co jest w środku, dopóki nie jest za późno." },
    { speaker: "Truciciel", text: "Stal też nie mówi, zanim wbije się między żebra. Fiolka przynajmniej daje ci wybór, czy ją wypić." },
    { speaker: "Najemnik bractwa", text: "Zapamiętam to jako 'nie', na wszelki wypadek." },
  ],
  "Medyk|Najemnik bractwa": [
    { speaker: "Medyk", text: "Leczę cię za darmo, kiedy krwawisz. Ty bierzesz zapłatę za każdą ranę, którą zadajesz komuś innemu. Nie rozumiem tej matematyki." },
    { speaker: "Najemnik bractwa", text: "Matematyka jest prosta: Bractwo płaci mi za ryzyko, nie za litość. Twoja litość to twój wybór, nie mój obowiązek." },
    { speaker: "Medyk", text: "Może. Ale kiedy następnym razem będziesz krwawić, zapamiętaj, kto nie wystawił ci rachunku." },
  ],
  "Najemnik bractwa|Świetlisty obrońca": [
    { speaker: "Świetlisty obrońca", text: "Bractwo Rzemieślników kuje broń dla Rady, która trzyma niewolników w kopalniach. Twoje ręce nie są czystsze niż moje." },
    { speaker: "Najemnik bractwa", text: "Przynajmniej nie nazywam tego miłosierdziem. Ty leczysz niewolników, żeby mogli wrócić do kopania, i wołasz to łaską." },
    { speaker: "Świetlisty obrońca", text: "...Może żadne z nas nie ma prawa patrzeć na drugie z góry. To niewygodna myśl, ale prawdziwa." },
  ],
  "Apostata|Truciciel": [
    { speaker: "Truciciel", text: "Zakon nazwałby nas oboje heretykami — ciebie za rytuały, mnie za fiolki. Różnica jest głównie kosmetyczna." },
    { speaker: "Apostata", text: "Różnica jest taka, że twoje fiolki czasem leczą. Moje rytuały nigdy nie miały takiej ambicji." },
    { speaker: "Truciciel", text: "Uczciwe. Ale oboje wiemy, że klient rzadko pyta o ambicje, tylko o skutek." },
  ],
  "Mroczny rycerz|Truciciel": [
    { speaker: "Mroczny rycerz", text: "Trucizna zabija po cichu, z ukrycia. Ja przynajmniej patrzę wrogowi w oczy, kiedy klątwa robi swoje." },
    { speaker: "Truciciel", text: "Klątwa krwi patrzy w oczy równie rzadko co fiolka w plecaku. Oboje wolimy, żeby wróg nie zdążył zareagować." },
    { speaker: "Mroczny rycerz", text: "...Może to prawda, której nie chciałem usłyszeć. Zapamiętam ją mimo to." },
  ],
  "Arcymag|Mroczny rycerz": [
    { speaker: "Arcymag", text: "Rada uczyła mnie, że honor to luksus, na który stać tylko tych, którzy nigdy nie musieli wybierać. Twoja pęknięta przysięga to potwierdza." },
    { speaker: "Mroczny rycerz", text: "Rada uczyła cię też, że twoja krew jest warta więcej niż moja. Też się myliła, tylko boleśniej." },
    { speaker: "Arcymag", text: "Nie mam na to odpowiedzi, która nie brzmiałaby jak wymówka. Więc jej nie szukam." },
  ],
  "Apostata|Berserk": [
    { speaker: "Berserk", text: "Mutacja z kopalń zrobiła ze mnie to, czym jestem. Ty wybrałeś Otchłań sam. Nie wiem, które z nas ma gorzej." },
    { speaker: "Apostata", text: "Ja przynajmniej wiedziałem, na co się piszę. Ty nie miałeś wyboru, a i tak Rada nazwie nas oboje tym samym słowem." },
    { speaker: "Berserk", text: "Tym samym słowem, ta sama klatka. Przynajmniej dzielimy ją z kimś, kto rozumie." },
  ],
  "Arcymag|Berserk": [
    { speaker: "Arcymag", text: "Twoja siła to niekontrolowana mutacja. Moja to lata studiów. Rada by powiedziała, że jedno z nas jest cywilizowane." },
    { speaker: "Berserk", text: "Rada powiedziałaby to, patrząc z bezpiecznej wieży. Niech spróbuje przetrwać dzień w kopalni z twoimi 'latami studiów'." },
    { speaker: "Arcymag", text: "...Punkt dla ciebie. Może różnica między nami jest mniejsza, niż uczono mnie wierzyć." },
  ],
  "Berserk|Medyk": [
    { speaker: "Medyk", text: "Jesteś najgorszym pacjentem, jakiego leczyłem. Wciąż walczysz, kiedy powinieneś już dawno leżeć." },
    { speaker: "Berserk", text: "Furia nie pyta, czy rana jest wystarczająco głęboka, żeby przestać. Pytaj ją, nie mnie." },
    { speaker: "Medyk", text: "Będę pytać ciebie, bo furia nie odpowiada na bandaże. Zwolnij chociaż raz, dla mnie." },
  ],
  "Skrytobójca|Świetlisty obrońca": [
    { speaker: "Świetlisty obrońca", text: "Zabijasz po cichu, bez procesu, bez modlitwy. Nie zostawiasz nawet chwili na skruchę." },
    { speaker: "Skrytobójca", text: "Twój Zakon leczy niewolników, żeby mogli wrócić do kopania, i nazywa to łaską. Ja przynajmniej nie udaję, że to co robię, jest miłosierdziem." },
    { speaker: "Świetlisty obrońca", text: "...Trudno się z tym nie zgodzić. Może uczciwość bez złudzeń jest warta więcej niż modlitwa, której nikt nie słucha." },
  ],
  "Medyk|Skrytobójca": [
    { speaker: "Medyk", text: "Obie nasze ręce są precyzyjne. Różnica jest taka, że moje coś naprawiają, a twoje coś kończą." },
    { speaker: "Skrytobójca", text: "Czasem kończę coś, co ty nie zdążyłabyś naprawić na czas. To też forma litości, tylko szybszej." },
    { speaker: "Medyk", text: "Nie nazwę tego litością. Ale przyznaję, że nie zawsze mam lepszą odpowiedź niż twoja." },
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
  companion.gender = Math.random() < 0.5 ? "Mężczyzna" : "Kobieta";
  companion.baseName = name;
  companion.equipped = defaultEquippedState();
  companion.bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  companion.unlockedTalentIds = [];
  return companion;
}

// Recomputes every stat fresh from the subclass's fixed base numbers rather
// than multiplying the companion's current (already-scaled) stats — since
// companions persist across battles unlike freshly-created enemies, a
// scaleEnemyForLevel-style in-place multiply would compound every battle.
// Equipment and talent bonuses are folded in the same way
// buildPlayerCharacter() does it for the player, so gear/talents on a
// companion behave identically. bonusStats (player-allocated stat points,
// see adjustCompanionBonusStat() in main.js) are added flat, same treatment
// as equip/talent bonuses, not scaled by the level tier multiplier.
function scaleCompanionToLevel(companion, level) {
  if (!companion.equipped) companion.equipped = defaultEquippedState();
  if (!companion.bonusStats) companion.bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  if (!companion.unlockedTalentIds) companion.unlockedTalentIds = [];
  const cls = CLASS_DATA.find((c) => c.name === companion.className);
  const sub = cls.subclasses.find((s) => s.name === companion.subclassName);
  const tier = Math.max(0, level - 1);
  const statMult = 1 + tier * 0.10;
  const hpMult = 1 + tier * 0.12;
  const equipBonus = getEquipmentStatBonusesFor(companion.equipped);
  const talentBonus = getTalentStatBonusesFor(companion.unlockedTalentIds);
  const bonusStats = companion.bonusStats;

  const str = Math.round(sub.str * statMult) + bonusStats.str + equipBonus.str + talentBonus.str;
  const wyt = Math.round(sub.wyt * statMult) + bonusStats.wyt + equipBonus.wyt + talentBonus.wyt;
  const zre = Math.round(sub.zre * statMult) + bonusStats.zre + equipBonus.zre + talentBonus.zre;
  const int = Math.round(sub.int * statMult) + bonusStats.int + equipBonus.int + talentBonus.int;
  const cha = Math.round(sub.cha * statMult) + bonusStats.cha + equipBonus.cha + talentBonus.cha;
  const derived = computeDerivedStats({ zre, int, cha, przebicie: sub.przebicie });

  companion.str = str;
  companion.wyt = wyt;
  companion.zre = zre;
  companion.int = int;
  companion.cha = cha;
  companion.pancerz = sub.pancerz + equipBonus.pancerz + talentBonus.pancerz;
  companion.przebicie = derived.totalPrzebicie + equipBonus.przebicie + talentBonus.przebicie;
  companion.extraD20Rolls = derived.extraD20Rolls;
  companion.extraActions = derived.extraActions;
  companion.d6Bonus = derived.d6Bonus;
  companion.d20Bonus = derived.d20Bonus;
  companion.charismaExponent = derived.charismaExponent;
  companion.moveRange = derived.moveRange;
  companion.maxHP = Math.round(sub.hp * hpMult);
  companion.currentHP = companion.maxHP;
  companion.weapons = [...sub.weapons, ...getEquippedWeaponItemsFor(companion.equipped)];
  companion.statPointsAvailable = 10 + 3 * tier;
}
