import React, { useState, useEffect } from 'react';
import { mentorStudents } from '../../../data/mentorMockData';
import { Users, Search, Mail } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';

export default function Students() {
  const [search, setSearch] = useState('');
  const [studentList, setStudentList] = useState(mentorStudents);

  useEffect(() => {
    apiFetch("/students")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setStudentList(res.data.map((u, idx) => ({
            id: u.id || idx,
            name: u.name || u.full_name || "Student User",
            rollNo: u.roll_number || u.rollNo || `CS20260${idx + 1}`,
            department: u.department || "Computer Engineering",
            college: u.college_name || "PVPPCOE",
            batch: u.batch_name || "BE-CS-2026-A",
            attendance: `${u.attendance || 85 + (idx % 12)}%`,
            quizScore: `${u.quiz_score || 80 + (idx % 18)} / 100`,
            riskLevel: u.attendance < 75 ? "High Risk" : (u.quiz_score >= 90 ? "Top Performer" : "Good"),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const students = studentList.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.batch || "").toLowerCase().includes(search.toLowerCase())
  );

  const getAttendanceClass = (attStr) => {
    const num = parseInt(attStr) || 0;
    if (num >= 90) return 'mentor-student-attendance--green';
    if (num >= 75) return 'mentor-student-attendance--amber';
    return 'mentor-student-attendance--rose';
  };

  const getRiskClass = (risk) => {
    if (risk === 'Top Performer') return 'mentor-risk-pill--top';
    if (risk === 'Good') return 'mentor-risk-pill--good';
    if (risk === 'Moderate Risk') return 'mentor-risk-pill--moderate';
    return 'mentor-risk-pill--high';
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
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <p className="mentor-student-name">{s.name}</p>
                    <p className="mentor-student-college">{s.college || "PVPPCOE"}</p>
                  </td>
                  <td>
                    <span className="mentor-student-roll">{s.rollNo}</span>
                  </td>
                  <td>
                    <span className="mentor-student-batch">{s.department || s.batch}</span>
                  </td>
                  <td>
                    <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance)}`}>
                      {s.attendance}
                    </span>
                  </td>
                  <td>
                    <span className="mentor-student-score">{s.quizScore || s.avgScore || "85 / 100"}</span>
                  </td>
                  <td>
                    <span className={`mentor-risk-pill ${getRiskClass(s.riskLevel)}`}>
                      {s.riskLevel}
                    </span>
                  </td>
                  <td className="mentor-actions-cell">
                    <button className="mentor-action-btn">
                      <Mail size={13} />
                      <span>Contact</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
