import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { PanelLeft, Bell, Search, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key, Clock } from 'lucide-react';
import SuperAdminSidebar from "./SA_Sidebar";
import ChangePasswordModal from '../../../components/ui/ChangePasswordModal';
import "../Styles/SA_Layout.css";
import { apiFetch } from "../../../utils/api";

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

function NotificationDropdown({ onClose, onUnreadChange, onOpenViewAll }) {
  const [notifications, setNotifications] = useState(defaultNotificationsList);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

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

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const headerRightRef = useRef(null);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const loadProfile = () => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      const name = stored.name || stored.email || "Super Admin";
      const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : "SA";
      return {
        name,
        email: stored.email || "admin@trainingportal.com",
        initials: initials || "SA"
      };
    } catch (e) {
      return { name: "Super Admin", email: "admin@trainingportal.com", initials: "SA" };
    }
  };

  const [userProfile, setUserProfile] = useState(loadProfile);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const name = data.user.name || data.user.email || "Super Admin";
          const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          setUserProfile({
            name,
            email: data.user.email || "admin@trainingportal.com",
            initials: initials || "SA"
          });
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error("Error fetching SuperAdmin profile:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    const handleProfileUpdate = () => {
      setUserProfile(loadProfile());
      fetchUser();
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
  }, []);

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
    if (path === "/super-admin" || path === "/super-admin/") return "Overview";
    if (path.startsWith("/super-admin/colleges")) return "Colleges";
    if (path.startsWith("/super-admin/departments")) return "Departments";
    if (path.startsWith("/super-admin/batches")) return "Batches";
    if (path.startsWith("/super-admin/users")) return "Manage Users";
    if (path.startsWith("/super-admin/verification")) return "College Admins";
    if (path.startsWith("/super-admin/coordinators")) return "Coordinators";
    if (path.startsWith("/super-admin/mentors")) return "Mentors";
    if (path.startsWith("/super-admin/students")) return "Students";
    if (path.startsWith("/super-admin/performance")) return "Performance";
    if (path.startsWith("/super-admin/health")) return "System Health";
    if (path.startsWith("/super-admin/maintenance")) return "Feature Switches";
    if (path.startsWith("/super-admin/tickets")) return "Support Tickets";
    if (path.startsWith("/super-admin/profile")) return "Profile";
    return "Overview";
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="sa-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <SuperAdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="sa-content">
        <main className="sa-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="sa-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="sa-header">
              <div className="sa-header__left">
                <button
                  className="sa-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="sa-breadcrumb">
                  <span className="sa-breadcrumb-active">{getPageTitle(pathname)}</span>
                </div>
              </div>

              <div className="sa-header__right" ref={headerRightRef}>
                {/* Notification Bell */}
                <div className="sa-header__notif-wrap">
                  <button
                    className="sa-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={20} className="sa-header__bell-icon" />
                    {hasUnreadNotif && <span className="sa-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="sa-header__user-wrap">
                  <button
                    className="sa-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="sa-header__user-info">
                      <span className="sa-header__name">{userProfile.name}</span>
                    </div>
                    <div className="sa-header__avatar" aria-label={userProfile.name}>
                      {userProfile.initials}
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="sa-header__profile-dropdown">
                      <div className="sa-header__profile-top">
                        <div className="sa-header__profile-avatar">{userProfile.initials}</div>
                        <div className="sa-header__profile-info">
                          <span className="sa-header__profile-name">{userProfile.name}</span>
                          <span className="sa-header__profile-sub">{userProfile.email}</span>
                        </div>
                      </div>
                      <div className="sa-header__profile-divider" />
                      <Link
                        to="/super-admin/profile"
                        className="sa-header__profile-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserCog size={15} />
                        Edit Profile
                      </Link>
                      <button
                        type="button"
                        className="sa-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                      >
                        <Key size={15} />
                        Change Password
                      </button>
                      <div className="sa-header__profile-divider" />
                      <button
                        className="sa-header__profile-item sa-header__profile-item--danger"
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
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
            <div className="sa-card-body">
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

