import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, ExternalLink, Key, Clock } from "lucide-react";
import { StudentSidebar } from "./ST_Sidebar";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/ST_Layout.css";

import BroadcastToast from "../../../components/ui/BroadcastToast";
import FullNotificationModal from "../../../components/ui/FullNotificationModal";

function NotificationDropdown({ onClose, onUnreadChange, onOpenViewAll, notifications, setNotifications }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const autoCloseTimerRef = useRef(null);

  const startAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
  };

  const clearAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
  };

  useEffect(() => {
    startAutoCloseTimer();
    return () => clearAutoCloseTimer();
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
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const visibleNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return n.unread;
    return true;
  });

  const getIcon = (n) => {
    const type = (n.type || "").toLowerCase();
    const titleLower = (n.title || "").toLowerCase();

    if (titleLower.includes("placement") || titleLower.includes("drive") || titleLower.includes("goldman") || type === "calendar") {
      return (
        <div className="notif-colorful-icon-box notif-icon-rose">
          <Calendar size={18} />
        </div>
      );
    }
    if (titleLower.includes("quiz") || titleLower.includes("test") || titleLower.includes("ia-") || type === "quiz" || type === "document") {
      return (
        <div className="notif-colorful-icon-box notif-icon-blue">
          <FileText size={18} />
        </div>
      );
    }
    if (type === "success" || titleLower.includes("success") || titleLower.includes("completed")) {
      return (
        <div className="notif-colorful-icon-box notif-icon-emerald">
          <CheckCircle2 size={18} />
        </div>
      );
    }
    return (
      <div className="notif-colorful-icon-box notif-icon-amber">
        <AlertTriangle size={18} />
      </div>
    );
  };

  const renderTitle = (n) => {
    const title = n.title || "";
    const titleLower = title.toLowerCase();
    const isBroadcast = titleLower.includes("broadcast") || n.type === "broadcast";

    if (isBroadcast) {
      let cleanTitle = title
        .replace(/📢/g, "")
        .replace(/\[Broadcast\]/gi, "")
        .replace(/\[Notice\]/gi, "")
        .trim();

      return (
        <div className="notif-card-title-text">
          <span className="notif-broadcast-badge">
            📢 [Broadcast]
          </span>{" "}
          <span className="notif-title-main">{cleanTitle}</span>
        </div>
      );
    }
    return <div className="notif-card-title-text">{title}</div>;
  };

  return (
    <div 
      className="notif-dropdown-box"
      onMouseEnter={clearAutoCloseTimer}
      onMouseLeave={startAutoCloseTimer}
    >
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-header-icon-wrap">
            <Bell size={20} className="notif-header-bell" />
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
            className="notif-mark-read-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            style={{ opacity: unreadCount === 0 ? 0.5 : 1, cursor: unreadCount === 0 ? "default" : "pointer" }}
          >
            <Check size={14} className="notif-check-icon" /> Mark read
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="notif-tabs-pills">
        <button
          className={`notif-tab-pill ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({totalCount})
        </button>
        <button
          className={`notif-tab-pill ${activeTab === "unread" ? "active" : ""}`}
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
          visibleNotifications.slice(0, 5).map((n) => {
            const isExpanded = expandedId === n.id;
            return (
              <div
                key={n.id}
                className={`notif-list-card ${n.unread ? "unread" : ""}`}
                onClick={() => {
                  if (n.unread) toggleSingleRead(n.id);
                  setExpandedId(isExpanded ? null : n.id);
                }}
              >
                {getIcon(n)}

                <div className="notif-card-main-content">
                  <div className="notif-card-title-row">
                    {renderTitle(n)}
                  </div>

                  <div className="notif-card-time-row">
                    <Clock size={11} className="notif-time-icon" />
                    <span>{n.time}</span>
                  </div>

                  {isExpanded && (
                    <div className="notif-expanded-desc">
                      {(n.target || n.created_by_name || n.priority) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px', fontSize: '11px', fontWeight: '700' }}>
                          {n.target && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px' }}>🎯 For: {n.target}</span>}
                          {n.created_by_name && <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '6px' }}>👤 By: {n.created_by_name}</span>}
                          {n.priority && <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px' }}>⚡ {n.priority}</span>}
                        </div>
                      )}
                      <div>
                        {n.message || (n.desc ? n.desc.replace('...', ' regarding upcoming schedule.') : "No details available.")}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="notif-delete-top-right"
                  onClick={(e) => { e.stopPropagation(); handleDeleteItem(e, n.id); }}
                  title="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer-wrap">
        <button
          className="notif-view-all-btn"
          onClick={() => {
            if (onClose) onClose();
            if (onOpenViewAll) onOpenViewAll();
          }}
        >
          View all
        </button>
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

const defaultNotificationsList = [
  {
    id: 1,
    title: "Meeting Regarding Quasar 5.0 Problem Statements",
    desc: "A mandatory meeting for all Quasar 5.0 participants is scheduled for today at 3:00 PM in Seminar Hall 2.",
    time: "9/26/2026, 1:37:42 PM",
    unread: true,
    type: "broadcast",
    target: "All CSE & IT Batches",
    priority: "Urgent Notice",
    created_by_name: "Coordinator Shinde"
  },
  {
    id: 2,
    title: "Holiday Announcement",
    desc: "The campus will remain closed on Friday for the upcoming holiday. Online learning resources remain available.",
    time: "9/26/2026, 1:30:00 PM",
    unread: true,
    type: "broadcast",
    target: "All Students & Faculty",
    priority: "General Announcement",
    created_by_name: "Admin Office"
  },
  {
    id: 3,
    title: "IA-2 Quiz Rescheduled to Friday 10:00 AM",
    desc: "The Internal Assessment 2 quiz has been rescheduled to Friday 10:00 AM. Please review your module roadmaps.",
    time: "9/25/2026, 8:56:20 PM",
    unread: true,
    type: "quiz",
    target: "TE Computer Batches",
    priority: "Academic Notice",
    created_by_name: "Prof. Verma"
  },
  {
    id: 4,
    title: "Goldman Sachs Placement Drive Registration Live",
    desc: "Eligible students with CGPA > 8.0 can apply for Goldman Sachs campus drive through placement tab.",
    time: "9/25/2026, 6:15:00 PM",
    unread: false,
    type: "calendar",
    target: "BE All Branches",
    priority: "Placement Alert",
    created_by_name: "Placement Cell"
  }
];

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
    const u = rawUser || {};
    let name = u.name || u.fullName || u.full_name || u.email?.split("@")[0] || "Student";
    let email = u.email || "";
    return { ...u, name, email };
  };

  const [user, setUser] = useState(() => resolveUser(null));
  const [avatarUrl, setAvatarUrl] = useState(() => user?.avatar_url || user?.avatar || null);
  const [headerNoticeDismissed, setHeaderNoticeDismissed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [fullNotifOpen, setFullNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState(defaultNotificationsList);

  useEffect(() => {
    apiFetch("/student/notifications")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const serverItems = res.data.map((b) => ({
            id: b.id || `notif-${Math.random()}`,
            title: b.title || "Announcement",
            desc: b.message || b.desc || b.description || "",
            message: b.message || b.desc || "",
            time: b.time || (b.created_at ? new Date(b.created_at).toLocaleString() : "Today"),
            unread: b.unread !== undefined ? Boolean(b.unread) : true,
            type: b.type || (b.title?.toLowerCase().includes("broadcast") ? "broadcast" : "alert"),
            target: b.target || "All Batches",
            priority: b.priority || "General Notice",
            created_by_name: b.created_by_name || "Admin",
          }));

          setNotifications((prev) => {
            const combined = [...serverItems, ...defaultNotificationsList];
            const unique = [];
            const seenTitles = new Set();
            for (const item of combined) {
              const key = item.title.trim().toLowerCase();
              if (!seenTitles.has(key)) {
                seenTitles.add(key);
                unique.push(item);
              }
            }
            return unique;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const latestUnread = notifications.find((n) => n.unread);
    if (latestUnread) {
      window.dispatchEvent(
        new CustomEvent("new_broadcast_notification", { detail: latestUnread })
      );
    }
  }, []);

  const [showFirstLoginFlash, setShowFirstLoginFlash] = useState(false);

  // Load user profile from backend on mount (device-synced)
  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const fetchedUser = resolveUser(res.data);
          setUser(fetchedUser);

          const userKey = fetchedUser.id || fetchedUser.email;
          const isUpdated = Boolean(
            res.data.is_profile_updated ||
            res.data.studentProfile?.is_profile_updated ||
            (userKey && sessionStorage.getItem(`profile_updated_${userKey}`) === "true") ||
            (res.data.gender && res.data.city) ||
            ((res.data.department || res.data.studentProfile?.department) && (res.data.skills || res.data.studentProfile?.skills))
          );

          if (!isUpdated) {
            const sessionSkipped = sessionStorage.getItem(`st_flash_skipped_${fetchedUser.id || fetchedUser.email}`);
            if (!sessionSkipped) {
              setShowFirstLoginFlash(true);
            }
          } else {
            setShowFirstLoginFlash(false);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Re-fetch user profile from backend whenever profile is updated
    const handleUpdate = () => {
      apiFetch("/student/profile")
        .then((res) => {
          if (res && res.data) {
            const fetchedUser = resolveUser(res.data);
            setUser(fetchedUser);
            if (fetchedUser.avatar_url || fetchedUser.avatar) {
              setAvatarUrl(fetchedUser.avatar_url || fetchedUser.avatar);
            }
            const userKey = fetchedUser.id || fetchedUser.email;
            const isUpdated = Boolean(
              res.data.is_profile_updated ||
              res.data.studentProfile?.is_profile_updated ||
              (userKey && sessionStorage.getItem(`profile_updated_${userKey}`) === "true") ||
              (res.data.gender && res.data.city) ||
              ((res.data.department || res.data.studentProfile?.department) && (res.data.skills || res.data.studentProfile?.skills))
            );
            if (isUpdated) {
              setShowFirstLoginFlash(false);
            }
          }
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
                      onOpenViewAll={() => setFullNotifOpen(true)}
                      notifications={notifications}
                      setNotifications={setNotifications}
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
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        user.name ? user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GS"
                      )}
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
      <FullNotificationModal
        isOpen={fullNotifOpen}
        onClose={() => setFullNotifOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />
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
                  const userKey = `st_flash_skipped_${user.id || user.email}`;
                  sessionStorage.setItem(userKey, "true");
                  setShowFirstLoginFlash(false);
                }}
              >
                Skip for now
              </button>
              <button
                className="st-firstlogin-btn-primary"
                onClick={() => {
                  setShowFirstLoginFlash(false);
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