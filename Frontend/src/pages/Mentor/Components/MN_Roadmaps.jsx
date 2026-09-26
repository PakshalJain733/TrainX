import React, { useState, useEffect } from "react";
import { Target, Sparkles, Search } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Roadmaps.css";

export default function MentorRoadmaps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roadmapTracks, setRoadmapTracks] = useState([]);

  useEffect(() => {
    apiFetch("/roadmaps")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setRoadmapTracks(res.data);
        } else {
          setRoadmapTracks([]);
        }
      })
      .catch(() => setRoadmapTracks([]));
  }, []);

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

      {/* Main Single Unified Card for Search & Content */}
      <div className="mentor-roadmap-table-container">
        <div className="mentor-search-wrapper" style={{ borderBottom: "1px solid #f1f5f9", borderRadius: "16px 16px 0 0" }}>
          <Search size={16} className="mentor-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll number, or roadmap..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mentor-search-input"
          />
        </div>

        {filteredTracks.length === 0 ? (
          <div className="mentor-roadmaps-empty">
            No matching student roadmaps found.
          </div>
        ) : (
          <table className="mentor-roadmap-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Roadmap Selected</th>
                <th>Roadmap Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((t, index) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>#{index + 1}</td>
                  <td>
                    <div className="mentor-table-student">
                      <div className="mentor-table-avatar">
                        {t.studentName.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="mentor-table-name">{t.studentName}</div>
                        <div className="mentor-table-roll">{t.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mentor-roadmap-batch-tag">{t.batch}</span>
                  </td>
                  <td>
                    <div className="mentor-table-roadmap">{t.name}</div>
                  </td>
                  <td>
                    <div className="mentor-table-progress-wrap">
                      <div className="mentor-table-progress-head">
                        <span>Overall Completion</span>
                        <span className="mentor-table-progress-val">{t.completion}</span>
                      </div>
                      <div className="mentor-table-track">
                        <div className="mentor-table-fill" style={{ width: t.completion }}></div>
                      </div>
                      <div className="mentor-table-milestone">
                        <Sparkles size={12} color="#6366f1" />
                        <span>Milestone: <strong>{t.milestone}</strong></span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
