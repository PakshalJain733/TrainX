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
  UserCheck,
  Award,
  Check,
  Search,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import apiFetch from "../../../utils/api";
import "../Styles/ST_AiRoadmap.css";

export default function AIRoadmap() {
  const [goalInput, setGoalInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [aiSource, setAiSource] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

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
          const u = JSON.parse(sessionStorage.getItem("user") || "{}");
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

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!goalInput.trim()) return;

    setIsGenerating(true);
    try {
      const u = userProfile || JSON.parse(sessionStorage.getItem("user") || "{}");
      const sp = u.studentProfile || {};
      const rawSkills = sp.skills || u.skills || "";
      const skillsArr = typeof rawSkills === "string" ? rawSkills.split(",") : (rawSkills || []);

      const response = await apiFetch("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify({
          targetRole: goalInput.trim(),
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
      }
    } catch (err) {
      console.error("Roadmap generation error:", err);
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

  const getStatusBadge = (status, onClick) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="success"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onClick}
          >
            Completed ✓
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="default"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onClick}
          >
            In Progress
          </Badge>
        );
      case "locked":
      default:
        return (
          <Badge
            variant="outline"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onClick}
          >
            Locked
          </Badge>
        );
    }
  };

  const milestones = currentRoadmap?.milestones || [];

  return (
    <div className="roadmap-container stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <Sparkles size={22} style={{ color: "#4f46e5" }} />
          <span>AI Adaptive Learning Roadmap</span>
        </h2>
        <p className="student-header-desc">
          Tailored milestone progression, skill tracks, and adaptive learning pathways generated for your target career goal.
        </p>
      </div>

      {/* Clean AI Roadmap Header & Custom Goal Input */}
      <div className="roadmap-generator-card">
        <div className="roadmap-generator-header">
          <Sparkles size={22} className="roadmap-generator-icon text-indigo-500 animate-pulse mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="roadmap-generator-title">Personalized AI Career Roadmap Generator</h2>
              {aiSource && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 shrink-0">
                  <Cpu size={12} /> {aiSource === "gemini-ai" ? "Gemini 2.5 AI Model" : "Adaptive AI Model"}
                </span>
              )}
            </div>
            <p className="roadmap-generator-subtitle">
              Type any career goal or technology (e.g. <strong>Java Developer</strong>, <strong>Cyber Security</strong>, <strong>Flutter Developer</strong>), and the AI will generate your step-by-step learning roadmap.
            </p>
          </div>
        </div>

        {/* Custom Input Box & Generate Action */}
        <form onSubmit={handleGenerate} className="roadmap-form-wrap">
          <div className="roadmap-input-row">
            <div className="roadmap-input-field-wrap">
              <Search size={18} className="roadmap-input-search-icon" />
              <input
                type="text"
                className="roadmap-select-input"
                placeholder="Type your role (e.g. Java Developer, Cyber Security, Flutter Dev)..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="roadmap-gen-btn"
              disabled={isGenerating || !goalInput.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          </div>
        </form>


        {userProfile?.skills && (
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500" />
            <span>Profile Skills Pruning Active: <strong>{typeof userProfile.skills === "string" ? userProfile.skills : Array.isArray(userProfile.skills) ? userProfile.skills.join(", ") : ""}</strong> will not be re-taught from scratch.</span>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-indigo-500" />
          <p>Loading AI learning path...</p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/30">
          <BookOpen size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">No roadmap generated yet.</p>
          <p className="text-sm text-slate-500 mb-4">Type any role above (e.g. <strong>Java Developer</strong>, <strong>Cyber Security</strong>, <strong>Data Science</strong>) and click <strong>Generate Roadmap</strong> to create your AI path.</p>
        </div>
      ) : (
        <div className="roadmap-timeline">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`roadmap-milestone-wrapper milestone-status-${m.status}`}
            >
              <div className="roadmap-milestone-indicator">
                {m.status === "completed" && <CheckCircle2 size={20} className="text-emerald-500" />}
                {m.status === "in-progress" && <CircleDot size={20} className="text-indigo-500" />}
                {m.status === "locked" && <Lock size={18} className="text-slate-400" />}
              </div>

              <div className="roadmap-milestone-card">
                <div className="milestone-card-header">
                  <h3 className="milestone-title">{m.title}</h3>
                  {getStatusBadge(m.status, () => handleToggleStatus(m))}
                </div>

                <p className="milestone-desc">{m.desc}</p>

                <div className="milestone-progress-bar-wrap">
                  <div
                    className="milestone-progress-bar-fill"
                    style={{ width: `${m.progress}%` }}
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

                  <div className="milestone-stats-meta">
                    {m.quizzes} quizzes · {m.exercises} coding exercises
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
