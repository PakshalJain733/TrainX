import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Target,
  Sparkles,
  Award,
  TrendingDown,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  Layers,
  GraduationCap,
  PlayCircle,
  UserCheck,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/api";
import "../Styles/StudentSkillGaps.css";

// Initial mock data for student skills analysis & recommendations
const initialSkillData = [
  {
    id: "java",
    name: "Java",
    score: 82,
    status: "Strong",
    category: "Programming",
    lastAssessed: "3 days ago",
    whyWeak: null,
    targetScore: 90,
    recommendations: []
  },
  {
    id: "oop",
    name: "Object-Oriented Programming (OOP)",
    score: 75,
    status: "Good",
    category: "Software Engineering",
    lastAssessed: "5 days ago",
    whyWeak: null,
    targetScore: 85,
    recommendations: []
  },
  {
    id: "dbms",
    name: "DBMS",
    score: 48,
    status: "Weak",
    category: "Core Computer Science",
    lastAssessed: "Yesterday",
    whyWeak: "Low scores in DBMS quizzes (42%) and AI interview round on Indexing & Normalization. Multiple incorrect answers in SQL Joins syntax.",
    targetScore: 80,
    recommendedTopics: ["Database Normalization (1NF to 3NF)", "SQL Joins & Subqueries", "Indexing & Transactions", "ER Modeling"],
    checklist: [
      { id: 1, text: "Revise Normalization rules", completed: true, type: "revise", route: "/student/learning" },
      { id: 2, text: "Study SQL Joins & Query Optimization", completed: false, type: "study", route: "/student/learning" },
      { id: 3, text: "Complete DBMS practice quiz", completed: false, type: "quiz", route: "/student/quiz" },
      { id: 4, text: "Retake DBMS assessment / AI Interview", completed: false, type: "retake", route: "/student/ai-interview" }
    ]
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    score: 35,
    status: "Critical",
    category: "Data Structures & Algorithms",
    lastAssessed: "2 days ago",
    whyWeak: "Struggled with overlapping subproblems and memoization pattern recognition in recent practice coding challenges.",
    targetScore: 75,
    recommendedTopics: ["Memoization vs Tabulation", "0/1 Knapsack Problem", "Longest Common Subsequence (LCS)", "Coin Change Problem"],
    checklist: [
      { id: 1, text: "Watch Dynamic Programming Masterclass video", completed: true, type: "study", route: "/student/learning" },
      { id: 2, text: "Solve 5 DP practice problems (Easy -> Medium)", completed: false, type: "practice", route: "/student/practice" },
      { id: 3, text: "Complete DP Milestone Quiz", completed: false, type: "quiz", route: "/student/quiz" },
      { id: 4, text: "Attempt AI Technical Interview on Algorithms", completed: false, type: "retake", route: "/student/ai-interview" }
    ]
  },
  {
    id: "react",
    name: "React & Frontend Architecture",
    score: 88,
    status: "Strong",
    category: "Web Development",
    lastAssessed: "4 days ago",
    whyWeak: null,
    targetScore: 92,
    recommendations: []
  },
  {
    id: "system-design",
    name: "System Design",
    score: 52,
    status: "Weak",
    category: "Architecture",
    lastAssessed: "1 week ago",
    whyWeak: "Scored low on scalability concepts (Load Balancing & Caching strategies) during mock drive assessments.",
    targetScore: 80,
    recommendedTopics: ["Load Balancers & Reverse Proxies", "Redis Caching Strategies", "Database Sharding"],
    checklist: [
      { id: 1, text: "Read Caching & CDN architecture guide", completed: false, type: "revise", route: "/student/learning" },
      { id: 2, text: "Practice High-Level Design scenarios", completed: false, type: "practice", route: "/student/practice" },
      { id: 3, text: "Take System Design practice test", completed: false, type: "quiz", route: "/student/quiz" }
    ]
  }
];

