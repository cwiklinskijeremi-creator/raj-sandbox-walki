let player;
let enemies;
let selectedTargetIndex = null;
let battleOver = false;
let playerActionsRemaining = 1;
let phase = "main-menu";
let radialMenuOpen = false;
let selectedClassName = null;
let selectedSubclassName = null;
let currentLocation = null;
let currentCityPlace = null;
let playerName = "";
let playerGender = null;
let bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
let level = 1;
let xp = 0;
let statPointsAvailable = 10;
let unlockedTalentIds = [];
let talentPointsAvailable = 0;
let talentTreeSelectedNodeId = null;
let talentTreeActiveTab = "subclass";
let corruption = 0;
let devouredCount = 0;
let dungeonMapState = null;
let dungeonPlayerHex = null;
let dungeonRevealedKeys = new Set();
let dungeonActiveInteraction = null;
let dungeonMoveTimer = null;
let dungeonHpLoss = 0;
let dungeonBattleBuff = { pancerz: 0 };
let postBattleReturnPhase = "camp";
let pendingAmbushEnemyBounds = null;
let pendingBossFight = false;
let isBossBattle = false;
let isCampaignBattle = false;
let activeCampaignChapterId = null;

function xpToNextLevel(lvl) {
  return lvl * 50;
}

// Interactive-prop flavor/prompt text, reused verbatim from the old linear
// room-card dungeon system — only the trigger changed (walking onto a map
// hex instead of resolving a card in sequence). "skirmish" is gone: real
// spatial ambush hexes (see startAmbushBattle) cover combat now instead of
// an abstract dice roll.
const DUNGEON_ROOM_TYPES = [
  {
    type: "empty", icon: "🚪", label: "Cichy zaułek",
    prompt: "Korytarz ciągnie się w ciszy — coś tu może być, ale trudno powiedzieć co.",
    optionALabel: "🔍 Przeszukaj kąty", optionBLabel: "➡️ Idź dalej bez zwłoki",
  },
  {
    type: "trap", icon: "⚠️", label: "Pułapka",
    prompt: "Coś w tym miejscu wygląda podejrzanie — wyczuwasz mechanizm w podłodze.",
    optionALabel: "🛠️ Rozbrój pułapkę", optionBLabel: "🚶 Omiń ostrożnie",
  },
  {
    type: "find", icon: "✨", label: "Znalezisko",
    prompt: "Coś błyszczy w gruzach nieopodal.",
    optionALabel: "🧐 Zbadaj dokładnie", optionBLabel: "🤏 Zabierz szybko i idź dalej",
  },
  {
    type: "shrine", icon: "🩸", label: "Zapomniany ołtarz",
    prompt: "Stary, zapomniany ołtarz stoi w mroku — wciąż pulsuje esencją.",
    optionALabel: "🩸 Złóż ofiarę z krwi", optionBLabel: "🙅 Odejdź",
  },
  {
    type: "cache", icon: "🔒", label: "Zapieczętowana skrzynia",
    prompt: "Ciężka, okuta skrzynia stoi wciśnięta w róg — zamek wygląda solidnie, ale nie niezniszczalnie.",
    optionALabel: "💪 Wyważ siłą", optionBLabel: "🚶 Zostaw zamkniętą",
  },
  {
    type: "corrupted_altar", icon: "🌀", label: "Spaczony posąg",
    prompt: "Pokruszony posąg pulsuje słabym, fioletowym blaskiem — esencja w nim jeszcze nie wygasła.",
    optionALabel: "🌀 Dotknij posągu", optionBLabel: "🙅 Odejdź",
  },
  {
    type: "wounded_survivor", icon: "🩹", label: "Ranny wędrowiec",
    prompt: "W cieniu korytarza leży ranny wędrowiec, zbyt słaby, by iść dalej samodzielnie.",
    optionALabel: "🩹 Opatrz rany", optionBLabel: "🚶 Idź dalej",
  },
];

function findDungeonRoomType(propType) {
  return DUNGEON_ROOM_TYPES.find((r) => r.type === propType);
}

function startDungeonMapCrawl() {
  resetDungeonTokenLayer();
  dungeonMapState = generateDungeonMap(currentLocation);
  dungeonPlayerHex = { q: dungeonMapState.entranceHex.q, r: dungeonMapState.entranceHex.r };
  dungeonRevealedKeys = new Set(
    dungeonRevealRadius(dungeonMapState, dungeonPlayerHex, DUNGEON_FOG_REVEAL_RADIUS).map(hexKey),
  );
  dungeonActiveInteraction = null;
  dungeonHpLoss = 0;
  dungeonBattleBuff = { pancerz: 0 };
  postBattleReturnPhase = "camp";
  pendingAmbushEnemyBounds = null;
  pendingBossFight = false;
  phase = "dungeon-map";
  render();
}

// Called once per step while the player token glides toward a clicked
// destination (see handleDungeonHexClick) — returns true (and stops the
// glide) the moment the newly-entered hex holds something to react to.
function checkDungeonHexEncounter(hex) {
  const { exitHex, ambushHexes, propHexes } = dungeonMapState;
  if (hex.q === exitHex.q && hex.r === exitHex.r) {
    startExitBattle();
    return true;
  }
  const ambush = ambushHexes.find((a) => a.q === hex.q && a.r === hex.r && !a.resolved);
  if (ambush) {
    if (ambush.isBossAmbush) {
      dungeonActiveInteraction = { kind: "boss-ambush", hex: { q: hex.q, r: hex.r }, resolved: false };
      render();
    } else {
      startAmbushBattle(ambush);
    }
    return true;
  }
  const prop = propHexes.find((p) => p.q === hex.q && p.r === hex.r && !p.resolved);
  if (prop) {
    triggerPropInteraction(prop);
    return true;
  }
  return false;
}

function handleDungeonHexClick(hex) {
  if (!dungeonMapState || dungeonActiveInteraction) return;
  if (!dungeonRevealedKeys.has(hexKey(hex))) return;
  const path = dungeonBfsShortestPath(dungeonMapState, dungeonPlayerHex, hex);
  if (!path || path.length < 2) return;

  if (dungeonMoveTimer) clearInterval(dungeonMoveTimer);
  let stepIndex = 1;
  dungeonMoveTimer = setInterval(() => {
    dungeonPlayerHex = { q: path[stepIndex].q, r: path[stepIndex].r };
    const revealedNow = dungeonRevealRadius(dungeonMapState, dungeonPlayerHex, DUNGEON_FOG_REVEAL_RADIUS);
    for (const revealedHex of revealedNow) dungeonRevealedKeys.add(hexKey(revealedHex));
    render();

    const arrived = checkDungeonHexEncounter(dungeonPlayerHex);
    stepIndex++;
    if (arrived || stepIndex >= path.length) {
      clearInterval(dungeonMoveTimer);
      dungeonMoveTimer = null;
    }
  }, 160);
}

function triggerPropInteraction(prop) {
  dungeonActiveInteraction = { kind: "prop", hex: { q: prop.q, r: prop.r }, propType: prop.propType, resolved: false };
  render();
}

