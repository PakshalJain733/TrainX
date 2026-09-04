import React from 'react';
import { mentorBatches } from '../../../data/mentorMockData';
import { Layers, Calendar, Users, BookOpen, Clock, Plus } from 'lucide-react';

export default function Batches() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>My Allocated Batches</span>
          </h2>
          <p className="text-xs text-slate-500">Course schedules, syllabus completion, enrolled students, and cohort progress</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mentorBatches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {b.code}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {b.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{b.college}</p>
              <p className="text-xs text-indigo-600 font-semibold">{b.department}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Enrolled Students:</span>
                <span className="font-bold text-slate-900">{b.enrolledStudents}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Modules Covered:</span>
                <span className="font-bold text-slate-900">{b.topicsCovered} / {b.totalTopics}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Class Schedule:</span>
                <span className="font-medium text-slate-800 text-[11px]">{b.schedule}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Overall Completion</span>
                <span className="text-indigo-600">{b.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${b.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
