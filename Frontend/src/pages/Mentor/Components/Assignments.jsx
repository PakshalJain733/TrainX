import React, { useState, useEffect } from 'react';
import { FileCode, Plus, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/SkillGaps.css';
import '../Styles/Assignments.css';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/assignments")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.assignments)) {
          setAssignments(res.data.assignments);
        }
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mentor-assignments-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <FileCode size={20} color="#4f46e5" />
            <span>Assignments & Submission Queue</span>
          </h2>
          <p className="mentor-page-subtitle">Programming tasks published to your batches with real submission counts</p>
        </div>

        <button className="mentor-btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <Plus size={16} />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
          <p style={{ fontSize: 13 }}>Loading assignments...</p>
        </div>
      ) : (
        <div className="mentor-assignments-list">
          {assignments.length === 0 && (
            <div className="mentor-table-card">
              <div className="mentor-empty-table-cell" style={{ padding: '48px', textAlign: 'center' }}>
                No assignments published yet.
              </div>
            </div>
          )}
          {assignments.map((a) => {
            const evaluated = 0;
            const pending = (a.submitted || 0) - evaluated;
            return (
              <div key={a.id} className="mentor-assignment-card">
                <div className="mentor-assign-header">
                  <div>
                    <span className="mentor-assign-batch-tag">{a.batch}</span>
                    <h3 className="mentor-assign-title">{a.title}</h3>
                    <p className="mentor-assign-duedate">Due Date: {a.deadline} · {a.topic} · {a.difficulty} · {a.points} pts</p>
                  </div>

                  <span className={`mentor-assign-status ${pending === 0 ? 'mentor-assign-status--completed' : 'mentor-assign-status--pending'}`}>
                    {pending === 0 ? 'No Pending' : 'Pending Review'}
                  </span>
                </div>

                <div className="mentor-assign-stats-grid">
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Submissions Received:</span>
                    <p className="mentor-assign-stat-val">{a.submitted || 0} / {a.total || 0}</p>
                  </div>
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Evaluated:</span>
                    <p className="mentor-assign-stat-val mentor-assign-stat-val--green">{evaluated}</p>
                  </div>
                  <div className="mentor-assign-stat-box">
                    <span className="mentor-assign-stat-label">Pending Review:</span>
                    <p className="mentor-assign-stat-val mentor-assign-stat-val--rose">{pending}</p>
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