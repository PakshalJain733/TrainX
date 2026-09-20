import { useState, useEffect } from "react";
import {
  FileCheck2,
  Zap,
  Award,
  AlertTriangle,
  Search,
  Download,
  BarChart2,
} from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/CodingPerformance.css";

export default function QuizPerformance() {
  const [assessments, setAssessments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch("/coordinator/batches"),
      apiFetch("/assessments"),
      apiFetch("/coordinator/students"),
    ])
      .then(async ([batchRes, asmtRes, studentRes]) => {
        if (!mounted) return;
        const batches = batchRes?.batches || [];
        const students = studentRes?.students || [];
        const totalStudents = students.length;
        const assmts = (asmtRes?.assessments || []).map((a) => ({
          id: a.id,
          title: a.title,
          batch: a.batch_name || a.batch || "General Batch",
          type: a.category || "Quiz",
          status: a.status || "Published",
        }));

        const enriched = await Promise.all(
          assmts.map(async (q) => {
            try {
              const results = await apiFetch(`/assessments/${q.id}/results`);
              const attempts = results?.attempts || results || [];
              const scores = attempts.map((t) => parseFloat(t.percentage) || 0);
              const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
              const passed = scores.filter((s) => s >= 60).length;
              return {
                ...q,
                submissions: attempts.length,
                avgScore: `${avg}%`,
                passRate: attempts.length > 0 ? `${Math.round((passed / attempts.length) * 100)}%` : "0%",
                measuredStudents: new Set(attempts.map((t) => t.user_id)).size,
              };
            } catch {
              return { ...q, submissions: 0, avgScore: "0%", passRate: "0%", measuredStudents: 0 };
            }
          })
        );

        setBatches(batches);
        setAssessments(enriched);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load quiz performance data");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const filteredQuizzes = assessments.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "All" || q.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const totalSubmissions = assessments.reduce((acc, q) => acc + q.submissions, 0);
  const avgScores = assessments.map((q) => parseInt(q.avgScore, 10) || 0).filter((v) => v > 0);
  const avgDept = avgScores.length > 0 ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length) : 0;
  const retakeCount = avgScores.filter((v) => v < 60).length;

  if (loading) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading quiz performance...</div>;
  }

  if (error) {
    return <div className="coord-perf-container" style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

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
            <span className="coord-perf-kpi-value">{assessments.length} Active</span>
            <span className="coord-perf-kpi-sub">Across managed department batches</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <Zap size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Quiz Submissions</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{totalSubmissions}</span>
            <span className="coord-perf-kpi-sub">across all conducted tests</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <Award size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Avg Department Score</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{avgDept}%</span>
            <span className="coord-perf-kpi-sub">computed from real attempt scores</span>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <AlertTriangle size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Quizzes Below 60% Avg</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{retakeCount}</span>
            <span className="coord-perf-kpi-sub">averages below mandatory cutoff</span>
          </div>
        </div>
      </div>

      {/* Batch Performance Breakdown */}
      <div className="coord-perf-card" style={{ padding: "20px" }}>
        <h3 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <BarChart2 size={18} style={{ color: "#4f46e5" }} /> Batch-wise Quiz Performance Governance
        </h3>
        {batches.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "16px", margin: 0 }}>No batch data available.</p>
        ) : (
          <div className="coord-perf-cat-grid">
            {batches.map((b) => {
              const batchAvg = assessments.filter((a) => a.batch === b.name).map((a) => parseInt(a.avgScore, 10) || 0);
              const avg = batchAvg.length > 0 ? Math.round(batchAvg.reduce((x, y) => x + y, 0) / batchAvg.length) : 0;
              return (
                <div key={b.id} style={{ padding: "14px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{b.name}</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{avg}% Avg Score</div>
                  <div className="coord-perf-progress-track">
                    <div
                      className="coord-perf-progress-bar coord-perf-progress-bar--indigo"
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", display: "flex", paddingTop: "4px" }}>
                    <span>Enrolled: <strong style={{ color: "#059669" }}>{b.enrolledStudents || 0}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            {batches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
            PDF export is not available yet.
          </span>
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

              {filteredQuizzes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    No quizzes match your selected filters.
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