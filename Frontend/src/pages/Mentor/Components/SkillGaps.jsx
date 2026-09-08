import React, { useState } from "react";
import {
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  X,
  Send,
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";
import "../Styles/Students.css";
import "../Styles/SkillGaps.css";

// Comprehensive mock data for weak students diagnostic monitoring
const initialWeakStudents = [
  {
    id: 1,
    name: "Siddharth Rao",
    rollNo: "IT202612",
    department: "Information Technology",
    batch: "TE-IT-2026-B",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    priority: "Critical",
    currentPerformance: 54,
    weakSkills: [
      { name: "DBMS", score: 48, category: "Database" },
      { name: "Dynamic Prog.", score: 35, category: "Algorithms" }
    ],
    strongSkills: [
      { name: "HTML/CSS", score: 85 },
      { name: "Java Basics", score: 72 }
    ],
    recommendations: "Assign database normalization module & DP recursion practice problems. Schedule 1-on-1 review.",
    whyWeak: "Consistently scoring low on SQL joins, indexing questions in Quizzes, and failed DP memoization task in coding lab.",
    remedialAssigned: false
  },
  {
    id: 2,
    name: "Rohan Kulkarni",
    rollNo: "CS202622",
    department: "Computer Engineering",
    batch: "BE-CS-2026-A",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    priority: "High",
    currentPerformance: 58,
    weakSkills: [
      { name: "System Design", score: 52, category: "Architecture" },
      { name: "Networking", score: 45, category: "Core CS" }
    ],
    strongSkills: [
      { name: "Python", score: 88 },
      { name: "OOP", score: 78 }
    ],
    recommendations: "Recommend Load Balancers & Redis caching reading materials. Trigger System Design remedial quiz.",
    whyWeak: "Low performance in distributed systems quiz and networking protocols interview round.",
    remedialAssigned: false
  },
  {
    id: 3,
    name: "Neha Gupta",
    rollNo: "EX202609",
    department: "EXTC",
    batch: "BE-EXTC-2026-C",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    priority: "High",
    currentPerformance: 56,
    weakSkills: [
      { name: "Data Structures", score: 42, category: "DSA" },
      { name: "C++ Pointers", score: 49, category: "Language" }
    ],
    strongSkills: [
      { name: "Analog Circuits", score: 82 },
      { name: "Python", score: 75 }
    ],
    recommendations: "Provide foundational C++ pointer lab exercises and binary trees traversal practice.",
    whyWeak: "Memory leak errors in code submissions and sub-50% score in DSA milestone evaluation.",
    remedialAssigned: false
  },
  {
    id: 4,
    name: "Aditya Verma",
    rollNo: "CS202645",
    department: "Computer Engineering",
    batch: "BE-CS-2026-A",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    priority: "Medium",
    currentPerformance: 64,
    weakSkills: [
      { name: "Operating Systems", score: 55, category: "Core CS" }
    ],
    strongSkills: [
      { name: "JavaScript", score: 84 },
      { name: "React", score: 80 }
    ],
    recommendations: "Review OS Process Synchronization and Deadlocks documentation.",
    whyWeak: "Missed key questions on semaphores during mock technical interview.",
    remedialAssigned: false
  }
];

export default function SkillGaps() {
  const [students, setStudents] = useState(initialWeakStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [activeModalStudent, setActiveModalStudent] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === "All" || student.batch === selectedBatch;
    const matchesPriority = selectedPriority === "All" || student.priority === selectedPriority;
    return matchesSearch && matchesBatch && matchesPriority;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Trigger Remedial Assignment for a single student or batch
  const handleAssignRemedial = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remedialAssigned: true } : s))
    );
    if (activeModalStudent && activeModalStudent.id === studentId) {
      setActiveModalStudent((prev) => ({ ...prev, remedialAssigned: true }));
    }
    showToast(`Remedial Assignment successfully triggered for ${activeModalStudent ? activeModalStudent.name : "student"}!`);
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
            <span>AI Skill Gap Diagnostics & At-Risk Students</span>
          </h2>
          <p className="mentor-page-subtitle">
            Identify weak-performing students, review individual skill gap reports, and assign targeted remedial learning.
          </p>
        </div>

        <button
          className="mentor-btn-primary"
          onClick={() => showToast("Bulk Remedial Assignment triggered for all Critical & High priority students!")}
        >
          <Sparkles size={16} />
          <span>Trigger Remedial Assignment</span>
        </button>
      </div>

      {/* Diagnostic KPI Stats */}
      <div className="mentor-kpis-grid">
        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-label">At-Risk Students</div>
            <div className="kpi-val">{students.length} Students</div>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--amber">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="kpi-label">Critical Priority</div>
            <div className="kpi-val text-red">
              {students.filter((s) => s.priority === "Critical").length} Critical
            </div>
          </div>
        </div>

        <div className="mentor-kpi-card">
          <div className="kpi-icon-box kpi-icon-box--indigo">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="kpi-label">Top Skill Deficiencies</div>
            <div className="kpi-val text-indigo">DBMS, DP, DSA</div>
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
              <option value="All">All Batches</option>
              <option value="BE-CS-2026-A">BE-CS-2026-A</option>
              <option value="TE-IT-2026-B">TE-IT-2026-B</option>
              <option value="BE-EXTC-2026-C">BE-EXTC-2026-C</option>
            </select>
          </div>

          <div className="select-item">
            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task 3 Table: Weak-Student Diagnostics */}
      <div className="mentor-table-card">
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
              {filteredStudents.map((st) => (
                <tr key={st.id}>
                  {/* Student Info */}
                  <td>
                    <div className="student-info-cell">
                      <img src={st.avatar} alt={st.name} className="student-avatar-img" />
                      <div>
                        <div className="student-name-txt">{st.name}</div>
                        <div className="student-roll-txt">{st.rollNo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Batch/Dept */}
                  <td>
                    <div className="batch-dept-cell">
                      <span className="batch-tag">{st.batch}</span>
                      <span className="dept-txt">{st.department}</span>
                    </div>
                  </td>

                  {/* Weak Skills */}
                  <td>
                    <div className="weak-skills-tags-cell">
                      {st.weakSkills.map((ws, i) => (
                        <span key={i} className="weak-skill-chip">
                          {ws.name} ({ws.score}%)
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Priority */}
                  <td>{getPriorityBadge(st.priority)}</td>

                  {/* Current Performance */}
                  <td>
                    <div className="performance-cell">
                      <div className="perf-score-txt">{st.currentPerformance}%</div>
                      <div className="perf-bar-bg">
                        <div
                          className="perf-bar-fill"
                          style={{
                            width: `${st.currentPerformance}%`,
                            backgroundColor: st.currentPerformance < 55 ? "#ef4444" : "#f59e0b"
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Recommendations */}
                  <td>
                    <div className="recommendations-summary-cell" title={st.recommendations}>
                      {st.recommendations}
                    </div>
                  </td>

                  {/* View Student Button */}
                  <td>
                    <button
                      className="btn-view-student"
                      onClick={() => setActiveModalStudent(st)}
                    >
                      <span>View Student</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task 3 Modal: Complete Student Skill-Gap Report */}
      {activeModalStudent && (
        <div className="mentor-modal-overlay" onClick={() => setActiveModalStudent(null)}>
          <div className="mentor-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="modal-title-wrap">
                <img src={activeModalStudent.avatar} alt={activeModalStudent.name} className="modal-avatar" />
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
              {/* Top Banner */}
              <div className="modal-status-banner">
                <div>
                  <span className="banner-lbl">Overall Performance Score</span>
                  <div className="banner-score text-red">{activeModalStudent.currentPerformance}%</div>
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
                  {/* Weak Skills */}
                  <div className="skill-group-box skill-group-box--weak">
                    <h5>Weak & Critical Skills (&lt;60%)</h5>
                    {activeModalStudent.weakSkills.map((ws, i) => (
                      <div key={i} className="skill-modal-item">
                        <span>{ws.name} ({ws.category})</span>
                        <span className="badge-red">{ws.score}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Strong Skills */}
                  <div className="skill-group-box skill-group-box--strong">
                    <h5>Strong & Good Skills (&ge;60%)</h5>
                    {activeModalStudent.strongSkills.map((ss, i) => (
                      <div key={i} className="skill-modal-item">
                        <span>{ss.name}</span>
                        <span className="badge-green">{ss.score}%</span>
                      </div>
                    ))}
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
                  {activeModalStudent.whyWeak}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  <BookOpen size={16} />
                  <span>Recommended Action Plan & Remedials</span>
                </h4>
                <div className="action-plan-box">
                  <p>{activeModalStudent.recommendations}</p>
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
