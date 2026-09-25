import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key } from "lucide-react";
import { CoordinatorSidebar } from "./CO_Sidebar";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import BroadcastToast from "../../../components/ui/BroadcastToast";
import "../Styles/CO_Layout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('coordinator_notifications');
    if (saved) return JSON.parse(saved);
    return [
    {
      id: 1,
      type: "calendar",
      title: "Department Meeting Schedule",
      desc: "HOD CSE has requested an urgent faculty meeting at 3:30 PM in Conference Room...",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "alert",
      title: "New Student Grievance",
      desc: "Student Aarav Patel (BTech CSE, Sem 6) submitted a grade re-evaluation request.",
      time: "25 min ago",
      unread: true,
    },
    {
      id: 3,
      type: "success",
      title: "Attendance Report Approved",
      desc: "Monthly attendance report for Semester 6 Data Structures has been generated.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 4,
      type: "document",
      title: "Curriculum Syllabus Update",
      desc: "Revised syllabus for AI & Machine Learning module has been published by...",
      time: "3 hours ago",
      unread: false,
    },
    {
      id: 5,
      type: "calendar",
      title: "Exam Duty Allocation",
      desc: "Your invigilation schedule for upcoming Mid-term exams has been published.",
      time: "Yesterday",
      unread: false,
    }
  ];
  });

  useEffect(() => {
    localStorage.setItem('coordinator_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiFetch("/coordinator/notifications")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          if (localStorage.getItem('coordinator_notifications')) return; // Ignore if we already have local data
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
    <div className="coordinator-header__profile-dropdown notif-dropdown-box">
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
          onClick={() => {
            const notif = notifications.find(x => x.id === expandedId);
            if (notif && notif.unread) toggleSingleRead(notif.id);
            setExpandedId(null);
          }} 
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

export default function CoordinatorLayout() {
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
    let coordProf = {};
    try { localUser = JSON.parse(sessionStorage.getItem("user")) || {}; } catch {}
    try { coordProf = JSON.parse(sessionStorage.getItem("coordinatorProfile")) || {}; } catch {}
    const u = rawUser || {};
    let name = coordProf.name || localUser.name || localUser.fullName || localUser.full_name || u.name || u.fullName || u.full_name || u.email?.split("@")[0] || localUser.email?.split("@")[0] || "Department Coordinator";
    let email = coordProf.email || localUser.email || u.email || "coordinator@pvppcoe.ac.in";
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
    if (!name) return "DC";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user.name);

  const getPageTitle = (path) => {
    if (path === "/coordinator" || path === "/coordinator/") return "Overview";
    if (path.startsWith("/coordinator/batches")) return "Batches Governance";
    if (path.startsWith("/coordinator/students")) return "Student Directory";
    if (path.startsWith("/coordinator/quizzes-and-codes")) return "Quizzes & Practice Codes";
    if (path.startsWith("/coordinator/performances")) return "Performance Analytics";
    if (path.startsWith("/coordinator/interviews")) return "AI Mock Interviews";
    if (path.startsWith("/coordinator/improvement")) return "Students Needing Support";
    if (path.startsWith("/coordinator/attendance")) return "Attendance Governance";
    if (path.startsWith("/coordinator/mentors")) return "Faculty & Mentors";
    if (path.startsWith("/coordinator/requests")) return "Requests & Approvals";
    if (path.startsWith("/coordinator/broadcast")) return "Broadcast Notice Center";
    if (path.startsWith("/coordinator/notifications")) return "Notifications";
    if (path.startsWith("/coordinator/placement")) return "Placement Readiness";
    if (path.startsWith("/coordinator/profile")) return "Profile";
    if (path.startsWith("/coordinator/help") || path.startsWith("/coordinator/support")) return "Help & Support";
    return "Coordinator Workspace";
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

                <div className="coordinator-breadcrumb">
                  <span className="coordinator-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="coordinator-header__right" ref={headerRightRef}>
                <div className="coordinator-header__notif-wrap" style={{ position: "relative" }}>
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
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
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
                    <div className="coordinator-header__user-info">
                      <span className="coordinator-header__name">{user.name}</span>
                    </div>
                    <div className="coordinator-header__avatar">
                      {userInitials}
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
                        <UserCog size={15} />
                        Edit Profile
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
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <BroadcastToast />
    </div>
  );
}
