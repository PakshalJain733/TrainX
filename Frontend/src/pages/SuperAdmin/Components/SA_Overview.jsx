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

function StatsCard({ label, value, change, trend = 'up', icon = 'Building2', theme = 'indigo' }) {
  const IconComponent = iconMap[icon] || Building2;

  const themeConfig = {
    indigo: {
      accent: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
      iconBg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      iconColor: '#4338ca',
      iconBorder: '#c7d2fe',
      iconShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
      pillBg: '#eef2ff',
      pillColor: '#3730a3',
      pillBorder: '#c7d2fe',
      className: 'stat-card-indigo'
    },
    emerald: {
      accent: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
      iconBg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      iconColor: '#047857',
      iconBorder: '#a7f3d0',
      iconShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
      pillBg: '#ecfdf5',
      pillColor: '#065f46',
      pillBorder: '#a7f3d0',
      className: 'stat-card-emerald'
    },
    purple: {
      accent: 'linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)',
      iconBg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
      iconColor: '#6d28d9',
      iconBorder: '#ddd6fe',
      iconShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
      pillBg: '#f3e8ff',
      pillColor: '#5b21b6',
      pillBorder: '#ddd6fe',
      className: 'stat-card-purple'
    },
    sky: {
      accent: 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)',
      iconBg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      iconColor: '#0369a1',
      iconBorder: '#7dd3fc',
      iconShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
      pillBg: '#e0f2fe',
      pillColor: '#075985',
      pillBorder: '#7dd3fc',
      className: 'stat-card-sky'
    }
  };

  const t = themeConfig[theme] || themeConfig.indigo;

  return (
    <div className={`sa-pro-card ${t.className}`}>
      {/* Top Accent Gradient Ribbon */}
      <div className="sa-pro-card-accent" style={{ background: t.accent }} />

      {/* Header Row: Label & Icon Badge */}
      <div className="sa-pro-card-header">
        <span className="sa-pro-card-label">{label}</span>
        <div
          className="sa-pro-card-icon-box"
          style={{
            background: t.iconBg,
            color: t.iconColor,
            border: `1px solid ${t.iconBorder}`,
            boxShadow: t.iconShadow
          }}
        >
          <IconComponent size={18} />
        </div>
      </div>

      {/* Body Section */}
      <div className="sa-pro-card-body">
        <div className="sa-pro-card-value-wrap">
          {value === "Protected" ? (
            <span className="sa-pro-card-value-protected">
              <span className="sa-pro-card-dot" />
              {value}
            </span>
          ) : (
            <h3 className="sa-pro-card-value">{value}</h3>
          )}
        </div>

        <div className="sa-pro-card-pill-wrap">
          <span
            className="sa-pro-card-pill"
            style={{
              backgroundColor: t.pillBg,
              color: t.pillColor,
              border: `1px solid ${t.pillBorder}`
            }}
          >
            <Activity size={12} />
            <span>{change}</span>
          </span>
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
    collegesCount: 1,
    studentsCount: 1,
    departmentsCount: 8,
    securityStatus: "Protected"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
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
      } catch (e) { }
    };

    loadUser();
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoadingStats(true);
    try {
      const [collegesRes, deptsRes, usersRes, healthRes] = await Promise.all([
        apiFetch('/colleges').catch(() => null),
        apiFetch('/departments').catch(() => null),
        apiFetch('/admin/users').catch(() => null),
        apiFetch('/system/health').catch(() => null),
      ]);

      let collegesCount = 0;
      let studentsCount = 0;
      let departmentsCount = 0;

      if (collegesRes && Array.isArray(collegesRes.data)) {
        setCollegesList(collegesRes.data);
        collegesCount = collegesRes.data.length;
        studentsCount = collegesRes.data.reduce(
          (sum, c) => sum + (Number(c.student_count) || Number(c.studentsCount) || 0),
          0
        );
        departmentsCount = collegesRes.data.reduce(
          (sum, c) => sum + (Number(c.department_count) || Number(c.departmentsCount) || 0),
          0
        );
      }

      if (deptsRes && Array.isArray(deptsRes.data)) {
        departmentsCount = Math.max(departmentsCount, deptsRes.data.length);
      }

      if (usersRes && Array.isArray(usersRes.data)) {
        const studentUsers = usersRes.data.filter(
          (u) => String(u.role).toLowerCase() === 'student'
        );
        studentsCount = Math.max(studentsCount, studentUsers.length);
      }

      if (healthRes && healthRes.data && healthRes.data.systemMetrics) {
        const sm = healthRes.data.systemMetrics;
        if (collegesCount === 0 && sm.totalColleges) collegesCount = Number(sm.totalColleges);
        if (studentsCount === 0 && sm.totalStudents) studentsCount = Number(sm.totalStudents);
        if (departmentsCount === 0 && sm.totalDepartments) departmentsCount = Number(sm.totalDepartments);
      }

      setLiveMetrics({
        collegesCount: collegesCount,
        studentsCount: studentsCount,
        departmentsCount: departmentsCount,
        securityStatus: "Protected"
      });
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
      value: loadingStats ? "..." : liveMetrics.collegesCount.toString(),
      change: `${liveMetrics.collegesCount} Registered Institutions`,
      trend: "up",
      icon: "Building2",
      theme: "indigo"
    },
    {
      id: 2,
      label: "Active Enrolled Students",
      value: loadingStats ? "..." : liveMetrics.studentsCount.toString(),
      change: "Active Student Accounts",
      trend: "up",
      icon: "Users",
      theme: "emerald"
    },
    {
      id: 3,
      label: "Departments Covered",
      value: loadingStats ? "..." : liveMetrics.departmentsCount.toString(),
      change: `${liveMetrics.departmentsCount} Academic Tracks`,
      trend: "up",
      icon: "GraduationCap",
      theme: "purple"
    },
    {
      id: 4,
      label: "Security & Key Access",
      value: "Protected",
      change: "100% RBAC Policy Enforced",
      trend: "up",
      icon: "ShieldCheck",
      theme: "sky"
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
              {userRole || "Super Admin"} &nbsp;|&nbsp; {userEmail || "admin@trainingportal.com"} &nbsp;|&nbsp; Institutional Control
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

      {/* Main Content Grid: Connected Institutions */}
      <div className="sa-bottom-grid" style={{ gridTemplateColumns: "1fr" }}>
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


    </div>
  );
}