function resolvePropChoice(choice) {
  const interaction = dungeonActiveInteraction;
  if (!interaction || interaction.kind !== "prop") return;

  if (interaction.propType === "empty") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 14) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 3));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        interaction.outcomeText = `Znajdujesz drobny skarb w pęknięciu muru: +${amount} × ${icon} ${name}.`;
      } else {
        interaction.outcomeText = "Nic tu nie ma poza kurzem i twoim czasem.";
      }
    } else {
      interaction.outcomeText = "Nie tracisz czasu na szukanie po kątach.";
    }
  } else if (interaction.propType === "trap") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 11) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 2));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        interaction.outcomeText = `Rozbrajasz pułapkę i wyciągasz z niej użyteczne części (K20=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 3;
        dungeonHpLoss += dmg;
        interaction.outcomeText = `Nie zdążyłeś rozbroić mechanizmu (K20=${roll}) — tracisz ${dmg} HP przed walką.`;
      }
    } else {
      interaction.outcomeText = "Ostrożnie omijasz zagrożenie, nie ryzykując niczego.";
    }
  } else if (interaction.propType === "find") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 11) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = min + Math.floor(Math.random() * (max - min + 1));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        interaction.outcomeText = `Dokładne poszukiwania się opłacają (K20=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 3;
        dungeonHpLoss += dmg;
        interaction.outcomeText = `To była pułapka na złodziei (K20=${roll}) — tracisz ${dmg} HP przed walką.`;
      }
    } else {
      const { name, icon, min, max } = currentLocation.resource;
      const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 2));
      const existing = resources[name] ? resources[name].amount : 0;
      resources[name] = { icon, amount: existing + amount };
      saveResources();
      interaction.outcomeText = `Zabierasz co się da bez ryzyka: +${amount} × ${icon} ${name}.`;
    }
  } else if (interaction.propType === "shrine") {
    if (choice === "A") {
      dungeonHpLoss += 8;
      dungeonBattleBuff.pancerz += 0.08;
      interaction.outcomeText = "Ołtarz przyjmuje ofiarę — czujesz, jak coś niewidzialnego otacza twoją skórę (-8 HP, +8% pancerza na nadchodzącą walkę).";
    } else {
      interaction.outcomeText = "Odchodzisz od ołtarza — wolisz nie ryzykować.";
    }
  } else if (interaction.propType === "cache") {
    if (choice === "A") {
      const roll = rollD20() + Math.floor(player.str / 5);
      if (roll >= 15) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = min + Math.floor(Math.random() * (max - min + 1));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        interaction.outcomeText = `Zamek pęka pod twoją siłą (K20+STR/5=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 2;
        dungeonHpLoss += dmg;
        interaction.outcomeText = `Zamek nie ustępuje, a okucia boleśnie odbijają się od twoich dłoni (K20+STR/5=${roll}) — tracisz ${dmg} HP przed walką.`;
      }
    } else {
      interaction.outcomeText = "Zostawiasz skrzynię zamkniętą — może ktoś inny spróbuje szczęścia.";
    }
  } else if (interaction.propType === "corrupted_altar") {
    if (choice === "A") {
      const healed = Math.round(player.maxHP * 0.15);
      dungeonHpLoss = Math.max(0, dungeonHpLoss - healed);
      corruption = Math.min(100, corruption + 6);
      interaction.outcomeText = `Posąg wypełnia twoje rany spaczoną esencją zamiast krwi (-${healed} nagromadzonych obrażeń), ale zostawia w tobie coś, czego nie da się już zmyć (+6% spaczenia).`;
    } else {
      interaction.outcomeText = "Odsuwasz się od posągu — niektóre dary kosztują więcej, niż warto zapłacić.";
    }
  } else if (interaction.propType === "wounded_survivor") {
    if (choice === "A") {
      const potion = POTION_ITEMS[Math.floor(Math.random() * POTION_ITEMS.length)];
      potionInventory[potion.id] = (potionInventory[potion.id] || 0) + 1;
      savePotionInventory();
      interaction.outcomeText = `Opatrujesz rannego, a on w podzięce wciska ci w dłoń ${potion.icon} ${potion.name}, zanim znika w mroku korytarza.`;
    } else {
      interaction.outcomeText = "Zostawiasz go i idziesz dalej — loch nie wybacza sentymentów.";
    }
  }

  const propHex = dungeonMapState.propHexes.find((p) => p.q === interaction.hex.q && p.r === interaction.hex.r);
  if (propHex) propHex.resolved = true;
  interaction.resolved = true;
  render();
}

function dismissDungeonInteraction() {
  dungeonActiveInteraction = null;
  render();
}

function confirmBossAmbush() {
  const interaction = dungeonActiveInteraction;
  if (!interaction || interaction.kind !== "boss-ambush") return;
  const ambush = dungeonMapState.ambushHexes.find((a) => a.q === interaction.hex.q && a.r === interaction.hex.r);
  dungeonActiveInteraction = null;
  if (ambush) startAmbushBattle(ambush);
}

function declineBossAmbush() {
  const interaction = dungeonActiveInteraction;
  if (!interaction || interaction.kind !== "boss-ambush") return;
  const ambush = dungeonMapState.ambushHexes.find((a) => a.q === interaction.hex.q && a.r === interaction.hex.r);
  if (ambush) ambush.resolved = true;
  dungeonActiveInteraction = null;
  render();
}

function chooseDungeonInteractionA() {
  const interaction = dungeonActiveInteraction;
  if (!interaction) return;
  if (interaction.kind === "boss-ambush") confirmBossAmbush();
  else resolvePropChoice("A");
}

function chooseDungeonInteractionB() {
  const interaction = dungeonActiveInteraction;
  if (!interaction) return;
  if (interaction.kind === "boss-ambush") declineBossAmbush();
  else resolvePropChoice("B");
}

function startAmbushBattle(ambush) {
  ambush.resolved = true;
  postBattleReturnPhase = "dungeon-map";
  pendingAmbushEnemyBounds = { minCount: 1, maxCount: 1 };
  pendingBossFight = !!ambush.isBossAmbush;
  isCampaignBattle = false;
  activeCampaignChapterId = null;
  startNewBattle();
}

function startExitBattle() {
  postBattleReturnPhase = "camp";
  pendingAmbushEnemyBounds = null;
  isCampaignBattle = false;
  activeCampaignChapterId = null;
  startNewBattle();
}

// Wired to change-location-btn INSTEAD of goToCamp (see returnFromBattle
// wiring below) — goToCamp itself stays untouched since city-back-btn and
// location-back-btn also use it and must always mean literally "camp."
function returnFromBattle() {
  if (postBattleReturnPhase === "dungeon-map" && dungeonMapState) {
    postBattleReturnPhase = "camp";
    phase = "dungeon-map";
    render();
  } else {
    goToCamp();
  }
}

function awardXp(amount) {
  xp += amount;
  appendLog(`Zdobywasz ${amount} PD.`, "system");
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    statPointsAvailable += 3;
    talentPointsAvailable += 1;
    companions.forEach((c) => { c.talentPointsAvailable = (c.talentPointsAvailable || 0) + 1; });
    appendLog(`Awans! Osiągasz poziom ${level} (+3 punkty statystyk i +1 punkt umiejętności do rozdania w obozie).`, "system");
  }
  companions.forEach((c) => scaleCompanionToLevel(c, level));
}

const RESOURCES_STORAGE_KEY = "raj-sandbox-resources";
const ACTIVE_RUN_KEY = "raj-sandbox-active-run";

function loadResources() {
  try {
    return JSON.parse(localStorage.getItem(RESOURCES_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveResources() {
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources));
}

let resources = loadResources();

function awardLocationResources() {
  if (!currentLocation) return;
  const { name, icon, min, max } = currentLocation.resource;
  const amount = min + Math.floor(Math.random() * (max - min + 1));
  const existing = resources[name] ? resources[name].amount : 0;
  resources[name] = { icon, amount: existing + amount };
  saveResources();
  appendLog(`Zdobywasz ${amount} × ${icon} ${name}.`, "system");
}

const BESTIARY_STORAGE_KEY = "raj-sandbox-bestiary";

function loadDiscoveredEnemies() {
  try {
    return JSON.parse(localStorage.getItem(BESTIARY_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDiscoveredEnemies() {
  localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(discoveredEnemies));
}

let discoveredEnemies = loadDiscoveredEnemies();

const DEFEATED_BOSSES_STORAGE_KEY = "raj-sandbox-defeated-bosses";

function loadDefeatedBosses() {
  try {
    return JSON.parse(localStorage.getItem(DEFEATED_BOSSES_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDefeatedBosses() {
  localStorage.setItem(DEFEATED_BOSSES_STORAGE_KEY, JSON.stringify(defeatedBosses));
}

let defeatedBosses = loadDefeatedBosses();

const BOSS_LOOT_CURRENCY_ICONS = {
  "Kryształy Esencji": "💎",
  "Spaczone Zioła": "🌿",
  "Nagroda Gildii": "🪙",
  "Fiolki Światła": "🧴",
};

function grantBossLoot(bossKey) {
  if (!bossKey || defeatedBosses.includes(bossKey)) return;
  const item = EQUIPMENT_ITEMS.find((i) => i.bossDrop === bossKey);
  if (!item) return;
  defeatedBosses.push(bossKey);
  saveDefeatedBosses();
  inventory.push(item.id);
  if (!resources[item.cost.currency]) {
    resources[item.cost.currency] = { icon: BOSS_LOOT_CURRENCY_ICONS[item.cost.currency] || "🔸", amount: 0 };
    saveResources();
  }
  saveEquipmentState();
  appendLog(`👑 Zdobywasz unikalny łup: ${item.icon} ${item.name}!`, "system");
}

function discoverEnemy(templateKey) {
  if (!templateKey || discoveredEnemies.includes(templateKey)) return;
  discoveredEnemies.push(templateKey);
  saveDiscoveredEnemies();
  appendLog("Bestiariusz zaktualizowany — odkryto nowego przeciwnika.", "system");
}

const QUEST_STORAGE_KEY = "raj-sandbox-quests";

function loadQuestState() {
  try {
    const data = JSON.parse(localStorage.getItem(QUEST_STORAGE_KEY));
    return {
      totalKills: (data && data.totalKills) || 0,
      claimedQuests: (data && data.claimedQuests) || [],
      claimedNpcQuests: (data && data.claimedNpcQuests) || [],
      sideQuestProgress: (data && data.sideQuestProgress) || {},
    };
  } catch {
    return { totalKills: 0, claimedQuests: [], claimedNpcQuests: [], sideQuestProgress: {} };
  }
}

function saveQuestState() {
  localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ totalKills, claimedQuests, claimedNpcQuests, sideQuestProgress }));
}

let { totalKills, claimedQuests, claimedNpcQuests, sideQuestProgress } = loadQuestState();

function registerKill() {
  totalKills++;
  saveQuestState();
  const killRecruits = recruitPool.filter((r) => r.quest.type === "kills");
  if (killRecruits.length > 0) {
    killRecruits.forEach((r) => { r.killsProgress++; });
    saveCompanionState();
  }
}

function getRecruitProgress(recruit) {
  const q = recruit.quest;
  if (q.type === "kills") return recruit.killsProgress;
  if (q.type === "level") return level;
  if (q.type === "resource") return resources[q.currency] ? resources[q.currency].amount : 0;
  if (q.type === "bestiary") return discoveredEnemies.length;
  return 0;
}

function getQuestProgressState() {
  return { totalKills, level, discoveredCount: discoveredEnemies.length };
}

// Shared metric reader for js/sideQuests.js — the exact same 5 progress
// types the rest of the game already tracks (getRecruitProgress()/
// getQuestProgressState() above read the same underlying state, just
// shaped differently for their own callers).
function getTrackableMetric(type, currency) {
  if (type === "kills") return totalKills;
  if (type === "level") return level;
  if (type === "bestiary") return discoveredEnemies.length;
  if (type === "resource") return resources[currency] ? resources[currency].amount : 0;
  if (type === "corruption") return corruption;
  return 0;
}

// "level"/"corruption"/"bestiary" read in quest text as thresholds to reach
// ("osiągnij 25% spaczenia") — checked against their absolute value.
// "kills"/"resource" read as counters to rack up during the quest ("pokonaj
// kolejnych 3 przeciwników") — checked as a delta since the objective began.
function isAbsoluteSideQuestMetric(type) {
  return type === "level" || type === "corruption" || type === "bestiary";
}

function getSideQuestObjectiveProgress(stageDef, objectiveStartValue) {
  const value = getTrackableMetric(stageDef.progressType, stageDef.currency);
  return isAbsoluteSideQuestMetric(stageDef.progressType) ? value : value - (objectiveStartValue || 0);
}

// Wieloetapowe misje fabularne — dialog -> prawdziwy cel w świecie -> wybór
// z konsekwencją -> zakończenie z unikalnym przedmiotem. Dwa źródła współdzielą
// dokładnie ten sam silnik przez discriminator `source` (mirror wzorca
// talentTreeSubject dla drzewek umiejętności):
//   {type:"npc", questId}       -> js/sideQuests.js, postęp w sideQuestProgress
//   {type:"companion", index}   -> js/companionStory.js, postęp na samym
//                                   obiekcie companion.storyProgress (przeżywa
//                                   save/load razem z resztą stanu towarzysza)
// Stan trzyma tylko nazwę bieżącego stage'u + wartość metryki zanotowaną przy
// wejściu w stage typu objective (cel liczony jako przyrost od tego momentu,
// patrz getSideQuestObjectiveProgress powyżej).
function canStartSideQuest(questId) {
  const quest = SIDE_QUESTS[questId];
  if (!quest || sideQuestProgress[questId]) return false;
  const pre = quest.prerequisite;
  if (!pre) return true;
  return getTrackableMetric(pre.type, pre.currency) >= pre.goal;
}

function getStoryQuestFor(source) {
  if (source.type === "npc") return SIDE_QUESTS[source.questId];
  const companion = companions[source.index];
  return companion ? COMPANION_STORY_QUESTS[companion.subclassName] : null;
}

function getStoryProgressFor(source) {
  if (source.type === "npc") return sideQuestProgress[source.questId];
  const companion = companions[source.index];
  return companion ? companion.storyProgress : undefined;
}

function setStoryProgressFor(source, progress) {
  if (source.type === "npc") {
    sideQuestProgress[source.questId] = progress;
    saveQuestState();
    return;
  }
  const companion = companions[source.index];
  if (!companion) return;
  companion.storyProgress = progress;
  saveCompanionState();
}

let activeSideQuestScene = null; // { source, stage, beatIndex, prefixBeats }

function currentSideQuestBeats() {
  const quest = getStoryQuestFor(activeSideQuestScene.source);
  const stageDef = quest.stages[activeSideQuestScene.stage];
  const prefix = activeSideQuestScene.prefixBeats || [];
  const own = Array.isArray(stageDef.text) ? stageDef.text : [];
  return [...prefix, ...own];
}

function moveSideQuestToStage(source, stageKey, prefixBeats = []) {
  const quest = getStoryQuestFor(source);
  const stageDef = quest.stages[stageKey];
  const progress = getStoryProgressFor(source) || {};
  progress.stage = stageKey;
  if (stageDef.progressType) {
    progress.objectiveStartValue = getTrackableMetric(stageDef.progressType, stageDef.currency);
  }
  if (stageDef.final) progress.completed = true;
  setStoryProgressFor(source, progress);
  activeSideQuestScene = { source, stage: stageKey, beatIndex: 0, prefixBeats };
  refreshSideQuestSceneIfOpen();
  if (stageDef.final && stageDef.reward) {
    grantSideQuestReward(stageDef.reward.itemId);
  }
  render();
}

function advanceSideQuestScene() {
  if (!activeSideQuestScene) return;
  const quest = getStoryQuestFor(activeSideQuestScene.source);
  const stageDef = quest.stages[activeSideQuestScene.stage];
  const beats = currentSideQuestBeats();
  if (activeSideQuestScene.beatIndex < beats.length - 1) {
    activeSideQuestScene.beatIndex++;
    refreshSideQuestSceneIfOpen();
    return;
  }
  if (stageDef.final) { closeSideQuestScene(); return; }
  if (stageDef.next) moveSideQuestToStage(activeSideQuestScene.source, stageDef.next);
}

function chooseSideQuestOption(optionIndex) {
  if (!activeSideQuestScene) return;
  const source = activeSideQuestScene.source;
  const quest = getStoryQuestFor(source);
  const stageDef = quest.stages[activeSideQuestScene.stage];
  const option = stageDef.options && stageDef.options[optionIndex];
  if (!option) return;
  if (option.reputation) gainReputation(quest.npcKey, option.reputation);
  if (option.corruption) {
    corruption = Math.min(100, corruption + option.corruption);
    saveActiveRun();
  }
  if (option.bonusStat && source.type === "companion") {
    const companion = companions[source.index];
    if (companion) {
      companion.bonusStats = companion.bonusStats || { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
      companion.bonusStats[option.bonusStat.key] = (companion.bonusStats[option.bonusStat.key] || 0) + option.bonusStat.amount;
      scaleCompanionToLevel(companion, level);
      saveCompanionState();
    }
  }
  moveSideQuestToStage(source, option.next, [option.resultText]);
}

function grantSideQuestReward(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  inventory.push(itemId);
  saveEquipmentState();
  appendLog(`📖 Ukończono wątek fabularny — zdobywasz unikalny przedmiot: ${item.icon} ${item.name}!`, "system");
}

function closeSideQuestScene() {
  activeSideQuestScene = null;
  document.getElementById("side-quest-overlay").classList.add("hidden");
  render();
}

function refreshSideQuestSceneIfOpen() {
  const overlay = document.getElementById("side-quest-overlay");
  if (overlay.classList.contains("hidden") || !activeSideQuestScene) return;
  const quest = getStoryQuestFor(activeSideQuestScene.source);
  if (!quest) { closeSideQuestScene(); return; }
  const stageDef = quest.stages[activeSideQuestScene.stage];
  const progress = getStoryProgressFor(activeSideQuestScene.source) || {};
  let objectiveCurrent = null;
  if (stageDef.progressType) {
    objectiveCurrent = getSideQuestObjectiveProgress(stageDef, progress.objectiveStartValue);
  }
  renderSideQuestScene(quest, activeSideQuestScene, stageDef, objectiveCurrent, {
    onAdvance: advanceSideQuestScene,
    onChoose: chooseSideQuestOption,
    onClose: closeSideQuestScene,
  });
}

// Called from the city NPC dialogue panel — starts the quest if the
// prerequisite is met, jumps straight to the "choice" stage if the
// objective goal was reached while away, or just resumes wherever the
// player left off (including a not-yet-complete objective, shown as a
// progress bar with no way to advance until the goal is met).
function continueSideQuestAtNpc(npcKey) {
  const entry = Object.entries(SIDE_QUESTS).find(([, q]) => q.npcKey === npcKey);
  if (!entry) return;
  const [questId, quest] = entry;
  const source = { type: "npc", questId };
  const progress = sideQuestProgress[questId];

  if (!progress && !canStartSideQuest(questId)) return;

  document.getElementById("side-quest-overlay").classList.remove("hidden");

  if (!progress) {
    moveSideQuestToStage(source, "start");
    return;
  }

  if (progress.stage === "objective") {
    const stageDef = quest.stages.objective;
    const current = getSideQuestObjectiveProgress(stageDef, progress.objectiveStartValue);
    if (current >= stageDef.goal) {
      moveSideQuestToStage(source, stageDef.next);
      return;
    }
  }

  activeSideQuestScene = { source, stage: progress.stage, beatIndex: 0, prefixBeats: [] };
  refreshSideQuestSceneIfOpen();
}

// Called from the companion sheet — unlike NPC quests, a companion's
// personal story has no prerequisite (they already "proved themselves" at
// recruitment) and no npcKey, just their subclassName as the lookup key into
// COMPANION_STORY_QUESTS. Otherwise identical resume/auto-advance behavior.
function continueCompanionStory(companionIndex) {
  const companion = companions[companionIndex];
  if (!companion) return;
  const quest = COMPANION_STORY_QUESTS[companion.subclassName];
  if (!quest) return;
  const source = { type: "companion", index: companionIndex };
  const progress = companion.storyProgress;

  document.getElementById("side-quest-overlay").classList.remove("hidden");

  if (!progress) {
    moveSideQuestToStage(source, "start");
    return;
  }

  if (progress.stage === "objective") {
    const stageDef = quest.stages.objective;
    const current = getSideQuestObjectiveProgress(stageDef, progress.objectiveStartValue);
    if (current >= stageDef.goal) {
      moveSideQuestToStage(source, stageDef.next);
      return;
    }
  }

  activeSideQuestScene = { source, stage: progress.stage, beatIndex: 0, prefixBeats: [] };
  refreshSideQuestSceneIfOpen();
}

// Status line + button label for the companion sheet's story section —
// mirrors the equivalent NPC-side status text inside renderCityNpc (ui.js).
function getCompanionStoryStatusText(companion) {
  const quest = COMPANION_STORY_QUESTS[companion.subclassName];
  if (!quest) return null;
  const progress = companion.storyProgress;
  if (!progress) return { status: `Nowy wątek fabularny dostępny: „${quest.name}”.`, buttonLabel: "Porozmawiaj" };
  if (progress.completed) return { status: `Wątek „${quest.name}” ukończony.`, buttonLabel: "Zobacz" };
  if (progress.stage === "objective") {
    const stageDef = quest.stages.objective;
    const current = Math.max(0, getSideQuestObjectiveProgress(stageDef, progress.objectiveStartValue));
    if (current >= stageDef.goal) return { status: `„${quest.name}” — cel osiągnięty, wróć do rozmowy.`, buttonLabel: "Zdaj relację" };
    return { status: `„${quest.name}” w trakcie: ${Math.min(current, stageDef.goal)}/${stageDef.goal}.`, buttonLabel: "Sprawdź postęp" };
  }
  if (progress.stage === "choice") return { status: `„${quest.name}” czeka na Twoją decyzję.`, buttonLabel: "Podejmij decyzję" };
  return { status: `„${quest.name}” w toku.`, buttonLabel: "Kontynuuj" };
}

// Tallies how the player resolved every completed NPC side quest and
// companion story thread — read by the epilogue (prologue.js:
// buildStoryChoicesAddendum) for a closing summary of the whole session's
// reputation-vs-corruption / stat-bonus-vs-corruption choices. Both quest
// types share the same "resolution_honest"/"resolution_silent" (NPC) and
// "resolution_light"/"resolution_dark" (companion) stage-name convention.
function getStoryChoicesSummary() {
  let honestQuests = 0;
  let darkQuests = 0;
  Object.values(sideQuestProgress).forEach((progress) => {
    if (!progress || !progress.completed) return;
    if (progress.stage === "resolution_honest") honestQuests++;
    else if (progress.stage === "resolution_silent") darkQuests++;
  });

  let lightCompanions = 0;
  let darkCompanions = 0;
  companions.forEach((c) => {
    const progress = c.storyProgress;
    if (!progress || !progress.completed) return;
    if (progress.stage === "resolution_light") lightCompanions++;
    else if (progress.stage === "resolution_dark") darkCompanions++;
  });

  return { honestQuests, darkQuests, lightCompanions, darkCompanions };
}

let activeRecruitScene = null;

function openRecruitScene(recruitId) {
  const entry = recruitPool.find((r) => r.id === recruitId);
  if (!entry || getRecruitProgress(entry) < entry.quest.goal) return;
  activeRecruitScene = { recruitId, step: 0 };
  document.getElementById("recruit-scene-overlay").classList.remove("hidden");
  renderRecruitScene(entry, 0);
}

function advanceRecruitScene() {
  if (!activeRecruitScene) return;
  const entry = recruitPool.find((r) => r.id === activeRecruitScene.recruitId);
  if (!entry) { closeRecruitScene(); return; }
  activeRecruitScene.step++;
  renderRecruitScene(entry, activeRecruitScene.step);
}

function confirmRecruitScene() {
  if (!activeRecruitScene) return;
  const recruitId = activeRecruitScene.recruitId;
  closeRecruitScene();
  recruitCompanion(recruitId);
}

function closeRecruitScene() {
  activeRecruitScene = null;
  document.getElementById("recruit-scene-overlay").classList.add("hidden");
}

function openQuestBoard() {
  document.getElementById("quest-board-overlay").classList.remove("hidden");
  renderQuestBoard(QUESTS, getQuestProgressState(), claimedQuests, claimQuestReward);
}

function closeQuestBoard() {
  document.getElementById("quest-board-overlay").classList.add("hidden");
}

function openPartyOverlay() {
  document.getElementById("party-overlay").classList.remove("hidden");
  refreshPartyOverlayIfOpen();
}

function closePartyOverlay() {
  document.getElementById("party-overlay").classList.add("hidden");
}

function refreshPartyOverlayIfOpen() {
  const overlay = document.getElementById("party-overlay");
  if (overlay.classList.contains("hidden")) return;
  renderPartyOverlay(companions, dismissCompanion, openCompanionSheet);
}

let activeCompanionSheetIndex = null;

function openCompanionSheet(index) {
  if (!companions[index]) return;
  closePartyOverlay();
  activeCompanionSheetIndex = index;
  document.getElementById("companion-sheet-overlay").classList.remove("hidden");
  refreshCompanionSheetIfOpen();
}

function closeCompanionSheet() {
  activeCompanionSheetIndex = null;
  document.getElementById("companion-sheet-overlay").classList.add("hidden");
  openPartyOverlay();
}

function refreshCompanionSheetIfOpen() {
  const overlay = document.getElementById("companion-sheet-overlay");
  if (overlay.classList.contains("hidden") || activeCompanionSheetIndex === null) return;
  const companion = companions[activeCompanionSheetIndex];
  if (!companion) { closeCompanionSheet(); return; }
  const companionIndex = activeCompanionSheetIndex;
  renderCompanionSheet(companion, inventory, equipped, equipmentUpgrades, companions, {
    onEquip: (itemId) => equipItemToCompanion(companionIndex, itemId),
    onUnequip: (slotKey) => unequipCompanionSlot(companionIndex, slotKey),
    onAdjustStat: (key, delta) => adjustCompanionBonusStat(companionIndex, key, delta),
    onOpenTalents: () => openCompanionTalentTree(companionIndex),
    onRespec: () => respecCompanionStats(companionIndex),
    onOpenStory: () => continueCompanionStory(companionIndex),
  });
}

function claimQuestReward(questId) {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest || claimedQuests.includes(questId)) return;
  const progress = getQuestProgressState()[quest.progressKey];
  if (progress < quest.goal) return;

  const existing = resources[quest.reward.currency] ? resources[quest.reward.currency].amount : 0;
  const icon = resources[quest.reward.currency] ? resources[quest.reward.currency].icon : questRewardIcon(quest.reward.currency);
  resources[quest.reward.currency] = { icon, amount: existing + quest.reward.amount };
  saveResources();

  claimedQuests.push(questId);
  saveQuestState();

  appendLog(`📋 Zadanie „${quest.name}” ukończone: +${quest.reward.amount} × ${quest.reward.currency}.`, "system");
  renderQuestBoard(QUESTS, getQuestProgressState(), claimedQuests, claimQuestReward);
  render();
}

function talkToNpc() {
  render();
}

function getNpcQuestProgress(quest) {
  if (quest.type === "kills") return totalKills;
  if (quest.type === "level") return level;
  if (quest.type === "bestiary") return discoveredEnemies.length;
  if (quest.type === "resource") return resources[quest.currency] ? resources[quest.currency].amount : 0;
  if (quest.type === "corruption") return corruption;
  return 0;
}

function claimNpcQuestReward(placeKey) {
  const npc = CITY_NPCS[placeKey];
  if (!npc || !npc.quest || claimedNpcQuests.includes(placeKey)) return;
  const quest = npc.quest;
  const progress = getNpcQuestProgress(quest);
  if (progress < quest.goal) return;

  if (quest.type === "resource") {
    resources[quest.currency].amount -= quest.goal;
    saveResources();
  }

  const existing = resources[quest.reward.currency] ? resources[quest.reward.currency].amount : 0;
  const icon = resources[quest.reward.currency] ? resources[quest.reward.currency].icon : questRewardIcon(quest.reward.currency);
  resources[quest.reward.currency] = { icon, amount: existing + quest.reward.amount };
  saveResources();

  claimedNpcQuests.push(placeKey);
  saveQuestState();
  gainReputation(placeKey, 5);

  appendLog(`💬 ${npc.name}: zlecenie wykonane! +${quest.reward.amount} × ${quest.reward.currency}.`, "system");
  render();
}

function questRewardIcon(currencyName) {
  const loc = LOCATIONS.find((l) => l.resource.name === currencyName);
  return loc ? loc.resource.icon : "🪙";
}

const CAMPAIGN_STORAGE_KEY = "raj-sandbox-campaign";

function loadCampaignState() {
  try {
    const data = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY));
    return { completedChapterIds: (data && data.completedChapterIds) || [] };
  } catch {
    return { completedChapterIds: [] };
  }
}

function saveCampaignState() {
  localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ completedChapterIds }));
}

let { completedChapterIds } = loadCampaignState();

function getCurrentCampaignChapter() {
  return CAMPAIGN_CHAPTERS.find((c) => !completedChapterIds.includes(c.id)) || null;
}

function isCampaignComplete() {
  return CAMPAIGN_CHAPTERS.every((c) => completedChapterIds.includes(c.id));
}

function openCampaignBoard() {
  document.getElementById("campaign-overlay").classList.remove("hidden");
  renderCampaignBoard(CAMPAIGN_CHAPTERS, completedChapterIds, getCurrentCampaignChapter(), startCampaignChapter);
}

function closeCampaignBoard() {
  document.getElementById("campaign-overlay").classList.add("hidden");
}

function startCampaignChapter(chapterId) {
  const chapter = getCurrentCampaignChapter();
  if (!chapter || chapter.id !== chapterId) return;
  const location = getCampaignChapterLocation(chapter);
  if (!location) return;
  closeCampaignBoard();
  currentLocation = location;
  activeCampaignChapterId = chapter.id;
  isCampaignBattle = true;
  pendingBossFight = true;
  startNewBattle();
}

function completeCampaignChapter(chapterId) {
  const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter || completedChapterIds.includes(chapterId)) return;
  completedChapterIds.push(chapterId);
  saveCampaignState();

  const existing = resources[chapter.reward.currency] ? resources[chapter.reward.currency].amount : 0;
  const icon = resources[chapter.reward.currency] ? resources[chapter.reward.currency].icon : questRewardIcon(chapter.reward.currency);
  resources[chapter.reward.currency] = { icon, amount: existing + chapter.reward.amount };
  saveResources();

  appendLog(`📖 Rozdział „${chapter.title}” ukończony! +${chapter.reward.amount} × ${chapter.reward.currency}.`, "system");
  if (chapter.isFinale) {
    appendLog("🏆 Kampania fabularna zakończona!", "system");
    phase = "epilogue";
  }
}

function closeEpilogue() {
  phase = "camp";
  render();
}

const COMPANION_STORAGE_KEY = "raj-sandbox-companions";

function loadCompanionState() {
  try {
    const data = JSON.parse(localStorage.getItem(COMPANION_STORAGE_KEY));
    const recruitPool = (data && data.recruitPool) || [];
    recruitPool.forEach((r) => {
      if (!r.quest) r.quest = COMPANION_QUESTS[r.companion.subclassName];
    });
    return { companions: (data && data.companions) || [], recruitPool, firedBanters: (data && data.firedBanters) || [] };
  } catch {
    return { companions: [], recruitPool: [], firedBanters: [] };
  }
}

function saveCompanionState() {
  localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify({ companions, recruitPool, firedBanters }));
}

let { companions, recruitPool, firedBanters } = loadCompanionState();

// Party banter (js/companions.js: COMPANION_BANTER) — rolled once per new
// battle; fires at most one exchange, chosen among curated pairs currently
// present in the party that haven't already played this game. Each pair
// fires at most once ever (tracked in firedBanters, persisted alongside the
// rest of companion state), matching how these games treat banter as a
// one-time character beat rather than repeatable ambience.
function getBanterPairKey(subclassA, subclassB) {
  return [subclassA, subclassB].sort().join("|");
}

function maybeTriggerCompanionBanter() {
  if (companions.length < 2) return;
  const candidates = [];
  for (let i = 0; i < companions.length; i++) {
    for (let j = i + 1; j < companions.length; j++) {
      const key = getBanterPairKey(companions[i].subclassName, companions[j].subclassName);
      if (COMPANION_BANTER[key] && !firedBanters.includes(key)) {
        candidates.push({ key, a: companions[i], b: companions[j] });
      }
    }
  }
  if (candidates.length === 0 || Math.random() > 0.35) return;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const lines = COMPANION_BANTER[chosen.key];
  lines.forEach((line) => {
    const speaker = line.speaker === chosen.a.subclassName ? chosen.a : chosen.b;
    appendLog(`${speaker.baseName}: „${line.text}”`, "banter");
  });
  firedBanters.push(chosen.key);
  saveCompanionState();
}

function rotateRecruitPool() {
  const shuffledPlaces = [...CITY_PLACES].sort(() => Math.random() - 0.5);
  const chosenPlaces = shuffledPlaces.slice(0, 2);
  const usedSubclasses = companions.map((c) => c.subclassName);
  const usedNames = companions.map((c) => c.baseName).filter(Boolean);
  recruitPool = chosenPlaces.map((place) => {
    const companion = generateCompanion(selectedClassName, usedSubclasses, usedNames);
    usedSubclasses.push(companion.subclassName);
    usedNames.push(companion.baseName);
    return {
      id: `recruit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      locationKey: place.key,
      companion,
      quest: COMPANION_QUESTS[companion.subclassName],
      killsProgress: 0,
    };
  });
  saveCompanionState();
}

