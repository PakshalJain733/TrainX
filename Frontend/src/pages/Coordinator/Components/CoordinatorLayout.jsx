import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2, Key } from "lucide-react";
import { CoordinatorSidebar } from "./CoordinatorSidebar";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/CoordinatorLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([
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
  ]);

  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (onUnreadChange) onUnreadChange(false);
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    if (onUnreadChange) onUnreadChange(false);
  };

  const filteredNotifs = activeTab === "unread" ? notifications.filter((n) => n.unread) : notifications;

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
              {unreadCount > 0 ? `${unreadCount} unread alerts` : "No unread alerts"}
            </div>
          </div>
        </div>
        <div className="notif-header-actions-right">
          <button
            className="notif-view-all-btn"
            onClick={() => {
              if (onClose) onClose();
              navigate("/coordinator/notifications");
            }}
          >
            View all
          </button>
          <button className="notif-mark-read-btn" onClick={handleMarkRead}>
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
          All ({notifications.length})
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
        {filteredNotifs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            No notifications
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div key={n.id} className={`notif-list-card ${n.unread ? "unread" : ""}`}>
              <div className={`notif-icon-box type-${n.type}`}>{getIcon(n.type)}</div>
              <div className="notif-content">
                <div className="notif-content-top">
                  <div className="notif-card-title">{n.title}</div>
                  <div className="notif-card-time">{n.time}</div>
                  <button
                    className="notif-delete-btn"
                    onClick={() => handleDelete(n.id)}
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
        <button className="notif-clear-all-btn" onClick={handleClearAll}>
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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
    if (path.startsWith("/coordinator/quizzes-and-codes") || path.startsWith("/coordinator/assessments") || path.startsWith("/coordinator/practice")) return "Quizzes and Codes";
    if (path.startsWith("/coordinator/performances") || path.startsWith("/coordinator/coding-performance")) return "Performances";
    if (path.startsWith("/coordinator/interviews")) return "AI Mock Interview Completion & Feedback";
    if (path.startsWith("/coordinator/improvement")) return "Students Needing Improvement & Support Hub";
    if (path.startsWith("/coordinator/mentors")) return "Industry Trainers & Mentors";
    if (path.startsWith("/coordinator/requests")) return "Requests & Approvals Center";
    if (path.startsWith("/coordinator/notifications")) return "Broadcast Notifications";
    if (path.startsWith("/coordinator/profile")) return "Profile";
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
                    <Bell size={20} />
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
                      <span className="coordinator-header__name">{coordinatorProfile.name}</span>
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
    </div>
  );
}
