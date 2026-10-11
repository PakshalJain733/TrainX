const fs = require('fs');
const path = require('path');

const tailwindRegex = /\b(flex|grid|items-center|justify-between|space-y-\d+|bg-(slate|indigo|emerald|rose|amber|blue|gray|zinc|neutral|red)-\d+|text-(slate|indigo|emerald|rose|amber|blue|gray|zinc|neutral|red)-\d+|rounded-(sm|md|lg|xl|2xl|3xl|full)|border-(slate|indigo|emerald|rose|amber|gray)-\d+)\b/;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.jsx')) {
      results.push(full);
    }
  });
  return results;
}

const allFiles = walk('src');
const hits = {};

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('className=') && tailwindRegex.test(l)) {
      if (!hits[f]) hits[f] = [];
      hits[f].push({ line: idx + 1, code: l.trim() });
    }
  });
});

console.log('Total files with tailwind hits: ' + Object.keys(hits).length);
for (const [file, lines] of Object.entries(hits)) {
  console.log(`${file}: ${lines.length} occurrences`);
}
