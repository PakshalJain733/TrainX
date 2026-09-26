const fs = require('fs');
const p = 'src/pages/Student/Components/ST_PracticeProblems.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.split('description: p.description || "No problem description provided.",').join('description: p.description || "No problem description provided.", dueDate: p.due_date || p.dueDate || "N/A",');
c = c.split('description: s.data?.description || s.description || "No problem description provided.",').join('description: s.data?.description || s.description || "No problem description provided.", dueDate: s.data?.due_date || s.due_date || s.dueDate || "N/A",');

c = c.split('solutionAvailable: true,\r\n            }))').join('solutionAvailable: true,\r\n              dueDate: s.data?.due_date || s.due_date || s.dueDate || "N/A"\r\n            }))');
c = c.split('solutionAvailable: true,\n            }))').join('solutionAvailable: true,\n              dueDate: s.data?.due_date || s.due_date || s.dueDate || "N/A"\n            }))');

c = c.split('<th>Difficulty</th>\r\n                <th>Acceptance</th>').join('<th>Difficulty</th>\r\n                <th>Due Date</th>\r\n                <th>Acceptance</th>');
c = c.split('<th>Difficulty</th>\n                <th>Acceptance</th>').join('<th>Difficulty</th>\n                <th>Due Date</th>\n                <th>Acceptance</th>');

const tableSearchStr = `                      </span>\n                    </td>\n                    <td className="acceptance-cell">{prob.acceptance}</td>`;
const tableReplaceStr = `                      </span>\n                    </td>\n                    <td>\n                      <span style={{ color: prob.dueDate !== 'N/A' ? '#ef4444' : '#94a3b8', fontWeight: prob.dueDate !== 'N/A' ? 600 : 400, fontSize: '13px' }}>\n                        {prob.dueDate}\n                      </span>\n                    </td>\n                    <td className="acceptance-cell">{prob.acceptance}</td>`;

c = c.split(tableSearchStr).join(tableReplaceStr);

const tableSearchStrRN = tableSearchStr.replace(/\n/g, '\r\n');
const tableReplaceStrRN = tableReplaceStr.replace(/\n/g, '\r\n');

c = c.split(tableSearchStrRN).join(tableReplaceStrRN);

fs.writeFileSync(p, c);
console.log('Done!');
