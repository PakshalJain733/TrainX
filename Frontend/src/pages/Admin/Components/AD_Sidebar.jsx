import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UserCog, UserCheck, CalendarCheck, BookOpenCheck, GraduationCap, Terminal, LineChart, Trophy, FileCheck2, HelpCircle, Megaphone, Code2, AlertTriangle, Briefcase, Zap, X } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import AppTooltip from "../../../components/ui/AppTooltip";
import SidebarNavGroups from "../../../components/Common/SidebarNavGroups";
import MobileDrawerFooter from "../../../components/Common/MobileDrawerFooter";
import { useMobileDrawer } from "../../../hooks/useMobileDrawer";
import "../Styles/AD_Sidebar.css";

function SidebarBrand({ collapsed, mobileOpen, subtitle }) {
  return (
    <Link
        to="/admin"
        className="sidebar-brand"
      >
        <div className="sidebar-brand-logo-container">
          <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-brand-text">
            <div className="brand-row">
              <span className="brand-name1">Train</span>
              <img src={trainXImg} alt="X" className="brand-x-img-admin" />
            </div>
            <span className="sidebar-brand-sub">{subtitle || "Admin"}</span>
          </div>
        )}
      </Link>
  );
}

const navGroups = [
  {
    id: "core",
    label: "Core & Users",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true, moduleKey: "adminDashboard" },
      { title: "Manage Users", url: "/admin/users", icon: UserCog, moduleKey: "manageUsers" },
      { title: "Approve Users", url: "/admin/approve-users", icon: UserCheck, moduleKey: "adminApproveUsers" },
      { title: "Departments", url: "/admin/departments", icon: Briefcase, moduleKey: "adminDepartments" },
    ],
  },
  {
    id: "academics",
    label: "Training & Content",
    items: [
      { title: "Trainings & Enrollments", url: "/admin/trainings", icon: Briefcase, moduleKey: "adminC2CEnrollments" },
      { title: "Batches", url: "/admin/batches", icon: Code2, moduleKey: "adminBatches" },
      { title: "Manage Content", url: "/admin/learning", icon: BookOpenCheck, moduleKey: "adminLearningContent" },
      { title: "Coding Practice", url: "/admin/practice", icon: Terminal, moduleKey: "adminPracticeProblems" },
      { title: "Manage Quizzes", url: "/admin/quiz", icon: GraduationCap, moduleKey: "adminQuizzes" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Sync",
    items: [
      { title: "Student Progress", url: "/admin/progress", icon: LineChart, moduleKey: "adminProgress" },
      { title: "Leaderboard", url: "/admin/leaderboard", icon: Trophy, moduleKey: "adminLeaderboard" },
      { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck, moduleKey: "adminAttendance" },
      { title: "Weekly Reports", url: "/admin/weekly-reports", icon: FileCheck2, moduleKey: "adminWeeklyReports" },
      { title: "Defaulters", url: "/admin/defaulters", icon: AlertTriangle, moduleKey: "defaulters" },
      { title: "Career Gateway Sync", url: "/admin/career-gateway", icon: Zap, moduleKey: "adminCareerGatewaySync" },
    ],
  },
];

const footerNavItems = [
  { title: "Broadcast Notice", url: "/admin/broadcast", icon: Megaphone, moduleKey: "adminBroadcast" },
  { title: "Support Tickets", url: "/admin/help", icon: HelpCircle, moduleKey: "adminHelp" },
];

export function AdminSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();
  const userInfo = useMobileDrawer(mobileOpen, onClose, "Admin");

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.moduleKey || isModuleActive(item.moduleKey)),
    }))
    .filter((group) => group.items.length > 0);

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
        <AppTooltip
          text={item.title}
          show={collapsed && !mobileOpen}
          position="right"
          isActive={active}
        >
          <Link
            to={item.url}
            className={`sidebar-menu-btn-admin ${active ? "sidebar-menu-btn-admin--active" : ""}`}
            onClick={handleNavClick}
          >
            <item.icon size={18} className="sidebar-icon-admin" />
            {(!collapsed || mobileOpen) && <span className="sidebar-label-admin">{item.title}</span>}
          </Link>
        </AppTooltip>
      </li>
    );
  };

  return (
    <aside className={`admin-sidebar ${collapsed && !mobileOpen ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header-admin">
        <SidebarBrand collapsed={collapsed} mobileOpen={mobileOpen} subtitle="Admin" />
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

      {/* Pinned Bottom Support & Mobile Account Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
        <MobileDrawerFooter userInfo={userInfo} profileUrl="/admin/profile" onClose={onClose} />
      </div>
    </aside>
  );
}
