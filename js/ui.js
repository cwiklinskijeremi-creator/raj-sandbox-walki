function renderFighter(container, fighter, { selectable = false, selected = false, onClick = null, damagePreview = null } = {}) {
  const dead = fighter.currentHP <= 0;
  const el = document.createElement("div");
  el.className = "fighter";
  if (selectable && !dead) el.classList.add("selectable");
  if (selected) el.classList.add("selected");
  if (dead) el.classList.add("dead");

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
    const extraStatsLine = (fighter.zre || fighter.int || fighter.cha)
      ? `<div class="stats">ZRE: ${fighter.zre} (+${fighter.extraD20Rolls} rzut, +${fighter.extraActions} akcja, ruch ${fighter.moveRange}) &nbsp;|&nbsp;
          INT: ${fighter.int} (K6+${fighter.d6Bonus}, K20+${fighter.d20Bonus}) &nbsp;|&nbsp;
          CHA: ${fighter.cha} (wykładnik ^${fighter.charismaExponent})</div>`
      : `<div class="stats">Ruch: ${fighter.moveRange}</div>`;

    bodyHtml = `
      <div class="stats">
        HP: ${fighter.currentHP}/${fighter.maxHP} &nbsp;|&nbsp;
        STR: ${fighter.str} &nbsp; WYT: ${fighter.wyt} &nbsp;|&nbsp;
        Broń: ${fighter.weapons.map((w, i) => i === fighter.weaponIndex ? `<strong>${w.name} (${w.minDmg}-${w.maxDmg}, zas.${w.range})</strong>` : `${w.name} (${w.minDmg}-${w.maxDmg}, zas.${w.range})`).join(" / ")}
        ${fighter.isPlayer ? "<em>(kliknij swój token, żeby otworzyć menu)</em>" : ""} &nbsp;|&nbsp;
        Pancerz: ${(fighter.pancerz * 100).toFixed(0)}% &nbsp; Przebicie: ${(fighter.przebicie * 100).toFixed(0)}%
      </div>
      ${extraStatsLine}
    `;
  }

  const classLine = fighter.isPlayer && fighter.class
    ? `<div class="stats class-line">Klasa: ${fighter.class}${fighter.subclass ? " — " + fighter.subclass : ""}${fighter.gender ? " &nbsp;|&nbsp; Płeć: " + fighter.gender : ""}</div>`
    : "";

  el.innerHTML = `
    <strong>${fighter.name}</strong> ${dead ? "(martwy)" : ""}
    ${classLine}
    <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${hpPct}%"></div>${hpBarPreview}</div>
    ${bodyHtml}
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

function renderGrid({ svg, player, enemies, obstacles, reachableHexes = [], deployHexes = [], onHexClick }) {
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

  const allCombatants = [player, ...enemies];

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

    let entry = tokenElements.get(combatant);
    if (!entry) {
      const circle = svgEl("circle", {
        cx: x, cy: y, r: HEX_SIZE * 0.5,
        class: `token ${isPlayerToken ? "token-player" : "token-enemy"}`,
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
  const svg = document.getElementById("battle-map");
  const fxLayer = document.getElementById("fx-layer");
  const { x, y } = axialToPixel(hex);
  const screenPt = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
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
  const { playerName, playerGender, selectedClassName, selectedSubclassName, bonusStats } = state;

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
      <div class="codex-subclass-gear">Broń: ${selectedSub.weapons.map((w) => w.name).join(", ")} &nbsp;|&nbsp; Umiejętność: ${selectedSub.skill.name}</div>
    `;
  }

  const statsEl = document.getElementById("creation-stats");
  const spent = Object.values(bonusStats).reduce((a, b) => a + b, 0);
  const remaining = 10 - spent;
  if (!selectedSub) {
    statsEl.innerHTML = `<p class="creation-hint">Wybierz specjalizację, aby rozdzielić 10 punktów statystyk.</p>`;
  } else {
    const statMeta = [
      { key: "str", label: "STR" },
      { key: "wyt", label: "WYT" },
      { key: "zre", label: "ZRE" },
      { key: "int", label: "INT" },
      { key: "cha", label: "CHA" },
    ];
    statsEl.innerHTML = `<div class="creation-points-remaining">Pozostałe punkty: <strong>${remaining}</strong>/10</div>` +
      statMeta.map(({ key, label }) => `
        <div class="stat-row">
          <span class="stat-row-label">${label}</span>
          <span class="stat-row-value">${selectedSub[key] + bonusStats[key]}</span>
          <button type="button" class="stat-btn stat-minus" data-stat="${key}" ${bonusStats[key] <= 0 ? "disabled" : ""}>−</button>
          <button type="button" class="stat-btn stat-plus" data-stat="${key}" ${remaining <= 0 ? "disabled" : ""}>+</button>
        </div>
      `).join("");
    statsEl.querySelectorAll(".stat-minus").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onAdjustStat(btn.dataset.stat, -1));
    });
    statsEl.querySelectorAll(".stat-plus").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onAdjustStat(btn.dataset.stat, 1));
    });
  }

  const confirmBtn = document.getElementById("creation-confirm-btn");
  confirmBtn.disabled = !(playerName.trim().length > 0 && !!playerGender && !!selectedSub);
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
  const locText = loc ? `${loc.icon} ${loc.name}` : "nieznana lokacja";
  const when = new Date(activeRunData.savedAt).toLocaleString("pl-PL");
  infoEl.textContent = `Ostatni zapis: ${locText} — ${when}`;
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

function renderLocationBanner(location) {
  const banner = document.getElementById("current-location-banner");
  banner.innerHTML = location
    ? `<span class="location-banner-icon">${location.icon}</span> <span class="location-banner-name">${location.name}</span>`
    : "";
}

function renderResourceBar(resources) {
  const bar = document.getElementById("resource-bar");
  const entries = Object.entries(resources);
  bar.innerHTML = entries.length === 0
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
            <div class="codex-subclass-gear">Broń: ${sub.weapons.map((w) => w.name).join(", ")} &nbsp;|&nbsp; Umiejętność: ${sub.skill.name}</div>
          </div>
        `).join("")}
      </div>
    `).join("");
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
  if (e.key === "Escape") closeCodex();
});
