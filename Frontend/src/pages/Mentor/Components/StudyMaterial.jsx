import React from 'react';
import { mentorStudyMaterial } from '../../../data/mentorMockData';
import { BookOpen, Plus, Download, FileText } from 'lucide-react';

export default function StudyMaterial() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Study Material & Resources Library</span>
          </h2>
          <p className="text-xs text-slate-500">Publish lecture decks, code repositories, cheatsheets, and PDF study guides</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Upload New Study Material</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Resource Title</th>
                <th className="px-5 py-3">Target Batch</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Published Date</th>
                <th className="px-5 py-3">Total Downloads</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mentorStudyMaterial.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{m.title}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{m.batch}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{m.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{m.downloads} downloads</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-semibold rounded-lg transition inline-flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
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
