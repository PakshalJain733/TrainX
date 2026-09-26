import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  FileCheck2,
  Award,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  Download,
  Users,
  BarChart2,
  Zap,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  LineChart,
  Briefcase,
} from "lucide-react";
import {
  coordinatorAssessments,
  coordinatorBatches,
  coordinatorQuizActivityLogs,
  coordinatorDetailedQuizScorecards,
  coordinatorStudents,
} from "../../../data/coordinatorMockData";
import CoordinatorAttendance from "./CO_Attendance";
import CoordinatorPlacement from "./CO_Placement";
import "../Styles/CO_Assessments.css";

import { assessmentAPI, batchAPI } from "../../../services/api";
import { EVENTS, addSharedQuiz, getSharedQuizzes } from "../../../utils/sharedStore";

export default function CoordinatorAssessments() {
  const location = useLocation();

  const getInitialTab = () => {
    if (location.pathname.includes("attendance")) return "attendance";
    if (location.pathname.includes("placement")) return "placement";
    return "assessments";
  };

  const [mainTab, setMainTab] = useState(getInitialTab);
  const [assessments, setAssessments] = useState(coordinatorAssessments);
  const [batchesList, setBatchesList] = useState(coordinatorBatches);
  const [activityLogs, setActivityLogs] = useState(coordinatorQuizActivityLogs);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState("directory"); // 'directory', 'live_feed', 'analytics'
  const [modalTab, setModalTab] = useState("scorecard"); // 'scorecard', 'questions'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");

  // Create Quiz Form
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [type, setType] = useState("MCQ Quiz");
  const [dueDate, setDueDate] = useState("");

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        setBatchesList(data);
      }
    } catch (err) {
      console.warn("Using local batches fallback.");
    }
  };

  const fetchAssessments = async () => {
    try {
      const data = await assessmentAPI.getAssessments();
      const shared = await getSharedQuizzes([]);
      const dbAssessments = Array.isArray(data) ? data : [];
      const combined = [...dbAssessments, ...shared.map(s => ({
        id: s.id,
        title: s.title,
        batch: s.batch_name || s.data?.batch || "All Batches",
        type: s.data?.subject || "MCQ Quiz",
        dueDate: "2026-09-30",
        submissions: "0 / 120",
        avgScore: "--",
        passRate: "--",
        status: s.status || "Active",
      }))];
      if (combined.length > 0) {
        setAssessments(combined);
      }
    } catch (err) {
      console.warn("Using local assessments fallback data.");
    }
  };

  useEffect(() => {
    fetchAssessments();
    fetchBatches();

    const handleBatchUpdate = () => fetchBatches();
    const handleQuizUpdate = () => fetchAssessments();

    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    window.addEventListener(EVENTS.QUIZ_UPDATED, handleQuizUpdate);
    return () => {
      window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
      window.removeEventListener(EVENTS.QUIZ_UPDATED, handleQuizUpdate);
    };
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      (a.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.batch || a.batch_name || "").toLowerCase().includes(search.toLowerCase());
    const targetB = a.batch || a.batch_name || "All Batches";
    const matchesBatch = batchFilter === "All" || targetB === batchFilter || targetB === "All Batches";
    return matchesSearch && matchesBatch;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedBatchObj = batchesList.find(b => b.name === batch);

    const newAssessment = {
      id: Date.now(),
      title: title.trim(),
      batch: batch,
      batch_name: batch,
      batch_id: selectedBatchObj ? selectedBatchObj.id : null,
      type,
      dueDate: dueDate || "2026-09-10",
      submissions: "0 / 120",
      avgScore: "--",
      passRate: "--",
      status: "Active",
    };

    try {
      await addSharedQuiz({
        title: title.trim(),
        batch: batch,
        category: type,
        description: `Quiz for ${batch}`,
      });
      await assessmentAPI.createAssessment({
        title: title.trim(),
        batch_id: selectedBatchObj ? selectedBatchObj.id : null,
        batch_name: batch,
        category: type,
      });
      fetchAssessments();
    } catch (err) {
      setAssessments([newAssessment, ...assessments]);
    }

    setShowCreateModal(false);
    setTitle("");
  };

  const currentScorecard = selectedQuiz
    ? coordinatorDetailedQuizScorecards[selectedQuiz.id] || coordinatorDetailedQuizScorecards[1]
    : null;

  return (
    <div>
      {/* Top Header */}
      <div className="coord-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <FileCheck2 size={22} />
          </div>
          <div>
            <h1 className="coord-page-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Quizzes & Assessments Governance</h1>
            <p className="coord-page-sub" style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
              Manage student MCQ quizzes, publish new tests, view live activity logs, and analyze scorecard performance.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="coord-btn"
            style={{ background: "#f1f5f9", color: "#334155" }}
            onClick={() => alert("Downloading Department Quiz Scorecard CSV...")}
          >
            <Download size={15} /> Export Scorecards CSV
          </button>
          <button className="coord-btn coord-btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Publish New Quiz
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="coord-stats-grid" style={{ marginBottom: "20px" }}>
        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Active Quizzes</span>
            <div className="coord-stat-icon-bg" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="coord-stat-value">4 Active</div>
          <div className="coord-stat-subtext">Across 4 managed batches</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Submission Rate</span>
            <div className="coord-stat-icon-bg" style={{ background: "#ecfdf5", color: "#059669" }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="coord-stat-value">91.2%</div>
          <div className="coord-stat-subtext">279 / 335 total attempts</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Avg Quiz Score</span>
            <div className="coord-stat-icon-bg" style={{ background: "#faf5ff", color: "#9333ea" }}>
              <Award size={18} />
            </div>
          </div>
          <div className="coord-stat-value" style={{ color: "#7c3aed" }}>
            84.5%
          </div>
          <div className="coord-stat-subtext">+3.2% vs last quiz</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Retake Required</span>
            <div className="coord-stat-icon-bg" style={{ background: "#fff1f2", color: "#e11d48" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="coord-stat-value" style={{ color: "#e11d48" }}>
            14 Students
          </div>
          <div className="coord-stat-subtext">Scored &lt;60% cutoff</div>
        </div>
      </div>

      {/* Main Tabs Row */}
      <div className="coord-tabs-bar" style={{ marginBottom: "20px" }}>
        <button
          className={`coord-tab-btn ${activeTab === "directory" ? "coord-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("directory")}
        >
          <FileCheck2 size={15} /> Quiz Directory & Scorecards
        </button>
        <button
          className={`coord-tab-btn ${activeTab === "live_feed" ? "coord-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("live_feed")}
        >
          <Zap size={15} /> Live Submissions Feed ({activityLogs.length})
        </button>
        <button
          className={`coord-tab-btn ${activeTab === "analytics" ? "coord-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart2 size={15} /> Question Analytics & Topic Mastery
        </button>
      </div>

      {/* VIEW 1: QUIZ DIRECTORY & SCORECARDS */}
      {activeTab === "directory" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters */}
          <div className="coord-filter-bar" style={{ marginBottom: "8px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#64748b" }} />
              <input
                type="text"
                className="coord-search-input"
                placeholder="Search quiz title or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <select
              className="coord-select"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            >
              <option value="All">All Batches</option>
              {batchesList.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quizzes List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredAssessments.map((a) => (
              <div key={a.id} className="coord-assessment-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>{a.title}</div>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: a.status === "Active" ? "#eff6ff" : a.status === "Completed" ? "#ecfdf5" : "#f1f5f9",
                        color: a.status === "Active" ? "#1d4ed8" : a.status === "Completed" ? "#047857" : "#64748b",
                      }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Target Batch: <strong style={{ color: "#334155" }}>{a.batch}</strong> · Type: {a.type} · Due: {a.dueDate}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Submissions</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{a.submissions}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Avg Score</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#4f46e5" }}>{a.avgScore}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Pass Rate</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#059669" }}>{a.passRate}</div>
                  </div>

                  <button
                    className="coord-btn coord-btn--primary"
                    style={{ fontSize: "12px", padding: "8px 14px" }}
                    onClick={() => {
                      setSelectedQuiz(a);
                      setModalTab("scorecard");
                    }}
                  >
                    View Scorecard & Activity
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE SUBMISSIONS FEED */}
      {activeTab === "live_feed" && (
        <div className="coord-card">
          <div className="coord-card-title" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={18} color="#2563eb" />
              Real-time Student Quiz Submission Stream
            </div>
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: 700 }}>● Live Ticker Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
            {activityLogs.map((log) => (
              <div key={log.id} className="quiz-activity-item">
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{log.studentName}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Roll No: <strong>{log.rollNo}</strong> · {log.batch}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#4f46e5", marginTop: "4px" }}>
                    Quiz: {log.quizTitle}
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{log.score}</div>
                  <span className={log.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                    {log.status}
                  </span>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                    Time spent: {log.timeSpent} · {log.submittedAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: QUESTION ANALYTICS & TOPIC MASTERY */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Topic Mastery Radar Cards */}
          <div className="coord-card">
            <div className="coord-card-title">
              <BarChart2 size={18} color="#7c3aed" />
              Department Topic Mastery & Proficiency Audit
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Graph Theory & Shortest Path</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>88% Accuracy</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>High Proficiency</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Topological Sorting & Kahn Algo</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>64% Accuracy</div>
                <div style={{ fontSize: "11px", color: "#d97706", marginTop: "4px" }}>Moderate Skill Gap</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Disjoint Set Union (Union-Find)</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>92% Accuracy</div>
                <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Mastered</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Dynamic Programming Memoization</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#e11d48", marginTop: "2px" }}>58% Accuracy</div>
                <div style={{ fontSize: "11px", color: "#e11d48", marginTop: "4px" }}>Requires Tutorial Remediation</div>
              </div>
            </div>
          </div>

          {/* Hardest Questions Analysis */}
          <div className="coord-card">
            <div className="coord-card-title">
              <HelpCircle size={18} color="#e11d48" />
              Hardest Questions & Low Accuracy Alert
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <div className="question-analytic-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="question-tag">Dynamic Programming</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#e11d48" }}>Only 42% Correct</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                  Q: Space complexity difference between Bottom-Up Tabulation and Top-Down Memoization for 0/1 Knapsack
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Common Mistake: 38% of students overlooked auxiliary recursion call stack memory depth.
                </div>
              </div>

              <div className="question-analytic-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="question-tag">Topological Sort</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706" }}>64% Correct</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                  Q: Detecting cycles in Directed Acyclic Graphs (DAG) using In-Degree reduction
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Common Mistake: Confused Undirected DFS visited array with Directed recursion stack tracking.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED QUIZ RESULTS & SCORECARD MODAL */}
      {selectedQuiz && currentScorecard && (
        <div className="coord-modal-backdrop" onClick={() => setSelectedQuiz(null)}>
          <div className="coord-modal coord-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {selectedQuiz.title} — Detailed Results
                </h2>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Target Batch: <strong>{selectedQuiz.batch}</strong> · Submissions: <strong>{selectedQuiz.submissions}</strong>
                </div>
              </div>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}
                onClick={() => setSelectedQuiz(null)}
              >
                ✕
              </button>
            </div>

            {/* Scorecard Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Attempted</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  {currentScorecard.attempted} / {currentScorecard.totalEnrolled}
                </div>
              </div>

              <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#1d4ed8" }}>Average Score</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e40af" }}>{currentScorecard.avgScore}</div>
              </div>

              <div style={{ background: "#ecfdf5", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#047857" }}>Highest Score</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#065f46" }}>{currentScorecard.highestScore}</div>
              </div>

              <div style={{ background: "#fff1f2", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#be123c" }}>Passed Cutoff</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#9f1239" }}>
                  {currentScorecard.passedCount} Students
                </div>
              </div>
            </div>

            {/* Modal Internal Tabs */}
            <div className="coord-tabs-bar">
              <button
                className={`coord-tab-btn ${modalTab === "scorecard" ? "coord-tab-btn--active" : ""}`}
                onClick={() => setModalTab("scorecard")}
              >
                <Users size={14} /> Student Scorecard List
              </button>
              <button
                className={`coord-tab-btn ${modalTab === "questions" ? "coord-tab-btn--active" : ""}`}
                onClick={() => setModalTab("questions")}
              >
                <HelpCircle size={14} /> Question-by-Question Breakdown
              </button>
            </div>

            {/* TAB 1: STUDENT SCORECARD LIST */}
            {modalTab === "scorecard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <table className="coord-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Score %</th>
                      <th>Correct</th>
                      <th>Time Spent</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScorecard.studentSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{sub.name}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: "#64748b" }}>{sub.rollNo}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: sub.score >= 70 ? "#059669" : "#dc2626" }}>
                            {sub.score}%
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "#334155" }}>{sub.correctCount}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{sub.timeSpent}</span>
                        </td>
                        <td>
                          <span className={sub.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {sub.status !== "Passed" && (
                            <button
                              className="coord-btn"
                              style={{ padding: "4px 8px", fontSize: "11px", background: "#fff1f2", color: "#be123c" }}
                              onClick={() => alert(`Retake notification dispatched to ${sub.name}`)}
                            >
                              Send Retake
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: QUESTION BREAKDOWN */}
            {modalTab === "questions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentScorecard.questionAnalytics.map((q) => (
                  <div key={q.qNo} className="question-analytic-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="question-tag">{q.topic}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
                        {q.correctPct} Correct Answers
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                      Q{q.qNo}: {q.text}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Difficulty Level: <strong>{q.difficulty}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Publish New Quiz / Test</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming & Recursion Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Target Batch</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="All Batches">All Batches</option>
                  {batchesList.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Assessment Format</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="MCQ Quiz">MCQ Quiz</option>
                  <option value="Coding Assessment">Coding Assessment</option>
                  <option value="Hands-on Project">Hands-on Project</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" className="coord-btn" style={{ background: "#f1f5f9" }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn coord-btn--primary">
                  Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
