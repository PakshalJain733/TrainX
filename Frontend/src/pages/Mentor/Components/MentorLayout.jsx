import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Bell, PanelLeft, UserCog, LogOut } from "lucide-react";
import { MentorSidebar } from "./MentorSidebar";
import { mentorProfile } from "../../../data/mentorMockData";
import "../Styles/MentorLayout.css";

function NotificationDropdown({ onClose }) {
  const notifications = [
    { id: 1, title: "12 Assignment Submissions Pending Grading", time: "15 min ago", unread: true },
    { id: 2, title: "Live Class scheduled for 02:00 PM Today", time: "1h ago", unread: true },
    { id: 3, title: "Weekly Governance Report Approved", time: "3h ago", unread: false },
  ];

  return (
    <div className="mentor-header__profile-dropdown notif-dropdown-box">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
        <span className="font-bold text-xs text-slate-800">Mentor Alerts</span>
        <button className="text-[11px] font-semibold text-indigo-600 hover:underline">Mark read</button>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <p className="font-semibold text-slate-900">{n.title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MentorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
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
                >
                  <PanelLeft size={20} />
                </button>

                <div className="mentor-breadcrumb">
                  <span className="mentor-breadcrumb-item">AcadNexus</span>
                  <span className="mentor-breadcrumb-sep">/</span>
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
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                  >
                    <Bell size={20} />
                    <span className="mentor-header__notification-dot"></span>
                  </button>

                  {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                </div>

                {/* Profile section with dropdown */}
                <div className="mentor-header__user-wrap">
                  <button
                    className="mentor-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                  >
                    <div className="mentor-header__user-info">
                      <span className="mentor-header__name">{mentorProfile.name}</span>
                      <span className="mentor-header__sub">{mentorProfile.specialization}</span>
                    </div>
                    <div className="mentor-header__avatar">
                      VS
                    </div>
                  </button>

                  {profileOpen && (
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
