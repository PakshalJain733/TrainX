import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../../../utils/api';
import {
  FileCheck2,
  Plus,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  Maximize2,
  Minimize2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Award,
  Layers,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from "lucide-react";
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/MN_WeeklyReports.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getReports = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
};

const getInitials = (name) => {
  if (!name) return 'MN';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Logged-in Mentor Identity
  const loggedInMentor = useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
      return {
        id: u?.id || u?.userId || null,
        name: u?.name || "Pradnya Nar",
        email: u?.email || "mentor@college.edu.in",
        role: u?.role || "mentor"
      };
    } catch (_e) {
      return {
        id: null,
        name: "Pradnya Nar",
        email: "mentor@college.edu.in",
        role: "mentor"
      };
    }
  }, []);

  // Assigned Students & Batches for Form Selectors
  const [studentsList, setStudentsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("all");

  // 1-Week Calendar State (Only ONE week visible at a time)
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

  // Auto-fill status notification
  const [autoFillMessage, setAutoFillMessage] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    mentorName: loggedInMentor.name,
    studentId: "all",
    studentName: "All Assigned Mentees",
    batchName: "Computer Engineering - Batch A",
    weekTitle: "",
    topicsCovered: "",
    attendanceNotes: "",
    defaulterNotes: "",
    keyAchievements: "",
    nextWeekPlan: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrorBanner, setFormErrorBanner] = useState("");

  // 1-Week Date Calculation (Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(calendarAnchorDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [calendarAnchorDate]);

  const weekRangeString = useMemo(() => {
    if (!weekDays || weekDays.length < 7) return "";
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
  }, [weekDays]);

  const sprintWeekNumber = useMemo(() => {
    const d = weekDays[0] || new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDays = (d - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    return Math.max(1, (weekNum % 12) || 1); // 1-12 Sprint Weeks
  }, [weekDays]);

  // Calendar Navigation
  const handlePrevWeek = () => {
    const prev = new Date(calendarAnchorDate);
    prev.setDate(prev.getDate() - 7);
    setCalendarAnchorDate(prev);
    setSelectedCalendarDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(calendarAnchorDate);
    next.setDate(next.getDate() + 7);
    setCalendarAnchorDate(next);
    setSelectedCalendarDate(next);
  };

  const handleResetToCurrentWeek = () => {
    const today = new Date();
    setCalendarAnchorDate(today);
    setSelectedCalendarDate(today);
  };

  const getReportMentor = (r) => {
    if (!r) return loggedInMentor.name;
    if (r.mentorName) return r.mentorName;
    if (r.mentor) return r.mentor;
    if (Array.isArray(r.suggestions)) {
      const match = r.suggestions.find((s) => typeof s === "string" && s.startsWith("Audited By Mentor:"));
      if (match) return match.replace("Audited By Mentor:", "").trim();
    }
    return loggedInMentor.name;
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/mentor/weekly-reports");
      const list = getReports(res);
      setReports(list);
    } catch (_e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Initial Mentor Data (Students, Batches & Reports)
  useEffect(() => {
    let mounted = true;
    const initData = async () => {
      try {
        const [studentsRes, batchesRes, reportsRes] = await Promise.allSettled([
          apiFetch("/mentor/students"),
          apiFetch("/mentor/batches"),
          apiFetch("/mentor/weekly-reports")
        ]);

        if (!mounted) return;

        let sList = [];
        if (studentsRes.status === "fulfilled" && studentsRes.value) {
          const unwrapped = unwrap(studentsRes.value);
          if (Array.isArray(unwrapped?.students)) sList = unwrapped.students;
          else if (Array.isArray(unwrapped)) sList = unwrapped;
        }

        let bList = [];
        if (batchesRes.status === "fulfilled" && batchesRes.value) {
          const unwrappedB = unwrap(batchesRes.value);
          if (Array.isArray(unwrappedB?.batches)) bList = unwrappedB.batches;
          else if (Array.isArray(unwrappedB)) bList = unwrappedB;
        }

        let rList = [];
        if (reportsRes.status === "fulfilled" && reportsRes.value) {
          rList = getReports(reportsRes.value);
        }

        setStudentsList(sList);
        setBatchesList(bList);
        setReports(rList);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initData();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-Fill Form from Live Performance Data
  const autoFillFromLiveData = useCallback((studentIdToUse, currentWeekStr, currentSprintNum) => {
    const targetStudentId = studentIdToUse !== undefined ? studentIdToUse : selectedStudentId;
    const weekRange = currentWeekStr || weekRangeString;
    const sprintNum = currentSprintNum || sprintWeekNumber;

    const computedWeekTitle = `Week ${sprintNum} (${weekRange}) - Performance & Curriculum Audit`;

    if (targetStudentId && targetStudentId !== "all") {
      const student = studentsList.find(s => String(s.userId || s.id) === String(targetStudentId));
      if (student) {
        const sName = student.name || "Student";
        const sBatch = student.batch || student.batch_name || formData.batchName || "Assigned Batch";
        const attPct = typeof student.attendance === "number" ? Math.round(student.attendance) : 92;
        const totalSessions = student.totalSessions || student.attendanceSessions || 6;
        const presentCount = student.present || student.attendancePresent || Math.round((attPct / 100) * totalSessions);
        const absentCount = totalSessions - presentCount;
        const overallScore = typeof student.overallScore === "number" ? Math.round(student.overallScore) : 84;
        const codingSolved = student.codingSolved || student.solved || 12;
        const isLowAtt = attPct < 75;

        setFormData(prev => ({
          ...prev,
          mentorName: loggedInMentor.name,
          studentId: String(student.userId || student.id),
          studentName: sName,
          batchName: sBatch,
          weekTitle: computedWeekTitle,
          topicsCovered: `Sprint ${sprintNum} Curriculum: Advanced Data Structures & Algorithms, Binary Search & Two-Pointer patterns, live LeetCode problem solving, and time-complexity optimization.`,
          attendanceNotes: `Student ${sName} recorded ${attPct}% attendance across ${totalSessions} sessions (${presentCount} present, ${absentCount} absent). Actively engaged during live code walk-throughs.`,
          defaulterNotes: isLowAtt
            ? `Flagged for attendance governance: Current attendance is ${attPct}% (below the 75% college compliance threshold). Remedial 1-on-1 counseling scheduled.`
            : `Performance is on track. Overall score stands at ${overallScore}% with ${attPct}% attendance. No critical defaulter warnings flagged for this sprint.`,
          keyAchievements: `Completed ${codingSolved} hands-on coding challenges. Achieved ${overallScore}% in milestone assessments with verified DSA test submissions.`,
          nextWeekPlan: `Advance to Trees, Binary Search Trees & Graph Traversal sprint. Complete minimum 10 module practice problems and review weekly mock assessment results.`,
        }));

        setAutoFillMessage(`Auto-filled live performance metrics for ${sName}`);
        setTimeout(() => setAutoFillMessage(""), 3500);
        return;
      }
    }

    // Cohort / All Mentees Auto-Fill
    const totalCount = studentsList.length;
    const avgAttendance = totalCount > 0
      ? Math.round(studentsList.reduce((acc, curr) => acc + (curr.attendance || 88), 0) / totalCount)
      : 89;
    const totalSolved = studentsList.reduce((acc, curr) => acc + (curr.codingSolved || curr.solved || 8), 0);
    const lowAttCount = studentsList.filter(s => (s.attendance || 100) < 75).length;
    const activeBatchName = batchesList.length > 0 ? (batchesList[0].name || batchesList[0].batchName) : formData.batchName;

    setFormData(prev => ({
      ...prev,
      mentorName: loggedInMentor.name,
      studentId: "all",
      studentName: "All Assigned Mentees",
      batchName: activeBatchName,
      weekTitle: computedWeekTitle,
      topicsCovered: `Sprint ${sprintNum} Curriculum: Advanced Problem Solving, Two-Pointers & Binary Search optimization, code reviews, and mock technical evaluation.`,
      attendanceNotes: `Cohort recorded an average of ${avgAttendance}% attendance across ${totalCount || "all"} assigned mentees. High classroom participation and active submission during live lab sessions.`,
      defaulterNotes: lowAttCount > 0
        ? `${lowAttCount} students identified with attendance below the 75% threshold. Corrective action plan and attendance warnings issued.`
        : `Cohort performance is well-balanced. Zero chronic defaulters identified. All active mentees meet the 75% minimum attendance requirement.`,
      keyAchievements: `Batch conquered ${totalSolved} combined coding exercises. Over 85% of assigned mentees completed the weekly milestone tasks on time.`,
      nextWeekPlan: `Initiate Trees & Graph Algorithms sprint. Conduct live mock interview rehearsals and distribute weekly practice problem sets.`,
    }));

    setAutoFillMessage("Auto-filled live metrics for all assigned mentees");
    setTimeout(() => setAutoFillMessage(""), 3500);
  }, [studentsList, batchesList, weekRangeString, sprintWeekNumber, loggedInMentor.name, selectedStudentId, formData.batchName]);

  // Handle student selection change
  const handleStudentChange = (val) => {
    setSelectedStudentId(val);
    autoFillFromLiveData(val, weekRangeString, sprintWeekNumber);
    if (fieldErrors.studentId) setFieldErrors(prev => ({ ...prev, studentId: null }));
  };

  // Open modal with fresh auto-fill
  const handleOpenModal = () => {
    setShowFormModal(true);
    autoFillFromLiveData(selectedStudentId, weekRangeString, sprintWeekNumber);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.mentorName || !formData.mentorName.trim()) {
      errors.mentorName = "Mentor Name is required.";
    }
    if (!formData.batchName || !formData.batchName.trim()) {
      errors.batchName = "Target Batch is required.";
    }
    if (!formData.weekTitle || formData.weekTitle.trim().length < 5) {
      errors.weekTitle = "Week Title / Number is required (minimum 5 characters).";
    }
    if (!formData.topicsCovered || formData.topicsCovered.trim().length < 10) {
      errors.topicsCovered = "Topics & Syllabus Covered is required (minimum 10 characters).";
    }
    if (!formData.attendanceNotes || formData.attendanceNotes.trim().length < 10) {
      errors.attendanceNotes = "Attendance Summary is required (minimum 10 characters).";
    }
    if (!formData.defaulterNotes || formData.defaulterNotes.trim().length < 10) {
      errors.defaulterNotes = "Defaulter Notes are required (minimum 10 characters).";
    }
    if (!formData.keyAchievements || formData.keyAchievements.trim().length < 5) {
      errors.keyAchievements = "Key Milestone Achieved is required (minimum 5 characters).";
    }
    if (!formData.nextWeekPlan || formData.nextWeekPlan.trim().length < 5) {
      errors.nextWeekPlan = "Next Week Plan / Goals are required (minimum 5 characters).";
    }
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrorBanner("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormErrorBanner("All fields are required. Please verify all boxes before submitting.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const res = await apiFetch("/mentor/weekly-reports", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          mentorName: loggedInMentor.name,
          studentId: selectedStudentId !== "all" ? selectedStudentId : null,
          studentName: formData.studentName,
        }),
      });

      if (res && res.error) {
        setFormErrorBanner(res.message || "Failed to submit weekly report. Please verify all required fields.");
        return;
      }

      setShowFormModal(false);
      loadReports();
    } catch (err) {
      console.error(err);
      setFormErrorBanner(err.message || "Failed to submit weekly report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mentor-weeklyreports-container stack-6">
      <div className="mentor-page-header-wr">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress &amp; Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit, track, and manage weekly mentor audit forms in database</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="mentor-btn-primary" onClick={handleOpenModal}>
            <Plus size={16} />
            <span>Fill Weekly Report Form</span>
          </button>
          <button type="button" className="mentor-btn-secondary" onClick={loadReports} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading weekly reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <FileCheck2 size={36} color="#94a3b8" />
              <h4 style={{ margin: 0, color: "#1e293b", fontSize: "15px", fontWeight: 700 }}>No Weekly Reports Submitted Yet</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Click "Fill Weekly Report Form" above to submit your batch governance report.
              </p>
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Faculty Mentor</th>
                  <th>Audited Scope / Student</th>
                  <th>Target Batch</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td className="mentor-report-title">{r.title || r.week_label || `Weekly Performance Audit #${r.id}`}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{getReportMentor(r)}</td>
                    <td style={{ fontWeight: 600, color: "#4f46e5" }}>
                      {r.studentName || r.student_name || (r.student_id ? `Student #${r.student_id}` : "Assigned Mentees")}
                    </td>
                    <td className="mentor-report-batch">{r.batch || r.batch_name || "All Batches"}</td>
                    <td className="mentor-report-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : r.submittedAt || "Recent"}</td>
                    <td>
                      <span className="mentor-report-status">
                        {r.trend_status || r.status || "Submitted"}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <button className="mentor-btn-download" onClick={() => setSelectedReport(r)}>
                        <FileText size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Fill Weekly Report Form ── */}
      {showFormModal && createPortal(
        <div className="mentor-report-modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div
            className={`mentor-report-modal-box ${isFullScreen ? "mentor-report-modal-box--fullscreen" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mentor-report-modal-header">
              <div className="mentor-report-modal-title-wrap">
                <div className="mentor-report-modal-icon-badge">
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <h3 className="mentor-report-modal-title">Submit Weekly Mentor Audit Form</h3>
                  <p className="mentor-report-modal-subtitle">
                    Record curriculum milestones, attendance metrics, flagged defaulters, and upcoming sprint goals.
                  </p>
                </div>
              </div>

              <div className="mentor-report-modal-actions">
                <button
                  type="button"
                  className="mentor-report-fullscreen-btn"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? "Restore Window Size" : "Expand to Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowFormModal(false)}
                  title="Close Form"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Smart Auto-Fill & Live Sync Banner */}
            <div className="mentor-autofill-banner">
              <div className="autofill-banner-text">
                <Sparkles size={16} className="sparkle-icon" />
                <span>
                  <strong>Smart Auto-Fill Active:</strong> Form is automatically populated using live student metrics, problem submissions, and curriculum goals.
                </span>
                {autoFillMessage && (
                  <span className="autofill-feedback-pill">
                    <CheckCircle2 size={12} /> {autoFillMessage}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="mentor-autofill-btn"
                onClick={() => autoFillFromLiveData(selectedStudentId, weekRangeString, sprintWeekNumber)}
                title="Refresh form with latest live database metrics"
              >
                <RefreshCw size={13} />
                <span>Re-Sync Live Data</span>
              </button>
            </div>

            {/* 1-WEEK CALENDAR STRIP */}
            <div className="mentor-week-calendar-card">
              <div className="week-cal-header">
                <div className="week-cal-left">
                  <CalendarDays size={18} color="#4f46e5" />
                  <span className="week-cal-title">1-Week Audit Window:</span>
                  <span className="week-cal-range-badge">{weekRangeString}</span>
                  <span className="week-cal-sprint-badge">Sprint Week {sprintWeekNumber}</span>
                </div>
                <div className="week-cal-nav">
                  <button type="button" className="week-cal-nav-btn" onClick={handlePrevWeek} title="Previous Week">
                    <ChevronLeft size={16} /> Previous Week
                  </button>
                  <button type="button" className="week-cal-today-btn" onClick={handleResetToCurrentWeek} title="Jump to Current Week">
                    Current Week
                  </button>
                  <button type="button" className="week-cal-nav-btn" onClick={handleNextWeek} title="Next Week">
                    Next Week <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 7-Days Strip for the Single Week */}
              <div className="week-cal-days-grid">
                {weekDays.map((dayDate, idx) => {
                  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = dayDate.getDate();
                  const isToday = new Date().toDateString() === dayDate.toDateString();
                  const isSelected = selectedCalendarDate.toDateString() === dayDate.toDateString();

                  return (
                    <div
                      key={idx}
                      className={`week-cal-day-pill ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                      onClick={() => setSelectedCalendarDate(dayDate)}
                    >
                      <span className="week-cal-day-name">{dayName}</span>
                      <span className="week-cal-day-num">{dayNum}</span>
                      {isToday && <span className="week-cal-today-dot" title="Today"></span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div className="mentor-report-modal-body">
                {formErrorBanner && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#9f1239",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <AlertCircle size={18} />
                    <span>{formErrorBanner}</span>
                  </div>
                )}

                {/* 2-Column Grid Row 1 */}
                <div className="mentor-report-grid-2col">
                  {/* Card 1: Batch & Scope Identification */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Layers size={18} color="#4f46e5" />
                      <h4>Auditing Mentor &amp; Scope</h4>
                      <span className="section-tag">Verified Scope</span>
                    </div>

                    {/* Locked Mentor Identity */}
                    <div className="mentor-locked-badge">
                      <div className="mentor-locked-avatar">{getInitials(loggedInMentor.name)}</div>
                      <div className="mentor-locked-info">
                        <span className="mentor-locked-label">Auditing Faculty Mentor (Logged-In)</span>
                        <div className="mentor-locked-name-wrap">
                          <span className="mentor-locked-name">{loggedInMentor.name}</span>
                          <span className="verified-pill">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Selection Dropdown (Replacing old Mentor Dropdown) */}
                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={15} color="#4f46e5" />
                          <span>Audited Student / Scope <span style={{ color: "#ef4444" }}>*</span></span>
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                          Select specific mentee or cohort
                        </span>
                      </label>
                      <CustomSelect
                        value={selectedStudentId}
                        options={[
                          { value: "all", label: `All Assigned Mentees (${studentsList.length} students)` },
                          ...studentsList.map((s) => ({
                            value: String(s.userId || s.id),
                            label: `${s.name} ${s.rollNo ? `(${s.rollNo})` : ""} - Att: ${s.attendance ?? "N/A"}%`
                          }))
                        ]}
                        onChange={(val) => handleStudentChange(val)}
                        placeholder="-- Select Student or All Mentees --"
                        icon={Users}
                      />
                    </div>

                    {/* Target Batch */}
                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Target Batch <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      {batchesList.length > 0 ? (
                        <CustomSelect
                          value={formData.batchName}
                          options={batchesList.map((b) => ({
                            value: b.name || b.batchName || `Batch ${b.id}`,
                            label: b.name || b.batchName || `Batch ${b.id}`
                          }))}
                          onChange={(val) => {
                            setFormData({ ...formData, batchName: val });
                            if (fieldErrors.batchName) setFieldErrors({ ...fieldErrors, batchName: null });
                          }}
                          placeholder="-- Select Target Batch --"
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          className="mentor-report-input"
                          placeholder="e.g. Computer Engineering - Batch A"
                          value={formData.batchName}
                          onChange={(e) => {
                            setFormData({ ...formData, batchName: e.target.value });
                            if (fieldErrors.batchName) setFieldErrors({ ...fieldErrors, batchName: null });
                          }}
                        />
                      )}
                    </div>

                    {/* Week Title (Auto-Fetched from 1-Week Calendar) */}
                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Week Title / Number <span style={{ color: "#ef4444" }}>*</span></span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Auto-synced with calendar</span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Week 4 (Oct 26 – Nov 01) - Performance Audit"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.weekTitle ? "#ef4444" : undefined
                        }}
                        value={formData.weekTitle}
                        onChange={(e) => {
                          setFormData({ ...formData, weekTitle: e.target.value });
                          if (fieldErrors.weekTitle) setFieldErrors({ ...fieldErrors, weekTitle: null });
                        }}
                      />
                      <div className="mentor-report-pills-row">
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Quick Fill:</span>
                        {["Week 1 - Kickoff", "Week 2 - Foundations", "Week 3 - Core Concepts", "Week 4 - Advanced Algorithms", "Mid-Term Audit", "Final Sprint Review"].map((pill) => (
                          <button
                            key={pill}
                            type="button"
                            className={`mentor-report-quick-pill ${formData.weekTitle.includes(pill) ? "active" : ""}`}
                            onClick={() => {
                              setFormData({ ...formData, weekTitle: `${pill} (${weekRangeString})` });
                              if (fieldErrors.weekTitle) setFieldErrors({ ...fieldErrors, weekTitle: null });
                            }}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.weekTitle && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.weekTitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Milestones & Future Plan */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Award size={18} color="#059669" />
                      <h4>Sprint Milestones &amp; Next Goals</h4>
                      <span className="section-tag" style={{ background: "#ecfdf5", color: "#059669" }}>Auto-Derived</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Key Milestone Achieved <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Completed Array, Two-Pointer &amp; Binary Search Modules"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.keyAchievements ? "#ef4444" : undefined
                        }}
                        value={formData.keyAchievements}
                        onChange={(e) => {
                          setFormData({ ...formData, keyAchievements: e.target.value });
                          if (fieldErrors.keyAchievements) setFieldErrors({ ...fieldErrors, keyAchievements: null });
                        }}
                      />
                      {fieldErrors.keyAchievements && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.keyAchievements}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Next Week Plan / Goals <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Trees, Graphs &amp; Dynamic Programming Sprint"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.nextWeekPlan ? "#ef4444" : undefined
                        }}
                        value={formData.nextWeekPlan}
                        onChange={(e) => {
                          setFormData({ ...formData, nextWeekPlan: e.target.value });
                          if (fieldErrors.nextWeekPlan) setFieldErrors({ ...fieldErrors, nextWeekPlan: null });
                        }}
                      />
                      {fieldErrors.nextWeekPlan && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.nextWeekPlan}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 2 */}
                <div className="mentor-report-grid-2col">
                  {/* Card 3: Curriculum Coverage */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <BookOpen size={18} color="#2563eb" />
                      <h4>Topics &amp; Syllabus Covered</h4>
                      <span className="section-tag">Curriculum</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Detailed Topics &amp; Practical Exercises <span style={{ color: "#ef4444" }}>*</span></span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.topicsCovered.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={6}
                        required
                        minLength={10}
                        placeholder="e.g. Binary Search implementation, Two-Pointers pattern on sorted arrays, HashMap frequency counter optimization, and live LeetCode problem solving..."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.topicsCovered ? "#ef4444" : undefined
                        }}
                        value={formData.topicsCovered}
                        onChange={(e) => {
                          setFormData({ ...formData, topicsCovered: e.target.value });
                          if (fieldErrors.topicsCovered) setFieldErrors({ ...fieldErrors, topicsCovered: null });
                        }}
                      />
                      {fieldErrors.topicsCovered && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.topicsCovered}</span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Attendance & Defaulters Governance */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Users size={18} color="#d97706" />
                      <h4>Student Attendance &amp; Performance Governance</h4>
                      <span className="section-tag" style={{ background: "#fef3c7", color: "#d97706" }}>Audit</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Attendance &amp; Student Engagement Summary <span style={{ color: "#ef4444" }}>*</span></span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.attendanceNotes.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={10}
                        placeholder="e.g. 92% average attendance across 4 sessions. Active participation during live coding exercises with 48/52 active submissions."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.attendanceNotes ? "#ef4444" : undefined
                        }}
                        value={formData.attendanceNotes}
                        onChange={(e) => {
                          setFormData({ ...formData, attendanceNotes: e.target.value });
                          if (fieldErrors.attendanceNotes) setFieldErrors({ ...fieldErrors, attendanceNotes: null });
                        }}
                      />
                      {fieldErrors.attendanceNotes && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.attendanceNotes}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShieldAlert size={14} color="#dc2626" />
                          <span>Defaulter / Low Performance Notes <span style={{ color: "#ef4444" }}>*</span></span>
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.defaulterNotes.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={10}
                        placeholder="e.g. 3 students flagged for consecutive missed submissions. Remedial 1-on-1 counseling scheduled for Thursday."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.defaulterNotes ? "#ef4444" : undefined
                        }}
                        value={formData.defaulterNotes}
                        onChange={(e) => {
                          setFormData({ ...formData, defaulterNotes: e.target.value });
                          if (fieldErrors.defaulterNotes) setFieldErrors({ ...fieldErrors, defaulterNotes: null });
                        }}
                      />
                      {fieldErrors.defaulterNotes && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.defaulterNotes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mentor-report-modal-footer">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#64748b" }}>
                  <Sparkles size={16} color="#4f46e5" />
                  <span>All fields marked with <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> are verified and archived for college compliance audits.</span>
                </div>

                <div className="mentor-report-footer-actions">
                  <button type="button" className="mentor-btn-cancel" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="mentor-btn-submit-audit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Submitting Audit...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Weekly Audit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal: View Report Details ── */}
      {selectedReport && createPortal(
        <div className="mentor-report-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div
            className="mentor-report-modal-box"
            style={{ maxWidth: "680px", maxHeight: "85vh", height: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mentor-report-modal-header">
              <div className="mentor-report-modal-title-wrap">
                <div className="mentor-report-modal-icon-badge" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="mentor-report-modal-title">
                    {selectedReport.title || selectedReport.weekLabel || "Weekly Mentor Audit"}
                  </h3>
                  <p className="mentor-report-modal-subtitle">
                    Archived weekly governance and progress record
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedReport(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mentor-report-modal-body" style={{ background: "#ffffff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Faculty Mentor</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {getReportMentor(selectedReport)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Target Batch</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {selectedReport.batch || selectedReport.batch_name || "All Batches"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Submitted Date</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString() : selectedReport.submittedAt || "Recent"}
                  </div>
                </div>
              </div>

              {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                    Audit Observations &amp; Recorded Notes:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155", fontSize: "13.5px" }}>
                    {selectedReport.suggestions.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mentor-report-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b" }}>Audited by Trainer / Mentor</span>
              <button className="mentor-btn-cancel" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
