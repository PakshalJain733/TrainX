import React, { useState, useEffect } from 'react';
import { initialBatches } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { Layers, Plus, Search, UserCheck, Calendar, Building2, GraduationCap, RefreshCw, X } from 'lucide-react';
import { batchAPI, collegeAPI, departmentAPI } from '../../services/api';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Training Batches & Cohorts</span>
          </h2>
          <p className="text-xs text-slate-500">Monitor batch timelines, completion progress, and assigned mentors</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
            title="Refresh API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Cohort</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar (College -> Department -> Search) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cohort name or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cascading Step 1: Select College */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCollegeId}
              onChange={handleCollegeFilterChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="all">Step 1: All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Cascading Step 2: Select Department (Filtered by College) */}
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="all">Step 2: All Departments</option>
              {availableFilterDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Create New Cohort</h3>
                  <p className="text-xs text-slate-500">Cascading creation: College → Department → Batch</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              {/* Step 1: Select College */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  1. Target Institution (College)
                </label>
                <select
                  required
                  value={modalCollegeId}
                  onChange={(e) => {
                    setModalCollegeId(e.target.value);
                    setModalDeptId(''); // reset department when college changes
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="">Select College...</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Department (Only departments belonging to selected college) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  2. Department (Scoped to Selected College)
                </label>
                <select
                  required
                  disabled={!modalCollegeId}
                  value={modalDeptId}
                  onChange={(e) => setModalDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50"
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">3. Cohort / Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Alpha Cohort"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Batch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="CSE-2026-A"
                    value={batchForm.code}
                    onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Trainer</label>
                  <input
                    type="text"
                    placeholder="Rohan Sharma"
                    value={batchForm.trainer}
                    onChange={(e) => setBatchForm({ ...batchForm, trainer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!modalCollegeId || !modalDeptId}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  Create Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
