import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck, Trash2, Calendar, AlertTriangle, CheckCircle2, FileText, Check } from "lucide-react";
import { MentorSidebar } from "./MentorSidebar";
import { mentorProfile } from "../../../data/mentorMockData";
import "../Styles/MentorLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const notifications = [
    { id: 1, type: "document", title: "12 Assignment Submissions Pending Grading", time: "15 min ago", unread: true },
    { id: 2, type: "calendar", title: "Live Class scheduled for 02:00 PM Today", time: "1h ago", unread: true },
    { id: 3, type: "success", title: "Weekly Governance Report Approved", time: "3h ago", unread: false },
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
    <div className="mentor-header__profile-dropdown notif-dropdown-box">
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
        {notifications.map((n) => (
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

export default function MentorLayout() {
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
    if (path === "/mentor" || path === "/mentor/") return "Mentor Dashboard";
    if (path.startsWith("/mentor/batches")) return "My Allocated Batches";
    if (path.startsWith("/mentor/students")) return "Student Roster & Performance";
    if (path.startsWith("/mentor/attendance")) return "Attendance Management";
    if (path.startsWith("/mentor/assignments")) return "Assignments & Grading";
    if (path.startsWith("/mentor/sessions")) return "Live Classes & Doubts";
    if (path.startsWith("/mentor/ai-interviews")) return "AI Interview Analytics";
    if (path.startsWith("/mentor/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/mentor/notifications")) return "Notifications";
    if (path.startsWith("/mentor/profile")) return "Mentor Profile";
    if (path.startsWith("/mentor/help")) return "Help & Support Desk";
    return "Mentor Dashboard";
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="mentor-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <MentorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="mentor-content">
        <main className="mentor-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="mentor-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="mentor-header">
              <div className="mentor-header__left">
                <button
                  className="mentor-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="mentor-breadcrumb">
                  <span className="mentor-breadcrumb-active">{getPageTitle(pathname)}</span>
                </div>
              </div>

              <div className="mentor-header__right" ref={headerRightRef}>
                <div className="mentor-header__badges">
                  <span className="mentor-header__badge mentor-header__badge--success">
                    Senior Trainer
                  </span>
                </div>

                {/* Notification Bell Dropdown Wrap */}
                <div className="mentor-header__notif-wrap">
                  <button
                    className="mentor-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="mentor-header__bell-icon" />
                    {hasUnreadNotif && <span className="mentor-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="mentor-header__user-wrap">
                  <button
                    className="mentor-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="mentor-header__user-info">
                      <span className="mentor-header__name">{mentorProfile.name}</span>
                    </div>
                    <div className="mentor-header__avatar" aria-label={`User profile ${mentorProfile.name}`}>
                      VS
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="mentor-header__profile-dropdown">
                        <div className="mentor-header__profile-top">
                          <div className="mentor-header__profile-avatar">VS</div>
                          <div className="mentor-header__profile-info">
                            <span className="mentor-header__profile-name">{mentorProfile.name}</span>
                            <span className="mentor-header__profile-sub">{mentorProfile.role}</span>
                          </div>
                        </div>
                        <div className="mentor-header__profile-divider" />
                        <button
                          className="mentor-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/mentor/profile");
                          }}
                        >
                          <UserCog size={15} />
                          Profile Settings
                        </button>
                        <button
                          className="mentor-header__profile-item mentor-header__profile-item--danger"
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
            <div className="mentor-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
