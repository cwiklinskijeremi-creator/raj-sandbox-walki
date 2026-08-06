// Class-specific opening scenes, shown once right after character creation
// (Dragon Age: Origins-style) — four narrative beats each, ending with the
// character joining the Gildia Poszukiwaczy Przygód as a "new recruit,"
// which is where js/lore.js's shared world/city content picks up. Each
// prologue is written broadly enough to cover both subclasses of its class.
const CLASS_PROLOGUES = {
  "Mag": {
    icon: "🧙",
    title: "Krew Rady",
    beats: [
      "Jesteś piątym dzieckiem Arcymag Liriel Thalor, jednej z dziewięciu członków Rady Aetherionu. Od urodzenia korzystałeś z przywilejów elity — kryształowych komnat, niewolników do eksperymentów, nieograniczonego dostępu do esencji many. Ale prawo krwi Rady jest bezlitosne: tron dziedziczy pierwszy potomek o czystej esencji, a ty, piąty, jesteś jedynie rezerwą.",
      "Spiskowałeś latami przeciw starszemu rodzeństwu — trucizny w eliksirach, iluzje w snach, sabotaże rytuałów. Próba zabójstwa brata, Kaelona, nie powiodła się. Zdradził cię przyjaciel z lat studiów, Dorian Vex, donosząc Radzie za obietnicę stanowiska doradcy.",
      "Skazano cię na wieczne wygnanie poza mury Aetherionu — najgorszą karę dla maga. Siedem lat w piekle niekontrolowanej many odcisnęło piętno na twoim ciele i duszy: skóra poorana bliznami spaczenia, oczy lśniące fioletem.",
      "Wracasz teraz do Aetherionu — nie jako wygnaniec, lecz jako „nowy rekrut” Gildii Poszukiwaczy Przygód, ukrywając tożsamość pod magiczną zasłoną. Cel: zemsta na Dorianie i odzyskanie tego, co ci odebrano.",
    ],
  },
  "Paladyn": {
    icon: "🛡️",
    title: "Wiara, która pękła",
    beats: [
      "Zakon Światła zabrał cię do świątyni, gdy byłeś dzieckiem znalezionym wśród ruin skażonej wioski. Wychowali cię na wojownika wiary, ucząc, że każdy cios zadany aberracji many jest aktem miłosierdzia.",
      "Latami wierzyłeś, że „miłosierdzie” Zakonu jest szczere — aż zobaczyłeś księgi rachunkowe. Uzdrawiano tylko tych niewolników, którzy jeszcze mogli kopać; reszta trafiała do wspólnych mogił bez modlitwy.",
      "Kiedy odmówiłeś wykonania rozkazu — odesłania rannego dziecka z powrotem do kopalni zamiast go uzdrowić — starsi kapłani nazwali cię niewdzięcznikiem. Zdarłeś symbol Zakonu z napierśnika tej samej nocy.",
      "Teraz wstępujesz do Gildii Poszukiwaczy Przygód jako „nowy rekrut” — nie po to, by zapomnieć o swojej wierze, lecz by sprawdzić, czy poza murami świątyni miłosierdzie może jeszcze znaczyć to, czego cię nauczono.",
    ],
  },
  "Wojownik": {
    icon: "⚔️",
    title: "Ocalały z szybu",
    beats: [
      "Urodziłeś się w cieniu Kopalni Esencji, gdzie twoi rodzice kopali kryształy dla Rady, aż promieniowanie esencji strawiło ich ciała. Ty przetrwałeś dłużej niż większość — może dlatego, że twoje mięśnie zaczęły się zmieniać, zanim zabrakło ci sił.",
      "Nadzorcy zauważyli, że rany, które powinny cię zabić, tylko czyniły cię silniejszym. Zaczęli wystawiać cię do walk między niewolnikami dla rozrywki gości Rady — i za każdym razem wracałeś żywy, coraz bardziej obcy samemu sobie.",
      "Podczas zawalenia jednego z szybów, w chaosie, udało ci się uciec — nie dzięki planowi, tylko dzięki sile, której sam się bałeś. Nikt nie ścigał zbiegłego niewolnika o zniekształconych mięśniach; ludzie wolą udawać, że takich jak ty nie ma.",
      "Gildia Poszukiwaczy Przygód nie pyta o przeszłość, jeśli umiesz walczyć. Wstępujesz w jej szeregi jako „nowy rekrut” — z dala od kopalni, ale nigdy naprawdę wolny od tego, w co cię zmieniły.",
    ],
  },
  "Łotrzyk": {
    icon: "🗡️",
    title: "Cień, który przetrwał",
    beats: [
      "Dorastałeś w zaułkach pod kryształowymi wieżami Aetherionu, gdzie dzieci nie-magów uczą się kraść, zanim nauczą się czytać. Twoim nauczycielem był Czarny Rynek — a twoją szkołą każda nieuwaga strażnika.",
      "Ostatnie zlecenie miało być rutyną: wykraść dokument z posiadłości pomniejszego urzędnika Rady. Dokument okazał się czymś więcej niż myślałeś — dowodem na defraudację sięgającą samej Rady.",
      "Twój zleceniodawca zniknął tej samej nocy, którą miał zapłacić. Egzekutorzy Rady zaczęli pytać o „złodzieja z dokumentem” w każdej dzielnicy — a ty zrozumiałeś, że jedyną szansą jest zniknąć tam, gdzie nikt nie szuka: w szeregach Gildii Poszukiwaczy Przygód.",
      "Jako „nowy rekrut” masz nowe imię, nowy cel i mnóstwo powodów, by nigdy nie odkładać ostrza za daleko od ręki — dokument wciąż jest gdzieś tam, a ci, którzy go szukają, nie wybaczają.",
    ],
  },
  "Alchemik": {
    icon: "⚗️",
    title: "Formuła, za którą zapłaciłeś",
    beats: [
      "Terminowałeś w Gildii Rzemieślników jako obiecujący alchemik — twoje mikstury lecznicze ratowały więcej niewolników niż eliksiry Zakonu Światła, i za darmo. To właśnie ten fakt uczynił cię problemem.",
      "Eksperymentowałeś dalej, poza zleceniami Gildii, próbując znaleźć sposób na odwrócenie mutacji esencji u górników. Jeden z eksperymentów wymknął się spod kontroli — czy to była trucizna, czy lekarstwo, nikt już nie potrafił orzec, ale podopieczny przeżył.",
      "Mistrzów Gildii Rzemieślników nie interesowało, że przeżył. Interesowało ich, że działałeś bez zezwolenia Rady. Wygnano cię z warsztatów, spalono twoje notatki — ale nie wiedzę, którą już miałeś w głowie.",
      "Gildia Poszukiwaczy Przygód potrzebuje kogoś, kto potrafi warzyć i truciznę, i lekarstwo w polu, bez pytań o licencję. Wstępujesz w jej szeregi jako „nowy rekrut” — z plecakiem pełnym formuł, którymi wciąż nie do końca umiesz w pełni zapanować.",
    ],
  },
};

