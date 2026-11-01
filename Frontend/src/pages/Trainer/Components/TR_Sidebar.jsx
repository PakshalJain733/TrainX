import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Code2,
  FileCheck2,
  Trophy,
  UserCheck,
  PlusCircle,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import "../Styles/TR_Sidebar.css";

const trainerNav = [
  { title: "Overview", url: "/trainer", icon: LayoutDashboard, exact: true },
  { title: "My Batches", url: "/trainer/batches", icon: Users },
  { title: "Batch Tasks & Code", url: "/trainer/tasks", icon: Code2 },
  { title: "Submissions & Reviews", url: "/trainer/submissions", icon: FileCheck2 },
  { title: "Leaderboard", url: "/trainer/leaderboard", icon: Trophy },
  { title: "Trainer Profile", url: "/trainer/profile", icon: UserCheck },
];

export function TrainerSidebar({ collapsed, mobileOpen, onClose, onOpenJoinModal }) {
  const { pathname } = useLocation();

  const isActive = (url, exact) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`trainer-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Header */}
      <div className="sidebar-header-trainer">
        <div className="trainer-brand-row">
          <img src={logoImg} alt="TrainX" className="trainer-brand-logo" />
          {!collapsed && (
            <div>
              <div className="trainer-brand-title">
                Train<span className="trainer-brand-x">X</span>
              </div>
              <span className="trainer-brand-badge">Trainer Workspace</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="trainer-sidebar-nav">
        {!collapsed && <span className="trainer-nav-section-title">Main Portal</span>}
        {trainerNav.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`trainer-nav-item ${active ? "trainer-nav-item--active" : ""}`}
              onClick={handleNavClick}
              title={collapsed ? item.title : undefined}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <div className="trainer-sidebar-action-wrap">
            <button
              type="button"
              className="trainer-sidebar-join-btn"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenJoinModal) onOpenJoinModal();
              }}
            >
              <PlusCircle size={15} /> Join Batch via Code
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="trainer-sidebar-footer">
          <div className="trainer-sidebar-version">
            TrainX Enterprise • v2.8
          </div>
        </div>
      )}
    </aside>
  );
}

export default TrainerSidebar;
