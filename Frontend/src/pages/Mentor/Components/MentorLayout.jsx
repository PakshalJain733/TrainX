import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, ShieldCheck, Users, GraduationCap } from "lucide-react";
import { MentorSidebar } from "./MentorSidebar";
import apiFetch from "../../../utils/api";
import "../Styles/MentorLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    apiFetch("/mentor/notifications")
      .then((res) => {
        const items = (res && res.success && Array.isArray(res.data) ? res.data : [])
          .filter((n) => n && n.title)
          .map((n) => ({
            id: n.id,
            type: "document",
            title: n.title,
            desc: n.message || n.desc_text || "",
            time: n.created_at ? new Date(n.created_at).toLocaleString() : "Recently",
            unread: false,
          }));
        setNotifications(items);
      })
      .catch(() => setNotifications([]));
  }, []);

  const [activeTab, setActiveTab] = useState("all");

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
      case "calendar": return <Calendar size={16} className="notif-icon-calendar" />;
      case "alert": return <AlertTriangle size={16} className="notif-icon-alert" />;
      case "success": return <CheckCircle2 size={16} className="notif-icon-success" />;
      case "document": return <FileText size={16} className="notif-icon-document" />;
      default: return <Bell size={16} />;
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
        <button
          className="notif-mark-read-btn"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          style={{ opacity: unreadCount === 0 ? 0.5 : 1, cursor: unreadCount === 0 ? "default" : "pointer" }}
        >
          <Check size={14} className="notif-check-icon" /> Mark read
        </button>
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
              <div className={`notif-icon-box type-${n.type}`}>
                {getIcon(n.type)}
              </div>
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
  const headerRightRef = useRef(null);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [userData, setUserData] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u && u.name) return u;
    } catch(e) {}
    return { name: "", role: "Senior Trainer" };
  });

  useEffect(() => {
    apiFetch("/mentor/overview")
      .then((res) => {
        const p = res && res.success && res.data && res.data.profile;
        if (p && p.name) setUserData((prev) => ({ ...prev, name: p.name, role: p.role || prev.role, email: p.email }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const u = JSON.parse(localStorage.getItem("user"));
        if (u) setUserData(u);
      } catch(e) {}
    };
    window.addEventListener("userProfileUpdated", handleUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUpdate);
  }, []);

  const getInitials = (name) => {
    if (!name || name.trim().length === 0) return "VS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

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

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === "/mentor" || path === "/mentor/") return "Mentor Dashboard";
    if (path.startsWith("/mentor/batches")) return "My Allocated Batches";
    if (path.startsWith("/mentor/students")) return "Student Roster & Performance";
    if (path.startsWith("/mentor/attendance")) return "Attendance Management";
    if (path.startsWith("/mentor/assignments")) return "Assignments & Grading";
    if (path.startsWith("/mentor/sessions")) return "Live Classes & Doubts";
    if (path.startsWith("/mentor/ai-interviews")) return "AI Interview Analytics";
    if (path.startsWith("/mentor/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/mentor/notifications")) return "Notifications";
    if (path.startsWith("/mentor/profile")) return "Mentor Profile & Onboarding Settings";
    if (path.startsWith("/mentor/help")) return "Help & Support Desk";
    return "Mentor Dashboard";
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
                      <span className="mentor-header__name">{userData.name || "Mentor"}</span>
                    </div>
                    <div className="mentor-header__avatar" aria-label={`User profile ${userData.name}`}>
                      {getInitials(userData.name)}
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="mentor-header__profile-dropdown">
                        <div className="mentor-header__profile-top">
                          <div className="mentor-header__profile-avatar">{getInitials(userData.name)}</div>
                          <div className="mentor-header__profile-info">
                            <span className="mentor-header__profile-name">{userData.name || "Mentor"}</span>
                            <span className="mentor-header__profile-sub">{userData.role || "Senior Trainer"}</span>
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
                          Profile Settings
                        </button>
                        <button
                          className="mentor-header__profile-item mentor-header__profile-item--danger"
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
            <div className="mentor-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
