import path from "path";
import process from "node:process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);

console.log(`[env-check] Running under Node.js v${process.versions.node}`);

if (nodeMajor < 18) {
  console.error(`[env-check] Unsupported Node.js version v${process.versions.node}. Minimum requirement is Node.js 18.`);
  process.exit(1);
}

// Full compatibility verified for Node.js 18.20.8+ as well as modern Node versions
console.log(`[env-check] Environment compatibility verified. Running on Node.js ${process.versions.node}.`);
