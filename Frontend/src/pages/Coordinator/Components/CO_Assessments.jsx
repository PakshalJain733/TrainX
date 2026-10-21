import CustomSelect from "../../../components/ui/CustomSelect";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, FileCheck2, Award, Clock, Search, CheckCircle, AlertTriangle, Download, Users, BarChart2, Zap, BookOpen, Filter, CheckCircle2, XCircle, HelpCircle, Send, LineChart, Briefcase } from "lucide-react";
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
        <div className="coord-assess-header-left">
          <div className="coord-assess-icon-box">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h1 className="coord-page-title coord-assess-title">Quizzes & Assessments Governance</h1>
            <p className="coord-page-sub coord-assess-sub">
              Manage student MCQ quizzes, publish new tests, view live activity logs, and analyze scorecard performance.
            </p>
          </div>
        </div>

        <div className="coord-assess-header-actions">
          <button
            className="coord-btn coord-assess-btn-secondary"
            onClick={() => alert("Downloading Department Quiz Scorecard CSV...")}
          >
            <Download size={15} /> Export Scorecards CSV
          </button>
          <button className="add-quiz-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Quiz
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Active Quizzes</span>
            <div className="coord-stat-icon-bg coord-stat-icon--blue">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="coord-stat-value">4 Active</div>
          <div className="coord-stat-subtext">Across 4 managed batches</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Submission Rate</span>
            <div className="coord-stat-icon-bg coord-stat-icon--emerald">
              <Zap size={18} />
            </div>
          </div>
          <div className="coord-stat-value">91.2%</div>
          <div className="coord-stat-subtext">279 / 335 total attempts</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Avg Quiz Score</span>
            <div className="coord-stat-icon-bg coord-stat-icon--purple">
              <Award size={18} />
            </div>
          </div>
          <div className="coord-stat-value coord-stat-val--purple">
            84.5%
          </div>
          <div className="coord-stat-subtext">+3.2% vs last quiz</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Retake Required</span>
            <div className="coord-stat-icon-bg coord-stat-icon--rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="coord-stat-value coord-stat-val--rose">
            14 Students
          </div>
          <div className="coord-stat-subtext">Scored &lt;60% cutoff</div>
        </div>
      </div>

      {/* Main Tabs Row */}
      <div className="coord-tabs-bar">
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
        <div className="coord-assess-tab-col">
          {/* Filters */}
          <div className="coord-filter-bar">
            <div className="coord-assess-search-wrap">
              <Search size={16} className="coord-assess-search-icon" />
              <input
                type="text"
                placeholder="Search quiz title or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="coord-search-input coord-assess-search-input"
              />
            </div>

            <div className="coord-perf-filters-group coord-assess-filter-wrap">
            <CustomSelect
              value={batchFilter}
              onChange={setBatchFilter}
              options={[
                { value: "All", label: "All Batches" },
                ...batchesList.map((b) => ({ value: b.name, label: b.name })),
              ]}
            />
          </div>
          </div>

          {/* Quizzes List */}
          <div className="coord-assess-list-gap">
            {filteredAssessments.map((a) => (
              <div key={a.id} className="coord-assessment-card">
                <div>
                  <div className="coord-assess-card-title-row"><div className="coord-assess-card-name">{a.title}</div>
                    <span
                      className={`coord-assess-status-badge ${
                        a.status === "Active"
                          ? "coord-assess-status--active"
                          : a.status === "Completed"
                          ? "coord-assess-status--completed"
                          : "coord-assess-status--draft"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="coord-assess-card-sub">
                    Target Batch: <strong>{a.batch}</strong> · Type: {a.type} · Due: {a.dueDate}
                  </div>
                </div>

                <div className="assessment-stats-row">
                  <div className="assessment-stat-item"><div className="assessment-stat-label">Submissions</div><div className="assessment-stat-val">{a.submissions}</div></div>

                  <div className="assessment-stat-item"><div className="assessment-stat-label">Avg Score</div><div className="assessment-stat-val assessment-stat-val--indigo">{a.avgScore}</div></div>

                  <div className="assessment-stat-item"><div className="assessment-stat-label">Pass Rate</div><div className="assessment-stat-val assessment-stat-val--emerald">{a.passRate}</div></div>

                  <button
                    className="coord-btn coord-btn--primary assessment-action-btn"
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
          <div className="coord-card-title coord-card-title--between">
            <div className="coord-card-title-left">
              <Zap size={18} color="#2563eb" />
              Real-time Student Quiz Submission Stream
            </div>
            <span className="live-ticker-badge">● Live Ticker Active</span>
          </div>

          <div className="live-activity-list">
            {activityLogs.map((log) => (
              <div key={log.id} className="quiz-activity-item">
                <div>
                  <div className="live-activity-name">{log.studentName}</div>
                  <div className="live-activity-meta">
                    Roll No: <strong>{log.rollNo}</strong> · {log.batch}
                  </div>
                  <div className="live-activity-dept">
                    Quiz: {log.quizTitle}
                  </div>
                </div>

                <div className="live-activity-score-wrap">
                  <div className="live-activity-score">{log.score}</div>
                  <span className={log.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                    {log.status}
                  </span>
                  <div className="live-activity-time">
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
        <div className="coord-assess-analytics-grid">
          {/* Topic Mastery Radar Cards */}
          <div className="coord-card">
            <div className="coord-card-title">
              <BarChart2 size={18} color="#7c3aed" />
              Department Topic Mastery & Proficiency Audit
            </div>

            <div className="topic-mastery-grid">
              <div className="coord-assess-topic-card">
                <div className="coord-assess-topic-title">Graph Theory & Shortest Path</div>
                <div className="coord-assess-topic-val coord-assess-topic-val--emerald">88% Accuracy</div>
                <div className="coord-assess-topic-hint">High Proficiency</div>
              </div>

              <div className="coord-assess-topic-card">
                <div className="coord-assess-topic-title">Topological Sorting & Kahn Algo</div>
                <div className="coord-assess-topic-val coord-assess-topic-val--amber">64% Accuracy</div>
                <div className="coord-assess-topic-hint coord-assess-topic-hint--amber">Moderate Skill Gap</div>
              </div>

              <div className="coord-assess-topic-card">
                <div className="coord-assess-topic-title">Disjoint Set Union (Union-Find)</div>
                <div className="coord-assess-topic-val coord-assess-topic-val--emerald">92% Accuracy</div>
                <div className="coord-assess-topic-hint coord-assess-topic-hint--emerald">Mastered</div>
              </div>

              <div className="coord-assess-topic-card">
                <div className="coord-assess-topic-title">Dynamic Programming Memoization</div>
                <div className="coord-assess-topic-val coord-assess-topic-val--rose">58% Accuracy</div>
                <div className="coord-assess-topic-hint coord-assess-topic-hint--rose">Requires Tutorial Remediation</div>
              </div>
            </div>
          </div>

          {/* Hardest Questions Analysis */}
          <div className="coord-card">
            <div className="coord-card-title">
              <HelpCircle size={18} color="#e11d48" />
              Hardest Questions & Low Accuracy Alert
            </div>

            <div className="coord-assess-q-list">
              <div className="question-analytic-box">
                <div className="coord-assess-q-header">
                  <span className="question-tag">Dynamic Programming</span>
                  <span className="coord-assess-q-stat-rose">Only 42% Correct</span>
                </div>
                <div className="coord-assess-q-title">
                  Q: Space complexity difference between Bottom-Up Tabulation and Top-Down Memoization for 0/1 Knapsack
                </div>
                <div className="coord-assess-q-mistake">
                  Common Mistake: 38% of students overlooked auxiliary recursion call stack memory depth.
                </div>
              </div>

              <div className="question-analytic-box">
                <div className="coord-assess-q-header">
                  <span className="question-tag">Topological Sort</span>
                  <span className="coord-assess-q-stat-amber">64% Correct</span>
                </div>
                <div className="coord-assess-q-title">
                  Q: Detecting cycles in Directed Acyclic Graphs (DAG) using In-Degree reduction
                </div>
                <div className="coord-assess-q-mistake">
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
            <div className="coord-assess-modal-header">
              <div>
                <h2 className="coord-assess-modal-title">
                  {selectedQuiz.title} — Detailed Results
                </h2>
                <div className="coord-assess-modal-header-sub">
                  Target Batch: <strong>{selectedQuiz.batch}</strong> · Submissions: <strong>{selectedQuiz.submissions}</strong>
                </div>
              </div>
              <button
                className="modal-close-btn-ghost"
                onClick={() => setSelectedQuiz(null)}
              >
                ✕
              </button>
            </div>

            {/* Scorecard Quick Metrics */}
            <div className="coord-assess-modal-metrics">
              <div className="coord-assess-metric-box coord-assess-metric-box--slate">
                <div className="coord-assess-metric-label coord-assess-metric-label--slate">Attempted</div>
                <div className="coord-assess-metric-val coord-assess-metric-val--slate">
                  {currentScorecard.attempted} / {currentScorecard.totalEnrolled}
                </div>
              </div>

              <div className="coord-assess-metric-box coord-assess-metric-box--blue">
                <div className="coord-assess-metric-label coord-assess-metric-label--blue">Average Score</div>
                <div className="coord-assess-metric-val coord-assess-metric-val--blue">{currentScorecard.avgScore}</div>
              </div>

              <div className="coord-assess-metric-box coord-assess-metric-box--emerald">
                <div className="coord-assess-metric-label coord-assess-metric-label--emerald">Highest Score</div>
                <div className="coord-assess-metric-val coord-assess-metric-val--emerald">{currentScorecard.highestScore}</div>
              </div>

              <div className="coord-assess-metric-box coord-assess-metric-box--rose">
                <div className="coord-assess-metric-label coord-assess-metric-label--rose">Passed Cutoff</div>
                <div className="coord-assess-metric-val coord-assess-metric-val--rose">
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
              <div className="coord-assess-list-gap">
                <table className="coord-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Score %</th>
                      <th>Correct</th>
                      <th>Time Spent</th>
                      <th>Status</th>
                      <th className="coord-assess-td-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScorecard.studentSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <div className="coord-assess-student-name">{sub.name}</div>
                        </td>
                        <td>
                          <span className="coord-assess-student-roll">{sub.rollNo}</span>
                        </td>
                        <td>
                          <span className={sub.score >= 70 ? "coord-assess-score-pass" : "coord-assess-score-fail"}>
                            {sub.score}%
                          </span>
                        </td>
                        <td>
                          <span className="coord-assess-meta-sub">{sub.correctCount}</span>
                        </td>
                        <td>
                          <span className="coord-assess-meta-sub">{sub.timeSpent}</span>
                        </td>
                        <td>
                          <span className={sub.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="coord-assess-td-center">
                          {sub.status !== "Passed" && (
                            <button
                              className="coord-btn coord-assess-btn-retake"
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
              <div className="coord-assess-q-breakdown-list">
                {currentScorecard.questionAnalytics.map((q) => (
                  <div key={q.qNo} className="question-analytic-box">
                    <div className="coord-assess-q-header">
                      <span className="question-tag">{q.topic}</span>
                      <span className="coord-assess-q-breakdown-stat">
                        {q.correctPct} Correct Answers
                      </span>
                    </div>
                    <div className="coord-assess-q-breakdown-title">
                      Q{q.qNo}: {q.text}
                    </div>
                    <div className="coord-assess-q-breakdown-diff">
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
            <h2 className="coord-assess-modal-title">Publish New Quiz / Test</h2>
            <form onSubmit={handleCreate} className="assessment-create-form">
              <div>
                <label className="assessment-form-label">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming & Recursion Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="assessment-form-input"
                />
              </div>

              <div>
                <label className="assessment-form-label">Target Batch</label>
                <CustomSelect
                  value={batch}
                  onChange={setBatch}
                  options={[
                    { value: "All Batches", label: "All Batches" },
                    ...batchesList.map((b) => ({ value: b.name, label: b.name })),
                  ]}
                />
              </div>

              <div>
                <label className="assessment-form-label">Assessment Format</label>
                <CustomSelect
                  value={type}
                  onChange={setType}
                  options={[
                    { value: "MCQ Quiz", label: "MCQ Quiz" },
                    { value: "Coding Assessment", label: "Coding Assessment" },
                    { value: "Hands-on Project", label: "Hands-on Project" },
                  ]}
                />
              </div>

              <div>
                <label className="assessment-form-label">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="assessment-form-input"
                />
              </div>

              <div className="assessment-form-footer">
                <button type="button" className="coord-btn assessment-btn-cancel" onClick={() => setShowCreateModal(false)}>
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
