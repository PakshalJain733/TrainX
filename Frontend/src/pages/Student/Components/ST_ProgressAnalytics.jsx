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
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_ProgressAnalytics.css";

const weeklyData = [];
const quizScores = [];

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
      style={{ transition: "stroke-dasharray 0.6s ease" }}
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
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="sg-subtitle">
              <span>Real-Time AI Skill Engine</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </div>
            <h3 className="sg-title">AI Performance & Weak Area Detection</h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
              Evaluated across your Coding Practice Sums, Coding Tasks, Quizzes & AI Technical Interviews.
            </p>
          </div>
        </div>

        <div className="sg-actions-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#64748b",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
                fontSize: "13px",
                transition: "all 0.15s ease"
              }}
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
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
          <span>Analyzing performance across Coding Practice Sums, Coding Tasks, Quizzes & AI Interviews...</span>
        </div>
      ) : allEvaluatedSkills.length === 0 ? (
        <div className="empty-state-box">
          <BookOpen className="w-12 h-12 text-indigo-500 mb-2" />
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
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
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
              <Search className="w-3.5 h-3.5 text-slate-400" />
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
                        <TrendingDown className="w-5 h-5 text-red-500" />
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
                  <Award className="w-12 h-12 text-emerald-500" />
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
                  <Award className="w-12 h-12 text-emerald-500" />
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
  });

  useEffect(() => {
    apiFetch("/student/performance")
      .then((res) => {
        if (res && res.data) {
          setStats({
            solvedCount: res.data.solvedCount || 0,
            learningProgress: res.data.learningProgress || 0,
            quizScore: res.data.quizScore || 0,
            quizList: res.data.quizList || [],
          });
        }
      })
      .catch((err) => console.warn("[ProgressAnalytics] Fetch error:", err));
  }, []);

  const quizScores = stats.quizList;
  const avgQuiz = stats.quizScore;

  return (
    <div className="progress-analytics-page stack-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div className="student-header-box">
          <h2 className="student-header-title">
            <LineChart size={22} style={{ color: "#4f46e5" }} />
            <span>Student Progress Analytics</span>
          </h2>
          <p className="student-header-desc">Track problem solving velocity, weekly milestones completion, accuracy trends, and quiz performance analytics.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/skill-gaps")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 22px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            outline: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 99, 235, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.25)";
          }}
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

              {weeklyData.map((d, i) => {
                const barH = (d.value / 80) * 140;
                const x = 60 + i * 48;
                const y = 160 - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="30" height={barH} rx="4" fill="url(#barGrad)" />
                    <text x={x + 15} y={y - 6} fontSize="10" fontWeight="700" fill="#4f46e5" textAnchor="middle">{d.value}%</text>
                    <text x={x + 15} y="178" fontSize="11" fill="#64748b" textAnchor="middle">{d.week}</text>
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
                  const total = quizScores.reduce((a, q) => a + q.score, 0);
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
                        color={q.color}
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
                  <span className="donut-legend-dot" style={{ background: q.color }}></span>
                  <span className="donut-legend-label">{q.label}</span>
                  <span className="donut-legend-val">{q.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
