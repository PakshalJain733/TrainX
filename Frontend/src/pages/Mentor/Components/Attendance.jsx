import React from 'react';
import { mentorBatches } from '../../../data/mentorMockData';
import { CalendarCheck, Upload } from 'lucide-react';
import '../Styles/SkillGaps.css';
import '../Styles/Attendance.css';

export default function Attendance() {
  return (
    <div className="mentor-attendance-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <CalendarCheck size={20} color="#4f46e5" />
            <span>Attendance Verification & Management</span>
          </h2>
          <p className="mentor-page-subtitle">Record daily live session attendance, review student excuses, and submit weekly logs</p>
        </div>

        <button className="mentor-btn-primary">
          <Upload size={16} />
          <span>Upload Session Attendance Sheet</span>
        </button>
      </div>

      {/* Grid */}
      <div className="mentor-attendance-grid">
        {mentorBatches.map((b) => (
          <div key={b.id} className="mentor-attendance-card">
            <div className="mentor-att-card-header">
              <div>
                <span className="mentor-att-batch-code">{b.code}</span>
                <h3 className="mentor-att-batch-name">{b.name}</h3>
              </div>
              <span className="mentor-att-verified-badge">
                Verified
              </span>
            </div>

            <div className="mentor-att-stats">
              <div className="mentor-att-stat-row">
                <span>Avg Batch Attendance:</span>
                <span className="mentor-att-stat-val--green">92.4%</span>
              </div>
              <div className="mentor-att-stat-row">
                <span>Low Attendance (&lt;75%):</span>
                <span className="mentor-att-stat-val--rose">2 students</span>
              </div>
            </div>

            <button className="mentor-att-mark-btn">
              Mark Session Attendance
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
