import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, ExternalLink, Key } from "lucide-react";
import { StudentSidebar } from "./ST_Sidebar";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/ST_Layout.css";

import BroadcastToast from "../../../components/ui/BroadcastToast";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "calendar",
      title: "Department Meeting Schedule",
      desc: "HOD CSE has requested an urgent faculty meeting at 3:30 PM in Conference Room...",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "alert",
      title: "New Student Grievance",
      desc: "Student Aarav Patel (BTech CSE, Sem 6) submitted a grade re-evaluation request.",
      time: "25 min ago",
      unread: true,
    },
    {
      id: 3,
      type: "success",
      title: "Attendance Report Approved",
      desc: "Monthly attendance report for Semester 6 Data Structures has been generated.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 4,
      type: "document",
      title: "Curriculum Syllabus Update",
      desc: "Revised syllabus for AI & Machine Learning module has been published by...",
      time: "3 hours ago",
      unread: false,
    },
    {
      id: 5,
      type: "calendar",
      title: "Exam Duty Allocation",
      desc: "Your invigilation schedule for upcoming Mid-term exams has been published.",
      time: "Yesterday",
      unread: false,
    }
  ]);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Fetch broadcast notifications from database (device-synced)
    apiFetch("/student/notifications")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((b) => ({
            id: `broadcast-${b.id}`,
            type: "alert",
            title: b.title,
            desc: b.message,
            time: b.created_at ? new Date(b.created_at).toLocaleString() : "Recently",
            unread: true,
          }));
          setNotifications((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const newItems = mapped.filter((s) => !ids.has(s.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch(() => {});

    const handleNewNotif = (e) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev.filter((p) => p.id !== e.detail.id)]);
      }
    };
    window.addEventListener("new_broadcast_notification", handleNewNotif);
    return () => window.removeEventListener("new_broadcast_notification", handleNewNotif);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const totalCount = notifications.length;

  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount > 0);
    }
  }, [unreadCount, onUnreadChange]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const toggleSingleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const visibleNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return n.unread;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "calendar":
        return <Calendar size={16} className="notif-icon-calendar" />;
      case "alert":
        return <AlertTriangle size={16} className="notif-icon-alert" />;
      case "success":
        return <CheckCircle2 size={16} className="notif-icon-success" />;
      case "document":
        return <FileText size={16} className="notif-icon-document" />;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <div className="student-header__profile-dropdown notif-dropdown-box">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-header-icon-wrap">
            <Bell size={18} className="notif-header-icon" />
            {unreadCount > 0 && <span className="notif-header-dot"></span>}
          </div>
          <div className="notif-header-text">
            <div className="notif-header-title">Notifications</div>
            <div className="notif-header-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "No unread alerts"}
            </div>
          </div>
        </div>
        <div className="notif-header-actions-right">
          <button
            className="notif-view-all-btn"
            onClick={() => {
              if (onClose) onClose();
              navigate("/student/notifications");
            }}
          >
            View all
          </button>
          <button
            className="notif-mark-read-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            style={{ opacity: unreadCount === 0 ? 0.5 : 1, cursor: unreadCount === 0 ? "default" : "pointer" }}
          >
            <Check size={14} className="notif-check-icon" /> Mark read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({totalCount})
        </button>
        <button
          className={`notif-tab ${activeTab === "unread" ? "active" : ""}`}
          onClick={() => setActiveTab("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="notif-list-wrap">
        {visibleNotifications.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
            No notifications to display
          </div>
        ) : (
          visibleNotifications.map((n) => (
            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              onClick={() => toggleSingleRead(n.id)}
              style={{ cursor: "pointer" }}
              title="Click to toggle read status"
            >
              <div className={`notif-icon-box type-${n.type}`}>{getIcon(n.type)}</div>
              <div className="notif-content">
                <div className="notif-content-top">
                  <div className="notif-card-title">{n.title}</div>
                  <div className="notif-card-time">{n.time}</div>
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => handleDeleteItem(e, n.id)}
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {n.desc && <div className="notif-card-desc">{n.desc}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer-wrap">
        <button
          className="notif-clear-all-btn"
          onClick={handleClearAll}
          disabled={totalCount === 0}
          style={{ opacity: totalCount === 0 ? 0.5 : 1, cursor: totalCount === 0 ? "default" : "pointer" }}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const headerRightRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRightRef.current && !headerRightRef.current.contains(event.target)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveUser = (rawUser) => {
    let localUser = {};
    let studentProf = {};
    try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
    try { studentProf = JSON.parse(localStorage.getItem("studentProfile")) || {}; } catch {}
    const u = rawUser || {};
    let name = studentProf.name || localUser.name || localUser.fullName || localUser.full_name || u.name || u.fullName || u.full_name || u.email?.split("@")[0] || localUser.email?.split("@")[0] || "Ganesh Shinde";
    let email = studentProf.email || localUser.email || u.email || "ganesh.shinde@student.pvppcoe.ac.in";
    return { ...localUser, ...u, name, email };
  };

  const [user, setUser] = useState(() => resolveUser(null));
  const [headerNoticeDismissed, setHeaderNoticeDismissed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [showFirstLoginFlash, setShowFirstLoginFlash] = useState(false);

  // Load user profile from backend on mount (device-synced)
  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const fetchedUser = resolveUser(res.data);
          setUser(fetchedUser);

          // Check if first time login (or if profile has not been completed)
          const isFirstTime = !localStorage.getItem(`profile_updated_${fetchedUser.email || 'student'}`);
          if (isFirstTime) {
            setShowFirstLoginFlash(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Re-fetch user profile from backend & localStorage whenever profile is updated
    const handleUpdate = () => {
      let localUser = {};
      try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
      setUser(resolveUser(localUser));
      apiFetch("/student/profile")
        .then((res) => {
          if (res && res.data) setUser(resolveUser(res.data));
        })
        .catch(() => {});
    };
    window.addEventListener("userProfileUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleNewNotif = () => {
      setHasUnreadNotif(true);
    };
    window.addEventListener("new_broadcast_notification", handleNewNotif);
    return () => window.removeEventListener("new_broadcast_notification", handleNewNotif);
  }, []);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getShortDept = (dept) => {
    if (!dept) return "ECS";
    const d = dept.toLowerCase();
    if (d.includes("electronics") && d.includes("computer")) return "ECS";
    if (d.includes("computer engineering")) return "CE";
    if (d.includes("information technology")) return "IT";
    if (d.includes("artificial intelligence") || d.includes("data science")) return "AI&DS";
    return dept;
  };

  const getPageTitle = (path) => {
    if (path === "/student" || path === "/student/") return "Overview";
    if (path.startsWith("/student/roadmap")) return "AI Career Roadmap";
    if (path.startsWith("/student/learning")) return "Learning Content";
    if (path.startsWith("/student/ai-interview")) return "AI Mock Interview";
    if (path.startsWith("/student/progress")) return "Progress & Skill Radar";
    if (path.startsWith("/student/leaderboard")) return "Leaderboard";
    if (path.startsWith("/student/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/student/academic")) return "Academic";
    if (path.startsWith("/student/attendance")) return "Attendance";
    if (path.startsWith("/student/assessment")) return "Assessments";
    if (path.startsWith("/student/performance")) return "Performance";
    if (path.startsWith("/student/certificates")) return "Certificates";
    if (path.startsWith("/student/timetable")) return "Timetable";
    if (path.startsWith("/student/compiler")) return "Compiler / Code Editor";
    if (path.startsWith("/student/quiz")) return "Quiz";
    if (path.startsWith("/student/batches")) return "Batches";
    if (path.startsWith("/student/practice")) return "Practice Problems";
    if (path.startsWith("/student/notes")) return "Study Notes & Resources";
    if (path.startsWith("/student/coding-exam")) return "Coding Exam";
    if (path.startsWith("/student/exam-type-select")) return "Select Exam Type";
    if (path.startsWith("/student/mcq-exam")) return "MCQ Test";
    if (path.startsWith("/student/notifications")) return "Notifications";
    if (path.startsWith("/student/profile")) return "Profile";
    if (path.startsWith("/student/settings")) return "Settings";
    if (path.startsWith("/student/help")) return "Help & Support";
    if (path.startsWith("/student/coding-platform")) return "Coding Platform";
    return "Dashboard";
  };

  const pageTitle = getPageTitle(pathname);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="student-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <StudentSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="student-content">
        <main className="student-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="student-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="student-header">
              <div className="student-header__left">
                <button
                  className="student-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="student-breadcrumb">
                  <span className="student-breadcrumb-active">{pageTitle}</span>
                </div>


              </div>

              <div className="student-header__right" ref={headerRightRef}>


                {/* Notification Bell Dropdown Wrap */}
                <div className="student-header__notif-wrap">
                  <button
                    className="student-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="student-header__bell-icon" />
                    {hasUnreadNotif && <span className="student-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="student-header__user-wrap">
                  <button
                    className="student-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="student-header__user-info">
                      <span className="student-header__name">{user.name}</span>
                    </div>
                    <div className="student-header__avatar" aria-label={`User profile ${user.name}`}>
                      {user.name ? user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GS"}
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="student-header__profile-dropdown">
                        <div className="student-header__profile-top">
                          <div className="student-header__profile-avatar">
                            {user.name ? user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GS"}
                          </div>
                          <div className="student-header__profile-info">
                            <span className="student-header__profile-name">{user.name || "Ganesh Shinde"}</span>
                            <span className="student-header__profile-sub">{user.email || "ganesh.shinde@student.pvppcoe.ac.in"}</span>
                          </div>
                        </div>
                        <div className="student-header__profile-divider" />
                        <button
                          className="student-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/student/profile");
                          }}
                        >
                          <UserCog size={15} />
                          Edit Profile
                        </button>
                        <button
                          className="student-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            setIsChangePasswordOpen(true);
                          }}
                        >
                          <Key size={15} />
                          Change Password
                        </button>
                        <button
                          className="student-header__profile-item student-header__profile-item--danger"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/");
                          }}
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content Body */}
            <div className="student-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>
      <BroadcastToast />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {showFirstLoginFlash && (
        <div className="st-firstlogin-overlay">
          <div className="st-firstlogin-card">
            <div className="st-firstlogin-icon-box">
              <UserCog size={32} />
            </div>

            <div>
              <h3 className="st-firstlogin-title">
                Welcome to TrainX! 🎉
              </h3>
              <p className="st-firstlogin-desc">
                Please take a moment to review and update your profile details to personalize your learning dashboard.
              </p>
            </div>

            <div className="st-firstlogin-actions">
              <button
                className="st-firstlogin-btn-secondary"
                onClick={() => {
                  setShowFirstLoginFlash(false);
                  localStorage.setItem(`profile_updated_${user.email || 'student'}`, 'true');
                }}
              >
                Skip for now
              </button>
              <button
                className="st-firstlogin-btn-primary"
                onClick={() => {
                  setShowFirstLoginFlash(false);
                  localStorage.setItem(`profile_updated_${user.email || 'student'}`, 'true');
                  navigate('/student/profile');
                }}
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}