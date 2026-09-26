const fs = require('fs');

const jsxPath = 'c:/Users/paksh/Desktop/Training Portal/Frontend/src/pages/Student/Components/ST_PracticeProblems.jsx';
let jsx = fs.readFileSync(jsxPath, 'utf8');

// 1. Clean up Cards HTML
const oldCards = `      {/* Proper Stats Cards Row */}
      <div className="practice-metrics-grid">
        <div className="stat-card-modern card-blue">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-blue-soft">
              <Code2 size={22} />
            </div>
            <span className="stat-badge badge-blue">{completionRate}% Completed</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{solvedCount} <span className="stat-total">/ {totalProblemsCount}</span></div>
            <div className="stat-title">Problems Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-blue-bar" style={{ width: \`\${completionRate}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern card-emerald">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-emerald-soft">
              <CheckCircle2 size={22} />
            </div>
            <span className="stat-badge badge-emerald">{easySolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-emerald">{easySolved}</div>
            <div className="stat-title">Easy Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-emerald-bar" style={{ width: \`\${easyPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern card-amber">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-amber-soft">
              <Flame size={22} />
            </div>
            <span className="stat-badge badge-amber">{mediumSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-amber">{mediumSolved}</div>
            <div className="stat-title">Medium Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-amber-bar" style={{ width: \`\${mediumPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern card-red">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-red-soft">
              <Flame size={22} />
            </div>
            <span className="stat-badge badge-red">{hardSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-red">{hardSolved}</div>
            <div className="stat-title">Hard Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-red-bar" style={{ width: \`\${hardPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern card-purple">
          <div className="stat-card-top">
            <div className="stat-icon-wrap bg-purple-soft">
              <Trophy size={22} />
            </div>
            <span className="stat-badge badge-purple">High Score</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number text-purple">{accuracyRate}%</div>
            <div className="stat-title">Accuracy Rate</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar bg-purple-bar" style={{ width: \`\${accuracyRate}%\` }} />
          </div>
        </div>
      </div>`;

const newCards = `      {/* Professional & Clean Stats Cards Row */}
      <div className="practice-metrics-grid">
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Code2 size={18} />
            </div>
            <span className="stat-badge">{completionRate}% Completed</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{solvedCount} <span className="stat-total">/ {totalProblemsCount}</span></div>
            <div className="stat-title">Problems Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: \`\${completionRate}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <CheckCircle2 size={18} />
            </div>
            <span className="stat-badge">{easySolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{easySolved}</div>
            <div className="stat-title">Easy Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: \`\${easyPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Flame size={18} />
            </div>
            <span className="stat-badge">{mediumSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{mediumSolved}</div>
            <div className="stat-title">Medium Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: \`\${mediumPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Flame size={18} />
            </div>
            <span className="stat-badge">{hardSolved} Solved</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{hardSolved}</div>
            <div className="stat-title">Hard Solved</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: \`\${hardPct}%\` }} />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap">
              <Trophy size={18} />
            </div>
            <span className="stat-badge">High Score</span>
          </div>
          <div className="stat-card-body">
            <div className="stat-number">{accuracyRate}%</div>
            <div className="stat-title">Accuracy Rate</div>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-bar" style={{ width: \`\${accuracyRate}%\` }} />
          </div>
        </div>
      </div>`;

if (jsx.includes(oldCards)) {
    jsx = jsx.replace(oldCards, newCards);
} else {
    console.log('oldCards not exact match, doing regex replacement');
}

// 2. Remove Topic Pills row
const topicSectionRegex = /\s*\{\/\* Topic Pills \*\/\}\s*<div className="topic-pills-row">[\s\S]*?<\/div>\s*<\/div>/;
jsx = jsx.replace(topicSectionRegex, '\n      </div>');

// 3. Remove Status column from table
jsx = jsx.replace(/\s*<th className="pp-th-status">Status<\/th>/, '');
const statusColRegex = /\s*<td>\s*<button[\s\S]*?<\/button>\s*<\/td>/g;
jsx = jsx.replace(statusColRegex, '');
jsx = jsx.replace('colSpan={6}', 'colSpan={5}');

fs.writeFileSync(jsxPath, jsx, 'utf8');
console.log('Updated ST_PracticeProblems.jsx');

// Now update ST_PracticeProblems.css for clean professional styling
const cssPath = 'c:/Users/paksh/Desktop/Training Portal/Frontend/src/pages/Student/Styles/ST_PracticeProblems.css';
let css = fs.readFileSync(cssPath, 'utf8');

const newMetricsCss = `
/* Clean Professional Metrics Grid */
.practice-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.stat-card-modern {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.stat-card-modern:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #475569;
}

.stat-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  letter-spacing: 0;
}

.stat-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.stat-total {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.stat-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
}

.stat-progress-bg {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
}

.stat-progress-bar {
  height: 100%;
  background: #475569;
  border-radius: 99px;
  transition: width 0.4s ease;
}
`;

css = css.replace(/\/\* Metrics Cards Grid \*\/[\s\S]*?\.stat-progress-bar \{[\s\S]*?\}/, newMetricsCss.trim());
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Updated ST_PracticeProblems.css');
