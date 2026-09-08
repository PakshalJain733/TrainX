import { useState } from "react";
import { Bot, Search, Star, Award, TrendingUp, Mic, CheckCircle, Clock } from "lucide-react";
import "../Styles/AIInterviews.css";

export default function CoordinatorAIInterviews() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const interviewSessions = [
    {
      id: 1,
      studentName: "Aarav Sharma",
      rollNo: "CSE-2026-001",
      batch: "CSE-2026-A",
      roleTopic: "Backend Microservices Architect",
      overallScore: 92,
      confidence: "High",
      communicationScore: 88,
      techAccuracy: 95,
      date: "Today, 11:30 AM",
      status: "Cleared",
      duration: "24 mins",
    },
    {
      id: 2,
      studentName: "Riya Patel",
      rollNo: "CSE-2026-014",
      batch: "CSE-2026-A",
      roleTopic: "React & Next.js Frontend Lead",
      overallScore: 84,
      confidence: "Medium",
      communicationScore: 85,
      techAccuracy: 83,
      date: "Today, 10:15 AM",
      status: "Cleared",
      duration: "20 mins",
    },
    {
      id: 3,
      studentName: "Siddharth Verma",
      rollNo: "AI-2026-009",
      batch: "AI-DS-2026-Alpha",
      roleTopic: "MLOps & LLM Fine-Tuning",
      overallScore: 68,
      confidence: "Needs Work",
      communicationScore: 65,
      techAccuracy: 71,
      date: "Yesterday",
      status: "Needs Retake",
      duration: "18 mins",
    },
    {
      id: 4,
      studentName: "Ananya Iyer",
      rollNo: "IT-2026-031",
      batch: "IT-2026-Beta",
      roleTopic: "AWS Cloud & DevOps Specialist",
      overallScore: 95,
      confidence: "Exceptional",
      communicationScore: 96,
      techAccuracy: 94,
      date: "Yesterday",
      status: "Cleared",
      duration: "26 mins",
    },
  ];

  const filteredSessions = interviewSessions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.roleTopic.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="coord-interviews-page">
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <Bot size={22} className="coord-header-icon" color="#4f46e5" />
            AI Mock Interviews & Viva Governance
          </h1>
          <p className="coord-page-sub">
            Evaluate speech clarity, technical accuracy, and AI mock interview readiness ratings across department cohorts.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Total Viva Sessions</div>
          <div className="coord-stat-value" style={{ color: "#4f46e5" }}>142</div>
          <div className="coord-stat-subtext">Conducted this semester</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Placement Ready (&gt;80%)</div>
          <div className="coord-stat-value" style={{ color: "#059669" }}>78%</div>
          <div className="coord-stat-subtext">111 / 142 Students ready</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Average Tech Score</div>
          <div className="coord-stat-value" style={{ color: "#2563eb" }}>85.8 / 100</div>
          <div className="coord-stat-subtext">Evaluated by Gemini AI</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Retakes Recommended</div>
          <div className="coord-stat-value" style={{ color: "#e11d48" }}>9</div>
          <div className="coord-stat-subtext">Flagged for mentor counseling</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search student name, roll no or role topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="coord-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Cleared">Cleared (&gt;75%)</option>
          <option value="Needs Retake">Needs Retake (&lt;70%)</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Student & Batch</th>
              <th>Target Role Evaluated</th>
              <th>AI Overall Score</th>
              <th>Tech Accuracy</th>
              <th>Communication</th>
              <th>Readiness Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="coord-cell-user">
                    <div className="coord-avatar-sm">
                      {s.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="coord-cell-bold">{s.studentName}</div>
                      <div className="coord-cell-meta">{s.rollNo} · {s.batch}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="coord-cell-bold">{s.roleTopic}</div>
                  <div className="coord-cell-meta"><Clock size={11} /> {s.duration} · {s.date}</div>
                </td>
                <td>
                  <div className="coord-score-badge" style={{
                    color: s.overallScore >= 80 ? "#059669" : s.overallScore >= 70 ? "#2563eb" : "#e11d48",
                    background: s.overallScore >= 80 ? "#ecfdf5" : s.overallScore >= 70 ? "#eff6ff" : "#fff1f2",
                  }}>
                    <Star size={13} fill="currentColor" /> {s.overallScore} / 100
                  </div>
                </td>
                <td>
                  <span className="coord-cell-bold">{s.techAccuracy}%</span>
                </td>
                <td>
                  <span className="coord-cell-bold">{s.communicationScore}%</span>
                </td>
                <td>
                  <span className={`coord-badge coord-badge--${s.status === "Cleared" ? "success" : "danger"}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
