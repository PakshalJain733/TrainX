import { useState } from "react";
import { Plus, Search, Users, UserCheck, Calendar, CheckCircle } from "lucide-react";
import { coordinatorBatches, coordinatorMentors } from "../../../data/coordinatorMockData";
import "../Styles/Batches.css";

export default function CoordinatorBatches() {
  const [batches, setBatches] = useState(coordinatorBatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New batch form state
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newMentor, setNewMentor] = useState(coordinatorMentors[0].name);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.mentor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchCode.trim()) return;

    const created = {
      id: Date.now(),
      name: newBatchName,
      code: newBatchCode,
      college: "Apex Institute of Technology",
      department: "Computer Science & Engineering",
      enrolledStudents: 60,
      progress: 0,
      schedule: "Mon, Wed, Fri (02:00 PM - 04:00 PM)",
      nextSession: "Next Mon at 02:00 PM",
      mentor: newMentor,
      status: "Active",
      avgAttendance: 100,
      avgQuizScore: 0,
      topPerformer: "N/A",
      defaultersCount: 0,
    };

    setBatches([created, ...batches]);
    setShowCreateModal(false);
    setNewBatchName("");
    setNewBatchCode("");
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Batches Governance</h1>
          <p className="coord-page-sub">
            Manage training cohorts, allocate industry mentors, and track syllabus completion.
          </p>
        </div>
        <button
          className="coord-btn coord-btn--primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> Create New Batch
        </button>
      </div>

      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search batch name, code or mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="coord-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Near Completion">Near Completion</option>
        </select>
      </div>

      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Batch Details</th>
              <th>Enrolled</th>
              <th>Assigned Mentor</th>
              <th>Completion Progress</th>
              <th>Avg Attendance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="coord-cell-main">{b.name}</div>
                  <div className="coord-cell-sub">
                    {b.code} · {b.department}
                  </div>
                </td>
                <td>
                  <div className="coord-cell-flex">
                    <Users size={14} color="#64748b" /> {b.enrolledStudents} Students
                  </div>
                </td>
                <td>
                  <div className="coord-cell-flex">
                    <UserCheck size={14} color="#4f46e5" /> {b.mentor}
                  </div>
                </td>
                <td>
                  <div className="coord-progress-wrap">
                    <div className="coord-progress-head">
                      <span className="coord-progress-text">{b.progress}%</span>
                    </div>
                    <div className="coord-progress-track">
                      <div
                        className="coord-progress-bar"
                        style={{
                          width: `${b.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 700,
                      color: b.avgAttendance >= 90 ? "#059669" : b.avgAttendance >= 80 ? "#d97706" : "#dc2626",
                    }}
                  >
                    {b.avgAttendance}%
                  </span>
                </td>
                <td>
                  <span
                    className={b.status === "Active" ? "coord-status-badge--active" : "coord-status-badge--default"}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  <button
                    className="coord-btn coord-btn--manage"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Batch Creation */}
      {showCreateModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="coord-modal-title">Create New Batch</h2>
            <form onSubmit={handleCreateBatch} className="coord-modal-form">
              <div>
                <label className="coord-form-label">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Beta Cohort"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Batch Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-2026-B"
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div>
                <label className="coord-form-label">Assign Industry Mentor</label>
                <select
                  value={newMentor}
                  onChange={(e) => setNewMentor(e.target.value)}
                  className="coord-form-input"
                >
                  {coordinatorMentors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="coord-modal-actions">
                <button
                  type="button"
                  className="coord-btn coord-btn--cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="coord-btn coord-btn--primary">
                  Save & Launch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
