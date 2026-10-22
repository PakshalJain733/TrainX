import path from "path";
import process from "node:process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
const _nodeMinor = parseInt(process.versions.node.split(".")[1], 10);

console.log(`[patch-node18] Running under Node.js v${process.versions.node}`);

if (nodeMajor < 18) {
  console.error(`[patch-node18] Unsupported Node.js version v${process.versions.node}. Minimum requirement is Node.js 18.`);
  process.exit(1);
}

// Vite 5.4.21 natively supports Node.js ^18.0.0 || >=20.0.0 without monkey-patching node_modules.
console.log("[patch-node18] Environment compatibility verified. Vite 5.4.x runs natively on Node.js 18.");
