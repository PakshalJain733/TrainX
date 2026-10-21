import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../node_modules/rolldown/dist/shared/create-bundler-option-wRiQzEJ3.mjs");

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");
  if (content.includes('import { formatWithOptions, styleText } from "node:util";')) {
    content = content.replace(
      'import { formatWithOptions, styleText } from "node:util";',
      'import { formatWithOptions } from "node:util"; import * as _nodeUtil from "node:util"; const styleText = _nodeUtil.styleText || ((_, text) => text);'
    );
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("[patch-node18] Successfully patched rolldown for Node.js 18 compatibility!");
  } else {
    console.log("[patch-node18] File already patched or styleText not present.");
  }
} else {
  console.log("[patch-node18] Target file not found, skipping.");
}
