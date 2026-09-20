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
import CoordinatorAttendance from "./Attendance";
import CoordinatorPlacement from "./Placement";
import "../Styles/Assessments.css";

import { assessmentAPI } from "../../../services/api";
import { apiFetch } from "../../../utils/api";

export default function CoordinatorAssessments() {
  const location = useLocation();

  const getInitialTab = () => {
    if (location.pathname.includes("attendance")) return "attendance";
    if (location.pathname.includes("placement")) return "placement";
    return "assessments";
  };

  const [mainTab, setMainTab] = useState(getInitialTab);
  const [assessments, setAssessments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState("directory"); // 'directory', 'live_feed', 'analytics'
  const [modalTab, setModalTab] = useState("scorecard"); // 'scorecard', 'questions'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");

  // Create Quiz Form
  const [title, setTitle] = useState("");
  const [newBatchId, setNewBatchId] = useState("");
  const [type, setType] = useState("MCQ Quiz");
  const [dueDate, setDueDate] = useState("");

  const normalizeAssessment = (a) => ({
    id: a.id,
    title: a.title || "Untitled Assessment",
    batch: a.batch_name || "All Batches",
    type: a.type || a.category || "MCQ Quiz",
    dueDate: a.due_date ? String(a.due_date).slice(0, 10) : "—",
    status:
      a.status === "published"
        ? "Active"
        : a.status === "completed"
        ? "Completed"
        : a.status === "draft"
        ? "Draft"
        : a.status || "Draft",
    passPercentage: Number(a.pass_marks) > 0 ? Math.round((Number(a.pass_marks) / Number(a.total_marks || 1)) * 100) : 60,
    submissions: "—",
    avgScore: "—",
    passRate: "—",
  });

  const enrichWithResults = async (a) => {
    let results = [];
    try {
      const r = await apiFetch(`/assessments/${a.id}/results`);
      if (r && Array.isArray(r.data)) results = r.data;
    } catch (err) {
      results = [];
    }
    const scores = results.map((s) => Number(s.percentage) || 0);
    const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;
    const passed = results.filter((s) => (Number(s.percentage) || 0) >= a.passPercentage).length;
    return {
      ...a,
      submissions: String(results.length),
      avgScore: avg == null ? "—" : `${avg}%`,
      passRate: results.length ? `${Math.round((passed / results.length) * 100)}%` : "—",
      _results: results,
      _avg: avg,
      _passed: passed,
    };
  };

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const [batchRes, data] = await Promise.all([
        apiFetch("/coordinator/batches"),
        assessmentAPI.getAssessments().catch(() => []),
      ]);
      const bch = (batchRes && batchRes.data && Array.isArray(batchRes.data.batches)) ? batchRes.data.batches : [];
      setBatches(bch);
      if (bch.length > 0) setNewBatchId(String(bch[0].id));
      const list = Array.isArray(data) ? data : [];
      const normalized = await Promise.all(list.map((a) => enrichWithResults(normalizeAssessment(a))));
      setAssessments(normalized);
      setActivityLogs(
        normalized.flatMap((a) =>
          (a._results || []).map((r) => ({
            id: r.id,
            studentName: r.student_name || "Student",
            rollNo: r.roll_number || `R-${r.user_id}`,
            batch: r.batch_name || a.batch || "—",
            quizTitle: a.title,
            score: `${r.percentage}%`,
            status: (Number(r.percentage) || 0) >= a.passPercentage ? "Passed" : "Retake",
            timeSpent: "—",
            submittedAt: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—",
          }))
        )
      );
    } catch (err) {
      setAssessments([]);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.batch.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || a.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await assessmentAPI.createAssessment({
        title: title.trim(),
        category: type,
        batch_id: newBatchId ? Number(newBatchId) : null,
        due_date: dueDate,
        description: "",
      });
      fetchAssessments();
    } catch (err) {
      alert(err.message || "Failed to publish quiz");
    }

    setShowCreateModal(false);
    setTitle("");
  };

  const openScorecard = async (a) => {
    setSelectedQuiz(a);
    setModalTab("scorecard");
    try {
      const r = await apiFetch(`/assessments/${a.id}/results`);
      const results = (r && Array.isArray(r.data)) ? r.data : [];
      const scores = results.map((s) => Number(s.percentage) || 0);
      const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;
      const highest = scores.length ? Math.max(...scores) : 0;
      const passed = results.filter((s) => (Number(s.percentage) || 0) >= a.passPercentage).length;
      setSelectedQuiz((prev) => ({
        ...(prev || a),
        attempted: results.length,
        totalEnrolled: results.length,
        avgScore: `${avg}%`,
        highestScore: `${highest}%`,
        passedCount: passed,
        studentSubmissions: results.map((s) => ({
          id: s.id,
          name: s.student_name || "Student",
          rollNo: s.roll_number || `R-${s.user_id}`,
          score: Number(s.percentage) || 0,
          correctCount: s.correct_count || 0,
          timeSpent: "—",
          status: (Number(s.percentage) || 0) >= a.passPercentage ? "Passed" : "Needs Retake",
        })),
        questionAnalytics: [],
      }));
    } catch (err) {
      setSelectedQuiz((prev) => ({
        ...(prev || a),
        attempted: 0,
        totalEnrolled: 0,
        avgScore: "—",
        highestScore: "—",
        passedCount: 0,
        studentSubmissions: [],
        questionAnalytics: [],
      }));
    }
  };

  const currentScorecard = selectedQuiz;

  return (
    <div>
      {/* Top Header */}
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Quizzes & Assessments Governance</h1>
          <p className="coord-page-sub">
            Manage student MCQ quizzes, publish new tests, view live activity logs, and analyze scorecard performance.
          </p>
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
            <span className="coord-stat-label">Published Quizzes</span>
            <div className="coord-stat-icon-bg" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="coord-stat-value">{assessments.length} Total</div>
          <div className="coord-stat-subtext">Across your college</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Total Attempts</span>
            <div className="coord-stat-icon-bg" style={{ background: "#ecfdf5", color: "#059669" }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="coord-stat-value">{activityLogs.length}</div>
          <div className="coord-stat-subtext">Recorded submissions</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Avg Quiz Score</span>
            <div className="coord-stat-icon-bg" style={{ background: "#faf5ff", color: "#9333ea" }}>
              <Award size={18} />
            </div>
          </div>
          <div className="coord-stat-value" style={{ color: "#7c3aed" }}>
            {(() => {
              const scores = assessments.map((a) => a._avg).filter((v) => v != null);
              return scores.length ? `${Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)}%` : "—";
            })()}
          </div>
          <div className="coord-stat-subtext">Across all quizzes</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Retake Required</span>
            <div className="coord-stat-icon-bg" style={{ background: "#fff1f2", color: "#e11d48" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="coord-stat-value" style={{ color: "#e11d48" }}>
            {activityLogs.filter((l) => l.status !== "Passed").length} Students
          </div>
          <div className="coord-stat-subtext">Below pass cutoff</div>
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
              {batches.map((b) => (
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
                    onClick={() => openScorecard(a)}
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
          {/* Topic Mastery */}
          <div className="coord-card">
            <div className="coord-card-title">
              <BarChart2 size={18} color="#7c3aed" />
              Department Topic Mastery & Proficiency Audit
            </div>

            {activityLogs.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                No submissions yet — topic-level accuracy analytics will appear as students complete quizzes.
              </div>
            ) : (
              <div style={{ padding: "16px 0", color: "#64748b", fontSize: 13 }}>
                Question-by-question analytics are computed per assessment from its scorecard. Open any quiz and use
                the "Question-by-Question Breakdown" tab.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAILED QUIZ RESULTS & SCORECARD MODAL */}
      {selectedQuiz && (
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
                      <th>Action</th>
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
                        <td>
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
                {currentScorecard.questionAnalytics.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    Per-question accuracy data is not available yet for this assessment.
                  </div>
                ) : (
                  currentScorecard.questionAnalytics.map((q) => (
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
                  ))
                )}
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
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
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
