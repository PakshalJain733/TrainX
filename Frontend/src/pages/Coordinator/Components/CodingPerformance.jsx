import { useState, useEffect } from "react";
import {
  Code,
  Search,
  CheckCircle2,
  Zap,
  Flame,
  Trophy,
  Eye,
  X,
  RefreshCw,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/CodingPerformance.css";

export default function CodingPerformance() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch("/coordinator/students"),
      apiFetch("/coordinator/batches"),
    ])
      .then(([stuRes, batchRes]) => {
        if (!mounted) return;
        const batchList = batchRes?.batches || [];
        const codingRecords = (stuRes?.students || []).map((s, idx) => ({
          id: `st-${s.studentId}`,
          leaderboardRank: idx + 1,
          studentName: s.name || "Unknown Student",
          rollNo: s.rollNumber || "—",
          batch: s.batch || "General Batch",
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          accuracyRate: 0,
          totalSubmissions: 0,
          primaryLanguage: "—",
          streakDays: 0,
          status: "N/A",
          lastActive: "No coding activity recorded",
          topics: {},
          recentSubmissions: [],
        }));
        setBatches(batchList);
        setStudents(codingRecords);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load coding performance data");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Filtered Students
  const filteredData = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
    const matchesLang = selectedLanguage === "all" || s.primaryLanguage === selectedLanguage;
    const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
    return matchesSearch && matchesBatch && matchesLang && matchesStatus;
  });

  // Calculate high-level metrics
  const totalSubmissionsSum = students.reduce((acc, curr) => acc + curr.totalSubmissions, 0);
  const totalSolvedSum = students.reduce((acc, curr) => acc + curr.totalSolved, 0);
  const avgAccuracy = students.length > 0 ? (students.reduce((acc, curr) => acc + curr.accuracyRate, 0) / students.length).toFixed(1) : "0";
  const hardSolvedSum = students.reduce((acc, curr) => acc + curr.hardSolved, 0);
  const activeCoders = students.filter((s) => s.streakDays > 0).length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Top Performer":
        return "coord-perf-status--top";
      case "Good":
        return "coord-perf-status--good";
      case "Average":
        return "coord-perf-status--avg";
      case "Struggling":
        return "coord-perf-status--struggling";
      default:
        return "coord-perf-status--default";
    }
  };

  if (loading) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading coding performance...</div>;
  }

  if (error) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

  return (
    <div className="coord-perf-container">
      {/* Data availability banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
        <Info size={16} />
        Coding problem submissions (platform integration) are not available in the system yet. Scores below reflect enrolled students only.
      </div>
      {/* Header */}
      <div className="coord-perf-header-bar">
        <div className="coord-perf-header-left">
          <h1 className="coord-perf-title">
            Student Coding Performance
          </h1>
          <p className="coord-perf-sub">
            Track algorithm submission metrics, problem accuracy rates, language proficiency, and target coders needing remediation.
          </p>
        </div>
        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedBatch("all");
            setSelectedLanguage("all");
            setSelectedStatus("all");
          }}
          className="coord-perf-btn coord-perf-btn--secondary"
        >
          <RefreshCw size={14} />
          Reset Filters
        </button>
      </div>

      {/* KPI Cards */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Code size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Solved</span>
            <span className="coord-perf-kpi-value">{totalSolvedSum}</span>
            <span className="coord-perf-kpi-sub">{totalSubmissionsSum} submissions</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Avg Accuracy Rate</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{avgAccuracy}%</span>
            <span className="coord-perf-kpi-sub">No trend data available yet</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Trophy size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Hard Solved</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{hardSolvedSum}</span>
            <span className="coord-perf-kpi-sub">High difficulty</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <Flame size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Active Coders</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">{activeCoders}</span>
            <span className="coord-perf-kpi-sub">Active daily streaks</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <Zap size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Struggling Coders</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">
              {students.filter((s) => s.status === "Struggling").length}
            </span>
            <span className="coord-perf-kpi-sub">Needs remediation</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="coord-perf-filter-card">
        <div className="coord-perf-filter-row">
          {/* Search Box */}
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
                onClick={() => setSearchTerm("")}
                className="coord-perf-search-clear"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="coord-perf-filters-group">
            <div className="coord-perf-filter-label">
              <SlidersHorizontal size={14} style={{ color: "#4f46e5" }} />
              <span>Filters:</span>
            </div>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="coord-perf-select"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="coord-perf-select"
            >
              <option value="all">All Languages</option>
              <option value="C++">C++</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
              <option value="Go">Go</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="coord-perf-select"
            >
              <option value="all">All Statuses</option>
              <option value="Top Performer">Top Performer</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Struggling">Struggling</option>
            </select>

            {(searchTerm || selectedBatch !== "all" || selectedLanguage !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedBatch("all");
                  setSelectedLanguage("all");
                  setSelectedStatus("all");
                }}
                className="coord-perf-btn coord-perf-btn--indigo-light"
                title="Clear all filters"
              >
                <RefreshCw size={13} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Student Coding Table */}
      <div className="coord-perf-card">
        <div className="coord-perf-card-header">
          <div>
            <h3 className="coord-perf-card-title">Student Coding Matrix</h3>
            <p className="coord-perf-card-sub">
              Showing {filteredData.length} of {students.length} enrolled coders
            </p>
          </div>
        </div>

        <div className="coord-perf-table-wrap">
          <table className="coord-perf-table">
            <thead>
              <tr>
                <th>Rank & Student</th>
                <th>Batch</th>
                <th>Problems Solved</th>
                <th>Accuracy Rate</th>
                <th>Top Language</th>
                <th>Streak</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((s) => (
                <tr key={s.id}>
                  {/* Student */}
                  <td>
                    <div className="coord-perf-student-cell">
                      <div className="coord-perf-rank-badge">
                        #{s.leaderboardRank}
                      </div>
                      <div>
                        <div className="coord-perf-student-name" onClick={() => setSelectedStudent(s)}>
                          {s.studentName}
                        </div>
                        <div className="coord-perf-roll">{s.rollNo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Batch */}
                  <td style={{ fontWeight: 600 }}>
                    {s.batch}
                  </td>

                  {/* Solved pills */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 800, color: "#0f172a" }}>{s.totalSolved}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>total</span>
                      </div>
                      <div className="coord-perf-diff-group">
                        <span className="coord-perf-diff-pill coord-perf-diff-pill--easy" title="Easy">
                          E: {s.easySolved}
                        </span>
                        <span className="coord-perf-diff-pill coord-perf-diff-pill--medium" title="Medium">
                          M: {s.mediumSolved}
                        </span>
                        <span className="coord-perf-diff-pill coord-perf-diff-pill--hard" title="Hard">
                          H: {s.hardSolved}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Accuracy */}
                  <td>
                    <div className="coord-perf-progress-wrap">
                      <div className="coord-perf-progress-meta">
                        <span>{s.accuracyRate}%</span>
                        <span style={{ color: "#94a3b8", fontWeight: 400 }}>{s.totalSubmissions} subs</span>
                      </div>
                      <div className="coord-perf-progress-track">
                        <div
                          className={`coord-perf-progress-bar ${
                            s.accuracyRate >= 85
                              ? "coord-perf-progress-bar--emerald"
                              : s.accuracyRate >= 70
                              ? "coord-perf-progress-bar--blue"
                              : "coord-perf-progress-bar--rose"
                          }`}
                          style={{ width: `${s.accuracyRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Primary Language */}
                  <td>
                    <span className="coord-perf-status-badge coord-perf-status--good">
                      {s.primaryLanguage}
                    </span>
                  </td>

                  {/* Streak */}
                  <td>
                    {s.streakDays > 0 ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#d97706", fontWeight: 700 }}>
                        <Flame size={14} style={{ fill: "#f59e0b" }} />
                        {s.streakDays} days
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>0 days</span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`coord-perf-status-badge ${getStatusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="coord-perf-btn coord-perf-btn--secondary"
                    >
                      <Eye size={14} />
                      Diagnostics
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    No coding performance records match your active search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Coding Diagnostic Modal */}
      {selectedStudent && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card">
            {/* Modal Header */}
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setSelectedStudent(null)}
                className="coord-perf-modal-close"
              >
                <X size={18} />
              </button>

              <div className="coord-perf-modal-user">
                <div className="coord-perf-avatar-lg">
                  {selectedStudent.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{selectedStudent.studentName}</h3>
                    <span className="coord-perf-status-badge coord-perf-status--good">
                      Enrolled
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                    {selectedStudent.rollNo} · {selectedStudent.batch}
                  </p>
                </div>
              </div>

              {/* Stats overview banner */}
              <div className="coord-perf-modal-banner-grid">
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Total Solved</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: "2px 0 0 0" }}>{selectedStudent.totalSolved}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Accuracy Rate</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#34d399", margin: "2px 0 0 0" }}>{selectedStudent.accuracyRate}%</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Current Streak</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#fbbf24", margin: "2px 0 0 0" }}>{selectedStudent.streakDays} Days</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Primary Lang</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#a5b4fc", margin: "2px 0 0 0" }}>{selectedStudent.primaryLanguage}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="coord-perf-modal-body">
              {/* Topic Mastery breakdown */}
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "12px" }}>
                  Topic Mastery & Skill Breakdown
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                  {Object.entries(selectedStudent.topics).length > 0 ? (
                    Object.entries(selectedStudent.topics).map(([topic, pct]) => (
                    <div key={topic} style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                        <span>{topic}</span>
                        <span style={{ color: "#4f46e5" }}>{pct}%</span>
                      </div>
                      <div className="coord-perf-progress-track" style={{ height: "8px" }}>
                        <div
                          className="coord-perf-progress-bar coord-perf-progress-bar--indigo"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>No topic mastery data available.</p>
                  )}
                </div>
              </div>

              {/* Recent Submissions */}
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "12px" }}>
                  Recent Code Submissions
                </h4>
                <div className="coord-perf-card" style={{ border: "1px solid #e2e8f0" }}>
                  <table className="coord-perf-table">
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>Difficulty</th>
                        <th>Lang</th>
                        <th>Verdict</th>
                        <th>Runtime</th>
                        <th style={{ textAlign: "right" }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.recentSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                            No coding submissions recorded yet.
                          </td>
                        </tr>
                      ) : (
                      selectedStudent.recentSubmissions.map((sub) => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{sub.problem}</td>
                          <td>
                            <span
                              className={`coord-perf-diff-pill ${
                                sub.difficulty === "Easy"
                                  ? "coord-perf-diff-pill--easy"
                                  : sub.difficulty === "Medium"
                                  ? "coord-perf-diff-pill--medium"
                                  : "coord-perf-diff-pill--hard"
                              }`}
                            >
                              {sub.difficulty}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", color: "#475569" }}>{sub.language}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  sub.status === "Accepted"
                                    ? "#059669"
                                    : sub.status === "Time Limit Exceeded"
                                    ? "#d97706"
                                    : "#e11d48"
                              }}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", color: "#64748b" }}>{sub.time}</td>
                          <td style={{ textAlign: "right", color: "#94a3b8", fontSize: "11px" }}>
                            {sub.submittedAt}
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="coord-perf-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Last active: <strong style={{ color: "#0f172a" }}>{selectedStudent.lastActive}</strong>
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="coord-perf-btn coord-perf-btn--indigo-light"
                style={{ background: "#4f46e5", color: "#ffffff", border: "none" }}
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


