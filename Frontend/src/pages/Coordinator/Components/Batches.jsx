import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Users, UserCheck, Calendar, CheckCircle, CheckSquare, Square, ChevronDown, Check } from "lucide-react";
import { coordinatorBatches, coordinatorMentors, coordinatorStudents } from "../../../data/coordinatorMockData";
import "../Styles/Batches.css";

/* ── Inline dropdown for Coordinator Batches (CSS: Batches.css .coord-batch-select-*) ── */
function CoordBatchSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`coord-batch-select-wrap${isOpen ? ' coord-batch-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`coord-batch-select-trigger${isOpen ? ' coord-batch-select-trigger--open' : ''}`}>
        {Icon && <Icon className="coord-batch-select-icon" />}
        <span className="coord-batch-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`coord-batch-select-arrow${isOpen ? ' coord-batch-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="coord-batch-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`coord-batch-select-option${isSel ? ' coord-batch-select-option--selected' : ''}`}>
                <span className="coord-batch-select-option-label">{opt.label}</span>
                {isSel && <Check className="coord-batch-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorBatches() {
  const location = useLocation();
  const [batches, setBatches] = useState(coordinatorBatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true" || location.state?.openCreateModal) {
      setShowCreateModal(true);
    }
  }, [location]);

  // New batch form state
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newMentor, setNewMentor] = useState(coordinatorMentors[0]?.name || "");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.mentor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudents = coordinatorStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === coordinatorStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(coordinatorStudents.map((s) => s.id));
    }
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchCode.trim()) return;

    const created = {
      id: Date.now(),
      name: newBatchName,
      code: newBatchCode,
      college: "Apex Institute of Technology",
      department: "Computer Science & Engineering",
      enrolledStudents: selectedStudentIds.length,
      selectedStudentIds: selectedStudentIds,
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
    setSelectedStudentIds([]);
    setStudentSearch("");
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

      <div className="coord-filter-bar" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#64748b" }} />
          <input
            type="text"
            className="coord-search-input"
            placeholder="Search batch name, code or mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", width: "100%" }}
          />
        </div>
        <CoordBatchSelect
          value={statusFilter}
          options={[
            { value: "All", label: "All Statuses" },
            { value: "Active", label: "Active" },
            { value: "Near Completion", label: "Near Completion" },
          ]}
          onChange={(val) => setStatusFilter(val)}
        />
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
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{b.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {b.code} · {b.department}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={14} color="#64748b" /> {b.enrolledStudents} Students
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <UserCheck size={14} color="#4f46e5" /> {b.mentor}
                  </div>
                </td>
                <td>
                  <div style={{ width: "140px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 700, color: "#4f46e5" }}>{b.progress}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${b.progress}%`,
                          background: "#4f46e5",
                          borderRadius: "999px",
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
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: b.status === "Active" ? "#ecfdf5" : "#eff6ff",
                      color: b.status === "Active" ? "#047857" : "#1d4ed8",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  <button
                    className="coord-btn"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "#f1f5f9", color: "#334155" }}
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
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Create New Batch</h2>
            <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Beta Cohort"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Batch Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-2026-B"
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Assign Industry Mentor</label>
                <CoordBatchSelect
                  value={newMentor}
                  options={coordinatorMentors.map((m) => ({
                    value: m.name,
                    label: `${m.name} (${m.specialization})`
                  }))}
                  onChange={(val) => setNewMentor(val)}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    Select Students ({selectedStudentIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllStudents}
                    style={{ fontSize: "11px", fontWeight: 700, color: "#4f46e5", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {selectedStudentIds.length === coordinatorStudents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div style={{ position: "relative", marginBottom: "6px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "8px", color: "#64748b" }} />
                  <input
                    type="text"
                    placeholder="Search student by name, roll no..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px 6px 30px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "6px",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {filteredStudents.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "16px" }}>
                      No matching students found
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: isSelected ? "#eef2ff" : "#ffffff",
                            border: isSelected ? "1px solid #818cf8" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {isSelected ? (
                              <CheckSquare size={16} style={{ color: "#4f46e5" }} />
                            ) : (
                              <Square size={16} style={{ color: "#cbd5e1" }} />
                            )}
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{s.rollNo} · {s.department || "CSE"}</div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: isSelected ? "#e0e7ff" : "#f1f5f9",
                              color: isSelected ? "#3730a3" : "#64748b",
                            }}
                          >
                            {isSelected ? "Selected" : "Add"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  className="coord-btn"
                  style={{ background: "#f1f5f9", color: "#475569" }}
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
