import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Code,
  Calendar,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  Target
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_Progress.css";

/* ── Custom Tooltip for Charts ── */
function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="prog-chart-tooltip">
        <div className="prog-tooltip-title">{label}</div>
        <div className="prog-tooltip-items">
          {payload.map((entry, index) => (
            <div key={`tooltip-item-${index}`} className="prog-tooltip-row">
              <span className="prog-tooltip-dot" style={{ backgroundColor: entry.color }} />
              <span className="prog-tooltip-name">{entry.name}:</span>
              <span className="prog-tooltip-val">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="prog-chart-tooltip">
        <div className="prog-tooltip-title" style={{ color: data.payload.color }}>
          {data.name}
        </div>
        <div className="prog-tooltip-row">
          <span className="prog-tooltip-name">Students:</span>
          <span className="prog-tooltip-val">{data.value}</span>
        </div>
        <div className="prog-tooltip-row">
          <span className="prog-tooltip-name">Share:</span>
          <span className="prog-tooltip-val">{data.payload.percentage || data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function AdminProgress() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load student performance data from MySQL backend
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [perfRes, batchesRes] = await Promise.all([
          apiFetch("/admin/performance").catch(() => null),
          apiFetch("/batches").catch(() => null),
        ]);

        if (batchesRes && (batchesRes.data || Array.isArray(batchesRes))) {
          const bList = batchesRes.data || batchesRes;
          if (Array.isArray(bList)) setBatches(bList);
        }

        const perfData = perfRes?.data || perfRes || {};
        const studentList = perfData.students || [];

        const mapped = studentList.map((s, idx) => {
          const quiz = typeof s.quiz === "number" ? s.quiz : 0;
          const task = typeof s.task === "number" ? s.task : (quiz > 0 ? Math.round(quiz * 0.95) : 0);
          const attendance = typeof s.attendance === "number" ? s.attendance : 0;
          const coding = typeof s.coding === "number" ? s.coding : 0;
          const interview = typeof s.interview === "number" ? s.interview : Math.round((quiz + task) / 2);
          const overallProgress = typeof s.progress === "number"
            ? s.progress
            : (typeof s.overallScore === "number" ? s.overallScore : Math.round((quiz * 0.35) + (task * 0.25) + (attendance * 0.2) + (coding * 0.2)));

          let status = s.status;
          if (!status) {
            status = overallProgress >= 80 ? "Excellent" : overallProgress >= 60 ? "Average" : "Needs Work";
          }

          return {
            id: s.studentId || s.id || idx,
            name: s.name || "Student",
            initials: s.name ? s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "ST",
            roll: s.roll || `R-${s.studentId || idx + 1}`,
            department: s.department || "General",
            batch: s.batch || "Unassigned Batch",
            quizAvg: quiz,
            taskScore: task,
            completedTasks: s.completedTasks || 0,
            attendance: attendance,
            coding: coding,
            aiInterview: interview,
            overallProgress: Math.min(100, Math.max(0, overallProgress)),
            status: status,
            weakAreas: s.weakAreas || [],
          };
        });

        setStudents(mapped);
      } catch (err) {
        console.error("Failed to load student progress analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter students by selected batch
  const batchFilteredStudents = useMemo(() => {
    if (selectedBatch === "All Batches") return students;
    return students.filter(s => s.batch === selectedBatch);
  }, [students, selectedBatch]);

  // Search filter applied on top of batch
  const displayStudents = useMemo(() => {
    if (!searchQuery.trim()) return batchFilteredStudents;
    const q = searchQuery.toLowerCase();
    return batchFilteredStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.roll.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }, [batchFilteredStudents, searchQuery]);

  // Dynamic KPI Stats derived from current batch filter
  const kpiStats = useMemo(() => {
    const total = batchFilteredStudents.length;
    if (total === 0) {
      return {
        total: 0,
        avgQuiz: 0,
        avgTask: 0,
        avgAttendance: 0,
        avgOverall: 0,
        highPerforming: 0,
        needsSupport: 0,
      };
    }
    const avgQuiz = Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.quizAvg, 0) / total);
    const avgTask = Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.taskScore, 0) / total);
    const avgAttendance = Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.attendance, 0) / total);
    const avgOverall = Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.overallProgress, 0) / total);
    const highPerforming = batchFilteredStudents.filter(s => s.overallProgress >= 80).length;
    const needsSupport = batchFilteredStudents.filter(s => s.overallProgress < 60).length;

    return {
      total,
      avgQuiz,
      avgTask,
      avgAttendance,
      avgOverall,
      highPerforming,
      needsSupport,
    };
  }, [batchFilteredStudents]);

  // Graph 1: Comparative Performance by Batch (or by student if a single batch is selected)
  const batchComparisonData = useMemo(() => {
    if (selectedBatch === "All Batches") {
      // Group by batch
      const batchMap = {};
      students.forEach(s => {
        const b = s.batch || "Unassigned";
        if (!batchMap[b]) {
          batchMap[b] = { count: 0, quizSum: 0, taskSum: 0, attSum: 0, progSum: 0 };
        }
        batchMap[b].count++;
        batchMap[b].quizSum += s.quizAvg;
        batchMap[b].taskSum += s.taskScore;
        batchMap[b].attSum += s.attendance;
        batchMap[b].progSum += s.overallProgress;
      });

      return Object.entries(batchMap).map(([name, stats]) => ({
        name: name.length > 18 ? `${name.slice(0, 15)}...` : name,
        fullName: name,
        Quiz: Math.round(stats.quizSum / stats.count),
        Tasks: Math.round(stats.taskSum / stats.count),
        Attendance: Math.round(stats.attSum / stats.count),
        Overall: Math.round(stats.progSum / stats.count),
        students: stats.count,
      }));
    } else {
      // In a specific batch, show top 7 students comparison
      return batchFilteredStudents.slice(0, 7).map(s => ({
        name: s.name.split(" ")[0],
        fullName: s.name,
        Quiz: s.quizAvg,
        Tasks: s.taskScore,
        Attendance: s.attendance,
        Overall: s.overallProgress,
      }));
    }
  }, [students, batchFilteredStudents, selectedBatch]);

  // Graph 2: Performance Tier Distribution (Donut Chart)
  const scoreDistributionData = useMemo(() => {
    const total = batchFilteredStudents.length;
    if (total === 0) return [];

    const outstanding = batchFilteredStudents.filter(s => s.overallProgress >= 85).length;
    const proficient = batchFilteredStudents.filter(s => s.overallProgress >= 70 && s.overallProgress < 85).length;
    const average = batchFilteredStudents.filter(s => s.overallProgress >= 55 && s.overallProgress < 70).length;
    const needsWork = batchFilteredStudents.filter(s => s.overallProgress < 55).length;

    return [
      {
        name: "Outstanding (85-100%)",
        shortName: "Outstanding",
        value: outstanding,
        percentage: Math.round((outstanding / total) * 100),
        color: "#10b981", // Emerald
      },
      {
        name: "Proficient (70-84%)",
        shortName: "Proficient",
        value: proficient,
        percentage: Math.round((proficient / total) * 100),
        color: "#6366f1", // Indigo
      },
      {
        name: "Average (55-69%)",
        shortName: "Average",
        value: average,
        percentage: Math.round((average / total) * 100),
        color: "#f59e0b", // Amber
      },
      {
        name: "Needs Support (<55%)",
        shortName: "Needs Support",
        value: needsWork,
        percentage: Math.round((needsWork / total) * 100),
        color: "#ef4444", // Coral
      },
    ].filter(item => item.value > 0);
  }, [batchFilteredStudents]);

  // Graph 3: Quiz vs Practical Tasks Trend / Curve
  const trendComparisonData = useMemo(() => {
    const sorted = [...batchFilteredStudents].sort((a, b) => b.overallProgress - a.overallProgress);
    return sorted.slice(0, 8).map((s, idx) => ({
      index: `#${idx + 1}`,
      name: s.name.split(" ")[0],
      fullName: s.name,
      Quiz: s.quizAvg,
      Tasks: s.taskScore,
      Attendance: s.attendance,
      Overall: s.overallProgress,
    }));
  }, [batchFilteredStudents]);

  // Graph 4: Competency Mastery Breakdown
  const competencyMastery = useMemo(() => {
    const total = batchFilteredStudents.length;
    if (total === 0) return [];
    return [
      { module: "Quiz Assessments", score: kpiStats.avgQuiz, target: 80, color: "#6366f1" },
      { module: "Hands-on Tasks", score: kpiStats.avgTask, target: 80, color: "#10b981" },
      { module: "Session Attendance", score: kpiStats.avgAttendance, target: 85, color: "#0ea5e9" },
      {
        module: "Coding Practice",
        score: Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.coding, 0) / total),
        target: 75,
        color: "#8b5cf6",
      },
      {
        module: "AI Mock Interviews",
        score: Math.round(batchFilteredStudents.reduce((acc, s) => acc + s.aiInterview, 0) / total),
        target: 75,
        color: "#ec4899",
      },
    ];
  }, [batchFilteredStudents, kpiStats]);

  return (
    <div className="admin-progress-container">
      {/* ── Page Header ── */}
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <TrendingUp size={22} className="ui-section-title-icon" />
              <span>Student Progress & Assessment Analytics</span>
            </h2>
            <p className="ui-section-desc">
              Visual performance tracking across Technical Quizzes, Hands-on Tasks, Problem Solving, and Attendance.
            </p>
          </div>
          <div className="ui-section-action">
            <CustomSelect
              value={selectedBatch}
              onChange={setSelectedBatch}
              options={[
                { value: "All Batches", label: "All Batches" },
                ...batches.map(b => ({ value: b.name, label: b.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Top KPI Stat Cards Grid ── */}
      <div className="prog-kpi-grid">
        <div className="prog-kpi-card prog-kpi-card--primary">
          <div className="prog-kpi-top">
            <span className="prog-kpi-label">Overall Performance</span>
            <span className="prog-kpi-icon-wrap prog-kpi-icon--purple">
              <Award size={18} />
            </span>
          </div>
          <div className="prog-kpi-val-row">
            <span className="prog-kpi-val">{kpiStats.avgOverall}%</span>
            <span className="prog-kpi-badge prog-badge--green">
              <ArrowUpRight size={12} /> {kpiStats.highPerforming} High Achievers
            </span>
          </div>
          <div className="prog-kpi-subtext">
            Class average calculated across all modules & quizzes
          </div>
        </div>

        <div className="prog-kpi-card">
          <div className="prog-kpi-top">
            <span className="prog-kpi-label">Quiz Assessment Avg</span>
            <span className="prog-kpi-icon-wrap prog-kpi-icon--indigo">
              <BookOpen size={18} />
            </span>
          </div>
          <div className="prog-kpi-val-row">
            <span className="prog-kpi-val">{kpiStats.avgQuiz}%</span>
            <span className={`prog-kpi-pill ${kpiStats.avgQuiz >= 75 ? "pill--success" : "pill--warning"}`}>
              {kpiStats.avgQuiz >= 75 ? "Good Mastery" : "Moderate"}
            </span>
          </div>
          <div className="prog-kpi-subtext">
            Average accuracy on MCQ & theoretical diagnostic tests
          </div>
        </div>

        <div className="prog-kpi-card">
          <div className="prog-kpi-top">
            <span className="prog-kpi-label">Task & Practical Avg</span>
            <span className="prog-kpi-icon-wrap prog-kpi-icon--emerald">
              <Code size={18} />
            </span>
          </div>
          <div className="prog-kpi-val-row">
            <span className="prog-kpi-val">{kpiStats.avgTask}%</span>
            <span className={`prog-kpi-pill ${kpiStats.avgTask >= 75 ? "pill--success" : "pill--warning"}`}>
              {kpiStats.avgTask >= 75 ? "Strong Practical" : "Needs Practice"}
            </span>
          </div>
          <div className="prog-kpi-subtext">
            Evaluation on assigned batch coding & project tasks
          </div>
        </div>

        <div className="prog-kpi-card">
          <div className="prog-kpi-top">
            <span className="prog-kpi-label">Session Attendance</span>
            <span className="prog-kpi-icon-wrap prog-kpi-icon--sky">
              <Calendar size={18} />
            </span>
          </div>
          <div className="prog-kpi-val-row">
            <span className="prog-kpi-val">{kpiStats.avgAttendance}%</span>
            <span className={`prog-kpi-pill ${kpiStats.avgAttendance >= 80 ? "pill--success" : "pill--danger"}`}>
              {kpiStats.avgAttendance >= 80 ? "Regular" : "Defaulter Risk"}
            </span>
          </div>
          <div className="prog-kpi-subtext">
            Active session attendance rate across {kpiStats.total} students
          </div>
        </div>
      </div>

      {/* ── Main Visual Graphs Section ── */}
      <div className="prog-charts-grid">
        {/* Graph 1: Comparative Performance by Batch */}
        <Card className="prog-chart-card">
          <CardHeader className="prog-chart-header">
            <div className="prog-chart-title-wrap">
              <CardTitle className="prog-chart-title">
                <BarChart3 size={18} className="text-indigo-600" />
                <span>
                  {selectedBatch === "All Batches"
                    ? "Comparative Performance by Batch"
                    : `Student Performance Comparison (${selectedBatch})`}
                </span>
              </CardTitle>
              <p className="prog-chart-subtitle">
                Side-by-side comparison of Quiz, Practical Tasks, and Session Attendance scores
              </p>
            </div>
          </CardHeader>
          <CardContent className="prog-chart-content">
            {batchComparisonData.length === 0 ? (
              <div className="prog-chart-empty">No performance data available for this selection.</div>
            ) : (
              <div className="prog-chart-canvas-wrap">
                <ResponsiveContainer width="100%" height={290}>
                  <BarChart data={batchComparisonData} margin={{ top: 12, right: 16, left: -14, bottom: 8 }} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: 14, fontSize: 12, color: "#475569" }}
                    />
                    <Bar dataKey="Quiz" fill="#6366f1" radius={[4, 4, 0, 0]} name="Quiz Score" />
                    <Bar dataKey="Tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Task Score" />
                    <Bar dataKey="Attendance" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Attendance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 2: Performance Tier Distribution Donut */}
        <Card className="prog-chart-card">
          <CardHeader className="prog-chart-header">
            <div className="prog-chart-title-wrap">
              <CardTitle className="prog-chart-title">
                <Target size={18} className="text-emerald-600" />
                <span>Performance Mastery Distribution</span>
              </CardTitle>
              <p className="prog-chart-subtitle">
                Student tier grouping based on aggregated assessment & task scores
              </p>
            </div>
          </CardHeader>
          <CardContent className="prog-chart-content prog-donut-content">
            {scoreDistributionData.length === 0 ? (
              <div className="prog-chart-empty">No score records found.</div>
            ) : (
              <div className="prog-donut-container">
                <div className="prog-donut-chart-wrap">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={scoreDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {scoreDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="prog-donut-center-label">
                    <div className="prog-donut-center-num">{kpiStats.avgOverall}%</div>
                    <div className="prog-donut-center-text">Avg Score</div>
                  </div>
                </div>

                <div className="prog-donut-legend">
                  {scoreDistributionData.map((tier, idx) => (
                    <div key={`legend-${idx}`} className="prog-donut-legend-row">
                      <div className="prog-donut-legend-info">
                        <span className="prog-donut-dot" style={{ backgroundColor: tier.color }} />
                        <span className="prog-donut-tier-name">{tier.shortName}</span>
                      </div>
                      <div className="prog-donut-legend-nums">
                        <span className="prog-donut-count">{tier.value} students</span>
                        <span className="prog-donut-pct">({tier.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Second Row Charts: Trend Curves & Module Breakdown ── */}
      <div className="prog-charts-grid prog-charts-grid--secondary">
        {/* Graph 3: Quiz vs Practical Tasks Trend / Curve */}
        <Card className="prog-chart-card">
          <CardHeader className="prog-chart-header">
            <div className="prog-chart-title-wrap">
              <CardTitle className="prog-chart-title">
                <LineChart size={18} className="text-purple-600" />
                <span>Top Performers: Quiz vs Task Trajectory</span>
              </CardTitle>
              <p className="prog-chart-subtitle">
                Correlation between theoretical test mastery and practical task execution
              </p>
            </div>
          </CardHeader>
          <CardContent className="prog-chart-content">
            {trendComparisonData.length === 0 ? (
              <div className="prog-chart-empty">No trend data available.</div>
            ) : (
              <div className="prog-chart-canvas-wrap">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendComparisonData} margin={{ top: 10, right: 16, left: -14, bottom: 4 }}>
                    <defs>
                      <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="Quiz" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#quizGrad)" name="Quiz Score" />
                    <Area type="monotone" dataKey="Tasks" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#taskGrad)" name="Task Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 4: Competency Mastery Progress */}
        <Card className="prog-chart-card">
          <CardHeader className="prog-chart-header">
            <div className="prog-chart-title-wrap">
              <CardTitle className="prog-chart-title">
                <Sparkles size={18} className="text-amber-500" />
                <span>Overall Module Competency Rates</span>
              </CardTitle>
              <p className="prog-chart-subtitle">
                Current performance vs benchmark target (80%) across key training pillars
              </p>
            </div>
          </CardHeader>
          <CardContent className="prog-chart-content prog-competency-content">
            <div className="prog-competency-list">
              {competencyMastery.map((item, idx) => (
                <div key={`comp-${idx}`} className="prog-competency-item">
                  <div className="prog-competency-header">
                    <span className="prog-competency-name">{item.module}</span>
                    <div className="prog-competency-score-group">
                      <span className="prog-competency-val" style={{ color: item.color }}>
                        {item.score}%
                      </span>
                      <span className="prog-competency-target">/ {item.target}% target</span>
                    </div>
                  </div>
                  <div className="prog-competency-track">
                    <div
                      className="prog-competency-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.score))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                    <div
                      className="prog-competency-target-marker"
                      style={{ left: `${item.target}%` }}
                      title={`Target: ${item.target}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Detailed Student Performance Table ── */}
      <Card className="progress-table-card">
        <CardHeader className="prog-table-card-header">
          <div className="prog-table-header-left">
            <CardTitle className="prog-table-title">
              <Users size={18} className="text-indigo-600" />
              <span>Student Performance Roster ({displayStudents.length})</span>
            </CardTitle>
            <p className="prog-table-subtitle">
              Detailed breakdown of individual student marks in quizzes, tasks, and attendance
            </p>
          </div>
          <div className="prog-table-search-wrap">
            <Search size={16} className="prog-table-search-icon" />
            <input
              type="text"
              placeholder="Search by student name, roll or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="prog-table-search-input"
            />
          </div>
        </CardHeader>

        <CardContent className="progress-table-body">
          {loading ? (
            <div className="prog-table-loading">
              <div className="prog-spinner" />
              <span>Loading student progress analytics from database...</span>
            </div>
          ) : (
            <div className="prog-table-responsive">
              <table className="progress-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Department</th>
                    <th>Quiz Avg</th>
                    <th>Tasks</th>
                    <th>Attendance</th>
                    <th>Coding DSA</th>
                    <th>Status</th>
                    <th>Overall Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="admin-table-empty-cell">
                        <AlertCircle size={24} className="empty-cell-icon" />
                        <div>No student progress records match the current filter.</div>
                      </td>
                    </tr>
                  ) : (
                    displayStudents.map((s) => (
                      <tr key={s.id} className="progress-row">
                        <td>
                          <div className="progress-student-cell">
                            <Avatar size="34" className="progress-avatar">
                              <AvatarFallback>{s.initials}</AvatarFallback>
                            </Avatar>
                            <div className="progress-student-info">
                              <span className="progress-student-name">{s.name}</span>
                              <span className="progress-student-roll">{s.roll}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="progress-batch-pill">{s.batch}</span>
                        </td>
                        <td>
                          <span className="progress-dept-text">{s.department}</span>
                        </td>
                        <td>
                          <span className={`progress-score ${s.quizAvg >= 80 ? "score-high" : s.quizAvg >= 65 ? "score-mid" : "score-low"}`}>
                            {s.quizAvg}%
                          </span>
                        </td>
                        <td>
                          <div className="progress-task-cell">
                            <span className={`progress-score ${s.taskScore >= 80 ? "score-high" : s.taskScore >= 65 ? "score-mid" : "score-low"}`}>
                              {s.taskScore}%
                            </span>
                            {s.completedTasks > 0 && (
                              <span className="progress-task-count">({s.completedTasks} done)</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`progress-score ${s.attendance >= 85 ? "score-high" : s.attendance >= 75 ? "score-mid" : "score-low"}`}>
                            {s.attendance}%
                          </span>
                        </td>
                        <td>
                          <span className="progress-coding-score">
                            {s.coding > 0 ? `${s.coding}%` : "-"}
                          </span>
                        </td>
                        <td>
                          <span className={`prog-status-pill prog-status--${s.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <div className="progress-overall-col">
                            <div className="progress-bar-wrap">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${s.overallProgress}%`,
                                  background:
                                    s.overallProgress >= 80
                                      ? "linear-gradient(90deg, #10b981, #059669)"
                                      : s.overallProgress >= 65
                                      ? "linear-gradient(90deg, #6366f1, #06b6d4)"
                                      : "linear-gradient(90deg, #f59e0b, #ef4444)",
                                }}
                              />
                            </div>
                            <span className="progress-bar-text">{s.overallProgress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
