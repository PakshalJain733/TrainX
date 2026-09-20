import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/SuperAdmin/StatsCard';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import { superAdminAPI } from '../../services/api';
import { Building2, ShieldAlert, ArrowUpRight, Clock, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import './SuperAdmin.css';

export default function Overview() {
  const [stats, setStats] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    superAdminAPI.overview()
      .then((data) => {
        if (data) {
          setStats(data.stats || []);
          setColleges(data.colleges || []);
          setVerifications(data.verifications || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            <Shield size={20} />
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> INSTITUTIONAL SUPER ADMIN CONTROL HUB
            </div>
            <h1 className="overview-hero-title">
              Welcome back!
            </h1>
            <p className="overview-hero-desc">
              Cross-college portal status, active student engagement analytics, and faculty allocations.
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link
            to="/super-admin/verification"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', background: '#f59e0b', color: '#1c1917',
              fontWeight: 700, borderRadius: '10px', fontSize: '13px',
              textDecoration: 'none', boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap'
            }}
          >
            <Clock size={16} />
            <span>Review Requests ({verifications.length})</span>
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
            <Link to="/super-admin/verification" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          {verifications.length === 0 ? (
            <div style={{ padding: '24px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={ShieldAlert}
                title="No Pending Requests"
                description="There are currently no college admin verification requests pending review."
              />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {verifications.slice(0, 3).map((req) => (
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

          {colleges.length === 0 ? (
            <div style={{ padding: '24px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? (
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading institutions…</p>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No Colleges Connected"
                  description="No institutions or universities are registered on the platform yet."
                  actionText="Add New College"
                  onAction={() => window.location.href = '/super-admin/colleges'}
                />
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Active Students</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {colleges.slice(0, 4).map((college) => (
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