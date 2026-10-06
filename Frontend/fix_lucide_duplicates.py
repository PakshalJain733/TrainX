import os
import re

directory = r"C:\Users\Administrator\CAMPUS-TRAINING-PORTAL\Frontend\src"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\']', content)
            if match:
                imports = match.group(1)
                items = [x.strip() for x in imports.split(",")]
                items = [x for x in items if x]
                seen = set()
                new_items = []
                for item in items:
                    if item not in seen:
                        seen.add(item)
                        new_items.append(item)
                
                if len(items) != len(new_items):
                    new_imports_str = ", ".join(new_items)
                    new_import_line = f'import {{ {new_imports_str} }} from "lucide-react"'
                    new_content = content[:match.start()] + new_import_line + content[match.end():]
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Fixed {filepath}")
