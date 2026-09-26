import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  CircleDot,
  Lock,
  BookOpen,
  RefreshCw,
  Cpu,
  Target,
  Award,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  BookMarked,
  Code2,
  ArrowRight,
  X,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import apiFetch from "../../../utils/api";
import "../Styles/ST_AiRoadmap.css";

const POPULAR_TARGETS = [
  { role: "Java Fullstack Developer", icon: "☕", tag: "Hot Skill" },
  { role: "Frontend (React & Next.js)", icon: "⚛️", tag: "High Demand" },
  { role: "Python & Data Science", icon: "🐍", tag: "AI/ML" },
  { role: "Cyber Security Analyst", icon: "🛡️", tag: "Security" },
  { role: "DevOps & Cloud Engineer", icon: "☁️", tag: "Infrastructure" },
  { role: "Flutter Mobile Developer", icon: "📱", tag: "Mobile" },
];

const PRESET_PATHWAYS = [
  {
    title: "Java Fullstack Developer",
    subtitle: "Enterprise Backend + Modern Frontend",
    desc: "Master Core Java, Spring Boot microservices, REST APIs, Hibernate, PostgreSQL & React integration.",
    milestonesCount: 6,
    icon: "☕",
    badge: "Most Popular",
    color: "#4f46e5",
  },
  {
    title: "Frontend Web Engineer",
    subtitle: "Modern Single-Page Application Mastery",
    desc: "Deep dive into HTML5/CSS3, JavaScript ES6+, React, Redux Toolkit, Next.js & UI design systems.",
    milestonesCount: 5,
    icon: "⚛️",
    badge: "Trending",
    color: "#0891b2",
  },
  {
    title: "Python & Data Analytics",
    subtitle: "Data Science, Machine Learning & AI",
    desc: "Learn Python programming, Pandas, NumPy, Data Visualization, Scikit-Learn & ML Algorithms.",
    milestonesCount: 6,
    icon: "🐍",
    badge: "AI Powered",
    color: "#059669",
  },
  {
    title: "Cyber Security Analyst",
    subtitle: "Defensive Security & Threat Analysis",
    desc: "Network Protocols, Kali Linux tools, Penetration Testing concepts, SIEM tools & Compliance.",
    milestonesCount: 5,
    icon: "🛡️",
    badge: "High Demand",
    color: "#dc2626",
  },
  {
    title: "DevOps & Cloud Engineer",
    subtitle: "CI/CD Pipelines & Cloud Infrastructure",
    desc: "Docker containerization, Kubernetes orchestration, AWS Cloud, Terraform & GitHub Actions.",
    milestonesCount: 6,
    icon: "☁️",
    badge: "Cloud Track",
    color: "#7c3aed",
  },
  {
    title: "Flutter Cross-Platform Dev",
    subtitle: "iOS & Android Unified Apps",
    desc: "Dart language essentials, Flutter Widgets, Provider/Bloc state management & Firebase backend.",
    milestonesCount: 5,
    icon: "📱",
    badge: "Mobile",
    color: "#ea580c",
  },
];

