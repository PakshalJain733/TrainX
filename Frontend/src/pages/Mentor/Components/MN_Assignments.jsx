import React from 'react';
import { mentorAssignments } from '../../../data/mentorMockData';
import { FileCode, Plus } from 'lucide-react';
import "../Styles/MN_Assignments.css";

export default function Assignments() {
  return (
    <div className="mentor-assignments-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <FileCode size={20} color="#4f46e5" />
            <span>Assignments & Code Evaluation Queue</span>
          </h2>
          <p className="mentor-page-subtitle">Create programming tasks, review submitted student code, and assign marks</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="mentor-assignments-list">
        {mentorAssignments.map((a) => (
          <div key={a.id} className="mentor-assignment-card">
            <div className="mentor-assign-header">
              <div>
                <span className="mentor-assign-batch-tag">
                  {a.batch}
                </span>
                <h3 className="mentor-assign-title">{a.title}</h3>
                <p className="mentor-assign-duedate">Due Date: {a.dueDate}</p>
              </div>

              <span className={`mentor-assign-status ${
                a.status === 'Completed'
                  ? 'mentor-assign-status--completed'
                  : 'mentor-assign-status--pending'
              }`}>
                {a.status}
              </span>
            </div>

            <div className="mentor-assign-stats-grid">
              <div className="mentor-assign-stat-box">
                <span className="mentor-assign-stat-label">Submissions Received:</span>
                <p className="mentor-assign-stat-val">{a.totalSubmitted} / {a.totalStudents}</p>
              </div>
              <div className="mentor-assign-stat-box">
                <span className="mentor-assign-stat-label">Evaluated:</span>
                <p className="mentor-assign-stat-val mentor-assign-stat-val--green">{a.evaluated}</p>
              </div>
              <div className="mentor-assign-stat-box">
                <span className="mentor-assign-stat-label">Pending Review:</span>
                <p className="mentor-assign-stat-val mentor-assign-stat-val--rose">{a.totalSubmitted - a.evaluated}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
