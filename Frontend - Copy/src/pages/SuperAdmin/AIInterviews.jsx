import React from 'react';
import { initialAIInterviews } from '../../data/superAdminMockData';
import { Sparkles, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AIInterviews() {
  const interviews = initialAIInterviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI Mock Interview Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">Automated technical and behavioral mock interview evaluations across students</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Interviews Completed</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">1,280 sessions</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">+140 this week</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Avg Technical Score</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">80.5 / 100</h3>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Strong coding proficiency</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Primary Focus Area</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">System Design</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Recommended for additional workshops</p>
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Candidate Evaluations</h3>
          <span className="text-xs text-slate-400">AI Diagnostic Log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Target Role</th>
                <th className="px-5 py-3">Tech Score</th>
                <th className="px-5 py-3">Behavioral Score</th>
                <th className="px-5 py-3">Overall Score</th>
                <th className="px-5 py-3">AI Diagnostic Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{item.studentName}</p>
                    <p className="text-[11px] text-slate-400">{item.college}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-indigo-600">{item.role}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{item.technicalScore}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{item.behavioralScore}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">{item.overallScore}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{item.weakAreas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
