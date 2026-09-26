const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let initial = content;

    // 1. Cohort -> Batch
    content = content.replace(/Cohorts/g, 'Batches')
                     .replace(/cohorts/g, 'batches')
                     .replace(/Cohort/g, 'Batch')
                     .replace(/cohort/g, 'batch');

    // 2. Remove header icons securely (in JSX)
    if (filePath.endsWith('.jsx')) {
        // Find <Icon size={xx} style={{color: '...'}} />\n <span>...</span>
        content = content.replace(/<[A-Z][a-zA-Z0-9]+\s+size=\{[^\}]+\}\s+style=\{\{[^}]+\}\}\s*\/>\s*(<span>.*?<\/span>)/g, function(match, p1) { return p1; });
        
        // Find <Icon size={xx} color='...' />\n <span>...</span>
        content = content.replace(/<[A-Z][a-zA-Z0-9]+\s+size=\{[^\}]+\}\s+color=[^>]+\/>\s*(<span>.*?<\/span>)/g, function(match, p1) { return p1; });
        
        // Find <Icon className='...header-icon...' />
        content = content.replace(/<[A-Z][a-zA-Z0-9]+\s+className=\"[^\"]*header-icon[^\"]*\"\s*\/>/g, '');
        
        // Info Icon removal for Overview cards
        content = content.replace(/<Info size=\{15\} className=\"overview-info-icon\" \/>/g, '');
    }

    // 3. UI CSS changes
    if (filePath.endsWith('ui.css')) {
        content = content.replace(/\.overview-stat-trend-pill \{[\s\S]*?\}/, '.overview-stat-trend-pill {\n  font-size: 11.5px;\n  font-weight: 600;\n  color: #475569;\n  background: #f1f5f9;\n  padding: 2px 8px;\n  border-radius: 6px;\n}');
        content = content.replace(/\.page-title \{[\s\S]*?\}/, match => {
            return match.replace(/font-size: .*?;/, 'font-size: 2.25rem;').replace(/font-weight: .*?;/, 'font-weight: 800;');
        });
        content = content.replace(/\.section-title \{[\s\S]*?\}/, match => {
            return match.replace(/font-size: .*?;/, 'font-size: 1.5rem;').replace(/font-weight: .*?;/, 'font-weight: 700;');
        });
    }

    if (content !== initial) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed', filePath);
    }
}

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
        if (fs.statSync(fullPath).isDirectory()) {
            searchDir(fullPath);
        } else if (fullPath.match(/\.(js|jsx|css)$/)) {
            processFile(fullPath);
        }
    }
}

searchDir('c:/Users/paksh/Desktop/Training Portal/Frontend/src');
