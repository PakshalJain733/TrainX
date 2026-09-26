import { useState, useEffect } from "react";
import {
  UserCheck,
  Star,
  BookOpen,
  Users,
  Mail,
  Phone,
  Plus,
  Search,
  Award,
  Briefcase,
  X,
  CheckCircle,
  Building2,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_Mentors.css";

const DEFAULT_MENTORS = [
  {
    id: 1,
    name: "Anubhav Shukla",
    experience: "8+ Yrs",
    rating: "4.9",
    specialization: "Java Architecture & Microservices",
    assignedBatch: "CSE 2026 Alpha Cohort",
    studentsCount: 42,
    email: "anubhav.shukla@trainx.edu",
    phone: "+91 98201 44512",
    department: "Computer Engineering",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Sharma",
    experience: "6+ Yrs",
    rating: "4.8",
    specialization: "Fullstack React & Node.js System Architecture",
    assignedBatch: "Fullstack Specialization B",
    studentsCount: 38,
    email: "priya.sharma@trainx.edu",
    phone: "+91 98112 33490",
    department: "Information Technology",
    status: "Active",
  },
  {
    id: 3,
    name: "Rahul Verma",
    experience: "7+ Yrs",
    rating: "4.9",
    specialization: "Advanced DSA & Graph Theory",
    assignedBatch: "DSA Fast-Track 2025",
    studentsCount: 50,
    email: "rahul.verma@trainx.edu",
    phone: "+91 99304 88123",
    department: "Computer Engineering",
    status: "Active",
  },
  {
    id: 4,
    name: "Dr. Amit Deshmukh",
    experience: "10+ Yrs",
    rating: "4.7",
    specialization: "AI/ML & Python Data Engineering",
    assignedBatch: "Data Science & AI Cohort",
    studentsCount: 35,
    email: "amit.deshmukh@trainx.edu",
    phone: "+91 98700 12345",
    department: "AI & Data Science",
    status: "Active",
  },
];

export default function CoordinatorMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [reallocateMentor, setReallocateMentor] = useState(null);
  const [newBatchName, setNewBatchName] = useState("");

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    specialization: "",
    assignedBatch: "CSE 2026 Alpha Cohort",
    experience: "5+ Yrs",
    department: "Computer Engineering",
  });

  const fetchMentors = () => {
    setLoading(true);
    apiFetch("/coordinator/mentors")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setMentors(list);
        } else {
          setMentors(DEFAULT_MENTORS);
        }
      })
      .catch(() => {
        apiFetch("/mentors")
          .then((res) => {
            const list = res?.data || (Array.isArray(res) ? res : []);
            if (Array.isArray(list) && list.length > 0) {
              setMentors(list);
            } else {
              setMentors(DEFAULT_MENTORS);
            }
          })
          .catch(() => setMentors(DEFAULT_MENTORS));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMentors();
  }, []);

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
    (sum, m) => sum + (Number(m.studentsCount) || 35),
    0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div className="coord-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
          }}>
            <Users size={22} />
          </div>
          <div>
            <h1 className="coord-page-title" style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              Industry Trainers & Faculty Governance
            </h1>
            <p className="coord-page-sub" style={{ margin: "3px 0 0", fontSize: "13.5px", color: "#64748b" }}>
              Assigned specialized industry trainers for CSE, IT & AI-DS cohorts, performance ratings, and batch allocations.
            </p>
          </div>
        </div>

        <button
          className="coord-btn coord-btn--primary"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
            transition: "all 0.2s ease"
          }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} /> Assign Industry Mentor
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="coord-perf-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Active Faculty & Mentors</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{mentors.length} Trainers</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Batches Under Supervision</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>{mentors.length} Active Batches</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Avg Faculty Rating</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>4.85 / 5.0</div>
          </div>
        </div>

        <div className="coord-perf-kpi-card" style={{ background: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Students Mentored</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#7c3aed", marginTop: "2px" }}>{totalStudents} Enrolled</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="coord-perf-filter-card" style={{ background: "#ffffff", padding: "14px 18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search mentor name, specialization, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "36px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ width: "220px" }}>
            <CustomSelect
              value={deptFilter}
              onChange={setDeptFilter}
              options={[
                { value: "all", label: "All Departments" },
                { value: "computer engineering", label: "Computer Engineering" },
                { value: "information technology", label: "Information Technology" },
                { value: "ai & data science", label: "AI & Data Science" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Mentors Cards Grid */}
      <div className="coord-mentor-grid">
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            Loading assigned faculty & mentors...
          </div>
        ) : filteredMentors.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px", gridColumn: "1 / -1", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <Users size={36} style={{ color: "#94a3b8" }} />
            <div style={{ fontWeight: 700, color: "#334155" }}>No matching mentors or faculty found.</div>
            <p style={{ margin: 0, fontSize: "12px" }}>Try updating your search query or department filter.</p>
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
                    <div className="coord-mentor-exp">{m.experience || "5+ Yrs"} Experience · {m.department || "CSE"}</div>
                  </div>
                </div>

                <div className="coord-mentor-rating-pill">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  {m.rating || "4.8"}
                </div>
              </div>

              <div className="coord-mentor-spec-box">
                <div className="coord-mentor-spec-lbl">Specialization</div>
                <div className="coord-mentor-spec-val">{m.specialization || m.department || "Full Stack & AI"}</div>
              </div>

              <div className="coord-mentor-details-list">
                <div className="coord-mentor-detail-row">
                  <BookOpen size={14} color="#64748b" />
                  Assigned Batch: <strong style={{ color: "#4f46e5" }}>{m.assignedBatch || m.batch || "TBD"}</strong>
                </div>
                <div className="coord-mentor-detail-row">
                  <Users size={14} color="#64748b" />
                  Allocated Students: <strong>{m.studentsCount || 35} Students</strong>
                </div>
                <div className="coord-mentor-email-row">
                  <Mail size={13} /> {m.email || "N/A"}
                </div>
              </div>

              <button
                className="coord-btn coord-btn--primary coord-mentor-action-btn"
                style={{
                  background: "#eef2ff",
                  color: "#4f46e5",
                  border: "1px solid #c7d2fe",
                  padding: "9px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  marginTop: "6px"
                }}
                onClick={() => {
                  setReallocateMentor(m);
                  setNewBatchName(m.assignedBatch || "");
                }}
              >
                Re-allocate Batch
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Mentor Modal */}
      {showAddModal && (
        <div className="coord-perf-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="coord-perf-modal-card" style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", pb: "12px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Assign New Industry Mentor</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMentor} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.kumar@trainx.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Specialization & Domain Expertise</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing & AWS DevOps"
                  value={addForm.specialization}
                  onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Department</label>
                  <CustomSelect
                    value={addForm.department}
                    onChange={(val) => setAddForm({ ...addForm, department: val })}
                    options={[
                      { value: "Computer Engineering", label: "Computer Engineering" },
                      { value: "Information Technology", label: "Information Technology" },
                      { value: "AI & Data Science", label: "AI & Data Science" },
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>Target Assigned Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE 2026 Alpha"
                    value={addForm.assignedBatch}
                    onChange={(e) => setAddForm({ ...addForm, assignedBatch: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Confirm Trainer Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reallocate Batch Modal */}
      {reallocateMentor && (
        <div className="coord-perf-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="coord-perf-modal-card" style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Re-allocate Batch for {reallocateMentor.name}</h3>
              <button onClick={() => setReallocateMentor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReallocate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>New Batch Assignment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2026 Beta Cohort"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setReallocateMentor(null)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
