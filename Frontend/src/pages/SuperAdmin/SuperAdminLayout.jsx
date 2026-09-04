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

function NotificationDropdown({ onClose }) {
  const sampleNotifications = [
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
  ];

  return (
    <div className="superadmin-header__profile-dropdown" style={{ width: "320px", padding: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "normal", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Bell size={16} style={{ color: "#4f46e5" }} />
          <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>Super Admin Alerts</span>
        </div>
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
              border: "1px solid",
              borderColor: n.unread ? "#bfdbfe" : "#e2e8f0",
              fontSize: "12px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1e293b" }}>{n.title}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{n.desc}</div>
            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{n.time}</div>
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
