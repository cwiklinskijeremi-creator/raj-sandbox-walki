// Kopiuje pliki three.js z node_modules do js/vendor/three/, żeby strona
// (GitHub Pages, bez bundlera) nie zależała od zewnętrznego CDN.
// Po zmianie wersji three w package.json uruchom: npm install && npm run vendor:three
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "three");
const dest = join(root, "js", "vendor", "three");

const files = [
  ["build/three.module.js", "three.module.js"],
  ["examples/jsm/controls/OrbitControls.js", "addons/controls/OrbitControls.js"],
];

for (const [from, to] of files) {
  const target = join(dest, to);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(src, from), target);
  console.log(`${from} -> js/vendor/three/${to}`);
}
