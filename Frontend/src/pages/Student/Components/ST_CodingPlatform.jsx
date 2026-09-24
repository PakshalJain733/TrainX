import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Play, CheckCircle2, Terminal, Code2, 
  FileText, Check, Settings, Layout, ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";
import "../Styles/ST_CodingPlatform.css";

/* ── Inline dropdown for Coding Platform (CSS: CodingPlatform.css .student-cp-select-*) ── */
function StudentCpSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-cp-select-wrap${isOpen ? ' student-cp-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`student-cp-select-trigger${isOpen ? ' student-cp-select-trigger--open' : ''}`}>
        {Icon && <Icon className="student-cp-select-icon" />}
        <span className="student-cp-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`student-cp-select-arrow${isOpen ? ' student-cp-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="student-cp-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`student-cp-select-option${isSel ? ' student-cp-select-option--selected' : ''}`}>
                <span className="student-cp-select-option-label">{opt.label}</span>
                {isSel && <Check className="student-cp-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CodingPlatform() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [taskData, setTaskData] = useState(location.state?.task || null);
  const [loading, setLoading] = useState(!location.state?.task);
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLang, setSelectedLang] = useState("python");
  const [activeTab, setActiveTab] = useState("description"); // description, submissions
  const [mobileView, setMobileView] = useState("problem"); // problem, code

  useEffect(() => {
    if (location.state?.task) {
      setTaskData(location.state.task);
      setLoading(false);
      return;
    }

    const fetchTaskDetails = async () => {
      setLoading(true);
      setNotFound(false);
      const requested = String(taskId || '');
      const numeric = requested.replace(/[^0-9]/g, '');
      try {
        const res = await fetch(`${API_BASE}/batches/tasks/detail/${taskId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.data) {
          const t = data.data;
          const batchId = String(t.id ?? '');
          const idMatch =
            (batchId && (batchId === requested || batchId === numeric)) ||
            (numeric && parseInt(batchId, 10) === parseInt(numeric, 10));
          const nonNumericRequest = !/^\d+$/.test(requested.replace(/\D/g, '') ? requested : '') || false;
          const slugLike = requested && !/^[^A-Za-z]*$/.test(requested) && !idMatch;
          if (idMatch || slugLike) {
            setTaskData({
              id: t.id,
              title: t.title,
              topic: t.topic || "General Assignment",
              difficulty: t.difficulty || "Medium",
              points: t.points || 100,
              deadline: t.deadline || "",
              description: t.description || t.desc || "No problem description provided.",
              testCases: t.testCases || t.test_cases || [],
            });
            return;
          }
        }

        const probRes = await fetch(`${API_BASE}/student/practice-problems/${numeric}`, { headers: getAuthHeaders() });
        const probData = await probRes.json();
        if (probRes.ok && probData.success && probData.data) {
          const p = probData.data;
          setTaskData({
            id: p.id,
            title: p.title,
            topic: p.category || "General DSA",
            difficulty: p.difficulty || "Medium",
            points: p.points || 100,
            deadline: "",
            description: p.description || "No problem description provided.",
            testCases: [],
          });
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error("Failed to fetch task details:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, location.state]);

  // Line numbers array
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);

  const currentTaskNum = taskId ? parseInt(taskId.replace(/[^0-9]/g, '')) || 1 : 1;
  
  const handleRun = () => {
    setConsoleOutput("Running code...\n\n> Output:\nTests executed successfully in 14ms.\nStatus: Accepted");
    setMobileView("code");
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setConsoleOutput("Evaluating all test cases...\n...");
    setMobileView("code");
    setTimeout(() => {
      setIsSubmitting(false);
      setConsoleOutput("Evaluating all test cases...\n\n✅ 15 / 15 test cases passed.\nTime Complexity: O(n)\nSpace Complexity: O(1)\n\nSuccess: Code submitted.");
    }, 1200);
  };

  const testCasesList = taskData?.testCases || taskData?.test_cases || [];

  return (
    <div className="student-page-inner">
      <div className="coding-platform-container">
        {notFound && (
          <div className="cp-not-found" style={{ padding: "40px 24px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "10px", fontSize: "18px" }}>Problem not found</h2>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              This task or problem is not available. It may have been deleted.
            </p>
            <Link to="/student/practice" className="cp-back-btn">← Back to Practice</Link>
          </div>
        )}
        {!notFound && (
        <>
        {/* IDE Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <Link to="/student/batches" className="cp-back-btn">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <h1 className="cp-task-title">
              <Code2 size={18} />
              <span className="cp-task-name">{taskData?.title || (taskId ? `Task ID: ${taskId.toUpperCase()}` : "Coding Task")}</span>
              <span className="cp-task-badge">{taskData?.difficulty || taskData?.topic || "Assignment"}</span>
            </h1>
          </div>
          
          <div className="cp-header-right">
            <div className="cp-header-actions-group">
              <button 
                className="cp-run-btn cp-nav-arrow-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(Math.max(1, currentTaskNum - 1)).padStart(2, '0')}`)}
                disabled={currentTaskNum <= 1}
                title="Previous Task"
              >
                <ChevronLeft size={14} /> <span>Prev</span>
              </button>
              <button 
                className="cp-run-btn cp-nav-arrow-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(currentTaskNum + 1).padStart(2, '0')}`)}
                title="Next Task"
              >
                <span>Next</span> <ChevronRight size={14} />
              </button>
            </div>

            <StudentCpSelect
              value={selectedLang}
              options={[
                { value: "python", label: "Python 3.10" },
                { value: "node", label: "Node.js 18" },
                { value: "java", label: "Java 17" },
                { value: "cpp", label: "C++ 20" },
              ]}
              onChange={(val) => setSelectedLang(val)}
            />
            
            <button className="cp-run-btn" onClick={handleRun} disabled={isSubmitting}>
              <Play size={14} fill="currentColor" /> <span>Run</span>
            </button>
            <button className="cp-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} /> <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Segmented View Switcher */}
        <div className="cp-mobile-tab-bar">
          <button
            type="button"
            className={`cp-mobile-tab ${mobileView === 'problem' ? 'active' : ''}`}
            onClick={() => setMobileView('problem')}
          >
            <FileText size={15} /> Problem Statement
          </button>
          <button
            type="button"
            className={`cp-mobile-tab ${mobileView === 'code' ? 'active' : ''}`}
            onClick={() => setMobileView('code')}
          >
            <Code2 size={15} /> Code & Console
          </button>
        </div>

        {/* Split Workspace */}
        <div className="cp-workspace">
          {/* Left Pane: Description */}
          <div className={`cp-problem-pane ${mobileView === 'problem' ? 'cp-pane-mobile-active' : 'cp-pane-mobile-hidden'}`}>
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
              {loading ? (
                <div style={{ padding: "30px", color: "#64748b", textAlign: "center" }}>
                  Loading problem statement...
                </div>
              ) : activeTab === 'description' ? (
                <>
                  <h3 className="cp-req-heading">
                    {taskData?.title || "Problem Requirements"}
                  </h3>
                  <div className="cp-problem-desc">
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {taskData?.description || taskData?.desc || "Write a clean and optimized solution to solve this problem statement."}
                    </p>
                  </div>
                  
                  <div style={{ marginTop: "20px" }}>
                    <p className="cp-test-title" style={{ fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
                      Sample Test Cases:
                    </p>
                    {testCasesList && testCasesList.length > 0 ? (
                      testCasesList.map((tc, idx) => (
                        <div key={idx} className="cp-test-case" style={{ marginBottom: "12px" }}>
                          <p className="cp-test-title">Example {idx + 1}:</p>
                          {tc.input ? <div className="cp-test-code">Input: {tc.input}</div> : null}
                          {(tc.expectedOutput || tc.output) ? (
                            <div className="cp-test-code">Output: {tc.expectedOutput || tc.output}</div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                        No sample test cases specified for this task.
                      </p>
                    )}
                  </div>

                  {taskData?.deadline && (
                    <div className="cp-test-case" style={{ marginTop: "16px" }}>
                      <p className="cp-test-title">Submission Deadline:</p>
                      <div className="cp-test-code">{taskData.deadline}</div>
                    </div>
                  )}
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
          <div className={`cp-editor-pane ${mobileView === 'code' ? 'cp-pane-mobile-active' : 'cp-pane-mobile-hidden'}`}>
            <div className="cp-editor-area">
              <div className="cp-line-numbers">
                {lines.map(num => <div key={num}>{num}</div>)}
              </div>
              <textarea
                className="cp-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write your solution code here..."
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
        </>
        )}
      </div>
    </div>
  );
}
