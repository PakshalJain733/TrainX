import React from 'react';
import { initialPerformanceData } from '../../data/superAdminMockData';
import { TrendingUp, Award, CheckCircle2, BarChart2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import './SuperAdmin.css';

export default function Performance() {
  const data = initialPerformanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Platform Performance & Benchmarks</span>
          </h2>
          <p className="text-xs text-slate-500">Cross-college pass rate analytics, subject proficiency, and institutional readiness</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Award className="w-4 h-4" />
          <span>Export Analytics Summary</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Overall Institutional Pass Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.overallPassRate}%</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +3.8% vs last month
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg Placement Readiness Score</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{data.avgPlacementReadiness} / 100</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Top Tier Benchmark
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subject Proficiency */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Domain Proficiency Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.subjectProficiency.map((item) => (
            <div key={item.subject} className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">{item.subject}</span>
                <span className="text-indigo-600">{item.score}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full sa-progress-bar-fill"
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* College Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">College Performance Leaderboard</h3>
          <span className="text-xs text-slate-400">Updated today</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">College Name</th>
                <th className="px-5 py-3">Pass Rate</th>
                <th className="px-5 py-3">Readiness Index</th>
                <th className="px-5 py-3">Active Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.collegeBenchmarks.map((c) => (
                <tr key={c.college} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{c.college}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-semibold">{c.passRate}%</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{c.readinessScore} / 100</td>
                  <td className="px-5 py-3.5 text-slate-500">{c.activeStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
