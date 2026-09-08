import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Bell,
  PanelLeft,
  UserCog,
  LogOut,
  Shield,
  Sparkles,
  SlidersHorizontal,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Sidebar from "../../components/SuperAdmin/Sidebar";
import AIRiskAuditModal from "../../components/SuperAdmin/AIRiskAuditModal";
import "./Styles/SuperAdminLayout.css";

function NotificationDropdown({ onClose, onUnreadChange }) {
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "alert",
      title: "New College Verification Request",
      desc: "Apex Institute of Technology requested admin access approval.",
      time: "10 min ago",
      unread: true,
    },
    {
      id: 2,
      type: "success",
      title: "AI Interview Engine Calibrated",
      desc: "Latest v3.2 model update deployed across 4 colleges.",
      time: "45 min ago",
      unread: true,
    },
    {
      id: 3,
      type: "document",
      title: "Weekly Governance Audit Ready",
      desc: "Week 35 platform-wide attendance and defaulter summary generated.",
      time: "2 hours ago",
      unread: false,
    },
    {
      id: 4,
      type: "calendar",
      title: "Platform Maintenance Schedule",
      desc: "Scheduled database backup and optimization at 02:00 AM UTC.",
      time: "5 hours ago",
      unread: false,
    },
  ]);

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

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    if (onUnreadChange) onUnreadChange(false);
  };

  const deleteNotif = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filteredList = notifications.filter((n) =>
    activeTab === "Unread" ? n.unread : true
  );

  return (
    <div className="superadmin-header__profile-dropdown notif-dropdown-box" style={{ width: "380px", right: 0, padding: "16px" }}>
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-header-icon-wrap">
            <Bell size={18} className="notif-header-icon" />
            {unreadCount > 0 && <span className="notif-header-dot" />}
          </div>
          <div className="notif-header-text">
            <div className="notif-header-title">Super Admin Alerts</div>
            <div className="notif-header-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : "All caught up"}
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-read-btn" onClick={markAllRead}>
            <Check size={14} className="notif-check-icon" /> Mark read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${activeTab === "All" ? "active" : ""}`}
          onClick={() => setActiveTab("All")}
        >
          All ({notifications.length})
        </button>
        <button
          className={`notif-tab ${activeTab === "Unread" ? "active" : ""}`}
          onClick={() => setActiveTab("Unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="notif-list-wrap" style={{ maxHeight: "320px", overflowY: "auto" }}>
        {filteredList.map((n) => (
          <div key={n.id} className={`notif-list-card ${n.unread ? "unread" : ""}`}>
            <div className={`notif-icon-box type-${n.type}`}>{getIcon(n.type)}</div>
            <div className="notif-content">
              <div className="notif-content-top">
                <div className="notif-card-title">{n.title}</div>
                <div className="notif-card-time">{n.time}</div>
                <button
                  className="notif-delete-btn"
                  onClick={() => deleteNotif(n.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="notif-card-desc">{n.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="notif-footer-wrap">
        <button className="notif-clear-all-btn" onClick={() => setNotifications([])}>
          Clear all alerts
        </button>
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
    if (path === "/super-admin" || path === "/super-admin/") return "Overview Dashboard";
    if (path.startsWith("/super-admin/colleges")) return "Colleges Governance";
    if (path.startsWith("/super-admin/departments")) return "Departments Oversight";
    if (path.startsWith("/super-admin/batches")) return "Batches Governance";
    if (path.startsWith("/super-admin/verification")) return "Admin Verification";
    if (path.startsWith("/super-admin/coordinators")) return "Coordinators Governance";
    if (path.startsWith("/super-admin/mentors")) return "Mentors & Trainers";
    if (path.startsWith("/super-admin/students")) return "Student Directory & Risk";
    if (path.startsWith("/super-admin/maintenance")) return "Maintenance Controls";
    if (path.startsWith("/super-admin/performance")) return "Performance Analytics";
    if (path.startsWith("/super-admin/attendance")) return "Attendance Governance";
    if (path.startsWith("/super-admin/coding-practice")) return "Global Coding Practice Monitoring";
    if (path.startsWith("/super-admin/ai-roadmaps")) return "AI Roadmaps System";
    if (path.startsWith("/super-admin/ai-interviews")) return "AI Mock Interviews";
    if (path.startsWith("/super-admin/mock-drives")) return "Mock Placement Drives";
    if (path.startsWith("/super-admin/weekly-reports")) return "Weekly Audit Reports";
    return "Super Admin Workspace";
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
    <div className="superadmin-layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Workspace Shell */}
      <div className="superadmin-content">
        <main className="superadmin-main">
          {/* ONE BIG ROUNDED CORNER CARD CONTAINING HEADER & CONTENT */}
          <div className="superadmin-page-card">
            {/* Integrated Header Bar inside Card */}
            <header className="superadmin-header">
              <div className="superadmin-header__left">
                <button
                  className="superadmin-header__sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <PanelLeft size={20} />
                </button>

                <div className="superadmin-breadcrumb">
                  <span className="superadmin-breadcrumb-active">{pageTitle}</span>
                </div>
              </div>

              <div className="superadmin-header__right" ref={headerRightRef}>
                {/* AI Risk Audit Action */}
                <button
                  onClick={() => setIsAuditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition border border-indigo-200/60 cursor-pointer"
                >
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>AI Risk Audit</span>
                </button>

                {/* Notifications Dropdown Wrap */}
                <div style={{ position: "relative" }}>
                  <button
                    className="superadmin-header__icon-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      setNotifOpen((o) => !o);
                    }}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {hasUnreadNotif && <span className="superadmin-header__notification-dot"></span>}
                  </button>

                  {notifOpen && (
                    <NotificationDropdown onClose={() => setNotifOpen(false)} />
                  )}
                </div>

                {/* Profile section with dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    className="superadmin-header__user"
                    onClick={() => {
                      setNotifOpen(false);
                      setProfileOpen((o) => !o);
                    }}
                  >
                    <div className="superadmin-header__user-info">
                      <span className="superadmin-header__name">Dr. Sara Rao</span>
                    </div>
                    <div className="superadmin-header__avatar">SR</div>
                  </button>

                  {profileOpen && (
                    <div className="superadmin-header__profile-dropdown">
                      <div className="superadmin-header__profile-top">
                        <div className="superadmin-header__profile-avatar">SR</div>
                        <div className="superadmin-header__profile-info">
                          <span className="superadmin-header__profile-name">Dr. Sara Rao</span>
                          <span className="superadmin-header__profile-sub">Super Admin</span>
                        </div>
                      </div>
                      <div className="superadmin-header__profile-divider" />
                      <button
                        className="superadmin-header__profile-item"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/super-admin/maintenance");
                        }}
                      >
                        <SlidersHorizontal size={15} />
                        Maintenance Controls
                      </button>
                      <button
                        className="superadmin-header__profile-item superadmin-header__profile-item--danger"
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

            {/* Scrollable Page Body */}
            <div className="superadmin-card-body">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* AI Risk Audit Modal */}
      <AIRiskAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
