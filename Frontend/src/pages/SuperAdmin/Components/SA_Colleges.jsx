import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import { collegeAPI, departmentAPI } from '../../../services/api';
import { apiFetch } from '../../../utils/api';
import { EVENTS } from '../../../utils/sharedStore';
import { Plus, Search, Filter, Building2, MapPin, Mail, Users, X, ArrowLeft, GraduationCap, MoreVertical, Edit2, Trash2, Eye, ShieldCheck, ChevronDown, Check, AlertCircle } from "lucide-react";
import { validateCollegeForm } from '../../../utils/collegeValidation.js';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/SA_Colleges.css";

/* ── Inline dropdown for Colleges ── */
function CollegeSelect(props) {
  return <CustomSelect {...props} />;
}

function StatusBadge({ status }) {
  let modifier = '';
  if (status === 'Active' || status === 'Verified' || status === 'Available') {
    modifier = 'badge-active';
  } else if (status === 'High' || status === 'In Progress') {
    modifier = 'badge-progress';
  } else if (status === 'Busy' || status === 'Medium') {
    modifier = 'badge-warning';
  } else if (status === 'Near Completion') {
    modifier = 'badge-purple';
  }

  return (
    <span className={`sa-college-badge ${modifier}`}>
      <span className="sa-college-badge-dot"></span>
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
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            top: `${coords.top}px`,
            right: `${coords.right}px`,
          }}
        >
          {onView && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onView(); }}
              className="action-dropdown-item"
            >
              <Eye className="action-dropdown-icon" />
              <span>View Details</span>
            </button>
          )}

          {onVerify && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onVerify(); }}
              className="action-dropdown-item action-dropdown-item--verify"
            >
              <ShieldCheck className="action-dropdown-icon" />
              <span>Verify Access</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); onEdit(); }}
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
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); action.onClick(); }}
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
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { setOpen(false); onDelete(); }}
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