function recruitCompanion(recruitId) {
  const entry = recruitPool.find((r) => r.id === recruitId);
  if (!entry || getRecruitProgress(entry) < entry.quest.goal) return;
  if (companions.length >= MAX_COMPANIONS) return;
  // Retroactively grants a fresh recruit the talent points they'd already
  // have earned by the player's current level — consistent with their
  // stats already being scaled to the current level via scaleCompanionToLevel.
  entry.companion.talentPointsAvailable = Math.max(0, level - 1);
  companions.push(entry.companion);
  scaleCompanionToLevel(entry.companion, level);
  recruitPool = recruitPool.filter((r) => r.id !== recruitId);
  saveCompanionState();
  appendLog(`👥 ${entry.companion.name} dołącza do drużyny!`, "system");
  render();
}

function dismissCompanion(index) {
  if (!companions[index]) return;
  const [removed] = companions.splice(index, 1);
  saveCompanionState();
  appendLog(`👥 ${removed.name} opuszcza drużynę.`, "system");
  refreshPartyOverlayIfOpen();
  render();
}

const EQUIPMENT_STORAGE_KEY = "raj-sandbox-equipment";

function defaultEquippedState() {
  const state = {};
  EQUIPMENT_SLOTS.forEach((slot) => { state[slot.key] = null; });
  return state;
}

function migrateEquippedState(rawEquipped) {
  const state = defaultEquippedState();
  if (!rawEquipped) return state;
  // Old saves used "zbroja"/"amulet" as the only two slots — carry them
  // over to their renamed replacements so existing loadouts aren't lost.
  if (rawEquipped.zbroja) state.napiersnik = rawEquipped.zbroja;
  if (rawEquipped.amulet) state.naszyjnik = rawEquipped.amulet;
  EQUIPMENT_SLOTS.forEach((slot) => {
    if (rawEquipped[slot.key]) state[slot.key] = rawEquipped[slot.key];
  });
  return state;
}

function loadEquipmentState() {
  try {
    const data = JSON.parse(localStorage.getItem(EQUIPMENT_STORAGE_KEY));
    return {
      inventory: (data && data.inventory) || [],
      equipped: migrateEquippedState(data && data.equipped),
      upgrades: (data && data.upgrades) || {},
    };
  } catch {
    return { inventory: [], equipped: defaultEquippedState(), upgrades: {} };
  }
}

function saveEquipmentState() {
  localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify({ inventory, equipped, upgrades: equipmentUpgrades }));
}

let { inventory, equipped, upgrades: equipmentUpgrades } = loadEquipmentState();

const MAX_EQUIPMENT_UPGRADE = 3;

function equipmentUpgradeCost(item) {
  const level = equipmentUpgrades[item.id] || 0;
  return { currency: item.cost.currency, amount: item.cost.amount * (level + 1) };
}

function upgradeEquipment(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item || !inventory.includes(itemId)) return;
  const level = equipmentUpgrades[itemId] || 0;
  if (level >= MAX_EQUIPMENT_UPGRADE) return;
  const cost = equipmentUpgradeCost(item);
  if (!canAffordItem({ cost })) return;
  resources[cost.currency].amount -= cost.amount;
  saveResources();
  equipmentUpgrades[itemId] = level + 1;
  saveEquipmentState();
  if (player && (phase === "camp" || phase === "city-place")) player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
}

function canCraftItem(recipe) {
  return recipe.ingredients.every((ing) => (resources[ing.currency] ? resources[ing.currency].amount : 0) >= ing.amount);
}

function craftItem(recipeId) {
  const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
  if (!recipe || inventory.includes(recipe.resultItemId) || !canCraftItem(recipe)) return;
  recipe.ingredients.forEach((ing) => {
    resources[ing.currency].amount -= ing.amount;
  });
  saveResources();
  inventory.push(recipe.resultItemId);
  saveEquipmentState();
  const item = EQUIPMENT_ITEMS.find((i) => i.id === recipe.resultItemId);
  appendLog(`⚒️ Wytworzono: ${item.icon} ${item.name}!`, "system");
  render();
  refreshCharacterSheetIfOpen();
}

const POTION_STORAGE_KEY = "raj-sandbox-potions";

