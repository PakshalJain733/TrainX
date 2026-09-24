import React, { useState, useEffect } from 'react';
import { Users, Search, Mail } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import "../Styles/MN_Students.css";

export default function Students() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/mentor/students/performance');
        if (res && res.data && Array.isArray(res.data.students)) {
          setStudents(res.data.students);
        } else {
          setStudents([]);
        }
      } catch (e) {
        console.error('Failed to load mentor students:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.batch || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const getAttendanceClass = (att) => {
    if (att == null) return '';
    if (att >= 90) return 'mentor-student-attendance--green';
    if (att >= 75) return 'mentor-student-attendance--amber';
    return 'mentor-student-attendance--rose';
  };

  const getRiskClass = (risk) => {
    if (risk === 'Top Performer') return 'mentor-risk-pill--top';
    if (risk === 'Good') return 'mentor-risk-pill--good';
    if (risk === 'Moderate Risk') return 'mentor-risk-pill--moderate';
    if (risk === 'High Risk') return 'mentor-risk-pill--high';
    return 'mentor-risk-pill--moderate';
  };

  const displayScore = (s) => (s.overallScore > 0 ? `${s.overallScore}%` : '—');

  return (
    <div className="mentor-students-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Users size={20} color="#4f46e5" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="mentor-page-subtitle">Your allocated C2C 2029 students — progress, attendance, assessment scores, and intervention flags</p>
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
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Assigned Batch</th>
                <th>Attendance</th>
                <th>Avg Score</th>
                <th>Risk Level</th>
                <th className="mentor-actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="mentor-students-empty">Loading assigned students...</div></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td>
                      <p className="mentor-student-name">{s.name || 'Unnamed Student'}</p>
                      <p className="mentor-student-college">{s.department ? `${s.department} · C2C 2029` : 'C2C 2029'}</p>
                    </td>
                    <td>
                      <span className="mentor-student-roll">{s.rollNo || '—'}</span>
                    </td>
                    <td>
                      <span className="mentor-student-batch">{s.batch || '—'}</span>
                    </td>
                    <td>
                      <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance)}`}>
                        {s.attendance == null ? 'N/A' : `${s.attendance}%`}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-student-score">{displayScore(s)}</span>
                    </td>
                    <td>
                      <span className={`mentor-risk-pill ${getRiskClass(s.status)}`}>
                        {s.status || 'No Records'}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <a
                        className="mentor-action-btn"
                        href={s.email ? `mailto:${s.email}` : undefined}
                        style={s.email ? undefined : { opacity: 0.4, pointerEvents: 'none' }}
                        title={s.email ? s.email : 'No email on record'}
                      >
                        <Mail size={13} />
                        <span>Contact</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="mentor-students-empty">
                      <Users size={28} />
                      <p>No assigned students found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}