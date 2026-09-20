import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import { superAdminAPI } from '../../services/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = () => {
    setLoading(true);
    superAdminAPI.students()
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.batch || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const riskLabel = (level) =>
    level === 'High' ? 'High Risk' : level === 'Medium' ? 'Moderate Risk' : 'Low Risk';

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
        <button
          onClick={loadStudents}
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
            placeholder="Search student name, college, batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm font-medium">
            {loading ? 'Loading students…' : 'No students enrolled yet.'}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">College / Batch</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Assessment Avg</th>
                <th className="py-3 px-4 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {String(s.name || '?').split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div>{s.name}</div>
                      <div className="text-xs text-slate-400 font-normal">#{s.id}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="font-medium">{s.college}</div>
                    <div className="text-xs text-slate-500">{s.batch || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{s.attendance != null ? `${Math.round(s.attendance)}%` : '—'}</td>
                  <td className="py-3.5 px-4 text-indigo-300 font-bold">{s.assessment != null ? `${Math.round(s.assessment)}%` : '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      s.riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      s.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {riskLabel(s.riskLevel)}
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