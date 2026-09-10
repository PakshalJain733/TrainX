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
  Megaphone,
  AlertTriangle,
  Trophy,
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
  { title: "Dashboard", url: "/coordinator", icon: LayoutDashboard, exact: true },
  { title: "Students", url: "/coordinator/students", icon: GraduationCap },
  { title: "Performances", url: "/coordinator/performances", icon: LineChart },
  { title: "Leaderboard", url: "/coordinator/leaderboard", icon: Trophy },
  { title: "Weekly Reports", url: "/coordinator/weekly-reports", icon: FileCheck2 },
  { title: "Students Needing Support", url: "/coordinator/improvement", icon: AlertTriangle },
  { title: "Placement Mock Drives", url: "/coordinator/placement", icon: Briefcase },
  { title: "Attendance Governance", url: "/coordinator/attendance", icon: CalendarCheck },
  { title: "Requests & Approvals", url: "/coordinator/requests", icon: Inbox },
];

const footerNavItems = [
  { title: "Broadcast Notice", url: "/coordinator/broadcast", icon: Megaphone },
  { title: "Support Tickets", url: "/coordinator/support", icon: HelpCircle },
];

export function CoordinatorSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();

  const isActive = (url, exact) => {
    if (url === "/coordinator/quizzes-and-codes") {
      return (
        pathname.startsWith("/coordinator/quizzes-and-codes") ||
        pathname.startsWith("/coordinator/assessments") ||
        pathname.startsWith("/coordinator/practice")
      );
    }
    if (url === "/coordinator/performances") {
      return (
        pathname.startsWith("/coordinator/performances") ||
        pathname.startsWith("/coordinator/coding-performance")
      );
    }
    return exact
      ? pathname === url
      : pathname === url || pathname.startsWith(url + "/");
  };

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
