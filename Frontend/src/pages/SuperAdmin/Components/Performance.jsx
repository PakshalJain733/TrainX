import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  BarChart2,
  ArrowUpRight,
  ShieldCheck,
  Code,
  Target,
  Sparkles,
  ClipboardCheck,
  CalendarCheck,
  Building2,
  Search,
  Activity,
  Zap,
  ChevronRight,
  Users
} from 'lucide-react';
import { initialPerformanceData } from '../../../data/superAdminMockData';
import '../Styles/SuperAdmin.css';
import '../Styles/Performance.css';

// Enhanced Mock Data for Feature Performance Analytics
const featurePerformanceData = {
  overall: initialPerformanceData,
  features: [
    {
      id: 'coding',
      name: 'Coding Practice & Monitoring',
      description: 'Algorithm challenges, live test runner & submissions',
      icon: Code,
      colorClass: 'perf-icon-indigo',
      badgeClass: 'perf-badge-indigo',
      activeUsers: 1240,
      totalSubmissions: '42.8K',
      avgAccuracy: 78.4,
      completionRate: 84.2,
      trend: '+5.4%',
      topPerformer: 'PVPPCOE Mumbai',
      metricLabel: 'Problems Solved',
      metricValue: '1,890',
    },
    {
      id: 'roadmaps',
      name: 'AI Learning Roadmaps',
      description: 'Personalized student career & skill progression',
      icon: Target,
      colorClass: 'perf-icon-purple',
      badgeClass: 'perf-badge-purple',
      activeUsers: 980,
      totalSubmissions: '12.4K',
      avgAccuracy: 88.1,
      completionRate: 79.6,
      trend: '+8.2%',
      topPerformer: 'Apex Institute of Tech',
      metricLabel: 'Milestones Achieved',
      metricValue: '3,450',
    },
    {
      id: 'interviews',
      name: 'AI Mock Interviews',
      description: 'Automated technical & HR mock interview sessions',
      icon: Sparkles,
      colorClass: 'perf-icon-amber',
      badgeClass: 'perf-badge-amber',
      activeUsers: 640,
      totalSubmissions: '3.1K',
      avgAccuracy: 74.2,
      completionRate: 71.5,
      trend: '+12.1%',
      topPerformer: 'Meridian College',
      metricLabel: 'Sessions Cleared',
      metricValue: '512',
    },
    {
      id: 'drives',
      name: 'Mock Placement Drives',
      description: 'Simulated campus recruitment & company tests',
      icon: ClipboardCheck,
      colorClass: 'perf-icon-emerald',
      badgeClass: 'perf-badge-emerald',
      activeUsers: 890,
      totalSubmissions: '8.7K',
      avgAccuracy: 81.9,
      completionRate: 89.0,
      trend: '+3.8%',
      topPerformer: 'PVPPCOE Mumbai',
      metricLabel: 'Drive Qualification',
      metricValue: '64%',
    },
    {
      id: 'attendance',
      name: 'Attendance & Tracking',
      description: 'Institutional class presence & defaulter monitoring',
      icon: CalendarCheck,
      colorClass: 'perf-icon-blue',
      badgeClass: 'perf-badge-blue',
      activeUsers: 2450,
      totalSubmissions: '94.2K',
      avgAccuracy: 91.5,
      completionRate: 92.8,
      trend: '+1.2%',
      topPerformer: 'Vanguard Institute',
      metricLabel: 'Overall Attendance',
      metricValue: '91.5%',
    },
  ]
};

