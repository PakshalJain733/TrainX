import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, Key, Clock } from "lucide-react";
import { AdminSidebar } from "./AD_Sidebar";
import "../Styles/AD_Layout.css";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import BroadcastToast from "../../../components/ui/BroadcastToast";
import FullNotificationModal from "../../../components/ui/FullNotificationModal";
import { apiFetch } from "../../../utils/api";

function NotificationDropdown({ onClose, onUnreadChange, onOpenViewAll, notifications, setNotifications }) {
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
                        {n.message || n.desc || "No additional details available."}
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

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullNotifOpen, setFullNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [notifications, setNotifications] = useState(defaultNotificationsList);

  useEffect(() => {
    apiFetch("/admin/broadcast")
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

  const loadProfile = () => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      const adminProf = JSON.parse(sessionStorage.getItem('adminProfile') || '{}');
      const name = adminProf.name || stored.name || stored.email || "System Admin";
      const email = adminProf.email || stored.email || "admin@pvppcoe.ac.in";
      return {
        name: name,
        email: email,
        role: adminProf.role || stored.role || "College Administrator",
        avatar: adminProf.avatar || stored.avatar || stored.avatarUrl || null,
      };
    } catch (e) {
      return { name: "System Admin", email: "admin@pvppcoe.ac.in", role: "College Administrator", avatar: null };
    }
  };

  const [user, setUser] = useState(loadProfile);

  const fetchUser = async () => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch('/api/v1/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          const u = data.data;
          const adminProf = JSON.parse(sessionStorage.getItem('adminProfile') || '{}');
          const name = adminProf.name || u.name || u.email || "System Admin";
          const updated = {
            name: name,
            email: adminProf.email || u.email || "admin@pvppcoe.ac.in",
            role: adminProf.role || u.role || "College Administrator",
            avatar: adminProf.avatar || u.avatarUrl || u.avatar || null,
          };
          setUser(updated);
          let localUser = {};
          try { localUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch {}
          sessionStorage.setItem("user", JSON.stringify({ ...localUser, ...updated }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch admin profile for header:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    const handleProfileUpdate = () => {
      setUser(loadProfile());
      fetchUser();
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === "/admin" || path === "/admin/") return "Overview";
    if (path.startsWith("/admin/users")) return "User Management";
    if (path.startsWith("/admin/batches")) return "Manage Batches";
    if (path.startsWith("/admin/attendance")) return "Track Attendance";
    if (path.startsWith("/admin/learning")) return "Manage Learning Content";
    if (path.startsWith("/admin/quiz")) return "Manage Quizzes";
    if (path.startsWith("/admin/practice")) return "Coding Practice";
    if (path.startsWith("/admin/broadcast")) return "Broadcast Notice Center";
    if (path.startsWith("/admin/progress")) return "Student Progress Analytics";
    if (path.startsWith("/admin/leaderboard")) return "Leaderboard";
    if (path.startsWith("/admin/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/admin/help")) return "Support Tickets";
    return "Overview";
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
    <div className="admin-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="admin-content">
        <main className="admin-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="admin-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="admin-header">
              <div className="admin-header__left">
                <button
                  className="admin-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="admin-breadcrumb">
                  <span className="admin-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="admin-header__right" ref={headerRightRef}>

                {/* Notification Bell Dropdown Wrap */}
                <div className="admin-header__notif-wrap">
                  <button
                    className="admin-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="admin-header__bell-icon" />
                    {hasUnreadNotif && <span className="admin-header__notification-dot"></span>}
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
                <div className="admin-header__user-wrap">
                  <button
                    className="admin-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="admin-header__user-info">
                      <span className="admin-header__name">{user.name}</span>
                    </div>
                    <div className="admin-header__avatar" aria-label={`User profile ${user.name}`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : user.name ? (
                        user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2)
                      ) : (
                        "AD"
                      )}
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="admin-header__profile-dropdown">
                        <div className="admin-header__profile-top">
                          <div className="admin-header__profile-avatar">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            ) : user.name ? (
                              user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2)
                            ) : (
                              "AD"
                            )}
                          </div>
                          <div className="admin-header__profile-info">
                            <span className="admin-header__profile-name">{user.name}</span>
                            <span className="admin-header__profile-sub">{user.email || user.role || "Admin"}</span>
                          </div>
                        </div>
                        <div className="admin-header__profile-divider" />
                        <button
                          className="admin-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/admin/profile");
                          }}
                        >
                          <UserCog size={15} />
                          Edit Profile
                        </button>
                        <button
                          className="admin-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            setIsChangePasswordOpen(true);
                          }}
                        >
                          <Key size={15} />
                          Change Password
                        </button>
                        <button
                          className="admin-header__profile-item admin-header__profile-item--danger"
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
            <div className="admin-card-body">
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
    </div>
  );
}
