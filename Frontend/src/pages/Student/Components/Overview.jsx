import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, ArrowUpRight, Flame,
  Users, CalendarDays, ChevronRight, Sparkles, Info, BookOpen, UserCheck, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Styles/Overview.css";

const getInitials = (name) => {
  if (!name || name === "name") return "GS";
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
    semester: "Semester 6",
    cgpa: "8.75",
    skills: "Python, React, SQL",
    profileCompleted: true,
  },
  attendanceSummary: {
    percentage: 95,
  },
  codingProgress: {
    currentRank: "1 / 1",
  },
  upcomingDeadlines: [],
  leaderboard: [],
};

export default function Overview() {
  const [dashboard, setDashboard] = useState(defaultDashboardData);
  const [profileCompleted, setProfileCompleted] = useState(true);
  const navigate = useNavigate();

  const loadUserData = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        const student = u.studentProfile || {};

        let resolvedName = u.name;
        if (!resolvedName || resolvedName.trim().toLowerCase() === "name" || resolvedName.startsWith("User_") || /^vu\d/i.test(resolvedName)) {
          resolvedName = u.fullName || u.full_name || (u.name && !resolvedName.startsWith("User_") && !/^vu\d/i.test(resolvedName) ? u.name : "Ganesh Shinde");
        }

        const dept = u.department || student.department || "Electronics & Computer Science";
        const sem = u.semester || student.semester || "Semester 6";
        const cgpa = u.cgpa || u.aggregate_cgpa || "8.75";
        const isCompleted = u.profileCompleted !== undefined ? u.profileCompleted : Boolean(u.cgpa && u.skills);

        setProfileCompleted(isCompleted);

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
            cgpa: cgpa,
            skills: u.skills || "Python, React, Data Structures",
            profileCompleted: isCompleted,
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

  return (
    <div className="student-page-inner stack-6 overview-wrapper">

      {/* First-Time Login High-Contrast Banner */}
      {!profileCompleted && (
        <div className="profile-update-banner">
          <div className="profile-update-banner-left">
            <div className="profile-update-icon-box">
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="profile-update-title">
                Action Required: Complete Your Academic Profile
                <span className="profile-update-badge">First-Time Setup</span>
              </h3>
              <p className="profile-update-desc">
                Please update your <strong>Semester</strong>, <strong>Aggregate CGPA</strong>, and <strong>Skills</strong> so our AI can tailor training programs & roadmaps for you.
              </p>
            </div>
          </div>
          <Link to="/student/profile">
            <button className="profile-update-btn">
              Update Profile Now <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      )}

      {/* Radiant Welcome Hero Banner */}
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
              {dashboard.personalDetails.department} | {dashboard.academicOverview.semester} | {dashboard.academicOverview.cgpa ? `CGPA: ${dashboard.academicOverview.cgpa}` : ''}
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/student/profile">
            <Button variant="outline" className="gap-2 text-sm bg-white/10 text-white border-white/20 hover:bg-white/20">
              <UserCheck size={14} /> My Profile
            </Button>
          </Link>
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
        {/* Left: Recent Tasks */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Clock size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Recent Tasks & Deadlines</CardTitle>
                <CardDescription className="overview-card-desc">Your upcoming practice sessions and quizzes</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Current Week</Badge>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <BookOpen size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm">No pending deadlines for this week.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-semibold">{task.title}</h4>
                      <p className="text-xs text-slate-500">{task.dueDate}</p>
                    </div>
                    <Badge variant={task.status === "Pending" ? "outline" : "success"}>{task.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Leaderboard */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Trophy size={18} className="overview-header-icon text-amber-500" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Batch Leaderboard</CardTitle>
                <CardDescription className="overview-card-desc">Top performers in your department</CardDescription>
              </div>
            </div>
            <Link to="/student/leaderboard" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {leaderboardList.slice(0, 5).map((item) => (
                <div key={item.rank} className={`flex items-center justify-between p-2.5 rounded-xl border ${item.you ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-500 w-5 text-center">#{item.rank}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-bold">{item.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.name}</h5>
                      <span className="text-xs text-slate-500">{item.score}</span>
                    </div>
                  </div>
                  <Badge variant={item.you ? "default" : "outline"} className="text-xs">{item.badge}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
