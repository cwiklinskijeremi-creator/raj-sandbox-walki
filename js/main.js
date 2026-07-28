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
let playerName = "";
let playerGender = null;
let bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };

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

function saveActiveRun() {
  const data = {
    phase,
    player,
    enemies,
    selectedTargetIndex,
    battleOver,
    playerActionsRemaining,
    selectedClassName,
    selectedSubclassName,
    playerName,
    playerGender,
    bonusStats,
    locationKey: currentLocation ? currentLocation.key : null,
    obstacles: OBSTACLES,
    obstacleTypes: [...OBSTACLE_TYPES.entries()],
    savedAt: Date.now(),
  };
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
  enemies = data.enemies;
  selectedTargetIndex = data.selectedTargetIndex;
  battleOver = data.battleOver;
  playerActionsRemaining = data.playerActionsRemaining;
  selectedClassName = data.selectedClassName;
  selectedSubclassName = data.selectedSubclassName;
  playerName = data.playerName || "";
  playerGender = data.playerGender || null;
  bonusStats = data.bonusStats || { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
  currentLocation = LOCATIONS.find((l) => l.key === data.locationKey) || null;
  restoreObstacles(data.obstacles, data.obstacleTypes);
  phase = data.phase;

  resetTokenLayer();
  closeRadialMenu();
  radialMenuOpen = false;
  clearLog();
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
  startNewBattle();
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
  if (delta > 0 && spent >= 10) return;
  bonusStats[key] = next;
  render();
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
  phase = "location-select";
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
  if (!confirm("Na pewno chcesz wyczyścić cały postęp? Zasoby i zapisana gra zostaną utracone bezpowrotnie.")) return;
  clearActiveRun();
  resources = {};
  saveResources();
  selectedClassName = null;
  selectedSubclassName = null;
  currentLocation = null;
  playerName = "";
  playerGender = null;
  bonusStats = { str: 0, wyt: 0, zre: 0, int: 0, cha: 0 };
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
    const locText = loc ? `${loc.icon} ${loc.name}` : "nieznana lokacja";
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
  const all = [player, ...enemies];
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

function startNewBattle() {
  regenerateObstacles(currentLocation ? currentLocation.obstacleBias : null);
  resetTokenLayer();
  closeRadialMenu();
  radialMenuOpen = false;

  player = createPlayer(playerName, playerGender);
  const savedSubclass = findSubclassData(selectedClassName, selectedSubclassName);
  if (savedSubclass) applyClassProfile(player, savedSubclass, bonusStats);
  player.class = selectedClassName;
  player.subclass = selectedSubclassName;
  enemies = createEnemies(currentLocation);

  const defaultPos = getStartPositions().player;
  player.pos = isObstacle(defaultPos)
    ? (ALL_HEXES.find((h) => isPlayerDeployHex(h) && !isObstacle(h) && hasAnyOpenNeighbor(h))
      || ALL_HEXES.find((h) => isPlayerDeployHex(h) && !isObstacle(h)))
    : defaultPos;
  deployEnemiesRandomly();

  selectedTargetIndex = 0;
  battleOver = false;
  playerActionsRemaining = 1 + player.extraActions;
  phase = "deployment";

  clearLog();
  appendLog("Rozstawianie: kliknij pole w swojej strefie (3 lewe kolumny), żeby ustawić postać. Przeciwnik już się rozstawił.", "system");
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
      icon: playerSkill() ? playerSkill().icon : "✨",
      label: playerSkill() ? playerSkill().name : "Umiejętności (wybierz klasę)",
      disabled: playerActionsRemaining <= 0,
      onClick: () => {
        radialMenuOpen = false;
        castSkill();
      },
    },
  ]);
}

