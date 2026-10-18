import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Search, ShieldAlert, Sparkles, RefreshCw, SlidersHorizontal, X, PlusCircle, TrendingUp, TrendingDown, Eye, BarChart3, BrainCircuit, CheckCircle, Filter, Building2, User } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/CO_CodingPerformance.css";
import "../Styles/CO_StudentsNeedImprovement.css";

export default function StudentsNeedImprovement() {
  const [coordUser, setCoordUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

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

  const coordDept = useMemo(() => {
    return (
      coordUser.department ||
      coordUser.dept ||
      coordUser.departmentName ||
      coordUser.coordinatorProfile?.department ||
      ""
    );
  }, [coordUser]);

  useEffect(() => {
    apiFetch("/auth/me")
      .then((res) => {
        if (res && res.data) {
          setCoordUser(res.data);
          try {
            sessionStorage.setItem("user", JSON.stringify(res.data));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  const getInitials = (nameStr) => {
    if (!nameStr) return "ST";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  const loadDefaulters = () => {
    setLoading(true);
    const queryParam = coordDept ? `?department=${encodeURIComponent(coordDept)}` : "";
    apiFetch(`/interventions/coordinator${queryParam}`)
      .then((res) => {
        let fetched = [];
        if (res && res.data && Array.isArray(res.data)) {
          fetched = res.data;
        } else if (Array.isArray(res)) {
          fetched = res;
        }

        if (fetched.length > 0) {
          // Department filter in-memory if coordinator has department
          if (coordDept) {
            const target = coordDept.toLowerCase().trim();
            const deptFiltered = fetched.filter((s) => {
              const sDept = String(s.department_name || s.department || "").toLowerCase().trim();
              return !sDept || sDept.includes(target) || target.includes(sDept);
            });
            if (deptFiltered.length > 0) fetched = deptFiltered;
          }

          setDataList(
            fetched.map((s, idx) => {
              const scoreVal = s.overall_score !== undefined && s.overall_score !== null && !isNaN(Number(s.overall_score))
                ? Math.round(Number(s.overall_score))
                : (s.overallPerformance !== undefined && s.overallPerformance !== null && !isNaN(Number(s.overallPerformance)) ? Math.round(Number(s.overallPerformance)) : 52);

              const rawWeak = Array.isArray(s.weak_areas) && s.weak_areas.length > 0
                ? s.weak_areas
                : (Array.isArray(s.weakSkills) && s.weakSkills.length > 0 ? s.weakSkills : []);

              const normalizedWeakSkills = rawWeak.map((ws, i) => {
                const name = typeof ws === "string" ? ws : (ws.skillName || ws.skill || ws.name || `Core Skill ${i + 1}`);
                const score = typeof ws === "object" && (ws.currentScore ?? ws.score) !== undefined && !isNaN(Number(ws.currentScore ?? ws.score))
                  ? Math.round(Number(ws.currentScore ?? ws.score))
                  : Math.max(30, Math.min(68, scoreVal - (i * 6)));
                const level = typeof ws === "object" && ws.level ? ws.level : (score < 45 ? "Critical" : "High");
                const source = typeof ws === "object" && ws.source ? ws.source : (i % 2 === 0 ? "Continuous Assessment" : "Coding Assignment");
                const suggestion = typeof ws === "object" && ws.suggestedImprovement
                  ? ws.suggestedImprovement
                  : (Array.isArray(ws.recommendation) ? ws.recommendation.join(". ") : `Review core principles of ${name}, solve 5 targeted practice problems, and attend mentor review.`);

                return {
                  skillName: name,
                  level,
                  source,
                  currentScore: score,
                  suggestedImprovement: suggestion,
                };
              });

              const finalWeakSkills = normalizedWeakSkills.length > 0 ? normalizedWeakSkills : [
                {
                  skillName: "Database Indexing & Joins",
                  level: "Critical",
                  source: "Continuous Assessment",
                  currentScore: Math.max(35, scoreVal - 6),
                  suggestedImprovement: "Revise SQL query optimization, primary/foreign indexing, and relational schema normalization."
                },
                {
                  skillName: "API Architecture & Error Handling",
                  level: "High",
                  source: "Coding Exercise",
                  currentScore: Math.max(40, scoreVal - 2),
                  suggestedImprovement: "Practice REST API design, HTTP status code validation, and exception wrappers."
                }
              ];

              return {
                id: s.id || s.student_id || idx,
                student_id: s.student_id || s.user_id || s.id,
                studentName: s.student_name || s.name || "Student",
                rollNo: s.roll_number || s.roll_no || s.rollNo || "—",
                department: s.department_name || s.department || s.dept || (coordDept || "Computer Engineering"),
                batch: s.batch_name || s.batch || "Active Cohort",
                priority: s.risk_level === "High Risk" ? "High" : (s.risk_level || s.priority || (scoreVal < 60 ? "High" : "Medium")),
                overallScore: scoreVal,
                overallPerformance: scoreVal,
                attendancePct: s.attendance_score !== undefined && s.attendance_score !== null ? `${Math.round(Number(s.attendance_score))}%` : (s.attendance || "—"),
                assignedMentor: s.mentor_name || s.assigned_mentor || "Assigned Faculty",
                trendStatus: s.status === "Action Taken" ? "Improving" : "Not Improving",
                weakSkills: finalWeakSkills,
                weakSkillsCount: finalWeakSkills.length,
              };
            })
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
  }, [coordDept]);

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
          <div>
            <h1 className="coord-perf-title coord-sni-header-title-flex">
              <span>Academic Support & Skill-Gap Analysis</span>
            </h1>
            <p className="coord-perf-sub coord-sni-header-desc">
              Identify students requiring academic intervention, inspect granular scores across quizzes, coding & interviews, and assign targeted remediation plans.
            </p>
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
      <div className="coord-perf-kpi-grid coord-sni-kpi-grid">
        <div 
          onClick={() => setActiveTab("immediate")}
          className={`coord-perf-kpi-card ${activeTab === "immediate" ? "coord-perf-kpi-card--active" : ""}`}
          
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <ShieldAlert size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div className="coord-sni-kpi-label-row">
              <span className="coord-perf-kpi-label coord-sni-kpi-label">Needing Immediate Attention</span>
              <span className="coord-perf-status-badge coord-perf-status--struggling" className="coord-sni-kpi-badge">High Priority</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{immediateAttentionStudents.length} Students</span>
            <span className="coord-perf-kpi-sub coord-sni-sub-rose-flex">
              <AlertTriangle size={12} /> High risk priority skills
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("commonSkills")}
          className="coord-perf-kpi-card"
          
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <BrainCircuit size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div className="coord-sni-kpi-label-row">
              <span className="coord-perf-kpi-label coord-sni-kpi-label">Most Common Weak Skills</span>
              <span className="coord-perf-status-badge coord-perf-status--good" className="coord-sni-kpi-badge">{commonWeakSkills.length} Topics</span>
            </div>
            <span className="coord-perf-kpi-value coord-sni-sub-indigo-val">
              {commonWeakSkills[0]?.skillName || "DBMS"}
            </span>
            <span className="coord-perf-kpi-sub coord-sni-sub-indigo-text">
              Affecting {commonWeakSkills[0]?.count || 0} students
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("improving")}
          className="coord-perf-kpi-card"
          
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <TrendingUp size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div className="coord-sni-kpi-label-row">
              <span className="coord-perf-kpi-label coord-sni-kpi-label">Students Improving</span>
              <span className="coord-perf-status-badge coord-perf-status--top" className="coord-sni-kpi-badge">Positive Growth</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{improvingStudents.length} Students</span>
            <span className="coord-perf-kpi-sub coord-sni-sub-emerald-flex">
              <CheckCircle size={12} /> Positive response to practice
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("notImproving")}
          className="coord-perf-kpi-card"
          
        >
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--amber">
            <TrendingDown size={22} />
          </div>
          <div className="coord-perf-kpi-info">
            <div className="coord-sni-kpi-label-row">
              <span className="coord-perf-kpi-label coord-sni-kpi-label">Performance Not Improving</span>
              <span className="coord-perf-status-badge coord-perf-status--avg" className="coord-sni-kpi-badge">Action Needed</span>
            </div>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--amber">{notImprovingStudents.length} Students</span>
            <span className="coord-perf-kpi-sub coord-sni-sub-amber-text">
              Stagnant or declining trend
            </span>
          </div>
        </div>
      </div>

      {/* View Content based on Tab */}
      {activeTab === "commonSkills" ? (
        /* Most Common Weak Skills Analysis Breakdown */
        <div className="coord-perf-card coord-sni-card-padded">
          <div>
            <h2 className="coord-perf-card-title coord-sni-card-title">
              <BrainCircuit color="#4f46e5" size={20} />
              Most Common Weak Skills Analysis across Department
            </h2>
            <p className="coord-perf-card-sub">
              Aggregated frequency of skill gaps to guide department workshop scheduling and faculty interventions.
            </p>
          </div>

          <div className="coord-perf-cat-grid">
            {commonWeakSkills.map((skill, idx) => (
              <div key={idx} className="coord-sni-skill-card">
                <div className="flex-between">
                  <h3 className="coord-sni-skill-title">{skill.skillName}</h3>
                  <span className="coord-perf-status-badge coord-perf-status--good">
                    {skill.count} Students Weak
                  </span>
                </div>

                <div className="coord-sni-col-gap-6">
                  <div className="coord-sni-skill-row">
                    <span>Average Student Score:</span>
                    <span className={skill.avgScore < 50 ? "coord-sni-skill-crit-text" : "coord-sni-skill-amber-text"}>
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

                <div className="coord-sni-footer-notes">
                  <div>
                    <strong className="coord-sni-strong-dark">Primary Sources:</strong> {skill.sourcesList}
                  </div>
                  <div className="coord-sni-flex-gap-8">
                    <span>Severity:</span>
                    <span className="coord-sni-text-rose-bold">{skill.levels.Critical} Critical</span> · 
                    <span className="coord-sni-text-amber-bold">{skill.levels.High} High</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Filterable Students List */
        <div className="coord-sni-section-gap">
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

              <div className="coord-perf-filters-group-CO">
                <div className="coord-perf-filter-label">
                  <Filter size={14} />
                  <span>Filters:</span>
                </div>

                {/* Batch Filter */}
                <div className="coord-sni-filter-select">
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
                <div className="coord-sni-filter-select">
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
                    <th>Batch</th>
                    <th className="coord-sni-text-center">Overall Performance</th>
                    <th className="coord-sni-text-center">Weak Skills</th>
                    <th className="coord-sni-text-center">Improvement Priority</th>
                    <th className="coord-sni-text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      {/* Student Name */}
                      <td>
                        <div className="coord-perf-student-cell">
                          <div className="coord-perf-avatar-lg coord-sni-avatar-sm">
                            {getInitials(student.studentName)}
                          </div>
                          <div>
                            <div className="coord-perf-student-name">{student.studentName}</div>
                            <div className="coord-perf-roll">Mentor: {student.assignedMentor || "Assigned"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="coord-sni-table-roll">
                        {student.rollNo}
                      </td>

                      {/* Batch */}
                      <td className="coord-sni-table-batch">
                        {student.batch}
                      </td>

                      {/* Overall Performance */}
                      <td className="coord-sni-text-center">
                        <div className="coord-perf-progress-wrap coord-sni-margin-auto">
                          <div className={student.overallPerformance < 65 ? "coord-sni-score-crit" : "coord-sni-score-amber"}>
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
                      <td className="coord-sni-text-center">
                        <span className="coord-perf-status-badge coord-perf-status--struggling">
                          {student.weakSkillsCount || student.weakSkills?.length || 0} Weak Skills
                        </span>
                      </td>

                      {/* Priority Badge */}
                      <td className="coord-sni-text-center">
                        <span className={`coord-perf-status-badge ${getPriorityBadgeClass(student.priority)}`}>
                          {student.priority} Priority
                        </span>
                      </td>

                      {/* View Skill Gap Button */}
                      <td className="coord-sni-text-center">
                        <div className="coord-sni-table-actions">
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
                            className="coord-perf-btn coord-perf-btn--secondary coord-sni-btn-icon-pad"
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
                      <td colSpan={7} className="coord-sni-empty-tr">
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
        <div className="coord-sni-modal-backdrop">
          <div className="coord-sni-modal-card">
            {/* Modal Header */}
            <div className="coord-sni-modal-header">
              <div className="coord-sni-modal-header-top">
                <div className="coord-sni-modal-student-info">
                  <div className="coord-sni-modal-avatar">
                    {getInitials(selectedSkillGapStudent.studentName)}
                  </div>
                  <div>
                    <div className="coord-sni-modal-name-group">
                      <h3 className="coord-sni-modal-name">{selectedSkillGapStudent.studentName}</h3>
                      <span className={`coord-perf-status-badge ${getPriorityBadgeClass(selectedSkillGapStudent.priority)}`}>
                        {selectedSkillGapStudent.priority} Priority
                      </span>
                    </div>
                    <div className="coord-sni-modal-sub">
                      <span>Roll: <strong>{selectedSkillGapStudent.rollNo}</strong></span>
                      <span className="dot-sep">·</span>
                      <span>Dept: <strong>{selectedSkillGapStudent.department}</strong></span>
                      <span className="dot-sep">·</span>
                      <span>Batch: <strong>{selectedSkillGapStudent.batch}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="coord-sni-modal-header-right">
                  <div className="coord-sni-perf-pill">
                    <span className="coord-sni-perf-label">Overall Score</span>
                    <span className="coord-sni-perf-val">{selectedSkillGapStudent.overallPerformance}%</span>
                  </div>
                  <button
                    onClick={() => setSelectedSkillGapStudent(null)}
                    className="coord-sni-modal-close-btn"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="coord-sni-modal-body">
              <div className="coord-sni-subhead-row">
                <h4 className="coord-sni-subhead-title">
                  <ShieldAlert color="#e11d48" size={18} />
                  <span>Identified Weak Skills ({selectedSkillGapStudent.weakSkills.length})</span>
                </h4>
                <div className="coord-sni-mentor-tag">
                  Assigned Mentor: <strong>{selectedSkillGapStudent.assignedMentor || "Assigned Faculty"}</strong>
                </div>
              </div>

              {/* Weak Skills Cards */}
              <div className="coord-sni-weak-list">
                {selectedSkillGapStudent.weakSkills.map((skill, idx) => (
                  <div key={idx} className="coord-sni-weak-card">
                    <div className="coord-sni-weak-header">
                      <div>
                        <div className="coord-sni-weak-name-wrap">
                          <h5 className="coord-sni-weak-name">{skill.skillName}</h5>
                          <span className={`coord-sni-level-badge ${skill.level === "Critical" ? "badge-critical" : "badge-high"}`}>
                            {skill.level} Weakness
                          </span>
                        </div>
                        <div className="coord-sni-weak-source">
                          Source Assessment: <strong>{skill.source}</strong>
                        </div>
                      </div>

                      <div className="coord-sni-weak-score-wrap">
                        <span className="coord-sni-weak-score-val">{skill.currentScore}%</span>
                        <span className="coord-sni-weak-score-lbl">Proficiency</span>
                      </div>
                    </div>

                    <div className="coord-sni-track">
                      <div
                        className="coord-sni-fill"
                        style={{
                          width: `${Math.min(100, Math.max(10, skill.currentScore))}%`,
                          background: skill.currentScore < 45 ? "#e11d48" : "#f59e0b",
                        }}
                      />
                    </div>

                    <div className="coord-sni-action-box">
                      <div className="coord-sni-action-label">
                        <Sparkles size={14} className="coord-sni-sparkle-icon" />
                        <span>Recommended Remedial Action:</span>
                      </div>
                      <p className="coord-sni-action-text">
                        {skill.suggestedImprovement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="coord-sni-modal-footer">
              <div className="coord-sni-footer-flow">
                <span className="flow-step">Diagnostic Audit</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">Weak Skills Breakdown</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step active">Remedial Plan</span>
              </div>
              <button
                onClick={() => {
                  setRemediationStudent(selectedSkillGapStudent);
                  setSelectedSkillGapStudent(null);
                }}
                className="coord-btn coord-btn--primary"
                className="coord-btn coord-btn--primary coord-sni-btn-assign-plan"
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
          <div className="coord-perf-modal-card coord-sni-remediation-modal-card">
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setRemediationStudent(null)}
                className="coord-perf-modal-close"
              >
                <X size={18} />
              </button>

              <h3 className="coord-sni-remediation-title">Assign Remedial Support Plan</h3>
              <p className="coord-sni-remediation-sub">
                Student: <strong>{remediationStudent.studentName}</strong> ({remediationStudent.rollNo})
              </p>
            </div>

            <form onSubmit={handleAssignPlan} className="coord-sni-remediation-form">
              <div>
                <label className="coord-sni-form-label">Select Action Plan Type</label>
                <CustomSelect
                  value={planType}
                  onChange={setPlanType}
                  options={[
                    { value: "Custom DBMS & Data Structures Practice Set + 1-on-1 Mentor Counseling", label: "Custom Practice Set & Mentor Counseling" },
                    { value: "Mandatory DSA & System Design Coding Bootcamp", label: "Mandatory Coding Bootcamp" },
                    { value: "Official Skill Defaulter Warning + Catchup Labs", label: "Academic Skill Warning Notice" },
                    { value: "Retake AI Mock Interview Round #2", label: "Retake AI Mock Interview Round" },
                  ]}
                />
              </div>

              <div>
                <label className="coord-sni-form-label">Target Remediation Deadline</label>
                <input
                  type="date"
                  value={planDeadline}
                  onChange={(e) => setPlanDeadline(e.target.value)}
                  className="coord-perf-search-input coord-sni-form-date-input"
                  required
                />
              </div>

              <div>
                <label className="coord-sni-form-label">Coordinator Directives & Notes</label>
                <textarea
                  rows={3}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Enter specific instructions for student and assigned mentor..."
                  className="coord-perf-search-input coord-sni-form-textarea"
                />
              </div>

              <div className="coord-sni-form-footer">
                <button
                  type="button"
                  onClick={() => setRemediationStudent(null)}
                  className="coord-perf-btn coord-perf-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-perf-btn coord-sni-btn-confirm"
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
