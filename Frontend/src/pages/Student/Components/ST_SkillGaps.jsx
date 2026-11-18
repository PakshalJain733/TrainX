import React, { useState, useEffect } from "react";
import { 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  Target, 
  Sparkles, 
  Award, 
  TrendingDown, 
  RotateCcw, 
  ChevronRight, 
  Info, 
  Layers, 
  GraduationCap, 
  PlayCircle, 
  UserCheck, 
  Calendar,
  FileText,
  Code2,
  Brain,
  Compass
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_SkillGaps.css";

export default function StudentSkillGaps() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [factorsSummary, setFactorsSummary] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [overallStatus, setOverallStatus] = useState("");
  const [batchName, setBatchName] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedWeakSkill, setSelectedWeakSkill] = useState(null);
  const [interventionData, setInterventionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/skill-gaps")
      .then((res) => {
        let evaluated = [];
        if (res && res.data && res.data.all_evaluated_skills) {
          evaluated = res.data.all_evaluated_skills;
          if (res.data.factors_summary) setFactorsSummary(res.data.factors_summary);
          if (res.data.overall_score !== undefined) setOverallScore(res.data.overall_score);
          if (res.data.overall_status) setOverallStatus(res.data.overall_status);
          if (res.data.batch_name) setBatchName(res.data.batch_name);
        } else if (res && res.all_evaluated_skills) {
          evaluated = res.all_evaluated_skills;
          if (res.factors_summary) setFactorsSummary(res.factors_summary);
          if (res.overall_score !== undefined) setOverallScore(res.overall_score);
          if (res.overall_status) setOverallStatus(res.overall_status);
          if (res.batch_name) setBatchName(res.batch_name);
        }

        if (evaluated.length > 0) {
          const mapped = evaluated.map((item, idx) => ({
            id: item.id || `skill-${idx}`,
            name: item.name || item.skill,
            skill: item.skill || item.name,
            score: Number(item.score) || 0,
            status: item.status || (item.score >= 80 ? "Strong" : item.score >= 70 ? "Good" : item.score >= 50 ? "Weak" : "Critical"),
            category: item.category || "Technical Skill",
            lastAssessed: item.lastAssessed || "Recent Evaluation",
            factorsSummary: item.factorsSummary || item.reason || "",
            factors: item.factors || [],
            whyWeak: item.whyWeak || (item.score < 65 ? item.reason || `Calculated average competency score is ${item.score}%.` : null),
            targetScore: item.targetScore || 85,
            recommendedTopics: item.recommendedTopics || [item.name || item.skill],
            checklist: item.checklist || [
              { id: 1, text: `Revise fundamental concepts for ${item.name || item.skill}`, completed: false, type: "revise", route: "/student/learning" },
              { id: 2, text: `Practice exercises and problem sets`, completed: false, type: "practice", route: "/student/practice" },
              { id: 3, text: `Attempt assessment quiz to verify proficiency`, completed: false, type: "quiz", route: "/student/quiz" },
            ]
          }));

          setSkills(mapped);
          const weak = mapped.find((s) => s.score < 65 || s.is_weak) || mapped[0];
          if (weak) setSelectedWeakSkill(weak);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch live skill gaps:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    apiFetch("/interventions/student/my-status")
      .then((res) => {
        if (res && res.data) {
          setInterventionData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch student intervention status:", err);
      });
  }, []);

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    if (selectedFilter === "strong") return skill.score >= 70;
    if (selectedFilter === "good") return skill.score >= 60 && skill.score < 70;
    if (selectedFilter === "weak") return skill.score < 60;
    return true;
  });

  // Calculate summary counts safely
  const totalSkills = skills.length;
  const strongCount = skills.filter((s) => s.score >= 70).length;
  const goodCount = skills.filter((s) => s.score >= 60 && s.score < 70).length;
  const weakCount = skills.filter((s) => s.score < 60).length;
  const avgOverallScore = overallScore !== null && overallScore !== undefined
    ? overallScore
    : totalSkills > 0
      ? Math.round(skills.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalSkills)
      : 0;

  // Toggle checklist item status
  const handleToggleChecklist = (skillId, checkId) => {
    setSkills((prevSkills) =>
      prevSkills.map((s) => {
        if (s.id === skillId && s.checklist) {
          const updatedChecklist = s.checklist.map((item) =>
            item.id === checkId ? { ...item, completed: !item.completed } : item
          );
          return { ...s, checklist: updatedChecklist };
        }
        return s;
      })
    );

    if (selectedWeakSkill && selectedWeakSkill.id === skillId) {
      setSelectedWeakSkill((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) =>
          item.id === checkId ? { ...item, completed: !item.completed } : item
        )
      }));
    }
  };

  const getStatusBadge = (status, score) => {
    if (score >= 80) return <span className="skill-badge skill-badge--strong">Strong</span>;
    if (score >= 70) return <span className="skill-badge skill-badge--good">Good</span>;
    if (score >= 50) return <span className="skill-badge skill-badge--weak">Weak</span>;
    return <span className="skill-badge skill-badge--critical">Critical</span>;
  };

  const getStatusColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 70) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="student-skillgaps-container">
      {/* Top Navigation / Back to Progress */}
      <div className="student-skillgaps-top-nav">
        <button
          type="button"
          className="btn-back-to-progress"
          onClick={() => navigate("/student/progress")}
        >
          <ArrowLeft size={16} />
          <span>Back to Progress Analytics</span>
        </button>
      </div>

      {/* Top Header */}
      <div className="student-skillgaps-header">
        <div>
          <h1 className="student-skillgaps-title">
            <Target className="header-icon" size={26} />
            <span>My Skill Analysis & Gap Diagnostics</span>
          </h1>
          <p className="student-skillgaps-subtitle">
            Multi-factor intelligence evaluated across your Quizzes, Coursework Tasks, Coding Practice, AI Interviews & Roadmap.
          </p>
        </div>
        <div className="student-skillgaps-overall-badge">
          <Sparkles size={18} />
          <span>Overall Competency: <strong>{avgOverallScore}%</strong> {overallStatus ? `· ${overallStatus}` : ""}</span>
        </div>
      </div>

      {/* 5-Factor Learning Evaluation Pillars Overview (Attendance excluded) */}
      {factorsSummary && (
        <div className="skillgaps-factors-banner">
          <div className="factors-banner-header">
            <div className="factors-banner-title">
              <Brain size={18} className="text-indigo-600" />
              <span>Multi-Track Performance Pillars ({batchName ? `Batch: ${batchName}` : "Enrolled Curriculum"})</span>
            </div>
            <span className="factors-banner-badge">5 Evaluated Factors</span>
          </div>

          <div className="skillgaps-factors-grid">
            {/* Factor 1: Quizzes */}
            <div className="factor-metric-card">
              <div className="factor-card-top">
                <span className="factor-card-name">Academic Quizzes</span>
                <span className="factor-card-weight">{factorsSummary.quizzes?.weight || "25%"}</span>
              </div>
              <div className="factor-card-score" style={{ color: getStatusColor(factorsSummary.quizzes?.score || 0) }}>
                {factorsSummary.quizzes?.score ?? 0}%
              </div>
              <div className="factor-card-detail">{factorsSummary.quizzes?.detail || "Quiz Accuracy"}</div>
            </div>

            {/* Factor 2: Batch Tasks */}
            <div className="factor-metric-card">
              <div className="factor-card-top">
                <span className="factor-card-name">Coursework Tasks</span>
                <span className="factor-card-weight">{factorsSummary.coursework?.weight || "20%"}</span>
              </div>
              <div className="factor-card-score" style={{ color: getStatusColor(factorsSummary.coursework?.score || 0) }}>
                {factorsSummary.coursework?.score ?? 0}%
              </div>
              <div className="factor-card-detail">{factorsSummary.coursework?.detail || "Task Submissions"}</div>
            </div>

            {/* Factor 3: Coding Practice */}
            <div className="factor-metric-card">
              <div className="factor-card-top">
                <span className="factor-card-name">Coding Practice</span>
                <span className="factor-card-weight">{factorsSummary.coding?.weight || "25%"}</span>
              </div>
              <div className="factor-card-score" style={{ color: getStatusColor(factorsSummary.coding?.score || 0) }}>
                {factorsSummary.coding?.score ?? 0}%
              </div>
              <div className="factor-card-detail">{factorsSummary.coding?.detail || "Problems Solved"}</div>
            </div>

            {/* Factor 4: AI Interview */}
            <div className="factor-metric-card">
              <div className="factor-card-top">
                <span className="factor-card-name">AI Interview</span>
                <span className="factor-card-weight">{factorsSummary.interviews?.weight || "15%"}</span>
              </div>
              <div className="factor-card-score" style={{ color: factorsSummary.interviews?.score > 0 ? getStatusColor(factorsSummary.interviews.score) : "#94a3b8" }}>
                {factorsSummary.interviews?.score ?? 0}%
              </div>
              <div className="factor-card-detail">{factorsSummary.interviews?.detail || "Mock Interviews"}</div>
            </div>

            {/* Factor 5: AI Roadmap */}
            <div className="factor-metric-card">
              <div className="factor-card-top">
                <span className="factor-card-name">AI Roadmap</span>
                <span className="factor-card-weight">{factorsSummary.roadmap?.weight || "15%"}</span>
              </div>
              <div className="factor-card-score" style={{ color: factorsSummary.roadmap?.score > 0 ? getStatusColor(factorsSummary.roadmap.score) : "#94a3b8" }}>
                {factorsSummary.roadmap?.score ?? 0}%
              </div>
              <div className="factor-card-detail">{factorsSummary.roadmap?.detail || "Milestones Completed"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Intervention & Action Plan Banner */}
      {interventionData && interventionData.statusInfo && interventionData.statusInfo.isDefaulter && (() => {
        // Exclude attendance from displayed reasons as requested
        const rawReasons = Array.isArray(interventionData.statusInfo.reasons) 
          ? interventionData.statusInfo.reasons 
          : [String(interventionData.statusInfo.reasons || "Requires performance improvement")];
        const cleanReasons = rawReasons.filter((r) => !r.toLowerCase().includes("attendance"));

        if (cleanReasons.length === 0 && (!interventionData.statusInfo.weakAreas || interventionData.statusInfo.weakAreas.length === 0)) {
          return null;
        }

        const latestHistory = interventionData.history && interventionData.history.length > 0 ? interventionData.history[0] : null;

        return (
          <div className="skillgaps-intervention-banner">
            <div className="intervention-banner-header">
              <div className="intervention-title-group">
                <div className="intervention-icon-box">
                  <AlertTriangle size={18} />
                </div>
                <span>Mentor Intervention Alert: Action Plan Assigned</span>
              </div>
              <span className="intervention-priority-badge">
                {interventionData.statusInfo.priority || "High"} Priority
              </span>
            </div>

            <div className="intervention-reasons-group">
              <span className="intervention-reason-label">Flagged Diagnostic Areas:</span>
              <div className="intervention-reasons-list">
                {cleanReasons.length > 0 ? (
                  cleanReasons.map((reason, idx) => (
                    <span key={idx} className="intervention-reason-chip">
                      {reason}
                    </span>
                  ))
                ) : (
                  <span className="intervention-reason-chip">
                    Competency benchmark below threshold
                  </span>
                )}
              </div>
            </div>

            {latestHistory && (
              <div className="intervention-meta-grid">
                <div className="intervention-meta-card">
                  <span className="intervention-meta-label">Assigned Mentor</span>
                  <span className="intervention-meta-value">{latestHistory.mentor_name || "Faculty Mentor"}</span>
                </div>
                <div className="intervention-meta-card">
                  <span className="intervention-meta-label">Action Directive</span>
                  <span className="intervention-meta-value">{latestHistory.action_taken || "1-on-1 counseling & remedial practice"}</span>
                </div>
                <div className="intervention-meta-card">
                  <span className="intervention-meta-label">Recommendations</span>
                  <span className="intervention-meta-value">{latestHistory.recommendations || "Complete targeted exercises in Practice Arena"}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* KPI Overview Cards */}
      <div className="skillgaps-kpi-grid">
        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--overall">
            <Layers size={22} />
          </div>
          <div>
            <div className="kpi-label">Assessed Competencies</div>
            <div className="kpi-val">{totalSkills} Domains</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--strong">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="kpi-label">Strong Domains (&ge;70%)</div>
            <div className="kpi-val text-emerald">{strongCount} Domains</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--good">
            <Award size={22} />
          </div>
          <div>
            <div className="kpi-label">Good Domains (60-69%)</div>
            <div className="kpi-val text-blue">{goodCount} Domains</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--weak">
            <TrendingDown size={22} />
          </div>
          <div>
            <div className="kpi-label">Gaps Identified (&lt;60%)</div>
            <div className="kpi-val text-amber">{weakCount} Action Needed</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Task 1 (My Skill Analysis) & Task 2 (Improvement Recommendations) */}
      <div className="skillgaps-main-layout">
        {/* Left Column: Task 1 - My Skill Analysis */}
        <div className="skillgaps-analysis-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">
                <Layers size={20} />
                <span>My Skill Analysis</span>
              </h2>
              <p className="card-desc">Click any competency to open personalized diagnostic report & action plan</p>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button
                className={`filter-tab-btn ${selectedFilter === "all" ? "active" : ""}`}
                onClick={() => setSelectedFilter("all")}
              >
                All ({totalSkills})
              </button>
              <button
                className={`filter-tab-btn ${selectedFilter === "strong" ? "active" : ""}`}
                onClick={() => setSelectedFilter("strong")}
              >
                Strong ({strongCount})
              </button>
              <button
                className={`filter-tab-btn ${selectedFilter === "weak" ? "active" : ""}`}
                onClick={() => setSelectedFilter("weak")}
              >
                Weak ({weakCount})
              </button>
            </div>
          </div>

          {/* Skill List */}
          <div className="skill-analysis-list">
            {filteredSkills.map((skill) => {
              const isSelected = selectedWeakSkill?.id === skill.id;
              const isWeak = skill.score < 60;

              return (
                <div
                  key={skill.id}
                  className={`skill-item-row ${isSelected ? "skill-item-row--selected" : ""} ${
                    isWeak ? "skill-item-row--weak" : ""
                  }`}
                  onClick={() => setSelectedWeakSkill(skill)}
                >
                  <div className="skill-item-left">
                    <div className="skill-item-name-group">
                      <span className="skill-item-name">{skill.name}</span>
                      <span className="skill-item-category">{skill.category}</span>
                      {skill.factorsSummary && (
                        <span className="skill-item-factors-tag">{skill.factorsSummary}</span>
                      )}
                    </div>
                  </div>

                  <div className="skill-item-middle">
                    <div className="skill-progress-bar-bg">
                      <div
                        className="skill-progress-bar-fill"
                        style={{
                          width: `${skill.score}%`,
                          backgroundColor: getStatusColor(skill.score)
                        }}
                      ></div>
                    </div>
                    <span className="skill-score-percent">{skill.score}%</span>
                  </div>

                  <div className="skill-item-right">
                    {getStatusBadge(skill.status, skill.score)}
                    <span className="skill-action-hint">
                      View Plan <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredSkills.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                No evaluated competencies match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Task 2 - Student Improvement Recommendations */}
        <div className="skillgaps-recommendation-card">
          {selectedWeakSkill ? (
            <div>
              <div className="recommendation-header">
                <div className="recommendation-title-row">
                  <div className="skill-title-with-badge">
                    {selectedWeakSkill.score < 60 ? (
                      <AlertTriangle className="icon-alert" size={22} />
                    ) : (
                      <Award className="text-emerald" size={22} />
                    )}
                    <h2>{selectedWeakSkill.name}</h2>
                  </div>
                  {getStatusBadge(selectedWeakSkill.status, selectedWeakSkill.score)}
                </div>

                {/* Score vs Target Banner */}
                <div className="score-target-banner">
                  <div className="score-box">
                    <span className="score-label">Current Score</span>
                    <span className="score-num" style={{ color: getStatusColor(selectedWeakSkill.score) }}>
                      {selectedWeakSkill.score}%
                    </span>
                  </div>

                  <div className="target-arrow">
                    <ArrowRight size={20} color="#64748b" />
                  </div>

                  <div className="score-box">
                    <span className="score-label">Target Score</span>
                    <span className="score-num text-emerald">{selectedWeakSkill.targetScore}%</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Contributing Evaluation Factors */}
              {selectedWeakSkill.factors && selectedWeakSkill.factors.length > 0 && (
                <div className="recommendation-section">
                  <h3 className="section-subtitle">
                    <Layers size={16} />
                    <span>Contributing Factors Breakdown</span>
                  </h3>
                  <div className="contributing-factors-grid">
                    {selectedWeakSkill.factors.map((f, idx) => (
                      <div key={idx} className="contributing-factor-row">
                        <div>
                          <span className="cf-name">{f.factor}: </span>
                          <span className="cf-detail">{f.detail}</span>
                        </div>
                        <span className="cf-score" style={{ background: `${getStatusColor(f.score)}18`, color: getStatusColor(f.score) }}>
                          {f.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Why this skill is weak */}
              <div className="recommendation-section">
                <h3 className="section-subtitle">
                  <Info size={16} />
                  <span>Diagnostic Findings</span>
                </h3>
                <div className="why-weak-box">
                  <p>{selectedWeakSkill.whyWeak || `Current performance benchmark is at ${selectedWeakSkill.score}%, meeting active proficiency expectations.`}</p>
                </div>
              </div>

              {/* Section 3: Recommended Topics */}
              {selectedWeakSkill.recommendedTopics && selectedWeakSkill.recommendedTopics.length > 0 && (
                <div className="recommendation-section">
                  <h3 className="section-subtitle">
                    <BookOpen size={16} />
                    <span>Recommended Topics to Study</span>
                  </h3>
                  <div className="topics-tags-grid">
                    {selectedWeakSkill.recommendedTopics.map((topic, idx) => (
                      <div key={idx} className="topic-tag-chip">
                        <Check size={12} className="tag-check" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Actionable Checklist (What should I do?) */}
              {selectedWeakSkill.checklist && selectedWeakSkill.checklist.length > 0 && (
                <div className="recommendation-section">
                  <h3 className="section-subtitle">
                    <CheckCircle2 size={16} />
                    <span>What should I do? (Action Plan)</span>
                  </h3>
                  <div className="checklist-container">
                    {selectedWeakSkill.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`checklist-item ${item.completed ? "checklist-item--completed" : ""}`}
                      >
                        <label className="checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(selectedWeakSkill.id, item.id)}
                          />
                          <span className="custom-checkmark"></span>
                        </label>
                        <span className="checklist-text">{item.text}</span>
                        <button
                          className="checklist-action-btn"
                          onClick={() => navigate(item.route || "/student/learning")}
                        >
                          <span>{item.type === "quiz" ? "Take Quiz" : item.type === "interview" ? "Start Interview" : item.type === "practice" ? "Practice" : item.type === "roadmap" ? "Roadmap" : "Explore"}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Footer */}
              <div className="recommendations-footer-actions">
                <button
                  className="btn-primary-action"
                  onClick={() => navigate("/student/quiz")}
                >
                  <GraduationCap size={16} />
                  <span>Start Practice Quiz</span>
                </button>
                <button
                  className="btn-secondary-action"
                  onClick={() => navigate("/student/practice")}
                >
                  <Code2 size={16} />
                  <span>Practice Coding</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="no-weak-skill-selected">
              <CheckCircle2 size={48} className="text-emerald" />
              <h3>All Skills Look Great!</h3>
              <p>Select any competency from the list to view diagnostic breakdown and recommended action items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