export default function Performance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table'
  const { features, overall } = featurePerformanceData;

  const filteredFeatures = features.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.topPerformer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="performance-page-wrap">
      {/* Page Header */}
      <div className="performance-header-wrap">
        <div>
          <h2 className="performance-header-title">
            <TrendingUp className="performance-header-icon" />
            <span>Platform Performance &amp; Analytics</span>
          </h2>
          <p className="performance-header-subtitle">
            Cross-feature student engagement, completion rates, and institutional benchmarks
          </p>
        </div>
        <button className="sa-btn-primary ml-auto">
          <Award size={16} />
          <span>Export Analytics Summary</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Institutional Pass Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{overall.overallPassRate}%</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <ArrowUpRight size={13} /> +3.8% vs last month
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Avg Readiness Score</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <BarChart2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{overall.avgPlacementReadiness} / 100</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-1">
              <ShieldCheck size={13} /> Top Tier Benchmark
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Active Modules</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{features.length} Features</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 mt-1">
              <Activity size={13} /> 100% Operational
            </span>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="departments-filter-card">
        <div className="sa-search-wrap dept-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search feature module or college name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('cards')}
            className={`manageusers-tab-btn ${activeView === 'cards' ? 'manageusers-tab-btn--active' : ''}`}
          >
            <Zap size={14} />
            <span>Card Grid</span>
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`manageusers-tab-btn ${activeView === 'table' ? 'manageusers-tab-btn--active' : ''}`}
          >
            <Activity size={14} />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* CARDS VIEW */}
      {activeView === 'cards' && (
        <div className="perf-grid">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="perf-card">
                <div>
                  <div className="perf-card-header">
                    <div className={feat.colorClass}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="perf-card-title">{feat.name}</h3>
                      <p className="perf-card-desc">{feat.description}</p>
                    </div>
                  </div>

                  <div className="perf-metrics-grid">
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Active Students</div>
                      <div className="perf-metric-val">{feat.activeUsers.toLocaleString()}</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Avg Accuracy</div>
                      <div className="perf-metric-val" style={{ color: "#059669" }}>{feat.avgAccuracy}%</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">{feat.metricLabel}</div>
                      <div className="perf-metric-val">{feat.metricValue}</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Growth Trend</div>
                      <div className="perf-metric-val" style={{ color: "#4f46e5", display: "flex", alignItems: "center", gap: "2px" }}>
                        <ArrowUpRight size={14} /> {feat.trend}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="perf-progress-section">
                  <div className="perf-progress-meta">
                    <span>Completion Progress</span>
                    <span>{feat.completionRate}%</span>
                  </div>
                  <div className="perf-progress-bar-bg">
                    <div
                      className="perf-progress-bar-fill"
                      style={{ width: `${feat.completionRate}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{feat.topPerformer}</span>
                    </div>
                    <span className="font-bold text-indigo-600">Top Institution</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {activeView === 'table' && (
        <div className="batches-table-card">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Feature-Wise Performance Breakdown</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Real-time metrics</span>
          </div>

          <div className="batches-table-wrap">
            <table className="batches-table">
              <thead>
                <tr className="batches-thead-row">
                  <th className="batches-th">Feature Module</th>
                  <th className="batches-th">Active Students</th>
                  <th className="batches-th">Completion Rate</th>
                  <th className="batches-th">Avg Accuracy</th>
                  <th className="batches-th">Leading Institution</th>
                  <th className="batches-th-right">Growth Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <tr key={feat.id} className="batches-tr">
                      <td className="batches-td">
                        <div className="flex items-center gap-3">
                          <div className={feat.colorClass} style={{ width: "36px", height: "36px", borderRadius: "10px" }}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="batches-cohort-title">{feat.name}</div>
                            <div className="batches-cohort-sub">{feat.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="batches-td">
                        <div className="font-bold text-slate-900">{feat.activeUsers.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{feat.metricLabel}: {feat.metricValue}</div>
                      </td>
                      <td className="batches-td">
                        <div className="batches-progress-wrap">
                          <div className="batches-progress-bar-bg">
                            <div className="batches-progress-bar-fill" style={{ width: `${feat.completionRate}%` }}></div>
                          </div>
                          <span className="batches-progress-text">{feat.completionRate}%</span>
                        </div>
                      </td>
                      <td className="batches-td">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {feat.avgAccuracy}%
                        </span>
                      </td>
                      <td className="batches-td">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{feat.topPerformer}</span>
                        </div>
                      </td>
                      <td className="batches-td-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <ArrowUpRight size={13} /> {feat.trend}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* College Benchmark Leaderboard Table */}
      <div className="batches-table-card">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Institutional Benchmark Leaderboard</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Updated today</span>
        </div>
        <div className="batches-table-wrap">
          <table className="batches-table">
            <thead>
              <tr className="batches-thead-row">
                <th className="batches-th">College Name</th>
                <th className="batches-th">Pass Rate</th>
                <th className="batches-th">Readiness Index</th>
                <th className="batches-th">Enrolled Students</th>
                <th className="batches-th-right">Top Performing Module</th>
              </tr>
            </thead>
            <tbody>
              {overall.collegeBenchmarks.map((c) => (
                <tr key={c.college} className="batches-tr">
                  <td className="batches-td">
                    <div className="batches-cohort-title">{c.college}</div>
                  </td>
                  <td className="batches-td text-emerald-600 font-extrabold">
                    {c.passRate}%
                  </td>
                  <td className="batches-td font-bold text-slate-800">
                    {c.readinessScore} / 100
                  </td>
                  <td className="batches-td text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-slate-400" />
                      <span>{c.activeStudents} Students</span>
                    </div>
                  </td>
                  <td className="batches-td-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Coding Practice
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
