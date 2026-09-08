import React from 'react';
import { Link } from 'react-router-dom';
import { mentorProfile, mentorBatches, mentorStudents, mentorAssignments, mentorLiveSessions } from '../../../data/mentorMockData';
import {
  Layers, Users, CalendarCheck, FileCode, Video, ArrowUpRight, CheckCircle2,
  Clock, Star, Sparkles, Info, BookOpen, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import '../../Student/Styles/Overview.css';

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "VS";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Overview() {
  const mentorStats = [
    { label: "Active Batches", value: `${mentorProfile.allocatedBatchesCount} Cohorts`, hint: "All cohorts on track", icon: Layers },
    { label: "Total Students", value: `${mentorProfile.totalStudentsAssigned}`, hint: "94% active participation", icon: Users },
    { label: "Live Classes Today", value: "1 Session", hint: "Starts 02:00 PM", icon: Video },
    { label: "Pending Reviews", value: `${mentorProfile.pendingEvaluationsCount} Code Reviews`, hint: "Require trainer feedback", icon: FileCode },
  ];

  return (
    <div className="mentor-overview-container">
      {/* Radiant Welcome Hero Banner - Identical to Student Overview */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(mentorProfile.name)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR & INSTRUCTOR WORKSPACE
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {mentorProfile.name}!
            </h1>
            <p className="overview-hero-desc">
              Senior Technical Trainer | {mentorProfile.allocatedBatchesCount} Active Batches | {mentorProfile.totalStudentsAssigned} Assigned Students
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
            {mentorBatches.map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="mentor-batch-code-tag">{b.code}</span>
                    <h4 className="mentor-batch-name">{b.name}</h4>
                    <p className="mentor-batch-dept">{b.college} · {b.department}</p>
                  </div>
                  <span className="mentor-status-tag mentor-status-tag--emerald">
                    {b.status}
                  </span>
                </div>

                <div className="mentor-progress-section">
                  <div className="mentor-progress-head">
                    <span className="mentor-progress-label">Syllabus Progress</span>
                    <span className="mentor-progress-val">{b.progress}%</span>
                  </div>
                  <div className="mentor-progress-track">
                    <div
                      className="mentor-progress-fill"
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
                <CardTitle className="overview-card-title">Live Session & Evaluation</CardTitle>
                <CardDescription className="overview-card-desc">Scheduled instructor sessions & rating</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Today</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {mentorLiveSessions.map((s) => (
              <div key={s.id} className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    {s.status}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star size={14} className="fill-amber-400" /> Rating {mentorProfile.rating}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                <p className="text-xs text-slate-600 font-medium">{s.batch}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={14} className="text-indigo-600" /> {s.time}
                </div>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5 shadow-xs text-center"
                >
                  Join Meeting Room
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
