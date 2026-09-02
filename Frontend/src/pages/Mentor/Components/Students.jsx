import React, { useState } from 'react';
import { mentorStudents } from '../../../data/mentorMockData';
import { Users, Search, AlertTriangle, CheckCircle, Mail, MessageSquare } from 'lucide-react';

export default function Students() {
  const [search, setSearch] = useState('');
  const students = mentorStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
    s.batch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="text-xs text-slate-500">Track student progress, attendance %, assessment scores, and intervention flags</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll number, or cohort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Roll No</th>
                <th className="px-5 py-3">Assigned Batch</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Avg Score</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[11px] text-slate-400">{s.college}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">{s.rollNo}</td>
                  <td className="px-5 py-3.5 text-slate-700">{s.batch}</td>
                  <td className="px-5 py-3.5 font-bold text-indigo-600">{s.attendance}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{s.avgScore}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      s.riskStatus === 'Top Performer'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s.riskStatus === 'Good'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : s.riskStatus === 'Moderate'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {s.riskStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition mr-1">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition">
                      <Mail className="w-4 h-4" />
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
