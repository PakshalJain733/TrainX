import React, { useState } from 'react';
import { initialDepartments } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, Layers, Users, BookOpen } from 'lucide-react';

export default function Departments() {
  const [departments] = useState(initialDepartments);
  const [search, setSearch] = useState('');

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Academic Departments</span>
          </h2>
          <p className="text-xs text-slate-500">Track coverage across engineering & computer application streams</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Department Stream</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search department stream or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => (
          <div key={dept.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100">
                  {dept.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
              </div>
              <ActionDropdown
                onView={() => alert(`View ${dept.name}`)}
                onEdit={() => alert(`Edit ${dept.name}`)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Colleges</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.collegesCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Students</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
