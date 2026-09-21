import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Play, CheckCircle2, Terminal, Code2, 
  FileText, Check, Settings, Layout, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Award, AlertCircle
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/CodingPlatform.css";

const starterCodeTemplates = {
  python: `def solution():
    # Write your solution here
    pass

if __name__ == '__main__':
    solution()`,
  node: `function solution() {
    // Write your solution here
}

module.exports = solution;`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`
};

const problemPresets = {
  1: {
    title: "Two Sum",
    category: "Arrays & Hashing",
    difficulty: "Easy",
    totalMarks: 100,
    desc: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    exampleInput: "nums = [2,7,11,15], target = 9",
    exampleOutput: "[0,1]",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ]
  },
  2: {
    title: "Valid Palindrome",
    category: "Two Pointers",
    difficulty: "Easy",
    totalMarks: 100,
    desc: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    exampleInput: "s = \"A man, a plan, a canal: Panama\"",
    exampleOutput: "true",
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters."
    ]
  },
  3: {
    title: "Longest Substring Without Repeating Characters",
    category: "Sliding Window",
    difficulty: "Medium",
    totalMarks: 150,
    desc: "Given a string s, find the length of the longest substring without repeating characters.",
    exampleInput: "s = \"abcabcbb\"",
    exampleOutput: "3",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ]
  },
  4: {
    title: "Reverse Linked List",
    category: "Linked List",
    difficulty: "Easy",
    totalMarks: 100,
    desc: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    exampleInput: "head = [1,2,3,4,5]",
    exampleOutput: "[5,4,3,2,1]",
    constraints: [
      "The number of nodes in the list is in the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ]
  },
  5: {
    title: "Maximum Subarray (Kadane's Algorithm)",
    category: "Dynamic Programming",
    difficulty: "Medium",
    totalMarks: 150,
    desc: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    exampleInput: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
    exampleOutput: "6",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ]
  },
  6: {
    title: "Binary Tree Level Order Traversal",
    category: "Trees & Graphs",
    difficulty: "Medium",
    totalMarks: 150,
    desc: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    exampleInput: "root = [3,9,20,null,null,15,7]",
    exampleOutput: "[[3],[9,20],[15,7]]",
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000"
    ]
  },
  7: {
    title: "Merge k Sorted Lists",
    category: "Heap / Priority Queue",
    difficulty: "Hard",
    totalMarks: 250,
    desc: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    exampleInput: "lists = [[1,4,5],[1,3,4],[2,6]]",
    exampleOutput: "[1,1,2,3,4,4,5,6]",
    constraints: [
      "k == lists.length",
      "0 <= k <= 10^4",
      "0 <= lists[i].length <= 500"
    ]
  },
  8: {
    title: "Trapping Rain Water",
    category: "Two Pointers",
    difficulty: "Hard",
    totalMarks: 250,
    desc: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    exampleInput: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
    exampleOutput: "6",
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
    ]
  }
};

const VERDICT_LABELS = {
  accepted: "ACCEPTED",
  wrong_answer: "WRONG ANSWER",
  compilation_error: "COMPILATION ERROR",
  runtime_error: "RUNTIME ERROR",
  time_limit_exceeded: "TIME LIMIT EXCEEDED",
};

export default function CodingPlatform() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const currentTaskNum = taskId ? (parseInt(taskId.replace(/\D/g, ''), 10) || 1) : 1;
  const currentProblemId = currentTaskNum;
  const defaultProblemInfo = problemPresets[currentProblemId] || {
    title: `Coding Problem #${currentProblemId}`,
    category: "Algorithms",
    difficulty: "Medium",
    totalMarks: 100,
    desc: "Write an optimized function to solve the given coding problem. Ensure your logic handles edge cases and runs within the required time complexity.",
    exampleInput: "nums = [2,7,11,15], target = 9",
    exampleOutput: "[0,1]",
    constraints: ["Standard time & space limits apply."]
  };

  const [problemInfo, setProblemInfo] = useState(defaultProblemInfo);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(starterCodeTemplates.python);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleStatus, setConsoleStatus] = useState("normal"); // normal, error, success
  const [customInput, setCustomInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // description, submissions
  const [mobileView, setMobileView] = useState("problem"); // problem, code
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        const res = await apiFetch("/student/practice-problems");
        if (res && res.data && res.data.length > 0) {
          const prob = res.data.find(p => p.id === currentProblemId);
          if (prob) {
            setProblemInfo({
              title: prob.title,
              category: prob.category || "Algorithms",
              difficulty: prob.difficulty || "Medium",
              totalMarks: prob.points || 100,
              desc: prob.description || defaultProblemInfo.desc,
              exampleInput: defaultProblemInfo.exampleInput,
              exampleOutput: defaultProblemInfo.exampleOutput,
              constraints: defaultProblemInfo.constraints,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to fetch problem details", err);
      }
    };
    fetchProblemDetails();
  }, [currentProblemId]);

  // Generate line numbers array
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(15, lineCount) }, (_, i) => i + 1);

  // Fetch student's submissions history for this problem
  const fetchSubmissionsHistory = async () => {
    setIsLoadingSubmissions(true);
    try {
      // Decode user ID from stored JWT or fetch student submissions
      const token = localStorage.getItem("token");
      if (!token) return;

      let userId = null;
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          userId = decoded.userId || decoded.id;
        }
      } catch (e) {
        // ignore decode errors
      }

      if (userId) {
        const res = await apiFetch(`/coding-submissions/student/${userId}`);
        if (res && res.success && res.data?.submissions) {
          const problemSubs = res.data.submissions.filter(
            (s) => parseInt(s.problem_id, 10) === currentProblemId
          );
          setSubmissions(problemSubs);
        }
      }
    } catch (err) {
      console.warn("Failed to load submissions history:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsHistory();
  }, [currentProblemId]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // If user hasn't typed custom code, load template
    if (Object.values(starterCodeTemplates).includes(code)) {
      setCode(starterCodeTemplates[newLang] || "");
    }
  };

  const formatRunResult = (res) => {
    const { stdout, stderr, exitCode, executionTime, timedOut, compilationError } = res || {};
    const timeMs = executionTime ? `${executionTime}ms` : "n/a";

    if (compilationError) {
      return {
        status: "error",
        text: `Compilation Error\n\n${stderr || "Compilation failed."}\n\nTime: ${timeMs}`,
      };
    }
    if (timedOut) {
      return {
        status: "error",
        text: `Time Limit Exceeded\n\nYour program ran longer than the allowed time and was terminated.\n\nTime: ${timeMs}`,
      };
    }
    const runtimeError = exitCode !== 0;
    const outputText = stdout || "";
    const errorText = runtimeError ? `\n\nRuntime Error (exit code ${exitCode}):\n${stderr || "(no stderr)"}` : "";
    const timedText = timedOut ? `\n\n(Timed out after ${timeMs})` : "";
    return {
      status: runtimeError ? "error" : "success",
      text: `> Output:\n${outputText}${errorText}\n\nTime: ${timeMs}${timedText}`,
    };
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setConsoleStatus("normal");
    setConsoleOutput("Running code...");
    setSubmitResult(null);
    setSubmitError(null);
    setMobileView("code");
    try {
      const res = await apiFetch("/code/run", {
        method: "POST",
        body: JSON.stringify({ language, code, stdin: customInput }),
      });
      if (res && res.data) {
        const fmt = formatRunResult(res.data);
        setConsoleStatus(fmt.status);
        setConsoleOutput(fmt.text);
      } else {
        setConsoleStatus("error");
        setConsoleOutput(`Execution failed:\n\n${res?.message || res?.error || "Unknown error"}`);
      }
    } catch (err) {
      setConsoleStatus("error");
      setConsoleOutput(`Execution failed:\n\n${err.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    setConsoleStatus("normal");
    setConsoleOutput("Evaluating all test cases...");
    setSubmitResult(null);
    setSubmitError(null);
    setMobileView("code");
    try {
      const res = await apiFetch("/code/submit", {
        method: "POST",
        body: JSON.stringify({ problem_id: currentProblemId, language, code }),
      });
      if (res && res.data) {
        const d = res.data;
        const statusLabel = VERDICT_LABELS[d.status] || (d.status || "unknown").toUpperCase();
        setSubmitResult(d);
        const lines = [
          `> Test Cases Passed: ${d.passed_tests} / ${d.total_tests}`,
          `Marks: ${d.marks} / ${d.total_marks}`,
          `Verdict: ${statusLabel}`,
          `Execution Time: ${d.execution_time_ms}ms`,
          `See the "Test Cases / Results" section below for per-test-case details.`,
        ];
        if (d.compilation_error) {
          lines.push("", "Compilation failed on submission.");
        }
        if (d.timed_out) {
          lines.push("", "Time Limit Exceeded on a test case.");
        }
        setConsoleStatus(d.status === "accepted" ? "success" : "error");
        setConsoleOutput(lines.join("\n"));
        fetchSubmissionsHistory();
      } else {
        setConsoleStatus("error");
        if ((res?.error || "").includes("No test cases")) {
          setSubmitError("No test cases configured for this problem.");
          setConsoleOutput("No test cases configured for this problem.");
        } else {
          setSubmitError(res?.message || res?.error || "Unknown error");
          setConsoleOutput(`Submission failed:\n\n${res?.message || res?.error || "Unknown error"}`);
        }
      }
    } catch (err) {
      setConsoleStatus("error");
      setSubmitError("Submission failed. Please try again.");
      setConsoleOutput(`Submission failed:\n\n${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-page-inner">
      <div className="coding-platform-container">
        {/* IDE Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <Link to="/student/practice" className="cp-back-btn">
              <ArrowLeft size={16} />
              <span>Back to Practice</span>
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
                className="cp-run-btn cp-nav-arrow-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(Math.max(1, currentTaskNum - 1)).padStart(2, '0')}`)}
                disabled={currentTaskNum <= 1}
                title="Previous Task"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button 
                className="cp-run-btn cp-nav-arrow-btn" 
                onClick={() => navigate(`/student/coding-platform/task-${String(currentTaskNum + 1).padStart(2, '0')}`)}
                title="Next Task"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>

            <select className="cp-lang-select" value={language} onChange={handleLanguageChange}>
              <option value="python">Python 3.10</option>
              <option value="node">Node.js 18</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 20</option>
            </select>
            
            <button className="cp-run-btn" onClick={handleRun} disabled={isSubmitting || isRunning}>
              <Play size={14} fill="currentColor" /> <span>{isRunning ? "Running..." : "Run"}</span>
            </button>
            <button className="cp-submit-btn" onClick={handleSubmit} disabled={isSubmitting || isRunning}>
              {isSubmitting ? (
                <span>Evaluating...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} /> <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Segmented View Switcher (Visible on mobile screens) */}
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
                onClick={() => {
                  setActiveTab('submissions');
                  fetchSubmissionsHistory();
                }}
              >
                <Check size={15} /> Submissions ({submissions.length})
              </div>
            </div>

            <div className="cp-problem-content">
              {activeTab === 'description' ? (
                <>
                  <h3 className="cp-req-heading">
                    {problemInfo.title}
                  </h3>
                  <div className="cp-problem-desc">
                    <p>{problemInfo.desc}</p>
                    <p><strong>Category:</strong> {problemInfo.category} | <strong>Points:</strong> {problemInfo.totalMarks} XP</p>
                  </div>
                  
                  <div className="cp-test-case">
                    <p className="cp-test-title">Example 1:</p>
                    <div className="cp-test-code">Input: {problemInfo.exampleInput}</div>
                    <div className="cp-test-code">Output: {problemInfo.exampleOutput}</div>
                  </div>
                  
                  <div className="cp-test-case">
                    <p className="cp-test-title">Constraints:</p>
                    <ul className="cp-constraints-list">
                      {problemInfo.constraints.map((c, idx) => (
                        <li key={idx}><code>{c}</code></li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="cp-submissions-pane-content">
                  {isLoadingSubmissions ? (
                    <p style={{ textAlign: "center", color: "#64748b", marginTop: "20px" }}>Loading submissions...</p>
                  ) : submissions.length === 0 ? (
                    <div className="cp-no-submissions">
                      <CheckCircle2 size={32} className="cp-no-submissions-icon" />
                      <p>No previous submissions for this problem yet.</p>
                      <p style={{ fontSize: "12px", color: "#94a3b8" }}>Submit your solution to record your score in MySQL.</p>
                    </div>
                  ) : (
                    <div className="cp-submissions-list">
                      {submissions.map((s) => (
                        <div 
                          key={s.id} 
                          className="cp-submission-card"
                          onClick={() => {
                            setCode(s.submitted_code);
                            if (s.language) setLanguage(s.language);
                            const subVerdict = VERDICT_LABELS[s.status] || String(s.status || "passed").toUpperCase();
                            setConsoleStatus("info");
                            setConsoleOutput(`Loaded code from Submission #${s.id} (${subVerdict})\nMarks: ${s.score ?? s.marks} / ${s.problem_total_marks ?? s.total_test_cases}\nTest Cases Passed: ${s.passed_test_cases} / ${s.total_test_cases}`);
                          }}
                        >
                          <div className="cp-submission-header">
                            <span className="cp-submission-id">Submission #{s.id} ({s.language})</span>
                            <span className={`cp-status-pill ${s.status?.toLowerCase() || 'passed'}`}>
                              {VERDICT_LABELS[s.status] || s.status || 'passed'}
                            </span>
                          </div>
                          <div className="cp-submission-meta">
                            <span className="cp-submission-score">
                              Marks: {s.score ?? s.marks} / {s.problem_total_marks ?? s.total_test_cases} • Test Cases Passed: {s.passed_test_cases}/{s.total_test_cases}
                            </span>
                            <span className="cp-submission-time">
                              {new Date(s.submitted_at || s.created_at).toLocaleDateString()} {new Date(s.submitted_at || s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className="cp-custom-input">
                <span className="cp-custom-input-label">Custom Input (stdin)</span>
                <textarea
                  className="cp-custom-input-area"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={"Paste input for your program here (e.g. \"4 9\\n2 7 11 15\")"}
                  spellCheck={false}
                />
              </div>
              <div className={`cp-console-output ${!consoleOutput ? 'empty' : consoleStatus === 'error' ? 'error' : ''}`}>
                {consoleOutput ? (
                  <pre className="cp-pre-output">
                    {consoleOutput}
                  </pre>
                ) : (
                  <span>Click "Run" to execute your code, or "Submit" to evaluate against backend test cases and save marks.</span>
                )}
              </div>
            </div>
            <div className="cp-test-results">
              <div className="cp-test-results-header">
                <span className="cp-test-results-title">
                  <CheckCircle2 size={14} /> Test Cases / Results
                </span>
                {submitResult && (
                  <span className={`cp-final-verdict cp-verdict-${String(submitResult.status || "").toLowerCase()}`}>
                    {VERDICT_LABELS[submitResult.status] || (submitResult.status || "unknown").toUpperCase()}
                  </span>
                )}
              </div>
              {submitError ? (
                <div className="cp-test-results-empty">{submitError}</div>
              ) : !submitResult ? (
                <div className="cp-test-results-empty">
                  No results yet. Submit your code to evaluate against the problem's stored test cases.
                </div>
              ) : (
                <>
                  <div className="cp-test-results-summary">
                    <span className="cp-passed-count">
                      Test Cases Passed: {submitResult.passed_tests} / {submitResult.total_tests}
                    </span>
                    <span className="cp-marks-line">
                      Marks: {submitResult.marks !== undefined ? submitResult.marks : submitResult.score} / {submitResult.total_marks}
                    </span>
                    <span className="cp-verdict-line">
                      Verdict: {VERDICT_LABELS[submitResult.status] || (submitResult.status || "unknown").toUpperCase()}
                    </span>
                    {submitResult.execution_time_ms !== undefined && (
                      <span>Time: {submitResult.execution_time_ms}ms</span>
                    )}
                  </div>
                  {Array.isArray(submitResult.test_results) && submitResult.test_results.length > 0 ? (
                    <div className="cp-test-case-list">
                      {submitResult.test_results.map((t, i) => {
                        const tcNumber = t.test_case_number ?? i + 1;
                        const tcVerdict = !t.passed && t.not_evaluated ? "FAILED (not evaluated)" : t.passed ? "PASSED" : "FAILED";
                        return (
                          <div
                            key={t.test_case_id ?? i}
                            className={`cp-test-case ${t.passed ? "passed" : "failed"}`}
                          >
                            <div className="cp-test-case-row">
                              <span className="cp-test-case-name">
                                {t.is_hidden ? `Hidden Test Case ${tcNumber}` : `Test Case ${tcNumber}`}
                                <span className={`cp-test-case-verdict ${t.passed ? "is-passed" : "is-failed"}`}>
                                  — {tcVerdict}
                                </span>
                              </span>
                            </div>
                            {!t.is_hidden && !t.not_evaluated && (
                              <div className="cp-test-case-details">
                                <div className="cp-tc-detail">
                                  <span className="cp-tc-detail-label">Input:</span>
                                  <pre className="cp-tc-detail-value">{t.input || ""}</pre>
                                </div>
                                <div className="cp-tc-detail">
                                  <span className="cp-tc-detail-label">Expected Output:</span>
                                  <pre className="cp-tc-detail-value">{t.expected_output || ""}</pre>
                                </div>
                                <div className="cp-tc-detail">
                                  <span className="cp-tc-detail-label">Actual Output:</span>
                                  <pre className="cp-tc-detail-value">{t.actual_output || ""}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cp-test-results-empty">No test case results available.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
