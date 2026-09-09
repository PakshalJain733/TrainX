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
          <div className="overview-hero-avatar">SR</div>
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
            to="/super-admin/users"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', background: '#f59e0b', color: '#1c1917',
              fontWeight: 700, borderRadius: '10px', fontSize: '13px',
              textDecoration: 'none', boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap'
            }}
          >
            <Clock size={16} />
            <span>Review Requests (0)</span>
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
        <div className="sa-widget-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px', margin: 0 }}>Pending Admin Requests</h3>
            </div>
            <Link to="/super-admin/users" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          {initialAdminVerifications.length === 0 ? (
            <div style={{ padding: '24px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={ShieldAlert}
                title="No Pending Requests"
                description="There are currently no college admin verification requests pending review."
              />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {initialAdminVerifications.slice(0, 3).map((req) => (
                <div key={req.id} style={{ padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #f8fafc' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>{req.name}</h4>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>{req.college}</p>
                    <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 600 }}>{req.designation}</span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Colleges Widget */}
        <div className="sa-widget-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: '#4f46e5' }} />
              <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px', margin: 0 }}>Connected Institutions Overview</h3>
            </div>
            <Link to="/super-admin/colleges" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>All Colleges</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {initialColleges.length === 0 ? (
            <div style={{ padding: '24px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={Building2}
                title="No Colleges Connected"
                description="No institutions or universities are registered on the platform yet."
                actionText="Add New College"
                onAction={() => window.location.href = '/super-admin/colleges'}
              />
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {initialColleges.slice(0, 4).map((college) => (
                    <tr key={college.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{college.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{college.code}</div>
                      </td>
                      <td style={{ padding: '12px 12px', color: '#475569', fontSize: '12.5px' }}>{college.location}</td>
                      <td style={{ padding: '12px 12px', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{college.studentsCount}</td>
                      <td style={{ padding: '12px 12px' }}>
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
