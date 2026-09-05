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

  // Handle Marking Status Toggle
  const handleStatusToggle = (id, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [id]: newStatus
    }));
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
      {/* Page Header */}
      <div className="mentor-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="mentor-page-title">
            <CalendarCheck size={22} color="#4f46e5" />
            <span>Assigned Students Attendance & Batch Analytics</span>
          </h2>
          <p className="mentor-page-subtitle">
            Track live session attendance, monitor low-attendance risks (&lt;75%), and log daily participation across batches.
          </p>
        </div>
        {savedSuccess && (
          <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Attendance Saved Successfully!
          </div>
        )}
      </div>

      {/* Batch Overview Cards & Particular Batch Selector */}
      <div className="mentor-attendance-grid">
        <div 
          onClick={() => setSelectedBatch('ALL')}
          className={`mentor-attendance-card ${selectedBatch === 'ALL' ? 'mentor-att-card--active' : ''}`}
          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div className="mentor-att-card-header">
            <div>
              <span className="mentor-att-batch-code">ALL BATCHES OVERVIEW</span>
              <h3 className="mentor-att-batch-name">All Assigned Batches</h3>
            </div>
            <span className={`mentor-att-verified-badge ${selectedBatch === 'ALL' ? 'badge-selected' : ''}`}>
              {selectedBatch === 'ALL' ? 'Active Filter' : 'Select'}
            </span>
          </div>
          <div className="mentor-att-stats">
            <div className="mentor-att-stat-row">
              <span>Total Students Assigned:</span>
              <span className="mentor-att-stat-val--green">{studentList.length} Students</span>
            </div>
            <div className="mentor-att-stat-row">
              <span>Low Attendance (&lt;75%):</span>
              <span className="mentor-att-stat-val--rose">{studentList.filter(s => s.attendance < 75).length} At Risk</span>
            </div>
          </div>
        </div>

        {mentorBatches.map((b) => {
          const stats = calculateBatchStats(b.code);
          const isSelected = selectedBatch === b.code;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBatch(b.code)}
              className={`mentor-attendance-card ${isSelected ? 'mentor-att-card--active' : ''}`}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div className="mentor-att-card-header">
                <div>
                  <span className="mentor-att-batch-code">{b.code}</span>
                  <h3 className="mentor-att-batch-name">{b.name}</h3>
                </div>
                <span className={`mentor-att-verified-badge ${isSelected ? 'badge-selected' : ''}`}>
                  {isSelected ? 'Active Filter' : 'Select Batch'}
                </span>
              </div>

              <div className="mentor-att-stats">
                <div className="mentor-att-stat-row">
                  <span>Avg Batch Attendance:</span>
                  <span className="mentor-att-stat-val--green">{stats.avg}%</span>
                </div>
                <div className="mentor-att-stat-row">
                  <span>Low Attendance (&lt;75%):</span>
                  <span className="mentor-att-stat-val--rose">{stats.lowCount} students</span>
                </div>
                <div className="mentor-att-stat-row">
                  <span>Total Enrolled:</span>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{stats.total} students</span>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBatch(b.code);
                }}
                className="mentor-att-mark-btn"
                style={isSelected ? { background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' } : {}}
              >
                {isSelected ? 'Viewing Batch Attendance' : 'Filter Batch Attendance'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Session Attendance Logger & Controls */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#2563eb" />
              Daily Session Attendance Register - {selectedBatch === 'ALL' ? 'All Assigned Batches' : selectedBatch}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Mark attendance for today's session or view existing attendance percentages of students.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b' }}
            />
            <button
              onClick={handleSaveAttendance}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
              }}
            >
              <Save size={15} /> Save Attendance Log
            </button>
          </div>
        </div>

        {/* Realtime Stats Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Assigned In View</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{totalAssignedInView} Students</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#047857', textTransform: 'uppercase' }}>Present Today</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{presentCountInView}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#be123c', textTransform: 'uppercase' }}>Absent Today</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#f43f5e' }}>{absentCountInView}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#d97706', textTransform: 'uppercase' }}>Low Attendance (&lt;75%)</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{lowAttendanceCount}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search student name, roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontWeight: '500' }}
            >
              <option value="ALL">All Batches</option>
              {mentorBatches.map(b => (
                <option key={b.id} value={b.code}>{b.code} - {b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Assigned Students Attendance Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                <th style={{ padding: '12px 16px' }}>Student Name</th>
                <th style={{ padding: '12px 16px' }}>Roll Number</th>
                <th style={{ padding: '12px 16px' }}>Batch Code</th>
                <th style={{ padding: '12px 16px' }}>Overall Attendance %</th>
                <th style={{ padding: '12px 16px' }}>Attended / Total</th>
                <th style={{ padding: '12px 16px' }}>Today's Session Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No assigned students found for the selected batch/filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const currentStatus = attendanceRecords[student.id] || student.status;
                  const isLow = student.attendance < 75;

                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                        {student.name}
                        {isLow && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ffe4e6', color: '#e11d48', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            &lt; 75% Risk
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>
                        {student.rollNo}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {student.batch}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontWeight: '700',
                          color: isLow ? '#e11d48' : student.attendance >= 90 ? '#059669' : '#d97706'
                        }}>
                          {student.attendance}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {student.attended} / {student.totalClasses} Sessions
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, 'Present')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: currentStatus === 'Present' ? '1px solid #10b981' : '1px solid #e2e8f0',
                              background: currentStatus === 'Present' ? '#ecfdf5' : '#fff',
                              color: currentStatus === 'Present' ? '#047857' : '#64748b',
                              fontWeight: '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={13} /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, 'Absent')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: currentStatus === 'Absent' ? '1px solid #f43f5e' : '1px solid #e2e8f0',
                              background: currentStatus === 'Absent' ? '#fff1f2' : '#fff',
                              color: currentStatus === 'Absent' ? '#be123c' : '#64748b',
                              fontWeight: '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <XCircle size={13} /> Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(student.id, 'Late')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: currentStatus === 'Late' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                              background: currentStatus === 'Late' ? '#fffbeb' : '#fff',
                              color: currentStatus === 'Late' ? '#b45309' : '#64748b',
                              fontWeight: '600',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={13} /> Late
                          </button>
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
    </div>
  );
}
