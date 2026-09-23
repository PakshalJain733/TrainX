import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Mail,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  BookOpen,
  Key,
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Trash2
} from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';
import { apiFetch } from '../../../utils/api';
import { collegeAPI, departmentAPI } from '../../../services/api';
import "../Styles/SA_ManageUsers.css";

/* ── Inline dropdown for ManageUsers (CSS: ManageUsers.css .mu-select-*) ── */
function MuSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, direction, disabled }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className={`mu-select-wrap${isOpen ? ' mu-select-wrap--open' : ''}${disabled ? ' opacity-60 pointer-events-none' : ''}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={`mu-select-trigger${isOpen ? ' mu-select-trigger--open' : ''}`}
      >
        {Icon && <Icon className="mu-select-icon" />}
        <span className="mu-select-text">
          {selected ? selected.label : <span className="mu-select-placeholder">{placeholder}</span>}
        </span>
        <ChevronDown className={`mu-select-arrow${isOpen ? ' mu-select-arrow--rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className={`mu-select-dropdown${direction === 'up' ? ' mu-select-dropdown--up' : ''}`}>
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`mu-select-option${isSel ? ' mu-select-option--selected' : ''}`}
              >
                <span className="mu-select-option-label">{opt.label}</span>
                {isSel && <Check className="mu-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Inline StatusBadge Helper ──────────────────────── */
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

// Mock Data for Coordinators
const mockCoordinators = [];

// Mock Data for Mentors & Trainers
const mockMentors = [];

// Mock Data for Students Risk
const mockStudentsRisk = [];

function RiskBadge({ risk }) {
  const color =
    risk === "Low Risk" ? { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" } :
      risk === "Moderate Risk" ? { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" } :
        { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" };
  return (
    <span style={{
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
      borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700,
      display: "inline-block", whiteSpace: "nowrap"
    }}>
      {risk}
    </span>
  );
}

export default function ManageUsers() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("admins"); // 'admins' | 'coordinators' | 'mentors' | 'students'
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Data States
  const [adminRequests, setAdminRequests] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [collegesList, setCollegesList] = useState([]);

  useEffect(() => {
    collegeAPI.getColleges()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCollegesList(data);
          setCodeCollege(data[0].name);
        }
      })
      .catch(err => console.error("Error loading colleges for ManageUsers modal:", err));
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/admin/users');
        if (res && Array.isArray(res.users)) {
          const dbAdmins = res.users.filter(u => u.role === 'college_admin');
          const dbCoords = res.users.filter(u => u.role === 'coordinator');
          const dbMentors = res.users.filter(u => u.role === 'mentor');
          const dbStudents = res.users.filter(u => u.role === 'student');

          setAdminRequests(dbAdmins.map(u => ({
            id: u.id,
            name: u.name || 'College Admin',
            adminName: u.name || 'College Admin',
            email: u.email,
            phone: u.mobile_number || u.phone || '',
            college: u.college_name || u.college || '',
            status: u.is_active ? 'Active' : 'Pending'
          })));

          setCoordinators(dbCoords.map(u => ({
            id: u.id,
            name: u.name || 'Coordinator',
            email: u.email,
            phone: u.mobile_number || u.phone || '',
            college: u.college_name || u.college || '',
            department: u.department_name || u.department || '',
            status: u.is_active ? 'Active' : 'Inactive'
          })));

          setMentors(dbMentors.map(u => ({
            id: u.id,
            name: u.name || 'Mentor',
            email: u.email,
            phone: u.mobile_number || u.phone || '',
            college: u.college_name || u.college || '',
            track: u.target_track || 'Full Stack Web Engineering',
            studentsAssigned: 0,
            rating: 'N/A'
          })));

          setStudents(dbStudents.map(u => ({
            id: u.id,
            name: u.name || 'Student',
            rollNo: u.rollNo || `STD-${u.id}`,
            college: u.college_name || u.college || '',
            batch: u.batch || '',
            attendance: u.attendance || '0%',
            risk: u.risk || 'Low Risk',
            status: 'Active'
          })));
        }
      } catch (err) {
        console.warn("Error fetching users from database:", err);
      }
    };
    fetchUsers();
  }, []);


  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/super-admin/coordinators")) {
      setActiveTab("coordinators");
    } else if (path.includes("/super-admin/mentors")) {
      setActiveTab("mentors");
    } else if (path.includes("/super-admin/students")) {
      setActiveTab("students");
    } else if (path.includes("/super-admin/verification")) {
      setActiveTab("admins");
    }
  }, [location.pathname]);

  // Admin Verification handlers
  const handleVerifyAdmin = (id) => {
    setAdminRequests(adminRequests.map((r) => r.id === id ? { ...r, status: 'Verified' } : r));
  };

  const handleRejectAdmin = (id) => {
    setAdminRequests(adminRequests.filter((r) => r.id !== id));
  };

  // Filtering
  const filteredAdmins = adminRequests.filter(req =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoordinators = coordinators.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentors.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.track.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "admins", label: "Admin", icon: ShieldCheck, count: adminRequests.length },
    { id: "students", label: "Students", icon: Users, count: students.length },
    { id: "coordinators", label: "Coordinators", icon: UserCheck, count: coordinators.length },
    { id: "mentors", label: "Mentors", icon: GraduationCap, count: mentors.length },
  ];

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isGenerateCodeModalOpen, setIsGenerateCodeModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'students',
    collegeId: '',
    college: '',
    departmentId: '',
    department: '',
    phone: '',
    rollNo: '',
    year: 'FE',
    division: 'A',
  });
  const [collegeDepartments, setCollegeDepartments] = useState([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  const handleCollegeChange = async (colId) => {
    const selectedCol = collegesList.find((c) => String(c.id) === String(colId));
    setNewUserForm((prev) => ({
      ...prev,
      collegeId: colId,
      college: selectedCol ? selectedCol.name : '',
      departmentId: '',
      department: '',
    }));
    setCollegeDepartments([]);

    if (!colId) return;

    setIsLoadingDepts(true);
    try {
      const depts = await departmentAPI.getDepartments(colId);
      if (Array.isArray(depts)) {
        setCollegeDepartments(depts);
      }
    } catch (err) {
      console.error("Error fetching departments for college:", err);
    } finally {
      setIsLoadingDepts(false);
    }
  };

  // Generate Code Form State
  const [codeRole, setCodeRole] = useState('admins');
  const [codeCollege, setCodeCollege] = useState('PVPPCOE Mumbai');
  const [codeExpiry, setCodeExpiry] = useState('7 Days');
  const [codeMaxUses, setCodeMaxUses] = useState('1');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generatedCodesList, setGeneratedCodesList] = useState([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const loadSecureCodes = async () => {
    try {
      const res = await apiFetch('/secure-codes');
      if (res && Array.isArray(res.data)) {
        setGeneratedCodesList(res.data.map(c => ({
          id: c.id,
          code: c.code,
          role: c.role === 'college_admin' ? 'Admin' : c.role === 'coordinator' ? 'Coordinator' : c.role === 'mentor' ? 'Mentor' : c.role === 'company' ? 'Company' : c.role,
          college: c.college_name || 'All Colleges',
          maxUses: c.max_uses,
          usesCount: c.uses_count || 0,
          status: c.status,
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'
        })));
      }
    } catch (err) {
      console.warn("Failed to load secure codes from DB:", err);
    }
  };

  useEffect(() => {
    loadSecureCodes();
  }, []);

  const handleGenerateCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGeneratingCode) return;

    setIsGeneratingCode(true);

    const roleMapping = {
      admins: 'college_admin',
      coordinators: 'coordinator',
      mentors: 'mentor',
      students: 'student',
    };
    const targetRole = roleMapping[codeRole] || codeRole;

    const prefixMap = {
      admins: 'ADM',
      coordinators: 'CRD',
      mentors: 'MTR',
      students: 'STD',
    };
    const prefix = prefixMap[codeRole] || 'USR';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const colCode = codeCollege ? String(codeCollege).split(' ')[0].substring(0, 4).toUpperCase() : 'PVPP';
    const generatedFallback = `${prefix}-${randomHex}-${colCode}`;

    try {
      const res = await apiFetch('/secure-codes/generate', {
        method: 'POST',
        body: JSON.stringify({
          code: generatedFallback,
          role: targetRole,
          college_name: codeCollege,
          max_uses: parseInt(codeMaxUses, 10) || 1,
          expiry_option: codeExpiry,
          description: `Generated for ${codeCollege} - Max Uses: ${codeMaxUses === '0' ? 'Unlimited' : codeMaxUses} - Expiry: ${codeExpiry}`,
        }),
      });

      if (res && res.data && res.data.code) {
        setGeneratedCode(res.data.code);
      } else {
        setGeneratedCode(generatedFallback);
      }
      await loadSecureCodes();
    } catch (err) {
      console.error("Error generating secure code:", err);
      setGeneratedCode(generatedFallback);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDeleteCode = async (id) => {
    try {
      await apiFetch(`/secure-codes/${id}`, { method: 'DELETE' });
      await loadSecureCodes();
    } catch (err) {
      console.error("Error deleting secure code:", err);
    }
  };

  const handleCopyCode = (code, id = 'hero') => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const roleMapping = {
      admins: 'college_admin',
      coordinators: 'coordinator',
      mentors: 'mentor',
      students: 'student'
    };

    const targetRole = roleMapping[newUserForm.role] || 'student';
    const payload = {
      name: newUserForm.name,
      email: newUserForm.email,
      mobile_number: newUserForm.phone,
      role: targetRole,
      college_id: newUserForm.collegeId,
      college_name: newUserForm.college,
      department_id: newUserForm.departmentId,
      department: newUserForm.department,
      roll_number: newUserForm.rollNo,
      year: newUserForm.year,
      division: newUserForm.division
    };

    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("User created in local state:", err);
    }

    if (newUserForm.role === 'admins') {
      const newAdmin = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        college: newUserForm.college || 'College',
        designation: 'Institutional Admin',
        date: new Date().toISOString().split('T')[0],
        status: 'Verified',
      };
      setAdminRequests([newAdmin, ...adminRequests]);
    } else if (newUserForm.role === 'coordinators') {
      const newCoord = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '',
        college: newUserForm.college || 'College',
        department: newUserForm.department || 'Department',
        status: 'Active',
      };
      setCoordinators([newCoord, ...coordinators]);
    } else if (newUserForm.role === 'mentors') {
      const newMentor = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '',
        college: newUserForm.college || 'College',
        track: newUserForm.department ? `${newUserForm.department} Faculty` : 'Full Stack Web Engineering',
        studentsAssigned: 0,
        rating: '5.0/5',
      };
      setMentors([newMentor, ...mentors]);
    } else {
      const newStudent = {
        id: Date.now(),
        name: newUserForm.name,
        rollNo: newUserForm.rollNo || `STD-${Math.floor(100 + Math.random() * 900)}`,
        college: newUserForm.college || 'College',
        batch: `${newUserForm.department || 'Dept'} ${newUserForm.year || 'FE'} ${newUserForm.division || 'A'}`,
        attendance: '100%',
        risk: 'Low Risk',
        status: 'Active',
      };
      setStudents([newStudent, ...students]);
    }

    setIsAddUserModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      role: 'students',
      collegeId: '',
      college: '',
      departmentId: '',
      department: '',
      phone: '',
      rollNo: '',
      year: 'FE',
      division: 'A',
    });
    setCollegeDepartments([]);
  };


  return (
    <div className="manageusers-page-wrap">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <div className="manageusers-header-title">
            <Users className="manageusers-header-icon" />
            <span>Manage Users &amp; Registration Codes</span>
          </div>
          <p className="manageusers-header-subtitle">View system users, issue role-based registration invitation codes, and provision institutional users</p>
        </div>

        <div className="sa-header-actions">
          <button
            type="button"
            onClick={() => {
              setGeneratedCode(null);
              setIsGenerateCodeModalOpen(true);
            }}
            className="manageusers-btn-secondary"
          >
            <KeyRound size={16} />
            <span>Generate Code</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="sa-btn-primary"
          >
            <Users size={16} />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="manageusers-tabs-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`manageusers-tab-btn ${isActive ? 'manageusers-tab-btn--active' : ''}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className="manageusers-tab-badge">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="sa-search-card">
        <div className="sa-search-wrap mu-search-wrap-full">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* TAB CONTENT: HODs & College Admins */}
      {activeTab === "admins" && (
        <div className="manageusers-tab-content">
          <div className="manageusers-banner">
            <ShieldCheck className="manageusers-banner-icon" />
            <p className="manageusers-banner-text">
              College Admin register using pre-authorized secure invitation codes issued directly by the Super Admin.
            </p>
          </div>


          <div className="manageusers-table-card">
            {filteredAdmins.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Admin Accounts Found"
                description="College Admin register using secure invitation codes. No manual verification required."
              />
            ) : (
              <div className="manageusers-table-wrap">
                <table className="manageusers-table">
                  <thead>
                    <tr className="manageusers-thead-row">
                      <th className="manageusers-th">Applicant Name</th>
                      <th className="manageusers-th">Institution / College</th>
                      <th className="manageusers-th">Designation</th>
                      <th className="manageusers-th">Requested On</th>
                      <th className="manageusers-th">Status</th>
                      <th className="manageusers-th-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((req) => (
                      <tr key={req.id} className="manageusers-tr">
                        <td className="manageusers-td">
                          <div className="font-bold text-slate-900">{req.name}</div>
                          <div className="manageusers-contact-row mt-1">
                            <Mail size={14} className="manageusers-contact-icon" />
                            <span className="manageusers-contact-text">{req.email}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <div className="manageusers-contact-row manageusers-contact-row--bold">
                            <Building2 size={15} className="manageusers-contact-icon manageusers-contact-icon--indigo" />
                            <span>{req.college}</span>
                          </div>
                        </td>
                        <td className="manageusers-td font-medium text-slate-700">{req.designation}</td>
                        <td className="manageusers-td">
                          <div className="manageusers-contact-row">
                            <Calendar size={14} className="manageusers-contact-icon" />
                            <span className="manageusers-contact-text">{req.date}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="manageusers-td-right">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerifyAdmin(req.id)}
                                className="manageusers-btn-verify"
                              >
                                <CheckCircle2 size={15} />
                                <span>Verify Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAdmin(req.id)}
                                className="manageusers-btn-reject"
                              >
                                <XCircle size={15} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={14} /> Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Coordinators */}
      {activeTab === "coordinators" && (
        <div className="manageusers-table-card">
          <div className="manageusers-table-wrap">
            <table className="manageusers-table">
              <thead>
                <tr className="manageusers-thead-row">
                  <th className="manageusers-th">Coordinator Name</th>
                  <th className="manageusers-th">College</th>
                  <th className="manageusers-th">Department</th>
                  <th className="manageusers-th">Contact Details</th>
                  <th className="manageusers-th-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoordinators.map((c) => (
                  <tr key={c.id} className="manageusers-tr">
                    <td className="manageusers-td font-bold text-slate-900">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="manageusers-td text-slate-600 font-medium">{c.college}</td>
                    <td className="manageusers-td text-indigo-600 font-medium">{c.department}</td>
                    <td className="manageusers-td">
                      <div className="manageusers-contact-box">
                        <div className="manageusers-contact-row">
                          <Mail size={14} className="manageusers-contact-icon" />
                          <span className="manageusers-contact-text">{c.email}</span>
                        </div>
                        <div className="manageusers-contact-row">
                          <Phone size={14} className="manageusers-contact-icon" />
                          <span className="manageusers-contact-text">{c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="manageusers-td-right">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCoordinators.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium">
              No coordinators match your search.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Mentors */}
      {activeTab === "mentors" && (
        <div className="manageusers-table-card">
          <div className="manageusers-table-wrap">
            <table className="manageusers-table">
              <thead>
                <tr className="manageusers-thead-row">
                  <th className="manageusers-th">Mentor Name</th>
                  <th className="manageusers-th">Domain Track</th>
                  <th className="manageusers-th">College</th>
                  <th className="manageusers-th">Mentees Enrolled</th>
                  <th className="manageusers-th-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentors.map((m) => (
                  <tr key={m.id} className="manageusers-tr">
                    <td className="manageusers-td font-bold text-slate-900">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar manageusers-avatar--emerald">
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="manageusers-td text-indigo-600 font-medium">{m.track}</td>
                    <td className="manageusers-td text-slate-600 font-medium">{m.college}</td>
                    <td className="manageusers-td text-slate-700 font-bold">{m.studentsAssigned} Students</td>
                    <td className="manageusers-td-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        ★ {m.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMentors.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium">
              No mentors or trainers match your search.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Students Risk */}
      {activeTab === "students" && (
        <div className="manageusers-risk-card">
          <table className="manageusers-table">
            <thead>
              <tr className="manageusers-thead-row">
                <th className="manageusers-th">Student Name</th>
                <th className="manageusers-th">Roll No / Batch</th>
                <th className="manageusers-th">College</th>
                <th className="manageusers-th">Attendance</th>
                <th className="manageusers-th-right">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="manageusers-tr">
                  <td className="manageusers-td">
                    <div className="manageusers-user-flex">
                      <div className="manageusers-avatar">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="manageusers-name">{s.name}</span>
                    </div>
                  </td>
                  <td className="manageusers-td">
                    <div className="font-semibold text-slate-800">{s.rollNo}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.batch}</div>
                  </td>
                  <td className="manageusers-td font-medium text-slate-700">{s.college}</td>
                  <td className="manageusers-td font-bold text-emerald-600">{s.attendance}</td>
                  <td className="manageusers-td-right">
                    <RiskBadge risk={s.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600">No students found</p>
            </div>
          )}
        </div>
      )}

      {/* Generate Access Code Modal */}
      {isGenerateCodeModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsGenerateCodeModalOpen(false); }}>
          <form onSubmit={handleGenerateCode} className="modal-dialog modal-dialog-overflow-visible">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Key size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Generate Registration Code</h2>
                  <p className="modal-subtitle">Issue single-use or multi-use invitation tokens for selected roles</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsGenerateCodeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body modal-body-overflow-visible">
              <div className="form-group-admin">
                <label>Assign Target Role *</label>
                <MuSelect
                  value={codeRole}
                  wrapperClass="mu-select"
                  options={[
                    { value: "mentors", label: "Mentor" },
                    { value: "coordinators", label: "Coordinator" },
                    { value: "admins", label: "Admin" },
                  ]}
                  onChange={(val) => setCodeRole(val)}
                />
              </div>

              <div className="form-group-admin">
                <label>Target College *</label>
                <MuSelect
                  value={codeCollege}
                  wrapperClass="mu-select"
                  options={collegesList.length > 0
                    ? collegesList.map(c => ({ value: c.name, label: c.name }))
                    : [{ value: "No colleges registered", label: "No colleges registered" }]
                  }
                  onChange={(val) => setCodeCollege(val)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group-admin">
                  <label>Usage Limit (Max Uses) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    className="form-input-admin"
                    placeholder="1 (Single-use token)"
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                  />
                </div>

                <div className="form-group-admin">
                  <label>Expiry Time Duration *</label>
                  <MuSelect
                    value={codeExpiry}
                    direction="up"
                    wrapperClass="mu-select"
                    options={[
                      { value: "24 Hours", label: "24 Hours" },
                      { value: "3 Days", label: "3 Days" },
                      { value: "7 Days", label: "7 Days" },
                      { value: "30 Days", label: "30 Days" },
                      { value: "90 Days", label: "90 Days" },
                      { value: "Never", label: "Never" },
                    ]}
                    onChange={(val) => setCodeExpiry(val)}
                  />
                </div>
              </div>

              {/* Display Newly Generated Code Hero Banner */}
              {generatedCode && (
                <div className="manageusers-token-hero">
                  <div>
                    <div className="manageusers-token-label">
                      <Sparkles size={13} className="mu-sparkles-icon" />
                      <span className="manageusers-token-tag">Newly Issued Token</span>
                    </div>
                    <div className="manageusers-token-code">{generatedCode}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(generatedCode, 'hero')}
                    className={`manageusers-hero-copy-btn ${copiedCodeId === 'hero' ? 'manageusers-hero-copy-btn--copied' : ''}`}
                  >
                    {copiedCodeId === 'hero' ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedCodeId === 'hero' ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                </div>
              )}

              {/* Recent Active Codes List */}
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Recently Issued Tokens</span>
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{generatedCodesList.length} Active</span>
                </div>
                <div className="manageusers-token-list">
                  {generatedCodesList.map((c) => (
                    <div key={c.id} className="manageusers-token-item">
                      <div className="manageusers-item-left">
                        <span className="manageusers-code-text">{c.code}</span>
                        <span className="manageusers-role-tag">{c.role}</span>
                        <span className="manageusers-uses-tag">
                          Uses: {c.usesCount || 0}/{c.maxUses === 0 ? '∞' : (c.maxUses || 1)}
                        </span>
                      </div>
                      <div className="manageusers-item-actions">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code, c.id)}
                          className={`manageusers-item-copy-btn ${copiedCodeId === c.id ? 'manageusers-item-copy-btn--copied' : ''}`}
                        >
                          {copiedCodeId === c.id ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedCodeId === c.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCode(c.id)}
                          title="Delete / Revoke Code"
                          className="manageusers-item-delete-btn"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsGenerateCodeModalOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="btn-modal-submit inline-flex items-center gap-1.5"
              >
                <Sparkles size={16} />
                <span>{isGeneratingCode ? 'Generating...' : 'Generate Code'}</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Create New User Modal */}
      {isAddUserModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddUserModalOpen(false); }}>
          <div className="modal-dialog sa-create-user-modal">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create New User</h2>
                  <p className="modal-subtitle">Provision account credentials and access privileges.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body">
                {/* Row 1: College Selection & Role Assignment (Side by Side) */}
                <div className="form-row-2 sa-form-row-2">
                  <div className="form-group-admin">
                    <label>Select College Institution *</label>
                    <MuSelect
                      value={newUserForm.collegeId}
                      placeholder="Select College Institution"
                      wrapperClass="mu-select"
                      options={collegesList.map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.code || ''})`
                      }))}
                      onChange={(val) => handleCollegeChange(val)}
                    />
                  </div>

                  <div className="form-group-admin">
                    <label>Assign Role *</label>
                    <MuSelect
                      value={newUserForm.role}
                      wrapperClass="mu-select"
                      options={[
                        { value: "students", label: "Student" },
                        { value: "mentors", label: "Mentor" },
                        { value: "coordinators", label: "Coordinator" },
                        { value: "admins", label: "College Administrator (Admin)" },
                      ]}
                      onChange={(val) => setNewUserForm({ ...newUserForm, role: val })}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="form-group-admin sa-form-group-full">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    placeholder="e.g. Priya Sharma"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  />
                </div>

                {/* Email & Mobile Number (Mobile Number included for non-students) */}
                {newUserForm.role === 'students' ? (
                  <div className="form-group-admin sa-form-group-full">
                    <label>College Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="user@pvppcoe.ac.in"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="form-row-2 sa-form-row-2">
                    <div className="form-group-admin">
                      <label>College Email *</label>
                      <input
                        type="email"
                        required
                        className="form-input-admin"
                        placeholder="user@pvppcoe.ac.in"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        className="form-input-admin"
                        placeholder="9876543210"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Student specific fields */}
                {newUserForm.role === 'students' && (
                  <>
                    <div className="form-row-2 sa-form-row-2">
                      <div className="form-group-admin">
                        <label>College / Roll ID</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. VU21CS042"
                          value={newUserForm.rollNo || ''}
                          onChange={(e) => setNewUserForm({ ...newUserForm, rollNo: e.target.value })}
                        />
                      </div>

                      <div className="form-group-admin">
                        <label>Department *</label>
                        <MuSelect
                          value={newUserForm.departmentId}
                          direction="up"
                          placeholder={
                            !newUserForm.collegeId
                              ? "Select College First"
                              : (isLoadingDepts ? "Loading Departments..." : (collegeDepartments.length === 0 ? "No Departments Found" : "Select Department"))
                          }
                          wrapperClass="mu-select"
                          disabled={!newUserForm.collegeId || collegeDepartments.length === 0 || isLoadingDepts}
                          options={collegeDepartments.map((d) => ({
                            value: d.id,
                            label: `${d.name} (${d.code || ''})`
                          }))}
                          onChange={(val) => {
                            const selectedDep = collegeDepartments.find((d) => String(d.id) === String(val));
                            setNewUserForm((prev) => ({
                              ...prev,
                              departmentId: val,
                              department: selectedDep ? selectedDep.name : ''
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-row-2 sa-form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <MuSelect
                          value={newUserForm.year || 'FE'}
                          direction="up"
                          wrapperClass="mu-select"
                          options={[
                            { value: "FE", label: "FE" },
                            { value: "SE", label: "SE" },
                            { value: "TE", label: "TE" },
                            { value: "BE", label: "BE" },
                          ]}
                          onChange={(val) => setNewUserForm({ ...newUserForm, year: val })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Division</label>
                        <MuSelect
                          value={newUserForm.division || 'A'}
                          direction="up"
                          wrapperClass="mu-select"
                          options={[
                            { value: "A", label: "Division A" },
                            { value: "B", label: "Division B" },
                            { value: "C", label: "Division C" },
                          ]}
                          onChange={(val) => setNewUserForm({ ...newUserForm, division: val })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Coordinator Department Selection (Department removed for Mentors) */}
                {newUserForm.role === 'coordinators' && (
                  <div className="form-group-admin sa-form-group-full">
                    <label>Department *</label>
                    <MuSelect
                      value={newUserForm.departmentId}
                      direction="up"
                      placeholder={
                        !newUserForm.collegeId
                          ? "Select College First"
                          : (isLoadingDepts ? "Loading Departments..." : (collegeDepartments.length === 0 ? "No Departments Found" : "Select Department"))
                      }
                      wrapperClass="mu-select"
                      disabled={!newUserForm.collegeId || collegeDepartments.length === 0 || isLoadingDepts}
                      options={collegeDepartments.map((d) => ({
                        value: d.id,
                        label: `${d.name} (${d.code || ''})`
                      }))}
                      onChange={(val) => {
                        const selectedDep = collegeDepartments.find((d) => String(d.id) === String(val));
                        setNewUserForm((prev) => ({
                          ...prev,
                          departmentId: val,
                          department: selectedDep ? selectedDep.name : ''
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAddUserModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Create User
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
