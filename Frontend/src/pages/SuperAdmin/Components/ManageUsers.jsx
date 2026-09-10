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
  Copy,
  Check,
  X,
  Sparkles,
  Trash2
} from 'lucide-react';
import StatusBadge from '../../../components/SuperAdmin/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import { apiFetch } from '../../../utils/api';
import { initialAdminVerifications } from '../../../data/superAdminMockData';
import '../Styles/SuperAdmin.css';
import '../../Admin/Styles/AdminUsers.css';
import '../Styles/ManageUsers.css';

// Mock Data for Coordinators
const mockCoordinators = [
  { id: 1, name: "Prof. Rajesh Sharma", email: "r.sharma@pvppcoe.ac.in", phone: "+91 98765 43210", college: "PVPPCOE Mumbai", department: "Computer Engineering", status: "Active" },
  { id: 2, name: "Dr. Ananya Deshmukh", email: "a.deshmukh@apex.edu", phone: "+91 98765 43211", college: "Apex Institute of Technology", department: "Information Technology", status: "Active" },
  { id: 3, name: "Prof. Suresh Kulkarni", email: "s.kulkarni@meridian.edu", phone: "+91 98765 43212", college: "Meridian College", department: "AI & Data Science", status: "Active" },
  { id: 4, name: "Dr. Meera Patel", email: "m.patel@vanguard.edu", phone: "+91 98765 43213", college: "Vanguard Institute", department: "Electronics Engineering", status: "Active" }
];

// Mock Data for Mentors & Trainers
const mockMentors = [
  { id: 1, name: "Ms. R. Kulkarni", email: "r.kulkarni@pvppcoe.ac.in", phone: "+91 98765 11111", college: "PVPPCOE Mumbai", track: "Python Backend Development", studentsAssigned: 45, rating: "4.9/5" },
  { id: 2, name: "Prof. Vikram Joshi", email: "v.joshi@apex.edu", phone: "+91 98765 22222", college: "Apex Institute", track: "Full Stack Web Engineering", studentsAssigned: 50, rating: "4.8/5" },
  { id: 3, name: "Dr. S. Nair", email: "s.nair@meridian.edu", phone: "+91 98765 33333", college: "Meridian College", track: "Data Science & Machine Learning", studentsAssigned: 40, rating: "4.9/5" },
  { id: 4, name: "Er. Amit Shah", email: "a.shah@vanguard.edu", phone: "+91 98765 44444", college: "Vanguard Institute", track: "Cloud & DevOps Architecture", studentsAssigned: 38, rating: "4.7/5" }
];

