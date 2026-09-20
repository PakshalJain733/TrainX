import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  BookOpenCheck,
  Bot,
  LineChart,
  Trophy,
  CalendarCheck,
  FileCheck2,
  CalendarDays,
  Award,
  Code2,
  Terminal,
  BookOpen,
  Users,
  FileQuestion,
  HelpCircle,
  GraduationCap,
  Settings,
  UserCheck,
  BarChart3,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import "../Styles/StudentSidebar.css";

function SidebarBrand({ collapsed, subtitle }) {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-logo-container">
        <img src={logoImg} alt="Logo" className="sidebar-brand-logo" />
      </div>
      {!collapsed && (
        <div className="sidebar-brand-text">
          <div className="brand-row">
            <span className="brand-name1">Training</span>
            <span className="brand-name2">Portal</span>
          </div>
          {subtitle && <span className="sidebar-brand-sub">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard, exact: true },
  { title: "Batches", url: "/student/batches", icon: Code2 },
  { title: "AI Roadmap", url: "/student/roadmap", icon: Sparkles },
  { title: "Learning Content", url: "/student/learning", icon: BookOpenCheck },
  { title: "Practice", url: "/student/practice", icon: Terminal },
  { title: "AI Interview", url: "/student/ai-interview", icon: Bot },
  { title: "Quiz", url: "/student/quiz", icon: GraduationCap },
  { title: "Attendance", url: "/student/attendance", icon: CalendarCheck },
  { title: "Progress", url: "/student/progress", icon: BarChart3 },
  { title: "Weekly Reports", url: "/student/weekly-reports", icon: FileCheck2 },
];

const footerNavItems = [
  { title: "Settings", url: "/student/settings", icon: Settings },
  { title: "Support", url: "/student/help", icon: HelpCircle },
];

export function StudentSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();

  const isActive = (url, exact) =>
    exact
      ? pathname === url
      : pathname === url || pathname.startsWith(url + "/");

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const renderItem = (item) => {
    const active = isActive(item.url, item.exact);
    return (
      <li key={item.url} className="sidebar-menu-item">
        <Link
          to={item.url}
          className={`sidebar-menu-btn ${active ? "sidebar-menu-btn--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`student-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <SidebarBrand collapsed={collapsed} subtitle="Student Workspace" />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {primaryNavItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom Account Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
