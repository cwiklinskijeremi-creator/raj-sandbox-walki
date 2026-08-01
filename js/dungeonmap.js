// Procedural dungeon exploration map: a graph of hex-cluster "rooms"
// connected by winding 1-hex-wide corridors. Deliberately uses a single,
// uniform hex size everywhere (see plan) — "rooms" read as big open areas
// purely because they're a blob of many contiguous hexes, not because the
// hexes themselves are drawn larger (mixing two hex sizes breaks axial
// adjacency math). Fully independent of js/grid.js's battle-board singleton
// (ALL_HEXES/isWithinMap) — reuses only its size-agnostic pure hex math
// (hexKey, hexEquals, hexDistance, hexNeighbors, hexLine, axialToPixel,
// hexCorners), since bfsReachable/floodFill/bfsPathAvoiding there are all
// hard-wired to the 15x11 battle board and don't apply here.

const DUNGEON_ROOM_COUNT_MIN = 8;
const DUNGEON_ROOM_COUNT_MAX = 12;
const DUNGEON_ROOM_HEX_MIN = 7;
const DUNGEON_ROOM_HEX_MAX = 14;
const DUNGEON_ROOM_SPACING = 5;
const DUNGEON_AMBUSH_COUNT_MIN = 2;
const DUNGEON_AMBUSH_COUNT_MAX = 3;
const DUNGEON_PROP_COUNT_MIN = 3;
const DUNGEON_PROP_COUNT_MAX = 5;
const DUNGEON_BONUS_POCKET_TARGET = 2;
const DUNGEON_FOG_REVEAL_RADIUS = 2;
const DUNGEON_HIDDEN_BOSS_CHANCE = 0.2;
const DUNGEON_PROP_TYPES = ["empty", "trap", "find", "shrine"];

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomHexWalk(start, steps) {
  let cur = start;
  for (let i = 0; i < steps; i++) {
    const dir = HEX_DIRECTIONS[Math.floor(Math.random() * HEX_DIRECTIONS.length)];
    cur = { q: cur.q + dir.q, r: cur.r + dir.r };
  }
  return cur;
}

function placeRoomCenters(roomCount) {
  const centers = [{ q: 0, r: 0 }];
  let guard = 0;
  while (centers.length < roomCount && guard < roomCount * 60) {
    guard++;
    const base = centers[Math.floor(Math.random() * centers.length)];
    const candidate = randomHexWalk(base, DUNGEON_ROOM_SPACING + Math.floor(Math.random() * 3));
    const farEnough = centers.every((c) => hexDistance(c, candidate) >= DUNGEON_ROOM_SPACING);
    if (farEnough) centers.push(candidate);
  }
  while (centers.length < 2) {
    centers.push(randomHexWalk(centers[0], DUNGEON_ROOM_SPACING));
  }
  return centers;
}

function growRoomCluster(center, targetSize, claimedKeys) {
  const cluster = [center];
  claimedKeys.add(hexKey(center));
  let guard = 0;
  while (cluster.length < targetSize && guard < targetSize * 20) {
    guard++;
    const base = cluster[Math.floor(Math.random() * cluster.length)];
    const neighbors = hexNeighbors(base).filter((n) => !claimedKeys.has(hexKey(n)));
    if (neighbors.length === 0) continue;
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    cluster.push(next);
    claimedKeys.add(hexKey(next));
  }
  return cluster;
}

function buildRoomGraph(centers) {
  const n = centers.length;
  const inTree = new Array(n).fill(false);
  inTree[0] = true;
  const edges = [];
  while (edges.length < n - 1) {
    let best = null;
    for (let i = 0; i < n; i++) {
      if (!inTree[i]) continue;
      for (let j = 0; j < n; j++) {
        if (inTree[j]) continue;
        const d = hexDistance(centers[i], centers[j]);
        if (!best || d < best.d) best = { i, j, d };
      }
    }
    if (!best) break;
    inTree[best.j] = true;
    edges.push([best.i, best.j]);
  }
  const extraCount = Math.max(1, Math.floor(n * 0.25));
  for (let k = 0; k < extraCount; k++) {
    const i = Math.floor(Math.random() * n);
    let bestJ = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const already = edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
      if (already) continue;
      const d = hexDistance(centers[i], centers[j]);
      if (d < bestD) { bestD = d; bestJ = j; }
    }
    if (bestJ !== -1) edges.push([i, bestJ]);
  }
  return edges;
}

