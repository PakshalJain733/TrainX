import CustomSelect from "../../../components/ui/CustomSelect";
import { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Calendar,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Sliders,
  RefreshCw,
  X,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import {
  coordinatorAttendanceStudents,
  coordinatorDepartmentAttendanceSummary
} from "../../../data/coordinatorMockData";
import "../Styles/CO_Attendance.css";

export default function CoordinatorAttendance({ hideHeader }) {
  // Navigation Tabs: "overview", "list", "defaulters"
  const [activeTab, setActiveTab] = useState("overview");

  // State Data
  const [studentsList, setStudentsList] = useState([]);
  const [deptSummaries, setDeptSummaries] = useState([]);

  // Dynamic Threshold State
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedPercentFilter, setSelectedPercentFilter] = useState("all");
  const [lowAttendanceOnly, setLowAttendanceOnly] = useState(false);

  // Detail Modal State
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

  // Dynamic Metrics Calculation
  const totalStudentsCount = studentsList.length;
  const presentTodayCount = studentsList.filter((s) => s.status === "Present" || s.attendance >= attendanceThreshold).length;
  const absentTodayCount = totalStudentsCount - presentTodayCount;
  const avgAttendancePercent = totalStudentsCount > 0 ? Math.round(studentsList.reduce((acc, s) => acc + (s.attendance || 0), 0) / totalStudentsCount) : 0;
  const lowAttendanceCount = studentsList.filter((s) => s.attendance < attendanceThreshold).length;

  // Extract unique departments & batches
  const departments = Array.from(new Set(studentsList.map((s) => s.department)));
  const batches = Array.from(new Set(studentsList.map((s) => s.batch)));

  const getDynamicStatus = (attendancePct) => {
    if (attendancePct >= attendanceThreshold) {
      return { label: "Good", badgeClass: "coord-perf-status--top" };
    } else if (attendancePct >= 65) {
      return { label: "Warning", badgeClass: "coord-perf-status--avg" };
    } else {
      return { label: "Critical", badgeClass: "coord-perf-status--struggling" };
    }
  };

  // Filter Logic
  const filteredStudents = studentsList.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || student.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;

    let matchesPercent = true;
    if (selectedPercentFilter === "below65") matchesPercent = student.attendance < 65;
    else if (selectedPercentFilter === "65to74") matchesPercent = student.attendance >= 65 && student.attendance < 75;
    else if (selectedPercentFilter === "above75") matchesPercent = student.attendance >= 75;

    const matchesDefaulterToggle = lowAttendanceOnly ? student.attendance < attendanceThreshold : true;

    return matchesSearch && matchesDept && matchesBatch && matchesPercent && matchesDefaulterToggle;
  });

  const defaulterStudents = studentsList.filter((s) => s.attendance < attendanceThreshold);

  return (
    <div className="coord-perf-container">
      {/* Page Header */}
      {!hideHeader && (
        <div className="coord-perf-header-bar">
          <div className="coord-perf-header-left">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 className="coord-perf-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CalendarCheck size={24} style={{ color: "#4f46e5", flexShrink: 0 }} />
                <span>Attendance Governance & Analytics</span>
              </h1>
            </div>
            <p className="coord-perf-sub">
              Track daily attendance across departments, monitor defaulters (&lt;{attendanceThreshold}%), and view complete student attendance history logs.
            </p>
          </div>

          <button
            onClick={() => alert("Downloading Department Attendance Audit CSV Report...")}
            className="coord-perf-btn coord-perf-btn--indigo-light"
            style={{ background: "#0f172a", color: "#ffffff", border: "none" }}
          >
            <Download size={15} /> Export Attendance Report
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="coord-perf-kpi-grid">
        {/* Total Students */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Users size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Students</span>
            <span className="coord-perf-kpi-value">{totalStudentsCount}</span>
            <span className="coord-perf-kpi-sub">Enrolled across 4 departments</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <UserCheck size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Present Today</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{presentTodayCount}</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#059669", fontWeight: 600 }}>89.6% Attendance Rate</span>
          </div>
        </div>

        {/* Absent Today */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <UserX size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Absent Today</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{absentTodayCount}</span>
            <span className="coord-perf-kpi-sub">33 Absentees logged</span>
          </div>
        </div>

        {/* Average Attendance % */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--purple">
            <TrendingUp size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Average Attendance</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--purple">{avgAttendancePercent}%</span>
            <span className="coord-perf-kpi-sub">Monthly overall avg</span>
          </div>
        </div>

        {/* Low Attendance Students */}
        <div className="coord-perf-kpi-card" style={{ borderColor: "#fecdd3" }}>
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <AlertTriangle size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Low Attendance (&lt;{attendanceThreshold}%)</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{lowAttendanceCount}</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#e11d48", fontWeight: 700 }}>Requires intervention</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Threshold Control Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div className="coord-perf-tabs-nav">
          <button
            onClick={() => setActiveTab("overview")}
            className={`coord-perf-tab-btn ${activeTab === "overview" ? "coord-perf-tab-btn--active" : ""}`}
          >
            Attendance Overview & Dept Summary
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`coord-perf-tab-btn ${activeTab === "list" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <Users size={14} /> Student Attendance List
          </button>
          <button
            onClick={() => setActiveTab("defaulters")}
            className={`coord-perf-tab-btn ${activeTab === "defaulters" ? "coord-perf-tab-btn--active" : ""}`}
          >
            <AlertTriangle size={14} /> Defaulter View ({defaulterStudents.length})
          </button>
        </div>

        {/* Configurable Threshold Control */}
        <div className="coord-threshold-bar">
          <div className="coord-threshold-inner">
            <Sliders size={14} className="coord-threshold-icon" />
            <span className="coord-threshold-label">Configured Threshold:</span>
          </div>
          <CustomSelect
            value={attendanceThreshold}
            onChange={(val) => setAttendanceThreshold(Number(val))}
            options={[
              { value: 75, label: "75% (Standard Default)" },
              { value: 70, label: "70% (Relaxed Threshold)" },
              { value: 80, label: "80% (Strict Requirement)" },
            ]}
          />
        </div>
      </div>

      {/* VIEW 1: Attendance Overview & Department Summary */}
      {activeTab === "overview" && (
        <div className="coord-perf-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 className="coord-perf-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 style={{ color: "#4f46e5" }} size={20} />
              Department-Wise Attendance Summary
            </h2>
            <p className="coord-perf-card-sub">
              Aggregate breakdown of daily presence, absentees, and defaulter counts across department tracks.
            </p>
          </div>

          <div className="coord-perf-cat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {deptSummaries.map((dept, idx) => (
              <div key={idx} style={{ padding: "16px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a", margin: 0 }}>{dept.department} Track</h3>
                  <span className="coord-perf-status-badge coord-perf-status--default">
                    {dept.totalStudents} Students
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Present Today:</span>
                    <strong style={{ color: "#059669", fontWeight: 700 }}>{dept.presentToday} Students</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Absent Today:</span>
                    <strong style={{ color: "#e11d48", fontWeight: 700 }}>{dept.absentToday} Students</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", paddingTop: "4px", borderTop: "1px solid #e2e8f0" }}>
                    <span>Avg Attendance:</span>
                    <strong style={{ color: dept.avgAttendance >= 85 ? "#059669" : "#d97706", fontWeight: 800 }}>
                      {dept.avgAttendance}%
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#fff1f2", color: "#be123c", padding: "8px 10px", borderRadius: "10px", border: "1px solid #fecdd3", fontWeight: 600 }}>
                    <span>Defaulters (&lt;75%):</span>
                    <strong style={{ fontWeight: 800 }}>{dept.lowAttendanceCount} Flagged</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: Student Attendance List & Defaulter View */}
      {(activeTab === "list" || activeTab === "defaulters") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filters Bar */}
          <div className="coord-perf-filter-card">
            <div className="coord-perf-filter-row">
              {/* Search Box */}
              <div className="coord-perf-search-wrap">
                <Search size={16} className="coord-perf-search-icon" />
                <input
                  type="text"
                  placeholder="Search by student name or roll no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="coord-perf-search-input"
                />
              </div>

              <div className="coord-perf-filters-group">
                <div className="coord-perf-filter-label">
                  <Filter size={14} />
                  <span>Filter:</span>
                </div>

                {/* Department Filter */}
                <CustomSelect
                  value={selectedDept}
                  onChange={setSelectedDept}
                  options={[
                    { value: "all", label: "All Departments" },
                    ...departments.map((d) => ({ value: d, label: `${d} Department` })),
                  ]}
                />

                {/* Batch Filter */}
                <CustomSelect
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  options={[
                    { value: "all", label: "All Batches" },
                    ...batches.map((b) => ({ value: b, label: `Batch ${b}` })),
                  ]}
                />

                {/* Attendance % Filter */}
                <CustomSelect
                  value={selectedPercentFilter}
                  onChange={setSelectedPercentFilter}
                  options={[
                    { value: "all", label: "All Attendance Range" },
                    { value: "above75", label: "75%+ (Good)" },
                    { value: "65to74", label: "65–74% (Warning)" },
                    { value: "below65", label: "Below 65% (Critical)" },
                  ]}
                />

                {/* Defaulter Toggle */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", padding: "0 12px", height: "38px", borderRadius: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={lowAttendanceOnly || activeTab === "defaulters"}
                    onChange={(e) => {
                      setLowAttendanceOnly(e.target.checked);
                      if (e.target.checked) setActiveTab("defaulters");
                      else setActiveTab("list");
                    }}
                  />
                  <span>Defaulters Only (&lt;{attendanceThreshold}%)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="coord-perf-card">
            <div className="coord-perf-table-wrap">
              <table className="coord-perf-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th style={{ textAlign: "center" }}>Present</th>
                    <th style={{ textAlign: "center" }}>Absent</th>
                    <th style={{ textAlign: "center" }}>Attendance %</th>
                    <th style={{ textAlign: "center" }}>Status / Risk Level</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "defaulters" ? defaulterStudents : filteredStudents).map((student) => {
                    const statusObj = getDynamicStatus(student.attendance);
                    return (
                      <tr key={student.id}>
                        {/* Student Name */}
                        <td>
                          <div className="coord-perf-student-cell">
                            <div className="coord-perf-avatar-lg" style={{ width: "36px", height: "36px", fontSize: "12px", borderRadius: "10px" }}>
                              {student.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="coord-perf-student-name">{student.name}</div>
                              <div className="coord-perf-roll">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Roll No. */}
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
                        <td style={{ textAlign: "center", fontWeight: 800, color: "#e11d48" }}>
                          {student.absent}
                        </td>

                        {/* Attendance % */}
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: "14px",
                            color: student.attendance < 65 ? "#e11d48" : student.attendance < attendanceThreshold ? "#d97706" : "#059669"
                          }}>
                            {student.attendance}%
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: "center" }}>
                          <span className={`coord-perf-status-badge ${statusObj.badgeClass}`}>
                            {student.attendance >= 75 ? "75%+ Good" : student.attendance >= 65 ? "65–74% Warning" : "Below 65% Critical"}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            className="coord-perf-btn coord-perf-btn--secondary"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {(activeTab === "defaulters" ? defaulterStudents : filteredStudents).length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                        No student attendance records match your active search filter settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Attendance Details Modal */}
      {selectedStudentForDetail && (
        <div className="coord-perf-modal-backdrop">
          <div className="coord-perf-modal-card">
            {/* Header */}
            <div className="coord-perf-modal-header">
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="coord-perf-modal-close"
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{selectedStudentForDetail.name}</h3>
                    <span className={`coord-perf-status-badge ${getDynamicStatus(selectedStudentForDetail.attendance).badgeClass}`}>
                      {selectedStudentForDetail.attendance >= 75 ? "Good" : selectedStudentForDetail.attendance >= 65 ? "Warning" : "Critical"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                    Roll No: <strong style={{ color: "#ffffff" }}>{selectedStudentForDetail.rollNo}</strong> · Dept: {selectedStudentForDetail.department} · Batch: {selectedStudentForDetail.batch}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", display: "block" }}>Overall Attendance</span>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: selectedStudentForDetail.attendance < 65 ? "#f43f5e" : "#34d399" }}>
                    {selectedStudentForDetail.attendance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="coord-perf-modal-body">
              {/* Profile Bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Total Sessions</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{selectedStudentForDetail.totalClasses} Sessions</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Present / Absent</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                    <span style={{ color: "#059669" }}>{selectedStudentForDetail.present} Present</span> / <span style={{ color: "#e11d48" }}>{selectedStudentForDetail.absent} Absent</span>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Attendance Trend</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    {selectedStudentForDetail.trend === "Declining" ? (
                      <span style={{ color: "#e11d48", display: "flex", alignItems: "center", gap: "4px" }}><TrendingDown size={16} /> Declining (-6%)</span>
                    ) : selectedStudentForDetail.trend === "Improving" ? (
                      <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}><TrendingUp size={16} /> Improving (+4%)</span>
                    ) : (
                      <span style={{ color: "#64748b" }}>Stable</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={16} style={{ color: "#4f46e5" }} />
                  Monthly Attendance History
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {selectedStudentForDetail.monthlyAttendance.map((m, idx) => (
                    <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block" }}>{m.month}</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: m.percent < 75 ? "#e11d48" : "#059669" }}>
                        {m.percent}%
                      </span>
                      <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "2px" }}>
                        {m.present} P / {m.absent} A
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Breakdown */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileSpreadsheet size={16} style={{ color: "#4f46e5" }} />
                  Subject / Session-Wise Attendance Breakdown
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
                      {selectedStudentForDetail.subjectHistory.map((sub, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>{sub.subject}</td>
                          <td style={{ textAlign: "center", color: "#059669", fontWeight: 700 }}>{sub.present}</td>
                          <td style={{ textAlign: "center", color: "#e11d48", fontWeight: 700 }}>{sub.absent}</td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>{sub.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="coord-perf-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Target Flow: <strong style={{ color: "#0f172a" }}>Attendance → Student History Logs</strong>
              </span>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="coord-perf-btn coord-perf-btn--indigo-light"
                style={{ background: "#0f172a", color: "#ffffff", border: "none" }}
              >
                Close History View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
