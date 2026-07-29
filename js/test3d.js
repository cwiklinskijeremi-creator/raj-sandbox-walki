let THREE = null;
let OrbitControls = null;

async function loadThree() {
  if (THREE) return;
  const [threeModule, controlsModule] = await Promise.all([
    import("three"),
    import("three/addons/controls/OrbitControls.js"),
  ]);
  THREE = threeModule;
  OrbitControls = controlsModule.OrbitControls;
}

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let animationId = null;
let resizeHandlerBound = null;

const TERRAIN_COLORS = { rock: 0x5a4a2c, tree: 0x235523, lake: 0x2d5f96 };
const GROUND_COLOR = 0x2f4a2f;
const PLAYER_COLOR = 0xc9a24b;
const ENEMY_COLOR = 0xa13f3f;
const TRUNK_COLOR = 0x5a3d24;
const CANOPY_COLORS = [0x1d4a1d, 0x2a5f26, 0x35702c];
const FOREST_FLOOR_COLOR = 0x1c331c;
const FOREST_BASE_HEIGHT = 10;
const ROCK_COLORS = [0x6e675c, 0x5f584e, 0x7b7468];
const SNOW_COLOR = 0xdfe7ee;
const MOUNTAIN_BASE_COLOR = 0x4f4638;
const WATER_DEEP_COLOR = 0x1e5080;
const WATER_SHALLOW_COLOR = 0x4795c8;
const FOAM_COLOR = 0xd9eef5;
const BASIN_COLOR = 0x1d3f5e;
const GROUND_PLATE_COLOR = 0x1b2818;

let waterSurfaces = [];

// Deterministyczny pseudo-losowy [0,1) na podstawie heksa — układ lasu
// jest stały między renderami zamiast losować się od nowa.
function hexRand(hex, salt) {
  let h = Math.imul(hex.q, 374761393) + Math.imul(hex.r, 668265263) + Math.imul(salt, 974634);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function makeTree(scale, canopyColor) {
  const tree = new THREE.Group();
  const trunkH = 7 * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6 * scale, 2.4 * scale, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: TRUNK_COLOR, roughness: 0.9 }),
  );
  trunk.position.y = trunkH / 2;
  tree.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.85 });
  const lowerH = 14 * scale;
  const lower = new THREE.Mesh(new THREE.ConeGeometry(8 * scale, lowerH, 7), canopyMat);
  lower.position.y = trunkH + lowerH / 2 - 2 * scale;
  tree.add(lower);
  const upperH = 10 * scale;
  const upper = new THREE.Mesh(new THREE.ConeGeometry(5.2 * scale, upperH, 7), canopyMat);
  upper.position.y = trunkH + lowerH + upperH / 2 - 7 * scale;
  tree.add(upper);
  return tree;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Gęsto triangulowana bryła wody w kształcie heksa. Wierzchołki spoza
// zarysu są ściągane radialnie na jego krawędź i opuszczane w dół — im
// dalej wystawały, tym niżej schodzą. Kolejne ściągnięte pierścienie
// siatki tworzą pionową "spódnicę" dokładnie na krawędzi heksa, więc
// tafla i ściany boczne to jedna ciągła bryła płynu, bez szczeliny.
// Kolory wierzchołków dają stylizowaną wodę: ciemny środek (głębia),
// jaśniejszy turkus przy brzegu (płycizna) i biała pianka na samej
// linii brzegowej. Zwraca też tablicę tłumienia fal per wierzchołek —
// krawędzie stoją niemal w miejscu, więc sąsiednie jeziora się nie
// rozjeżdżają na styku.
function buildWaterGeometry(r) {
  const inradius = r * Math.cos(Math.PI / 6);
  const geo = new THREE.PlaneGeometry(r * 2, r * 2, 64, 64);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const damp = new Float32Array(pos.count);
  const deep = new THREE.Color(WATER_DEEP_COLOR);
  const shallow = new THREE.Color(WATER_SHALLOW_COLOR);
  const foam = new THREE.Color(FOAM_COLOR);
  const mixed = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let worst = 0;
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k;
      const d = (x * Math.cos(a) + z * Math.sin(a)) / inradius;
      if (d > worst) worst = d;
    }
    // Wierzchołki w ostatniej komórce siatki przed zarysem też są rzutowane
    // radialnie na linię brzegową — bez tego krawędź tafli ząbkuje między
    // punktami kratki a zarysem heksa zamiast być jedną prostą linią.
    const SNAP = 0.045;
    if (worst > 1 - SNAP) {
      pos.setX(i, x / worst);
      pos.setZ(i, z / worst);
      const y = worst > 1 ? -Math.min(7, (worst - 1) * 25) : 0;
      pos.setY(i, y);
      // Spódnica: pianka przy linii wody przechodząca w głębię niżej.
      mixed.copy(foam).lerp(deep, Math.min(1, -y / 4));
      damp[i] = worst > 1 ? 0.25 : 0.2;
    } else {
      mixed.copy(deep).lerp(shallow, smoothstep(0.35, 0.92, worst));
      mixed.lerp(foam, smoothstep(0.87, 1, worst));
      damp[i] = 1 - 0.8 * smoothstep(0.7, 1, worst);
    }
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geo, damp };
}

