import React, { useState } from 'react';
import { initialColleges } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { Plus, Search, Filter, Building2, MapPin, Mail, Users, ArrowLeft, Hash, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';

export default function Colleges() {
  const [colleges, setColleges] = useState(initialColleges);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'add'
  const navigate = useNavigate();

  // Add College Form State
  const [formData, setFormData] = useState({
    name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 5, studentsCount: 150,
  });

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCollege = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.location) return;
    setColleges([{ ...formData, id: Date.now(), status: 'Active' }, ...colleges]);
    setView('list');
    setFormData({ name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 5, studentsCount: 150 });
  };

  const handleDelete = (id) => {
    setColleges(colleges.filter((c) => c.id !== id));
  };

  if (view === 'add') {
    return (
      <div className="space-y-6">
        <div className="sa-page-header">
          <div>
            <button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium mb-2 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Directory
            </button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Add New College</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Register a new institution on the platform.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <form onSubmit={handleAddCollege} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">College Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" required placeholder="e.g. Apex Institute of Technology" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">College Code</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" required placeholder="AIT-BLR" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Location / City</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" required placeholder="Bangalore" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">College Admin Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Dr. Rajesh Verma" value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" placeholder="admin@college.edu.in" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
            </div>

            <div className="pt-4 mt-2 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition">
                Register College
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Colleges Directory</span>
          </h2>
          <p className="text-xs text-slate-500">Manage all registered institutions and partner universities</p>
        </div>
        <button onClick={() => setView('add')} className="sa-btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add New College</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sa-search-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="sa-search-wrap flex-1">
          <Search className="sa-search-icon" />
          <input
            type="text"
            placeholder="Search college name, city, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 flex items-center gap-1.5 transition">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Status</span>
          </button>
        </div>
      </div>

      {/* Colleges Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredColleges.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Colleges Found"
            description={searchQuery ? `No colleges matching "${searchQuery}"` : "Get started by registering the first partner college."}
            actionText="Add New College"
            onAction={() => setView('add')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <th className="py-3 px-4">College Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">College Admin</th>
                  <th className="py-3 px-4">Departments</th>
                  <th className="py-3 px-4">Active Students</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredColleges.map((college) => (
                  <tr key={college.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{college.name}</div>
                      <div className="text-[10px] text-indigo-600 font-semibold">{college.code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{college.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{college.adminName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{college.adminEmail}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{college.departmentsCount}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{college.studentsCount}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={college.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ActionDropdown
                        onView={() => navigate(`/super-admin/colleges/${college.id}`)}
                        onEdit={() => alert(`Editing ${college.name}`)}
                        onDelete={() => handleDelete(college.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