// Mock Data for Students Risk
const mockStudentsRisk = [
  { id: 1, name: "Aarav Sharma", rollNo: "CSE-2026-001", college: "PVPPCOE Mumbai", batch: "CSE 2026 Alpha", attendance: "98%", risk: "Low Risk", status: "Active" },
  { id: 2, name: "Tanvi Deshmukh", rollNo: "IT-2026-012", college: "Apex Institute", batch: "IT 2026 Beta", attendance: "62%", risk: "High Risk", status: "Defaulter" },
  { id: 3, name: "Karan Mehta", rollNo: "ECS-2026-044", college: "PVPPCOE Mumbai", batch: "ECS 2026 Alpha", attendance: "88%", risk: "Low Risk", status: "Active" },
  { id: 4, name: "Rohan Kulkarni", rollNo: "AI-2026-033", college: "Meridian College", batch: "AI-DS 2026", attendance: "71%", risk: "Moderate Risk", status: "Needs Monitoring" },
];

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
  const [adminRequests, setAdminRequests] = useState(initialAdminVerifications);
  const [coordinators, setCoordinators] = useState(mockCoordinators);
  const [mentors, setMentors] = useState(mockMentors);
  const [students, setStudents] = useState(mockStudentsRisk);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/admin/users');
        if (res && Array.isArray(res.users)) {
          const dbCoords = res.users.filter(u => u.role === 'coordinator');
          const dbMentors = res.users.filter(u => u.role === 'mentor');
          const dbStudents = res.users.filter(u => u.role === 'student');

          if (dbCoords.length > 0) {
            setCoordinators(dbCoords.map(u => ({
              id: u.id,
              name: u.name || 'Coordinator',
              email: u.email,
              phone: u.mobile_number || u.phone || '+91 98765 00000',
              college: u.college_name || u.college || 'PVPPCOE Mumbai',
              department: u.department_name || u.department || 'Computer Engineering',
              status: u.is_active ? 'Active' : 'Inactive'
            })));
          }

          if (dbMentors.length > 0) {
            setMentors(dbMentors.map(u => ({
              id: u.id,
              name: u.name || 'Mentor',
              email: u.email,
              phone: u.mobile_number || u.phone || '+91 98765 00000',
              college: u.college_name || u.college || 'PVPPCOE Mumbai',
              track: u.target_track || 'Full Stack Web Engineering',
              studentsAssigned: 35,
              rating: '4.9/5'
            })));
          }

          if (dbStudents.length > 0) {
            setStudents(dbStudents.map(u => ({
              id: u.id,
              name: u.name || 'Student',
              rollNo: u.rollNo || `STD-${u.id}`,
              college: u.college_name || u.college || 'PVPPCOE Mumbai',
              batch: u.batch || 'COMPS 2026',
              attendance: u.attendance || '92%',
              risk: u.risk || 'Low Risk',
              status: 'Active'
            })));
          }
        }
      } catch (err) {
        console.warn("Using default users dataset:", err);
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
    { id: "admins", label: "Admin Verification", icon: ShieldCheck, count: adminRequests.length },
    { id: "coordinators", label: "Coordinators", icon: UserCheck, count: coordinators.length },
    { id: "mentors", label: "Mentors & Trainers", icon: GraduationCap, count: mentors.length },
    { id: "students", label: "Students Risk", icon: Users, count: students.length },
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
    college: 'PVPPCOE Mumbai',
    department: 'COMPS',
    phone: '',
    rollNo: '',
    year: 'FE',
    division: 'A',
  });

  // Generate Code Form State
  const [codeRole, setCodeRole] = useState('admins');
  const [codeCollege, setCodeCollege] = useState('PVPPCOE Mumbai');
  const [codeExpiry, setCodeExpiry] = useState('7 Days');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generatedCodesList, setGeneratedCodesList] = useState([
    { id: 1, code: 'ADM-9X82-PVPP', role: 'Admin', college: 'PVPPCOE Mumbai', expiry: '7 Days', date: '2026-09-09' },
    { id: 2, code: 'CRD-4K11-APEX', role: 'Coordinator', college: 'Apex Institute', expiry: '24 Hours', date: '2026-09-09' },
  ]);

  const handleGenerateCode = (e) => {
    e.preventDefault();
    const prefixMap = {
      admins: 'ADM',
      coordinators: 'CRD',
      mentors: 'MTR',
      students: 'STD',
    };
    const prefix = prefixMap[codeRole] || 'USR';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const colCode = codeCollege.split(' ')[0].substring(0, 4).toUpperCase();
    const newCode = `${prefix}-${randomHex}-${colCode}`;
    setGeneratedCode(newCode);

    const roleMap = {
      admins: 'Admin',
      coordinators: 'Coordinator',
      mentors: 'Mentor',
      students: 'Student'
    };
    const roleLabel = roleMap[codeRole] || 'User';
    setGeneratedCodesList([
      { id: Date.now(), code: newCode, role: roleLabel, college: codeCollege, expiry: codeExpiry, date: 'Just now' },
      ...generatedCodesList,
    ]);
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

    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserForm.name,
          email: newUserForm.email,
          mobile_number: newUserForm.phone,
          role: roleMapping[newUserForm.role] || 'student',
        })
      });
    } catch (err) {
      console.warn("User created in local state:", err);
    }

    if (newUserForm.role === 'admins') {
      const newAdmin = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        college: newUserForm.college || 'PVPPCOE Mumbai',
        designation: 'Institutional Admin',
        date: '2026-09-09',
        status: 'Verified',
      };
      setAdminRequests([newAdmin, ...adminRequests]);
    } else if (newUserForm.role === 'coordinators') {
      const newCoord = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '+91 98765 00000',
        college: newUserForm.college || 'PVPPCOE Mumbai',
        department: newUserForm.department || 'Computer Engineering',
        status: 'Active',
      };
      setCoordinators([newCoord, ...coordinators]);
    } else if (newUserForm.role === 'mentors') {
      const newMentor = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '+91 98765 00000',
        college: newUserForm.college || 'PVPPCOE Mumbai',
        track: newUserForm.department ? `${newUserForm.department} Faculty` : 'Full Stack Web Engineering',
        studentsAssigned: 0,
        rating: '5.0/5',
      };
      setMentors([newMentor, ...mentors]);
    } else if (newUserForm.role === 'students') {
      const newStudent = {
        id: Date.now(),
        name: newUserForm.name,
        rollNo: newUserForm.rollNo || `STD-${Math.floor(100 + Math.random() * 900)}`,
        college: newUserForm.college || 'PVPPCOE Mumbai',
        batch: `${newUserForm.department || 'COMPS'} ${newUserForm.year || 'FE'} ${newUserForm.division || 'A'}`,
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
      college: 'PVPPCOE Mumbai',
      department: 'COMPS',
      phone: '',
      rollNo: '',
      year: 'FE',
      division: 'A',
    });
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
            <BookOpen size={16} />
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
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
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

      {/* TAB CONTENT: Admin Verification */}
      {activeTab === "admins" && (
        <div className="manageusers-tab-content">
          <div className="manageusers-banner">
            <Clock className="manageusers-banner-icon" />
            <p className="manageusers-banner-text">
              Verifying a request grants institutional administrative access to create departments, assign coordinators, and view student performance data.
            </p>
          </div>


          <div className="manageusers-table-card">
            {filteredAdmins.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Admin Requests Found"
                description="There are currently no college administrator sign-ups matching your query."
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
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.email}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <div className="flex items-center gap-2 font-semibold text-slate-800">
                            <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{req.college}</span>
                          </div>
                        </td>
                        <td className="manageusers-td font-medium text-slate-700">{req.designation}</td>
                        <td className="manageusers-td text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.date}</span>
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
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>Verify Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAdmin(req.id)}
                                className="manageusers-btn-reject"
                              >
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
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
                          {c.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="manageusers-td text-slate-600 font-medium">{c.college}</td>
                    <td className="manageusers-td text-indigo-600 font-medium">{c.department}</td>
                    <td className="manageusers-td text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="manageusers-td-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {c.status}
                      </span>
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
                          {m.name.split(' ').map(n=>n[0]).join('')}
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
          <div className="modal-dialog">
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
              <button className="modal-close-btn" onClick={() => setIsGenerateCodeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateCode}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Assign Target Role *</label>
                  <select
                    className="form-select-admin"
                    value={codeRole}
                    onChange={(e) => setCodeRole(e.target.value)}
                  >
                    <option value="students">Student Cohort Access</option>
                    <option value="mentors">Mentor &amp; Trainer</option>
                    <option value="coordinators">Department Coordinator</option>
                    <option value="admins">College Administrator (Admin)</option>
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Target College *</label>
                    <select
                      className="form-select-admin"
                      value={codeCollege}
                      onChange={(e) => setCodeCollege(e.target.value)}
                    >
                      <option value="PVPPCOE Mumbai">PVPPCOE Mumbai</option>
                      <option value="Apex Institute">Apex Institute of Tech</option>
                      <option value="Meridian College">Meridian Engineering</option>
                      <option value="Vanguard Institute">Vanguard Academy</option>
                    </select>
                  </div>

                  <div className="form-group-admin">
                    <label>Code Validity *</label>
                    <select
                      className="form-select-admin"
                      value={codeExpiry}
                      onChange={(e) => setCodeExpiry(e.target.value)}
                    >
                      <option value="24 Hours">24 Hours</option>
                      <option value="7 Days">7 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="Never (Permanent)">Never (Permanent)</option>
                    </select>
                  </div>
                </div>

                {/* Display Newly Generated Code Hero Banner */}
                {generatedCode && (
                  <div className="manageusers-token-hero">
                    <div>
                      <div className="manageusers-token-label">
                        <Sparkles size={13} style={{ color: "#a5b4fc" }} />
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
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-[13.5px] tracking-wide">{c.code}</span>
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{c.role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code, c.id)}
                          className={`manageusers-item-copy-btn ${copiedCodeId === c.id ? 'manageusers-item-copy-btn--copied' : ''}`}
                        >
                          {copiedCodeId === c.id ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedCodeId === c.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsGenerateCodeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit inline-flex items-center gap-1.5">
                  <Sparkles size={16} />
                  <span>Generate Code</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create New User Modal */}
      {isAddUserModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddUserModalOpen(false); }}>
          <div className="modal-dialog">
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
                <div className="form-group-admin">
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

                <div className="form-row-2">
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

                <div className="form-group-admin">
                  <label>Assign Role *</label>
                  <select
                    className="form-select-admin"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="students">Student</option>
                    <option value="mentors">Mentor / Faculty</option>
                    <option value="coordinators">Coordinator</option>
                    <option value="admins">College Administrator (Admin)</option>
                  </select>
                </div>

                {newUserForm.role === 'students' && (
                  <>
                    <div className="form-row-2">
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
                        <label>Department</label>
                        <select
                          className="form-select-admin"
                          value={newUserForm.department || 'COMPS'}
                          onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                        >
                          <option value="COMPS">COMPS</option>
                          <option value="IT">IT</option>
                          <option value="AIML">AIML</option>
                          <option value="ECS">ECS</option>
                          <option value="MTRX">MTRX</option>
                          <option value="EXTC">EXTC</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <select
                          className="form-select-admin"
                          value={newUserForm.year || 'FE'}
                          onChange={(e) => setNewUserForm({ ...newUserForm, year: e.target.value })}
                        >
                          <option value="FE">FE</option>
                          <option value="SE">SE</option>
                          <option value="TE">TE</option>
                          <option value="BE">BE</option>
                        </select>
                      </div>
                      <div className="form-group-admin">
                        <label>Division</label>
                        <select
                          className="form-select-admin"
                          value={newUserForm.division || 'A'}
                          onChange={(e) => setNewUserForm({ ...newUserForm, division: e.target.value })}
                        >
                          <option value="A">Division A</option>
                          <option value="B">Division B</option>
                          <option value="C">Division C</option>
                        </select>
                      </div>
                    </div>
                  </>
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