function validateEditCollegeForm(values) {
  const errors = {};

  // 1. College Full Name (Required)
  const name = (values.name || '').trim();
  if (!name) {
    errors.name = 'College name is required.';
  } else if (name.length < 3) {
    errors.name = 'College name must be at least 3 characters.';
  } else if (name.length > 150) {
    errors.name = 'College name cannot exceed 150 characters.';
  }

  // 2. Short Code (Required)
  const code = (values.code || '').trim().toUpperCase();
  if (!code) {
    errors.code = 'Short code is required.';
  } else if (code.length < 2 || code.length > 15) {
    errors.code = 'Short code must be between 2 and 15 characters (e.g., VPPCOE).';
  } else if (!/^[A-Z0-9-]+$/.test(code)) {
    errors.code = 'Short code can only contain uppercase letters, numbers, and hyphens.';
  }

  // 3. City & Location (Required)
  const location = (values.location || '').trim();
  if (!location) {
    errors.location = 'City & Location is required.';
  } else if (location.length < 2) {
    errors.location = 'Location must be at least 2 characters.';
  }

  // 4. Email Domain (Optional for existing colleges; validate if provided)
  const domain = (values.domain || '').trim().toLowerCase();
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/;
  if (domain && !domainRegex.test(domain)) {
    errors.domain = 'Please enter a valid domain format (e.g., pvppcoe.ac.in).';
  }

  // 5. College Administrator Name (Optional for edit)
  const adminName = (values.adminName || '').trim();
  if (adminName && adminName.length < 2) {
    errors.adminName = 'Administrator name must be at least 2 characters.';
  }

  // 6. Admin Email (Optional for edit; validate format if provided)
  const adminEmail = (values.adminEmail || '').trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (adminEmail) {
    if (!emailRegex.test(adminEmail)) {
      errors.adminEmail = 'Please enter a valid email address.';
    } else if (domain) {
      const emailDomain = adminEmail.split('@')[1];
      if (emailDomain && emailDomain.toLowerCase() !== domain.toLowerCase()) {
        errors.adminEmail = `Admin email domain (@${emailDomain}) must match the Email Domain (@${domain}).`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateDeptForm(values) {
  const errors = {};

  const name = (values?.name || '').trim();
  if (!name) {
    errors.name = 'Department name is required.';
  } else if (name.length < 2) {
    errors.name = 'Department name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Department name cannot exceed 100 characters.';
  }

  const code = (values?.code || '').trim().toUpperCase();
  if (!code) {
    errors.code = 'Department code is required.';
  } else if (code.length < 1 || code.length > 15) {
    errors.code = 'Department code must be between 1 and 15 characters (e.g. CE, IT, EXTC).';
  } else if (!/^[A-Z0-9-]+$/.test(code)) {
    errors.code = 'Department code can only contain uppercase letters, numbers, and hyphens.';
  }

  const hodEmail = (values?.hodEmail || '').trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (hodEmail && !emailRegex.test(hodEmail)) {
    errors.hodEmail = 'Please enter a valid email address.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default function Colleges() {
  const { collegeId } = useParams();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [viewCollegeModal, setViewCollegeModal] = useState(null);
  const [editCollege, setEditCollege] = useState(null);
  const [deleteCollege, setDeleteCollege] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Department Modals & State
  const [viewDeptModal, setViewDeptModal] = useState(null);
  const [editDeptModal, setEditDeptModal] = useState(null);
  const [deleteDeptModal, setDeleteDeptModal] = useState(null);
  const [deptErrors, setDeptErrors] = useState({});
  const [isSavingDept, setIsSavingDept] = useState(false);

  const handleTrigger2FAForCollegeAdmin = async (college) => {
    const rawEmail = college.adminEmail || college.contact_email || college.email;
    const adminEmail = (rawEmail && rawEmail !== '-' && rawEmail.trim()) ? rawEmail.trim() : null;

    try {
      const usersRes = await apiFetch('/admin/users');
      let adminUser = null;
      const userList = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
      if (userList.length > 0) {
        if (adminEmail) {
          adminUser = userList.find(u => u.email && u.email.toLowerCase() === adminEmail.toLowerCase());
        }
        if (!adminUser) {
          adminUser = userList.find(u => String(u.college_id) === String(college.id) && String(u.role).toLowerCase().includes('admin'));
        }
      }
      if (!adminUser) {
        alert(`No active College Admin account found for ${college.name}. Please edit this college record to set an Administrator Email first.`);
        return;
      }
      const res = await apiFetch(`/admin/users/${adminUser.id}/trigger-2fa`, {
        method: 'POST',
      });
      if (res && (res.success || res.status === 200 || (res.data && !res.error))) {
        alert(res.message || `Two-step verification has been re-triggered for ${adminUser.name || adminUser.email} (${college.name}). 2FA setup is now required on their next sign-in.`);
      } else {
        alert(res?.error || res?.message || 'Failed to trigger two-step verification.');
      }
    } catch (err) {
      console.error('Trigger 2FA error:', err);
      alert(err?.message || 'Failed to trigger two-step verification.');
    }
  };

  const handleDeleteCollege = async (id) => {
    try {
      await collegeAPI.deleteCollege(id);
      setColleges((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error removing college:", err);
      alert(err.message || "Failed to remove college.");
    }
  };

  useEffect(() => {
    collegeAPI.getColleges()
      .then((data) => setColleges(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error loading colleges:", err));

    departmentAPI.getDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error loading departments:", err));
  }, []);

  // Form states
  const [collegeForm, setCollegeForm] = useState({
    name: '', code: '', location: '', adminName: '', adminEmail: '', domain: '', departmentsCount: 0, studentsCount: 0,
  });
  const [deptForm, setDeptForm] = useState({
    name: '', code: '', hodName: '', hodEmail: '',
  });

  const selectedCollege = colleges.find(c => String(c.id) === String(collegeId));

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.adminName && c.adminName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ||
      c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const filteredDepts = departments.filter((d) =>
    (!collegeId || String(d.collegeId || d.college_id) === String(collegeId)) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCollege = async (e) => {
    e.preventDefault();
    const validation = validateCollegeForm(collegeForm);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});

    try {
      const created = await collegeAPI.createCollege({
        name: collegeForm.name.trim(),
        code: collegeForm.code.trim().toUpperCase(),
        location: collegeForm.location.trim(),
        city: collegeForm.location.trim(),
        contactEmail: collegeForm.adminEmail.trim().toLowerCase(),
        adminName: collegeForm.adminName.trim(),
        adminEmail: collegeForm.adminEmail.trim().toLowerCase(),
        domain: collegeForm.domain.trim().toLowerCase(),
      });
      if (created) {
        setColleges([created, ...colleges.filter(c => c.id !== created.id)]);
      } else {
        const data = await collegeAPI.getColleges();
        setColleges(Array.isArray(data) ? data : colleges);
      }
      window.dispatchEvent(new CustomEvent(EVENTS.COLLEGE_UPDATED));
      setIsAddCollegeModalOpen(false);
      setCollegeForm({ name: '', code: '', location: '', adminName: '', adminEmail: '', domain: '', departmentsCount: 0, studentsCount: 0 });
    } catch (err) {
      console.error("Failed to save college to backend:", err);
      setFormErrors(prev => ({ ...prev, _general: err.message || "Failed to save college. The college code might already exist. Please enter a unique college code." }));
      collegeAPI.getColleges().then(data => setColleges(Array.isArray(data) ? data : colleges)).catch(() => {});
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const validation = validateDeptForm(deptForm);
    if (!validation.isValid) {
      setDeptErrors(validation.errors);
      return;
    }
    setDeptErrors({});
    setIsSavingDept(true);

    const payload = {
      name: deptForm.name.trim(),
      code: deptForm.code.trim().toUpperCase(),
      collegeId: collegeId || 1,
      college_id: collegeId || 1,
      hodName: deptForm.hodName ? deptForm.hodName.trim() : "Dr. Department HOD",
      hodEmail: deptForm.hodEmail ? deptForm.hodEmail.trim().toLowerCase() : `hod.${deptForm.code.trim().toLowerCase()}@college.edu.in`,
    };

    try {
      const created = await departmentAPI.createDepartment(payload);
      if (created) {
        setDepartments((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
      } else {
        const fresh = await departmentAPI.getDepartments(collegeId);
        setDepartments(Array.isArray(fresh) ? fresh : departments);
      }
      setIsAddDeptModalOpen(false);
      setDeptForm({ name: '', code: '', hodName: '', hodEmail: '' });
    } catch (err) {
      console.error("Failed to save department to database:", err);
      setDeptErrors((prev) => ({
        ...prev,
        _general: err.message || "Failed to save department. Please check department details.",
      }));
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    const validation = validateDeptForm(editDeptModal);
    if (!validation.isValid) {
      setDeptErrors(validation.errors);
      return;
    }
    setDeptErrors({});
    setIsSavingDept(true);

    const payload = {
      name: editDeptModal.name.trim(),
      code: editDeptModal.code.trim().toUpperCase(),
      hodName: editDeptModal.hodName ? editDeptModal.hodName.trim() : '',
      hodEmail: editDeptModal.hodEmail ? editDeptModal.hodEmail.trim().toLowerCase() : '',
      status: editDeptModal.status || 'Active',
    };

    try {
      const updated = await departmentAPI.updateDepartment(editDeptModal.id, payload);
      setDepartments((prev) =>
        prev.map((d) => {
          if (d.id === editDeptModal.id) {
            return {
              ...d,
              ...(updated || {}),
              name: payload.name,
              code: payload.code,
              hodName: payload.hodName,
              hodEmail: payload.hodEmail,
              status: payload.status,
            };
          }
          return d;
        })
      );
      setEditDeptModal(null);
    } catch (err) {
      console.error("Failed to update department:", err);
      setDeptErrors((prev) => ({
        ...prev,
        _general: err.message || "Failed to update department.",
      }));
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      await departmentAPI.deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      setDeleteDeptModal(null);
    } catch (err) {
      console.error("Failed to remove department:", err);
      alert(err.message || "Failed to remove department.");
    }
  };

  // If collegeId URL param is present, render College Departments view
  if (collegeId) {
    return (
      <div className="college-depts-container">
        <div className="sa-page-header">
          <div>
            <div className="colleges-header-title-wrap mb-1">
              <h2 className="colleges-header-title colleges-header-title-wrap m-0">
                <span>{selectedCollege ? selectedCollege.name : "College Departments"}</span>
              </h2>
            </div>
            <p className="colleges-depts-subtitle">
              Viewing departments inside {selectedCollege ? selectedCollege.name : "selected college"}
            </p>
          </div>
        </div>

        <div className="sa-search-card">
          <div className="sa-search-wrap college-search-wrap-full">
            <Search className="sa-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search department stream or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sa-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredDepts.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center', marginTop: '16px' }}>
            <GraduationCap size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No departments found
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
              {searchQuery ? `No departments match "${searchQuery}".` : "No departments have been configured for this college yet."}
            </p>
          </div>
        ) : (
          <div className="colleges-depts-grid">
            {filteredDepts.map((dept) => (
              <div
                key={dept.id}
                className="sa-widget-card college-dept-widget-card"
                onClick={() => setViewDeptModal(dept)}
                style={{ cursor: 'pointer' }}
                title="Click to view department details"
              >
                <div className="colleges-dept-card-header">
                  <div>
                    <span className="college-dept-code-badge">
                      {dept.code}
                    </span>
                    <h3 className="college-dept-card-title">{dept.name}</h3>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionDropdown
                      onView={() => setViewDeptModal(dept)}
                    />
                  </div>
                </div>

                <div className="college-dept-stats-row">
                  <div className="college-dept-stat-box">
                    <p className="college-dept-stat-label">Active Students</p>
                    <p className="college-dept-stat-num">{dept.activeStudents || 120}</p>
                  </div>
                  <div className="college-dept-stat-box">
                    <p className="college-dept-stat-label">Batches</p>
                    <p className="college-dept-stat-num">{dept.batchesCount || 4}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Department Details Modal */}
        {viewDeptModal && createPortal(
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewDeptModal(null); }}>
            <div className="modal-dialog college-modal-540">
              <div className="modal-header">
                <div className="modal-header-left">
                  <div className="modal-header-icon-wrap modal-header-icon--indigo">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title">{viewDeptModal.name}</h2>
                    <p className="modal-subtitle">Department Details &amp; Operational Record</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setViewDeptModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Department Code</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{viewDeptModal.code || '—'}</p>
                  </div>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Operational Status</label>
                    <div style={{ marginTop: '2px' }}><StatusBadge status={viewDeptModal.status || 'Active'} /></div>
                  </div>
                  <div className="form-group-admin" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Associated Institution</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#334155', fontSize: '13.5px' }}>
                      {selectedCollege ? selectedCollege.name : (viewDeptModal.collegeName || '—')}
                    </p>
                  </div>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Head of Department (HOD)</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                      {viewDeptModal.hodName || viewDeptModal.hod_name || 'Dr. Department HOD'}
                    </p>
                  </div>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>HOD Email</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#2563eb', fontSize: '13.5px' }}>
                      {viewDeptModal.hodEmail || viewDeptModal.hod_email || '—'}
                    </p>
                  </div>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Active Batches</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {viewDeptModal.batchesCount || 4}
                    </p>
                  </div>
                  <div className="form-group-admin">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Active Students</label>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {viewDeptModal.activeStudents || 120}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Primary View: Colleges Directory
  return (
    <div className="colleges-page-wrap">
      {/* Header & Main Action */}
      <div className="sa-page-header">
        <div>
          <h2 className="colleges-header-title-wrap" style={{ margin: 0 }}>
            <span className="colleges-header-title" style={{ fontSize: "1.25rem", fontWeight: 800, color: "inherit" }}>Colleges Directory</span>
          </h2>
          <p className="colleges-header-subtitle">Manage all registered institutions and partner universities</p>
        </div>
        <button onClick={() => { setFormErrors({}); setIsAddCollegeModalOpen(true); }} className="sa-btn-primary">
          <Plus size={16} />
          <span>Add New College</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="colleges-search-card">
        <div className="sa-search-wrap colleges-search-wrap">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search college name, city, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <CollegeSelect
          icon={Filter}
          value={filterStatus}
          onChange={(val) => setFilterStatus(val)}
          wrapperClass="college-select"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'Active', label: 'Active Colleges' },
            { value: 'Inactive', label: 'Inactive Colleges' },
          ]}
        />
      </div>

      {/* Colleges Table */}
      <div className="colleges-table-card">
        {filteredColleges.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Colleges Found"
            description={searchQuery ? `No colleges matching "${searchQuery}"` : "Get started by registering the first partner college."}            onAction={() => setIsAddCollegeModalOpen(true)}
          />
        ) : (
          <div className="colleges-table-wrap">
            <table className="colleges-table">
              <thead>
                <tr className="colleges-table-thead">
                  <th className="colleges-th">College Name</th>
                  <th className="colleges-th">Location</th>
                  <th className="colleges-th">College Admin</th>
                  <th className="colleges-th">Departments</th>
                  <th className="colleges-th">Active Students</th>
                  <th className="colleges-th">Status</th>
                  <th className="colleges-th-right">Actions</th>
                </tr>
              </thead>
              <tbody className="colleges-tbody">
                {filteredColleges.map((college) => (
                  <tr key={college.id} className="colleges-tr">
                    <td className="colleges-td">
                      <div className="sa-college-avatar-box">
                        <div className="sa-college-logo-icon-wrap">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="colleges-name">{college.name}</div>
                          <div className="colleges-code">{college.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="colleges-td">
                      <div className="colleges-location-wrap">
                        <MapPin className="colleges-location-icon" />
                        <span>{college.location}</span>
                      </div>
                    </td>
                    <td className="colleges-td">
                      <div className="colleges-admin-name">{college.adminName || college.contact_email?.split('@')[0] || '-'}</div>
                      <div className="colleges-admin-email-wrap">
                        <Mail size={12} />
                        <span>{college.adminEmail || college.contact_email || '-'}</span>
                      </div>
                    </td>
                    <td className="colleges-td colleges-admin-name">
                      {departments.filter(d => String(d.collegeId || d.college_id) === String(college.id)).length || college.departmentsCount || college.department_count || 0}
                    </td>
                    <td className="colleges-td">
                      <div className="colleges-students-count">
                        <Users className="colleges-students-icon" />
                        <span>{college.studentsCount || college.student_count || 0}</span>
                      </div>
                    </td>
                    <td className="colleges-td">
                      <StatusBadge status={college.status} />
                    </td>
                    <td className="colleges-td-right">
                      <ActionDropdown
                        onView={() => setViewCollegeModal(college)}
                        onEdit={() => {
                          setEditErrors({});
                          setEditCollege({
                            ...college,
                            name: college.name || '',
                            code: college.code || '',
                            location: college.location || college.city || '',
                            domain: college.domain || '',
                            adminName: college.adminName || college.admin_name || '',
                            adminEmail: college.adminEmail || college.contact_email || '',
                            status: college.status || 'Active',
                          });
                        }}
                        onDelete={() => setDeleteCollege(college)}
                        customActions={[
                          {
                            label: 'Explore Departments',
                            icon: GraduationCap,
                            onClick: () => navigate(`/super-admin/colleges/${college.id}`),
                          },
                          {
                            label: 'Re-trigger 2FA Setup',
                            icon: ShieldCheck,
                            onClick: () => handleTrigger2FAForCollegeAdmin(college),
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add College Modal */}
      {isAddCollegeModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddCollegeModalOpen(false); }}>
          <div className="modal-dialog college-modal-560">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Register New Institution</h2>
                  <p className="modal-subtitle">Add partner college to institutional ecosystem.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddCollegeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCollege} noValidate>
              <div className="modal-body">
                {formErrors._general && (
                  <div className="modal-form-alert-banner">
                    <AlertCircle size={16} />
                    <span>{formErrors._general}</span>
                  </div>
                )}

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Full Name *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${formErrors.name ? 'form-input-error' : ''}`}
                      placeholder="Apex Institute of Technology"
                      value={collegeForm.name}
                      onChange={(e) => {
                        setCollegeForm({ ...collegeForm, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                      }}
                    />
                    {formErrors.name && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.name}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Short Code *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${formErrors.code ? 'form-input-error' : ''}`}
                      placeholder="AIT-2026"
                      value={collegeForm.code}
                      onChange={(e) => {
                        setCollegeForm({ ...collegeForm, code: e.target.value.toUpperCase() });
                        if (formErrors.code) setFormErrors({ ...formErrors, code: null });
                      }}
                    />
                    {formErrors.code && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>City &amp; Location *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${formErrors.location ? 'form-input-error' : ''}`}
                      placeholder="Mumbai Campus"
                      value={collegeForm.location}
                      onChange={(e) => {
                        setCollegeForm({ ...collegeForm, location: e.target.value });
                        if (formErrors.location) setFormErrors({ ...formErrors, location: null });
                      }}
                    />
                    {formErrors.location && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.location}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Email Domain *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${formErrors.domain ? 'form-input-error' : ''}`}
                      placeholder="pvppcoe.ac.in"
                      value={collegeForm.domain}
                      onChange={(e) => {
                        setCollegeForm({ ...collegeForm, domain: e.target.value });
                        if (formErrors.domain) setFormErrors({ ...formErrors, domain: null });
                      }}
                    />
                    {formErrors.domain && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.domain}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Administrator Name *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${formErrors.adminName ? 'form-input-error' : ''}`}
                      placeholder="Dr. Verma"
                      value={collegeForm.adminName}
                      onChange={(e) => {
                        setCollegeForm({ ...collegeForm, adminName: e.target.value });
                        if (formErrors.adminName) setFormErrors({ ...formErrors, adminName: null });
                      }}
                    />
                    {formErrors.adminName && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.adminName}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email *</label>
                    <input
                      type="email"
                      required
                      className={`form-input-admin ${formErrors.adminEmail ? 'form-input-error' : ''}`}
                      placeholder="admin@institution.edu"
                      value={collegeForm.adminEmail}
                      onChange={(e) => {
                        const email = e.target.value;
                        let autoDomain = collegeForm.domain;
                        if (!autoDomain && email.includes('@')) {
                          const parts = email.split('@');
                          if (parts[1] && parts[1].includes('.')) {
                            autoDomain = parts[1].toLowerCase();
                          }
                        }
                        setCollegeForm({ ...collegeForm, adminEmail: email, domain: autoDomain });
                        if (formErrors.adminEmail) setFormErrors({ ...formErrors, adminEmail: null });
                      }}
                    />
                    {formErrors.adminEmail && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {formErrors.adminEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-modal-submit">
                  Register Institution
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit College Modal */}
      {editCollege && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditCollege(null); }}>
          <div className="modal-dialog college-modal-560">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Edit Institution</h2>
                  <p className="modal-subtitle">Update college profile and administrator contact details</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEditCollege(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const validation = validateEditCollegeForm({
                name: editCollege.name,
                code: editCollege.code,
                location: editCollege.location,
                domain: editCollege.domain,
                adminName: editCollege.adminName,
                adminEmail: editCollege.adminEmail,
              });
              if (!validation.isValid) {
                setEditErrors(validation.errors);
                return;
              }
              setEditErrors({});
              setIsSavingEdit(true);
              try {
                const updated = await collegeAPI.updateCollege(editCollege.id, {
                  name: (editCollege.name || '').trim(),
                  code: (editCollege.code || '').trim().toUpperCase(),
                  location: (editCollege.location || '').trim(),
                  city: (editCollege.location || '').trim(),
                  status: editCollege.status || 'Active',
                  contactEmail: (editCollege.adminEmail || '').trim().toLowerCase() || null,
                  adminEmail: (editCollege.adminEmail || '').trim().toLowerCase() || null,
                  adminName: (editCollege.adminName || '').trim() || null,
                  domain: (editCollege.domain || '').trim().toLowerCase() || null,
                });
                if (updated) {
                  setColleges(prev => prev.map(c => c.id === editCollege.id ? {
                    ...c,
                    ...updated,
                    adminEmail: updated.adminEmail || updated.contact_email || editCollege.adminEmail,
                    adminName: updated.adminName || updated.admin_name || editCollege.adminName,
                    domain: updated.domain || editCollege.domain,
                  } : c));
                }
                setEditCollege(null);
              } catch (err) {
                console.error("Failed to update college:", err);
                setEditErrors(prev => ({ ...prev, _general: err.message || "Failed to update college details." }));
              } finally {
                setIsSavingEdit(false);
              }
            }} noValidate>
              <div className="modal-body">
                {editErrors._general && (
                  <div className="modal-form-alert-banner">
                    <AlertCircle size={16} />
                    <span>{editErrors._general}</span>
                  </div>
                )}
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Name *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${editErrors.name ? 'form-input-error' : ''}`}
                      value={editCollege.name || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, name: e.target.value });
                        if (editErrors.name) setEditErrors({ ...editErrors, name: null });
                      }}
                    />
                    {editErrors.name && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.name}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Short Code *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${editErrors.code ? 'form-input-error' : ''}`}
                      value={editCollege.code || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, code: e.target.value.toUpperCase() });
                        if (editErrors.code) setEditErrors({ ...editErrors, code: null });
                      }}
                    />
                    {editErrors.code && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>City &amp; Location *</label>
                    <input
                      type="text"
                      required
                      className={`form-input-admin ${editErrors.location ? 'form-input-error' : ''}`}
                      value={editCollege.location || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, location: e.target.value });
                        if (editErrors.location) setEditErrors({ ...editErrors, location: null });
                      }}
                    />
                    {editErrors.location && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.location}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Email Domain</label>
                    <input
                      type="text"
                      className={`form-input-admin ${editErrors.domain ? 'form-input-error' : ''}`}
                      placeholder="e.g. pvppcoe.ac.in"
                      value={editCollege.domain || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, domain: e.target.value });
                        if (editErrors.domain) setEditErrors({ ...editErrors, domain: null });
                      }}
                    />
                    {editErrors.domain && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.domain}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Administrator Name</label>
                    <input
                      type="text"
                      className={`form-input-admin ${editErrors.adminName ? 'form-input-error' : ''}`}
                      placeholder="e.g. Dr. Verma"
                      value={editCollege.adminName || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, adminName: e.target.value });
                        if (editErrors.adminName) setEditErrors({ ...editErrors, adminName: null });
                      }}
                    />
                    {editErrors.adminName && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.adminName}
                      </span>
                    )}
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      className={`form-input-admin ${editErrors.adminEmail ? 'form-input-error' : ''}`}
                      placeholder="e.g. admin@pvppcoe.ac.in"
                      value={editCollege.adminEmail || ''}
                      onChange={(e) => {
                        setEditCollege({ ...editCollege, adminEmail: e.target.value });
                        if (editErrors.adminEmail) setEditErrors({ ...editErrors, adminEmail: null });
                      }}
                    />
                    {editErrors.adminEmail && (
                      <span className="form-field-error-msg">
                        <AlertCircle size={12} />
                        {editErrors.adminEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Status</label>
                  <CollegeSelect
                    value={editCollege.status || 'Active'}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                    onChange={(val) => setEditCollege({ ...editCollege, status: val })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete College Confirmation Modal */}
      {deleteCollege && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteCollege(null); }}>
          <div className="modal-dialog college-modal-440">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap college-delete-modal-icon">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Remove Institution</h2>
                  <p className="modal-subtitle">Confirm college deletion</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteCollege(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="colleges-delete-confirm-text">
                Are you sure you want to remove <strong className="colleges-delete-confirm-name">{deleteCollege.name}</strong>? All associated departments, batches, and student records will be archived.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteCollege(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit btn-modal-danger"
                onClick={() => {
                  handleDeleteCollege(deleteCollege.id);
                  setDeleteCollege(null);
                }}
              >
                <Trash2 size={15} style={{ marginRight: '6px' }} />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View College Details Modal */}
      {viewCollegeModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewCollegeModal(null); }}>
          <div className="modal-dialog college-modal-560">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{viewCollegeModal.name}</h2>
                  <p className="modal-subtitle">Institutional Details &amp; Profile Record</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewCollegeModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Short Code</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{viewCollegeModal.code || '—'}</p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Operational Status</label>
                  <div style={{ marginTop: '2px' }}><StatusBadge status={viewCollegeModal.status || 'Active'} /></div>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Location &amp; Campus</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#334155', fontSize: '13.5px' }}>{viewCollegeModal.location || viewCollegeModal.city || '—'}</p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Email Domain</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#4f46e5', fontSize: '13.5px' }}>{viewCollegeModal.domain ? `@${viewCollegeModal.domain.replace(/^@/, '')}` : '—'}</p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>College Administrator</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>{viewCollegeModal.adminName || viewCollegeModal.admin_name || '—'}</p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Admin Email Address</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#2563eb', fontSize: '13.5px' }}>{viewCollegeModal.adminEmail || viewCollegeModal.contact_email || '—'}</p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Departments Count</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                    {departments.filter(d => String(d.collegeId || d.college_id) === String(viewCollegeModal.id)).length || viewCollegeModal.departmentsCount || viewCollegeModal.department_count || 0}
                  </p>
                </div>
                <div className="form-group-admin">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>Active Students</label>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                    {viewCollegeModal.studentsCount || viewCollegeModal.student_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
