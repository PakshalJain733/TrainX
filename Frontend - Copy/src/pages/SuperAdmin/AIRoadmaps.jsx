import React from 'react';
import { initialAIRoadmaps } from '../../data/superAdminMockData';
import { Target, Sparkles, BookOpen, Layers, Users } from 'lucide-react';

export default function AIRoadmaps() {
  const roadmaps = initialAIRoadmaps;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>AI Curriculum & Adaptive Roadmaps</span>
          </h2>
          <p className="text-xs text-slate-500">AI-generated learning tracks, adaptive module completion, and student progression</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Generate New Roadmap Track</span>
        </button>
      </div>

      {/* Roadmaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roadmaps.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {r.track}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">{r.title}</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                AI Adaptation: {r.aiAdaptation}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Modules</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{r.modulesCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{r.enrolledStudents}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Avg Completion</p>
                <p className="font-bold text-indigo-600 text-sm mt-0.5">{r.completionRate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
