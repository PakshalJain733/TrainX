import { useState, useEffect } from 'react';
import { Layers, RefreshCw, Users, CalendarDays, Inbox } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/SkillGaps.css';
import '../Styles/Overview.css';
import '../Styles/Batches.css';

const progressTone = (p) => {
  if (p >= 80) return 'emerald';
  if (p >= 50) return 'indigo';
  return 'amber';
};

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/mentor/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.batches)) {
          setBatches(res.data.batches);
        }
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mentor-batches-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Layers size={20} color="#4f46e5" />
            <span>My Allocated Batches</span>
          </h2>
          <p className="mentor-page-subtitle">Course schedules, enrolled students, and cohort progress</p>
        </div>
      </div>

      {loading ? (
        <div className="mentor-card-state">
          <RefreshCw className="mentor-card-state-spinner" size={24} />
          <p className="mentor-card-state-text">Loading assigned batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="mentor-batch-empty">
          <Inbox size={28} />
          <p className="mentor-batch-empty-title">No batches assigned</p>
          <p className="mentor-batch-empty-sub">You will see your allocated batches here once they are assigned.</p>
        </div>
      ) : (
        <div className="mentor-batches-grid">
          {batches.map((b) => {
            const isActive = String(b.status || 'Active').toLowerCase() === 'active';
            const joinCode = b.code && String(b.code).trim() && String(b.code).trim() !== String(b.name).trim()
              ? b.code.trim()
              : null;
            const progress = Number(b.progress) || 0;
            const tone = progressTone(progress);
            const meta = [
              b.division ? `Division ${b.division}` : null,
              b.year ? `Year ${b.year}` : null,
            ].filter(Boolean);

            return (
              <div key={b.id} className="mentor-batch-card-main">
                <div className="mentor-batch-top-row">
                  <span className={`mentor-status-tag ${isActive ? 'mentor-status-tag--emerald' : 'mentor-status-tag--slate'}`}>
                    {b.status || 'Active'}
                  </span>
                  {joinCode && <span className="mentor-batch-code-tag">{joinCode}</span>}
                </div>

                <div className="mentor-batch-details-block">
                  <h3 className="mentor-batch-main-title">{b.name}</h3>
                  <p className="mentor-batch-college-sub">{b.department}</p>
                  {meta.length > 0 && <p className="mentor-batch-dept-sub">{meta.join(' · ')}</p>}
                </div>

                <div className="mentor-batch-stats-stack">
                  <div className="mentor-batch-stat-line">
                    <span className="mentor-batch-stat-icon">
                      <Users size={14} />
                      <span>Enrolled Students</span>
                    </span>
                    <span className="mentor-batch-stat-strong">{b.enrolledStudents}</span>
                  </div>
                  <div className="mentor-batch-stat-line">
                    <span className="mentor-batch-stat-icon">
                      <CalendarDays size={14} />
                      <span>Class Schedule</span>
                    </span>
                    <span className="mentor-batch-schedule-text">{b.schedule || 'Weekdays'}</span>
                  </div>
                </div>

                <div className="mentor-progress-section">
                  <div className="mentor-progress-head">
                    <span className="mentor-progress-label">Overall Completion</span>
                    <span className={`mentor-progress-val mentor-progress-val--${tone}`}>{progress}%</span>
                  </div>
                  <div className="mentor-progress-track">
                    <div
                      className={`mentor-progress-fill mentor-progress-fill--${tone}`}
                      style={{ width: `${Math.max(progress, progress > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}