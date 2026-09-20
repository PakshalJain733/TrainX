import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Code2, MessageSquare, CalendarCheck,
  Target, Award, AlertTriangle, CheckCircle2, ChevronRight,
  BarChart3, BookOpen, Zap, Star, ArrowUpRight, ArrowDownRight,
  Lightbulb, RefreshCw, Clock, Activity
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Progress } from "../../../components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import "../Styles/Performance.css";

// ── Default / no-data state ────────────────────────────────────────────────
const defaultPerformance = {
  studentName: "—",
  department: "—",
  batch: "—",
  overallScore: null,
  status: "No Data Yet",
  trend: "stable",
  trendDelta: "",
  lastUpdated: "",
  scores: {
    assessment: null,
    coding: null,
    interview: null,
    attendance: null,
    milestone: null,
  },
  weakAreas: [],
  suggestions: [],
  scoreHistory: [],
};

// ── Radial Gauge ────────────────────────────────────────────────────────────
function RadialGauge({ value, size = 160, label, color = "#4f46e5" }) {
  const r = (size / 2) - 16;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = value == null ? 0 : (value / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={14} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={14}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">{value == null ? "N/A" : `${value}%`}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#64748b">{label}</text>
    </svg>
  );
}

// ── Score History Bar Chart ─────────────────────────────────────────────────
function ScoreHistoryChart({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="perf-empty">
        <BarChart3 size={36} color="#94a3b8" />
        <p>No assessment history recorded yet.</p>
      </div>
    );
  }
  const maxVal = 100;
  const W = 360, H = 160, padX = 40, padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const cols = ["#4f46e5", "#10b981", "#f59e0b"];
  const keys = ["assessment", "coding", "interview"];
  const labels = ["Assessment", "Coding", "Interview"];
  const groupW = chartW / (data.length || 1);
  const barW = groupW / (keys.length + 1);

  return (
    <div className="perf-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {[0, 25, 50, 75, 100].map(v => {
          const y = padY + chartH - (v / maxVal) * chartH;
          return (
            <g key={v}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              <text x={padX - 6} y={y + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {data.map((d, gi) => {
          const gx = padX + gi * groupW;
          return (
            <g key={d.week}>
              {keys.map((k, ki) => {
                const barH = (d[k] / maxVal) * chartH;
                const x = gx + ki * barW + barW * 0.3;
                const y = padY + chartH - barH;
                return <rect key={k} x={x} y={y} width={barW * 0.7} height={barH} rx="3" fill={cols[ki]} opacity="0.85" />;
              })}
              <text x={gx + groupW / 2} y={H - 4} fontSize="10" fill="#64748b" textAnchor="middle">{d.week}</text>
            </g>
          );
        })}
      </svg>
      <div className="perf-chart-legend">
        {labels.map((l, i) => (
          <span key={l} className="perf-legend-item">
            <span className="perf-legend-dot" style={{ background: cols[i] }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Score Meter Card ────────────────────────────────────────────────────────
function ScoreMeter({ label, value, icon: Icon, color, bgColor, target = 75 }) {
  const isWeak = value != null && value < target;
  const displayValue = value == null ? "N/A" : `${value}%`;
  return (
    <div className="perf-score-meter-card">
      <div className="perf-score-meter-header">
        <div className="perf-score-icon" style={{ background: bgColor, color }}>
          <Icon size={16} />
        </div>
        <span className="perf-score-label">{label}</span>
        {value == null
          ? <span className="perf-score-flag good">No Data Yet</span>
          : isWeak
            ? <span className="perf-score-flag weak">Below Target</span>
            : <span className="perf-score-flag good">On Track</span>}
      </div>
      <div className="perf-score-value" style={{ color }}>{displayValue}</div>
      <div className="perf-score-progress-bg">
        <div className="perf-score-progress-fill" style={{ width: `${value ?? 0}%`, background: color }} />
        <div className="perf-score-target-marker" style={{ left: `${target}%` }} title={`Target: ${target}%`} />
      </div>
      <div className="perf-score-footer">
        <span className="perf-score-sub">Target: {target}%</span>
        <span className={`perf-score-diff ${isWeak ? "neg" : "pos"}`}>
          {value == null ? "No data recorded" : isWeak ? `${target - value}% to go` : `+${value - target}% above`}
        </span>
      </div>
    </div>
  );
}

// ── Weak Area Card ──────────────────────────────────────────────────────────
function WeakAreaCard({ area, expanded, onToggle }) {
  return (
    <div className={`perf-weak-card ${expanded ? "perf-weak-card--open" : ""}`}>
      <button className="perf-weak-card-header" onClick={onToggle}>
        <div className="perf-weak-left">
          <span className={`perf-weak-priority priority-${area.priority.toLowerCase()}`}>{area.priority}</span>
          <div>
            <div className="perf-weak-skill">{area.skill}</div>
            <div className="perf-weak-scores">Score: <strong>{area.score}%</strong> · Target: <strong>{area.target}%</strong></div>
          </div>
        </div>
        <div className="perf-weak-right">
          <div className="perf-weak-mini-gauge">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="5" />
              <circle cx="22" cy="22" r="17" fill="none"
                stroke={area.priority === "Critical" ? "#ef4444" : "#f59e0b"}
                strokeWidth="5"
                strokeDasharray={`${(area.score / 100) * 106.8} 106.8`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)" />
              <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a">{area.score}%</text>
            </svg>
          </div>
          <ChevronRight size={18} className={`perf-weak-chevron ${expanded ? "rotated" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="perf-weak-body">
          <div className="perf-weak-reason">
            <AlertTriangle size={14} color="#f59e0b" />
            <p>{area.reason}</p>
          </div>
          <div className="perf-weak-section">
            <h5 className="perf-weak-section-title">📚 Recommended Topics</h5>
            <ul className="perf-weak-list">
              {area.topics.map((t, i) => (
                <li key={i} className="perf-weak-list-item"><BookOpen size={12} /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="perf-weak-section">
            <h5 className="perf-weak-section-title">✅ Action Plan</h5>
            <ul className="perf-weak-list perf-weak-list--actions">
              {area.actions.map((a, i) => (
                <li key={i} className="perf-weak-list-item action"><CheckCircle2 size={12} color="#10b981" /> {a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Suggestion Icon ─────────────────────────────────────────────────────────
function SuggestionIcon({ type }) {
  const map = {
    interview: { icon: MessageSquare, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    coding: { icon: Code2, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    learning: { icon: BookOpen, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    attendance: { icon: CalendarCheck, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  };
  const { icon: Icon, color, bg } = map[type] || map.learning;
  return (
    <div className="perf-suggestion-icon" style={{ background: bg, color }}>
      <Icon size={16} />
    </div>
  );
}

// ── Status helper ───────────────────────────────────────────────────────────
function statusInfo(score) {
  if (score == null) return { label: "No Data Yet", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  if (score >= 85) return { label: "Excellent", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (score >= 70) return { label: "Good", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  if (score >= 55) return { label: "Average", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { label: "Needs Work", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Performance() {
  const [data, setData] = useState(defaultPerformance);
  const [loading, setLoading] = useState(true);
  const [expandedWeak, setExpandedWeak] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/student/performance")
      .then(res => {
        if (res && res.data) setData(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => {}) // graceful fallback
      .finally(() => setLoading(false));
  }, []);

  const overall = data.overallScore;
  const { label: statusLabel, color: statusColor, bg: statusBg } = statusInfo(overall);
  const scores = data.scores || {};

  const scoreMetrics = [
    { label: "Assessment / Quiz", key: "assessment", icon: BarChart3, color: "#4f46e5", bgColor: "rgba(79,70,229,0.12)", target: 75 },
    { label: "Coding Score", key: "coding", icon: Code2, color: "#3b82f6", bgColor: "rgba(59,130,246,0.12)", target: 70 },
    { label: "Interview Score", key: "interview", icon: MessageSquare, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.12)", target: 65 },
    { label: "Attendance", key: "attendance", icon: CalendarCheck, color: "#10b981", bgColor: "rgba(16,185,129,0.12)", target: 75 },
    { label: "Milestone / Progress", key: "milestone", icon: Target, color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)", target: 70 },
  ];

  if (loading) {
    return (
      <div className="perf-loading">
        <RefreshCw size={28} className="perf-spin" />
        <p>Loading your performance data…</p>
      </div>
    );
  }

  return (
    <div className="student-page-inner stack-6">
      <SectionHeader
        eyebrow="Performance Analytics"
        title="My Performance"
        description="Your combined academic, coding, and interview performance analysis with personalised improvement recommendations."
      />

      {/* ── Overall Score Hero ── */}
      <div className="perf-hero-card">
        <div className="perf-hero-gauge">
          <RadialGauge value={overall} label="Overall Score" color={statusColor} size={170} />
        </div>
        <div className="perf-hero-info">
          <div className="perf-hero-name-row">
            <h2 className="perf-hero-name">{data.studentName}</h2>
            <span className="perf-hero-dept">{data.department} · {data.batch}</span>
          </div>
          <div className="perf-hero-status-row">
            <span className="perf-hero-status-badge" style={{ background: statusBg, color: statusColor }}>
              <Activity size={14} /> {statusLabel}
            </span>
            <span className={`perf-hero-trend ${data.trend}`}>
              {data.trend === "up" ? <ArrowUpRight size={15} /> : data.trend === "down" ? <ArrowDownRight size={15} /> : <Activity size={15} />}
              {data.trendDelta || "No trend data yet"}
            </span>
          </div>
          <div className="perf-hero-meta-row">
            <span><Clock size={13} /> Updated: {data.lastUpdated || "—"}</span>
            <span><Star size={13} /> {data.weakAreas?.length || 0} weak area{data.weakAreas?.length !== 1 ? "s" : ""} identified</span>
          </div>
          {overall != null && overall < 75 && (
            <div className="perf-hero-alert">
              <AlertTriangle size={15} />
              <span>Overall score is below the 75% threshold. Focus on weak areas highlighted below.</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
          <TabsTrigger value="weak">Weak Areas</TabsTrigger>
          <TabsTrigger value="suggest">Improvement Plan</TabsTrigger>
          <TabsTrigger value="history">Score History</TabsTrigger>
        </TabsList>

        {/* Score Breakdown */}
        <TabsContent value="scores" className="stack-4">
          <div className="perf-section-heading">
            <h3>Score Breakdown</h3>
            <p>All performance dimensions with target benchmarks</p>
          </div>
          <div className="perf-score-grid">
            {scoreMetrics.map(m => (
              <ScoreMeter key={m.key} label={m.label} value={scores[m.key] ?? 0}
                icon={m.icon} color={m.color} bgColor={m.bgColor} target={m.target} />
            ))}
          </div>
        </TabsContent>

        {/* Weak Areas */}
        <TabsContent value="weak" className="stack-4">
          <div className="perf-section-heading">
            <h3>Weak Areas</h3>
            <p>Click on any area to see the full analysis and action plan</p>
          </div>
          {data.weakAreas && data.weakAreas.length > 0 ? (
            <div className="perf-weak-list-wrap">
              {data.weakAreas.map(area => (
                <WeakAreaCard key={area.id} area={area}
                  expanded={expandedWeak === area.id}
                  onToggle={() => setExpandedWeak(expandedWeak === area.id ? null : area.id)} />
              ))}
            </div>
          ) : (
            <div className="perf-empty">
              <CheckCircle2 size={36} color="#10b981" />
              <p>No critical weak areas found. Keep it up!</p>
            </div>
          )}
        </TabsContent>

        {/* Improvement Plan */}
        <TabsContent value="suggest" className="stack-4">
          <div className="perf-section-heading">
            <h3>Improvement Plan</h3>
            <p>Personalised recommendations based on your performance data</p>
          </div>
          <div className="perf-suggestions-grid">
            {(data.suggestions || []).map((s, i) => (
              <div key={s.id} className="perf-suggestion-card">
                <div className="perf-suggestion-top">
                  <SuggestionIcon type={s.icon} />
                  <span className="perf-suggestion-num">#{i + 1}</span>
                </div>
                <p className="perf-suggestion-text">{s.text}</p>
                <a href={s.link} className="perf-suggestion-action">
                  {s.action} <ChevronRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Score History */}
        <TabsContent value="history" className="stack-4">
          <div className="perf-section-heading">
            <h3>Score History</h3>
            <p>Weekly trend of assessment, coding, and interview scores</p>
          </div>
          <Card className="perf-history-card">
            <CardContent style={{ paddingTop: 20 }}>
              <ScoreHistoryChart data={data.scoreHistory || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
