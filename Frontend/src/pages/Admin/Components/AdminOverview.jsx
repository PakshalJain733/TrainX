import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, Users, Sparkles, BookOpen, Flame, HelpCircle, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import "../Styles/AdminOverview.css";

const stats = [
  { label: "Total Students", value: "480", hint: "+24 new this month", icon: Users },
  { label: "Active Batches", value: "12", hint: "2 new cohorts starting", icon: BookOpen },
  { label: "Avg Attendance", value: "88.4%", hint: "+1.2% vs last week", icon: CalendarCheck },
  { label: "Pending Tickets", value: "4 Open", hint: "Average resolution: 2h", icon: HelpCircle },
];

const batchPerformance = [
  { rank: 1, name: "Python Backend - Cohort A", score: "14,250 XP", initials: "PY", badge: "🥇 Top Batch", active: true },
  { rank: 2, name: "React Frontend - Cohort C", score: "12,980 XP", initials: "RE", badge: "🥈 High Activity", active: true },
  { rank: 3, name: "Full Stack - Cohort B", score: "11,840 XP", initials: "FS", badge: "🥉 Steady Progress", active: true },
  { rank: 4, name: "Data Science - Cohort A", score: "9,560 XP", initials: "DS", badge: "Average Progress", active: true },
];

const recentActivities = [
  { title: "New ticket filed by Priya Sharma", time: "5 min ago", tag: "Help Ticket", variant: "success" },
  { title: "Quiz 2 released for Python Backend", time: "1h ago", tag: "Quiz", variant: "outline" },
  { title: "Weekly progress reports generated", time: "3h ago", tag: "Reports", variant: "outline" },
  { title: "Attendance sheet locked for 27 Aug", time: "4h ago", tag: "Attendance", variant: "outline" },
];

export default function AdminOverview() {
  return (
    <div className="admin-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            AD
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> ADMIN CONTROL PANEL
            </div>
            <h1 className="overview-hero-title">
              Welcome back, Admin!
            </h1>
            <p className="overview-hero-desc">
              Campus Training Portal | System Administration Workspace
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/admin/batches">
            <Button className="overview-btn-primary">
              <Sparkles size={14} className="overview-btn-icon" /> Manage Batches
            </Button>
          </Link>
          <Link to="/admin/attendance">
            <Button className="overview-btn-secondary">
              <BookOpen size={14} className="overview-btn-icon" /> Track Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {stats.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
              </div>
              <p className="overview-stat-value">{s.value}</p>
              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid split */}
      <div className="overview-split-grid">
        {/* Left: Recent Activities */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Clock size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Recent System Log</CardTitle>
                <CardDescription className="overview-card-desc">Latest administrative updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overview-stack-1">
            {recentActivities.map((act) => (
              <div key={act.title} className="overview-row-between overview-item-row">
                <div className="overview-row overview-item-left">
                  <div className="overview-clock-wrap">
                    <Clock size={16} className="overview-clock-icon" />
                  </div>
                  <div>
                    <p className="overview-item-title">{act.title}</p>
                    <p className="overview-item-due">{act.time}</p>
                  </div>
                </div>
                <Badge variant={act.variant} className="overview-badge-shrink">{act.tag}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Leaderboard */}
        <Card className="overview-subcard overview-leaderboard-card">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <Trophy size={18} className="overview-header-icon overview-trophy-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Top Performing Batches</CardTitle>
                <CardDescription className="overview-card-desc">Rankings by accumulated points</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overview-leaderboard-content">
            {batchPerformance.map((b) => (
              <div key={b.rank} className="overview-row-between overview-leaderboard-item">
                <div className="overview-row" style={{ gap: 12 }}>
                  <span className={`overview-leaderboard-rank ${b.rank === 1 ? "overview-rank-1" : b.rank === 2 ? "overview-rank-2" : "overview-rank-3"}`}>
                    #{b.rank}
                  </span>
                  <Avatar size="34">
                    <AvatarFallback>{b.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="overview-leaderboard-name">{b.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{b.badge}</span>
                  </div>
                </div>
                <div className="overview-xp-pill">
                  <Flame size={12} className="overview-flame-icon" />
                  <span>{b.score}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