// Heks jeziora: ciemne dno w zarysie heksa + falująca tafla zatopiona
// poniżej poziomu sąsiednich pól, dopasowana do orientacji kafelka.
function buildLakeHex(hex) {
  const group = new THREE.Group();

  // Dno nieco węższe niż tafla, żeby ściany dna nie walczyły o piksele
  // ze spódnicą wody opadającą dokładnie na krawędzi heksa.
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_SIZE * 0.96, HEX_SIZE * 0.96, 4, 6),
    new THREE.MeshStandardMaterial({ color: BASIN_COLOR, roughness: 1 }),
  );
  floor.position.y = 2;
  group.add(floor);

  // Tafla na pełnym promieniu heksa — sąsiednie jeziora stykają się bez
  // czarnej szczeliny, a spódnica zakrywa też rowek między kafelkami.
  const { geo, damp } = buildWaterGeometry(HEX_SIZE);
  const water = new THREE.Mesh(
    geo,
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      specular: 0x99ccee,
      shininess: 60,
      flatShading: true,
      emissive: 0x142a3c,
      transparent: true,
      opacity: 0.92,
    }),
  );
  water.position.y = 6.0;
  group.add(water);

  waterSurfaces.push({
    mesh: water,
    base: Float32Array.from(geo.attributes.position.array),
    damp,
    phase: hexRand(hex, 40) * Math.PI * 2,
  });

  return group;
}

// Postrzępiony stożek — sylwetka górskiego szczytu. Deformacja zależy
// wyłącznie od pozycji (x, z), więc jest ciągła na szwie geometrii.
// Śnieg nie jest osobną bryłą: kolory wierzchołków przechodzą ze skały
// w biel powyżej nieregularnej granicy śniegu, więc wygląda jak śnieg
// leżący na zboczach, bez widocznego szwu.
function jaggedConeGeometry(radius, height, seedA, seedB, rockColor, snowStartFrac) {
  const geo = new THREE.CylinderGeometry(radius * 0.07, radius, height, 9, 7);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const rockC = new THREE.Color(rockColor);
  const snowC = new THREE.Color(SNOW_COLOR);
  const mixed = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    const bump =
      Math.sin(x * 0.5 + seedA * 7) + Math.cos(z * 0.55 + seedB * 9) + Math.sin((x + z) * 0.28 + seedA * 4);
    const f = 1 + bump * 0.08;
    x *= f;
    z *= f;
    pos.setX(i, x);
    pos.setZ(i, z);
    pos.setY(i, y + Math.sin(x * 0.4 + z * 0.5 + seedB * 6) * height * 0.03);

    // Granica śniegu z kilku nałożonych częstotliwości — języki i łaty
    // zamiast równego cięcia.
    const h = y / height + 0.5;
    const snowLine =
      snowStartFrac +
      Math.sin(x * 0.35 + z * 0.3 + seedA * 5) * 0.06 +
      Math.sin(x * 0.9 - z * 0.8 + seedB * 11) * 0.05 +
      Math.sin((x + z) * 1.7 + seedA * 13) * 0.025;
    const blend = Math.min(1, Math.max(0, (h - snowLine) / 0.12));
    mixed.copy(rockC).lerp(snowC, blend);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

// Heks gór: kamienna podstawa, poszarpany główny szczyt ze śnieżną czapą,
// niższy szczyt boczny i głazy u podnóża — wszystko w zarysie heksa.
function buildMountainHex(hex) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_SIZE * 0.92, HEX_SIZE * 0.92, FOREST_BASE_HEIGHT, 6),
    new THREE.MeshStandardMaterial({ color: MOUNTAIN_BASE_COLOR, roughness: 0.95 }),
  );
  base.position.y = FOREST_BASE_HEIGHT / 2;
  group.add(base);

  const seedA = hexRand(hex, 50);
  const seedB = hexRand(hex, 51);
  const rockColor = ROCK_COLORS[Math.floor(hexRand(hex, 52) * ROCK_COLORS.length)];
  const peakMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.9, flatShading: true });

  const peakR = HEX_SIZE * 0.6;
  const peakH = 44 + hexRand(hex, 53) * 12;
  const snowStart = 0.58 + hexRand(hex, 58) * 0.08;
  const peak = new THREE.Mesh(jaggedConeGeometry(peakR, peakH, seedA, seedB, rockColor, snowStart), peakMat);
  const peakX = (hexRand(hex, 54) - 0.5) * HEX_SIZE * 0.1;
  const peakZ = (hexRand(hex, 55) - 0.5) * HEX_SIZE * 0.1;
  peak.position.set(peakX, FOREST_BASE_HEIGHT + peakH / 2, peakZ);
  group.add(peak);

  const sideAngle = hexRand(hex, 56) * Math.PI * 2;
  const sideR = HEX_SIZE * 0.3;
  const sideH = 18 + hexRand(hex, 57) * 8;
  // Granica śniegu na tej samej wysokości bezwzględnej co na głównym
  // szczycie — niższy szczyt boczny zwykle zostaje cały skalisty.
  const side = new THREE.Mesh(
    jaggedConeGeometry(sideR, sideH, seedB, seedA, rockColor, (snowStart * peakH) / sideH),
    peakMat,
  );
  side.position.set(
    Math.cos(sideAngle) * HEX_SIZE * 0.32,
    FOREST_BASE_HEIGHT + sideH / 2,
    Math.sin(sideAngle) * HEX_SIZE * 0.32,
  );
  group.add(side);

  for (let i = 0; i < 3; i++) {
    const angle = sideAngle + Math.PI * (0.5 + i * 0.35) + hexRand(hex, 60 + i) * 0.5;
    const dist = HEX_SIZE * (0.52 + hexRand(hex, 64 + i) * 0.1);
    const radius = HEX_SIZE * (0.1 + hexRand(hex, 70 + i) * 0.06);
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), rockMat);
    boulder.scale.y = 0.7 + hexRand(hex, 82 + i) * 0.3;
    boulder.rotation.set(hexRand(hex, 88 + i) * Math.PI, hexRand(hex, 94 + i) * Math.PI, 0);
    boulder.position.set(Math.cos(angle) * dist, FOREST_BASE_HEIGHT + radius * 0.4, Math.sin(angle) * dist);
    group.add(boulder);
  }

  return group;
}

