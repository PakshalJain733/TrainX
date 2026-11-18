import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  RefreshCw,
  Zap,
  Award,
  BarChart3,
  ListChecks,
  Search,
  BookOpen,
  TrendingDown,
  LineChart,
  X,
  Check,
  Clock,
  Code2,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  TrendingUp,
  ChevronRight,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
  Target,
  Bot
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_ProgressAnalytics.css";
import { EVENTS } from "../../../utils/sharedStore";

function DonutSegment({ cx, cy, r, strokeWidth, pct, color, offset, isHovered, onMouseEnter, onMouseMove, onMouseLeave }) {
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const gap = circumference - dash;
  const rotation = -90 + (offset / 100) * 360;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
      strokeDasharray={`${dash} ${gap}`}
      strokeLinecap="round"
      transform={`rotate(${rotation} ${cx} ${cy})`}
      className={`donut-segment ${isHovered ? "donut-segment--active" : ""}`}
      style={{
        cursor: "pointer",
        filter: isHovered ? `drop-shadow(0 4px 10px ${color}88)` : "none",
        transition: "stroke-width 0.2s ease, filter 0.2s ease",
      }}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  );
}

function SkillGapAnalyticsSection({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'weak' | 'plan'
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLiveSkillGapData = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/skill-gaps");

      if (res && res.success && res.data) {
        setAnalysis(res.data);
      } else if (res && res.suggestions) {
        setAnalysis(res);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      console.warn("API request failed:", err);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSkillGapData();
  }, []);

  const rawAllEvaluatedSkills = analysis?.all_evaluated_skills || [];
  const suggestionsList = analysis?.suggestions || [];
  const rawWeakSkillsOnly = rawAllEvaluatedSkills.filter((s) => s.is_weak || s.score < 60);

  const query = searchQuery.trim().toLowerCase();

  const allEvaluatedSkills = rawAllEvaluatedSkills.filter((item) =>
    query ? item.skill.toLowerCase().includes(query) : true
  );

  const weakSkillsOnly = rawWeakSkillsOnly.filter((item) =>
    query ? item.skill.toLowerCase().includes(query) : true
  );

  const filteredSuggestions = suggestionsList.filter((item) => {
    if (query) {
      return item.skill.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="skill-gap-dynamic-container">
      {/* Top Bar */}
      <div className="sg-header-bar">
        <div className="sg-title-group">
          <div className="sg-brain-badge">
            <Brain className="spa-icon-brain" />
          </div>
          <div>
            <div className="sg-subtitle">
              <span>Real-Time AI Skill Engine</span>
              <Sparkles className="spa-icon-sparkles" />
            </div>
            <h3 className="sg-title">AI Performance & Weak Area Detection</h3>
            <p className="sg-subtitle">
              Evaluated across your Coding Practice Sums, Coding Tasks, Quizzes & AI Technical Interviews.
            </p>
          </div>
        </div>

        <div className="sg-actions-group">
          <button
            onClick={() => fetchLiveSkillGapData()}
            className="sg-refresh-btn"
            disabled={loading}
            title="Refresh Analysis from Backend Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live Data</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="sg-close-btn"
              title="Close Skill Gap Dashboard"
            >
              <X size={16} />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="sg-loading-state">
          <RefreshCw className="spa-icon-spin" />
          <span>Analyzing performance across Coding Practice Sums, Coding Tasks, Quizzes & AI Interviews...</span>
        </div>
      ) : allEvaluatedSkills.length === 0 ? (
        <div className="empty-state-box">
          <BookOpen className="spa-icon-book" />
          <h4>No Assessment Performance Data Found</h4>
          <p>Complete your first Quiz, Coding Problem, or AI Technical Interview to generate your personalized AI Skill Gap Analysis & Actionable Roadmap.</p>
        </div>
      ) : (
        <div className="sg-main-content">
          {/* Status Banner */}
          <div
            className={`sg-status-banner ${
              (analysis?.weak_areas_count || 0) > 0 ? "banner-warn" : "banner-ok"
            }`}
          >
            <div className="banner-info">
              {(analysis?.weak_areas_count || 0) > 0 ? (
                <AlertTriangle className="spa-icon-alert" />
              ) : (
                <CheckCircle2 className="spa-icon-check" />
              )}
              <div>
                <h4 className="banner-title">
                  Overall Status: {analysis?.overall_status || "On Track / Strong"}
                </h4>
                <p className="banner-subtitle">
                  {(analysis?.weak_areas_count || 0) > 0
                    ? `Identified ${analysis.weak_areas_count} weak area${
                        analysis.weak_areas_count > 1 ? "s" : ""
                      } needing targeted practice: ${Array.isArray(analysis?.weak_areas) ? analysis.weak_areas.join(", ") : ""}`
                    : "No major weak skills detected! Performance across all technical domains is strong."}
                </p>
              </div>
            </div>

            {(analysis?.weak_areas_count || 0) > 0 && (
              <div className="banner-count-badge">
                {analysis.weak_areas_count} Weak Area{analysis.weak_areas_count > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Navigation Filter Tabs */}
          <div className="sg-tabs-row">
            <div className="sg-tabs-left">
              <button
                onClick={() => setActiveTab("all")}
                className={`sg-tab-btn ${activeTab === "all" ? "sg-tab-btn--active" : ""}`}
              >
                <BarChart3 className="w-4 h-4" /> All Skills ({allEvaluatedSkills.length})
              </button>
              <button
                onClick={() => setActiveTab("weak")}
                className={`sg-tab-btn ${activeTab === "weak" ? "sg-tab-btn--active" : ""}`}
              >
                <AlertTriangle className="w-4 h-4" /> Weak Areas Diagnosis ({weakSkillsOnly.length})
              </button>
              <button
                onClick={() => setActiveTab("plan")}
                className={`sg-tab-btn ${activeTab === "plan" ? "sg-tab-btn--active" : ""}`}
              >
                <ListChecks className="w-4 h-4" /> Actionable Roadmap ({filteredSuggestions.length})
              </button>
            </div>

            <div className="sg-search-box">
              <Search className="spa-icon-search" />
              <input
                type="text"
                placeholder="Filter by skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* TAB 1: ALL EVALUATED SKILLS MATRIX */}
          {activeTab === "all" && (
            <div className="skills-overview-grid">
              {allEvaluatedSkills.map((item, i) => (
                <div key={i} className="skill-meter-card">
                  <div className="skill-meter-header">
                    <span className="skill-meter-title">{item.skill}</span>
                    <span
                      className={`skill-meter-val ${
                        item.score < 50 ? "val-low" : item.score < 75 ? "val-mid" : "val-high"
                      }`}
                    >
                      {item.score}%
                    </span>
                  </div>

                  <div className="skill-progress-track">
                    <div
                      className={`skill-progress-fill ${
                        item.score < 50 ? "fill-low" : item.score < 75 ? "fill-mid" : "fill-high"
                      }`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>

                  <div className="skill-meter-footer">
                    <span className="skill-status-tag">
                      {item.score < 50 ? "Critical Weakness" : item.score < 60 ? "Moderate Weakness" : "Strong"}
                    </span>
                    <span className="skill-source-tag">Aggregated Score</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DETECTED WEAK AREAS DIAGNOSIS ONLY */}
          {activeTab === "weak" && (
            <div className="weak-diagnosis-grid">
              {weakSkillsOnly.length > 0 ? (
                weakSkillsOnly.map((item, idx) => (
                  <div key={idx} className="weak-diagnosis-card">
                    <div className="diag-header">
                      <div className="diag-title-box">
                        <TrendingDown className="spa-icon-trending-down" />
                        <div>
                          <h4 className="diag-skill-name">{item.skill}</h4>
                          <span className="diag-reason">{item.reason || `Calculated average score is ${item.score}%.`}</span>
                        </div>
                      </div>
                      <div className="diag-score-badge">
                        <span className="diag-score-num">{item.score}%</span>
                        <span className="diag-score-lbl">Score</span>
                      </div>
                    </div>

                    <div className="diag-pills-row">
                      <span className={`badge-pill level-${(item.weakness_level || 'critical').toLowerCase()}`}>
                        {item.weakness_level || 'Critical'} Weakness
                      </span>
                      <span className={`badge-pill priority-${(item.priority || 'high').toLowerCase()}`}>
                        Priority: {item.priority || 'High'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box">
                  <Award className="spa-icon-award" />
                  <h4>No Weak Areas Detected!</h4>
                  <p>Great job! All your evaluated skill scores are above 60%.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIONABLE ROADMAP ONLY */}
          {activeTab === "plan" && (
            <div className="actionable-roadmap-wrapper">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((item, idx) => (
                  <div key={idx} className="roadmap-plan-card">
                    <div className="roadmap-plan-header">
                      <div>
                        <span className="roadmap-skill-tag">{item.skill} ({item.score})</span>
                        <h4 className="roadmap-title">AI Action Plan for {item.skill}</h4>
                      </div>
                      <span className={`badge-pill priority-${item.priority.toLowerCase()}`}>
                        {item.priority} Priority
                      </span>
                    </div>

                    <div className="roadmap-steps-timeline">
                      {Array.isArray(item.recommendation) ? (
                        item.recommendation.map((step, sIdx) => (
                          <div key={sIdx} className="timeline-node">
                            <div className="node-circle">{sIdx + 1}</div>
                            <div className="node-content">
                              <span className="node-label">Phase {sIdx + 1} Action</span>
                              <p className="node-text">{step}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="timeline-node">
                          <div className="node-circle">1</div>
                          <div className="node-content">
                            <span className="node-label">Recommended Action</span>
                            <p className="node-text">{item.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box">
                  <Award className="spa-icon-award" />
                  <h4>Roadmap Complete!</h4>
                  <p>No active weakness roadmaps required. You are on track across all domains.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DynamicProgressLineGraph({
  weeklyData = [],
  monthlyData = [],
  overallProgress = 0,
  activityCards = [],
  breakdown = null,
}) {
  const [timeframe, setTimeframe] = useState("weekly"); // 'weekly' | 'monthly' | 'overall'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const activeData = React.useMemo(() => {
    if (timeframe === "monthly") {
      return (monthlyData && monthlyData.length > 0)
        ? monthlyData
        : [{ label: "Month 1", value: 0 }, { label: "Month 2", value: overallProgress }];
    }
    return (weeklyData && weeklyData.length > 0)
      ? weeklyData
      : [
          { label: "Week 1", value: 0 },
          { label: "Week 2", value: Math.round(overallProgress * 0.3) },
          { label: "Week 3", value: Math.round(overallProgress * 0.6) },
          { label: "Week 4", value: overallProgress },
        ];
  }, [timeframe, monthlyData, weeklyData, overallProgress]);

  const svgWidth = 720;
  const svgHeight = 240;
  const padLeft = 46;
  const padRight = 28;
  const padTop = 22;
  const padBottom = 40;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const baselineY = padTop + plotH;

  const pts = React.useMemo(() => {
    return activeData.map((d, i) => {
      const val = Math.min(100, Math.max(0, Number(d.value) || 0));
      const x = activeData.length > 1
        ? padLeft + (i * plotW) / (activeData.length - 1)
        : padLeft + plotW / 2;
      const y = baselineY - (val / 100) * plotH;
      return { x, y, val, item: d };
    });
  }, [activeData, plotW, plotH, baselineY, padLeft]);

  // Smooth Catmull-Rom to Cubic Bezier curve
  const linePath = React.useMemo(() => {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }, [pts]);

  const areaPath = React.useMemo(() => {
    if (!linePath || pts.length === 0) return "";
    const firstPt = pts[0];
    const lastPt = pts[pts.length - 1];
    return `${linePath} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;
  }, [linePath, pts, baselineY]);

  const hoveredPt = hoveredIdx !== null && hoveredIdx < pts.length ? pts[hoveredIdx] : null;

  // Fallback cards if empty
  const cardsToRender = (activityCards && activityCards.length >= 5)
    ? activityCards
    : [
        {
          id: 'attendance',
          title: 'Attendance',
          icon: 'CalendarCheck',
          numerator: breakdown?.attendance?.present ?? 0,
          denominator: breakdown?.attendance?.total ?? 0,
          ratioLabel: breakdown?.attendance?.hasData ? `${breakdown.attendance.present} / ${breakdown.attendance.total} Sessions` : 'No Sessions',
          percentage: breakdown?.attendance?.percentage ?? 0,
          subtext: breakdown?.attendance?.hasData ? `${breakdown.attendance.percentage}% attendance` : 'No attendance recorded',
          color: '#ec4899',
          hasData: breakdown?.attendance?.hasData ?? false,
        },
        {
          id: 'batch_tasks',
          title: 'Batch Tasks',
          icon: 'BookOpen',
          numerator: breakdown?.batchTasks?.submitted ?? 0,
          denominator: breakdown?.batchTasks?.total ?? 0,
          ratioLabel: `${breakdown?.batchTasks?.submitted ?? 0} / ${breakdown?.batchTasks?.total ?? 0} Tasks`,
          percentage: breakdown?.batchTasks?.percentage ?? 0,
          subtext: breakdown?.batchTasks?.total > 0 ? `${breakdown.batchTasks.percentage}% submitted` : 'No tasks assigned',
          color: '#4f46e5',
        },
        {
          id: 'quizzes',
          title: 'Quizzes',
          icon: 'CheckSquare',
          numerator: breakdown?.quizzes?.attempted ?? 0,
          denominator: breakdown?.quizzes?.total ?? 0,
          ratioLabel: `${breakdown?.quizzes?.attempted ?? 0} / ${breakdown?.quizzes?.total ?? 0} Quizzes`,
          percentage: breakdown?.quizzes?.percentage ?? 0,
          subtext: breakdown?.quizzes?.hasData ? `${breakdown.quizzes.percentage}% attended` : 'No quizzes active',
          color: '#10b981',
        },
        {
          id: 'coding_practice',
          title: 'Coding Practice',
          icon: 'Code2',
          numerator: breakdown?.coding?.solved ?? 0,
          denominator: breakdown?.coding?.total ?? 0,
          ratioLabel: `${breakdown?.coding?.solved ?? 0} / ${breakdown?.coding?.total ?? 0} Solved`,
          percentage: breakdown?.coding?.percentage ?? 0,
          subtext: `${breakdown?.coding?.percentage ?? 0}% completed`,
          color: '#06b6d4',
        },
        {
          id: 'ai_roadmap',
          title: 'AI Roadmap',
          icon: 'Sparkles',
          numerator: breakdown?.roadmap?.completed ?? 0,
          denominator: breakdown?.roadmap?.total ?? 0,
          ratioLabel: `${breakdown?.roadmap?.completed ?? 0} / ${breakdown?.roadmap?.total ?? 0} Modules`,
          percentage: breakdown?.roadmap?.percentage ?? 0,
          subtext: `${breakdown?.roadmap?.percentage ?? 0}% completed`,
          color: '#8b5cf6',
        },
        {
          id: 'ai_interview',
          title: 'AI Interview',
          icon: 'Bot',
          numerator: breakdown?.interview?.score ?? 0,
          denominator: 100,
          ratioLabel: breakdown?.interview?.hasData ? `${breakdown.interview.score}% Score` : 'Not Attempted',
          percentage: breakdown?.interview?.hasData ? (breakdown.interview.score ?? 0) : 0,
          subtext: breakdown?.interview?.hasData ? 'Latest assessment' : 'Pending first interview',
          color: '#f59e0b',
          hasData: breakdown?.interview?.hasData ?? false,
        },
      ];

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'CalendarCheck': return <CalendarCheck size={14} />;
      case 'BookOpen': return <BookOpen size={14} />;
      case 'CheckSquare': return <CheckSquare size={14} />;
      case 'Code2': return <Code2 size={14} />;
      case 'Sparkles': return <Sparkles size={14} />;
      case 'Bot': return <Bot size={14} />;
      default: return <Target size={14} />;
    }
  };

  return (
    <div className="progress-hero-container">
      {/* Header Row: Title, Subtitle, Timeframe switcher */}
      <div className="progress-hero-header">
        <div className="progress-hero-header__left">
          <div className="progress-hero-badge">
            <LineChart size={18} />
          </div>
          <div>
            <div className="progress-hero-eyebrow">
              <span>Dynamic Learning Velocity</span>
              <span className="progress-hero-bullet">•</span>
              <span className="progress-hero-weights-note">Multi-Track Evaluation</span>
            </div>
            <h3 className="progress-hero-title">
              {timeframe === "weekly" ? "Weekly Learning Progress" : (timeframe === "monthly" ? "Monthly Learning Progress" : "Overall Cumulative Progress")}
            </h3>
            <p className="progress-hero-desc">
              Multi-activity tracking evaluated across Attendance, Coding, Batch Tasks, Quizzes, AI Roadmap, and AI Interviews.
            </p>
          </div>
        </div>

        <div className="progress-hero-header__right">
          {/* Timeframe selector pills */}
          <div className="progress-view-pills">
            <button
              type="button"
              className={`progress-pill-btn ${timeframe === "weekly" ? "progress-pill-btn--active" : ""}`}
              onClick={() => { setTimeframe("weekly"); setHoveredIdx(null); }}
            >
              Weekly Progress
            </button>
            <button
              type="button"
              className={`progress-pill-btn ${timeframe === "monthly" ? "progress-pill-btn--active" : ""}`}
              onClick={() => { setTimeframe("monthly"); setHoveredIdx(null); }}
            >
              Monthly Progress
            </button>
            <button
              type="button"
              className={`progress-pill-btn ${timeframe === "overall" ? "progress-pill-btn--active" : ""}`}
              onClick={() => { setTimeframe("overall"); setHoveredIdx(null); }}
            >
              Overall Progress
            </button>
          </div>

          <div className="progress-hero-score-badge">
            <span className="score-val">{overallProgress}%</span>
            <span className="score-lbl">Current Overall</span>
          </div>
        </div>
      </div>

      {/* Split Body: Left Line Chart (60%) + Right 5 Activity Cards (40%) */}
      <div className="progress-hero-body-split">
        <div className="progress-hero-left-chart">
          <div className="progress-line-chart-card">
            <div className="progress-line-chart-container" onMouseLeave={() => setHoveredIdx(null)}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" className="progress-line-svg">
                <defs>
                  <linearGradient id="progressLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
                    <stop offset="65%" stopColor="#4f46e5" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="progressLineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </linearGradient>
                  <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.35" />
                  </filter>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels (0, 20, 40, 60, 80, 100) */}
                {[0, 20, 40, 60, 80, 100].map((v) => {
                  const y = baselineY - (v / 100) * plotH;
                  return (
                    <g key={v}>
                      <line
                        x1={padLeft - 6}
                        y1={y}
                        x2={padLeft + plotW + 12}
                        y2={y}
                        stroke={v === 0 ? "#cbd5e1" : "#f1f5f9"}
                        strokeDasharray={v === 0 ? "0" : "4 4"}
                        strokeWidth={v === 0 ? "1.5" : "1"}
                      />
                      <text
                        x={padLeft - 12}
                        y={y + 4}
                        fontSize="11"
                        fill="#94a3b8"
                        fontWeight="500"
                        textAnchor="end"
                      >
                        {v}%
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Area Fill under Curve */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#progressLineAreaGrad)"
                    className="progress-line-area-fill"
                  />
                )}

                {/* Main Smooth Bezier Line Path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#progressLineStrokeGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="progress-line-stroke"
                  />
                )}

                {/* Vertical crosshair line for hovered point */}
                {hoveredPt && (
                  <line
                    x1={hoveredPt.x}
                    y1={padTop}
                    x2={hoveredPt.x}
                    y2={baselineY}
                    stroke="#818cf8"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    className="progress-crosshair-line"
                  />
                )}

                {/* X-Axis Data Markers & Labels */}
                {pts.map((pt, i) => {
                  const isHovered = hoveredIdx === i;
                  const isLast = i === pts.length - 1;
                  return (
                    <g
                      key={i}
                      className="progress-line-marker-group"
                      onMouseEnter={() => setHoveredIdx(i)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Invisible generous hover catch target */}
                      <circle cx={pt.x} cy={pt.y} r="20" fill="transparent" />

                      {/* Marker Outer Glow Ring */}
                      {(isHovered || isLast) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "12" : "8"}
                          fill="#4f46e5"
                          fillOpacity={isHovered ? 0.22 : 0.12}
                          className={isHovered ? "animate-pulse" : ""}
                        />
                      )}

                      {/* Marker Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6.5" : "4.8"}
                        fill="#ffffff"
                        stroke="#4f46e5"
                        strokeWidth={isHovered ? "3.5" : "2.5"}
                        filter="url(#pointGlow)"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "3.2" : "2.2"}
                        fill="#4f46e5"
                      />

                      {/* X-Axis Label */}
                      <text
                        x={pt.x}
                        y={baselineY + 18}
                        fontSize="11.5"
                        fill={isHovered ? "#4f46e5" : "#64748b"}
                        fontWeight={isHovered ? "700" : "600"}
                        textAnchor="middle"
                      >
                        {pt.item.label || pt.item.week || pt.item.month}
                      </text>

                      {/* X-Axis Sub-Date Label */}
                      {pt.item.dateLabel && (
                        <text
                          x={pt.x}
                          y={baselineY + 32}
                          fontSize="10"
                          fill={isHovered ? "#6366f1" : "#94a3b8"}
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {pt.item.dateLabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating Rich Tooltip */}
              {hoveredPt && (
                <div
                  className={`progress-chart-floating-tooltip ${hoveredPt.x > 380 ? "progress-chart-floating-tooltip--left" : "progress-chart-floating-tooltip--right"}`}
                  style={{
                    left: `${(hoveredPt.x / svgWidth) * 100}%`,
                    top: `${(hoveredPt.y / svgHeight) * 100}%`,
                  }}
                >
                  <div className="pct-tooltip-header">
                    <div className="pct-tooltip-title-wrap">
                      <span className="pct-tooltip-title">{hoveredPt.item.label || hoveredPt.item.week || hoveredPt.item.month}</span>
                      {hoveredPt.item.dateLabel && <span className="pct-tooltip-date">{hoveredPt.item.dateLabel}</span>}
                    </div>
                    <span className="pct-tooltip-score-badge">{hoveredPt.val}% Overall</span>
                  </div>

                  {hoveredPt.item.breakdown && (
                    <div className="pct-tooltip-list">
                      {hoveredPt.item.breakdown.attendance && (
                        <div className="pct-tooltip-row">
                          <span className="pct-tooltip-dot" style={{ background: "#ec4899" }}></span>
                          <span className="pct-tooltip-name">Attendance</span>
                          <span className="pct-tooltip-val">
                            {hoveredPt.item.breakdown.attendance?.hasData
                              ? `${hoveredPt.item.breakdown.attendance?.percentage}% (${hoveredPt.item.breakdown.attendance?.present}/${hoveredPt.item.breakdown.attendance?.total})`
                              : 'No Sessions'}
                          </span>
                        </div>
                      )}
                      <div className="pct-tooltip-row">
                        <span className="pct-tooltip-dot" style={{ background: "#06b6d4" }}></span>
                        <span className="pct-tooltip-name">Coding Practice</span>
                        <span className="pct-tooltip-val">
                          {hoveredPt.item.breakdown.coding?.percentage ?? 0}% ({hoveredPt.item.breakdown.coding?.solved ?? 0}/{hoveredPt.item.breakdown.coding?.total ?? 0})
                        </span>
                      </div>
                      <div className="pct-tooltip-row">
                        <span className="pct-tooltip-dot" style={{ background: "#4f46e5" }}></span>
                        <span className="pct-tooltip-name">Batch Tasks</span>
                        <span className="pct-tooltip-val">
                          {hoveredPt.item.breakdown.batchTasks?.percentage ?? 0}% ({hoveredPt.item.breakdown.batchTasks?.submitted ?? 0}/{hoveredPt.item.breakdown.batchTasks?.total ?? 0})
                        </span>
                      </div>
                      <div className="pct-tooltip-row">
                        <span className="pct-tooltip-dot" style={{ background: "#10b981" }}></span>
                        <span className="pct-tooltip-name">Quizzes</span>
                        <span className="pct-tooltip-val">
                          {hoveredPt.item.breakdown.quizzes?.percentage ?? 0}% ({hoveredPt.item.breakdown.quizzes?.attempted ?? 0}/{hoveredPt.item.breakdown.quizzes?.total ?? 0})
                        </span>
                      </div>
                      <div className="pct-tooltip-row">
                        <span className="pct-tooltip-dot" style={{ background: "#8b5cf6" }}></span>
                        <span className="pct-tooltip-name">AI Roadmap</span>
                        <span className="pct-tooltip-val">
                          {hoveredPt.item.breakdown.roadmap?.percentage ?? 0}% ({hoveredPt.item.breakdown.roadmap?.completed ?? 0}/{hoveredPt.item.breakdown.roadmap?.total ?? 0})
                        </span>
                      </div>
                      <div className="pct-tooltip-row">
                        <span className="pct-tooltip-dot" style={{ background: "#f59e0b" }}></span>
                        <span className="pct-tooltip-name">AI Interview</span>
                        <span className="pct-tooltip-val">
                          {hoveredPt.item.breakdown.interview?.hasData ? `${hoveredPt.item.breakdown.interview?.score}%` : 'Not Attempted'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 6 Activity Breakdown Indicator Cards in Square Form (2 side by side) */}
        <div className="progress-hero-right-cards">
          <div className="progress-activity-cards-grid-2col">
            {cardsToRender.map((c, idx) => (
              <div key={idx} className="progress-activity-card progress-activity-card--square">
                <div className="progress-act-square-top">
                  <div className="progress-act-icon" style={{ color: c.color, background: `${c.color}15` }}>
                    {renderIcon(c.icon)}
                  </div>
                  <span className="progress-act-pct" style={{ color: c.color }}>
                    {c.hasData === false ? '—' : `${c.percentage}%`}
                  </span>
                </div>

                <div className="progress-act-square-middle">
                  <h4 className="progress-act-title">{c.title}</h4>
                  <span className="progress-act-ratio">{c.ratioLabel}</span>
                </div>

                <div className="progress-act-square-bottom">
                  <div className="progress-act-bar-track">
                    <div
                      className="progress-act-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, c.percentage))}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                  <p className="progress-act-subtext">{c.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weekly Coursework Tasks Solved vs. Remaining Grouped Bar Chart ──
function WeeklyTasksBarChart({ weeklyData, activeTasks }) {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  const data = React.useMemo(() => {
    const now = new Date();
    const fmt = (daysAgo) => {
      const dt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (weeklyData && weeklyData.length > 0) {
      return weeklyData.map((d, i) => {
        const solved = Number(d.tasksSolved) || Number(d.breakdown?.batchTasks?.submitted) || 0;
        const total = Number(d.tasksTotal) || Number(d.breakdown?.batchTasks?.total) || (Number(activeTasks?.total) || 0);
        const remaining = Number(d.tasksRemaining) !== undefined && d.tasksRemaining !== null
          ? Number(d.tasksRemaining)
          : Math.max(0, total - solved);
        const dateLabel = d.dateLabel || (d.cutoffDate
          ? new Date(d.cutoffDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : fmt((weeklyData.length - 1 - i) * 7));
        return {
          week: d.week || `Week ${i + 1}`,
          solved,
          remaining,
          total,
          dateLabel
        };
      });
    }
    const currentSolved = activeTasks?.submitted || 0;
    const currentTotal = activeTasks?.total || 0;
    const currentRemaining = Math.max(0, currentTotal - currentSolved);
    return [
      { week: "Week 1", solved: 0, remaining: 0, total: 0, dateLabel: fmt(21) },
      { week: "Week 2", solved: 0, remaining: 0, total: 0, dateLabel: fmt(14) },
      { week: "Week 3", solved: 0, remaining: 0, total: 0, dateLabel: fmt(7) },
      { week: "Week 4", solved: currentSolved, remaining: currentRemaining, total: currentTotal, dateLabel: fmt(0) }
    ];
  }, [weeklyData, activeTasks]);

  const svgWidth = 460;
  const svgHeight = 215;
  const padLeft = 36;
  const padRight = 20;
  const padTop = 26;
  const padBottom = 42;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const baselineY = padTop + plotH;

  const maxVal = Math.max(6, ...data.map(d => Math.max(d.solved, d.remaining, d.total)));
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const colW = plotW / (data.length || 1);
  const barW = Math.max(14, Math.min(22, (colW - 16) / 2));

  const hoveredItem = hoveredIdx !== null && hoveredIdx < data.length ? data[hoveredIdx] : null;

  const totalAssignedAll = activeTasks?.total ?? (data[data.length - 1]?.total || 0);
  const totalSolvedAll = activeTasks?.submitted ?? (data[data.length - 1]?.solved || 0);
  const totalRemainingAll = Math.max(0, totalAssignedAll - totalSolvedAll);

  return (
    <div className="tasks-bar-container">
      <div className="tasks-bar-header">
        <div>
          <h3 className="progress-chart-title">Weekly Coursework Tasks</h3>
          <p className="progress-chart-desc">Tasks solved vs. tasks remaining across weeks</p>
        </div>
        <div className="tasks-bar-legend">
          <div className="tasks-bar-legend-item">
            <span className="tasks-bar-legend-dot" style={{ background: "#10b981" }}></span>
            <span>Solved</span>
          </div>
          <div className="tasks-bar-legend-item">
            <span className="tasks-bar-legend-dot" style={{ background: "#f59e0b" }}></span>
            <span>Remaining</span>
          </div>
        </div>
      </div>

      <div className="tasks-bar-chart-wrap" onMouseLeave={() => setHoveredIdx(null)}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" className="tasks-bar-svg">
          <defs>
            <linearGradient id="solvedBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="remainingBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Y-axis gridlines */}
          {yTicks.map((val) => {
            const y = baselineY - (val / maxVal) * plotH;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke={val === 0 ? "#cbd5e1" : "#f1f5f9"}
                  strokeDasharray={val === 0 ? "0" : "3 3"}
                  strokeWidth={val === 0 ? "1.5" : "1"}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Grouped bars per week */}
          {data.map((d, i) => {
            const isHovered = hoveredIdx === i;
            const centerX = padLeft + i * colW + colW / 2;
            const solvedH = (d.solved / maxVal) * plotH;
            const remainingH = (d.remaining / maxVal) * plotH;
            const solvedY = baselineY - solvedH;
            const remainingY = baselineY - remainingH;
            const solvedX = centerX - barW - 2;
            const remainingX = centerX + 2;

            return (
              <g
                key={i}
                className="tasks-bar-col-group"
                onMouseEnter={() => setHoveredIdx(i)}
                style={{ cursor: "pointer" }}
              >
                {/* Catch target */}
                <rect
                  x={centerX - colW / 2}
                  y={padTop}
                  width={colW}
                  height={plotH}
                  fill="transparent"
                />

                {/* Hover column background highlight */}
                {isHovered && (
                  <rect
                    x={centerX - colW / 2 + 4}
                    y={padTop}
                    width={colW - 8}
                    height={plotH}
                    fill="#f8fafc"
                    rx="6"
                  />
                )}

                {/* Solved Bar (Green with number on top) */}
                {d.solved > 0 ? (
                  <g>
                    <rect
                      x={solvedX}
                      y={solvedY}
                      width={barW}
                      height={solvedH}
                      fill="url(#solvedBarGrad)"
                      rx="5"
                      className="tasks-bar-rect"
                    />
                    <text
                      x={solvedX + barW / 2}
                      y={solvedY - 5}
                      fontSize="10.5"
                      fontWeight="800"
                      fill="#059669"
                      textAnchor="middle"
                    >
                      {d.solved}
                    </text>
                  </g>
                ) : (
                  <rect
                    x={solvedX}
                    y={baselineY - 2}
                    width={barW}
                    height={2}
                    fill="#e2e8f0"
                    rx="1"
                  />
                )}

                {/* Remaining Bar (Amber with number on top) */}
                {d.remaining > 0 ? (
                  <g>
                    <rect
                      x={remainingX}
                      y={remainingY}
                      width={barW}
                      height={remainingH}
                      fill="url(#remainingBarGrad)"
                      rx="5"
                      className="tasks-bar-rect"
                    />
                    <text
                      x={remainingX + barW / 2}
                      y={remainingY - 5}
                      fontSize="10.5"
                      fontWeight="800"
                      fill="#d97706"
                      textAnchor="middle"
                    >
                      {d.remaining}
                    </text>
                  </g>
                ) : (
                  <rect
                    x={remainingX}
                    y={baselineY - 2}
                    width={barW}
                    height={2}
                    fill="#e2e8f0"
                    rx="1"
                  />
                )}

                {/* Subtle zero indicator when both are 0 */}
                {d.solved === 0 && d.remaining === 0 && (
                  <text
                    x={centerX}
                    y={baselineY - 7}
                    fontSize="9.5"
                    fill="#cbd5e1"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    0
                  </text>
                )}

                {/* X-axis week label */}
                <text
                  x={centerX}
                  y={baselineY + 16}
                  fontSize="11"
                  fill={isHovered ? "#4f46e5" : "#64748b"}
                  fontWeight={isHovered ? "700" : "600"}
                  textAnchor="middle"
                >
                  {d.week}
                </text>

                {/* X-axis date label */}
                {d.dateLabel && (
                  <text
                    x={centerX}
                    y={baselineY + 29}
                    fontSize="9.5"
                    fill={isHovered ? "#6366f1" : "#94a3b8"}
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {d.dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredItem && (
          <div
            className="tasks-bar-tooltip"
            style={{
              left: `${Math.max(15, Math.min(85, ((padLeft + hoveredIdx * colW + colW / 2) / svgWidth) * 100))}%`,
            }}
          >
            <div className="tasks-bar-tooltip__title">
              {hoveredItem.week} {hoveredItem.dateLabel ? `• ${hoveredItem.dateLabel}` : ""}
            </div>
            <div className="tasks-bar-tooltip__row">
              <span className="tasks-bar-dot" style={{ background: "#10b981" }}></span>
              <span>Solved:</span>
              <strong>{hoveredItem.solved} Tasks</strong>
            </div>
            <div className="tasks-bar-tooltip__row">
              <span className="tasks-bar-dot" style={{ background: "#f59e0b" }}></span>
              <span>Remaining:</span>
              <strong>{hoveredItem.remaining} Tasks</strong>
            </div>
            <div className="tasks-bar-tooltip__divider"></div>
            <div className="tasks-bar-tooltip__total">
              Total: {hoveredItem.total} Tasks ({hoveredItem.total > 0 ? Math.round((hoveredItem.solved / hoveredItem.total) * 100) : 0}% solved)
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Pill Row */}
      <div className="tasks-bar-footer-stats">
        <div className="tasks-stat-item">
          <span className="tasks-stat-label">Total Assigned</span>
          <span className="tasks-stat-value">{totalAssignedAll}</span>
        </div>
        <div className="tasks-stat-item" style={{ borderLeft: "3px solid #10b981" }}>
          <span className="tasks-stat-label" style={{ color: "#059669" }}>Tasks Solved</span>
          <span className="tasks-stat-value" style={{ color: "#059669" }}>{totalSolvedAll}</span>
        </div>
        <div className="tasks-stat-item" style={{ borderLeft: "3px solid #f59e0b" }}>
          <span className="tasks-stat-label" style={{ color: "#d97706" }}>Remaining</span>
          <span className="tasks-stat-value" style={{ color: "#d97706" }}>{totalRemainingAll}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProgressAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    solvedCount: 0,
    learningProgress: 0,
    quizScore: 0,
    quizList: [],
    weeklyData: [],
    monthlyProgress: [],
    activityCards: [],
    calculatedOverallProgress: 0,
    breakdown: null,
    taskDetails: { totalAssigned: 0, completedCount: 0, pendingCount: 0, meanScore: 0, completionRate: 0, tasks: [] },
    quizDetails: { totalAttempted: 0, passedCount: 0, failedCount: 0, meanScore: 0, passRate: 0, attempts: [] },
    codingDetails: { solvedCount: 0, totalProblems: 0, meanSolveRate: 0, recentSubmissions: [] },
    attendanceDetails: { total: 0, present: 0, absent: 0, rate: 0, status: 'N/A', recent: [] },
    interviewDetails: { completedCount: 0, meanScore: 0, interviews: [] },
    tracksMean: {
      taskMean: 0,
      taskScoreMean: 0,
      quizMean: 0,
      codingMean: 0,
      attendanceMean: 0,
      interviewMean: 0,
      roadmapMean: 0,
      overallMean: 0,
    },
  });

  const [activeTrackTab, setActiveTrackTab] = useState("all"); // 'all' | 'tasks' | 'quizzes' | 'coding' | 'others'
  const [trackSearch, setTrackSearch] = useState("");
  const [hoveredQuizIndex, setHoveredQuizIndex] = useState(null);
  const [donutTooltip, setDonutTooltip] = useState(null);

  const fetchPerf = () => {
    apiFetch("/student/performance")
      .then((res) => {
        if (res && res.data) {
          setStats({
            solvedCount: res.data.solvedCount || 0,
            learningProgress: res.data.learningProgress || 0,
            quizScore: res.data.quizScore || 0,
            quizList: res.data.quizList || [],
            weeklyData: res.data.weeklyData || res.data.weeklyProgress || [],
            monthlyProgress: res.data.monthlyProgress || [],
            activityCards: res.data.activityCards || [],
            calculatedOverallProgress: res.data.calculatedOverallProgress || res.data.learningProgress || 0,
            breakdown: res.data.breakdown || null,
            taskDetails: res.data.taskDetails || { totalAssigned: 0, completedCount: 0, pendingCount: 0, meanScore: 0, completionRate: 0, tasks: [] },
            quizDetails: res.data.quizDetails || { totalAttempted: 0, passedCount: 0, failedCount: 0, meanScore: 0, passRate: 0, attempts: [] },
            codingDetails: res.data.codingDetails || { solvedCount: res.data.solvedCount || 0, totalProblems: res.data.totalProblems || 0, meanSolveRate: res.data.codingScore || 0, recentSubmissions: [] },
            attendanceDetails: res.data.attendanceDetails || { total: 0, present: 0, absent: 0, rate: res.data.attendanceScore || 0, status: 'N/A', recent: [] },
            interviewDetails: res.data.interviewDetails || { completedCount: 0, meanScore: res.data.interviewScore || 0, interviews: [] },
            tracksMean: res.data.tracksMean || {
              taskMean: res.data.taskDetails?.completionRate || 0,
              taskScoreMean: res.data.taskDetails?.meanScore || 0,
              quizMean: res.data.quizDetails?.meanScore || res.data.quizScore || 0,
              codingMean: res.data.codingScore || 0,
              attendanceMean: res.data.attendanceScore || 0,
              interviewMean: res.data.interviewScore || 0,
              roadmapMean: res.data.learningProgress || 0,
              overallMean: res.data.meanProgress || res.data.overallScore || 0,
            },
          });
        }
      })
      .catch((err) => console.warn("[ProgressAnalytics] Fetch error:", err));
  };

  useEffect(() => {
    fetchPerf();

    window.addEventListener(EVENTS.QUIZ_UPDATED, fetchPerf);
    window.addEventListener(EVENTS.CODING_UPDATED, fetchPerf);
    window.addEventListener("codeSubmitted", fetchPerf);
    window.addEventListener("taskSubmitted", fetchPerf);
    window.addEventListener("quizCompletedUpdated", fetchPerf);
    window.addEventListener("interviewCompleted", fetchPerf);
    window.addEventListener("attendanceUpdated", fetchPerf);
    window.addEventListener("focus", fetchPerf);

    return () => {
      window.removeEventListener(EVENTS.QUIZ_UPDATED, fetchPerf);
      window.removeEventListener(EVENTS.CODING_UPDATED, fetchPerf);
      window.removeEventListener("codeSubmitted", fetchPerf);
      window.removeEventListener("taskSubmitted", fetchPerf);
      window.removeEventListener("quizCompletedUpdated", fetchPerf);
      window.removeEventListener("interviewCompleted", fetchPerf);
      window.removeEventListener("attendanceUpdated", fetchPerf);
      window.removeEventListener("focus", fetchPerf);
    };
  }, []);

  const displayWeekly = (stats.weeklyData && stats.weeklyData.length > 0)
    ? stats.weeklyData
    : [
        { week: "Week 1", value: Math.min(100, Math.round(stats.learningProgress * 0.3)) },
        { week: "Week 2", value: Math.min(100, Math.round(stats.learningProgress * 0.55)) },
        { week: "Week 3", value: Math.min(100, Math.round(stats.learningProgress * 0.8)) },
        { week: "Week 4", value: Math.min(100, stats.learningProgress) },
      ];

  const quizScores = (stats.quizList && stats.quizList.length > 0)
    ? stats.quizList
    : [
        { label: "Active Quizzes", score: stats.quizScore || 0, color: "#4f46e5" }
      ];
  const avgQuiz = stats.quizScore;
  const hoveredQuiz = (hoveredQuizIndex !== null && quizScores[hoveredQuizIndex])
    ? { ...quizScores[hoveredQuizIndex], index: hoveredQuizIndex }
    : null;

  // Filter track items by search query
  const searchQ = trackSearch.trim().toLowerCase();

  const filteredTasks = (stats.taskDetails?.tasks || []).filter((t) => {
    if (!searchQ) return true;
    return (t.title || "").toLowerCase().includes(searchQ) || (t.topic || "").toLowerCase().includes(searchQ) || (t.batchName || "").toLowerCase().includes(searchQ);
  });

  const uniqueQuizzes = React.useMemo(() => {
    const raw = stats.quizDetails?.attempts || [];
    const seen = new Map();
    for (const q of raw) {
      if (!q || q.status === "in_progress") continue;
      const key = q.assessmentId ? String(q.assessmentId) : String(q.title);
      if (!seen.has(key)) {
        seen.set(key, q);
      }
    }
    return Array.from(seen.values());
  }, [stats.quizDetails?.attempts]);

  const filteredQuizzes = uniqueQuizzes.filter((q) => {
    if (!searchQ) return true;
    return (q.title || "").toLowerCase().includes(searchQ) || (q.category || "").toLowerCase().includes(searchQ);
  });

  const filteredCoding = (stats.codingDetails?.recentSubmissions || []).filter((c) => {
    if (!searchQ) return true;
    return (c.title || "").toLowerCase().includes(searchQ) || (c.language || "").toLowerCase().includes(searchQ);
  });

  const filteredAttendance = (stats.attendanceDetails?.recent || []).filter((a) => {
    if (!searchQ) return true;
    return (a.batchName || "").toLowerCase().includes(searchQ) || (a.status || "").toLowerCase().includes(searchQ);
  });

  const filteredInterviews = (stats.interviewDetails?.interviews || []).filter((i) => {
    if (!searchQ) return true;
    return (i.role || "").toLowerCase().includes(searchQ) || (i.feedback || "").toLowerCase().includes(searchQ);
  });

  return (
    <div className="progress-analytics-page stack-6">
      <div className="spa-page-header-row">
        <div className="student-header-box">
          <h2 className="student-header-title">
            <LineChart size={24} className="spa-header-icon" />
            <span>Student Progress Analytics</span>
          </h2>
          <p className="student-header-desc">Track problem solving velocity, weekly milestones completion, accuracy trends, and quiz performance analytics.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/skill-gaps")}
          className="spa-skillgap-nav-btn"
        >
          <Brain size={18} strokeWidth={2.2} />
          <span>Skill Gap Analysis</span>
        </button>
      </div>

      {/* 3 Top KPIs */}
      <div className="progress-kpis-grid">
        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Problems Solved</div>
          <p className="progress-kpi-val">{stats.solvedCount}</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Learning Progress</div>
          <p className="progress-kpi-val progress-kpi-val--blue">{stats.learningProgress}%</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Avg Quiz Score</div>
          <p className="progress-kpi-val progress-kpi-val--emerald">{avgQuiz}%</p>
        </div>
      </div>

      {/* ── Dynamic Weekly Progress Line Graph & 5-Parameter Activity Dashboard ── */}
      <DynamicProgressLineGraph
        weeklyData={stats.weeklyData}
        monthlyData={stats.monthlyProgress}
        overallProgress={stats.calculatedOverallProgress || stats.learningProgress || 0}
        activityCards={stats.activityCards}
        breakdown={stats.breakdown}
      />

      {/* Dual Charts Grid: Left Quiz Performance + Right Weekly Coursework Tasks Bar Graph */}
      <div className="progress-charts-grid progress-charts-grid--dual">
        {/* Left: Quiz Performance — Interactive Donut with On-Hover Quiz Details */}
        <div className="progress-chart-card progress-chart-card--quiz">
          <div className="quiz-chart-header">
            <div>
              <h3 className="progress-chart-title">Quiz Performance</h3>
              <p className="progress-chart-desc">Average score across completed quizzes</p>
            </div>
          </div>

          <div className="progress-chart-container progress-donut-container">
            <div
              className="progress-donut-wrap"
              onMouseLeave={() => {
                setHoveredQuizIndex(null);
                setDonutTooltip(null);
              }}
            >
              <svg viewBox="0 0 200 200" width="180" height="180">
                <circle cx="100" cy="100" r="75" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                {(() => {
                  const total = quizScores.reduce((a, q) => a + q.score, 0) || 1;
                  let offset = 0;
                  return quizScores.map((q, i) => {
                    const pct = (q.score / total) * 100;
                    const isHovered = hoveredQuizIndex === i;
                    const seg = (
                      <DonutSegment
                        key={i}
                        cx={100}
                        cy={100}
                        r={75}
                        strokeWidth={18}
                        pct={pct}
                        color={q.color || "#4f46e5"}
                        offset={offset}
                        isHovered={isHovered}
                        onMouseEnter={(e) => {
                          setHoveredQuizIndex(i);
                          const wrap = e.currentTarget.closest('.progress-donut-wrap');
                          if (wrap) {
                            const rect = wrap.getBoundingClientRect();
                            setDonutTooltip({
                              label: q.label,
                              score: q.score,
                              color: q.color || "#4f46e5",
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const wrap = e.currentTarget.closest('.progress-donut-wrap');
                          if (wrap) {
                            const rect = wrap.getBoundingClientRect();
                            setDonutTooltip({
                              label: q.label,
                              score: q.score,
                              color: q.color || "#4f46e5",
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredQuizIndex(null);
                          setDonutTooltip(null);
                        }}
                      />
                    );
                    offset += pct;
                    return seg;
                  });
                })()}

                {hoveredQuiz ? (
                  <>
                    <text x="100" y="86" textAnchor="middle" fontSize="30" fontWeight="800" fill={hoveredQuiz.color || "#4f46e5"} style={{ transition: 'all 0.2s' }}>
                      {hoveredQuiz.score}%
                    </text>
                    <text x="100" y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a" style={{ transition: 'all 0.2s' }}>
                      {hoveredQuiz.label && hoveredQuiz.label.length > 15 ? hoveredQuiz.label.slice(0, 14) + "…" : (hoveredQuiz.label || "Quiz")}
                    </text>
                    <text x="100" y="124" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
                      Quiz Score
                    </text>
                  </>
                ) : (
                  <>
                    <text x="100" y="92" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a" style={{ transition: 'all 0.2s' }}>
                      {avgQuiz}%
                    </text>
                    <text x="100" y="114" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b" style={{ transition: 'all 0.2s' }}>
                      Avg Score
                    </text>
                  </>
                )}
              </svg>

              {/* Floating Tooltip matching app standard */}
              {donutTooltip && (
                <div
                  className="donut-segment-tooltip"
                  style={{
                    left: `${donutTooltip.x}px`,
                    top: `${donutTooltip.y - 12}px`,
                  }}
                >
                  <div className="donut-segment-tooltip__arrow" />
                  <span className="donut-segment-tooltip__dot" style={{ background: donutTooltip.color }} />
                  <span className="donut-segment-tooltip__label">{donutTooltip.label}:</span>
                  <span className="donut-segment-tooltip__score">{donutTooltip.score}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Performance Summary Bar (Without passing benchmark threshold) */}
          <div className="quiz-benchmark-meter">
            <div className="quiz-benchmark-meter__row">
              <span className="quiz-meter-lbl">Your Average: <strong style={{ color: "#4f46e5" }}>{avgQuiz}%</strong></span>
              <span className="quiz-sub-stat">Attempted: <strong>{stats.quizDetails?.totalAttempted || 0} Quizzes</strong></span>
            </div>
            <div className="quiz-benchmark-meter__track">
              <div
                className="quiz-benchmark-meter__fill"
                style={{ width: `${Math.min(100, avgQuiz)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Weekly Coursework Tasks Solved vs. Remaining Bar Chart */}
        <div className="progress-chart-card progress-chart-card--tasks-bar">
          <WeeklyTasksBarChart
            weeklyData={stats.weeklyData}
            activeTasks={stats.breakdown?.batchTasks || stats.taskDetails}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COMPREHENSIVE PROGRESS TRACK SYSTEM (Tasks, Quizzes, Coding, Others)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="spa-track-wrapper">
        {/* Track Detail Navigator Tabs & Search Filter */}
        <div className="spa-track-controls">
          <div className="spa-track-tabs">
            <button
              type="button"
              className={`spa-track-tab ${activeTrackTab === "all" ? "spa-track-tab--active" : ""}`}
              onClick={() => setActiveTrackTab("all")}
            >
              <Layers size={15} />
              <span>All Tracks</span>
            </button>
            <button
              type="button"
              className={`spa-track-tab ${activeTrackTab === "tasks" ? "spa-track-tab--active" : ""}`}
              onClick={() => setActiveTrackTab("tasks")}
            >
              <BookOpenCheck size={15} />
              <span>Tasks ({stats.taskDetails?.tasks?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`spa-track-tab ${activeTrackTab === "quizzes" ? "spa-track-tab--active" : ""}`}
              onClick={() => setActiveTrackTab("quizzes")}
            >
              <GraduationCap size={15} />
              <span>Quizzes ({uniqueQuizzes.length})</span>
            </button>
            <button
              type="button"
              className={`spa-track-tab ${activeTrackTab === "coding" ? "spa-track-tab--active" : ""}`}
              onClick={() => setActiveTrackTab("coding")}
            >
              <Code2 size={15} />
              <span>Coding ({stats.codingDetails?.recentSubmissions?.length || stats.solvedCount || 0})</span>
            </button>
            <button
              type="button"
              className={`spa-track-tab ${activeTrackTab === "others" ? "spa-track-tab--active" : ""}`}
              onClick={() => setActiveTrackTab("others")}
            >
              <CalendarCheck size={15} />
              <span>Attendance & AI</span>
            </button>
          </div>

          <div className="spa-track-search">
            <Search size={15} className="spa-track-search__icon" />
            <input
              type="text"
              placeholder="Search by title, topic, or batch..."
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="spa-track-search__input"
            />
            {trackSearch && (
              <button
                type="button"
                className="spa-track-search__clear"
                onClick={() => setTrackSearch("")}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── TRACK CONTENT AREA ── */}
        <div className="spa-track-sections">
          {/* SECTION 1: COURSEWORK TASKS */}
          {(activeTrackTab === "all" || activeTrackTab === "tasks") && (
            <div className="spa-section-card">
              <div className="spa-section-card__header">
                <div className="spa-section-card__title-box">
                  <BookOpenCheck size={18} className="spa-section-card__icon--blue" />
                  <div>
                    <h4 className="spa-section-card__title">Assigned Coursework & Batch Tasks</h4>
                    <span className="spa-section-card__sub">
                      Track submissions, instructor sign-offs, and deadlines across your enrolled batches.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="spa-section-card__action"
                  onClick={() => navigate("/student/batches")}
                >
                  Go to Batches <ChevronRight size={14} />
                </button>
              </div>

              {filteredTasks.length > 0 ? (
                <div className="spa-table-responsive spa-table-responsive--scroll-tasks">
                  <table className="spa-table">
                    <thead>
                      <tr>
                        <th>Task Name & Topic</th>
                        <th>Batch</th>
                        <th>Difficulty</th>
                        <th>Deadline</th>
                        <th>Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="spa-task-name">
                              <strong>{t.title}</strong>
                              <span className="spa-task-topic">{t.topic}</span>
                            </div>
                          </td>
                          <td>
                            <span className="spa-badge-batch">{t.batchName}</span>
                          </td>
                          <td>
                            <span className={`spa-badge-diff spa-badge-diff--${String(t.difficulty).toLowerCase()}`}>
                              {t.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className="spa-task-date">
                              <Clock size={12} /> {t.deadline}
                            </span>
                          </td>
                          <td>
                            <strong>{t.score ? `${t.score} pts` : "—"}</strong>
                          </td>
                          <td>
                            <span
                              className={`spa-status-pill spa-status-pill--${
                                t.status === "Completed" ? "success" : (t.status === "Overdue" ? "danger" : "warning")
                              }`}
                            >
                              {t.status === "Completed" && <Check size={12} />}
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="spa-empty-box">
                  <BookOpenCheck size={36} className="spa-empty-box__icon" />
                  <h5>No Coursework Tasks Found</h5>
                  <p>You have submitted all pending batch assignments or no new tasks are assigned.</p>
                  <button
                    type="button"
                    className="spa-btn spa-btn--outline"
                    onClick={() => navigate("/student/batches")}
                  >
                    Explore Batches
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ACADEMIC QUIZZES & ASSESSMENTS */}
          {(activeTrackTab === "all" || activeTrackTab === "quizzes") && (
            <div className="spa-section-card">
              <div className="spa-section-card__header">
                <div className="spa-section-card__title-box">
                  <GraduationCap size={18} className="spa-section-card__icon--emerald" />
                  <div>
                    <h4 className="spa-section-card__title">Academic Quiz Attempts & Test Benchmarks</h4>
                    <span className="spa-section-card__sub">
                      Detailed accuracy records, scores, and completion timestamps from milestone evaluations.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="spa-section-card__action"
                  onClick={() => navigate("/student/quiz")}
                >
                  Take Quizzes <ChevronRight size={14} />
                </button>
              </div>

              {filteredQuizzes.length > 0 ? (
                <div className="spa-table-responsive spa-table-responsive--scroll-quizzes">
                  <table className="spa-table">
                    <thead>
                      <tr>
                        <th>Assessment Title</th>
                        <th>Category</th>
                        <th>Score & Accuracy</th>
                        <th>Marks</th>
                        <th>Date Taken</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuizzes.map((q, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{q.title}</strong>
                          </td>
                          <td>
                            <span className="spa-badge-batch">{q.category}</span>
                          </td>
                          <td>
                            <div className="spa-quiz-score-wrap">
                              <span className="spa-quiz-score-num">{q.score}%</span>
                              <div className="spa-mini-bar">
                                <div
                                  className={`spa-mini-bar__fill ${
                                    q.score >= 70
                                      ? "spa-mini-bar__fill--high"
                                      : q.score >= 50
                                      ? "spa-mini-bar__fill--med"
                                      : "spa-mini-bar__fill--low"
                                  }`}
                                  style={{ width: `${q.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="spa-task-date">
                              {q.marksObtained} / {q.totalMarks}
                            </span>
                          </td>
                          <td>
                            <span className="spa-task-date">{q.date}</span>
                          </td>
                          <td>
                            <span
                              className={`spa-status-pill spa-status-pill--${
                                q.status === "Passed" ? "success" : "warning"
                              }`}
                            >
                              {q.status === "Passed" && <Check size={12} />}
                              {q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="spa-empty-box">
                  <GraduationCap size={36} className="spa-empty-box__icon" />
                  <h5>No Quiz Attempts Recorded</h5>
                  <p>Test your conceptual understanding by completing your active syllabus quizzes.</p>
                  <button
                    type="button"
                    className="spa-btn spa-btn--outline"
                    onClick={() => navigate("/student/quiz")}
                  >
                    Open Quizzes Hub
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: CODING PLATFORM SUBMISSIONS */}
          {(activeTrackTab === "all" || activeTrackTab === "coding") && (
            <div className="spa-section-card">
              <div className="spa-section-card__header">
                <div className="spa-section-card__title-box">
                  <Code2 size={18} className="spa-section-card__icon--indigo" />
                  <div>
                    <h4 className="spa-section-card__title">Coding Practice & Problem Submissions</h4>
                    <span className="spa-section-card__sub">
                      Recent code executions, algorithm benchmarks, and automated test suite evaluations.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="spa-section-card__action"
                  onClick={() => navigate("/student/practice")}
                >
                  Practice Coding <ChevronRight size={14} />
                </button>
              </div>

              {filteredCoding.length > 0 ? (
                <div className="spa-table-responsive spa-table-responsive--scroll-coding">
                  <table className="spa-table">
                    <thead>
                      <tr>
                        <th>Problem Statement</th>
                        <th>Difficulty</th>
                        <th>Language</th>
                        <th>Test Cases</th>
                        <th>Submitted</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoding.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{c.title}</strong>
                          </td>
                          <td>
                            <span className={`spa-badge-diff spa-badge-diff--${String(c.difficulty).toLowerCase()}`}>
                              {c.difficulty}
                            </span>
                          </td>
                          <td>
                            <span className="spa-badge-lang">{c.language}</span>
                          </td>
                          <td>
                            <span className="spa-task-date">
                              {c.passedTestCases > 0 ? `${c.passedTestCases}/${c.totalTestCases || c.passedTestCases} passed` : "All Cases"}
                            </span>
                          </td>
                          <td>
                            <span className="spa-task-date">{c.date}</span>
                          </td>
                          <td>
                            <span
                              className={`spa-status-pill spa-status-pill--${
                                c.status === "Accepted" ? "success" : "warning"
                              }`}
                            >
                              {c.status === "Accepted" && <Check size={12} />}
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="spa-empty-box">
                  <Code2 size={36} className="spa-empty-box__icon" />
                  <h5>No Recent Coding Submissions</h5>
                  <p>Start solving algorithmic challenges to boost your technical competency score.</p>
                  <button
                    type="button"
                    className="spa-btn spa-btn--outline"
                    onClick={() => navigate("/student/practice")}
                  >
                    Solve Practice Problems
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: CLASSROOM ATTENDANCE & AI INTERVIEWS */}
          {(activeTrackTab === "all" || activeTrackTab === "others") && (
            <div className="spa-dual-grid">
              {/* Left Column: Attendance History */}
              <div className="spa-section-card">
                <div className="spa-section-card__header">
                  <div className="spa-section-card__title-box">
                    <CalendarCheck size={18} className="spa-section-card__icon--purple" />
                    <div>
                      <h4 className="spa-section-card__title">Classroom Attendance Log</h4>
                      <span className="spa-section-card__sub">
                        {stats.attendanceDetails?.rate ?? 0}% Attendance &bull; {stats.attendanceDetails?.status || "Good Standing"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="spa-section-card__action"
                    onClick={() => navigate("/student/attendance")}
                  >
                    Full Log <ChevronRight size={14} />
                  </button>
                </div>

                {filteredAttendance.length > 0 ? (
                  <div className="spa-table-responsive spa-table-responsive--scroll-attendance">
                    <table className="spa-table">
                      <thead>
                        <tr>
                          <th>Session Date</th>
                          <th>Batch</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendance.map((a, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="spa-task-date">{a.date}</span>
                            </td>
                            <td>
                              <span className="spa-badge-batch">{a.batchName}</span>
                            </td>
                            <td>
                              <span
                                className={`spa-status-pill spa-status-pill--${
                                  a.status === "Present" ? "success" : "danger"
                                }`}
                              >
                                {a.status === "Present" ? <Check size={12} /> : <X size={12} />}
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="spa-empty-box spa-empty-box--sm">
                    <CalendarCheck size={28} className="spa-empty-box__icon" />
                    <p>No recent classroom attendance sessions recorded.</p>
                  </div>
                )}
              </div>

              {/* Right Column: AI Mock Interviews */}
              <div className="spa-section-card">
                <div className="spa-section-card__header">
                  <div className="spa-section-card__title-box">
                    <Bot size={18} className="spa-section-card__icon--blue" />
                    <div>
                      <h4 className="spa-section-card__title">AI Mock Interview History</h4>
                      <span className="spa-section-card__sub">
                        {stats.interviewDetails?.completedCount ?? 0} Interviews &bull; {stats.interviewDetails?.meanScore ?? stats.interviewScore ?? 0}% Readiness Rating
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="spa-section-card__action"
                    onClick={() => navigate("/student/ai-interview")}
                  >
                    Start AI Prep <ChevronRight size={14} />
                  </button>
                </div>

                {filteredInterviews.length > 0 ? (
                  <div className="spa-table-responsive spa-table-responsive--scroll-interview">
                    <table className="spa-table">
                      <thead>
                        <tr>
                          <th>Target Track</th>
                          <th>Score</th>
                          <th>Evaluation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInterviews.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="spa-task-name">
                                <strong>{item.role}</strong>
                                <span className="spa-task-topic">{item.feedback}</span>
                              </div>
                            </td>
                            <td>
                              <span className="spa-interview-score">{item.score}%</span>
                            </td>
                            <td>
                              <span className="spa-task-date">{item.date}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="spa-empty-box spa-empty-box--sm">
                    <Brain size={28} className="spa-empty-box__icon" />
                    <p>No AI mock interviews taken yet. Test your readiness with simulated voice interviews.</p>
                    <button
                      type="button"
                      className="spa-btn spa-btn--outline"
                      onClick={() => navigate("/student/ai-interview")}
                    >
                      Try AI Mock Interview
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
