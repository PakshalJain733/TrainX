import { useState, useEffect, useRef, Suspense } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key, Clock, User } from "lucide-react";
import { CoordinatorSidebar } from "./CO_Sidebar";
import GlobalHeaderSearch from "../../../components/Common/GlobalHeaderSearch";
import RouteLoadingFallback from "../../../components/Common/RouteLoadingFallback";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import BroadcastToast from "../../../components/ui/BroadcastToast";
import FullNotificationModal from "../../../components/ui/FullNotificationModal";
import NotificationDetailModal from "../../../components/ui/NotificationDetailModal";
import "../Styles/CO_Layout.css";

function NotificationDropdown({ onClose, onUnreadChange, onOpenViewAll, notifications, setNotifications, onSelectNotification }) {
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
            className={`notif-mark-read-btn ${unreadCount === 0 ? "coord-notif-btn--disabled" : ""}`}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
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
          <div className="coord-notif-empty">
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

                  {n.actionUrl && (
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (n.unread) toggleSingleRead(n.id);
                          if (onClose) onClose();
                          navigate(n.actionUrl);
                        }}
                        style={{
                          background: n.actionColor || '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {n.actionLabel || 'Review Request →'}
                      </button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="notif-expanded-desc">
                      {(n.target || n.created_by_name || n.priority) && (
                        <div className="coord-notif-tags-row">
                          {n.target && <span className="coord-notif-tag-target">🎯 For: {n.target}</span>}
                          {n.created_by_name && <span className="coord-notif-tag-by">👤 By: {n.created_by_name}</span>}
                          {n.priority && <span className="coord-notif-tag-priority">⚡ {n.priority}</span>}
                        </div>
                      )}
                      <div>
                        {n.message || (n.desc ? n.desc.replace('...', ' regarding upcoming schedule.') : "No additional details available.")}
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
          className={`notif-clear-all-btn ${totalCount === 0 ? "coord-notif-btn--disabled" : ""}`}
          onClick={handleClearAll}
          disabled={totalCount === 0}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

const defaultNotificationsList = [];

export default function CoordinatorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullNotifOpen, setFullNotifOpen] = useState(false);
  const [selectedNotifModal, setSelectedNotifModal] = useState(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const hasUnreadNotif = notifications.some((n) => n.unread);

  useEffect(() => {
    const loadCoordinatorNotifs = async () => {
      try {
        const [notifRes, leaveRes] = await Promise.all([
          apiFetch("/coordinator/notifications").catch(() => null),
          apiFetch("/attendance/leave-requests").catch(() => null),
        ]);

        const notifItems = [];

        // 1. Pending Student Leave Requests Awaiting Coordinator Approval
        const leaves = Array.isArray(leaveRes?.data)
          ? leaveRes.data
          : (Array.isArray(leaveRes) ? leaveRes : []);
        const pendingLeaves = leaves.filter(
          (l) => String(l.status || '').toLowerCase() === 'pending'
        );
        pendingLeaves.forEach((l) => {
          const studentName = l.student_name || l.name || 'Student';
          notifItems.push({
            id: `pending-leave-${l.id}`,
            title: `📋 Leave Request: ${studentName}`,
            desc: `${studentName} requested ${l.days || 1} day(s) ${l.category || 'Leave'} (${l.start_date || 'Date'}): ${l.reason || 'Pending review'}`,
            message: `${studentName} has submitted a leave application for ${l.days || 1} day(s) (${l.start_date || ''} to ${l.end_date || l.start_date || ''}). Reason: ${l.reason || 'Personal'}. Please review and approve or reject.`,
            time: l.created_at ? new Date(l.created_at).toLocaleString() : 'Action Required',
            unread: true,
            type: 'calendar',
            target: 'Attendance Desk',
            priority: 'High Priority',
            created_by_name: studentName,
            actionUrl: '/coordinator/requests',
            actionLabel: 'Review Request →',
            actionColor: '#059669',
          });
        });

        // 2. Announcements & Broadcasts
        const rawItems = Array.isArray(notifRes?.data) ? notifRes.data : (Array.isArray(notifRes) ? notifRes : []);
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

        notifItems.push(...serverItems);

        // De-duplicate by id
        const unique = [];
        const seenIds = new Set();
        for (const item of notifItems) {
          const key = String(item.id || item.title);
          if (!seenIds.has(key)) {
            seenIds.add(key);
            unique.push(item);
          }
        }

        setNotifications(unique);
      } catch (err) {
        console.warn("[CO_Layout] Error loading notifications:", err);
      }
    };

    loadCoordinatorNotifs();
    const interval = setInterval(loadCoordinatorNotifs, 8000);
    window.addEventListener("portal_broadcast_updated", loadCoordinatorNotifs);
    window.addEventListener("new_broadcast_notification", loadCoordinatorNotifs);

    return () => {
      clearInterval(interval);
      window.removeEventListener("portal_broadcast_updated", loadCoordinatorNotifs);
      window.removeEventListener("new_broadcast_notification", loadCoordinatorNotifs);
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

  const formatDisplayName = (rawName, email, fallback = "Department Coordinator") => {
    if (typeof rawName === "string" && rawName.trim()) {
      const trimmed = rawName.trim();
      if (!trimmed.includes("@") && !/^[0-9a-f]{8,}$/i.test(trimmed)) {
        return trimmed;
      }
    }
    const source = (typeof email === "string" && email.includes("@")) ? email.split("@")[0] : "";
    if (source) {
      const cleaned = source.replace(/[0-9_.-]+/g, " ").trim();
      if (cleaned.length > 0) {
        return cleaned
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
    return fallback;
  };

  const resolveUser = (rawUser) => {
    let localUser = {};
    let coordProf = {};
    try { localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user")) || {}; } catch { }
    try { coordProf = JSON.parse(sessionStorage.getItem("coordinatorProfile") || localStorage.getItem("coordinatorProfile")) || {}; } catch { }
    const u = rawUser || {};
    const rawName = coordProf.name || localUser.name || localUser.fullName || localUser.full_name || u.name || u.fullName || u.full_name;
    const email = coordProf.email || localUser.email || u.email || "coordinator@pvppcoe.ac.in";
    const name = formatDisplayName(rawName, email, "Department Coordinator");
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
      .catch(() => { });
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setUser(resolveUser(null));
      apiFetch("/auth/me")
        .then((res) => {
          if (res && res.data) setUser(resolveUser(res.data));
        })
        .catch(() => { });
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
    if (!name || typeof name !== "string") return "DC";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user.name);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="coordinator-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <CoordinatorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="coordinator-content">
        <main className="coordinator-main">
          <div className="coordinator-page-card">
            {/* Header */}
            <header className="coordinator-header">
              <div className="coordinator-header__left">
                <button
                  className="coordinator-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <GlobalHeaderSearch role="coordinator" />
              </div>

              <div className="coordinator-header__right" ref={headerRightRef}>
                <div className="coordinator-header__notif-wrap">
                  <button
                    className="coordinator-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="coordinator-header__bell-icon" />
                    {hasUnreadNotif && <span className="coordinator-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={() => { }}
                      onOpenViewAll={() => setFullNotifOpen(true)}
                      notifications={notifications}
                      setNotifications={setNotifications}
                      onSelectNotification={(n) => setSelectedNotifModal(n)}
                    />
                  )}
                </div>

                <div className="coordinator-header__user-wrap">
                  <button
                    className="coordinator-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="coordinator-header__avatar">
                      {userInitials}
                    </div>
                    <div className="coordinator-header__user-info">
                      <span className="coordinator-header__name">{user.name || "Coordinator"}</span>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="coordinator-header__profile-dropdown">
                      <div className="coordinator-header__profile-top">
                        <div className="coordinator-header__profile-avatar">
                          {userInitials}
                        </div>
                        <div className="coordinator-header__profile-info">
                          <span className="coordinator-header__profile-name">{user.name}</span>
                          <span className="coordinator-header__profile-sub">{user.email}</span>
                        </div>
                      </div>
                      <div className="coordinator-header__profile-divider" />
                      <button
                        className="coordinator-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/coordinator/profile");
                        }}
                      >
                        <User size={15} />
                        View Profile
                      </button>
                      <button
                        className="coordinator-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                      >
                        <Key size={15} />
                        Change Password
                      </button>
                      <button
                        className="coordinator-header__profile-item coordinator-header__profile-item--danger"
                        onClick={() => {
                          setProfileOpen(false);
                          sessionStorage.removeItem("user");
                          sessionStorage.removeItem("token");
                          sessionStorage.removeItem("authToken");
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

            {/* Main Content Body */}
            <div className="coordinator-card-body">
              <Suspense fallback={<RouteLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <FullNotificationModal
        isOpen={fullNotifOpen}
        onClose={() => setFullNotifOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        onNavigate={(path) => navigate(path)}
      />
      <NotificationDetailModal
        notification={selectedNotifModal}
        onClose={() => setSelectedNotifModal(null)}
        onMarkRead={(id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: !n.unread } : n))}
        onDelete={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onNavigate={(path) => navigate(path)}
      />
      <BroadcastToast />
    </div>
  );
}
