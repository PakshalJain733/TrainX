import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, UserCheck, CalendarCheck, FileCheck2, LineChart, Briefcase, Inbox, FileSpreadsheet, Bell, Settings, HelpCircle, Code, Bot, AlertTriangle, Megaphone, Trophy, Code2, UserCog } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
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
          <span className="sidebar-brand-sub">{subtitle || "Training Portal"}</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/coordinator", icon: LayoutDashboard, exact: true, moduleKey: "coordinatorDashboard" },
  { title: "Students", url: "/coordinator/students", icon: Users, moduleKey: "coordinatorStudents" },
  { title: "Batches", url: "/coordinator/batches", icon: Code2, moduleKey: "coordinatorBatches" },
  { title: "Mentors", url: "/coordinator/mentors", icon: UserCog, moduleKey: "coordinatorMentors" },
  { title: "Performances", url: "/coordinator/performances", icon: LineChart, moduleKey: "coordinatorPerformances" },
  { title: "Academic Support", url: "/coordinator/improvement", icon: AlertTriangle, moduleKey: "coordinatorStudentsNeedImprovement" },
  { title: "Leaderboard", url: "/coordinator/leaderboard", icon: Trophy, moduleKey: "studentLeaderboard" },
  { title: "Attendance Governance", url: "/coordinator/attendance", icon: CalendarCheck, moduleKey: "coordinatorAttendance" },
  { title: "Requests & Approvals", url: "/coordinator/requests", icon: Inbox, moduleKey: "coordinatorRequests" },
];

const footerNavItems = [
  { title: "Broadcast Notice Center", url: "/coordinator/broadcast", icon: Megaphone, moduleKey: "coordinatorBroadcast" },
  { title: "Support Ticket", url: "/coordinator/help", icon: HelpCircle, moduleKey: "coordinatorHelp" },
];

export function CoordinatorSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();

  const visiblePrimaryItems = primaryNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );
  const visibleFooterItems = footerNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );

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
        <SidebarBrand collapsed={collapsed} subtitle="Training Portal" />
      </div>

      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {visiblePrimaryItems.map(renderItem)}
        </ul>
      </div>

      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
