const fs = require('fs');
const file = 'src/pages/Student/Components/ST_AiInterview.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `              </div>\r\n\r\n              <div className="ai-action-row">\r\n                <button type="button" className="ai-mic-btn ai-retake-btn" onClick={resetInterview}>`;

const replacement = `              </div>\r\n\r\n              {result.evaluationHistory && result.evaluationHistory.length > 0 && (\r\n                <div className="ai-diagnostic-box" style={{ marginTop: '24px', gridColumn: '1 / -1', maxWidth: '100%' }}>\r\n                  <h4 className="ai-diagnostic-title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>Detailed Question Breakdown</h4>\r\n                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>\r\n                    {result.evaluationHistory.map((item, idx) => (\r\n                      <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>\r\n                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Q{idx + 1}: {item.question || item.q}</div>\r\n                        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>\r\n                          <span style={{ fontWeight: 500, color: '#334155' }}>Your Answer:</span> {item.answer || item.a || "No answer provided."}\r\n                        </div>\r\n                        <div style={{ padding: '12px', background: '#fff', borderLeft: '4px solid #3b82f6', borderRadius: '4px', fontSize: '13.5px' }}>\r\n                          <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>AI Feedback (Score: {item.score ?? '-'}/10)</div>\r\n                          <div style={{ color: '#334155', lineHeight: '1.5' }}>{item.feedback || item.f || "No feedback available."}</div>\r\n                        </div>\r\n                      </div>\r\n                    ))}\r\n                  </div>\r\n                </div>\r\n              )}\r\n\r\n              <div className="ai-action-row">\r\n                <button type="button" className="ai-mic-btn ai-retake-btn" onClick={resetInterview}>`;

content = content.replace(targetStr, replacement);

const targetStr2 = targetStr.replace(/\r\n/g, '\n');
const replacement2 = replacement.replace(/\r\n/g, '\n');
content = content.replace(targetStr2, replacement2);

fs.writeFileSync(file, content);
console.log('updated');
