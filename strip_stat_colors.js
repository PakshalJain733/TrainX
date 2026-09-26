const fs = require('fs');

const jsxPath = 'c:/Users/paksh/Desktop/Training Portal/Frontend/src/pages/Student/Components/ST_PracticeProblems.jsx';
let jsx = fs.readFileSync(jsxPath, 'utf8');

// Strip color classes from stat cards
jsx = jsx.replace(/className="stat-card-modern card-(blue|emerald|amber|red|purple)"/g, 'className="stat-card-modern"');
jsx = jsx.replace(/className="stat-icon-wrap bg-(blue|emerald|amber|red|purple)-soft"/g, 'className="stat-icon-wrap"');
jsx = jsx.replace(/className="stat-badge badge-(blue|emerald|amber|red|purple)"/g, 'className="stat-badge"');
jsx = jsx.replace(/className="stat-number text-(emerald|amber|red|purple)"/g, 'className="stat-number"');
jsx = jsx.replace(/className="stat-progress-bar bg-(blue|emerald|amber|red|purple)-bar"/g, 'className="stat-progress-bar"');

// Fix extra closing div if any
jsx = jsx.replace(/<\/div>\s*<\/div>\s*\{\/\* Problems List Table \*\/\}/, '</div>\n\n      {/* Problems List Table */}');

fs.writeFileSync(jsxPath, jsx, 'utf8');
console.log('Cleaned stat-card classes in ST_PracticeProblems.jsx');