// Heks lasu: płaska heksagonalna podstawa + pierścień drzew ustawionych
// w stronę sześciu narożników (lekko wsuniętych do środka) i drzewo centralne.
// Dzięki temu kępa czyta się jako las, ale zarys heksa pozostaje wyraźny.
function buildForestHex(hex) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_SIZE * 0.92, HEX_SIZE * 0.92, FOREST_BASE_HEIGHT, 6),
    new THREE.MeshStandardMaterial({ color: FOREST_FLOOR_COLOR, roughness: 0.95 }),
  );
  base.position.y = FOREST_BASE_HEIGHT / 2;
  group.add(base);

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30 + (hexRand(hex, i) - 0.5) * 16);
    const dist = HEX_SIZE * (0.5 + hexRand(hex, i + 6) * 0.1);
    const scale = 0.7 + hexRand(hex, i + 12) * 0.35;
    const tree = makeTree(scale, CANOPY_COLORS[Math.floor(hexRand(hex, i + 18) * CANOPY_COLORS.length)]);
    tree.position.set(Math.cos(angle) * dist, FOREST_BASE_HEIGHT, Math.sin(angle) * dist);
    tree.rotation.y = hexRand(hex, i + 24) * Math.PI * 2;
    group.add(tree);
  }

  const center = makeTree(1 + hexRand(hex, 30) * 0.25, CANOPY_COLORS[0]);
  center.position.set(
    (hexRand(hex, 31) - 0.5) * HEX_SIZE * 0.2,
    FOREST_BASE_HEIGHT,
    (hexRand(hex, 32) - 0.5) * HEX_SIZE * 0.2,
  );
  center.rotation.y = hexRand(hex, 33) * Math.PI * 2;
  group.add(center);

  return group;
}

