import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Bot,
  AlertTriangle,
  CalendarCheck,
  Trophy,
  Briefcase,
  AlertCircle,
  BookOpenCheck,
  FileCheck2,
  HelpCircle,
  LineChart,
  Megaphone,
} from "lucide-react";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/MN_Sidebar.css";

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
            <img src={trainXImg} alt="X" className="brand-x-img-mentor" />
          </div>
          <span className="sidebar-brand-sub">Mentor Workspace</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/mentor", icon: LayoutDashboard, exact: true },
  { title: "Students", url: "/mentor/students", icon: Users },
  { title: "Roadmaps", url: "/mentor/roadmaps", icon: Sparkles },
  { title: "AI Interviews", url: "/mentor/ai-interviews", icon: Bot },
  { title: "Skill Gaps", url: "/mentor/skill-gaps", icon: AlertTriangle },
  { title: "Attendance", url: "/mentor/attendance", icon: CalendarCheck },
  { title: "Progress", url: "/mentor/performance", icon: LineChart },
  { title: "Leaderboard", url: "/mentor/leaderboard", icon: Trophy },
  { title: "Mock Drives", url: "/mentor/mock-drives", icon: Briefcase },
  { title: "Defaulters", url: "/mentor/defaulters", icon: AlertTriangle },
  { title: "Study Material", url: "/mentor/study-material", icon: BookOpenCheck },
  { title: "Weekly Reports", url: "/mentor/weekly-reports", icon: FileCheck2 },
  { title: "Broadcast Notice Center", url: "/mentor/broadcast", icon: Megaphone },
];

const footerNavItems = [
  { title: "Support Ticket", url: "/mentor/help", icon: HelpCircle },
];

export function MentorSidebar({ collapsed, mobileOpen, onClose }) {
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
          className={`sidebar-menu-btn-mentor ${active ? "sidebar-menu-btn-mentor--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-mentor" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-mentor">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`mentor-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header-mentor">
        <SidebarBrand collapsed={collapsed} />
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
