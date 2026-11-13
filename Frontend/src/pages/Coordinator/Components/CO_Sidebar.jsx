import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, LineChart, Inbox, HelpCircle, AlertTriangle, Megaphone, Trophy, Code2, UserCog, X } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import AppTooltip from "../../../components/ui/AppTooltip";
import SidebarNavGroups from "../../../components/Common/SidebarNavGroups";
import MobileDrawerFooter from "../../../components/Common/MobileDrawerFooter";
import { useMobileDrawer } from "../../../hooks/useMobileDrawer";
import "../Styles/CO_Sidebar.css";

function SidebarBrand({ collapsed, mobileOpen, subtitle }) {
  return (
    <Link
        to="/coordinator"
        className="sidebar-brand"
      >
        <div className="sidebar-brand-logo-container">
          <img src={logoImg} alt="TrainX" className="sidebar-brand-logo" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-brand-text">
            <div className="brand-row">
              <span className="brand-name1">Train</span>
              <img src={trainXImg} alt="X" className="brand-x-img-coordinator" />
            </div>
            <span className="sidebar-brand-sub">{subtitle || "Coordinator"}</span>
          </div>
        )}
      </Link>
  );
}

const navGroups = [
  {
    id: "cohort",
    label: "Cohort",
    items: [
      { title: "Overview", url: "/coordinator", icon: LayoutDashboard, exact: true, moduleKey: "coordinatorDashboard" },
      { title: "Batches", url: "/coordinator/batches", icon: Code2, moduleKey: "coordinatorBatches" },
      { title: "Students", url: "/coordinator/students", icon: Users, moduleKey: "coordinatorStudents" },
      { title: "Mentors", url: "/coordinator/mentors", icon: UserCog, moduleKey: "coordinatorMentors" },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    items: [
      { title: "Attendance Governance", url: "/coordinator/attendance", icon: CalendarCheck, moduleKey: "coordinatorAttendance" },
      { title: "Performances", url: "/coordinator/performances", icon: LineChart, moduleKey: "coordinatorPerformances" },
      { title: "Leaderboard", url: "/coordinator/leaderboard", icon: Trophy, moduleKey: "coordinatorLeaderboard" },
      { title: "Academic Support", url: "/coordinator/improvement", icon: AlertTriangle, moduleKey: "coordinatorStudentsNeedImprovement" },
      { title: "Requests & Approvals", url: "/coordinator/requests", icon: Inbox, moduleKey: "coordinatorRequests" },
    ],
  },
];

const footerNavItems = [
  { title: "Broadcast Notice Center", url: "/coordinator/broadcast", icon: Megaphone, moduleKey: "coordinatorBroadcast" },
  { title: "Help & FAQ", url: "/coordinator/help", icon: HelpCircle, moduleKey: "coordinatorHelp" },
];

export function CoordinatorSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();
  const userInfo = useMobileDrawer(mobileOpen, onClose, "Coordinator");

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
        <AppTooltip
          text={item.title}
          show={collapsed && !mobileOpen}
          position="right"
          isActive={active}
        >
          <Link
            to={item.url}
            className={`sidebar-menu-btn-coordinator ${active ? "sidebar-menu-btn-coordinator--active" : ""}`}
            onClick={handleNavClick}
          >
            <item.icon size={18} className="sidebar-icon-coordinator" />
            {(!collapsed || mobileOpen) && <span className="sidebar-label-coordinator">{item.title}</span>}
          </Link>
        </AppTooltip>
      </li>
    );
  };

  return (
    <aside className={`coordinator-sidebar ${collapsed && !mobileOpen ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-header-coordinator">
        <SidebarBrand collapsed={collapsed} mobileOpen={mobileOpen} subtitle="Coordinator" />
        <button
          type="button"
          className="mobile-drawer-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-content">
        <SidebarNavGroups
          groups={visibleGroups}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isActive={isActive}
          renderItem={renderItem}
        />
      </div>

      <div className="sidebar-footer">
        {(!collapsed || mobileOpen) && visibleFooterItems.length > 0 && (
          <div className="sidebar-footer-group-label">Support</div>
        )}
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
        <MobileDrawerFooter userInfo={userInfo} profileUrl="/coordinator/profile" onClose={onClose} />
      </div>
    </aside>
  );
}
