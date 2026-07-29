let THREE = null;
let OrbitControls = null;
let loadPromise = null;

async function loadThree() {
  if (THREE) return;
  if (!loadPromise) {
    loadPromise = Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]).then(([threeModule, controlsModule]) => {
      THREE = threeModule;
      OrbitControls = controlsModule.OrbitControls;
    });
  }
  await loadPromise;
}

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let animationId = null;
let resizeHandlerBound = null;
let raycaster = null;

let hexMeshes = new Map();
let tokenMeshes = new Map();
let boardCenter = { x: 0, z: 0 };
let boardSpan = 0;
let latestArgs = null;
let mounted = false;

const TERRAIN_COLORS = { rock: 0x5a4a2c, tree: 0x235523, lake: 0x2d5f96 };
const GROUND_COLOR = 0x2f4a2f;
const REACHABLE_COLOR = 0x6d8f3c;
const DEPLOY_COLOR = 0x3c6d8f;
const PLAYER_COLOR = 0xc9a24b;
const ENEMY_COLOR = 0xa13f3f;

function tileHeight(hex) {
  if (!isObstacle(hex)) return 8;
  return obstacleType(hex) === "lake" ? 4 : 26;
}

function buildBoard() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x16131a);
  hexMeshes = new Map();
  tokenMeshes = new Map();

  const positions = ALL_HEXES.map((h) => axialToPixel(h));
  const minX = Math.min(...positions.map((p) => p.x));
  const maxX = Math.max(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxY = Math.max(...positions.map((p) => p.y));
  boardCenter = { x: (minX + maxX) / 2, z: (minY + maxY) / 2 };
  boardSpan = Math.max(maxX - minX, maxY - minY);

  const hexGeo = new THREE.CylinderGeometry(HEX_SIZE * 0.92, HEX_SIZE * 0.92, 1, 6);
  for (const hex of ALL_HEXES) {
    const { x, y } = axialToPixel(hex);
    const mat = new THREE.MeshStandardMaterial({ color: GROUND_COLOR, roughness: 0.85 });
    const mesh = new THREE.Mesh(hexGeo, mat);
    mesh.position.set(x - boardCenter.x, 0, y - boardCenter.z);
    mesh.userData.hex = hex;
    scene.add(mesh);
    hexMeshes.set(hexKey(hex), mesh);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
  dirLight.position.set(boardSpan * 0.6, boardSpan * 1.1, boardSpan * 0.4);
  scene.add(dirLight);

  camera = new THREE.PerspectiveCamera(50, 1, 1, boardSpan * 6);
  camera.position.set(0, boardSpan * 0.55, boardSpan * 0.62);
  camera.lookAt(0, 0, 0);
}

function hexWorldPosition(hex) {
  const { x, y } = axialToPixel(hex);
  return { x: x - boardCenter.x, z: y - boardCenter.z };
}

function syncState() {
  if (!latestArgs || !scene) return;
  const { player, enemies, reachableHexes, deployHexes } = latestArgs;
  const combatants = [player, ...enemies].filter((c) => c && c.pos && c.currentHP > 0);

  for (const hex of ALL_HEXES) {
    const mesh = hexMeshes.get(hexKey(hex));
    const height = tileHeight(hex);
    mesh.scale.y = height;
    mesh.position.y = height / 2;

    let color = GROUND_COLOR;
    const occupied = combatants.some((c) => hexEquals(c.pos, hex));
    if (isObstacle(hex)) {
      color = TERRAIN_COLORS[obstacleType(hex)];
    } else if (!occupied && reachableHexes.some((r) => hexEquals(r, hex))) {
      color = REACHABLE_COLOR;
    } else if (!occupied && deployHexes.some((d) => hexEquals(d, hex))) {
      color = DEPLOY_COLOR;
    }
    mesh.material.color.setHex(color);
  }

  const stillPresent = new Set();
  for (const combatant of combatants) {
    stillPresent.add(combatant);
    let mesh = tokenMeshes.get(combatant);
    if (!mesh) {
      const isPlayer = combatant === player;
      mesh = isPlayer
        ? new THREE.Mesh(
            new THREE.SphereGeometry(HEX_SIZE * 0.4, 16, 16),
            new THREE.MeshStandardMaterial({ color: PLAYER_COLOR }),
          )
        : new THREE.Mesh(
            new THREE.ConeGeometry(HEX_SIZE * 0.35, HEX_SIZE * 0.7, 8),
            new THREE.MeshStandardMaterial({ color: ENEMY_COLOR }),
          );
      scene.add(mesh);
      tokenMeshes.set(combatant, mesh);
    }
    const { x, z } = hexWorldPosition(combatant.pos);
    mesh.position.set(x, tileHeight(combatant.pos) + HEX_SIZE * 0.4, z);
  }

  for (const [combatant, mesh] of tokenMeshes) {
    if (stillPresent.has(combatant)) continue;
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    tokenMeshes.delete(combatant);
  }
}

function pickHex(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...hexMeshes.values()]);
  return hits.length > 0 ? hits[0].object.userData.hex : null;
}

function attachClickHandling(domElement) {
  let downX = 0;
  let downY = 0;
  domElement.addEventListener("pointerdown", (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });
  domElement.addEventListener("click", (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;
    const hex = pickHex(e);
    if (hex && latestArgs && latestArgs.onHexClick) latestArgs.onHexClick(hex);
  });
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
  controls.update();
  renderer.render(scene, camera);
}

async function mount(container) {
  await loadThree();
  if (mounted || !latestArgs) return;
  if (container.classList.contains("hidden")) return;

  container.innerHTML = "";
  buildBoard();
  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);
  resizeRendererToContainer(container);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.update();

  attachClickHandling(renderer.domElement);
  resizeHandlerBound = () => resizeRendererToContainer(container);
  window.addEventListener("resize", resizeHandlerBound);

  mounted = true;
  syncState();
  animate();
}

window.renderBoard3D = function renderBoard3D(args) {
  latestArgs = args;
  if (!mounted) {
    mount(args.container);
  } else {
    syncState();
  }
};

// Pozycja heksa na ekranie względem #fx-layer — dzięki temu efekty HTML
// (pociski, obrażenia, menu radialne) działają też w widoku 3D.
window.board3dHexToLayerXY = function board3dHexToLayerXY(hex) {
  if (!mounted || !renderer || !camera) return null;
  const fxLayer = document.getElementById("fx-layer");
  if (!fxLayer) return null;

  const { x, z } = hexWorldPosition(hex);
  const point = new THREE.Vector3(x, tileHeight(hex), z).project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  const layerRect = fxLayer.getBoundingClientRect();
  return {
    left: (point.x * 0.5 + 0.5) * rect.width + rect.left - layerRect.left,
    top: (-point.y * 0.5 + 0.5) * rect.height + rect.top - layerRect.top,
  };
};

window.stopBoard3D = function stopBoard3D() {
  latestArgs = null;
  if (!mounted) return;
  mounted = false;
  if (animationId !== null) cancelAnimationFrame(animationId);
  animationId = null;
  if (resizeHandlerBound) window.removeEventListener("resize", resizeHandlerBound);
  resizeHandlerBound = null;
  if (controls) {
    controls.dispose();
    controls = null;
  }
  for (const mesh of tokenMeshes.values()) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  tokenMeshes = new Map();
  for (const mesh of hexMeshes.values()) {
    mesh.material.dispose();
  }
  if (hexMeshes.size > 0) {
    const first = hexMeshes.values().next().value;
    first.geometry.dispose();
  }
  hexMeshes = new Map();
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    renderer = null;
  }
  scene = null;
  camera = null;
  raycaster = null;
};
