import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  TrendingUp,
  CalendarCheck,
  Target,
  Sparkles,
  ClipboardCheck,
  FileText,
  SlidersHorizontal,
  Shield
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'ORGANIZATION',
    items: [
      { name: 'Overview', path: '/super-admin', exact: true, icon: LayoutDashboard },
      { name: 'Colleges', path: '/super-admin/colleges', icon: Building2 },
      { name: 'Departments', path: '/super-admin/departments', icon: Briefcase, badge: '86' },
      { name: 'Batches', path: '/super-admin/batches', icon: Calendar, badge: '96' },
    ]
  },
  {
    title: 'PEOPLE & ACCESS',
    items: [
      { name: 'Admin verification', path: '/super-admin/verification', icon: ShieldCheck, badge: '04' },
      { name: 'Coordinators', path: '/super-admin/coordinators', icon: UserCheck, badge: '42' },
      { name: 'Mentors & trainers', path: '/super-admin/mentors', icon: GraduationCap, badge: '86' },
      { name: 'Students', path: '/super-admin/students', icon: Users, badge: '3.8k' },
    ]
  },
  {
    title: 'MONITORING',
    items: [
      { name: 'Performance', path: '/super-admin/performance', icon: TrendingUp },
      { name: 'Attendance', path: '/super-admin/attendance', icon: CalendarCheck },
    ]
  },
  {
    title: 'AI SYSTEMS',
    items: [
      { name: 'AI roadmaps', path: '/super-admin/ai-roadmaps', icon: Target },
      { name: 'AI interviews', path: '/super-admin/ai-interviews', icon: Sparkles },
      { name: 'Mock drives', path: '/super-admin/mock-drives', icon: ClipboardCheck },
      { name: 'Weekly reports', path: '/super-admin/weekly-reports', icon: FileText },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="w-[240px] bg-[#0f172a] text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-[64px] px-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">Super Admin</h1>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Platform operational</span>
              <span className="text-slate-500 ml-1">v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between h-[44px] px-4 rounded-lg text-xs font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600/20 text-white font-semibold border-l-2 border-indigo-500 shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-teal-950/80 border border-teal-800/60 flex items-center justify-center font-bold text-teal-400 text-xs">
              SR
            </div>
            <div className="text-xs">
              <p className="font-bold text-white tracking-tight">Dr. Sara Rao</p>
              <p className="text-slate-400 text-[11px] font-mono">Platform owner</p>
            </div>
          </div>
          <button
            title="Settings"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
