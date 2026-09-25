import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check, Key } from "lucide-react";
import { AdminSidebar } from "./AD_Sidebar";
import "../Styles/AD_Layout.css";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import BroadcastToast from "../../../components/ui/BroadcastToast";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('admin_notifications');
    if (saved) return JSON.parse(saved);
    return [
    {
      id: 1,
      type: "success",
      title: "New Student Enrolled",
      desc: "A new student has enrolled in the platform.",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "alert",
      title: "Help Ticket Received - SQL Indexing",
      desc: "User requires help with database indexing concepts.",
      time: "25 min ago",
      unread: true,
    },
    {
      id: 3,
      type: "document",
      title: "Weekly Report Generation Complete",
      desc: "The automated weekly reports have been generated and are ready.",
      time: "2h ago",
      unread: false,
    },
  ];
  });

  useEffect(() => {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
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
    <div className="admin-header__profile-dropdown notif-dropdown-box">
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
                <div className="notif-card-desc">{n.desc}</div>
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
          onClick={() => setExpandedId(null)} 
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
                       onClick={() => setExpandedId(null)} 
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

export default function AdminLayout() {
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
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
