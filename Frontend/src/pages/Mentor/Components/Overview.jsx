import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Users, CalendarCheck, FileCode, Video, ArrowUpRight, CheckCircle2,
  Clock, Star, Sparkles, Info, BookOpen, ChevronRight, AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import '../../Student/Styles/Overview.css';

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "MT";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/mentor/overview")
      .then((res) => {
        if (res && res.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 14 }} />
        <p>Loading mentor dashboard...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  const profile = data?.profile || { name: "Mentor" };
  const stats = data?.stats || { batchesCount: 0, studentsCount: 0, defaultersCount: 0, interventionsPending: 0, sessionsToday: 0 };
  const batches = data?.batches || [];
  const sessions = data?.upcomingSessions || [];
  const nextSession = data?.nextSession || null;

  const mentorStats = [
    { label: "Active Batches", value: `${stats.batchesCount} Cohorts`, hint: stats.batchesCount > 0 ? "Assigned to you" : "No batches assigned", icon: Layers },
    { label: "Total Students", value: `${stats.studentsCount}`, hint: "Assigned students", icon: Users },
    { label: "Live Classes Today", value: `${stats.sessionsToday} Session${stats.sessionsToday === 1 ? "" : "s"}`, hint: stats.sessionsToday > 0 ? "Today" : "None today", icon: Video },
    { label: "Pending Reviews", value: `${stats.interventionsPending} Interventions`, hint: "Open interventions", icon: FileCode },
  ];

  return (
    <div className="mentor-overview-container">
      {/* Radiant Welcome Hero Banner - Identical to Student Overview */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(profile.name)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR & INSTRUCTOR WORKSPACE
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {profile.name}!
            </h1>
            <p className="overview-hero-desc">
              Mentor | {stats.batchesCount} Active Batches | {stats.studentsCount} Assigned Students
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/mentor/batches">
            <Button className="overview-btn-primary">
              <Layers size={14} className="overview-btn-icon" /> View Batches
            </Button>
          </Link>
          <Link to="/mentor/sessions">
            <Button className="overview-btn-secondary">
              <Video size={14} className="overview-btn-icon" /> Live Sessions
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {mentorStats.map((s) => (
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
        {/* Left: Allocated Training Batches */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Layers size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Allocated Training Batches</CardTitle>
                <CardDescription className="overview-card-desc">Active cohort syllabus completion & health</CardDescription>
              </div>
            </div>
            <Link to="/mentor/batches" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {batches.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No batches assigned yet.
              </div>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mentor-batch-code-tag">{b.code || b.name}</span>
                      <h4 className="mentor-batch-name">{b.name}</h4>
                      <p className="mentor-batch-dept">{b.department} · {b.enrolled} students</p>
                    </div>
                    <span className="mentor-status-tag mentor-status-tag--emerald">
                      Active
                    </span>
                  </div>

                  <div className="mentor-progress-section">
                    <div className="mentor-progress-head">
                      <span className="mentor-progress-label">Curriculum Progress</span>
                      <span className="mentor-progress-val">{b.progress || 0}%</span>
                    </div>
                    <div className="mentor-progress-track">
                      <div
                        className="mentor-progress-fill"
                        style={{ width: `${b.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Upcoming Live Session & Trainer Stats */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <Video size={18} className="overview-header-icon text-amber-500" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Live Session & Alerts</CardTitle>
                <CardDescription className="overview-card-desc">Scheduled instructor sessions & intervention alerts</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Upcoming</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {nextSession ? (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    {nextSession.status}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Clock size={14} /> {nextSession.time}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{nextSession.title}</h4>
                <p className="text-xs text-slate-600 font-medium">{nextSession.batch}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarCheck size={14} className="text-indigo-600" /> {nextSession.date}
                </div>
                {nextSession.meeting_link ? (
                  <a
                    href={nextSession.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5 shadow-xs text-center"
                  >
                    Join Meeting Room
                  </a>
                ) : (
                  <div className="text-xs text-slate-400 font-semibold text-center w-full py-2">No meeting link provided</div>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No upcoming live sessions scheduled.
              </div>
            )}

            {stats.defaultersCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
                <AlertTriangle size={15} />
                {stats.defaultersCount} student(s) flagged as defaulters.
                <Link to="/mentor/defaulters" className="underline ml-auto">Review</Link>
              </div>
            )}
            {stats.interventionsPending > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold">
                <AlertTriangle size={15} />
                {stats.interventionsPending} open intervention(s) pending follow-up.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}