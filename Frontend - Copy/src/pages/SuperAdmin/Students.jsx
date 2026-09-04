import React, { useState } from 'react';
import { initialStudentsRiskAlerts } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { UserX, Search, AlertTriangle, Building2, Layers } from 'lucide-react';

export default function Students() {
  const [students] = useState(initialStudentsRiskAlerts);
  const [search, setSearch] = useState('');

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-600" />
            <span>Student Risk & Drop-out Signal Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">Cross-institutional student performance flags, low attendance alerts, and intervention triggers</p>
        </div>
      </div>

      <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
        <p className="text-xs text-rose-800 font-medium">
          Students flagged in this view fall below the minimum institutional engagement threshold or have consecutive missing code assessment submissions.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Cohort Batch</th>
                <th className="py-3 px-4">Risk Signal Reason</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{student.name}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{student.college}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{student.batch}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-medium">{student.reason}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{student.score}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={student.riskLevel} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdown
                      onView={() => alert(`View student audit for ${student.name}`)}
                    />
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
