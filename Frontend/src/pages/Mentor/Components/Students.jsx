import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';

export default function Students() {
  const [search, setSearch] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/students")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.students)) {
          setStudentList(res.data.students);
        }
      })
      .catch(() => setStudentList([]))
      .finally(() => setLoading(false));
  }, []);

  const students = studentList.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.batch || s.batchName || "").toLowerCase().includes(search.toLowerCase())
  );

  const getAttendanceClass = (att) => {
    const num = parseInt(att, 10) || 0;
    if (num >= 90) return 'mentor-student-attendance--green';
    if (num >= 75) return 'mentor-student-attendance--amber';
    return 'mentor-student-attendance--rose';
  };

  const getRiskClass = (risk) => {
    if (risk === 'Top Performer') return 'mentor-risk-pill--top';
    if (risk === 'Good') return 'mentor-risk-pill--good';
    if (risk === 'Moderate Risk') return 'mentor-risk-pill--moderate';
    if (risk === 'High Risk') return 'mentor-risk-pill--high';
    return 'mentor-risk-pill--moderate';
  };

  return (
    <div className="mentor-students-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Users size={20} color="#4f46e5" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="mentor-page-subtitle">Track student progress, attendance %, assessment scores, and intervention flags</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mentor-search-card">
        <div className="mentor-search-wrap">
          <Search size={16} className="mentor-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll number, or cohort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mentor-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mentor-table-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
            <p style={{ fontSize: 13 }}>Loading assigned students...</p>
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Attendance</th>
                  <th>Quiz Score</th>
                  <th>Risk Level</th>
                  <th className="mentor-actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="mentor-empty-table-cell">
                      No students assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <p className="mentor-student-name">{s.name}</p>
                        <p className="mentor-student-college">{s.batch || s.batchName || "—"}</p>
                      </td>
                      <td>
                        <span className="mentor-student-roll">{s.rollNo}</span>
                      </td>
                      <td>
                        <span className="mentor-student-batch">{s.department || "—"}</span>
                      </td>
                      <td>
                        <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance)}`}>
                          {s.attendance != null && s.attendance > 0 ? `${s.attendance}%` : "No records"}
                        </span>
                      </td>
                      <td>
                        <span className="mentor-student-score">{s.quizScore || "No Data"}</span>
                      </td>
                      <td>
                        <span className={`mentor-risk-pill ${getRiskClass(s.riskLevel)}`}>
                          {s.riskLevel || "—"}
                        </span>
                      </td>
                      <td className="mentor-actions-cell">
                        <button className="mentor-action-btn">
                          <Mail size={13} />
                          <span>Contact</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}