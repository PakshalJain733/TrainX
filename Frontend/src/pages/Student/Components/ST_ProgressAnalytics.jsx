import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
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

function DonutSegment({ cx, cy, r, strokeWidth, pct, color, offset }) {
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
      strokeWidth={strokeWidth}
      strokeDasharray={`${dash} ${gap}`}
      strokeLinecap="round"
      transform={`rotate(${rotation} ${cx} ${cy})`}
      className="donut-segment"
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

export default function ProgressAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    solvedCount: 0,
    learningProgress: 0,
    quizScore: 0,
    quizList: [],
    weeklyData: [],
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
    window.addEventListener("quizCompletedUpdated", fetchPerf);
    window.addEventListener("attendanceUpdated", fetchPerf);
    window.addEventListener("focus", fetchPerf);

    return () => {
      window.removeEventListener(EVENTS.QUIZ_UPDATED, fetchPerf);
      window.removeEventListener(EVENTS.CODING_UPDATED, fetchPerf);
      window.removeEventListener("codeSubmitted", fetchPerf);
      window.removeEventListener("quizCompletedUpdated", fetchPerf);
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

      {/* Charts Grid — 1x2 */}
      <div className="progress-charts-grid progress-charts-grid--two">
        {/* Weekly Progress — Bar Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Weekly progress</h3>
          <p className="progress-chart-desc">Cumulative roadmap completion over time</p>
          <div className="progress-chart-container">
            <svg viewBox="0 0 400 210" width="100%" height="100%">
              <line x1="45" y1="20" x2="385" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="55" x2="385" y2="55" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="90" x2="385" y2="90" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="125" x2="385" y2="125" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="160" x2="385" y2="160" stroke="#cbd5e1" />

              <text x="35" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">80</text>
              <text x="35" y="59" fontSize="10" fill="#94a3b8" textAnchor="end">60</text>
              <text x="35" y="94" fontSize="10" fill="#94a3b8" textAnchor="end">40</text>
              <text x="35" y="129" fontSize="10" fill="#94a3b8" textAnchor="end">20</text>
              <text x="35" y="164" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {displayWeekly.map((d, i) => {
                const maxVal = Math.max(80, ...displayWeekly.map(w => w.value || 0));
                const barH = maxVal > 0 ? (d.value / maxVal) * 140 : 0;
                const x = 60 + i * 70;
                const y = 160 - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="36" height={Math.max(4, barH)} rx="5" fill="url(#barGrad)" />
                    <text x={x + 18} y={y - 6} fontSize="11" fontWeight="700" fill="#4f46e5" textAnchor="middle">{d.value}%</text>
                    <text x={x + 18} y="178" fontSize="11" fill="#64748b" textAnchor="middle">{d.week}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Quiz Performance — Donut / Cyclic Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Quiz performance</h3>
          <p className="progress-chart-desc">Best score per milestone quiz</p>
          <div className="progress-chart-container progress-donut-container">
            <div className="progress-donut-wrap">
              <svg viewBox="0 0 200 200" width="180" height="180">
                <circle cx="100" cy="100" r="75" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                {(() => {
                  const total = quizScores.reduce((a, q) => a + q.score, 0) || 1;
                  let offset = 0;
                  return quizScores.map((q, i) => {
                    const pct = (q.score / total) * 100;
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
                      />
                    );
                    offset += pct;
                    return seg;
                  });
                })()}

                <text x="100" y="93" textAnchor="middle" fontSize="28" fontWeight="800" fill="#0f172a">{avgQuiz}%</text>
                <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">Avg Score</text>
              </svg>
            </div>

            <div className="progress-donut-legend">
              {quizScores.map((q, i) => (
                <div key={i} className="donut-legend-item">
                  <span className="donut-legend-dot" style={{ background: q.color || "#4f46e5" }}></span>
                  <span className="donut-legend-label">{q.label}</span>
                  <span className="donut-legend-val">{q.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COMPREHENSIVE PROGRESS TRACK SYSTEM (Tasks, Quizzes, Coding, Others)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="spa-track-wrapper">
        {/* Mean Progress Track Overview Banner */}
        <div className="spa-mean-banner">
          <div className="spa-mean-banner__header">
            <div className="spa-mean-banner__left">
              <div className="spa-mean-banner__icon-box">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="spa-mean-banner__title">Complete Learning Progress Track</h3>
                <p className="spa-mean-banner__desc">
                  Real-time mean progress tracking across Coursework Tasks, Academic Quizzes, Coding Labs, and Classroom Attendance.
                </p>
              </div>
            </div>
            <div className="spa-mean-banner__badge">
              <Sparkles size={14} />
              <span>{stats.tracksMean?.overallMean || stats.learningProgress || 50}% Composite Mean Progress</span>
            </div>
          </div>

          {/* 4 Track Performance Summary Cards */}
          <div className="spa-mean-grid">
            {/* 1. Tasks Track */}
            <div className="spa-mean-card">
              <div className="spa-mean-card__header">
                <div className="spa-mean-card__icon spa-mean-card__icon--blue">
                  <BookOpenCheck size={18} />
                </div>
                <span className="spa-mean-card__rate">{stats.taskDetails?.completionRate ?? 0}%</span>
              </div>
              <h4 className="spa-mean-card__title">Coursework Tasks</h4>
              <p className="spa-mean-card__sub">
                {stats.taskDetails?.completedCount ?? 0} of {stats.taskDetails?.totalAssigned ?? 0} Tasks Completed
              </p>
              <div className="spa-bar-track">
                <div
                  className="spa-bar-fill spa-bar-fill--blue"
                  style={{ width: `${Math.min(100, stats.taskDetails?.completionRate ?? 0)}%` }}
                />
              </div>
            </div>

            {/* 2. Quizzes Track */}
            <div className="spa-mean-card">
              <div className="spa-mean-card__header">
                <div className="spa-mean-card__icon spa-mean-card__icon--emerald">
                  <GraduationCap size={18} />
                </div>
                <span className="spa-mean-card__rate">{stats.quizDetails?.meanScore ?? stats.quizScore ?? 0}%</span>
              </div>
              <h4 className="spa-mean-card__title">Academic Quizzes</h4>
              <p className="spa-mean-card__sub">
                {stats.quizDetails?.totalAttempted ?? 0} Attempts &bull; {stats.quizDetails?.passRate ?? 0}% Pass Rate
              </p>
              <div className="spa-bar-track">
                <div
                  className="spa-bar-fill spa-bar-fill--emerald"
                  style={{ width: `${Math.min(100, stats.quizDetails?.meanScore ?? stats.quizScore ?? 0)}%` }}
                />
              </div>
            </div>

            {/* 3. Coding Track */}
            <div className="spa-mean-card">
              <div className="spa-mean-card__header">
                <div className="spa-mean-card__icon spa-mean-card__icon--indigo">
                  <Code2 size={18} />
                </div>
                <span className="spa-mean-card__rate">{stats.solvedCount} Solved</span>
              </div>
              <h4 className="spa-mean-card__title">Coding Practice</h4>
              <p className="spa-mean-card__sub">
                {stats.codingDetails?.meanSolveRate || (stats.solvedCount > 0 ? 50 : 0)}% Solve Velocity
              </p>
              <div className="spa-bar-track">
                <div
                  className="spa-bar-fill spa-bar-fill--indigo"
                  style={{ width: `${Math.min(100, stats.codingDetails?.meanSolveRate || (stats.solvedCount > 0 ? 50 : 0))}%` }}
                />
              </div>
            </div>

            {/* 4. Classroom Attendance & AI */}
            <div className="spa-mean-card">
              <div className="spa-mean-card__header">
                <div className="spa-mean-card__icon spa-mean-card__icon--purple">
                  <CalendarCheck size={18} />
                </div>
                <span className="spa-mean-card__rate">{stats.attendanceDetails?.rate ?? 0}%</span>
              </div>
              <h4 className="spa-mean-card__title">Classroom & AI</h4>
              <p className="spa-mean-card__sub">
                {stats.attendanceDetails?.present ?? 0}/{stats.attendanceDetails?.total ?? 0} Present &bull; {stats.interviewDetails?.completedCount ?? 0} AI Interviews
              </p>
              <div className="spa-bar-track">
                <div
                  className="spa-bar-fill spa-bar-fill--purple"
                  style={{ width: `${Math.min(100, stats.attendanceDetails?.rate ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

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
                <div className="spa-table-responsive">
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
                <div className="spa-table-responsive">
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
                <div className="spa-table-responsive">
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
                  <div className="spa-table-responsive">
                    <table className="spa-table">
                      <thead>
                        <tr>
                          <th>Session Date</th>
                          <th>Batch</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendance.slice(0, 6).map((a, idx) => (
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
                  <div className="spa-table-responsive">
                    <table className="spa-table">
                      <thead>
                        <tr>
                          <th>Target Track</th>
                          <th>Score</th>
                          <th>Evaluation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInterviews.slice(0, 6).map((item, idx) => (
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
