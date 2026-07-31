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
let dungeonRooms = [];
let dungeonIndex = 0;
let dungeonHpLoss = 0;
let dungeonBattleBuff = { pancerz: 0 };
let dungeonRoomResolved = false;
let dungeonOutcomeText = "";
let pendingBossFight = false;
let isBossBattle = false;
let isCampaignBattle = false;
let activeCampaignChapterId = null;

function xpToNextLevel(lvl) {
  return lvl * 50;
}

const DUNGEON_ROOM_TYPES = [
  {
    type: "empty", icon: "🚪", weight: 2, label: "Cichy korytarz",
    prompt: "Korytarz ciągnie się w ciszy — coś tu może być, ale trudno powiedzieć co.",
    optionALabel: "🔍 Przeszukaj kąty", optionBLabel: "➡️ Idź dalej bez zwłoki",
  },
  {
    type: "trap", icon: "⚠️", weight: 2, label: "Pułapka",
    prompt: "Coś w tym korytarzu wygląda podejrzanie — wyczuwasz mechanizm w podłodze.",
    optionALabel: "🛠️ Rozbrój pułapkę", optionBLabel: "🚶 Omiń ostrożnie",
  },
  {
    type: "find", icon: "✨", weight: 2, label: "Znalezisko",
    prompt: "Coś błyszczy w gruzach na końcu korytarza.",
    optionALabel: "🧐 Zbadaj dokładnie", optionBLabel: "🤏 Zabierz szybko i idź dalej",
  },
  {
    type: "skirmish", icon: "🗡️", weight: 2, label: "Zasadzka",
    prompt: "Słyszysz kroki w ciemności — coś się zbliża.",
    optionALabel: "⚔️ Walcz", optionBLabel: "🤫 Wymknij się chyłkiem",
  },
  {
    type: "shrine", icon: "🩸", weight: 1, label: "Zapomniany ołtarz",
    prompt: "Stary, zapomniany ołtarz stoi w mroku — wciąż pulsuje esencją.",
    optionALabel: "🩸 Złóż ofiarę z krwi", optionBLabel: "🙅 Odejdź",
  },
];

function pickWeightedRoomType() {
  const totalWeight = DUNGEON_ROOM_TYPES.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const roomType of DUNGEON_ROOM_TYPES) {
    if (roll < roomType.weight) return roomType;
    roll -= roomType.weight;
  }
  return DUNGEON_ROOM_TYPES[0];
}

function generateDungeonRooms() {
  const rooms = [0, 1, 2].map(() => pickWeightedRoomType());
  if (currentLocation && currentLocation.bossKey && Math.random() < 0.2) {
    const boss = BOSS_TEMPLATES[currentLocation.bossKey]();
    rooms.push({
      type: "boss", icon: "👑", label: "Komnata Bossa",
      prompt: `W głębi wyczuwasz przytłaczającą obecność — to legowisko ${boss.icon} ${boss.name}. Możesz go wyzwać już teraz, zanim wrócisz do zwykłej walki, albo zostawić go w spokoju.`,
      optionALabel: "⚔️ Wyzwij bossa", optionBLabel: "🚪 Odejdź, nie ryzykuj",
    });
  }
  return rooms;
}

function startDungeonCrawl() {
  dungeonRooms = generateDungeonRooms();
  dungeonIndex = 0;
  dungeonHpLoss = 0;
  dungeonBattleBuff = { pancerz: 0 };
  dungeonRoomResolved = false;
  dungeonOutcomeText = "";
  pendingBossFight = false;
  phase = "dungeon";
  render();
}

