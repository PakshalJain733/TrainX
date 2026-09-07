import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { PanelLeft, Bell, Search, Sparkles, UserCog, LogOut, Check, Calendar, AlertTriangle, CheckCircle2, FileText, Trash2 } from 'lucide-react';
import Sidebar from '../../components/SuperAdmin/Sidebar';
import AIRiskAuditModal from '../../components/SuperAdmin/AIRiskAuditModal';
import './SuperAdmin.css';

function NotificationDropdown({ onClose, onUnreadChange }) {
  const sampleNotifications = [
    { id: 1, type: "alert", title: "4 Admin Verification Requests Pending", time: "10 min ago", unread: true },
    { id: 2, type: "success", title: "Apex Institute of Tech batch sync complete", time: "1h ago", unread: true },
    { id: 3, type: "document", title: "Monthly Cross-College Placement Audit ready", time: "3h ago", unread: false },
  ];

  const getIcon = (type) => {
    switch (type) {
      case "calendar": return <Calendar size={16} className="notif-icon-calendar" />;
      case "alert": return <AlertTriangle size={16} className="notif-icon-alert" />;
      case "success": return <CheckCircle2 size={16} className="notif-icon-success" />;
      case "document": return <FileText size={16} className="notif-icon-document" />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="sa-header__profile-dropdown notif-dropdown-box">
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-header-icon-wrap">
            <Bell size={18} className="notif-header-icon" />
            <span className="notif-header-dot"></span>
          </div>
          <div className="notif-header-text">
            <div className="notif-header-title">Super Admin Alerts</div>
            <div className="notif-header-subtitle">2 unread notifications</div>
          </div>
        </div>
        <button className="notif-mark-read-btn" onClick={() => onUnreadChange && onUnreadChange(false)}>
          <Check size={14} className="notif-check-icon" /> Mark read
        </button>
      </div>

      <div className="notif-tabs">
        <button className="notif-tab active">All (3)</button>
        <button className="notif-tab">Unread (2)</button>
      </div>

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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
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
    if (path === "/super-admin" || path === "/super-admin/") return "Super Admin Dashboard";
    if (path.startsWith("/super-admin/colleges")) return "Institutions & Colleges";
    if (path.startsWith("/super-admin/departments")) return "Academic Departments";
    if (path.startsWith("/super-admin/batches")) return "Cross-Campus Batches";
    if (path.startsWith("/super-admin/verification")) return "Admin Verifications";
    if (path.startsWith("/super-admin/coordinators")) return "Coordinators Management";
    if (path.startsWith("/super-admin/mentors")) return "Mentors & Trainers";
    if (path.startsWith("/super-admin/students")) return "Student Directory & Risk";
    if (path.startsWith("/super-admin/performance")) return "Performance Analytics";
    if (path.startsWith("/super-admin/attendance")) return "Institutional Attendance";
    if (path.startsWith("/super-admin/ai-roadmaps")) return "AI Career Roadmaps";
    if (path.startsWith("/super-admin/ai-interviews")) return "AI Interview Analytics";
    if (path.startsWith("/super-admin/mock-drives")) return "Mock Placement Drives";
    if (path.startsWith("/super-admin/weekly-reports")) return "Weekly Governance Reports";
    if (path.startsWith("/super-admin/profile")) return "Edit Profile";
    return "Super Admin Dashboard";
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="sa-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="sa-content">
        <main className="sa-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="sa-page-card">

            {/* Integrated Header Bar Inside the Card */}
            <header className="sa-header">
              <div className="sa-header__left">
                <button
                  className="sa-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="sa-breadcrumb">
                  <span className="sa-breadcrumb-active">{getPageTitle(pathname)}</span>
                </div>
              </div>

              <div className="sa-header__right" ref={headerRightRef}>
                {/* Notification Bell */}
                <div className="sa-header__notif-wrap">
                  <button
                    className="sa-header__icon-btn"
                    aria-label="Notifications"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={21} className="sa-header__bell-icon" />
                    {hasUnreadNotif && <span className="sa-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown
                      onClose={() => setNotifOpen(false)}
                      onUnreadChange={(hasUnread) => setHasUnreadNotif(hasUnread)}
                    />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div className="sa-header__user-wrap">
                  <button
                    className="sa-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                    aria-label="User menu"
                  >
                    <div className="sa-header__user-info">
                      <span className="sa-header__name">Dr. Sara Rao</span>
                    </div>
                    <div className="sa-header__avatar" aria-label="Dr. Sara Rao">
                      SR
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="sa-header__profile-dropdown">
                      <div className="sa-header__profile-top">
                        <div className="sa-header__profile-avatar">SR</div>
                        <div className="sa-header__profile-info">
                          <span className="sa-header__profile-name">Dr. Sara Rao</span>
                          <span className="sa-header__profile-sub">Super Admin</span>
                        </div>
                      </div>
                      <div className="sa-header__profile-divider" />
                      <Link
                        to="/super-admin/profile"
                        className="sa-header__profile-item"
                        style={{ textDecoration: 'none' }}
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserCog size={15} />
                        Edit Profile
                      </Link>
                      <div className="sa-header__profile-divider" />
                      <button
                        className="sa-header__profile-item sa-header__profile-item--danger"
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
            <div className="sa-card-body">
              <Outlet />
            </div>

          </div>
        </main>
      </div>

      <AIRiskAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
