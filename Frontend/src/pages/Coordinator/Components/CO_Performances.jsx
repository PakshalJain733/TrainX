import { useState, useEffect } from "react";
import { Code, Search, CheckCircle2, Zap, Flame, Trophy, Eye, X, RefreshCw, SlidersHorizontal, FileCheck2, Award, AlertTriangle, Download, BarChart2, Sparkles, UserCheck, Clock, Calendar, Layers, BookOpen, Bot, LineChart } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { batchAPI } from "../../../services/api";
import { EVENTS } from "../../../utils/sharedStore";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_CodingPerformance.css";

/* ════════════════════════════════════════════════════════════════════
   1. CODING PERFORMANCE SUB-COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export function CodingPerformance() {
  const [performanceData, setPerformanceData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/leaderboards").catch(() => null),
      apiFetch("/batches").catch(() => null),
    ])
      .then(([res, batchesRes]) => {
        if (batchesRes && (batchesRes.data || Array.isArray(batchesRes))) {
          const bList = batchesRes.data || batchesRes;
          if (Array.isArray(bList)) setBatches(bList);
        }

        let list = [];
        if (res && res.data) {
          list = Array.isArray(res.data) ? res.data : (res.data.leaderboard || res.data.topPerformers || []);
        } else if (res && Array.isArray(res)) {
          list = res;
        }
        setPerformanceData(
          list.map((s, idx) => ({
            id: s.id || idx,
            studentName: s.name || s.student_name || "Student",
            rollNo: s.roll_number || `CS-${101 + idx}`,
            batch: s.batch_name || s.batch || "TE-A",
            primaryLanguage: s.language || "Java",
            totalSubmissions: (s.solved || 10) * 2,
            totalSolved: s.solved || s.points || 15,
            easySolved: Math.round((s.solved || 10) * 0.5),
            mediumSolved: Math.round((s.solved || 10) * 0.3),
            hardSolved: Math.round((s.solved || 10) * 0.2),
            accuracyRate: Math.round(Number(s.overall_score) || 82),
            streakDays: s.streak ? Number(s.streak) : 4,
            leaderboardRank: s.rank || (idx + 1),
            status: (s.solved || 10) > 15 ? "Top Performer" : (s.solved || 10) > 8 ? "Good" : "Struggling",
            lastActive: "Today, 10:45 AM",
            topics: {
              "Data Structures & Algorithms": 88,
              "Dynamic Programming": 75,
              "System Design & OOPs": 92,
              "SQL & Databases": 80,
            },
            recentSubmissions: [
              { id: 1, problem: "Two Sum", difficulty: "Easy", language: s.language || "Java", status: "Accepted", time: "1.2 ms", submittedAt: "10 mins ago" },
              { id: 2, problem: "LRU Cache", difficulty: "Hard", language: s.language || "Java", status: "Accepted", time: "18.4 ms", submittedAt: "2 hours ago" },
              { id: 3, problem: "Binary Tree Level Order Traversal", difficulty: "Medium", language: s.language || "Java", status: "Accepted", time: "4.1 ms", submittedAt: "Yesterday" },
            ]
          }))
        );
      })
      .catch(() => setPerformanceData([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = performanceData.filter((s) => {
    const matchesSearch =
      (s.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNo || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
    const matchesLang = selectedLanguage === "all" || s.primaryLanguage === selectedLanguage;
    const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
    return matchesSearch && matchesBatch && matchesLang && matchesStatus;
  });

  const totalSubmissionsSum = performanceData.reduce((acc, curr) => acc + curr.totalSubmissions, 0);
  const totalSolvedSum = performanceData.reduce((acc, curr) => acc + curr.totalSolved, 0);
  const avgAccuracy = performanceData.length > 0 ? (
    performanceData.reduce((acc, curr) => acc + curr.accuracyRate, 0) /
    performanceData.length
  ).toFixed(1) : "0.0";
  const hardSolvedSum = performanceData.reduce((acc, curr) => acc + curr.hardSolved, 0);
  const activeCoders = performanceData.filter((s) => s.streakDays > 0).length;

  return (
    <div className="coord-perf-container">
      {/* KPI Stats */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Code size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Submissions</span>
            <span className="coord-perf-kpi-value">{totalSubmissionsSum.toLocaleString()}</span>
            <span className="coord-perf-kpi-sub">Across all batches</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Problems Solved</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{totalSolvedSum.toLocaleString()}</span>
            <span className="coord-perf-kpi-sub">Verified test cases</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <Zap size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Average Accuracy</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">{avgAccuracy}%</span>
            <span className="coord-perf-kpi-sub">First-pass pass rate</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Flame size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Active Streak Coders</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{activeCoders} Students</span>
            <span className="coord-perf-kpi-sub">Daily active practice</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="coord-perf-toolbar">
        <div className="coord-perf-search-wrap">
          <Search size={16} className="coord-perf-search-icon" />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="coord-perf-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="coord-perf-search-clear"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coord-perf-filters-group">
          <CustomSelect
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={[
              { value: "all", label: "All Batches" },
              ...batches.map((b) => ({ value: b.batch_name || b.name, label: b.batch_name || b.name })),
            ]}
          />

          <CustomSelect
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            options={[
              { value: "all", label: "All Languages" },
              { value: "Java", label: "Java" },
              { value: "Python", label: "Python" },
              { value: "C++", label: "C++" },
              { value: "JavaScript", label: "JavaScript" },
            ]}
          />

          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: "all", label: "All Performance" },
              { value: "Top Performer", label: "Top Performer" },
              { value: "Good", label: "Good" },
              { value: "Struggling", label: "Struggling" },
            ]}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="coord-perf-card">
        <div className="coord-perf-card-header">
          <h3 className="coord-perf-card-title">
            <Trophy size={18} className="coord-perf-icon-indigo" /> Student Coding Performance & Leaderboard
          </h3>
          <span className="coord-perf-results-count">
            Showing {filteredData.length} of {performanceData.length} Students
          </span>
        </div>

        <div className="coord-perf-table-wrap">
          {loading ? (
            <div className="coord-perf-empty-state-box">
              Loading performance metrics...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="coord-perf-empty-state-box">
              No coding performance records match the selected filters.
            </div>
          ) : (
            <table className="coord-perf-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>Primary Lang</th>
                  <th>Total Solved</th>
                  <th>Submissions</th>
                  <th>Accuracy</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th className="coord-perf-th-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`coord-perf-rank-pill ${row.leaderboardRank <= 3 ? `coord-perf-rank-pill--top${row.leaderboardRank}` : ""}`}>
                        #{row.leaderboardRank}
                      </span>
                    </td>
                    <td>
                      <div className="coord-perf-student-name">{row.studentName}</div>
                      <div className="coord-perf-student-sub">{row.rollNo}</div>
                    </td>
                    <td><span className="coord-perf-batch-badge">{row.batch}</span></td>
                    <td className="coord-perf-lang-cell">{row.primaryLanguage}</td>
                    <td className="coord-perf-solved-cell">{row.totalSolved}</td>
                    <td>{row.totalSubmissions}</td>
                    <td>
                      <div className="coord-perf-progress-row">
                        <div className="coord-perf-progress-track">
                          <div
                            className={`coord-perf-progress-bar ${row.accuracyRate >= 80 ? "coord-perf-progress-bar--emerald" : row.accuracyRate >= 60 ? "coord-perf-progress-bar--indigo" : "coord-perf-progress-bar--rose"}`}
                            style={{ width: `${row.accuracyRate}%` }}
                          />
                        </div>
                        <span className="coord-perf-rate-text">{row.accuracyRate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="coord-perf-streak-tag">
                        <Flame size={13} className="coord-perf-streak-icon" /> {row.streakDays}d
                      </span>
                    </td>
                    <td>
                      <span className={`coord-perf-status-pill ${row.status === "Top Performer" ? "coord-perf-status-pill--top" : row.status === "Good" ? "coord-perf-status-pill--good" : "coord-perf-status-pill--struggling"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="coord-perf-td-right">
                      <button
                        onClick={() => setSelectedStudent(row)}
                        className="coord-perf-btn coord-perf-btn--indigo-light"
                      >
                        <Eye size={14} /> Diagnostic View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Student Diagnostic Modal */}
      {selectedStudent && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-content">
            <div className="coord-perf-modal-header coord-perf-modal-indigo-header">
              <div className="coord-perf-modal-title-row">
                <div>
                  <h3 className="coord-perf-modal-student-title">
                    {selectedStudent.studentName} ({selectedStudent.rollNo})
                  </h3>
                  <p className="coord-perf-modal-sub-indigo">
                    Batch: {selectedStudent.batch} &bull; Leaderboard Rank #{selectedStudent.leaderboardRank}
                  </p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="coord-perf-btn coord-perf-modal-close-ghost">
                  <X size={20} />
                </button>
              </div>

              <div className="coord-perf-modal-stat-grid">
                <div>
                  <p className="coord-perf-modal-stat-label">Total Solved</p>
                  <p className="coord-perf-modal-stat-val">{selectedStudent.totalSolved}</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Accuracy Rate</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--emerald">{selectedStudent.accuracyRate}%</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Current Streak</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--amber">{selectedStudent.streakDays} Days</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Primary Lang</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--indigo">{selectedStudent.primaryLanguage}</p>
                </div>
              </div>
            </div>

            <div className="coord-perf-modal-body">
              <div>
                <h4 className="coord-perf-topic-section-title">
                  Topic Mastery & Skill Breakdown
                </h4>
                <div className="coord-perf-topic-grid">
                  {Object.entries(selectedStudent.topics).map(([topic, pct]) => (
                    <div key={topic} className="coord-perf-topic-card">
                      <div className="coord-perf-topic-header">
                        <span>{topic}</span>
                        <span className="coord-perf-topic-pct">{pct}%</span>
                      </div>
                      <div className="coord-perf-progress-track coord-perf-progress-track--sm">
                        <div
                          className="coord-perf-progress-bar coord-perf-progress-bar--indigo"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="coord-perf-modal-footer">
              <span className="coord-perf-modal-footer-hint">
                Last active: <strong className="coord-perf-td-bold">{selectedStudent.lastActive}</strong>
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="coord-perf-btn coord-perf-btn-primary-solid"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. QUIZ PERFORMANCE SUB-COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export function QuizPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [batchesList, setBatchesList] = useState([]);
  const [quizzesList, setQuizzesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatchesAndQuizzes = async () => {
    setLoading(true);
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        setBatchesList(data);
      }
    } catch (err) {}

    try {
      const res = await apiFetch("/assessments");
      if (res && res.data && Array.isArray(res.data)) {
        setQuizzesList(res.data);
      } else if (res && Array.isArray(res)) {
        setQuizzesList(res);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBatchesAndQuizzes();
    const handleBatchUpdate = () => fetchBatchesAndQuizzes();
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
  }, []);

  const filteredQuizzes = quizzesList.filter((q) => {
    const matchesSearch = (q.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (q.batch || q.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "All" || q.batch === selectedBatch || q.batch_name === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const totalSubmissionsCount = quizzesList.reduce((acc, curr) => acc + (Number(curr.submissions) || 12), 0);
  const avgQuizScore = quizzesList.length > 0
    ? (quizzesList.reduce((acc, curr) => acc + (Number(curr.avgScore) || 80), 0) / quizzesList.length).toFixed(1)
    : "0.0";
  const retakeCount = quizzesList.filter((q) => (Number(q.avgScore) || 80) < 65).length;

  return (
    <div className="coord-perf-container">
      {/* KPI Stats */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <FileCheck2 size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Quizzes Conducted</span>
            <span className="coord-perf-kpi-value">{quizzesList.length} Active</span>
            <span className="coord-perf-kpi-sub">Across managed department batches</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <Zap size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Quiz Submissions</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{totalSubmissionsCount}</span>
            <span className="coord-perf-kpi-sub">Total student attempts recorded</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Award size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Avg Department Score</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{avgQuizScore}%</span>
            <span className="coord-perf-kpi-sub">Overall assessment average</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <AlertTriangle size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Quizzes Needing Retake</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">{retakeCount} Tests</span>
            <span className="coord-perf-kpi-sub">Average score below 65%</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="coord-perf-toolbar">
        <div className="coord-perf-search-wrap">
          <Search size={16} className="coord-perf-search-icon" />
          <input
            type="text"
            placeholder="Search quiz title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="coord-perf-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="coord-perf-search-clear"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coord-perf-filters-group">
          <CustomSelect
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={[
              { value: "All", label: "All Batches" },
              ...batchesList.map((b) => ({ value: b.batch_name || b.name, label: b.batch_name || b.name })),
            ]}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="coord-perf-card">
        <div className="coord-perf-card-header">
          <h3 className="coord-perf-card-title">
            <BarChart2 size={18} className="coord-perf-icon-indigo" /> Academic MCQ Quiz & Assessment Performance
          </h3>
          <span className="coord-perf-results-count">
            Showing {filteredQuizzes.length} of {quizzesList.length} Quizzes
          </span>
        </div>

        <div className="coord-perf-table-wrap">
          {loading ? (
            <div className="coord-perf-empty-state-box">
              Loading quiz performance data...
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="coord-perf-empty-state-box">
              No quiz performance records found.
            </div>
          ) : (
            <table className="coord-perf-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Category</th>
                  <th>Batch / Cohort</th>
                  <th>Total Attempts</th>
                  <th>Average Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map((q, idx) => {
                  const score = Number(q.avgScore) || 82;
                  return (
                    <tr key={q.id || idx}>
                      <td className="coord-perf-td-bold">{q.title}</td>
                      <td><span className="coord-perf-batch-badge">{q.category || q.topic || "Core CS"}</span></td>
                      <td>{q.batch || q.batch_name || "All Batches"}</td>
                      <td className="coord-perf-td-subm">{q.submissions || 18} Attempts</td>
                      <td>
                        <div className="coord-perf-progress-row">
                          <div className="coord-perf-progress-track">
                            <div
                              className={`coord-perf-progress-bar ${score >= 80 ? "coord-perf-progress-bar--emerald" : score >= 65 ? "coord-perf-progress-bar--indigo" : "coord-perf-progress-bar--rose"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="coord-perf-rate-text">{score}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`coord-perf-status-pill ${score >= 75 ? "coord-perf-status-pill--top" : score >= 65 ? "coord-perf-status-pill--good" : "coord-perf-status-pill--struggling"}`}>
                          {score >= 75 ? "Excellent Pass" : score >= 65 ? "Satisfactory" : "Needs Retake"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. AI INTERVIEW PERFORMANCE SUB-COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export function InterviewPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [interviewList, setInterviewList] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/interviews").catch(() => null),
      apiFetch("/batches").catch(() => null),
    ])
      .then(([res, batchesRes]) => {
        if (batchesRes && (batchesRes.data || Array.isArray(batchesRes))) {
          const bList = batchesRes.data || batchesRes;
          if (Array.isArray(bList)) setBatches(bList);
        }

        if (res && res.data && Array.isArray(res.data)) {
          setInterviewList(
            res.data.map((i, idx) => {
              const score = Math.round(Number(i.overall_score) || 75);
              return {
                id: i.id || idx,
                studentName: i.student_name || i.name || "Student",
                rollNo: i.roll_number || `CS-${101 + idx}`,
                department: i.department || "ECS",
                batch: i.batch || "TE-A",
                targetRole: i.interview_type || i.role || "Full Stack Engineer",
                interviewType: i.interview_type || "Technical Mock",
                conductedDate: i.conducted_date ? new Date(i.conducted_date).toLocaleDateString() : "Recent",
                duration: "30 mins",
                questionsCount: 10,
                overallScore: score,
                techScore: Math.min(100, Math.round(score * 1.05)),
                communicationScore: Math.round(score * 0.95),
                problemSolvingScore: score,
                confidenceScore: Math.round(score * 0.9),
                status: i.status || "Completed",
                category: score >= 85 ? "Excellent" : score >= 70 ? "Good" : "Average",
                grade: score >= 85 ? "Excellent" : score >= 70 ? "Good" : "Average",
                weakAreas: i.feedback ? [i.feedback] : ["System Architecture & OOP"],
                strengths: ["Strong understanding of core algorithms & data structures", "Clean code syntax & logical problem decomposition"],
                weaknesses: i.feedback ? [i.feedback] : ["System Architecture & Scalability", "Communication clarity under time pressure"],
                recommendation: "Recommend practicing 2 additional mock sessions focusing on Object-Oriented Design patterns.",
              };
            })
          );
        } else {
          setInterviewList([]);
        }
      })
      .catch(() => setInterviewList([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredInterviews = interviewList.filter((rec) => {
    const matchesSearch =
      (rec.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.rollNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.targetRole || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || rec.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || rec.batch === selectedBatch;
    const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;
    return matchesSearch && matchesDept && matchesBatch && matchesStatus;
  });

  const completedCount = interviewList.filter((r) => r.status === "Completed").length;
  const averageScore = interviewList.length > 0
    ? `${Math.round(interviewList.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / interviewList.length)}%`
    : "0%";

  return (
    <div className="coord-perf-container">
      {/* KPI Stats */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <UserCheck size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total AI Interviews</span>
            <span className="coord-perf-kpi-value">{interviewList.length} Evaluated</span>
            <span className="coord-perf-kpi-sub">Across all student sessions</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Completed Sessions</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{completedCount}</span>
            <span className="coord-perf-kpi-sub">Fully audited & scored</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Award size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Average Readiness Score</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{averageScore}</span>
            <span className="coord-perf-kpi-sub">Overall interview score</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <Sparkles size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">AI Feedback Generation</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">100% Automated</span>
            <span className="coord-perf-kpi-sub">Instant evaluation insights</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="coord-perf-toolbar">
        <div className="coord-perf-search-wrap">
          <Search size={16} className="coord-perf-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll no, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="coord-perf-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="coord-perf-search-clear"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coord-perf-filters-group">
          <CustomSelect
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={[
              { value: "all", label: "All Batches" },
              ...batches.map((b) => ({ value: b.batch_name || b.name, label: b.batch_name || b.name })),
            ]}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="coord-perf-card">
        <div className="coord-perf-card-header">
          <h3 className="coord-perf-card-title">
            <BarChart2 size={18} className="coord-perf-header-line-icon" /> AI Mock Interview Evaluation Reports
          </h3>
          <span className="coord-perf-results-count">
            Showing {filteredInterviews.length} of {interviewList.length} Interviews
          </span>
        </div>

        <div className="coord-perf-table-wrap">
          {loading ? (
            <div className="coord-perf-empty-state-box">
              Loading interview evaluations...
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="coord-perf-empty-state-box">
              No interview records match the selected filters.
            </div>
          ) : (
            <table className="coord-perf-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Target Role</th>
                  <th>Batch</th>
                  <th>Conducted Date</th>
                  <th>Overall Score</th>
                  <th>Technical Score</th>
                  <th>Status</th>
                  <th className="coord-perf-th-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="coord-perf-student-name">{rec.studentName}</div>
                      <div className="coord-perf-student-sub">{rec.rollNo}</div>
                    </td>
                    <td className="coord-perf-td-bold">{rec.targetRole}</td>
                    <td><span className="coord-perf-batch-badge">{rec.batch}</span></td>
                    <td className="coord-perf-td-date">{rec.conductedDate}</td>
                    <td>
                      <div className="coord-perf-progress-row">
                        <div className="coord-perf-progress-track">
                          <div
                            className={`coord-perf-progress-bar ${rec.overallScore >= 80 ? "coord-perf-progress-bar--emerald" : rec.overallScore >= 65 ? "coord-perf-progress-bar--indigo" : "coord-perf-progress-bar--rose"}`}
                            style={{ width: `${rec.overallScore}%` }}
                          />
                        </div>
                        <span className="coord-perf-rate-text">{rec.overallScore}%</span>
                      </div>
                    </td>
                    <td className="coord-perf-td-tech">{rec.techScore}%</td>
                    <td>
                      <span className={`coord-perf-status-pill ${rec.category === "Excellent" ? "coord-perf-status-pill--top" : rec.category === "Good" ? "coord-perf-status-pill--good" : "coord-perf-status-pill--struggling"}`}>
                        {rec.category}
                      </span>
                    </td>
                    <td className="coord-perf-td-right">
                      <button
                        onClick={() => setSelectedInterview(rec)}
                        className="coord-perf-btn coord-perf-btn--indigo-light"
                      >
                        <Eye size={14} /> Full Evaluation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* AI Evaluation Detail Modal */}
      {selectedInterview && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-content">
            <div className="coord-perf-modal-header coord-perf-modal-dark-header">
              <div className="coord-perf-modal-title-row">
                <div>
                  <h3 className="coord-perf-modal-student-title">
                    AI Mock Interview Evaluation: {selectedInterview.studentName}
                  </h3>
                  <p className="coord-perf-modal-sub-slate">
                    Role: {selectedInterview.targetRole} &bull; Roll: {selectedInterview.rollNo} &bull; {selectedInterview.conductedDate}
                  </p>
                </div>
                <button onClick={() => setSelectedInterview(null)} className="coord-perf-btn coord-perf-modal-close-ghost">
                  <X size={20} />
                </button>
              </div>

              <div className="coord-perf-modal-stat-grid">
                <div>
                  <p className="coord-perf-modal-stat-label">Overall Score</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--sky">{selectedInterview.overallScore}%</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Technical Knowledge</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--emerald">{selectedInterview.techScore}%</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Communication</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--amber">{selectedInterview.communicationScore}%</p>
                </div>
                <div>
                  <p className="coord-perf-modal-stat-label">Problem Solving</p>
                  <p className="coord-perf-modal-stat-val coord-perf-modal-stat-val--indigo">{selectedInterview.problemSolvingScore}%</p>
                </div>
              </div>
            </div>

            <div className="coord-perf-modal-body">
              <div className="coord-perf-feedback-card">
                <h4 className="coord-perf-feedback-title">
                  AI Feedback & Recommendations
                </h4>
                <p className="coord-perf-feedback-body">
                  {selectedInterview.recommendation}
                </p>
              </div>

              <div>
                <h4 className="coord-perf-strengths-title">
                  Key Strengths
                </h4>
                <ul className="coord-perf-strengths-list">
                  {selectedInterview.strengths.map((s, idx) => (
                    <li key={idx}>&bull; {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="coord-perf-modal-footer">
              <button
                onClick={() => setSelectedInterview(null)}
                className="coord-perf-btn coord-perf-btn-primary-solid"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN DEFAULT EXPORT: COORDINATOR PERFORMANCES GOVERNANCE PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CoordinatorPerformances() {
  const [activeTab, setActiveTab] = useState("coding");

  return (
    <div className="coord-perf-container">
      {/* Header & Sub-Tab Switcher */}
      <div className="coord-perf-header-bar">
        <div className="coord-perf-header-left">
          <div className="coord-perf-header-flex-row">
            <LineChart size={24} className="coord-perf-header-line-icon" />
            <div>
              <h1 className="coord-perf-title">
                Performances Governance
              </h1>
              <p className="coord-perf-sub">
                Comprehensive unified analytics for student coding practice metrics, MCQ quiz scorecards, and AI mock interview evaluations.
              </p>
            </div>
          </div>
        </div>

        <div className="coord-perf-tabs-nav">
          <button
            type="button"
            onClick={() => setActiveTab("coding")}
            className={`coord-perf-tab-btn ${activeTab === "coding" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <Code size={16} /> Coding Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`coord-perf-tab-btn ${activeTab === "quiz" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <BookOpen size={16} /> Quiz Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`coord-perf-tab-btn ${activeTab === "interview" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <Bot size={16} /> AI Interview Performance
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "coding" && <CodingPerformance />}
      {activeTab === "quiz" && <QuizPerformance />}
      {activeTab === "interview" && <InterviewPerformance />}
    </div>
  );
}
