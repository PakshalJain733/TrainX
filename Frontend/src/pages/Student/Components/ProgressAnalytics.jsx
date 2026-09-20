import React, { useState, useEffect } from "react";
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
  TrendingDown
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/ProgressAnalytics.css";

const DONUT_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];

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

function SkillGapAnalyticsSection() {
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

  const allEvaluatedSkills = analysis?.all_evaluated_skills || [];
  const suggestionsList = analysis?.suggestions || [];
  const weakSkillsOnly = allEvaluatedSkills.filter((s) => s.is_weak || s.score < 60);

  const filteredSuggestions = suggestionsList.filter((item) => {
    if (searchQuery.trim()) {
      return item.skill.toLowerCase().includes(searchQuery.toLowerCase());
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
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="sg-loading-state">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
          <span>Fetching live student performance across Quizzes, Coding & Interviews...</span>
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
                      } needing targeted practice: ${analysis.weak_areas.join(", ")}`
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
  const [weeklyData, setWeeklyData] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await apiFetch("/reports/weekly");
        if (cancelled) return;
        const rows = res && res.success && Array.isArray(res.data) ? res.data : [];
        const weekly = [];
        const quizzes = [];
        rows.forEach((r, i) => {
          const scoreVal = Number.parseFloat(r.score) || r.quiz != null ? Number.parseFloat(r.quiz) : null;
          const val = Number.isFinite(scoreVal) ? Math.max(0, Math.min(100, Math.round(scoreVal))) : null;
          if (val != null) weekly.push({ week: `S${i + 1}`, value: val });
          const quizVal = r.quiz != null ? Math.max(0, Math.min(100, Math.round(Number.parseFloat(r.quiz)))) : null;
          if (quizVal != null) {
            quizzes.push({
              label: r.title || `Week ${i + 1}`,
              score: quizVal,
              color: DONUT_COLORS[i % DONUT_COLORS.length],
            });
          }
        });
        setWeeklyData(weekly);
        setQuizScores(quizzes);
      } catch (err) {
        console.warn("Failed to load progress statistics:", err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const learningProgress = weeklyData.length > 0 ? Math.round(weeklyData.reduce((a, d) => a + d.value, 0) / weeklyData.length) : null;
  const avgQuiz = quizScores.length > 0 ? Math.round(quizScores.reduce((a, q) => a + q.score, 0) / quizScores.length) : null;

  return (
    <div className="progress-analytics-page stack-6">
      <SectionHeader
        eyebrow="PERFORMANCE METRICS"
        title="Student Progress Analytics"
        description="Track problem solving velocity, weekly milestones completion, accuracy trends, and quiz performance analytics."
      />

      {/* 3 Top KPIs */}
      <div className="progress-kpis-grid">
        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Problems Solved</div>
          <p className="progress-kpi-val">N/A</p>
          <span className="progress-kpi-sub">Coding module postponed</span>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Learning Progress</div>
          <p className="progress-kpi-val progress-kpi-val--blue">
            {statsLoading ? "..." : learningProgress != null ? `${learningProgress}%` : "N/A"}
          </p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Avg Quiz Score</div>
          <p className="progress-kpi-val progress-kpi-val--emerald">
            {statsLoading ? "..." : avgQuiz != null ? `${avgQuiz}%` : "N/A"}
          </p>
        </div>
      </div>

      {/* AI Skill Gap Detector Section */}
      <SkillGapAnalyticsSection />

      {/* Charts Grid — now 1x2 */}
      <div className="progress-charts-grid progress-charts-grid--two">
        {/* Weekly Progress — Bar Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Weekly progress</h3>
          <p className="progress-chart-desc">Cumulative roadmap completion over time</p>
          <div className="progress-chart-container">
            {statsLoading ? (
              <div className="progress-chart-empty">Loading weekly data...</div>
            ) : weeklyData.length === 0 ? (
              <div className="progress-chart-empty">No weekly progress data available yet.</div>
            ) : (
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
                  const barH = Math.max((d.value / 80) * 140, 2);
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
            )}
          </div>
        </div>

        {/* Quiz Performance — Donut / Cyclic Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Quiz performance</h3>
          <p className="progress-chart-desc">Best score per milestone quiz</p>
          <div className="progress-chart-container progress-donut-container">
            {statsLoading ? (
              <div className="progress-chart-empty">Loading quiz scores...</div>
            ) : quizScores.length === 0 ? (
              <div className="progress-chart-empty">No quiz attempts recorded yet.</div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
