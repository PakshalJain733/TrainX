import React, { useState, useEffect } from "react";
import {
  AlertTriangle, Sparkles, Search, Filter, UserCheck, ChevronRight, X,
  Send, BookOpen, CheckCircle2, Calendar, Layers, ArrowUpRight, TrendingDown, RefreshCw
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Students.css";
import "../Styles/SkillGaps.css";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || "S").toUpperCase();
};

export default function SkillGaps() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ atRisk: 0, critical: 0, high: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [activeModalStudent, setActiveModalStudent] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/students/skill-gaps")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.students)) {
          setStudents(res.data.students);
          if (res.data.stats) setStats(res.data.stats);
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const batches = ["All", ...new Set(students.map((s) => s.batch).filter(Boolean))];
  const topDeficiencies = Array.from(
    students.flatMap((s) => s.weakSkills || []).reduce((m, w) => {
      m.set(w.name, (m.get(w.name) || 0) + 1);
      return m;
    }, new Map())
  ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.rollNo || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === "All" || student.batch === selectedBatch;
    const matchesPriority = selectedPriority === "All" || student.priority === selectedPriority;
    return matchesSearch && matchesBatch && matchesPriority;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(""); }, 4000);
  };

  const handleAssignRemedial = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    const topic = student?.weakSkills?.[0]?.name || (student?.weakSkills?.length ? student.weakSkills[0].name : "Core Concepts");

    apiFetch("/skill-gaps/remedial", {
      method: "POST",
      body: JSON.stringify({ topic, studentId, difficultyLevel: "Medium" }),
    })
      .then((res) => {
        if (res && res.success) {
          setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, remedialAssigned: true } : s)));
          if (activeModalStudent && activeModalStudent.id === studentId) {
            setActiveModalStudent((prev) => ({ ...prev, remedialAssigned: true }));
          }
          showToast(`Remedial assignment created for ${student?.name || "student"}!`);
        } else {
          alert(res?.message || "Failed to create remedial assignment");
        }
      })
      .catch((err) => alert(err.message || "Failed to create remedial assignment"));
  };

  const getPriorityBadge = (priority) => {
    if (priority === "Critical") return <span className="mentor-priority-badge mentor-priority-badge--critical">Critical Priority</span>;
    if (priority === "High") return <span className="mentor-priority-badge mentor-priority-badge--high">High Priority</span>;
    if (priority === "Medium") return <span className="mentor-priority-badge mentor-priority-badge--medium">Medium Priority</span>;
    return <span className="mentor-priority-badge mentor-priority-badge--low">Low Priority</span>;
  };

  return (
    <div className="mentor-skillgaps-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mentor-toast-notification">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <AlertTriangle size={22} color="#e11d48" />
            <span>Skill Gap Diagnostics & At-Risk Students</span>
          </h2>
          <p className="mentor-page-subtitle">Identify weak-performing students, review individual skill gap reports, and assign targeted remedial learning.</p>
        </div>
      </div>

      {/* Diagnostic KPI Stats */}
      <div className="mentor-kpis-grid">
        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-label">At-Risk Students</div>
            <div className="kpi-val">{stats.atRisk} Students</div>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--amber">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="kpi-label">High Priority</div>
            <div className="kpi-val text-red">{stats.critical} Critical · {stats.high} High</div>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--indigo">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="kpi-label">Top Skill Deficiencies</div>
            <div className="kpi-val text-indigo">{topDeficiencies.length > 0 ? topDeficiencies.join(", ") : "None"}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mentor-filters-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search student by name or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-selects-wrap">
          <div className="select-item">
            <Filter size={14} />
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              {batches.map((b) => (<option key={b} value={b}>{b === "All" ? "All Batches" : b}</option>))}
            </select>
          </div>

          <div className="select-item">
            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task 3 Table: Weak-Student Diagnostics */}
      <div className="mentor-table-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
            <p style={{ fontSize: 13 }}>Loading skill gap diagnostics...</p>
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Dept / Batch</th>
                  <th>Weak Skills & Scores</th>
                  <th>Priority</th>
                  <th>Current Performance</th>
                  <th>Recommendations</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="mentor-empty-table-cell">
                      No skill gap data available for assigned students yet.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <div className="student-info-cell">
                          <div className="student-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#4f46e5', background: '#eef2ff' }}>
                            {getInitials(st.name)}
                          </div>
                          <div>
                            <div className="student-name-txt">{st.name}</div>
                            <div className="student-roll-txt">{st.rollNo}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="batch-dept-cell">
                          <span className="batch-tag">{st.batch}</span>
                          <span className="dept-txt">{st.department}</span>
                        </div>
                      </td>

                      <td>
                        <div className="weak-skills-tags-cell">
                          {(st.weakSkills || []).length === 0 ? (
                            <span style={{ fontSize: 12, color: '#10b981' }}>On track</span>
                          ) : (
                            (st.weakSkills || []).map((ws, i) => (
                              <span key={i} className="weak-skill-chip">
                                {ws.name} ({ws.score == null ? "N/A" : `${ws.score}%`})
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td>{getPriorityBadge(st.priority)}</td>

                      <td>
                        <div className="performance-cell">
                          <div className="perf-score-txt">{st.currentPerformance == null ? "N/A" : `${st.currentPerformance}%`}</div>
                          {st.currentPerformance != null && (
                            <div className="perf-bar-bg">
                              <div
                                className="perf-bar-fill"
                                style={{ width: `${st.currentPerformance}%`, backgroundColor: st.currentPerformance < 55 ? "#ef4444" : "#f59e0b" }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="recommendations-summary-cell" title={st.recommendations}>
                          {st.recommendations || "—"}
                        </div>
                      </td>

                      <td>
                        <button className="btn-view-student" onClick={() => setActiveModalStudent(st)}>
                          <span>View Student</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task 3 Modal: Complete Student Skill-Gap Report */}
      {activeModalStudent && (
        <div className="mentor-modal-overlay" onClick={() => setActiveModalStudent(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <div className="modal-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#4f46e5', background: '#eef2ff' }}>
                  {getInitials(activeModalStudent.name)}
                </div>
                <div>
                  <h3 className="modal-student-name">{activeModalStudent.name}</h3>
                  <div className="modal-student-meta">
                    <span>{activeModalStudent.rollNo}</span> &bull; <span>{activeModalStudent.batch}</span> &bull; <span>{activeModalStudent.department}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModalStudent(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body-content">
              <div className="modal-status-banner">
                <div>
                  <span className="banner-lbl">Overall Performance Score</span>
                  <div className={`banner-score ${activeModalStudent.currentPerformance != null && activeModalStudent.currentPerformance < 55 ? 'text-red' : ''}`}>
                    {activeModalStudent.currentPerformance == null ? "N/A" : `${activeModalStudent.currentPerformance}%`}
                  </div>
                </div>
                <div>{getPriorityBadge(activeModalStudent.priority)}</div>
              </div>

              {/* Skill Matrix */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <Layers size={16} />
                  <span>Skill Competency Matrix</span>
                </h4>
                <div className="skills-grid-modal">
                  <div className="skill-group-box skill-group-box--weak">
                    <h5>Weak & Critical Skills (&lt;60%)</h5>
                    {(activeModalStudent.weakSkills || []).length === 0 ? (
                      <div style={{ fontSize: 12.5, color: '#10b981' }}>No weak skills detected — on track.</div>
                    ) : (
                      (activeModalStudent.weakSkills || []).map((ws, i) => (
                        <div key={i} className="skill-modal-item">
                          <span>{ws.name} ({ws.category || "Technical"})</span>
                          <span className="badge-red">{ws.score == null ? "N/A" : `${ws.score}%`}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="skill-group-box skill-group-box--strong">
                    <h5>Diagnostic Summary</h5>
                    <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>
                      {activeModalStudent.whyWeak || "No deficiencies identified from current data."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Analysis */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <AlertTriangle size={16} className="text-red" />
                  <span>AI Root-Cause Diagnostic</span>
                </h4>
                <div className="diagnostic-text-box">
                  {activeModalStudent.whyWeak || "No diagnostic data available yet."}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <BookOpen size={16} />
                  <span>Recommended Action Plan & Remedials</span>
                </h4>
                <div className="action-plan-box">
                  <p>{activeModalStudent.recommendations || "No recommendations available."}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer-controls">
              <button
                className={`btn-modal-remedial ${activeModalStudent.remedialAssigned ? "btn-modal-remedial--assigned" : ""}`}
                onClick={() => handleAssignRemedial(activeModalStudent.id)}
                disabled={activeModalStudent.remedialAssigned}
              >
                <Sparkles size={16} />
                <span>{activeModalStudent.remedialAssigned ? "Remedial Task Assigned" : "Assign Targeted Remedial Task"}</span>
              </button>

              <button
                className="btn-modal-secondary"
                onClick={() => {
                  showToast(`1-on-1 Mentorship session requested for ${activeModalStudent.name}.`);
                }}
              >
                <Calendar size={16} />
                <span>Schedule Mentorship</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}