function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x16131a);
  waterSurfaces = [];

  const positions = ALL_HEXES.map((h) => axialToPixel(h));
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y));
  const centerX = (minX + maxX) / 2;
  const centerZ = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY);

  const hexGroup = new THREE.Group();
  for (const hex of ALL_HEXES) {
    const { x, y } = axialToPixel(hex);
    const obstacle = isObstacle(hex);
    const type = obstacle ? obstacleType(hex) : null;
    const builders = { tree: buildForestHex, lake: buildLakeHex, rock: buildMountainHex };
    if (builders[type]) {
      const tile = builders[type](hex);
      tile.position.set(x - centerX, 0, y - centerZ);
      hexGroup.add(tile);
      continue;
    }
    // Delikatna losowa zmienność koloru i wysokości zwykłych pól — bez tego
    // plansza wygląda jak jednolita plastikowa wylewka.
    const height = obstacle ? 26 : 8 + (hexRand(hex, 1) - 0.5) * 2.4;
    const color = new THREE.Color(obstacle ? TERRAIN_COLORS[type] : GROUND_COLOR);
    if (!obstacle) color.offsetHSL((hexRand(hex, 2) - 0.5) * 0.02, (hexRand(hex, 3) - 0.5) * 0.1, (hexRand(hex, 4) - 0.5) * 0.05);
    const geo = new THREE.CylinderGeometry(HEX_SIZE * 0.92, HEX_SIZE * 0.92, height, 6);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x - centerX, height / 2, y - centerZ);
    hexGroup.add(mesh);
  }
  scene.add(hexGroup);

  // Płyta pod całą planszą — rowki między kafelkami pokazują ciemną
  // ziemię zamiast czarnej pustki tła sceny.
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(span * 0.85, span * 0.85, 4, 48),
    new THREE.MeshStandardMaterial({ color: GROUND_PLATE_COLOR, roughness: 1 }),
  );
  plate.position.y = -2.01;
  scene.add(plate);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
  dirLight.position.set(span * 0.6, span * 1.1, span * 0.4);
  scene.add(dirLight);

  const playerPos = getStartPositions().player;
  const { x: px, y: py } = axialToPixel(playerPos);
  const playerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(HEX_SIZE * 0.4, 16, 16),
    new THREE.MeshStandardMaterial({ color: PLAYER_COLOR }),
  );
  playerMesh.position.set(px - centerX, 26, py - centerZ);
  scene.add(playerMesh);

  const freeHexes = ALL_HEXES.filter((h) => !isObstacle(h) && hexDistance(h, playerPos) > 3);
  const enemyCount = Math.min(3, freeHexes.length);
  for (let i = 0; i < enemyCount; i++) {
    const idx = Math.floor(Math.random() * freeHexes.length);
    const enemyHex = freeHexes.splice(idx, 1)[0];
    const { x: ex, y: ey } = axialToPixel(enemyHex);
    const enemyMesh = new THREE.Mesh(
      new THREE.ConeGeometry(HEX_SIZE * 0.35, HEX_SIZE * 0.7, 8),
      new THREE.MeshStandardMaterial({ color: ENEMY_COLOR }),
    );
    enemyMesh.position.set(ex - centerX, 24, ey - centerZ);
    scene.add(enemyMesh);
  }

  camera = new THREE.PerspectiveCamera(50, 1, 1, span * 6);
  camera.position.set(0, span * 0.55, span * 0.62);
  camera.lookAt(0, 0, 0);
}

function resizeRendererToContainer(container) {
  const w = container.clientWidth || 1;
  const h = container.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const t = performance.now() * 0.0012;
  for (const w of waterSurfaces) {
    const pos = w.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = w.base[i * 3];
      const baseY = w.base[i * 3 + 1];
      const z = w.base[i * 3 + 2];
      const wave =
        Math.sin(t * 1.3 + w.phase + x * 0.16 + z * 0.11) * 0.8 +
        Math.sin(t * 2.1 + w.phase * 2 + z * 0.19 - x * 0.13) * 0.45;
      // Krawędzie i spódnica falują słabiej (patrz buildWaterGeometry).
      pos.setY(i, baseY + wave * w.damp[i]);
    }
    pos.needsUpdate = true;
    // Bez computeVertexNormals: flatShading liczy normalne ścian w shaderze,
    // dzięki czemu fasetki łapią światło i woda "błyszczy" po low-poly.
  }
  controls.update();
  renderer.render(scene, camera);
}

window.mountTest3D = async function mountTest3D() {
  const container = document.getElementById("test3d-canvas-container");
  if (!container) return;

  await loadThree();
  if (document.getElementById("test3d-screen").classList.contains("hidden")) return;

  container.innerHTML = "";

  if (!OBSTACLES || OBSTACLES.length === 0) {
    regenerateObstacles();
  }

  buildScene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  resizeRendererToContainer(container);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.update();

  resizeHandlerBound = () => resizeRendererToContainer(container);
  window.addEventListener("resize", resizeHandlerBound);
  animate();
};

window.stopTest3D = function stopTest3D() {
  if (animationId !== null) cancelAnimationFrame(animationId);
  animationId = null;
  if (resizeHandlerBound) window.removeEventListener("resize", resizeHandlerBound);
  resizeHandlerBound = null;
  if (controls) {
    controls.dispose();
    controls = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  scene = null;
  camera = null;
  waterSurfaces = [];
};
