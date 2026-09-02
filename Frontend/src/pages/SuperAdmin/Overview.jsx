import React from 'react';
import StatsCard from '../../components/SuperAdmin/StatsCard';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import { overviewStats, initialColleges, initialAdminVerifications } from '../../data/superAdminMockData';
import { Building2, ShieldAlert, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Top Banner / System Health */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/20 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Operations Operational</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Institutional Super Admin Dashboard</h2>
            <p className="text-indigo-200 text-xs mt-1 max-w-xl">
              Cross-college portal status, active student engagement analytics, governance verification queue, and faculty allocations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/super-admin/verification"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Review Requests (5)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Recent Verifications & Colleges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Verification Requests Widget */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Pending Admin Requests</h3>
            </div>
            <Link to="/super-admin/verification" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

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
        </div>

        {/* Top Active Colleges Widget */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
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
        </div>
      </div>
    </div>
  );
}
