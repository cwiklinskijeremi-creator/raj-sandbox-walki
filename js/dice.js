const HIT_LOCATIONS = {
  1: { name: "Pudło", mult: 0 },
  2: { name: "Nogi", mult: 0.5 },
  3: { name: "Ręce", mult: 0.8 },
  4: { name: "Brzuch", mult: 1.0 },
  5: { name: "Klatka piersiowa", mult: 1.5 },
  6: { name: "Głowa", mult: 2.0 },
};

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function damageMultiplierD20(roll) {
  return roll * 0.1;
}

function rollWeaponDamage(weapon) {
  return Math.floor(Math.random() * (weapon.maxDmg - weapon.minDmg + 1)) + weapon.minDmg;
}
