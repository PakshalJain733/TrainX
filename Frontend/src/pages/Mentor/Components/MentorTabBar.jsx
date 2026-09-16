import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../Styles/MentorTabBar.css';

const mentorTabs = [
  { name: 'Overview', path: '/mentor', exact: true },
  { name: 'Students', path: '/mentor/students' },
  { name: 'Roadmaps', path: '/mentor/roadmaps' },
  { name: 'AI Interviews', path: '/mentor/ai-interviews' },
  { name: 'Skill Gaps', path: '/mentor/skill-gaps' },
  { name: 'Attendance', path: '/mentor/attendance' },
  { name: 'Leaderboard', path: '/mentor/leaderboard' },
  { name: 'Mock Drives', path: '/mentor/mock-drives' },
  { name: 'Defaulters', path: '/mentor/defaulters' },
  { name: 'Study Material', path: '/mentor/study-material' },
  { name: 'Weekly Reports', path: '/mentor/weekly-reports' },
];

export default function MentorTabBar() {
  const location = useLocation();

  const isActive = (tab) => {
    if (tab.exact) {
      return location.pathname === tab.path || location.pathname === tab.path + '/';
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="mentor-tabbar-container">
      <div className="mentor-tabbar-list">
        {mentorTabs.map((tab) => {
          const active = isActive(tab);
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`mentor-tabbar-link ${active ? 'active' : ''}`}
            >
              {tab.name}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

