import React, { useState } from 'react';
import { CalendarCheck, Search, CheckCircle2, XCircle, Clock, Building2, Filter } from 'lucide-react';

const mockAttendanceData = [
  { id: 1, college: "PVPPCOE Mumbai", department: "Computer Engineering", batch: "CSE 2026 Alpha", totalSessions: 48, avgAttendance: "94.2%", status: "Good" },
  { id: 2, college: "Apex Institute", department: "Information Technology", batch: "IT 2026 Beta", totalSessions: 42, avgAttendance: "68.5%", status: "Needs Support" },
  { id: 3, college: "Meridian College", department: "AI & Data Science", batch: "AI 2026 Cohort", totalSessions: 45, avgAttendance: "88.0%", status: "Good" },
  { id: 4, college: "Vanguard Institute", department: "Electronics Engineering", batch: "ECE 2026", totalSessions: 40, avgAttendance: "82.4%", status: "Good" }
];

export default function Attendance() {
  const [attendanceList] = useState(mockAttendanceData);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = attendanceList.filter(item =>
    item.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Attendance Governance & Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">Institutional attendance tracking and session logs</p>
        </div>
      </div>

      <div className="sa-search-card">
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search college, department, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs text-slate-500 border-b border-slate-200 uppercase font-mono bg-slate-50">
            <tr>
              <th className="py-3 px-4">College / Department</th>
              <th className="py-3 px-4">Target Batch</th>
              <th className="py-3 px-4">Total Sessions</th>
              <th className="py-3 px-4">Avg Attendance Rate</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div>{item.college}</div>
                  <div className="text-xs text-indigo-600 font-normal">{item.department}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">{item.batch}</td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">{item.totalSessions} Sessions</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600">{item.avgAttendance}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    item.status === 'Good' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
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
  );
}
