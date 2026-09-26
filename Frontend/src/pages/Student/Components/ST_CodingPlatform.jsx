import React, { useState, useEffect, useRef } from "react";
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
  const token = (sessionStorage.getItem("token") || (sessionStorage.getItem("token") || localStorage.getItem("token"))) || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getDynamicProblemDescription(title = "Coding Problem", topic = "Algorithms", originalDesc = "") {
  if (originalDesc && originalDesc.trim() && !originalDesc.includes("No problem description provided")) {
    return originalDesc;
  }

  const cleanTitle = (title || "").trim();
  const lower = cleanTitle.toLowerCase();
  
  if (lower.includes("return first element")) {
    return `Given an array of integers, write a program or function that returns the very first element of the array.\n\nInput Format:\n- Line 1: An integer N representing the size of the array.\n- Line 2: N space-separated integers.\n\nOutput Format:\n- Print a single integer representing the first element of the input array.\n\nConstraints:\n- 1 <= N <= 10^5\n- -10^9 <= Array[i] <= 10^9`;
  }
  
  if (lower.includes("multiply two numbers")) {
    return `Write a program that takes two integers as input and prints their product.\n\nInput Format:\n- A single line containing two space-separated integers A and B.\n\nOutput Format:\n- Print the product of A and B as a single integer.\n\nConstraints:\n- -10^6 <= A, B <= 10^6`;
  }

  if (lower.includes("even") || lower.includes("odd")) {
    return `Write a program to determine whether a given integer N is Even or Odd.\n\nInput Format:\n- A single integer N.\n\nOutput Format:\n- Print 'Even' if N is divisible by 2, otherwise print 'Odd'.\n\nConstraints:\n- -10^9 <= N <= 10^9`;
  }

  return `Write an optimal solution for '${cleanTitle}' in the domain of ${topic}.\n\nProblem Statement:\nImplement a program to process standard input according to the problem requirements for '${cleanTitle}' and print the evaluated output.\n\nInput Format:\n- Standard input formatted as required for ${cleanTitle}.\n\nOutput Format:\n- Output the calculated answer.`;
}

function getDynamicSampleTestCases(title = "", existingCases = []) {
  if (existingCases && existingCases.length > 0) {
    return existingCases;
  }
  
  const lower = (title || "").toLowerCase();

  if (lower.includes("return first element")) {
    return [
      { input: "3\n5 1 2", expected_output: "5", is_hidden: false },
      { input: "4\n42 10 9 3", expected_output: "42", is_hidden: false }
    ];
  }
  if (lower.includes("multiply two numbers")) {
    return [
      { input: "4 5", expected_output: "20", is_hidden: false },
      { input: "-3 7", expected_output: "-21", is_hidden: false }
    ];
  }
  if (lower.includes("even") || lower.includes("odd")) {
    return [
      { input: "4", expected_output: "Even", is_hidden: false },
      { input: "7", expected_output: "Odd", is_hidden: false }
    ];
  }

  return [];
}

