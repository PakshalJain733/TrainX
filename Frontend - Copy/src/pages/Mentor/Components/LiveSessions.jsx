import React from 'react';
import { mentorLiveSessions, mentorStudentDoubts } from '../../../data/mentorMockData';
import { Video, Plus, HelpCircle, MessageSquare, Clock, ExternalLink } from 'lucide-react';

export default function LiveSessions() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-600" />
            <span>Live Classes & Doubts Desk</span>
          </h2>
          <p className="text-xs text-slate-500">Schedule live lecture sessions, launch meeting rooms, and resolve student doubt tickets</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Scheduled Sessions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Upcoming Live Sessions</h3>
          {mentorLiveSessions.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{s.batch}</span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {s.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">{s.title}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> {s.time}
              </p>
              <a
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition inline-flex items-center justify-center gap-2"
              >
                <span>Launch Meeting Room</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* Right: Doubts Ticket Queue */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Student Doubts Queue</h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            {mentorStudentDoubts.map((d) => (
              <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{d.student}</span>
                  <span className="text-[10px] text-slate-400">{d.time}</span>
                </div>
                <p className="font-semibold text-indigo-600">{d.topic}</p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">{d.batch}</span>
                  <button className="px-3 py-1 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                    Answer Doubt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
