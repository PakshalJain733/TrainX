import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search, Users, UserCheck, Calendar, CheckCircle, CheckSquare, Square, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Batches.css";

export default function CoordinatorBatches() {
  const location = useLocation();
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch("/coordinator/batches"),
      apiFetch("/coordinator/mentors"),
      apiFetch("/coordinator/students"),
    ])
      .then(([bRes, mRes, sRes]) => {
        const rawBatches = (bRes && bRes.data && Array.isArray(bRes.data.batches)) ? bRes.data.batches : [];
        setBatches(rawBatches.map((b) => ({
          ...b,
          code: `B-${b.id}`,
          department: b.schedule || "Regular Schedule",
          progress: b.avgQuizScore || 0,
        })));
        setMentors((mRes && mRes.data && Array.isArray(mRes.data.mentors)) ? mRes.data.mentors : []);
        setStudents((sRes && sRes.data && Array.isArray(sRes.data.students)) ? sRes.data.students : []);
      })
      .catch(() => { setBatches([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true" || location.state?.openCreateModal) {
      setShowCreateModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // New batch form state
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newSchedule, setNewSchedule] = useState("Mon, Wed, Fri (02:00 PM - 04:00 PM)");
  const [newMentorId, setNewMentorId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      String(b.name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(b.code || "").toLowerCase().includes(search.toLowerCase()) ||
      String(b.mentor || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStudents = students.filter(
    (s) =>
      String(s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      String(s.rollNumber || s.rollNo || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      String(s.department || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.studentId || s.id));
    }
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchCode.trim()) return;
    setSaving(true);

    const selectedMentor = mentors.find((m) => String(m.id) === newMentorId);

    apiFetch("/batches", {
      method: "POST",
      body: JSON.stringify({
        name: newBatchName.trim(),
        code: newBatchCode.trim(),
        trainer: selectedMentor ? selectedMentor.name : null,
        mentorId: selectedMentor ? selectedMentor.id : null,
        schedule: newSchedule,
      }),
    })
      .then((res) => {
        if (res && res.success) {
          setShowCreateModal(false);
          setNewBatchName("");
          setNewBatchCode("");
          setSelectedStudentIds([]);
          setStudentSearch("");
          loadData();
        } else {
          alert(res?.message || "Failed to create batch");
        }
      })
      .catch((err) => alert(err.message || "Failed to create batch"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#64748b", gap: 12 }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} />
        <p style={{ fontSize: 13 }}>Loading batches...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Batches Governance</h1>
          <p className="coord-page-sub">
            Manage training cohorts, allocate industry mentors, and track batch-level metrics.
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
        <select
          className="coord-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Batch Details</th>
              <th>Enrolled</th>
              <th>Assigned Mentor</th>
              <th>Avg Quiz Score</th>
              <th>Avg Attendance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                  No batches found.
                </td>
              </tr>
            ) : (
              filteredBatches.map((b) => (
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
                      <UserCheck size={14} color="#4f46e5" /> {b.mentor || "Unassigned"}
                    </div>
                  </td>
                  <td>
                    <div style={{ width: "140px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ fontWeight: 700, color: "#4f46e5" }}>{b.avgQuizScore}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "999px" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${b.avgQuizScore}%`,
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
                        background: b.status === "Active" ? "#ecfdf5" : "#f1f5f9",
                        color: b.status === "Active" ? "#047857" : "#64748b",
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
              ))
            )}
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
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Schedule</label>
                <input
                  type="text"
                  placeholder="Mon, Wed, Fri (02:00 PM - 04:00 PM)"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
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
                  value={newMentorId}
                  onChange={(e) => setNewMentorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    marginTop: "4px",
                  }}
                >
                  <option value="">Unassigned</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
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
                    {selectedStudentIds.length === filteredStudents.length ? "Deselect All" : "Select All"}
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
                      const sid = s.studentId || s.id;
                      const isSelected = selectedStudentIds.includes(sid);
                      return (
                        <div
                          key={sid}
                          onClick={() => toggleStudentSelection(sid)}
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
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{s.rollNumber} · {s.department || "CSE"}</div>
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
                <button type="submit" className="coord-btn coord-btn--primary" disabled={saving}>
                  {saving ? "Saving..." : "Save & Launch Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}