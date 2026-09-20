import React, { useState, useEffect } from 'react';
import { CalendarCheck, Search, RefreshCw, Building2 } from 'lucide-react';
import { superAdminAPI } from '../../services/api';

export default function Attendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAttendance = () => {
    setLoading(true);
    superAdminAPI.attendance()
      .then((data) => setAttendanceList(Array.isArray(data) ? data : []))
      .catch(() => setAttendanceList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const filtered = attendanceList.filter(item =>
    (item.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.batch || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusStyle = (status) => {
    if (status === 'Healthy') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (status === 'Moderate') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

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
        <button
          onClick={loadAttendance}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
          title="Refresh API"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="sa-search-card flex items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1 relative">
          <Search className="sa-search-icon absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search college or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm font-medium">
            {loading ? 'Loading attendance…' : 'No batches with attendance data yet.'}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">College / Dept</th>
                <th className="py-3 px-4">Target Batch</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Avg Attendance Rate</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      {item.college}
                    </div>
                    <div className="text-xs text-slate-500 font-normal">{item.flaggedStudents ?? 0} students below 75% threshold</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{item.batch}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">{item.totalStudents} Students</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{item.avgAttendance}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle(item.status)}`}>
                      {item.status || 'No Data'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}