import { useState } from "react";
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
} from "lucide-react";
import {
  coordinatorAssessments,
  coordinatorBatches,
  coordinatorQuizActivityLogs,
  coordinatorDetailedQuizScorecards,
  coordinatorStudents,
} from "../../../data/coordinatorMockData";
import "../Styles/Assessments.css";

export default function CoordinatorAssessments() {
  const [assessments, setAssessments] = useState(coordinatorAssessments);
  const [activityLogs, setActivityLogs] = useState(coordinatorQuizActivityLogs);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState("directory"); // 'directory', 'live_feed', 'analytics'
  const [modalTab, setModalTab] = useState("scorecard"); // 'scorecard', 'questions'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");

  // Create Quiz Form
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState(coordinatorBatches[0].name);
  const [type, setType] = useState("MCQ Quiz");
  const [dueDate, setDueDate] = useState("");

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.batch.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || a.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAssessment = {
      id: Date.now(),
      title,
      batch,
      type,
      dueDate: dueDate || "2026-09-10",
      submissions: "0 / 120",
      avgScore: "--",
      passRate: "--",
      status: "Active",
    };

    setAssessments([newAssessment, ...assessments]);
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
        <div>
          <h1 className="coord-page-title">Quiz Activity & Results Governance</h1>
          <p className="coord-page-sub">
            Monitor real-time student quiz submissions, batch scorecards, topic mastery, and question analytics.
          </p>
        </div>
        <div className="coord-header-actions">
          <button
            className="coord-btn coord-btn--csv"
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
      <div className="coord-stats-grid coord-tabs-bar--mb">
        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Active Quizzes</span>
            <div className="coord-stat-icon-bg coord-icon-blue">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="coord-stat-value">4 Active</div>
          <div className="coord-stat-subtext">Across 4 managed batches</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Submission Rate</span>
            <div className="coord-stat-icon-bg coord-icon-emerald">
              <Zap size={18} />
            </div>
          </div>
          <div className="coord-stat-value">91.2%</div>
          <div className="coord-stat-subtext">279 / 335 total attempts</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Avg Quiz Score</span>
            <div className="coord-stat-icon-bg coord-icon-purple">
              <Award size={18} />
            </div>
          </div>
          <div className="coord-stat-value coord-val-purple">
            84.5%
          </div>
          <div className="coord-stat-subtext">+3.2% vs last quiz</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-top">
            <span className="coord-stat-label">Retake Required</span>
            <div className="coord-stat-icon-bg coord-icon-rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="coord-stat-value coord-val-rose">
            14 Students
          </div>
          <div className="coord-stat-subtext">Scored &lt;60% cutoff</div>
        </div>
      </div>

      {/* Main Tabs Row */}
      <div className="coord-tabs-bar coord-tabs-bar--mb">
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
        <div className="coord-view-container">
          {/* Filters */}
          <div className="coord-filter-bar coord-filter-bar--mb">
            <div className="coord-search-wrap">
              <Search size={16} className="coord-search-icon" />
              <input
                type="text"
                className="coord-search-input coord-search-input--with-icon"
                placeholder="Search quiz title or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="coord-select"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            >
              <option value="All">All Batches</option>
              {coordinatorBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quizzes List */}
          <div className="coord-assessments-list">
            {filteredAssessments.map((a) => (
              <div key={a.id} className="coord-assessment-card">
                <div>
                  <div className="coord-assess-title-row">
                    <div className="coord-assess-title">{a.title}</div>
                    <span
                      className={
                        a.status === "Active"
                          ? "coord-status--active"
                          : a.status === "Completed"
                          ? "coord-status--completed"
                          : "coord-status--archived"
                      }
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="coord-assess-sub">
                    Target Batch: <strong className="coord-assess-batch-strong">{a.batch}</strong> · Type: {a.type} · Due: {a.dueDate}
                  </div>
                </div>

                <div className="coord-assess-stats-row">
                  <div className="coord-assess-stat-col">
                    <div className="coord-assess-stat-lbl">Submissions</div>
                    <div className="coord-assess-stat-num">{a.submissions}</div>
                  </div>

                  <div className="coord-assess-stat-col">
                    <div className="coord-assess-stat-lbl">Avg Score</div>
                    <div className="coord-assess-stat-num coord-val-indigo">{a.avgScore}</div>
                  </div>

                  <div className="coord-assess-stat-col">
                    <div className="coord-assess-stat-lbl">Pass Rate</div>
                    <div className="coord-assess-stat-num coord-val-emerald">{a.passRate}</div>
                  </div>

                  <button
                    className="coord-btn coord-btn--primary coord-btn--inspect"
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
          <div className="coord-card-title coord-live-header">
            <div className="coord-live-title-box">
              <Zap size={18} color="#2563eb" />
              Real-time Student Quiz Submission Stream
            </div>
            <span className="coord-live-indicator">● Live Ticker Active</span>
          </div>

          <div className="coord-live-feed-list">
            {activityLogs.map((log) => (
              <div key={log.id} className="quiz-activity-item">
                <div>
                  <div className="coord-log-name">{log.studentName}</div>
                  <div className="coord-log-meta">
                    Roll No: <strong>{log.rollNo}</strong> · {log.batch}
                  </div>
                  <div className="coord-log-quiz">
                    Quiz: {log.quizTitle}
                  </div>
                </div>

                <div className="coord-log-score-col">
                  <div className="coord-log-score-num">{log.score}</div>
                  <span className={log.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                    {log.status}
                  </span>
                  <div className="coord-log-time">
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
        <div className="coord-analytics-col">
          {/* Topic Mastery Radar Cards */}
          <div className="coord-card">
            <div className="coord-card-title">
              <BarChart2 size={18} color="#7c3aed" />
              Department Topic Mastery & Proficiency Audit
            </div>

            <div className="coord-topic-grid">
              <div className="coord-topic-card">
                <div className="coord-topic-name">Graph Theory & Shortest Path</div>
                <div className="coord-topic-acc coord-val-emerald">88% Accuracy</div>
                <div className="coord-topic-status">High Proficiency</div>
              </div>

              <div className="coord-topic-card">
                <div className="coord-topic-name">Topological Sorting & Kahn Algo</div>
                <div className="coord-topic-acc coord-val-amber">64% Accuracy</div>
                <div className="coord-topic-status coord-val-amber">Moderate Skill Gap</div>
              </div>

              <div className="coord-topic-card">
                <div className="coord-topic-name">Disjoint Set Union (Union-Find)</div>
                <div className="coord-topic-acc coord-val-emerald">92% Accuracy</div>
                <div className="coord-topic-status coord-val-emerald">Mastered</div>
              </div>

              <div className="coord-topic-card">
                <div className="coord-topic-name">Dynamic Programming Memoization</div>
                <div className="coord-topic-acc coord-val-rose">58% Accuracy</div>
                <div className="coord-topic-status coord-val-rose">Requires Tutorial Remediation</div>
              </div>
            </div>
          </div>

          {/* Hardest Questions Analysis */}
          <div className="coord-card">
            <div className="coord-card-title">
              <HelpCircle size={18} color="#e11d48" />
              Hardest Questions & Low Accuracy Alert
            </div>

            <div className="coord-hard-questions-list">
              <div className="question-analytic-box">
                <div className="coord-hard-q-header">
                  <span className="question-tag">Dynamic Programming</span>
                  <span className="coord-val-rose coord-hard-q-stat--rose">Only 42% Correct</span>
                </div>
                <div className="coord-hard-q-title">
                  Q: Space complexity difference between Bottom-Up Tabulation and Top-Down Memoization for 0/1 Knapsack
                </div>
                <div className="coord-hard-q-desc">
                  Common Mistake: 38% of students overlooked auxiliary recursion call stack memory depth.
                </div>
              </div>

              <div className="question-analytic-box">
                <div className="coord-hard-q-header">
                  <span className="question-tag">Topological Sort</span>
                  <span className="coord-hard-q-stat--amber">64% Correct</span>
                </div>
                <div className="coord-hard-q-title">
                  Q: Detecting cycles in Directed Acyclic Graphs (DAG) using In-Degree reduction
                </div>
                <div className="coord-hard-q-desc">
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
            <div className="coord-modal-head-row">
              <div>
                <h2 className="coord-modal-title">
                  {selectedQuiz.title} — Detailed Results
                </h2>
                <div className="coord-assess-sub">
                  Target Batch: <strong>{selectedQuiz.batch}</strong> · Submissions: <strong>{selectedQuiz.submissions}</strong>
                </div>
              </div>
              <button
                className="coord-modal-close-btn"
                onClick={() => setSelectedQuiz(null)}
              >
                ✕
              </button>
            </div>

            {/* Scorecard Quick Metrics */}
            <div className="coord-scorecard-metrics">
              <div className="coord-metric-box coord-metric-box--gray">
                <div className="coord-metric-lbl coord-assess-stat-lbl">Attempted</div>
                <div className="coord-metric-val">
                  {currentScorecard.attempted} / {currentScorecard.totalEnrolled}
                </div>
              </div>

              <div className="coord-metric-box coord-metric-box--blue">
                <div className="coord-metric-lbl coord-metric-lbl--blue">Average Score</div>
                <div className="coord-metric-val coord-metric-val--blue">{currentScorecard.avgScore}</div>
              </div>

              <div className="coord-metric-box coord-metric-box--emerald">
                <div className="coord-metric-lbl coord-val-emerald">Highest Score</div>
                <div className="coord-metric-val coord-metric-val--emerald">{currentScorecard.highestScore}</div>
              </div>

              <div className="coord-metric-box coord-metric-box--rose">
                <div className="coord-metric-lbl coord-val-rose">Passed Cutoff</div>
                <div className="coord-metric-val coord-metric-val--rose">
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
              <div className="coord-assessments-list">
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
                          <div className="coord-cell-main">{sub.name}</div>
                        </td>
                        <td>
                          <span className="coord-table-roll-text">{sub.rollNo}</span>
                        </td>
                        <td>
                          <span className={sub.score >= 70 ? "coord-table-score-pass" : "coord-table-score-fail"}>
                            {sub.score}%
                          </span>
                        </td>
                        <td>
                          <span className="coord-table-sub-count">{sub.correctCount}</span>
                        </td>
                        <td>
                          <span className="coord-table-sub-time">{sub.timeSpent}</span>
                        </td>
                        <td>
                          <span className={sub.status === "Passed" ? "quiz-pill-pass" : "quiz-pill-retake"}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.status !== "Passed" && (
                            <button
                              className="coord-btn coord-btn--retake"
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
              <div className="coord-hard-questions-list">
                {currentScorecard.questionAnalytics.map((q) => (
                  <div key={q.qNo} className="question-analytic-box">
                    <div className="coord-hard-q-header">
                      <span className="question-tag">{q.topic}</span>
                      <span className="coord-val-emerald coord-hard-q-stat--emerald">
                        {q.correctPct} Correct Answers
                      </span>
                    </div>
                    <div className="coord-q-title">
                      Q{q.qNo}: {q.text}
                    </div>
                    <div className="coord-q-meta">
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
            <h2 className="coord-modal-title">Publish New Quiz / Test</h2>
            <form onSubmit={handleCreate} className="coord-modal-form">
              <div>
                <label className="coord-form-label">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming & Recursion Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Target Batch</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="coord-form-input"
                >
                  {coordinatorBatches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="coord-form-label">Assessment Format</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="coord-form-input"
                >
                  <option value="MCQ Quiz">MCQ Quiz</option>
                  <option value="Coding Assessment">Coding Assessment</option>
                  <option value="Hands-on Project">Hands-on Project</option>
                </select>
              </div>

              <div>
                <label className="coord-form-label">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-modal-actions">
                <button type="button" className="coord-btn coord-btn--cancel" onClick={() => setShowCreateModal(false)}>
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
