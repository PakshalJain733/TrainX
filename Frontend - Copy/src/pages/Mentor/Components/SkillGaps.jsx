import React from 'react';
import { mentorSkillGaps } from '../../../data/mentorMockData';
import { AlertTriangle, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

export default function SkillGaps() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
            <span>AI Skill Gap Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500">Automated AI detection of concept weaknesses and remedial assignment triggers</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Trigger Remedial Assignment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Topic / Concept Area</th>
                <th className="px-5 py-3">Affected Batch</th>
                <th className="px-5 py-3">Deficiency Rate</th>
                <th className="px-5 py-3">Avg Test Score</th>
                <th className="px-5 py-3">Remedial Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mentorSkillGaps.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{g.topic}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{g.batch}</td>
                  <td className="px-5 py-3.5 font-bold text-rose-600">{g.deficiencyRate}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{g.avgScore}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      g.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : g.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {g.priority} Priority
                    </span>
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
