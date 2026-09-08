import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, ShieldCheck, Check, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { CoordinatorSidebar } from "./CoordinatorSidebar";
import CoordinatorTabBar from "./CoordinatorTabBar";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import "../Styles/CoordinatorLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "alert",
      title: "2 New Leave Applications Pending Review",
      desc: "Faculty members submitted leave requests requiring approval.",
      time: "15 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "success",
      title: "Goldman Sachs Mock Drive Registrations Cross 140",
      desc: "High student engagement for upcoming campus placement drive.",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      type: "calendar",
      title: "Week 35 Governance Progress Audit Due Tomorrow",
      desc: "Submit weekly batch progress report to Department Head.",
      time: "3h ago",
      unread: false,
    },
  ]);

  const [activeTab, setActiveTab] = useState("all");

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
            <div className="notif-header-title">Coordinator Alerts</div>
            <div className="notif-header-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "No unread alerts"}
            </div>
          </div>
        </div>
        <button
          className="notif-mark-read-btn"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          style={{ opacity: unreadCount === 0 ? 0.5 : 1, cursor: unreadCount === 0 ? "default" : "pointer" }}
        >
          <Check size={14} className="notif-check-icon" /> Mark read
        </button>
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
              <div className="notif-icon-box type-alert">
                <Bell size={16} />
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
                {n.desc && <div className="notif-card-desc">{n.desc}</div>}
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
    if (path.startsWith("/coordinator/assessments")) return "Assessments & Quiz Governance";
    if (path.startsWith("/coordinator/attendance")) return "Attendance Governance";
    if (path.startsWith("/coordinator/roadmaps")) return "AI Career Roadmaps";
    if (path.startsWith("/coordinator/interviews")) return "AI Mock Interviews & Viva";
    if (path.startsWith("/coordinator/performance")) return "Performance & Skill Gap Analytics";
    if (path.startsWith("/coordinator/placement")) return "Placement Readiness & Drives";
    if (path.startsWith("/coordinator/leaderboard")) return "Department Leaderboard";
    if (path.startsWith("/coordinator/requests")) return "Requests & Approvals Center";
    if (path.startsWith("/coordinator/reports")) return "Governance & Audit Reports";
    if (path.startsWith("/coordinator/notifications")) return "Broadcast Notifications";
    if (path.startsWith("/coordinator/profile")) return "Coordinator Profile & Settings";
    if (path.startsWith("/coordinator/help")) return "Help & Support";
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
                  <ShieldCheck size={13} className="coordinator-header__badge-icon" />
                  CSE Coordinator
                </div>

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
