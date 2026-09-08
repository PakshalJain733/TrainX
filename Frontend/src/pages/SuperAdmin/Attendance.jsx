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
    <div className="space-y-6 text-slate-100">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Attendance Governance & Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">Institutional attendance tracking and session logs</p>
        </div>
      </div>

      <div className="sa-search-card flex items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1 relative">
          <Search className="sa-search-icon absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search college, department, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono bg-slate-950/40">
            <tr>
              <th className="py-3 px-4">College / Department</th>
              <th className="py-3 px-4">Target Batch</th>
              <th className="py-3 px-4">Total Sessions</th>
              <th className="py-3 px-4">Avg Attendance Rate</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-white">
                  <div>{item.college}</div>
                  <div className="text-xs text-indigo-400 font-normal">{item.department}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-medium">{item.batch}</td>
                <td className="py-3.5 px-4 text-slate-300 font-mono">{item.totalSessions} Sessions</td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">{item.avgAttendance}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    item.status === 'Good' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
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
