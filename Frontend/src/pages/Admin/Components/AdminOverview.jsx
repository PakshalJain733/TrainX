import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck, TrendingUp, Clock, Trophy, Users, Sparkles, BookOpen, Flame, HelpCircle, UserPlus, UserCog, Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../Styles/AdminOverview.css";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    mentors: 0,
    coordinators: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        const statsRes = await apiFetch("/admin/stats");
        if (statsRes && statsRes.data) {
          setStats(statsRes.data);
        }

        const usersRes = await apiFetch("/admin/users");
        if (usersRes && usersRes.data) {
          setRecentUsers(usersRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboard();
  }, []);

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const statCards = [
    { label: "Total Students", value: `${stats.students}`, hint: "Enrolled in campus programs", icon: Users },
    { label: "Faculty & Mentors", value: `${stats.mentors}`, hint: "Active mentors on portal", icon: BookOpen },
    { label: "Coordinators", value: `${stats.coordinators}`, hint: "Department coordinators", icon: Shield },
    { label: "Total Accounts", value: `${stats.totalUsers}`, hint: "All registered users", icon: UserCog },
  ];

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
              Campus Training Portal | System Administration & User Directory
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/admin/users">
            <Button className="overview-btn-primary">
              <UserCog size={14} className="overview-btn-icon" /> Manage Users
            </Button>
          </Link>
          <Link to="/admin/batches">
            <Button className="overview-btn-secondary">
              <BookOpen size={14} className="overview-btn-icon" /> View Batches
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {statCards.map((s) => (
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
        {/* Left: Recent User Registrations */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Clock size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Recent Registrations</CardTitle>
                <CardDescription className="overview-card-desc">Newly onboarded portal users</CardDescription>
              </div>
            </div>
            <Link to="/admin/users" className="overview-view-all-pill">
              View All Users
            </Link>
          </CardHeader>
          <CardContent className="overview-stack-1">
            {recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <div key={u.id} className="overview-row-between overview-item-row">
                  <div className="overview-row overview-item-left admin-overview-user-item-left">
                    <Avatar size="32">
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="overview-item-title">{u.name}</p>
                      <p className="overview-item-due">{u.email || u.mobile_number}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="overview-badge-shrink">
                    {u.role ? u.role.replace("_", " ") : "student"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="admin-overview-empty-users">
                <Clock size={28} className="admin-overview-empty-clock" />
                <p className="admin-overview-empty-title">No users registered yet</p>
                <p className="admin-overview-empty-sub">Users will appear here once registered.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Quick Administration Actions */}
        <Card className="overview-subcard overview-leaderboard-card">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <Shield size={18} className="overview-header-icon overview-trophy-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Quick Administration</CardTitle>
                <CardDescription className="overview-card-desc">Direct control shortcuts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overview-leaderboard-content admin-quick-actions-content">
            <Link to="/admin/users" className="admin-quick-action-link">
              <div className="overview-row-between admin-quick-action-card">
                <div className="overview-row admin-overview-user-item-left">
                  <Users size={18} color="#4f46e5" />
                  <div>
                    <span className="admin-quick-action-title">User Management</span>
                    <span className="admin-quick-action-sub">Create, edit, and assign roles</span>
                  </div>
                </div>
                <span className="admin-quick-action-arrow admin-quick-action-arrow--blue">Open &rarr;</span>
              </div>
            </Link>

            <Link to="/admin/batches" className="admin-quick-action-link">
              <div className="overview-row-between admin-quick-action-card">
                <div className="overview-row admin-overview-user-item-left">
                  <BookOpen size={18} color="#059669" />
                  <div>
                    <span className="admin-quick-action-title">Batch Rosters</span>
                    <span className="admin-quick-action-sub">Manage cohorts & training streams</span>
                  </div>
                </div>
                <span className="admin-quick-action-arrow admin-quick-action-arrow--green">Open &rarr;</span>
              </div>
            </Link>

            <Link to="/admin/attendance" className="admin-quick-action-link">
              <div className="overview-row-between admin-quick-action-card">
                <div className="overview-row admin-overview-user-item-left">
                  <CalendarCheck size={18} color="#d97706" />
                  <div>
                    <span className="admin-quick-action-title">Attendance Tracking</span>
                    <span className="admin-quick-action-sub">Session attendance & percentages</span>
                  </div>
                </div>
                <span className="admin-quick-action-arrow admin-quick-action-arrow--amber">Open &rarr;</span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

