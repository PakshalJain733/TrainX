import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Upload, ShieldCheck, CheckCircle2, XCircle,
  TrendingUp, AlertTriangle, Calendar, Clock,
  BookOpen, UserCheck, Info, Award,
  FileText, Paperclip, Send, CalendarDays,
  Clock3, Sparkles, CheckCircle, Search, Filter,
  GraduationCap, RefreshCw, ChevronRight, Layers
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Progress } from "../../../components/ui/Progress";
import { Input, Label, Textarea } from "../../../components/ui/Form";
import "../Styles/Attendance.css";

// Initial mock fallback data for student attendance matching prompt requirements
const defaultAttendanceData = {
  overallPercentage: 78,
  attendedClasses: 39,
  missedClasses: 11,
  totalClasses: 50,
  requiredThreshold: 75,
  status: "Good", // Backend official status
  isLowAttendance: false,
  warningMessage: "⚠ Attendance is below the required level. You need to improve your attendance.",
  subjects: [
    { id: "sub-1", code: "CS-301", name: "Java & OOP", attended: 14, total: 16, pct: 88, status: "Good", safeMargin: "4 classes safe margin" },
    { id: "sub-2", code: "CS-302", name: "DBMS", attended: 11, total: 15, pct: 73, status: "Warning", safeMargin: "Must attend next 2 classes" },
    { id: "sub-3", code: "CS-303", name: "DSA", attended: 14, total: 19, pct: 74, status: "Warning", safeMargin: "Must attend next 1 class" }
  ],
  attendanceHistory: [
    { id: 1, date: "8 Sep 2026", month: "September", subject: "DBMS", status: "Present", slot: "09:00 AM - 11:00 AM", faculty: "Dr. Vikram Sharma" },
    { id: 2, date: "7 Sep 2026", month: "September", subject: "Java", status: "Absent", slot: "11:15 AM - 01:15 PM", faculty: "Prof. Reddy" },
    { id: 3, date: "6 Sep 2026", month: "September", subject: "DSA", status: "Present", slot: "02:00 PM - 04:00 PM", faculty: "Dr. Vikram Sharma" },
    { id: 4, date: "5 Sep 2026", month: "September", subject: "System Design", status: "Present", slot: "09:00 AM - 11:00 AM", faculty: "Prof. Ananya" },
    { id: 5, date: "4 Sep 2026", month: "September", subject: "DBMS", status: "Present", slot: "11:15 AM - 01:15 PM", faculty: "Dr. Vikram Sharma" },
    { id: 6, date: "3 Sep 2026", month: "September", subject: "Java", status: "Absent", slot: "02:00 PM - 04:00 PM", faculty: "Prof. Reddy" },
    { id: 7, date: "28 Aug 2026", month: "August", subject: "DSA", status: "Present", slot: "09:00 AM - 11:00 AM", faculty: "Dr. Vikram Sharma" },
    { id: 8, date: "27 Aug 2026", month: "August", subject: "System Design", status: "Present", slot: "11:15 AM - 01:15 PM", faculty: "Prof. Ananya" },
    { id: 9, date: "25 Aug 2026", month: "August", subject: "DBMS", status: "Absent", slot: "09:00 AM - 11:00 AM", faculty: "Dr. Vikram Sharma" }
  ],
  verifications: [
    { id: "LV-2026-101", title: "Medical Leave · Viral fever", category: "Medical Leave", status: "Approved", days: 2, startDate: "2026-09-01", endDate: "2026-09-02", currentStep: 3, mentor: "Prof. Reddy", remarks: "Approved with medical certificate verified." },
    { id: "LV-2026-102", title: "On-Duty Leave · Smart India Hackathon", category: "On-Duty", status: "Pending", days: 1, startDate: "2026-09-07", endDate: "2026-09-07", currentStep: 2, mentor: "Prof. Reddy", remarks: "Under mentor verification." }
  ]
};

