import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Users, UserCheck, Calendar, CheckSquare, Square, Code2 } from "lucide-react";
import { coordinatorBatches, coordinatorMentors, coordinatorStudents } from "../../../data/coordinatorMockData";
import { batchAPI } from "../../../services/api";
import { EVENTS } from "../../../utils/sharedStore";
import CustomSelect from "../../../components/ui/CustomSelect";
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
          mentor: b.trainer || b.mentor || "Mentor",
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
  const [newMentor, setNewMentor] = useState(coordinatorMentors[0]?.name || "Mentor");
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
    <div className="coord-batches-container">
      <div className="coord-page-header">
        <div className="coord-header-left">
          <div className="coord-header-text-group">
            <h1 className="coord-page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Code2 size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
              <span>Batches Governance</span>
            </h1>
            <p className="coord-page-sub">
              Manage training cohorts, allocate industry mentors, and track syllabus completion.
            </p>
          </div>
        </div>
      </div>

      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon-pos" />
          <input
            type="text"
            className="coord-search-input"
            placeholder="Search batch name, code or mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="coord-batch-select-wrap">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Near Completion", label: "Near Completion" },
            ]}
          />
        </div>
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
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="coord-batch-title-text">{b.name}</div>
                  <div className="coord-batch-sub-text">
                    {b.code} · {b.department}
                  </div>
                </td>
                <td>
                  <div className="coord-flex-cell-icon">
                    <Users size={14} color="#64748b" /> {b.enrolledStudents} Students
                  </div>
                </td>
                <td>
                  <div className="coord-flex-cell-icon">
                    <UserCheck size={14} color="#4f46e5" /> {b.mentor}
                  </div>
                </td>
                <td>
                  <div className="coord-progress-box">
                    <div className="coord-progress-head-row">
                      <span className="coord-progress-pct-label">{b.progress}%</span>
                    </div>
                    <div className="coord-progress-track-bg">
                      <div
                        className="coord-progress-fill-bar"
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={
                      b.avgAttendance >= 90
                        ? "coord-att-val--high"
                        : b.avgAttendance >= 80
                        ? "coord-att-val--medium"
                        : "coord-att-val--low"
                    }
                  >
                    {b.avgAttendance}%
                  </span>
                </td>
                <td>
                  <span
                    className={
                      b.status === "Active"
                        ? "coord-status-badge--active"
                        : "coord-status-badge--default"
                    }
                  >
                    {b.status}
                  </span>
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
            <h2 className="coord-modal-header-title">Create New Batch</h2>
            <form onSubmit={handleCreateBatch} className="coord-modal-form">
              <div className="coord-form-group-block">
                <label className="coord-form-label">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Beta Batch"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-form-group-block">
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

              <div className="coord-form-group-block">
                <label className="coord-form-label">Assign Industry Mentor</label>
                <CustomSelect
                  value={newMentor}
                  onChange={setNewMentor}
                  options={coordinatorMentors.map((m) => ({
                    value: m.name,
                    label: `${m.name} (${m.specialization})`,
                  }))}
                />
              </div>

              <div className="coord-form-group-block">
                <div className="coord-student-select-header">
                  <label className="coord-form-label">
                    Select Students ({selectedStudentIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllStudents}
                    className="coord-select-all-btn"
                  >
                    {selectedStudentIds.length === coordinatorStudents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="coord-student-search-box">
                  <Search size={14} className="coord-student-search-icon" />
                  <input
                    type="text"
                    placeholder="Search student by name, roll no..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="coord-student-search-input"
                  />
                </div>

                <div className="coord-student-list-scroll">
                  {filteredStudents.length === 0 ? (
                    <div className="coord-student-empty-text">
                      No matching students found
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          className={`coord-student-item-row ${isSelected ? "selected" : ""}`}
                        >
                          <div className="coord-student-item-left">
                            {isSelected ? (
                              <CheckSquare size={16} color="#4f46e5" />
                            ) : (
                              <Square size={16} color="#cbd5e1" />
                            )}
                            <div>
                              <div className="coord-student-name-text">{s.name}</div>
                              <div className="coord-student-sub-info">{s.rollNo} · {s.department || "CSE"}</div>
                            </div>
                          </div>
                          <span className={`coord-student-tag-badge ${isSelected ? "selected" : ""}`}>
                            {isSelected ? "Selected" : "Add"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="coord-modal-actions-row">
                <button
                  type="button"
                  className="coord-btn-action-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="coord-btn-action-submit">
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