function loadPotionInventory() {
  try {
    return JSON.parse(localStorage.getItem(POTION_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePotionInventory() {
  localStorage.setItem(POTION_STORAGE_KEY, JSON.stringify(potionInventory));
}

let potionInventory = loadPotionInventory();

function buyPotion(potionId) {
  const potion = POTION_ITEMS.find((p) => p.id === potionId);
  if (!potion || !canAffordItem(potion)) return;
  resources[potion.cost.currency].amount -= potion.cost.amount;
  saveResources();
  potionInventory[potionId] = (potionInventory[potionId] || 0) + 1;
  savePotionInventory();
  render();
  refreshCharacterSheetIfOpen();
}

function applyPotionEffect(potion) {
  if (potion.effectType === "heal_self") {
    const healAmount = Math.round(player.maxHP * potion.effectValue);
    player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
    appendLog(`${potion.icon} Wypijasz ${potion.name}: odzyskujesz ${healAmount} PD.`, "system");
  } else if (potion.effectType === "self_buff") {
    applyTimedEffect(player, potion.stat, potion.effectValue, potion.effectTurns, potion.label);
    const amountText = potion.stat === "pancerz" ? `${Math.round(potion.effectValue * 100)}%` : `+${potion.effectValue}`;
    appendLog(`${potion.icon} Wypijasz ${potion.name}: ${amountText} ${potion.stat.toUpperCase()} na ${turnsLabel(potion.effectTurns)}.`, "system");
  }
}

function usePotion(potionId) {
  if (battleOver || playerActionsRemaining <= 0) return;
  const potion = POTION_ITEMS.find((p) => p.id === potionId);
  if (!potion || !potionInventory[potionId]) return;

  potionInventory[potionId]--;
  if (potionInventory[potionId] <= 0) delete potionInventory[potionId];
  savePotionInventory();

  playerActionsRemaining--;
  applyPotionEffect(potion);
  playSpellCastSound();
  closePotionMenu();

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function openPotionMenu() {
  document.getElementById("potions-overlay").classList.remove("hidden");
  renderPotionMenu(potionInventory, usePotion);
}

function closePotionMenu() {
  document.getElementById("potions-overlay").classList.add("hidden");
}

// "Mutuj się": an opt-in power spike (reused timed-effect infra also used by
// skills/boss specials) that permanently raises `corruption`. High corruption
// then risks a madness episode on later attacks/skills (see
// rollMadnessEpisode/triggerMadnessEpisode) — the trade-off the user asked
// for: stronger now, but you might turn on your own companions later.
const MUTATE_COOLDOWN = 4;
const MUTATE_CORRUPTION_GAIN = 15;
const MUTATE_STAT_BONUS = 6;
const MUTATE_BUFF_TURNS = 20;

// "Pożryj szczątki": lets Mutuj się's power grow over the whole run by
// devouring the corpses of already-mutated enemies. Each devour is smaller
// than a full Mutuj się (less corruption, no timed buff) but permanently
// raises devouredCount, which in turn raises the STR/WYT bonus mutateSelf()
// grants every time — the trade-off scales, it doesn't reset like the buff.
const DEVOUR_CORRUPTION_GAIN = 5;
const DEVOUR_HEAL_PERCENT = 0.12;
const DEVOUR_TIER_STEP = 3;
const DEVOUR_TIER_CAP = 5;

function mutationTier() {
  return Math.min(DEVOUR_TIER_CAP, Math.floor(devouredCount / DEVOUR_TIER_STEP));
}

function mutateSelf() {
  if (battleOver || playerActionsRemaining <= 0) return;
  if ((player.mutateCooldown || 0) > 0) return;

  playerActionsRemaining--;
  player.mutateCooldown = MUTATE_COOLDOWN;
  const statBonus = MUTATE_STAT_BONUS + mutationTier();
  applyTimedEffect(player, "str", statBonus, MUTATE_BUFF_TURNS, "mutacja spaczenia");
  applyTimedEffect(player, "wyt", statBonus, MUTATE_BUFF_TURNS, "mutacja spaczenia");
  corruption = Math.min(100, corruption + MUTATE_CORRUPTION_GAIN);
  playSpellCastSound();
  appendLog(`🧬 Poddajesz się mutacji spaczenia: +${statBonus} STR i +${statBonus} WYT do końca walki. Twoje spaczenie rośnie do ${corruption}%.`, "system");

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function mutateButtonLabel() {
  const cd = player && player.mutateCooldown ? player.mutateCooldown : 0;
  return cd > 0 ? `Mutuj się (odnowienie: ${turnsLabel(cd)})` : "Mutuj się";
}

function devourableCorpse() {
  if (!enemies) return null;
  return enemies.find((e) => e.currentHP <= 0 && e.mutated && !e.devoured && hexDistance(player.pos, e.pos) === 1);
}

function devourButtonLabel() {
  return devourableCorpse() ? "Pożryj szczątki" : "Pożryj szczątki (brak celu)";
}

function devourCorpse() {
  if (battleOver || playerActionsRemaining <= 0) return;
  const corpse = devourableCorpse();
  if (!corpse) return;

  playerActionsRemaining--;
  corpse.devoured = true;
  devouredCount++;
  corruption = Math.min(100, corruption + DEVOUR_CORRUPTION_GAIN);
  const healAmount = Math.round(player.maxHP * DEVOUR_HEAL_PERCENT);
  player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
  playSpellCastSound();
  appendLog(`🍖 Pożerasz szczątki ${corpse.name}: leczysz się o ${healAmount} PŻ, spaczenie rośnie do ${corruption}%. Mutacja wzmacnia się (tier ${mutationTier()}).`, "system");

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

// High corruption risks losing control on the very action that was supposed
// to use it — below 20% you're always safe, above it the odds climb with
// how deep the spaczenie runs (100% corruption ≈ 1-in-3 per action).
function rollMadnessEpisode() {
  if (corruption <= 20) return false;
  return Math.random() < corruption / 300;
}

function triggerMadnessEpisode() {
  playerActionsRemaining--;
  const livingCompanions = companions.filter((c) => c.currentHP > 0);

  if (livingCompanions.length > 0) {
    const victim = livingCompanions[Math.floor(Math.random() * livingCompanions.length)];
    const context = { allCombatants: [player, ...companions, ...enemies], obstacles: OBSTACLES };
    const result = resolveAttack(player, victim, context);
    const { text, cssClass } = formatAttackResult(result);
    appendLog(`😵‍💫 Spaczenie przejmuje nad Tobą kontrolę! Atakujesz ${victim.icon} ${victim.name} zamiast wroga! ${text}`, cssClass);
    triggerAttackFx(result, victim.pos);
    if (result.hit) playHitSound(result.d6 === 6); else playMissSound();
    if (victim.currentHP <= 0) resolveUnitDeath(victim);
  } else {
    const selfDmg = Math.max(1, Math.round(player.maxHP * 0.08));
    player.currentHP = Math.max(0, player.currentHP - selfDmg);
    appendLog(`😵‍💫 Spaczenie przejmuje nad Tobą kontrolę! W szale zadajesz sobie ${selfDmg} obrażeń.`, "damage");
    playHitSound(false);
    if (player.currentHP <= 0) resolveUnitDeath(player);
  }

  if (battleOver) {
    render();
  } else if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function getEquipmentStatBonusesFor(equippedObj) {
  const totals = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0, pancerz: 0, przebicie: 0 };
  Object.values(equippedObj).forEach((itemId) => {
    if (!itemId) return;
    const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const multiplier = 1 + (equipmentUpgrades[itemId] || 0) * 0.25;
    Object.entries(item.bonus).forEach(([key, value]) => {
      const scaled = value * multiplier;
      totals[key] += (key === "pancerz" || key === "przebicie") ? scaled : Math.round(scaled);
    });
  });
  return totals;
}

function getEquipmentStatBonuses() {
  return getEquipmentStatBonusesFor(equipped);
}

// Passive talent nodes use the exact same {str,wyt,zre,int,cha,pancerz,
// przebicie} shape as equipment bonuses (see equipment.js EQUIPMENT_ITEMS),
// merged into buildPlayerCharacter()/scaleCompanionToLevel() the same way
// getEquipmentStatBonuses() is. Active/sustained nodes are shaped exactly
// like the 2 base subclass spells (classes.js skills[]) and join that same
// list via getUnlockedActiveTalentsFor()/playerSkills()/companionSkills()
// below, so they run through the unmodified castSkill()/
// applySkillEffect() combat engine. These are pure helpers over an
// unlockedIds array so both the player and every companion (each with
// their own unlockedTalentIds) can reuse them without duplication.
function getTalentStatBonusesFor(unlockedIds) {
  const totals = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0, pancerz: 0, przebicie: 0 };
  unlockedIds.forEach((id) => {
    const node = findTalentNode(id);
    if (!node || node.kind !== "passive") return;
    Object.entries(node.bonus).forEach(([key, value]) => {
      totals[key] += value;
    });
  });
  return totals;
}

function getUnlockedActiveTalentsFor(unlockedIds) {
  return unlockedIds
    .map((id) => findTalentNode(id))
    .filter((node) => node && node.kind !== "passive");
}

function getTalentStatBonuses() {
  return getTalentStatBonusesFor(unlockedTalentIds);
}

function getUnlockedActiveTalents() {
  return getUnlockedActiveTalentsFor(unlockedTalentIds);
}

function getPlayerTalentTree() {
  return selectedSubclassName ? TALENT_TREES[selectedSubclassName] : null;
}

// Which "subject" the talent tree modal currently shows — the player, or
// one specific companion (see openCompanionTalentTree()). Companions never
// see the "🧬 Mutacja" tab (that's the player's own corruption arc), so
// their unlockedIds never contain a mutation node id and
// canUnlockTalentGeneric() below naturally falls through to their subclass
// tree without needing a special case.
let talentTreeSubject = { type: "player" };

function getTalentSubjectData() {
  if (talentTreeSubject.type === "companion") {
    const companion = companions[talentTreeSubject.index];
    if (!companion) return null;
    return {
      subclassName: companion.subclassName,
      unlockedIds: companion.unlockedTalentIds || [],
      pointsAvailable: companion.talentPointsAvailable || 0,
      allowMutationTab: false,
      label: companion.name,
    };
  }
  return {
    subclassName: selectedSubclassName,
    unlockedIds: unlockedTalentIds,
    pointsAvailable: talentPointsAvailable,
    allowMutationTab: true,
    label: null,
  };
}

// The tree currently shown in the talent tree modal — the subject's own
// subclass tree, or the cross-class MUTATION_TALENT_TREE (see talents.js)
// when the "🧬 Mutacja" tab is active (player only).
function getActiveTalentTree() {
  if (talentTreeActiveTab === "mutation") return MUTATION_TALENT_TREE;
  const subject = getTalentSubjectData();
  return subject && subject.subclassName ? TALENT_TREES[subject.subclassName] : null;
}

function isTalentUnlocked(nodeId) {
  const subject = getTalentSubjectData();
  return !!subject && subject.unlockedIds.includes(nodeId);
}

// DAO-style per-branch chain: rank N in a branch requires rank N-1 already
// unlocked IN THAT SAME BRANCH (rank 1 only needs a spendable point).
function canUnlockTalentGeneric(subclassName, unlockedIds, pointsAvailable, nodeId) {
  if (pointsAvailable <= 0 || unlockedIds.includes(nodeId)) return false;

  const mutationPosition = findMutationNodePosition(nodeId);
  if (mutationPosition) {
    const { branchIndex, tierIndex } = mutationPosition;
    if (tierIndex === 0) return true;
    const priorNode = MUTATION_TALENT_TREE.branches[branchIndex].nodes[tierIndex - 1];
    return unlockedIds.includes(priorNode.id);
  }

  const tree = subclassName ? TALENT_TREES[subclassName] : null;
  if (!tree) return false;
  const position = findTalentNodePosition(nodeId);
  if (!position) return false;
  const { branchIndex, tierIndex } = position;
  if (tierIndex === 0) return true;
  const priorNode = tree.branches[branchIndex].nodes[tierIndex - 1];
  return unlockedIds.includes(priorNode.id);
}

function canUnlockTalent(nodeId) {
  const subject = getTalentSubjectData();
  if (!subject) return false;
  return canUnlockTalentGeneric(subject.subclassName, subject.unlockedIds, subject.pointsAvailable, nodeId);
}

function unlockTalent(nodeId) {
  if (!canUnlockTalent(nodeId)) return;

  if (talentTreeSubject.type === "companion") {
    const companion = companions[talentTreeSubject.index];
    if (!companion) return;
    companion.unlockedTalentIds = companion.unlockedTalentIds || [];
    companion.unlockedTalentIds.push(nodeId);
    companion.talentPointsAvailable = (companion.talentPointsAvailable || 0) - 1;
    scaleCompanionToLevel(companion, level);
    saveCompanionState();
    refreshCompanionSheetIfOpen();
  } else {
    unlockedTalentIds.push(nodeId);
    talentPointsAvailable -= 1;
    saveActiveRun();
    if (player && (phase === "camp" || phase === "city-place")) player = buildPlayerCharacter();
    refreshCharacterSheetIfOpen();
  }
  refreshTalentTreeIfOpen();
  render();
}

function openTalentTree(subject = { type: "player" }) {
  talentTreeSubject = subject;
  talentTreeActiveTab = "subclass";
  talentTreeSelectedNodeId = null;
  document.getElementById("talent-tree-overlay").classList.remove("hidden");
  refreshTalentTreeIfOpen();
}

function openCompanionTalentTree(index) {
  openTalentTree({ type: "companion", index });
}

function closeTalentTree() {
  document.getElementById("talent-tree-overlay").classList.add("hidden");
}

function selectTalentNode(nodeId) {
  talentTreeSelectedNodeId = nodeId;
  refreshTalentTreeIfOpen();
}

function selectTalentTreeTab(tab) {
  talentTreeActiveTab = tab;
  talentTreeSelectedNodeId = null;
  refreshTalentTreeIfOpen();
}

function refreshTalentTreeIfOpen() {
  const overlay = document.getElementById("talent-tree-overlay");
  if (overlay.classList.contains("hidden")) return;
  const subject = getTalentSubjectData();
  if (!subject) { closeTalentTree(); return; }
  const visibleTabs = subject.allowMutationTab ? TALENT_TREE_TABS : TALENT_TREE_TABS.filter((t) => t.key === "subclass");
  renderTalentTree(getActiveTalentTree(), subject.unlockedIds, subject.pointsAvailable, talentTreeSelectedNodeId, talentTreeActiveTab, visibleTabs, subject.label, {
    onSelect: selectTalentNode,
    onUnlock: unlockTalent,
    onTabChange: selectTalentTreeTab,
  });
}

function getEquippedWeaponItemsFor(equippedObj) {
  const weapons = [];
  Object.values(equippedObj).forEach((itemId) => {
    if (!itemId) return;
    const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
    if (item && item.weapon) weapons.push(item.weapon);
  });
  return weapons;
}

function getEquippedWeaponItems() {
  return getEquippedWeaponItemsFor(equipped);
}

// Equipment is a single shared Gildia stash — one physical copy per itemId,
// so it can only ever sit in exactly one slot across the player and every
// companion. Equipping it anywhere else must first pull it out of wherever
// it currently is.
function isItemEquippedAnywhere(itemId) {
  if (Object.values(equipped).includes(itemId)) return true;
  return companions.some((c) => c.equipped && Object.values(c.equipped).includes(itemId));
}

function unequipItemEverywhere(itemId) {
  Object.keys(equipped).forEach((k) => { if (equipped[k] === itemId) equipped[k] = null; });
  companions.forEach((c) => {
    if (!c.equipped) return;
    Object.keys(c.equipped).forEach((k) => { if (c.equipped[k] === itemId) c.equipped[k] = null; });
  });
}

function buildPlayerCharacter() {
  const p = createPlayer(playerName, playerGender);
  const sub = findSubclassData(selectedClassName, selectedSubclassName);
  if (sub) {
    const equipBonus = getEquipmentStatBonuses();
    const talentBonus = getTalentStatBonuses();
    const totalBonus = {
      str: bonusStats.str + equipBonus.str + talentBonus.str,
      wyt: bonusStats.wyt + equipBonus.wyt + talentBonus.wyt,
      zre: bonusStats.zre + equipBonus.zre + talentBonus.zre,
      int: bonusStats.int + equipBonus.int + talentBonus.int,
      cha: bonusStats.cha + equipBonus.cha + talentBonus.cha,
    };
    applyClassProfile(p, sub, totalBonus);
    p.pancerz += equipBonus.pancerz + talentBonus.pancerz;
    p.przebicie += equipBonus.przebicie + talentBonus.przebicie;
    p.weapons = [...p.weapons, ...getEquippedWeaponItems()];
  }
  p.class = selectedClassName;
  p.subclass = selectedSubclassName;
  return p;
}

const REPUTATION_STORAGE_KEY = "raj-sandbox-reputation";

function loadReputationState() {
  try {
    return JSON.parse(localStorage.getItem(REPUTATION_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveReputationState() {
  localStorage.setItem(REPUTATION_STORAGE_KEY, JSON.stringify(reputation));
}

// Reputation is Gildia-wide progress, like resources/equipment — it persists
// across "Nowa gra" and is never reset. Each city place tracks its own
// reputation independently; there is no shared "faction" grouping.
let reputation = loadReputationState();

function gainReputation(placeKey, amount) {
  if (!placeKey) return;
  reputation[placeKey] = (reputation[placeKey] || 0) + amount;
  saveReputationState();
}

function getReputationDiscount(placeKey) {
  return Math.min(0.20, (reputation[placeKey] || 0) * 0.01);
}

function getDiscountedCost(item) {
  const discount = getReputationDiscount(item.vendor);
  if (discount <= 0) return item.cost.amount;
  return Math.max(1, Math.round(item.cost.amount * (1 - discount)));
}

function canAffordItem(item) {
  const owned = resources[item.cost.currency] ? resources[item.cost.currency].amount : 0;
  return owned >= getDiscountedCost(item);
}

function refreshCharacterSheetIfOpen() {
  const overlay = document.getElementById("character-sheet-overlay");
  if (overlay.classList.contains("hidden")) return;
  renderCharacterSheet(
    player, inventory, equipped, resources, potionInventory, equipmentUpgrades,
    { level, xp, xpToNext: xpToNextLevel(level), bonusStats, statPointsAvailable, talentPointsAvailable, corruption, devouredCount, mutationTier: mutationTier() },
    { onBuy: buyEquipment, onEquip: equipItem, onUnequip: unequipSlot, onAdjustStat: adjustBonusStat, onBuyPotion: buyPotion },
  );
}

function buyEquipment(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item || inventory.includes(itemId) || !canAffordItem(item)) return;
  resources[item.cost.currency].amount -= getDiscountedCost(item);
  saveResources();
  inventory.push(itemId);
  saveEquipmentState();
  gainReputation(item.vendor, 1);
  render();
  refreshCharacterSheetIfOpen();
}

function equipItem(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item || !inventory.includes(itemId)) return;
  unequipItemEverywhere(itemId);
  equipped[resolveEquipSlotKey(item, equipped)] = itemId;
  saveEquipmentState();
  companions.forEach((c) => scaleCompanionToLevel(c, level));
  saveCompanionState();
  if (player && phase === "camp") player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
  refreshCompanionSheetIfOpen();
}

function unequipSlot(slotKey) {
  equipped[slotKey] = null;
  saveEquipmentState();
  if (player && phase === "camp") player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
}

function equipItemToCompanion(companionIndex, itemId) {
  const companion = companions[companionIndex];
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!companion || !item || !inventory.includes(itemId)) return;
  if (!companion.equipped) companion.equipped = defaultEquippedState();
  unequipItemEverywhere(itemId);
  companion.equipped[resolveEquipSlotKey(item, companion.equipped)] = itemId;
  companions.forEach((c) => scaleCompanionToLevel(c, level));
  saveEquipmentState();
  saveCompanionState();
  if (player && phase === "camp") player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
  refreshCompanionSheetIfOpen();
}

function unequipCompanionSlot(companionIndex, slotKey) {
  const companion = companions[companionIndex];
  if (!companion || !companion.equipped) return;
  companion.equipped[slotKey] = null;
  scaleCompanionToLevel(companion, level);
  saveCompanionState();
  render();
  refreshCompanionSheetIfOpen();
}

const SELL_REFUND_RATE = 0.5;

function sellEquipment(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item || !inventory.includes(itemId) || isItemEquippedAnywhere(itemId)) return;
  const refund = Math.ceil(item.cost.amount * SELL_REFUND_RATE);
  resources[item.cost.currency].amount += refund;
  saveResources();
  inventory = inventory.filter((id) => id !== itemId);
  delete equipmentUpgrades[itemId];
  saveEquipmentState();
  gainReputation("czarny_rynek", 1);
  render();
  refreshCharacterSheetIfOpen();
}

function sellPotion(potionId) {
  const potion = POTION_ITEMS.find((p) => p.id === potionId);
  if (!potion || !potionInventory[potionId]) return;
  const refund = Math.ceil(potion.cost.amount * SELL_REFUND_RATE);
  resources[potion.cost.currency].amount += refund;
  saveResources();
  potionInventory[potionId]--;
  if (potionInventory[potionId] <= 0) delete potionInventory[potionId];
  savePotionInventory();
  gainReputation("czarny_rynek", 1);
  render();
  refreshCharacterSheetIfOpen();
}

let lastGambleResult = null;

function gambleAtTavern(currency, betAmount) {
  const owned = resources[currency] ? resources[currency].amount : 0;
  if (owned < betAmount) return;
  resources[currency].amount -= betAmount;

  const roll = rollD20();
  let payout, text;
  if (roll <= 8) {
    payout = 0;
    text = `K20=${roll}: przegrywasz zakład (${betAmount} × ${currency}).`;
  } else if (roll <= 14) {
    payout = betAmount;
    text = `K20=${roll}: remis, odzyskujesz zakład (${betAmount} × ${currency}).`;
  } else {
    payout = betAmount * 2;
    text = `K20=${roll}: wygrywasz podwójną stawkę! (+${payout} × ${currency})`;
  }
  if (payout > 0) resources[currency].amount += payout;
  saveResources();
  gainReputation("tawerna", 1);

  lastGambleResult = { roll, payout, text };
  render();
}

function openCharacterSheet() {
  document.getElementById("character-sheet-overlay").classList.remove("hidden");
  refreshCharacterSheetIfOpen();
}

function closeCharacterSheet() {
  document.getElementById("character-sheet-overlay").classList.add("hidden");
}

function saveActiveRun() {
  const data = {
    phase,
    player,
    selectedClassName,
    selectedSubclassName,
    playerName,
    playerGender,
    bonusStats,
    level,
    xp,
    statPointsAvailable,
    unlockedTalentIds,
    talentPointsAvailable,
    corruption,
    devouredCount,
    prologueStep,
    introStep,
    locationKey: currentLocation ? currentLocation.key : null,
    cityPlaceKey: currentCityPlace ? currentCityPlace.key : null,
    savedAt: Date.now(),
  };
  if (dungeonMapState !== null) {
    data.dungeonMapState = dungeonMapState;
    data.dungeonPlayerHex = dungeonPlayerHex;
    data.dungeonRevealedKeys = Array.from(dungeonRevealedKeys);
    data.dungeonActiveInteraction = dungeonActiveInteraction;
    data.postBattleReturnPhase = postBattleReturnPhase;
    data.dungeonHpLoss = dungeonHpLoss;
    data.dungeonBattleBuff = dungeonBattleBuff;
  }
  if (phase === "deployment" || phase === "battle") {
    data.enemies = enemies;
    data.companions = companions;
    data.selectedTargetIndex = selectedTargetIndex;
    data.battleOver = battleOver;
    data.playerActionsRemaining = playerActionsRemaining;
    data.obstacles = OBSTACLES;
    data.obstacleTypes = [...OBSTACLE_TYPES.entries()];
    data.isBossBattle = isBossBattle;
    data.isCampaignBattle = isCampaignBattle;
    data.activeCampaignChapterId = activeCampaignChapterId;
  }
  localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(data));
}

function loadActiveRunData() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_RUN_KEY));
  } catch {
    return null;
  }
}

function clearActiveRun() {
  localStorage.removeItem(ACTIVE_RUN_KEY);
}

function applyActiveRunData(data) {
  player = data.player;
  selectedClassName = data.selectedClassName;
  selectedSubclassName = data.selectedSubclassName;
  playerName = data.playerName || "";
  playerGender = data.playerGender || null;
  bonusStats = data.bonusStats || { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  level = data.level || 1;
  xp = data.xp || 0;
  statPointsAvailable = data.statPointsAvailable || 10;
  unlockedTalentIds = data.unlockedTalentIds || [];
  talentPointsAvailable = data.talentPointsAvailable || 0;
  // Migration: the talent tree content was rebuilt (DAO-style branches),
  // so ids from the previous tree structure no longer resolve. Drop them
  // and refund their points rather than silently losing progress.
  const validTalentIds = unlockedTalentIds.filter((id) => findTalentNode(id));
  talentPointsAvailable += unlockedTalentIds.length - validTalentIds.length;
  unlockedTalentIds = validTalentIds;
  if (!player.skillCooldowns || Array.isArray(player.skillCooldowns)) player.skillCooldowns = {};
  corruption = data.corruption || 0;
  devouredCount = data.devouredCount || 0;
  prologueStep = data.prologueStep || 0;
  introStep = data.introStep || 0;
  currentLocation = LOCATIONS.find((l) => l.key === data.locationKey)
    || (data.locationKey === ARENA_LOCATION.key ? ARENA_LOCATION : null)
    || (data.locationKey === CAMPAIGN_FINALE_LOCATION.key ? CAMPAIGN_FINALE_LOCATION : null);
  currentCityPlace = CITY_PLACES.find((p) => p.key === data.cityPlaceKey) || null;
  phase = data.phase;

  closeRadialMenu();
  radialMenuOpen = false;
  clearLog();

  if (data.dungeonMapState) {
    dungeonMapState = data.dungeonMapState;
    dungeonPlayerHex = data.dungeonPlayerHex || dungeonMapState.entranceHex;
    dungeonRevealedKeys = new Set(data.dungeonRevealedKeys || []);
    dungeonActiveInteraction = data.dungeonActiveInteraction || null;
    postBattleReturnPhase = data.postBattleReturnPhase || "camp";
    dungeonHpLoss = data.dungeonHpLoss || 0;
    dungeonBattleBuff = data.dungeonBattleBuff || { pancerz: 0 };
  } else {
    dungeonMapState = null;
    dungeonPlayerHex = null;
    dungeonRevealedKeys = new Set();
    dungeonActiveInteraction = null;
    postBattleReturnPhase = "camp";
  }

  if (phase === "deployment" || phase === "battle") {
    enemies = data.enemies;
    companions = data.companions || companions;
    isBossBattle = data.isBossBattle || false;
    isCampaignBattle = data.isCampaignBattle || false;
    activeCampaignChapterId = data.activeCampaignChapterId || null;
    selectedTargetIndex = data.selectedTargetIndex;
    battleOver = data.battleOver;
    playerActionsRemaining = data.playerActionsRemaining;
    restoreObstacles(data.obstacles, data.obstacleTypes);
    resetTokenLayer();
  }

  appendLog("Wznowiono grę.", "system");
  render();
}

function resumeGame() {
  const data = loadActiveRunData();
  if (!data) return;
  applyActiveRunData(data);
}

function selectLocation(location) {
  currentLocation = location;
  appendLog(`${location.icon} ${location.name}: ${location.description}`, "system");
  startDungeonMapCrawl();
}

function backToLocationSelect() {
  phase = "location-select";
  closeRadialMenu();
  radialMenuOpen = false;
  render();
}

function goToMainMenu() {
  phase = "main-menu";
  closeRadialMenu();
  radialMenuOpen = false;
  closePotionMenu();
  render();
}

function goToCamp() {
  phase = "camp";
  // Reaching camp always means any dungeon crawl has concluded (ambush
  // battles use postBattleReturnPhase="dungeon-map" specifically to route
  // through returnFromBattle instead of here) — clear it so a finished
  // crawl's map doesn't linger in every future save.
  dungeonMapState = null;
  dungeonPlayerHex = null;
  dungeonRevealedKeys = new Set();
  dungeonActiveInteraction = null;
  closeRadialMenu();
  radialMenuOpen = false;
  closePotionMenu();
  render();
}

function goToCitySelect() {
  phase = "city-select";
  render();
}

function selectCityPlace(place) {
  currentCityPlace = place;
  lastGambleResult = null;
  phase = "city-place";
  render();
}

function enterArena() {
  currentLocation = ARENA_LOCATION;
  isCampaignBattle = false;
  activeCampaignChapterId = null;
  startNewBattle();
}

function openTest3D() {
  phase = "test3d";
  render();
  if (window.mountTest3D) window.mountTest3D();
}

function closeTest3D() {
  if (window.stopTest3D) window.stopTest3D();
  phase = "main-menu";
  render();
}

function startNewGame() {
  clearActiveRun();
  selectedClassName = null;
  selectedSubclassName = null;
  currentLocation = null;
  playerName = "";
  playerGender = null;
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  level = 1;
  xp = 0;
  statPointsAvailable = 10;
  unlockedTalentIds = [];
  talentPointsAvailable = 0;
  corruption = 0;
  devouredCount = 0;
  dungeonMapState = null;
  dungeonPlayerHex = null;
  dungeonRevealedKeys = new Set();
  dungeonActiveInteraction = null;
  postBattleReturnPhase = "camp";
  companions = [];
  recruitPool = [];
  firedBanters = [];
  saveCompanionState();
  introStep = 0;
  phase = "intro";
  render();
}

function advanceIntro() {
  const beats = LORE_DATA.world.paragraphs;
  if (introStep >= beats.length - 1) {
    phase = "character-creation";
  } else {
    introStep++;
  }
  render();
}

function skipIntro() {
  phase = "character-creation";
  render();
}

function selectCreationClass(cls) {
  selectedClassName = cls.name;
  selectedSubclassName = null;
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  render();
}

function selectCreationSubclass(sub) {
  selectedSubclassName = sub.name;
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  render();
}

function adjustBonusStat(key, delta) {
  const spent = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  const next = bonusStats[key] + delta;
  if (next < 0) return;
  if (delta > 0 && spent >= statPointsAvailable) return;
  bonusStats[key] = next;
  if (player && phase === "camp") player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
}

const RESPEC_COST = { currency: "Kryształy Esencji", amount: 15 };

function respecStats() {
  const spentStats = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  const spentTalents = unlockedTalentIds.length;
  if (spentStats + spentTalents <= 0 || !canAffordItem({ cost: RESPEC_COST })) return;
  resources[RESPEC_COST.currency].amount -= RESPEC_COST.amount;
  saveResources();
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  talentPointsAvailable += spentTalents;
  unlockedTalentIds = [];
  if (player && (phase === "camp" || phase === "city-place")) player = buildPlayerCharacter();
  render();
  refreshCharacterSheetIfOpen();
  refreshTalentTreeIfOpen();
}

function adjustCompanionBonusStat(index, key, delta) {
  const companion = companions[index];
  if (!companion) return;
  if (!companion.bonusStats) companion.bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  const spent = Object.values(companion.bonusStats).reduce((a, b) => a + b, 0);
  const next = companion.bonusStats[key] + delta;
  if (next < 0) return;
  if (delta > 0 && spent >= (companion.statPointsAvailable || 0)) return;
  companion.bonusStats[key] = next;
  scaleCompanionToLevel(companion, level);
  saveCompanionState();
  render();
  refreshCompanionSheetIfOpen();
}

function respecCompanionStats(index) {
  const companion = companions[index];
  if (!companion) return;
  const spentStats = Object.values(companion.bonusStats || {}).reduce((a, b) => a + b, 0);
  const spentTalents = (companion.unlockedTalentIds || []).length;
  if (spentStats + spentTalents <= 0 || !canAffordItem({ cost: RESPEC_COST })) return;
  resources[RESPEC_COST.currency].amount -= RESPEC_COST.amount;
  saveResources();
  companion.bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  companion.talentPointsAvailable = (companion.talentPointsAvailable || 0) + spentTalents;
  companion.unlockedTalentIds = [];
  scaleCompanionToLevel(companion, level);
  saveCompanionState();
  render();
  refreshCompanionSheetIfOpen();
  refreshTalentTreeIfOpen();
}

const CORRUPTION_CLEANSE_COST = { currency: "Kryształy Esencji", amount: 25 };

function cleanseCorruption() {
  if (corruption <= 0 || !canAffordItem({ cost: CORRUPTION_CLEANSE_COST })) return;
  resources[CORRUPTION_CLEANSE_COST.currency].amount -= CORRUPTION_CLEANSE_COST.amount;
  saveResources();
  corruption = 0;
  render();
  refreshCharacterSheetIfOpen();
}

// The Kult Spaczenia's mirror-image service to the Temple's cleanse: instead
// of erasing corruption, it deliberately buys more of it — and, unlike
// Mutuj się/Pożryj szczątki (battle-only), reuses the exact same
// devouredCount/mutationTier system to grant a permanent mutation step
// outside of combat.
const EMBRACE_RITUAL_COST = { currency: "Kryształy Esencji", amount: 20 };
const EMBRACE_RITUAL_CORRUPTION_GAIN = 8;

function performEmbraceRitual() {
  if (!canAffordItem({ cost: EMBRACE_RITUAL_COST })) return;
  resources[EMBRACE_RITUAL_COST.currency].amount -= EMBRACE_RITUAL_COST.amount;
  saveResources();
  corruption = Math.min(100, corruption + EMBRACE_RITUAL_CORRUPTION_GAIN);
  devouredCount++;
  appendLog(`🌀 Rytuał wchłonięcia podnosi Twoje spaczenie do ${corruption}% i wzmacnia mutację (tier ${mutationTier()}).`, "system");
  render();
  refreshCharacterSheetIfOpen();
}

function setPlayerName(value) {
  playerName = value;
  render();
}

function setPlayerGender(gender) {
  playerGender = gender;
  render();
}

let prologueStep = 0;
let introStep = 0;

function confirmCharacterCreation() {
  if (!playerName.trim() || !playerGender || !selectedSubclassName) return;
  player = buildPlayerCharacter();
  prologueStep = 0;
  phase = "prologue";
  render();
}

function advancePrologue() {
  const prologue = CLASS_PROLOGUES[selectedClassName];
  if (!prologue || prologueStep >= prologue.beats.length - 1) {
    phase = "camp";
  } else {
    prologueStep++;
  }
  render();
}

function skipPrologue() {
  phase = "camp";
  render();
}

function exitGame() {
  const screen = document.getElementById("main-menu-screen");
  screen.innerHTML = "<h2>Raj</h2><p class=\"main-menu-subtitle\">Dziękujemy za grę! Możesz bezpiecznie zamknąć tę kartę przeglądarki.</p>";
  window.close();
}

function openSettingsModal() {
  document.getElementById("settings-overlay").classList.remove("hidden");
  document.getElementById("music-volume-slider").value = Math.round(musicVolume * 100);
}

function closeSettingsModal() {
  document.getElementById("settings-overlay").classList.add("hidden");
}

function clearAllProgress() {
  if (!confirm("Na pewno chcesz wyczyścić cały postęp? Zasoby, ekwipunek, mikstury, bestiariusz, zadania i zapisana gra zostaną utracone bezpowrotnie.")) return;
  clearActiveRun();
  resources = {};
  saveResources();
  inventory = [];
  equipped = defaultEquippedState();
  equipmentUpgrades = {};
  saveEquipmentState();
  potionInventory = {};
  savePotionInventory();
  discoveredEnemies = [];
  saveDiscoveredEnemies();
  defeatedBosses = [];
  saveDefeatedBosses();
  totalKills = 0;
  claimedQuests = [];
  saveQuestState();
  companions = [];
  recruitPool = [];
  firedBanters = [];
  saveCompanionState();
  selectedClassName = null;
  selectedSubclassName = null;
  currentLocation = null;
  playerName = "";
  playerGender = null;
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  level = 1;
  xp = 0;
  statPointsAvailable = 10;
  unlockedTalentIds = [];
  talentPointsAvailable = 0;
  closeSettingsModal();
  phase = "main-menu";
  render();
}

function openLoadGameModal() {
  const data = loadActiveRunData();
  const summaryEl = document.getElementById("load-game-summary");
  const confirmBtn = document.getElementById("load-game-confirm-btn");
  if (!data) {
    summaryEl.textContent = "Brak zapisanej gry.";
    confirmBtn.classList.add("hidden");
  } else {
    const loc = LOCATIONS.find((l) => l.key === data.locationKey);
    const locText = loc ? `${loc.icon} ${loc.name}` : "🏕️ Obóz";
    const classText = data.selectedClassName
      ? `${data.selectedClassName}${data.selectedSubclassName ? " — " + data.selectedSubclassName : ""}`
      : "brak wybranej klasy";
    const when = new Date(data.savedAt).toLocaleString("pl-PL");
    summaryEl.textContent = `${locText} • ${classText} • zapisano: ${when}`;
    confirmBtn.classList.remove("hidden");
  }
  document.getElementById("load-game-overlay").classList.remove("hidden");
}

function closeLoadGameModal() {
  document.getElementById("load-game-overlay").classList.add("hidden");
}

function confirmLoadGame() {
  closeLoadGameModal();
  resumeGame();
}

function isOccupied(hex, excluding) {
  const all = [player, ...companions, ...enemies];
  return all.some((c) => c !== excluding && c.currentHP > 0 && c.pos && hexEquals(c.pos, hex));
}

function reachableFor(combatant) {
  return bfsReachable(combatant.pos, combatant.moveRange, (hex) => isObstacle(hex) || isOccupied(hex, combatant));
}

function deployEnemiesRandomly() {
  const zoneHexes = ALL_HEXES.filter((h) => isEnemyDeployHex(h) && !isObstacle(h));
  const safeZoneHexes = zoneHexes.filter(hasAnyOpenNeighbor);
  const pool = safeZoneHexes.length > 0 ? safeZoneHexes : zoneHexes;

  for (const enemy of enemies) {
    const free = pool.filter((h) => !isOccupied(h, enemy));
    const options = free.length > 0 ? free : zoneHexes.filter((h) => !isOccupied(h, enemy));
    enemy.pos = options[Math.floor(Math.random() * options.length)];
  }
}

function deployCompanionsRandomly() {
  const zoneHexes = ALL_HEXES.filter((h) => isPlayerDeployHex(h) && !isObstacle(h));

  for (const companion of companions) {
    const free = zoneHexes.filter((h) => !isOccupied(h, companion));
    const options = free.length > 0 ? free : zoneHexes;
    companion.pos = options[Math.floor(Math.random() * options.length)];
  }
}

function startNewBattle() {
  regenerateObstacles(currentLocation ? currentLocation.obstacleBias : null);
  resetTokenLayer();
  closeRadialMenu();
  radialMenuOpen = false;

  player = buildPlayerCharacter();
  if (pendingBossFight && currentLocation && currentLocation.bossKey) {
    const boss = BOSS_TEMPLATES[currentLocation.bossKey]();
    boss.templateKey = currentLocation.bossKey;
    enemies = [boss];
    isBossBattle = true;
  } else {
    enemies = createEnemies(currentLocation, pendingAmbushEnemyBounds || {});
    isBossBattle = false;
  }
  pendingBossFight = false;
  pendingAmbushEnemyBounds = null;
  enemies.forEach((enemy) => scaleEnemyForLevel(enemy, level));
  companions.forEach((companion) => scaleCompanionToLevel(companion, level));

  if (currentLocation && currentLocation.key !== ARENA_LOCATION.key) {
    rotateRecruitPool();
  }

  const defaultPos = getStartPositions().player;
  player.pos = isObstacle(defaultPos)
    ? (ALL_HEXES.find((h) => isPlayerDeployHex(h) && !isObstacle(h) && hasAnyOpenNeighbor(h))
      || ALL_HEXES.find((h) => isPlayerDeployHex(h) && !isObstacle(h)))
    : defaultPos;
  deployEnemiesRandomly();
  deployCompanionsRandomly();

  selectedTargetIndex = 0;
  battleOver = false;
  playerActionsRemaining = 1 + player.extraActions;
  phase = "deployment";

  clearLog();
  appendLog("Rozstawianie: kliknij pole w swojej strefie (3 lewe kolumny), żeby ustawić postać. Przeciwnik już się rozstawił.", "system");
  if (isBossBattle) {
    appendLog(`👑 To walka z bossem: ${enemies[0].icon} ${enemies[0].name}!`, "system");
  }
  if (level > 1) {
    appendLog(`Przeciwnicy są silniejsi, dopasowani do Twojego poziomu (${level}).`, "system");
  }
  if (dungeonHpLoss > 0) {
    player.currentHP = Math.max(1, player.currentHP - dungeonHpLoss);
    appendLog(`Wchodzisz do walki osłabiony po przejściu przez lochy (-${dungeonHpLoss} HP).`, "system");
    dungeonHpLoss = 0;
  }
  if (dungeonBattleBuff.pancerz > 0) {
    player.pancerz += dungeonBattleBuff.pancerz;
    appendLog(`Błogosławieństwo ołtarza wzmacnia twój pancerz na tę walkę (+${Math.round(dungeonBattleBuff.pancerz * 100)}%).`, "system");
    dungeonBattleBuff = { pancerz: 0 };
  }
  maybeTriggerCompanionBanter();
  render();
}

function inRange(attacker, defender) {
  return hexDistance(attacker.pos, defender.pos) <= attacker.weapon.range;
}

function triggerAttackFx(result, defenderPos) {
  if (!result.hit) {
    spawnHitEffect(defenderPos, { text: "Pudło!", cssClass: "miss" });
    return;
  }
  const isCrit = result.d6 === 6;
  spawnHitEffect(defenderPos, { text: `-${result.damage}`, cssClass: isCrit ? "crit" : "" });
  triggerScreenShake(isCrit ? "crit" : "normal");
}

function openPlayerActionMenu() {
  radialMenuOpen = true;
  const skillOptions = playerSkills().map((skill) => ({
    icon: skill.icon,
    label: skillButtonLabel(skill.id),
    disabled: playerActionsRemaining <= 0 || skillCooldownFor(skill.id) > 0,
    onClick: () => {
      radialMenuOpen = false;
      castSkill(skill.id);
    },
  }));
  showRadialMenu(player.pos, [
    {
      icon: "🔁",
      label: "Zmień broń",
      disabled: playerActionsRemaining <= 0 || player.weapons.length < 2,
      onClick: () => {
        radialMenuOpen = false;
        if (playerActionsRemaining > 0 && player.weapons.length > 1) {
          switchWeapon(player);
          playWeaponSwitchSound();
          playerActionsRemaining--;
          appendLog(`Zmieniasz broń na: ${player.weapon.name} (koszt: 1 akcja).`, "system");
          if (playerActionsRemaining <= 0) {
            enemyPhase();
          } else {
            render();
          }
        } else {
          render();
        }
      },
    },
    ...skillOptions,
    {
      icon: "🧪",
      label: potionButtonLabel(),
      disabled: playerActionsRemaining <= 0 || Object.keys(potionInventory).length === 0,
      onClick: () => {
        radialMenuOpen = false;
        openPotionMenu();
      },
    },
    {
      icon: "🧬",
      label: mutateButtonLabel(),
      disabled: playerActionsRemaining <= 0 || (player.mutateCooldown || 0) > 0,
      onClick: () => {
        radialMenuOpen = false;
        mutateSelf();
      },
    },
    {
      icon: "🍖",
      label: devourButtonLabel(),
      disabled: playerActionsRemaining <= 0 || !devourableCorpse(),
      onClick: () => {
        radialMenuOpen = false;
        devourCorpse();
      },
    },
  ]);
}

function potionButtonLabel() {
  const totalCount = Object.values(potionInventory).reduce((a, b) => a + b, 0);
  return totalCount > 0 ? `Mikstury (${totalCount})` : "Mikstury (brak)";
}

// Combines the 2 innate subclass spells with any active/sustained talent
// nodes the player has unlocked — all skill-shaped objects resolved by the
// same castSkill()/applySkillEffect() engine, keyed by stable `id` (not
// array index, since the talent-granted portion of this list changes size).
function playerSkills() {
  const subclassData = findSubclassData(player.class, player.subclass);
  const baseSkills = (subclassData && subclassData.skills) || [];
  return [...baseSkills, ...getUnlockedActiveTalents()];
}

function skillCooldownFor(id) {
  return (player.skillCooldowns && player.skillCooldowns[id]) || 0;
}

function skillButtonLabel(id) {
  const skill = playerSkills().find((s) => s.id === id);
  if (!skill) return "Umiejętności (wybierz klasę)";
  const cd = skillCooldownFor(id);
  if (cd > 0) return `${skill.name} (odnowienie: ${cd})`;
  return skill.name;
}

function handleHexClick(hex) {
  if (battleOver) return;

  if (phase === "deployment") {
    if (isPlayerDeployHex(hex) && !isObstacle(hex) && !isOccupied(hex, player)) {
      player.pos = hex;
      render();
    }
    return;
  }

  if (hexEquals(hex, player.pos)) {
    if (radialMenuOpen) {
      closeRadialMenu();
      radialMenuOpen = false;
    } else {
      openPlayerActionMenu();
    }
    return;
  }

  if (radialMenuOpen) {
    closeRadialMenu();
    radialMenuOpen = false;
  }

  if (playerActionsRemaining > 0) {
    const reachable = reachableFor(player);
    if (reachable.some((h) => hexEquals(h, hex))) {
      player.pos = hex;
      playMoveSound();
      playerActionsRemaining--;
      appendLog("Przemieszczasz się (koszt: 1 akcja).", "system");
      if (playerActionsRemaining <= 0) {
        enemyPhase();
      } else {
        render();
      }
      return;
    }
  }

  const idx = enemies.findIndex((e) => e.pos && hexEquals(e.pos, hex) && e.currentHP > 0);
  if (idx !== -1) {
    selectedTargetIndex = idx;
    render();
  }
}

function findSubclassData(className, subclassName) {
  const cls = CLASS_DATA.find((c) => c.name === className);
  return cls && cls.subclasses.find((s) => s.name === subclassName);
}

let boardViewMode = "2d";

function musicKeyForGameState() {
  if (phase === "city-place" && currentCityPlace) {
    if (currentCityPlace.key === "tawerna") return "tavern";
    if (currentCityPlace.key === "kult_spaczenia") return "corruption";
    return "city";
  }
  if (phase === "city-select") return "city";
  if (phase === "dungeon-map") return "dungeon";
  if (phase === "deployment" || phase === "battle") return isBossBattle ? "boss" : "battle";
  if (phase === "epilogue") return "corruption";
  if (phase === "camp" || phase === "location-select") return "camp";
  return "menu";
}

function render() {
  playMusicKey(musicKeyForGameState());

  if (phase !== "deployment" && phase !== "battle" && window.stopBoard3D) {
    window.stopBoard3D();
  }

  const mainMenuScreen = document.getElementById("main-menu-screen");
  const introScreen = document.getElementById("intro-screen");
  const test3dScreen = document.getElementById("test3d-screen");
  const creationScreen = document.getElementById("character-creation-screen");
  const prologueScreen = document.getElementById("prologue-screen");
  const epilogueScreen = document.getElementById("epilogue-screen");
  const campScreen = document.getElementById("camp-screen");
  const cityScreen = document.getElementById("city-screen");
  const cityPlaceScreen = document.getElementById("city-place-screen");
  const locationScreen = document.getElementById("location-screen");
  const dungeonScreen = document.getElementById("dungeon-screen");
  const gameScreen = document.getElementById("game-screen");

  const allScreens = [mainMenuScreen, introScreen, test3dScreen, creationScreen, prologueScreen, epilogueScreen, campScreen, cityScreen, cityPlaceScreen, locationScreen, dungeonScreen, gameScreen];
  const hideAllExcept = (visible) => {
    allScreens.forEach((el) => {
      if (el === visible) el.classList.remove("hidden");
      else el.classList.add("hidden");
    });
  };

  if (phase === "test3d") {
    hideAllExcept(test3dScreen);
    return;
  }

  if (phase === "main-menu") {
    hideAllExcept(mainMenuScreen);
    renderMainMenuState(loadActiveRunData());
    return;
  }

  if (phase === "intro") {
    hideAllExcept(introScreen);
    renderIntroCinematic(introStep);
    saveActiveRun();
    return;
  }

  if (phase === "character-creation") {
    hideAllExcept(creationScreen);
    renderCharacterCreation(
      { playerName, playerGender, selectedClassName, selectedSubclassName, bonusStats, statPointsAvailable },
      { onSelectClass: selectCreationClass, onSelectSubclass: selectCreationSubclass, onAdjustStat: adjustBonusStat },
    );
    return;
  }

  if (phase === "prologue") {
    hideAllExcept(prologueScreen);
    renderPrologue(CLASS_PROLOGUES[selectedClassName], prologueStep);
    saveActiveRun();
    return;
  }

  if (phase === "epilogue") {
    hideAllExcept(epilogueScreen);
    renderEpilogue(CAMPAIGN_CHAPTERS.find((c) => c.isFinale), selectedClassName, corruption, getStoryChoicesSummary());
    saveActiveRun();
    return;
  }

  if (phase === "camp") {
    hideAllExcept(campScreen);
    renderCamp(player, level, xp, xpToNextLevel(level));
    saveActiveRun();
    return;
  }

  if (phase === "city-select") {
    hideAllExcept(cityScreen);
    renderCityPicker(CITY_PLACES, selectCityPlace);
    saveActiveRun();
    return;
  }

  if (phase === "city-place") {
    hideAllExcept(cityPlaceScreen);
    renderCityPlace(
      currentCityPlace,
      { inventory, equipped, resources, equipmentUpgrades, bonusStats, potionInventory, lastGambleResult, recruitPool, companions, corruption, devouredCount, mutationTier: mutationTier(), claimedNpcQuests, reputation, sideQuestProgress },
      {
        onBuy: buyEquipment, onUpgrade: upgradeEquipment, onCraft: craftItem, onRespec: respecStats,
        onEnterArena: enterArena, onSellEquipment: sellEquipment, onSellPotion: sellPotion, onGamble: gambleAtTavern,
        onRecruit: openRecruitScene, onCleanseCorruption: cleanseCorruption, onEmbraceRitual: performEmbraceRitual,
        onTalkToNpc: talkToNpc, onClaimNpcQuest: claimNpcQuestReward,
        onOpenSideQuest: continueSideQuestAtNpc,
      },
    );
    saveActiveRun();
    return;
  }

  if (phase === "location-select") {
    hideAllExcept(locationScreen);
    renderLocationPicker(LOCATIONS, currentLocation, selectLocation);
    saveActiveRun();
    return;
  }

  if (phase === "dungeon-map") {
    hideAllExcept(dungeonScreen);
    renderDungeonMap({
      mapData: dungeonMapState,
      playerHex: dungeonPlayerHex,
      revealedKeys: dungeonRevealedKeys,
      activeInteraction: dungeonActiveInteraction,
      location: currentLocation,
      onHexClick: handleDungeonHexClick,
      onChooseA: chooseDungeonInteractionA,
      onChooseB: chooseDungeonInteractionB,
      onDismiss: dismissDungeonInteraction,
    });
    saveActiveRun();
    return;
  }

  hideAllExcept(gameScreen);
  renderLocationBanner(currentLocation, isBossBattle);

  const playerContainer = document.getElementById("player-fighter");
  playerContainer.innerHTML = "";
  renderFighter(playerContainer, player);

  const companionsContainer = document.getElementById("companions-list");
  companionsContainer.innerHTML = "";
  companions.forEach((companion) => renderFighter(companionsContainer, companion));

  const enemiesContainer = document.getElementById("enemies-list");
  enemiesContainer.innerHTML = "";
  enemies.forEach((enemy, index) => {
    const isSelected = index === selectedTargetIndex;
    const showPreview = phase === "battle" && isSelected && enemy.currentHP > 0 && inRange(player, enemy);
    const damagePreview = showPreview
      ? estimateAverageDamage(player, enemy, { allCombatants: [player, ...companions, ...enemies] })
      : null;

    renderFighter(enemiesContainer, enemy, {
      selectable: true,
      selected: isSelected,
      onClick: () => {
        selectedTargetIndex = index;
        render();
      },
      damagePreview,
    });
  });

  const deployHexes = phase === "deployment"
    ? (() => {
        const zoneHexes = ALL_HEXES.filter((h) => isPlayerDeployHex(h) && !isObstacle(h));
        const safeZoneHexes = zoneHexes.filter(hasAnyOpenNeighbor);
        return safeZoneHexes.length > 0 ? safeZoneHexes : zoneHexes;
      })()
    : [];

  const boardArgs = {
    player,
    companions,
    enemies: phase === "deployment" ? [] : enemies,
    obstacles: OBSTACLES,
    reachableHexes: phase === "battle" && !battleOver && playerActionsRemaining > 0 ? reachableFor(player) : [],
    deployHexes,
    onHexClick: handleHexClick,
    location: currentLocation,
  };

  const battleMapSvg = document.getElementById("battle-map");
  const battleMap3d = document.getElementById("battle-map-3d");
  const use3d = boardViewMode === "3d" && window.renderBoard3D;
  battleMapSvg.classList.toggle("hidden", !!use3d);
  battleMap3d.classList.toggle("hidden", !use3d);
  if (use3d) {
    window.renderBoard3D({ ...boardArgs, container: battleMap3d });
  } else {
    if (window.stopBoard3D) window.stopBoard3D();
    renderGrid({ ...boardArgs, svg: battleMapSvg });
  }
  document.getElementById("view-toggle-btn").textContent = use3d ? "🗺️ Widok 2D" : "🧊 Widok 3D";

  const deployBtn = document.getElementById("start-battle-btn");
  deployBtn.style.display = phase === "deployment" ? "" : "none";

  const target = enemies[selectedTargetIndex];
  const targetInRange = target && target.currentHP > 0 && inRange(player, target);

  const attackBtn = document.getElementById("attack-btn");
  const endTurnBtn = document.getElementById("end-turn-btn");
  attackBtn.style.display = phase === "battle" ? "" : "none";
  endTurnBtn.style.display = phase === "battle" ? "" : "none";
  attackBtn.disabled = battleOver || playerActionsRemaining <= 0 || !targetInRange;
  attackBtn.textContent = targetInRange || !target
    ? `Atakuj wybrany cel (akcje: ${playerActionsRemaining}/${1 + player.extraActions})`
    : `Poza zasięgiem (zasięg ${player.weapon.range})`;
  endTurnBtn.disabled = battleOver;

  const changeLocationBtn = document.getElementById("change-location-btn");
  const midEncounter = (phase === "deployment" || phase === "battle") && !battleOver;
  changeLocationBtn.disabled = midEncounter;
  changeLocationBtn.title = midEncounter ? "Nie możesz opuścić starcia w jego trakcie — dokończ walkę." : "";
  changeLocationBtn.textContent = postBattleReturnPhase === "dungeon-map" ? "↩️ Wróć do lochu" : "🏕️ Wróć do obozu";

  saveActiveRun();
}

function playerAttack() {
  if (battleOver || playerActionsRemaining <= 0) return;
  closeRadialMenu();
  radialMenuOpen = false;
  if (rollMadnessEpisode()) {
    triggerMadnessEpisode();
    return;
  }
  const target = enemies[selectedTargetIndex];
  if (!target || target.currentHP <= 0) {
    appendLog("Wybierz żywy cel.", "system");
    return;
  }
  if (!inRange(player, target)) {
    appendLog(`${target.name} jest poza zasięgiem (${player.weapon.range}). Podejdź bliżej.`, "system");
    return;
  }

  const context = { allCombatants: [player, ...companions, ...enemies], obstacles: OBSTACLES };
  const result = resolveAttack(player, target, context);
  const { text, cssClass } = formatAttackResult(result);
  appendLog(text, cssClass);
  triggerAttackFx(result, target.pos);
  if (result.hit) playHitSound(result.d6 === 6); else playMissSound();
  playerActionsRemaining--;

  finishPlayerAction(target);
}

function awardVictory(message) {
  appendLog(message, "system");
  playVictorySound();
  battleOver = true;
  awardLocationResources();
  if (isBossBattle) {
    awardLocationResources();
    awardLocationResources();
    appendLog("👑 Pokonanie bossa przynosi potrójną nagrodę surowców!", "system");
    if (enemies[0]) grantBossLoot(enemies[0].templateKey);
  }
  const xpGained = enemies.reduce((sum, e) => sum + Math.round(e.maxHP / 4), 0);
  awardXp(xpGained);
  if (currentLocation && currentLocation.key === ARENA_LOCATION.key) {
    gainReputation("arena", 1);
  }
  if (isCampaignBattle && activeCampaignChapterId) {
    completeCampaignChapter(activeCampaignChapterId);
    isCampaignBattle = false;
    activeCampaignChapterId = null;
  }
}

function finishPlayerAction(target) {
  if (target.currentHP <= 0) {
    appendLog(`${target.name} pada martwy.`, "system");
    playDeathSound();
    discoverEnemy(target.templateKey);
    registerKill();
    const nextAlive = enemies.findIndex((e) => e.currentHP > 0);
    selectedTargetIndex = nextAlive === -1 ? null : nextAlive;
  }

  if (enemies.every((e) => e.currentHP <= 0)) {
    awardVictory("Zwycięstwo! Wszyscy przeciwnicy pokonani.");
    render();
    return;
  }

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function turnsLabel(n) {
  if (n === 1) return "1 turę";
  if (n >= 2 && n <= 4) return `${n} tury`;
  return `${n} tur`;
}

function applyTimedEffect(target, stat, amount, turns, label) {
  target[stat] += amount;
  target.activeEffects = target.activeEffects || [];
  target.activeEffects.push({ stat, amount, turnsLeft: turns, label });
}

function applyPoison(target, dmgPerTurn, turns) {
  target.poison = { dmgPerTurn, turnsLeft: turns };
}

function tickTimedEffectsFor(target) {
  if (target.currentHP <= 0) return;

  if (target.activeEffects && target.activeEffects.length) {
    const stillActive = [];
    for (const eff of target.activeEffects) {
      eff.turnsLeft--;
      if (eff.turnsLeft <= 0) {
        target[eff.stat] -= eff.amount;
        appendLog(`${target.name}: efekt „${eff.label}” wygasa.`, "system");
      } else {
        stillActive.push(eff);
      }
    }
    target.activeEffects = stillActive;
  }

  if (target.poison && target.poison.turnsLeft > 0) {
    const dmg = target.poison.dmgPerTurn;
    target.currentHP = Math.max(0, target.currentHP - dmg);
    appendLog(`☠️ ${target.name} traci ${dmg} PD od trucizny.`, "damage");
    target.poison.turnsLeft--;
    if (target.poison.turnsLeft <= 0) target.poison = null;
  }
}

function applyBossSpecialEffect(boss, result) {
  const special = boss.special;

  if (special.effectType === "self_buff") {
    applyTimedEffect(boss, special.stat, special.effectValue, special.effectTurns, special.label);
    const amountText = special.stat === "pancerz" ? `${Math.round(special.effectValue * 100)}%` : `+${special.effectValue}`;
    appendLog(`${special.icon} ${boss.name} używa: ${special.name} (${amountText} ${special.stat.toUpperCase()} na ${turnsLabel(special.effectTurns)}).`, "system");
    return;
  }

  if (special.effectType === "heal_self") {
    const healAmount = Math.round(boss.maxHP * special.effectValue);
    boss.currentHP = Math.min(boss.maxHP, boss.currentHP + healAmount);
    appendLog(`${special.icon} ${boss.name} używa: ${special.name} — odzyskuje ${healAmount} PD.`, "system");
    return;
  }

  if (!result || !result.hit) return;

  if (special.effectType === "armor_shred") {
    applyTimedEffect(player, "pancerz", -special.effectValue, special.effectTurns, special.label);
    appendLog(`Twój pancerz słabnie o ${Math.round(special.effectValue * 100)}% na ${turnsLabel(special.effectTurns)}.`, "system");
  } else if (special.effectType === "poison_dot") {
    applyPoison(player, special.effectValue, special.effectTurns);
    appendLog(`☠️ Zostajesz zatruty (${special.effectValue} PD/turę na ${turnsLabel(special.effectTurns)}).`, "system");
  } else if (special.effectType === "lifesteal") {
    const healAmount = Math.round(result.damage * special.effectValue);
    boss.currentHP = Math.min(boss.maxHP, boss.currentHP + healAmount);
    appendLog(`🩸 ${boss.name} wysysa ${healAmount} PD.`, "system");
  }
}

function applySkillEffect(caster, skill, target, result, context) {
  if (!result.hit || !skill.effectType) return;
  const isPlayerCaster = caster === player;

  switch (skill.effectType) {
    case "armor_shred":
      applyTimedEffect(target, "pancerz", -skill.effectValue, skill.effectTurns, "osłabiony pancerz");
      appendLog(`${target.name}: pancerz osłabiony o ${Math.round(skill.effectValue * 100)}% na ${turnsLabel(skill.effectTurns)}.`, "system");
      break;

    case "heal_self": {
      const healAmount = Math.round(caster.maxHP * skill.effectValue);
      caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);
      appendLog(isPlayerCaster ? `✨ Odzyskujesz ${healAmount} PD.` : `✨ ${caster.name} odzyskuje ${healAmount} PD.`, "system");
      break;
    }

    case "lifesteal": {
      const healAmount = Math.round(result.damage * skill.effectValue);
      caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);
      appendLog(isPlayerCaster
        ? `🩸 Wysysasz ${healAmount} PD z ${target.name}.`
        : `🩸 ${caster.name} wysysa ${healAmount} PD z ${target.name}.`, "system");
      break;
    }

    case "self_buff": {
      applyTimedEffect(caster, skill.stat, skill.effectValue, skill.effectTurns, skill.label);
      const amountText = skill.stat === "pancerz" ? `${Math.round(skill.effectValue * 100)}%` : `+${skill.effectValue}`;
      const prefix = isPlayerCaster ? "" : `${caster.name}: `;
      appendLog(`${prefix}${skill.icon} ${amountText} ${skill.stat.toUpperCase()} na ${turnsLabel(skill.effectTurns)}.`, "system");
      break;
    }

    case "poison_dot":
      applyPoison(target, skill.effectValue, skill.effectTurns);
      appendLog(`☠️ ${target.name} zostaje zatruty (${skill.effectValue} PD/turę na ${turnsLabel(skill.effectTurns)}).`, "system");
      break;

    case "aoe_damage": {
      const secondary = enemies.filter((e) => e !== target && e.currentHP > 0 && hexDistance(e.pos, target.pos) <= skill.effectRadius);
      secondary.forEach((e) => {
        const splashWeapon = {
          ...skill,
          minDmg: Math.round(skill.minDmg * skill.effectValue),
          maxDmg: Math.round(skill.maxDmg * skill.effectValue),
        };
        const splashAttacker = Object.assign({}, caster, { weapon: splashWeapon });
        const splashResult = resolveAttack(splashAttacker, e, context);
        const { text, cssClass } = formatAttackResult(splashResult);
        appendLog(`🔥 Odprysk ognia → ${text}`, cssClass);
        triggerAttackFx(splashResult, e.pos);
        if (splashResult.defenderDied) {
          appendLog(`${e.name} pada martwy od odprysku.`, "system");
          discoverEnemy(e.templateKey);
          registerKill();
        }
      });
      break;
    }

    case "aoe_poison": {
      applyPoison(target, skill.effectValue, skill.effectTurns);
      const secondary = enemies.filter((e) => e !== target && e.currentHP > 0 && hexDistance(e.pos, target.pos) <= skill.effectRadius);
      secondary.forEach((e) => applyPoison(e, skill.effectValue, skill.effectTurns));
      const count = 1 + secondary.length;
      appendLog(`☠️ Trujący opar ogarnia ${count} ${count === 1 ? "przeciwnika" : "przeciwników"}.`, "system");
      break;
    }

    case "stun":
      target.stunned = true;
      appendLog(`💫 ${target.name} zostaje ogłuszony i straci następną turę.`, "system");
      break;

    case "debuff_enemy_stat":
      applyTimedEffect(target, skill.stat, -skill.effectValue, skill.effectTurns, skill.label);
      appendLog(`${target.name}: ${skill.stat.toUpperCase()} osłabione o ${skill.effectValue} na ${turnsLabel(skill.effectTurns)}.`, "system");
      break;

    case "party_heal": {
      const healAmount = Math.round(caster.maxHP * skill.effectValue);
      livingAllies().forEach((u) => {
        u.currentHP = Math.min(u.maxHP, u.currentHP + healAmount);
      });
      appendLog(`💞 Drużyna odzyskuje ${healAmount} PD.`, "system");
      break;
    }

    case "cleanse_self":
      caster.poison = null;
      caster.activeEffects = (caster.activeEffects || []).filter((eff) => eff.amount > 0);
      appendLog(isPlayerCaster ? `✨ Oczyszczasz się z trucizn i osłabień.` : `✨ ${caster.name} oczyszcza się z trucizn i osłabień.`, "system");
      break;

    default:
      break;
  }
}

function castSkill(id) {
  if (battleOver || playerActionsRemaining <= 0) return;
  closeRadialMenu();
  radialMenuOpen = false;
  if (rollMadnessEpisode()) {
    triggerMadnessEpisode();
    return;
  }

  const skill = playerSkills().find((s) => s.id === id);
  if (!skill) {
    appendLog("Wybierz najpierw klasę i specjalizację, żeby odblokować czar.", "system");
    render();
    return;
  }

  if (skillCooldownFor(id) > 0) {
    appendLog(`${skill.name} jeszcze się odnawia (pozostało ${turnsLabel(skillCooldownFor(id))}).`, "system");
    render();
    return;
  }

  const target = enemies[selectedTargetIndex];
  if (!target || target.currentHP <= 0) {
    appendLog("Wybierz żywy cel.", "system");
    render();
    return;
  }

  if (hexDistance(player.pos, target.pos) > skill.range) {
    appendLog(`${target.name} jest poza zasięgiem czaru "${skill.name}" (${skill.range}). Podejdź bliżej.`, "system");
    render();
    return;
  }

  const context = { allCombatants: [player, ...companions, ...enemies], obstacles: OBSTACLES };
  const virtualAttacker = Object.assign({}, player, { weapon: skill });
  if (skill.effectType === "guaranteed_crit") virtualAttacker.d6Bonus = 6;
  if (skill.effectType === "ignore_armor") virtualAttacker.przebicie = 1;

  playerActionsRemaining--;
  player.skillCooldowns = player.skillCooldowns || {};
  player.skillCooldowns[id] = skill.cooldown;
  playSpellCastSound();
  render();

  spawnProjectile(player.pos, target.pos, { icon: skill.icon, colorClass: skill.colorClass }, () => {
    const result = resolveAttack(virtualAttacker, target, context);
    const { text, cssClass } = formatAttackResult(result);
    appendLog(`${skill.icon} ${skill.name}! ${text}`, cssClass);
    triggerAttackFx(result, target.pos);
    if (result.hit) playSpellImpactSound(); else playMissSound();
    applySkillEffect(player, skill, target, result, context);
    finishPlayerAction(target);
  });
}

function livingAllies() {
  return [player, ...companions].filter((u) => u.currentHP > 0 && u.pos);
}

function nearestLiving(fromPos, units) {
  const alive = units.filter((u) => u.currentHP > 0 && u.pos);
  if (alive.length === 0) return null;
  return alive.reduce((best, u) => (hexDistance(fromPos, u.pos) < hexDistance(fromPos, best.pos) ? u : best));
}

function moveUnitTowardTarget(unit, target) {
  // Path over TERRAIN only (obstacles), never over other units — the map is guaranteed
  // fully connected by terrain alone, so a route always exists. Other combatants are only
  // checked when actually stepping onto a hex, so a temporarily-blocked bottleneck just
  // truncates this turn's move instead of making the whole path search fail.
  const terrainFreeHexes = ALL_HEXES.filter((h) => !isObstacle(h));
  const terrainFreeKeySet = new Set(terrainFreeHexes.map(hexKey));

  // Prefer a hex within actual weapon range, but if the target is boxed in by terrain,
  // widen the search ring so the unit still closes the distance as far as the map
  // allows instead of freezing in place.
  const currentDist = hexDistance(unit.pos, target.pos);
  const maxRing = Math.max(unit.weapon.range, currentDist);
  let targetKeySet = null;
  for (let ring = unit.weapon.range; ring <= maxRing; ring++) {
    const candidates = terrainFreeHexes.filter((h) => hexDistance(h, target.pos) <= ring && !isOccupied(h, unit));
    if (candidates.length > 0) {
      targetKeySet = new Set(candidates.map(hexKey));
      break;
    }
  }
  if (!targetKeySet) return;

  const pathKeys = bfsPathAvoiding([unit.pos], targetKeySet, terrainFreeKeySet, new Set());
  if (!pathKeys) return;

  const pathHexes = pathKeys.map(hexFromKey).reverse();
  const maxSteps = Math.min(unit.moveRange, pathHexes.length - 1);

  let destination = unit.pos;
  for (let i = 1; i <= maxSteps; i++) {
    const step = pathHexes[i];
    if (isOccupied(step, unit)) break;
    destination = step;
  }

  if (!hexEquals(destination, unit.pos)) {
    unit.pos = destination;
    appendLog(`${unit.name} zbliża się (koszt: 1 akcja).`, "system");
  }
}

function bestWeaponFor(character, target) {
  const dist = hexDistance(character.pos, target.pos);
  const inRangeWeapons = character.weapons.filter((w) => dist <= w.range);
  if (inRangeWeapons.length > 0) {
    return inRangeWeapons.sort((a, b) => (b.minDmg + b.maxDmg) - (a.minDmg + a.maxDmg))[0];
  }
  return character.weapons.slice().sort((a, b) => b.range - a.range)[0];
}

// Losing has to sting, or "Wróć do obozu" becoming available again on defeat
// would just be a free, risk-free retreat. Costs a slice of whatever the
// current location's resource is — same currentLocation.resource shape spent
// everywhere else (dungeon events, city shop costs) rather than a new currency.
const DEFEAT_RESOURCE_LOSS_PERCENT = 0.25;

function applyDefeatPenalty() {
  if (!currentLocation || !currentLocation.resource) return;
  const { name, icon } = currentLocation.resource;
  const owned = resources[name] ? resources[name].amount : 0;
  const lost = Math.round(owned * DEFEAT_RESOURCE_LOSS_PERCENT);
  if (lost <= 0) return;
  resources[name].amount -= lost;
  saveResources();
  appendLog(`Porażka ma swoją cenę — w odwrocie gubisz część zapasów: -${lost} × ${icon} ${name}.`, "system");
}

function resolveUnitDeath(target) {
  if (target === player) {
    appendLog("Zginąłeś. Koniec gry — brak auto-healu.", "system");
    playDeathSound();
    battleOver = true;
    applyDefeatPenalty();
  } else {
    appendLog(`${target.name} pada bez sił.`, "system");
    playDeathSound();
  }
}

// Combines a companion's 2 innate subclass spells with any active/sustained
// talent nodes they've unlocked — mirrors playerSkills() in shape (id-keyed,
// same castable objects) so castCompanionSkill()/applySkillEffect() below
// need zero companion-specific combat logic.
function companionSkills(companion) {
  const sub = findSubclassData(companion.className, companion.subclassName);
  const base = (sub && sub.skills) || [];
  return [...base, ...getUnlockedActiveTalentsFor(companion.unlockedTalentIds || [])];
}

function companionSkillCooldownFor(companion, id) {
  return (companion.skillCooldowns && companion.skillCooldowns[id]) || 0;
}

// Synchronous counterpart to castSkill() — companions act during the enemy
// phase, not the player's stepped turn, so there's no radial menu/projectile
// animation to wait on, same as their existing basic attack below.
function castCompanionSkill(companion, skill, target, context) {
  const virtualAttacker = Object.assign({}, companion, { weapon: skill });
  if (skill.effectType === "guaranteed_crit") virtualAttacker.d6Bonus = 6;
  if (skill.effectType === "ignore_armor") virtualAttacker.przebicie = 1;
  companion.skillCooldowns = companion.skillCooldowns || {};
  companion.skillCooldowns[skill.id] = skill.cooldown;

  const result = resolveAttack(virtualAttacker, target, context);
  const { text, cssClass } = formatAttackResult(result);
  appendLog(`${skill.icon} ${companion.icon} ${companion.name} używa: ${skill.name}! ${text}`, cssClass);
  triggerAttackFx(result, target.pos);
  if (result.hit) playSpellImpactSound(); else playMissSound();
  applySkillEffect(companion, skill, target, result, context);

  if (target.currentHP <= 0) {
    appendLog(`${target.name} pada martwy.`, "system");
    discoverEnemy(target.templateKey);
    registerKill();
  }
}

function companionActions(context) {
  for (const companion of companions) {
    if (companion.currentHP <= 0 || battleOver) continue;

    const target = nearestLiving(companion.pos, enemies);
    if (!target) continue;

    let actionsRemaining = 1 + companion.extraActions;

    if (companion.weapons.length > 1) {
      const desired = bestWeaponFor(companion, target);
      if (desired !== companion.weapon && actionsRemaining > 0) {
        switchWeapon(companion);
        actionsRemaining--;
      }
    }

    while (!inRange(companion, target) && actionsRemaining > 0) {
      moveUnitTowardTarget(companion, target);
      actionsRemaining--;
    }

    if (!inRange(companion, target)) continue;

    for (let i = 0; i < actionsRemaining; i++) {
      if (target.currentHP <= 0 || battleOver) break;

      const availableSkill = companionSkills(companion).find(
        (s) => companionSkillCooldownFor(companion, s.id) <= 0 && hexDistance(companion.pos, target.pos) <= s.range
      );
      if (availableSkill) {
        castCompanionSkill(companion, availableSkill, target, context);
        continue;
      }

      const result = resolveAttack(companion, target, context);
      const { text, cssClass } = formatAttackResult(result);
      appendLog(`${companion.icon} ${text}`, cssClass);
      triggerAttackFx(result, target.pos);
      if (result.hit) playHitSound(result.d6 === 6); else playMissSound();

      if (target.currentHP <= 0) {
        appendLog(`${target.name} pada martwy.`, "system");
        discoverEnemy(target.templateKey);
        registerKill();
      }
    }
  }

  if (!battleOver && enemies.every((e) => e.currentHP <= 0)) {
    awardVictory("Zwycięstwo! Drużyna dokonała reszty.");
  }
}

function enemyPhase() {
  closeRadialMenu();
  radialMenuOpen = false;
  const context = { allCombatants: [player, ...companions, ...enemies], obstacles: OBSTACLES };

  companionActions(context);

  for (const enemy of enemies) {
    if (enemy.currentHP <= 0 || battleOver) continue;

    if (enemy.stunned) {
      appendLog(`💫 ${enemy.name} jest ogłuszony i traci turę.`, "system");
      enemy.stunned = false;
      continue;
    }

    const target = nearestLiving(enemy.pos, livingAllies());
    if (!target) continue;

    let actionsRemaining = 1 + enemy.extraActions;

    if (enemy.weapons.length > 1) {
      const desired = bestWeaponFor(enemy, target);
      if (desired !== enemy.weapon && actionsRemaining > 0) {
        switchWeapon(enemy);
        actionsRemaining--;
        appendLog(`${enemy.name} zmienia broń na: ${enemy.weapon.name} (koszt: 1 akcja).`, "system");
      }
    }

    while (!inRange(enemy, target) && actionsRemaining > 0) {
      moveUnitTowardTarget(enemy, target);
      actionsRemaining--;
    }

    if (!inRange(enemy, target)) {
      appendLog(`${enemy.name} jest poza zasięgiem i nie może zaatakować.`, "system");
      continue;
    }

    if (enemy.isBoss && enemy.special && enemy.specialCooldown <= 0 && actionsRemaining > 0 && player.currentHP > 0) {
      actionsRemaining--;
      enemy.specialCooldown = enemy.special.cooldown;

      if (enemy.special.effectType === "self_buff" || enemy.special.effectType === "heal_self") {
        applyBossSpecialEffect(enemy, null);
      } else {
        const virtualAttacker = Object.assign({}, enemy, { weapon: enemy.special });
        const result = resolveAttack(virtualAttacker, player, context);
        const { text, cssClass } = formatAttackResult(result);
        appendLog(`${enemy.special.icon} ${enemy.name} używa: ${enemy.special.name}! ${text}`, cssClass);
        triggerAttackFx(result, player.pos);
        if (result.hit) playHitSound(result.d6 === 6); else playMissSound();
        applyBossSpecialEffect(enemy, result);

        if (player.currentHP <= 0) resolveUnitDeath(player);
      }
    }

    for (let i = 0; i < actionsRemaining; i++) {
      if (target.currentHP <= 0 || battleOver) break;
      const result = resolveAttack(enemy, target, context);
      const { text, cssClass } = formatAttackResult(result);
      appendLog(text, cssClass);
      triggerAttackFx(result, target.pos);
      if (result.hit) playHitSound(result.d6 === 6); else playMissSound();

      if (target.currentHP <= 0) resolveUnitDeath(target);
    }
  }

  if (!battleOver) {
    Object.keys(player.skillCooldowns || {}).forEach((id) => {
      if (player.skillCooldowns[id] > 0) player.skillCooldowns[id]--;
    });
    companions.forEach((companion) => {
      Object.keys(companion.skillCooldowns || {}).forEach((id) => {
        if (companion.skillCooldowns[id] > 0) companion.skillCooldowns[id]--;
      });
    });
    if (player.mutateCooldown > 0) player.mutateCooldown--;
    tickTimedEffectsFor(player);
    companions.forEach((companion) => tickTimedEffectsFor(companion));
    enemies.forEach((enemy) => {
      tickTimedEffectsFor(enemy);
      if (enemy.specialCooldown > 0) enemy.specialCooldown--;
    });

    if (enemies.every((e) => e.currentHP <= 0)) {
      awardVictory("Zwycięstwo! Trucizna dokonała reszty.");
    }
  }

  playerActionsRemaining = 1 + player.extraActions;
  render();
}

document.getElementById("attack-btn").addEventListener("click", playerAttack);
document.getElementById("potions-close").addEventListener("click", closePotionMenu);
document.getElementById("end-turn-btn").addEventListener("click", () => {
  if (battleOver) return;
  enemyPhase();
});
document.getElementById("start-battle-btn").addEventListener("click", () => {
  if (phase !== "deployment") return;
  phase = "battle";
  appendLog("Walka rozpoczęta!", "system");
  render();
});
document.getElementById("mute-btn").addEventListener("click", (e) => {
  const muted = toggleAudioMuted();
  e.target.textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
  document.getElementById("settings-mute-btn").textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
});
document.getElementById("view-toggle-btn").addEventListener("click", () => {
  boardViewMode = boardViewMode === "3d" ? "2d" : "3d";
  closeRadialMenu();
  radialMenuOpen = false;
  render();
});
document.getElementById("change-location-btn").addEventListener("click", returnFromBattle);
document.getElementById("main-menu-btn").addEventListener("click", goToMainMenu);
document.getElementById("camp-expedition-btn").addEventListener("click", backToLocationSelect);
document.getElementById("camp-city-btn").addEventListener("click", goToCitySelect);
document.getElementById("city-back-btn").addEventListener("click", goToCamp);
document.getElementById("city-place-back-btn").addEventListener("click", goToCitySelect);
document.getElementById("camp-codex-btn").addEventListener("click", openCodex);
document.getElementById("camp-main-menu-btn").addEventListener("click", goToMainMenu);
document.getElementById("camp-character-btn").addEventListener("click", openCharacterSheet);
document.getElementById("camp-quests-btn").addEventListener("click", openQuestBoard);
document.getElementById("quest-board-close").addEventListener("click", closeQuestBoard);
document.getElementById("camp-talents-btn").addEventListener("click", () => openTalentTree());
document.getElementById("talent-tree-close").addEventListener("click", closeTalentTree);
document.getElementById("camp-campaign-btn").addEventListener("click", openCampaignBoard);
document.getElementById("campaign-close").addEventListener("click", closeCampaignBoard);
document.getElementById("camp-party-btn").addEventListener("click", openPartyOverlay);
document.getElementById("party-close").addEventListener("click", closePartyOverlay);
document.getElementById("recruit-scene-next-btn").addEventListener("click", advanceRecruitScene);
document.getElementById("recruit-scene-confirm-btn").addEventListener("click", confirmRecruitScene);
document.getElementById("recruit-scene-close").addEventListener("click", closeRecruitScene);
document.getElementById("side-quest-close").addEventListener("click", closeSideQuestScene);
document.getElementById("side-quest-dismiss-btn").addEventListener("click", closeSideQuestScene);
document.getElementById("side-quest-advance-btn").addEventListener("click", advanceSideQuestScene);
document.getElementById("character-sheet-close").addEventListener("click", closeCharacterSheet);
document.getElementById("character-sheet-overlay").addEventListener("click", (e) => {
  if (e.target.id === "character-sheet-overlay") closeCharacterSheet();
});
document.getElementById("companion-sheet-close").addEventListener("click", closeCompanionSheet);
document.getElementById("companion-sheet-overlay").addEventListener("click", (e) => {
  if (e.target.id === "companion-sheet-overlay") closeCompanionSheet();
});
document.getElementById("location-back-btn").addEventListener("click", goToCamp);

document.getElementById("new-game-btn").addEventListener("click", startNewGame);
document.getElementById("resume-btn").addEventListener("click", resumeGame);
document.getElementById("load-game-btn").addEventListener("click", openLoadGameModal);
document.getElementById("load-game-close").addEventListener("click", closeLoadGameModal);
document.getElementById("load-game-confirm-btn").addEventListener("click", confirmLoadGame);
document.getElementById("load-game-overlay").addEventListener("click", (e) => {
  if (e.target.id === "load-game-overlay") closeLoadGameModal();
});
document.getElementById("settings-btn").addEventListener("click", openSettingsModal);
document.getElementById("settings-close").addEventListener("click", closeSettingsModal);
document.getElementById("settings-overlay").addEventListener("click", (e) => {
  if (e.target.id === "settings-overlay") closeSettingsModal();
});
document.getElementById("settings-mute-btn").addEventListener("click", (e) => {
  const muted = toggleAudioMuted();
  e.target.textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
  document.getElementById("mute-btn").textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
});
document.getElementById("music-volume-slider").addEventListener("input", (e) => {
  setMusicVolume(Number(e.target.value) / 100);
});
document.getElementById("clear-progress-btn").addEventListener("click", clearAllProgress);
document.getElementById("exit-game-btn").addEventListener("click", exitGame);
document.getElementById("test3d-btn").addEventListener("click", openTest3D);
document.getElementById("test3d-back-btn").addEventListener("click", closeTest3D);

document.getElementById("creation-name-input").addEventListener("input", (e) => setPlayerName(e.target.value));
document.querySelectorAll(".gender-btn").forEach((btn) => {
  btn.addEventListener("click", () => setPlayerGender(btn.dataset.gender));
});
document.getElementById("creation-confirm-btn").addEventListener("click", confirmCharacterCreation);
document.getElementById("creation-talent-preview-btn").addEventListener("click", () => openTalentTree());
document.getElementById("prologue-next-btn").addEventListener("click", advancePrologue);
document.getElementById("prologue-finish-btn").addEventListener("click", advancePrologue);
document.getElementById("prologue-skip-btn").addEventListener("click", skipPrologue);
document.getElementById("intro-next-btn").addEventListener("click", advanceIntro);
document.getElementById("intro-skip-btn").addEventListener("click", skipIntro);
document.getElementById("epilogue-close-btn").addEventListener("click", closeEpilogue);

render();
