const fs = require('fs');
const path = 'C:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_ManageUsers.jsx';
let content = fs.readFileSync(path, 'utf8');

// Insert state
const stateSearch = `  const [codeCollege, setCodeCollege] = useState('PVPPCOE Mumbai');`;
const stateReplace = `  const [codeCollege, setCodeCollege] = useState('PVPPCOE Mumbai');\n  const [codeAdminName, setCodeAdminName] = useState('');`;
content = content.replace(stateSearch, stateReplace);

// Update UI
const uiSearch = `              <div className="form-group-admin">
                <label>Assign Target Role *</label>
                <div className="form-input-admin" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', height: '42px', padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  Institutional Admin
                </div>
              </div>`;
const uiReplace = `              <div className="form-group-admin">
                <label>Admin Name *</label>
                <input 
                  type="text" 
                  value={codeAdminName} 
                  onChange={(e) => setCodeAdminName(e.target.value)} 
                  placeholder="Enter Admin Name" 
                  className="form-input-admin" 
                  style={{ height: '42px', padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%' }} 
                />
              </div>`;
content = content.replace(uiSearch, uiReplace);

// Update API call
const apiSearch = `            description: \`Generated for \${codeCollege} - Max Uses: \${codeMaxUses === '0' ? 'Unlimited' : codeMaxUses} 
- Expiry: \${codeExpiry}\`,`;
const apiReplace = `            description: \`Generated for \${codeAdminName || codeCollege} - Max Uses: \${codeMaxUses === '0' ? 'Unlimited' : codeMaxUses} - Expiry: \${codeExpiry}\`,`;
content = content.replace(apiSearch, apiReplace);

fs.writeFileSync(path, content);
console.log('done');
