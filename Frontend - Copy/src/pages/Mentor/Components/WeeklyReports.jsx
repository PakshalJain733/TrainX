import React from 'react';
import { mentorWeeklyReports } from '../../../data/mentorMockData';
import { FileCheck2, Plus, Download, CheckCircle2 } from 'lucide-react';

export default function WeeklyReports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="text-xs text-slate-500">Submit weekly batch audit reports to Super Admin and Department HODs</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Submit Weekly Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Report Title</th>
                <th className="px-5 py-3">Covered Batch</th>
                <th className="px-5 py-3">Submission Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mentorWeeklyReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{r.title}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{r.batch}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.submittedAt}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-semibold rounded-lg transition inline-flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
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
