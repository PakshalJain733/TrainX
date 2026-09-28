const fs = require('fs');
const path = 'C:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_ManageUsers.jsx';
let content = fs.readFileSync(path, 'utf8');

const stateBlock = `  // Generate Code Form State
  const [codeRole, setCodeRole] = useState('admins');
  const [codeCollege, setCodeCollege] = useState('PVPPCOE Mumbai');
  const [codeAdminName, setCodeAdminName] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('24 Hours');
  const [codeMaxUses, setCodeMaxUses] = useState('1');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generatedCodesList, setGeneratedCodesList] = useState([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);`;

// Wait, the newlines might be \r\n in the file, so replacing with literal string might fail. 
// I'll use regex.
const regex = /  \/\/ Generate Code Form State[\s\S]*?const \[isGeneratingCode, setIsGeneratingCode\] = useState\(false\);/;
content = content.replace(regex, '');

const insertTarget = '  const [isAssignMentorOpen, setIsAssignMentorOpen] = useState(false);';
content = content.replace(insertTarget, insertTarget + '\n\n' + stateBlock);

fs.writeFileSync(path, content);
console.log('Moved state block');
