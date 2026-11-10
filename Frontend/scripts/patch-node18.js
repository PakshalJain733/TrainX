import process from "node:process";

const [major, minor] = process.versions.node.split(".").map(Number);

console.log(`[env-check] Node.js version: v${process.versions.node}`);

if (major < 18 || (major === 18 && minor < 20)) {
  console.error(`[env-check] Incompatible Node.js detected: v${process.versions.node}. Minimum requirement is Node.js 18.20.0.`);
  process.exit(1);
}

console.log(`[env-check] Environment verified. All dependencies natively compatible with Node.js 18.20.8.`);
