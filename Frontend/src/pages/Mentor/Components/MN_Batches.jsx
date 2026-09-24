import React from 'react';
import { mentorBatches } from '../../../data/mentorMockData';
import { Layers, Plus } from 'lucide-react';
import "../Styles/MN_Batches.css";

export default function Batches() {
  return (
    <div className="mentor-batches-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Layers size={20} color="#4f46e5" />
            <span>My Allocated Batches</span>
          </h2>
          <p className="mentor-page-subtitle">Course schedules, syllabus completion, enrolled students, and cohort progress</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="mentor-batches-grid">
        {mentorBatches.map((b) => (
          <div key={b.id} className="mentor-batch-card-main">
            <div className="mentor-batch-top-row">
              <span className="mentor-batch-code-tag">
                {b.code}
              </span>
              <span className="mentor-status-tag mentor-status-tag--emerald">
                {b.status}
              </span>
            </div>

            <div className="mentor-batch-details-block">
              <h3 className="mentor-batch-main-title">{b.name}</h3>
              <p className="mentor-batch-college-sub">{b.college}</p>
              <p className="mentor-batch-dept-sub">{b.department}</p>
            </div>

            <div className="mentor-batch-stats-stack">
              <div className="mentor-batch-stat-line">
                <span>Enrolled Students:</span>
                <span className="mentor-batch-stat-strong">{b.enrolledStudents}</span>
              </div>
              <div className="mentor-batch-stat-line">
                <span>Modules Covered:</span>
                <span className="mentor-batch-stat-strong">{b.topicsCovered} / {b.totalTopics}</span>
              </div>
              <div className="mentor-batch-stat-line">
                <span>Class Schedule:</span>
                <span className="mentor-batch-schedule-text">{b.schedule}</span>
              </div>
            </div>

            <div className="mentor-progress-section">
              <div className="mentor-progress-head">
                <span className="mentor-progress-label">Overall Completion</span>
                <span className="mentor-progress-val">{b.progress}%</span>
              </div>
              <div className="mentor-progress-track">
                <div
                  className="mentor-progress-fill"
                  style={{ width: `${b.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
