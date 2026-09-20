import React, { useState, useEffect } from "react";
import {
  Users, TrendingUp, AlertTriangle, ChevronRight, Search,
  BarChart3, Code2, MessageSquare, CalendarCheck, Target,
  CheckCircle2, BookOpen, XCircle, RefreshCw, ArrowUpRight,
  ArrowDownRight, Filter, Eye
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import "../../Student/Styles/Performance.css";
import "../Styles/Performance.css";

// ── Helper: status color ────────────────────────────────────────────────────
function statusStyle(score) {
  if (score == null) return { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  if (score >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (score >= 70) return { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 55) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

// ── Mini bar ───────────────────────────────────────────────────────────────
function MiniBar({ value, target = 70 }) {
  if (value == null) {
    return (
      <div className="mentor-perf-score-bar-cell">
        <span className="mentor-perf-score-num" style={{ color: "#94a3b8" }}>N/A</span>
        <div className="mentor-perf-mini-bar-bg" />
      </div>
    );
  }
  const isWeak = value < target;
  const color = isWeak ? "#ef4444" : "#10b981";
  return (
    <div className="mentor-perf-score-bar-cell">
      <span className="mentor-perf-score-num" style={{ color }}>{value}%</span>
      <div className="mentor-perf-mini-bar-bg">
        <div className="mentor-perf-mini-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Formatted score helper ─────────────────────────────────────────────────
const fmt = (v) => (v == null ? "N/A" : `${v}%`);

// ── Student Detail Panel ───────────────────────────────────────────────────
function StudentDetailPanel({ student, onClose }) {
  if (!student) return null;
  const { color: oc } = statusStyle(student.overallScore);

  return (
    <div className="mentor-perf-detail-panel">
      <div className="mentor-perf-panel-header">
        <div>
          <h3 className="mentor-perf-panel-title">{student.name}</h3>
          <p className="mentor-perf-panel-sub">{student.department} · {student.batch}</p>
        </div>
        <button className="mentor-perf-panel-close" onClick={onClose}>← Back to List</button>
      </div>

      {/* KPI Grid */}
      <div className="mentor-perf-detail-grid">
        {[
          { label: "Overall Score", value: fmt(student.overallScore), color: oc },
          { label: "Assessment", value: fmt(student.assessment) },
          { label: "Coding", value: "N/A" },
          { label: "Interview", value: "N/A" },
          { label: "Attendance", value: fmt(student.attendance) },
          { label: "Roadmap Progress", value: fmt(student.milestone) },
        ].map((k, i) => (
          <div key={i} className="mentor-perf-detail-kpi">
            <span className="mentor-perf-detail-kpi-label">{k.label}</span>
            <span className="mentor-perf-detail-kpi-val" style={{ color: k.color || "#0f172a" }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Weak Areas */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} color="#f59e0b" /> Weak Areas
        </h4>
        {student.weakAreas.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 13 }}>
            <CheckCircle2 size={16} /> No weak areas detected — student is on track!
          </div>
        ) : (
          <div className="mentor-perf-weak-list">
            {student.weakAreas.map((w, i) => (
              <div key={i} className="mentor-perf-weak-item">
                <AlertTriangle size={14} color="#ef4444" />
                <span className="mentor-perf-weak-item-name">{w.skill}</span>
                <span className="mentor-perf-weak-item-score">{w.score == null ? "N/A" : `${w.score}%`}</span>
                <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Target: {w.target ?? 75}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} color="#4f46e5" /> Recommendations
        </h4>
        <div className="mentor-perf-recs-grid">
          {student.recommendations.map((r, i) => (
            <div key={i} className="mentor-perf-rec-item">
              <ChevronRight size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: 2 }} />
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function MentorPerformance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/students/performance")
      .then(res => {
        if (res && res.data && res.data.students) {
          setStudents(res.data.students);
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  // Compute batch stats
  const withScores = students.filter(s => s.overallScore != null);
  const totalStudents = students.length;
  const avgOverall = withScores.length ? Math.round(withScores.reduce((a, s) => a + s.overallScore, 0) / withScores.length) : null;
  const needsImprovement = students.filter(s => s.overallScore != null && s.overallScore < 60).length;
  const excellent = students.filter(s => s.overallScore != null && s.overallScore >= 85).length;
  const batches = ["All", ...new Set(students.map(s => s.batch).filter(Boolean))];

  // Filter students
  const filtered = students.filter(s => {
    const matchSearch = (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === "All" || s.batch === batchFilter;
    const matchStatus = statusFilter === "All" ||
      (statusFilter === "No Data" ? s.overallScore == null : s.status === statusFilter);
    const matchTab =
      activeTab === "all" ||
      (activeTab === "weak" && s.overallScore != null && s.overallScore < 65) ||
      (activeTab === "excel" && s.overallScore != null && s.overallScore >= 80);
    return matchSearch && matchBatch && matchStatus && matchTab;
  });

  const scoreColor = (v, target = 70) => (v == null ? "#94a3b8" : v < target ? "#ef4444" : v >= 85 ? "#10b981" : "#3b82f6");

  if (loading) {
    return (
      <div className="perf-loading">
        <RefreshCw size={28} className="perf-spin" />
        <p>Loading student performance data…</p>
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <div className="student-page-inner stack-6">
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      </div>
    );
  }

  return (
    <div className="student-page-inner stack-6">
      <SectionHeader
        eyebrow="Mentor / Trainer View"
        title="Student Performance"
        description="Monitor overall performance, identify students who need intervention, and view individual score breakdowns with recommendations."
      />

      {/* ── Overview Stats ── */}
      <div className="mentor-perf-stats-row">
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Total Students</span>
          <span className="mentor-perf-stat-value">{totalStudents}</span>
          <span className="mentor-perf-stat-sub">Assigned to you</span>
        </div>
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Batch Average</span>
          <span className="mentor-perf-stat-value" style={{ color: scoreColor(avgOverall, 70) }}>
            {avgOverall == null ? "N/A" : `${avgOverall}%`}
          </span>
          <span className="mentor-perf-stat-sub">Overall performance</span>
        </div>
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Need Attention</span>
          <span className="mentor-perf-stat-value" style={{ color: "#ef4444" }}>{needsImprovement}</span>
          <span className="mentor-perf-stat-sub">Score below 60%</span>
        </div>
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Top Performers</span>
          <span className="mentor-perf-stat-value" style={{ color: "#10b981" }}>{excellent}</span>
          <span className="mentor-perf-stat-sub">Score above 85%</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="mentor-perf-filter-bar">
        <div className="mentor-perf-search-wrap">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search student or dept…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
          {batches.map(b => <option key={b} value={b}>{b === "All" ? "All Batches" : b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {["All", "Excellent", "Good", "Average", "Needs Work", "No Data"].map(s => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Students ({students.length})</TabsTrigger>
          <TabsTrigger value="weak">Needs Attention ({students.filter(s => s.overallScore != null && s.overallScore < 65).length})</TabsTrigger>
          <TabsTrigger value="excel">Top Performers ({students.filter(s => s.overallScore != null && s.overallScore >= 80).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="stack-4">
          <Card className="mentor-perf-table-card">
            <CardContent style={{ padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table className="mentor-perf-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Overall</th>
                      <th>Assessment</th>
                      <th>Coding</th>
                      <th>Interview</th>
                      <th>Attendance</th>
                      <th>Status</th>
                      <th>Trend</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13 }}>
                          No performance data available yet.
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13 }}>
                          No students found matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(s => {
                        const { color: sc, bg: sb } = statusStyle(s.overallScore);
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="mentor-perf-student-cell">
                                <div className="mentor-perf-avatar">
                                  {(s.name || "S").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="mentor-perf-student-name">{s.name}</div>
                                  <div className="mentor-perf-student-sub">{s.department} · {s.batch}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 15, fontWeight: 800, color: sc }}>
                                {s.overallScore == null ? "N/A" : `${s.overallScore}%`}
                              </span>
                            </td>
                            <td><MiniBar value={s.assessment} target={75} /></td>
                            <td><MiniBar value={null} target={70} /></td>
                            <td><MiniBar value={null} target={65} /></td>
                            <td><MiniBar value={s.attendance} target={75} /></td>
                            <td>
                              <span style={{ background: sb, color: sc, padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                                {s.overallScore == null ? "No Data" : s.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600,
                                color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : "#64748b" }}>
                                {s.trend === "up" ? <ArrowUpRight size={14} /> : s.trend === "down" ? <ArrowDownRight size={14} /> : "—"}
                                {s.trendDelta || "N/A"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="mentor-perf-view-btn"
                                onClick={() => setSelectedStudent(s)}
                                id={`view-student-${s.id}`}
                              >
                                <Eye size={13} /> View Report
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}