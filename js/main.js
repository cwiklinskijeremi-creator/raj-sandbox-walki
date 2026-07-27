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
  const savedSubclass = findSubclassData(selectedClassName, selectedSubclassName);
  if (savedSubclass) applyClassProfile(player, savedSubclass);
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

function selectClass(cls) {
  if (phase !== "deployment") {
    appendLog("Klasę można wybrać tylko przed rozpoczęciem walki.", "system");
    return;
  }
  selectedClassName = cls.name;
  selectedSubclassName = null;
  player.class = selectedClassName;
  player.subclass = null;
  render();
}

function selectSubclass(sub) {
  if (phase !== "deployment") {
    appendLog("Specjalizację można wybrać tylko przed rozpoczęciem walki.", "system");
    return;
  }
  selectedSubclassName = sub.name;
  applyClassProfile(player, sub);
  player.class = selectedClassName;
  player.subclass = selectedSubclassName;
  appendLog(`Wybrano klasę: ${selectedClassName} — ${selectedSubclassName}. Statystyki i broń zaktualizowane.`, "system");
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
});

startNewBattle();
