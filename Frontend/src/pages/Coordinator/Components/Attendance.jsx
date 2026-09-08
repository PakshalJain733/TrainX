import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  X,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  ShieldAlert,
  GraduationCap
} from "lucide-react";
import {
  coordinatorAttendanceStudents,
  coordinatorDepartmentAttendanceSummary
} from "../../../data/coordinatorMockData";
import "../Styles/CodingPerformance.css";
import "../Styles/Attendance.css";

export default function CoordinatorAttendance({ hideHeader }) {
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab Navigation: "all", "low-attendance", "overview"
  const [activeTab, setActiveTab] = useState("all");

  // Main Data States
  const [studentsList, setStudentsList] = useState([]);
  const [deptSummaries, setDeptSummaries] = useState([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Selected Student for Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState("");

  // Simulate API Fetch on Mount
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setStudentsList(coordinatorAttendanceStudents || []);
        setDeptSummaries(coordinatorDepartmentAttendanceSummary || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load attendance records. Please check API connection and retry.");
        setLoading(false);
      }
    }, 600);
  };

  // Status Helper: Strict Green / Amber / Red
  const getAttendanceStatus = (pct) => {
    if (pct >= 80) {
      return {
        label: "Good / Safe",
        colorClass: "status-safe",
        bg: "#d1fae5",
        text: "#047857",
        border: "#a7f3d0"
      };
    } else if (pct >= 70) {
      return {
        label: "Warning",
        colorClass: "status-warning",
        bg: "#fef3c7",
        text: "#b45309",
        border: "#fde68a"
      };
    } else {
      return {
        label: "Low Attendance",
        colorClass: "status-low",
        bg: "#fee2e2",
        text: "#dc2626",
        border: "#fca5a5"
      };
    }
  };

  // Dynamic KPI Metrics
  const totalStudents = studentsList.length;
  const totalAttendanceSum = studentsList.reduce((acc, s) => acc + s.attendance, 0);
  const avgAttendance = totalStudents > 0 ? (totalAttendanceSum / totalStudents).toFixed(1) : 0;
  const safeCount = studentsList.filter((s) => s.attendance >= 80).length;
  const warningCount = studentsList.filter((s) => s.attendance >= 70 && s.attendance < 80).length;
  const lowCount = studentsList.filter((s) => s.attendance < 70).length;
  const totalSessions = 50; // Standard batch total sessions

  // Filter Logic
  const filteredStudents = studentsList.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === "all" || student.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    const matchesSem = selectedSemester === "all" || (student.semester && student.semester === selectedSemester);

    let matchesStatus = true;
    if (selectedStatusFilter === "safe") matchesStatus = student.attendance >= 80;
    else if (selectedStatusFilter === "warning") matchesStatus = student.attendance >= 70 && student.attendance < 80;
    else if (selectedStatusFilter === "low") matchesStatus = student.attendance < 70;

    return matchesSearch && matchesDept && matchesBatch && matchesSem && matchesStatus;
  });

  const lowAttendanceStudents = studentsList.filter((s) => s.attendance < 70);

  // Departments & Batches lists for filters
  const departmentsList = Array.from(new Set(studentsList.map((s) => s.department)));
  const batchesList = Array.from(new Set(studentsList.map((s) => s.batch)));

  // Handle Medical Exemption Override
  const handleMedicalOverride = (studentId) => {
    setStudentsList((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, attendance: 76, status: "Good", riskLevel: "Good" }
          : s
      )
    );
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) => ({
        ...prev,
        attendance: 76,
        status: "Good",
        riskLevel: "Good"
      }));
    }
    setOverrideSuccessMsg("Medical exemption granted. Student attendance updated to 76% (Safe).");
    setTimeout(() => setOverrideSuccessMsg(""), 4000);
  };

  // Export CSV Action
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No attendance records to export.");
      return;
    }
    const headers = "Student Name,Roll/PRN,Department,Batch,Present,Absent,Total Classes,Attendance %,Status\n";
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.name}","${s.rollNo}","${s.department}","${s.batch}",${s.present},${s.absent},${s.totalClasses},${s.attendance}%,"${getAttendanceStatus(s.attendance).label}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="coord-perf-container">
      {/* Header */}
      {!hideHeader && (
        <div className="coord-perf-header-bar">
          <div className="coord-perf-header-left">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 className="coord-perf-title">
                Attendance Governance & Analytics
              </h1>
              <span className="coord-perf-status-badge coord-perf-status--good">
                Coordinator Portal
              </span>
            </div>
            <p className="coord-perf-sub">
              Monitor real-time student attendance rates, identify low-attendance defaulters (&lt;70%), and audit session history logs.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={fetchAttendanceData}
              className="coord-perf-btn coord-perf-btn--secondary"
              title="Refresh Attendance Data"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="coord-perf-btn"
              style={{ background: "#0f172a", color: "#ffffff", border: "none" }}
            >
              <Download size={15} /> Export Attendance Report
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="coord-perf-card" style={{ padding: "40px", textAlign: "center" }}>
          <RefreshCw size={32} className="spin" style={{ color: "#4f46e5", marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>Loading Coordinator Attendance Records...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="coord-perf-card" style={{ padding: "24px", background: "#fff1f2", borderColor: "#fecdd3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle color="#dc2626" size={24} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#991b1b", margin: 0 }}>Attendance API Error</h3>
              <p style={{ fontSize: "13px", color: "#be123c", margin: "2px 0 0 0" }}>{error}</p>
            </div>
            <button onClick={fetchAttendanceData} className="coord-perf-btn" style={{ background: "#dc2626", color: "#ffffff" }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content when loaded */}
      {!loading && !error && (
        <>
          {/* KPI Overview Cards Grid (Req 1) */}
          <div className="coord-perf-kpi-grid">
            {/* Total Students */}
            <div className="coord-perf-kpi-card">
              <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
                <Users size={20} />
              </div>
              <div className="coord-perf-kpi-info">
                <span className="coord-perf-kpi-label">Total Students</span>
                <span className="coord-perf-kpi-value">{totalStudents}</span>
                <span className="coord-perf-kpi-sub">Across managed batches</span>
              </div>
            </div>

            {/* Average Attendance % */}
            <div className="coord-perf-kpi-card">
              <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
                <TrendingUp size={20} />
              </div>
              <div className="coord-perf-kpi-info">
                <span className="coord-perf-kpi-label">Average Attendance</span>
                <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{avgAttendance}%</span>
                <span className="coord-perf-kpi-sub">Department aggregate rate</span>
              </div>
            </div>

            {/* Students Above Threshold (Safe) */}
            <div className="coord-perf-kpi-card">
              <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
                <UserCheck size={20} />
              </div>
              <div className="coord-perf-kpi-info">
                <span className="coord-perf-kpi-label">Students Above Threshold</span>
                <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{safeCount}</span>
                <span className="coord-perf-kpi-sub" style={{ color: "#059669", fontWeight: 600 }}>Safe (&ge;80% attendance)</span>
              </div>
            </div>

            {/* Low Attendance Students */}
            <div className="coord-perf-kpi-card" style={{ borderColor: lowCount > 0 ? "#fecdd3" : "#e2e8f0" }}>
              <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
                <AlertTriangle size={20} />
              </div>
              <div className="coord-perf-kpi-info">
                <span className="coord-perf-kpi-label">Low Attendance Students</span>
                <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{lowCount}</span>
                <span className="coord-perf-kpi-sub" style={{ color: "#dc2626", fontWeight: 700 }}>Requires intervention (&lt;70%)</span>
              </div>
            </div>

            {/* Total Sessions */}
            <div className="coord-perf-kpi-card">
              <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
                <Calendar size={20} />
              </div>
              <div className="coord-perf-kpi-info">
                <span className="coord-perf-kpi-label">Total Sessions Logged</span>
                <span className="coord-perf-kpi-value">{totalSessions}</span>
                <span className="coord-perf-kpi-sub">Current semester count</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="coord-perf-tabs-nav">
            <button
              onClick={() => setActiveTab("all")}
              className={`coord-perf-tab-btn ${activeTab === "all" ? "coord-perf-tab-btn--active" : ""}`}
            >
              <Users size={14} /> All Students ({studentsList.length})
            </button>
            <button
              onClick={() => setActiveTab("low-attendance")}
              className={`coord-perf-tab-btn ${activeTab === "low-attendance" ? "coord-perf-tab-btn--active" : ""}`}
              style={{ color: activeTab === "low-attendance" ? "#dc2626" : undefined }}
            >
              <AlertTriangle size={14} color="#dc2626" /> Low Attendance View ({lowAttendanceStudents.length})
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`coord-perf-tab-btn ${activeTab === "overview" ? "coord-perf-tab-btn--active" : ""}`}
            >
              <Building2 size={14} /> Department Summary
            </button>
          </div>

          {/* VIEW 1: ALL STUDENTS TABLE */}
          {activeTab === "all" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Filter Bar (Req 2) */}
              <div className="coord-perf-filter-card">
                <div className="coord-perf-filter-row">
                  {/* Search Bar */}
                  <div className="coord-perf-search-wrap">
                    <Search size={16} className="coord-perf-search-icon" />
                    <input
                      type="text"
                      placeholder="Search by student name or roll / PRN number..."
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

                    {/* Department Dropdown */}
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="coord-perf-select"
                    >
                      <option value="all">All Departments</option>
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>
                          {d} Department
                        </option>
                      ))}
                    </select>

                    {/* Batch Dropdown */}
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="coord-perf-select"
                    >
                      <option value="all">All Batches</option>
                      {batchesList.map((b) => (
                        <option key={b} value={b}>
                          Batch {b}
                        </option>
                      ))}
                    </select>

                    {/* Attendance Status Dropdown */}
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="coord-perf-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="safe">Good / Safe (&ge;80%)</option>
                      <option value="warning">Warning (70-79%)</option>
                      <option value="low">Low Attendance (&lt;70%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Student Table (Req 3 & 4) */}
              <div className="coord-perf-card">
                {studentsList.length === 0 ? (
                  /* Empty State 1 (Req 7) */
                  <div style={{ padding: "48px", textAlign: "center" }}>
                    <GraduationCap size={36} color="#94a3b8" style={{ marginBottom: "8px" }} />
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: 0 }}>Attendance data is not available yet.</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>No attendance logs have been recorded for this department.</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  /* Empty State Search */
                  <div style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    No student attendance records match your active search or filter settings.
                  </div>
                ) : (
                  <div className="coord-perf-table-wrap">
                    <table className="coord-perf-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Roll / PRN</th>
                          <th>Department</th>
                          <th>Batch</th>
                          <th style={{ textAlign: "center" }}>Present</th>
                          <th style={{ textAlign: "center" }}>Absent</th>
                          <th style={{ textAlign: "center" }}>Attendance %</th>
                          <th style={{ textAlign: "center" }}>Status</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const status = getAttendanceStatus(student.attendance);
                          return (
                            <tr key={student.id}>
                              {/* Student Info */}
                              <td>
                                <div className="coord-perf-student-cell">
                                  <div
                                    className="coord-perf-avatar-lg"
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      fontSize: "12px",
                                      borderRadius: "10px",
                                      background: "#f1f5f9",
                                      color: "#334155"
                                    }}
                                  >
                                    {student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <div className="coord-perf-student-name">{student.name}</div>
                                    <div className="coord-perf-roll">{student.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Roll / PRN */}
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

                              {/* Present */}
                              <td style={{ textAlign: "center", fontWeight: 800, color: "#059669" }}>
                                {student.present}
                              </td>

                              {/* Absent */}
                              <td style={{ textAlign: "center", fontWeight: 800, color: "#dc2626" }}>
                                {student.absent}
                              </td>

                              {/* Attendance % */}
                              <td style={{ textAlign: "center" }}>
                                <span style={{ fontWeight: 800, fontSize: "14px", color: status.text }}>
                                  {student.attendance}%
                                </span>
                              </td>

                              {/* Status Badge (Req 4: Visually clear Green/Amber/Red) */}
                              <td style={{ textAlign: "center" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    background: status.bg,
                                    color: status.text,
                                    border: `1px solid ${status.border}`
                                  }}
                                >
                                  {status.label}
                                </span>
                              </td>

                              {/* Action */}
                              <td style={{ textAlign: "right" }}>
                                <button
                                  onClick={() => setSelectedStudent(student)}
                                  className="coord-perf-btn coord-perf-btn--secondary"
                                >
                                  <Eye size={14} />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: LOW ATTENDANCE VIEW (Req 5) */}
          {activeTab === "low-attendance" && (
            <div className="coord-perf-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#991b1b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldAlert size={20} color="#dc2626" />
                    Low Attendance Defaulters Hub (&lt;70%)
                  </h2>
                  <p style={{ fontSize: "13px", color: "#be123c", margin: "4px 0 0 0" }}>
                    Students flagged below attendance policy threshold requiring immediate counseling or interventions.
                  </p>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "6px 12px", borderRadius: "10px" }}>
                  {lowAttendanceStudents.length} Students Flagged
                </span>
              </div>

              {/* Empty State 2 (Req 7) */}
              {lowAttendanceStudents.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px" }}>
                  <CheckCircle size={36} color="#059669" style={{ marginBottom: "8px" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#166534", margin: 0 }}>
                    No students currently require attendance intervention.
                  </h3>
                  <p style={{ fontSize: "13px", color: "#15803d", margin: "4px 0 0 0" }}>
                    All enrolled students in your department maintain attendance above the policy threshold (&ge;70%).
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {lowAttendanceStudents.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #fecdd3",
                        borderRadius: "14px",
                        padding: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{s.name}</h4>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Roll: {s.rollNo}</span>
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "#dc2626", background: "#fee2e2", padding: "4px 10px", borderRadius: "10px" }}>
                          {s.attendance}%
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", background: "#fff1f2", padding: "10px", borderRadius: "10px", fontSize: "12px" }}>
                        <div>
                          <span style={{ color: "#9f1239", display: "block" }}>Present / Total</span>
                          <strong style={{ color: "#881337", fontWeight: 800 }}>{s.present} / {s.totalClasses}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#9f1239", display: "block" }}>Dept / Batch</span>
                          <strong style={{ color: "#881337", fontWeight: 800 }}>{s.department} · {s.batch}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                        <button
                          onClick={() => handleMedicalOverride(s.id)}
                          className="coord-btn--override"
                          style={{ padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                        >
                          Grant Exemption
                        </button>
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="coord-perf-btn coord-perf-btn--secondary"
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: DEPARTMENT SUMMARY */}
          {activeTab === "overview" && (
            <div className="coord-perf-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 style={{ color: "#4f46e5" }} size={20} />
                  Department-Wise Attendance Overview Summary
                </h2>
                <p className="coord-perf-card-sub">
                  Batch aggregate breakdown of student presence, absentees, and low-attendance defaulters across tracks.
                </p>
              </div>

              <div className="coord-perf-cat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {deptSummaries.map((dept, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h3 style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a", margin: 0 }}>{dept.department} Track</h3>
                      <span className="coord-perf-status-badge coord-perf-status--default">
                        {dept.totalStudents} Enrolled
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                        <span>Present Today:</span>
                        <strong style={{ color: "#059669", fontWeight: 700 }}>{dept.presentToday} Students</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                        <span>Absent Today:</span>
                        <strong style={{ color: "#dc2626", fontWeight: 700 }}>{dept.absentToday} Students</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", paddingTop: "4px", borderTop: "1px solid #e2e8f0" }}>
                        <span>Average Attendance Rate:</span>
                        <strong style={{ color: dept.avgAttendance >= 85 ? "#059669" : "#d97706", fontWeight: 800 }}>
                          {dept.avgAttendance}%
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", background: "#fff1f2", color: "#be123c", padding: "8px 10px", borderRadius: "10px", border: "1px solid #fecdd3", fontWeight: 600 }}>
                        <span>Defaulters (&lt;70%):</span>
                        <strong style={{ fontWeight: 800 }}>{dept.lowAttendanceCount} Flagged</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT ATTENDANCE DETAILS MODAL / DRAWER (Req 6) */}
      {selectedStudent && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card">
            {/* Modal Header */}
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setSelectedStudent(null)}
                className="coord-perf-modal-close"
                title="Close"
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#ffffff" }}>{selectedStudent.name}</h3>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: getAttendanceStatus(selectedStudent.attendance).bg,
                        color: getAttendanceStatus(selectedStudent.attendance).text
                      }}
                    >
                      {getAttendanceStatus(selectedStudent.attendance).label}
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                    Roll / PRN: <strong style={{ color: "#ffffff" }}>{selectedStudent.rollNo}</strong> · Dept: {selectedStudent.department} · Batch: {selectedStudent.batch}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", display: "block", fontWeight: 600 }}>Overall Attendance</span>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: getAttendanceStatus(selectedStudent.attendance).text }}>
                    {selectedStudent.attendance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Success Toast Banner */}
            {overrideSuccessMsg && (
              <div style={{ background: "#d1fae5", borderBottom: "1px solid #a7f3d0", color: "#047857", padding: "10px 20px", fontSize: "12.5px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={16} /> {overrideSuccessMsg}
              </div>
            )}

            {/* Modal Content Body */}
            <div className="coord-perf-modal-body">
              {/* Quick Summary Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Total Sessions</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{selectedStudent.totalClasses} Sessions</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Present / Absent</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                    <span style={{ color: "#059669" }}>{selectedStudent.present} Present</span> / <span style={{ color: "#dc2626" }}>{selectedStudent.absent} Absent</span>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Contact Info</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                    {selectedStudent.email}
                  </span>
                </div>
              </div>

              {/* Monthly Attendance Breakdown */}
              {selectedStudent.monthlyAttendance && selectedStudent.monthlyAttendance.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={16} style={{ color: "#4f46e5" }} />
                    Monthly Attendance History
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {selectedStudent.monthlyAttendance.map((m, idx) => (
                      <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block" }}>{m.month}</span>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: m.percent < 70 ? "#dc2626" : "#059669" }}>
                          {m.percent}%
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8", display: "block", marginTop: "2px" }}>
                          {m.present} P / {m.absent} A
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Breakdown */}
              {selectedStudent.subjectHistory && selectedStudent.subjectHistory.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileSpreadsheet size={16} style={{ color: "#4f46e5" }} />
                    Subject / Session Attendance History
                  </h4>
                  <div className="coord-perf-card" style={{ border: "1px solid #e2e8f0" }}>
                    <table className="coord-perf-table">
                      <thead>
                        <tr>
                          <th>Subject / Module</th>
                          <th style={{ textAlign: "center" }}>Present</th>
                          <th style={{ textAlign: "center" }}>Absent</th>
                          <th style={{ textAlign: "right" }}>Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.subjectHistory.map((sub, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: "#0f172a" }}>{sub.subject}</td>
                            <td style={{ textAlign: "center", color: "#059669", fontWeight: 700 }}>{sub.present}</td>
                            <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{sub.absent}</td>
                            <td style={{ textAlign: "right", fontWeight: 800, color: sub.percent < 70 ? "#dc2626" : "#0f172a" }}>
                              {sub.percent}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Date Logs */}
              {selectedStudent.dateLogs && selectedStudent.dateLogs.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={16} style={{ color: "#4f46e5" }} />
                    Recent Date Logs
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selectedStudent.dateLogs.map((log, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: log.status === "Absent" ? "#fff1f2" : "#f0fdf4", borderRadius: "8px", fontSize: "12px" }}>
                        <span style={{ fontWeight: 700, color: "#334155" }}>{log.date} · {log.subject}</span>
                        <span style={{ fontWeight: 800, color: log.status === "Absent" ? "#dc2626" : "#059669" }}>
                          {log.status} ({log.remarks})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="coord-perf-modal-footer">
              {selectedStudent.attendance < 70 && (
                <button
                  onClick={() => handleMedicalOverride(selectedStudent.id)}
                  className="coord-btn--override"
                  style={{ padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                >
                  Grant Medical Exemption Override
                </button>
              )}
              <button
                onClick={() => setSelectedStudent(null)}
                className="coord-perf-btn coord-perf-btn--secondary"
                style={{ marginLeft: "auto" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