// Personal codas shown right after CAMPAIGN_CHAPTERS' finale.outro (the shared,
// deliberately ambiguous "objective" ending) — each one closes the loop on the
// specific grievance that opened that class's CLASS_PROLOGUES entry above.
const CLASS_EPILOGUES = {
  "Mag": {
    reflection: "Kaelon, twój brat, wciąż zasiada w Radzie — nietknięty przez to, co właśnie zrobiłeś jego zdrajcy. Dorian nie żyje, ale krew Rady, dla której cię wygnano, płynie dalej bez ciebie w tych samych żyłach. Zemsta smakuje inaczej, niż sądziłeś, gdy planowałeś ją siedem lat w wygnaniu.",
    icon: "🧙",
  },
  "Paladyn": {
    reflection: "Zakon Światła nigdy nie dowie się, że to ty rozliczyłeś się z człowiekiem, który testował „oczyszczenie” na ich niewolnikach. Miłosierdzie, którego cię uczono, nie wróciło razem z Dorianem — ale przynajmniej dziecko, które kiedyś odesłano do kopalni zamiast uzdrowić, ma teraz jednego mściciela mniej samotnego w swoim gniewie.",
    icon: "🛡️",
  },
  "Wojownik": {
    reflection: "Notatki Doriana o „oczyszczeniu” w Skażonym Lesie tłumaczą teraz więcej, niż chciałeś wiedzieć o własnych mięśniach i o tym, co nadzorcy zrobili z tobą w kopalnianym szybie. Uciekłeś kiedyś dzięki sile, której się bałeś — dziś ta sama siła pogrzebała człowieka, który tę siłę wymyślił.",
    icon: "⚔️",
  },
  "Łotrzyk": {
    reflection: "Dokument, który ukradłeś tyle lat temu, wciąż leży gdzieś schowany — dowód na defraudację sięgającą Rady, którego nigdy nie zdążyłeś wykorzystać. Egzekutorzy przestaną szukać „złodzieja z dokumentem” dopiero, gdy przestaniesz nim być. Dorian był tylko jednym ogniwem — reszta łańcucha wciąż czeka w cieniu, którego znasz najlepiej.",
    icon: "🗡️",
  },
  "Alchemik": {
    reflection: "Gildia Rzemieślników spaliła twoje notatki, ale nie wiedzę, którą wciąż masz w głowie — a Dorian, umierając, nie zdążył ci powiedzieć, czy jego eksperymenty na niewolnikach kiedykolwiek doszły tak daleko, jak twoje własne. To pytanie zostaje bez odpowiedzi, razem z resztą jego sekretów w Wieży Rady.",
    icon: "⚗️",
  },
};

