const fs = require('fs');
const path = 'C:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_ManageUsers.jsx';
let content = fs.readFileSync(path, 'utf8');
const searchStr = `                <div className="form-group-admin">
                  <label>Assign Target Role *</label>
                  <MuSelect
                    value={codeRole}
                    wrapperClass="mu-select"
                    options={[
                      { value: "mentors", label: "Mentor" },
                      { value: "coordinators", label: "Coordinator" },
                      { value: "admins", label: "Admin" },
                    ]}
                    onChange={(val) => setCodeRole(val)}
                  />
                </div>`;
const replaceStr = `                <div className="form-group-admin">
                  <label>Assign Target Role *</label>
                  <div className="form-input-admin" style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', height: '42px', padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    Institutional Admin
                  </div>
                </div>`;
content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content);
console.log('done');
