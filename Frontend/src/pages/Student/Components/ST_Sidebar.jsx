import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Sparkles, BookOpenCheck, Bot, LineChart, Trophy, CalendarCheck, FileCheck2, CalendarDays, Award, Code2, Terminal, BookOpen, Users, FileQuestion, HelpCircle, GraduationCap, Settings, UserCheck, UserCog, Bell, ChartBar, ChartLineIcon, ChartBarIncreasing, ChartBarIncreasingIcon, Briefcase, Target } from "lucide-react";
import { useSystemMaintenance } from "../../../context/SystemMaintenanceContext";
import logoImg from "../../../assets/Logo.png";
import trainXImg from "../../../assets/TrainX.png";
import "../Styles/ST_Sidebar.css";

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
            <img src={trainXImg} alt="X" className="brand-x-img-student" />
          </div>
          <span className="sidebar-brand-sub">{subtitle || "Student"}</span>
        </div>
      )}
    </div>
  );
}

const primaryNavItems = [
  { title: "Overview", url: "/student", icon: LayoutDashboard, exact: true, moduleKey: "studentDashboard" },
  { title: "Batches", url: "/student/batches", icon: Code2, moduleKey: "studentBatches" },
  { title: "Learning Content", url: "/student/learning", icon: BookOpenCheck, moduleKey: "learningContent" },
  { title: "Practice", url: "/student/practice", icon: Terminal, moduleKey: "practiceCoding" },
  { title: "Quiz", url: "/student/quiz", icon: GraduationCap, moduleKey: "academicQuizzes" },
  { title: "AI Roadmap", url: "/student/roadmap", icon: Sparkles, moduleKey: "aiRoadmaps" },
  { title: "AI Interview", url: "/student/ai-interview", icon: Bot, moduleKey: "aiInterviews" },
  { title: "Progress", url: "/student/progress", icon: LineChart, moduleKey: "skillGapAnalysis" },
  { title: "Leaderboard", url: "/student/leaderboard", icon: Trophy, moduleKey: "studentLeaderboard" },
  { title: "Attendance", url: "/student/attendance", icon: CalendarCheck, moduleKey: "attendance" },
  { title: "Weekly Reports", url: "/student/weekly-reports", icon: FileCheck2, moduleKey: "weeklyReports" },
];

const footerNavItems = [
  { title: "Support Tickets", url: "/student/help", icon: HelpCircle, moduleKey: "studentHelp" },
];

export function StudentSidebar({ collapsed, mobileOpen, onClose }) {
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
          className={`sidebar-menu-btn-student ${active ? "sidebar-menu-btn-student--active" : ""}`}
          title={collapsed ? item.title : undefined}
          onClick={handleNavClick}
        >
          <item.icon size={18} className="sidebar-icon-student" />
          {(!collapsed || mobileOpen) && <span className="sidebar-label-student">{item.title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`student-sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header-student">
        <SidebarBrand collapsed={collapsed} subtitle="Student" />
      </div>

      {/* Nav */}
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {visiblePrimaryItems.map(renderItem)}
        </ul>
      </div>

      {/* Pinned Bottom Account Section */}
      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {visibleFooterItems.map(renderItem)}
        </ul>
      </div>
    </aside>
  );
}
