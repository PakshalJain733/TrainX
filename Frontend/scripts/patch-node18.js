import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeModulesDir = path.resolve(__dirname, "../node_modules");

function patchFile(filePath, searchPattern, replaceWith) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes(searchPattern)) {
      content = content.replace(searchPattern, replaceWith);
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`[patch-node18] Patched ${path.basename(filePath)}`);
    }
  }
}

// 1. Patch rolldown create-bundler-option
const rolldownDir = path.join(nodeModulesDir, "rolldown/dist/shared");
if (fs.existsSync(rolldownDir)) {
  for (const f of fs.readdirSync(rolldownDir)) {
    if (f.startsWith("create-bundler-option") && f.endsWith(".mjs")) {
      patchFile(
        path.join(rolldownDir, f),
        'import { formatWithOptions, styleText } from "node:util";',
        'import { formatWithOptions } from "node:util"; import * as _nodeUtil from "node:util"; const styleText = _nodeUtil.styleText || ((_, text) => text);'
      );
    }
  }
}

// 2. Patch eslint stylish reporter if present
const stylishFile = path.join(nodeModulesDir, "eslint/lib/cli-engine/formatters/stylish.js");
if (fs.existsSync(stylishFile)) {
  let content = fs.readFileSync(stylishFile, "utf8");
  if (content.includes("util.styleText(")) {
    content = content.replace(
      /util\.styleText\(/g,
      "(util.styleText || ((_, t) => t))("
    );
    fs.writeFileSync(stylishFile, content, "utf8");
    console.log("[patch-node18] Patched eslint stylish reporter");
  }
}

console.log("[patch-node18] Compatibility verification complete.");
