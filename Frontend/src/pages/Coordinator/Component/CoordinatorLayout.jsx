import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut } from "lucide-react";
import { CoordinatorSidebar } from "./CoordinatorSidebar";
import "../Style/CoordinatorLayout.css";

function NotificationDropdown({ onClose }) {
  const sampleNotifications = [
    {
      id: 1,
      title: "ECS-A Batch Attendance Updated",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Leave Application by Neha K.",
      time: "20 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "Weekly Reports Submission Open",
      time: "2h ago",
      unread: false,
    },
  ];

  return (
    <div className="student-header__profile-dropdown notif-dropdown-box">
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

export default function CoordinatorLayout() {
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

  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) return u;
    } catch (e) {}
    return { name: "Prof. A. Deshmukh", department: "ECS", role: "Coordinator" };
  });

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === "/coordinator" || path === "/coordinator/") return "Overview";
    if (path.startsWith("/coordinator/batches")) return "Manage Batches";
    if (path.startsWith("/coordinator/attendance")) return "Attendance Tracker";
    if (path.startsWith("/coordinator/weekly-reports")) return "Weekly Reports Review";
    if (path.startsWith("/coordinator/learning")) return "Learning Modules";
    if (path.startsWith("/coordinator/help")) return "Help Desk / Tickets";
    if (path.startsWith("/coordinator/profile")) return "Profile";
    if (path.startsWith("/coordinator/settings")) return "Settings";
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
    <div className="student-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <CoordinatorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="student-content">
        <main className="student-main">
          <div className="student-page-card">
            
            {/* Header bar inside Card */}
            <header className="student-header">
              <div className="student-header__left">
                <button
                  className="student-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="student-breadcrumb">
                  <span className="student-breadcrumb-item">AcadNexus</span>
                  <span className="student-breadcrumb-sep">/</span>
                  <span className="student-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="student-header__right" ref={headerRightRef}>
                <div className="student-header__badges">
                  <span className="student-header__badge student-header__badge--success">
                    {user.role}
                  </span>
                </div>

                <div className="student-header__notif-wrap">
                  <button
                    className="student-header__icon-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                  >
                    <Bell size={21} className="student-header__bell-icon" />
                    {hasUnreadNotif && <span className="student-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown onClose={() => setNotifOpen(false)} />
                  )}
                </div>

                <div className="student-header__user-wrap">
                  <button
                    className="student-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                  >
                    <div className="student-header__user-info">
                      <span className="student-header__name">{user.name}</span>
                      <span className="student-header__sub">{user.department} Department</span>
                    </div>
                    <div className="student-header__avatar">
                      {user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "CO"}
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="student-header__profile-dropdown">
                      <div className="student-header__profile-top">
                        <div className="student-header__profile-avatar">
                          {user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "CO"}
                        </div>
                        <div className="student-header__profile-info">
                          <span className="student-header__profile-name">{user.name}</span>
                          <span className="student-header__profile-sub">{user.role}</span>
                        </div>
                      </div>
                      <div className="student-header__profile-divider" />
                      <button
                        className="student-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/coordinator/profile");
                        }}
                      >
                        <UserCog size={15} />
                        View Profile
                      </button>
                      <button
                        className="student-header__profile-item student-header__profile-item--danger"
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

            {/* Render sub routes */}
            <div className="student-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
