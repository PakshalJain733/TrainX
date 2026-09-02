import React from 'react';
import { mentorProfile } from '../../../data/mentorMockData';
import { User, Mail, Award, BookOpen, Star, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            VS
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{mentorProfile.name}</h2>
            <p className="text-xs text-indigo-600 font-semibold">{mentorProfile.role}</p>
            <p className="text-xs text-slate-500 mt-0.5">{mentorProfile.department}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</span>
            <p className="font-bold text-slate-900">{mentorProfile.email}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Primary Specialization</span>
            <p className="font-bold text-slate-900">{mentorProfile.specialization}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Teaching Experience</span>
            <p className="font-bold text-slate-900">{mentorProfile.experience}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Student Rating</span>
            <p className="font-bold text-amber-600 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> {mentorProfile.rating} / 5.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
