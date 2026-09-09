import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initialDepartments } from '../../../data/superAdminMockData';
import StatusBadge from '../../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../../components/SuperAdmin/ActionDropdown';
import { GraduationCap, Search, Plus, Building2, RefreshCw, X, ChevronDown } from 'lucide-react';
import { departmentAPI, collegeAPI } from '../../../services/api';
import '../../Admin/Styles/AdminUsers.css';
import '../Styles/Departments.css';

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
      // Fallback
    }
    setDepartments(departments.filter((d) => d.id !== id));
  };

  return (
    <div className="departments-page-wrap">
      {/* Page Header */}
      <div className="departments-header-wrap">
        <div>
          <h2 className="departments-header-title">
            <GraduationCap className="departments-header-icon" />
            <span>Academic Departments</span>
          </h2>
          <p className="departments-header-subtitle">Manage academic streams and HOD allocations across partner institutions</p>
        </div>

        <div className="departments-actions-wrap">
          <button
            onClick={loadData}
            className="dept-btn-icon"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sa-btn-primary"
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="departments-filter-card">
        <div className="sa-search-wrap dept-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search department, code, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="dept-select-box">
          <Building2 className="dept-select-icon" />
          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            className="dept-select-element"
          >
            <option value="all">All Registered Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown className="dept-select-arrow" />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="departments-grid">
        {filtered.map((dept) => (
          <div key={dept.id} className="dept-card">
            <div>
              <div className="dept-card-top">
                <div>
                  <div className="dept-badge-row">
                    <span className="dept-code-tag">{dept.code}</span>
                    <span className="dept-college-tag">
                      <Building2 size={12} />
                      <span>{dept.collegeName || "Apex Institute"}</span>
                    </span>
                  </div>
                  <h3 className="dept-name">{dept.name}</h3>
                  {dept.hodName && (
                    <p className="dept-hod-info">
                      <span>HOD:</span>
                      <strong className="dept-hod-name">{dept.hodName}</strong>
                    </p>
                  )}
                </div>
                <ActionDropdown
                  onView={() => alert(`Department details: ${dept.name}`)}
                  onEdit={() => alert(`Editing ${dept.name}`)}
                  onDelete={() => handleDelete(dept.id)}
                />
              </div>
            </div>

            {/* Metric Pills */}
            <div className="dept-stats-row">
              <div className="dept-stat-pill">
                <div className="dept-stat-val">{dept.studentsCount || dept.activeStudents || 120}</div>
                <div className="dept-stat-lbl">Students</div>
              </div>
              <div className="dept-stat-pill">
                <div className="dept-stat-val">{dept.batchesCount || 4}</div>
                <div className="dept-stat-lbl">Batches</div>
              </div>
              <div className="dept-stat-pill">
                <StatusBadge status={dept.status || "Active"} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Add Academic Department</h2>
                  <p className="modal-subtitle">Create a new department under a college.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Select College *</label>
                  <select
                    required
                    className="form-input-admin"
                    value={deptForm.collegeId}
                    onChange={(e) => setDeptForm({ ...deptForm, collegeId: e.target.value })}
                  >
                    <option value="">Select College Institution</option>
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
                      placeholder="e.g. Computer Science"
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
                      placeholder="Dr. K. R. Sharma"
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
