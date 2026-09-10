import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initialDepartments } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, Layers, Users, BookOpen, Building2, Filter, RefreshCw, X, Mail, ChevronDown } from 'lucide-react';
import { departmentAPI, collegeAPI } from '../../services/api';
import '../Admin/Styles/AdminUsers.css';

export default function Departments() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('all');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Department Form State
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    collegeId: '',
    hodName: '',
    hodEmail: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [collegesData, deptsData] = await Promise.all([
        collegeAPI.getColleges().catch(() => []),
        departmentAPI.getDepartments(selectedCollegeId === 'all' ? null : selectedCollegeId).catch(() => []),
      ]);

      if (collegesData && Array.isArray(collegesData) && collegesData.length > 0) {
        setColleges(collegesData);
      }
      if (deptsData && Array.isArray(deptsData) && deptsData.length > 0) {
        setDepartments(deptsData);
      }
    } catch (err) {
      console.warn("API load failed, fallback state maintained.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCollegeId]);

  const filtered = departments.filter((d) => {
    const matchesSearch =
      (d.name && d.name.toLowerCase().includes(search.toLowerCase())) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase())) ||
      (d.collegeName && d.collegeName.toLowerCase().includes(search.toLowerCase()));

    const matchesCollege =
      selectedCollegeId === 'all' ||
      String(d.collegeId) === String(selectedCollegeId);

    return matchesSearch && matchesCollege;
  });

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const selectedCol = colleges.find((c) => String(c.id) === String(deptForm.collegeId));

    const newDept = {
      id: Date.now(),
      name: deptForm.name,
      code: deptForm.code,
      collegeId: deptForm.collegeId || (colleges[0] ? colleges[0].id : 1),
      collegeName: selectedCol ? selectedCol.name : "Apex Institute of Technology",
      hodName: deptForm.hodName || "Dr. Department HOD",
      hodEmail: deptForm.hodEmail || `hod.${deptForm.code.toLowerCase()}@college.edu.in`,
      activeStudents: 0,
      studentsCount: 0,
      batchesCount: 0,
      collegesCount: 1,
      status: "Active",
    };

    try {
      const created = await departmentAPI.createDepartment(newDept);
      setDepartments([created, ...departments]);
    } catch (err) {
      setDepartments([newDept, ...departments]);
    }

    setIsAddModalOpen(false);
    setDeptForm({ name: '', code: '', collegeId: '', hodName: '', hodEmail: '' });
  };

  const handleDelete = async (id) => {
    try {
      await departmentAPI.deleteDepartment(id);
    } catch (err) {
      // Local fallback deletion
    }
    setDepartments(departments.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Academic Departments</span>
          </h2>
          <p className="text-xs text-slate-500">Manage academic departments scoped by institution</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={loadData}
            style={{ border: "none", outline: "none" }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sa-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sa-search-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="sa-search-wrap flex-1 max-w-sm">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search department stream, code, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-300 px-3.5 h-[38px] rounded-xl transition-all duration-200 w-full sm:w-64 shrink-0 shadow-xs group">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mr-2 group-hover:scale-105 transition-transform" />
          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
            className="text-slate-800 text-xs font-semibold cursor-pointer w-full truncate pr-6 focus:ring-0"
          >
            <option value="all">All Registered Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 absolute right-3 pointer-events-none transition-colors" />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => (
          <div key={dept.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                    {dept.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dept.collegeName || "Apex Institute"}</span>
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">{dept.name}</h3>
                {dept.hodName && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="font-medium text-slate-400">HOD:</span>
                    <strong className="text-slate-700 font-semibold">{dept.hodName}</strong>
                  </p>
                )}
              </div>
              <ActionDropdown
                onView={() => alert(`View details for ${dept.name}`)}
                onEdit={() => alert(`Edit ${dept.name}`)}
                onDelete={() => handleDelete(dept.id)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">College</p>
                <p className="font-bold text-slate-900 text-xs truncate mt-0.5" title={dept.collegeName || "Apex Inst"}>
                  {dept.collegeName ? dept.collegeName.split(" ")[0] : "Apex"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 text-center">
                <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-wider">Students</p>
                <p className="font-bold text-indigo-700 text-base mt-0.5">{dept.activeStudents || dept.studentsCount || 0}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batches</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount || 0}</p>
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
                  <p className="modal-subtitle">Create an academic department for an institution.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Target College *</label>
                  <select
                    required
                    className="form-select-admin"
                    value={deptForm.collegeId}
                    onChange={(e) => setDeptForm({ ...deptForm, collegeId: e.target.value })}
                  >
                    <option value="">Select Target Institution...</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

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
