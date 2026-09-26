import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarCheck,
  BookOpenCheck,
  GraduationCap,
  Terminal,
  LineChart,
  Trophy,
  FileCheck2,
  HelpCircle,
  Megaphone,
  Code2,
  AlertTriangle,
  AlertCircle,
  Briefcase,
  Award
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/AD_Sidebar.css";

function SidebarBrand({ collapsed, subtitle }) {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-logo-container">
        <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
      </div>
      {!collapsed && (
        <div className="sidebar-brand-text">
          <div className="brand-row">
            <span className="brand-name1">Train</span>
            <img src={trainXImg} alt="X" className="brand-x-img-admin" />
          </div>
          {subtitle && <span className="sidebar-brand-sub">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Manage Users", url: "/admin/users", icon: UserCog },
  { title: "C2C Enrollments", url: "/admin/c2c", icon: Briefcase },
  { title: "Batches", url: "/admin/batches", icon: Code2 },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Manage Content", url: "/admin/learning", icon: BookOpenCheck },
  { title: "Manage Quizzes", url: "/admin/quiz", icon: GraduationCap },
  { title: "Coding Practice", url: "/admin/practice", icon: Terminal },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: Trophy },
  { title: "Student Progress", url: "/admin/progress", icon: LineChart },
  { title: "Weekly Reports", url: "/admin/weekly-reports", icon: FileCheck2 },
  { title: "Defaulters", url: "/admin/defaulters", icon: AlertTriangle },
  // { title: "Mock Drives", url: "/admin/mock-drives", icon: Briefcase },
];

const footerNavItems = [
  { title: "Broadcast Notice", url: "/admin/broadcast", icon: Megaphone },
  { title: "Support Tickets", url: "/admin/help", icon: HelpCircle },
];

export function AdminSidebar({ collapsed, mobileOpen, onClose }) {
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
          className={`sidebar-menu-btn-admin ${active ? "sidebar-menu-btn-admin--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-admin" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-admin">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header-admin">
        <SidebarBrand collapsed={collapsed} subtitle="Admin Workspace" />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {primaryNavItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom Support Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
