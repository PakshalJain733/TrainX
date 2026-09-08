import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import { overviewStats, initialColleges, initialAdminVerifications } from '../../data/superAdminMockData';
import {
  Building2, ShieldAlert, ArrowUpRight, CheckCircle2, Clock, Sparkles, Info, Users, Shield, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import '../Student/Styles/Overview.css';

export default function Overview() {
  const superAdminStats = [
    { label: "Connected Colleges", value: "4 Institutions", hint: "Active partner campuses", icon: Building2 },
    { label: "Total Active Students", value: "4,850", hint: "Enrolled in campus portal", icon: Users },
    { label: "Coordinators & Heads", value: "18 Members", hint: "Department oversight", icon: ShieldAlert },
    { label: "System Health", value: "99.9%", hint: "All systems operational", icon: CheckCircle2 },
  ];

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            SR
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> SUPER ADMIN CONTROL HUB
            </div>
            <h1 className="overview-hero-title">
              Welcome back, Dr. Sara Rao!
            </h1>
            <p className="overview-hero-desc">
              Platform Owner · Cross-college portal status, active student engagement analytics, and governance verification.
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/super-admin/verification">
            <Button className="overview-btn-primary">
              <Clock size={14} className="overview-btn-icon" /> Review Requests (5)
            </Button>
          </Link>
          <Link to="/super-admin/colleges">
            <Button className="overview-btn-secondary">
              <Building2 size={14} className="overview-btn-icon" /> All Colleges
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {superAdminStats.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                <Info size={15} className="overview-info-icon" />
              </div>

              <p className="overview-stat-value">{s.value}</p>

              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2-Column Main Arena */}
      <div className="overview-split-grid">
        {/* Left: Connected Institutions Table */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Building2 size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Connected Institutions</CardTitle>
                <CardDescription className="overview-card-desc">Active partner colleges & student count</CardDescription>
              </div>
            </div>
            <Link to="/super-admin/colleges" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
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
          </CardContent>
        </Card>

        {/* Right: Pending Admin Requests Queue */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <ShieldAlert size={18} className="overview-header-icon text-amber-500" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Pending Verification Requests</CardTitle>
                <CardDescription className="overview-card-desc">Admin access approvals pending review</CardDescription>
              </div>
            </div>
            <Link to="/super-admin/verification" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              Review Queue <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {initialAdminVerifications.slice(0, 3).map((req) => (
              <div key={req.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{req.name}</h4>
                  <p className="text-[11px] text-slate-500">{req.college}</p>
                  <span className="text-[10px] text-indigo-600 font-medium">{req.designation}</span>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

