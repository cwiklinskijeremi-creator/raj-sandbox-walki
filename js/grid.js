const MAP_COLS = 15;
const MAP_ROWS = 11;
const HEX_SIZE = 42;

const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function hexKey(hex) {
  return `${hex.q},${hex.r}`;
}

function hexFromKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

function hexEquals(a, b) {
  return a.q === b.q && a.r === b.r;
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

function hexNeighbors(hex) {
  return HEX_DIRECTIONS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

function hexDirectionIndex(from, to) {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  return HEX_DIRECTIONS.findIndex((d) => d.q === dq && d.r === dr);
}

function offsetToAxial(col, row) {
  const r = row + 1;
  return { q: col - Math.floor(r / 2), r };
}

const ALL_HEXES = [];
for (let row = 0; row < MAP_ROWS; row++) {
  const protrudesRight = row % 2 === 0;
  for (let col = 0; col < MAP_COLS; col++) {
    if (protrudesRight && col === MAP_COLS - 1) continue;
    ALL_HEXES.push(offsetToAxial(col, row));
  }
}
const ALL_HEXES_SET = new Set(ALL_HEXES.map(hexKey));

function isWithinMap(hex) {
  return ALL_HEXES_SET.has(hexKey(hex));
}

function getStartPositions() {
  return {
    player: offsetToAxial(1, 5),
  };
}

function hexColumn(hex) {
  return hex.q + Math.floor(hex.r / 2);
}

const DEPLOY_ZONE_COLS = 3;

function isPlayerDeployHex(hex) {
  return hexColumn(hex) < DEPLOY_ZONE_COLS;
}

function isEnemyDeployHex(hex) {
  return hexColumn(hex) >= MAP_COLS - DEPLOY_ZONE_COLS;
}

function hasAnyOpenNeighbor(hex) {
  return hexNeighbors(hex).some((n) => isWithinMap(n) && !isObstacle(n));
}

function floodFill(start, isBlocked) {
  const visited = new Set([hexKey(start)]);
  const stack = [start];
  const result = [start];
  while (stack.length) {
    const hex = stack.pop();
    for (const neighbor of hexNeighbors(hex)) {
      if (!isWithinMap(neighbor) || isBlocked(neighbor)) continue;
      const key = hexKey(neighbor);
      if (visited.has(key)) continue;
      visited.add(key);
      stack.push(neighbor);
      result.push(neighbor);
    }
  }
  return result;
}

function bfsPathAvoiding(startHexes, targetKeySet, freeKeySet, extraBlockedKeys) {
  const visited = new Set();
  const cameFrom = new Map();
  const queue = [];

  for (const hex of startHexes) {
    const key = hexKey(hex);
    if (extraBlockedKeys.has(key) || visited.has(key)) continue;
    visited.add(key);
    cameFrom.set(key, null);
    queue.push(hex);
  }

  let i = 0;
  while (i < queue.length) {
    const current = queue[i++];
    const currentKey = hexKey(current);
    if (targetKeySet.has(currentKey)) {
      const path = [];
      let k = currentKey;
      while (k !== null) {
        path.push(k);
        k = cameFrom.get(k);
      }
      return path;
    }
    for (const neighbor of hexNeighbors(current)) {
      const key = hexKey(neighbor);
      if (!freeKeySet.has(key) || extraBlockedKeys.has(key) || visited.has(key)) continue;
      visited.add(key);
      cameFrom.set(key, currentKey);
      queue.push(neighbor);
    }
  }
  return null;
}

function hasTwoDistinctPaths(freeHexes, playerZoneHexes, enemyZoneHexes) {
  const freeKeySet = new Set(freeHexes.map(hexKey));
  const targetKeySet = new Set(enemyZoneHexes.map(hexKey));
  const playerZoneKeySet = new Set(playerZoneHexes.map(hexKey));

  const path1 = bfsPathAvoiding(playerZoneHexes, targetKeySet, freeKeySet, new Set());
  if (!path1) return false;

  const blockedForPath2 = new Set(
    path1.filter((key) => !playerZoneKeySet.has(key) && !targetKeySet.has(key)),
  );
  const path2 = bfsPathAvoiding(playerZoneHexes, targetKeySet, freeKeySet, blockedForPath2);
  return !!path2;
}

const MIN_OBSTACLES = 3;
const MAX_OBSTACLES = 56;
const MIN_ZONE_FREE_HEXES = 5;

function generateObstacles() {
  const desiredCount = MIN_OBSTACLES + Math.floor(Math.random() * (MAX_OBSTACLES - MIN_OBSTACLES + 1));

  for (let backoff = 0; backoff <= desiredCount - MIN_OBSTACLES; backoff += 5) {
    const targetCount = desiredCount - backoff;
    for (let attempt = 0; attempt < 60; attempt++) {
      const obstacleSet = new Set();
      const obstacles = [];
      let stuckGuard = 0;
      while (obstacles.length < targetCount && stuckGuard < targetCount * 20) {
        stuckGuard++;
        let candidate;
        if (obstacles.length > 0 && Math.random() < 0.6) {
          const base = obstacles[Math.floor(Math.random() * obstacles.length)];
          const neighbors = hexNeighbors(base).filter(isWithinMap);
          if (neighbors.length === 0) continue;
          candidate = neighbors[Math.floor(Math.random() * neighbors.length)];
        } else {
          candidate = ALL_HEXES[Math.floor(Math.random() * ALL_HEXES.length)];
        }
        const key = hexKey(candidate);
        if (!obstacleSet.has(key)) {
          obstacleSet.add(key);
          obstacles.push(candidate);
        }
      }

      const isBlockedFn = (h) => obstacleSet.has(hexKey(h));
      const freeHexes = ALL_HEXES.filter((h) => !isBlockedFn(h));
      if (freeHexes.length === 0) continue;

      const filled = floodFill(freeHexes[0], isBlockedFn);
      if (filled.length !== freeHexes.length) continue;

      const playerZone = freeHexes.filter(isPlayerDeployHex);
      const enemyZone = freeHexes.filter(isEnemyDeployHex);
      if (playerZone.length < MIN_ZONE_FREE_HEXES || enemyZone.length < MIN_ZONE_FREE_HEXES) continue;

      if (!hasTwoDistinctPaths(freeHexes, playerZone, enemyZone)) continue;

      return obstacles;
    }
  }
  return [];
}

function findObstacleClusters(obstacles) {
  const obstacleKeySet = new Set(obstacles.map(hexKey));
  const visited = new Set();
  const clusters = [];

  for (const hex of obstacles) {
    const key = hexKey(hex);
    if (visited.has(key)) continue;
    visited.add(key);
    const cluster = [hex];
    const stack = [hex];
    while (stack.length) {
      const current = stack.pop();
      for (const neighbor of hexNeighbors(current)) {
        const nKey = hexKey(neighbor);
        if (!obstacleKeySet.has(nKey) || visited.has(nKey)) continue;
        visited.add(nKey);
        cluster.push(neighbor);
        stack.push(neighbor);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function assignObstacleTypes(obstacles, biasType = null) {
  const types = new Map();
  for (const cluster of findObstacleClusters(obstacles)) {
    let type;
    if (cluster.length === 1) {
      type = "rock";
    } else if (biasType && Math.random() < 0.7) {
      type = biasType;
    } else {
      type = Math.random() < 0.5 ? "tree" : "lake";
    }
    for (const hex of cluster) types.set(hexKey(hex), type);
  }
  return types;
}

let OBSTACLES = [];
let OBSTACLE_KEYS = new Set();
let OBSTACLE_TYPES = new Map();

function regenerateObstacles(biasType = null) {
  OBSTACLES = generateObstacles();
  OBSTACLE_KEYS = new Set(OBSTACLES.map(hexKey));
  OBSTACLE_TYPES = assignObstacleTypes(OBSTACLES, biasType);
}

function restoreObstacles(obstacles, typeEntries) {
  OBSTACLES = obstacles;
  OBSTACLE_KEYS = new Set(OBSTACLES.map(hexKey));
  OBSTACLE_TYPES = new Map(typeEntries);
}

function isObstacle(hex) {
  return OBSTACLE_KEYS.has(hexKey(hex));
}

function obstacleType(hex) {
  return OBSTACLE_TYPES.get(hexKey(hex)) || "rock";
}

function axialToCube(hex) {
  return { x: hex.q, z: hex.r, y: -hex.q - hex.r };
}

function cubeToAxial(cube) {
  return { q: cube.x, r: cube.z };
}

function cubeRound(cube) {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

function cubeLerp(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function hexLine(a, b) {
  const n = hexDistance(a, b);
  if (n === 0) return [a];

  const ac = axialToCube(a);
  const bc = axialToCube(b);
  const results = [];
  for (let i = 0; i <= n; i++) {
    const t = (1 / n) * i;
    results.push(cubeToAxial(cubeRound(cubeLerp(ac, bc, t))));
  }
  return results;
}

function bfsReachable(start, moveRange, isBlocked) {
  const visited = new Set([hexKey(start)]);
  let frontier = [start];
  const result = [];

  for (let step = 0; step < moveRange; step++) {
    const next = [];
    for (const hex of frontier) {
      for (const neighbor of hexNeighbors(hex)) {
        const key = hexKey(neighbor);
        if (visited.has(key)) continue;
        if (!isWithinMap(neighbor)) continue;
        if (isBlocked(neighbor)) continue;
        visited.add(key);
        result.push(neighbor);
        next.push(neighbor);
      }
    }
    frontier = next;
  }

  return result;
}

function axialToPixel(hex, size = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (hex.q + hex.r / 2);
  const y = size * 1.5 * hex.r;
  return { x, y };
}

function hexCorners(cx, cy, size = HEX_SIZE) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({ x: cx + size * Math.cos(angleRad), y: cy + size * Math.sin(angleRad) });
  }
  return corners;
}
