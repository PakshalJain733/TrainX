import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Layers, Plus } from 'lucide-react';
import "../Styles/MN_Batches.css";

export default function Batches() {
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setBatchesList(res.data);
        } else {
          setBatchesList([]);
        }
      })
      .catch(() => setBatchesList([]))
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
          <p className="mentor-page-subtitle">Course schedules, syllabus completion, enrolled students, and cohort progress</p>
        </div>

        <button className="mentor-btn-primary">
          <Plus size={16} />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="mentor-batches-grid">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>Loading allocated batches...</div>
        ) : batchesList.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px", gridColumn: "1 / -1" }}>
            No training batches allocated yet.
          </div>
        ) : (
          batchesList.map((b, idx) => (
            <div key={b.id || idx} className="mentor-batch-card-main">
              <div className="mentor-batch-top-row">
                <span className="mentor-batch-code-tag">
                  {b.code || b.year || "BATCH"}
                </span>
                <span className="mentor-status-tag mentor-status-tag--emerald">
                  {b.status || "Active"}
                </span>
              </div>

              <div className="mentor-batch-details-block">
                <h3 className="mentor-batch-main-title">{b.name}</h3>
                <p className="mentor-batch-college-sub">{b.college_name || b.college || "College"}</p>
                <p className="mentor-batch-dept-sub">{b.department || "Department"}</p>
              </div>

              <div className="mentor-batch-stats-stack">
                <div className="mentor-batch-stat-line">
                  <span>Enrolled Students:</span>
                  <span className="mentor-batch-stat-strong">{b.students || b.enrolledStudents || 0}</span>
                </div>
                <div className="mentor-batch-stat-line">
                  <span>Class Schedule:</span>
                  <span className="mentor-batch-schedule-text">{b.schedule || "TBD"}</span>
                </div>
              </div>

              <div className="mentor-progress-section">
                <div className="mentor-progress-head">
                  <span className="mentor-progress-label">Overall Completion</span>
                  <span className="mentor-progress-val">{b.progress || 0}%</span>
                </div>
                <div className="mentor-progress-track">
                  <div
                    className="mentor-progress-fill"
                    style={{ width: `${b.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
