import os
import re

src_dir = r'c:\Users\Siri\CAMPUS-TRAINING-PORTAL\Frontend\src'

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the import from lucide-react
    match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'\"]lucide-react[\'\"]', content)
    if not match: return
    
    imports = [i.strip() for i in match.group(1).split(',')]
    
    seen = set()
    deduped = []
    for i in imports:
        if i == '': continue
        if i in seen: continue
        seen.add(i)
        deduped.append(i)
    
    if len(deduped) != len([i for i in imports if i]):
        new_import_str = 'import { ' + ', '.join(deduped) + ' } from "lucide-react"'
        content = content[:match.start()] + new_import_str + content[match.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed:', filepath)

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx'):
            fix_file(os.path.join(root, file))
