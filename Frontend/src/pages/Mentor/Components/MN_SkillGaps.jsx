import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Sparkles, X, Send, Search } from 'lucide-react';
import "../Styles/MN_SkillGaps.css";

const initialSkillGaps = [];

export default function MentorSkillGaps() {
  const [skillGaps] = useState(initialSkillGaps);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [assignmentTopic, setAssignmentTopic] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const filteredSkillGaps = skillGaps.filter((g) => {
    const q = searchTerm.toLowerCase();
    return (
      g.topic.toLowerCase().includes(q) ||
      g.batch.toLowerCase().includes(q) ||
      g.priority.toLowerCase().includes(q) ||
      (g.studentName && g.studentName.toLowerCase().includes(q)) ||
      (g.rollNo && g.rollNo.toLowerCase().includes(q))
    );
  });

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'mentor-priority-badge--high';
      case 'medium': return 'mentor-priority-badge--medium';
      case 'low': return 'mentor-priority-badge--low';
      default: return '';
    }
  };

  const handleSendRemedial = (e) => {
    e.preventDefault();
    setToastMessage(`Remedial Assignment "${assignmentTopic || 'Concept Booster'}" successfully dispatched to ${selectedStudent === 'all' ? 'target batch' : selectedStudent}!`);
    setIsModalOpen(false);
    setAssignmentTopic("");
    setDueDate("");
    setTimeout(() => setToastMessage(""), 5000);
  };

  return (
    <div className="mentor-skillgaps-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <AlertCircle size={20} color="#e11d48" />
            <span>AI Skill Gap Diagnostics & Weak Spot Mapping</span>
          </h2>
          <p className="mentor-page-subtitle">Identify weak concepts across student batches and trigger targeted AI remedial assignments</p>
        </div>
        <button className="mentor-btn-primary" onClick={() => setIsModalOpen(true)}>
          <Sparkles size={16} />
          <span>Trigger Remedial Assignment</span>
        </button>
      </div>

      {toastMessage && (
        <div className="mentor-toast-banner">
          <CheckCircle2 size={18} color="#047857" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mentor-search-wrapper">
        <Search size={16} className="mentor-search-icon" />
        <input
          type="text"
          placeholder="Search student name, roll number, or concept topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mentor-search-input"
        />
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name & Roll No</th>
                <th>Topic / Concept Area</th>
                <th>Affected Batch</th>
                <th>Deficiency Rate</th>
                <th>Avg Test Score</th>
                <th>Remedial Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkillGaps.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mentor-empty-table-cell">
                    No skill gap diagnostics found matching search.
                  </td>
                </tr>
              ) : (
                filteredSkillGaps.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="mentor-student-cell">
                        <p className="mentor-student-name">{g.studentName || "Rahul Mehta"}</p>
                        <p className="mentor-student-college">{g.rollNo || "CSE26-001"}</p>
                      </div>
                    </td>
                    <td className="mentor-skillgap-topic">{g.topic}</td>
                    <td className="mentor-skillgap-batch">{g.batch}</td>
                    <td className="mentor-skillgap-deficiency">{g.deficiencyRate}</td>
                    <td className="mentor-skillgap-score">{g.avgScore}</td>
                    <td>
                      <span className={`mentor-priority-badge ${getPriorityClass(g.priority)}`}>
                        {g.priority} Priority
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trigger Remedial Assignment Modal */}
      {isModalOpen && createPortal(
        <div className="mentor-modal-backdrop">
          <div className="mentor-modal-card">
            <div className="mentor-modal-header">
              <div className="mentor-modal-title-wrap">
                <Sparkles size={20} color="#4f46e5" />
                <h3 className="mentor-modal-title">
                  Trigger AI Remedial Assignment
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="mentor-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendRemedial} className="mentor-modal-form">
              <div className="mentor-form-group">
                <label className="mentor-form-label">
                  Target Student / Batch
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="mentor-form-control"
                >
                  <option value="all">All High & Medium Priority Students (Deficient Concept)</option>
                  {skillGaps.map(s => (
                    <option key={s.id} value={s.studentName}>{s.studentName} ({s.rollNo}) - {s.topic}</option>
                  ))}
                </select>
              </div>

              <div className="mentor-form-group">
                <label className="mentor-form-label">
                  Remedial Topic / Practice Module
                </label>
                <input
                  type="text"
                  value={assignmentTopic}
                  onChange={(e) => setAssignmentTopic(e.target.value)}
                  placeholder="e.g. Dynamic Programming Practice Set"
                  className="mentor-form-control"
                  required
                />
              </div>

              <div className="mentor-form-group">
                <label className="mentor-form-label">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mentor-form-control"
                  required
                />
              </div>

              <div className="mentor-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mentor-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mentor-btn-submit"
                >
                  <Send size={16} />
                  <span>Assign Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
