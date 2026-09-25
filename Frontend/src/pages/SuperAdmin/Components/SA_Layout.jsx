import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { PanelLeft, Bell, Search, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key } from 'lucide-react';
import SuperAdminSidebar from "./SA_Sidebar";
import ChangePasswordModal from '../../../components/ui/ChangePasswordModal';
import "../Styles/SA_Layout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('superadmin_notifications');
    if (saved) return JSON.parse(saved);
    return [
    { id: 1, type: "success", title: "Secure College Access Key generated", time: "10 min ago", unread: true },
    { id: 2, type: "success", title: "Apex Institute of Tech batch sync complete", time: "1h ago", unread: true },
    { id: 3, type: "document", title: "Monthly Cross-College Placement Audit ready", time: "3h ago", unread: false },
  ];
  });

  useEffect(() => {
    localStorage.setItem('superadmin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

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
    <div className="sa-header__profile-dropdown notif-dropdown-box">
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
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "No unread alerts"}
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
          <div className="notif-empty-state">
            No notifications to display
          </div>
        ) : (
          visibleNotifications.map((n) => (
            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              style={{ cursor: "default", flexDirection: "column", gap: 0 }}
            >
              <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-start' }}>
                <div className={`notif-icon-box type-${n.type}`}>{getIcon(n.type)}</div>
                <div className="notif-content" style={{ flex: 1 }}>
                  <div className="notif-content-top">
                    <div 
                      className="notif-card-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(n.id);
                      }}
                      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      title="Click to view full message"
                    >
                      {n.title}
                      {n.unread && (
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0 }} />
                      )}
                    </div>
                    <div className="notif-card-time">{n.time}</div>
                    <button
                      className="notif-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem(e, n.id); }}
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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

      {/* Modal for expanded message */}
      {expandedId && (
        <div 
          className="notif-modal-overlay" 
          onClick={() => { const notif = notifications.find(x => x.id === expandedId); if (notif && notif.unread) toggleSingleRead(notif.id); setExpandedId(null); }} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="notif-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative' }}
          >
            {(() => {
               const n = notifications.find(notif => notif.id === expandedId);
               if (!n) return null;
               return (
                 <>
                   <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.25rem', marginBottom: '8px' }}>{n.title}</h3>
                   <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '16px' }}>{n.time}</span>
                   <p style={{ color: '#334155', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                     {n.desc ? n.desc.replace('...', ' 4B regarding upcoming semester evaluations.') : "No details available."}
                   </p>
                   <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                     <button 
                       onClick={() => { const notif = notifications.find(x => x.id === expandedId); if (notif && notif.unread) toggleSingleRead(notif.id); setExpandedId(null); }} 
                       style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                     >
                       Close
                     </button>
                   </div>
                 </>
               )
            })()}
          </div>
        </div>
      )}
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

