import React from 'react';
import { mentorLiveSessions, mentorStudentDoubts } from '../../../data/mentorMockData';
import { Video, Plus, Clock, ExternalLink } from 'lucide-react';
import '../Styles/SkillGaps.css';
import '../Styles/LiveSessions.css';

export default function LiveSessions() {
  return (
    <div className="mentor-livesessions-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Video size={20} color="#4f46e5" />
            <span>Live Classes & Doubts Desk</span>
          </h2>
          <p className="mentor-page-subtitle">Schedule live lecture sessions, launch meeting rooms, and resolve student doubt tickets</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Schedule Live Class</span>
        </button>
      </div>

      <div className="mentor-livesessions-grid">
        {/* Left: Scheduled Sessions */}
        <div className="mentor-column-block">
          <h3 className="mentor-col-heading">Upcoming Live Sessions</h3>
          {mentorLiveSessions.map((s) => (
            <div key={s.id} className="mentor-session-card">
              <div className="mentor-session-top">
                <span className="mentor-batch-code-tag">{s.batch}</span>
                <span className="mentor-status-tag mentor-status-tag--indigo">
                  {s.status}
                </span>
              </div>
              <h4 className="mentor-session-title">{s.title}</h4>
              <p className="mentor-session-time">
                <Clock size={14} color="#4f46e5" /> {s.time}
              </p>
              <a
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="mentor-session-launch-btn"
              >
                <span>Launch Meeting Room</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>

        {/* Right: Doubts Ticket Queue */}
        <div className="mentor-column-block">
          <h3 className="mentor-col-heading">Student Doubts Queue</h3>
          <div className="mentor-doubts-card">
            {mentorStudentDoubts.map((d) => (
              <div key={d.id} className="mentor-doubt-item">
                <div className="mentor-session-top">
                  <span className="mentor-doubt-student">{d.student}</span>
                  <span className="mentor-doubt-status">{d.status}</span>
                </div>
                <p className="mentor-doubt-text">{d.doubt}</p>
                <div className="mentor-doubt-meta">
                  <span>{d.batch} · {d.time}</span>
                  <button className="mentor-doubt-reply-btn">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
