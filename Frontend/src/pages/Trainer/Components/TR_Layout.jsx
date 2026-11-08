import React, { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  PanelLeft,
  LogOut,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Trash2,
  Key,
  Clock,
  User,
  Check,
  X
} from "lucide-react";
import { TrainerSidebar } from "./TR_Sidebar";
import GlobalHeaderSearch from "../../../components/Common/GlobalHeaderSearch";
import RouteLoadingFallback from "../../../components/Common/RouteLoadingFallback";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import FullNotificationModal from "../../../components/ui/FullNotificationModal";
import NotificationDetailModal from "../../../components/ui/NotificationDetailModal";
import AppTooltip from "../../../components/ui/AppTooltip";
import "../Styles/TR_Layout.css";

function NotificationDropdown({
  onClose,
  onUnreadChange,
  onOpenViewAll,
  notifications,
  setNotifications,
  onSelectNotification
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const autoCloseTimerRef = useRef(null);

  const startAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      if (onClose) onClose();
    }, 6000);
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

    if (titleLower.includes("placement") || titleLower.includes("drive") || type === "calendar") {
      return (
        <div className="notif-colorful-icon-box notif-icon-rose">
          <Calendar size={18} />
        </div>
      );
    }
    if (titleLower.includes("task") || titleLower.includes("code") || titleLower.includes("quiz") || type === "document") {
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
    if (n.type === "broadcast") {
      return (
        <span className="notif-card-title-text">
          <span style={{ color: "#d946ef", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}>
            📢 [Broadcast]
          </span>{" "}
          <span>{n.title}</span>
        </span>
      );
    }
    return <span className="notif-card-title-text">{n.title}</span>;
  };

  return (
    <div
      className="notif-dropdown-box"
      onMouseEnter={clearAutoCloseTimer}
      onMouseLeave={startAutoCloseTimer}
    >
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

      <div className="notif-list-wrap">
        {visibleNotifications.length === 0 ? (
          <div className="notif-empty-state">
            No notifications to display
          </div>
        ) : (
          visibleNotifications.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              onClick={() => {
                if (n.unread) toggleSingleRead(n.id);
                if (n.actionUrl) {
                  if (onClose) onClose();
                  navigate(n.actionUrl);
                  return;
                }
                if (onClose) onClose();
                if (onSelectNotification) onSelectNotification(n);
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(e, n.id);
                }}
                title="Delete notification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

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

export function TrainerLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullNotifOpen, setFullNotifOpen] = useState(false);
  const [selectedNotifModal, setSelectedNotifModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const headerRightRef = useRef(null);

  // User Profile Resolution
  const resolveUser = (rawUser) => {
    let localUser = {};
    try {
      localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || {};
    } catch (_e) {}
    const u = rawUser || {};
    const rawName = localUser.name || localUser.fullName || u.name || u.fullName;
    const email = localUser.email || u.email || "trainer@pvppcoe.ac.in";
    let name = rawName;
    if (!name || name.includes("@")) {
      const src = (email && email.includes("@")) ? email.split("@")[0] : "";
      if (src) {
        name = src
          .replace(/[0-9_.-]+/g, " ")
          .trim()
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
    return { ...localUser, ...u, name: name || "Trainer", email };
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

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadTrainerNotifs = async () => {
      try {
        const res = await apiFetch("/admin/broadcast").catch(() => null);
        const rawItems = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (rawItems.length > 0) {
          const mapped = rawItems.map((b) => ({
            id: b.id || `notif-${Math.random()}`,
            title: b.title || "Announcement",
            desc: b.message || b.desc || "",
            message: b.message || b.desc || "",
            time: b.time || (b.created_at ? new Date(b.created_at).toLocaleDateString() : "Recent"),
            unread: b.unread !== undefined ? Boolean(b.unread) : true,
            type: "broadcast"
          }));
          setNotifications((prev) => {
            const combined = [...mapped, ...prev];
            const seen = new Set();
            return combined.filter((item) => {
              const k = String(item.id || item.title);
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          });
        }
      } catch (_e) {}
    };

    loadTrainerNotifs();
  }, []);

  const hasUnreadNotif = notifications.some((n) => n.unread);

  // Close menus on outside click & navigation
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

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "TR";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user?.name);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <div className="trainer-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <TrainerSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Content Area */}
      <div className="trainer-content">
        <main className="trainer-main">
          {/* Main Integrated White Rounded Card */}
          <div className="trainer-page-card">
            {/* Header Bar */}
            <header className="trainer-header">
              <div className="trainer-header__left">
                <AppTooltip text="Toggle sidebar" position="bottom">
                  <button
                    type="button"
                    className="trainer-header__sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                  >
                    <PanelLeft size={20} />
                  </button>
                </AppTooltip>

                <GlobalHeaderSearch role="trainer" />
              </div>

              <div className="trainer-header__right" ref={headerRightRef}>
                {/* Notifications Bell */}
                <div className="trainer-header__notif-wrap">
                  <button
                    className="trainer-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="trainer-header__bell-icon" />
                    {hasUnreadNotif && <span className="trainer-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={() => {}}
                      onOpenViewAll={() => setFullNotifOpen(true)}
                      notifications={notifications}
                      setNotifications={setNotifications}
                      onSelectNotification={(n) => setSelectedNotifModal(n)}
                    />
                  )}
                </div>

                {/* Profile Pill with Dropdown */}
                <div className="trainer-header__user-wrap">
                  <button
                    className="trainer-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="trainer-header__avatar" aria-label={`User ${user?.name}`}>
                      {userInitials}
                    </div>
                    <div className="trainer-header__user-info">
                      <span className="trainer-header__name">{user?.name || "Trainer"}</span>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="trainer-header__profile-dropdown">
                      <div className="trainer-header__profile-top">
                        <div className="trainer-header__profile-avatar">{userInitials}</div>
                        <div className="trainer-header__profile-info">
                          <span className="trainer-header__profile-name">{user?.name}</span>
                          <span className="trainer-header__profile-sub">{user?.email}</span>
                        </div>
                      </div>
                      <div className="trainer-header__profile-divider" />
                      <button
                        className="trainer-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/trainer/profile");
                        }}
                      >
                        <User size={15} />
                        View Profile
                      </button>
                      <button
                        className="trainer-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          setShowPasswordModal(true);
                        }}
                      >
                        <Key size={15} />
                        Change Password
                      </button>
                      <button
                        className="trainer-header__profile-item trainer-header__profile-item--danger"
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

            {/* Page Body */}
            <div className="trainer-card-body">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Full Notification Modal */}
      {fullNotifOpen && (
        <FullNotificationModal
          notifications={notifications}
          onClose={() => setFullNotifOpen(false)}
          onClearAll={() => setNotifications([])}
        />
      )}

      {/* Single Notification Detail Modal */}
      {selectedNotifModal && (
        <NotificationDetailModal
          notification={selectedNotifModal}
          onClose={() => setSelectedNotifModal(null)}
        />
      )}
    </div>
  );
}

export default TrainerLayout;
