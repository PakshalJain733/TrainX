import { useState } from "react";
import {
  FileCheck2,
  Zap,
  Award,
  AlertTriangle,
  Search,
  Download,
  BarChart2,
} from "lucide-react";
import {
  coordinatorAssessments,
  coordinatorBatches,
} from "../../../data/coordinatorMockData";
import "../Styles/CO_CodingPerformance.css";

export default function QuizPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");

  const filteredQuizzes = coordinatorAssessments.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "All" || q.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="coord-perf-container">
      {/* KPI Stats */}
      <div className="coord-perf-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <FileCheck2 size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Quizzes Conducted</span>
            <span className="coord-perf-kpi-value">{coordinatorAssessments.length} Active</span>
            <span className="coord-perf-kpi-sub">Across 4 managed department batches</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <Zap size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Overall Quiz Submission</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">91.2%</span>
            <span className="coord-perf-kpi-sub">279 / 335 total student attempts</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Award size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Avg Department Score</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">84.5%</span>
            <span className="coord-perf-kpi-sub">+3.2% performance vs previous test</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <AlertTriangle size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Retake Required (&lt;60%)</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">14 Students</span>
            <span className="coord-perf-kpi-sub">Scored below mandatory cutoff</span>
          </div>
        </div>
      </div>

      {/* Batch Performance Breakdown */}
      <div className="coord-perf-card" style={{ padding: "20px" }}>
        <h3 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <BarChart2 size={18} style={{ color: "#4f46e5" }} /> Batch-wise Quiz Performance Governance
        </h3>
        <div className="coord-perf-cat-grid">
          {coordinatorBatches.map((b) => (
            <div key={b.id} style={{ padding: "14px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{b.name}</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{b.avgAttendance}% Avg Score</div>
              <div className="coord-perf-progress-track">
                <div
                  className="coord-perf-progress-bar coord-perf-progress-bar--indigo"
                  style={{ width: `${b.avgAttendance}%` }}
                />
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", display: "flex", justifyBetween: "space-between", paddingTop: "4px" }}>
                <span>Pass Rate: <strong style={{ color: "#059669" }}>92.4%</strong></span>
                <span style={{ marginLeft: "auto" }}>Defaulters: <strong style={{ color: "#e11d48" }}>{b.defaultersCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="coord-perf-filter-card">
        <div className="coord-perf-filter-row">
          <div className="coord-perf-search-wrap">
            <Search size={16} className="coord-perf-search-icon" />
            <input
              type="text"
              placeholder="Search quiz title or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coord-perf-search-input"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="coord-perf-select"
          >
            <option value="All">All Batches</option>
            {coordinatorBatches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={() => alert("Exporting Quiz Performance Report PDF...")}
            className="coord-perf-btn coord-perf-btn--indigo-light"
            style={{ marginLeft: "auto" }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <div className="coord-perf-card">
        {/* Quizzes Table */}
        <div className="coord-perf-table-wrap">
          <table className="coord-perf-table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Batch</th>
                <th>Format</th>
                <th>Submissions</th>
                <th>Avg Score</th>
                <th>Pass Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>{q.title}</td>
                  <td style={{ fontWeight: 600, color: "#475569" }}>{q.batch}</td>
                  <td>
                    <span className="coord-perf-status-badge coord-perf-status--good">
                      {q.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{q.submissions}</td>
                  <td style={{ fontWeight: 800, color: "#7c3aed" }}>{q.avgScore}</td>
                  <td style={{ fontWeight: 800, color: "#059669" }}>{q.passRate}</td>
                  <td>
                    <span className="coord-perf-status-badge coord-perf-status--top">
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
