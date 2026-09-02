import React from 'react';
import { mentorAssignments } from '../../../data/mentorMockData';
import { FileCode, Plus, CheckCircle, Clock, FileCheck } from 'lucide-react';

export default function Assignments() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <span>Assignments & Code Evaluation Queue</span>
          </h2>
          <p className="text-xs text-slate-500">Create programming tasks, review submitted student code, and assign marks</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {mentorAssignments.map((a) => (
          <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                  {a.batch}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">{a.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Due Date: {a.dueDate}</p>
              </div>

              <span className={`px-3 py-1 text-xs font-semibold rounded-full border self-start sm:self-auto ${
                a.status === 'Completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {a.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Submissions Received:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{a.totalSubmitted} / {a.totalStudents}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Evaluated:</span>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">{a.evaluated}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Pending Review:</span>
                <p className="font-bold text-rose-600 text-sm mt-0.5">{a.totalSubmitted - a.evaluated}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
