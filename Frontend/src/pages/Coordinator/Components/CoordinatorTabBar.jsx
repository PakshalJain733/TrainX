import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../Styles/CoordinatorTabBar.css";

const coordinatorTabs = [
  { name: "Overview", path: "/coordinator", exact: true },
  { name: "Batches", path: "/coordinator/batches" },
  { name: "Students", path: "/coordinator/students" },
  { name: "Mentors & Trainers", path: "/coordinator/mentors" },
  { name: "Assessments & Quiz", path: "/coordinator/assessments" },
  { name: "Attendance", path: "/coordinator/attendance" },
  { name: "AI Roadmaps", path: "/coordinator/roadmaps" },
  { name: "AI Interviews", path: "/coordinator/interviews" },
  { name: "Performance & Skills", path: "/coordinator/performance" },
  { name: "Placement Drives", path: "/coordinator/placement" },
  { name: "Leaderboard", path: "/coordinator/leaderboard" },
  { name: "Requests & Approvals", path: "/coordinator/requests" },
  { name: "Governance Reports", path: "/coordinator/reports" },
];

export default function CoordinatorTabBar() {
  const location = useLocation();

  const isActive = (tab) => {
    if (tab.exact) {
      return location.pathname === tab.path || location.pathname === tab.path + "/";
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="coord-tabbar-container">
      <div className="coord-tabbar-list">
        {coordinatorTabs.map((tab) => {
          const active = isActive(tab);
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`coord-tabbar-link ${active ? "active" : ""}`}
            >
              {tab.name}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
