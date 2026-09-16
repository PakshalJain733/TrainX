import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, ArrowUpRight, Flame,
  Users, CalendarDays, ChevronRight, Sparkles, Info, BookOpen, UserCheck, ArrowRight,
  Plus, X, KeyRound, Loader2, UserCog, GraduationCap, Award, BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import { EVENTS } from "../../../utils/sharedStore";
import "../Styles/ST_Overview.css";

const API_BASE = "/api/v1";

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
    if (!u) return "Student";
    return u.name || u.fullName || u.full_name || u.email?.split("@")[0] || "Student";
  } catch { return "Student"; }
};

const defaultDashboardData = {
  personalDetails: {
    name: "Student",
    department: "",
  },
  academicOverview: {
    rollNumber: "",
    semester: "",
    cgpa: "",
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
  const [myBatchesCount, setMyBatchesCount] = useState(0);
  const [showFirstLoginAlert, setShowFirstLoginAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("showFirstLoginAlert") === "true") {
      setShowFirstLoginAlert(true);
    }
  }, []);

  const handleDismissFirstLoginAlert = () => {
    sessionStorage.removeItem("showFirstLoginAlert");
    setShowFirstLoginAlert(false);
  };

  const handleGoToProfileUpdate = () => {
    sessionStorage.removeItem("showFirstLoginAlert");
    setShowFirstLoginAlert(false);
    navigate("/student/profile");
  };

  const dismissNotice = () => {
    setNoticeDismissed(true);
  };

  // Modal State for Joining Batch from Hero Card
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const loadUserData = () => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          const u = res.data;
          const student = u.studentProfile || {};

          let resolvedName = u.name || u.fullName || u.full_name || u.email?.split("@")[0] || getStoredUserName();

          const dept = student.department || u.department || "";
          const sem = student.semester || u.semester || "";
          const cgpa = student.cgpa || u.cgpa || u.aggregate_cgpa || "";
          const isCompleted = u.profileCompleted !== undefined ? u.profileCompleted : Boolean(cgpa && (student.skills || u.skills));

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
              rollNumber: student.roll_number || u.roll_number || "",
              semester: sem,
              cgpa: cgpa,
              skills: student.skills || u.skills || "",
              profileCompleted: isCompleted,
            },
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("userProfileUpdated", loadUserData);

    const loadDashboardData = () => {
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
                rollNumber: prev.academicOverview.rollNumber || result.data.academicOverview?.rollNumber || "",
              },
            }));
          }
        })
        .catch(() => {});
    };

    loadDashboardData();

    apiFetch("/batches/my-batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setMyBatchesCount(res.data.length);
        }
      })
      .catch(() => {});

    window.addEventListener(EVENTS.QUIZ_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.CODING_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.DRIVE_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.BROADCAST_UPDATED, loadDashboardData);

    return () => {
      window.removeEventListener("userProfileUpdated", loadUserData);
      window.removeEventListener(EVENTS.QUIZ_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.CODING_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.DRIVE_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.BROADCAST_UPDATED, loadDashboardData);
    };
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

  const studentName = dashboard.personalDetails.name || getStoredUserName() || "Student";
  const dept = dashboard.personalDetails.department || "";
  const sem = dashboard.academicOverview.semester || "";
  const rollNum = dashboard.academicOverview.rollNumber || "";
  const cgpa = dashboard.academicOverview.cgpa || "";
  const upcoming = dashboard.upcomingDeadlines || [];
  const leaderboardList = dashboard.leaderboard || [];

  const studentStats = [
    { label: "Attendance Rate", value: `${Math.round(dashboard.attendanceSummary.percentage)}%`, hint: "Active semester attendance", icon: CalendarCheck },
    { label: "Active Batches", value: `${myBatchesCount} Active`, hint: "Assigned training batches", icon: Users },
    { label: "Coding Rank", value: `#${dashboard.codingProgress.currentRank}`, hint: "Current cohort rank", icon: TrendingUp },
    { label: "Earned Points", value: "0 XP", hint: "Coding & quiz points", icon: Flame },
  ];

  return (
    <div className="student-page-inner stack-6 overview-wrapper">

      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card-student">
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
              {dept || "Computer Engineering"} &nbsp;|&nbsp; {sem ? (sem.toLowerCase().includes("sem") ? sem : `Semester ${sem}`) : "Semester 6"} &nbsp;|&nbsp; CGPA: {cgpa || "8.5"} &nbsp;|&nbsp; Roll: {rollNum || "2026COMP042"}
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
          <CardContent style={{ padding: '20px 24px' }}>
            {leaderboardList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                No active leaderboard scores recorded yet. Rankings will update automatically as cohort students complete coding tasks and quizzes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {leaderboardList.slice(0, 5).map((item) => (
                  <div
                    key={item.rank}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: item.you ? '#eef2ff' : '#ffffff',
                      border: item.you ? '1.5px solid #a5b4fc' : '1px solid #f1f5f9',
                      boxShadow: item.you ? '0 4px 14px rgba(79, 70, 229, 0.1)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: item.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : item.rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : item.rank === 3 ? 'linear-gradient(135deg, #f97316, #c2410c)' : '#f1f5f9',
                          color: item.rank <= 3 ? '#ffffff' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        #{item.rank}
                      </span>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: item.you ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : '#f1f5f9',
                          color: item.you ? '#ffffff' : '#1e293b',
                          fontWeight: '700',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: item.you ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                        }}
                      >
                        {item.initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: item.you ? '#3730a3' : '#0f172a', lineHeight: 1.2 }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500', marginTop: '3px' }}>
                          {item.badge || 'Batch Performer'}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        color: item.you ? '#3730a3' : '#0f172a',
                        background: item.you ? '#e0e7ff' : '#f8fafc',
                        border: item.you ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                        borderRadius: '18px',
                        padding: '5px 12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Flame size={14} color="#f97316" />
                      <span>{item.score || '0 XP'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Join Batch Flash Overlay Modal ───────────────────────── */}
      {showJoinModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Join a Training Batch</h2>
                  <p className="modal-subtitle">Enter secret join access code assigned to your cohort.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowJoinModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit}>
              <div className="modal-body">
                {modalError && <div className="modal-feedback-alert modal-feedback--error">{modalError}</div>}
                {modalSuccess && <div className="modal-feedback-alert modal-feedback--success">{modalSuccess}</div>}

                <div className="form-group-admin">
                  <label>Enter Batch Join Code *</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="e.g. BTCH-D3BX"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowJoinModal(false)}
                  disabled={joining}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
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
        </div>,
        document.body
      )}

      {/* First Login Profile Update Alert Modal */}
      {showFirstLoginAlert && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-dialog" style={{ maxWidth: "480px", textAlign: "center", padding: "28px 24px" }}>
            <div style={{ width: "56px", height: "56px", background: "#e0e7ff", color: "#4f46e5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
              <UserCog size={28} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
              Welcome, {dashboard.personalDetails.name}! 🎉
            </h2>
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.5", marginBottom: "24px" }}>
              Your account has been registered successfully. Please update your profile details (department, semester, roll number, and skills) to complete your account setup.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleDismissFirstLoginAlert}
                style={{ flex: 1, padding: "10px 16px", borderRadius: "10px" }}
              >
                Remind Me Later
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={handleGoToProfileUpdate}
                style={{ flex: 1, padding: "10px 16px", borderRadius: "10px" }}
              >
                Update Profile Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

