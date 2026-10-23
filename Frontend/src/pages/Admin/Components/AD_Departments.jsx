import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Plus, Building2, Briefcase, RefreshCw, X, ChevronDown, MoreVertical, Edit2, Trash2, Eye, ShieldCheck, Check, Mail, UserCheck, Layers, Users } from "lucide-react";
import { departmentAPI, collegeAPI } from '../../../services/api';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/AD_Departments.css";

/* ── Inline dropdown for Departments ── */
function DeptSelect(props) {
  return <CustomSelect {...props} />;
}
function StatusBadge({ status }) {
  const norm = String(status || '').toLowerCase();
  let statusClass = 'dept-status-badge--default';
  if (norm.includes('active') || norm.includes('verified') || norm.includes('available')) {
    statusClass = 'dept-status-badge--active';
  } else if (norm.includes('high') || norm.includes('progress')) {
    statusClass = 'dept-status-badge--info';
  } else if (norm.includes('busy') || norm.includes('medium')) {
    statusClass = 'dept-status-badge--warning';
  } else if (norm.includes('purple') || norm.includes('completion')) {
    statusClass = 'dept-status-badge--purple';
  }

  return (
    <span className={`dept-status-badge ${statusClass}`}>
      <span className="dept-status-dot"></span>
      {status}
    </span>
  );
}

