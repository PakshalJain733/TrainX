import os
import re

files_with_check = [
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_Tickets.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_Profile.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_ManageUsers.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_Layout.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Mentor/Components/MN_Layout.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Mentor/Components/MN_Help.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Mentor/Components/MN_ProfilePage.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Mentor/Components/MN_Broadcast.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_CodingPlatform.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_Layout.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_SkillGaps.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_ProfilePage.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_Help.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_Attendance.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components/CO_Broadcast.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components/CO_Help.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Batches.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Help.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components/CO_ProfilePage.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Profile.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_PracticeProblems.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_LearningContent.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Layout.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Users.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components/CO_Layout.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_ApproveUsers.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/components/ui/FullNotificationModal.jsx',
  'c:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/components/ui/CustomSelect.jsx'
]

for f in files_with_check:
    with open(f, 'r', encoding='utf8') as file:
        content = file.read()
        
    lucide_match = re.search(r'import\s+{([^}]*)}\s+from\s+[\'"]lucide-react[\'"]', content, re.MULTILINE)
    
    if lucide_match:
        imports = lucide_match.group(1).replace('\n', ' ').split(',')
        imports = [i.strip() for i in imports if i.strip()]
        if 'Check' not in imports:
            print('Fixing missing Check in:', f)
            new_imports = imports + ['Check']
            new_import_str = 'import { ' + ', '.join(new_imports) + ' } from "lucide-react"'
            new_content = content[:lucide_match.start()] + new_import_str + content[lucide_match.end():]
            with open(f, 'w', encoding='utf8') as file:
                file.write(new_content)
