import React, { useState } from 'react';
import { UserCheck, Search, Mail, Phone, Building2, Plus, ShieldCheck } from 'lucide-react';

const mockCoordinators = [
  { id: 1, name: "Prof. Rajesh Sharma", email: "r.sharma@pvppcoe.ac.in", phone: "+91 98765 43210", college: "PVPPCOE Mumbai", department: "Computer Engineering", status: "Active" },
  { id: 2, name: "Dr. Ananya Deshmukh", email: "a.deshmukh@apex.edu", phone: "+91 98765 43211", college: "Apex Institute of Technology", department: "Information Technology", status: "Active" },
  { id: 3, name: "Prof. Suresh Kulkarni", email: "s.kulkarni@meridian.edu", phone: "+91 98765 43212", college: "Meridian College", department: "AI & Data Science", status: "Active" },
  { id: 4, name: "Dr. Meera Patel", email: "m.patel@vanguard.edu", phone: "+91 98765 43213", college: "Vanguard Institute", department: "Electronics Engineering", status: "Active" }
];

export default function Coordinators() {
  const [coordinators] = useState(mockCoordinators);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = coordinators.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="sa-page-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Coordinators Management</span>
          </h2>
          <p className="text-xs text-slate-500">View and manage institutional program coordinators</p>
        </div>
      </div>

      <div className="sa-search-card flex items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1 relative">
          <Search className="sa-search-icon absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search coordinator name, college, department..."
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
              <th className="py-3 px-4">Coordinator Name</th>
              <th className="py-3 px-4">College</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Contact Details</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {c.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  {c.name}
                </td>
                <td className="py-3.5 px-4 text-slate-300 font-medium">{c.college}</td>
                <td className="py-3.5 px-4 text-indigo-400 font-medium">{c.department}</td>
                <td className="py-3.5 px-4 text-xs text-slate-400">
                  <div>{c.email}</div>
                  <div>{c.phone}</div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {c.status}
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
