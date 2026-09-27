const fs = require('fs');
const path = 'C:/Users/Siri/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_ManageUsers.jsx';
let content = fs.readFileSync(path, 'utf8');
const searchStr = `                    <MuSelect
                      value={codeExpiry}
                      direction="up"
                      wrapperClass="mu-select"
                      options={[
                        { value: "24 Hours", label: "24 Hours" },
                        { value: "3 Days", label: "3 Days" },
                        { value: "7 Days", label: "7 Days" },
                        { value: "30 Days", label: "30 Days" },
                        { value: "90 Days", label: "90 Days" },
                        { value: "Never", label: "Never" },
                      ]}`;
const replaceStr = `                    <MuSelect
                      value={codeExpiry}
                      direction="up"
                      wrapperClass="mu-select"
                      options={[
                        { value: "24 Hours", label: "1 Day" },
                        { value: "3 Days", label: "3 Days" },
                        { value: "7 Days", label: "7 Days" },
                        { value: "30 Days", label: "30 Days" },
                        { value: "90 Days", label: "90 Days" },
                        { value: "Never", label: "Never" },
                      ]}`;
content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content);
console.log('done');
