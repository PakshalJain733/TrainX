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

const stats = [
  { label: "Attendance Rate", value: "92%", hint: "+3% to last month", icon: CalendarCheck },
  { label: "Active Batches", value: "3 Enrolled", hint: "+1 to last month", icon: Users },
  { label: "Coding Rank", value: "#42 / 240", hint: "Top 18% in Batch", icon: TrendingUp },
  { label: "Earned Points", value: "1,875 XP", hint: "+120 XP this week", icon: Flame },
];

const leaderboard = [
  { rank: 1, name: "Riya Shah", score: "2,480 XP", initials: "RS", badge: "🥇 Rank 1", you: false },
  { rank: 2, name: "Kabir Menon", score: "2,415 XP", initials: "KM", badge: "🥈 Rank 2", you: false },
  { rank: 3, name: "Ananya Rao", score: "2,390 XP", initials: "AR", badge: "🥉 Rank 3", you: false },
  { rank: 4, name: "Siddharth Verma", score: "2,260 XP", initials: "SV", badge: "Top 2%", you: false },
  { rank: 5, name: "Neha Kulkarni", score: "2,190 XP", initials: "NK", badge: "Top 5%", you: false },
  { rank: 6, name: "Rohan Deshmukh", score: "2,120 XP", initials: "RD", badge: "Top 8%", you: false },
  { rank: 7, name: "Priya Sharma", score: "2,050 XP", initials: "PS", badge: "Top 10%", you: false },
  { rank: 8, name: "Vikram Joshi", score: "1,980 XP", initials: "VJ", badge: "Top 12%", you: false },
  { rank: 9, name: "Aditya Mehta", score: "1,940 XP", initials: "AM", badge: "Top 14%", you: false },
  { rank: 10, name: "Tanvi Saxena", score: "1,910 XP", initials: "TS", badge: "Top 15%", you: false },
  { rank: 11, name: "Harsh Kapoor", score: "1,890 XP", initials: "HK", badge: "Top 16%", you: false },
  { rank: 42, name: "Ganesh Shinde (You)", score: "1,875 XP", initials: "GS", badge: "Your Position", you: true },
];




const getInitials = (name) => {
  if (!name) return "GS";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const defaultDashboardData = {
  personalDetails: {
    name: "Ganesh Shinde",
    department: "Electronics & Computer Science",
  },
  academicOverview: {
    semester: 6,
  },
  attendanceSummary: {
    percentage: 92,
  },
  codingProgress: {
    currentRank: "42 / 240",
  },
  upcomingDeadlines: [
    { title: "Task 2: Custom HashMap & Key Collision", due: "Due Tomorrow, 11:59 PM", tag: "Java Batch", variant: "success" },
    { title: "Assessment: SQL 3NF Normalization & Joins", due: "Due Friday, 5:00 PM", tag: "SQL Batch", variant: "outline" },
    { title: "Python Async Scraping Submission", due: "Due Nov 15, 2026", tag: "Python Batch", variant: "outline" },
  ]
};

export default function Overview() {
  const [dashboard, setDashboard] = useState(defaultDashboardData);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && u.name) {
        setDashboard((prev) => ({
          ...prev,
          personalDetails: {
            ...prev.personalDetails,
            name: u.name,
            department: u.department || prev.personalDetails.department,
          },
        }));
      }
    } catch (e) {}

    apiFetch("/student/dashboard")
      .then((result) => {
        if (result && result.data) {
          setDashboard(result.data);
        }
      })
      .catch(() => {});
  }, []);
  const studentName = dashboard.personalDetails.name;
  const upcoming = dashboard.upcomingDeadlines || [];
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
              Welcome back, {dashboard.personalDetails.name}!
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
          <Link to="/student/attendance">
            <Button className="overview-btn-secondary">
              <BookOpen size={14} className="overview-btn-icon" /> Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {stats.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                <Info size={15} className="overview-info-icon" />
              </div>

              <p className="overview-stat-value">
                {s.label === "Attendance Rate"
                  ? `${Math.round(dashboard.attendanceSummary.percentage)}%`
                  : s.label === "Coding Rank"
                    ? `#${dashboard.codingProgress.currentRank}`
                    : s.value}
              </p>

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
                <CardTitle className="overview-card-title">Recent Activities</CardTitle>
                <CardDescription className="overview-card-desc">Track your latest updates</CardDescription>
              </div>
            </div>
            <Link to="/student/practice" className="overview-view-all-pill">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="overview-stack-1">
            {upcoming.map((u) => (
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
            ))}
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
                <CardTitle className="overview-card-title">Top Performers</CardTitle>
                <CardDescription className="overview-card-desc">Top performing students</CardDescription>
              </div>
            </div>
            <Link to="/student/leaderboard" className="overview-view-all-pill">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="overview-leaderboard-content">
            {leaderboard.map((l, idx) => {
              const prevRank = idx > 0 ? leaderboard[idx - 1].rank : null;
              const showGap = prevRank !== null && l.rank - prevRank > 1;
              return (
                <React.Fragment key={l.rank}>
                  {showGap && (
                    <div className="overview-leaderboard-gap">
                      <span>···</span>
                      <span className="overview-leaderboard-gap-label">{l.rank - prevRank - 1} more</span>
                      <span>···</span>
                    </div>
                  )}
                  <div
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
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
