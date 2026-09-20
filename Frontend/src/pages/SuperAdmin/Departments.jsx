import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, Layers, Users, BookOpen, Building2, Filter, RefreshCw, X, Mail } from 'lucide-react';
import { departmentAPI, collegeAPI } from '../../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
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

      setColleges(Array.isArray(collegesData) ? collegesData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Academic Departments</span>
          </h2>
          <p className="text-xs text-slate-500">Manage academic departments scoped by institution</p>
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search department stream, code, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Dynamic College Selection Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="all">All Registered Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((dept) => (
          <div key={dept.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {dept.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{dept.collegeName || "Apex Institute"}</span>
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                {dept.hodName && (
                  <p className="text-xs text-slate-500 mt-1">HOD: <strong className="text-slate-700">{dept.hodName}</strong></p>
                )}
              </div>
              <ActionDropdown
                onView={() => alert(`View details for ${dept.name}`)}
                onEdit={() => alert(`Edit ${dept.name}`)}
                onDelete={() => handleDelete(dept.id)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">College</p>
                <p className="font-bold text-slate-900 text-xs truncate mt-0.5" title={dept.collegeName || "Apex Inst"}>
                  {dept.collegeName ? dept.collegeName.split(" ")[0] : "Apex"}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents || dept.studentsCount || 0}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Add New Department</h3>
                  <p className="text-xs text-slate-500">Create an academic department for an institution</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target College</label>
                <select
                  required
                  value={deptForm.collegeId}
                  onChange={(e) => setDeptForm({ ...deptForm, collegeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="">Select Target Institution...</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="CSE"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">HOD Name</label>
                  <input
                    type="text"
                    placeholder="Dr. Arvind Kulkarni"
                    value={deptForm.hodName}
                    onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">HOD Email</label>
                  <input
                    type="email"
                    placeholder="hod.cse@college.edu.in"
                    value={deptForm.hodEmail}
                    onChange={(e) => setDeptForm({ ...deptForm, hodEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
