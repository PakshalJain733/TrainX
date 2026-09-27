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
  // Navigation Tabs: "list", "defaulters"
  const [activeTab, setActiveTab] = useState("list");

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
            <div className="coord-att-title-row">
              <h1 className="coord-perf-title coord-att-title-row">
                <CalendarCheck size={24} className="coord-att-icon-primary" />
                <span>Attendance Governance & Analytics</span>
              </h1>
            </div>
            <p className="coord-perf-sub">
              Track daily attendance across departments, monitor defaulters (&lt;{attendanceThreshold}%), and view complete student attendance history logs.
            </p>
          </div>

          <button
            onClick={() => alert("Downloading Department Attendance Audit CSV Report...")}
            className="coord-perf-btn coord-att-reset-btn"
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
            <span className="coord-perf-kpi-sub">Enrolled across departments</span>
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
            <span className="coord-perf-kpi-sub coord-att-kpi-sub-emerald">Attendance Rate Active</span>
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
            <span className="coord-perf-kpi-sub">Absentees logged today</span>
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
        <div className="coord-perf-kpi-card coord-att-card-flagged">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <AlertTriangle size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Low Attendance (&lt;{attendanceThreshold}%)</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{lowAttendanceCount}</span>
            <span className="coord-perf-kpi-sub coord-att-kpi-sub-rose">Requires intervention</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="coord-att-filter-bar">
        <div className="coord-perf-tabs-nav">
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
      </div>

      {/* VIEW 1: Attendance Overview & Department Summary */}
      {activeTab === "overview" && (
        <div className="coord-perf-card coord-att-card-padded">
          <div className="coord-att-card-header">
            <h2 className="coord-perf-card-title coord-att-title-row">
              <Building2 color="#4f46e5" size={20} />
              Department-Wise Attendance Summary
            </h2>
            <p className="coord-perf-card-sub">
              Aggregate breakdown of daily presence, absentees, and defaulter counts across department tracks.
            </p>
          </div>

          <div className="coord-perf-cat-grid coord-att-dept-grid">
            {deptSummaries.map((dept, idx) => (
              <div key={idx} className="coord-att-dept-card">
                <div className="flex-between">
                  <h3 className="coord-att-dept-name">{dept.department} Track</h3>
                  <span className="coord-perf-status-badge coord-perf-status--default">
                    {dept.totalStudents} Students
                  </span>
                </div>

                <div className="coord-att-dept-list">
                  <div className="coord-att-dept-row">
                    <span>Present Today:</span>
                    <strong className="coord-att-kpi-sub-emerald">{dept.presentToday} Students</strong>
                  </div>
                  <div className="coord-att-dept-row">
                    <span>Absent Today:</span>
                    <strong className="coord-att-kpi-sub-rose">{dept.absentToday} Students</strong>
                  </div>
                  <div className="coord-att-dept-row coord-att-dept-row--border">
                    <span>Avg Attendance:</span>
                    <strong className={dept.avgAttendance >= 85 ? "coord-att-kpi-sub-emerald" : "coord-sni-sub-amber"}>
                      {dept.avgAttendance}%
                    </strong>
                  </div>
                  <div className="coord-att-flagged-box">
                    <span>Defaulters (&lt;75%):</span>
                    <strong>{dept.lowAttendanceCount} Flagged</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: Student Attendance List & Defaulter View */}
      {(activeTab === "list" || activeTab === "defaulters") && (
        <div className="coord-leave-list">
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
                <label className="coord-att-defaulters-toggle">
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

                {/* Configurable Threshold Control */}
                <div className="coord-threshold-bar">
                  <div className="coord-threshold-inner">
                    <Sliders size={14} className="coord-threshold-icon" />
                    <span className="coord-threshold-label">Threshold:</span>
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

              <div className="flex-between">
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
                  <Calendar size={16} color="#4f46e5" />
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
                  <FileSpreadsheet size={16} color="#4f46e5" />
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
