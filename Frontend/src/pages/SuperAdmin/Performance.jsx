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
  ChevronRight
} from 'lucide-react';
import { initialPerformanceData } from '../../data/superAdminMockData';
import './SuperAdmin.css';

// Enhanced Mock Data for Feature Performance Analytics
const featurePerformanceData = {
  overall: initialPerformanceData,
  features: [
    {
      id: 'coding',
      name: 'Coding Practice & Monitoring',
      description: 'Algorithm challenges, live test runner & submissions',
      icon: Code,
      color: 'indigo',
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
      color: 'purple',
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
      color: 'amber',
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
      color: 'emerald',
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
      color: 'blue',
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
  const { features, overall } = featurePerformanceData;

  const filteredFeatures = features.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.topPerformer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Platform Performance &amp; Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cross-feature student engagement, completion rates, and institutional benchmarks
          </p>
        </div>
        <button className="sa-btn-primary ml-auto">
          <Award size={16} />
          <span>Export Analytics Summary</span>
        </button>
      </div>

      {/* Standardized 3-Card Metric Grid */}
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

      {/* Standard Search Bar */}
      <div className="sa-search-card">
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search feature module or college name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* Feature Performance Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Feature-Wise Performance Breakdown</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">Feature Module</th>
                <th className="py-3.5 px-5">Active Students</th>
                <th className="py-3.5 px-5">Completion Rate</th>
                <th className="py-3.5 px-5">Avg Accuracy</th>
                <th className="py-3.5 px-5">Leading Institution</th>
                <th className="py-3.5 px-5 text-right">Growth Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <tr key={feat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{feat.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{feat.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{feat.activeUsers.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{feat.metricLabel}: {feat.metricValue}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${feat.completionRate}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-800">{feat.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {feat.avgAccuracy}%
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{feat.topPerformer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
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

      {/* College Benchmark Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Institutional Benchmark Leaderboard</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Updated today</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">College Name</th>
                <th className="py-3.5 px-5">Pass Rate</th>
                <th className="py-3.5 px-5">Readiness Index</th>
                <th className="py-3.5 px-5">Enrolled Students</th>
                <th className="py-3.5 px-5 text-right">Top Performing Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {overall.collegeBenchmarks.map((c) => (
                <tr key={c.college} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 text-sm">{c.college}</td>
                  <td className="py-4 px-5 text-emerald-600 font-extrabold text-sm">{c.passRate}%</td>
                  <td className="py-4 px-5 font-bold text-slate-800">{c.readinessScore} / 100</td>
                  <td className="py-4 px-5 text-slate-600 font-medium">{c.activeStudents} Students</td>
                  <td className="py-4 px-5 text-right">
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
