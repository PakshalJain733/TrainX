import React from 'react';
import { mentorProfile, mentorBatches, mentorAssignments, mentorLiveSessions } from '../../../data/mentorMockData';
import { Layers, Users, Video, FileCode, Clock, Star, Sparkles, Layers3, Calendar, PlusCircle, ArrowUpRight } from 'lucide-react';
import '../Styles/Overview.css';

const getInitials = (name) => {
  if (!name || name.trim().length === 0) return "VS";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Overview() {
  return (
    <div className="mentor-overview-container">
      {/* Radiant Welcome Hero Banner - Identical to Student Overview */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(mentorProfile.name)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR & INSTRUCTOR WORKSPACE
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {mentorProfile.name}!
            </h1>
            <p className="overview-hero-desc">
              {mentorProfile.department} | {mentorProfile.specialization} | Rating: {mentorProfile.rating} / 5.0
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <div className="mentor-hero-stat-badge">
            <span className="mentor-stat-badge-num">{mentorProfile.allocatedBatchesCount}</span>
            <span className="mentor-stat-badge-lbl">Active Cohorts</span>
          </div>
          <div className="mentor-hero-stat-badge">
            <span className="mentor-stat-badge-num">{mentorProfile.totalStudentsAssigned}</span>
            <span className="mentor-stat-badge-lbl">Students</span>
          </div>
        </div>
      </div>


      {/* Top Quick Metric Cards */}
      <div className="mentor-kpi-grid">
        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Active Batches</p>
            <h3 className="mentor-kpi-value">{mentorProfile.allocatedBatchesCount}</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--emerald">All cohorts on track</span>
          </div>
          <div className="mentor-kpi-icon-box mentor-kpi-icon-box--indigo">
            <Layers size={20} />
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Total Students</p>
            <h3 className="mentor-kpi-value">{mentorProfile.totalStudentsAssigned}</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--indigo">94% active participation</span>
          </div>
          <div className="mentor-kpi-icon-box mentor-kpi-icon-box--emerald">
            <Users size={20} />
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Live Classes Today</p>
            <h3 className="mentor-kpi-value">1 Session</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--amber">Starts 02:00 PM</span>
          </div>
          <div className="mentor-kpi-icon-box mentor-kpi-icon-box--amber">
            <Video size={20} />
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Pending Code Reviews</p>
            <h3 className="mentor-kpi-value">14 Submissions</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--rose">Require feedback</span>
          </div>
          <div className="mentor-kpi-icon-box mentor-kpi-icon-box--rose">
            <FileCode size={20} />
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="mentor-grid-split">
        {/* Left: Batches Overview */}
        <div className="mentor-section-card">
          <div className="mentor-section-header">
            <h3 className="mentor-section-title">Allocated Training Batches</h3>
            <span className="mentor-link-arrow">View All Batches</span>
          </div>

          <div className="mentor-card-list">
            {mentorBatches.map((b) => (
              <div key={b.id} className="mentor-batch-card">
                <div className="mentor-batch-header">
                  <div>
                    <span className="mentor-batch-code-tag">{b.code}</span>
                    <h4 className="mentor-batch-name">{b.name}</h4>
                    <p className="mentor-batch-dept">{b.college} · {b.department}</p>
                  </div>
                  <span className="mentor-status-tag mentor-status-tag--emerald">
                    {b.status}
                  </span>
                </div>

                <div className="mentor-progress-section">
                  <div className="mentor-progress-head">
                    <span className="mentor-progress-label">Syllabus Progress</span>
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

        {/* Right: Live Session & Pending Tasks */}
        <div className="mentor-section-card">
          <h3 className="mentor-section-title">
            <Video size={18} color="#4f46e5" />
            <span>Upcoming Live Session</span>
          </h3>

          <div className="mentor-card-list">
            {mentorLiveSessions.map((s) => (
              <div key={s.id} className="mentor-live-card">
                <span className="mentor-live-badge">{s.status}</span>
                <h4 className="mentor-live-title">{s.title}</h4>
                <p className="mentor-live-batch">{s.batch}</p>
                <p className="mentor-live-time">
                  <Clock size={14} color="#4f46e5" /> {s.time}
                </p>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mentor-live-btn"
                >
                  Join Meeting Room
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
