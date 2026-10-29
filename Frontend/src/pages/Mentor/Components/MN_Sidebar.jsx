import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Sparkles, Bot, AlertTriangle, CalendarCheck, Trophy,AlertCircle, BookOpenCheck, FileCheck2, HelpCircle, LineChart, Megaphone, GraduationCap, Code2, UserCog } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
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
          <span className="sidebar-brand-sub">{subtitle || "Mentor"}</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/mentor", icon: LayoutDashboard, exact: true, moduleKey: "mentorDashboard" },
  { title: "Students", url: "/mentor/students", icon: Users, moduleKey: "mentorStudents" },
  { title: "Batches", url: "/mentor/batches", icon: Users, moduleKey: "mentorStudents" },
  { title: "Coding Practice", url: "/mentor/coding-practice", icon: Code2, moduleKey: "mentorCodingPractice" },
  { title: "Study Material", url: "/mentor/study-material", icon: BookOpenCheck, moduleKey: "mentorStudyMaterial" },
  { title: "Quizzes", url: "/mentor/quizzes", icon: GraduationCap, moduleKey: "mentorQuizzes" },
  { title: "Roadmaps", url: "/mentor/roadmaps", icon: Sparkles, moduleKey: "mentorRoadmaps" },
  { title: "AI Interviews", url: "/mentor/ai-interviews", icon: Bot, moduleKey: "mentorAIInterviews" },
  { title: "Progress", url: "/mentor/performance", icon: LineChart, moduleKey: "mentorPerformance" },
  { title: "Skill Gaps", url: "/mentor/skill-gaps", icon: AlertTriangle, moduleKey: "mentorSkillGaps" },
  { title: "Leaderboard", url: "/mentor/leaderboard", icon: Trophy, moduleKey: "mentorLeaderboard" },
  { title: "Attendance", url: "/mentor/attendance", icon: CalendarCheck, moduleKey: "mentorAttendance" },
  { title: "Weekly Reports", url: "/mentor/weekly-reports", icon: FileCheck2, moduleKey: "mentorWeeklyReports" },
  { title: "Defaulters", url: "/mentor/defaulters", icon: AlertCircle, moduleKey: "defaulters" },
];

const footerNavItems = [
  { title: "Support Ticket", url: "/mentor/help", icon: HelpCircle, moduleKey: "mentorHelp" },
];

export function MentorSidebar({ collapsed, mobileOpen, onClose }) {
  const { pathname } = useLocation();
  const { isModuleActive } = useSystemMaintenance();

  const visiblePrimaryItems = primaryNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );
  const visibleFooterItems = footerNavItems.filter(
    (item) => !item.moduleKey || isModuleActive(item.moduleKey)
  );

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
        <SidebarBrand collapsed={collapsed} subtitle="Mentor" />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {visiblePrimaryItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
