import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  FileCheck2,
  LineChart,
  Briefcase,
  Inbox,
  FileSpreadsheet,
  Bell,
  Settings,
  HelpCircle,
  Code,
  Bot,
  AlertTriangle,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import "../Styles/CoordinatorSidebar.css";

function SidebarBrand({ collapsed, subtitle }) {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-logo-container">
        <img src={logoImg} alt="AcadNexus" className="sidebar-brand-logo" />
      </div>
      {!collapsed && (
        <div className="sidebar-brand-text">
          <div className="brand-row">
            <span className="brand-name1">Acad</span>
            <span className="brand-name2">Nexus</span>
          </div>
          {subtitle && <span className="sidebar-brand-sub">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Dashboard", url: "/coordinator", icon: LayoutDashboard, exact: true },
  { title: "Batches", url: "/coordinator/batches", icon: Users },
  { title: "Students", url: "/coordinator/students", icon: GraduationCap },
  { title: "Coding Performance", url: "/coordinator/coding-performance", icon: Code },
  { title: "AI Interviews & Feedback", url: "/coordinator/interviews", icon: Bot },
  { title: "Students Needing Support", url: "/coordinator/improvement", icon: AlertTriangle },
  { title: "Mentors & Trainers", url: "/coordinator/mentors", icon: UserCheck },
  { title: "Assessments & Quiz", url: "/coordinator/assessments", icon: FileCheck2 },
  { title: "Attendance Governance", url: "/coordinator/attendance", icon: LineChart },
  { title: "Placement Drives", url: "/coordinator/placement", icon: Briefcase },
  { title: "Requests & Approvals", url: "/coordinator/requests", icon: Inbox },
  { title: "Governance Reports", url: "/coordinator/reports", icon: FileSpreadsheet },
];

const footerNavItems = [
  { title: "Notifications", url: "/coordinator/notifications", icon: Bell },
  { title: "Settings & Profile", url: "/coordinator/profile", icon: Settings },
];

export function CoordinatorSidebar({ collapsed, mobileOpen, onClose }) {
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
    <aside className={`coordinator-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header">
        <SidebarBrand collapsed={collapsed} subtitle="Coordinator Workspace" />
      </div>

      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {primaryNavItems.map(renderItem)}
        </ul>
      </div>

      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