function getTopicsForMilestone(m, targetRole) {
  if (Array.isArray(m.topics) && m.topics.length > 0) {
    return m.topics;
  }

  const roleLower = (targetRole || "").toLowerCase();
  const titleLower = (m.title || "").toLowerCase();

  // Craft dynamic topics from tags if available
  if (Array.isArray(m.tags) && m.tags.length > 0) {
    return [
      `Core concepts & fundamentals of ${m.tags.slice(0, 2).join(" & ")}`,
      `Practical hands-on implementation focusing on ${m.tags[2] || m.tags[0] || targetRole}`,
      `Advanced workflow patterns, performance & code quality standards`,
      `Real-world lab project build and competency assessment`,
    ];
  }

  if (roleLower.includes("frontend") || roleLower.includes("react") || roleLower.includes("web")) {
    if (titleLower.includes("fundamental") || titleLower.includes("milestone 1")) {
      return [
        "Semantic HTML5 elements & Modern CSS flexbox/grid responsive layouts",
        "JavaScript ES6+ fundamentals: Promises, Async/Await, Arrow functions & DOM API",
        "Git version control workflows & browser developer tools debugging",
        "Building a responsive portfolio landing page project",
      ];
    }
    if (titleLower.includes("react") || titleLower.includes("component") || titleLower.includes("milestone 2")) {
      return [
        "React Component Architecture: Functional components, Hooks (useState, useEffect, useContext)",
        "Single-Page Application Routing with React Router v6 & Navigation Guards",
        "Asynchronous REST API Integration using Axios with error boundary handling",
        "Form validation with React Hook Form & Zod schema validation",
      ];
    }
    return [
      `Advanced UI Patterns & Component Architecture for ${targetRole || "Frontend"}`,
      `State management, async API integration & performance optimization`,
      `Automated testing, code quality checks & modern build tools`,
      `End-to-end practical project build and code review`,
    ];
  }

  return [
    `Foundational concepts and principles of ${m.title || targetRole}`,
    `Hands-on practical implementation & skill application`,
    `Advanced techniques, optimization & quality control`,
    `Real-world capstone project build and assessment`,
  ];
}

