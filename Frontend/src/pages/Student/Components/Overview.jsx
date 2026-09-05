import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, ArrowUpRight, Flame,
  Users, CalendarDays, ChevronRight, Sparkles, Info, BookOpen, UserCheck, ArrowRight,
  Plus, X, KeyRound, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Styles/Overview.css";
import "../Styles/Batches.css";

const API_BASE = "http://localhost:5000/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
  const [profileCompleted, setProfileCompleted] = useState(true);
  const navigate = useNavigate();

  // Modal State for Joining Batch from Hero Card
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

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
            skills: u.skills || "",
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

  // Submit Join Batch from Hero Card Modal
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setModalError("Please enter a valid batch code.");
      return;
    }

    setJoining(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`${API_BASE}/batches/join`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ join_code: joinCodeInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setModalSuccess(data.message || "Successfully joined batch!");
        setJoinCodeInput("");
        setTimeout(() => {
          setShowJoinModal(false);
          setModalSuccess("");
          navigate("/student/batches");
        }, 1200);
      } else {
        setModalError(data.message || "Failed to join batch. Please check code.");
      }
    } catch (err) {
      setModalError("Server connection error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

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
          <Button
            className="overview-btn-primary"
            onClick={() => {
              setModalError("");
              setModalSuccess("");
              setShowJoinModal(true);
            }}
          >
            <Plus size={16} className="overview-btn-icon" /> Join Batch
          </Button>
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
                     <h5 className="text-sm font-semibold dark:text-slate-200\">{item.name}</h5>
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

      {/* ─── Join Batch Flash Overlay Modal ───────────────────────── */}
      {showJoinModal && (
        <div className="join-modal-overlay">
          <div className="join-modal-card">
            <button
              type="button"
              className="join-modal-close"
              onClick={() => setShowJoinModal(false)}
            >
              <X size={16} />
            </button>

            <div className="join-modal-icon-wrap">
              <KeyRound size={26} />
            </div>

            <div>
              <h3 className="join-modal-title">Join a Training Batch</h3>
              <p className="join-modal-subtitle">
                Enter the secret join code given to you by your admin or batch mentor.
              </p>
            </div>

            {modalError && <div className="join-modal-error">{modalError}</div>}
            {modalSuccess && <div className="join-modal-success">{modalSuccess}</div>}

            <form onSubmit={handleJoinSubmit} className="join-modal-input-group">
              <label className="join-modal-label">Enter Batch Code</label>
              <input
                type="text"
                className="join-modal-input"
                placeholder="e.g. PY-BE-2026"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                autoFocus
              />

              <div className="join-modal-actions" style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="join-modal-cancel-btn"
                  onClick={() => setShowJoinModal(false)}
                  disabled={joining}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="join-modal-submit-btn"
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Joining...
                    </>
                  ) : (
                    "Join Batch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

