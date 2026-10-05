const fs = require('fs'); 
const files = [
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
];
files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes('<Check ') && !c.includes('Check, ') && !c.includes('{ Check ') && !c.includes('{Check,') && !c.includes(', Check}')) {
       c = c.replace(/import\s+{([^}]+)}\s+from\s+["']lucide-react["']/, (m, p1) => {
          return m.replace(p1, 'Check, ' + p1);
       });
       fs.writeFileSync(f, c);
       console.log('Fixed', f);
    }
  } catch(e) {
    console.error(e);
  }
});
