import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import "../Styles/AdminLayout.css";

function NotificationDropdown({ onClose }) {
  const sampleNotifications = [
    {
      id: 1,
      title: "New Student Enrolled",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Help Ticket Received - SQL Indexing",
      time: "25 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "Weekly Report Generation Complete",
      time: "2h ago",
      unread: false,
    },
  ];

  return (
    <div className="admin-header__profile-dropdown notif-dropdown-box">
      <div className="notif-dropdown-top">
        <span className="notif-dropdown-title">Notifications</span>
        <button className="notif-mark-read-btn">Mark all read</button>
      </div>
      <div className="notif-list-wrap">
        {sampleNotifications.map((n) => (
          <div
            key={n.id}
            className={`notif-list-card ${n.unread ? "notif-list-card--unread" : "notif-list-card--read"}`}
          >
            <div className="notif-card-title">{n.title}</div>
            <div className="notif-card-time">{n.time}</div>
          </div>
        ))}
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
    if (path.startsWith("/admin/batches")) return "Manage Batches";
    if (path.startsWith("/admin/attendance")) return "Track Attendance";
    if (path.startsWith("/admin/learning")) return "Manage Learning Content";
    if (path.startsWith("/admin/quiz")) return "Manage Quizzes";
    if (path.startsWith("/admin/practice")) return "Coding Tasks";
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
          <div className="admin-page-card">
            
            {/* Header Bar */}
            <header className="admin-header">
              <div className="admin-header__left">
                <button
                  className="admin-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="admin-breadcrumb">
                  <span className="admin-breadcrumb-item">AcadNexus</span>
                  <span className="admin-breadcrumb-sep">/</span>
                  <span className="admin-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="admin-header__right" ref={headerRightRef}>
                <div className="admin-header__badges">
                  <span className="admin-header__badge admin-header__badge--success">
                    Portal Active
                  </span>
                </div>

                {/* Notifications */}
                <div className="admin-header__notif-wrap">
                  <button
                    className="admin-header__icon-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                  >
                    <Bell size={21} className="admin-header__bell-icon" />
                    {hasUnreadNotif && <span className="admin-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown onClose={() => setNotifOpen(false)} />
                  )}
                </div>

                {/* User menu */}
                <div className="admin-header__user-wrap">
                  <button
                    className="admin-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                  >
                    <div className="admin-header__user-info">
                      <span className="admin-header__name">{user.name}</span>
                      <span className="admin-header__sub">{user.role}</span>
                    </div>
                    <div className="admin-header__avatar">
                      AD
                    </div>
                  </button>

                  {profileOpen && (
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
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserCog size={15} />
                        Profile Settings
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
