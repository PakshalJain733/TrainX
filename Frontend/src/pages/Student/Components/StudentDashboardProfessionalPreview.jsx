import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  BookOpenCheck,
  Bot,
  LineChart,
  CalendarCheck,
  FileCheck2,
  Code2,
  Terminal,
  GraduationCap,
  Settings,
  HelpCircle,
  Gauge,
  Eye,
  Bell,
  PanelLeft,
  X,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import "../Styles/StudentDashboardProfessionalPreview.css";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

const getStoredUserName = () => {
  const u = getStoredUser();
  const name = u.name || "";
  const isAutoName =
    !name ||
    /^\d+$/.test(name.trim()) ||
    name.startsWith("User_") ||
    /^vu\d/i.test(name.trim());
  if (isAutoName) return u.fullName || u.full_name || "Pakshal";
  return name;
};

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const PRIMARY_ROUTE = "/student/dashboard-professional-preview";

const primaryNavItems = [
  {
    title: "Dashboard",
    url: "/student",
    icon: LayoutDashboard,
    activeFor: PRIMARY_ROUTE,
  },
  { title: "Batches", url: `${PRIMARY_ROUTE}/batches`, icon: Code2 },
  { title: "AI Roadmap", url: "/student/roadmap", icon: Sparkles },
  { title: "Learning Content", url: "/student/learning", icon: BookOpenCheck },
  { title: "Practice", url: "/student/practice", icon: Terminal },
  { title: "AI Interview", url: "/student/ai-interview", icon: Bot },
  { title: "Quiz", url: "/student/quiz", icon: GraduationCap },
  { title: "Progress", url: "/student/progress", icon: LineChart },
  { title: "Attendance", url: "/student/attendance", icon: CalendarCheck },
  { title: "Skill Gap Analysis", url: "/student/skill-gaps", icon: Gauge },
  { title: "Weekly Reports", url: "/student/weekly-reports", icon: FileCheck2 },
];

const footerNavItems = [
  { title: "Design Preview", url: "/student/dashboard-preview", icon: Eye },
  { title: "Settings", url: "/student/settings", icon: Settings },
  { title: "Support", url: "/student/help", icon: HelpCircle },
];

function getPageTitle(pathname) {
  if (pathname.startsWith(`${PRIMARY_ROUTE}/batches`)) return "Batches";
  return "Dashboard";
}

function Sidebar({ collapsed, mobileOpen, onClose, onToggle }) {
  const { pathname } = useLocation();

  const isActive = (item) => {
    if (item.url === "/student") return pathname === item.url || pathname === item.activeFor;
    return pathname === item.url || pathname.startsWith(item.url + "/");
  };

  const renderItem = (item) => (
    <Link
      key={item.url}
      to={item.url}
      className={`pp-nav-item ${isActive(item) ? "pp-nav-item--active" : ""}`}
      title={collapsed ? item.title : undefined}
      onClick={onClose}
    >
      <item.icon size={17} />
      {(!collapsed || mobileOpen) && <span>{item.title}</span>}
    </Link>
  );

  return (
    <aside
      className={`pp-sidebar ${collapsed ? "pp-sidebar--collapsed" : ""} ${mobileOpen ? "pp-sidebar--mobile-open" : ""}`}
    >
      <div className="pp-brand">
        <img src={logoImg} alt="Logo" className="pp-brand-logo" />
        {(!collapsed || mobileOpen) && (
          <div className="pp-brand-copy">
            <span className="pp-brand-name">
              Training <span className="accent">Portal</span>
            </span>
            <span className="pp-brand-sub">Student Workspace</span>
          </div>
        )}
      </div>

      <nav className="pp-nav">
        {(collapsed && !mobileOpen) ? null : <div className="pp-nav-label">Workspace</div>}
        {primaryNavItems.map(renderItem)}
        {(collapsed && !mobileOpen) ? null : <div className="pp-nav-label" style={{ marginTop: 10 }}>Account</div>}
        {footerNavItems.map(renderItem)}
      </nav>

      <div className="pp-sidebar-footer">
        <button className="pp-collapse-btn" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {mobileOpen ? <X size={17} /> : <PanelLeft size={17} />}
          {(!collapsed || mobileOpen) && <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>}
        </button>
      </div>
    </aside>
  );
}

export default function StudentDashboardProfessionalPreview() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentName, setStudentName] = useState(getStoredUserName());
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const syncUser = () => setStudentName(getStoredUserName());
    window.addEventListener("userProfileUpdated", syncUser);
    return () => window.removeEventListener("userProfileUpdated", syncUser);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  return (
    <div className="pp-root">
      <div className="pp-app">
        {mobileOpen && <div className="pp-backdrop" onClick={() => setMobileOpen(false)} />}

        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onToggle={toggleSidebar}
        />

        <div className="pp-main">
          <header className="pp-header">
            <div className="pp-header-left">
              <button className="pp-icon-btn" aria-label="Toggle sidebar" onClick={toggleSidebar}>
                <PanelLeft size={18} />
              </button>
              <span className="pp-page-title">{getPageTitle(pathname)}</span>
            </div>

            <div className="pp-header-right">
              <div className="pp-bell-wrap">
                <button
                  className="pp-icon-btn"
                  aria-label="Notifications"
                  onClick={() => navigate("/student/notifications")}
                >
                  <Bell size={18} />
                </button>
                <span className="pp-bell-dot" />
              </div>
              <button className="pp-account" onClick={() => navigate("/student/profile")}>
                <span className="pp-account-copy">
                  <span className="pp-account-name">{studentName}</span>
                  <span className="pp-account-role">Student</span>
                </span>
                <span className="pp-avatar">{getInitials(studentName)}</span>
              </button>
            </div>
          </header>

          <div className="pp-content">
            <div className="pp-content-inner">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}