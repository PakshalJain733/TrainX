import React from 'react';
import { initialMockDrives } from '../../data/superAdminMockData';
import { ClipboardCheck, Plus, Calendar, Building, Users } from 'lucide-react';

export default function MockDrives() {
  const drives = initialMockDrives;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <span>Placement Mock Drives & Assessments</span>
          </h2>
          <p className="text-xs text-slate-500">Industry placement drives, participating colleges, registered candidates, and cutoff results</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Create Placement Mock Drive</span>
        </button>
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drives.map((d) => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                d.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : d.status === 'Upcoming'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {d.status}
              </span>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {d.date}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{d.driveName}</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1">{d.company}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Batch:</span>
                <span className="font-medium text-slate-800">{d.targetBatch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Students:</span>
                <span className="font-bold text-slate-900">{d.registeredStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pass Cutoff:</span>
                <span className="font-semibold text-emerald-600">{d.passCriteria}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
