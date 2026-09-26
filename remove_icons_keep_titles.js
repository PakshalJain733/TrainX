const fs = require('fs');
const path = require('path');

function removeHeaderIconsCleanly(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let initial = content;

    // Pattern 1: <h2 className="...header-title...">\n  <Icon ... />\n  <span>Text</span>
    // Remove the icon tag while preserving the <span>Text</span>
    content = content.replace(/(<h2[^>]*className=["'][^"']*header-title[^"']*["'][^>]*>)\s*<[A-Z][a-zA-Z0-9]+\s+[^>]+\/>\s*(<span>)/g, '$1\n          $2');

    // Pattern 2: <div className="...header-title...">\n  <Icon ... />\n  <span>Text</span>
    content = content.replace(/(<div[^>]*className=["'][^"']*header-title[^"']*["'][^>]*>)\s*<[A-Z][a-zA-Z0-9]+\s+[^>]+\/>\s*(<span>)/g, '$1\n          $2');

    // Pattern 3: Icons with className ending in -header-icon
    content = content.replace(/<[A-Z][a-zA-Z0-9]+\s+className=["'][^"']*-header-icon["']\s*\/>\s*/g, '');

    if (content !== initial) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cleaned header icons in:', path.basename(filePath));
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            removeHeaderIconsCleanly(fullPath);
        }
    }
}

walkDir('c:/Users/paksh/Desktop/Training Portal/Frontend/src');
