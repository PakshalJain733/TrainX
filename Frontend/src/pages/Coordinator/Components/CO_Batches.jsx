import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Users, UserCheck, Calendar, CheckCircle, CheckSquare, Square } from "lucide-react";
import { coordinatorBatches, coordinatorMentors, coordinatorStudents } from "../../../data/coordinatorMockData";
import { batchAPI } from "../../../services/api";
import { EVENTS } from "../../../utils/sharedStore";
import "../Styles/CO_Batches.css";

export default function CoordinatorBatches() {
  const location = useLocation();
  const [batches, setBatches] = useState(coordinatorBatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(b => ({
          id: b.id,
          name: b.name,
          code: b.code || b.join_code || `BTCH-${b.id}`,
          college: b.collegeName || "Apex Institute of Technology",
          department: b.departmentName || "Computer Science",
          enrolledStudents: b.studentsCount || b.students || 0,
          progress: b.progressPct || 0,
          schedule: b.schedule || "Mon, Wed, Fri (02:00 PM - 04:00 PM)",
          mentor: b.trainer || b.mentor || "Faculty Mentor",
          status: b.status || "Active",
          avgAttendance: 100,
          avgQuizScore: 0,
          topPerformer: "N/A",
          defaultersCount: 0,
        }));
        setBatches(normalized);
      }
    } catch (err) {
      console.warn("[CO_Batches] Using local fallback state:", err);
    }
  };

  useEffect(() => {
    fetchBatches();
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true" || location.state?.openCreateModal) {
      setShowCreateModal(true);
    }
  }, [location]);

  // New batch form state
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newMentor, setNewMentor] = useState(coordinatorMentors[0]?.name || "Faculty Mentor");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.mentor || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCoordinatorDept = () => {
    try {
      const local = JSON.parse(sessionStorage.getItem("user") || "{}");
      return local.department || local.dept || null;
    } catch {
      return null;
    }
  };
  const coordDept = getCoordinatorDept();

  const filteredStudents = coordinatorStudents.filter(
    (s) => {
      const matchesSearch =
        (s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.rollNo || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase()));
      const matchesDept = !coordDept || !s.department || s.department.toLowerCase().includes(coordDept.toLowerCase()) || coordDept.toLowerCase().includes(s.department.toLowerCase());
      return matchesSearch && matchesDept;
    }
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

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchCode.trim()) return;

    const created = {
      id: Date.now(),
      name: newBatchName,
      code: newBatchCode,
      join_code: newBatchCode,
      college: "Apex Institute of Technology",
      department: "Computer Science & Engineering",
      enrolledStudents: selectedStudentIds.length,
      selectedStudentIds: selectedStudentIds,
      progress: 0,
      schedule: "Mon, Wed, Fri (02:00 PM - 04:00 PM)",
      nextSession: "Next Mon at 02:00 PM",
      mentor: newMentor,
      trainer: newMentor,
      status: "Active",
      avgAttendance: 100,
      avgQuizScore: 0,
      topPerformer: "N/A",
      defaultersCount: 0,
    };

    try {
      await batchAPI.createBatch({
        name: created.name,
        code: created.code,
        join_code: created.code,
        schedule: created.schedule,
        trainer: created.mentor,
        mentor: created.mentor,
      });
      fetchBatches();
      window.dispatchEvent(new CustomEvent(EVENTS.BATCH_UPDATED, { detail: created }));
    } catch (err) {
      setBatches([created, ...batches]);
      window.dispatchEvent(new CustomEvent(EVENTS.BATCH_UPDATED, { detail: created }));
    }

    setShowCreateModal(false);
    setNewBatchName("");
    setNewBatchCode("");
    setSelectedStudentIds([]);
    setStudentSearch("");
  };

  return (
    <div>
      <div className="coord-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <h1 className="coord-page-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Batches Governance</h1>
            <p className="coord-page-sub" style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
              Manage training cohorts, allocate industry mentors, and track syllabus completion.
            </p>
          </div>

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
                  placeholder="e.g. CSE 2026 Beta Batch"
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
                <select
                  value={newMentor}
                  onChange={(e) => setNewMentor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                >
                  {coordinatorMentors.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.specialization})
                    </option>
                  ))}
                </select>
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
