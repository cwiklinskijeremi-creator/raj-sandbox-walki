function renderFighter(container, fighter, { selectable = false, selected = false, onClick = null, damagePreview = null } = {}) {
  const dead = fighter.currentHP <= 0;
  const el = document.createElement("div");
  el.className = "fighter";
  if (selectable && !dead) el.classList.add("selectable");
  if (selected) el.classList.add("selected");
  if (dead) el.classList.add("dead");
  if (fighter.isBoss) el.classList.add("boss-fighter");
  if (fighter.isCompanion) el.classList.add("companion-fighter");

  const hpPct = Math.max(0, (fighter.currentHP / fighter.maxHP) * 100);

  let hpBarPreview = "";
  let bodyHtml;

  if (damagePreview !== null && !dead) {
    const predictedHP = Math.max(0, fighter.currentHP - damagePreview);
    const predictedPct = Math.max(0, (predictedHP / fighter.maxHP) * 100);
    hpBarPreview = `<div class="hp-bar-preview" style="left:${predictedPct}%; width:${Math.max(0, hpPct - predictedPct)}%"></div>`;
    bodyHtml = `
      <div class="stats damage-preview">
        W zasięgu — średnie obrażenia: <strong>~${damagePreview.toFixed(0)}</strong> &nbsp;|&nbsp;
        HP po trafieniu: ${fighter.currentHP} → ~${predictedHP.toFixed(0)}
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="stats">
        HP: ${fighter.currentHP}/${fighter.maxHP} &nbsp;|&nbsp;
        Broń: <strong>${fighter.weapon.name} (${fighter.weapon.minDmg}-${fighter.weapon.maxDmg}, zas.${fighter.weapon.range})</strong>
        ${fighter.isPlayer ? "<em>(kliknij swój token, żeby otworzyć menu)</em>" : ""}
      </div>
      ${fighter.isPlayer ? `<div class="stats corruption-line">🧬 Spaczenie: ${corruption || 0}%${corruption > 20 ? " — ryzyko obłędu!" : ""} &nbsp;|&nbsp; 🍖 Pożarte szczątki: ${devouredCount || 0} (tier ${mutationTier()})</div>` : ""}
    `;
  }

  const effectParts = [];
  (fighter.activeEffects || []).forEach((eff) => {
    const sign = eff.amount > 0 ? "+" : "";
    const amountText = eff.stat === "pancerz" ? `${Math.round(eff.amount * 100)}%` : `${sign}${eff.amount}`;
    effectParts.push(`${eff.label} ${amountText} (${eff.turnsLeft})`);
  });
  if (fighter.poison && fighter.poison.turnsLeft > 0) {
    effectParts.push(`☠️ trucizna ${fighter.poison.dmgPerTurn}/turę (${fighter.poison.turnsLeft})`);
  }
  if (fighter.isBoss && fighter.special) {
    effectParts.push(fighter.specialCooldown > 0
      ? `${fighter.special.icon} ${fighter.special.name} (odnowienie: ${fighter.specialCooldown})`
      : `${fighter.special.icon} ${fighter.special.name} (gotowe)`);
  }
  const effectsHtml = effectParts.length && !dead
    ? `<div class="stats fighter-effects">Efekty: ${effectParts.join(", ")}</div>`
    : "";

  const mutatedTag = fighter.mutated && !fighter.isPlayer
    ? `<span class="mutated-tag" title="Spaczony przeciwnik — po pokonaniu będzie można pożreć jego szczątki.">🧟 spaczony</span> `
    : "";

  el.innerHTML = `
    <strong>${fighter.isBoss ? "👑 " : fighter.isCompanion ? "👥 " : ""}${fighter.name}</strong> ${dead ? "(martwy)" : ""} ${mutatedTag}
    <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${hpPct}%"></div>${hpBarPreview}</div>
    ${bodyHtml}
    ${effectsHtml}
  `;

  if (selectable && !dead && onClick) {
    el.addEventListener("click", onClick);
  }

  container.appendChild(el);
}

function appendLog(message, cssClass = "") {
  const logEl = document.getElementById("combat-log");
  const entry = document.createElement("div");
  entry.className = `log-entry ${cssClass}`.trim();
  entry.textContent = message;
  logEl.appendChild(entry);
}

function clearLog() {
  document.getElementById("combat-log").innerHTML = "";
}

function formatAttackResult(result) {
  const d6Text = result.d6Bonus
    ? `K6=${result.d6Raw}${result.d6Bonus > 0 ? "+" : ""}${result.d6Bonus}→${result.d6}`
    : `K6=${result.d6}`;

  if (!result.hit) {
    return {
      text: `${result.attackerName} atakuje ${result.defenderName}: ${d6Text} → Pudło! 0 obrażeń.`,
      cssClass: "miss",
    };
  }

  const pctText = result.diff > 0
    ? `+${(result.diff * 5)}% (atak ${result.diff} pkt ponad obronę)`
    : result.diff < 0
      ? `-${(-result.diff * 2.5)}% (obrona ${-result.diff} pkt ponad atak)`
      : "±0%";

  const armorPct = (result.effectiveArmor * 100).toFixed(0);

  const d20RollsText = result.d20Rolls.length > 1
    ? `[${result.d20Rolls.join(",")}]→${Math.max(...result.d20Rolls)}`
    : `${result.d20Rolls[0]}`;
  const d20Text = result.d20Bonus
    ? `K20=${d20RollsText}${result.d20Bonus > 0 ? "+" : ""}${result.d20Bonus}→${result.d20}`
    : `K20=${d20RollsText}`;

  const chaText = result.charismaExponent !== 1 ? ` (^${result.charismaExponent})` : "";
  const flankText = result.flanked ? `, flankowanie +${FLANK_BONUS * 100}%` : "";
  const coverText = result.coverReduction > 0 ? `, teren -${(result.coverReduction * 100).toFixed(0)}%` : "";

  const text = `${result.attackerName} → ${result.defenderName}: ${d6Text} (${result.locationName}, x${HIT_LOCATIONS[result.d6].mult}${chaText}), `
    + `${d20Text} (x${result.d20Mult.toFixed(2)}${chaText}), broń=${result.weaponRoll}, ${pctText}, `
    + `pancerz -${armorPct}%${flankText}${coverText} `
    + `⇒ ${result.damage} obrażeń.`;

  const cssClass = result.d6 === 6 ? "crit" : "";
  return { text, cssClass };
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

let tokenElements = new Map();

function resetTokenLayer() {
  tokenElements = new Map();
  const svg = document.getElementById("battle-map");
  const layer = svg && svg.querySelector("#token-layer");
  if (layer) layer.innerHTML = "";
}

function renderGrid({ svg, player, companions = [], enemies, obstacles, reachableHexes = [], deployHexes = [], onHexClick }) {
  const positions = ALL_HEXES.map((h) => axialToPixel(h));
  const minX = Math.min(...positions.map((p) => p.x)) - HEX_SIZE;
  const minY = Math.min(...positions.map((p) => p.y)) - HEX_SIZE;
  const maxX = Math.max(...positions.map((p) => p.x)) + HEX_SIZE;
  const maxY = Math.max(...positions.map((p) => p.y)) + HEX_SIZE;
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  let hexLayer = svg.querySelector("#hex-layer");
  if (!hexLayer) {
    hexLayer = svgEl("g", { id: "hex-layer" });
    svg.appendChild(hexLayer);
  }
  hexLayer.innerHTML = "";

  let tokenLayer = svg.querySelector("#token-layer");
  if (!tokenLayer) {
    tokenLayer = svgEl("g", { id: "token-layer" });
    svg.appendChild(tokenLayer);
  }

  const allCombatants = [player, ...companions, ...enemies];

  for (const hex of ALL_HEXES) {
    const { x, y } = axialToPixel(hex);
    const corners = hexCorners(x, y).map((c) => `${c.x},${c.y}`).join(" ");
    const obstacle = obstacles.some((o) => hexEquals(o, hex));
    const reachable = reachableHexes.some((r) => hexEquals(r, hex));
    const deployable = deployHexes.some((d) => hexEquals(d, hex));
    const occupant = allCombatants.find((c) => c.currentHP > 0 && c.pos && hexEquals(c.pos, hex));

    const type = obstacle ? obstacleType(hex) : null;

    const classes = ["hex-tile"];
    if (obstacle) classes.push("hex-obstacle", `hex-obstacle-${type}`);
    if (reachable && !occupant) classes.push("hex-reachable");
    if (deployable && !occupant) classes.push("hex-deploy");

    const isPlayerOwnHex = occupant === player;
    const clickable = (reachable && !occupant) || (deployable && !occupant) || (occupant && occupant !== player) || isPlayerOwnHex;

    const poly = svgEl("polygon", { points: corners, class: classes.join(" ") });
    poly.addEventListener("click", () => onHexClick(hex));
    if (clickable) poly.classList.add("hex-clickable");
    hexLayer.appendChild(poly);

    if (obstacle) {
      const emoji = { rock: "🪨", tree: "🌳", lake: "🌊" }[type];
      const icon = svgEl("text", { x, y: y + 8, class: "obstacle-icon", "text-anchor": "middle" });
      icon.textContent = emoji;
      icon.style.pointerEvents = "none";
      hexLayer.appendChild(icon);
    }
  }

  const stillPresent = new Set();

  for (const combatant of allCombatants) {
    if (!combatant.pos || combatant.currentHP <= 0) continue;
    stillPresent.add(combatant);

    const { x, y } = axialToPixel(combatant.pos);
    const isPlayerToken = combatant === player;
    const isCompanionToken = companions.includes(combatant);
    const tokenClass = isPlayerToken ? "token-player" : isCompanionToken ? "token-companion" : "token-enemy";

    let entry = tokenElements.get(combatant);
    if (!entry) {
      const circle = svgEl("circle", {
        cx: x, cy: y, r: HEX_SIZE * 0.5,
        class: `token ${tokenClass}`,
      });
      const label = svgEl("text", { x, y: y + 9, class: "token-label", "text-anchor": "middle" });
      label.textContent = combatant.icon;
      const rangeLabel = svgEl("text", { x, y: y + HEX_SIZE * 0.5 + 14, class: "token-range", "text-anchor": "middle" });

      tokenLayer.appendChild(circle);
      tokenLayer.appendChild(label);
      tokenLayer.appendChild(rangeLabel);

      entry = { circle, label, rangeLabel };
      tokenElements.set(combatant, entry);
    }

    entry.circle.setAttribute("cx", x);
    entry.circle.setAttribute("cy", y);
    entry.label.setAttribute("x", x);
    entry.label.setAttribute("y", y + 9);
    entry.label.textContent = combatant.icon;
    entry.rangeLabel.setAttribute("x", x);
    entry.rangeLabel.setAttribute("y", y + HEX_SIZE * 0.5 + 14);
    entry.rangeLabel.textContent = `zas.${combatant.weapon.range}`;
  }

  for (const [combatant, entry] of tokenElements) {
    if (stillPresent.has(combatant)) continue;
    entry.circle.remove();
    entry.label.remove();
    entry.rangeLabel.remove();
    tokenElements.delete(combatant);
  }
}

function spawnProjectile(fromHex, toHex, { icon, colorClass = "" }, onArrive) {
  const fxLayer = document.getElementById("fx-layer");
  if (!fxLayer) {
    onArrive();
    return;
  }

  const from = hexToLayerXY(fromHex);
  const to = hexToLayerXY(toHex);

  const proj = document.createElement("div");
  proj.className = `spell-projectile ${colorClass}`.trim();
  proj.textContent = icon;
  proj.style.left = `${from.left}px`;
  proj.style.top = `${from.top}px`;
  fxLayer.appendChild(proj);

  requestAnimationFrame(() => {
    proj.style.left = `${to.left}px`;
    proj.style.top = `${to.top}px`;
  });

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    proj.remove();
    onArrive();
  };
  proj.addEventListener("transitionend", settle);
  setTimeout(settle, 700);
}

