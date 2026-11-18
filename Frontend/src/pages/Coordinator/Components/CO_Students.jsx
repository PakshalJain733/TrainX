import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../../utils/api";
import { Search, GraduationCap, Users, Mail, Phone, Sparkles, CheckCircle2, CircleDot, Lock, ArrowLeft, Send, Target, X, Building2, TrendingUp, AlertTriangle, Eye, ShieldCheck, Award } from "lucide-react";
import CustomSelect from "../../../components/ui/CustomSelect";
import { batchAPI } from "../../../services/api";
import { EVENTS } from "../../../utils/sharedStore";
import { isSameDepartment } from "../../../utils/departmentHelper";
import "../Styles/CO_Students.css";

export default function CoordinatorStudents() {
  const [coordUser, setCoordUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [students, setStudents] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [studentRoadmap, setStudentRoadmap] = useState(null);
  const [studentMilestones, setStudentMilestones] = useState([]);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  const coordDept = useMemo(() => {
    return (
      coordUser.department ||
      coordUser.dept ||
      coordUser.departmentName ||
      coordUser.coordinatorProfile?.department ||
      ""
    );
  }, [coordUser]);

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) {
        setBatchesList(data);
      } else {
        setBatchesList([]);
      }
    } catch (err) {
      setBatchesList([]);
    }
  };

  // Sync logged-in coordinator profile to ensure exact department is loaded
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

  // Fetch real students strictly scoped to coordinator's department
  useEffect(() => {
    setLoading(true);
    fetchBatches();
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);

    const queryParam = coordDept ? `?department=${encodeURIComponent(coordDept)}` : "";
    apiFetch(`/coordinator/students${queryParam}`)
      .then((res) => {
        let fetched = [];
        if (res && res.data && Array.isArray(res.data)) {
          fetched = res.data;
        } else if (res && res.data && Array.isArray(res.data.students)) {
          fetched = res.data.students;
        } else if (res && res.students && Array.isArray(res.students)) {
          fetched = res.students;
        } else if (Array.isArray(res)) {
          fetched = res;
        }

        // Strict department filter if coordinator department is known
        if (coordDept && Array.isArray(fetched) && fetched.length > 0) {
          const deptFiltered = fetched.filter((s) => {
            if (!s.department) return false;
            return isSameDepartment(s.department, coordDept);
          });
          setStudents(deptFiltered);
        } else {
          setStudents(Array.isArray(fetched) ? fetched : []);
        }
      })
      .catch((err) => {
        console.warn("[CO_Students] fetch error:", err);
        setStudents([]);
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
  }, [coordDept]);

  const handleOpenStudentDetail = async (student) => {
    setSelectedStudent(student);
    setActiveTab("roadmap");
    setStudentRoadmap(null);
    setStudentMilestones([]);
    setIsRoadmapLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fetch real saved roadmap if available
    try {
      const studentIdentifier =
        student.userId ||
        student.studentId ||
        (student.id ? String(student.id).replace("st-", "") : "");
      if (studentIdentifier) {
        const res = await apiFetch(`/roadmaps/student/${studentIdentifier}`);
        if (
          res &&
          res.data &&
          Array.isArray(res.data.milestones) &&
          res.data.milestones.length > 0
        ) {
          setStudentRoadmap(res.data);
          setStudentMilestones(res.data.milestones);
        }
      }
    } catch (err) {
      console.warn("[CO_Students] Failed to load student roadmap:", err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return "ST";
    const parts = nameStr.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    return list.filter((s) => {
      const matchesSearch =
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNo || s.roll_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase());
      const matchesBatch = batchFilter === "All" || s.batch === batchFilter;
      const matchesRisk =
        riskFilter === "All" ||
        String(s.riskStatus || "").toLowerCase().includes(riskFilter.toLowerCase());
      return matchesSearch && matchesBatch && matchesRisk;
    });
  }, [students, search, batchFilter, riskFilter]);

  // Department Aggregated KPI Metrics
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const attList = filteredStudents
      .map((s) => (typeof s.attendanceNum === "number" ? s.attendanceNum : parseFloat(s.attendance)))
      .filter((v) => !isNaN(v));
    const avgAtt = attList.length > 0 ? Math.round(attList.reduce((a, b) => a + b, 0) / attList.length) : null;

    const quizList = filteredStudents
      .map((s) => parseFloat(s.avgScore || s.quizScore))
      .filter((v) => !isNaN(v));
    const avgQuiz = quizList.length > 0 ? Math.round(quizList.reduce((a, b) => a + b, 0) / quizList.length) : null;

    const highRisk = filteredStudents.filter((s) =>
      String(s.riskStatus || "").toLowerCase().includes("risk")
    ).length;

    const enrolledRoadmaps = filteredStudents.filter((s) => Boolean(s.selectedGoalName)).length;

    return { total, avgAtt, avgQuiz, highRisk, enrolledRoadmaps };
  }, [filteredStudents]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="status-badge-completed">Completed</span>;
      case "in-progress":
        return <span className="status-badge-progress">In Progress</span>;
      case "locked":
      default:
        return <span className="status-badge-locked">Locked</span>;
    }
  };

  // FULLSCREEN STUDENT DETAIL VIEW
  if (selectedStudent) {
    return (
      <div className="student-detail-wrapper">
        {/* Top Back Navigation Bar */}
        <div className="student-detail-top-nav">
          <button
            className="coord-btn student-btn-back"
            onClick={() => setSelectedStudent(null)}
          >
            <ArrowLeft size={16} /> Back to Student Directory
          </button>

          <span
            className={`coord-student-pill coord-student-pill--lg ${
              selectedStudent.riskStatus === "Top Performer"
                ? "coord-student-pill--top"
                : selectedStudent.riskStatus === "Good"
                ? "coord-student-pill--good"
                : selectedStudent.riskStatus === "Moderate"
                ? "coord-student-pill--moderate"
                : "coord-student-pill--risk"
            }`}
          >
            {selectedStudent.riskStatus}
          </span>
        </div>

        {/* Student Profile Overview Header Card */}
        <div className="student-detail-header-card">
          <div>
            <div className="student-detail-user-row">
              <div className="student-detail-avatar">
                {selectedStudent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h1 className="student-detail-title">{selectedStudent.name}</h1>
                <p className="student-detail-sub">
                  Roll No: <strong>{selectedStudent.rollNo}</strong> · Batch: <strong>{selectedStudent.batch}</strong> ({selectedStudent.department})
                </p>
              </div>
            </div>

            <div className="student-detail-contact-row">
              <span>
                <Mail size={14} className="student-detail-contact-icon" /> {selectedStudent.email}
              </span>
              <span>
                <Phone size={14} className="student-detail-contact-icon" /> {selectedStudent.phone}
              </span>
            </div>
          </div>

          <div className="student-detail-stats-group">
            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">Attendance</div>
              <div className="student-detail-stat-val student-detail-stat-val--attendance">{selectedStudent.attendance}%</div>
            </div>

            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">Quiz Average</div>
              <div className="student-detail-stat-val student-detail-stat-val--quiz">{selectedStudent.avgScore}%</div>
            </div>

            <div className="student-detail-stat-box">
              <div className="student-detail-stat-label">AI Interview</div>
              <div className="student-detail-stat-val student-detail-stat-val--interview">{selectedStudent.interviewScore}%</div>
            </div>
          </div>
        </div>

        {/* Fullscreen Navigation Tabs Bar */}
        <div className="coord-tabs-bar">
          <button
            className={`coord-tab-btn ${activeTab === "roadmap" ? "coord-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("roadmap")}
          >
            <Sparkles size={16} /> Selected AI Career Roadmap
          </button>
          <button
            className={`coord-tab-btn ${activeTab === "overview" ? "coord-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <GraduationCap size={16} /> Academic Scores & Placement Readiness
          </button>
        </div>

        {/* TAB 1: FULLSCREEN AI ROADMAP INTERFACE */}
        {activeTab === "roadmap" && (() => {
          const hasMilestones = Array.isArray(studentMilestones) && studentMilestones.length > 0;
          const trackTitle = studentRoadmap?.targetRole || studentRoadmap?.careerTrack || selectedStudent?.selectedGoalName || "";
          const completedCount = hasMilestones ? studentMilestones.filter((m) => m.status === "completed").length : 0;
          const totalCount = hasMilestones ? studentMilestones.length : 0;
          const overallProgress = totalCount > 0 
            ? Math.round(studentMilestones.reduce((acc, m) => acc + (Number(m.progress) || 0), 0) / totalCount) 
            : 0;

          return (
            <div className="student-detail-wrapper">
              {isRoadmapLoading ? (
                <div className="student-roadmap-generator-card" style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                  <Sparkles size={28} className="student-spin" style={{ color: "#2563eb", margin: "0 auto 12px" }} />
                  <p style={{ color: "#64748b", margin: 0, fontWeight: 500 }}>
                    Loading student's AI career roadmap...
                  </p>
                </div>
              ) : hasMilestones ? (
                <>
                  {/* Student Active AI Roadmap Read-Only Overview */}
                  <div className="student-roadmap-generator-card" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", border: "1px solid #bfdbfe", padding: "20px 24px" }}>
                    <div className="student-roadmap-title-row">
                      <div className="student-roadmap-icon-badge" style={{ background: "#dbeafe", color: "#2563eb" }}>
                        <Sparkles size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#2563eb" }}>
                              Student Career Track
                            </span>
                            <h3 className="student-roadmap-generator-title" style={{ margin: "2px 0 0", color: "#1e3a8a", fontSize: "18px" }}>
                              {trackTitle || "Personalized AI Career Path"}
                            </h3>
                          </div>
                          <span className="coord-chip coord-chip--success" style={{ fontWeight: 600, fontSize: "13px", padding: "6px 12px" }}>
                            {completedCount} of {totalCount} Milestones Completed ({overallProgress}%)
                          </span>
                        </div>
                        <p className="student-roadmap-generator-desc" style={{ marginTop: "8px", color: "#475569", fontSize: "13px" }}>
                          This AI roadmap is actively pursued by the student. Milestones and progress reflect live completions from their student portal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Milestones Timeline */}
                  <div className="student-roadmap-timeline">
                    {studentMilestones.map((m, idx) => (
                      <div key={m.id || idx} className={`student-roadmap-milestone-card milestone-status-${m.status || "locked"}`}>
                        <div className="student-milestone-top-row">
                          <div className="student-milestone-title-group">
                            {m.status === "completed" && <CheckCircle2 size={20} color="#10b981" />}
                            {m.status === "in-progress" && <CircleDot size={20} color="#2563eb" />}
                            {(!m.status || m.status === "locked") && <Lock size={18} color="#94a3b8" />}
                            <h4 className="student-milestone-title">
                              {m.title}
                            </h4>
                          </div>
                          {getStatusBadge(m.status || "locked")}
                        </div>

                        <p className="student-milestone-desc">{m.desc || m.description}</p>

                        {/* Progress Bar */}
                        <div className="student-milestone-progress-track">
                          <div
                            className={`student-milestone-progress-bar ${m.status || "locked"}`}
                            style={{ width: `${m.progress || 0}%` }}
                          />
                        </div>

                        {/* Tags & Meta Stats */}
                        <div className="student-milestone-meta-row">
                          <div className="student-tag-list">
                            {(Array.isArray(m.tags) ? m.tags : (m.topics ? (Array.isArray(m.topics) ? m.topics : String(m.topics).split(",")) : [])).map((tag, tIdx) => (
                              <span key={tIdx} className="student-tag-pill">
                                {typeof tag === "object" ? (tag.name || tag.title || "Topic") : String(tag).trim()}
                              </span>
                            ))}
                          </div>
                          <div className="student-milestone-stats-text">
                            {Array.isArray(m.quizzes) ? m.quizzes.length : (m.quizzes || 3)} quizzes · {Array.isArray(m.exercises) ? m.exercises.length : (m.exercises || 5)} exercises
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Empty State: Student Has Not Created Roadmap Yet */
                <div className="student-roadmap-generator-card" style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                  <div className="student-roadmap-icon-badge" style={{ margin: "0 auto 16px", background: "#f1f5f9", color: "#64748b" }}>
                    <Sparkles size={24} />
                  </div>
                  <h3 className="student-roadmap-generator-title" style={{ color: "#334155", marginBottom: "8px", fontSize: "17px" }}>
                    No AI Career Roadmap Generated Yet
                  </h3>
                  <p className="student-roadmap-generator-desc" style={{ maxWidth: "540px", margin: "0 auto", color: "#64748b", lineHeight: 1.6 }}>
                    {selectedStudent?.name || "This student"} has not yet selected a career goal or generated an AI learning roadmap in their Student Portal. Once the student initializes their roadmap, their learning milestones and progress will appear here for review.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 2: OVERVIEW & ACADEMICS */}
        {activeTab === "overview" && (
          <div className="student-detail-wrapper">
            <div className="coord-card">
              <div className="coord-card-title">Placement Readiness Audit</div>
              <div className="student-readiness-badge">
                {selectedStudent.placementStatus}
              </div>
              <p className="student-readiness-desc">
                Candidate has cleared department criteria and is currently eligible for tier-1 partner recruitment drives.
              </p>
            </div>

            <div className="coord-card">
              <div className="coord-card-title">Coordinator Actions & Warnings</div>
              <div className="student-actions-row">
                <button
                  className="coord-btn coord-btn--primary"
                  onClick={() => alert(`Warning notice sent to ${selectedStudent.name}`)}
                >
                  <Send size={15} /> Send Counseling Warning
                </button>
                <button
                  className="coord-btn student-medical-btn"
                  onClick={() => alert(`Medical override granted for ${selectedStudent.name}`)}
                >
                  Grant Attendance Medical Override
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT STUDENT DIRECTORY TABLE VIEW
  return (
    <div className="coord-students-container">
      {/* Top Header & Department Scope */}
      <div className="coord-page-header">
        <div className="coord-header-left">
          <div className="coord-header-icon-box">
            <Users size={22} />
          </div>
          <div>
            <h1 className="coord-header-title-text">
              Student Directory & AI Roadmap Audit
            </h1>
            <p className="coord-header-sub-text">
              Real-time academic performance, AI roadmap tracking, and risk compliance for your department.
            </p>
          </div>
        </div>

        {coordDept && (
          <div className="coord-dept-scope-pill">
            <Building2 size={15} className="coord-dept-icon" />
            <span className="coord-dept-label">Department:</span>
            <span className="coord-dept-name">{coordDept}</span>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="coord-kpi-grid">
        <div className="coord-kpi-card">
          <div className="coord-kpi-header">
            <span className="coord-kpi-title">Total Students</span>
            <div className="coord-kpi-icon-box icon-blue">
              <Users size={18} />
            </div>
          </div>
          <div className="coord-kpi-value">{stats.total}</div>
          <div className="coord-kpi-hint">Scoped to {coordDept || "Department"}</div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-header">
            <span className="coord-kpi-title">Avg Attendance</span>
            <div className="coord-kpi-icon-box icon-green">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="coord-kpi-value">
            {stats.avgAtt !== null ? `${stats.avgAtt}%` : "0"}
          </div>
          <div className="coord-kpi-hint">Department verified rate</div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-header">
            <span className="coord-kpi-title">Avg Quiz Score</span>
            <div className="coord-kpi-icon-box icon-indigo">
              <Award size={18} />
            </div>
          </div>
          <div className="coord-kpi-value">
            {stats.avgQuiz !== null ? `${stats.avgQuiz}%` : "0"}
          </div>
          <div className="coord-kpi-hint">Assessment benchmark</div>
        </div>

        <div className={`coord-kpi-card ${stats.highRisk > 0 ? "coord-kpi-card--alert" : ""}`}>
          <div className="coord-kpi-header">
            <span className="coord-kpi-title">High Risk Defaulters</span>
            <div className={`coord-kpi-icon-box ${stats.highRisk > 0 ? "icon-red" : "icon-gray"}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={`coord-kpi-value ${stats.highRisk > 0 ? "text-red" : ""}`}>
            {stats.highRisk}
          </div>
          <div className="coord-kpi-hint">
            {stats.highRisk > 0 ? "Requires coordinator counseling" : "No critical defaulters"}
          </div>
        </div>

        <div className="coord-kpi-card">
          <div className="coord-kpi-header">
            <span className="coord-kpi-title">Roadmaps Active</span>
            <div className="coord-kpi-icon-box icon-purple">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="coord-kpi-value">{stats.enrolledRoadmaps}</div>
          <div className="coord-kpi-hint">Pursuing AI career tracks</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="coord-filter-row-wrap">
        <div className="coord-search-input-box">
          <Search size={16} className="coord-search-icon-pos" />
          <input
            type="text"
            className="coord-search-input-field"
            placeholder="Search student name, roll no or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coord-filter-select-box">
          <CustomSelect
            value={batchFilter}
            options={[
              { value: "All", label: "All Batches" },
              ...batchesList.map((b) => ({ value: b.name, label: b.name })),
            ]}
            onChange={(val) => setBatchFilter(val)}
            placeholder="Select batch..."
          />
        </div>

        <div className="coord-filter-select-box">
          <CustomSelect
            value={riskFilter}
            options={[
              { value: "All", label: "All Risk Levels" },
              { value: "Top Performer", label: "Top Performer" },
              { value: "Good", label: "Good Standing" },
              { value: "Moderate", label: "Moderate Risk" },
              { value: "High Risk", label: "High Risk" },
            ]}
            onChange={(val) => setRiskFilter(val)}
            placeholder="Select risk level..."
          />
        </div>

        <div className="coord-filter-count-badge">
          Showing <strong>{filteredStudents.length}</strong> of {students.length} students
        </div>
      </div>

      {/* Table Card */}
      <div className="coord-table-card">
        {loading ? (
          <div className="coord-table-loading-state">
            <div className="coord-loading-spinner" />
            <p>Loading department students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="coord-empty-table-state">
            <div className="coord-empty-icon-wrap">
              <Users size={32} />
            </div>
            <div className="coord-empty-title">No Students Found</div>
            <p className="coord-empty-desc">
              {search || batchFilter !== "All" || riskFilter !== "All"
                ? "No students match your active search and filter criteria. Try resetting filters."
                : `No enrolled students registered in ${coordDept || "your department"} yet.`}
            </p>
          </div>
        ) : (
          <div className="coord-table-responsive-wrapper">
            <table className="coord-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No & Batch</th>
                  <th>Selected AI Roadmap</th>
                  <th>Attendance</th>
                  <th>Quiz Score</th>
                  <th>AI Interview</th>
                  <th>Risk Level</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="student-info-cell">
                        <div className="student-avatar-bubble">
                          {getInitials(s.name)}
                        </div>
                        <div className="student-meta-col">
                          <div className="student-table-name">{s.name}</div>
                          <div className="student-table-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="student-table-roll">{s.rollNo || "—"}</div>
                      <div className="student-batch-wrapper">
                        {s.batch === "Unassigned" ? (
                          <span className="student-batch-unassigned">Unassigned</span>
                        ) : (
                          <span className="student-batch-pill">{s.batch}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {s.selectedGoalName ? (
                        <span className="student-roadmap-pill">
                          <Sparkles size={13} className="roadmap-icon" />
                          {s.selectedGoalName}
                        </span>
                      ) : (
                        <span className="student-roadmap-pill student-roadmap-pill--none">
                          Not Enrolled
                        </span>
                      )}
                    </td>
                    <td>
                      {s.attendance && s.attendance !== "—" ? (
                        <span
                          className={`student-metric-pill ${
                            (s.attendanceNum ?? parseFloat(s.attendance)) >= 75
                              ? "metric-good"
                              : (s.attendanceNum ?? parseFloat(s.attendance)) >= 60
                              ? "metric-amber"
                              : "metric-danger"
                          }`}
                        >
                          {s.attendance}
                        </span>
                      ) : (
                        <span className="student-metric-empty">—</span>
                      )}
                    </td>
                    <td>
                      {s.avgScore && s.avgScore !== "—" ? (
                        <span className="student-metric-pill metric-indigo">
                          {s.avgScore}
                        </span>
                      ) : (
                        <span className="student-metric-empty">—</span>
                      )}
                    </td>
                    <td>
                      {s.interviewScore && s.interviewScore !== "—" ? (
                        <span className="student-metric-pill metric-purple">
                          {s.interviewScore}
                        </span>
                      ) : (
                        <span className="student-metric-empty">—</span>
                      )}
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
                    <td className="text-center">
                      <button
                        className="coord-btn coord-btn--primary coord-table-action-btn"
                        onClick={() => handleOpenStudentDetail(s)}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
