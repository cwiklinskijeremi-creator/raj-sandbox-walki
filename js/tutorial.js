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
      "Każda lokacja wyprawy ma inną pulę przeciwników, dominujący typ terenu (skały/drzewa/woda) oraz inny surowiec przyznawany za zwycięstwo — warto odwiedzać różne miejsca, żeby zebrać komplet zasobów potrzebnych u kupca.",
      "Po wybraniu lokacji nie trafiasz od razu do walki — najpierw przechodzisz przez kilka komnat lochu. Puste korytarze to tylko klimat, znaleziska dają dodatkowy surowiec, a pułapki mogą Cię zranić jeszcze przed starciem — obrażenia z pułapek przechodzą na Twoje HP w nadchodzącej walce, więc lepiej nie liczyć na szczęście za każdym razem.",
    ],
  },
  combat: {
    icon: "⚔️",
    title: "Walka",
    paragraphs: [
      "Na początku walki rozstawiasz postać, klikając dowolne wolne pole w swojej strefie (trzy lewe kolumny) — przeciwnicy rozstawiają się automatycznie.",
      "Każda tura to pula akcji (zależna od ZRE) — ruch o jedno pole i atak/umiejętność/zmiana broni kosztują po jednej akcji. Atak wymaga, żeby cel był w zasięgu broni; jeśli nie jest, podejdź bliżej albo kliknij swój token, żeby otworzyć menu zmiany broni lub rzucenia umiejętności specjalizacji.",
      "Obrażenia liczone są z dwóch kostek: K6 trafia w część ciała (nogi/ręce/brzuch/klatka/głowa — głowa to krytyk x2), a K20 daje mnożnik obrażeń. Sojusznik stojący dokładnie po przeciwnej stronie celu daje +15% obrażeń (flankowanie), a przeszkoda na linii strzału przy ataku dystansowym daje celowi -25% obrażeń (osłona).",
      "Walki są brutalne — nie ma auto-leczenia w trakcie starcia, więc każde trafienie się liczy.",
      "Przycisk „🧊 Widok 3D” przełącza planszę w widok trójwymiarowy — to ta sama walka, tylko inaczej pokazana. Brązowe wzniesienia to skały, wysokie zielone bloki to drzewa, niebieskie pola to jeziora; złota kula to Ty, czerwone stożki to przeciwnicy. Klikasz pola tak samo jak w 2D, a myszą obracasz kamerę (przeciągnięcie) i przybliżasz (przewinięcie). „🗺️ Widok 2D” wraca do klasycznej planszy.",
    ],
  },
  progression: {
    icon: "🎒",
    title: "Ekwipunek i rozwój",
    paragraphs: [
      "Zwycięstwo przynosi surowiec danej lokacji oraz punkty doświadczenia (PD) — im mocniejsi pokonani przeciwnicy, tym więcej PD. Kolejne poziomy wymagają coraz więcej PD i dają +3 punkty statystyk do rozdania w obozie.",
      "W „🎒 Ekwipunek i postać” (dostępnym z obozu) widzisz pełne statystyki, zakładasz zbroje i amulety kupione u kupca obozowego za zebrane surowce, oraz rozdzielasz niewydane punkty statystyk. Surowce i ekwipunek zostają na koncie nawet po rozpoczęciu nowej gry — resetuje się tylko poziom, doświadczenie i punkty statystyk aktualnej postaci.",
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
