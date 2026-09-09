import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initialBatches } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { Layers, Search, Plus, Filter, Users, Calendar, ArrowUpRight, GraduationCap, Building2, RefreshCw, X, UserCheck, ChevronDown } from 'lucide-react';
import { batchAPI, collegeAPI, departmentAPI } from '../../services/api';
import '../Admin/Styles/AdminUsers.css';

export default function Batches() {
  const [batches, setBatches] = useState(initialBatches);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Cascading Filter States
  const [filterCollegeId, setFilterCollegeId] = useState('all');
  const [filterDeptId, setFilterDeptId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form Cascading States
  const [modalCollegeId, setModalCollegeId] = useState('');
  const [modalDeptId, setModalDeptId] = useState('');
  const [batchForm, setBatchForm] = useState({
    name: '',
    code: '',
    trainer: '',
    schedule: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [collegesData, deptsData, batchesData] = await Promise.all([
        collegeAPI.getColleges().catch(() => []),
        departmentAPI.getDepartments().catch(() => []),
        batchAPI.getBatches(
          filterCollegeId === 'all' ? null : filterCollegeId,
          filterDeptId === 'all' ? null : filterDeptId
        ).catch(() => []),
      ]);

      if (collegesData && Array.isArray(collegesData) && collegesData.length > 0) {
        setColleges(collegesData);
      }
      if (deptsData && Array.isArray(deptsData) && deptsData.length > 0) {
        setDepartments(deptsData);
      }
      if (batchesData && Array.isArray(batchesData) && batchesData.length > 0) {
        setBatches(batchesData);
      }
    } catch (err) {
      console.warn("API load failed, maintaining fallback state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCollegeId, filterDeptId]);

  // Departments available based on selected filter college
  const availableFilterDepartments = filterCollegeId === 'all'
    ? departments
    : departments.filter((d) => String(d.collegeId) === String(filterCollegeId));

  // Departments available inside Modal based on selected modal college
  const availableModalDepartments = modalCollegeId
    ? departments.filter((d) => String(d.collegeId) === String(modalCollegeId))
    : [];

  const handleCollegeFilterChange = (e) => {
    const cid = e.target.value;
    setFilterCollegeId(cid);
    setFilterDeptId('all'); // reset department selection when college changes
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      (b.name && b.name.toLowerCase().includes(search.toLowerCase())) ||
      (b.college && b.college.toLowerCase().includes(search.toLowerCase())) ||
      (b.collegeName && b.collegeName.toLowerCase().includes(search.toLowerCase())) ||
      (b.department && b.department.toLowerCase().includes(search.toLowerCase())) ||
      (b.departmentName && b.departmentName.toLowerCase().includes(search.toLowerCase()));

    const matchesCollege =
      filterCollegeId === 'all' ||
      String(b.collegeId) === String(filterCollegeId);

    const matchesDept =
      filterDeptId === 'all' ||
      String(b.departmentId) === String(filterDeptId);

    return matchesSearch && matchesCollege && matchesDept;
  });

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name || !batchForm.code || !modalCollegeId || !modalDeptId) return;

    const colObj = colleges.find((c) => String(c.id) === String(modalCollegeId));
    const deptObj = departments.find((d) => String(d.id) === String(modalDeptId));

    const newBatch = {
      id: Date.now(),
      name: batchForm.name,
      code: batchForm.code,
      collegeId: Number(modalCollegeId),
      college: colObj ? colObj.name : "Apex Institute of Technology",
      collegeName: colObj ? colObj.name : "Apex Institute of Technology",
      departmentId: Number(modalDeptId),
      department: deptObj ? deptObj.name : "Computer Science & Engineering",
      departmentName: deptObj ? deptObj.name : "Computer Science & Engineering",
      mentor: batchForm.trainer || "Rohan Sharma",
      trainer: batchForm.trainer || "Rohan Sharma",
      students: 0,
      studentsCount: 0,
      enrolledStudents: 0,
      progress: 0,
      schedule: batchForm.schedule || "Mon, Wed, Fri (10:00 AM - 12:00 PM)",
      status: "Active",
    };

    try {
      const created = await batchAPI.createBatch(newBatch);
      setBatches([created, ...batches]);
    } catch (err) {
      setBatches([newBatch, ...batches]);
    }

    setIsModalOpen(false);
    setBatchForm({ name: '', code: '', trainer: '', schedule: '' });
    setModalCollegeId('');
    setModalDeptId('');
  };

  const handleDelete = async (id) => {
    try {
      await batchAPI.deleteBatch(id);
    } catch (err) {
      // Local fallback
    }
    setBatches(batches.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Training Batches & Cohorts</span>
          </h2>
          <p className="text-xs text-slate-500">Monitor batch timelines, completion progress, and assigned mentors</p>
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
            onClick={() => setIsModalOpen(true)}
            className="sa-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Cohort</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar (College -> Department -> Search) */}
      <div className="sa-search-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="sa-search-wrap flex-1 max-w-sm">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search cohort name, code, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cascading Step 1: Select College */}
          <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-300 px-3.5 h-[38px] rounded-xl transition-all duration-200 w-full sm:w-52 shrink-0 shadow-xs group">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mr-1.5 group-hover:scale-105 transition-transform" />
            <select
              value={filterCollegeId}
              onChange={handleCollegeFilterChange}
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
              <option value="all">Step 1: All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 absolute right-3 pointer-events-none transition-colors" />
          </div>

          {/* Cascading Step 2: Select Department (Filtered by College) */}
          <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-300 px-3.5 h-[38px] rounded-xl transition-all duration-200 w-full sm:w-52 shrink-0 shadow-xs group">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0 mr-1.5 group-hover:scale-105 transition-transform" />
            <select
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
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
              <option value="all">Step 2: All Departments</option>
              {availableFilterDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 absolute right-3 pointer-events-none transition-colors" />
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Cohort Name</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Assigned Mentor</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Progress Track</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{batch.name}</div>
                    <div className="text-[10px] text-indigo-600 font-semibold">{batch.code || batch.department || batch.departmentName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{batch.college || batch.collegeName || "Apex Institute"}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{batch.mentor || batch.trainer || "Industry Specialist"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{batch.students || batch.enrolledStudents || batch.studentsCount || 0}</td>
                  <td className="py-3.5 px-4 w-44">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Completion</span>
                      <span className="font-bold text-indigo-600">{batch.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${batch.progress || 0}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={batch.status || "Active"} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <ActionDropdown
                      onView={() => alert(`View details for ${batch.name}`)}
                      onEdit={() => alert(`Edit ${batch.name}`)}
                      onDelete={() => handleDelete(batch.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cohort Modal with Cascading Selection */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create New Cohort</h2>
                  <p className="modal-subtitle">Cascading creation: College → Department → Batch</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div className="modal-body">
                {/* Step 1: Select College */}
                <div className="form-group-admin">
                  <label>1. Target Institution (College) *</label>
                  <select
                    required
                    className="form-select-admin"
                    value={modalCollegeId}
                    onChange={(e) => {
                      setModalCollegeId(e.target.value);
                      setModalDeptId(''); // reset department when college changes
                    }}
                  >
                    <option value="">Select College...</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Department */}
                <div className="form-group-admin">
                  <label>2. Department (Scoped to Selected College) *</label>
                  <select
                    required
                    disabled={!modalCollegeId}
                    className="form-select-admin"
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(e.target.value)}
                  >
                    <option value="">
                      {modalCollegeId ? "Select Department..." : "← Select College first"}
                    </option>
                    {availableModalDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Batch Name & Details */}
                <div className="form-group-admin">
                  <label>3. Cohort / Batch Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="e.g. CSE 2026 Alpha Cohort"
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Batch Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="CSE-2026-A"
                      value={batchForm.code}
                      onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    />
                  </div>

                  <div className="form-group-admin">
                    <label>Assigned Trainer</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="Rohan Sharma"
                      value={batchForm.trainer}
                      onChange={(e) => setBatchForm({ ...batchForm, trainer: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={!modalCollegeId || !modalDeptId}
                  style={{ opacity: (!modalCollegeId || !modalDeptId) ? 0.5 : 1 }}
                >
                  Create Cohort
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
