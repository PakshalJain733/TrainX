import React from 'react';
import { Target } from 'lucide-react';
import '../Styles/Roadmaps.css';

export default function Roadmaps() {
  const tracks = [];

  return (
    <div className="mentor-roadmaps-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Target size={20} color="#4f46e5" />
            <span>Batch Adaptive Roadmaps</span>
          </h2>
          <p className="mentor-page-subtitle">AI-generated curriculum pathways and module progression across allocated cohorts</p>
        </div>
      </div>

      <div className="mentor-roadmaps-grid">
        {tracks.length === 0 ? (
          <div className="mentor-roadmaps-empty">
            No batch roadmaps generated yet.
          </div>
        ) : (
          tracks.map((t) => (
            <div key={t.id} className="mentor-roadmap-card">
              <span className="mentor-roadmap-batch-tag">
                {t.batch}
              </span>
              <h3 className="mentor-roadmap-title">{t.name}</h3>

              <div className="mentor-roadmap-progress-wrap">
                <div className="mentor-roadmap-progress-head">
                  <span className="mentor-roadmap-progress-label">Curriculum Completion</span>
                  <span className="mentor-roadmap-progress-val">{t.completion}</span>
                </div>
                <div className="mentor-roadmap-track">
                  <div
                    className="mentor-roadmap-fill"
                    style={{ width: t.completion }}
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