function playerSkill() {
  const subclassData = findSubclassData(player.class, player.subclass);
  return subclassData && subclassData.skill;
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

function render() {
  renderResourceBar(resources);

  const mainMenuScreen = document.getElementById("main-menu-screen");
  const creationScreen = document.getElementById("character-creation-screen");
  const locationScreen = document.getElementById("location-screen");
  const gameScreen = document.getElementById("game-screen");

  if (phase === "main-menu") {
    mainMenuScreen.classList.remove("hidden");
    creationScreen.classList.add("hidden");
    locationScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    renderMainMenuState(loadActiveRunData());
    return;
  }
  mainMenuScreen.classList.add("hidden");

  if (phase === "character-creation") {
    creationScreen.classList.remove("hidden");
    locationScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    renderCharacterCreation(
      { playerName, playerGender, selectedClassName, selectedSubclassName, bonusStats },
      { onSelectClass: selectCreationClass, onSelectSubclass: selectCreationSubclass, onAdjustStat: adjustBonusStat },
    );
    return;
  }
  creationScreen.classList.add("hidden");

  if (phase === "location-select") {
    locationScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    renderLocationPicker(LOCATIONS, currentLocation, selectLocation);
    return;
  }
  locationScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  renderLocationBanner(currentLocation);

  const playerContainer = document.getElementById("player-fighter");
  playerContainer.innerHTML = "";
  renderFighter(playerContainer, player);

  const enemiesContainer = document.getElementById("enemies-list");
  enemiesContainer.innerHTML = "";
  enemies.forEach((enemy, index) => {
    const isSelected = index === selectedTargetIndex;
    const showPreview = phase === "battle" && isSelected && enemy.currentHP > 0 && inRange(player, enemy);
    const damagePreview = showPreview
      ? estimateAverageDamage(player, enemy, { allCombatants: [player, ...enemies] })
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

  renderGrid({
    svg: document.getElementById("battle-map"),
    player,
    enemies: phase === "deployment" ? [] : enemies,
    obstacles: OBSTACLES,
    reachableHexes: phase === "battle" && !battleOver && playerActionsRemaining > 0 ? reachableFor(player) : [],
    deployHexes,
    onHexClick: handleHexClick,
  });

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

  const context = { allCombatants: [player, ...enemies], obstacles: OBSTACLES };
  const result = resolveAttack(player, target, context);
  const { text, cssClass } = formatAttackResult(result);
  appendLog(text, cssClass);
  triggerAttackFx(result, target.pos);
  if (result.hit) playHitSound(result.d6 === 6); else playMissSound();
  playerActionsRemaining--;

  finishPlayerAction(target);
}

function finishPlayerAction(target) {
  if (target.currentHP <= 0) {
    appendLog(`${target.name} pada martwy.`, "system");
    playDeathSound();
    const nextAlive = enemies.findIndex((e) => e.currentHP > 0);
    selectedTargetIndex = nextAlive === -1 ? null : nextAlive;
  }

  if (enemies.every((e) => e.currentHP <= 0)) {
    appendLog("Zwycięstwo! Wszyscy przeciwnicy pokonani.", "system");
    playVictorySound();
    battleOver = true;
    awardLocationResources();
    render();
    return;
  }

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function castSkill() {
  if (battleOver || playerActionsRemaining <= 0) return;
  closeRadialMenu();
  radialMenuOpen = false;

  const skill = playerSkill();
  if (!skill) {
    appendLog("Wybierz najpierw klasę i specjalizację, żeby odblokować czar.", "system");
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

  const context = { allCombatants: [player, ...enemies], obstacles: OBSTACLES };
  const virtualAttacker = Object.assign({}, player, { weapon: skill });

  playerActionsRemaining--;
  playSpellCastSound();
  render();

  spawnProjectile(player.pos, target.pos, { icon: skill.icon, colorClass: skill.colorClass }, () => {
    const result = resolveAttack(virtualAttacker, target, context);
    const { text, cssClass } = formatAttackResult(result);
    appendLog(`${skill.icon} ${skill.name}! ${text}`, cssClass);
    triggerAttackFx(result, target.pos);
    if (result.hit) playSpellImpactSound(); else playMissSound();
    finishPlayerAction(target);
  });
}

function moveEnemyTowardPlayer(enemy) {
  // Path over TERRAIN only (obstacles), never over other units — the map is guaranteed
  // fully connected by terrain alone, so a route always exists. Other combatants are only
  // checked when actually stepping onto a hex, so a temporarily-blocked bottleneck just
  // truncates this turn's move instead of making the whole path search fail.
  const terrainFreeHexes = ALL_HEXES.filter((h) => !isObstacle(h));
  const terrainFreeKeySet = new Set(terrainFreeHexes.map(hexKey));

  // Prefer a hex within actual weapon range, but if the player is boxed in by terrain,
  // widen the search ring so the enemy still closes the distance as far as the map
  // allows instead of freezing in place.
  const currentDist = hexDistance(enemy.pos, player.pos);
  const maxRing = Math.max(enemy.weapon.range, currentDist);
  let targetKeySet = null;
  for (let ring = enemy.weapon.range; ring <= maxRing; ring++) {
    const candidates = terrainFreeHexes.filter((h) => hexDistance(h, player.pos) <= ring && !isOccupied(h, enemy));
    if (candidates.length > 0) {
      targetKeySet = new Set(candidates.map(hexKey));
      break;
    }
  }
  if (!targetKeySet) return;

  const pathKeys = bfsPathAvoiding([enemy.pos], targetKeySet, terrainFreeKeySet, new Set());
  if (!pathKeys) return;

  const pathHexes = pathKeys.map(hexFromKey).reverse();
  const maxSteps = Math.min(enemy.moveRange, pathHexes.length - 1);

  let destination = enemy.pos;
  for (let i = 1; i <= maxSteps; i++) {
    const step = pathHexes[i];
    if (isOccupied(step, enemy)) break;
    destination = step;
  }

  if (!hexEquals(destination, enemy.pos)) {
    enemy.pos = destination;
    appendLog(`${enemy.name} zbliża się (koszt: 1 akcja).`, "system");
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

function enemyPhase() {
  closeRadialMenu();
  radialMenuOpen = false;
  const context = { allCombatants: [player, ...enemies], obstacles: OBSTACLES };

  for (const enemy of enemies) {
    if (enemy.currentHP <= 0 || battleOver) continue;

    let actionsRemaining = 1 + enemy.extraActions;

    if (enemy.weapons.length > 1) {
      const desired = bestWeaponFor(enemy, player);
      if (desired !== enemy.weapon && actionsRemaining > 0) {
        switchWeapon(enemy);
        actionsRemaining--;
        appendLog(`${enemy.name} zmienia broń na: ${enemy.weapon.name} (koszt: 1 akcja).`, "system");
      }
    }

    while (!inRange(enemy, player) && actionsRemaining > 0) {
      moveEnemyTowardPlayer(enemy);
      actionsRemaining--;
    }

    if (!inRange(enemy, player)) {
      appendLog(`${enemy.name} jest poza zasięgiem i nie może zaatakować.`, "system");
      continue;
    }

    for (let i = 0; i < actionsRemaining; i++) {
      if (player.currentHP <= 0 || battleOver) break;
      const result = resolveAttack(enemy, player, context);
      const { text, cssClass } = formatAttackResult(result);
      appendLog(text, cssClass);
      triggerAttackFx(result, player.pos);
      if (result.hit) playHitSound(result.d6 === 6); else playMissSound();

      if (player.currentHP <= 0) {
        appendLog("Zginąłeś. Koniec gry — brak auto-healu.", "system");
        playDeathSound();
        battleOver = true;
      }
    }
  }

  playerActionsRemaining = 1 + player.extraActions;
  render();
}

document.getElementById("attack-btn").addEventListener("click", playerAttack);
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
document.getElementById("reset-btn").addEventListener("click", startNewBattle);
document.getElementById("mute-btn").addEventListener("click", (e) => {
  const muted = toggleAudioMuted();
  e.target.textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
  document.getElementById("settings-mute-btn").textContent = muted ? "🔇 Dźwięk" : "🔊 Dźwięk";
});
document.getElementById("change-location-btn").addEventListener("click", backToLocationSelect);
document.getElementById("main-menu-btn").addEventListener("click", goToMainMenu);

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

document.getElementById("creation-name-input").addEventListener("input", (e) => setPlayerName(e.target.value));
document.querySelectorAll(".gender-btn").forEach((btn) => {
  btn.addEventListener("click", () => setPlayerGender(btn.dataset.gender));
});
document.getElementById("creation-confirm-btn").addEventListener("click", confirmCharacterCreation);

render();
