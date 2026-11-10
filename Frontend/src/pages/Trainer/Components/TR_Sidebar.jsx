import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Code2,
  FileCheck2,
  Trophy,
  HelpCircle
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import AppTooltip from "../../../components/ui/AppTooltip";
import "../Styles/TR_Sidebar.css";

function SidebarBrand({ collapsed, subtitle }) {
  return (
    <Link
        to="/trainer"
        className="sidebar-brand"
        style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
      >
        <div className="sidebar-brand-logo-container">
          <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
        </div>
        {!collapsed && (
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

const primaryNavItems = [
  { title: "Overview", url: "/trainer", icon: LayoutDashboard, exact: true },
  { title: "Batches", url: "/trainer/batches", icon: Users },
  { title: "Add Batch Task", url: "/trainer/tasks", icon: Code2 },
  { title: "Submissions", url: "/trainer/submissions", icon: FileCheck2 },
  { title: "Leaderboard", url: "/trainer/leaderboard", icon: Trophy },
];

const footerNavItems = [
  { title: "Support Ticket", url: "/trainer/help", icon: HelpCircle },
];

export function TrainerSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();

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
      className={`trainer-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Header */}
      <div className="sidebar-header-trainer">
        <SidebarBrand collapsed={collapsed} subtitle="Trainer" />
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

export default TrainerSidebar;
