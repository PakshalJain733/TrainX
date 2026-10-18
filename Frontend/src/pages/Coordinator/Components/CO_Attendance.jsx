import CustomSelect from "../../../components/ui/CustomSelect";
import { useState } from "react";
import { Users, UserCheck, UserX, AlertTriangle, Search, Filter, Download, Calendar, CalendarCheck, TrendingUp, TrendingDown, Clock, Eye, Sliders, RefreshCw, X, Building2, FileSpreadsheet } from "lucide-react";
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
                    <th className="att-text-center">Present</th>
                    <th className="att-text-center">Absent</th>
                    <th className="att-text-center">Attendance %</th>
                    <th className="att-text-center">Status / Risk Level</th>
                    <th className="att-text-right">Action</th>
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
                            <div className="coord-perf-avatar-lg att-avatar-sm">
                              {student.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="coord-perf-student-name">{student.name}</div>
                              <div className="coord-perf-roll">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Roll No. */}
                        <td className="att-roll">
                          {student.rollNo}
                        </td>

                        {/* Department */}
                        <td>
                          <span className="coord-perf-status-badge coord-perf-status--default">
                            {student.department}
                          </span>
                        </td>

                        {/* Batch */}
                        <td className="att-batch">
                          {student.batch}
                        </td>

                        {/* Present */}
                        <td className="att-present-val">
                          {student.present}
                        </td>

                        {/* Absent */}
                        <td className="att-absent-val">
                          {student.absent}
                        </td>

                        {/* Attendance % */}
                        <td className="att-text-center">
                          <span className={student.attendance < 65 ? "att-pct-crit" : student.attendance < attendanceThreshold ? "att-pct-warn" : "att-pct-good"}>
                            {student.attendance}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="att-text-center">
                          <span className={`coord-perf-status-badge ${statusObj.badgeClass}`}>
                            {student.attendance >= 75 ? "75%+ Good" : student.attendance >= 65 ? "65–74% Warning" : "Below 65% Critical"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="att-text-right">
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
                      <td colSpan={9} className="att-empty-cell">
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
                  <div className="att-modal-header-row">
                    <h3 className="att-modal-student-name">{selectedStudentForDetail.name}</h3>
                    <span className={`coord-perf-status-badge ${getDynamicStatus(selectedStudentForDetail.attendance).badgeClass}`}>
                      {selectedStudentForDetail.attendance >= 75 ? "Good" : selectedStudentForDetail.attendance >= 65 ? "Warning" : "Critical"}
                    </span>
                  </div>
                  <p className="att-modal-sub-text">
                    Roll No: <strong>{selectedStudentForDetail.rollNo}</strong> · Dept: {selectedStudentForDetail.department} · Batch: {selectedStudentForDetail.batch}
                  </p>
                </div>

                <div className="att-modal-overall-pill">
                  <span className="att-modal-overall-label">Overall Attendance</span>
                  <span className={`att-modal-overall-val ${selectedStudentForDetail.attendance < 65 ? "att-modal-overall-val--crit" : "att-modal-overall-val--good"}`}>
                    {selectedStudentForDetail.attendance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="coord-perf-modal-body">
              {/* Profile Bar */}
              <div className="att-modal-stat-grid">
                <div>
                  <span className="att-modal-stat-label">Total Sessions</span>
                  <span className="att-modal-stat-val">{selectedStudentForDetail.totalClasses} Sessions</span>
                </div>
                <div>
                  <span className="att-modal-stat-label">Present / Absent</span>
                  <span className="att-modal-stat-val">
                    <span className="att-trend-improving">{selectedStudentForDetail.present} Present</span> / <span className="att-trend-declining">{selectedStudentForDetail.absent} Absent</span>
                  </span>
                </div>
                <div>
                  <span className="att-modal-stat-label">Attendance Trend</span>
                  <span className="att-modal-trend-row">
                    {selectedStudentForDetail.trend === "Declining" ? (
                      <span className="att-trend-declining"><TrendingDown size={16} /> Declining (-6%)</span>
                    ) : selectedStudentForDetail.trend === "Improving" ? (
                      <span className="att-trend-improving"><TrendingUp size={16} /> Improving (+4%)</span>
                    ) : (
                      <span className="att-trend-stable">Stable</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div>
                <h4 className="att-modal-section-title">
                  <Calendar size={16} color="#4f46e5" />
                  Monthly Attendance History
                </h4>
                <div className="att-modal-month-grid">
                  {selectedStudentForDetail.monthlyAttendance.map((m, idx) => (
                    <div key={idx} className="att-modal-month-box">
                      <span className="att-modal-month-title">{m.month}</span>
                      <span className={m.percent < 75 ? "att-month-pct--crit" : "att-month-pct--good"}>
                        {m.percent}%
                      </span>
                      <span className="att-modal-month-sub">
                        {m.present} P / {m.absent} A
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Breakdown */}
              <div>
                <h4 className="att-modal-section-title">
                  <FileSpreadsheet size={16} color="#4f46e5" />
                  Subject / Session-Wise Attendance Breakdown
                </h4>
                <div className="coord-perf-card att-modal-table-card">
                  <table className="coord-perf-table">
                    <thead>
                      <tr>
                        <th>Subject / Module</th>
                        <th className="att-text-center">Present</th>
                        <th className="att-text-center">Absent</th>
                        <th className="att-text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentForDetail.subjectHistory.map((sub, idx) => (
                        <tr key={idx}>
                          <td className="att-table-td-bold">{sub.subject}</td>
                          <td className="att-table-td-present">{sub.present}</td>
                          <td className="att-table-td-absent">{sub.absent}</td>
                          <td className="att-table-td-pct">{sub.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="coord-perf-modal-footer">
              <span className="att-modal-footer-hint">
                Target Flow: <strong>Attendance → Student History Logs</strong>
              </span>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="coord-perf-btn att-btn-dark"
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
