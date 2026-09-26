import React, { useState, useEffect } from "react";
import { Target, Sparkles, Search, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Roadmaps.css";

const DEFAULT_ROADMAPS = [
  {
    id: "rm-101",
    studentName: "Aarav Sharma",
    rollNo: "2026-CS-001",
    batch: "BE-CS-2026-A",
    name: "Full Stack MERN & Microservices Track",
    completion: "78%",
    milestone: "Node.js & Express Architecture",
    status: "Active"
  },
  {
    id: "rm-102",
    studentName: "Ananya Roy",
    rollNo: "2026-CS-042",
    batch: "BE-CS-2026-A",
    name: "Advanced Data Structures & Algorithms",
    completion: "92%",
    milestone: "Graph Algorithms & Dynamic Programming",
    status: "Active"
  },
  {
    id: "rm-103",
    studentName: "Rohan Gupta",
    rollNo: "2025-IT-015",
    batch: "TE-IT-2026-B",
    name: "AI & Machine Learning Foundations",
    completion: "64%",
    milestone: "Neural Networks with PyTorch",
    status: "Active"
  },
  {
    id: "rm-104",
    studentName: "Siddharth Verma",
    rollNo: "2026-AI-088",
    batch: "BE-EXTC-2026-C",
    name: "Cloud Computing & DevOps Pipelines",
    completion: "45%",
    milestone: "Docker & Kubernetes Deployment",
    status: "Active"
  },
  {
    id: "rm-105",
    studentName: "Priya Nair",
    rollNo: "2027-EC-023",
    batch: "CSE 2026 Alpha Batch",
    name: "System Design & Scalable Architectures",
    completion: "85%",
    milestone: "Redis Caching & Message Queues",
    status: "Active"
  },
  {
    id: "rm-106",
    studentName: "Ketan Kulkarni",
    rollNo: "2026-CS-112",
    batch: "Fullstack React & Node Specialization",
    name: "Cybersecurity & Ethical Hacking",
    completion: "58%",
    milestone: "Penetration Testing & Web Security",
    status: "Active"
  }
];

export default function MentorRoadmaps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [roadmapTracks, setRoadmapTracks] = useState([]);

  useEffect(() => {
    apiFetch("/roadmaps")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setRoadmapTracks(res.data);
        } else {
          setRoadmapTracks(DEFAULT_ROADMAPS);
        }
      })
      .catch(() => setRoadmapTracks(DEFAULT_ROADMAPS));
  }, []);

  const batchesList = Array.from(
    new Set(roadmapTracks.map((t) => t.batch).filter(Boolean))
  );

  const filteredTracks = roadmapTracks.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.rollNo && t.rollNo.toLowerCase().includes(q)) ||
      (t.batch && t.batch.toLowerCase().includes(q));

    const matchesBatch =
      selectedBatch === "all" || t.batch === selectedBatch;

    return matchesQuery && matchesBatch;
  });

  return (
    <div className="mentor-roadmaps-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Target size={22} color="#4f46e5" />
            <span>Student Adaptive Curriculum Roadmaps</span>
          </h2>
          <p className="mentor-page-subtitle">
            Track individual student learning pathways, module completion, and AI recommendations
          </p>
        </div>
      </div>

      {/* Control Search & Filter Card */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '440px' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search student name, roll number, or roadmap..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
              background: '#f8fafc',
              color: '#0f172a',
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#6366f1'; }}
            onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Filter Batch:</span>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1e293b',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Batches ({roadmapTracks.length})</option>
            {batchesList.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Unified Table Card */}
      <div className="mentor-roadmap-table-container">
        {filteredTracks.length === 0 ? (
          <div className="mentor-roadmaps-empty" style={{ padding: '48px 24px' }}>
            <BookOpen size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>
              No matching student roadmaps found.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Try adjusting your search criteria or clear batch filters.
            </p>
          </div>
        ) : (
          <table className="mentor-roadmap-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Sr No</th>
                <th>Student Roster</th>
                <th>Batch Cohort</th>
                <th>Adaptive Roadmap</th>
                <th>Roadmap Progress & Milestone</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((t, index) => {
                const initials = (t.studentName || "Student")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={t.id || index}>
                    <td style={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
                      #{index + 1}
                    </td>
                    <td>
                      <div className="mentor-table-student">
                        <div className="mentor-table-avatar">
                          {initials}
                        </div>
                        <div>
                          <div className="mentor-table-name">{t.studentName}</div>
                          <div className="mentor-table-roll">{t.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mentor-roadmap-batch-tag">
                        {t.batch}
                      </span>
                    </td>
                    <td>
                      <div className="mentor-table-roadmap">
                        {t.name}
                      </div>
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
                          <Sparkles size={13} color="#6366f1" />
                          <span>Milestone: <strong>{t.milestone}</strong></span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
