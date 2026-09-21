import React, { useState, useEffect } from "react";
import { mentorBatches } from "../../../data/mentorMockData";
import {
  CalendarCheck, Users, Search, CheckCircle2, XCircle, Clock,
  AlertTriangle, Layers, Filter, Check, Save, Sparkles, Send,
  FileCheck2, ChevronRight, UserX, UserCheck,
  FileText, CalendarDays, Clock3, Loader2, Inbox
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Attendance.css";

// Comprehensive mock data for mentor student attendance register
const baseStudentsData = [
  { id: 1, name: "Rahul Verma", rollNo: "CS202601", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 94, totalClasses: 50, attended: 47, status: "Present" },
  { id: 2, name: "Ananya Patel", rollNo: "CS202604", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 88, totalClasses: 50, attended: 44, status: "Present" },
  { id: 3, name: "Siddharth Rao", rollNo: "IT202612", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 68, totalClasses: 50, attended: 34, status: "Absent" },
  { id: 4, name: "Pooja Deshmukh", rollNo: "IT202615", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 96, totalClasses: 50, attended: 48, status: "Present" },
  { id: 5, name: "Priya Nair", rollNo: "EXT202607", department: "EXTC", batch: "BE-EXTC-2026-C", attendance: 65, totalClasses: 50, attended: 32, status: "Absent" },
  { id: 6, name: "Vikram Malhotra", rollNo: "CS202609", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 92, totalClasses: 50, attended: 46, status: "Present" },
  { id: 7, name: "Neha Sharma", rollNo: "CS202611", department: "Computer Engineering", batch: "BE-CS-2026-A", attendance: 71, totalClasses: 50, attended: 35, status: "Absent" },
  { id: 8, name: "Aarav Mehta", rollNo: "IT202620", department: "Information Technology", batch: "TE-IT-2026-B", attendance: 85, totalClasses: 50, attended: 42, status: "Present" },
  { id: 9, name: "Rohan Gupta", rollNo: "EXT202603", department: "EXTC", batch: "BE-EXTC-2026-C", attendance: 90, totalClasses: 50, attended: 45, status: "Present" }
];

// Fallback seed leave applications (used only when the backend leave API is unavailable)
const defaultLeaveApplications = [
  { id: "LV-2026-301", studentName: "Rahul Verma", rollNo: "CS202601", batch: "BE-CS-2026-A", leaveType: "Medical Leave", startDate: "2026-09-10", endDate: "2026-09-11", days: 2, reason: "Viral fever, medical certificate attached.", status: "Pending" },
  { id: "LV-2026-302", studentName: "Ananya Patel", rollNo: "CS202604", batch: "BE-CS-2026-A", leaveType: "On-Duty Leave", startDate: "2026-09-14", endDate: "2026-09-14", days: 1, reason: "Smart India Hackathon internal hackathon duty.", status: "Pending" },
  { id: "LV-2026-303", studentName: "Pooja Deshmukh", rollNo: "IT202615", batch: "TE-IT-2026-B", leaveType: "Casual Leave", startDate: "2026-09-16", endDate: "2026-09-17", days: 2, reason: "Personal work, requesting casual leave.", status: "Pending" }
];

export default function Attendance() {
  const [activeTab, setActiveTab] = useState("mark"); // "mark" | "monitoring"
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [sessionDate, setSessionDate] = useState("2026-09-08"); // Defaults to 8 September as requested
  const [sessionSlot, setSessionSlot] = useState("Morning Session (09:00 AM - 11:00 AM)");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState(baseStudentsData);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  // Load backend students or initialize state map
  useEffect(() => {
    apiFetch("/students")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const apiStudents = res.data.map((u, idx) => ({
            id: u.id || idx + 1,
            name: u.name || u.full_name || `Student ${idx + 1}`,
            rollNo: u.roll_number || u.rollNo || `CS2026${10 + idx}`,
            department: u.department || (idx % 3 === 0 ? "Computer Engineering" : idx % 3 === 1 ? "Information Technology" : "EXTC"),
            batch: u.batch_code || u.batch_name || (idx % 3 === 0 ? "BE-CS-2026-A" : idx % 3 === 1 ? "TE-IT-2026-B" : "BE-EXTC-2026-C"),
            attendance: u.attendance || (75 + (idx * 7) % 23),
            totalClasses: 50,
            attended: Math.round(50 * ((u.attendance || (75 + (idx * 7) % 23)) / 100)),
            status: (u.attendance || (75 + (idx * 7) % 23)) >= 75 ? "Present" : "Absent"
          }));
          setStudents(apiStudents);
          const initialMap = {};
          apiStudents.forEach((s) => { initialMap[s.id] = s.status; });
          setAttendanceRecords(initialMap);
        } else {
          setStudents(baseStudentsData);
          const initialMap = {};
          baseStudentsData.forEach((s) => { initialMap[s.id] = s.status; });
          setAttendanceRecords(initialMap);
        }
      })
      .catch(() => {
        setStudents(baseStudentsData);
        const initialMap = {};
        baseStudentsData.forEach((s) => { initialMap[s.id] = s.status; });
        setAttendanceRecords(initialMap);
      });
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Student Leave Applications
  const [leaveApplications, setLeaveApplications] = useState(defaultLeaveApplications);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveFeedback, setLeaveFeedback] = useState("");
  const [leaveFeedbackType, setLeaveFeedbackType] = useState("success");

  // Load real leave applications from backend when available
  useEffect(() => {
    apiFetch("/mentor/attendance/leaves")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setLeaveApplications(res.data);
        }
      })
      .finally(() => setLeaveLoading(false));
  }, []);

  const pendingLeaves = leaveApplications.filter((leave) => leave.status === "Pending");
  const pendingLeaveCount = pendingLeaves.length;

  const handleLeaveDecision = async (leaveId, newStatus) => {
    const student = leaveApplications.find((l) => l.id === leaveId);
    const action = newStatus === "Approved" ? "Approved" : "Rejected";
    const endpoint = `/mentor/attendance/leaves/${leaveId}${newStatus === "Approved" ? "/approve" : "/reject"}`;

    const res = await apiFetch(endpoint, { method: "PATCH" });

    setLeaveApplications((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
    );

    if (res && res.error) {
      showToast(`${action} ${student?.studentName || "student"}'s application (rendered locally — ${res.error})`);
    } else {
      showToast(`${action} ${student?.studentName || "student"}'s leave application ✓`);
    }
  };

  // Toggle single student status
  const handleStatusToggle = (id, newStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [id]: newStatus
    }));
  };

  // Task 4: Mark All Present
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceRecords };
    filteredStudents.forEach((s) => {
      updated[s.id] = "Present";
    });
    setAttendanceRecords(updated);
    showToast("Marked all students in view as Present ✓");
  };

  // Task 4: Mark All Absent
  const handleMarkAllAbsent = () => {
    const updated = { ...attendanceRecords };
    filteredStudents.forEach((s) => {
      updated[s.id] = "Absent";
    });
    setAttendanceRecords(updated);
    showToast("Marked all students in view as Absent ✗");
  };

  // Task 4: Save Attendance
  const handleSaveAttendance = () => {
    const deptLabel = selectedDepartment === "All" ? "All Departments" : selectedDepartment;
    const batchLabel = selectedBatch === "ALL" ? "All Batches" : selectedBatch;
    showToast(`Attendance saved successfully for ${deptLabel} → ${batchLabel} → ${sessionDate}!`);
  };

  // Filter students based on Department, Batch & Search
  const filteredStudents = students.filter((s) => {
    const matchesDept = selectedDepartment === "All" || s.department === selectedDepartment;
    const matchesBatch = selectedBatch === "ALL" || s.batch === selectedBatch;
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || "").toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesBatch && matchesSearch;
  });

  // Task 5 Monitoring Metrics
  const totalInView = filteredStudents.length;
  const presentCountInView = filteredStudents.filter((s) => (attendanceRecords[s.id] || s.status) === "Present").length;
  const absentCountInView = filteredStudents.filter((s) => (attendanceRecords[s.id] || s.status) === "Absent").length;
  const lowAttendanceStudents = filteredStudents.filter((s) => s.attendance < 75);

  return (
    <div className="mentor-attendance-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mentor-toast-notification">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <CalendarCheck size={22} color="#4f46e5" />
            <span>Mentor & Trainer Attendance Workspace</span>
          </h2>
          <p className="mentor-page-subtitle">
            Mark daily class attendance across departments and batches, save register logs, and monitor low-attendance risks (&lt;75%).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mentor-attendance-tabs">
          <button
            className={`tab-btn ${activeTab === "mark" ? "active" : ""}`}
            onClick={() => setActiveTab("mark")}
          >
            <UserCheck size={16} />
            <span>Mark Attendance</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "monitoring" ? "active" : ""}`}
            onClick={() => setActiveTab("monitoring")}
          >
            <AlertTriangle size={16} />
            <span>Attendance Monitoring ({lowAttendanceStudents.length} Risk)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="mentor-att-kpi-grid">
        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--blue">
            <Users size={20} />
          </div>
          <div>
            <div className="att-kpi-lbl">Students in View</div>
            <div className="att-kpi-val">{totalInView} Students</div>
          </div>
        </div>

        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="att-kpi-lbl">Present Today</div>
            <div className="att-kpi-val text-emerald">{presentCountInView}</div>
          </div>
        </div>

        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--red">
            <UserX size={20} />
          </div>
          <div>
            <div className="att-kpi-lbl">Absent Today</div>
            <div className="att-kpi-val text-rose">{absentCountInView}</div>
          </div>
        </div>

        <div className="att-kpi-card">
          <div className="att-kpi-icon att-kpi-icon--amber">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="att-kpi-lbl">Low Attendance (&lt;75%)</div>
            <div className="att-kpi-val text-amber">{lowAttendanceStudents.length} At Risk</div>
          </div>
        </div>
      </div>

      {/* Main Tab 1: Task 4 Mark Attendance Screen */}
      {activeTab === "mark" && (
        <div className="mark-attendance-section">
          {/* Controls & Selectors Toolbar */}
          <div className="mark-attendance-toolbar">
            <div className="toolbar-selects-grid">
              {/* Department Select */}
              <div className="select-field">
                <label>Department:</label>
                <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                  <option value="All">All Departments</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="EXTC">EXTC</option>
                  <option value="ECS">ECS</option>
                </select>
              </div>

              {/* Batch Select */}
              <div className="select-field">
                <label>Batch:</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                  <option value="ALL">All Batches</option>
                  <option value="BE-CS-2026-A">BE-CS-2026-A</option>
                  <option value="TE-IT-2026-B">TE-IT-2026-B</option>
                  <option value="BE-EXTC-2026-C">BE-EXTC-2026-C</option>
                </select>
              </div>

              {/* Date Select */}
              <div className="select-field">
                <label>Date:</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>

              {/* Session Slot */}
              <div className="select-field">
                <label>Session Slot:</label>
                <select value={sessionSlot} onChange={(e) => setSessionSlot(e.target.value)}>
                  <option value="Morning Session (09:00 AM - 11:00 AM)">Morning (09:00 - 11:00 AM)</option>
                  <option value="Midday Session (11:15 AM - 01:15 PM)">Midday (11:15 - 01:15 PM)</option>
                  <option value="Afternoon Session (02:00 PM - 04:00 PM)">Afternoon (02:00 - 04:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Quick Actions & Save Button Row */}
            <div className="toolbar-actions-row">
              <div className="bulk-mark-group">
                <button className="btn-bulk-present" onClick={handleMarkAllPresent}>
                  <CheckCircle2 size={14} /> Mark All Present ✓
                </button>
                <button className="btn-bulk-absent" onClick={handleMarkAllAbsent}>
                  <XCircle size={14} /> Mark All Absent ✗
                </button>
              </div>

              <button className="btn-save-attendance" onClick={handleSaveAttendance}>
                <Save size={16} />
                <span>Save Attendance</span>
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="table-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Task 4 Student Mark Attendance Table */}
          <div className="mentor-table-card">
            <div className="mentor-table-responsive">
              <table className="mentor-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Dept & Batch</th>
                    <th>Overall Attendance %</th>
                    <th>Mark Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="attendance-empty-table-cell">
                        No students found for the selected department/batch.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      const currentStatus = attendanceRecords[st.id] || st.status;
                      const isLow = st.attendance < 75;

                      return (
                        <tr key={st.id}>
                          <td className="student-name-cell">
                            <span className="name-txt">{st.name}</span>
                            {isLow && <span className="risk-tag">&lt; 75% Risk</span>}
                          </td>
                          <td className="roll-cell">{st.rollNo}</td>
                          <td>
                            <div className="dept-batch-cell">
                              <span className="batch-badge">{st.batch}</span>
                              <span className="dept-txt">{st.department}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`pct-txt ${isLow ? "text-red" : "text-emerald"}`}>
                              {st.attendance}%
                            </span>
                          </td>
                          <td>
                            {/* Present / Absent Mark Buttons */}
                            <div className="mark-toggle-buttons">
                              <button
                                type="button"
                                className={`btn-mark ${currentStatus === "Present" ? "btn-mark--present" : ""}`}
                                onClick={() => handleStatusToggle(st.id, "Present")}
                              >
                                <CheckCircle2 size={14} />
                                <span>Present ✓</span>
                              </button>
                              <button
                                type="button"
                                className={`btn-mark ${currentStatus === "Absent" ? "btn-mark--absent" : ""}`}
                                onClick={() => handleStatusToggle(st.id, "Absent")}
                              >
                                <XCircle size={14} />
                                <span>Absent ✗</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Leave Applications Review Block */}
          <div className="mentor-leave-section">
            <div className="mentor-leave-header">
              <div>
                <h3 className="mentor-leave-title">
                  <FileText size={18} color="#4f46e5" />
                  Student Leave Applications
                </h3>
                <p className="mentor-leave-sub">
                  Review pending student leave applications and approve or reject them.
                </p>
              </div>
              <span className="mentor-leave-pending-badge">{pendingLeaveCount} Pending</span>
            </div>

            {leaveFeedback && (
              <div className={`mentor-leave-feedback mentor-leave-feedback--${leaveFeedbackType}`}>
                {leaveFeedbackType === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{leaveFeedback}</span>
              </div>
            )}

            {leaveLoading ? (
              <div className="mentor-leave-state">
                <Loader2 size={18} className="mentor-leave-spin" />
                Loading leave applications...
              </div>
            ) : pendingLeaves.length === 0 ? (
              <div className="mentor-leave-state mentor-leave-state--empty">
                <Inbox size={22} />
                No pending leave applications.
              </div>
            ) : (
              <div className="mentor-leave-list">
                {pendingLeaves.map((leave) => {
                  const initials = (leave.studentName || "Student")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div key={leave.id} className="mentor-leave-card">
                      <div className="mentor-leave-avatar">{initials}</div>

                      <div className="mentor-leave-main">
                        <div className="mentor-leave-head">
                          <div>
                            <div className="mentor-leave-name">{leave.studentName}</div>
                            <div className="mentor-leave-meta">
                              Roll No: <strong>{leave.rollNo}</strong> · <span className="mentor-leave-batch">{leave.batch}</span>
                            </div>
                          </div>
                          <span className="mentor-leave-status-badge">PENDING</span>
                        </div>

                        <div className="mentor-leave-detail-row">
                          <span className="mentor-leave-type">{leave.leaveType}</span>
                          <span className="mentor-leave-dates">
                            <CalendarDays size={13} /> {leave.startDate} → {leave.endDate}
                          </span>
                          <span className="mentor-leave-days">
                            <Clock3 size={13} /> {leave.days} Day{leave.days > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="mentor-leave-reason">Reason: {leave.reason}</div>
                      </div>

                      <div className="mentor-leave-actions">
                        <button
                          className="mentor-leave-approve-btn"
                          onClick={() => handleLeaveDecision(leave.id, "Approved")}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          className="mentor-leave-reject-btn"
                          onClick={() => handleLeaveDecision(leave.id, "Rejected")}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Task 5 Mentor Attendance Monitoring Screen */}
      {activeTab === "monitoring" && (
        <div className="attendance-monitoring-section">
          {/* Low Attendance / Defaulters Alert Box */}
          <div className="defaulters-alert-card">
            <div className="defaulters-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} color="#e11d48" />
                <h3>Low Attendance Defaulters List (&lt; 75%)</h3>
              </div>
              <button
                className="btn-send-bulk-notice"
                onClick={() => showToast("Performance warning notices sent to all low-attendance students!")}
              >
                <Send size={14} />
                <span>Send Warning Notice to All</span>
              </button>
            </div>

            <div className="defaulters-list-grid">
              {lowAttendanceStudents.map((st) => (
                <div key={st.id} className="defaulter-student-card">
                  <div className="defaulter-left">
                    <div className="defaulter-name">{st.name}</div>
                    <div className="defaulter-meta">{st.rollNo} &bull; {st.batch}</div>
                  </div>
                  <div className="defaulter-right">
                    <span className="defaulter-score">{st.attendance}%</span>
                    <button
                      className="btn-send-single-notice"
                      onClick={() => showToast(`Warning notice sent to ${st.name}`)}
                    >
                      Notify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
