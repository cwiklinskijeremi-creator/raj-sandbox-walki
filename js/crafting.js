// Recipes for the Kuźnia crafting bench (main.js: craftItem/canCraftItem, ui.js:
// renderCityPlace "kuznia" branch). Each combines resources from at least two
// different locations into a unique item defined in equipment.js (see the
// "Wytwory Kuźni" section there) that is never sold directly in any shop.
const CRAFTING_RECIPES = [
  {
    id: "medalion_dwoch_drog",
    resultItemId: "medalion_dwoch_drog",
    ingredients: [
      { currency: "Kryształy Esencji", amount: 15 },
      { currency: "Spaczone Zioła", amount: 12 },
    ],
  },
  {
    id: "plaszcz_switu_i_cienia",
    resultItemId: "plaszcz_switu_i_cienia",
    ingredients: [
      { currency: "Fiolki Światła", amount: 15 },
      { currency: "Nagroda Gildii", amount: 15 },
    ],
  },
  {
    id: "ostrze_utopionego_lowcy",
    resultItemId: "ostrze_utopionego_lowcy",
    ingredients: [
      { currency: "Nagroda Gildii", amount: 15 },
      { currency: "Zatopione Relikwie", amount: 12 },
    ],
  },
  {
    id: "peleryna_pielgrzyma_glebin",
    resultItemId: "peleryna_pielgrzyma_glebin",
    ingredients: [
      { currency: "Fiolki Światła", amount: 12 },
      { currency: "Zatopione Relikwie", amount: 12 },
    ],
  },
  {
    id: "pierscien_piatej_drogi",
    resultItemId: "pierscien_piatej_drogi",
    ingredients: [
      { currency: "Kryształy Esencji", amount: 10 },
      { currency: "Spaczone Zioła", amount: 8 },
      { currency: "Nagroda Gildii", amount: 8 },
      { currency: "Fiolki Światła", amount: 8 },
      { currency: "Zatopione Relikwie", amount: 8 },
    ],
  },
];
