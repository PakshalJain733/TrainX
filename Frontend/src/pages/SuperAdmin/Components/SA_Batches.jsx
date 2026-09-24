import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Search, Plus, Users, Calendar, GraduationCap, Building2, RefreshCw, X, UserCheck, ChevronDown, MoreVertical, Edit2, Trash2, Eye, ShieldCheck, Check } from 'lucide-react';
import { batchAPI, collegeAPI, departmentAPI } from '../../../services/api';
import "../Styles/SA_Batches.css";

/* ── Inline dropdown for Batches (CSS: Batches.css .batch-select-*) ── */
function BatchSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, disabled = false, direction }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropUp, setDropUp] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!disabled && !isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (direction === 'up') {
        setDropUp(true);
      } else if (direction === 'down') {
        setDropUp(false);
      } else {
        setDropUp(spaceBelow < 220);
      }
    }
    if (!disabled) setIsOpen(v => !v);
  };

  return (
    <div className={`batch-select-wrap${isOpen ? ' batch-select-wrap--open' : ''}${disabled ? ' batch-select-wrap--disabled' : ''}`} ref={ref}>
      <button type="button" disabled={disabled} onClick={handleToggle} className={`batch-select-trigger${isOpen ? ' batch-select-trigger--open' : ''}`}>
        {Icon && <Icon className="batch-select-icon" />}
        <span className="batch-select-text">{selected ? selected.label : <span className="batch-select-placeholder">{placeholder}</span>}</span>
        <ChevronDown className={`batch-select-arrow${isOpen ? ' batch-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className={`batch-select-dropdown${dropUp ? ' batch-select-dropdown--up' : ''}`}>
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`batch-select-option${isSel ? ' batch-select-option--selected' : ''}`}>
                <span className="batch-select-option-label">{opt.label}</span>
                {isSel && <Check className="batch-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function StatusBadge({ status }) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'Active' || status === 'Verified' || status === 'Available') {
    badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'Inactive' || status === 'Disabled') {
    badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  } else if (status === 'High' || status === 'In Progress') {
    badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (status === 'Busy' || status === 'Medium') {
    badgeStyles = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (status === 'Near Completion') {
    badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status}
    </span>
  );
}

function ActionDropdown({ onEdit, onDelete, onView, onVerify, customActions = [] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleDropdown = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(!open);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleScrollOrResize() {
      if (open && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="action-dropdown-container">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`action-dropdown-trigger ${open ? 'open' : ''}`}
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="action-dropdown-menu action-dropdown-portal"
          style={{
            top: `${coords.top}px`,
            right: `${coords.right}px`,
          }}
        >
          {onView && (
            <button
              type="button"
              onClick={() => { onView(); setOpen(false); }}
              className="action-dropdown-item"
            >
              <Eye className="action-dropdown-icon" />
              <span>View Details</span>
            </button>
          )}

          {onVerify && (
            <button
              type="button"
              onClick={() => { onVerify(); setOpen(false); }}
              className="action-dropdown-item action-dropdown-item--verify"
            >
              <ShieldCheck className="action-dropdown-icon" />
              <span>Verify Access</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => { onEdit(); setOpen(false); }}
              className="action-dropdown-item"
            >
              <Edit2 className="action-dropdown-icon" />
              <span>Edit Record</span>
            </button>
          )}

          {customActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { action.onClick(); setOpen(false); }}
              className="action-dropdown-item"
            >
              {action.icon && <action.icon className="action-dropdown-icon" />}
              <span>{action.label}</span>
            </button>
          ))}

          {onDelete && (
            <>
              <div className="action-dropdown-divider" />
              <button
                type="button"
                onClick={() => { onDelete(); setOpen(false); }}
                className="action-dropdown-item action-dropdown-item--danger"
              >
                <Trash2 className="action-dropdown-icon" />
                <span>Remove Record</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Cascading Filter States
  const [filterCollegeId, setFilterCollegeId] = useState('all');
  const [filterDeptId, setFilterDeptId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBatch, setViewBatch] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [deleteBatch, setDeleteBatch] = useState(null);

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

      setColleges(Array.isArray(collegesData) ? collegesData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
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
          {/* Select College */}
          <BatchSelect
            icon={Building2}
            value={filterCollegeId}
            wrapperClass="batch-select"
            onChange={(val) => {
              setFilterCollegeId(val);
              setFilterDeptId('all');
            }}
            options={[
              { value: 'all', label: 'All Colleges' },
              ...colleges.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
            ]}
          />

          {/* Select Department */}
          <BatchSelect
            icon={GraduationCap}
            value={filterDeptId}
            wrapperClass="batch-select"
            onChange={(val) => setFilterDeptId(val)}
            options={[
              { value: 'all', label: 'All Departments' },
              ...availableFilterDepartments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))
            ]}
          />
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
                      onView={() => setViewBatch(b)}
                      onEdit={() => setEditBatch(b)}
                      onDelete={() => setDeleteBatch(b)}
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
                {/* College Selection */}
                <div className="form-group-admin">
                  <label>Select College Institution *</label>
                  <BatchSelect
                    value={modalCollegeId}
                    options={colleges.map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`
                    }))}
                    onChange={(val) => {
                      setModalCollegeId(val);
                      setModalDeptId('');
                    }}
                    placeholder="Select College"
                  />
                </div>

                {/* Department Selection */}
                <div className="form-group-admin">
                  <label>Select Academic Department *</label>
                  <BatchSelect
                    value={modalDeptId}
                    disabled={!modalCollegeId}
                    options={availableModalDepartments.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`
                    }))}
                    onChange={(val) => setModalDeptId(val)}
                    placeholder={!modalCollegeId ? "Select a college first..." : "Select Department"}
                  />
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

      {/* View Batch Modal */}
      {viewBatch && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewBatch(null); }}>
          <div className="modal-dialog" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{viewBatch.name}</h2>
                  <p className="modal-subtitle">Batch Code: <strong className="text-slate-700">{viewBatch.code || 'BCH-2026'}</strong></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewBatch(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="sa-modal-details-grid">
                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Building2 size={13} className="text-indigo-500" />
                    <span>Institution</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewBatch.collegeName || viewBatch.college || "Apex Tech"}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <GraduationCap size={13} className="text-indigo-500" />
                    <span>Department</span>
                  </span>
                  <span className="sa-modal-detail-value text-indigo-600">{viewBatch.departmentName || viewBatch.department || "Computer Science"}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <UserCheck size={13} className="text-indigo-500" />
                    <span>Assigned Lead Mentor</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewBatch.trainer || 'Prof. Active Trainer'}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Calendar size={13} className="text-indigo-500" />
                    <span>Weekly Schedule</span>
                  </span>
                  <span className="sa-modal-detail-value font-medium text-slate-700" style={{ fontSize: '12px' }}>
                    {viewBatch.schedule || 'Mon - Fri (10 AM)'}
                  </span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Users size={13} className="text-indigo-500" />
                    <span>Enrolled Students</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewBatch.studentsCount || 45} Students</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <ShieldCheck size={13} className="text-indigo-500" />
                    <span>Status</span>
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={viewBatch.status || 'Active'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setViewBatch(null)}>
                Close
              </button>
              <button
                type="button"
                className="sa-btn-primary"
                onClick={() => {
                  setEditBatch(viewBatch);
                  setViewBatch(null);
                }}
              >
                <Edit2 size={15} />
                <span>Edit Batch</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Batch Modal */}
      {editBatch && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditBatch(null); }}>
          <div className="modal-dialog" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Edit Batch Record</h2>
                  <p className="modal-subtitle">Update cohort parameters and mentor assignment</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEditBatch(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setBatches(batches.map(b => b.id === editBatch.id ? editBatch : b));
              setEditBatch(null);
            }}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Batch / Cohort Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editBatch.name}
                      onChange={(e) => setEditBatch({ ...editBatch, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Batch Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editBatch.code || ''}
                      onChange={(e) => setEditBatch({ ...editBatch, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Assigned Mentor / Trainer</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      value={editBatch.trainer || ''}
                      onChange={(e) => setEditBatch({ ...editBatch, trainer: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Schedule</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      value={editBatch.schedule || ''}
                      onChange={(e) => setEditBatch({ ...editBatch, schedule: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Status</label>
                  <BatchSelect
                    value={editBatch.status || 'Active'}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Upcoming', label: 'Upcoming' }
                    ]}
                    onChange={(val) => setEditBatch({ ...editBatch, status: val })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setEditBatch(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteBatch && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteBatch(null); }}>
          <div className="modal-dialog" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon-danger">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Remove Cohort</h2>
                  <p className="modal-subtitle">Confirm batch deletion</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteBatch(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-slate-600 m-0">
                Are you sure you want to remove <strong className="text-slate-900">{deleteBatch.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteBatch(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="manageusers-btn-reject modal-btn-confirm-delete"
                onClick={() => {
                  setBatches(batches.filter(b => b.id !== deleteBatch.id));
                  setDeleteBatch(null);
                }}
              >
                <Trash2 size={15} />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