function triggerScreenShake(intensity = "normal") {
  const stage = document.querySelector(".map-stage");
  if (!stage) return;
  const shakeClass = intensity === "crit" ? "shake-crit" : "shake-normal";
  stage.classList.remove("shake-normal", "shake-crit");
  void stage.offsetWidth;
  stage.classList.add(shakeClass);
  stage.addEventListener("animationend", () => stage.classList.remove(shakeClass), { once: true });
}

function hexToLayerXY(hex) {
  if (window.board3dHexToLayerXY) {
    const projected = window.board3dHexToLayerXY(hex);
    if (projected) return projected;
  }
  const svg = document.getElementById("battle-map");
  const fxLayer = document.getElementById("fx-layer");
  const ctm = svg.getScreenCTM();
  if (!ctm) return { left: -9999, top: -9999 };
  const { x, y } = axialToPixel(hex);
  const screenPt = new DOMPoint(x, y).matrixTransform(ctm);
  const layerRect = fxLayer.getBoundingClientRect();
  return { left: screenPt.x - layerRect.left, top: screenPt.y - layerRect.top };
}

function spawnHitEffect(hex, { text, cssClass = "" }) {
  const svg = document.getElementById("battle-map");
  const fxLayer = document.getElementById("fx-layer");
  if (!svg || !fxLayer) return;

  const { left, top } = hexToLayerXY(hex);

  const flash = document.createElement("div");
  flash.className = `hit-flash ${cssClass}`.trim();
  flash.style.left = `${left}px`;
  flash.style.top = `${top}px`;
  fxLayer.appendChild(flash);
  flash.addEventListener("animationend", () => flash.remove());

  const popup = document.createElement("div");
  popup.className = `dmg-popup ${cssClass}`.trim();
  popup.textContent = text;
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  fxLayer.appendChild(popup);
  popup.addEventListener("animationend", () => popup.remove());
}

function closeRadialMenu() {
  const existing = document.querySelector(".radial-menu");
  if (existing) existing.remove();
}

function showRadialMenu(hex, options) {
  const fxLayer = document.getElementById("fx-layer");
  if (!fxLayer) return;

  closeRadialMenu();

  const { left, top } = hexToLayerXY(hex);
  const menu = document.createElement("div");
  menu.className = "radial-menu";

  const radius = 55;
  const startAngle = -Math.PI / 2;
  const angleStep = options.length > 1 ? (2 * Math.PI) / options.length : 0;

  options.forEach((opt, i) => {
    const angle = startAngle + i * angleStep;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "radial-menu-btn";
    btn.textContent = opt.icon;
    btn.title = opt.label;
    btn.disabled = !!opt.disabled;
    btn.style.left = `${left + radius * Math.cos(angle)}px`;
    btn.style.top = `${top + radius * Math.sin(angle)}px`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeRadialMenu();
      opt.onClick();
    });
    menu.appendChild(btn);
  });

  fxLayer.appendChild(menu);
}

function renderCharacterCreation(state, handlers) {
  const { playerName, playerGender, selectedClassName, selectedSubclassName, bonusStats, statPointsAvailable } = state;

  const nameInput = document.getElementById("creation-name-input");
  if (document.activeElement !== nameInput) nameInput.value = playerName;

  document.querySelectorAll(".gender-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.gender === playerGender);
  });

  const wheel = document.getElementById("creation-class-wheel");
  const radius = 95;
  const center = radius + 32;
  wheel.style.width = `${center * 2}px`;
  wheel.style.height = `${center * 2}px`;
  wheel.innerHTML = "";

  const angleStep = (2 * Math.PI) / CLASS_DATA.length;
  const startAngle = -Math.PI / 2;

  CLASS_DATA.forEach((cls, i) => {
    const angle = startAngle + i * angleStep;
    const isSelected = cls.name === selectedClassName;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `class-wheel-btn${isSelected ? " selected centered" : selectedClassName ? " dimmed" : ""}`;
    btn.textContent = cls.icon;
    btn.title = cls.name;
    btn.style.left = `${isSelected ? center : center + radius * Math.cos(angle)}px`;
    btn.style.top = `${isSelected ? center : center + radius * Math.sin(angle)}px`;
    btn.addEventListener("click", () => handlers.onSelectClass(cls));
    wheel.appendChild(btn);
  });

  const centerLabel = document.getElementById("creation-wheel-center");
  centerLabel.style.left = `${center}px`;
  centerLabel.style.top = `${center}px`;
  centerLabel.textContent = selectedClassName ? "" : "Klasa";

  const subRow = document.getElementById("creation-subclass-row");
  subRow.innerHTML = "";
  const selectedClass = CLASS_DATA.find((c) => c.name === selectedClassName);
  if (selectedClass) {
    selectedClass.subclasses.forEach((sub) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `subclass-btn${sub.name === selectedSubclassName ? " selected" : ""}`;
      btn.textContent = `${sub.icon} ${sub.name}`;
      btn.addEventListener("click", () => handlers.onSelectSubclass(sub));
      subRow.appendChild(btn);
    });
  }

  const descEl = document.getElementById("creation-description");
  const selectedSub = selectedClass && selectedClass.subclasses.find((s) => s.name === selectedSubclassName);
  if (!selectedClassName) {
    descEl.innerHTML = `<p class="creation-hint">Wybierz klasę postaci.</p>`;
  } else if (!selectedSub) {
    descEl.innerHTML = `<p class="creation-hint">Wybrano: ${selectedClassName} — wybierz specjalizację, aby zobaczyć opis.</p>`;
  } else {
    descEl.innerHTML = `
      <h4>${selectedSub.icon} ${selectedSub.name}</h4>
      <p>${LORE_DATA.classFlavor[selectedSub.name] || ""}</p>
      <div class="codex-subclass-gear">Broń: ${selectedSub.weapons.map((w) => w.name).join(", ")}</div>
      <div class="codex-subclass-gear">Umiejętności: ${selectedSub.skills.map((s) => `${s.icon} ${s.name} (odnowienie: ${turnsLabel(s.cooldown)})`).join(" &nbsp;|&nbsp; ")}</div>
    `;
  }

  const statsEl = document.getElementById("creation-stats");
  if (!selectedSub) {
    statsEl.innerHTML = `<p class="creation-hint">Wybierz specjalizację, aby rozdzielić punkty statystyk.</p>`;
  } else {
    renderStatAllocatorInto(statsEl, selectedSub, bonusStats, statPointsAvailable, handlers.onAdjustStat);
  }

  const confirmBtn = document.getElementById("creation-confirm-btn");
  confirmBtn.disabled = !(playerName.trim().length > 0 && !!playerGender && !!selectedSub);
}

const INTRO_MOOD_COLORS = ["#f0be3c", "#e0574b", "#b48ce0"];

