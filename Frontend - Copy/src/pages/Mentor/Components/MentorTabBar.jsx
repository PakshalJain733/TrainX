import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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
    <div className="w-full bg-[#0f172a] p-1.5 rounded-xl border border-slate-800 shadow-md mb-6 overflow-x-auto select-none no-scrollbar">
      <div className="flex items-center gap-1 min-w-max">
        {mentorTabs.map((tab) => {
          const active = isActive(tab);
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                active
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.name}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
