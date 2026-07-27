function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const FLANK_BONUS = 0.15;
const TREE_REDUCTION_PER_HEX = 0.10;
const TREE_REDUCTION_MAX = 0.50;
const ROCK_REDUCTION = 0.50;

function isFlanked(attacker, defender, allCombatants) {
  if (!attacker.pos || !defender.pos) return false;

  const dirToAttacker = hexDirectionIndex(defender.pos, attacker.pos);
  if (dirToAttacker === -1) return false;

  return allCombatants.some((ally) => {
    if (ally === attacker || ally === defender) return false;
    if (ally.currentHP <= 0 || !ally.pos) return false;
    if (ally.isPlayer !== attacker.isPlayer) return false;
    if (hexDistance(ally.pos, defender.pos) !== 1) return false;

    const dirToAlly = hexDirectionIndex(defender.pos, ally.pos);
    return dirToAlly !== -1 && (dirToAlly - dirToAttacker + 6) % 6 === 3;
  });
}

function computeCoverReduction(attacker, defender) {
  if (!attacker.pos || !defender.pos) return 0;
  if (hexDistance(attacker.pos, defender.pos) <= 1) return 0;

  const line = hexLine(attacker.pos, defender.pos).slice(1, -1);

  let treeReduction = 0;
  let rockReduction = 0;
  for (const hex of line) {
    if (!isObstacle(hex)) continue;
    const type = obstacleType(hex);
    if (type === "tree") treeReduction += TREE_REDUCTION_PER_HEX;
    else if (type === "rock") rockReduction += ROCK_REDUCTION;
    // lake: 0% reduction, shoots through with full effectiveness
  }
  treeReduction = Math.min(treeReduction, TREE_REDUCTION_MAX);

  return Math.min(1, treeReduction + rockReduction);
}

function estimateAverageDamage(attacker, defender, context = {}, samples = 300) {
  const dummy = { ...defender };
  let total = 0;
  for (let i = 0; i < samples; i++) {
    dummy.currentHP = defender.maxHP;
    const result = resolveAttack(attacker, dummy, context);
    total += result.damage;
  }
  return total / samples;
}

function resolveAttack(attacker, defender, context = {}) {
  const { allCombatants = [] } = context;

  const d6Raw = rollD6();
  const d6 = clamp(d6Raw + attacker.d6Bonus, 1, 6);
  const location = HIT_LOCATIONS[d6];

  const result = {
    attackerName: attacker.name,
    defenderName: defender.name,
    d6Raw,
    d6Bonus: attacker.d6Bonus,
    d6,
    locationName: location.name,
    hit: d6 !== 1,
  };

  if (!result.hit) {
    result.damage = 0;
    return result;
  }

  const d20Rolls = [rollD20()];
  for (let i = 0; i < attacker.extraD20Rolls; i++) d20Rolls.push(rollD20());
  const d20Best = Math.max(...d20Rolls);
  const d20 = clamp(d20Best + attacker.d20Bonus, 1, 20);
  const d20Mult = damageMultiplierD20(d20);

  const weaponRoll = rollWeaponDamage(attacker.weapon);

  const diff = attacker.str - defender.wyt;
  const spreadMult = diff > 0 ? 1 + 0.05 * diff : 1 + 0.025 * diff;

  const d6MultCha = Math.pow(location.mult, attacker.charismaExponent);
  const d20MultCha = Math.pow(d20Mult, attacker.charismaExponent);

  const flanked = isFlanked(attacker, defender, allCombatants);
  const coverReduction = computeCoverReduction(attacker, defender);

  const effectiveArmor = defender.pancerz * (1 - attacker.przebicie);
  let rawDamage = weaponRoll * d6MultCha * d20MultCha * spreadMult * (1 - effectiveArmor);
  if (flanked) rawDamage *= 1 + FLANK_BONUS;
  if (coverReduction > 0) rawDamage *= 1 - coverReduction;

  const damage = Math.max(0, Math.round(rawDamage));

  defender.currentHP = Math.max(0, defender.currentHP - damage);

  result.d20Rolls = d20Rolls;
  result.d20Bonus = attacker.d20Bonus;
  result.d20 = d20;
  result.d20Mult = d20Mult;
  result.charismaExponent = attacker.charismaExponent;
  result.d6MultCha = d6MultCha;
  result.d20MultCha = d20MultCha;
  result.weaponRoll = weaponRoll;
  result.diff = diff;
  result.spreadMult = spreadMult;
  result.effectiveArmor = effectiveArmor;
  result.flanked = flanked;
  result.coverReduction = coverReduction;
  result.damage = damage;
  result.defenderDied = defender.currentHP <= 0;

  return result;
}
