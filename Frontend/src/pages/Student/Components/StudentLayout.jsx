import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut, CheckCheck } from "lucide-react";
import { StudentSidebar } from "./StudentSidebar";
import "../Styles/StudentLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const sampleNotifications = [
    {
      id: 1,
      title: "Attendance Marked as Present",
      time: "10 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Assignment Published",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      title: "IA2 Results & Marksheets Uploaded",
      time: "3h ago",
      unread: true,
    },
  ];

  return (
    <>
      <div className="student-header__profile-dropdown notif-dropdown-box">
        <div className="notif-dropdown-top">
          <span className="notif-dropdown-title">Notifications</span>
          <button
            className="notif-mark-read-btn"
            onClick={() => onUnreadChange && onUnreadChange(false)}
          >
            Mark all read
          </button>
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
        <div className="notif-footer-wrap">
          <Link
            to="/student/notifications"
            className="notif-view-all-btn"
            onClick={onClose}
          >
            View All Notifications
          </Link>
        </div>
      </div>
    </>
  );
}

export default function StudentLayout() {
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
    return { name: "Ganesh Shinde", department: "ECS", semester: 6 };
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const u = JSON.parse(localStorage.getItem("user"));
        if (u) setUser(u);
      } catch (e) {}
    };
    window.addEventListener("userProfileUpdated", handleUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUpdate);
  }, []);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const getShortDept = (dept) => {
    if (!dept) return "ECS";
    const d = dept.toLowerCase();
    if (d.includes("electronics") && d.includes("computer")) return "ECS";
    if (d.includes("computer engineering")) return "CE";
    if (d.includes("information technology")) return "IT";
    if (d.includes("artificial intelligence") || d.includes("data science")) return "AI&DS";
    return dept;
  };

  const getPageTitle = (path) => {
    if (path === "/student" || path === "/student/") return "Dashboard";
    if (path.startsWith("/student/roadmap")) return "AI Career Roadmap";
    if (path.startsWith("/student/learning")) return "Learning Content";
    if (path.startsWith("/student/ai-interview")) return "AI Mock Interview";
    if (path.startsWith("/student/progress")) return "Progress & Skill Radar";
    if (path.startsWith("/student/leaderboard")) return "Leaderboard";
    if (path.startsWith("/student/weekly-reports")) return "Weekly Reports";
    if (path.startsWith("/student/academic")) return "Academic";
    if (path.startsWith("/student/attendance")) return "Attendance";
    if (path.startsWith("/student/assessment")) return "Assessments";
    if (path.startsWith("/student/performance")) return "Performance";
    if (path.startsWith("/student/certificates")) return "Certificates";
    if (path.startsWith("/student/timetable")) return "Timetable";
    if (path.startsWith("/student/compiler")) return "Compiler / Code Editor";
    if (path.startsWith("/student/batches")) return "Batches";
    if (path.startsWith("/student/practice")) return "Practice Problems";
    if (path.startsWith("/student/notes")) return "Study Notes & Resources";
    if (path.startsWith("/student/coding-exam")) return "Coding Exam";
    if (path.startsWith("/student/exam-type-select")) return "Select Exam Type";
    if (path.startsWith("/student/mcq-exam")) return "MCQ Test";
    if (path.startsWith("/student/notifications")) return "Notifications";
    if (path.startsWith("/student/profile")) return "Profile";
    if (path.startsWith("/student/settings")) return "Settings";
    if (path.startsWith("/student/help")) return "Help & Support";
    if (path.startsWith("/student/coding-platform")) return "Coding Platform";
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
    <div className="student-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <StudentSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="student-content">
        <main className="student-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="student-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="student-header">
              <div className="student-header__left">
                <button
                  className="student-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
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
                    Sem 6
                  </span>
                </div>

                {/* Notification Bell Dropdown Wrap */}
                <div className="student-header__notif-wrap">
                  <button
                    className="student-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="student-header__bell-icon" />
                    {hasUnreadNotif && <span className="student-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="student-header__user-wrap">
                  <button
                    className="student-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="student-header__user-info">
                      <span className="student-header__name">{user.name}</span>
                      <span className="student-header__sub">{getShortDept(user.department)} · Sem {(user.year === "TE" || user.semester === 5 || !user.semester) ? 6 : user.semester}</span>
                    </div>
                    <div className="student-header__avatar" aria-label={`User profile ${user.name}`}>
                      {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GS"}
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="student-header__profile-dropdown">
                        <div className="student-header__profile-top">
                          <div className="student-header__profile-avatar">
                            {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GS"}
                          </div>
                          <div className="student-header__profile-info">
                            <span className="student-header__profile-name">{user.name}</span>
                            <span className="student-header__profile-sub">{getShortDept(user.department)} · Sem {(user.year === "TE" || user.semester === 5 || !user.semester) ? 6 : user.semester}</span>
                          </div>
                        </div>
                        <div className="student-header__profile-divider" />
                        <button
                          className="student-header__profile-item"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/student/profile");
                          }}
                        >
                          <UserCog size={15} />
                          Edit Profile
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
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Page Content Body */}
            <div className="student-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
