const fs = require('fs');
const file = 'src/pages/Student/Components/ST_AiInterview.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                      return (\r\n                        <div className="ai-feedback-row" key={idx}>\r\n                          <Sparkles size={14} />\r\n                          <span>Score {c.score}/10 — {c.text}</span>\r\n                        </div>\r\n                      );`;
const replacement = `                      return null; // Feedback hidden during live interview`;

const targetStr2 = targetStr.replace(/\r\n/g, '\n');
const replacement2 = replacement.replace(/\r\n/g, '\n');

content = content.replace(targetStr, replacement);
content = content.replace(targetStr2, replacement2);

fs.writeFileSync(file, content);
console.log('updated');
