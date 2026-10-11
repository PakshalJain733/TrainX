const fs = require('fs');

const file = process.argv[2] || 'src/pages/Student/Components/ST_AiRoadmap.jsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const twRegex = /\b(flex|inline-flex|grid|items-center|items-start|justify-between|justify-center|bg-[a-z]+-\d+|text-[a-z]+-\d+|text-(xs|sm|base|lg|xl|2xl)|rounded-(full|xl|lg|md|2xl)|p-\d+|px-\d+|py-\d+|gap-\d+|space-y-\d+|border-[a-z]+-\d+)\b/;

lines.forEach((l, idx) => {
  if (l.includes('className=') && twRegex.test(l)) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
