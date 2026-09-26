import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Users, Search, Mail } from 'lucide-react';

import "../Styles/MN_Students.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getStudents = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.students)) return payload.students;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getAttendanceClass = (attendance) => {
  const value = asNumber(attendance);
  if (value === null) return "";
  if (value >= 90) return "mentor-student-attendance--green";
  if (value >= 75) return "mentor-student-attendance--amber";
  return "mentor-student-attendance--rose";
};

const getRiskClass = (status) => {
  if (status === "Top Performer") return "mentor-risk-pill--top";
  if (status === "Good") return "mentor-risk-pill--good";
  if (status === "Moderate Risk" || status === "Average") return "mentor-risk-pill--moderate";
  if (status === "High Risk" || status === "Needs Work") return "mentor-risk-pill--high";
  return "";
};

const formatPercent = (value) => {
  const number = asNumber(value);
  return number === null ? "N/A" : `${number}%`;
};

export default function Students() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch("/mentor/students/performance")
      .then((res) => {
        if (mounted) {
          const list = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setStudents(list);
        }
      })
      .catch(() => {
        if (mounted) setStudents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNo && String(s.rollNo).toLowerCase().includes(q)) ||
      (s.roll_number && String(s.roll_number).toLowerCase().includes(q)) ||
      (s.batch && String(s.batch).toLowerCase().includes(q)) ||
      (s.department && String(s.department).toLowerCase().includes(q))
    );
  });

  return (
    <div className="mentor-students-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Users size={20} color="#4f46e5" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="mentor-page-subtitle">Your assigned students and the performance records returned by the mentor service</p>
        </div>
      </div>

      <div className="mentor-search-card">
        <div className="mentor-search-wrap">
          <Search size={16} className="mentor-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll number, or batch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mentor-search-input"
          />
        </div>
      </div>

      <div className="mentor-table-card">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            No students found.
          </div>
        ) : (
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
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td>
                      <p className="mentor-student-name">{s.name}</p>
                      <p className="mentor-student-college">{s.college_name || s.college || 'College'}</p>
                    </td>
                    <td>
                      <span className="mentor-student-roll">{s.rollNo || s.roll_number || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="mentor-student-batch">{s.batch || s.department || 'Batch'}</span>
                    </td>
                    <td>
                      <span className={`mentor-student-attendance ${getAttendanceClass(s.attendance || '0%')}`}>
                        {s.attendance || '0%'}
                      </span>
                    </td>
                    <td>
                      <span className="mentor-student-score">{s.avgScore || s.score || '0%'}</span>
                    </td>
                    <td>
                      <span className={`mentor-risk-pill ${getRiskClass(s.riskLevel || 'Good')}`}>
                        {s.riskLevel || 'Good'}
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
        )}
      </div>
    </div>
  );
}