export default function StudentSkillGaps() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState(initialSkillData);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedWeakSkill, setSelectedWeakSkill] = useState(initialSkillData[2]); // Default DBMS selected for recommendation view
  const [interventionData, setInterventionData] = useState(null);

  useEffect(() => {
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

  // Calculate summary counts
  const totalSkills = skills.length;
  const strongCount = skills.filter((s) => s.score >= 70).length;
  const goodCount = skills.filter((s) => s.score >= 60 && s.score < 70).length;
  const weakCount = skills.filter((s) => s.score < 60).length;
  const avgOverallScore = Math.round(skills.reduce((acc, curr) => acc + curr.score, 0) / totalSkills);

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
      {/* Top Header */}
      <div className="student-skillgaps-header">
        <div>
          <h1 className="student-skillgaps-title">
            <Target className="header-icon" size={26} />
            <span>My Skill Analysis & Gap Diagnostics</span>
          </h1>
          <p className="student-skillgaps-subtitle">
            AI-computed skill proficiency based on your recent Quizzes, Coding Practice, and AI Mock Interviews.
          </p>
        </div>
        <div className="student-skillgaps-overall-badge">
          <Sparkles size={18} />
          <span>Overall Competency: <strong>{avgOverallScore}%</strong></span>
        </div>
      </div>

      {/* Mentor Intervention & Action Plan Banner */}
      {interventionData && interventionData.statusInfo && interventionData.statusInfo.isDefaulter && (
        <div style={{ padding: "16px 20px", borderRadius: "14px", background: "#fff1f2", border: "1px solid #fecdd3", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e11d48", fontWeight: 800, fontSize: "15px" }}>
              <AlertTriangle size={20} />
              <span>Mentor Intervention Alert: Action Plan Assigned</span>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: "12px", background: "#e11d48", color: "#ffffff", fontSize: "12px", fontWeight: 700 }}>
              {interventionData.statusInfo.priority || "High"} Priority
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#9f1239", lineHeight: 1.5 }}>
            <strong>Flagged Reasons:</strong> {Array.isArray(interventionData.statusInfo.reasons) ? interventionData.statusInfo.reasons.join(" · ") : "Requires performance improvement"}
          </div>
          {interventionData.history && interventionData.history.length > 0 && (
            <div style={{ marginTop: "4px", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #ffe4e6", fontSize: "12.5px", color: "#334155" }}>
              <div><strong>Assigned Mentor:</strong> {interventionData.history[0].mentor_name || "Prof. Mentor"}</div>
              <div><strong>Action Directives:</strong> {interventionData.history[0].action_taken || "Assigned 1-on-1 counseling & remedial tasks"}</div>
              <div><strong>Recommendations:</strong> {interventionData.history[0].recommendations || "Complete practice drills"}</div>
            </div>
          )}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="skillgaps-kpi-grid">
        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--overall">
            <Layers size={22} />
          </div>
          <div>
            <div className="kpi-label">Assessed Skills</div>
            <div className="kpi-val">{totalSkills} Skills</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--strong">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="kpi-label">Strong Skills (&ge;70%)</div>
            <div className="kpi-val text-emerald">{strongCount} Skills</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--good">
            <Award size={22} />
          </div>
          <div>
            <div className="kpi-label">Good Skills (60-69%)</div>
            <div className="kpi-val text-blue">{goodCount} Skills</div>
          </div>
        </div>

        <div className="skillgaps-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--weak">
            <TrendingDown size={22} />
          </div>
          <div>
            <div className="kpi-label">Weak Skills (&lt;60%)</div>
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
              <p className="card-desc">Click any weak skill to open personalized improvement plan</p>
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
                  onClick={() => {
                    if (skill.score < 60) {
                      setSelectedWeakSkill(skill);
                    }
                  }}
                >
                  <div className="skill-item-left">
                    <div className="skill-item-name-group">
                      <span className="skill-item-name">{skill.name}</span>
                      <span className="skill-item-category">{skill.category}</span>
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
                    {isWeak && (
                      <span className="skill-action-hint">
                        View Plan <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Task 2 - Student Improvement Recommendations */}
        <div className="skillgaps-recommendation-card">
          {selectedWeakSkill ? (
            <div>
              <div className="recommendation-header">
                <div className="recommendation-title-row">
                  <div className="skill-title-with-badge">
                    <AlertTriangle className="icon-alert" size={22} />
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

              {/* Section 1: Why this skill is weak */}
              <div className="recommendation-section">
                <h3 className="section-subtitle">
                  <Info size={16} />
                  <span>Why is this skill weak?</span>
                </h3>
                <div className="why-weak-box">
                  <p>{selectedWeakSkill.whyWeak || "Assessment data indicates below-target scores in recent practice modules."}</p>
                </div>
              </div>

              {/* Section 2: Recommended Topics */}
              {selectedWeakSkill.recommendedTopics && (
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

              {/* Section 3: Actionable Checklist (What should I do?) */}
              {selectedWeakSkill.checklist && (
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
                          <span>{item.type === "quiz" ? "Take Quiz" : item.type === "retake" ? "Start Interview" : "Explore"}</span>
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
                  <span>Start Remedial Practice Quiz</span>
                </button>
                <button
                  className="btn-secondary-action"
                  onClick={() => navigate("/student/ai-interview")}
                >
                  <Sparkles size={16} />
                  <span>Retake AI Interview</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="no-weak-skill-selected">
              <CheckCircle2 size={48} className="text-emerald" />
              <h3>All Skills Look Great!</h3>
              <p>Select any skill from the list to view diagnostic breakdown and recommended action items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
