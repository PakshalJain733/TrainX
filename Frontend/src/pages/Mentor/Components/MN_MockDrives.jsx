import React from 'react';
import { mentorMockDrives } from '../../../data/mentorMockData';
import { ClipboardCheck, Plus } from 'lucide-react';
import "../Styles/MN_MockDrives.css";

export default function MockDrives() {
  const getStatusClass = (status) => {
    if (status === 'Active Today') return 'mentor-mockdrive-status--active';
    if (status === 'Upcoming') return 'mentor-mockdrive-status--upcoming';
    return 'mentor-mockdrive-status--past';
  };

  return (
    <div className="mentor-mockdrives-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <ClipboardCheck size={20} color="#4f46e5" />
            <span>Placement Mock Drives & Code Tests</span>
          </h2>
          <p className="mentor-page-subtitle">Industry partner placement drives, target cutoffs, and student enrollment</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Nominate Students for Drive</span>
        </button>
      </div>

      <div className="mentor-mockdrives-grid">
        {mentorMockDrives.map((d) => (
          <div key={d.id} className="mentor-mockdrive-card">
            <div className="mentor-mockdrive-header">
              <span className={`mentor-mockdrive-status ${getStatusClass(d.status)}`}>
                {d.status}
              </span>
              <span className="mentor-mockdrive-date">{d.date}</span>
            </div>

            <h3 className="mentor-mockdrive-title">{d.title}</h3>

            <div className="mentor-mockdrive-stats">
              <div className="mentor-mockdrive-stat-row">
                <span>Registered Students:</span>
                <span className="mentor-mockdrive-stat-val">{d.registered}</span>
              </div>
              <div className="mentor-mockdrive-stat-row">
                <span>Pass Cutoff Criteria:</span>
                <span className="mentor-mockdrive-stat-val--green">{d.passCutoff}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
