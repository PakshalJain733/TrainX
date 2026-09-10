import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { initialAdminVerifications } from '../../data/superAdminMockData';
import './SuperAdmin.css';
import '../Admin/Styles/AdminUsers.css';

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
  const [activeTab, setActiveTab] = useState("admins"); // 'admins' | 'coordinators' | 'mentors' | 'students'
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Data States
  const [adminRequests, setAdminRequests] = useState(initialAdminVerifications);
  const [coordinators, setCoordinators] = useState(mockCoordinators);
  const [mentors, setMentors] = useState(mockMentors);
  const [students, setStudents] = useState(mockStudentsRisk);

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

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

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
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Manage Users &amp; Registration Codes</span>
          </h2>
          <p className="text-xs text-slate-500">View system users, issue role-based registration invitation codes, and add new institutional users</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => {
              setGeneratedCode(null);
              setIsGenerateCodeModalOpen(true);
            }}
            style={{
              background: "#eef2ff",
              color: "#4338ca",
              border: "1px solid #c7d2fe",
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer"
            }}
            className="flex items-center gap-2 transition hover:bg-indigo-100"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Generate Code</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="sa-btn-primary"
          >
            <Users className="w-4 h-4" />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Enhanced Premium Pill Tabs */}
      <div className="flex items-center gap-2.5 pb-2 overflow-x-auto">
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
              style={{
                borderRadius: "20px",
                border: "none",
                outline: "none",
                boxShadow: isActive ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
                background: isActive
                  ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)"
                  : "#f1f5f9",
                color: isActive ? "#ffffff" : "#475569",
                height: "38px",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
              className="text-xs font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:opacity-95"
            >
              <Icon size={15} style={{ color: isActive ? '#ffffff' : '#64748b', flexShrink: 0 }} />
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? "rgba(255, 255, 255, 0.22)" : "#cbd5e1",
                  color: isActive ? "#ffffff" : "#1e293b",
                  borderRadius: "12px",
                  padding: "1px 7px",
                  fontSize: "11px",
                  fontWeight: 800,
                  lineHeight: "1.3",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
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
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Verifying a request grants institutional administrative access to create departments, assign coordinators, and view student performance data.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAdmins.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Admin Requests Found"
                description="There are currently no college administrator sign-ups matching your query."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                      <th className="py-3 px-4">Applicant Name</th>
                      <th className="py-3 px-4">Institution / College</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Requested On</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredAdmins.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{req.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{req.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.college}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{req.designation}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.date}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerifyAdmin(req.id)}
                                style={{
                                  background: "#059669",
                                  color: "#ffffff",
                                  border: "none",
                                  outline: "none",
                                  borderRadius: "10px",
                                  padding: "8px 14px",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  cursor: "pointer"
                                }}
                                className="flex items-center gap-1.5 transition-transform active:scale-95 shadow-xs"
                              >
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>Verify Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAdmin(req.id)}
                                style={{
                                  background: "#fff1f2",
                                  color: "#e11d48",
                                  border: "1px solid #fecdd3",
                                  outline: "none",
                                  borderRadius: "10px",
                                  padding: "8px 14px",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  cursor: "pointer"
                                }}
                                className="flex items-center gap-1.5 transition-transform active:scale-95"
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs text-slate-500 border-b border-slate-200 uppercase font-mono bg-slate-50">
              <tr>
                <th className="py-3 px-4">Coordinator Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCoordinators.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex flex-shrink-0 items-center justify-center font-bold text-xs border border-indigo-100">
                        {c.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{c.college}</td>
                  <td className="py-3.5 px-4 text-indigo-600 font-medium">{c.department}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    <div>{c.email}</div>
                    <div>{c.phone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCoordinators.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No coordinators match your search.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Mentors */}
      {activeTab === "mentors" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs text-slate-500 border-b border-slate-200 uppercase font-mono bg-slate-50">
              <tr>
                <th className="py-3 px-4">Mentor Name</th>
                <th className="py-3 px-4">Domain Track</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Mentees Enrolled</th>
                <th className="py-3 px-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMentors.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex flex-shrink-0 items-center justify-center font-bold text-xs border border-emerald-100">
                        {m.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div>{m.name}</div>
                        <div className="text-xs text-slate-500 font-normal">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-indigo-600 font-medium">{m.track}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{m.college}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-bold">{m.studentsAssigned} Students</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      ★ {m.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMentors.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No mentors or trainers match your search.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Students Risk */}
      {activeTab === "students" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Roll No / Batch</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>College</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendance</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < filteredStudents.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "10px",
                        background: "#eef2ff", color: "#4f46e5",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "12px", flexShrink: 0
                      }}>
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569", fontSize: "12px" }}>
                    <div style={{ fontWeight: 600 }}>{s.rollNo}</div>
                    <div style={{ color: "#94a3b8", marginTop: "2px" }}>{s.batch}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569", fontWeight: 500 }}>{s.college}</td>
                  <td style={{ padding: "14px 16px", color: "#059669", fontWeight: 700 }}>{s.attendance}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <RiskBadge risk={s.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
              <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>No students found</p>
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
                  <div style={{ padding: "16px 18px", borderRadius: "12px", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", marginTop: "4px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={13} style={{ color: "#a5b4fc" }} />
                        <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 800, color: "#c7d2fe", letterSpacing: "0.08em" }}>Newly Issued Token</span>
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", fontFamily: "monospace", letterSpacing: "0.1em", marginTop: "2px" }}>{generatedCode}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(generatedCode, 'hero')}
                      style={{
                        background: copiedCodeId === 'hero' ? "#10b981" : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                        color: "#ffffff",
                        border: "none",
                        outline: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {copiedCodeId === 'hero' ? <Check size={15} /> : <Copy size={15} />}
                      <span>{copiedCodeId === 'hero' ? 'Copied!' : 'Copy Token'}</span>
                    </button>
                  </div>
                )}

                {/* Recent Active Codes List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recently Issued Tokens</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: "12px" }}>{generatedCodesList.length} Active</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
                    {generatedCodesList.map((c) => (
                      <div key={c.id} style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0f172a", fontSize: "13.5px", letterSpacing: "0.05em" }}>{c.code}</span>
                          <span style={{ fontSize: "10.5px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: "#e0e7ff", color: "#4338ca" }}>{c.role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code, c.id)}
                          style={{
                            background: copiedCodeId === c.id ? "#059669" : "#ffffff",
                            border: copiedCodeId === c.id ? "1px solid #059669" : "1px solid #cbd5e1",
                            borderRadius: "7px",
                            padding: "4px 12px",
                            fontWeight: 700,
                            color: copiedCodeId === c.id ? "#ffffff" : "#4338ca",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease"
                          }}
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
                <button type="submit" className="btn-modal-submit" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={16} />
                  <span>Generate Code</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}      {/* Create New User Modal */}
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
