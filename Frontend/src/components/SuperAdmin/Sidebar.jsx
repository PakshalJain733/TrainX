import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Calendar,
  Users,
  TrendingUp,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import logoImg from "../../assets/Logo.png";
import "../../pages/SuperAdmin/Styles/SuperAdmin.css";
import '../../pages/SuperAdmin/Styles/SuperAdminSidebar.css';

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
          <span className="sidebar-brand-sub">Super Admin</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/super-admin", icon: LayoutDashboard, exact: true },
  { title: "Colleges", url: "/super-admin/colleges", icon: Building2 },
  { title: "Departments", url: "/super-admin/departments", icon: Briefcase },
  { title: "Batches", url: "/super-admin/batches", icon: Calendar },
  { title: "Manage Users", url: "/super-admin/users", icon: Users },
  { title: "Performance", url: "/super-admin/performance", icon: TrendingUp },
  { title: "Feature Switches", url: "/super-admin/maintenance", icon: SlidersHorizontal },
  { title: "System Health", url: "/super-admin/health", icon: Activity },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
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
    </aside>
  );
}
