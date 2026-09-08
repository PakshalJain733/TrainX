import React, { useState, useEffect } from 'react';
import { mentorBatches, mentorStudents } from '../../../data/mentorMockData';
import { CalendarCheck, Users, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Layers, Filter, Check, Save } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Attendance.css';

export default function Attendance() {
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [search, setSearch] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTopic, setSessionTopic] = useState('Daily Live Interactive Class');
  
  // Quick status state for real-time marking
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [leaveActionMsg, setLeaveActionMsg] = useState('');

  // Sample/API leave applications state
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 101,
      studentId: 1,
      studentName: "Rahul Verma",
      rollNo: "CS202601",
      batch: "BE-CS-2026-A",
      category: "Medical Leave",
      startDate: "2026-09-08",
      endDate: "2026-09-10",
      days: 3,
      reason: "High fever and viral infection. Doctor advised 3 days complete bed rest.",
      status: "Pending"
    },
    {
      id: 102,
      studentId: 4,
      studentName: "Neha Sharma",
      rollNo: "CS202611",
      batch: "BE-CS-2026-A",
      category: "Personal / Family Event",
      startDate: "2026-09-09",
      endDate: "2026-09-09",
      days: 1,
      reason: "Attending sister's graduation ceremony out of city.",
      status: "Pending"
    },
    {
      id: 103,
      studentId: 9,
      studentName: "Priya Nair",
      rollNo: "EXT202607",
      batch: "BE-EXTC-2026-C",
      category: "Academic / Hackathon",
      startDate: "2026-09-12",
      endDate: "2026-09-14",
      days: 3,
      reason: "Participating in Smart India Hackathon grand finale round.",
      status: "Pending"
    }
  ]);

  // Master initial student list load
  useEffect(() => {
    // Initial mock base students extended with realistic assigned students
    const mockExtended = [
      { id: 1, name: "Rahul Verma", rollNo: "CS202601", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 94, totalClasses: 45, attended: 42, status: "Present" },
      { id: 2, name: "Ananya Patel", rollNo: "CS202604", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 88, totalClasses: 45, attended: 40, status: "Present" },
      { id: 3, name: "Vikram Malhotra", rollNo: "CS202609", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 96, totalClasses: 45, attended: 43, status: "Present" },
      { id: 4, name: "Neha Sharma", rollNo: "CS202611", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 71, totalClasses: 45, attended: 32, status: "Absent" },
      { id: 5, name: "Siddharth Rao", rollNo: "IT202612", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 68, totalClasses: 40, attended: 27, status: "Absent" },
      { id: 6, name: "Pooja Deshmukh", rollNo: "IT202615", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 96, totalClasses: 40, attended: 38, status: "Present" },
      { id: 7, name: "Aarav Mehta", rollNo: "IT202620", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 85, totalClasses: 40, attended: 34, status: "Present" },
      { id: 8, name: "Rohan Gupta", rollNo: "EXT202603", department: "EXTC", batch: "BE-EXTC-2026-C", attendance: 90, totalClasses: 38, attended: 34, status: "Present" },
      { id: 9, name: "Priya Nair", rollNo: "EXT202607", department: "EXTC", batch: "BE-EXTC-2026-C", attendance: 65, totalClasses: 38, attended: 25, status: "Absent" },
    ];

    apiFetch("/students")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const apiStudents = res.data.map((u, idx) => ({
            id: u.id || idx + 10,
            name: u.name || u.full_name || "Student User",
            rollNo: u.roll_number || u.rollNo || `CS2026${idx + 25}`,
            department: u.department || "Computer Engineering",
            batch: u.batch_code || u.batch_name || (idx % 3 === 0 ? "BE-CS-2026-A" : idx % 3 === 1 ? "TE-IT-2026-B" : "BE-EXTC-2026-C"),
            attendance: u.attendance || (75 + (idx * 7) % 23),
            totalClasses: 45,
            attended: Math.round(45 * ((u.attendance || (75 + (idx * 7) % 23)) / 100)),
            status: (u.attendance || (75 + (idx * 7) % 23)) >= 75 ? "Present" : "Absent"
          }));
          setStudentList(apiStudents);
          
          // Initial status map
          const initialMap = {};
          apiStudents.forEach(s => { initialMap[s.id] = s.status; });
          setAttendanceRecords(initialMap);
        } else {
          setStudentList(mockExtended);
          const initialMap = {};
          mockExtended.forEach(s => { initialMap[s.id] = s.status; });
          setAttendanceRecords(initialMap);
        }
      })
      .catch(() => {
        setStudentList(mockExtended);
        const initialMap = {};
        mockExtended.forEach(s => { initialMap[s.id] = s.status; });
        setAttendanceRecords(initialMap);
      });
  }, []);

  // Handle Marking Status Toggle (Present <-> Absent toggle or Late)
  const handleStatusToggle = (id, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [id]: newStatus
    }));
  };

  // Toggle present/absent directly with one click button
  const handleQuickTogglePresentAbsent = (id) => {
    setAttendanceRecords(prev => {
      const current = prev[id] || 'Present';
      return {
        ...prev,
        [id]: current === 'Present' ? 'Absent' : 'Present'
      };
    });
  };

  const handleVerifyLeave = (leaveId, status, studentName) => {
    setLeaveRequests(prev => prev.map(req => req.id === leaveId ? { ...req, status } : req));
    setLeaveActionMsg(`Leave application for ${studentName} set to ${status}!`);
    setTimeout(() => setLeaveActionMsg(''), 3500);

    // If approved, update student attendance state
    if (status === 'Approved') {
      const targetReq = leaveRequests.find(r => r.id === leaveId);
      if (targetReq && targetReq.studentId) {
        handleStatusToggle(targetReq.studentId, 'Present');
      }
    }
  };

  const handleSaveAttendance = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Filter students based on Batch Selection & Search query
  const filteredStudents = studentList.filter((s) => {
    const matchesBatch = selectedBatch === 'ALL' || s.batch === selectedBatch;
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(search.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  // Calculate Batch Level Stats
  const calculateBatchStats = (batchCode) => {
    const batchStudents = studentList.filter((s) => s.batch === batchCode);
    if (batchStudents.length === 0) return { avg: 0, lowCount: 0, total: 0 };
    const sum = batchStudents.reduce((acc, curr) => acc + curr.attendance, 0);
    const avg = (sum / batchStudents.length).toFixed(1);
    const lowCount = batchStudents.filter((s) => s.attendance < 75).length;
    return { avg, lowCount, total: batchStudents.length };
  };

  // Global Filtered Stats
  const totalAssignedInView = filteredStudents.length;
  const presentCountInView = filteredStudents.filter(s => (attendanceRecords[s.id] || s.status) === 'Present').length;
  const absentCountInView = filteredStudents.filter(s => (attendanceRecords[s.id] || s.status) === 'Absent').length;
  const lateCountInView = filteredStudents.filter(s => (attendanceRecords[s.id] || s.status) === 'Late').length;
  const lowAttendanceCount = filteredStudents.filter(s => s.attendance < 75).length;

  return (
    <div className="mentor-attendance-container">

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            </div>
            Attendance & Leave Verification
          </h2>
          <p style={{ margin: '4px 0 0 46px', fontSize: '13px', color: '#64748b' }}>
            Mark daily attendance, verify leave applications, and monitor at-risk students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {savedSuccess && (
            <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} /> Attendance saved!
            </div>
          )}
          {leaveActionMsg && (
            <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} /> {leaveActionMsg}
            </div>
          )}
        </div>
      </div>



      {/* ── Daily Attendance Register ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Register Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <Layers size={17} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Daily Attendance Register</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Toggle Present / Absent / Late for today's session.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Batch Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="#94a3b8" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#1e293b', background: '#f8fafc', cursor: 'pointer', minWidth: '200px' }}
              >
                <option value="ALL">All Batches</option>
                {mentorBatches.map(b => (
                  <option key={b.id} value={b.code}>{b.code} — {b.name}</option>
                ))}
              </select>
            </div>
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b' }}
            />
            <button
              onClick={handleSaveAttendance}
              style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(79,70,229,0.25)', transition: 'all 0.15s' }}
            >
              <Save size={14} /> Save Log
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>#</th>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Student</th>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Batch</th>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Attendance</th>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Sessions</th>
                <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Today's Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13px' }}>
                    No students found for the selected batch/filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const currentStatus = attendanceRecords[student.id] || student.status;
                  const isLow = student.attendance < 75;
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{student.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {student.rollNo}
                          {isLow && <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontFamily: 'sans-serif', fontSize: '10px' }}>⚠ &lt;75%</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {student.batch}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '52px', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${student.attendance}%`, background: isLow ? '#f43f5e' : student.attendance >= 90 ? '#10b981' : '#f59e0b', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: isLow ? '#e11d48' : student.attendance >= 90 ? '#059669' : '#d97706' }}>
                            {student.attendance}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {student.attended} / {student.totalClasses}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          {[
                            { label: 'Present', status: 'Present', activeColor: '#10b981', icon: <CheckCircle2 size={12} /> },
                            { label: 'Absent', status: 'Absent', activeColor: '#f43f5e', icon: <XCircle size={12} /> },
                            { label: 'Late', status: 'Late', activeColor: '#f59e0b', icon: <Clock size={12} /> },
                          ].map((btn, i, arr) => (
                            <button
                              key={btn.status}
                              type="button"
                              onClick={() => handleStatusToggle(student.id, btn.status)}
                              style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRight: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none',
                                background: currentStatus === btn.status ? btn.activeColor : 'transparent',
                                color: currentStatus === btn.status ? '#fff' : '#64748b',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {btn.icon} {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Leave Verification ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fef3c7', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <AlertTriangle size={17} color="#d97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Student Leave Applications</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Review reasons and approve or reject each request.</p>
            </div>
          </div>
          {leaveRequests.filter(r => r.status === 'Pending').length > 0 && (
            <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
              {leaveRequests.filter(r => r.status === 'Pending').length} Pending
            </span>
          )}
        </div>

        {/* Cards */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
          {leaveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              No pending leave applications.
            </div>
          ) : (
            leaveRequests.map(req => {
              const accentColor = req.status === 'Approved' ? '#10b981' : req.status === 'Rejected' ? '#f43f5e' : '#f59e0b';
              const bgTint = req.status === 'Approved' ? '#f0fdf4' : req.status === 'Rejected' ? '#fff1f2' : '#fffbeb';
              const initials = req.studentName.split(' ').map(n => n[0]).join('');
              return (
                <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#fafafa' }}>
                  {/* Avatar + Info */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: bgTint, border: `2px solid ${accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: accentColor, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{req.studentName}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 7px', borderRadius: '4px' }}>{req.rollNo}</span>
                        <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px', fontWeight: '600', padding: '1px 8px', borderRadius: '20px' }}>{req.batch}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.3px', background: bgTint, color: accentColor, border: `1px solid ${accentColor}40` }}>{req.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                        <span><strong style={{ color: '#334155' }}>{req.category}</strong></span>
                        <span>·</span>
                        <span>{req.startDate} → {req.endDate} <strong style={{ color: accentColor }}>({req.days}d)</strong></span>
                      </div>
                      <div style={{ marginTop: '6px', background: '#fff', border: '1px solid #e9eef4', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: '#475569', fontStyle: 'italic', lineHeight: '1.5' }}>
                        <strong style={{ color: '#0f172a', fontStyle: 'normal' }}>Reason: </strong>"{req.reason}"
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderLeft: '1px solid #e9eef4', background: '#fff', minWidth: '160px', alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={() => handleVerifyLeave(req.id, 'Approved', req.studentName)}
                      style={{ background: req.status === 'Approved' ? '#10b981' : 'transparent', color: req.status === 'Approved' ? '#fff' : '#64748b', border: req.status === 'Approved' ? '1.5px solid #10b981' : '1.5px solid #cbd5e1', padding: '8px 0', borderRadius: '7px', fontWeight: req.status === 'Approved' ? '700' : '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: req.status === 'Approved' ? '0 2px 6px rgba(16,185,129,0.2)' : 'none', transition: 'all 0.15s' }}
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyLeave(req.id, 'Rejected', req.studentName)}
                      style={{ background: req.status === 'Rejected' ? '#f43f5e' : 'transparent', color: req.status === 'Rejected' ? '#fff' : '#64748b', border: req.status === 'Rejected' ? '1.5px solid #f43f5e' : '1.5px solid #cbd5e1', padding: '7px 0', borderRadius: '7px', fontWeight: req.status === 'Rejected' ? '700' : '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

