let player;
let enemies;
let selectedTargetIndex = null;
let battleOver = false;
let playerActionsRemaining = 1;
let phase = "deployment";
let radialMenuOpen = false;
let selectedClassName = null;
let selectedSubclassName = null;

function isOccupied(hex, excluding) {
  const all = [player, ...enemies];
  return all.some((c) => c !== excluding && c.currentHP > 0 && c.pos && hexEquals(c.pos, hex));
}

function reachableFor(combatant) {
  return bfsReachable(combatant.pos, combatant.moveRange, (hex) => isObstacle(hex) || isOccupied(hex, combatant));
}

function deployEnemiesRandomly() {
  const candidates = ALL_HEXES.filter((h) => isEnemyDeployHex(h) && !isObstacle(h));
  for (const enemy of enemies) {
    const free = candidates.filter((h) => !isOccupied(h, enemy));
    enemy.pos = free[Math.floor(Math.random() * free.length)];
  }
}

function startNewBattle() {
  regenerateObstacles();
  resetTokenLayer();
  closeRadialMenu();
  radialMenuOpen = false;

  player = createPlayer();
  player.class = selectedClassName;
  player.subclass = selectedSubclassName;
  enemies = createEnemies();

  const defaultPos = getStartPositions().player;
  player.pos = isObstacle(defaultPos)
    ? ALL_HEXES.find((h) => isPlayerDeployHex(h) && !isObstacle(h))
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
  spawnHitEffect(defenderPos, { text: `-${result.damage}`, cssClass: result.d6 === 6 ? "crit" : "" });
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
      icon: "✨",
      label: "Umiejętności (wkrótce)",
      onClick: () => {
        radialMenuOpen = false;
        appendLog("Umiejętności będą dostępne w przyszłej aktualizacji.", "system");
        render();
      },
    },
  ]);
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

function selectClass(cls) {
  selectedClassName = cls.name;
  selectedSubclassName = null;
  player.class = selectedClassName;
  player.subclass = null;
  render();
}

function selectSubclass(sub) {
  selectedSubclassName = sub.name;
  player.subclass = selectedSubclassName;
  appendLog(`Wybrano klasę: ${selectedClassName} — ${selectedSubclassName}.`, "system");
  render();
}

function render() {
  renderClassPicker(selectedClassName, selectedSubclassName, selectClass, selectSubclass);

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
    ? ALL_HEXES.filter((h) => isPlayerDeployHex(h) && !isObstacle(h))
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
  playerActionsRemaining--;

  if (target.currentHP <= 0) {
    appendLog(`${target.name} pada martwy.`, "system");
    const nextAlive = enemies.findIndex((e) => e.currentHP > 0);
    selectedTargetIndex = nextAlive === -1 ? null : nextAlive;
  }

  if (enemies.every((e) => e.currentHP <= 0)) {
    appendLog("Zwycięstwo! Wszyscy przeciwnicy pokonani.", "system");
    battleOver = true;
    render();
    return;
  }

  if (playerActionsRemaining <= 0) {
    enemyPhase();
  } else {
    render();
  }
}

function moveEnemyTowardPlayer(enemy) {
  const options = [enemy.pos, ...reachableFor(enemy)];
  let best = enemy.pos;
  let bestDist = hexDistance(enemy.pos, player.pos);
  for (const hex of options) {
    const d = hexDistance(hex, player.pos);
    if (d < bestDist) {
      bestDist = d;
      best = hex;
    }
  }
  if (!hexEquals(best, enemy.pos)) {
    enemy.pos = best;
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

      if (player.currentHP <= 0) {
        appendLog("Zginąłeś. Koniec gry — brak auto-healu.", "system");
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

startNewBattle();
