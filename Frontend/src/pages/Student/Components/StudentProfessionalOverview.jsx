import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Users,
  TrendingUp,
  Flame,
  Info,
  Clock,
  Trophy,
  BookOpen,
  CalendarDays,
  UserCheck,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

const getStoredUserName = () => {
  const u = getStoredUser();
  const name = u.name || "";
  const isAutoName =
    !name ||
    /^\d+$/.test(name.trim()) ||
    name.startsWith("User_") ||
    /^vu\d/i.test(name.trim());
  if (isAutoName) return u.fullName || u.full_name || "Pakshal";
  return name;
};

const defaultDashboardData = {
  personalDetails: { name: getStoredUserName(), department: "" },
  academicOverview: { semester: "" },
  attendanceSummary: { percentage: 0 },
  codingProgress: { currentRank: "N/A" },
  upcomingDeadlines: [],
  leaderboard: [],
};

export default function StudentProfessionalOverview() {
  const [dashboard, setDashboard] = useState(defaultDashboardData);
  const [profileCompleted, setProfileCompleted] = useState(true);

  useEffect(() => {
    const resolveUserData = () => {
      const u = getStoredUser();
      if (!u || !u.name) return;

      let resolvedName = u.name || "";
      const isAutoName =
        !resolvedName ||
        /^\d+$/.test(resolvedName.trim()) ||
        resolvedName.startsWith("User_") ||
        /^vu\d/i.test(resolvedName.trim());
      if (isAutoName) resolvedName = u.fullName || u.full_name || "Pakshal";

      const student = u.studentProfile || {};
      const dept = u.department || student.department || "Electronics & Computer Science";
      const sem = u.semester || student.semester || "Semester 6";
      const cgpa = u.cgpa || u.aggregate_cgpa || "8.75";
      const isCompleted = u.profileCompleted !== undefined ? u.profileCompleted : Boolean(u.cgpa && u.skills);

      setProfileCompleted(isCompleted);

      setDashboard((prev) => ({
        ...prev,
        personalDetails: { ...prev.personalDetails, name: resolvedName, department: dept },
        academicOverview: { ...prev.academicOverview, semester: sem, cgpa },
      }));
    };

    resolveUserData();
    window.addEventListener("userProfileUpdated", resolveUserData);

    apiFetch("/student/dashboard")
      .then((result) => {
        if (result && result.data) {
          setDashboard((prev) => ({
            ...prev,
            ...result.data,
            personalDetails: { ...prev.personalDetails, ...(result.data.personalDetails || {}) },
            academicOverview: { ...prev.academicOverview, ...(result.data.academicOverview || {}) },
          }));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("userProfileUpdated", resolveUserData);
  }, []);

  const studentName = dashboard.personalDetails.name || getStoredUserName();
  const upcoming = dashboard.upcomingDeadlines || [];
  const leaderboardList =
    dashboard.leaderboard && dashboard.leaderboard.length > 0
      ? dashboard.leaderboard
      : [
          {
            rank: 1,
            name: `${studentName} (You)`,
            score: "1,875 XP",
            initials: getInitials(studentName),
            badge: "Your Position",
            you: true,
          },
        ];

  const studentStats = [
    {
      label: "Attendance Rate",
      value: `${Math.round(dashboard.attendanceSummary.percentage)}%`,
      hint: "Active semester attendance",
      icon: CalendarCheck,
    },
    { label: "Active Batches", value: "Enrolled", word: true, hint: "Assigned training batch", icon: Users },
    { label: "Coding Rank", value: `#${dashboard.codingProgress.currentRank}`, hint: "Current cohort rank", icon: TrendingUp },
    { label: "Earned Points", value: "1,875 XP", hint: "Coding & quiz points", icon: Flame },
  ];

  return (
    <>
      {/* First-time profile flag */}
      {!profileCompleted && (
        <div className="pp-flag">
          <div className="pp-flag-left">
            <span className="pp-flag-icon">
              <UserCheck size={16} />
            </span>
            <div>
              <div className="pp-flag-title">Action Required: Complete Your Academic Profile</div>
              <div className="pp-flag-desc">Add your Semester, Aggregate CGPA, and Skills so our AI can tailor training for you.</div>
            </div>
          </div>
          <Link to="/student/profile" className="pp-btn pp-btn--flag">
            Update Profile <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Welcome banner */}
      <section className="pp-banner">
        <div className="pp-banner-left">
          <span className="pp-banner-avatar">{getInitials(studentName)}</span>
          <div>
            <div className="pp-banner-eyebrow">
              <i /> Student Workspace
            </div>
            <h1 className="pp-banner-title">Welcome back, {studentName}!</h1>
            <div className="pp-banner-meta">
              <span>{dashboard.personalDetails.department || "Department"}</span>
              <span className="sep" />
              <span>{dashboard.academicOverview.semester || "Semester"}</span>
              {dashboard.academicOverview.cgpa ? (
                <>
                  <span className="sep" />
                  <span>CGPA: {dashboard.academicOverview.cgpa}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="pp-banner-actions">
          <Link to="/student/dashboard-professional-preview/batches" className="pp-btn pp-btn--solid">
            View Batches <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* KPI cards */}
      <div className="pp-kpi-grid">
        {studentStats.map((s) => (
          <div key={s.label} className="pp-card pp-kpi">
            <div className="pp-kpi-top">
              <span className="pp-kpi-icon">
                <s.icon size={17} />
              </span>
              <span className="pp-kpi-label">{s.label}</span>
              <span className="pp-kpi-info">
                <Info size={14} />
              </span>
            </div>
            <div className={s.word ? "pp-kpi-value--word" : "pp-kpi-value"}>{s.value}</div>
            <div className="pp-kpi-hint">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Split: Recent tasks + Leaderboard */}
      <div className="pp-split">
        <section className="pp-card pp-panel">
          <div className="pp-panel-header">
            <div className="pp-panel-title">
              <span className="pp-panel-icon">
                <Clock size={17} />
              </span>
              <div>
                <h2 className="pp-heading">Recent Tasks &amp; Deadlines</h2>
                <div className="pp-subheading">Your upcoming practice sessions and quizzes</div>
              </div>
            </div>
            <span className="pp-chip">
              <CalendarDays size={13} /> Current Week
            </span>
          </div>
          <div className="pp-panel-body">
            {upcoming.length === 0 ? (
              <div className="pp-empty">
                <span className="pp-empty-icon">
                  <BookOpen size={16} />
                </span>
                <div className="pp-empty-text">No pending deadlines this week</div>
                <div className="pp-empty-sub">New tasks will appear here when assigned.</div>
              </div>
            ) : (
              upcoming.map((task, i) => (
                <div key={i} className="pp-task-row">
                  <div className="pp-task-main">
                    <span className="pp-task-date">
                      <Clock size={15} />
                    </span>
                    <div>
                      <div className="pp-task-name">{task.title}</div>
                      <div className="pp-task-due">Due {task.dueDate}</div>
                    </div>
                  </div>
                  {task.status === "Pending" ? (
                    <span className="pp-status pp-status--pending">
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                      Pending
                    </span>
                  ) : (
                    <span className="pp-status pp-status--done">Completed</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="pp-card pp-panel">
          <div className="pp-panel-header">
            <div className="pp-panel-title">
              <span className="pp-panel-icon">
                <Trophy size={17} />
              </span>
              <div>
                <h2 className="pp-heading">Batch Leaderboard</h2>
                <div className="pp-subheading">Top performers in your department</div>
              </div>
            </div>
            <Link to="/student/dashboard-professional-preview/batches" className="pp-rank-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="pp-panel-body">
            {leaderboardList.length === 0 ? (
              <div className="pp-empty">
                <span className="pp-empty-icon">
                  <Trophy size={16} />
                </span>
                <div className="pp-empty-text">Leaderboard is not available yet</div>
              </div>
            ) : (
              leaderboardList.slice(0, 5).map((item) => (
                <div key={item.rank} className={`pp-rank-row ${item.you ? "pp-rank-you-row" : ""}`}>
                  <div className="pp-rank-main">
                    <span className="pp-rank-no">#{item.rank}</span>
                    <span
                      className="pp-avatar pp-avatar--sm pp-avatar--ink"
                      style={item.you ? { background: "var(--pp-brand)", color: "#fff", outline: "none" } : undefined}
                    >
                      {item.initials}
                    </span>
                    <div>
                      <div className={`pp-rank-name ${item.you ? "pp-rank-name--you" : ""}`}>{item.name}</div>
                      {item.badge && <div className="pp-rank-meta">{item.badge}</div>}
                    </div>
                  </div>
                  <span className="pp-rank-score">{item.score}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}