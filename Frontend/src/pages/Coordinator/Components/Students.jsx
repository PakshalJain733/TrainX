import { useState } from "react";
import { Search, GraduationCap, AlertCircle, CheckCircle, Mail, Phone } from "lucide-react";
import { coordinatorStudents, coordinatorBatches } from "../../../data/coordinatorMockData";
import "../Styles/Students.css";

export default function CoordinatorStudents() {
  const [students, setStudents] = useState(coordinatorStudents);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === "All" || s.batch === batchFilter;
    const matchesRisk = riskFilter === "All" || s.riskStatus === riskFilter;
    return matchesSearch && matchesBatch && matchesRisk;
  });

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Student Directory & Risk Audit</h1>
          <p className="coord-page-sub">
            Monitor student attendance %, academic scores, AI interview performance, and risk level.
          </p>
        </div>
      </div>

      <div className="coord-filter-bar">
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#64748b" }} />
          <input
            type="text"
            className="coord-search-input"
            placeholder="Search student name, roll no or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <select
          className="coord-select"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="All">All Batches</option>
          {coordinatorBatches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          className="coord-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="All">All Risk Levels</option>
          <option value="Top Performer">Top Performer</option>
          <option value="Good">Good Standing</option>
          <option value="Moderate">Moderate Risk</option>
          <option value="High Risk">High Risk (&lt;75% Attendance)</option>
        </select>
      </div>

      <div className="coord-table-card">
        <table className="coord-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No & Batch</th>
              <th>Attendance</th>
              <th>Quiz Score</th>
              <th>AI Interview Score</th>
              <th>Risk Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{s.email}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: "#334155" }}>{s.rollNo}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{s.batch}</div>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 700,
                      color: s.attendance >= 90 ? "#059669" : s.attendance >= 75 ? "#d97706" : "#dc2626",
                    }}
                  >
                    {s.attendance}%
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: "#4f46e5" }}>{s.avgScore}%</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: "#7c3aed" }}>{s.interviewScore}%</span>
                </td>
                <td>
                  <span
                    className={`coord-student-pill ${
                      s.riskStatus === "Top Performer"
                        ? "coord-student-pill--top"
                        : s.riskStatus === "Good"
                        ? "coord-student-pill--good"
                        : s.riskStatus === "Moderate"
                        ? "coord-student-pill--moderate"
                        : "coord-student-pill--risk"
                    }`}
                  >
                    {s.riskStatus}
                  </span>
                </td>
                <td>
                  <button
                    className="coord-btn"
                    style={{ padding: "6px 12px", fontSize: "12px", background: "#f1f5f9", color: "#334155" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="coord-modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Student Audit Profile</h2>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#64748b" }}
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>{selectedStudent.name}</div>
                <div style={{ color: "#64748b", marginTop: "2px" }}>
                  Roll No: <strong>{selectedStudent.rollNo}</strong> · {selectedStudent.batch}
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "#475569" }}>
                  <span>
                    <Mail size={13} inline /> {selectedStudent.email}
                  </span>
                  <span>
                    <Phone size={13} inline /> {selectedStudent.phone}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 700 }}>Attendance Rate</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e40af" }}>{selectedStudent.attendance}%</div>
                </div>

                <div style={{ background: "#faf5ff", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#7e22ce", fontWeight: 700 }}>Avg Quiz Score</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#6b21a8" }}>{selectedStudent.avgScore}%</div>
                </div>
              </div>

              <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Placement Readiness Status</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#4f46e5", marginTop: "2px" }}>
                  {selectedStudent.placementStatus}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  className="coord-btn coord-btn--primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => alert(`Warning notice sent to ${selectedStudent.name}`)}
                >
                  Send Counseling Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
