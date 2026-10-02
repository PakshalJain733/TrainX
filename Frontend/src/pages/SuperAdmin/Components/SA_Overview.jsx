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

  const themes = {
    indigo: { bg: '#eff6ff', color: '#3b82f6', text: '#3b82f6' },
    emerald: { bg: '#eff6ff', color: '#3b82f6', text: '#3b82f6' },
    purple: { bg: '#eff6ff', color: '#3b82f6', text: '#3b82f6' },
    sky: { bg: '#eff6ff', color: '#3b82f6', text: '#3b82f6' }
  };

  const currentTheme = themes[theme] || themes.indigo;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }} className="hover:shadow-md hover:border-indigo-200">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'min-content' }}>{label}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: currentTheme.bg, color: currentTheme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComponent size={14} />
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{value}</h3>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#4f46e5', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={12} /> {change}
        </p>
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
      } catch (e) {}
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
