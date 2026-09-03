import React from 'react';
import { mentorDefaulters } from '../../../data/mentorMockData';
import { AlertCircle, Bell, Mail, PhoneCall } from 'lucide-react';

export default function Defaulters() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Defaulters & Performance Risk Queue</span>
          </h2>
          <p className="text-xs text-slate-500">Students flagged for low attendance (&lt;75%), missed assignment deadlines, or test score dips</p>
        </div>

        <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span>Send Warning Alert to All</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Roll No</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Missed Assignments</th>
                <th className="px-5 py-3">Last Test Score</th>
                <th className="px-5 py-3">Defaulter Reason</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mentorDefaulters.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 font-semibold">{d.rollNo}</td>
                  <td className="px-5 py-3.5 text-slate-700">{d.batch}</td>
                  <td className="px-5 py-3.5 font-bold text-rose-600">{d.attendance}</td>
                  <td className="px-5 py-3.5 font-bold text-amber-600">{d.missedAssignments} missed</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{d.lastTestScore}</td>
                  <td className="px-5 py-3.5 text-rose-700 font-medium">{d.reason}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg transition mr-1">
                      Notify Student
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
