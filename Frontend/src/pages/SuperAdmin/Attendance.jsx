import React from 'react';
import { initialAttendanceData } from '../../data/superAdminMockData';
import { CalendarCheck, AlertCircle, CheckCircle, Users } from 'lucide-react';

export default function Attendance() {
  const data = initialAttendanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Attendance Monitoring & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">Cross-institutional batch attendance rate, daily logs, and low-attendance alerts</p>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Avg Portal Attendance</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">91.5%</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Above institutional threshold (75%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Flagged Batches</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">1 Batch</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Cloud DevOps (&lt;80% attendance)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Daily Active Logins</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">3,420</h3>
          <p className="text-[11px] text-slate-500 mt-1">89% of enrolled students active today</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Batch Attendance Audit</h3>
          <span className="text-xs text-slate-400">Live data sync</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">College & Batch</th>
                <th className="px-5 py-3">Enrolled Students</th>
                <th className="px-5 py-3">Avg Attendance</th>
                <th className="px-5 py-3">Flagged Students</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{item.batch}</p>
                    <p className="text-[11px] text-slate-400">{item.college}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{item.totalStudents}</td>
                  <td className="px-5 py-3.5 font-bold text-indigo-600">{item.avgAttendance}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-600">{item.flaggedStudents} students</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      item.status === 'Healthy'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.status === 'Moderate'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status}
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
