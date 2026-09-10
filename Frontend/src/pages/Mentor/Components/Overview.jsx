import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentorProfile, mentorBatches, mentorAssignments, mentorLiveSessions } from '../../../data/mentorMockData';
import { Layers, Users, Video, FileCode, Clock, Star, Sparkles, Layers3, Calendar, PlusCircle, ArrowUpRight } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
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
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) return u;
    } catch (e) {}
    return mentorProfile;
  });

  const [batches, setBatches] = useState(mentorBatches);
  const [assessments, setAssessments] = useState([]);
  const [studentCount, setStudentCount] = useState(mentorProfile.totalStudentsAssigned);
  const [liveSessions, setLiveSessions] = useState(mentorLiveSessions);

  useEffect(() => {
    // Sync Batches
    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setBatches(res.data.map((b, idx) => ({
            id: b.id || idx,
            code: b.code || b.batch_code || `BATCH-0${idx + 1}`,
            name: b.name || b.batch_name || "Training Cohort",
            college: b.college_name || "PVPPCOE",
            department: b.department || "Computer Engineering",
            progress: b.progress || 70,
            status: "Active",
          })));
        }
      })
      .catch(() => {});

    // Sync Quizzes/Assessments
    apiFetch("/assessments")
      .then((res) => {
        if (res && res.data) {
          setAssessments(res.data);
        }
      })
      .catch(() => {});

    // Fetch Live Sessions from MySQL DB
    apiFetch("/shared-content?type=session")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setLiveSessions(res.data.map(item => item.data || item));
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      apiFetch("/auth/me").then(res => {
        if (res && res.data) setUser(res.data);
      }).catch(() => {});
    };

    window.addEventListener("userProfileUpdated", handleUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
    };
  }, []);

  const userName = user.name || mentorProfile.name || "Vikram Sharma";
  const userDept = user.department || mentorProfile.department || "Computer Engineering & IT";
  const userSpec = user.specialization || mentorProfile.specialization || "Full Stack & System Architecture";
  const userRating = user.rating || mentorProfile.rating || 4.9;

  return (
    <div className="mentor-overview-container">
      {/* Radiant Welcome Hero Banner - Identical to Student Overview */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(userName)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> MENTOR & INSTRUCTOR WORKSPACE
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {userName}!
            </h1>
            <p className="overview-hero-desc">
              {userDept} | {userSpec} | Rating: {userRating} / 5.0
            </p>
          </div>
        </div>

        <div className="overview-hero-actions">
          <div className="mentor-hero-stat-badge">
            <span className="mentor-stat-badge-num">{mentorProfile.allocatedBatchesCount || 3}</span>
            <span className="mentor-stat-badge-lbl">Active Cohorts</span>
          </div>
          <div className="mentor-hero-stat-badge">
            <span className="mentor-stat-badge-num">{mentorProfile.totalStudentsAssigned || 140}</span>
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
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Total Students</p>
            <h3 className="mentor-kpi-value">{mentorProfile.totalStudentsAssigned}</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--indigo">94% active participation</span>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Defaulters</p>
            <h3 className="mentor-kpi-value">2 Students</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--amber">Low Attendance</span>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div>
            <p className="mentor-kpi-label">Pending Code Reviews</p>
            <h3 className="mentor-kpi-value">14 Submissions</h3>
            <span className="mentor-kpi-sub mentor-kpi-sub--rose">Require feedback</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="mentor-grid-split">
        {/* Left: Batches Overview */}
        <div className="mentor-section-card">
          <div className="mentor-section-header">
            <h3 className="mentor-section-title">Allocated Training Batches</h3>
            <Link to="/mentor/batches" className="mentor-link-arrow">View All Batches</Link>
          </div>

          <div className="mentor-card-list">
            {batches.map((b) => (
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

        {/* Right: Upcoming Training Sessions */}
        <div className="mentor-section-card">
          <div className="mentor-section-header">
            <h3 className="mentor-section-title">
              <Video size={18} color="#4f46e5" />
              <span>Upcoming Training Sessions</span>
            </h3>
            <Link to="/mentor/sessions" className="mentor-link-arrow">View Schedule</Link>
          </div>

          <div className="mentor-card-list">
            {liveSessions.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No upcoming training sessions scheduled.
              </p>
            ) : (
              liveSessions.map((s) => (
                <div key={s.id} className="mentor-live-card">
                  <span className="mentor-live-badge">{s.status}</span>
                  <h4 className="mentor-live-title">{s.title}</h4>
                  <p className="mentor-live-batch">{s.batch}</p>
                  <p className="mentor-live-time">
                    <Clock size={14} color="#4f46e5" /> {s.time || `${s.date} ${s.time}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
