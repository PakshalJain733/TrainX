import React, { useState } from "react";
import { Target, Sparkles, Search } from "lucide-react";
import "../Styles/MN_Roadmaps.css";

const initialRoadmapTracks = [];

export default function MentorRoadmaps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roadmapTracks] = useState(initialRoadmapTracks);

  const filteredTracks = roadmapTracks.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.rollNo && t.rollNo.toLowerCase().includes(q)) ||
      t.batch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mentor-roadmaps-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Target size={20} color="#4f46e5" />
            <span>Student Adaptive Curriculum Roadmaps</span>
          </h2>
          <p className="mentor-page-subtitle">Track individual student learning pathways, module completion, and AI recommendations</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mentor-search-wrapper">
        <Search size={16} className="mentor-search-icon" />
        <input
          type="text"
          placeholder="Search student name, roll number, or roadmap..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mentor-search-input"
        />
      </div>

      <div className="mentor-roadmaps-grid">
        {filteredTracks.length === 0 ? (
          <div className="mentor-roadmaps-empty">
            No matching student roadmaps found.
          </div>
        ) : (
          filteredTracks.map((t) => (
            <div key={t.id} className="mentor-roadmap-card">
              {/* Student Header */}
              {t.studentName && (
                <div className="mentor-roadmap-student-header">
                  <div className="mentor-roadmap-avatar">
                    {t.studentName.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <h4 className="mentor-roadmap-student-name">{t.studentName}</h4>
                    <p className="mentor-roadmap-student-roll">{t.rollNo || "CSE26-001"}</p>
                  </div>
                </div>
              )}

              <div className="mentor-roadmap-meta-row">
                <span className="mentor-roadmap-batch-tag">
                  {t.batch}
                </span>
                <span className="mentor-roadmap-modules-count">{t.modules}</span>
              </div>

              <h3 className="mentor-roadmap-title">{t.name}</h3>

              <div className="mentor-roadmap-progress-wrap">
                <div className="mentor-roadmap-progress-head">
                  <span className="mentor-roadmap-progress-label">Curriculum Progress</span>
                  <span className="mentor-roadmap-progress-val">{t.completion}</span>
                </div>
                <div className="mentor-roadmap-track">
                  <div
                    className="mentor-roadmap-fill"
                    style={{ width: t.completion }}
                  />
                </div>
              </div>

              {t.nextTopic && (
                <div className="mentor-roadmap-next-focus">
                  <Sparkles size={14} color="#6366f1" />
                  <span>Next Focus: <strong>{t.nextTopic}</strong></span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
