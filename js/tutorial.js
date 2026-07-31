const TUTORIAL_TABS = [
  { key: "basics", label: "Podstawy" },
  { key: "creation", label: "Tworzenie postaci" },
  { key: "camp", label: "Obóz i wyprawy" },
  { key: "combat", label: "Walka" },
  { key: "progression", label: "Ekwipunek i rozwój" },
  { key: "saves", label: "Zapisy" },
];

const TUTORIAL_DATA = {
  basics: {
    icon: "🎯",
    title: "Podstawy",
    paragraphs: [
      "Raj to taktyczna gra turowa osadzona w mrocznym świecie Aetherionu — walczysz na heksagonalnej siatce, gdzie pozycja, zasięg broni i teren decydują o wyniku starcia.",
      "Pętla rozgrywki wygląda tak: w obozie tworzysz i rozwijasz postać, wyruszasz na wyprawę do wybranej lokacji, walczysz z przeciwnikami, a po walce wracasz do obozu z surowcami i doświadczeniem, które wydajesz na ekwipunek i punkty statystyk przed kolejną wyprawą.",
    ],
  },
  creation: {
    icon: "🧝",
    title: "Tworzenie postaci",
    paragraphs: [
      "Przy „Nowa gra” najpierw tworzysz postać: wpisujesz imię, wybierasz płeć, a następnie klasę i specjalizację — kliknięcie ikony klasy centruje ją i powiększa, a poniżej pojawia się opis wybranej specjalizacji wraz z jej bronią i umiejętnością.",
      "Masz do rozdania 10 punktów statystyk (STR/WYT/ZRE/INT/CHA) na bazie wybranej specjalizacji — dodatkowe punkty do WYT i STR zwiększają też HP. Klasa i imię są ustalane raz na całą grę — nie da się ich zmienić w trakcie walki.",
    ],
  },
  camp: {
    icon: "🏕️",
    title: "Obóz i wyprawy",
    paragraphs: [
      "Obóz Gildii to Twoja baza — stąd wyruszasz na wyprawy, przeglądasz ekwipunek i postać, oraz zaglądasz do kodeksu świata. Po zakończonej walce (zwycięskiej lub nie) wracasz właśnie tutaj.",
      "„📋 Tablica zadań” pokazuje proste cele Gildii wraz z paskiem postępu: pokonaj 5 przeciwników, osiągnij 3. poziom i odkryj 3 różnych przeciwników w Bestiariuszu. Każde zadanie da się odebrać tylko raz, a nagroda to zawsze porcja jednego z surowców.",
      "„👥 Drużyna” pokazuje Twoich towarzyszy (maks. 3, zawsze innej klasy niż Twoja). W dwóch losowych miejscach w mieście Aetherion czekają potencjalni rekruci — każdy ma własny, osobisty powód, dla którego chce Cię najpierw wypróbować: jedni każą pokonać określoną liczbę przeciwników, inni żądają osiągnięcia konkretnego poziomu doświadczenia, odkrycia kilku stworzeń w Bestiariuszu albo zebrania określonej ilości jednego z surowców. Pasek postępu i opis zadania pokazują dokładnie, o co chodzi danemu rekrutowi. Po osiągnięciu celu przycisk zmienia się w „Porozmawiaj” — otwiera krótką scenę dialogową: powitanie, nieoczekiwana komplikacja i jej rozwiązanie wspólnym wysiłkiem, a na koniec przycisk „Przyjmij do drużyny” faktycznie werbuje rekruta (jeśli jest miejsce). Rekruci zmieniają się przy każdej nowej wyprawie, więc jeśli kogoś przegapisz, pojawi się ktoś inny. W walce towarzysze poruszają się i atakują automatycznie najbliższego wroga — przeciwnicy też mogą wybrać ich jako cel zamiast Ciebie. Przycisk „🎒 Ekwipunek” przy każdym towarzyszu otwiera jego własne sloty i pozwala założyć na niego dowolny przedmiot z Twojego plecaka — ekwipunek to jedna wspólna pula Gildii, więc dany przedmiot noszą naraz Ty albo jeden z towarzyszy, nigdy dwoje na raz.",
      "Każda lokacja wyprawy ma inną pulę przeciwników, dominujący typ terenu (skały/drzewa/woda) oraz inny surowiec przyznawany za zwycięstwo — warto odwiedzać różne miejsca, żeby zebrać komplet zasobów potrzebnych u kupca.",
      "Po wybraniu lokacji nie trafiasz od razu do walki — najpierw przechodzisz przez kilka komnat lochu, a w każdej z nich wybierasz między opcją bezpieczną a ryzykowną. Cichy korytarz możesz przeszukać (szansa na drobny łup, bez ryzyka) albo iść dalej. Pułapkę możesz rozbroić (łup przy sukcesie, obrażenia przy porażce) albo bezpiecznie ominąć. Znalezisko możesz zbadać dokładnie (większa nagroda, ale ryzyko pułapki) albo zabrać szybko i bezpiecznie. Zasadzkę możesz stoczyć (doświadczenie i surowiec przy zwycięstwie, obrażenia przy porażce) albo ominąć. Zapomniany ołtarz przyjmie ofiarę z Twojego zdrowia w zamian za tymczasowe wzmocnienie pancerza na nadchodzącą walkę.",
      "Obrażenia z nieudanych wyborów przechodzą na Twoje HP w nadchodzącej walce, więc ryzykowne opcje naprawdę coś kosztują, jeśli się nie powiedzie.",
      "Czasem (rzadko) po trzech komnatach trafisz na 👑 Komnatę Bossa — unikalnego, dużo silniejszego przeciwnika z własną zdolnością specjalną, właściwego dla danej lokacji. Możesz go wyzwać od razu (samotna, ciężka walka, ale potrójna nagroda surowców za zwycięstwo) albo odejść i zmierzyć się ze zwykłą walką jak zawsze.",
    ],
  },
  combat: {
    icon: "⚔️",
    title: "Walka",
    paragraphs: [
      "Na początku walki rozstawiasz postać, klikając dowolne wolne pole w swojej strefie (trzy lewe kolumny) — przeciwnicy rozstawiają się automatycznie.",
      "Każda tura to pula akcji (zależna od ZRE) — ruch o jedno pole i atak/umiejętność/zmiana broni kosztują po jednej akcji. Atak wymaga, żeby cel był w zasięgu broni; jeśli nie jest, podejdź bliżej albo kliknij swój token, żeby otworzyć menu zmiany broni, rzucenia jednej z dwóch umiejętności specjalizacji lub wypicia mikstury.",
      "Każda specjalizacja ma dwie unikalne umiejętności, nie tylko zwykły atak na dystans — do wyboru: odpryski ognia na sąsiednie cele, osłabienie pancerza wroga, samoleczenie, wysysanie HP z celu, ignorowanie pancerza, chwilowe wzmocnienie statystyki, gwarantowane trafienie krytyczne albo trucizna zadająca obrażenia co turę (także w formie trującego oparu na kilka celów naraz). Obie umiejętności mają osobne odnowienie na kilka tur — czas odnowienia widać w menu i w opisie specjalizacji przy tworzeniu postaci.",
      "Obrażenia liczone są z dwóch kostek: K6 trafia w część ciała (nogi/ręce/brzuch/klatka/głowa — głowa to krytyk x2), a K20 daje mnożnik obrażeń. Sojusznik stojący dokładnie po przeciwnej stronie celu daje +15% obrażeń (flankowanie), a przeszkoda na linii strzału przy ataku dystansowym daje celowi -25% obrażeń (osłona).",
      "Walki są brutalne — nie ma auto-leczenia w trakcie starcia, więc każde trafienie się liczy. Jedynym ratunkiem są mikstury: kliknij swój token, żeby otworzyć menu, i wybierz „🧪 Mikstury” — otworzy się plecak z eliksirami kupionymi u zielarza w obozie. Wypicie kosztuje jedną akcję, tak jak atak, ruch czy rzucenie czaru.",
      "Przycisk „🧊 Widok 3D” przełącza planszę w widok trójwymiarowy — to ta sama walka, tylko inaczej pokazana. Brązowe wzniesienia to skały, wysokie zielone bloki to drzewa, niebieskie pola to jeziora; złota kula to Ty, czerwone stożki to przeciwnicy. Klikasz pola tak samo jak w 2D, a myszą obracasz kamerę (przeciągnięcie) i przybliżasz (przewinięcie). „🗺️ Widok 2D” wraca do klasycznej planszy.",
    ],
  },
  progression: {
    icon: "🎒",
    title: "Ekwipunek i rozwój",
    paragraphs: [
      "Zwycięstwo przynosi surowiec danej lokacji oraz punkty doświadczenia (PD) — im mocniejsi pokonani przeciwnicy, tym więcej PD. Kolejne poziomy wymagają coraz więcej PD i dają +3 punkty statystyk do rozdania w obozie.",
      "W „🎒 Ekwipunek i postać” (dostępnym z obozu) widzisz pełne statystyki, zakładasz zbroje i amulety kupione u kupca obozowego za zebrane surowce, oraz rozdzielasz niewydane punkty statystyk. Tam samo znajdziesz też zielarza — sprzedaje mikstury lecznicze i eliksiry chwilowo wzmacniające SIŁ/WYT/pancerz, które trafiają do plecaka i czekają na użycie w trakcie walki.",
      "Sloty Lewa ręka/Prawa ręka mogą trzymać nie tylko naramienniki i bransolety, ale też prawdziwe bronie sprzedawane u różnych kupców — po założeniu dołączają do puli broni dostępnej przez „🔁 Zmień broń” w menu tokenu, więc możesz mieć więcej niż dwie opcje ataku o różnym zasięgu i obrażeniach.",
      "„🏙️ Miasto Aetherion” (dostępne z obozu) kryje kilka budynków, każdy z własnym sklepem i usługą: ⚒️ Kuźnia Gildii Rzemieślników sprzeda unikalny ekwipunek, ale przede wszystkim ulepszy każdy przedmiot, który już posiadasz (do 3 poziomów, coraz droższych, każdy dodaje +25% do jego bonusu). ⛪ Świątynia Zakonu Światła oferuje własny towar oraz „Oczyszczenie Wspomnień” — za surowce zwraca wszystkie wydane punkty statystyk do ponownego rozdania, jeśli chcesz przebudować postać.",
      "⚔️ Arena Krwi pozwala stoczyć natychmiastową walkę z losowym przeciwnikiem bez wyprawy i lochu — mniejsza nagroda, ale zero ryzyka po drodze i można wracać w kółko. 🏴 Czarny Rynek kupi z powrotem niepotrzebny ekwipunek i mikstury (za połowę pierwotnej ceny) i sprzedaje kilka unikalnych, przemyconych przedmiotów. 🍺 Tawerna Pod Pękniętym Kryształem oferuje grę w kości — stawiasz dowolny posiadany surowiec, a rzut K20 decyduje: 1-8 przegrywasz zakład, 9-14 remis, 15-20 podwajasz stawkę.",
      "Surowce, ekwipunek i mikstury zostają na koncie nawet po rozpoczęciu nowej gry — resetuje się tylko poziom, doświadczenie i punkty statystyk aktualnej postaci.",
      "Przeciwnicy skalują się razem z Tobą — im wyższy Twój poziom, tym więcej mają HP, STR, WYT, pancerza i przebicia, więc wyprawy pozostają wyzwaniem nawet gdy postać mocno się rozwinie.",
    ],
  },
  saves: {
    icon: "💾",
    title: "Zapisy",
    paragraphs: [
      "Gra zapisuje stan automatycznie po każdej akcji, więc możesz spokojnie zamknąć kartę w dowolnym momencie.",
      "„Wznów” w menu głównym błyskawicznie wraca do miejsca, w którym skończyłeś. „Wczytaj grę” robi to samo, ale najpierw pokazuje podsumowanie zapisu do potwierdzenia. „Nowa gra” zaczyna od tworzenia nowej postaci (zasoby i ekwipunek zostają). „Wyczyść cały postęp” w Ustawieniach kasuje wszystko bezpowrotnie.",
    ],
  },
};
