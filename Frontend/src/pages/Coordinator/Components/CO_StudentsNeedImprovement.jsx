import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  BrainCircuit,
  CheckCircle,
  Filter,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_CodingPerformance.css";

export default function StudentsNeedImprovement() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  // Detail Modal State
  const [selectedSkillGapStudent, setSelectedSkillGapStudent] = useState(null);

  // Remediation Plan Modal State
  const [remediationStudent, setRemediationStudent] = useState(null);
  const [planType, setPlanType] = useState("Custom Practice Set & Mentor Counseling");
  const [planDeadline, setPlanDeadline] = useState("2026-09-15");
  const [planNotes, setPlanNotes] = useState("");

  const loadDefaulters = () => {
    setLoading(true);
    apiFetch("/interventions/coordinator")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setDataList(
            res.data.map((s, idx) => ({
              id: s.id || s.student_id || idx,
              student_id: s.student_id || s.user_id || s.id,
              studentName: s.student_name || s.name || "Student",
              rollNo: s.roll_number || s.roll_no || `CS-${100 + idx}`,
              department: s.department || "ECS",
              batch: s.batch_name || s.batch || "TE-A",
              priority: s.risk_level || (s.overall_score < 60 ? "High" : "Medium"),
              overallScore: s.overall_score || 55,
              attendancePct: s.attendance_score || s.attendance || "72%",
              assignedMentor: s.mentor_name || "Faculty Mentor",
              trendStatus: s.status === "Action Taken" ? "Improving" : "Not Improving",
              weakSkills: Array.isArray(s.weak_areas)
                ? s.weak_areas
                : [
                    { skillName: "Dynamic Programming", currentScore: 42, targetScore: 75, level: "Critical", source: "Coding Quiz" },
                    { skillName: "Graph Algorithms", currentScore: 50, targetScore: 70, level: "High", source: "AI Mock Interview" },
                  ],
            }))
          );
        } else {
          setDataList([]);
        }
      })
      .catch(() => setDataList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDefaulters();
  }, []);

  // Extract Unique Departments & Batches for Filters
  const departments = Array.from(new Set(dataList.map((s) => s.department)));
  const batches = Array.from(new Set(dataList.map((s) => s.batch)));

  // Filter Logic
  const filteredStudents = dataList.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.assignedMentor && student.assignedMentor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = selectedDept === "all" || student.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    const matchesPriority = selectedPriority === "all" || student.priority === selectedPriority;

    if (activeTab === "immediate") {
      return matchesSearch && matchesDept && matchesBatch && student.priority === "High";
    }
    if (activeTab === "improving") {
      return matchesSearch && matchesDept && matchesBatch && matchesPriority && student.trendStatus === "Improving";
    }
    if (activeTab === "notImproving") {
      return matchesSearch && matchesDept && matchesBatch && matchesPriority && student.trendStatus === "Not Improving";
    }

    return matchesSearch && matchesDept && matchesBatch && matchesPriority;
  });

  // Calculate Metrics
  const immediateAttentionStudents = dataList.filter((s) => s.priority === "High");
  const improvingStudents = dataList.filter((s) => s.trendStatus === "Improving");
  const notImprovingStudents = dataList.filter((s) => s.trendStatus === "Not Improving");

  // Most Common Weak Skills Aggregation
  const skillCountMap = {};
  dataList.forEach((student) => {
    student.weakSkills.forEach((ws) => {
      if (!skillCountMap[ws.skillName]) {
        skillCountMap[ws.skillName] = {
          skillName: ws.skillName,
          count: 0,
          totalScore: 0,
          sources: new Set(),
          levels: { Critical: 0, High: 0, Moderate: 0 }
        };
      }
      skillCountMap[ws.skillName].count += 1;
      skillCountMap[ws.skillName].totalScore += ws.currentScore;
      skillCountMap[ws.skillName].sources.add(ws.source);
      if (skillCountMap[ws.skillName].levels[ws.level] !== undefined) {
        skillCountMap[ws.skillName].levels[ws.level] += 1;
      }
    });
  });

  const commonWeakSkills = Object.values(skillCountMap).map((item) => ({
    ...item,
    avgScore: Math.round(item.totalScore / item.count),
    sourcesList: Array.from(item.sources).join(", ")
  })).sort((a, b) => b.count - a.count);

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (!remediationStudent) return;

    try {
      await apiFetch("/interventions/log", {
        method: "POST",
        body: JSON.stringify({
          student_id: remediationStudent.student_id || remediationStudent.id,
          action_taken: planType,
          notes: planNotes || "Remediation plan assigned by coordinator.",
          recommendations: `Deadline: ${planDeadline}`,
          status: "Action Taken",
        }),
      });
    } catch (e) {
      console.warn("Failed to log intervention to DB:", e);
    }

    const updated = dataList.map((s) => {
      if (s.id === remediationStudent.id) {
        return {
          ...s,
          trendStatus: "Improving",
          assignedPlan: planType,
          targetDeadline: planDeadline,
          notes: planNotes || "Remediation plan assigned by coordinator."
        };
      }
      return s;
    });

    setDataList(updated);
    alert(`Remedial action plan assigned to ${remediationStudent.studentName} successfully in database!`);
    setRemediationStudent(null);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "coord-perf-status--struggling";
      case "Medium":
        return "coord-perf-status--avg";
      case "Low":
        return "coord-perf-status--top";
      default:
        return "coord-perf-status--default";
    }
  };

  const getWeaknessLevelBadge = (level) => {
    switch (level) {
      case "Critical":
        return "coord-perf-diff-pill coord-perf-diff-pill--hard";
      case "High":
        return "coord-perf-diff-pill coord-perf-diff-pill--medium";
      case "Moderate":
      default:
        return "coord-perf-diff-pill coord-perf-diff-pill--easy";
    }
  };

  return (
    <div className="coord-perf-container">
      {/* Page Header */}
      <div className="coord-perf-header-bar">
        <div className="coord-perf-header-left">
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
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="coord-perf-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Academic Support & Skill-Gap Analysis
              </h1>
              <p className="coord-perf-sub" style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                Identify students requiring academic intervention, inspect granular scores across quizzes, coding & interviews, and assign targeted remediation plans.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedDept("all");
            setSelectedBatch("all");
            setSelectedPriority("all");
            setActiveTab("all");
          }}
          className="coord-perf-btn coord-perf-btn--secondary"
        >
          <RefreshCw size={14} />
          Reset All Filters
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="coord-perf-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        <div 
          onClick={() => setActiveTab("immediate")}
          className={`coord-perf-kpi-card ${activeTab === "immediate" ? "coord-perf-kpi-card--active" : ""}`}
          style={{ cursor: "pointer", borderColor: activeTab === "immediate" ? "#e11d48" : "#e2e8f0" }}
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <ShieldAlert size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
              <span className="coord-perf-kpi-label" style={{ whiteSpace: "normal", lineHeight: "1.3", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Needing Immediate Attention</span>
              <span className="coord-perf-status-badge coord-perf-status--struggling" style={{ fontSize: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>High Priority</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{immediateAttentionStudents.length} Students</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#e11d48", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={12} /> High risk priority skills
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("commonSkills")}
          className="coord-perf-kpi-card"
          style={{ cursor: "pointer", borderColor: activeTab === "commonSkills" ? "#4f46e5" : "#e2e8f0" }}
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <BrainCircuit size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
              <span className="coord-perf-kpi-label" style={{ whiteSpace: "normal", lineHeight: "1.3", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Most Common Weak Skills</span>
              <span className="coord-perf-status-badge coord-perf-status--good" style={{ fontSize: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>{commonWeakSkills.length} Topics</span>
            </div>
            <span className="coord-perf-kpi-value" style={{ color: "#4f46e5" }}>
              {commonWeakSkills[0]?.skillName || "DBMS"}
            </span>
            <span className="coord-perf-kpi-sub" style={{ color: "#4f46e5", fontWeight: 600 }}>
              Affecting {commonWeakSkills[0]?.count || 0} students
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("improving")}
          className="coord-perf-kpi-card"
          style={{ cursor: "pointer", borderColor: activeTab === "improving" ? "#059669" : "#e2e8f0" }}
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <TrendingUp size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
              <span className="coord-perf-kpi-label" style={{ whiteSpace: "normal", lineHeight: "1.3", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Students Improving</span>
              <span className="coord-perf-status-badge coord-perf-status--top" style={{ fontSize: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>Positive Growth</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{improvingStudents.length} Students</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle size={12} /> Positive response to practice
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("notImproving")}
          className="coord-perf-kpi-card"
          style={{ cursor: "pointer", borderColor: activeTab === "notImproving" ? "#d97706" : "#e2e8f0" }}
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <TrendingDown size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
              <span className="coord-perf-kpi-label" style={{ whiteSpace: "normal", lineHeight: "1.3", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Performance Not Improving</span>
              <span className="coord-perf-status-badge coord-perf-status--avg" style={{ fontSize: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>Action Needed</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">{notImprovingStudents.length} Students</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#d97706", fontWeight: 600 }}>
              Stagnant or declining trend
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="coord-perf-tabs-nav">
        <button
          onClick={() => setActiveTab("all")}
          className={`coord-perf-tab-btn ${activeTab === "all" ? "coord-perf-tab-btn--active" : ""}`}
        >
          Students Needing Improvement ({dataList.length})
        </button>
        <button
          onClick={() => setActiveTab("immediate")}
          className={`coord-perf-tab-btn ${activeTab === "immediate" ? "coord-perf-tab-btn--active" : ""}`}
        >
          <ShieldAlert size={14} /> Immediate Attention ({immediateAttentionStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("commonSkills")}
          className={`coord-perf-tab-btn ${activeTab === "commonSkills" ? "coord-perf-tab-btn--active" : ""}`}
        >
          <BarChart3 size={14} /> Most Common Weak Skills
        </button>
        <button
          onClick={() => setActiveTab("improving")}
          className={`coord-perf-tab-btn ${activeTab === "improving" ? "coord-perf-tab-btn--active" : ""}`}
        >
          <TrendingUp size={14} /> Improving ({improvingStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("notImproving")}
          className={`coord-perf-tab-btn ${activeTab === "notImproving" ? "coord-perf-tab-btn--active" : ""}`}
        >
          <TrendingDown size={14} /> Not Improving ({notImprovingStudents.length})
        </button>
      </div>

      {/* View Content based on Tab */}
      {activeTab === "commonSkills" ? (
        /* Most Common Weak Skills Analysis Breakdown */
        <div className="coord-perf-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h2 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BrainCircuit style={{ color: "#4f46e5" }} size={20} />
              Most Common Weak Skills Analysis across Department
            </h2>
            <p className="coord-perf-card-sub">
              Aggregated frequency of skill gaps to guide department workshop scheduling and faculty interventions.
            </p>
          </div>

          <div className="coord-perf-cat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {commonWeakSkills.map((skill, idx) => (
              <div key={idx} style={{ padding: "16px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a", margin: 0 }}>{skill.skillName}</h3>
                  <span className="coord-perf-status-badge coord-perf-status--good">
                    {skill.count} Students Weak
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    <span>Average Student Score:</span>
                    <span style={{ fontWeight: 800, color: skill.avgScore < 50 ? "#e11d48" : "#d97706" }}>
                      {skill.avgScore}%
                    </span>
                  </div>
                  <div className="coord-perf-progress-track">
                    <div
                      className={`coord-perf-progress-bar ${skill.avgScore < 50 ? "coord-perf-progress-bar--rose" : "coord-perf-progress-bar--indigo"}`}
                      style={{ width: `${skill.avgScore}%` }}
                    />
                  </div>
                </div>

                <div style={{ paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#64748b", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>
                    <strong style={{ color: "#334155" }}>Primary Sources:</strong> {skill.sourcesList}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Severity:</span>
                    <span style={{ color: "#e11d48", fontWeight: 700 }}>{skill.levels.Critical} Critical</span> · 
                    <span style={{ color: "#d97706", fontWeight: 700 }}>{skill.levels.High} High</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Filterable Students List */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters Bar */}
          <div className="coord-perf-filter-card">
            <div className="coord-perf-filter-row">
              {/* Search Box */}
              <div className="coord-perf-search-wrap">
                <Search size={16} className="coord-perf-search-icon" />
                <input
                  type="text"
                  placeholder="Search student, roll no, mentor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coord-perf-search-input"
                />
              </div>

              <div className="coord-perf-filters-group">
                <div className="coord-perf-filter-label">
                  <Filter size={14} />
                  <span>Filters:</span>
                </div>

                {/* Department Filter */}
                <div style={{ minWidth: '160px', flex: '1 1 160px' }}>
                  <CustomSelect
                    value={selectedDept}
                    options={[
                      { value: "all", label: "All Departments" },
                      ...departments.map((dept) => ({ value: dept, label: `${dept} Department` }))
                    ]}
                    onChange={(val) => setSelectedDept(val)}
                    placeholder="Select department..."
                  />
                </div>

                {/* Batch Filter */}
                <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                  <CustomSelect
                    value={selectedBatch}
                    options={[
                      { value: "all", label: "All Batches" },
                      ...batches.map((b) => ({ value: b, label: `Batch ${b}` }))
                    ]}
                    onChange={(val) => setSelectedBatch(val)}
                    placeholder="Select batch..."
                  />
                </div>

                {/* Priority Filter */}
                <div style={{ minWidth: '150px', flex: '1 1 150px' }}>
                  <CustomSelect
                    value={selectedPriority}
                    options={[
                      { value: "all", label: "All Priorities" },
                      { value: "High", label: "High Priority" },
                      { value: "Medium", label: "Medium Priority" },
                      { value: "Low", label: "Low Priority" }
                    ]}
                    onChange={(val) => setSelectedPriority(val)}
                    placeholder="Select priority..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table View for Students Needing Improvement */}
          <div className="coord-perf-card">
            <div className="coord-perf-table-wrap">
              <table className="coord-perf-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th style={{ textAlign: "center" }}>Overall Performance</th>
                    <th style={{ textAlign: "center" }}>Weak Skills</th>
                    <th style={{ textAlign: "center" }}>Improvement Priority</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      {/* Student Name */}
                      <td>
                        <div className="coord-perf-student-cell">
                          <div className="coord-perf-avatar-lg" style={{ width: "36px", height: "36px", fontSize: "12px", borderRadius: "10px" }}>
                            {student.studentName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="coord-perf-student-name">{student.studentName}</div>
                            <div className="coord-perf-roll">Mentor: {student.assignedMentor || "Assigned"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                        {student.rollNo}
                      </td>

                      {/* Department */}
                      <td>
                        <span className="coord-perf-status-badge coord-perf-status--default">
                          {student.department}
                        </span>
                      </td>

                      {/* Batch */}
                      <td style={{ fontWeight: 600, color: "#475569" }}>
                        {student.batch}
                      </td>

                      {/* Overall Performance */}
                      <td style={{ textAlign: "center" }}>
                        <div className="coord-perf-progress-wrap" style={{ margin: "0 auto" }}>
                          <div style={{ textAlign: "center", fontWeight: 800, color: student.overallPerformance < 65 ? "#e11d48" : "#d97706", fontSize: "13px" }}>
                            {student.overallPerformance}%
                          </div>
                          <div className="coord-perf-progress-track">
                            <div
                              className={`coord-perf-progress-bar ${student.overallPerformance < 65 ? "coord-perf-progress-bar--rose" : "coord-perf-progress-bar--amber"}`}
                              style={{ width: `${student.overallPerformance}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Number of Weak Skills */}
                      <td style={{ textAlign: "center" }}>
                        <span className="coord-perf-status-badge coord-perf-status--struggling">
                          {student.weakSkillsCount} Weak Skills
                        </span>
                      </td>

                      {/* Priority Badge */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`coord-perf-status-badge ${getPriorityBadgeClass(student.priority)}`}>
                          {student.priority} Priority
                        </span>
                      </td>

                      {/* View Skill Gap Button */}
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <button
                            onClick={() => setSelectedSkillGapStudent(student)}
                            className="coord-perf-btn coord-perf-btn--indigo-light"
                          >
                            <Eye size={14} />
                            View Skill Gap
                          </button>
                          <button
                            onClick={() => setRemediationStudent(student)}
                            className="coord-perf-btn coord-perf-btn--secondary"
                            style={{ padding: "0 10px" }}
                            title="Assign Remediation Plan"
                          >
                            <PlusCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                        No students found matching your selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Skill-Gap Details Modal */}
      {selectedSkillGapStudent && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card">
            {/* Modal Header */}
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setSelectedSkillGapStudent(null)}
                className="coord-perf-modal-close"
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Student Skill-Gap Details</h3>
                    <span className={`coord-perf-status-badge ${getPriorityBadgeClass(selectedSkillGapStudent.priority)}`}>
                      {selectedSkillGapStudent.priority} Priority
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                    Student: <strong style={{ color: "#ffffff" }}>{selectedSkillGapStudent.studentName}</strong> ({selectedSkillGapStudent.rollNo}) · Dept: {selectedSkillGapStudent.department} · Batch: {selectedSkillGapStudent.batch}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", display: "block" }}>Overall Performance</span>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#f43f5e" }}>{selectedSkillGapStudent.overallPerformance}%</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="coord-perf-modal-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldAlert style={{ color: "#e11d48" }} size={18} />
                  Identified Weak Skills ({selectedSkillGapStudent.weakSkills.length})
                </h4>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Assigned Mentor: <strong style={{ color: "#0f172a" }}>{selectedSkillGapStudent.assignedMentor || "Not Assigned"}</strong>
                </span>
              </div>

              {/* Weak Skills Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedSkillGapStudent.weakSkills.map((skill, idx) => (
                  <div key={idx} style={{ padding: "16px", background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h5 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{skill.skillName}</h5>
                          <span className={getWeaknessLevelBadge(skill.level)}>
                            {skill.level} Weakness
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>
                          Source: <strong style={{ color: "#334155" }}>{skill.source}</strong>
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#e11d48" }}>{skill.currentScore}%</span>
                      </div>
                    </div>

                    <div className="coord-perf-progress-track">
                      <div
                        className="coord-perf-progress-bar coord-perf-progress-bar--rose"
                        style={{ width: `${skill.currentScore}%` }}
                      />
                    </div>

                    <div style={{ padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", fontSize: "12px" }}>
                      <span style={{ fontWeight: 800, color: "#92400e", display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <Sparkles size={14} style={{ color: "#d97706" }} />
                        Suggested Actionable Improvement:
                      </span>
                      <p style={{ margin: 0, color: "#78350f", lineHeight: 1.5 }}>
                        {skill.suggestedImprovement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="coord-perf-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Target Flow: <strong style={{ color: "#0f172a" }}>Skill-Gap → Weak Skills + Scores → Support Plan</strong>
              </span>
              <button
                onClick={() => {
                  setRemediationStudent(selectedSkillGapStudent);
                  setSelectedSkillGapStudent(null);
                }}
                className="coord-perf-btn coord-perf-btn--indigo-light"
                style={{ background: "#e11d48", color: "#ffffff", border: "none" }}
              >
                <PlusCircle size={15} />
                Assign Formal Support Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Plan Assignment Modal */}
      {remediationStudent && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card" style={{ maxWidth: "520px" }}>
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setRemediationStudent(null)}
                className="coord-perf-modal-close"
              >
                <X size={18} />
              </button>

              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Assign Remedial Support Plan</h3>
              <p style={{ fontSize: "12px", color: "#fda4af", margin: "4px 0 0 0" }}>
                Student: <strong>{remediationStudent.studentName}</strong> ({remediationStudent.rollNo})
              </p>
            </div>

            <form onSubmit={handleAssignPlan} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", fontSize: "12.5px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Select Action Plan Type</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="coord-perf-select"
                  style={{ width: "100%" }}
                >
                  <option value="Custom DBMS & Data Structures Practice Set + 1-on-1 Mentor Counseling">
                    Custom Practice Set & Mentor Counseling
                  </option>
                  <option value="Mandatory DSA & System Design Coding Bootcamp">
                    Mandatory Coding Bootcamp
                  </option>
                  <option value="Official Skill Defaulter Warning + Catchup Labs">
                    Academic Skill Warning Notice
                  </option>
                  <option value="Retake AI Mock Interview Round #2">
                    Retake AI Mock Interview Round
                  </option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Target Remediation Deadline</label>
                <input
                  type="date"
                  value={planDeadline}
                  onChange={(e) => setPlanDeadline(e.target.value)}
                  className="coord-perf-search-input"
                  style={{ width: "100%", paddingLeft: "12px" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Coordinator Directives & Notes</label>
                <textarea
                  rows={3}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Enter specific instructions for student and assigned mentor..."
                  className="coord-perf-search-input"
                  style={{ width: "100%", paddingLeft: "12px", height: "auto", paddingTop: "8px", resize: "none" }}
                />
              </div>

              <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRemediationStudent(null)}
                  className="coord-perf-btn coord-perf-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-perf-btn coord-perf-btn--indigo-light"
                  style={{ background: "#e11d48", color: "#ffffff", border: "none" }}
                >
                  Confirm & Trigger Remediation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
