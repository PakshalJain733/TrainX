const fs = require('fs');
const path = require('path');

const twPrefixes = [
  'bg-', 'text-', 'border-', 'rounded-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
  'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-', 'w-', 'h-', 'max-w-', 'min-w-', 'max-h-', 'min-h-',
  'gap-', 'space-x-', 'space-y-', 'grid-cols-', 'col-span-', 'row-span-',
  'hover:', 'focus:', 'dark:', 'sm:', 'md:', 'lg:', 'xl:', '2xl:',
  'z-', 'top-', 'bottom-', 'left-', 'right-', 'inset-', 'opacity-', 'shadow-'
];

const twExact = new Set([
  'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden', 'block', 'inline-block',
  'items-center', 'items-start', 'items-end', 'items-baseline', 'items-stretch',
  'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly',
  'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap', 'flex-1', 'shrink-0', 'grow',
  'relative', 'absolute', 'fixed', 'sticky',
  'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto',
  'truncate', 'cursor-pointer', 'select-none', 'transition', 'transition-all',
  'font-bold', 'font-semibold', 'font-medium', 'font-normal', 'font-extrabold',
  'text-center', 'text-left', 'text-right', 'uppercase', 'lowercase', 'capitalize'
]);

const customPrefixes = [
  'coord-', 'sa-', 'st-', 'mn-', 'ad-', 'perf-', 'attendance-', 'roadmap-', 'college-',
  'manageusers-', 'maintenancecontrols-', 'system-health-', 'batches-', 'overview-',
  'learning-', 'profile-', 'search-', 'filter-', 'table-', 'modal-', 'badge-', 'btn-',
  'cp-', 'monaco-', 'header-', 'sidebar-', 'dash-'
];

function isCustomClass(cls) {
  for (const cp of customPrefixes) {
    if (cls.startsWith(cp)) return true;
  }
  return false;
}

function isTailwindClass(cls) {
  if (isCustomClass(cls)) return false;
  if (twExact.has(cls)) return true;
  for (const p of twPrefixes) {
    if (cls.startsWith(p)) {
      if (p === 'text-' && /^(xs|sm|base|lg|xl|2xl|3xl|4xl|[a-z]+-\d+|white|black|transparent|current)/.test(cls.slice(5))) return true;
      if (p === 'bg-' && /^([a-z]+-\d+|white|black|transparent|current)/.test(cls.slice(3))) return true;
      if (p === 'border-' && /^([a-z]+-\d+|white|black|transparent|t|b|l|r|\d+)/.test(cls.slice(7))) return true;
      if (p === 'rounded-' && /^(none|sm|md|lg|xl|2xl|3xl|full)/.test(cls.slice(8))) return true;
      if (p === 'gap-' && /^\d+(\.\d+)?$/.test(cls.slice(4))) return true;
      if (['p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-', 'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-'].includes(p)) {
        if (/^\d+(\.\d+)?$/.test(cls.split('-')[1])) return true;
      }
      if (cls.startsWith('hover:') || cls.startsWith('focus:') || cls.startsWith('sm:') || cls.startsWith('md:') || cls.startsWith('lg:')) return true;
      if (p === 'space-y-' || p === 'space-x-' || p === 'grid-cols-') return true;
      if (p === 'w-' || p === 'h-') {
        if (/^(\d+|full|screen|auto|\d+\/\d+)$/.test(cls.slice(2))) return true;
      }
    }
  }
  return false;
}

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
const fileReport = {};

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /className\s*=\s*(?:["']([^"']*)["']|\{`([^`]*)`\})/g;
  let match;
  const twClasses = [];
  while ((match = regex.exec(content)) !== null) {
    const raw = match[1] || match[2] || '';
    const tokens = raw.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean);
    tokens.forEach(tok => {
      if (isTailwindClass(tok)) {
        twClasses.push(tok);
      }
    });
  }
  if (twClasses.length > 0) {
    fileReport[f] = twClasses.length;
  }
});

console.log('Files with real Tailwind tokens: ' + Object.keys(fileReport).length);
const sorted = Object.entries(fileReport).sort((a,b) => b[1] - a[1]);
sorted.forEach(([f, count]) => {
  console.log(`${f}: ${count} tailwind tokens`);
});
