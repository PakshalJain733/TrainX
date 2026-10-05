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
    try:
        with open(f, 'r', encoding='utf8') as file:
            content = file.read()
            
        if '<Check ' in content and 'import ' in content and 'lucide-react' in content:
            # Check if Check is in the lucide-react import
            if re.search(r'import\s+{[^}]*\bCheck\b[^}]*}\s+from\s+[\'"]lucide-react[\'"]', content):
                pass
            else:
                print('Fixing missing Check in:', f)
                # Replace the lucide-react import
                new_content = re.sub(
                    r'(import\s+{[^}]*)(\}\s+from\s+[\'"]lucide-react[\'"])',
                    r'\1, Check\2',
                    content
                )
                with open(f, 'w', encoding='utf8') as file:
                    file.write(new_content)
    except Exception as e:
        print('Error on', f, e)
