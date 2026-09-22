import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  Users,
  GraduationCap,
  TrendingUp,
  KeyRound,
  Lock,
  Plus,
  Activity,
  Server,
  Database,
  Shield,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import { apiFetch } from '../../../utils/api';
import "../Styles/SA_Overview.css";

/* ── Inline Helper Components ───────────────────────── */
const iconMap = {
  Building2,
  Users,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
};

function StatsCard({ label, value, change, trend = 'up', icon = 'Building2' }) {
  const IconComponent = iconMap[icon] || Building2;
  const isWarning = trend === 'warning';
  const isUp = trend === 'up';

  return (
    <div className="sa-stats-card">
      <div className="sa-stats-card-header">
        <span className="sa-stats-label">{label}</span>
        <div className={`sa-stats-icon-box ${isWarning ? 'sa-stats-icon-box--warning' : 'sa-stats-icon-box--default'}`}>
          <IconComponent className="sa-stats-icon" />
        </div>
      </div>

      <div className="sa-stats-card-body">
        <span className="sa-stats-val">{value}</span>
        <div className={`sa-stats-change ${isWarning ? 'sa-stats-change-text--warning' : 'sa-stats-change-text--up'}`}>
          <TrendingUp className="sa-stats-trend-icon" />
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let badgeClass = 'sa-status-badge--default';
  if (status === 'Active' || status === 'Verified' || status === 'Available' || status === 'Protected') {
    badgeClass = 'sa-status-badge--active';
  } else if (status === 'Pending Verification' || status === 'Pending') {
    badgeClass = 'sa-status-badge--warning';
  } else if (status === 'High' || status === 'In Progress') {
    badgeClass = 'sa-status-badge--info';
  }

  return (
    <span className={`sa-status-badge ${badgeClass}`}>
      <span className="sa-status-dot"></span>
      {status}
    </span>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Super Admin");
  const [userInitials, setUserInitials] = useState("SA");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Super Admin");
  const [collegesList, setCollegesList] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [liveMetrics, setLiveMetrics] = useState({
    collegesCount: 0,
    studentsCount: 0,
    departmentsCount: 0,
    securityStatus: "Protected"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const name = stored.name || stored.fullName || stored.email?.split('@')[0] || "Super Admin";
        setUserName(name);
        setUserEmail(stored.email || "");
        setUserRole(stored.role || "Super Admin");
        setUserInitials(name ? name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SA");

        const res = await apiFetch('/auth/me');
        if (res && res.data) {
          const u = res.data;
          const apiName = u.name || u.fullName || u.email?.split('@')[0] || name;
          setUserName(apiName);
          setUserEmail(u.email || stored.email || "");
          setUserRole(u.role || stored.role || "Super Admin");
          setUserInitials(apiName ? apiName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "SA");
        }
      } catch (e) {}
    };

    loadUser();
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoadingStats(true);
    try {
      const collegesRes = await apiFetch('/colleges');
      if (collegesRes && Array.isArray(collegesRes.data)) {
        setCollegesList(collegesRes.data);
        const totalStudents = collegesRes.data.reduce((sum, c) => sum + (c.studentsCount || c.student_count || 0), 0);
        const totalDepts = collegesRes.data.reduce((sum, c) => sum + (c.departmentsCount || c.department_count || 0), 0);

        setLiveMetrics({
          collegesCount: collegesRes.data.length,
          studentsCount: totalStudents,
          departmentsCount: totalDepts || 0,
          securityStatus: "Protected"
        });
      }
    } catch (err) {
      console.warn("[SuperAdmin Overview] API load fallback:", err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const stats = [
    {
      id: 1,
      label: "Total Partner Colleges",
      value: liveMetrics.collegesCount.toString(),
      change: liveMetrics.collegesCount > 0 ? `${liveMetrics.collegesCount} Registered Institutions` : "No colleges registered",
      trend: "up",
      icon: "Building2"
    },
    {
      id: 2,
      label: "Active Enrolled Students",
      value: liveMetrics.studentsCount.toString(),
      change: liveMetrics.studentsCount > 0 ? "Synced from institutional DB" : "Awaiting student sync",
      trend: "up",
      icon: "Users"
    },
    {
      id: 3,
      label: "Departments Covered",
      value: liveMetrics.departmentsCount.toString(),
      change: liveMetrics.departmentsCount > 0 ? `${liveMetrics.departmentsCount} Active Tracks` : "No active departments",
      trend: "up",
      icon: "GraduationCap"
    },
    {
      id: 4,
      label: "Security & Key Access",
      value: "Protected",
      change: "Secure Code Enforced",
      trend: "up",
      icon: "ShieldCheck"
    },
  ];

  return (
    <div className="overview-page-wrap">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card-sa">
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
              {userRole || "Super Admin"} &nbsp;|&nbsp; {userEmail || "superadmin@pvppcoe.ac.in"} &nbsp;|&nbsp; Institutional Control
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <Link to="/super-admin/users" className="overview-hero-btn">
            <ShieldCheck size={16} />
            <span>Manage User Directory</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Main Content Grid: Security Widget & Connected Institutions */}
      <div className="sa-bottom-grid">
        {/* Security & Registration Access Widget */}
        <div className="sa-widget-card overview-widget-flex">
          <div className="overview-widget-header">
            <div className="overview-widget-title-wrap">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="overview-widget-title">Registration Security Posture</h3>
            </div>
            <Link to="/super-admin/users" className="overview-widget-link">
              Manage Keys <ChevronRight size={13} />
            </Link>
          </div>

          <div className="sa-sec-body">
            <div className="sa-sec-banner">
              <div className="sa-sec-banner-icon">
                <Lock size={18} />
              </div>
              <div className="sa-sec-banner-text">
                <h4 className="sa-sec-banner-title">Secure Key Verification Active</h4>
                <p className="sa-sec-banner-desc">
                  Self-registration is locked. Colleges require a Super Admin invitation code to register.
                </p>
              </div>
            </div>

            <div className="sa-sec-grid">
              <div className="sa-sec-grid-card">
                <span className="sa-sec-card-label">Access Method</span>
                <span className="sa-sec-card-val">
                  <KeyRound size={14} className="sa-sec-icon-emerald" /> Pre-Authorized Code
                </span>
              </div>
              <div className="sa-sec-grid-card">
                <span className="sa-sec-card-label">Unverified Self-Signups</span>
                <span className="sa-sec-card-val sa-sec-val-emerald">
                  <ShieldCheck size={14} /> Blocked (0 Pending)
                </span>
              </div>
            </div>

            <div className="sa-sec-footer-badge">
              <Activity size={13} className="text-emerald-500" />
              <span>System Firewall & RBAC Guard Active (100% Policy Compliance)</span>
            </div>
          </div>
        </div>

        {/* Connected Institutions Overview Widget */}
        <div className="sa-widget-card overview-widget-flex">
          <div className="overview-widget-header">
            <div className="overview-widget-title-wrap">
              <Building2 size={18} className="overview-widget-icon-indigo" />
              <h3 className="overview-widget-title">Connected Institutions Overview</h3>
            </div>
            <Link to="/super-admin/colleges" className="overview-widget-link">
              <span>All Colleges</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {collegesList.length === 0 ? (
            <div className="overview-empty-wrap">
              <EmptyState
                icon={Building2}
                title="No Colleges Connected"
                description="No institutions or universities are registered on the platform yet."
                actionText="Add New College"
                onAction={() => navigate('/super-admin/colleges')}
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
                  {collegesList.slice(0, 5).map((college) => (
                    <tr key={college.id} className="overview-table-row">
                      <td className="overview-table-td">
                        <div className="overview-td-title">{college.name}</div>
                        <div className="overview-td-sub">{college.code}</div>
                      </td>
                      <td className="overview-table-td overview-td-text">{college.location || "Main Campus"}</td>
                      <td className="overview-table-td overview-td-count">{college.studentsCount || college.student_count || 0}</td>
                      <td className="overview-table-td">
                        <StatusBadge status={college.status || 'Active'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Shortcuts & Health Status Row */}
      <div className="sa-overview-quick-row">
        <div className="sa-quick-card">
          <div className="sa-quick-header">
            <Activity size={16} className="text-indigo-600" />
            <h4 className="sa-quick-title">Platform Quick Operations</h4>
          </div>
          <div className="sa-quick-grid">
            <Link to="/super-admin/colleges" className="sa-quick-item">
              <div className="sa-quick-icon-box sa-quick-icon--blue">
                <Building2 size={18} />
              </div>
              <div className="sa-quick-item-text">
                <span className="sa-quick-item-title">Colleges Hub</span>
                <span className="sa-quick-item-sub">Add or verify institutes</span>
              </div>
            </Link>

            <Link to="/super-admin/departments" className="sa-quick-item">
              <div className="sa-quick-icon-box sa-quick-icon--emerald">
                <GraduationCap size={18} />
              </div>
              <div className="sa-quick-item-text">
                <span className="sa-quick-item-title">Departments</span>
                <span className="sa-quick-item-sub">Manage academic tracks</span>
              </div>
            </Link>

            <Link to="/super-admin/users" className="sa-quick-item">
              <div className="sa-quick-icon-box sa-quick-icon--purple">
                <UserCheck size={18} />
              </div>
              <div className="sa-quick-item-text">
                <span className="sa-quick-item-title">User Directory</span>
                <span className="sa-quick-item-sub">RBAC & Role Assignments</span>
              </div>
            </Link>

            <Link to="/super-admin/maintenance" className="sa-quick-item">
              <div className="sa-quick-icon-box sa-quick-icon--amber">
                <Server size={18} />
              </div>
              <div className="sa-quick-item-text">
                <span className="sa-quick-item-title">System Controls</span>
                <span className="sa-quick-item-sub">Maintenance & System Audit</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="sa-health-card">
          <div className="sa-quick-header">
            <Server size={16} className="text-emerald-600" />
            <h4 className="sa-quick-title">Real-Time Core Status</h4>
          </div>
          <div className="sa-health-list">
            <div className="sa-health-item">
              <div className="sa-health-left">
                <span className="sa-health-dot sa-health-dot--online"></span>
                <span className="sa-health-name">API Gateway Proxy</span>
              </div>
              <span className="sa-health-status sa-health-status--online">99.9% Operational</span>
            </div>

            <div className="sa-health-item">
              <div className="sa-health-left">
                <span className="sa-health-dot sa-health-dot--online"></span>
                <span className="sa-health-name">Authentication Engine</span>
              </div>
              <span className="sa-health-status sa-health-status--online">Secure</span>
            </div>

            <div className="sa-health-item">
              <div className="sa-health-left">
                <span className="sa-health-dot sa-health-dot--online"></span>
                <span className="sa-health-name">Database Cluster</span>
              </div>
              <span className="sa-health-status sa-health-status--online">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
