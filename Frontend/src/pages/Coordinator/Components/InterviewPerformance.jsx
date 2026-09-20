import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart2,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  Clock,
  Calendar,
  Layers,
  Info,
} from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/CodingPerformance.css";

export default function InterviewPerformance() {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch("/coordinator/students"),
      apiFetch("/coordinator/batches"),
    ])
      .then(([stuRes, batchRes]) => {
        if (!mounted) return;
        const batchList = batchRes?.batches || [];
        const list = (stuRes?.students || []).map((s, idx) => ({
          id: `st-${s.studentId}`,
          studentInfoId: idx,
          studentName: s.name || "Unknown Student",
          rollNo: s.rollNumber || "—",
          department: s.department || "CSE",
          batch: s.batch || "General Batch",
          interviewType: "Technical Mock",
          conductedDate: "—",
          status: "Not Attempted",
          overallScore: "—",
          grade: "—",
          targetRole: "",
        }));
        setBatches(batchList);
        setRecords(list);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load interview records");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Filters
  const filteredInterviews = records.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.targetRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || rec.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || rec.batch === selectedBatch;
    const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;
    return matchesSearch && matchesDept && matchesBatch && matchesStatus;
  });

  const totalStudentsCount = records.length;
  const completedCount = records.filter((r) => r.status === "Completed").length;
  const pendingCount = records.filter((r) => r.status !== "Completed").length;
  const averageScore = "N/A";

  const categoryCounts = {
    excellent: 0,
    good: 0,
    average: 0,
    needsWork: 0,
  };

  const departments = Array.from(new Set(records.map((r) => r.department)).values());

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "coord-perf-status--top";
      case "In Progress":
        return "coord-perf-status--good";
      case "Not Attempted":
      case "Needs Retake":
        return "coord-perf-status--struggling";
      default:
        return "coord-perf-status--default";
    }
  };

  const getCategoryBadgeClass = (grade) => {
    switch (grade) {
      case "Excellent":
        return "coord-perf-status--top";
      case "Good":
        return "coord-perf-status--good";
      case "Average":
        return "coord-perf-status--avg";
      case "Needs Work":
      default:
        return "coord-perf-status--struggling";
    }
  };

  if (loading) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading interview performance...</div>;
  }

  if (error) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

  // Evaluation View
  if (selectedInterview) {
    return (
      <div className="coord-perf-container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Top Navigation Header Bar */}
        <div className="coord-perf-card" style={{ padding: "20px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div className="coord-perf-student-cell">
            <div className="coord-perf-avatar-lg">
              {selectedInterview.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#0f172a" }}>{selectedInterview.studentName}</h3>
                <span className="coord-perf-status-badge coord-perf-status--good">
                  Score: {selectedInterview.overallScore}% ({selectedInterview.grade})
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                Roll No: <strong style={{ color: "#0f172a" }}>{selectedInterview.rollNo}</strong> · Dept:{" "}
                <strong style={{ color: "#0f172a" }}>{selectedInterview.department || "CSE"}</strong> · Batch:{" "}
                <strong style={{ color: "#0f172a" }}>{selectedInterview.batch}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedInterview(null)}
            className="coord-perf-btn coord-perf-btn--secondary"
            style={{ borderRadius: "50%", width: "36px", height: "36px", padding: 0, justifyContent: "center" }}
            title="Close Evaluation View"
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="coord-perf-cat-grid">
          <div className="coord-perf-cat-card" style={{ background: "#f8fafc", flexDirection: "column", textAlign: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Interview Date</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <Calendar size={13} /> {selectedInterview.conductedDate}
            </span>
          </div>
          <div className="coord-perf-cat-card" style={{ background: "#f8fafc", flexDirection: "column", textAlign: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Interview Type</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#4f46e5" }}>{selectedInterview.interviewType}</span>
          </div>
          <div className="coord-perf-cat-card" style={{ background: "#f8fafc", flexDirection: "column", textAlign: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Questions Count</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#4f46e5" }}>{selectedInterview.questionsCount} Questions</span>
          </div>
          <div className="coord-perf-cat-card" style={{ background: "#f8fafc", flexDirection: "column", textAlign: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Duration</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <Clock size={13} /> {selectedInterview.duration}
            </span>
          </div>
        </div>

        {/* Breakdown Scores */}
        <div className="coord-perf-card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart2 size={16} style={{ color: "#4f46e5" }} />
            Competency Evaluation Breakdown
          </h4>
          <div className="coord-perf-cat-grid">
            <div style={{ padding: "14px", background: "#eef2ff", borderRadius: "12px", border: "1px solid #c7d2fe" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Technical Knowledge</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#4f46e5", marginTop: "4px" }}>{selectedInterview.techScore}%</div>
              <div className="coord-perf-progress-track" style={{ marginTop: "8px" }}>
                <div className="coord-perf-progress-bar coord-perf-progress-bar--indigo" style={{ width: `${selectedInterview.techScore}%` }} />
              </div>
            </div>

            <div style={{ padding: "14px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Communication Score</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>{selectedInterview.communicationScore}%</div>
              <div className="coord-perf-progress-track" style={{ marginTop: "8px" }}>
                <div className="coord-perf-progress-bar coord-perf-progress-bar--emerald" style={{ width: `${selectedInterview.communicationScore}%` }} />
              </div>
            </div>

            <div style={{ padding: "14px", background: "#f3e8ff", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Problem-Solving Score</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>{selectedInterview.problemSolvingScore}%</div>
              <div className="coord-perf-progress-track" style={{ marginTop: "8px" }}>
                <div className="coord-perf-progress-bar" style={{ background: "#7c3aed", width: `${selectedInterview.problemSolvingScore}%` }} />
              </div>
            </div>

            <div style={{ padding: "14px", background: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Confidence & Quality</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>{selectedInterview.confidenceScore}%</div>
              <div className="coord-perf-progress-track" style={{ marginTop: "8px" }}>
                <div className="coord-perf-progress-bar" style={{ background: "#d97706", width: `${selectedInterview.confidenceScore}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Feedback Section */}
        <div className="coord-perf-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} style={{ color: "#7c3aed" }} />
            AI Generated Evaluation Feedback & Insights
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* Strengths */}
            <div style={{ padding: "16px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <span style={{ fontWeight: 800, fontSize: "12px", color: "#065f46", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <CheckCircle2 size={16} style={{ color: "#059669" }} />
                Strengths:
              </span>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#064e3b", lineHeight: 1.6 }}>
                {selectedInterview.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Needs Improvement */}
            <div style={{ padding: "16px", background: "#fff1f2", borderRadius: "12px", border: "1px solid #fecdd3" }}>
              <span style={{ fontWeight: 800, fontSize: "12px", color: "#9f1239", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <AlertTriangle size={16} style={{ color: "#e11d48" }} />
                Needs Improvement:
              </span>
              <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#881337", lineHeight: 1.6 }}>
                {selectedInterview.weaknesses.map((wk, idx) => (
                  <li key={idx}>{wk}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommendation */}
          <div style={{ padding: "16px", background: "#eef2ff", borderRadius: "12px", border: "1px solid #c7d2fe" }}>
            <span style={{ fontWeight: 800, fontSize: "12px", color: "#3730a3", display: "block", marginBottom: "4px" }}>AI Recommendation:</span>
            <p style={{ margin: 0, fontSize: "12px", color: "#312e81", lineHeight: 1.5, fontWeight: 600 }}>{selectedInterview.recommendation}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coord-perf-container">
      {/* Header */}
      <div className="coord-perf-header-bar">
        <div className="coord-perf-header-left">
          <h1 className="coord-perf-title">
            AI Interview Monitoring & Evaluation
          </h1>
          <p className="coord-perf-sub">
            Track student AI mock interview attempts, technical competency scores, detailed AI evaluation breakdowns, and historical improvement logs.
          </p>
        </div>
        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedDept("all");
            setSelectedBatch("all");
            setSelectedStatus("all");
          }}
          className="coord-perf-btn coord-perf-btn--secondary"
        >
          <RefreshCw size={14} />
          Reset Filters
        </button>
      </div>

      {/* Data availability banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#5b21b6", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
        <Info size={16} />
        AI mock interview evaluations are not available yet. All enrolled students are listed as "Not Attempted".
      </div>

      {/* KPI Cards */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <UserCheck size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Students</span>
            <span className="coord-perf-kpi-value">{totalStudentsCount}</span>
            <span className="coord-perf-kpi-sub">Enrolled for AI assessment</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Interviews Completed</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{completedCount}</span>
            <span className="coord-perf-kpi-sub">Evaluated by AI engine</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Clock size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Pending Interviews</span>
            <span className="coord-perf-kpi-value">{pendingCount}</span>
            <span className="coord-perf-kpi-sub">Not attempted / In progress</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Award size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Average Score</span>
            <span className="coord-perf-kpi-value">{averageScore}</span>
            <span className="coord-perf-kpi-sub">Overall cohort mean</span>
          </div>
        </div>
      </div>

      {/* Performance Categories Bar */}
      <div className="coord-perf-card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: "12px" }}>
          <h3 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart2 size={16} style={{ color: "#4f46e5" }} />
            Performance Categories Distribution
          </h3>
          <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto" }}>{records.length} Total Candidates</span>
        </div>

        <div className="coord-perf-cat-grid">
          <div className="coord-perf-cat-card coord-perf-cat-card--emerald">
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#065f46" }}>Excellent (≥85%)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#047857" }}>{categoryCounts.excellent} Candidates</p>
            </div>
          </div>

          <div className="coord-perf-cat-card coord-perf-cat-card--indigo">
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#3730a3" }}>Good (70-84%)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#4338ca" }}>{categoryCounts.good} Candidates</p>
            </div>
          </div>

          <div className="coord-perf-cat-card coord-perf-cat-card--amber">
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#92400e" }}>Average (55-69%)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#b45309" }}>{categoryCounts.average} Candidates</p>
            </div>
          </div>

          <div className="coord-perf-cat-card coord-perf-cat-card--rose">
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#9f1239" }}>Needs Work (&lt;55%)</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#be123c" }}>{categoryCounts.needsWork} Candidates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="coord-perf-filter-card">
        <div className="coord-perf-filter-row">
          <div className="coord-perf-search-wrap">
            <Search size={16} className="coord-perf-search-icon" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coord-perf-search-input"
            />
          </div>

          <div className="coord-perf-filters-group">
            <div className="coord-perf-filter-label">
              <SlidersHorizontal size={14} style={{ color: "#7c3aed" }} />
              <span>Filters:</span>
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="coord-perf-select"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="coord-perf-select"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Attempted">Not Attempted / Needs Work</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="coord-perf-card">
        <div className="coord-perf-card-header">
          <div>
            <h3 className="coord-perf-card-title">Student Interview Roster</h3>
            <p className="coord-perf-card-sub">
              Showing {filteredInterviews.length} of {records.length} student interview evaluation records
            </p>
          </div>
        </div>

        <div className="coord-perf-table-wrap">
          <table className="coord-perf-table">
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Department & Batch</th>
                <th>Interview Type</th>
                <th>Interview Date</th>
                <th>Status</th>
                <th>Overall Score</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div>
                      <div
                        className="coord-perf-student-name"
                        onClick={() => { if (rec.status === "Completed") setSelectedInterview(rec); }}
                      >
                        {rec.studentName}
                      </div>
                      <div className="coord-perf-roll">{rec.rollNo}</div>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{rec.department || "CSE"}</span>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{rec.batch}</div>
                  </td>

                  <td style={{ fontWeight: 700, color: "#7c3aed" }}>
                    {rec.interviewType || "Technical Mock"}
                  </td>

                  <td style={{ fontWeight: 600, color: "#475569" }}>
                    {rec.conductedDate}
                  </td>

                  <td>
                    <span className={`coord-perf-status-badge ${getStatusBadge(rec.status)}`}>
                      {rec.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>{rec.overallScore}</span>
                      <span className={`coord-perf-status-badge ${rec.grade === "—" ? "coord-perf-status--default" : getCategoryBadgeClass(rec.grade)}`}>
                        {rec.grade}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => { if (rec.status === "Completed") setSelectedInterview(rec); }}
                      className="coord-perf-btn coord-perf-btn--purple-light"
                    >
                      <Eye size={14} />
                      {rec.status === "Completed" ? "View Details" : "No Evaluation"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    No student interview records found matching your active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
