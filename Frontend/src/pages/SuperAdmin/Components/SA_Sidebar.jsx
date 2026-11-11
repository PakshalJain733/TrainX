import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, UserCog, UserCheck, SlidersHorizontal, Activity, HelpCircle, X } from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import AppTooltip from "../../../components/ui/AppTooltip";
import SidebarNavGroups from "../../../components/Common/SidebarNavGroups";
import MobileDrawerFooter from "../../../components/Common/MobileDrawerFooter";
import { useMobileDrawer } from "../../../hooks/useMobileDrawer";
import "../Styles/SA_Sidebar.css";

function SidebarBrand({ collapsed, mobileOpen, subtitle }) {
  return (
    <Link
        to="/super-admin"
        className="sidebar-brand"
      >
        <div className="sidebar-brand-logo-container">
          <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-brand-text">
            <div className="brand-row">
              <span className="brand-name1">Train</span>
              <img src={trainXImg} alt="X" className="brand-x-img-sa" />
            </div>
            <span className="sidebar-brand-sub">{subtitle || "Super Admin"}</span>
          </div>
        )}
      </Link>
  );
}

const navGroups = [
  {
    id: "platform",
    label: "Platform",
    items: [
      { title: "Overview", url: "/super-admin", icon: LayoutDashboard, exact: true },
      { title: "Colleges", url: "/super-admin/colleges", icon: Building2 },
    ],
  },
  {
    id: "governance",
    label: "Users & Controls",
    items: [
      { title: "Manage Users", url: "/super-admin/users", icon: UserCog },
      { title: "Approve Registration", url: "/super-admin/approve-users", icon: UserCheck },
      { title: "Feature Switches", url: "/super-admin/maintenance", icon: SlidersHorizontal },
      { title: "System Health", url: "/super-admin/health", icon: Activity },
    ],
  },
];

const footerNavItems = [
  { title: "Support Tickets", url: "/super-admin/tickets", icon: HelpCircle },
];

export default function SuperAdminSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const userInfo = useMobileDrawer(mobileOpen, onClose, "Super Admin");

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
        <AppTooltip
          text={item.title}
          show={collapsed && !mobileOpen}
          position="right"
          isActive={active}
        >
          <Link
            to={item.url}
            className={`sidebar-menu-btn-sa ${active ? "sidebar-menu-btn-sa--active" : ""}`}
            onClick={handleNavClick}
          >
            <item.icon size={18} className="sidebar-icon-sa" />
            {(!collapsed || mobileOpen) && <span className="sidebar-label-sa">{item.title}</span>}
          </Link>
        </AppTooltip>
      </li>
    );
  };

  return (
    <aside className={`sa-sidebar ${collapsed && !mobileOpen ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <SidebarBrand collapsed={collapsed} mobileOpen={mobileOpen} subtitle="Super Admin" />
        <button
          type="button"
          className="mobile-drawer-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <SidebarNavGroups
          groups={navGroups}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isActive={isActive}
          renderItem={renderItem}
        />
      </div>

      {/* Pinned Bottom Support & Mobile Account Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {footerNavItems.map(renderItem)}
        </ul>
        <MobileDrawerFooter userInfo={userInfo} profileUrl="/super-admin/profile" onClose={onClose} />
      </div>
    </aside>
  );
}
