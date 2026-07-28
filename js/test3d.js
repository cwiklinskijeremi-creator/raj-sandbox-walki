import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x16131a);

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
    const color = obstacle ? TERRAIN_COLORS[type] : GROUND_COLOR;
    const height = type === "lake" ? 4 : obstacle ? 26 : 8;
    const geo = new THREE.CylinderGeometry(HEX_SIZE * 0.92, HEX_SIZE * 0.92, height, 6);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = -Math.PI / 6;
    mesh.position.set(x - centerX, height / 2, y - centerZ);
    hexGroup.add(mesh);
  }
  scene.add(hexGroup);

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
  controls.update();
  renderer.render(scene, camera);
}

window.mountTest3D = function mountTest3D() {
  const container = document.getElementById("test3d-canvas-container");
  if (!container) return;
  container.innerHTML = "";

  if (!OBSTACLES || OBSTACLES.length === 0) {
    regenerateObstacles();
  }

  buildScene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
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
};
