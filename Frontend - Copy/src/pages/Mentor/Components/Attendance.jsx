import React from 'react';
import { mentorBatches } from '../../../data/mentorMockData';
import { CalendarCheck, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

export default function Attendance() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Attendance Verification & Management</span>
          </h2>
          <p className="text-xs text-slate-500">Record daily live session attendance, review student excuses, and submit weekly logs</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span>Upload Session Attendance Sheet</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mentorBatches.map((b) => (
          <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{b.code}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{b.name}</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Verified
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Avg Batch Attendance:</span>
                <span className="font-bold text-emerald-600">92.4%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Low Attendance (&lt;75%):</span>
                <span className="font-bold text-rose-600">2 students</span>
              </div>
            </div>

            <button className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-semibold text-xs rounded-xl transition">
              Mark Session Attendance
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
