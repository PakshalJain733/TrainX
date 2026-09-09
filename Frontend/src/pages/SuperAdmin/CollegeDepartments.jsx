import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { initialDepartments } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, ArrowLeft, X } from 'lucide-react';
import '../Admin/Styles/AdminUsers.css';

export default function CollegeDepartments() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState(initialDepartments);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    hodName: '',
    hodEmail: '',
  });

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const newDept = {
      id: Date.now(),
      name: deptForm.name,
      code: deptForm.code,
      collegeId: collegeId || 1,
      collegeName: "College Campus",
      hodName: deptForm.hodName || "Dr. Department HOD",
      hodEmail: deptForm.hodEmail || `hod.${deptForm.code.toLowerCase()}@college.edu.in`,
      activeStudents: 0,
      batchesCount: 0,
      status: "Active",
    };

    setDepartments([newDept, ...departments]);
    setIsAddModalOpen(false);
    setDeptForm({ name: '', code: '', hodName: '', hodEmail: '' });
  };

  return (
    <div className="space-y-6">
      <div className="sa-page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => navigate('/super-admin/colleges')} 
              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>College Departments</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-9">Manage departments inside this specific college</p>
        </div>

        <button className="sa-btn-primary ml-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="sa-search-card">
        <div className="sa-search-wrap">
          <Search className="sa-search-icon" />
          <input
            type="text"
            placeholder="Search department stream or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => (
          <div key={dept.id} className="sa-widget-card hover:border-indigo-300 transition" style={{ padding: '20px' }}>
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100">
                  {dept.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
              </div>
              <ActionDropdown
                onView={() => alert(`View ${dept.name}`)}
                onEdit={() => alert(`Edit ${dept.name}`)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Students</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Add New Department</h2>
                  <p className="modal-subtitle">Create an academic department for this college.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Department Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Computer Science & Engineering"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Department Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. CSE"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>HOD Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="Dr. Arvind Kulkarni"
                      value={deptForm.hodName}
                      onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>HOD Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      placeholder="hod.cse@college.edu.in"
                      value={deptForm.hodEmail}
                      onChange={(e) => setDeptForm({ ...deptForm, hodEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Department
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
