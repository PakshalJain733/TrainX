import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  UserCheck,
  Star,
  BookOpen,
  Users,
  UserCog,
  Mail,
  Phone,
  Search,
  Award,
  X,
  Building2,
  Eye,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_Mentors.css";

export default function CoordinatorMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedMentorStudentsModal, setSelectedMentorStudentsModal] = useState(null);
  const [allottedStudents, setAllottedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reallocateMentor, setReallocateMentor] = useState(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [dbDepartments, setDbDepartments] = useState([]);

  const handleViewStudents = (mentor) => {
    setSelectedMentorStudentsModal(mentor);
    setLoadingStudents(true);
    apiFetch(`/coordinator/mentors/${mentor.id}/students`)
      .then((res) => {
        const list = res?.data?.students || res?.students || res?.data || [];
        setAllottedStudents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setAllottedStudents([]);
      })
      .finally(() => {
        setLoadingStudents(false);
      });
  };

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    specialization: "",
    assignedBatch: "",
    experience: "",
    department: "Computer Engineering",
  });

  const getCoordinatorDept = () => {
    try {
      const local = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
      return local.department || local.dept || local.departmentName || "";
    } catch {
      return "";
    }
  };
  const coordDept = getCoordinatorDept();

  const fetchMentors = () => {
    setLoading(true);
    apiFetch("/coordinator/mentors")
      .then((res) => {
        const rawList = res?.data?.mentors || res?.mentors || res?.data || (Array.isArray(res) ? res : []);
        const list = Array.isArray(rawList) ? rawList : [];

        const mapped = list.map((m, idx) => ({
          id: m.id || idx + 1,
          name: m.name || m.trainer || "Faculty Mentor",
          rating: m.rating || "5.0",
          specialization: m.specialization || m.target_track || m.track || "General Domain",
          assignedBatch: m.assignedBatch || m.batch_name || "Unassigned",
          studentsCount: m.studentsCount ?? m.students ?? 0,
          email: m.email || "N/A",
          phone: m.mobile_number || m.phone || "N/A",
          department: m.department || m.department_name || coordDept || "Department",
          status: m.status || (m.is_active !== false ? "Active" : "Inactive"),
        }));

        const deptMentors = mapped.filter(
          (m) =>
            !coordDept ||
            !m.department ||
            m.department.toLowerCase().includes(coordDept.toLowerCase()) ||
            coordDept.toLowerCase().includes(m.department.toLowerCase())
        );

        setMentors(deptMentors.length > 0 ? deptMentors : mapped);
      })
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  };

  const fetchDepartments = () => {
    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setDbDepartments(list.map((d) => d.name || d.code).filter(Boolean));
        }
      })
      .catch(() => null);
  };

  useEffect(() => {
    fetchMentors();
    fetchDepartments();
  }, []);

  const uniqueDeptNames = Array.from(
    new Set([
      ...dbDepartments,
      ...mentors.map((m) => m.department).filter(Boolean),
    ])
  );

  const deptSelectOptions = [
    { value: "all", label: "All Departments" },
    ...uniqueDeptNames.map((deptName) => ({
      value: deptName.toLowerCase(),
      label: deptName,
    })),
  ];

  const addFormDeptOptions = uniqueDeptNames.length > 0
    ? uniqueDeptNames.map((deptName) => ({
        value: deptName,
        label: deptName,
      }))
    : [{ value: "Computer Engineering", label: "Computer Engineering" }];

  const handleAddMentor = (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) return;

    const newMentorObj = {
      id: Date.now(),
      name: addForm.name,
      experience: addForm.experience,
      rating: "5.0",
      specialization: addForm.specialization || "Full Stack Software Engineering",
      assignedBatch: addForm.assignedBatch,
      studentsCount: 30,
      email: addForm.email,
      phone: "+91 98000 00000",
      department: addForm.department,
      status: "Active",
    };

    setMentors([newMentorObj, ...mentors]);
    setShowAddModal(false);
    setAddForm({
      name: "",
      email: "",
      specialization: "",
      assignedBatch: "CSE 2026 Alpha Cohort",
      experience: "5+ Yrs",
      department: "Computer Engineering",
    });

    apiFetch("/coordinator/mentors", {
      method: "POST",
      body: JSON.stringify(newMentorObj),
    }).catch(() => null);
  };

  const handleReallocate = (e) => {
    e.preventDefault();
    if (!reallocateMentor || !newBatchName.trim()) return;

    setMentors((prev) =>
      prev.map((m) =>
        m.id === reallocateMentor.id ? { ...m, assignedBatch: newBatchName } : m
      )
    );
    setReallocateMentor(null);
    setNewBatchName("");
  };

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.specialization || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.assignedBatch || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      deptFilter === "all" ||
      (m.department || "").toLowerCase().includes(deptFilter.toLowerCase());

    return matchesSearch && matchesDept;
  });

  const totalStudents = mentors.reduce(
    (sum, m) => sum + (Number(m.studentsCount) || 0),
    0
  );

  return (
    <div className="coord-mentors-container">
      {/* Header Banner */}
      <div className="coord-page-header">
        <div className="coord-header-left">
          <div>
            <h1 className="coord-page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <UserCog size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
              <span>Assigned Mentors</span>
            </h1>
            <p className="coord-page-sub">
              Assigned Mentors for all students from different batches.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="coord-perf-kpi-grid">
        <div className="coord-perf-kpi-card">
          <div className="coord-kpi-icon-box blue">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="coord-kpi-label">Active Mentors</div>
            <div className="coord-kpi-val">{mentors.length} Trainers</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-kpi-icon-box green">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="coord-kpi-label">Batches Under Supervision</div>
            <div className="coord-kpi-val green">{mentors.length} Active Batches</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-kpi-icon-box amber">
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div>
            <div className="coord-kpi-label">Avg Faculty Rating</div>
            <div className="coord-kpi-val amber">
              {mentors.length > 0
                ? (mentors.reduce((acc, m) => acc + parseFloat(m.rating || 5.0), 0) / mentors.length).toFixed(2)
                : "0.0"} / 5.0
            </div>
          </div>
        </div>

        <div className="coord-perf-kpi-card">
          <div className="coord-kpi-icon-box purple">
            <Award size={20} />
          </div>
          <div>
            <div className="coord-kpi-label">Students Mentored</div>
            <div className="coord-kpi-val purple">{totalStudents} Enrolled</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="coord-perf-filter-card">
        <div className="coord-filter-flex-row">
          <div className="coord-search-wrap">
            <Search size={16} className="coord-search-icon" />
            <input
              type="text"
              placeholder="Search mentor name, specialization, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coord-search-input"
            />
          </div>

          <div className="coord-filter-select-wrap">
            <CustomSelect
              value={deptFilter}
              onChange={setDeptFilter}
              options={deptSelectOptions}
            />
          </div>
        </div>
      </div>

      {/* Mentors Cards Grid */}
      <div className="coord-mentor-grid">
        {loading ? (
          <div className="coord-grid-empty">
            Loading assigned faculty & mentors...
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="coord-grid-empty">
            <Users size={36} color="#94a3b8" />
            <div className="coord-grid-empty-title">No matching mentors or faculty found.</div>
            <p className="coord-grid-empty-sub">Try updating your search query or department filter.</p>
          </div>
        ) : (
          filteredMentors.map((m, idx) => (
            <div key={m.id || idx} className="coord-mentor-card">
              <div className="coord-mentor-top">
                <div className="coord-mentor-id-row">
                  <div className="coord-mentor-avatar-box">
                    {(m.name || "FM").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="coord-mentor-name">{m.name}</div>
                    <div className="coord-mentor-exp">{m.department || "Department"}</div>
                  </div>
                </div>

                <div className="coord-mentor-rating-pill">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  {m.rating || "5.0"}
                </div>
              </div>

              <div className="coord-mentor-details-list">
                <div className="coord-mentor-detail-row">
                  <Building2 size={14} color="#64748b" />
                  <span>Department: <strong>{m.department || "Department"}</strong></span>
                </div>
                <div className="coord-mentor-detail-row">
                  <Users size={14} color="#64748b" />
                  <span>Allotted Students: <strong>{m.studentsCount || 0} Students</strong></span>
                </div>
                <div className="coord-mentor-detail-row">
                  <BookOpen size={14} color="#64748b" />
                  <span>Assigned Batch: <strong className="accent">{m.assignedBatch || "Unassigned"}</strong></span>
                </div>
                <div className="coord-mentor-detail-row">
                  <Mail size={14} color="#64748b" />
                  <span>Email: <strong>{m.email || "N/A"}</strong></span>
                </div>
                <div className="coord-mentor-detail-row">
                  <Phone size={14} color="#64748b" />
                  <span>Mobile Number: <strong>{m.phone || "N/A"}</strong></span>
                </div>
              </div>

              <button
                className="coord-mentor-view-btn"
                onClick={() => handleViewStudents(m)}
              >
                <Eye size={15} /> View Allotted Students ({m.studentsCount || 0})
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Mentor Modal */}
      {showAddModal && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card add-modal">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">Assign New Industry Mentor</h3>
              <button onClick={() => setShowAddModal(false)} className="coord-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMentor} className="coord-modal-form">
              <div className="coord-form-group">
                <label className="coord-form-label">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-form-group">
                <label className="coord-form-label">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.kumar@trainx.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-form-group">
                <label className="coord-form-label">Specialization & Domain Expertise</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing & AWS DevOps"
                  value={addForm.specialization}
                  onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-form-grid-2">
                <div className="coord-form-group">
                  <label className="coord-form-label">Department</label>
                  <CustomSelect
                    value={addForm.department}
                    onChange={(val) => setAddForm({ ...addForm, department: val })}
                    options={addFormDeptOptions}
                  />
                </div>

                <div className="coord-form-group">
                  <label className="coord-form-label">Target Assigned Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE 2026 Alpha"
                    value={addForm.assignedBatch}
                    onChange={(e) => setAddForm({ ...addForm, assignedBatch: e.target.value })}
                    className="coord-form-input"
                  />
                </div>
              </div>

              <div className="coord-modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="coord-btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="coord-btn-primary">
                  Confirm Trainer Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reallocate Batch Modal */}
      {reallocateMentor && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card reallocate-modal">
            <div className="coord-modal-header">
              <h3 className="coord-modal-title">Re-allocate Batch for {reallocateMentor.name}</h3>
              <button onClick={() => setReallocateMentor(null)} className="coord-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReallocate} className="coord-modal-form">
              <div className="coord-form-group">
                <label className="coord-form-label">New Batch Assignment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Beta Cohort"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="coord-form-input"
                />
              </div>

              <div className="coord-modal-footer">
                <button type="button" onClick={() => setReallocateMentor(null)} className="coord-btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="coord-btn-primary">
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Allotted Students Modal */}
      {selectedMentorStudentsModal && createPortal(
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card students-modal">
            <div className="coord-modal-header">
              <div>
                <h3 className="coord-modal-title">
                  Allotted Students: {selectedMentorStudentsModal.name}
                </h3>
                <p className="coord-modal-sub">
                  {selectedMentorStudentsModal.assignedBatch || "Unassigned"} · {selectedMentorStudentsModal.department || "Department"}
                </p>
              </div>
              <button onClick={() => setSelectedMentorStudentsModal(null)} className="coord-modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="coord-modal-table-wrap">
              {loadingStudents ? (
                <div className="coord-modal-message">
                  Fetching allotted students from database...
                </div>
              ) : allottedStudents.length === 0 ? (
                <div className="coord-modal-message">
                  No allotted students found for this mentor.
                </div>
              ) : (
                <table className="coord-modal-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Department</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allottedStudents.map((student, index) => (
                      <tr key={student.id || index}>
                        <td className="num">{index + 1}</td>
                        <td className="name">{student.name}</td>
                        <td className="roll">{student.rollNo}</td>
                        <td className="dept">{student.department}</td>
                        <td>
                          <span className="coord-status-badge">
                            {student.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="coord-modal-footer">
              <button
                onClick={() => setSelectedMentorStudentsModal(null)}
                className="coord-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
