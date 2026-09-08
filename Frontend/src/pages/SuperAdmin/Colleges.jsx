import React, { useState, useEffect } from 'react';
import { initialColleges } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import AddCollegeModal from '../../components/SuperAdmin/AddCollegeModal';
import { Plus, Search, Filter, Building2, MapPin, Mail, Users, RefreshCw } from 'lucide-react';
import { collegeAPI } from '../../services/api';

export default function Colleges() {
  const [colleges, setColleges] = useState(initialColleges);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await collegeAPI.getColleges();
      if (data && Array.isArray(data) && data.length > 0) {
        setColleges(data);
      }
    } catch (err) {
      console.warn("Failed to fetch colleges from backend API, using local state fallback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const filteredColleges = colleges.filter((c) =>
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCollege = async (newCollege) => {
    try {
      const created = await collegeAPI.createCollege(newCollege);
      setColleges([created, ...colleges]);
    } catch (err) {
      setColleges([newCollege, ...colleges]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await collegeAPI.deleteCollege(id);
    } catch (err) {
      // Proceed with local deletion
    }
    setColleges(colleges.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Colleges Directory</span>
          </h2>
          <p className="text-xs text-slate-500">Manage all registered institutions and partner universities</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchColleges}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
            title="Refresh from API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New College</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search college name, city, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
                    <div className="font-semibold text-slate-800">{college.adminName || "Dr. College Admin"}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{college.contactEmail || college.adminEmail || `admin@${college.code ? college.code.toLowerCase() : 'college'}.edu.in`}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{college.departmentsCount || 0}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{college.studentsCount || 0}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={college.status || "Active"} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdown
                      onView={() => alert(`Viewing details for ${college.name}`)}
                      onEdit={() => alert(`Editing ${college.name}`)}
                      onDelete={() => handleDelete(college.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add College Modal */}
      <AddCollegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCollege}
      />
    </div>
  );
}
