import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Eye,
  Sliders,
  RefreshCw,
  X,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/CodingPerformance.css";

export default function CoordinatorAttendance({ hideHeader }) {
  // Navigation Tabs: "overview", "list", "defaulters"
  const [activeTab, setActiveTab] = useState("overview");

  // State Data
  const [studentsList, setStudentsList] = useState([]);
  const [defaulterList, setDefaulterList] = useState([]);
  const [deptSummaries, setDeptSummaries] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const [detailHistory, setDetailHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback((threshold) => {
    setLoading(true);
    Promise.all([
      apiFetch(`/attendance/dashboard-summary?threshold=${threshold}`),
      apiFetch("/attendance/list"),
      apiFetch(`/attendance/low-attendance?threshold=${threshold}`),
      apiFetch("/attendance/department"),
    ])
      .then(([dashRes, listRes, lowRes, deptRes]) => {
        setDashboard(dashRes && dashRes.data ? dashRes.data : null);
        const list = (listRes && Array.isArray(listRes.data)) ? listRes.data : (listRes?.data?.students || []);
        const low = (lowRes && Array.isArray(lowRes.data)) ? lowRes.data : (lowRes?.data?.students || []);
        setStudentsList(list);
        setDefaulterList(low);
        const dept = (deptRes && Array.isArray(deptRes.data)) ? deptRes.data : [];
        setDeptSummaries(dept);
      })
      .catch(() => { setStudentsList([]); setDefaulterList([]); setDeptSummaries([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData(attendanceThreshold);
  }, [attendanceThreshold, loadData]);

  const openDetail = (student) => {
    setSelectedStudentForDetail(student);
    setDetailHistory([]);
    setDetailLoading(true);
    apiFetch(`/attendance/student/${student.student_id}/history?limit=50`)
      .then((res) => {
        const hist = (res && res.data && Array.isArray(res.data.history)) ? res.data.history : [];
        setDetailHistory(hist);
        if (res && res.data && res.data.summary) {
          setSelectedStudentForDetail((prev) => ({ ...prev, ...res.data.summary }));
        }
      })
      .catch(() => setDetailHistory([]))
      .finally(() => setDetailLoading(false));
  };

  // KPIs from live dashboard summary
  const totalStudentsCount = dashboard?.total_students_tracked ?? 0;
  const avgAttendancePercent = dashboard?.overall_average_attendance ?? 0;
  const lowAttendanceCount = dashboard?.low_attendance_count ?? defaulterList.length;
  const goodCount = dashboard?.good_status_count ?? 0;

  // Extract unique departments & batches
  const departments = Array.from(new Set(studentsList.map((s) => s.department)));
  const batches = Array.from(new Set(studentsList.map((s) => s.batch_name)));

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
      String(student.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(student.student_id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || student.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || student.batch_name === selectedBatch;

    let matchesPercent = true;
    if (selectedPercentFilter === "below65") matchesPercent = student.attendance_percentage < 65;
    else if (selectedPercentFilter === "65to74") matchesPercent = student.attendance_percentage >= 65 && student.attendance_percentage < 75;
    else if (selectedPercentFilter === "above75") matchesPercent = student.attendance_percentage >= 75;

    const matchesDefaulterToggle = lowAttendanceOnly ? student.attendance_percentage < attendanceThreshold : true;

    return matchesSearch && matchesDept && matchesBatch && matchesPercent && matchesDefaulterToggle;
  });

  const defaulterStudents = defaulterList.length > 0
    ? defaulterList
    : studentsList.filter((s) => s.attendance_percentage < attendanceThreshold);

  return (
    <div className="coord-perf-container">
      {/* Page Header */}
      {!hideHeader && (
        <div className="coord-perf-header-bar">
          <div className="coord-perf-header-left">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 className="coord-perf-title">
                Attendance Governance & Analytics
              </h1>
              <span className="coord-perf-status-badge coord-perf-status--good">
                Coordinator Workspace
              </span>
            </div>
            <p className="coord-perf-sub">
              Track attendance across departments, monitor defaulters (&lt;{attendanceThreshold}%), and view real student attendance history logs.
            </p>
          </div>

          <button
            onClick={() => alert("Attendance reports are available under the Reports module.")}
            className="coord-perf-btn coord-perf-btn--indigo-light"
            style={{ background: "#0f172a", color: "#ffffff", border: "none" }}
          >
            <Download size={15} /> Export Attendance Report
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#64748b", gap: 12 }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} />
          <p style={{ fontSize: 13 }}>Loading attendance analytics...</p>
        </div>
      ) : (
        <>
      <div className="coord-perf-kpi-grid">
        {/* Total Students */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--indigo">
            <Users size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Total Students</span>
            <span className="coord-perf-kpi-value">{totalStudentsCount}</span>
            <span className="coord-perf-kpi-sub">Tracked with attendance records</span>
          </div>
        </div>

        {/* Good Standing */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--emerald">
            <UserCheck size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Good Standing (&gt;=80%)</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--emerald">{goodCount}</span>
            <span className="coord-perf-kpi-sub" style={{ color: "#059669", fontWeight: 600 }}>Healthy attendance</span>
          </div>
        </div>

        {/* Defaulter Count */}
        <div className="coord-perf-kpi-card">
          <div className="coord-perf-kpi-icon coord-perf-kpi-icon--rose">
            <UserX size={20} />
          </div>
          <div className="coord-perf-kpi-info">
            <span className="coord-perf-kpi-label">Absent / Low</span>
            <span className="coord-perf-kpi-value coord-perf-kpi-value--rose">{defaulterStudents.length}</span>
            <span className="coord-perf-kpi-sub">Below configured threshold</span>
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
            <span className="coord-perf-kpi-sub">Overall college average</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "6px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
          <Sliders size={14} style={{ color: "#64748b" }} />
          <span>Configured Threshold:</span>
          <select
            value={attendanceThreshold}
            onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
            className="coord-perf-select"
            style={{ height: "30px", padding: "0 8px" }}
          >
            <option value={75}>75% (Standard Default)</option>
            <option value={70}>70% (Relaxed Threshold)</option>
            <option value={80}>80% (Strict Requirement)</option>
          </select>
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
              Aggregate breakdown of session records, presents, absents, and average attendance per department.
            </p>
          </div>

          <div className="coord-perf-cat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {deptSummaries.length === 0 && (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px" }}>
                No attendance records logged yet for any department.
              </div>
            )}
            {deptSummaries.map((dept, idx) => (
              <div key={idx} style={{ padding: "16px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a", margin: 0 }}>{dept.department} Track</h3>
                  <span className="coord-perf-status-badge coord-perf-status--default">
                    {dept.total_students} Students
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Session Records:</span>
                    <strong style={{ color: "#475569", fontWeight: 700 }}>{dept.total_sessions}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Present Records:</span>
                    <strong style={{ color: "#059669", fontWeight: 700 }}>{dept.total_presents}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Absent Records:</span>
                    <strong style={{ color: "#e11d48", fontWeight: 700 }}>{dept.total_absents}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", paddingTop: "4px", borderTop: "1px solid #e2e8f0" }}>
                    <span>Avg Attendance:</span>
                    <strong style={{ color: dept.average_attendance_percentage >= 85 ? "#059669" : "#d97706", fontWeight: 800 }}>
                      {dept.average_attendance_percentage}%
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#fff1f2", color: "#be123c", padding: "8px 10px", borderRadius: "10px", border: "1px solid #fecdd3", fontWeight: 600 }}>
                    <span>Status:</span>
                    <strong style={{ fontWeight: 800 }}>{dept.status}</strong>
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
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="coord-perf-select"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d} Department
                    </option>
                  ))}
                </select>

                {/* Batch Filter */}
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="coord-perf-select"
                >
                  <option value="all">All Batches</option>
                  {batches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {/* Attendance % Filter */}
                <select
                  value={selectedPercentFilter}
                  onChange={(e) => setSelectedPercentFilter(e.target.value)}
                  className="coord-perf-select"
                >
                  <option value="all">All Attendance Range</option>
                  <option value="above75">75%+ (Good)</option>
                  <option value="65to74">65–74% (Warning)</option>
                  <option value="below65">Below 65% (Critical)</option>
                </select>

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
                    const statusObj = getDynamicStatus(student.attendance_percentage);
                    return (
                      <tr key={student.student_id}>
                        {/* Student Name */}
                        <td>
                          <div className="coord-perf-student-cell">
                            <div className="coord-perf-avatar-lg" style={{ width: "36px", height: "36px", fontSize: "12px", borderRadius: "10px" }}>
                              {String(student.student_name || "S").split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="coord-perf-student-name">{student.student_name}</div>
                              <div className="coord-perf-roll">{student.student_email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Roll No. */}
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                          {student.student_id}
                        </td>

                        {/* Department */}
                        <td>
                          <span className="coord-perf-status-badge coord-perf-status--default">
                            {student.department}
                          </span>
                        </td>

                        {/* Batch */}
                        <td style={{ fontWeight: 600, color: "#475569" }}>
                          {student.batch_name}
                        </td>

                        {/* Present */}
                        <td style={{ textAlign: "center", fontWeight: 800, color: "#059669" }}>
                          {student.present_count}
                        </td>

                        {/* Absent */}
                        <td style={{ textAlign: "center", fontWeight: 800, color: "#e11d48" }}>
                          {student.absent_count}
                        </td>

                        {/* Attendance % */}
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: "14px",
                            color: student.attendance_percentage < 65 ? "#e11d48" : student.attendance_percentage < attendanceThreshold ? "#d97706" : "#059669"
                          }}>
                            {student.attendance_percentage}%
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: "center" }}>
                          <span className={`coord-perf-status-badge ${statusObj.badgeClass}`}>
                            {student.attendance_percentage >= 75 ? "75%+ Good" : student.attendance_percentage >= 65 ? "65–74% Warning" : "Below 65% Critical"}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => openDetail(student)}
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
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{selectedStudentForDetail.student_name}</h3>
                    <span className={`coord-perf-status-badge ${getDynamicStatus(selectedStudentForDetail.attendance_percentage).badgeClass}`}>
                      {selectedStudentForDetail.attendance_percentage >= 75 ? "Good" : selectedStudentForDetail.attendance_percentage >= 65 ? "Warning" : "Critical"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0 0" }}>
                    Student ID: <strong style={{ color: "#ffffff" }}>{selectedStudentForDetail.student_id}</strong> · Dept: {selectedStudentForDetail.department} · Batch: {selectedStudentForDetail.batch_name}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", display: "block" }}>Overall Attendance</span>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: selectedStudentForDetail.attendance_percentage < 65 ? "#f43f5e" : "#34d399" }}>
                    {selectedStudentForDetail.attendance_percentage}%
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
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                    {selectedStudentForDetail.total_classes ?? selectedStudentForDetail.total_classes} Sessions
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Present / Absent</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                    <span style={{ color: "#059669" }}>{selectedStudentForDetail.present_count} Present</span> / <span style={{ color: "#e11d48" }}>{selectedStudentForDetail.absent_count} Absent</span>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Attendance Status</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <Clock size={15} color="#4f46e5" /> {selectedStudentForDetail.attendance_status || "—"}
                  </span>
                </div>
              </div>

              {/* Session History Log */}
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={16} style={{ color: "#4f46e5" }} />
                  Session Attendance History Log
                </h4>

                {detailLoading ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 13 }}>
                    Loading history...
                  </div>
                ) : detailHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 13 }}>
                    No logged sessions yet.
                  </div>
                ) : (
                  <div className="coord-perf-card" style={{ border: "1px solid #e2e8f0" }}>
                    <table className="coord-perf-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Session</th>
                          <th>Batch</th>
                          <th style={{ textAlign: "center" }}>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailHistory.map((log) => (
                          <tr key={log.id}>
                            <td style={{ fontWeight: 700, color: "#0f172a" }}>
                              {log.session_date ? new Date(log.session_date).toLocaleDateString() : "—"}
                            </td>
                            <td style={{ color: "#334155" }}>{log.session_title || log.session_code || "—"}</td>
                            <td style={{ color: "#475569" }}>{log.batch_name || "—"}</td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className={`coord-perf-status-badge ${log.status === "present" ? "coord-perf-status--top" : log.status === "absent" ? "coord-perf-status--struggling" : "coord-perf-status--default"}`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td style={{ color: "#64748b", fontSize: 12 }}>{log.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
      </>
      )}
    </div>
  );
}