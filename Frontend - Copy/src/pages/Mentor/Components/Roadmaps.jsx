import React from 'react';
import { Target, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function Roadmaps() {
  const tracks = [
    { id: 1, name: "Fullstack Engineering (React & Node)", batch: "CSE 2026 Alpha", modules: 18, completion: "78%", status: "Active" },
    { id: 2, name: "AI & Data Science (PyTorch & ML Pipelines)", batch: "Data Science 2025", modules: 14, completion: "91%", status: "Near Completion" },
    { id: 3, name: "Cloud Native & DevOps Infrastructure", batch: "Fullstack Web 04", modules: 16, completion: "62%", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Batch Adaptive Roadmaps</span>
          </h2>
          <p className="text-xs text-slate-500">AI-generated curriculum pathways and module progression across allocated cohorts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tracks.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase border border-indigo-200">
              {t.batch}
            </span>
            <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Curriculum Completion</span>
              <span className="text-indigo-600">{t.completion}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: t.completion }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
