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
        ${fighter.isPlayer && fighter.weapons.length > 1 ? "<em>(kliknij swój token żeby zmienić)</em>" : ""} &nbsp;|&nbsp;
        Pancerz: ${(fighter.pancerz * 100).toFixed(0)}% &nbsp; Przebicie: ${(fighter.przebicie * 100).toFixed(0)}%
      </div>
      ${extraStatsLine}
    `;
  }

  el.innerHTML = `
    <strong>${fighter.name}</strong> ${dead ? "(martwy)" : ""}
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

function renderGrid({ svg, player, enemies, obstacles, reachableHexes = [], deployHexes = [], onHexClick }) {
  svg.innerHTML = "";

  const positions = ALL_HEXES.map((h) => axialToPixel(h));
  const minX = Math.min(...positions.map((p) => p.x)) - HEX_SIZE;
  const minY = Math.min(...positions.map((p) => p.y)) - HEX_SIZE;
  const maxX = Math.max(...positions.map((p) => p.x)) + HEX_SIZE;
  const maxY = Math.max(...positions.map((p) => p.y)) + HEX_SIZE;
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

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
    svg.appendChild(poly);

    if (obstacle) {
      const emoji = { rock: "🪨", tree: "🌳", lake: "🌊" }[type];
      const icon = svgEl("text", { x, y: y + 8, class: "obstacle-icon", "text-anchor": "middle" });
      icon.textContent = emoji;
      icon.style.pointerEvents = "none";
      svg.appendChild(icon);
    }
  }

  for (const combatant of allCombatants) {
    if (!combatant.pos || combatant.currentHP <= 0) continue;
    const { x, y } = axialToPixel(combatant.pos);
    const isPlayerToken = combatant === player;
    const circle = svgEl("circle", {
      cx: x, cy: y, r: HEX_SIZE * 0.5,
      class: `token ${isPlayerToken ? "token-player" : "token-enemy"}`,
    });
    svg.appendChild(circle);

    const label = svgEl("text", { x, y: y + 5, class: "token-label", "text-anchor": "middle" });
    label.textContent = isPlayerToken ? "Ty" : combatant.name.slice(0, 2);
    svg.appendChild(label);

    const rangeLabel = svgEl("text", { x, y: y + HEX_SIZE * 0.5 + 14, class: "token-range", "text-anchor": "middle" });
    rangeLabel.textContent = `zas.${combatant.weapon.range}`;
    svg.appendChild(rangeLabel);
  }
}

document.querySelectorAll(".collapse-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".collapsible").classList.toggle("collapsed");
  });
});
