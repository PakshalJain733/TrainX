import React from 'react';
import { mentorDefaulters } from '../../../data/mentorMockData';
import { AlertCircle, Bell } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/Defaulters.css';

export default function Defaulters() {
  return (
    <div className="mentor-defaulters-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <AlertCircle size={20} color="#e11d48" />
            <span>Defaulters & Performance Risk Queue</span>
          </h2>
          <p className="mentor-page-subtitle">Students flagged for low attendance (&lt;75%), missed assignment deadlines, or test score dips</p>
        </div>

        <button className="mentor-btn-danger">
          <Bell size={16} />
          <span>Send Warning Alert to All</span>
        </button>
      </div>

      <div className="mentor-table-card">
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
              {mentorDefaulters.map((d) => (
                <tr key={d.id}>
                  <td className="mentor-student-name">{d.name}</td>
                  <td className="mentor-student-roll">{d.rollNo}</td>
                  <td className="mentor-student-batch">{d.batch}</td>
                  <td className="mentor-student-attendance--rose" style={{ fontWeight: 700 }}>{d.attendance}</td>
                  <td className="mentor-defaulter-missed">{d.missedAssignments} missed</td>
                  <td className="mentor-student-score">{d.lastTestScore}</td>
                  <td className="mentor-defaulter-reason">{d.reason}</td>
                  <td className="mentor-actions-cell">
                    <button className="mentor-notify-btn">
                      Notify Student
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
