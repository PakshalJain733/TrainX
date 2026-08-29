import React from 'react';
import { mentorMockDrives } from '../../../data/mentorMockData';
import { ClipboardCheck, Calendar, Users, Plus } from 'lucide-react';

export default function MockDrives() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <span>Placement Mock Drives & Code Tests</span>
          </h2>
          <p className="text-xs text-slate-500">Industry partner placement drives, target cutoffs, and student enrollment</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Nominate Students for Drive</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentorMockDrives.map((d) => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition">
            <div className="flex justify-between items-start">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                d.status === 'Active Today'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : d.status === 'Upcoming'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {d.status}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{d.date}</span>
            </div>

            <h3 className="font-bold text-slate-900 text-base">{d.title}</h3>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Registered Students:</span>
                <span className="font-bold text-slate-900">{d.registered}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pass Cutoff Criteria:</span>
                <span className="font-bold text-emerald-600">{d.passCutoff}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
