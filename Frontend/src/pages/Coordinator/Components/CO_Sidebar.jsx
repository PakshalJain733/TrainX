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
  Megaphone,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/CO_Sidebar.css";

function SidebarBrand({ collapsed, mobileOpen, subtitle }) {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-logo-container">
        <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
      </div>
      {(!collapsed || mobileOpen) && (
        <div className="sidebar-brand-text">
          <div className="brand-row">
            <span className="brand-name1">Train</span>
            <img src={trainXImg} alt="X" className="brand-x-img-coordinator" />
          </div>
          {subtitle && <span className="sidebar-brand-sub">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/coordinator", icon: LayoutDashboard, exact: true },
  { title: "Students", url: "/coordinator/students", icon: Users },
  { title: "Performances", url: "/coordinator/performances", icon: LineChart },
  { title: "Academic Support", url: "/coordinator/improvement", icon: AlertTriangle },
  { title: "Attendance Governance", url: "/coordinator/attendance", icon: CalendarCheck },
  { title: "Requests & Approvals", url: "/coordinator/requests", icon: Inbox },
  { title: "Broadcast Notice Center", url: "/coordinator/broadcast", icon: Megaphone },
];

const footerNavItems = [
  { title: "Support Ticket", url: "/coordinator/help", icon: HelpCircle },
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
          className={`sidebar-menu-btn-coordinator ${active ? "sidebar-menu-btn-coordinator--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-coordinator" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-coordinator">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`coordinator-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header-coordinator">
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
