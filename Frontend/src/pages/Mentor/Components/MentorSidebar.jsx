import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Target,
  Bot,
  CalendarCheck,
  Trophy,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  FileCheck2,
  HelpCircle,
  Layers,
  Megaphone,
  Briefcase,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import "../Styles/MentorSidebar.css";

function SidebarBrand({ collapsed }) {
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
          <span className="sidebar-brand-sub">Mentor Workspace</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/mentor", icon: LayoutDashboard, exact: true },
  { title: "Allocated Batches", url: "/mentor/batches", icon: Layers },
  { title: "Quizzes", url: "/mentor/quizzes", icon: FileCheck2 },
  { title: "Students", url: "/mentor/students", icon: Users },
  { title: "Roadmaps", url: "/mentor/roadmaps", icon: Target },
  { title: "AI Interviews", url: "/mentor/ai-interviews", icon: Bot },
  { title: "Skill Gaps", url: "/mentor/skill-gaps", icon: AlertTriangle },
  { title: "Attendance", url: "/mentor/attendance", icon: CalendarCheck },
  { title: "Leaderboard", url: "/mentor/leaderboard", icon: Trophy },
  { title: "Defaulters", url: "/mentor/defaulters", icon: AlertCircle },
  { title: "Mock Drives", url: "/mentor/mock-drives", icon: Briefcase },
  { title: "Study Material", url: "/mentor/study-material", icon: BookOpen },
  { title: "Weekly Reports", url: "/mentor/weekly-reports", icon: FileCheck2 },
];

const footerNavItems = [
  { title: "Broadcast Notice", url: "/mentor/broadcast", icon: Megaphone },
  { title: "Support Tickets", url: "/mentor/help", icon: HelpCircle },
];

export function MentorSidebar({ collapsed, mobileOpen, onClose }) {
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
    <aside className={`mentor-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <SidebarBrand collapsed={collapsed} />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {primaryNavItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