function chooseDungeonOption(choice) {
  const room = dungeonRooms[dungeonIndex];

  if (room.type === "empty") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 14) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 3));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        dungeonOutcomeText = `Znajdujesz drobny skarb w pęknięciu muru: +${amount} × ${icon} ${name}.`;
      } else {
        dungeonOutcomeText = "Nic tu nie ma poza kurzem i twoim czasem.";
      }
    } else {
      dungeonOutcomeText = "Nie tracisz czasu na szukanie po kątach.";
    }
  } else if (room.type === "trap") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 11) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 2));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        dungeonOutcomeText = `Rozbrajasz pułapkę i wyciągasz z niej użyteczne części (K20=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 3;
        dungeonHpLoss += dmg;
        dungeonOutcomeText = `Nie zdążyłeś rozbroić mechanizmu (K20=${roll}) — tracisz ${dmg} HP przed walką.`;
      }
    } else {
      dungeonOutcomeText = "Ostrożnie omijasz zagrożenie, nie ryzykując niczego.";
    }
  } else if (room.type === "find") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 11) {
        const { name, icon, min, max } = currentLocation.resource;
        const amount = min + Math.floor(Math.random() * (max - min + 1));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        dungeonOutcomeText = `Dokładne poszukiwania się opłacają (K20=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 3;
        dungeonHpLoss += dmg;
        dungeonOutcomeText = `To była pułapka na złodziei (K20=${roll}) — tracisz ${dmg} HP przed walką.`;
      }
    } else {
      const { name, icon, min, max } = currentLocation.resource;
      const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 2));
      const existing = resources[name] ? resources[name].amount : 0;
      resources[name] = { icon, amount: existing + amount };
      saveResources();
      dungeonOutcomeText = `Zabierasz co się da bez ryzyka: +${amount} × ${icon} ${name}.`;
    }
  } else if (room.type === "skirmish") {
    if (choice === "A") {
      const roll = rollD20();
      if (roll >= 11) {
        awardXp(20);
        const { name, icon, min, max } = currentLocation.resource;
        const amount = Math.max(1, Math.round((min + Math.floor(Math.random() * (max - min + 1))) / 2));
        const existing = resources[name] ? resources[name].amount : 0;
        resources[name] = { icon, amount: existing + amount };
        saveResources();
        dungeonOutcomeText = `Pokonujesz napastnika w krótkiej walce (K20=${roll}): +${amount} × ${icon} ${name}.`;
      } else {
        const dmg = rollD6() * 4;
        dungeonHpLoss += dmg;
        dungeonOutcomeText = `Starcie idzie źle (K20=${roll}) — tracisz ${dmg} HP przed właściwą walką.`;
      }
    } else {
      dungeonOutcomeText = "Udaje ci się przemknąć niezauważenie.";
    }
  } else if (room.type === "shrine") {
    if (choice === "A") {
      dungeonHpLoss += 8;
      dungeonBattleBuff.pancerz += 0.08;
      dungeonOutcomeText = "Ołtarz przyjmuje ofiarę — czujesz, jak coś niewidzialnego otacza twoją skórę (-8 HP, +8% pancerza na nadchodzącą walkę).";
    } else {
      dungeonOutcomeText = "Odchodzisz od ołtarza — wolisz nie ryzykować.";
    }
  } else if (room.type === "boss") {
    if (choice === "A") {
      pendingBossFight = true;
      dungeonOutcomeText = "Wyzywasz bossa na pojedynek. Następna walka będzie tą najcięższą.";
    } else {
      pendingBossFight = false;
      dungeonOutcomeText = "Odwracasz się i odchodzisz — ten pojedynek poczeka na inną okazję.";
    }
  }

  dungeonRoomResolved = true;
  render();
}

function advanceDungeon() {
  dungeonIndex++;
  dungeonRoomResolved = false;
  dungeonOutcomeText = "";
  if (dungeonIndex >= dungeonRooms.length) {
    isCampaignBattle = false;
    activeCampaignChapterId = null;
    startNewBattle();
  } else {
    render();
  }
}

function awardXp(amount) {
  xp += amount;
  appendLog(`Zdobywasz ${amount} PD.`, "system");
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    statPointsAvailable += 3;
    appendLog(`Awans! Osiągasz poziom ${level} (+3 punkty statystyk do rozdania w obozie).`, "system");
  }
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
    return { totalKills: (data && data.totalKills) || 0, claimedQuests: (data && data.claimedQuests) || [] };
  } catch {
    return { totalKills: 0, claimedQuests: [] };
  }
}

function saveQuestState() {
  localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ totalKills, claimedQuests }));
}

let { totalKills, claimedQuests } = loadQuestState();

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
  }
}

const COMPANION_STORAGE_KEY = "raj-sandbox-companions";

function loadCompanionState() {
  try {
    const data = JSON.parse(localStorage.getItem(COMPANION_STORAGE_KEY));
    const recruitPool = (data && data.recruitPool) || [];
    recruitPool.forEach((r) => {
      if (!r.quest) r.quest = COMPANION_QUESTS[r.companion.subclassName];
    });
    return { companions: (data && data.companions) || [], recruitPool };
  } catch {
    return { companions: [], recruitPool: [] };
  }
}

