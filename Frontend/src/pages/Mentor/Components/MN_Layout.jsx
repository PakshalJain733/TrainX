import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key } from "lucide-react";
import { MentorSidebar } from "./MN_Sidebar";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/MN_Layout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "calendar",
      title: "Upcoming Mentorship Session",
      desc: "Live Session scheduled for Batch CSE-A at 4:00 PM today.",
      time: "10 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "alert",
      title: "Low Attendance Alert",
      desc: "3 students in Data Structures batch have fallen below 75% attendance.",
      time: "30 min ago",
      unread: true,
    },
    {
      id: 3,
      type: "success",
      title: "Quiz Submissions Reviewed",
      desc: "Python Quiz 2 responses have been automatically graded.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 4,
      type: "document",
      title: "Study Resource Published",
      desc: "New roadmap guidelines published for Full-Stack Track.",
      time: "Yesterday",
      unread: false,
    }
  ]);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    apiFetch("/mentor/notifications")
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
    <div className="mentor-header__profile-dropdown notif-dropdown-box">
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
              navigate("/mentor/notifications");
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

export default function MentorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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
    let mentorProf = {};
    try { localUser = JSON.parse(localStorage.getItem("user")) || {}; } catch {}
    try { mentorProf = JSON.parse(localStorage.getItem("mentorProfile")) || {}; } catch {}
    const u = rawUser || {};
    let name = mentorProf.name || localUser.name || localUser.fullName || localUser.full_name || u.name || u.fullName || u.full_name || u.email?.split("@")[0] || localUser.email?.split("@")[0] || "Faculty Mentor";
    let email = mentorProf.email || localUser.email || u.email || "mentor@pvppcoe.ac.in";
    return { ...localUser, ...u, name, email };
  };

  const [user, setUser] = useState(() => resolveUser(null));

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setUser(resolveUser(res.data));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setUser(resolveUser(null));
      apiFetch("/auth/me")
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

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getInitials = (name) => {
    if (!name) return "FM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user.name);

  const getPageTitle = (path) => {
    if (path === "/mentor" || path === "/mentor/") return "Overview";
    if (path.startsWith("/mentor/students")) return "Assigned Students";
    if (path.startsWith("/mentor/quizzes") || path.startsWith("/mentor/assessments")) return "Assessments & Quizzes";
    if (path.startsWith("/mentor/roadmaps")) return "Roadmaps Guidance";
    if (path.startsWith("/mentor/ai-interviews")) return "AI Mock Interviews";
    if (path.startsWith("/mentor/skill-gaps")) return "Skill Gap Analysis";
    if (path.startsWith("/mentor/attendance")) return "Attendance Management";
    if (path.startsWith("/mentor/performance")) return "Performance Analytics";
    if (path.startsWith("/mentor/leaderboard")) return "Leaderboard";
    if (path.startsWith("/mentor/mock-drives")) return "Placement Mock Drives";
    if (path.startsWith("/mentor/defaulters")) return "Defaulters Watchlist";
    if (path.startsWith("/mentor/study-material")) return "Study Material & Resources";
    if (path.startsWith("/mentor/weekly-reports")) return "Weekly Progress Reports";
    if (path.startsWith("/mentor/batches")) return "Assigned Batches";
    if (path.startsWith("/mentor/assignments")) return "Assignments";
    if (path.startsWith("/mentor/sessions")) return "Live Mentorship Sessions";
    if (path.startsWith("/mentor/broadcast")) return "Broadcast Notice Center";
    if (path.startsWith("/mentor/notifications")) return "Notifications";
    if (path.startsWith("/mentor/profile")) return "Profile";
    if (path.startsWith("/mentor/help")) return "Help & Support";
    return "Mentor Workspace";
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="mentor-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <MentorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="mentor-content">
        <main className="mentor-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="mentor-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="mentor-header">
              <div className="mentor-header__left">
                <button
                  className="mentor-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="mentor-breadcrumb">
                  <span className="mentor-breadcrumb-active">{getPageTitle(pathname)}</span>
                </div>
              </div>

              <div className="mentor-header__right" ref={headerRightRef}>
                {/* Notification Bell Dropdown Wrap */}
                <div className="mentor-header__notif-wrap">
                  <button
                    className="mentor-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="mentor-header__bell-icon" />
                    {hasUnreadNotif && <span className="mentor-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="mentor-header__user-wrap">
                  <button
                    className="mentor-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="mentor-header__user-info">
                      <span className="mentor-header__name">{user.name}</span>
                    </div>
                    <div className="mentor-header__avatar" aria-label={`User profile ${user.name}`}>
                      {userInitials}
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="mentor-header__profile-dropdown">
                      <div className="mentor-header__profile-top">
                        <div className="mentor-header__profile-avatar">{userInitials}</div>
                        <div className="mentor-header__profile-info">
                          <span className="mentor-header__profile-name">{user.name}</span>
                          <span className="mentor-header__profile-sub">{user.email}</span>
                        </div>
                      </div>
                      <div className="mentor-header__profile-divider" />
                      <button
                        className="mentor-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/mentor/profile");
                        }}
                      >
                        <UserCog size={15} />
                        Edit Profile
                      </button>
                      <button
                        className="mentor-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                      >
                        <Key size={15} />
                        Change Password
                      </button>
                      <button
                        className="mentor-header__profile-item mentor-header__profile-item--danger"
                        onClick={() => {
                          setProfileOpen(false);
                          localStorage.removeItem("user");
                          localStorage.removeItem("token");
                          navigate("/");
                        }}
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content Body */}
            <div className="mentor-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
