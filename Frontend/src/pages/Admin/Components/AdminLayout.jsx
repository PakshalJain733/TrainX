import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import "../Styles/AdminLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const sampleNotifications = [
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

  const getIcon = (type) => {
    switch(type) {
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
            <span className="notif-header-dot"></span>
          </div>
          <div className="notif-header-text">
            <div className="notif-header-title">Notifications</div>
            <div className="notif-header-subtitle">2 unread alerts</div>
          </div>
        </div>
        <button className="notif-mark-read-btn" onClick={() => onUnreadChange && onUnreadChange(false)}>
          <Check size={14} className="notif-check-icon" /> Mark read
        </button>
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        <button className="notif-tab active">All (3)</button>
        <button className="notif-tab">Unread (2)</button>
      </div>

      {/* List */}
      <div className="notif-list-wrap">
        {sampleNotifications.map((n) => (
          <div key={n.id} className={`notif-list-card ${n.unread ? "unread" : ""}`}>
            <div className={`notif-icon-box type-${n.type}`}>
              {getIcon(n.type)}
            </div>
            <div className="notif-content">
              <div className="notif-content-top">
                <div className="notif-card-title">{n.title}</div>
                <div className="notif-card-time">{n.time}</div>
                <button className="notif-delete-btn"><Trash2 size={14}/></button>
              </div>
              <div className="notif-card-desc">{n.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="notif-footer-wrap">
        <button className="notif-clear-all-btn">Clear all</button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
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

  const [user, setUser] = useState({ name: "System Admin", role: "Super Admin" });

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === "/admin" || path === "/admin/") return "Dashboard";
    if (path.startsWith("/admin/users")) return "User Management";
    if (path.startsWith("/admin/batches")) return "Manage Batches";
    if (path.startsWith("/admin/attendance")) return "Track Attendance";
    if (path.startsWith("/admin/learning")) return "Manage Learning Content";
    if (path.startsWith("/admin/quiz")) return "Manage Quizzes";
    if (path.startsWith("/admin/practice")) return "Coding Tasks";
    if (path.startsWith("/admin/broadcast")) return "Broadcast Notice Center";
    if (path.startsWith("/admin/progress")) return "Student Progress Analytics";
    if (path.startsWith("/admin/leaderboard")) return "Leaderboard";
    if (path.startsWith("/admin/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/admin/help")) return "Support Tickets";
    return "Dashboard";
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
                      AD
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="admin-header__profile-dropdown">
                        <div className="admin-header__profile-top">
                          <div className="admin-header__profile-avatar">
                            AD
                          </div>
                          <div className="admin-header__profile-info">
                            <span className="admin-header__profile-name">{user.name}</span>
                            <span className="admin-header__profile-sub">{user.role}</span>
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
    </div>
  );
}
