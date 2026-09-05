import React from 'react';
import StatsCard from '../../components/SuperAdmin/StatsCard';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import { overviewStats, initialColleges, initialAdminVerifications } from '../../data/superAdminMockData';
import { Building2, ShieldAlert, ArrowUpRight, CheckCircle2, Clock, Shield, Sparkles, FolderOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import './SuperAdmin.css';

export default function Overview() {
  const stats = overviewStats.length > 0 ? overviewStats : [
    { id: 1, label: "Total Partner Colleges", value: "0", change: "No colleges registered", trend: "up", icon: "Building2" },
    { id: 2, label: "Enrolled Students", value: "0", change: "Awaiting student sync", trend: "up", icon: "Users" },
    { id: 3, label: "Active Trainers / Mentors", value: "0", change: "No active mentors", trend: "up", icon: "GraduationCap" },
    { id: 4, label: "Pending Admin Requests", value: "0", change: "All verifications clear", trend: "up", icon: "ShieldAlert" },
  ];

  return (
    <div className="space-y-6">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            SR
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> INSTITUTIONAL SUPER ADMIN CONTROL HUB
            </div>
            <h1 className="overview-hero-title">
              Welcome back, Dr. Sara Rao!
            </h1>
            <p className="overview-hero-desc">
              Cross-college portal status, active student engagement analytics, and faculty allocations.
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link
            to="/super-admin/verification"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>Review Requests (0)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sa-kpi-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Recent Verifications & Colleges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 sa-bottom-grid">
        {/* Pending Verification Requests Widget */}
        <div className="lg:col-span-1 bg-white border border-slate-200 flex flex-col sa-widget-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Pending Admin Requests</h3>
            </div>
            <Link to="/super-admin/verification" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          {initialAdminVerifications.length === 0 ? (
            <div className="py-8 flex-1 flex items-center justify-center">
              <EmptyState
                icon={ShieldAlert}
                title="No Pending Requests"
                description="There are currently no college admin verification requests pending review."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {initialAdminVerifications.slice(0, 3).map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{req.name}</h4>
                    <p className="text-[11px] text-slate-500">{req.college}</p>
                    <span className="text-[10px] text-indigo-600 font-medium">{req.designation}</span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Colleges Widget */}
        <div className="lg:col-span-2 bg-white border border-slate-200 sa-widget-card flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Connected Institutions Overview</h3>
            </div>
            <Link to="/super-admin/colleges" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              <span>All Colleges</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {initialColleges.length === 0 ? (
            <div className="py-8 flex-1 flex items-center justify-center">
              <EmptyState
                icon={Building2}
                title="No Colleges Connected"
                description="No institutions or universities are registered on the platform yet."
                actionText="Add New College"
                onAction={() => window.location.href = '/super-admin/colleges'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Active Students</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {initialColleges.slice(0, 4).map((college) => (
                    <tr key={college.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{college.name}</div>
                        <div className="text-[10px] text-slate-400">{college.code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{college.location}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{college.studentsCount}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={college.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

