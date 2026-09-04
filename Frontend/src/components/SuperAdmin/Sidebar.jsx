import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  TrendingUp,
  CalendarCheck,
  Target,
  Sparkles,
  ClipboardCheck,
  FileText,
  SlidersHorizontal,
  Shield,
  Settings,
  HelpCircle,
} from "lucide-react";
import logoImg from "../../assets/Logo.png";
import "../../pages/SuperAdmin/Styles/SuperAdminSidebar.css";

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

const navigationGroups = [
  {
    title: "ORGANIZATION",
    items: [
      { name: "Overview", path: "/super-admin", exact: true, icon: LayoutDashboard },
      { name: "Colleges", path: "/super-admin/colleges", icon: Building2 },
      { name: "Departments", path: "/super-admin/departments", icon: Briefcase, badge: "86" },
      { name: "Batches", path: "/super-admin/batches", icon: Calendar, badge: "96" },
    ],
  },
  {
    title: "PEOPLE & ACCESS",
    items: [
      { name: "Admin verification", path: "/super-admin/verification", icon: ShieldCheck, badge: "04" },
      { name: "Coordinators", path: "/super-admin/coordinators", icon: UserCheck, badge: "42" },
      { name: "Mentors & trainers", path: "/super-admin/mentors", icon: GraduationCap, badge: "86" },
      { name: "Students", path: "/super-admin/students", icon: Users, badge: "3.8k" },
    ],
  },
  {
    title: "MONITORING",
    items: [
      { name: "Performance", path: "/super-admin/performance", icon: TrendingUp },
      { name: "Attendance", path: "/super-admin/attendance", icon: CalendarCheck },
    ],
  },
  {
    title: "SYSTEM CONTROL",
    items: [
      { name: "Maintenance controls", path: "/super-admin/maintenance", icon: SlidersHorizontal, badge: "On/Off" },
    ],
  },
  {
    title: "AI SYSTEMS",
    items: [
      { name: "AI roadmaps", path: "/super-admin/ai-roadmaps", icon: Target },
      { name: "AI interviews", path: "/super-admin/ai-interviews", icon: Sparkles },
      { name: "Mock drives", path: "/super-admin/mock-drives", icon: ClipboardCheck },
      { name: "Weekly reports", path: "/super-admin/weekly-reports", icon: FileText },
    ],
  },
];

export function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(item.path + "/");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`superadmin-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <SidebarBrand collapsed={collapsed} subtitle="Super Admin Workspace" />
      </div>

      {/* Navigation List */}
      <div className="sidebar-content">
        {navigationGroups.map((group) => (
          <div key={group.title} className="sidebar-group">
            {(!collapsed || mobileOpen) && (
              <div className="sidebar-group-title">{group.title}</div>
            )}
            <ul className="sidebar-menu">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.path} className="sidebar-menu-item">
                    <Link
                      to={item.path}
                      className={`sidebar-menu-btn ${
                        active ? "sidebar-menu-btn--active" : ""
                      }`}
                      title={collapsed ? item.name : undefined}
                      onClick={handleNavClick}
                    >
                      <div className="flex items-center">
                        <Icon size={18} className="sidebar-icon" />
                        {(!collapsed || mobileOpen) && (
                          <span className="sidebar-label">{item.name}</span>
                        )}
                      </div>
                      {(!collapsed || mobileOpen) && item.badge && (
                        <span className="sidebar-badge">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
