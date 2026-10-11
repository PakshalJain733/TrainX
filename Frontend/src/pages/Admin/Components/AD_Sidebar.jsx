import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserCog, UserCheck, UserPlus, CalendarCheck, BookOpenCheck, GraduationCap, Terminal, LineChart, Trophy, FileCheck2, HelpCircle, Megaphone, Code2, AlertTriangle, AlertCircle, Briefcase, Award } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/AD_Sidebar.css";

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
            <img src={trainXImg} alt="X" className="brand-x-img-admin" />
          </div>
          <span className="sidebar-brand-sub">{subtitle || "Training Portal"}</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true, moduleKey: "adminDashboard" },
  { title: "Manage Users", url: "/admin/users", icon: UserCog, moduleKey: "manageUsers" },
  { title: "Approve Users", url: "/admin/approve-users", icon: UserCheck, moduleKey: "adminBulkUserImport" },
  { title: "Trainings & Enrollments", url: "/admin/trainings", icon: Briefcase, moduleKey: "adminC2C" },
  { title: "Batches", url: "/admin/batches", icon: Code2, moduleKey: "adminBatches" },
  { title: "Departments", url: "/admin/departments", icon: Briefcase, moduleKey: "adminDepartments" },
  { title: "Manage Content", url: "/admin/learning", icon: BookOpenCheck, moduleKey: "adminLearningContent" },
  { title: "Coding Practice", url: "/admin/practice", icon: Terminal, moduleKey: "adminPracticeProblems" },
  { title: "Manage Quizzes", url: "/admin/quiz", icon: GraduationCap, moduleKey: "adminQuizzes" },
  { title: "Student Progress", url: "/admin/progress", icon: LineChart, moduleKey: "adminProgress" },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: Trophy, moduleKey: "adminLeaderboard" },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck, moduleKey: "adminAttendance" },
  { title: "Weekly Reports", url: "/admin/weekly-reports", icon: FileCheck2, moduleKey: "adminWeeklyReports" },
  { title: "Defaulters", url: "/admin/defaulters", icon: AlertTriangle, moduleKey: "defaulters" },
];

const footerNavItems = [
  { title: "Broadcast Notice", url: "/admin/broadcast", icon: Megaphone, moduleKey: "adminBroadcast" },
  { title: "Support Tickets", url: "/admin/help", icon: HelpCircle, moduleKey: "adminHelp" },
];

export function AdminSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();

  const visiblePrimaryItems = primaryNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );
  const visibleFooterItems = footerNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );

  const isActive = (url, exact) => {
    if (url === "/admin/trainings" && (pathname === "/admin/c2c" || pathname.startsWith("/admin/c2c/"))) return true;
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
          className={`sidebar-menu-btn-admin ${active ? "sidebar-menu-btn-admin--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-admin" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-admin">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header-admin">
        <SidebarBrand collapsed={collapsed} subtitle="Training Portal" />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {visiblePrimaryItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom Support Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
