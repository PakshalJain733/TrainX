import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initialBatches } from '../../../data/superAdminMockData';
import StatusBadge from '../../../components/SuperAdmin/StatusBadge';
import ActionDropdown from '../../../components/SuperAdmin/ActionDropdown';
import { Layers, Search, Plus, Users, Calendar, GraduationCap, Building2, RefreshCw, X, UserCheck, ChevronDown } from 'lucide-react';
import { batchAPI, collegeAPI, departmentAPI } from '../../../services/api';
import '../../Admin/Styles/AdminUsers.css';
import '../Styles/Batches.css';

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

  const availableFilterDepartments = filterCollegeId === 'all'
    ? departments
    : departments.filter((d) => String(d.collegeId) === String(filterCollegeId));

  const availableModalDepartments = modalCollegeId
    ? departments.filter((d) => String(d.collegeId) === String(modalCollegeId))
    : [];

  const handleCollegeFilterChange = (e) => {
    const cid = e.target.value;
    setFilterCollegeId(cid);
    setFilterDeptId('all');
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
    if (!batchForm.name || !batchForm.code) return;

    const selectedCol = colleges.find((c) => String(c.id) === String(modalCollegeId));
    const selectedDep = departments.find((d) => String(d.id) === String(modalDeptId));

    const newBatch = {
      id: Date.now(),
      name: batchForm.name,
      code: batchForm.code,
      collegeId: modalCollegeId || 1,
      collegeName: selectedCol ? selectedCol.name : 'Apex Institute of Technology',
      departmentId: modalDeptId || 1,
      departmentName: selectedDep ? selectedDep.name : 'Computer Science',
      trainer: batchForm.trainer || 'Prof. Active Trainer',
      schedule: batchForm.schedule || 'Mon, Wed, Fri (10:00 AM)',
      studentsCount: 45,
      completionRate: '0%',
      status: 'Active',
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
      // Fallback
    }
    setBatches(batches.filter((b) => b.id !== id));
  };

  return (
    <div className="batches-page-wrap">
      {/* Header Bar */}
      <div className="batches-header-wrap">
        <div>
          <h2 className="batches-header-title">
            <Layers className="batches-header-icon" />
            <span>Training Batches & Cohorts</span>
          </h2>
          <p className="batches-header-subtitle">Monitor batch timelines, completion progress, and assigned mentors</p>
        </div>

        <div className="batches-actions-wrap">
          <button
            onClick={loadData}
            className="dept-btn-icon"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="sa-btn-primary"
          >
            <Plus size={16} />
            <span>Create New Cohort</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <div className="batches-filter-card">
        <div className="sa-search-wrap batches-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search cohort name, code, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
        </div>

        <div className="batches-select-group">
          {/* Step 1: Select College */}
          <div className="batches-select-box">
            <Building2 className="batches-select-icon" />
            <select
              value={filterCollegeId}
              onChange={handleCollegeFilterChange}
              className="batches-select-element"
            >
              <option value="all">Step 1: All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <ChevronDown className="batches-select-arrow" />
          </div>

          {/* Step 2: Select Department */}
          <div className="batches-select-box">
            <GraduationCap className="batches-select-icon" />
            <select
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
              className="batches-select-element"
            >
              <option value="all">Step 2: All Departments</option>
              {availableFilterDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <ChevronDown className="batches-select-arrow" />
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="batches-table-card">
        <div className="batches-table-wrap">
          <table className="batches-table">
            <thead>
              <tr className="batches-thead-row">
                <th className="batches-th">Batch Cohort</th>
                <th className="batches-th">Institution & Stream</th>
                <th className="batches-th">Assigned Lead Mentor</th>
                <th className="batches-th">Enrolled Students</th>
                <th className="batches-th">Weekly Schedule</th>
                <th className="batches-th">Progress</th>
                <th className="batches-th">Status</th>
                <th className="batches-th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => (
                <tr key={b.id} className="batches-tr">
                  <td className="batches-td">
                    <div className="batches-cohort-title">{b.name}</div>
                    <div className="batches-cohort-sub">{b.code || `BTC-${b.id}`}</div>
                  </td>
                  <td className="batches-td">
                    <div className="batches-institution">{b.collegeName || b.college || "Apex Tech"}</div>
                    <div className="batches-dept-tag">{b.departmentName || b.department || "Computer Science"}</div>
                  </td>
                  <td className="batches-td">
                    <div className="batches-trainer-name">
                      <UserCheck className="batches-trainer-icon" />
                      <span>{b.trainer || "Prof. Sharma"}</span>
                    </div>
                  </td>
                  <td className="batches-td">
                    <div className="batches-students-count">
                      <Users size={13} />
                      <span>{b.studentsCount || 45}</span>
                    </div>
                  </td>
                  <td className="batches-td">
                    <div className="batches-schedule">
                      <Calendar size={13} />
                      <span>{b.schedule || "Mon - Fri (10 AM)"}</span>
                    </div>
                  </td>
                  <td className="batches-td">
                    <div className="batches-progress-wrap">
                      <div className="batches-progress-bar-bg">
                        <div
                          className="batches-progress-bar-fill"
                          style={{ width: b.completionRate || '65%' }}
                        ></div>
                      </div>
                      <span className="batches-progress-text">{b.completionRate || '65%'}</span>
                    </div>
                  </td>
                  <td className="batches-td">
                    <StatusBadge status={b.status || "Active"} />
                  </td>
                  <td className="batches-td-right">
                    <ActionDropdown
                      onView={() => alert(`Viewing batch: ${b.name}`)}
                      onEdit={() => alert(`Editing ${b.name}`)}
                      onDelete={() => handleDelete(b.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create Training Cohort</h2>
                  <p className="modal-subtitle">Setup a new batch scoped by college & department.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div className="modal-body">
                {/* Step 1: College Selection */}
                <div className="form-group-admin">
                  <label>Step 1: Select College Institution *</label>
                  <select
                    required
                    className="form-input-admin"
                    value={modalCollegeId}
                    onChange={(e) => {
                      setModalCollegeId(e.target.value);
                      setModalDeptId('');
                    }}
                  >
                    <option value="">Select College</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Department Selection */}
                <div className="form-group-admin">
                  <label>Step 2: Select Academic Department *</label>
                  <select
                    required
                    disabled={!modalCollegeId}
                    className="form-input-admin"
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(e.target.value)}
                  >
                    <option value="">
                      {!modalCollegeId ? "Select a college first..." : "Select Department"}
                    </option>
                    {availableModalDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Cohort Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Full Stack 2026 Batch A"
                      value={batchForm.name}
                      onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Batch Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. FS-2026-A"
                      value={batchForm.code}
                      onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Assigned Lead Trainer</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="e.g. Prof. Vikram Joshi"
                      value={batchForm.trainer}
                      onChange={(e) => setBatchForm({ ...batchForm, trainer: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Weekly Schedule</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="e.g. Mon, Wed, Fri (10 AM)"
                      value={batchForm.schedule}
                      onChange={(e) => setBatchForm({ ...batchForm, schedule: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
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
