import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, ArrowUpRight, Flame,
  Users, CalendarDays, ChevronRight, Sparkles, Info, BookOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Styles/Overview.css";

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getStoredUserName = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) return "Pakshal";
    const name = u.name || "";
    const isAutoName = !name || /^\d+$/.test(name.trim()) || name.startsWith("User_") || /^vu\d/i.test(name.trim());
    if (isAutoName) {
      return u.fullName || u.full_name || "Pakshal";
    }
    return name;
  } catch { return "Pakshal"; }
};

const defaultDashboardData = {
  personalDetails: {
    name: getStoredUserName(),
    department: "",
  },
  academicOverview: {
    semester: "",
  },
  attendanceSummary: {
    percentage: 0,
  },
  codingProgress: {
    currentRank: "N/A",
  },
  upcomingDeadlines: [],
  leaderboard: [],
};

export default function Overview() {
  const [dashboard, setDashboard] = useState(defaultDashboardData);

  const loadUserData = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        const student = u.studentProfile || {};

        let resolvedName = u.name || "";
        const isAutoName = !resolvedName || /^\d+$/.test(resolvedName.trim()) || resolvedName.startsWith("User_") || /^vu\d/i.test(resolvedName.trim());
        if (isAutoName) {
          resolvedName = u.fullName || u.full_name || "Pakshal";
        }

        const dept = u.department || student.department || (u.personalDetails && u.personalDetails.department) || "Electronics & Computer Science";
        const sem = u.semester || student.semester || (u.academicOverview && u.academicOverview.semester) || 6;

        setDashboard((prev) => ({
          ...prev,
          personalDetails: {
            ...prev.personalDetails,
            name: resolvedName,
            department: dept,
          },
          academicOverview: {
            ...prev.academicOverview,
            semester: sem,
          },
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("userProfileUpdated", loadUserData);

    apiFetch("/student/dashboard")
      .then((result) => {
        if (result && result.data) {
          setDashboard((prev) => ({
            ...prev,
            ...result.data,
            personalDetails: {
              ...prev.personalDetails,
              ...(result.data.personalDetails || {}),
            },
            academicOverview: {
              ...prev.academicOverview,
              ...(result.data.academicOverview || {}),
            },
          }));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("userProfileUpdated", loadUserData);
  }, []);

  const studentName = dashboard.personalDetails.name || "Ganesh Shinde";
  const upcoming = dashboard.upcomingDeadlines || [];
  const leaderboardList = dashboard.leaderboard && dashboard.leaderboard.length > 0
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
    { label: "Attendance Rate", value: `${Math.round(dashboard.attendanceSummary.percentage)}%`, hint: "Active semester attendance", icon: CalendarCheck },
    { label: "Active Batches", value: "Enrolled", hint: "Assigned training batch", icon: Users },
    { label: "Coding Rank", value: `#${dashboard.codingProgress.currentRank}`, hint: "Current cohort rank", icon: TrendingUp },
    { label: "Earned Points", value: "1,875 XP", hint: "Coding & quiz points", icon: Flame },
  ];

  const getRankClass = (rank) => {
    if (rank === 1) return "overview-rank-1";
    if (rank === 2) return "overview-rank-2";
    if (rank === 3) return "overview-rank-3";
    return "";
  };
  const getBadgeVariant = (variant) => {
    if (variant === "success") return "success";
    if (variant === "outline") return "outline";
    return "";
  };

  return (
    <div className="student-page-inner stack-6 overview-wrapper">

      {/* Radiant Welcome Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(studentName)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> STUDENT WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {studentName}!
            </h1>
            <p className="overview-hero-desc">
              {dashboard.personalDetails.department} | Semester {dashboard.academicOverview.semester}
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/student/batches">
            <Button className="overview-btn-primary">
              <Sparkles size={14} className="overview-btn-icon" /> Batches
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {studentStats.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                <Info size={15} className="overview-info-icon" />
              </div>

              <p className="overview-stat-value">{s.value}</p>

              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2-Column Main Arena */}
      <div className="overview-split-grid">

        {/* Left: Recent Activities */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Clock size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Recent Tasks & Deadlines</CardTitle>
                <CardDescription className="overview-card-desc">Your latest course deliverables</CardDescription>
              </div>
            </div>
            <Link to="/student/practice" className="overview-view-all-pill">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="overview-stack-1">
            {upcoming.length > 0 ? (
              upcoming.map((u) => (
                <div key={u.title} className="overview-row-between overview-item-row">
                  <div className="overview-row overview-item-left">
                    <div className="overview-clock-wrap">
                      <Clock size={16} className="overview-clock-icon" />
                    </div>
                    <div>
                      <p className="overview-item-title">{u.title}</p>
                      <p className="overview-item-due">{u.due}</p>
                    </div>
                  </div>
                  <Badge variant={u.variant} className="overview-badge-shrink">{u.tag}</Badge>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                <Clock size={28} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No pending deadlines</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12.5 }}>All current training tasks are up to date.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Top Performers */}
        <Card className="overview-subcard overview-leaderboard-card">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <Trophy size={18} className="overview-header-icon overview-trophy-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Batch Leaderboard</CardTitle>
                <CardDescription className="overview-card-desc">Rankings of active students</CardDescription>
              </div>
            </div>
            <Link to="/student/leaderboard" className="overview-view-all-pill">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="overview-leaderboard-content">
            {leaderboardList.map((l, idx) => (
              <div
                key={l.rank || idx}
                className={`overview-row-between overview-leaderboard-item ${l.you ? "overview-leaderboard-item--you" : ""}`}
              >
                <div className="overview-row" style={{ gap: 12 }}>
                  <span className={`overview-leaderboard-rank ${getRankClass(l.rank)}`}>
                    #{l.rank}
                  </span>
                  <Avatar size="34">
                    <AvatarFallback className={l.you ? "overview-avatar-you" : ""}>
                      {l.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className={`overview-leaderboard-name ${l.you ? "overview-leaderboard-name--you" : ""}`}>
                      {l.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{l.badge}</span>
                  </div>
                </div>
                <div className={`overview-xp-pill ${l.you ? "overview-xp-pill--you" : ""}`}>
                  <Flame size={12} className="overview-flame-icon" />
                  <span>{l.score}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
