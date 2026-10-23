import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, TrendingUp, Clock, Trophy, ArrowUpRight, Flame, Users, CalendarDays, ChevronRight, Sparkles, Info, BookOpen, UserCheck, ArrowRight, Plus, X, KeyRound, Loader2, UserCog, GraduationCap, Award, BadgeCheck, Activity, Layers, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { apiFetch, getApiBaseUrl, getAuthToken } from "../../../utils/api";
import { EVENTS } from "../../../utils/sharedStore";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import { getShortDept } from "../../../utils/departmentHelper";
import "../Styles/ST_Overview.css";

const API_BASE = getApiBaseUrl();

function getAuthHeaders() {
  const token = getAuthToken() || "";

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const getInitials = (name) => {
  if (!name || typeof name !== "string" || name.trim().length === 0) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getStoredUserName = () => {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    if (!u) return "Student";
    const rawName = (typeof u.name === "string" && u.name) ||
      (typeof u.fullName === "string" && u.fullName) ||
      (typeof u.full_name === "string" && u.full_name);
    let name = rawName;
    if (!name || name.includes("@")) {
      const email = typeof u.email === "string" ? u.email : "";
      const src = email.includes("@") ? email.split("@")[0] : (name && name.includes("@") ? name.split("@")[0] : "");
      if (src) {
        name = src.replace(/[0-9_.-]+/g, " ").trim().split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
    return name || "Student";
  } catch { return "Student"; }
};

const formatStudentName = (name) => {
  if (!name || typeof name !== "string") return "Student";
  let cleanName = name.trim().replace(/@.*$/, "").replace(/\d+$/g, "");
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
  const words = cleanName.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length > 0 ? words.join(" ") : name;
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
  const { isModuleActive } = useSystemMaintenance();
  const [dashboard, setDashboard] = useState(defaultDashboardData);
  const [profileCompleted, setProfileCompleted] = useState(true);
  const [myBatchesCount, setMyBatchesCount] = useState(0);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const navigate = useNavigate();

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
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const u = res.data;
          const student = u.studentProfile || {};

          let resolvedName = (typeof u.name === "string" && u.name) ||
            (typeof u.fullName === "string" && u.fullName) ||
            (typeof u.full_name === "string" && u.full_name) ||
            (typeof u.email === "string" && u.email.includes("@") ? u.email.split("@")[0] : "") ||
            "Student";
          const dept = student.department || u.department || u.dept || "";
          const sem = student.semester || u.semester || u.sem || u.current_semester || "";
          const cgpa = student.cgpa || u.cgpa || u.aggregate_cgpa || "";
          const rollNum = student.roll_number || u.roll_number || u.rollNumber || "";
          const userKey = u.id || u.email;
          const isCompleted = Boolean(
            u.is_profile_updated ||
            student.is_profile_updated ||
            u.profileCompleted ||
            (userKey && sessionStorage.getItem(`profile_updated_${userKey}`) === "true") ||
            ((dept || sem || rollNum) && (student.skills || u.skills))
          );

          setProfileCompleted(isCompleted);
          if (isCompleted && userKey) {
            sessionStorage.setItem(`profile_updated_${userKey}`, "true");
          }

          setDashboard((prev) => ({
            ...prev,
            personalDetails: {
              ...prev.personalDetails,
              name: resolvedName !== "Student" ? resolvedName : prev.personalDetails.name,
              department: dept || prev.personalDetails.department,
            },
            academicOverview: {
              ...prev.academicOverview,
              rollNumber: rollNum || prev.academicOverview.rollNumber,
              semester: sem || prev.academicOverview.semester,
              cgpa: cgpa || prev.academicOverview.cgpa,
              skills: student.skills || u.skills || "",
              profileCompleted: isCompleted,
            },
          }));
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("userProfileUpdated", loadUserData);

    const loadDashboardData = () => {
      apiFetch("/student/dashboard")
        .then((result) => {
          if (result && result.data) {
            setDashboard((prev) => {
              const resPersonal = result.data.personalDetails || {};
              const resAcademic = result.data.academicOverview || {};

              return {
                ...prev,
                ...result.data,
                personalDetails: {
                  ...prev.personalDetails,
                  ...resPersonal,
                  name: (resPersonal.name && resPersonal.name !== "Student") ? resPersonal.name : prev.personalDetails.name,
                  department: resPersonal.department || prev.personalDetails.department,
                },
                academicOverview: {
                  ...prev.academicOverview,
                  ...resAcademic,
                  rollNumber: resAcademic.rollNumber || prev.academicOverview.rollNumber,
                  semester: resAcademic.semester || prev.academicOverview.semester,
                  cgpa: resAcademic.cgpa || prev.academicOverview.cgpa,
                },
              };
            });
          }
        })
        .catch((err) => {
          console.warn('[ST_Overview] Failed to load student overview data:', err?.message || err);
        });
    };

    loadDashboardData();

    apiFetch("/batches/my-batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setMyBatchesCount(res.data.length);
        }
      })
      .catch((err) => {
        console.warn('[ST_Overview] Failed to fetch enrolled batches:', err?.message || err);
      });

    window.addEventListener(EVENTS.QUIZ_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.CODING_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.DRIVE_UPDATED, loadDashboardData);
    window.addEventListener(EVENTS.BROADCAST_UPDATED, loadDashboardData);
    window.addEventListener("codeSubmitted", loadDashboardData);
    window.addEventListener("quizCompletedUpdated", loadDashboardData);
    window.addEventListener("attendanceUpdated", loadDashboardData);
    window.addEventListener("portal_coding_updated", loadDashboardData);
    window.addEventListener("portal_quiz_updated", loadDashboardData);
    window.addEventListener("portal_attendance_updated", loadDashboardData);
    window.addEventListener("focus", loadDashboardData);

    const intervalId = setInterval(loadDashboardData, 15000);

    return () => {
      window.removeEventListener("userProfileUpdated", loadUserData);
      window.removeEventListener(EVENTS.QUIZ_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.CODING_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.DRIVE_UPDATED, loadDashboardData);
      window.removeEventListener(EVENTS.BROADCAST_UPDATED, loadDashboardData);
      window.removeEventListener("codeSubmitted", loadDashboardData);
      window.removeEventListener("quizCompletedUpdated", loadDashboardData);
      window.removeEventListener("attendanceUpdated", loadDashboardData);
      window.removeEventListener("portal_coding_updated", loadDashboardData);
      window.removeEventListener("portal_quiz_updated", loadDashboardData);
      window.removeEventListener("portal_attendance_updated", loadDashboardData);
      window.removeEventListener("focus", loadDashboardData);
      clearInterval(intervalId);
    };
  }, []);

  // Submit Join Batch from Hero Card Modal
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = (joinCodeInput || "").trim().toUpperCase();
    if (!cleanCode) {
      setModalError("Please enter a valid batch code.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setModalError("Authentication session not found. Please log in again to join a batch.");
      return;
    }

    setJoining(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`${API_BASE}/batches/join`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          join_code: cleanCode,
          joinCode: cleanCode,
          code: cleanCode
        }),
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

  const storedUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
    } catch { return {}; }
  })();

  const studentName = dashboard.personalDetails.name || storedUser.name || getStoredUserName() || "Student";
  const dept = dashboard.personalDetails.department || storedUser.department || storedUser.dept || storedUser.studentProfile?.department || "";
  const sem = dashboard.academicOverview.semester || storedUser.semester || storedUser.sem || storedUser.current_semester || storedUser.studentProfile?.semester || "";
  const rollNum = dashboard.academicOverview.rollNumber || storedUser.rollNumber || storedUser.roll_number || storedUser.studentProfile?.roll_number || "";
  const cgpa = dashboard.academicOverview.cgpa || storedUser.cgpa || storedUser.aggregate_cgpa || storedUser.studentProfile?.cgpa || "";
  const upcoming = dashboard.upcomingDeadlines || [];
  const leaderboardList = dashboard.leaderboard || [];

  const studentStats = [
    {
      label: "Attendance Rate",
      value: isModuleActive("attendance") ? `${Math.round(dashboard.attendanceSummary.percentage)}%` : "Offline",
      hint: isModuleActive("attendance") ? "Active semester attendance" : "Module in maintenance",
      icon: Activity
    },
    {
      label: "Active Batches",
      value: isModuleActive("studentBatches") ? `${myBatchesCount} Active` : "Offline",
      hint: isModuleActive("studentBatches") ? "Assigned training batches" : "Module in maintenance",
      icon: Layers
    },
    {
      label: "Coding Rank",
      value: isModuleActive("studentLeaderboard") ? `#${dashboard.codingProgress.currentRank}` : "Offline",
      hint: isModuleActive("studentLeaderboard") ? "Current batch rank" : "Leaderboard in maintenance",
      icon: Trophy
    },
    {
      label: "Earned Points",
      value: isModuleActive("practiceCoding")
        ? (dashboard.earnedPoints || (dashboard.codingProgress?.earnedXp ? `${dashboard.codingProgress.earnedXp} XP` : "0 XP"))
        : "Offline",
      hint: isModuleActive("practiceCoding") ? "Coding & quiz points" : "Practice in maintenance",
      icon: Zap
    },
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
              Welcome back, {studentName && studentName !== "Student" ? studentName : "Student"}!
            </h1>
            <p className="overview-hero-desc">
              {[
                getShortDept(dept),
                sem ? (String(sem).toLowerCase().includes("sem") ? sem : `Semester ${sem}`) : null,
                cgpa ? `CGPA: ${cgpa}` : null,
                rollNum ? `Roll: ${rollNum}` : null
              ].filter(Boolean).join("  |  ")}
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
              <div className="overview-deadlines-empty">
                <BookOpen size={28} className="overview-empty-icon" />
                <p className="overview-empty-text">No pending deadlines for this week.</p>
              </div>
            ) : (
              <div className="overview-tasks-list">
                {upcoming.map((task, i) => (
                  <div key={i} className="overview-task-item">
                    <div>
                      <h4 className="overview-item-title">{task.title}</h4>
                      <p className="overview-item-due">{task.dueDate}</p>
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
                <Trophy size={18} className="overview-header-icon overview-trophy-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">All Batches Leaderboard</CardTitle>
                <CardDescription className="overview-card-desc">Top performers across all training batches</CardDescription>
              </div>
            </div>
            {isModuleActive("studentLeaderboard") && (
              <Link to="/student/leaderboard" className="overview-view-all-link">
                View All <ChevronRight size={14} />
              </Link>
            )}
          </CardHeader>
          <CardContent style={{ padding: '20px 24px' }}>
            {!isModuleActive("studentLeaderboard") ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#b45309', fontSize: '13px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                Leaderboard rankings are currently undergoing maintenance by administrator policy.
              </div>
            ) : leaderboardList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                No active leaderboard scores recorded yet. Rankings will update automatically across all batches as students complete coding tasks and quizzes.
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
                      <div className="overview-student-info">
                        <span style={{ fontSize: '14px', fontWeight: '700', color: item.you ? '#3730a3' : '#0f172a', lineHeight: 1.2 }}>
                          {formatStudentName(item.name)}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500', marginTop: '3px' }}>
                          {item.batch ? `${item.batch} • ${item.badge || 'Overall Performer'}` : (item.badge || 'All Batches Performer')}
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
                  <p className="modal-subtitle">Enter secret join access code assigned to your batch.</p>
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
                  <div className="modal-input-wrapper">
                    <KeyRound size={17} className="modal-input-icon" />
                    <input
                      type="text"
                      className="form-input-admin modal-input-with-icon"
                      placeholder="e.g. PYSH-MTQZ"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      required
                      autoFocus
                    />
                  </div>
                  <span className="modal-helper-text">
                    Codes are case-insensitive and assigned by administrators (e.g. PYSH-MTQZ).
                  </span>
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
                  disabled={joining || !joinCodeInput.trim()}
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
