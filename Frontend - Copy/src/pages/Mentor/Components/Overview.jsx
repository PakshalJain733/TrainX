import React from 'react';
import { mentorProfile, mentorBatches, mentorStudents, mentorAssignments, mentorLiveSessions } from '../../../data/mentorMockData';
import { Layers, Users, CalendarCheck, FileCode, Video, ArrowUpRight, CheckCircle2, Clock, Star, Sparkles } from 'lucide-react';

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Mentor & Instructor Control Hub
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back, {mentorProfile.name}</h2>
          <p className="text-xs text-slate-300">
            You are currently instructing <span className="font-semibold text-white">{mentorProfile.allocatedBatchesCount} active cohorts</span> with <span className="font-semibold text-white">{mentorProfile.totalStudentsAssigned} students</span> across 3 technical colleges.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="px-4 py-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-slate-300 uppercase font-semibold">Trainer Rating</p>
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-lg mt-0.5">
              <Star className="w-4 h-4 fill-amber-400" /> {mentorProfile.rating}
            </div>
          </div>
          <div className="px-4 py-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-slate-300 uppercase font-semibold">Pending Review</p>
            <p className="font-bold text-white text-lg mt-0.5">{mentorProfile.pendingEvaluationsCount}</p>
          </div>
        </div>
      </div>

      {/* Top Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Active Batches</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{mentorProfile.allocatedBatchesCount}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">All cohorts on track</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{mentorProfile.totalStudentsAssigned}</h3>
            <span className="text-[11px] text-indigo-600 font-medium">94% active participation</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Live Classes Today</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">1 Session</h3>
            <span className="text-[11px] text-amber-600 font-semibold">Starts 02:00 PM</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Pending Code Reviews</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">14 Submissions</h3>
            <span className="text-[11px] text-rose-600 font-medium">Require feedback</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <FileCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Batches Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Allocated Training Batches</h3>
              <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">View All Batches</span>
            </div>

            <div className="space-y-3">
              {mentorBatches.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {b.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{b.name}</h4>
                      <p className="text-xs text-slate-500">{b.college} · {b.department}</p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                      {b.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Syllabus Progress</span>
                      <span className="text-indigo-600">{b.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${b.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Session & Pending Tasks */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Live Session</span>
            </h3>

            {mentorLiveSessions.map((s) => (
              <div key={s.id} className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 space-y-3">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                  {s.status}
                </span>
                <h4 className="font-bold text-slate-900 text-xs">{s.title}</h4>
                <p className="text-[11px] text-slate-600 font-medium">{s.batch}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> {s.time}
                </div>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  Join Meeting Room
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