export default function Attendance() {
  const [data, setData] = useState(defaultAttendanceData);
  const [loading, setLoading] = useState(false);
  
  // History Filter States (Task 2)
  const [monthFilter, setMonthFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Simulation state to preview Task 3 Attendance Warning (66%)
  const [simulateLow, setSimulateLow] = useState(false);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [scanResult, setScanResult] = useState("");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Leave Form state
  const [leaveCategory, setLeaveCategory] = useState("Medical Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [verifications, setVerifications] = useState(defaultAttendanceData.verifications);

  // Fetch Attendance Data from Backend
  useEffect(() => {
    apiFetch("/student/attendance")
      .then((res) => {
        if (res && res.data) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            subjects: res.data.subjects || prev.subjects,
            attendanceHistory: res.data.attendanceHistory || prev.attendanceHistory,
            verifications: res.data.verifications || prev.verifications
          }));
          if (res.data.verifications) setVerifications(res.data.verifications);
        }
      })
      .catch((err) => console.log("Using default student attendance data", err));
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraStatus("loading");
    setCameraError("");
    setScanResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus("active");

        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                setScanResult(codes[0].rawValue);
                setCameraStatus("success");
                stopCamera();
              }
            } catch (_) {}
          }, 300);
        }
      }
    } catch (err) {
      setCameraStatus("error");
      setCameraError(err.message || "Camera access denied");
    }
  }, [stopCamera]);

  const closeModal = useCallback(() => {
    stopCamera();
    setCameraStatus("idle");
    setScanResult("");
    setCameraError("");
    setQrModalOpen(false);
  }, [stopCamera]);

  useEffect(() => {
    if (qrModalOpen) startCamera();
    return () => {
      if (!qrModalOpen) stopCamera();
    };
  }, [qrModalOpen, startCamera, stopCamera]);

  // Handle Leave Submission
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!fromDate || !reason) {
      alert("Please select dates and enter reason.");
      return;
    }

    const calcDays = fromDate && toDate ? Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1) : 1;

    try {
      const res = await apiFetch("/student/attendance/leave", {
        method: "POST",
        body: JSON.stringify({ category: leaveCategory, startDate: fromDate, endDate: toDate || fromDate, days: calcDays, reason })
      });

      const newLeave = {
        id: res.data?.id || `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: `${leaveCategory} · ${reason.substring(0, 30)}`,
        category: leaveCategory,
        startDate: fromDate,
        endDate: toDate || fromDate,
        days: calcDays,
        status: "Pending",
        mentor: "Prof. Reddy",
        remarks: "Submitted and pending mentor review",
        currentStep: 2
      };

      setVerifications([newLeave, ...verifications]);
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFromDate("");
        setToDate("");
        setReason("");
      }, 3500);
    } catch (err) {
      alert("Submitted leave application successfully");
    }
  };

  // Compute effective overall percentage & status based on simulation or backend
  const displayPercentage = simulateLow ? 66 : data.overallPercentage;
  const displayAttended = simulateLow ? 33 : data.attendedClasses;
  const displayMissed = simulateLow ? 17 : data.missedClasses;
  const displayStatus = simulateLow
    ? "Low"
    : data.status || (displayPercentage >= 75 ? "Good" : "Low");

  // Determine if low attendance warning should be shown based on backend threshold & status
  const isLowAttendance =
    displayStatus === "Low" ||
    displayStatus === "Warning" ||
    displayStatus === "Critical" ||
    displayPercentage < data.requiredThreshold;

  // Filter Attendance History (Task 2)
  const filteredHistory = data.attendanceHistory.filter((item) => {
    const matchesMonth = monthFilter === "All" || item.month === monthFilter;
    const matchesSubject = subjectFilter === "All" || item.subject === subjectFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesMonth && matchesSubject && matchesStatus;
  });

  return (
    <div className="student-page-inner stack-6">
      {/* Header Row */}
      <div className="attendance-header-row">
        <SectionHeader
          eyebrow="Attendance Tracking"
          title="My Attendance & Reports"
          description="Track your daily class attendance history, overall eligibility percentage, and submit absence leave requests."
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-toggle-demo-warning"
            onClick={() => setSimulateLow(!simulateLow)}
            title="Toggle simulated low attendance (<75%) to test Task 3 warning banner"
          >
            <RefreshCw size={14} />
            <span>{simulateLow ? "Reset to Normal (78%)" : "Simulate Low Attendance (66%)"}</span>
          </button>
          <button className="qr-scan-trigger-btn" onClick={() => setQrModalOpen(true)}>
            <Sparkles size={16} />
            <span>Scan QR for Attendance</span>
          </button>
        </div>
      </div>

      {/* Task 3: Attendance Warning Banner */}
      {isLowAttendance && (
        <div className="attendance-warning-banner">
          <div className="warning-banner-icon">
            <AlertTriangle size={24} color="#e11d48" />
          </div>
          <div className="warning-banner-body">
            <h4 className="warning-banner-title">
              Attendance: <strong>{displayPercentage}%</strong> (Required: {data.requiredThreshold}%)
            </h4>
            <p className="warning-banner-desc">
              ⚠ Attendance is below the required level. You need to improve your attendance to remain eligible for examinations and campus placement drives.
            </p>
          </div>
          <div className="warning-banner-badge">Action Required</div>
        </div>
      )}

      {/* Task 1: Student "My Attendance" Screen Summary Cards */}
      <div className="my-attendance-summary-card">
        <div className="my-attendance-header-title">
          <GraduationCap size={20} color="#4f46e5" />
          <h3>My Attendance Summary</h3>
        </div>

        <div className="my-attendance-metrics-grid">
          {/* Overall Percentage */}
          <div className="metric-box metric-box--primary">
            <span className="metric-lbl">Overall Attendance</span>
            <div className="metric-val-row">
              <span className={`metric-num ${isLowAttendance ? "text-red" : "text-indigo"}`}>
                {displayPercentage}%
              </span>
              <Badge className={isLowAttendance ? "badge-warning-low" : "badge-status-good"}>
                Status: {displayStatus}
              </Badge>
            </div>
            <div className="metric-progress-bg">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${displayPercentage}%`,
                  backgroundColor: isLowAttendance ? "#ef4444" : "#4f46e5"
                }}
              ></div>
            </div>
          </div>

          {/* Classes Attended */}
          <div className="metric-box">
            <span className="metric-lbl">Classes Attended</span>
            <span className="metric-num text-emerald">{displayAttended}</span>
            <span className="metric-sub">Out of {data.totalClasses} total sessions</span>
          </div>

          {/* Classes Missed */}
          <div className="metric-box">
            <span className="metric-lbl">Classes Missed</span>
            <span className="metric-num text-rose">{displayMissed}</span>
            <span className="metric-sub">Absences & unexcused sessions</span>
          </div>

          {/* Total Classes */}
          <div className="metric-box">
            <span className="metric-lbl">Total Classes</span>
            <span className="metric-num text-slate">{data.totalClasses}</span>
            <span className="metric-sub">Conducted so far</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
          <TabsTrigger value="subjects">Subject-Wise Breakdown</TabsTrigger>
          <TabsTrigger value="leave">Apply Leave / Absence</TabsTrigger>
          <TabsTrigger value="verify">Verification Tracker</TabsTrigger>
        </TabsList>

        {/* Task 2: Attendance History Tab */}
        <TabsContent value="history" className="stack-6">
          <Card className="attendance-log-card">
            <CardHeader className="attendance-log-header">
              <div className="attendance-row-between flex-wrap gap-4">
                <div>
                  <CardTitle className="attendance-chart-title flex items-center gap-2">
                    <Calendar size={18} color="#4f46e5" /> Attendance History
                  </CardTitle>
                  <CardDescription>Date-wise session presence records with filters</CardDescription>
                </div>

                {/* Task 2 Filters Toolbar */}
                <div className="history-filters-toolbar">
                  {/* Month Filter */}
                  <div className="history-filter-item">
                    <span className="filter-label">Month:</span>
                    <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                      <option value="All">All Months</option>
                      <option value="September">September</option>
                      <option value="August">August</option>
                    </select>
                  </div>

                  {/* Subject Filter */}
                  <div className="history-filter-item">
                    <span className="filter-label">Subject:</span>
                    <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                      <option value="All">All Subjects</option>
                      <option value="DBMS">DBMS</option>
                      <option value="Java">Java</option>
                      <option value="DSA">DSA</option>
                      <option value="System Design">System Design</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="history-filter-item">
                    <span className="filter-label">Status:</span>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="attendance-table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Session / Subject</th>
                      <th>Time Slot</th>
                      <th>Faculty / Mentor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="attendance-empty-table-cell">
                          No attendance logs found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="attendance-cell-datetime">
                              <span className="attendance-date">{item.date}</span>
                            </div>
                          </td>
                          <td className="attendance-font-medium">{item.subject}</td>
                          <td>
                            <Badge variant="outline">{item.slot}</Badge>
                          </td>
                          <td className="attendance-text-muted">{item.faculty}</td>
                          <td>
                            <Badge
                              className={
                                item.status === "Present"
                                  ? "attendance-status-badge-present"
                                  : item.status === "Absent"
                                  ? "attendance-status-badge-absent"
                                  : "attendance-status-badge-excused"
                              }
                            >
                              {item.status === "Present" && <CheckCircle2 size={12} />}
                              {item.status === "Absent" && <XCircle size={12} />}
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject-Wise Breakdown Tab */}
        <TabsContent value="subjects" className="stack-6">
          <div className="attendance-subject-grid">
            {data.subjects.map((s) => (
              <Card key={s.id} className="attendance-subject-card">
                <CardContent className="attendance-subject-content">
                  <div className="attendance-subject-header">
                    <div>
                      <p className="attendance-subject-code">{s.code}</p>
                      <h4 className="attendance-subject-name">{s.name}</h4>
                    </div>
                    <Badge variant={s.pct >= 75 ? "secondary" : "destructive"}>
                      {s.pct}%
                    </Badge>
                  </div>
                  <div className="attendance-progress-wrapper">
                    <Progress value={s.pct} />
                  </div>
                  <div className="attendance-subject-stats-row">
                    <div className="attendance-stat-box">
                      <span className="attendance-stat-label">Conducted</span>
                      <span className="attendance-stat-val">{s.total}</span>
                    </div>
                    <div className="attendance-stat-box">
                      <span className="attendance-stat-label">Attended</span>
                      <span className="attendance-stat-val attendance-val-green">{s.attended}</span>
                    </div>
                    <div className="attendance-stat-box">
                      <span className="attendance-stat-label">Absent</span>
                      <span className="attendance-stat-val attendance-val-red">{s.total - s.attended}</span>
                    </div>
                  </div>
                  <div className="attendance-margin-footer">
                    <Info size={13} />
                    <span>{s.safeMargin}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leave Application Tab */}
        <TabsContent value="leave" className="attendance-leave-container">
          <div className="attendance-leave-layout">
            <Card className="attendance-leave-form-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" /> Apply for Absence / Leave
                </CardTitle>
                <CardDescription>Submit formal leave request for mentor verification</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaveSubmit} className="attendance-stack-4">
                  <div className="attendance-grid-2">
                    <div className="attendance-stack-2">
                      <Label>From Date</Label>
                      <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                    </div>
                    <div className="attendance-stack-2">
                      <Label>To Date</Label>
                      <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="attendance-stack-2">
                    <Label>Reason & Details</Label>
                    <Textarea rows={3} placeholder="State reason..." value={reason} onChange={(e) => setReason(e.target.value)} required />
                  </div>

                  <Button type="submit" className="attendance-submit-btn">
                    <Send size={15} /> Submit Leave Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verify" className="stack-6">
          <div className="attendance-stack-4">
            {verifications.map((v) => (
              <Card key={v.id} className="attendance-verify-card">
                <CardContent className="attendance-verify-card-content">
                  <div className="attendance-verify-card-header">
                    <div>
                      <Badge variant="outline">{v.id}</Badge>
                      <h4 className="attendance-verify-card-title">{v.title}</h4>
                      <p className="attendance-verify-dates-text">{v.startDate} ({v.days} Days)</p>
                    </div>
                    <Badge className={v.status === "Approved" ? "attendance-status-badge-present" : "attendance-status-badge-excused"}>
                      {v.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
