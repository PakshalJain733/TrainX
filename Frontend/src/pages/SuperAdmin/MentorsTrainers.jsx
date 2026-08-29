import React, { useState } from 'react';
import { initialMentors } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { UserCheck, Plus, Search, Star, Award, BookOpen } from 'lucide-react';

export default function MentorsTrainers() {
  const [mentors] = useState(initialMentors);
  const [search, setSearch] = useState('');

  const filtered = mentors.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Mentors & Industry Trainers</span>
          </h2>
          <p className="text-xs text-slate-500">Track trainer specializations, rating performance, and student allocations</p>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Trainer Profile</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search mentor name or domain specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mentor) => (
          <div key={mentor.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{mentor.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{mentor.specialization}</p>
                </div>
              </div>
              <StatusBadge status={mentor.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Allocated Students</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{mentor.allocatedStudents}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Trainer Rating</p>
                <div className="flex items-center justify-center gap-1 font-bold text-slate-900 text-base mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{mentor.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
