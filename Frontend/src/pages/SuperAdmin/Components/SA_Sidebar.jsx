import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Code2,
  Users,
  UserCog,
  LineChart,
  SlidersHorizontal,
  Activity,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/SA_Sidebar.css";

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
            <img src={trainXImg} alt="X" className="brand-x-img-sa" />
          </div>
          <span className="sidebar-brand-sub">{subtitle || "Super Admin"}</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/super-admin", icon: LayoutDashboard, exact: true },
  { title: "Colleges", url: "/super-admin/colleges", icon: Building2 },
  { title: "Departments", url: "/super-admin/departments", icon: Briefcase },
  { title: "Batches", url: "/super-admin/batches", icon: Code2 },
  { title: "Manage Users", url: "/super-admin/users", icon: UserCog },
  { title: "Performance", url: "/super-admin/performance", icon: LineChart },
  { title: "Feature Switches", url: "/super-admin/maintenance", icon: SlidersHorizontal },
  { title: "System Health", url: "/super-admin/health", icon: Activity },
];

const footerNavItems = [
  { title: "Support Tickets", url: "/super-admin/tickets", icon: HelpCircle },
];

export default function SuperAdminSidebar({ collapsed, mobileOpen, onClose }) {
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
          className={`sidebar-menu-btn-sa ${active ? "sidebar-menu-btn-sa--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-sa" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-sa">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`sa-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
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

      {/* Pinned Bottom Support Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
