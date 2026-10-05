import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, Key, Clock, User } from "lucide-react";
import { AdminSidebar } from "./AD_Sidebar";
import GlobalHeaderSearch from "../../../components/Common/GlobalHeaderSearch";
import "../Styles/AD_Layout.css";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import BroadcastToast from "../../../components/ui/BroadcastToast";
import FullNotificationModal from "../../../components/ui/FullNotificationModal";
import NotificationDetailModal from "../../../components/ui/NotificationDetailModal";
import { apiFetch } from "../../../utils/api";

function NotificationDropdown({ onClose, onUnreadChange, onOpenViewAll, notifications, setNotifications, onNavigate, onSelectNotification }) {
  const [activeTab, setActiveTab] = useState("all");

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

      {/* List - Small Form Preview Cards */}
      <div className="notif-list-wrap">
        {visibleNotifications.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
            No notifications to display
          </div>
        ) : (
          visibleNotifications.slice(0, 5).map((n) => {
            return (
              <div
                key={n.id}
                className={`notif-list-card ${n.unread ? "unread" : ""}`}
                onClick={() => {
                  if (n.unread) toggleSingleRead(n.id);
                  if (onClose) onClose();
                  if (onSelectNotification) {
                    onSelectNotification(n);
                  }
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

const defaultNotificationsList = [];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullNotifOpen, setFullNotifOpen] = useState(false);
  const [selectedNotifModal, setSelectedNotifModal] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [notifications, setNotifications] = useState(defaultNotificationsList);
  const hasUnreadNotif = notifications.some((n) => n.unread);

  useEffect(() => {
    const loadNotifications = () => {
      let prefs = { notifSystemAlerts: true, notifWeeklyReport: true, notifNewUsers: true };
      try {
        const stored = JSON.parse(sessionStorage.getItem("adminNotifPrefs") || "{}");
        prefs = { ...prefs, ...stored };
      } catch (_) {}

      apiFetch("/admin/broadcast")
        .then((res) => {
          const rawItems = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          const serverItems = rawItems.map((b) => ({
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

          const prefItems = [];
          if (prefs.notifSystemAlerts) {
            prefItems.push({
              id: "pref-sec-alert",
              title: "🛡️ System Security Alert",
              desc: "2FA Authentication & System Security monitoring active.",
              message: "2FA Authentication & System Security monitoring active.",
              time: "Just now",
              unread: true,
              type: "alert",
              target: "System Security",
              priority: "High Priority",
              created_by_name: "Security Engine"
            });
          }
          if (prefs.notifWeeklyReport) {
            prefItems.push({
              id: "pref-weekly-audit",
              title: "📊 Weekly Audit Digest",
              desc: "Weekly institutional audit report and analytics digest is available.",
              message: "Weekly institutional audit report and analytics digest is available.",
              time: "Today",
              unread: true,
              type: "calendar",
              target: "Institutional Audit",
              priority: "Weekly Digest",
              created_by_name: "Analytics Service"
            });
          }
          if (prefs.notifNewUsers) {
            prefItems.push({
              id: "pref-new-users",
              title: "👤 New User Enrollment",
              desc: "New student and faculty registration applications pending verification.",
              message: "New student and faculty registration applications pending verification.",
              time: "Today",
              unread: true,
              type: "alert",
              target: "User Management",
              priority: "Action Required",
              created_by_name: "Enrollment Desk"
            });
          }

          // Combine server items and active preference items
          const combined = [...prefItems, ...serverItems];
          setNotifications(combined);
        })
        .catch(() => { });
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    window.addEventListener("adminNotifPrefsUpdated", loadNotifications);
    window.addEventListener("userProfileUpdated", loadNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("adminNotifPrefsUpdated", loadNotifications);
      window.removeEventListener("userProfileUpdated", loadNotifications);
    };
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
          try { localUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch { }
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

                <GlobalHeaderSearch role="admin" />
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
                      onUnreadChange={() => { }}
                      onOpenViewAll={() => setFullNotifOpen(true)}
                      notifications={notifications}
                      setNotifications={setNotifications}
                      onSelectNotification={(n) => setSelectedNotifModal(n)}
                      onNavigate={(path) => {
                        setNotifOpen(false);
                        navigate(path);
                      }}
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
                    <div className="admin-header__avatar" aria-label={`User profile ${user.name}`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : user.name ? (
                        user.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2)
                      ) : (
                        "AD"
                      )}
                    </div>
                    <div className="admin-header__user-info">
                      <span className="admin-header__name">{user.name || "Admin User"}</span>
                      <span className="admin-header__role">{user.role || "Admin"}</span>
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
                          <User size={15} />
                          View Profile
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
      <NotificationDetailModal
        notification={selectedNotifModal}
        onClose={() => setSelectedNotifModal(null)}
        onMarkRead={(id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: !n.unread } : n))}
        onDelete={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onNavigate={(path) => navigate(path)}
      />
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
