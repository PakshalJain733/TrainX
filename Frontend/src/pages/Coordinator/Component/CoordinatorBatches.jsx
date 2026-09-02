import React, { useState } from "react";
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  ArrowUpRight,
  Code2,
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Style/CoordinatorBatches.css";

const initialBatchesList = [
  {
    id: "batch-py",
    title: "Python Backend & Cloud Systems",
    code: "PY-BE-2026",
    track: "Backend Engineering",
    trainer: "Prof. Rajesh Sharma",
    timing: "Mon, Wed, Fri · 10:00 AM - 12:00 PM",
    studentsEnrolled: 64,
    progress: 72,
    status: "Active",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: Code2,
    description: "FastAPI, PostgreSQL indexing, Celery distributed tasks, Docker containers, and AWS Cloud deployment."
  },
  {
    id: "batch-dsa",
    title: "Data Structures & Competitive Algorithms",
    code: "DSA-ADV-02",
    track: "Problem Solving & C2C",
    trainer: "Ms. R. Kulkarni",
    timing: "Tue, Thu · 02:00 PM - 04:30 PM",
    studentsEnrolled: 58,
    progress: 88,
    status: "Active",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: Layers,
    description: "Advanced Trees, Dynamic Programming, Graph algorithms, and LeetCode-style problem arrays."
  }
];

export default function CoordinatorBatches() {
  const [batches, setBatches] = useState(initialBatchesList);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    title: "",
    code: "",
    track: "",
    trainer: "",
    timing: "",
    description: "",
    color: "#2563eb",
    bg: "#eff6ff"
  });

  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!newBatch.title || !newBatch.code) return;
    
    const createdBatch = {
      ...newBatch,
      id: "batch-" + Date.now(),
      studentsEnrolled: 0,
      progress: 0,
      status: "Active",
      icon: Code2
    };

    setBatches([...batches, createdBatch]);
    setShowAddModal(false);
    setNewBatch({
      title: "",
      code: "",
      track: "",
      trainer: "",
      timing: "",
      description: "",
      color: "#2563eb",
      bg: "#eff6ff"
    });
  };

  const handleDeleteBatch = (id, event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this batch?")) {
      setBatches(batches.filter((b) => b.id !== id));
      if (selectedBatch && selectedBatch.id === id) {
        setSelectedBatch(null);
      }
    }
  };

  return (
    <div className="student-page-inner stack-6 batches-wrapper">
      {selectedBatch ? (
        <div className="stack-6 animate-fade-in">
          {/* Detailed Batch Header */}
          <div className="batch-details-header">
            <button className="back-btn" onClick={() => setSelectedBatch(null)}>
              <ArrowLeft size={16} /> Back to Batches
            </button>
            <div className="batch-details-meta">
              <h1 className="batch-details-title">{selectedBatch.title}</h1>
              <p className="batch-details-sub">
                {selectedBatch.code} · {selectedBatch.track}
              </p>
            </div>
          </div>

          <div className="batch-details-grid">
            {/* Main Details Info */}
            <div className="batch-details-main stack-4">
              <div className="detail-card shadow-sm stack-4">
                <h3 className="detail-card-title">Batch Information</h3>
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="info-label">Trainer</span>
                    <span className="info-value">{selectedBatch.trainer}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="info-label">Timing</span>
                    <span className="info-value">{selectedBatch.timing}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="info-label">Enrolled Students</span>
                    <span className="info-value">{selectedBatch.studentsEnrolled} Students</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="info-label">Current Progress</span>
                    <span className="info-value">{selectedBatch.progress}% Completed</span>
                  </div>
                </div>
                <div className="detail-desc">
                  <span className="info-label">Description</span>
                  <p className="info-value">{selectedBatch.description}</p>
                </div>
              </div>
            </div>

            {/* Students List placeholder */}
            <div className="batch-details-sidebar stack-4">
              <div className="detail-card shadow-sm stack-3">
                <h3 className="detail-card-title">Enrolled Students</h3>
                <div className="student-mini-list stack-2">
                  <div className="student-mini-item">
                    <span>Ganesh Shinde</span>
                    <Badge variant="success">92% Attendance</Badge>
                  </div>
                  <div className="student-mini-item">
                    <span>Riya Shah</span>
                    <Badge variant="success">95% Attendance</Badge>
                  </div>
                  <div className="student-mini-item">
                    <span>Kabir Menon</span>
                    <Badge>85% Attendance</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Batches Header */}
          <div className="batches-header-row">
            <div>
              <h1 className="batches-page-title">Manage Training Batches</h1>
              <p className="batches-page-subtitle">Track batch progress, trainers, and allocations</p>
            </div>
            <Button className="btn-add-batch" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add New Batch
            </Button>
          </div>

          {/* Batches List Cards */}
          <div className="batches-grid">
            {batches.map((batch) => {
              const IconComp = batch.icon || Code2;
              return (
                <div
                  key={batch.id}
                  className="batch-card shadow-sm"
                  onClick={() => setSelectedBatch(batch)}
                  style={{ "--accent-color": batch.color }}
                >
                  <div className="batch-card-header">
                    <div className="batch-icon-wrap" style={{ backgroundColor: batch.bg, color: batch.color }}>
                      <IconComp size={20} />
                    </div>
                    <div className="batch-actions-menu">
                      <button className="batch-action-btn edit"><Edit2 size={13} /></button>
                      <button className="batch-action-btn delete" onClick={(e) => handleDeleteBatch(batch.id, e)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="batch-card-body stack-2">
                    <span className="batch-track" style={{ color: batch.color }}>{batch.track}</span>
                    <h3 className="batch-title">{batch.title}</h3>
                    <p className="batch-desc-trunc">{batch.description}</p>
                  </div>

                  <div className="batch-card-stats-row">
                    <div className="batch-stat-block">
                      <Users size={14} />
                      <span>{batch.studentsEnrolled} Students</span>
                    </div>
                    <div className="batch-stat-block">
                      <Clock size={14} />
                      <span>{batch.progress}% Progress</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Batch Modal */}
          {showAddModal && (
            <div className="modal-backdrop">
              <div className="modal-content card stack-4 animate-scale-up">
                <div className="modal-header">
                  <h3 className="modal-title">Create Training Batch</h3>
                  <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                </div>
                <form onSubmit={handleAddBatch} className="stack-4">
                  <div className="form-group">
                    <label>Batch Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Java Web Development"
                      value={newBatch.title}
                      onChange={(e) => setNewBatch({ ...newBatch, title: e.target.value })}
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Batch Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JAVA-2026"
                        value={newBatch.code}
                        onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Track Area</label>
                      <input
                        type="text"
                        placeholder="e.g. Full Stack Engineering"
                        value={newBatch.track}
                        onChange={(e) => setNewBatch({ ...newBatch, track: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Trainer Name</label>
                    <input
                      type="text"
                      placeholder="Prof. / Ms. / Mr. Name"
                      value={newBatch.trainer}
                      onChange={(e) => setNewBatch({ ...newBatch, trainer: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Weekly Timings</label>
                    <input
                      type="text"
                      placeholder="e.g. Mon, Wed · 02:00 PM - 04:00 PM"
                      value={newBatch.timing}
                      onChange={(e) => setNewBatch({ ...newBatch, timing: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Brief Description</label>
                    <textarea
                      rows={3}
                      placeholder="Topics covered in this batch"
                      value={newBatch.description}
                      onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                    />
                  </div>
                  <div className="modal-actions">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Batch
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