// Two short codas branching on how deep the player's spaczenie (corruption)
// ran by the time they reached the finale — a last payoff for the whole
// Mutuj się / Pożryj szczątki arc built alongside the campaign this session.
const CORRUPTION_EPILOGUE_HIGH_THRESHOLD = 40;
const CORRUPTION_EPILOGUE_ADDENDUM = {
  high: "Twoje odbicie w kryształowych ścianach Wieży Rady już dawno przestało wyglądać jak twoje własne. Pokonałeś Doriana z siłą, którą kupiłeś własnym ciałem i umysłem — i teraz, stojąc nad jego zwłokami, nie jesteś już pewien, kto tu naprawdę wygrał.",
  low: "Siedem lat wygnania i cała ta droga nie zmieniły cię tak, jak mogły. Stoisz nad ciałem Doriana wciąż sobą — obolały, zmęczony, ale rozpoznawalny we własnej skórze. To też jest rodzaj zwycięstwa, o którym niewielu w Aetherionie mogłoby dziś powiedzieć to samo.",
};

// Trzecia, ostatnia część epilogu — podsumowanie wyborów z wieloetapowych
// misji pobocznych NPC (js/sideQuests.js) i osobistych wątków towarzyszy
// (js/companionStory.js), liczone przez main.js: getStoryChoicesSummary().
// Pokazuje się tylko, jeśli gracz ukończył choć jeden z tych wątków —
// inaczej po prostu nic o nich nie wspomina, żeby nie spoilerować mechaniki
// tym, kto ich nie tknął.
const STORY_CHOICES_EPILOGUE_ADDENDUM = {
  light: (light, dark) =>
    `Z tego, co zostawiłeś za sobą w Aetherionie: ${light} razy postawiłeś na uczciwość i lojalność wobec tych, którzy ci zaufali, wobec ${dark} razy, gdy wybrałeś inaczej. Ludzie z miasta i towarzysze, którzy szli z tobą, zapamiętają cię jako kogoś, komu można było zaufać — mimo Doriana, mimo spaczenia, mimo wszystkiego, co po drodze straciłeś.`,
  dark: (light, dark) =>
    `Z tego, co zostawiłeś za sobą w Aetherionie: ${dark} razy wybrałeś milczenie, zysk albo mrok, wobec zaledwie ${light} chwil, gdy postawiłeś na uczciwość. Ci, którym pomogłeś po cichu, i ci, których po cichu wykorzystałeś, noszą teraz część tego ciężaru razem z tobą — czy o tym wiedzą, czy nie.`,
  balanced: (light, dark) =>
    `Z tego, co zostawiłeś za sobą w Aetherionie: ${light} razy postawiłeś na uczciwość, ${dark} razy na coś przeciwnego. Ani światło, ani mrok nie wygrały do końca — ta niejednoznaczność też jest odpowiedzią na pytanie, kim się stałeś przez te siedem lat.`,
};

function buildStoryChoicesAddendum(summary) {
  if (!summary) return "";
  const light = summary.honestQuests + summary.lightCompanions;
  const dark = summary.darkQuests + summary.darkCompanions;
  if (light === 0 && dark === 0) return "";
  const variant = light > dark ? "light" : dark > light ? "dark" : "balanced";
  return STORY_CHOICES_EPILOGUE_ADDENDUM[variant](light, dark);
}
