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

// 1. Patch rolldown for styleText
const rolldownDist = path.join(nodeModulesDir, "rolldown/dist");
if (fs.existsSync(rolldownDist)) {
  function walkRolldown(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walkRolldown(fullPath);
      } else if (item.name.endsWith(".mjs") || item.name.endsWith(".js")) {
        let content = fs.readFileSync(fullPath, "utf8");
        if (content.includes("styleText") && (content.includes('"node:util"') || content.includes("'node:util'"))) {
          const regex = /import\s*\{([^}]*)\bstyleText\b([^}]*)\}\s*from\s*["']node:util["'];?/;
          if (regex.test(content)) {
            content = content.replace(regex, (match, before, after) => {
              const remaining = `${before}${after}`.split(',').map(s => s.trim()).filter(Boolean).join(', ');
              return `import { ${remaining} } from "node:util"; import * as _nodeUtil from "node:util"; const styleText = _nodeUtil.styleText || ((_, text) => text);`;
            });
            fs.writeFileSync(fullPath, content, "utf8");
            console.log(`[patch-node18] Patched rolldown ${path.relative(rolldownDist, fullPath)} for styleText`);
          }
        }
      }
    }
  }
  walkRolldown(rolldownDist);
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

// 3. Patch vite for parseEnv (missing in Node 18)
const viteDir = path.join(nodeModulesDir, "vite/dist/node");
if (fs.existsSync(viteDir)) {
  function walkVite(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walkVite(fullPath);
      } else if (item.name.endsWith(".js") || item.name.endsWith(".mjs")) {
        let content = fs.readFileSync(fullPath, "utf8");
        if (content.includes("parseEnv") && (content.includes('"node:util"') || content.includes("'node:util'"))) {
          const regex = /import\s*\{([^}]*)\bparseEnv\b([^}]*)\}\s*from\s*["']node:util["'];?/;
          if (regex.test(content)) {
            content = content.replace(regex, (match, before, after) => {
              const remaining = `${before}${after}`.split(',').map(s => s.trim()).filter(Boolean).join(', ');
              return `import { ${remaining} } from "node:util"; import * as _nodeUtil from "node:util"; const parseEnv = _nodeUtil.parseEnv || function(c) { const r={}; if(!c) return r; for(const l of c.split(/\\r?\\n/)) { const t=l.trim(); if(!t || t.startsWith("#")) continue; const i=t.indexOf("="); if(i!==-1) { const k=t.slice(0,i).trim(); let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); r[k]=v; } } return r; };`;
            });
            fs.writeFileSync(fullPath, content, "utf8");
            console.log(`[patch-node18] Patched vite ${path.relative(viteDir, fullPath)} for parseEnv`);
          }
        }
      }
    }
  }
  walkVite(viteDir);
}

console.log("[patch-node18] Compatibility verification complete.");