export default function AIRoadmap() {
  const [goalInput, setGoalInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [aiSource, setAiSource] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [error, setError] = useState(null);

  // Fetch student profile & active roadmap
  useEffect(() => {
    loadUserProfile();
    loadStudentRoadmap();
  }, []);

  const loadUserProfile = () => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setUserProfile(res.data);
        }
      })
      .catch(() => {
        try {
          const u = JSON.parse(
            sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
          );
          if (u) setUserProfile(u);
        } catch (e) {}
      });
  };

  const loadStudentRoadmap = async () => {
    setIsLoading(true);
    const response = await apiFetch("/roadmaps");
    if (response && response.data) {
      setCurrentRoadmap(response.data);
      if (response.data.targetRole) {
        setGoalInput(response.data.targetRole);
      }
      if (response.data.aiSource) {
        setAiSource(response.data.aiSource);
      }
    }
    setIsLoading(false);
  };

  const generateForRole = async (targetRole) => {
    if (!targetRole || !targetRole.trim()) return;
    setGoalInput(targetRole);
    executeGeneration(targetRole.trim());
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;
    executeGeneration(goalInput.trim());
  };

  const executeGeneration = async (targetRole) => {
    setIsGenerating(true);
    setError(null);
    try {
      const u =
        userProfile ||
        JSON.parse(
          sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
        );
      const sp = u.studentProfile || {};
      const rawSkills = sp.skills || u.skills || "";
      const skillsArr = typeof rawSkills === "string" ? rawSkills.split(",") : (rawSkills || []);

      const response = await apiFetch("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify({
          targetRole: targetRole,
          studentProfile: {
            department: sp.department || u.department || "",
            semester: sp.semester || u.semester || "",
            cgpa: sp.cgpa || u.cgpa || "",
          },
          currentSkills: skillsArr.map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (response && response.data) {
        setCurrentRoadmap(response.data);
        if (response.data.aiSource) {
          setAiSource(response.data.aiSource);
        }
      } else if (response && response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error("Roadmap generation error:", err);
      setError(err.message || "Failed to generate roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const statusCycle = {
      completed: "in-progress",
      "in-progress": "completed",
      locked: "in-progress",
    };
    const newStatus = statusCycle[item.status] || "in-progress";
    const newProgress = newStatus === "completed" ? 100 : newStatus === "in-progress" ? 50 : 0;

    // Optimistic UI update
    if (currentRoadmap && currentRoadmap.milestones) {
      const updatedMilestones = currentRoadmap.milestones.map((m) =>
        m.id === item.id ? { ...m, status: newStatus, progress: newProgress } : m
      );
      setCurrentRoadmap({ ...currentRoadmap, milestones: updatedMilestones });
    }

    // Server status update
    await apiFetch(`/roadmaps/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: newStatus,
        progress: newProgress,
      }),
    });
  };

  const toggleMilestoneExpand = (id) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (status, onClick) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="success"
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
            onClick={onClick}
          >
            <CheckCircle2 size={12} /> Completed ✓
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="default"
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
            onClick={onClick}
          >
            <Zap size={12} /> In Progress
          </Badge>
        );
      case "locked":
      default:
        return (
          <Badge
            variant="outline"
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
            onClick={onClick}
          >
            <Lock size={12} /> Locked
          </Badge>
        );
    }
  };

  const milestones = currentRoadmap?.milestones || [];
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="roadmap-container stack-6">
      {/* Section Header */}
      <div className="ui-section-header-ST">
        <div className="ui-section-main-ST">
          <div>
            <h2 className="ui-section-title">
              <Sparkles size={22} className="ui-section-title-icon text-indigo-600 animate-pulse" />
              <span>Personalized AI Career Roadmap Generator</span>
            </h2>
            <p className="ui-section-desc">
              Type any career goal or technology, and the AI will generate your customized step-by-step learning path.
            </p>
          </div>
        </div>
      </div>

      {/* AI Roadmap Generator Card */}
      <div className="roadmap-generator-card">
        {/* Input Box & Action */}
        <form onSubmit={handleGenerate} className="roadmap-form-wrap">
          <div className="roadmap-input-row">
            <div className="roadmap-input-field-wrap">
              <Search size={18} className="roadmap-input-search-icon" />
              <input
                type="text"
                className="roadmap-select-input"
                placeholder="Type your target role (e.g. Java Fullstack, React Developer, Data Scientist)..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                required
              />
              {goalInput && (
                <button
                  type="button"
                  className="roadmap-input-clear-btn"
                  onClick={() => setGoalInput("")}
                  title="Clear input"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="roadmap-gen-btn"
              disabled={isGenerating || !goalInput.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating AI Path...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="roadmap-error-alert flex items-center justify-between gap-3 p-3 mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Popular Suggestions Row */}
          <div className="roadmap-suggestions-row">
            <span className="roadmap-suggestions-label">Popular Targets:</span>
            <div className="roadmap-pills-wrap">
              {POPULAR_TARGETS.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  className={`roadmap-suggest-pill ${goalInput === item.role ? "active" : ""}`}
                  onClick={() => generateForRole(item.role)}
                >
                  <span className="pill-emoji">{item.icon}</span>
                  <span>{item.role}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        {userProfile?.skills && (
          <div className="roadmap-skills-adaptation-banner">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>
              <strong>Profile Skills Pruned:</strong> Experienced in{" "}
              <strong>
                {typeof userProfile.skills === "string" ? userProfile.skills : userProfile.skills.join(", ")}
              </strong>
              . AI will skip beginner topics you already know.
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area: Loading / Empty Showcase / Timeline */}
      {isLoading ? (
        <div className="roadmap-loading-box">
          <RefreshCw size={32} className="animate-spin text-indigo-600" />
          <p className="roadmap-loading-text">Loading your custom learning pathway...</p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="roadmap-empty-state-card">
          <div className="roadmap-empty-hero">
            <div className="roadmap-empty-icon-halo">
              <Compass size={36} className="text-indigo-600" />
            </div>
            <h3 className="roadmap-empty-title">Ready to Launch Your Career Roadmap?</h3>
            <p className="roadmap-empty-desc">
              Type your target role in the generator above, or select one of our curated high-demand pathways below to begin instantly.
            </p>
          </div>

          <div className="roadmap-preset-section">
            <div className="roadmap-preset-header">
              <Sparkles size={16} className="text-indigo-600" />
              <span>Explore High-Demand Career Tracks</span>
            </div>

            <div className="roadmap-preset-grid">
              {PRESET_PATHWAYS.map((path) => (
                <div
                  key={path.title}
                  className="roadmap-preset-card"
                  onClick={() => generateForRole(path.title)}
                >
                  <div className="preset-card-top">
                    <span className="preset-emoji-badge">{path.icon}</span>
                    <span className="preset-tag-badge">{path.badge}</span>
                  </div>
                  <h4 className="preset-title">{path.title}</h4>
                  <p className="preset-subtitle">{path.subtitle}</p>
                  <p className="preset-desc">{path.desc}</p>

                  <div className="preset-card-footer">
                    <span className="preset-meta-info">{path.milestonesCount} Structured Milestones</span>
                    <span className="preset-action-link">
                      Generate <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="roadmap-active-section">
          {/* Active Roadmap Progress Header Bar */}
          <div className="roadmap-summary-bar">
            <div className="roadmap-summary-info">
              <div className="roadmap-target-title-wrap">
                <Target size={20} className="text-indigo-600" />
                <h3>Target Path: {currentRoadmap.targetRole || goalInput}</h3>
              </div>
              <p className="roadmap-summary-sub">
                {completedCount} of {milestones.length} milestones completed ({progressPercent}%)
              </p>
            </div>

            <div className="roadmap-summary-stats">
              <div className="roadmap-stat-pill">
                <BookMarked size={14} />
                <span>{milestones.length} Milestones</span>
              </div>
              <div className="roadmap-stat-pill">
                <Code2 size={14} />
                <span>
                  {milestones.reduce((acc, m) => acc + (m.exercises || 0), 0)} Coding Labs
                </span>
              </div>
              <button
                type="button"
                className="roadmap-reset-btn"
                onClick={() => {
                  setCurrentRoadmap(null);
                  setGoalInput("");
                }}
              >
                <RefreshCw size={13} />
                <span>Change Target</span>
              </button>
            </div>
          </div>

          {/* Progress Bar Header */}
          <div className="roadmap-overall-progress-card">
            <div className="overall-progress-row">
              <span className="overall-progress-label">Overall Pathway Progress</span>
              <span className="overall-progress-val">{progressPercent}%</span>
            </div>
            <div className="overall-progress-track">
              <div
                className="overall-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timeline View */}
          <div className="roadmap-timeline">
            {milestones.map((m, index) => {
              const isExpanded = !!expandedMilestones[m.id];
              const stepNum = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={m.id || index}
                  className={`roadmap-milestone-wrapper milestone-status-${m.status}`}
                >
                  <div className="roadmap-milestone-indicator">
                    <span className="milestone-step-num">{stepNum}</span>
                  </div>

                  <div className="roadmap-milestone-card">
                    <div className="milestone-card-header">
                      <div className="milestone-header-main">
                        <div className="milestone-title-row">
                          <h3 className="milestone-title">{m.title}</h3>
                          {getStatusBadge(m.status, () => handleToggleStatus(m))}
                        </div>
                        <p className="milestone-desc">{m.desc}</p>
                      </div>
                    </div>

                    <div className="milestone-progress-bar-wrap">
                      <div
                        className="milestone-progress-bar-fill"
                        style={{ width: `${m.progress || (m.status === 'completed' ? 100 : m.status === 'in-progress' ? 50 : 0)}%` }}
                      />
                    </div>

                    <div className="milestone-footer-row">
                      <div className="milestone-tags-list">
                        {(m.tags || []).map((tag) => (
                          <span key={tag} className="milestone-tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="milestone-footer-right">
                        <span className="milestone-stats-meta">
                          {m.quizzes || 3} quizzes · {m.exercises || 4} practice labs
                        </span>

                        <button
                          type="button"
                          className="milestone-expand-btn"
                          onClick={() => toggleMilestoneExpand(m.id)}
                        >
                          <span>{isExpanded ? "Hide Modules" : "View Modules"}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Module / Topics Details Drawer */}
                    {isExpanded && (
                      <div className="milestone-details-drawer">
                        <h4 className="drawer-heading">Key Learning Topics & Objectives:</h4>
                        <ul className="drawer-topics-list">
                          {getTopicsForMilestone(m, currentRoadmap?.targetRole).map((topic, i) => (
                            <li key={i} className="drawer-topic-item">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

