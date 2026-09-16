import React, { useState, useEffect } from "react";
import {
  Users, TrendingUp, AlertTriangle, ChevronRight, Search,
  BarChart3, Code2, MessageSquare, CalendarCheck, Target,
  CheckCircle2, BookOpen, XCircle, RefreshCw, ArrowUpRight,
  ArrowDownRight, Filter, Eye, Sparkles, LineChart
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/MN_Performance.css";

// ── Default fallback data ──────────────────────────────────────────────────
const defaultStudents = [];

// ── Helper: status color ────────────────────────────────────────────────────
function statusStyle(score) {
  if (score >= 85) return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (score >= 70) return { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 55) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
}

// ── Mini bar ───────────────────────────────────────────────────────────────
function MiniBar({ value, target = 70 }) {
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
          { label: "Overall Score", value: `${student.overallScore}%`, color: oc },
          { label: "Assessment", value: `${student.assessment}%` },
          { label: "Coding", value: `${student.coding}%` },
          { label: "Interview", value: `${student.interview}%` },
          { label: "Attendance", value: `${student.attendance}%` },
          { label: "Milestone", value: `${student.milestone}%` },
        ].map((k, i) => (
          <div key={i} className="mentor-perf-detail-kpi">
            <span className="mentor-perf-detail-kpi-label">{k.label}</span>
            <span className="mentor-perf-detail-kpi-val" style={{ color: k.color || "#0f172a" }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Weak Areas */}
      <div className="mentor-perf-section-wrap">
        <h4 className="mentor-perf-section-title">
          <AlertTriangle size={16} color="#f59e0b" /> Weak Areas
        </h4>
        {student.weakAreas.length === 0 ? (
          <div className="mentor-perf-no-weak">
            <CheckCircle2 size={16} /> No weak areas detected — student is on track!
          </div>
        ) : (
          <div className="mentor-perf-weak-list">
            {student.weakAreas.map((w, i) => (
              <div key={i} className="mentor-perf-weak-item">
                <AlertTriangle size={14} color="#ef4444" />
                <span className="mentor-perf-weak-item-name">{w.skill}</span>
                <span className="mentor-perf-weak-item-score">{w.score}%</span>
                <span className="mentor-perf-weak-target">Target: {w.target}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="mentor-perf-section-title">
          <BookOpen size={16} color="#4f46e5" /> Recommendations
        </h4>
        <div className="mentor-perf-recs-grid">
          {student.recommendations.map((r, i) => (
            <div key={i} className="mentor-perf-rec-item">
              <ChevronRight size={14} className="mentor-perf-rec-icon" />
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
  const [students, setStudents] = useState(defaultStudents);
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
        if (res && res.data && Array.isArray(res.data.students) && res.data.students.length > 0) {
          setStudents(res.data.students);
        }
      })
      .catch(() => {}) // graceful fallback
      .finally(() => setLoading(false));
  }, []);

  // Compute batch stats
  const totalStudents = students.length;
  const avgOverall = totalStudents ? Math.round(students.reduce((a, s) => a + s.overallScore, 0) / totalStudents) : 0;
  const needsImprovement = students.filter(s => s.overallScore < 60).length;
  const excellent = students.filter(s => s.overallScore >= 85).length;
  const batches = ["All", ...new Set(students.map(s => s.batch))];

  // Filter students
  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === "All" || s.batch === batchFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchTab = activeTab === "all" || (activeTab === "weak" && s.overallScore < 65) || (activeTab === "excel" && s.overallScore >= 80);
    return matchSearch && matchBatch && matchStatus && matchTab;
  });

  const scoreColor = (v, target = 70) => v < target ? "#ef4444" : v >= 85 ? "#10b981" : "#3b82f6";

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
      {/* Inline Mentor Performance Page Header */}
      <div className="mentor-perf-page-header">
        <div>
          <h2 className="mentor-perf-page-title">
            <LineChart size={20} color="#4f46e5" />
            <span>Student Performance</span>
          </h2>
          <p className="mentor-perf-page-subtitle">
            Monitor overall performance, identify students who need intervention, and view individual score breakdowns with recommendations.
          </p>
        </div>
      </div>

      {/* ── Overview Stats ── */}
      <div className="mentor-perf-stats-row">
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Total Students</span>
          <span className="mentor-perf-stat-value">{totalStudents}</span>
          <span className="mentor-perf-stat-sub">Assigned to you</span>
        </div>
        <div className="mentor-perf-stat-card">
          <span className="mentor-perf-stat-label">Batch Average</span>
          <span className="mentor-perf-stat-value" style={{ color: scoreColor(avgOverall, 70) }}>{avgOverall}%</span>
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
          <Search size={15} className="mentor-perf-search-icon" />
          <input
            type="text"
            placeholder="Search student or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mentor-perf-search-input"
          />
        </div>
        <div className="mentor-perf-filter-select-wrap">
          <CustomSelect
            value={batchFilter}
            options={batches.map(b => ({ value: b, label: b === "All" ? "All Batches" : b }))}
            onChange={val => setBatchFilter(val)}
            placeholder="All Batches"
            icon={Filter}
          />
        </div>
        <div className="mentor-perf-filter-select-wrap">
          <CustomSelect
            value={statusFilter}
            options={["All", "Excellent", "Good", "Average", "Needs Work"].map(s => ({ value: s, label: s === "All" ? "All Statuses" : s }))}
            onChange={val => setStatusFilter(val)}
            placeholder="All Statuses"
            icon={Target}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Students ({students.length})</TabsTrigger>
          <TabsTrigger value="weak">Needs Attention ({students.filter(s => s.overallScore < 65).length})</TabsTrigger>
          <TabsTrigger value="excel">Top Performers ({students.filter(s => s.overallScore >= 80).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="stack-4">
          <Card className="mentor-perf-table-card">
            <CardContent className="mentor-perf-card-content">
              <div className="mentor-perf-table-responsive">
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
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="mentor-perf-table-empty">
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
                                  {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="mentor-perf-student-name">{s.name}</div>
                                  <div className="mentor-perf-student-sub">{s.department} · {s.batch}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="mentor-perf-overall-score" style={{ color: sc }}>{s.overallScore}%</span>
                            </td>
                            <td><MiniBar value={s.assessment} target={75} /></td>
                            <td><MiniBar value={s.coding} target={70} /></td>
                            <td><MiniBar value={s.interview} target={65} /></td>
                            <td><MiniBar value={s.attendance} target={75} /></td>
                            <td>
                              <span className="mentor-perf-status-badge" style={{ background: sb, color: sc }}>
                                {s.status}
                              </span>
                            </td>
                            <td>
                              <span className={`mentor-perf-trend-wrap ${s.trend === "up" ? "mentor-perf-trend--up" : s.trend === "down" ? "mentor-perf-trend--down" : "mentor-perf-trend--neutral"}`}>
                                {s.trend === "up" ? <ArrowUpRight size={14} /> : s.trend === "down" ? <ArrowDownRight size={14} /> : "—"}
                                {s.trendDelta}
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
