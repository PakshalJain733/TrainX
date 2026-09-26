import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import { collegeAPI, departmentAPI } from '../../../services/api';
import { EVENTS } from '../../../utils/sharedStore';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Mail,
  Users,
  X,
  ArrowLeft,
  GraduationCap,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/SA_Colleges.css";

/* ── Inline dropdown for Colleges ── */
function CollegeSelect(props) {
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
    name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 0, studentsCount: 0,
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
      (c.adminName && c.adminName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ||
      c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const filteredDepts = departments.filter((d) =>
    (!collegeId || String(d.collegeId) === String(collegeId)) &&
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!collegeForm.name || !collegeForm.code || !collegeForm.location) return;
    try {
      const created = await collegeAPI.createCollege({
        name: collegeForm.name,
        code: collegeForm.code,
        location: collegeForm.location,
        city: collegeForm.location,
        contactEmail: collegeForm.adminEmail,
        adminName: collegeForm.adminName,
        adminEmail: collegeForm.adminEmail,
      });
      if (created) {
        setColleges([created, ...colleges.filter(c => c.id !== created.id)]);
      } else {
        const data = await collegeAPI.getColleges();
        setColleges(Array.isArray(data) ? data : colleges);
      }
      window.dispatchEvent(new CustomEvent(EVENTS.COLLEGE_UPDATED));
    } catch (err) {
      console.error("Failed to save college to backend:", err);
      // Re-fetch from API to be consistent
      collegeAPI.getColleges().then(data => setColleges(Array.isArray(data) ? data : colleges)).catch(() => {});
    }
    setIsAddCollegeModalOpen(false);
    setCollegeForm({ name: '', code: '', location: '', adminName: '', adminEmail: '', departmentsCount: 0, studentsCount: 0 });
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;

    const payload = {
      name: deptForm.name,
      code: deptForm.code,
      collegeId: collegeId || 1,
      college_id: collegeId || 1,
      hodName: deptForm.hodName || "Dr. Department HOD",
      hodEmail: deptForm.hodEmail || `hod.${deptForm.code.toLowerCase()}@college.edu.in`,
    };

    try {
      const created = await departmentAPI.createDepartment(payload);
      if (created) {
        setDepartments([created, ...departments.filter(d => d.id !== created.id)]);
      } else {
        const fresh = await departmentAPI.getDepartments(collegeId);
        setDepartments(Array.isArray(fresh) ? fresh : departments);
      }
    } catch (err) {
      console.error("Failed to save department to database:", err);
      departmentAPI.getDepartments(collegeId).then(data => setDepartments(Array.isArray(data) ? data : departments)).catch(() => {});
    }

    setIsAddDeptModalOpen(false);
    setDeptForm({ name: '', code: '', hodName: '', hodEmail: '' });
  };

  const handleDeleteCollege = async (id) => {
    try {
      await collegeAPI.deleteCollege(id);
    } catch (err) {
      console.error("Failed to delete college from API:", err);
    }
    setColleges(colleges.filter((c) => c.id !== id));
  };

  // If collegeId URL param is present, render College Departments view
  if (collegeId) {
    return (
      <div className="space-y-6 text-slate-800">
        <div className="sa-page-header">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate('/super-admin/colleges')}
                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                title="Back to Colleges Directory"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>{selectedCollege ? selectedCollege.name : "College Departments"}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 ml-9">
              Managing departments inside {selectedCollege ? selectedCollege.name : "selected college"}
            </p>
          </div>

          <button className="sa-btn-primary ml-auto" onClick={() => setIsAddDeptModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDepts.map((dept) => (
            <div key={dept.id} className="sa-widget-card hover:border-indigo-300 transition college-dept-widget-card">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100">
                    {dept.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                </div>
                <ActionDropdown
                  onView={() => alert(`View ${dept.name}`)}
                  onEdit={() => alert(`Edit ${dept.name}`)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Students</p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{dept.activeStudents || 120}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{dept.batchesCount || 4}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Department Modal */}
        {isAddDeptModalOpen && createPortal(
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddDeptModalOpen(false); }}>
            <div className="modal-dialog college-modal-540">
              <div className="modal-header">
                <div className="modal-header-left">
                  <div className="modal-header-icon-wrap modal-header-icon--indigo">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title">Add New Department</h2>
                    <p className="modal-subtitle">Create an academic department for this college.</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setIsAddDeptModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddDepartment}>
                <div className="modal-body">
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
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsAddDeptModalOpen(false)}>
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

  // Primary View: Colleges Directory
  return (
    <div className="colleges-page-wrap">
      {/* Header & Main Action */}
      <div className="sa-page-header">
        <div>
          <div className="colleges-header-title-wrap">
            <Building2 className="colleges-header-icon" />
            <span className="colleges-header-title">Colleges Directory</span>
          </div>
          <p className="colleges-header-subtitle">Manage all registered institutions and partner universities</p>
        </div>
        <button onClick={() => setIsAddCollegeModalOpen(true)} className="sa-btn-primary">
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
                        onView={() => navigate(`/super-admin/colleges/${college.id}`)}
                        onEdit={() => setEditCollege(college)}
                        onDelete={() => setDeleteCollege(college)}
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

            <form onSubmit={handleAddCollege}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="Vasantdada Patil Pratishthan"
                      value={collegeForm.name}
                      onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Short Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="PVPPCOE"
                      value={collegeForm.code}
                      onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>City &amp; Location *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="Sion, Mumbai"
                    value={collegeForm.location}
                    onChange={(e) => setCollegeForm({ ...collegeForm, location: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Administrator Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      placeholder="Dr. Verma"
                      value={collegeForm.adminName}
                      onChange={(e) => setCollegeForm({ ...collegeForm, adminName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      placeholder="admin@pvppcoe.ac.in"
                      value={collegeForm.adminEmail}
                      onChange={(e) => setCollegeForm({ ...collegeForm, adminEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddCollegeModalOpen(false)}>
                  Cancel
                </button>
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

            <form onSubmit={(e) => {
              e.preventDefault();
              setColleges(colleges.map(c => c.id === editCollege.id ? editCollege : c));
              setEditCollege(null);
            }}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editCollege.name}
                      onChange={(e) => setEditCollege({ ...editCollege, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Short Code *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      value={editCollege.code || ''}
                      onChange={(e) => setEditCollege({ ...editCollege, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>City &amp; Location *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    value={editCollege.location || ''}
                    onChange={(e) => setEditCollege({ ...editCollege, location: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Administrator Name</label>
                    <input
                      type="text"
                      className="form-input-admin"
                      value={editCollege.adminName || ''}
                      onChange={(e) => setEditCollege({ ...editCollege, adminName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      value={editCollege.adminEmail || ''}
                      onChange={(e) => setEditCollege({ ...editCollege, adminEmail: e.target.value })}
                    />
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
                <button type="button" className="btn-modal-cancel" onClick={() => setEditCollege(null)}>
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
              <p className="text-sm text-slate-600 m-0">
                Are you sure you want to remove <strong className="text-slate-900">{deleteCollege.name}</strong>? All associated departments, batches, and student records will be archived.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteCollege(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="manageusers-btn-reject college-btn-delete-confirm"
                onClick={() => {
                  handleDeleteCollege(deleteCollege.id);
                  setDeleteCollege(null);
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