function ActionDropdown({ onEdit, onDelete, onView, customActions = [] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="dept-action-menu-wrap" ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`dept-action-trigger-btn ${open ? 'active' : ''}`}
        title="Department Options"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="dept-action-dropdown-panel" onClick={(e) => e.stopPropagation()}>
          {onView && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onView(); }}
              className="dept-action-dropdown-entry"
            >
              <Eye className="dept-action-icon" size={15} />
              <span>View Details</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
              className="dept-action-dropdown-entry"
            >
              <Edit2 className="dept-action-icon" size={15} />
              <span>Edit Department</span>
            </button>
          )}

          {Array.isArray(customActions) && customActions.filter(Boolean).length > 0 && (
            <>
              <div className="dept-action-divider" />
              {customActions.filter(Boolean).map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); action.onClick(); }}
                  className="dept-action-dropdown-entry"
                >
                  {action.icon && <action.icon className="dept-action-icon" size={15} />}
                  <span>{action.label}</span>
                </button>
              ))}
            </>
          )}

          {onDelete && (
            <>
              <div className="dept-action-divider" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
                className="dept-action-dropdown-entry dept-action-dropdown-entry--danger"
              >
                <Trash2 className="dept-action-icon" size={15} />
                <span>Delete Department</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Departments() {
  const navigate = useNavigate();
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
  const [viewDept, setViewDept] = useState(null);
  const [editDept, setEditDept] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collegesData, deptsData] = await Promise.all([
        collegeAPI.getColleges().catch(() => []),
        departmentAPI.getDepartments(selectedCollegeId === 'all' ? null : selectedCollegeId).catch(() => []),
      ]);

      const rawUser = sessionStorage.getItem("user") || sessionStorage.getItem("authUser") || "{}";
      let currentUser = {};
      try { currentUser = JSON.parse(rawUser); } catch (_) {}

      let rawColleges = Array.isArray(collegesData) ? collegesData : [];
      const userRole = (currentUser.role || "").toLowerCase();

      if (userRole && !userRole.includes("super")) {
        const userEmail = (currentUser.email || "").toLowerCase().trim();
        const emailDomain = userEmail.includes("@") ? userEmail.split("@")[1] : "";
        const matched = rawColleges.filter((c) => {
          const colEmail = (c.contact_email || c.adminEmail || c.contactEmail || "").toLowerCase();
          const colDomain = (c.domain || "").toLowerCase().replace(/^@/, "");
          return (
            String(c.id) === String(currentUser.college_id || currentUser.collegeId) ||
            colEmail === userEmail ||
            (emailDomain && colDomain && emailDomain.endsWith(colDomain))
          );
        });
        if (matched.length > 0) rawColleges = matched;
      }

      setColleges(rawColleges);
      if (rawColleges.length > 0) {
        setDeptForm(prev => ({ ...prev, collegeId: prev.collegeId || rawColleges[0].id }));
      }
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
      String(d.collegeId || d.college_id) === String(selectedCollegeId);

    return matchesSearch && matchesCollege;
  });

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const selectedColId = deptForm.collegeId || (colleges[0] ? colleges[0].id : 1);

    const payload = {
      name: deptForm.name,
      code: deptForm.code,
      collegeId: selectedColId,
      college_id: selectedColId,
      hodName: deptForm.hodName || "Dr. Department HOD",
      hodEmail: deptForm.hodEmail || `hod.${deptForm.code.toLowerCase()}@college.edu.in`,
    };

    try {
      const created = await departmentAPI.createDepartment(payload);
      if (created) {
        setDepartments([created, ...departments.filter(d => d.id !== created.id)]);
      } else {
        loadData();
      }
    } catch (err) {
      console.error("Failed to save department to database:", err);
      loadData();
    }

    setIsAddModalOpen(false);
    setDeptForm({ name: '', code: '', collegeId: '', hodName: '', hodEmail: '' });
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!editDept) return;
    try {
      await departmentAPI.updateDepartment(editDept.id, {
        name: editDept.name,
        code: editDept.code,
        hodName: editDept.hodName,
        hodEmail: editDept.hodEmail,
      });
      loadData();
    } catch (err) {
      console.warn("Failed to update department in DB:", err);
      setDepartments(departments.map(d => d.id === editDept.id ? editDept : d));
    }
    setEditDept(null);
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
          <h2 className="departments-header-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Briefcase size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
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
            onClick={() => {
              if (colleges.length > 0 && !deptForm.collegeId) {
                setDeptForm(prev => ({ ...prev, collegeId: colleges[0].id }));
              }
              setIsAddModalOpen(true);
            }}
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
            placeholder="Search department or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search-input"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="departments-grid">
        {Array.isArray(filtered) && filtered.map((dept) => (
          <div key={dept.id} className="dept-card">
            <div>
              <div className="dept-card-top">
                <div>
                  <div className="dept-badge-row">
                    <span className="dept-code-tag">{dept.code}</span>
                    <span className="dept-college-tag">
                      <Building2 size={12} />
                      <span>{dept.collegeName || dept.college_name || (colleges[0] ? colleges[0].name : "")}</span>
                    </span>
                  </div>
                  <h3
                    className="dept-name dept-name--clickable"
                    onClick={() => setViewDept(dept)}
                    title={`Click to view ${dept.name} details`}
                  >
                    {dept.name}
                  </h3>
                  {dept.hodName && (
                    <p className="dept-hod-info">
                      <span>HOD:</span>
                      <strong className="dept-hod-name">{dept.hodName}</strong>
                    </p>
                  )}
                </div>
                <ActionDropdown
                  onView={() => setViewDept(dept)}
                  onEdit={() => setEditDept(dept)}
                  customActions={[
                    {
                      label: "View Students",
                      icon: Users,
                      onClick: () => {
                        const targetDept = dept.code || dept.name;
                        navigate(`/admin/users?department=${encodeURIComponent(targetDept)}&role=student`);
                      },
                    },
                    {
                      label: "View Batches",
                      icon: Layers,
                      onClick: () => navigate('/admin/batches'),
                    },
                  ]}
                  onDelete={() => setDeleteDept(dept)}
                />
              </div>
            </div>

            {/* Metric Pills */}
            <div className="dept-stats-row">
              <div
                className="dept-stat-pill dept-stat-pill--clickable"
                onClick={() => {
                  const targetDept = dept.code || dept.name;
                  navigate(`/admin/users?department=${encodeURIComponent(targetDept)}&role=student`);
                }}
                title={`View Enrolled Students in ${dept.name}`}
                role="button"
                tabIndex={0}
              >
                <div className="dept-stat-val">{dept.studentsCount ?? dept.activeStudents ?? 0}</div>
                <div className="dept-stat-lbl">Students</div>
              </div>
              <div
                className="dept-stat-pill dept-stat-pill--clickable"
                onClick={() => navigate('/admin/batches')}
                title={`View Active Batches for ${dept.name}`}
                role="button"
                tabIndex={0}
              >
                <div className="dept-stat-val">{dept.batchesCount ?? dept.activeBatches ?? 0}</div>
                <div className="dept-stat-lbl">Batches</div>
              </div>
              <div
                className="dept-stat-pill dept-stat-pill--clickable"
                onClick={() => setViewDept(dept)}
                title={`View ${dept.name} Overview & Details`}
                role="button"
                tabIndex={0}
              >
                <StatusBadge status={dept.status || "Active"} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-dialog dept-modal-520">
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
                  <label className="form-label-admin">
                    <span>College Institution</span>
                    <span className="form-required">*</span>
                  </label>
                  <DeptSelect
                    value={deptForm.collegeId}
                    options={(Array.isArray(colleges) ? colleges : []).map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`
                    }))}
                    onChange={(val) => setDeptForm({ ...deptForm, collegeId: val })}
                    placeholder="Select College Institution"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>Department Name</span>
                      <span className="form-required">*</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <Building2 size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        required
                        className="form-input-admin dept-input-padded"
                        placeholder="e.g. Computer Science & Engineering"
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>Department Code</span>
                      <span className="form-required">*</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <GraduationCap size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        required
                        className="form-input-admin dept-input-padded dept-code-input"
                        placeholder="e.g. CSE"
                        value={deptForm.code}
                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>HOD Name</span>
                      <span className="form-optional">(Optional)</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <UserCheck size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        className="form-input-admin dept-input-padded"
                        placeholder="Dr. K. R. Sharma"
                        value={deptForm.hodName}
                        onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>HOD Email</span>
                      <span className="form-optional">(Optional)</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <Mail size={16} className="dept-field-icon" />
                      <input
                        type="email"
                        className="form-input-admin dept-input-padded"
                        placeholder="hod.cse@college.edu.in"
                        value={deptForm.hodEmail}
                        onChange={(e) => setDeptForm({ ...deptForm, hodEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Plus size={16} />
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Department Modal */}
      {viewDept && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewDept(null); }}>
          <div className="modal-dialog dept-modal-540">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{viewDept.name} ({viewDept.code || 'DEPT'})</h2>
                  <p className="modal-subtitle">Academic Department Overview</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewDept(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="sa-modal-details-grid">
                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Building2 size={13} className="sa-detail-label-icon" />
                    <span>Parent Institution</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.collegeName || viewDept.college_name || (colleges[0] ? colleges[0].name : "")}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <UserCheck size={13} className="sa-detail-label-icon" />
                    <span>Head of Department</span>
                  </span>
                  <span className="sa-modal-detail-value sa-detail-hod-value">{viewDept.hodName || "Prof. Assigned HOD"}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Mail size={13} className="sa-detail-label-icon" />
                    <span>HOD Contact Email</span>
                  </span>
                  <span className="sa-modal-detail-value dept-hod-email-value">
                    {viewDept.hodEmail || "hod@college.edu.in"}
                  </span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Layers size={13} className="sa-detail-label-icon" />
                    <span>Active Batches</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.batchesCount ?? viewDept.activeBatches ?? 0} Batches</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Users size={13} className="sa-detail-label-icon" />
                    <span>Enrolled Students</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.studentsCount ?? viewDept.activeStudents ?? 0} Students</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <ShieldCheck size={13} className="sa-detail-label-icon" />
                    <span>Status</span>
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={viewDept.status || 'Active'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setViewDept(null)}>
                Close
              </button>
              <button
                type="button"
                className="sa-btn-primary"
                onClick={() => {
                  setEditDept(viewDept);
                  setViewDept(null);
                }}
              >
                <Edit2 size={15} />
                <span>Edit Department</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Department Modal */}
      {editDept && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditDept(null); }}>
          <div className="modal-dialog dept-modal-520">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Edit Department</h2>
                  <p className="modal-subtitle">Update department details and HOD allocation</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEditDept(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditDepartment}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>Department Name</span>
                      <span className="form-required">*</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <Building2 size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        required
                        className="form-input-admin dept-input-padded"
                        value={editDept.name}
                        onChange={(e) => setEditDept({ ...editDept, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>Department Code</span>
                      <span className="form-required">*</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <GraduationCap size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        required
                        className="form-input-admin dept-input-padded dept-code-input"
                        value={editDept.code || ''}
                        onChange={(e) => setEditDept({ ...editDept, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>HOD Name</span>
                      <span className="form-optional">(Optional)</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <UserCheck size={16} className="dept-field-icon" />
                      <input
                        type="text"
                        className="form-input-admin dept-input-padded"
                        value={editDept.hodName || ''}
                        onChange={(e) => setEditDept({ ...editDept, hodName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group-admin">
                    <label className="form-label-admin">
                      <span>HOD Email</span>
                      <span className="form-optional">(Optional)</span>
                    </label>
                    <div className="dept-input-icon-wrap">
                      <Mail size={16} className="dept-field-icon" />
                      <input
                        type="email"
                        className="form-input-admin dept-input-padded"
                        value={editDept.hodEmail || ''}
                        onChange={(e) => setEditDept({ ...editDept, hodEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditDept(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteDept && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteDept(null); }}>
          <div className="modal-dialog dept-modal-440">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap dept-delete-modal-icon">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Remove Department</h2>
                  <p className="modal-subtitle">Confirm department deletion</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteDept(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="dept-confirm-modal-desc">
                Are you sure you want to remove <strong className="dept-confirm-modal-target">{deleteDept.name}</strong>? Associated batches and students will be unlinked.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteDept(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="manageusers-btn-reject dept-btn-delete-confirm"
                onClick={() => {
                  handleDelete(deleteDept.id);
                  setDeleteDept(null);
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
