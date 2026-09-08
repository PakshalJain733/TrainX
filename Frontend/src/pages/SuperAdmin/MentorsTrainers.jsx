import React, { useState } from 'react';
import { GraduationCap, Search, Mail, Phone, BookOpen, Award } from 'lucide-react';

const mockMentors = [
  { id: 1, name: "Ms. R. Kulkarni", email: "r.kulkarni@pvppcoe.ac.in", phone: "+91 98765 11111", college: "PVPPCOE Mumbai", track: "Python Backend Development", studentsAssigned: 45, rating: "4.9/5" },
  { id: 2, name: "Prof. Vikram Joshi", email: "v.joshi@apex.edu", phone: "+91 98765 22222", college: "Apex Institute", track: "Full Stack Web Engineering", studentsAssigned: 50, rating: "4.8/5" },
  { id: 3, name: "Dr. S. Nair", email: "s.nair@meridian.edu", phone: "+91 98765 33333", college: "Meridian College", track: "Data Science & Machine Learning", studentsAssigned: 40, rating: "4.9/5" },
  { id: 4, name: "Er. Amit Shah", email: "a.shah@vanguard.edu", phone: "+91 98765 44444", college: "Vanguard Institute", track: "Cloud & DevOps Architecture", studentsAssigned: 38, rating: "4.7/5" }
];

export default function MentorsTrainers() {
  const [mentors] = useState(mockMentors);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.track.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Mentors & Trainers</span>
          </h2>
          <p className="text-xs text-slate-500">Monitor active industry trainers and faculty mentors</p>
        </div>
      </div>

      <div className="sa-search-card flex items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1 relative">
          <Search className="sa-search-icon absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search mentor name, domain track, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono bg-slate-950/40">
            <tr>
              <th className="py-3 px-4">Mentor Name</th>
              <th className="py-3 px-4">Domain Track</th>
              <th className="py-3 px-4">College</th>
              <th className="py-3 px-4">Mentees Enrolled</th>
              <th className="py-3 px-4 text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {m.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div>{m.name}</div>
                    <div className="text-xs text-slate-400 font-normal">{m.email}</div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-indigo-400 font-medium">{m.track}</td>
                <td className="py-3.5 px-4 text-slate-300 font-medium">{m.college}</td>
                <td className="py-3.5 px-4 text-slate-300 font-bold">{m.studentsAssigned} Students</td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    ★ {m.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