function saveCompanionState() {
  localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify({ companions, recruitPool }));
}

let { companions, recruitPool } = loadCompanionState();

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
  companions.push(entry.companion);
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
    const totalBonus = {
      str: bonusStats.str + equipBonus.str,
      wyt: bonusStats.wyt + equipBonus.wyt,
      zre: bonusStats.zre + equipBonus.zre,
      int: bonusStats.int + equipBonus.int,
      cha: bonusStats.cha + equipBonus.cha,
    };
    applyClassProfile(p, sub, totalBonus);
    p.pancerz += equipBonus.pancerz;
    p.przebicie += equipBonus.przebicie;
    p.weapons = [...p.weapons, ...getEquippedWeaponItems()];
  }
  p.class = selectedClassName;
  p.subclass = selectedSubclassName;
  return p;
}

function canAffordItem(item) {
  const owned = resources[item.cost.currency] ? resources[item.cost.currency].amount : 0;
  return owned >= item.cost.amount;
}

function refreshCharacterSheetIfOpen() {
  const overlay = document.getElementById("character-sheet-overlay");
  if (overlay.classList.contains("hidden")) return;
  renderCharacterSheet(
    player, inventory, equipped, resources, potionInventory, equipmentUpgrades,
    { level, xp, xpToNext: xpToNextLevel(level), bonusStats, statPointsAvailable },
    { onBuy: buyEquipment, onEquip: equipItem, onUnequip: unequipSlot, onAdjustStat: adjustBonusStat, onBuyPotion: buyPotion },
  );
}

function buyEquipment(itemId) {
  const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
  if (!item || inventory.includes(itemId) || !canAffordItem(item)) return;
  resources[item.cost.currency].amount -= item.cost.amount;
  saveResources();
  inventory.push(itemId);
  saveEquipmentState();
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
    locationKey: currentLocation ? currentLocation.key : null,
    cityPlaceKey: currentCityPlace ? currentCityPlace.key : null,
    savedAt: Date.now(),
  };
  if (phase === "dungeon") {
    data.dungeonRooms = dungeonRooms;
    data.dungeonIndex = dungeonIndex;
    data.dungeonHpLoss = dungeonHpLoss;
    data.dungeonBattleBuff = dungeonBattleBuff;
    data.dungeonRoomResolved = dungeonRoomResolved;
    data.dungeonOutcomeText = dungeonOutcomeText;
    data.pendingBossFight = pendingBossFight;
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
  currentLocation = LOCATIONS.find((l) => l.key === data.locationKey)
    || (data.locationKey === ARENA_LOCATION.key ? ARENA_LOCATION : null)
    || (data.locationKey === CAMPAIGN_FINALE_LOCATION.key ? CAMPAIGN_FINALE_LOCATION : null);
  currentCityPlace = CITY_PLACES.find((p) => p.key === data.cityPlaceKey) || null;
  phase = data.phase;

  closeRadialMenu();
  radialMenuOpen = false;
  clearLog();

  if (phase === "dungeon") {
    dungeonRooms = data.dungeonRooms || [];
    dungeonIndex = data.dungeonIndex || 0;
    dungeonHpLoss = data.dungeonHpLoss || 0;
    dungeonBattleBuff = data.dungeonBattleBuff || { pancerz: 0 };
    dungeonRoomResolved = data.dungeonRoomResolved || false;
    dungeonOutcomeText = data.dungeonOutcomeText || "";
    pendingBossFight = data.pendingBossFight || false;
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
  startDungeonCrawl();
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
  companions = [];
  recruitPool = [];
  saveCompanionState();
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

const RESPEC_COST = { currency: "Fiolki Światła", amount: 15 };

function respecStats() {
  const spent = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  if (spent <= 0 || !canAffordItem({ cost: RESPEC_COST })) return;
  resources[RESPEC_COST.currency].amount -= RESPEC_COST.amount;
  saveResources();
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  if (player && (phase === "camp" || phase === "city-place")) player = buildPlayerCharacter();
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

function confirmCharacterCreation() {
  if (!playerName.trim() || !playerGender || !selectedSubclassName) return;
  player = buildPlayerCharacter();
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
  totalKills = 0;
  claimedQuests = [];
  saveQuestState();
  companions = [];
  recruitPool = [];
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
    enemies = createEnemies(currentLocation);
    isBossBattle = false;
  }
  pendingBossFight = false;
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
    {
      icon: playerSkills()[0] ? playerSkills()[0].icon : "✨",
      label: skillButtonLabel(0),
      disabled: playerActionsRemaining <= 0 || (playerSkills()[0] && skillCooldownFor(0) > 0),
      onClick: () => {
        radialMenuOpen = false;
        castSkill(0);
      },
    },
    {
      icon: playerSkills()[1] ? playerSkills()[1].icon : "✨",
      label: skillButtonLabel(1),
      disabled: playerActionsRemaining <= 0 || (playerSkills()[1] && skillCooldownFor(1) > 0),
      onClick: () => {
        radialMenuOpen = false;
        castSkill(1);
      },
    },
    {
      icon: "🧪",
      label: potionButtonLabel(),
      disabled: playerActionsRemaining <= 0 || Object.keys(potionInventory).length === 0,
      onClick: () => {
        radialMenuOpen = false;
        openPotionMenu();
      },
    },
  ]);
}

