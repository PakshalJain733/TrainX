import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Play, CheckCircle2, Terminal, Code2, 
  FileText, Check, Settings, Layout, ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import "../Styles/CodingPlatform.css";

const defaultCode = `def solution():
    # Write your code here
    pass

if __name__ == '__main__':
    solution()`;

export default function CodingPlatform() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(defaultCode);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // description, submissions

  // Generate line numbers array
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);

  const currentTaskNum = taskId ? parseInt(taskId.replace('task-', '')) : 1;
  
  const handleRun = () => {
    setConsoleOutput("Running code...\n\n> Output:\nTests executed successfully in 14ms.\nStatus: Accepted");
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setConsoleOutput("Evaluating all test cases...\n...");
    setTimeout(() => {
      setIsSubmitting(false);
      setConsoleOutput("Evaluating all test cases...\n\n✅ 15 / 15 test cases passed.\nTime Complexity: O(n)\nSpace Complexity: O(1)\n\nSuccess: Code submitted.");
    }, 1200);
  };

  return (
    <div className="student-page-inner">
      <div className="coding-platform-container">
        {/* IDE Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <Link to="/student/batches" className="cp-back-btn">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <h1 className="cp-task-title">
              <Code2 size={18} />
              {taskId ? `Task ID: ${taskId.toUpperCase()}` : "Coding Task Workspace"}
              <span className="cp-task-badge">Backend</span>
            </h1>
          </div>
          
          <div className="cp-header-right">
            <div className="cp-header-actions-group">
              <button 
                className="cp-run-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(Math.max(1, currentTaskNum - 1)).padStart(2, '0')}`)}
                disabled={currentTaskNum <= 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button 
                className="cp-run-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(currentTaskNum + 1).padStart(2, '0')}`)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>

            <select className="cp-lang-select" defaultValue="python">
              <option value="python">Python 3.10</option>
              <option value="node">Node.js 18</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 20</option>
            </select>
            
            <button className="cp-run-btn" onClick={handleRun} disabled={isSubmitting}>
              <Play size={14} fill="currentColor" /> Run
            </button>
            <button className="cp-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Submit Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Split Workspace */}
        <div className="cp-workspace">
          {/* Left Pane: Description */}
          <div className="cp-problem-pane">
            <div className="cp-pane-tabs">
              <div 
                className={`cp-pane-tab ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                <FileText size={15} /> Description
              </div>
              <div 
                className={`cp-pane-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                <Check size={15} /> Submissions
              </div>
            </div>

            <div className="cp-problem-content">
              {activeTab === 'description' ? (
                <>
                  <h3 className="cp-req-heading">
                    Problem Requirements
                  </h3>
                  <div className="cp-problem-desc">
                    <p>Write an optimized function to solve the given coding problem. Ensure your logic handles edge cases and runs within the required time complexity.</p>
                    <p><strong>Note:</strong> Standard input/output libraries are pre-imported. Do not alter the function signature.</p>
                  </div>
                  
                  <div className="cp-test-case">
                    <p className="cp-test-title">Example 1:</p>
                    <div className="cp-test-code">Input: nums = [2,7,11,15], target = 9</div>
                    <div className="cp-test-code">Output: [0,1]</div>
                  </div>
                  
                  <div className="cp-test-case">
                    <p className="cp-test-title">Constraints:</p>
                    <ul className="cp-constraints-list">
                      <li><code>2 &lt;= nums.length &lt;= 10^4</code></li>
                      <li><code>-10^9 &lt;= nums[i] &lt;= 10^9</code></li>
                      <li>Only one valid answer exists.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="cp-no-submissions">
                  <CheckCircle2 size={32} className="cp-no-submissions-icon" />
                  <p>No previous submissions for this task.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Code Editor & Console */}
          <div className="cp-editor-pane">
            <div className="cp-editor-area">
              <div className="cp-line-numbers">
                {lines.map(num => <div key={num}>{num}</div>)}
              </div>
              <textarea
                className="cp-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>
            
            <div className="cp-console">
              <div className="cp-console-header">
                <div className="cp-console-title">
                  <Terminal size={14} /> Console Output
                </div>
                <div className="cp-console-actions">
                  <Layout size={14} cursor="pointer" />
                </div>
              </div>
              <div className={`cp-console-output ${!consoleOutput ? 'empty' : ''}`}>
                {consoleOutput ? (
                  <pre className="cp-pre-output">
                    {consoleOutput}
                  </pre>
                ) : (
                  <span>Run your code to see output here.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
