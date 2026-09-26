import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, Search, Plus, Building2, RefreshCw, X, ChevronDown, MoreVertical, Edit2, Trash2, Eye, ShieldCheck, Check, Mail, UserCheck, Layers, Users } from 'lucide-react';
import { departmentAPI, collegeAPI } from '../../../services/api';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/SA_Departments.css";

/* ── Inline dropdown for Departments ── */
function DeptSelect(props) {
  return <CustomSelect {...props} />;
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
      String(d.collegeId || d.college_id) === String(selectedCollegeId);

    return matchesSearch && matchesCollege;
  });

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const selectedCol = colleges.find((c) => String(c.id) === String(deptForm.collegeId));

    const payload = {
      name: deptForm.name,
      code: deptForm.code,
      collegeId: deptForm.collegeId || (colleges[0] ? colleges[0].id : 1),
      college_id: deptForm.collegeId || (colleges[0] ? colleges[0].id : 1),
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

        <DeptSelect
          icon={Building2}
          value={selectedCollegeId}
          onChange={(val) => setSelectedCollegeId(val)}
          wrapperClass="dept-select"
          options={[
            { value: 'all', label: 'All Registered Colleges' },
            ...colleges.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
          ]}
        />
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
                  onView={() => setViewDept(dept)}
                  onEdit={() => setEditDept(dept)}
                  onDelete={() => setDeleteDept(dept)}
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
                  <label>College *</label>
                  <DeptSelect
                    value={deptForm.collegeId}
                    options={colleges.map((c) => ({
                      value: c.id,
                      label: `${c.name} (${c.code})`
                    }))}
                    onChange={(val) => setDeptForm({ ...deptForm, collegeId: val })}
                    placeholder="Select College Institution"
                  />
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
                    <Building2 size={13} className="text-indigo-500" />
                    <span>Parent Institution</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.collegeName || "Apex Institute"}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <UserCheck size={13} className="text-indigo-500" />
                    <span>Head of Department</span>
                  </span>
                  <span className="sa-modal-detail-value text-indigo-600">{viewDept.hodName || "Prof. Assigned HOD"}</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Mail size={13} className="text-indigo-500" />
                    <span>HOD Contact Email</span>
                  </span>
                  <span className="sa-modal-detail-value font-medium text-slate-700 dept-hod-email-value">
                    {viewDept.hodEmail || "hod@college.edu.in"}
                  </span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Layers size={13} className="text-indigo-500" />
                    <span>Active Batches</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.batchesCount || 4} Batches</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <Users size={13} className="text-indigo-500" />
                    <span>Enrolled Students</span>
                  </span>
                  <span className="sa-modal-detail-value">{viewDept.studentsCount || viewDept.activeStudents || 120} Students</span>
                </div>

                <div className="sa-modal-detail-item">
                  <span className="sa-modal-detail-label">
                    <ShieldCheck size={13} className="text-indigo-500" />
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

            <form onSubmit={(e) => {
              e.preventDefault();
              setDepartments(departments.map(d => d.id === editDept.id ? editDept : d));
              setEditDept(null);
            }}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Department Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editDept.name}
                      onChange={(e) => setEditDept({ ...editDept, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Department Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editDept.code || ''}
                      onChange={(e) => setEditDept({ ...editDept, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>HOD Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      value={editDept.hodName || ''}
                      onChange={(e) => setEditDept({ ...editDept, hodName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>HOD Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      value={editDept.hodEmail || ''}
                      onChange={(e) => setEditDept({ ...editDept, hodEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setEditDept(null)}>
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
              <p className="text-sm text-slate-600 m-0">
                Are you sure you want to remove <strong className="text-slate-900">{deleteDept.name}</strong>? Associated batches and students will be unlinked.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteDept(null)}>
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