function carveCorridor(start, end, roomClaimedKeys) {
  let current = start;
  const path = [current];
  const visited = new Set([hexKey(current)]);
  let guard = 0;
  const maxSteps = hexDistance(start, end) * 3 + 20;
  while (!hexEquals(current, end) && guard < maxSteps) {
    guard++;
    const neighbors = hexNeighbors(current).filter((n) => {
      const key = hexKey(n);
      if (visited.has(key)) return false;
      if (roomClaimedKeys.has(key) && !hexEquals(n, end)) return false;
      return true;
    });
    if (neighbors.length === 0) break;
    let next;
    if (Math.random() < 0.7) {
      next = neighbors.reduce((best, n) => (hexDistance(n, end) < hexDistance(best, end) ? n : best), neighbors[0]);
    } else {
      next = neighbors[Math.floor(Math.random() * neighbors.length)];
    }
    current = next;
    visited.add(hexKey(current));
    path.push(current);
  }
  if (!hexEquals(current, end)) return hexLine(start, end);
  return path;
}

function bfsFarthestRoom(adjacency, startId) {
  const dist = new Map([[startId, 0]]);
  const queue = [startId];
  let qi = 0;
  let farthest = startId;
  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const next of adjacency.get(cur)) {
      if (dist.has(next)) continue;
      dist.set(next, dist.get(cur) + 1);
      queue.push(next);
      if (dist.get(next) > dist.get(farthest)) farthest = next;
    }
  }
  return farthest;
}

function generateDungeonMap(location) {
  const roomTargetCount = DUNGEON_ROOM_COUNT_MIN
    + Math.floor(Math.random() * (DUNGEON_ROOM_COUNT_MAX - DUNGEON_ROOM_COUNT_MIN + 1));
  const centers = placeRoomCenters(roomTargetCount);
  const claimedKeys = new Set();
  const hexMap = new Map();
  const rooms = centers.map((center, id) => ({ id, kind: "content", centerHex: center }));

  centers.forEach((center, roomId) => {
    const targetSize = DUNGEON_ROOM_HEX_MIN
      + Math.floor(Math.random() * (DUNGEON_ROOM_HEX_MAX - DUNGEON_ROOM_HEX_MIN + 1));
    const cluster = growRoomCluster(center, targetSize, claimedKeys);
    for (const hex of cluster) {
      hexMap.set(hexKey(hex), { q: hex.q, r: hex.r, kind: "room", roomId });
    }
  });

  const roomEdges = buildRoomGraph(centers);
  const adjacency = new Map(centers.map((_, id) => [id, []]));
  for (const [i, j] of roomEdges) {
    adjacency.get(i).push(j);
    adjacency.get(j).push(i);
  }

  for (const [i, j] of roomEdges) {
    const clusterI = [...hexMap.values()].filter((h) => h.roomId === i);
    const clusterJ = [...hexMap.values()].filter((h) => h.roomId === j);
    const startHex = clusterI.reduce(
      (best, h) => (hexDistance(h, centers[j]) < hexDistance(best, centers[j]) ? h : best),
      clusterI[0],
    );
    const endHex = clusterJ.reduce(
      (best, h) => (hexDistance(h, centers[i]) < hexDistance(best, centers[i]) ? h : best),
      clusterJ[0],
    );
    const path = carveCorridor(startHex, endHex, claimedKeys);
    for (const hex of path) {
      const key = hexKey(hex);
      if (!hexMap.has(key)) hexMap.set(key, { q: hex.q, r: hex.r, kind: "corridor", roomId: null });
    }
  }

  const entranceRoomId = bfsFarthestRoom(adjacency, 0);
  const exitRoomId = bfsFarthestRoom(adjacency, entranceRoomId);

  const leafCandidates = [];
  adjacency.forEach((neighbors, id) => {
    if (id !== entranceRoomId && id !== exitRoomId && neighbors.length === 1) leafCandidates.push(id);
  });
  shuffleArray(leafCandidates);
  const bonusRoomIds = leafCandidates.slice(0, DUNGEON_BONUS_POCKET_TARGET);

  rooms.forEach((room) => {
    if (room.id === entranceRoomId) room.kind = "entrance";
    else if (room.id === exitRoomId) room.kind = "exit";
    else if (bonusRoomIds.includes(room.id)) room.kind = "bonus";
  });

  const hexes = [...hexMap.values()];
  const entranceHex = { q: centers[entranceRoomId].q, r: centers[entranceRoomId].r };
  const exitHex = { q: centers[exitRoomId].q, r: centers[exitRoomId].r };

  const candidateHexes = shuffleArray(
    hexes.filter((h) => h.roomId !== entranceRoomId && h.roomId !== exitRoomId),
  );

  const ambushCount = Math.min(
    candidateHexes.length,
    DUNGEON_AMBUSH_COUNT_MIN + Math.floor(Math.random() * (DUNGEON_AMBUSH_COUNT_MAX - DUNGEON_AMBUSH_COUNT_MIN + 1)),
  );
  const propCount = Math.min(
    candidateHexes.length - ambushCount,
    DUNGEON_PROP_COUNT_MIN + Math.floor(Math.random() * (DUNGEON_PROP_COUNT_MAX - DUNGEON_PROP_COUNT_MIN + 1)),
  );

  const ambushHexes = candidateHexes.slice(0, ambushCount).map((h) => ({
    q: h.q, r: h.r, resolved: false, isBossAmbush: false,
  }));
  const propHexes = candidateHexes.slice(ambushCount, ambushCount + propCount).map((h) => ({
    q: h.q, r: h.r, resolved: false,
    propType: DUNGEON_PROP_TYPES[Math.floor(Math.random() * DUNGEON_PROP_TYPES.length)],
  }));

  if (location && location.bossKey && ambushHexes.length > 0 && Math.random() < DUNGEON_HIDDEN_BOSS_CHANCE) {
    const bonusAmbush = ambushHexes.find((a) => {
      const h = hexMap.get(hexKey(a));
      return h && bonusRoomIds.includes(h.roomId);
    });
    (bonusAmbush || ambushHexes[Math.floor(Math.random() * ambushHexes.length)]).isBossAmbush = true;
  }

  return { hexes, rooms, entranceHex, exitHex, ambushHexes, propHexes };
}

