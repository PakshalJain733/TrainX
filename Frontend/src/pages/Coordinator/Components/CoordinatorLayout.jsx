import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, ShieldCheck } from "lucide-react";
import { CoordinatorSidebar } from "./CoordinatorSidebar";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import "../Styles/CoordinatorLayout.css";

function NotificationDropdown({ onClose }) {
  const sampleNotifications = [
    {
      id: 1,
      title: "2 New Leave Applications Pending Review",
      time: "15 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Goldman Sachs Mock Drive Registrations Cross 140",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      title: "Week 35 Governance Progress Audit Due Tomorrow",
      time: "3h ago",
      unread: false,
    },
  ];

  return (
    <div className="coordinator-header__profile-dropdown" style={{ width: "320px", padding: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>Coordinator Alerts</span>
        <span style={{ fontSize: "11px", color: "#4f46e5", cursor: "pointer", fontWeight: 600 }}>Mark all read</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sampleNotifications.map((n) => (
          <div
            key={n.id}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              background: n.unread ? "#eff6ff" : "#f8fafc",
              fontSize: "12px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1e293b" }}>{n.title}</div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{n.time}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <Link
          to="/coordinator/notifications"
          style={{ fontSize: "12px", fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}
          onClick={onClose}
        >
          View All Notifications
        </Link>
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

  const navigate = useNavigate();
  const { pathname } = useLocation();

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
    if (path === "/coordinator" || path === "/coordinator/") return "Overview Dashboard";
    if (path.startsWith("/coordinator/batches")) return "Batches Governance";
    if (path.startsWith("/coordinator/students")) return "Student Directory & Risk Audit";
    if (path.startsWith("/coordinator/mentors")) return "Industry Trainers & Mentors";
    if (path.startsWith("/coordinator/schedules")) return "Live Schedules & Timetable";
    if (path.startsWith("/coordinator/assessments")) return "Assessments & Quiz Governance";
    if (path.startsWith("/coordinator/attendance")) return "Attendance Governance";
    if (path.startsWith("/coordinator/placement")) return "Placement Readiness & Drives";
    if (path.startsWith("/coordinator/requests")) return "Requests & Approvals Center";
    if (path.startsWith("/coordinator/reports")) return "Governance & Audit Reports";
    if (path.startsWith("/coordinator/notifications")) return "Broadcast Notifications";
    if (path.startsWith("/coordinator/profile")) return "Coordinator Profile & Settings";
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
                  <span className="coordinator-breadcrumb-item">AcadNexus</span>
                  <span className="coordinator-breadcrumb-sep">/</span>
                  <span className="coordinator-breadcrumb-item">Coordinator</span>
                  <span className="coordinator-breadcrumb-sep">/</span>
                  <span className="coordinator-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="coordinator-header__right" ref={headerRightRef}>
                <div className="coordinator-header__badge">
                  <ShieldCheck size={13} style={{ marginRight: "4px" }} />
                  CSE Coordinator
                </div>

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
                    <Bell size={20} />
                    {hasUnreadNotif && <span className="coordinator-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown onClose={() => setNotifOpen(false)} />
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
                      <span className="coordinator-header__name">{coordinatorProfile.name}</span>
                      <span className="coordinator-header__sub">CSE Dept · Apex Inst</span>
                    </div>
                    <div className="coordinator-header__avatar">
                      AM
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="coordinator-header__profile-dropdown">
                      <div className="coordinator-header__profile-top">
                        <div className="coordinator-header__profile-avatar">
                          AM
                        </div>
                        <div className="coordinator-header__profile-info">
                          <span className="coordinator-header__profile-name">{coordinatorProfile.name}</span>
                          <span className="coordinator-header__profile-sub">{coordinatorProfile.role}</span>
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
                        Profile Settings
                      </button>
                      <button
                        className="coordinator-header__profile-item coordinator-header__profile-item--danger"
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

            {/* Main Content Body */}
            <div className="coordinator-card-body">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
