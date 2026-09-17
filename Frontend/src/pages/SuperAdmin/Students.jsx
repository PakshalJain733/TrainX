import React, { useState } from 'react';
import { Users, Search, AlertTriangle, CheckCircle2, ShieldAlert, TrendingDown } from 'lucide-react';

const mockStudentsRisk = [
  { id: 1, name: "Aarav Sharma", rollNo: "CSE-2026-001", college: "PVPPCOE Mumbai", batch: "CSE 2026 Alpha", attendance: "98%", risk: "Low Risk", status: "Active" },
  { id: 2, name: "Tanvi Deshmukh", rollNo: "IT-2026-012", college: "Apex Institute", batch: "IT 2026 Beta", attendance: "62%", risk: "High Risk", status: "Defaulter" },
  { id: 3, name: "Karan Mehta", rollNo: "ECS-2026-044", college: "PVPPCOE Mumbai", batch: "ECS 2026 Alpha", attendance: "88%", risk: "Low Risk", status: "Active" },
  { id: 4, name: "Rohan Kulkarni", rollNo: "AI-2026-033", college: "Meridian College", batch: "AI-DS 2026", attendance: "71%", risk: "Moderate Risk", status: "Needs Monitoring" }
];

export default function Students() {
  const [students] = useState(mockStudentsRisk);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Students Risk & Participation Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">Track student engagement, attendance risk factors, and platform metrics</p>
        </div>
      </div>

      <div className="sa-search-card flex items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1 relative">
          <Search className="sa-search-icon absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search student name, roll number, college..."
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
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Roll No / Batch</th>
              <th className="py-3 px-4">College</th>
              <th className="py-3 px-4">Attendance Rate</th>
              <th className="py-3 px-4 text-right">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {s.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  {s.name}
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{s.rollNo} ({s.batch})</td>
                <td className="py-3.5 px-4 text-slate-300 font-medium">{s.college}</td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold">{s.attendance}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    s.risk === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    s.risk === 'Moderate Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {s.risk}
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
