import React, { useState } from 'react';
import { initialBatches } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { Layers, Plus, Search, UserCheck, Calendar } from 'lucide-react';
import './SuperAdmin.css';

export default function Batches() {
  const [batches] = useState(initialBatches);
  const [search, setSearch] = useState('');

  const filtered = batches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.college.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Training Batches & Cohorts</span>
          </h2>
          <p className="text-xs text-slate-500">Monitor batch timelines, completion progress, and assigned mentors</p>
        </div>

        <button className="sa-btn-primary">
          <Plus className="w-4 h-4" />
          <span>Create New Cohort</span>
        </button>
      </div>


      <div className="sa-search-card">
        <div className="sa-search-wrap">
          <Search className="sa-search-icon" />
          <input
            type="text"
            placeholder="Search cohort name or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Cohort Name</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Assigned Mentor</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Progress Track</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{batch.name}</div>
                    <div className="text-[10px] text-slate-400">{batch.department}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{batch.college}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{batch.mentor}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{batch.students}</td>
                  <td className="py-3.5 px-4 w-44">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Completion</span>
                      <span className="font-bold text-indigo-600">{batch.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full sa-progress-bar-fill"
                        style={{ width: `${batch.progress}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdown
                      onView={() => alert(`View details for ${batch.name}`)}
                      onEdit={() => alert(`Edit ${batch.name}`)}
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
