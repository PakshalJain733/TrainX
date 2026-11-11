import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Code2,
  FileCheck2,
  Trophy,
  HelpCircle,
  X
} from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import AppTooltip from "../../../components/ui/AppTooltip";
import SidebarNavGroups from "../../../components/Common/SidebarNavGroups";
import MobileDrawerFooter from "../../../components/Common/MobileDrawerFooter";
import { useMobileDrawer } from "../../../hooks/useMobileDrawer";
import "../Styles/TR_Sidebar.css";

function SidebarBrand({ collapsed, mobileOpen, subtitle }) {
  return (
    <Link
        to="/trainer"
        className="sidebar-brand"
      >
        <div className="sidebar-brand-logo-container">
          <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-brand-text">
            <div className="brand-row">
              <span className="brand-name1">Train</span>
              <img src={trainXImg} alt="X" className="brand-x-img-trainer" />
            </div>
            <span className="sidebar-brand-sub">{subtitle || "Trainer"}</span>
          </div>
        )}
      </Link>
  );
}

const navGroups = [
  {
    id: "training",
    label: "Delivery",
    items: [
      { title: "Overview", url: "/trainer", icon: LayoutDashboard, exact: true, moduleKey: "trainerOverview" },
      { title: "Batches", url: "/trainer/batches", icon: Users, moduleKey: "trainerBatches" },
      { title: "Add Batch Task", url: "/trainer/tasks", icon: Code2, moduleKey: "trainerTasks" },
    ],
  },
  {
    id: "evaluation",
    label: "Evaluation",
    items: [
      { title: "Submissions", url: "/trainer/submissions", icon: FileCheck2, moduleKey: "trainerSubmissions" },
      { title: "Leaderboard", url: "/trainer/leaderboard", icon: Trophy, moduleKey: "trainerLeaderboard" },
    ],
  },
];

const footerNavItems = [
  { title: "Support Ticket", url: "/trainer/help", icon: HelpCircle, moduleKey: "trainerHelp" },
];

export function TrainerSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();
  const userInfo = useMobileDrawer(mobileOpen, onClose, "Trainer");

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.moduleKey || isModuleActive(item.moduleKey)),
    }))
    .filter((group) => group.items.length > 0);

  const visibleFooterItems = footerNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );

  const isActive = (url, exact) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

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
            className={`sidebar-menu-btn-trainer ${
              active ? "sidebar-menu-btn-trainer--active" : ""
            }`}
            onClick={handleNavClick}
          >
            <item.icon size={18} className="sidebar-icon-trainer" />
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-label-trainer">{item.title}</span>
            )}
          </Link>
        </AppTooltip>
      </li>
    );
  };

  return (
    <aside
      className={`trainer-sidebar ${collapsed && !mobileOpen ? "sidebar--collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Header */}
      <div className="sidebar-header-trainer">
        <SidebarBrand collapsed={collapsed} mobileOpen={mobileOpen} subtitle="Trainer" />
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
          groups={visibleGroups}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isActive={isActive}
          renderItem={renderItem}
        />
      </div>

      {/* Pinned Bottom */}
      <div className="sidebar-footer">
        {(!collapsed || mobileOpen) && visibleFooterItems.length > 0 && (
          <div className="sidebar-footer-group-label">Support</div>
        )}
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
        <MobileDrawerFooter userInfo={userInfo} profileUrl="/trainer/profile" onClose={onClose} />
      </div>
    </aside>
  );
}

export default TrainerSidebar;
