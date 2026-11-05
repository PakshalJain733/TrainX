import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Code2,
  FileCheck2,
  Calendar,
  ArrowRight,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Trophy,
  Activity,
  CheckCircle2,
  Clock
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/TR_Overview.css";
import "../Styles/TR_Batches.css";

export function TrainerOverview() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (_e) {}

    const loadData = async () => {
      setLoading(true);
      try {
        const [batchesRes, meRes] = await Promise.allSettled([
          apiFetch("/batches/my-batches"),
          apiFetch("/auth/me")
        ]);
        if (batchesRes.status === "fulfilled" && batchesRes.value?.data) {
          setBatches(batchesRes.value.data);
        }
        if (meRes.status === "fulfilled" && meRes.value?.data) {
          setUser((prev) => ({ ...prev, ...meRes.value.data }));
        }
      } catch (err) {
        console.error("Error loading trainer overview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalStudents = batches.reduce(
    (sum, b) => sum + Number(b.dynamicStudentsCount || b.students || 0),
    0
  );
  const totalTasks = batches.reduce(
    (sum, b) => sum + Number(b.tasksCount || 0),
    0
  );

  const getInitials = (name) => {
    if (!name) return "TR";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const rawName = user?.name || user?.fullName || user?.full_name || user?.userName || user?.username;
  const displayName = (() => {
    if (typeof rawName === "string" && rawName.trim()) {
      const trimmed = rawName.trim();
      if (!trimmed.includes("@") && !/^[0-9a-f]{8,}$/i.test(trimmed)) {
        return trimmed;
      }
    }
    const email = user?.email;
    if (typeof email === "string" && email.includes("@")) {
      const source = email.split("@")[0].replace(/[0-9_.-]+/g, " ").trim();
      if (source) {
        return source
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
    return rawName || "Trainer";
  })();
  const initials = getInitials(displayName);

  const kpiStats = [
    {
      label: "Joined Batches",
      value: `${batches.length} Cohorts`,
      hint: "Active training batches",
      icon: Layers,
      color: "blue"
    },
    {
      label: "Enrolled Students",
      value: `${totalStudents} Students`,
      hint: "Enrolled in your batches",
      icon: Users,
      color: "emerald"
    },
    {
      label: "Batch Tasks Published",
      value: `${totalTasks} Tasks`,
      hint: "Curated coding problems",
      icon: Code2,
      color: "amber"
    },
    {
      label: "Compiler Status",
      value: batches.length > 0 ? "Active" : "Ready",
      hint: "Real-time auto-grading",
      icon: FileCheck2,
      color: "purple"
    }
  ];

  return (
    <div className="trainer-overview-wrapper">
      {/* Radiant Hero Welcome Banner (Aligned with TrainX Mentor/Student Overview) */}
      <div className="trainer-hero-banner">
        <div className="trainer-hero-left">
          <div className="trainer-hero-avatar">{initials}</div>
          <div className="trainer-hero-text">
            <h1 className="trainer-hero-title">Welcome back, {displayName}!</h1>
          </div>
        </div>

        <div className="trainer-hero-actions">
          <Link to="/trainer/tasks">
            <button type="button" className="trainer-hero-btn trainer-hero-btn--primary">
              <Code2 size={15} /> Create Batch Task
            </button>
          </Link>
          <Link to="/trainer/batches">
            <button type="button" className="trainer-hero-btn trainer-hero-btn--secondary">
              <Users size={15} /> View Batches
            </button>
          </Link>
        </div>
      </div>

      {/* KPI 4-Metric Grid */}
      <div className="trainer-kpi-grid">
        {kpiStats.map((stat) => (
          <div key={stat.label} className="trainer-kpi-card">
            <div className="trainer-kpi-card-top">
              <div className={`trainer-kpi-icon-box trainer-kpi-icon--${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="trainer-kpi-label">{stat.label}</span>
            </div>
            <div className="trainer-kpi-value">{stat.value}</div>
            <div className="trainer-kpi-hint-row">
              <span className="trainer-kpi-trend-pill">{stat.hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Split Section: Active Batches + Quick Workspace Hub */}
      <div className="trainer-overview-split">
        {/* Left Card: My Training Batches */}
        <div className="trainer-section-card">
          <div className="trainer-section-header">
            <div className="trainer-section-header-left">
              <div className="trainer-section-icon-box">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="trainer-section-title">Assigned Training Batches</h3>
                <p className="trainer-section-desc">
                  Batches you have joined to publish tasks, review code, and inspect leaderboard standings.
                </p>
              </div>
            </div>

            <Link to="/trainer/batches" className="trainer-section-link">
              View All Batches <ChevronRight size={14} />
            </Link>
          </div>

          <div className="trainer-section-body">
            {loading ? (
              <div className="trainer-loading-placeholder">
                <div className="trainer-spinner" />
                <span>Loading active batches...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="trainer-empty-box">
                <Layers size={36} className="trainer-empty-icon" />
                <h4 className="trainer-empty-title">No batches assigned yet</h4>
                <p className="trainer-empty-desc">
                  Batches assigned to you by administrators or coordinators will appear here.
                </p>
                <Link to="/trainer/batches">
                  <button
                    type="button"
                    className="trainer-btn-primary"
                  >
                    <Users size={15} /> View Batches
                  </button>
                </Link>
              </div>
            ) : (
              <div className="trainer-batch-cards-list">
                {batches.slice(0, 4).map((b) => (
                  <div key={b.id} className="trainer-batch-row-card">
                    <div className="trainer-batch-row-main">
                      <div className="trainer-batch-avatar-square">
                        {b.name ? b.name.slice(0, 2).toUpperCase() : "BT"}
                      </div>
                      <div className="trainer-batch-row-info">
                        <div className="trainer-batch-row-title-wrap">
                          <h4 className="trainer-batch-row-name">{b.name}</h4>
                          <span className="trainer-status-pill trainer-status-pill--active">
                            Active
                          </span>
                        </div>
                        <div className="trainer-batch-row-meta">
                          <span className="trainer-meta-item">
                            <Calendar size={12} /> {b.schedule || "Scheduled Sessions"}
                          </span>
                          <span className="trainer-meta-dot">•</span>
                          <span className="trainer-meta-item">
                            {[b.year, b.division].filter(Boolean).join(" ") || "Cohort"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="trainer-batch-row-stats">
                      <div className="trainer-batch-badge-pill">
                        <Users size={12} /> {b.dynamicStudentsCount || b.students || 0} Students
                      </div>
                      <div className="trainer-batch-badge-pill">
                        <Code2 size={12} /> {b.tasksCount || 0} Tasks
                      </div>
                      <Link
                        to="/trainer/batches"
                        className="trainer-row-action-btn"
                        title="Open Batch Workspace"
                      >
                        Manage <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Quick Actions Hub */}
        <div className="trainer-section-card trainer-quick-hub-card">
          <div className="trainer-section-header">
            <div className="trainer-section-header-left">
              <div className="trainer-section-icon-box trainer-icon-box--indigo">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="trainer-section-title">Quick Action Hub</h3>
                <p className="trainer-section-desc">Fast shortcuts for daily trainer operations</p>
              </div>
            </div>
          </div>

          <div className="trainer-quick-actions-list">
            <Link to="/trainer/batches" className="trainer-quick-action-item">
              <div className="trainer-quick-action-icon trainer-quick-icon--blue">
                <Users size={18} />
              </div>
              <div className="trainer-quick-action-text">
                <div className="trainer-quick-action-title">View Assigned Batches</div>
                <div className="trainer-quick-action-sub">Explore enrolled students and batch tasks</div>
              </div>
              <ChevronRight size={16} className="trainer-quick-action-arrow" />
            </Link>

            <Link to="/trainer/tasks" className="trainer-quick-action-item">
              <div className="trainer-quick-action-icon trainer-quick-icon--emerald">
                <Code2 size={18} />
              </div>
              <div className="trainer-quick-action-text">
                <div className="trainer-quick-action-title">Publish Batch Task</div>
                <div className="trainer-quick-action-sub">Set coding problem with public & hidden test cases</div>
              </div>
              <ChevronRight size={16} className="trainer-quick-action-arrow" />
            </Link>

            <Link to="/trainer/submissions" className="trainer-quick-action-item">
              <div className="trainer-quick-action-icon trainer-quick-icon--amber">
                <FileCheck2 size={18} />
              </div>
              <div className="trainer-quick-action-text">
                <div className="trainer-quick-action-title">Submissions & Code Review</div>
                <div className="trainer-quick-action-sub">Inspect student source code and test suite scores</div>
              </div>
              <ChevronRight size={16} className="trainer-quick-action-arrow" />
            </Link>

            <Link to="/trainer/leaderboard" className="trainer-quick-action-item">
              <div className="trainer-quick-action-icon trainer-quick-icon--purple">
                <Trophy size={18} />
              </div>
              <div className="trainer-quick-action-text">
                <div className="trainer-quick-action-title">Batch Leaderboards</div>
                <div className="trainer-quick-action-sub">Compare student rankings, XP points & solved rates</div>
              </div>
              <ChevronRight size={16} className="trainer-quick-action-arrow" />
            </Link>
          </div>

          {/* Quick Notice Banner */}
          <div className="trainer-quick-notice">
            <div className="trainer-notice-icon-box">
              <CheckCircle2 size={15} />
            </div>
            <div className="trainer-notice-content">
              <strong>Compiler Autograder Ready</strong>: Real-time multi-language execution (Java, Python, C++, C, JavaScript) with test case verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainerOverview;
