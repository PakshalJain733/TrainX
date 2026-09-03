import React from 'react';
import { Bot, Sparkles, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

export default function AIInterviews() {
  const reviews = [
    { id: 1, name: "Aarav Mehta", batch: "CSE 2026 Alpha", role: "Full Stack Engineer", techScore: 78, behavioralScore: 84, overall: 81, weakness: "Edge cases in Graph algorithms" },
    { id: 2, name: "Neha Reddy", batch: "Data Science 2025", role: "AI Engineer", techScore: 62, behavioralScore: 70, overall: 66, weakness: "High-dimensional matrix math" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <span>AI Mock Interview Student Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500">Review automated AI mock interview evaluations and student weak spots</p>
        </div>
      </div>

      {/* Evaluation List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Target Role</th>
                <th className="px-5 py-3">Tech Score</th>
                <th className="px-5 py-3">Behavioral Score</th>
                <th className="px-5 py-3">Overall Score</th>
                <th className="px-5 py-3">Weak Spot Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.batch}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-indigo-600">{r.role}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{r.techScore}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{r.behavioralScore}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">{r.overall}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.weakness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