function dungeonBfsShortestPath(mapData, start, target) {
  const keySet = new Set(mapData.hexes.map(hexKey));
  const startKey = hexKey(start);
  const targetKey = hexKey(target);
  if (!keySet.has(startKey) || !keySet.has(targetKey)) return null;
  if (startKey === targetKey) return [start];

  const visited = new Set([startKey]);
  const cameFrom = new Map();
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const current = queue[qi++];
    if (hexKey(current) === targetKey) break;
    for (const neighbor of hexNeighbors(current)) {
      const key = hexKey(neighbor);
      if (!keySet.has(key) || visited.has(key)) continue;
      visited.add(key);
      cameFrom.set(key, current);
      queue.push(neighbor);
    }
  }
  if (!visited.has(targetKey)) return null;

  const path = [target];
  let curKey = targetKey;
  while (curKey !== startKey) {
    const prev = cameFrom.get(curKey);
    path.push(prev);
    curKey = hexKey(prev);
  }
  path.reverse();
  return path;
}

function dungeonRevealRadius(mapData, hex, radius) {
  const keySet = new Set(mapData.hexes.map(hexKey));
  const visited = new Set([hexKey(hex)]);
  let frontier = [hex];
  const result = [hex];
  for (let step = 0; step < radius; step++) {
    const next = [];
    for (const h of frontier) {
      for (const n of hexNeighbors(h)) {
        const key = hexKey(n);
        if (visited.has(key) || !keySet.has(key)) continue;
        visited.add(key);
        result.push(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return result;
}

function isDungeonMapHex(mapData, hex) {
  return mapData.hexes.some((h) => h.q === hex.q && h.r === hex.r);
}

function findDungeonHex(mapData, hex) {
  return mapData.hexes.find((h) => h.q === hex.q && h.r === hex.r) || null;
}
