import React, { useState, useEffect, useRef } from "react";
import {
  Users, TrendingUp, AlertTriangle, ChevronRight, Search,
  BarChart3, Code2, MessageSquare, CalendarCheck, Target,
  CheckCircle2, BookOpen, XCircle, RefreshCw, ArrowUpRight,
  ArrowDownRight, Filter, Eye, ChevronDown, Check
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import "../../Student/Styles/Performance.css";
import "../Styles/Performance.css";

/* ── Inline dropdown for Mentor Performance (CSS: Performance.css .mentor-perf-select-*) ── */
function MentorPerfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-perf-select-wrap${isOpen ? ' mentor-perf-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-perf-select-trigger${isOpen ? ' mentor-perf-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-perf-select-icon" />}
        <span className="mentor-perf-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-perf-select-arrow${isOpen ? ' mentor-perf-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-perf-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-perf-select-option${isSel ? ' mentor-perf-select-option--selected' : ''}`}>
                <span className="mentor-perf-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-perf-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Default fallback data ──────────────────────────────────────────────────
const defaultStudents = [
  {
    id: "st-1", name: "Ganesh Shinde", department: "ECS", batch: "Batch A",
    overallScore: 71, assessment: 78, coding: 65, interview: 58, attendance: 82, milestone: 74,
    status: "Average", trend: "up", trendDelta: "+4%",
    weakAreas: [
      { skill: "AI Mock Interview", score: 58, target: 75 },
      { skill: "Coding / DSA", score: 65, target: 80 },
    ],
    recommendations: [
      "Schedule 2 AI Mock Interview sessions this week.",
      "Complete the Dynamic Programming problem set.",
      "Maintain 80%+ attendance for placement eligibility.",
    ],
  },
  {
    id: "st-2", name: "Priya Nair", department: "CSE", batch: "Batch A",
    overallScore: 85, assessment: 88, coding: 82, interview: 79, attendance: 91, milestone: 86,
    status: "Excellent", trend: "up", trendDelta: "+6%",
    weakAreas: [],
    recommendations: ["Attempt advanced DSA problems to maintain rank.", "Try the AI Interview for leadership-track prep."],
  },
  {
    id: "st-3", name: "Rahul Mehta", department: "IT", batch: "Batch B",
    overallScore: 52, assessment: 55, coding: 48, interview: 42, attendance: 68, milestone: 50,
    status: "Needs Work", trend: "down", trendDelta: "-3%",
    weakAreas: [
      { skill: "AI Mock Interview", score: 42, target: 65 },
      { skill: "Coding / DSA", score: 48, target: 70 },
      { skill: "Attendance", score: 68, target: 75 },
    ],
    recommendations: [
      "Urgently improve attendance (currently 68%).",
      "Complete 3 practice coding sessions before next assessment.",
      "Schedule mentor one-on-one session immediately.",
    ],
  },
  {
    id: "st-4", name: "Sneha Patil", department: "ECS", batch: "Batch A",
    overallScore: 68, assessment: 72, coding: 60, interview: 64, attendance: 78, milestone: 66,
    status: "Average", trend: "stable", trendDelta: "0%",
    weakAreas: [
      { skill: "Coding / DSA", score: 60, target: 70 },
    ],
    recommendations: [
      "Focus on graph algorithms in the practice module.",
      "Review last quiz feedback and reattempt.",
    ],
  },
];

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
                <span className="mentor-perf-weak-item-score">{w.score}%</span>
                <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Target: {w.target}%</span>
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
        if (res && res.data && res.data.students) {
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
          <Search size={14} />
          <input
            type="text"
            placeholder="Search student or dept…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: "160px" }}>
          <MentorPerfSelect
            value={batchFilter}
            options={batches.map(b => ({ value: b, label: b === "All" ? "All Batches" : b }))}
            onChange={(val) => setBatchFilter(val)}
          />
        </div>
        <div style={{ minWidth: "160px" }}>
          <MentorPerfSelect
            value={statusFilter}
            options={["All", "Excellent", "Good", "Average", "Needs Work"].map(s => ({ value: s, label: s === "All" ? "All Statuses" : s }))}
            onChange={(val) => setStatusFilter(val)}
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
                    {filtered.length === 0 ? (
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
                                  {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="mentor-perf-student-name">{s.name}</div>
                                  <div className="mentor-perf-student-sub">{s.department} · {s.batch}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 15, fontWeight: 800, color: sc }}>{s.overallScore}%</span>
                            </td>
                            <td><MiniBar value={s.assessment} target={75} /></td>
                            <td><MiniBar value={s.coding} target={70} /></td>
                            <td><MiniBar value={s.interview} target={65} /></td>
                            <td><MiniBar value={s.attendance} target={75} /></td>
                            <td>
                              <span style={{ background: sb, color: sc, padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                                {s.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600,
                                color: s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : "#64748b" }}>
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