function potionButtonLabel() {
  const totalCount = Object.values(potionInventory).reduce((a, b) => a + b, 0);
  return totalCount > 0 ? `Mikstury (${totalCount})` : "Mikstury (brak)";
}

function playerSkills() {
  const subclassData = findSubclassData(player.class, player.subclass);
  return (subclassData && subclassData.skills) || [];
}

function skillCooldownFor(index) {
  return (player.skillCooldowns && player.skillCooldowns[index]) || 0;
}

function skillButtonLabel(index) {
  const skill = playerSkills()[index];
  if (!skill) return "Umiejętności (wybierz klasę)";
  const cd = skillCooldownFor(index);
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

function render() {
  if (phase !== "deployment" && phase !== "battle" && window.stopBoard3D) {
    window.stopBoard3D();
  }

  const mainMenuScreen = document.getElementById("main-menu-screen");
  const test3dScreen = document.getElementById("test3d-screen");
  const creationScreen = document.getElementById("character-creation-screen");
  const campScreen = document.getElementById("camp-screen");
  const cityScreen = document.getElementById("city-screen");
  const cityPlaceScreen = document.getElementById("city-place-screen");
  const locationScreen = document.getElementById("location-screen");
  const dungeonScreen = document.getElementById("dungeon-screen");
  const gameScreen = document.getElementById("game-screen");

  const allScreens = [mainMenuScreen, test3dScreen, creationScreen, campScreen, cityScreen, cityPlaceScreen, locationScreen, dungeonScreen, gameScreen];
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

  if (phase === "character-creation") {
    hideAllExcept(creationScreen);
    renderCharacterCreation(
      { playerName, playerGender, selectedClassName, selectedSubclassName, bonusStats, statPointsAvailable },
      { onSelectClass: selectCreationClass, onSelectSubclass: selectCreationSubclass, onAdjustStat: adjustBonusStat },
    );
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
      { inventory, equipped, resources, equipmentUpgrades, bonusStats, potionInventory, lastGambleResult, recruitPool, companions },
      {
        onBuy: buyEquipment, onUpgrade: upgradeEquipment, onRespec: respecStats,
        onEnterArena: enterArena, onSellEquipment: sellEquipment, onSellPotion: sellPotion, onGamble: gambleAtTavern,
        onRecruit: openRecruitScene,
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

  if (phase === "dungeon") {
    hideAllExcept(dungeonScreen);
    renderDungeon(currentLocation, dungeonRooms, dungeonIndex, dungeonRoomResolved, dungeonOutcomeText, advanceDungeon, chooseDungeonOption);
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

  saveActiveRun();
}

function playerAttack() {
  if (battleOver || playerActionsRemaining <= 0) return;
  closeRadialMenu();
  radialMenuOpen = false;
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
  }
  const xpGained = enemies.reduce((sum, e) => sum + Math.round(e.maxHP / 4), 0);
  awardXp(xpGained);
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

function applySkillEffect(skill, target, result, context) {
  if (!result.hit || !skill.effectType) return;

  switch (skill.effectType) {
    case "armor_shred":
      applyTimedEffect(target, "pancerz", -skill.effectValue, skill.effectTurns, "osłabiony pancerz");
      appendLog(`${target.name}: pancerz osłabiony o ${Math.round(skill.effectValue * 100)}% na ${turnsLabel(skill.effectTurns)}.`, "system");
      break;

    case "heal_self": {
      const healAmount = Math.round(player.maxHP * skill.effectValue);
      player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
      appendLog(`✨ Odzyskujesz ${healAmount} PD.`, "system");
      break;
    }

    case "lifesteal": {
      const healAmount = Math.round(result.damage * skill.effectValue);
      player.currentHP = Math.min(player.maxHP, player.currentHP + healAmount);
      appendLog(`🩸 Wysysasz ${healAmount} PD z ${target.name}.`, "system");
      break;
    }

    case "self_buff": {
      applyTimedEffect(player, skill.stat, skill.effectValue, skill.effectTurns, skill.label);
      const amountText = skill.stat === "pancerz" ? `${Math.round(skill.effectValue * 100)}%` : `+${skill.effectValue}`;
      appendLog(`${skill.icon} ${amountText} ${skill.stat.toUpperCase()} na ${turnsLabel(skill.effectTurns)}.`, "system");
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
        const splashAttacker = Object.assign({}, player, { weapon: splashWeapon });
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

    default:
      break;
  }
}

function castSkill(index) {
  if (battleOver || playerActionsRemaining <= 0) return;
  closeRadialMenu();
  radialMenuOpen = false;

  const skill = playerSkills()[index];
  if (!skill) {
    appendLog("Wybierz najpierw klasę i specjalizację, żeby odblokować czar.", "system");
    render();
    return;
  }

  if (skillCooldownFor(index) > 0) {
    appendLog(`${skill.name} jeszcze się odnawia (pozostało ${turnsLabel(skillCooldownFor(index))}).`, "system");
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
  player.skillCooldowns = player.skillCooldowns || [];
  player.skillCooldowns[index] = skill.cooldown;
  playSpellCastSound();
  render();

  spawnProjectile(player.pos, target.pos, { icon: skill.icon, colorClass: skill.colorClass }, () => {
    const result = resolveAttack(virtualAttacker, target, context);
    const { text, cssClass } = formatAttackResult(result);
    appendLog(`${skill.icon} ${skill.name}! ${text}`, cssClass);
    triggerAttackFx(result, target.pos);
    if (result.hit) playSpellImpactSound(); else playMissSound();
    applySkillEffect(skill, target, result, context);
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

function resolveUnitDeath(target) {
  if (target === player) {
    appendLog("Zginąłeś. Koniec gry — brak auto-healu.", "system");
    playDeathSound();
    battleOver = true;
  } else {
    appendLog(`${target.name} pada bez sił.`, "system");
    playDeathSound();
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
    (player.skillCooldowns || []).forEach((cd, i) => {
      if (cd > 0) player.skillCooldowns[i]--;
    });
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
document.getElementById("change-location-btn").addEventListener("click", goToCamp);
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
document.getElementById("camp-campaign-btn").addEventListener("click", openCampaignBoard);
document.getElementById("campaign-close").addEventListener("click", closeCampaignBoard);
document.getElementById("camp-party-btn").addEventListener("click", openPartyOverlay);
document.getElementById("party-close").addEventListener("click", closePartyOverlay);
document.getElementById("recruit-scene-next-btn").addEventListener("click", advanceRecruitScene);
document.getElementById("recruit-scene-confirm-btn").addEventListener("click", confirmRecruitScene);
document.getElementById("recruit-scene-close").addEventListener("click", closeRecruitScene);
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
document.getElementById("clear-progress-btn").addEventListener("click", clearAllProgress);
document.getElementById("exit-game-btn").addEventListener("click", exitGame);
document.getElementById("test3d-btn").addEventListener("click", openTest3D);
document.getElementById("test3d-back-btn").addEventListener("click", closeTest3D);

document.getElementById("creation-name-input").addEventListener("input", (e) => setPlayerName(e.target.value));
document.querySelectorAll(".gender-btn").forEach((btn) => {
  btn.addEventListener("click", () => setPlayerGender(btn.dataset.gender));
});
document.getElementById("creation-confirm-btn").addEventListener("click", confirmCharacterCreation);

render();