export default function CodingPlatform() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialTask = location.state?.task ? {
    ...location.state.task,
    description: getDynamicProblemDescription(location.state.task.title, location.state.task.topic, location.state.task.description),
    testCases: getDynamicSampleTestCases(location.state.task.title, location.state.task.testCases || location.state.task.test_cases || [])
  } : null;

  const [taskData, setTaskData] = useState(initialTask);
  const [loading, setLoading] = useState(!initialTask);
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleStatus, setConsoleStatus] = useState("");
  const [consoleTab, setConsoleTab] = useState("output");
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLang, setSelectedLang] = useState("python");
  const [activeTab, setActiveTab] = useState("description");
  const [mobileView, setMobileView] = useState("problem");
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
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
          const slugLike = requested && !/^[^A-Za-z]*$/.test(requested) && !idMatch;
          if (idMatch || slugLike) {
            const rawCases = t.testCases || t.test_cases || [];
            setTaskData({
              id: t.id,
              title: t.title,
              topic: t.topic || "General Assignment",
              difficulty: t.difficulty || "Medium",
              points: t.points || 100,
              deadline: t.deadline || "",
              description: getDynamicProblemDescription(t.title, t.topic, t.description || t.desc),
              testCases: getDynamicSampleTestCases(t.title, rawCases),
            });
            return;
          }
        }

        const probRes = await fetch(`${API_BASE}/student/practice-problems/${numeric}`, { headers: getAuthHeaders() });
        const probData = await probRes.json();
        if (probRes.ok && probData.success && probData.data) {
          const p = probData.data;
          const rawCases = p.testCases || p.cases || p.test_cases || [];
          setTaskData({
            id: p.id,
            title: p.title,
            topic: p.category || "General DSA",
            difficulty: p.difficulty || "Medium",
            points: p.points || 100,
            deadline: "",
            description: getDynamicProblemDescription(p.title, p.category, p.description),
            testCases: getDynamicSampleTestCases(p.title, rawCases),
          });
          return;
        }

        if (initialTask) {
          setTaskData(initialTask);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error("Failed to fetch task details:", err);
        if (initialTask) {
          setTaskData(initialTask);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Line numbers array
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);

  const currentTaskNum = taskId ? parseInt(taskId.replace(/[^0-9]/g, '')) || 1 : 1;
  
  const handleRun = async () => {
    if (isRunning || isSubmitting) return;
    if (!code.trim()) {
      setConsoleOutput("⚠️  Write some code before running.");
      setConsoleStatus("error");
      return;
    }
    setIsRunning(true);
    setConsoleStatus("running");
    setConsoleOutput("Running code...");
    setMobileView("code");

    // Use custom input if enabled, else the first visible (non-hidden) test case's input, or empty
    const sampleTc = (taskData?.testCases || taskData?.test_cases || [])
      .find((tc) => !tc.is_hidden);
    const stdin = useCustomInput ? customInput : (sampleTc?.input ?? "");

    try {
      const res = await fetch(`${API_BASE}/code/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ language: selectedLang, code, stdin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConsoleStatus("error");
        if (data?.message?.includes("Docker") || data?.message?.includes("unavailable")) {
          setConsoleOutput(`🐳 Compiler service unavailable.\n\nDocker must be running. Start Docker Desktop and try again.\n\nError: ${data.message}`);
        } else {
          setConsoleOutput(`❌ Error: ${data.message || "Unknown error"}`);
        }
        return;
      }

      const result = data.data || data;

      if (result.compilationError) {
        setConsoleStatus("ce");
        setConsoleOutput(`🔴 Compilation Error\n\n${result.stderr || "Check your syntax."}`);
      } else if (result.timedOut) {
        setConsoleStatus("tle");
        setConsoleOutput(`⏱️  Time Limit Exceeded (${result.executionTime}ms)`);
      } else if (result.exitCode !== 0) {
        setConsoleStatus("error");
        setConsoleOutput(
          `🔴 Runtime Error (exit code ${result.exitCode})\n\n${result.stderr ? `Stderr:\n${result.stderr}` : ""}${result.stdout ? `\nStdout (partial):\n${result.stdout}` : ""}`
        );
      } else {
        setConsoleStatus("success");
        const outputText = result.stdout?.trim() || "(no output)";
        const expectedText = sampleTc?.expected_output?.trim() ?? sampleTc?.expectedOutput?.trim() ?? null;
        let verdict = "";
        if (expectedText !== null) {
          const match = outputText === expectedText;
          verdict = match ? "\n\n✅ Output matches expected!" : `\n\n❌ Expected:\n${expectedText}\n\nGot:\n${outputText}`;
        }
        setConsoleOutput(
          `✅ Execution successful (${result.executionTime}ms)\n\nOutput:\n${outputText}${verdict}`
        );
      }
    } catch (err) {
      setConsoleStatus("error");
      setConsoleOutput(`❌ Network error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isRunning) return;
    if (!code.trim()) {
      setConsoleOutput("⚠️  Write some code before submitting.");
      setConsoleStatus("error");
      return;
    }
    if (!taskData?.id) {
      setConsoleOutput("⚠️  No problem ID found. Cannot submit.");
      setConsoleStatus("error");
      return;
    }
    setIsSubmitting(true);
    setConsoleStatus("running");
    setConsoleOutput("Evaluating all test cases in Docker sandbox...");
    setMobileView("code");

    try {
      const res = await fetch(`${API_BASE}/code/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          language: selectedLang,
          code,
          problem_id: taskData.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConsoleStatus("error");
        if (data?.message?.includes("Docker") || data?.message?.includes("unavailable")) {
          setConsoleOutput(`🐳 Compiler service unavailable.\n\nDocker must be running. Start Docker Desktop and try again.\n\nError: ${data.message}`);
        } else {
          setConsoleOutput(`❌ Submission failed: ${data.message || "Unknown error"}`);
        }
        return;
      }

      const result = data.data || data;
      const passed = result.passed_tests ?? 0;
      const total = result.total_tests ?? 0;
      const status = result.status || "";

      // Build summary header
      let header = "";
      if (result.compilation_error) {
        setConsoleStatus("ce");
        header = `🔴 Compilation Error\n`;
      } else if (result.timed_out) {
        setConsoleStatus("tle");
        header = `⏱️  Time Limit Exceeded\n`;
      } else if (passed === total && total > 0) {
        setConsoleStatus("success");
        header = `✅ ${passed} / ${total} test cases passed  —  ACCEPTED\n`;
      } else {
        setConsoleStatus("error");
        header = `❌ ${passed} / ${total} test cases passed  —  WRONG ANSWER\n`;
      }

      const scoreLine = `Score: ${result.score ?? 0} / ${result.total_marks ?? 100}  (${result.percentage ?? 0}%)\n`;
      const timeLine = result.execution_time_ms != null ? `Execution Time: ${result.execution_time_ms}ms\n` : "";

      // Per-test-case breakdown
      const tcLines = (result.test_results || []).map((tc) => {
        const icon = tc.passed ? "✅" : tc.timed_out ? "⏱️" : tc.not_evaluated ? "⏭️" : "❌";
        let line = `  ${icon} Test ${tc.test_case_number}${tc.is_hidden ? " [Hidden]" : ""}${
          tc.passed ? " PASS" : tc.not_evaluated ? " Not evaluated" : tc.timed_out ? " TLE" : " FAIL"
        }`;
        if (!tc.is_hidden && !tc.passed && !tc.not_evaluated && tc.actual_output !== undefined) {
          line += `\n     Expected: ${String(tc.expected_output ?? "").trim() || "(empty)"}\n     Got:      ${String(tc.actual_output ?? "").trim() || "(empty)"}`;
          if (tc.stderr && tc.stderr.trim()) line += `\n     Stderr:   ${tc.stderr.trim().slice(0, 200)}`;
        }
        return line;
      });

      setConsoleOutput(
        [header, scoreLine, timeLine, "\nTest Cases:", ...tcLines].filter(Boolean).join("\n")
      );

      // Refresh submissions tab
      setActiveTab("submissions");
      loadSubmissions();
    } catch (err) {
      setConsoleStatus("error");
      setConsoleOutput(`❌ Network error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/code/submissions/my`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data?.data?.submissions) {
        const problemId = String(taskData?.id || "");
        setSubmissions(
          data.data.submissions.filter((s) => String(s.problem_id) === problemId)
        );
      }
    } catch { /* ignore */ } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "submissions" && taskData?.id) loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, taskData?.id]);

  
  const submitRef = useRef(null);
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && taskData) {
        if (submitRef.current && !isSubmitting) submitRef.current();
      }
    };
    const preventCopy = (e) => {
      e.preventDefault();
      alert("Copying and pasting is disabled in the coding platform.");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventCopy);
    };
  }, [taskData, isSubmitting]);

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
                { value: "c", label: "C (C11)" },
                { value: "sql", label: "SQL (SQLite3)" },
              ]}
              onChange={(val) => setSelectedLang(val)}
            />
            
            <button className="cp-run-btn" onClick={handleRun} disabled={isRunning || isSubmitting}>
              {isRunning ? <span>Running...</span> : <><Play size={14} fill="currentColor" /> <span>Run</span></>}
            </button>
            <button className="cp-submit-btn" onClick={handleSubmit} disabled={isSubmitting || isRunning}>
              {isSubmitting ? (
                <span>Evaluating...</span>
              ) : (
                <><CheckCircle2 size={15} /> <span>Submit</span></>
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
                      testCasesList.filter(tc => !tc.is_hidden).map((tc, idx) => (
                        <div key={idx} className="cp-test-case" style={{ marginBottom: "12px" }}>
                          <p className="cp-test-title">Example {idx + 1}:</p>
                          {tc.input ? <div className="cp-test-code">Input: {tc.input}</div> : null}
                          {(tc.expected_output || tc.expectedOutput || tc.output) ? (
                            <div className="cp-test-code">Output: {tc.expected_output || tc.expectedOutput || tc.output}</div>
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
                /* ─── Submissions Tab ──────────────────────────────── */
                submissionsLoading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="cp-no-submissions">
                    <CheckCircle2 size={32} className="cp-no-submissions-icon" />
                    <p>No previous submissions for this problem.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
                    {submissions.map((s, i) => {
                      const isAccepted = s.status === "accepted" || s.status === "passed";
                      const statusColor = isAccepted ? "#16a34a" : s.status === "compilation_error" ? "#9333ea" : s.status === "time_limit_exceeded" ? "#d97706" : "#dc2626";
                      return (
                        <div key={s.id || i} style={{ border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", background: isAccepted ? "#f0fdf4" : "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, color: statusColor, textTransform: "uppercase", fontSize: "12px" }}>
                              {isAccepted ? "✅ Accepted" : s.status?.replace(/_/g, " ") || "Unknown"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {s.language} &bull; {s.passed_test_cases ?? 0}/{s.total_test_cases ?? 0} tests
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#475569" }}>
                            Score: <strong>{s.score ?? 0}</strong> / {taskData?.points || 100} &nbsp;|&nbsp;
                            {s.percentage ?? 0}% &nbsp;|&nbsp;
                            {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
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
                <div className="cp-console-title" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} />
                    <span 
                      onClick={() => setConsoleTab("output")} 
                      style={{ cursor: "pointer", color: consoleTab === "output" ? "#0f172a" : "#64748b", borderBottom: consoleTab === "output" ? "2px solid #0f172a" : "2px solid transparent", paddingBottom: "2px" }}
                    >
                      Output
                    </span>
                    <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
                    <span 
                      onClick={() => setConsoleTab("input")} 
                      style={{ cursor: "pointer", color: consoleTab === "input" ? "#0f172a" : "#64748b", borderBottom: consoleTab === "input" ? "2px solid #0f172a" : "2px solid transparent", paddingBottom: "2px" }}
                    >
                      Custom Input
                    </span>
                  </div>
                  {consoleStatus === "running" && <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>● Running...</span>}
                  {consoleStatus === "success" && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>● Success</span>}
                  {consoleStatus === "error" && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>● Failed</span>}
                  {consoleStatus === "ce" && <span style={{ fontSize: 11, color: "#9333ea", fontWeight: 700 }}>● Compilation Error</span>}
                  {consoleStatus === "tle" && <span style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>● Time Limit Exceeded</span>}
                </div>
                <div className="cp-console-actions">
                  <Layout size={14} style={{ cursor: "pointer" }} onClick={() => { setConsoleOutput(""); setConsoleStatus(""); }} title="Clear console" />
                </div>
              </div>
              <div className={`cp-console-output ${consoleTab === "output" && !consoleOutput ? 'empty' : ''}`}
                style={{
                  borderTop: consoleStatus === "success" ? "2px solid #16a34a" :
                             consoleStatus === "error" || consoleStatus === "ce" ? "2px solid #dc2626" :
                             consoleStatus === "tle" ? "2px solid #d97706" : undefined,
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {consoleTab === "output" ? (
                  consoleOutput ? (
                    <pre className="cp-pre-output">{consoleOutput}</pre>
                  ) : (
                    <span style={{ margin: 'auto' }}>Run your code to see output here.</span>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={useCustomInput} 
                        onChange={(e) => setUseCustomInput(e.target.checked)} 
                      />
                      Test against custom input
                    </label>
                    <textarea 
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type your custom input here..."
                      style={{ 
                        flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                        fontFamily: "'Fira Code', monospace", fontSize: '13px', resize: 'none',
                        background: '#ffffff', color: '#0f172a', outline: 'none'
                      }}
                    />
                  </div>
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