function ensureIntroParticles() {
  const layer = document.getElementById("intro-particles");
  if (!layer || layer.childElementCount > 0) return;
  const count = 22;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = "intro-particle";
    const size = 2 + Math.random() * 3;
    const duration = 9 + Math.random() * 10;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${-Math.random() * duration}s`;
    layer.appendChild(particle);
  }
}

function renderIntroCinematic(step) {
  const sceneEl = document.getElementById("intro-scene");
  const bodyEl = document.getElementById("intro-body");
  const progressEl = document.getElementById("intro-progress");
  const nextBtn = document.getElementById("intro-next-btn");

  const beats = LORE_DATA.world.paragraphs;
  const lastStep = beats.length - 1;
  const clampedStep = Math.min(step, lastStep);
  const isLast = clampedStep >= lastStep;

  ensureIntroParticles();
  sceneEl.style.setProperty("--intro-mood-color", INTRO_MOOD_COLORS[clampedStep % INTRO_MOOD_COLORS.length]);

  bodyEl.innerHTML = `<p class="intro-text">${beats[clampedStep]}</p>`;
  progressEl.textContent = `${clampedStep + 1} / ${beats.length}`;
  nextBtn.textContent = isLast ? "Stwórz postać" : "Dalej";
}

function renderPrologue(prologue, step) {
  const titleEl = document.getElementById("prologue-title");
  const progressEl = document.getElementById("prologue-progress");
  const bodyEl = document.getElementById("prologue-body");
  const nextBtn = document.getElementById("prologue-next-btn");
  const finishBtn = document.getElementById("prologue-finish-btn");

  if (!prologue) {
    titleEl.textContent = "";
    progressEl.textContent = "";
    bodyEl.innerHTML = "";
    nextBtn.classList.add("hidden");
    finishBtn.classList.remove("hidden");
    return;
  }

  const lastStep = prologue.beats.length - 1;
  const clampedStep = Math.min(step, lastStep);
  const isLast = clampedStep >= lastStep;

  titleEl.textContent = `${prologue.icon} ${prologue.title}`;
  progressEl.textContent = `${clampedStep + 1}/${prologue.beats.length}`;
  bodyEl.innerHTML = `<p class="prologue-text">${prologue.beats[clampedStep]}</p>`;

  nextBtn.classList.toggle("hidden", isLast);
  finishBtn.classList.toggle("hidden", !isLast);
}

function renderEpilogue(chapter, className, corruptionValue) {
  const titleEl = document.getElementById("epilogue-title");
  const bodyEl = document.getElementById("epilogue-body");
  if (!chapter) {
    titleEl.textContent = "";
    bodyEl.innerHTML = "";
    return;
  }

  const classEpilogue = CLASS_EPILOGUES[className];
  const corruptionCoda = (corruptionValue || 0) >= CORRUPTION_EPILOGUE_HIGH_THRESHOLD
    ? CORRUPTION_EPILOGUE_ADDENDUM.high
    : CORRUPTION_EPILOGUE_ADDENDUM.low;

  titleEl.textContent = `${chapter.icon} ${chapter.title} — Epilog`;
  bodyEl.innerHTML = `
    ${chapter.outro.map((line) => `<p class="prologue-text">${line}</p>`).join("")}
    ${classEpilogue ? `<p class="prologue-text">${classEpilogue.icon} ${classEpilogue.reflection}</p>` : ""}
    <p class="prologue-text">${corruptionCoda}</p>
  `;
}

const STAT_META = [
  { key: "str", label: "STR" },
  { key: "wyt", label: "WYT" },
  { key: "zre", label: "ZRE" },
  { key: "int", label: "INT" },
  { key: "cha", label: "CHA" },
];

function renderStatAllocatorInto(container, baseStats, bonusStats, totalPoints, onAdjust) {
  const spent = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  const remaining = totalPoints - spent;
  container.innerHTML = `<div class="creation-points-remaining">Pozostałe punkty: <strong>${remaining}</strong>/${totalPoints}</div>` +
    STAT_META.map(({ key, label }) => `
      <div class="stat-row">
        <span class="stat-row-label">${label}</span>
        <span class="stat-row-value">${baseStats[key] + bonusStats[key]}</span>
        <button type="button" class="stat-btn stat-minus" data-stat="${key}" ${bonusStats[key] <= 0 ? "disabled" : ""}>−</button>
        <button type="button" class="stat-btn stat-plus" data-stat="${key}" ${remaining <= 0 ? "disabled" : ""}>+</button>
      </div>
    `).join("");
  container.querySelectorAll(".stat-minus").forEach((btn) => {
    btn.addEventListener("click", () => onAdjust(btn.dataset.stat, -1));
  });
  container.querySelectorAll(".stat-plus").forEach((btn) => {
    btn.addEventListener("click", () => onAdjust(btn.dataset.stat, 1));
  });
}

function renderMainMenuState(activeRunData) {
  const resumeBtn = document.getElementById("resume-btn");
  const infoEl = document.getElementById("main-menu-save-info");
  if (!activeRunData) {
    resumeBtn.disabled = true;
    infoEl.textContent = "Brak zapisanej gry.";
    return;
  }
  resumeBtn.disabled = false;
  const loc = LOCATIONS.find((l) => l.key === activeRunData.locationKey);
  const locText = loc ? `${loc.icon} ${loc.name}` : "🏕️ Obóz";
  const when = new Date(activeRunData.savedAt).toLocaleString("pl-PL");
  infoEl.textContent = `Ostatni zapis: ${locText} — ${when}`;
}

function renderCamp(player, level, xp, xpToNext) {
  const card = document.getElementById("camp-character-card");
  if (!player) {
    card.innerHTML = "";
    return;
  }
  card.innerHTML = `
    <div class="camp-character-icon">${player.icon}</div>
    <div class="camp-character-name">${player.name}</div>
    <div class="camp-character-class">${player.class || ""}${player.subclass ? " — " + player.subclass : ""}</div>
    <div class="camp-character-level">Poziom ${level} &nbsp;|&nbsp; ${xp}/${xpToNext} PD</div>
    <div class="camp-character-meta">
      ${[
        player.gender ? `Płeć: ${player.gender}` : "",
        `HP: ${player.maxHP}`,
        `STR ${player.str}`, `WYT ${player.wyt}`, `ZRE ${player.zre}`, `INT ${player.int}`, `CHA ${player.cha}`,
      ].filter(Boolean).map((part) => `<span class="meta-chip">${part}</span>`).join("")}
    </div>
  `;
}

function formatItemBonus(item) {
  const parts = [];
  if (item.bonus.pancerz) parts.push(`+${(item.bonus.pancerz * 100).toFixed(0)}% pancerza`);
  if (item.bonus.przebicie) parts.push(`+${(item.bonus.przebicie * 100).toFixed(0)}% przebicia`);
  ["str", "wyt", "zre", "int", "cha"].forEach((k) => {
    if (item.bonus[k]) parts.push(`+${item.bonus[k]} ${k.toUpperCase()}`);
  });
  return parts.join(", ");
}

function formatScaledItemBonus(item, multiplier) {
  const parts = [];
  if (item.bonus.pancerz) parts.push(`+${(item.bonus.pancerz * multiplier * 100).toFixed(0)}% pancerza`);
  if (item.bonus.przebicie) parts.push(`+${(item.bonus.przebicie * multiplier * 100).toFixed(0)}% przebicia`);
  ["str", "wyt", "zre", "int", "cha"].forEach((k) => {
    if (item.bonus[k]) parts.push(`+${Math.round(item.bonus[k] * multiplier)} ${k.toUpperCase()}`);
  });
  return parts.join(", ");
}

function formatItemWeapon(item) {
  if (!item.weapon) return "";
  return `<div class="sheet-item-weapon">🗡️ Broń: ${item.weapon.name} (${item.weapon.minDmg}-${item.weapon.maxDmg}, zas.${item.weapon.range})</div>`;
}

function renderCharacterSheet(player, inventory, equipped, resources, potionInventory, equipmentUpgrades, progress, handlers) {
  const body = document.getElementById("character-sheet-body");
  if (!player) {
    body.innerHTML = `<p class="creation-hint">Brak postaci.</p>`;
    return;
  }

  const { level, xp, xpToNext, bonusStats, statPointsAvailable, corruption, devouredCount, mutationTier } = progress;
  const spentPoints = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  const unspentPoints = statPointsAvailable - spentPoints;

  const statsHtml = `
    <div class="sheet-section">
      <h4>${player.icon} ${player.name}</h4>
      <div class="sheet-level-line">Poziom ${level} &nbsp;|&nbsp; ${xp}/${xpToNext} PD</div>
      <div class="sheet-stats-grid">
        <div>Klasa: ${player.class || "—"}${player.subclass ? " — " + player.subclass : ""}</div>
        <div>Płeć: ${player.gender || "—"}</div>
        <div>HP: ${player.maxHP}</div>
        <div>Pancerz: ${(player.pancerz * 100).toFixed(0)}%</div>
        <div>Przebicie: ${(player.przebicie * 100).toFixed(0)}%</div>
        <div>Ruch: ${player.moveRange}</div>
        <div>STR: ${player.str}</div>
        <div>WYT: ${player.wyt}</div>
        <div>ZRE: ${player.zre}</div>
        <div>INT: ${player.int}</div>
        <div>CHA: ${player.cha}</div>
      </div>
      <div class="corruption-line">🧬 Spaczenie: ${corruption || 0}%${corruption > 20 ? " — ryzyko obłędu w walce!" : ""}</div>
      <div class="corruption-line">🍖 Pożarte szczątki: ${devouredCount || 0} (mutacja tier ${mutationTier || 0}, +${MUTATE_STAT_BONUS + (mutationTier || 0)} STR/WYT przy "Mutuj się")</div>
    </div>
  `;

  const baseStats = {
    str: player.str - bonusStats.str,
    wyt: player.wyt - bonusStats.wyt,
    zre: player.zre - bonusStats.zre,
    int: player.int - bonusStats.int,
    cha: player.cha - bonusStats.cha,
  };
  const levelUpHtml = unspentPoints > 0
    ? `
      <div class="sheet-section">
        <h4>Niewydane punkty statystyk</h4>
        <div class="creation-stats" id="sheet-stat-allocator"></div>
      </div>
    `
    : "";

  const resourcesHtml = `
    <div class="sheet-section">
      <h4>Twoje zasoby</h4>
      <div class="resource-bar">${formatResourceBar(resources)}</div>
    </div>
  `;

  const slotsHtml = `
    <div class="sheet-section">
      <h4>Ekwipunek założony</h4>
      <div class="sheet-slots">
        ${EQUIPMENT_SLOTS.map((slot) => {
          const itemId = equipped[slot.key];
          const item = itemId ? EQUIPMENT_ITEMS.find((i) => i.id === itemId) : null;
          const level = itemId ? (equipmentUpgrades[itemId] || 0) : 0;
          return `
            <div class="sheet-slot">
              <div class="sheet-slot-label">${slot.label}</div>
              ${item
                ? `<div class="sheet-slot-item">
                    <div>
                      <div class="sheet-item-name">${item.icon} ${item.name}${level > 0 ? ` <span class="potion-count">+${level}</span>` : ""}</div>
                      ${formatItemWeapon(item)}
                      <div class="sheet-item-bonus">${formatScaledItemBonus(item, 1 + level * 0.25)}</div>
                    </div>
                    <button type="button" class="sheet-action-btn unequip-btn" data-slot="${slot.key}">Zdejmij</button>
                  </div>`
                : `<div class="sheet-slot-empty">Puste</div>`}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  const ownedUnequipped = inventory.filter((id) => !Object.values(equipped).includes(id));
  const inventoryHtml = `
    <div class="sheet-section">
      <h4>Plecak</h4>
      ${ownedUnequipped.length === 0
        ? `<p class="sheet-empty-note">Brak przedmiotów w plecaku.</p>`
        : ownedUnequipped.map((id) => {
            const item = EQUIPMENT_ITEMS.find((i) => i.id === id);
            const level = equipmentUpgrades[id] || 0;
            return `
              <div class="sheet-item-row">
                <div class="sheet-item-info">
                  <div class="sheet-item-name">${item.icon} ${item.name}${level > 0 ? ` <span class="potion-count">+${level}</span>` : ""}</div>
                  <div class="sheet-item-desc">${item.description}</div>
                  ${formatItemWeapon(item)}
                  <div class="sheet-item-bonus">${formatScaledItemBonus(item, 1 + level * 0.25)}</div>
                </div>
                <button type="button" class="sheet-action-btn equip-btn" data-item="${item.id}">Załóż</button>
              </div>
            `;
          }).join("")}
    </div>
  `;

  const notOwned = EQUIPMENT_ITEMS.filter((item) => item.vendor === "camp" && !inventory.includes(item.id));
  const shopHtml = `
    <div class="sheet-section">
      <h4>Kupiec obozowy</h4>
      ${notOwned.length === 0 ? `<p class="sheet-empty-note">Wykupiono cały dostępny towar.</p>` : ""}
      ${notOwned.map((item) => {
        const owned = resources[item.cost.currency] ? resources[item.cost.currency].amount : 0;
        const affordable = owned >= item.cost.amount;
        return `
          <div class="sheet-item-row">
            <div class="sheet-item-info">
              <div class="sheet-item-name">${item.icon} ${item.name}</div>
              <div class="sheet-item-desc">${item.description}</div>
              ${formatItemWeapon(item)}
              <div class="sheet-item-bonus">${formatItemBonus(item)}</div>
              <div class="sheet-item-cost">Koszt: ${item.cost.amount} × ${item.cost.currency} (masz: ${owned})</div>
            </div>
            <button type="button" class="sheet-action-btn buy-btn" data-item="${item.id}" ${affordable ? "" : "disabled"}>Kup</button>
          </div>
        `;
      }).join("")}
    </div>
  `;

  const ownedPotions = POTION_ITEMS.filter((p) => potionInventory[p.id] > 0);
  const potionInventoryHtml = `
    <div class="sheet-section">
      <h4>Twoje mikstury</h4>
      ${ownedPotions.length === 0
        ? `<p class="sheet-empty-note">Brak mikstur w plecaku — pijesz je w trakcie walki.</p>`
        : ownedPotions.map((potion) => `
            <div class="sheet-item-row">
              <div class="sheet-item-info">
                <div class="sheet-item-name">${potion.icon} ${potion.name} <span class="potion-count">×${potionInventory[potion.id]}</span></div>
                <div class="sheet-item-bonus">${formatPotionEffect(potion)}</div>
              </div>
            </div>
          `).join("")}
    </div>
  `;

  const potionShopHtml = `
    <div class="sheet-section">
      <h4>Zielarz obozowy</h4>
      ${POTION_ITEMS.map((potion) => {
        const owned = resources[potion.cost.currency] ? resources[potion.cost.currency].amount : 0;
        const affordable = owned >= potion.cost.amount;
        return `
          <div class="sheet-item-row">
            <div class="sheet-item-info">
              <div class="sheet-item-name">${potion.icon} ${potion.name}</div>
              <div class="sheet-item-desc">${potion.description}</div>
              <div class="sheet-item-bonus">${formatPotionEffect(potion)}</div>
              <div class="sheet-item-cost">Koszt: ${potion.cost.amount} × ${potion.cost.currency} (masz: ${owned})</div>
            </div>
            <button type="button" class="sheet-action-btn buy-potion-btn" data-potion="${potion.id}" ${affordable ? "" : "disabled"}>Kup</button>
          </div>
        `;
      }).join("")}
    </div>
  `;

  body.innerHTML = statsHtml + levelUpHtml + resourcesHtml + slotsHtml + inventoryHtml + shopHtml + potionInventoryHtml + potionShopHtml;

  if (unspentPoints > 0) {
    renderStatAllocatorInto(document.getElementById("sheet-stat-allocator"), baseStats, bonusStats, statPointsAvailable, handlers.onAdjustStat);
  }

  body.querySelectorAll(".unequip-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onUnequip(btn.dataset.slot));
  });
  body.querySelectorAll(".equip-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onEquip(btn.dataset.item));
  });
  body.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onBuy(btn.dataset.item));
  });
  body.querySelectorAll(".buy-potion-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onBuyPotion(btn.dataset.potion));
  });
}

function renderPotionMenu(potionInventory, onUse) {
  const body = document.getElementById("potions-body");
  const owned = POTION_ITEMS.filter((p) => potionInventory[p.id] > 0);

  body.innerHTML = owned.length === 0
    ? `<p class="sheet-empty-note">Brak mikstur w plecaku — kup je u zielarza w obozie (🎒 Ekwipunek i postać).</p>`
    : owned.map((potion) => `
        <div class="sheet-item-row">
          <div class="sheet-item-info">
            <div class="sheet-item-name">${potion.icon} ${potion.name} <span class="potion-count">×${potionInventory[potion.id]}</span></div>
            <div class="sheet-item-desc">${potion.description}</div>
            <div class="sheet-item-bonus">${formatPotionEffect(potion)}</div>
          </div>
          <button type="button" class="sheet-action-btn use-potion-btn" data-potion="${potion.id}">Wypij</button>
        </div>
      `).join("");

  body.querySelectorAll(".use-potion-btn").forEach((btn) => {
    btn.addEventListener("click", () => onUse(btn.dataset.potion));
  });
}

function renderLocationPicker(locations, currentLocation, onSelect) {
  const grid = document.getElementById("location-grid");
  grid.innerHTML = "";
  locations.forEach((loc) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `location-card${currentLocation && currentLocation.key === loc.key ? " selected" : ""}`;
    card.innerHTML = `
      <div class="location-card-icon">${loc.icon}</div>
      <div class="location-card-name">${loc.name}</div>
      <div class="location-card-desc">${loc.description}</div>
      <div class="location-card-resource">${loc.resource.icon} ${loc.resource.name} (${loc.resource.min}-${loc.resource.max})</div>
    `;
    card.addEventListener("click", () => onSelect(loc));
    grid.appendChild(card);
  });
}

function renderLocationBanner(location, isBossBattle = false) {
  const banner = document.getElementById("current-location-banner");
  if (!location) {
    banner.innerHTML = "";
    return;
  }
  const bossBadge = isBossBattle ? `<span class="boss-battle-badge">👑 Walka z bossem</span>` : "";
  banner.innerHTML = `<span class="location-banner-icon">${location.icon}</span> <span class="location-banner-name">${location.name}</span>${bossBadge}`;
}

function renderCityPicker(places, onSelect) {
  const grid = document.getElementById("city-grid");
  grid.innerHTML = "";
  places.forEach((place) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "location-card";
    card.innerHTML = `
      <div class="location-card-icon">${place.icon}</div>
      <div class="location-card-name">${place.name}</div>
      <div class="location-card-desc">${place.description}</div>
    `;
    card.addEventListener("click", () => onSelect(place));
    grid.appendChild(card);
  });
}

const TAVERN_BET_SIZES = [5, 10, 20];

function renderRecruitCard(recruit, progress, canRecruit, onRecruit) {
  const el = document.getElementById("city-place-recruit");
  if (!recruit) {
    el.innerHTML = "";
    return;
  }

  const { companion, quest } = recruit;
  const clamped = Math.min(progress, quest.goal);
  const pct = Math.round((clamped / quest.goal) * 100);
  const ready = clamped >= quest.goal;

  el.innerHTML = `
    <h4>👥 Potencjalny towarzysz</h4>
    <div class="sheet-item-row">
      <div class="sheet-item-info">
        <div class="sheet-item-name">${companion.icon} ${companion.name}</div>
        <div class="sheet-item-desc">${companion.className} — ${companion.subclassName}. ${quest.flavor}</div>
        <div class="quest-progress-track"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
        <div class="sheet-item-bonus">${clamped}/${quest.goal} ${quest.label}</div>
      </div>
      <button type="button" class="sheet-action-btn recruit-btn" ${ready && canRecruit ? "" : "disabled"}>${ready ? "Porozmawiaj" : "Zwerbuj"}</button>
    </div>
    ${ready && !canRecruit ? `<p class="sheet-empty-note">Drużyna jest pełna (max ${MAX_COMPANIONS}) — zwolnij kogoś w „👥 Drużyna”, żeby zrobić miejsce.</p>` : ""}
  `;

  const btn = el.querySelector(".recruit-btn");
  if (btn) btn.addEventListener("click", onRecruit);
}

function renderRecruitScene(recruit, step) {
  const { companion } = recruit;
  const scene = COMPANION_SCENES[companion.subclassName] || [];
  const lastStep = scene.length - 1;
  const clampedStep = Math.min(step, Math.max(lastStep, 0));
  const isLast = clampedStep >= lastStep;

  document.getElementById("recruit-scene-body").innerHTML = `
    <div class="sheet-item-name">${companion.icon} ${companion.name}</div>
    <div class="sheet-item-desc">${companion.className} — ${companion.subclassName}</div>
    <p class="recruit-scene-text">${scene[clampedStep] || ""}</p>
  `;

  document.getElementById("recruit-scene-next-btn").classList.toggle("hidden", isLast);
  document.getElementById("recruit-scene-confirm-btn").classList.toggle("hidden", !isLast);
}

function renderPartyOverlay(companions, onDismiss, onOpenEquipment) {
  const body = document.getElementById("party-body");
  body.innerHTML = `<p class="creation-hint">Drużyna: ${companions.length}/${MAX_COMPANIONS} towarzyszy (+ Ty).</p>` +
    (companions.length === 0
      ? `<p class="sheet-empty-note">Nie masz jeszcze żadnych towarzyszy — poszukaj ich w mieście Aetherion.</p>`
      : companions.map((c, i) => `
          <div class="sheet-item-row">
            <div class="sheet-item-info">
              <div class="sheet-item-name">${c.icon} ${c.name}</div>
              <div class="sheet-item-desc">${c.className} — ${c.subclassName} &nbsp;|&nbsp; Poziom ${level}</div>
              <div class="sheet-item-bonus">HP: ${c.maxHP} &nbsp;|&nbsp; STR ${c.str} &nbsp; WYT ${c.wyt} &nbsp; ZRE ${c.zre} &nbsp; INT ${c.int} &nbsp; CHA ${c.cha}</div>
            </div>
            <div class="sheet-item-actions">
              <button type="button" class="sheet-action-btn open-companion-equip-btn" data-index="${i}">🎒 Ekwipunek</button>
              <button type="button" class="sheet-action-btn dismiss-companion-btn" data-index="${i}">Zwolnij</button>
            </div>
          </div>
        `).join(""));

  body.querySelectorAll(".open-companion-equip-btn").forEach((btn) => {
    btn.addEventListener("click", () => onOpenEquipment(Number(btn.dataset.index)));
  });

  body.querySelectorAll(".dismiss-companion-btn").forEach((btn) => {
    btn.addEventListener("click", () => onDismiss(Number(btn.dataset.index)));
  });
}

function renderCompanionSheet(companion, inventory, equipped, equipmentUpgrades, companions, handlers) {
  const body = document.getElementById("companion-sheet-body");
  if (!companion) {
    body.innerHTML = `<p class="creation-hint">Brak towarzysza.</p>`;
    return;
  }

  const cEquipped = companion.equipped || {};
  const statsHtml = `
    <div class="sheet-section">
      <h4>${companion.icon} ${companion.name}</h4>
      <div class="sheet-level-line">${companion.className} — ${companion.subclassName} &nbsp;|&nbsp; Poziom ${level}</div>
      <div class="sheet-stats-grid">
        <div>HP: ${companion.maxHP}</div>
        <div>Pancerz: ${(companion.pancerz * 100).toFixed(0)}%</div>
        <div>Przebicie: ${(companion.przebicie * 100).toFixed(0)}%</div>
        <div>Ruch: ${companion.moveRange}</div>
        <div>STR: ${companion.str}</div>
        <div>WYT: ${companion.wyt}</div>
        <div>ZRE: ${companion.zre}</div>
        <div>INT: ${companion.int}</div>
        <div>CHA: ${companion.cha}</div>
      </div>
    </div>
  `;

  const slotsHtml = `
    <div class="sheet-section">
      <h4>Ekwipunek założony</h4>
      <div class="sheet-slots">
        ${EQUIPMENT_SLOTS.map((slot) => {
          const itemId = cEquipped[slot.key];
          const item = itemId ? EQUIPMENT_ITEMS.find((i) => i.id === itemId) : null;
          const upgradeLevel = itemId ? (equipmentUpgrades[itemId] || 0) : 0;
          return `
            <div class="sheet-slot">
              <div class="sheet-slot-label">${slot.label}</div>
              ${item
                ? `<div class="sheet-slot-item">
                    <div>
                      <div class="sheet-item-name">${item.icon} ${item.name}${upgradeLevel > 0 ? ` <span class="potion-count">+${upgradeLevel}</span>` : ""}</div>
                      ${formatItemWeapon(item)}
                      <div class="sheet-item-bonus">${formatScaledItemBonus(item, 1 + upgradeLevel * 0.25)}</div>
                    </div>
                    <button type="button" class="sheet-action-btn companion-unequip-btn" data-slot="${slot.key}">Zdejmij</button>
                  </div>`
                : `<div class="sheet-slot-empty">Puste</div>`}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  const equippedElsewhere = new Set(Object.values(equipped).filter(Boolean));
  companions.forEach((c) => {
    if (c === companion || !c.equipped) return;
    Object.values(c.equipped).filter(Boolean).forEach((id) => equippedElsewhere.add(id));
  });
  const ownedFree = inventory.filter((id) => !equippedElsewhere.has(id) && !Object.values(cEquipped).includes(id));
  const inventoryHtml = `
    <div class="sheet-section">
      <h4>Wspólny plecak Gildii</h4>
      ${ownedFree.length === 0
        ? `<p class="sheet-empty-note">Brak wolnych przedmiotów — reszta jest już założona przez Ciebie lub innych towarzyszy.</p>`
        : ownedFree.map((id) => {
            const item = EQUIPMENT_ITEMS.find((i) => i.id === id);
            const upgradeLevel = equipmentUpgrades[id] || 0;
            return `
              <div class="sheet-item-row">
                <div class="sheet-item-info">
                  <div class="sheet-item-name">${item.icon} ${item.name}${upgradeLevel > 0 ? ` <span class="potion-count">+${upgradeLevel}</span>` : ""}</div>
                  <div class="sheet-item-desc">${item.description}</div>
                  ${formatItemWeapon(item)}
                  <div class="sheet-item-bonus">${formatScaledItemBonus(item, 1 + upgradeLevel * 0.25)}</div>
                </div>
                <button type="button" class="sheet-action-btn companion-equip-btn" data-item="${item.id}">Załóż</button>
              </div>
            `;
          }).join("")}
    </div>
  `;

  body.innerHTML = statsHtml + slotsHtml + inventoryHtml;

  body.querySelectorAll(".companion-unequip-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onUnequip(btn.dataset.slot));
  });
  body.querySelectorAll(".companion-equip-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onEquip(btn.dataset.item));
  });
}

function renderCityNpc(place, claimedNpcQuests, reputation, handlers) {
  const el = document.getElementById("city-place-npc");
  const npc = CITY_NPCS[place.key];
  if (!npc) {
    el.innerHTML = "";
    return;
  }

  const rep = (reputation && reputation[place.key]) || 0;
  const discountPct = Math.round(getReputationDiscount(place.key) * 100);
  const repLine = discountPct > 0
    ? `🤝 Reputacja: ${rep} (-${discountPct}% rabatu w tutejszym sklepie)`
    : `🤝 Reputacja: ${rep} (buduj ją zakupami i zleceniami, żeby odblokować rabat)`;

  const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
  const quest = npc.quest;
  const claimed = quest && claimedNpcQuests.includes(place.key);

  let questHtml = "";
  if (quest && !claimed) {
    const progress = Math.min(getNpcQuestProgress(quest), quest.goal);
    const pct = Math.round((progress / quest.goal) * 100);
    const complete = progress >= quest.goal;
    questHtml = `
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-desc">${quest.description}</div>
          <div class="quest-progress-track"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
          <div class="sheet-item-bonus">${progress}/${quest.goal}${quest.type === "resource" ? ` × ${quest.currency}` : ""}</div>
          <div class="sheet-item-cost">Nagroda: ${quest.reward.amount} × ${quest.reward.currency}</div>
        </div>
        <button type="button" class="sheet-action-btn claim-npc-quest-btn" ${complete ? "" : "disabled"}>Odbierz</button>
      </div>
    `;
  } else if (quest && claimed) {
    questHtml = `<p class="sheet-empty-note">Zlecenie wykonane — ${npc.name} nie ma dla Ciebie nic więcej.</p>`;
  }

  el.innerHTML = `
    <h4>${npc.icon} ${npc.name}</h4>
    <p class="sheet-item-desc recruit-scene-text">${line}</p>
    <button type="button" class="sheet-action-btn talk-npc-btn">💬 Zapytaj o coś</button>
    ${questHtml}
    <p class="reputation-line">${repLine}</p>
  `;

  el.querySelector(".talk-npc-btn").addEventListener("click", handlers.onTalkToNpc);
  const claimBtn = el.querySelector(".claim-npc-quest-btn");
  if (claimBtn) claimBtn.addEventListener("click", () => handlers.onClaimNpcQuest(place.key));
}

function renderCityPlace(place, state, handlers) {
  if (!place) return;
  const { inventory, resources, equipmentUpgrades, bonusStats, potionInventory, lastGambleResult, equipped, recruitPool, companions, corruption, devouredCount, mutationTier, claimedNpcQuests, reputation } = state;
  document.getElementById("city-place-title").textContent = `${place.icon} ${place.name}`;
  document.getElementById("city-place-description").textContent = place.description;

  renderCityNpc(place, claimedNpcQuests || [], reputation || {}, handlers);

  const recruit = (recruitPool || []).find((r) => r.locationKey === place.key);
  renderRecruitCard(
    recruit,
    recruit ? getRecruitProgress(recruit) : 0,
    companions ? companions.length < MAX_COMPANIONS : false,
    () => handlers.onRecruit(recruit.id)
  );

  const activityEl = document.getElementById("city-place-activity");

  if (place.key === "arena") {
    activityEl.innerHTML = `
      <h4>⚔️ Pojedynek treningowy</h4>
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-desc">Natychmiastowa walka z losowym przeciwnikiem, bez wyprawy i lochu. Nagroda mniejsza niż z prawdziwej wyprawy, ale zero ryzyka po drodze — i można wracać tu w kółko.</div>
          <div class="sheet-item-cost">Nagroda: ${ARENA_LOCATION.resource.icon} ${ARENA_LOCATION.resource.name} (${ARENA_LOCATION.resource.min}-${ARENA_LOCATION.resource.max}) + doświadczenie</div>
        </div>
        <button type="button" class="sheet-action-btn arena-fight-btn">Rozpocznij pojedynek</button>
      </div>
    `;
    activityEl.querySelector(".arena-fight-btn").addEventListener("click", handlers.onEnterArena);
  } else if (place.key === "czarny_rynek") {
    const sellableEquipment = inventory.filter((id) => !Object.values(equipped || {}).includes(id));
    const sellablePotions = POTION_ITEMS.filter((p) => potionInventory[p.id] > 0);

    const equipmentRows = sellableEquipment.map((id) => {
      const item = EQUIPMENT_ITEMS.find((i) => i.id === id);
      const refund = Math.ceil(item.cost.amount * 0.5);
      return `
        <div class="sheet-item-row">
          <div class="sheet-item-info">
            <div class="sheet-item-name">${item.icon} ${item.name}</div>
            <div class="sheet-item-cost">Zwrot: ${refund} × ${item.cost.currency}</div>
          </div>
          <button type="button" class="sheet-action-btn sell-equipment-btn" data-item="${item.id}">Sprzedaj</button>
        </div>
      `;
    }).join("");

    const potionRows = sellablePotions.map((potion) => {
      const refund = Math.ceil(potion.cost.amount * 0.5);
      return `
        <div class="sheet-item-row">
          <div class="sheet-item-info">
            <div class="sheet-item-name">${potion.icon} ${potion.name} <span class="potion-count">×${potionInventory[potion.id]}</span></div>
            <div class="sheet-item-cost">Zwrot: ${refund} × ${potion.cost.currency}</div>
          </div>
          <button type="button" class="sheet-action-btn sell-potion-btn" data-potion="${potion.id}">Sprzedaj</button>
        </div>
      `;
    }).join("");

    activityEl.innerHTML = `<h4>🏴 Skup towaru</h4>` +
      (equipmentRows === "" && potionRows === ""
        ? `<p class="sheet-empty-note">Nie masz niczego na sprzedaż — sprzedawane mogą być tylko przedmioty spoza ekwipunku założonego.</p>`
        : equipmentRows + potionRows);

    activityEl.querySelectorAll(".sell-equipment-btn").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onSellEquipment(btn.dataset.item));
    });
    activityEl.querySelectorAll(".sell-potion-btn").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onSellPotion(btn.dataset.potion));
    });
  } else if (place.key === "tawerna") {
    const ownedCurrencies = Object.entries(resources).filter(([, data]) => data.amount > 0);
    const resultHtml = lastGambleResult
      ? `<p class="sheet-item-bonus">${lastGambleResult.text}</p>`
      : "";

    activityEl.innerHTML = `<h4>🎲 Gra w kości (K20: 1-8 przegrana, 9-14 remis, 15-20 podwojenie)</h4>` +
      (ownedCurrencies.length === 0
        ? `<p class="sheet-empty-note">Nie masz żadnych surowców do postawienia.</p>`
        : ownedCurrencies.map(([name, data]) => `
            <div class="sheet-item-row">
              <div class="sheet-item-info">
                <div class="sheet-item-name">${data.icon} ${name} <span class="potion-count">masz: ${data.amount}</span></div>
              </div>
              <div class="tavern-bet-buttons">
                ${TAVERN_BET_SIZES.map((bet) => `<button type="button" class="sheet-action-btn gamble-btn" data-currency="${name}" data-bet="${bet}" ${data.amount >= bet ? "" : "disabled"}>Zakład: ${bet}</button>`).join("")}
              </div>
            </div>
          `).join("")) + resultHtml;

    activityEl.querySelectorAll(".gamble-btn").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onGamble(btn.dataset.currency, Number(btn.dataset.bet)));
    });
  } else if (place.key === "kuznia") {
    activityEl.innerHTML = `<h4>⚒️ Kuźnia ulepszeń</h4>` +
      (inventory.length === 0
        ? `<p class="sheet-empty-note">Nie masz jeszcze żadnego ekwipunku do ulepszenia.</p>`
        : inventory.map((itemId) => {
            const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
            const level = equipmentUpgrades[itemId] || 0;
            const maxed = level >= MAX_EQUIPMENT_UPGRADE;
            const cost = { currency: item.cost.currency, amount: item.cost.amount * (level + 1) };
            const owned = resources[cost.currency] ? resources[cost.currency].amount : 0;
            const affordable = owned >= cost.amount;
            const bonusText = maxed
              ? formatScaledItemBonus(item, 1 + level * 0.25)
              : `${formatScaledItemBonus(item, 1 + level * 0.25)} → ${formatScaledItemBonus(item, 1 + (level + 1) * 0.25)}`;
            return `
              <div class="sheet-item-row">
                <div class="sheet-item-info">
                  <div class="sheet-item-name">${item.icon} ${item.name} <span class="potion-count">+${level}${maxed ? " (max)" : ""}</span></div>
                  ${formatItemWeapon(item)}
                  <div class="sheet-item-bonus">${bonusText}</div>
                  ${maxed ? "" : `<div class="sheet-item-cost">Koszt ulepszenia: ${cost.amount} × ${cost.currency} (masz: ${owned})</div>`}
                </div>
                ${maxed
                  ? `<span class="sheet-empty-note">Maksymalny poziom</span>`
                  : `<button type="button" class="sheet-action-btn upgrade-btn" data-item="${item.id}" ${affordable ? "" : "disabled"}>Ulepsz</button>`}
              </div>
            `;
          }).join(""));

    activityEl.querySelectorAll(".upgrade-btn").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onUpgrade(btn.dataset.item));
    });
  } else if (place.key === "swiatynia") {
    const spent = Object.values(bonusStats).reduce((a, b) => a + b, 0);
    const owned = resources[RESPEC_COST.currency] ? resources[RESPEC_COST.currency].amount : 0;
    const affordable = owned >= RESPEC_COST.amount;
    const corruptionOwned = resources[CORRUPTION_CLEANSE_COST.currency] ? resources[CORRUPTION_CLEANSE_COST.currency].amount : 0;
    const corruptionAffordable = corruptionOwned >= CORRUPTION_CLEANSE_COST.amount;
    activityEl.innerHTML = `
      <h4>🕯️ Oczyszczenie Wspomnień</h4>
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-desc">Zakon zetrze z Twojego ciała ślad dotychczasowego treningu, zwracając wszystkie wydane punkty statystyk do ponownego rozdania w obozie (${spent} pkt obecnie wydanych).</div>
          <div class="sheet-item-cost">Koszt: ${RESPEC_COST.amount} × ${RESPEC_COST.currency} (masz: ${owned})</div>
        </div>
        <button type="button" class="sheet-action-btn respec-btn" ${spent > 0 && affordable ? "" : "disabled"}>Oczyść</button>
      </div>
      <h4>🧬 Oczyszczenie Spaczenia</h4>
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-desc">Kapłani wypalą z Twojego ciała nagromadzone spaczenie many, usuwając ryzyko obłędu — ale nie cofną mocy, którą już zdążyłeś dzięki niemu zdobyć (obecne spaczenie: ${corruption || 0}%).</div>
          <div class="sheet-item-cost">Koszt: ${CORRUPTION_CLEANSE_COST.amount} × ${CORRUPTION_CLEANSE_COST.currency} (masz: ${corruptionOwned})</div>
        </div>
        <button type="button" class="sheet-action-btn cleanse-corruption-btn" ${corruption > 0 && corruptionAffordable ? "" : "disabled"}>Oczyść</button>
      </div>
    `;
    activityEl.querySelector(".respec-btn").addEventListener("click", handlers.onRespec);
    activityEl.querySelector(".cleanse-corruption-btn").addEventListener("click", handlers.onCleanseCorruption);
  } else if (place.key === "kult_spaczenia") {
    const ritualOwned = resources[EMBRACE_RITUAL_COST.currency] ? resources[EMBRACE_RITUAL_COST.currency].amount : 0;
    const ritualAffordable = ritualOwned >= EMBRACE_RITUAL_COST.amount;
    activityEl.innerHTML = `
      <h4>🌀 Rytuał Wchłonięcia</h4>
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-desc">Kult złoży ofiarę z Twojej krwi esencji, przyspieszając to, co i tak w tobie już się zaczęło — spaczenie rośnie, ale mutacja robi się silniejsza na stałe, nawet po Oczyszczeniu w Świątyni (obecnie: ${corruption || 0}% spaczenia, tier ${mutationTier || 0}, pożarte szczątki: ${devouredCount || 0}).</div>
          <div class="sheet-item-cost">Koszt: ${EMBRACE_RITUAL_COST.amount} × ${EMBRACE_RITUAL_COST.currency} (masz: ${ritualOwned}) — +${EMBRACE_RITUAL_CORRUPTION_GAIN}% spaczenia</div>
        </div>
        <button type="button" class="sheet-action-btn embrace-ritual-btn" ${ritualAffordable ? "" : "disabled"}>Poddaj się rytuałowi</button>
      </div>
    `;
    activityEl.querySelector(".embrace-ritual-btn").addEventListener("click", handlers.onEmbraceRitual);
  } else {
    activityEl.innerHTML = "";
  }

  const shopEl = document.getElementById("city-place-shop");
  const items = EQUIPMENT_ITEMS.filter((item) => item.vendor === place.key);

  if (items.length === 0) {
    shopEl.innerHTML = "";
    return;
  }

  const notOwned = items.filter((item) => !inventory.includes(item.id));

  shopEl.innerHTML = `<h4>Towar na sprzedaż</h4>` +
    (notOwned.length === 0
      ? `<p class="sheet-empty-note">Wykupiono cały dostępny towar.</p>`
      : notOwned.map((item) => {
          const owned = resources[item.cost.currency] ? resources[item.cost.currency].amount : 0;
          const discountedCost = getDiscountedCost(item);
          const affordable = owned >= discountedCost;
          const discountPct = Math.round(getReputationDiscount(item.vendor) * 100);
          const costLine = discountPct > 0
            ? `Koszt: <s>${item.cost.amount}</s> ${discountedCost} × ${item.cost.currency} (masz: ${owned}) — rabat -${discountPct}%`
            : `Koszt: ${item.cost.amount} × ${item.cost.currency} (masz: ${owned})`;
          return `
            <div class="sheet-item-row">
              <div class="sheet-item-info">
                <div class="sheet-item-name">${item.icon} ${item.name}</div>
                <div class="sheet-item-desc">${item.description}</div>
                ${formatItemWeapon(item)}
                <div class="sheet-item-bonus">${formatItemBonus(item)}</div>
                <div class="sheet-item-cost">${costLine}</div>
              </div>
              <button type="button" class="sheet-action-btn buy-btn" data-item="${item.id}" ${affordable ? "" : "disabled"}>Kup</button>
            </div>
          `;
        }).join(""));

  shopEl.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => handlers.onBuy(btn.dataset.item));
  });
}

function renderCampaignBoard(chapters, completedChapterIds, currentChapter, onStart) {
  const body = document.getElementById("campaign-body");
  const allDone = completedChapterIds.length >= chapters.length;

  const banner = allDone
    ? `<p class="creation-hint">🏆 Kampania ukończona — zemsta na Dorianie Vex dopełniona. Możesz nadal grać dalej, wracając do zwykłych wypraw i Areny Krwi.</p>`
    : `<p class="creation-hint">Twoja osobista historia zemsty w Aetherionie. Każdy rozdział to unikalna walka z bossem — bez lochu po drodze.</p>`;

  const cards = chapters.map((chapter) => {
    const completed = completedChapterIds.includes(chapter.id);
    const isCurrent = !completed && currentChapter && currentChapter.id === chapter.id;
    const locked = !completed && !isCurrent;

    if (locked) {
      return `
        <div class="sheet-item-row">
          <div class="sheet-item-info">
            <div class="sheet-item-name codex-undiscovered">🔒 ${chapter.icon} ${chapter.title}</div>
            <div class="sheet-item-desc">Zablokowane — ukończ poprzedni rozdział, aby odblokować.</div>
          </div>
        </div>
      `;
    }

    const text = completed ? chapter.outro : chapter.intro;
    return `
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-name">${completed ? "✅ " : ""}${chapter.icon} ${chapter.title}</div>
          ${text.map((line) => `<div class="sheet-item-desc recruit-scene-text">${line}</div>`).join("")}
          ${completed
            ? `<div class="sheet-item-bonus">Otrzymano: ${chapter.reward.amount} × ${chapter.reward.currency}</div>`
            : `<div class="sheet-item-bonus">Nagroda: ${chapter.reward.amount} × ${chapter.reward.currency}</div>`}
        </div>
        ${isCurrent ? `<button type="button" class="sheet-action-btn start-campaign-btn" data-chapter="${chapter.id}">Rozpocznij rozdział</button>` : ""}
      </div>
    `;
  }).join("");

  body.innerHTML = banner + cards;

  body.querySelectorAll(".start-campaign-btn").forEach((btn) => {
    btn.addEventListener("click", () => onStart(btn.dataset.chapter));
  });
}

function renderQuestBoard(quests, progressState, claimedQuests, onClaim) {
  const body = document.getElementById("quest-board-body");
  body.innerHTML = quests.map((quest) => {
    const claimed = claimedQuests.includes(quest.id);
    const progress = Math.min(progressState[quest.progressKey], quest.goal);
    const complete = progress >= quest.goal;
    const pct = Math.round((progress / quest.goal) * 100);
    return `
      <div class="sheet-item-row">
        <div class="sheet-item-info">
          <div class="sheet-item-name">${quest.icon} ${quest.name}${claimed ? ` <span class="potion-count">Odebrano ✅</span>` : ""}</div>
          <div class="sheet-item-desc">${quest.description}</div>
          <div class="quest-progress-track"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
          <div class="sheet-item-bonus">${progress}/${quest.goal}</div>
          ${claimed ? "" : `<div class="sheet-item-cost">Nagroda: ${quest.reward.amount} × ${quest.reward.currency}</div>`}
        </div>
        ${claimed
          ? ""
          : `<button type="button" class="sheet-action-btn claim-quest-btn" data-quest="${quest.id}" ${complete ? "" : "disabled"}>Odbierz nagrodę</button>`}
      </div>
    `;
  }).join("");

  body.querySelectorAll(".claim-quest-btn").forEach((btn) => {
    btn.addEventListener("click", () => onClaim(btn.dataset.quest));
  });
}

let dungeonTokenElements = new Map();

function resetDungeonTokenLayer() {
  dungeonTokenElements = new Map();
  const svg = document.getElementById("dungeon-map-svg");
  const layer = svg && svg.querySelector("#dungeon-token-layer");
  if (layer) layer.innerHTML = "";
}

// Same two-pass technique as renderGrid (full hex-tile rebuild + identity-
// diffed token layer for smooth CSS-transition glide) but for the bigger,
// procedurally generated exploration map — see js/dungeonmap.js. Uses one
// uniform hex size throughout; "rooms" read as big open areas purely because
// they're a cluster of many hexes sharing the .hex-room class, not because
// any hex is drawn larger (see plan: mixing two hex sizes breaks axial math).
function renderDungeonMap({ mapData, playerHex, revealedKeys, activeInteraction, location, onHexClick, onChooseA, onChooseB, onDismiss }) {
  const svg = document.getElementById("dungeon-map-svg");
  const title = document.getElementById("dungeon-title");
  title.textContent = location ? `${location.icon} ${location.name} — wnętrze` : "🗺️ Wnętrze lokacji";

  if (!svg || !mapData) {
    renderDungeonInteractionOverlay(null, location, onChooseA, onChooseB, onDismiss);
    return;
  }

  const positions = mapData.hexes.map((h) => axialToPixel(h));
  const minX = Math.min(...positions.map((p) => p.x)) - HEX_SIZE;
  const minY = Math.min(...positions.map((p) => p.y)) - HEX_SIZE;
  const maxX = Math.max(...positions.map((p) => p.x)) + HEX_SIZE;
  const maxY = Math.max(...positions.map((p) => p.y)) + HEX_SIZE;
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  let hexLayer = svg.querySelector("#dungeon-hex-layer");
  if (!hexLayer) {
    hexLayer = svgEl("g", { id: "dungeon-hex-layer" });
    svg.appendChild(hexLayer);
  }
  hexLayer.innerHTML = "";

  let tokenLayer = svg.querySelector("#dungeon-token-layer");
  if (!tokenLayer) {
    tokenLayer = svgEl("g", { id: "dungeon-token-layer" });
    svg.appendChild(tokenLayer);
  }

  const revealedSet = revealedKeys instanceof Set ? revealedKeys : new Set(revealedKeys);

  for (const hex of mapData.hexes) {
    const revealed = revealedSet.has(hexKey(hex));
    const { x, y } = axialToPixel(hex);
    const corners = hexCorners(x, y).map((c) => `${c.x},${c.y}`).join(" ");

    const classes = ["hex-tile", hex.kind === "room" ? "hex-room" : "hex-corridor"];
    if (!revealed) classes.push("hex-fog");

    const poly = svgEl("polygon", { points: corners, class: classes.join(" ") });
    if (revealed) {
      poly.classList.add("hex-clickable");
      poly.addEventListener("click", () => onHexClick(hex));
    }
    hexLayer.appendChild(poly);

    if (!revealed) continue;

    const ambush = mapData.ambushHexes.find((a) => a.q === hex.q && a.r === hex.r);
    const prop = mapData.propHexes.find((p) => p.q === hex.q && p.r === hex.r);
    const isExit = hex.q === mapData.exitHex.q && hex.r === mapData.exitHex.r;
    const isEntrance = hex.q === mapData.entranceHex.q && hex.r === mapData.entranceHex.r;

    let iconText = null;
    let iconClass = "hex-prop-icon";
    if (ambush && !ambush.resolved) {
      iconText = ambush.isBossAmbush ? "❓" : "⚔️";
      iconClass = "hex-ambush-icon";
    } else if (prop && !prop.resolved) {
      iconText = findDungeonRoomType(prop.propType).icon;
    } else if (isExit) {
      iconText = "🚪";
    } else if (isEntrance) {
      iconText = "🏁";
    }

    if (iconText) {
      const icon = svgEl("text", { x, y: y + 8, class: iconClass, "text-anchor": "middle" });
      icon.textContent = iconText;
      icon.style.pointerEvents = "none";
      hexLayer.appendChild(icon);
    }
  }

  const { x, y } = axialToPixel(playerHex);
  let entry = dungeonTokenElements.get("player");
  if (!entry) {
    const circle = svgEl("circle", { cx: x, cy: y, r: HEX_SIZE * 0.5, class: "token token-player" });
    const label = svgEl("text", { x, y: y + 9, class: "token-label", "text-anchor": "middle" });
    label.textContent = player.icon;
    tokenLayer.appendChild(circle);
    tokenLayer.appendChild(label);
    entry = { circle, label };
    dungeonTokenElements.set("player", entry);
  }
  entry.circle.setAttribute("cx", x);
  entry.circle.setAttribute("cy", y);
  entry.label.setAttribute("x", x);
  entry.label.setAttribute("y", y + 9);

  renderDungeonInteractionOverlay(activeInteraction, location, onChooseA, onChooseB, onDismiss);
}

function renderDungeonInteractionOverlay(interaction, location, onChooseA, onChooseB, onDismiss) {
  const overlay = document.getElementById("dungeon-interaction-overlay");
  if (!overlay) return;

  if (!interaction) {
    overlay.classList.add("hidden");
    return;
  }
  overlay.classList.remove("hidden");

  const titleEl = document.getElementById("dungeon-interaction-title");
  const bodyEl = document.getElementById("dungeon-interaction-body");
  const choiceButtons = document.getElementById("dungeon-interaction-choice-buttons");
  const dismissBtn = document.getElementById("dungeon-interaction-dismiss-btn");
  const optionABtn = document.getElementById("dungeon-interaction-option-a-btn");
  const optionBBtn = document.getElementById("dungeon-interaction-option-b-btn");

  if (interaction.kind === "boss-ambush") {
    titleEl.textContent = "❓ Nieznana głębia";
    bodyEl.innerHTML = `<p class="dungeon-room-outcome">Wyczuwasz przytłaczającą obecność — to legowisko potężnego przeciwnika tej okolicy${location ? ` (${location.icon} ${location.name})` : ""}. Możesz go wyzwać już teraz, albo wycofać się w milczeniu.</p>`;
    choiceButtons.classList.remove("hidden");
    dismissBtn.classList.add("hidden");
    optionABtn.textContent = "⚔️ Wyzwij bossa";
    optionABtn.onclick = () => onChooseA();
    optionBBtn.textContent = "🚪 Wycofaj się w ciszy";
    optionBBtn.onclick = () => onChooseB();
    return;
  }

  const roomType = findDungeonRoomType(interaction.propType);
  titleEl.textContent = `${roomType.icon} ${roomType.label}`;
  bodyEl.innerHTML = `<p class="dungeon-room-outcome">${interaction.resolved ? interaction.outcomeText : roomType.prompt}</p>`;

  if (!interaction.resolved) {
    choiceButtons.classList.remove("hidden");
    dismissBtn.classList.add("hidden");
    optionABtn.textContent = roomType.optionALabel;
    optionABtn.onclick = () => onChooseA();
    optionBBtn.textContent = roomType.optionBLabel;
    optionBBtn.onclick = () => onChooseB();
  } else {
    choiceButtons.classList.add("hidden");
    dismissBtn.classList.remove("hidden");
    dismissBtn.onclick = () => onDismiss();
  }
}

function formatResourceBar(resources) {
  const entries = Object.entries(resources);
  return entries.length === 0
    ? `<span class="resource-empty">Brak zebranych zasobów — wyrusz na wyprawę.</span>`
    : entries.map(([name, data]) => `<span class="resource-chip">${data.icon} ${name}: <strong>${data.amount}</strong></span>`).join("");
}

document.querySelectorAll(".collapse-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".collapsible").classList.toggle("collapsed");
  });
});

const CODEX_TABS = [
  { key: "world", label: "Świat" },
  { key: "castes", label: "Kasty i frakcje" },
  { key: "hero", label: "Twoja historia" },
  { key: "classes", label: "Klasy" },
  { key: "bestiary", label: "Bestiariusz" },
];
let codexActiveTab = "world";

function renderCodexTabBody(tabKey) {
  if (tabKey === "world") {
    const w = LORE_DATA.world;
    return `<h3>${w.icon} ${w.title}</h3>` + w.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }
  if (tabKey === "castes") {
    const c = LORE_DATA.castes;
    return `<h3>${c.icon} ${c.title}</h3>` + c.entries.map((e) => `
      <div class="codex-entry">
        <h4>${e.icon} ${e.name}</h4>
        <p>${e.description}</p>
      </div>
    `).join("");
  }
  if (tabKey === "hero") {
    const h = LORE_DATA.hero;
    return `<h3>${h.icon} ${h.title}</h3>` + h.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }
  if (tabKey === "classes") {
    return CLASS_DATA.map((cls) => `
      <div class="codex-entry">
        <h4>${cls.icon} ${cls.name}</h4>
        ${cls.subclasses.map((sub) => `
          <div class="codex-subclass">
            <div class="codex-subclass-title">${sub.icon} ${sub.name}</div>
            <p>${LORE_DATA.classFlavor[sub.name] || ""}</p>
            <div class="codex-subclass-gear">Broń: ${sub.weapons.map((w) => w.name).join(", ")}</div>
            <div class="codex-subclass-gear">Umiejętności: ${sub.skills.map((s) => `${s.icon} ${s.name} (odnowienie: ${turnsLabel(s.cooldown)})`).join(" &nbsp;|&nbsp; ")}</div>
          </div>
        `).join("")}
      </div>
    `).join("");
  }
  if (tabKey === "bestiary") {
    return LOCATIONS.map((loc) => `
      <div class="codex-entry">
        <h4>${loc.icon} ${loc.name}</h4>
        ${loc.enemyKeys.map((key) => {
          if (!discoveredEnemies.includes(key)) {
            return `
              <div class="codex-subclass">
                <div class="codex-subclass-title codex-undiscovered">❓ Nieznany przeciwnik</div>
                <div class="codex-subclass-gear">Pokonaj tego przeciwnika w walce, aby odkryć jego dane.</div>
              </div>
            `;
          }
          const e = ENEMY_TEMPLATES[key]();
          return `
            <div class="codex-subclass">
              <div class="codex-subclass-title">${e.icon} ${e.name} ${e.mutated ? `<span class="mutated-tag" title="Można pożreć jego szczątki po pokonaniu w walce.">🧟 spaczony</span>` : ""}</div>
              <div class="codex-subclass-gear">
                HP: ${e.maxHP} &nbsp;|&nbsp; STR: ${e.str} &nbsp; WYT: ${e.wyt} &nbsp; ZRE: ${e.zre} &nbsp; INT: ${e.int} &nbsp; CHA: ${e.cha}
                &nbsp;|&nbsp; Pancerz: ${(e.pancerz * 100).toFixed(0)}% &nbsp; Przebicie: ${(e.przebicie * 100).toFixed(0)}%
              </div>
              <div class="codex-subclass-gear">Broń: ${e.weapons.map((w) => `${w.name} (${w.minDmg}-${w.maxDmg}, zas.${w.range})`).join(", ")}</div>
            </div>
          `;
        }).join("")}
        ${loc.bossKey ? (() => {
          if (!discoveredEnemies.includes(loc.bossKey)) {
            return `
              <div class="codex-subclass codex-boss-entry">
                <div class="codex-subclass-title codex-undiscovered">👑❓ Nieznany boss</div>
                <div class="codex-subclass-gear">Rzadka, groźna komnata bossa czasem pojawia się w trakcie przemierzania tej lokacji — pokonaj go, aby odkryć jego dane.</div>
              </div>
            `;
          }
          const b = BOSS_TEMPLATES[loc.bossKey]();
          return `
            <div class="codex-subclass codex-boss-entry">
              <div class="codex-subclass-title">👑 ${b.icon} ${b.name} ${b.mutated ? `<span class="mutated-tag" title="Można pożreć jego szczątki po pokonaniu w walce.">🧟 spaczony</span>` : ""}</div>
              <div class="codex-subclass-gear">
                HP: ${b.maxHP} &nbsp;|&nbsp; STR: ${b.str} &nbsp; WYT: ${b.wyt} &nbsp; ZRE: ${b.zre} &nbsp; INT: ${b.int} &nbsp; CHA: ${b.cha}
                &nbsp;|&nbsp; Pancerz: ${(b.pancerz * 100).toFixed(0)}% &nbsp; Przebicie: ${(b.przebicie * 100).toFixed(0)}%
              </div>
              <div class="codex-subclass-gear">Broń: ${b.weapons.map((w) => `${w.name} (${w.minDmg}-${w.maxDmg}, zas.${w.range})`).join(", ")}</div>
              <div class="codex-subclass-gear">Zdolność specjalna: ${b.special.icon} ${b.special.name} (co ${turnsLabel(b.special.cooldown)})</div>
            </div>
          `;
        })() : ""}
      </div>
    `).join("") + `<p class="creation-hint">Staty przeciwników rosną wraz z Twoim poziomem — powyżej pokazane są wartości bazowe. Pokonani przeciwnicy zostają odkryci na stałe.</p>`;
  }
  return "";
}

function renderCodex() {
  const tabsEl = document.getElementById("codex-tabs");
  const bodyEl = document.getElementById("codex-body");
  tabsEl.innerHTML = "";
  CODEX_TABS.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `codex-tab-btn${tab.key === codexActiveTab ? " selected" : ""}`;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => {
      codexActiveTab = tab.key;
      renderCodex();
    });
    tabsEl.appendChild(btn);
  });
  bodyEl.innerHTML = renderCodexTabBody(codexActiveTab);
}

function openCodex() {
  renderCodex();
  document.getElementById("codex-overlay").classList.remove("hidden");
}

function closeCodex() {
  document.getElementById("codex-overlay").classList.add("hidden");
}

document.getElementById("codex-btn").addEventListener("click", openCodex);
document.getElementById("codex-close").addEventListener("click", closeCodex);
document.getElementById("codex-overlay").addEventListener("click", (e) => {
  if (e.target.id === "codex-overlay") closeCodex();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCodex();
    closeTutorial();
  }
});

let tutorialActiveTab = "basics";

function renderTutorial() {
  const tabsEl = document.getElementById("tutorial-tabs");
  const bodyEl = document.getElementById("tutorial-body");
  tabsEl.innerHTML = "";
  TUTORIAL_TABS.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `codex-tab-btn${tab.key === tutorialActiveTab ? " selected" : ""}`;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => {
      tutorialActiveTab = tab.key;
      renderTutorial();
    });
    tabsEl.appendChild(btn);
  });
  const section = TUTORIAL_DATA[tutorialActiveTab];
  bodyEl.innerHTML = `<h3>${section.icon} ${section.title}</h3>` + section.paragraphs.map((p) => `<p>${p}</p>`).join("");
}

function openTutorial() {
  renderTutorial();
  document.getElementById("tutorial-overlay").classList.remove("hidden");
}

function closeTutorial() {
  document.getElementById("tutorial-overlay").classList.add("hidden");
}

document.getElementById("tutorial-btn-menu").addEventListener("click", openTutorial);
document.getElementById("tutorial-btn-camp").addEventListener("click", openTutorial);
document.getElementById("tutorial-close").addEventListener("click", closeTutorial);
document.getElementById("tutorial-overlay").addEventListener("click", (e) => {
  if (e.target.id === "tutorial-overlay") closeTutorial();
});
