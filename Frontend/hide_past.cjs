const fs = require('fs');
const file = 'src/pages/Student/Components/ST_AiInterview.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      {/* Past Interviews */}\r\n      <div className="past-interviews-card">`;
const replacement = `      {/* Past Interviews */}\r\n      {phase !== "live" && (\r\n      <div className="past-interviews-card">`;

const targetStr2 = targetStr.replace(/\r\n/g, '\n');
const replacement2 = replacement.replace(/\r\n/g, '\n');
content = content.replace(targetStr, replacement);
content = content.replace(targetStr2, replacement2);

const endTargetStr = `          </div>\r\n        )}\r\n      </div>\r\n    </div>`;
const endReplacement = `          </div>\r\n        )}\r\n      </div>\r\n      )}\r\n    </div>`;

const endTargetStr2 = endTargetStr.replace(/\r\n/g, '\n');
const endReplacement2 = endReplacement.replace(/\r\n/g, '\n');
content = content.replace(endTargetStr, endReplacement);
content = content.replace(endTargetStr2, endReplacement2);

fs.writeFileSync(file, content);
console.log('updated');
