import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/Defaulters.css';

export default function Defaulters() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/defaulters")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.defaulters)) {
          setDefaulters(res.data.defaulters);
        } else {
          setDefaulters([]);
        }
      })
      .catch(() => setDefaulters([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mentor-defaulters-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <AlertCircle size={20} color="#e11d48" />
            <span>Defaulters & Performance Risk Queue</span>
          </h2>
          <p className="mentor-page-subtitle">Students flagged for low attendance (&lt;75%) or poor assessment performance</p>
        </div>

        <button className="mentor-btn-danger" disabled={defaulters.length === 0} style={{ opacity: defaulters.length === 0 ? 0.5 : 1, cursor: defaulters.length === 0 ? 'not-allowed' : 'pointer' }}>
          <Bell size={16} />
          <span>Send Warning Alert to All</span>
        </button>
      </div>

      <div className="mentor-table-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
            <p style={{ fontSize: 13 }}>Loading defaulters...</p>
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Batch</th>
                  <th>Attendance</th>
                  <th>Missed Assignments</th>
                  <th>Last Test Score</th>
                  <th>Defaulter Reason</th>
                  <th className="mentor-actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="mentor-empty-table-cell">
                      No defaulter students flagged.
                    </td>
                  </tr>
                ) : (
                  defaulters.map((d) => (
                    <tr key={d.id}>
                      <td className="mentor-student-name">{d.name}</td>
                      <td className="mentor-student-roll">{d.rollNo}</td>
                      <td className="mentor-student-batch">{d.batch}</td>
                      <td className="mentor-student-attendance--rose font-bold">
                        {d.attendancePct != null && d.attendancePct > 0 ? d.attendance : "No records"}
                      </td>
                      <td className="mentor-defaulter-missed">{d.missedAssignments}</td>
                      <td className="mentor-student-score">{d.lastTestScore}</td>
                      <td className="mentor-defaulter-reason">{d.reason}</td>
                      <td className="mentor-actions-cell">
                        <button className="mentor-notify-btn">
                          Notify Student
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