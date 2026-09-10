import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { initialColleges } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { Plus, Search, Filter, Building2, MapPin, Mail, Users, Hash, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import '../Admin/Styles/AdminUsers.css';

export default function Colleges() {
  const [colleges, setColleges] = useState(initialColleges);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    setIsAddModalOpen(false);
    setFormData({ name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 5, studentsCount: 150 });
  };

  const handleDelete = (id) => {
    setColleges(colleges.filter((c) => c.id !== id));
  };

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
        <button onClick={() => setIsAddModalOpen(true)} className="sa-btn-primary ml-auto">
          <Plus className="w-4 h-4" />
          <span>Add New College</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sa-search-card flex items-center gap-3">
        <div className="sa-search-wrap w-72 sm:w-80 shrink-0" style={{ maxWidth: "340px" }}>
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
          <button
            type="button"
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
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
            onAction={() => setIsAddModalOpen(true)}
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
                      <div className="font-semibold text-slate-800">{college.adminName || 'Dr. Verma'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{college.adminEmail || 'admin@college.edu.in'}</span>
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

      {/* Add College Modal */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Add New College</h2>
                  <p className="modal-subtitle">Register a new institution or partner university.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCollege}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>College Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="e.g. Apex Institute of Technology"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. AIT-BLR"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Location / City *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Bangalore"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Admin Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="Dr. Rajesh Verma"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email Address</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      placeholder="admin@college.edu.in"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Departments Count</label>
                    <input
                      type="number"
                      className="form-input-admin"
                      placeholder="5"
                      value={formData.departmentsCount}
                      onChange={(e) => setFormData({ ...formData, departmentsCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Initial Students Count</label>
                    <input
                      type="number"
                      className="form-input-admin"
                      placeholder="150"
                      value={formData.studentsCount}
                      onChange={(e) => setFormData({ ...formData, studentsCount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Register College
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
