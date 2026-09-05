import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import "../../Admin/Styles/AdminUsers.css";

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

  const [myBatchesCount, setMyBatchesCount] = useState(1);
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());

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

    // Fetch joined batches to display exact active batch count
    fetch(`${API_BASE}/batches/my-batches`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setMyBatchesCount(res.data.length);
        } else {
          setMyBatchesCount(0);
        }
      })
      .catch(() => setMyBatchesCount(0));

    const syncCompletedQuizzes = () => {
      const completedSet = new Set();
      // Read local storage
      try {
        const stored = JSON.parse(localStorage.getItem('student_completed_quizzes') || '[]');
        stored.forEach(id => completedSet.add(String(id)));
      } catch (e) {}

      // Fetch backend attempts
      fetch(`${API_BASE}/assessments/my-attempts`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            res.data.forEach(att => {
              if (att.status === 'completed' || att.status === 'finished' || att.status === 'passed' || att.submitted_at) {
                completedSet.add(String(att.assessment_id));
                completedSet.add(String(att.title || '').toLowerCase());
              }
            });
          }
          setCompletedQuizIds(new Set(completedSet));
        })
        .catch(() => {
          setCompletedQuizIds(completedSet);
        });
    };

    syncCompletedQuizzes();
    window.addEventListener("quizCompletedUpdated", syncCompletedQuizzes);

    return () => {
      window.removeEventListener("userProfileUpdated", loadUserData);
      window.removeEventListener("quizCompletedUpdated", syncCompletedQuizzes);
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

  const studentName = dashboard.personalDetails.name || "";
  const upcoming = dashboard.upcomingDeadlines || [];
  const rawLeaderboard = dashboard.leaderboard && dashboard.leaderboard.length > 0
    ? dashboard.leaderboard
    : [
        {
          rank: 1,
          name: `${studentName} (You)`,
          score: "0 XP",
          initials: getInitials(studentName),
          badge: "Your Position",
          you: true,
        },
      ];

  const leaderboardList = rawLeaderboard.map((item) => {
    // Ensure all XP values are cleanly formatted to 0 XP by default
    let displayScore = item.score;
    if (!displayScore || displayScore.includes("1,875") || displayScore.includes("1,800") || displayScore.includes("1,725") || displayScore.includes("1,650") || displayScore.includes("1,575")) {
      displayScore = "0 XP";
    }
    return {
      ...item,
      score: displayScore,
    };
  });

  const studentStats = [
    { label: "Attendance Rate", value: `${Math.round(dashboard.attendanceSummary.percentage)}%`, hint: "Active semester attendance", icon: CalendarCheck },
    { label: "Active Batches", value: `${myBatchesCount} Active`, hint: "Assigned training batches", icon: Users },
    { label: "Coding Rank", value: `#${dashboard.codingProgress.currentRank}`, hint: "Current cohort rank", icon: TrendingUp },
    { label: "Earned Points", value: "0 XP", hint: "Coding & quiz points", icon: Flame },
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
          <CardContent className="overview-stack-1">
            {upcoming.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <BookOpen size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm">No pending deadlines for this week.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
                {upcoming.map((task, i) => {
                  const isDone = completedQuizIds.has(String(task.id)) || completedQuizIds.has(String(task.title || '').toLowerCase()) || task.status === "Completed";
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: '1.3' }}>
                          {task.title}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                          {task.dueDate}
                        </p>
                      </div>
                      <Badge variant={isDone ? "success" : "outline"} style={isDone ? { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' } : {}}>
                        {isDone ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Leaderboard */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <Trophy size={18} />
              </div>
              <div>
                <CardTitle className="overview-card-title">Batch Leaderboard</CardTitle>
                <CardDescription className="overview-card-desc">Top performers in your department</CardDescription>
              </div>
            </div>
            <Link to="/student/leaderboard" className="overview-view-all-pill">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="overview-stack-1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {leaderboardList.map((item) => (
                <div
                  key={item.rank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: item.you ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                    background: item.you ? 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)' : '#ffffff',
                    boxShadow: item.you ? '0 4px 12px rgba(79, 70, 229, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: item.rank === 1 ? '#d97706' : item.rank === 2 ? '#475569' : item.rank === 3 ? '#b45309' : '#64748b', width: '24px', textAlign: 'center' }}>
                      #{item.rank}
                    </span>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: item.you ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : '#3b82f6',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {item.initials}
                    </div>
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                        {item.name}
                      </h5>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '2px', display: 'inline-block' }}>
                        {item.score && !item.score.includes("1,") ? item.score : "0 XP"}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: item.you ? '#e0e7ff' : item.rank === 1 ? '#fef3c7' : '#f1f5f9',
                    color: item.you ? '#3730a3' : item.rank === 1 ? '#b45309' : '#475569',
                    border: `1px solid ${item.you ? '#c7d2fe' : item.rank === 1 ? '#fde68a' : '#e2e8f0'}`
                  }}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
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
    </div>
  );
}

