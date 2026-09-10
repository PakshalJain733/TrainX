import React, { useState, useEffect } from 'react';
import StatsCard from '../../../components/SuperAdmin/StatsCard';
import StatusBadge from '../../../components/SuperAdmin/StatusBadge';
import { overviewStats, initialColleges, initialAdminVerifications } from '../../../data/superAdminMockData';
import { Building2, ShieldAlert, ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import '../Styles/SuperAdmin.css';
import '../Styles/Overview.css';

export default function Overview() {
  const [userName, setUserName] = useState("Super Admin");
  const [userInitials, setUserInitials] = useState("SA");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const name = stored.name || stored.email || "Super Admin";
      setUserName(name);
      setUserInitials(name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SA");
    } catch (e) {
      setUserName("Super Admin");
      setUserInitials("SA");
    }
  }, []);

  const stats = overviewStats.length > 0 ? overviewStats : [
    { id: 1, label: "Total Partner Colleges", value: "0", change: "No colleges registered", trend: "up", icon: "Building2" },
    { id: 2, label: "Enrolled Students", value: "0", change: "Awaiting student sync", trend: "up", icon: "Users" },
    { id: 3, label: "Active Trainers / Mentors", value: "0", change: "No active mentors", trend: "up", icon: "GraduationCap" },
    { id: 4, label: "Pending Admin Requests", value: "0", change: "All verifications clear", trend: "up", icon: "ShieldAlert" },
  ];

  return (
    <div className="overview-page-wrap">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">{userInitials}</div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> INSTITUTIONAL SUPER ADMIN CONTROL HUB
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {userName}!
            </h1>
            <p className="overview-hero-desc">
              Cross-college portal status, active student engagement analytics, and faculty allocations.
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/super-admin/users" className="overview-hero-btn">
            <Clock size={16} />
            <span>Review Requests ({initialAdminVerifications.length})</span>
          </Link>
        </div>
      </div>


      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Recent Verifications & Colleges Grid */}
      <div className="sa-bottom-grid">
        {/* Pending Verification Requests Widget */}
        <div className="sa-widget-card overview-widget-flex">
          <div className="overview-widget-header">
            <div className="overview-widget-title-wrap">
              <ShieldAlert size={16} className="overview-widget-icon-amber" />
              <h3 className="overview-widget-title">Pending Admin Requests</h3>
            </div>
            <Link to="/super-admin/users" className="overview-widget-link">
              View All
            </Link>
          </div>

          {initialAdminVerifications.length === 0 ? (
            <div className="overview-empty-wrap">
              <EmptyState
                icon={ShieldAlert}
                title="No Pending Requests"
                description="There are currently no college admin verification requests pending review."
              />
            </div>
          ) : (
            <div className="overview-list-container">
              {initialAdminVerifications.slice(0, 3).map((req) => (
                <div key={req.id} className="overview-list-item">
                  <div>
                    <h4 className="overview-item-title">{req.name}</h4>
                    <p className="overview-item-subtitle">{req.college}</p>
                    <span className="overview-item-tag">{req.designation}</span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Colleges Widget */}
        <div className="sa-widget-card overview-widget-flex">
          <div className="overview-widget-header">
            <div className="overview-widget-title-wrap">
              <Building2 size={16} className="overview-widget-icon-indigo" />
              <h3 className="overview-widget-title">Connected Institutions Overview</h3>
            </div>
            <Link to="/super-admin/colleges" className="overview-widget-link">
              <span>All Colleges</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {initialColleges.length === 0 ? (
            <div className="overview-empty-wrap">
              <EmptyState
                icon={Building2}
                title="No Colleges Connected"
                description="No institutions or universities are registered on the platform yet."
                actionText="Add New College"
                onAction={() => window.location.href = '/super-admin/colleges'}
              />
            </div>
          ) : (
            <div className="overview-table-wrap">
              <table className="overview-table">
                <thead>
                  <tr className="overview-table-head-row">
                    <th className="overview-table-th">Institution</th>
                    <th className="overview-table-th">Location</th>
                    <th className="overview-table-th">Students</th>
                    <th className="overview-table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {initialColleges.slice(0, 4).map((college) => (
                    <tr key={college.id} className="overview-table-row">
                      <td className="overview-table-td">
                        <div className="overview-td-title">{college.name}</div>
                        <div className="overview-td-sub">{college.code}</div>
                      </td>
                      <td className="overview-table-td overview-td-text">{college.location}</td>
                      <td className="overview-table-td overview-td-count">{college.studentsCount}</td>
                      <td className="overview-table-td">
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
