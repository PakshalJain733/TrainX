import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Mail, Building2, ShieldCheck, RefreshCw } from 'lucide-react';
import { superAdminAPI } from '../../services/api';

export default function Coordinators() {
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCoordinators = () => {
    setLoading(true);
    superAdminAPI.coordinators()
      .then((data) => setCoordinators(Array.isArray(data) ? data : []))
      .catch(() => setCoordinators([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  const filtered = coordinators.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Coordinators Management</span>
          </h2>
          <p className="text-xs text-slate-500">View and manage institutional program coordinators</p>
        </div>
        <button
          onClick={loadCoordinators}
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
            placeholder="Search coordinator name, college, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm font-medium">
            {loading ? 'Loading coordinators…' : 'No coordinators registered yet.'}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Coordinator Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {String(c.name || '?').split(' ').map(n=>n[0]).join('')}
                    </div>
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{c.college}</td>
                  <td className="py-3.5 px-4 text-indigo-400 font-medium">{c.department}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {c.email || '—'}
                    </div>
                    <div className="mt-0.5 text-slate-500">Batches: {c.assignedBatches ?? '—'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {c.status || 'Active'}
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