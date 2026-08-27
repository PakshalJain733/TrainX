import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../../../utils/api";
import {
  Upload, FileBarChart, MessageSquare,
  ShieldCheck, CheckCircle2, XCircle,
  TrendingUp, AlertTriangle, Calendar, Clock,
  BookOpen, UserCheck, AlertCircle, Cpu, Code2,
  Database, Network, ChevronRight, BarChart3,
  Check, ArrowUpRight, Filter, Info, Award,
  FileText, Paperclip, Send, CalendarDays,
  Clock3, AlertOctagon, Download, ExternalLink,
  FileCheck, Sparkles, CheckCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  ReferenceLine, LabelList
} from "recharts";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Progress } from "../../../components/ui/Progress";
import { Input, Label, Textarea } from "../../../components/ui/Form";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/Table";
import "../Styles/Attendance.css";

const kpiData = [
  {
    title: "Overall Attendance",
    value: "90%",
    subtext: "Eligibility Required: 75%",
    status: "Exam Eligible",
    variant: "success",
    icon: UserCheck,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.12)"
  },
  {
    title: "Total Conducted",
    value: "171 / 192",
    subtext: "21 total classes missed",
    status: "89% Attended",
    variant: "info",
    icon: BookOpen,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.12)"
  },
  {
    title: "Approved Leaves",
    value: "3 Days",
    subtext: "1 pending mentor verification",
    status: "Covered",
    variant: "warning",
    icon: ShieldCheck,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.12)"
  },
  {
    title: "Safety Margin Buffer",
    value: "14 Classes",
    subtext: "Buffer before dropping below 75%",
    status: "Safe Zone",
    variant: "purple",
    icon: TrendingUp,
    color: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.12)"
  }
];

const subjects = [
  {
    id: "ds",
    name: "Data Structures & Algorithms",
    code: "CS-301",
    faculty: "Dr. A. Sharma",
    pct: 94,
    attended: 47,
    total: 50,
    absent: 3,
    excused: 1,
    icon: Code2,
    iconBg: "rgba(79, 70, 229, 0.12)",
    iconColor: "#4f46e5",
    badgeVariant: "secondary",
    statusText: "Excellent",
    safeMargin: "Can safely skip 11 more classes"
  },
  {
    id: "os",
    name: "Operating Systems",
    code: "CS-302",
    faculty: "Prof. R. Varma",
    pct: 88,
    attended: 44,
    total: 50,
    absent: 6,
    excused: 2,
    icon: Cpu,
    iconBg: "rgba(14, 165, 233, 0.12)",
    iconColor: "#0ea5e9",
    badgeVariant: "secondary",
    statusText: "Good",
    safeMargin: "Can safely skip 6 more classes"
  },
  {
    id: "dbms",
    name: "Database Management Systems",
    code: "CS-303",
    faculty: "Prof. S. Kulkarni",
    pct: 92,
    attended: 46,
    total: 50,
    absent: 4,
    excused: 0,
    icon: Database,
    iconBg: "rgba(16, 185, 129, 0.12)",
    iconColor: "#10b981",
    badgeVariant: "secondary",
    statusText: "Excellent",
    safeMargin: "Can safely skip 8 more classes"
  },
  {
    id: "cn",
    name: "Computer Networks",
    code: "CS-304",
    faculty: "Dr. P. Nair",
    pct: 81,
    attended: 34,
    total: 42,
    absent: 8,
    excused: 0,
    icon: Network,
    iconBg: "rgba(245, 158, 11, 0.12)",
    iconColor: "#f59e0b",
    badgeVariant: "destructive",
    statusText: "Attention Needed",
    safeMargin: "Must attend next 3 consecutive classes"
  }
];

const monthlyTrend = [
  { month: "Aug", attendance: 95, required: 75 },
  { month: "Sep", attendance: 92, required: 75 },
  { month: "Oct", attendance: 86, required: 75 },
  { month: "Nov", attendance: 90, required: 75 },
  { month: "Dec", attendance: 89.6, required: 75 }
];

const daywiseAttendance = [
  { day: "Mon", rate: 94 },
  { day: "Tue", rate: 88 },
  { day: "Wed", rate: 92 },
  { day: "Thu", rate: 82 },
  { day: "Fri", rate: 91 }
];

const recentLogs = [
  { id: 1, date: "Dec 04, 2026", time: "09:30 AM", subject: "Data Structures", slot: "Lab 2", status: "Present", faculty: "Dr. A. Sharma" },
  { id: 2, date: "Dec 04, 2026", time: "11:30 AM", subject: "Operating Systems", slot: "Lec 4", status: "Present", faculty: "Prof. R. Varma" },
  { id: 3, date: "Dec 03, 2026", time: "02:00 PM", subject: "Computer Networks", slot: "Lec 1", status: "Absent", faculty: "Dr. P. Nair" },
  { id: 4, date: "Dec 02, 2026", time: "10:30 AM", subject: "DBMS", slot: "Lec 3", status: "Present", faculty: "Prof. S. Kulkarni" },
  { id: 5, date: "Dec 01, 2026", time: "01:30 PM", subject: "Operating Systems", slot: "Lab 1", status: "Excused", faculty: "Prof. R. Varma" }
];

const leaveQuotas = [
  { type: "Medical Leaves", used: 3, total: 6, color: "#8b5cf6", icon: ShieldCheck },
  { type: "Duty Leaves", used: 2, total: 4, color: "#3b82f6", icon: BookOpen },
  { type: "Casual / Personal", used: 1, total: 3, color: "#f59e0b", icon: Clock }
];

const initialVerifications = [
  {
    id: "LV-2026-089",
    title: "Medical Leave · High Fever & Flu",
    category: "Medical Leave",
    startDate: "Nov 12, 2026",
    endDate: "Nov 14, 2026",
    days: 3,
    status: "Approved",
    ok: true,
    mentor: "Prof. Reddy (Faculty Advisor)",
    submittedDate: "Nov 11, 2026",
    remarks: "Medical certificate verified by college health center. Attendance regularized for 3 days.",
    attachment: "medical_certificate_nov12.pdf",
    currentStep: 3
  },
  {
    id: "LV-2026-074",
    title: "Academic Duty · Inter-College Hackathon",
    category: "Academic Duty",
    startDate: "Nov 20, 2026",
    endDate: "Nov 21, 2026",
    days: 2,
    status: "Approved",
    ok: true,
    mentor: "Prof. S. Kulkarni",
    submittedDate: "Nov 18, 2026",
    remarks: "Event participation confirmed by C2C Cell. Duty leave granted.",
    attachment: "hackathon_invite_pass.pdf",
    currentStep: 3
  },
  {
    id: "LV-2026-102",
    title: "Family Function · Sister's Wedding",
    category: "Personal / Family",
    startDate: "Dec 10, 2026",
    endDate: "Dec 12, 2026",
    days: 3,
    status: "Pending",
    ok: false,
    mentor: "Prof. Reddy (Faculty Advisor)",
    submittedDate: "Dec 03, 2026",
    remarks: "Under review by Mentor. Awaiting HOD final confirmation.",
    attachment: "wedding_invitation.pdf",
    currentStep: 2
  },
  {
    id: "LV-2026-045",
    title: "Personal Emergency · Travel Delay",
    category: "Personal / Family",
    startDate: "Oct 05, 2026",
    endDate: "Oct 05, 2026",
    days: 1,
    status: "Rejected",
    ok: false,
    mentor: "Prof. Reddy (Faculty Advisor)",
    submittedDate: "Oct 06, 2026",
    remarks: "Submitted after deadline without prior notification or valid travel proof.",
  }
];

const defaulterSubjects = [
  {
    id: "net",
    name: "Computer Networks & Security",
    code: "CS-304",
    faculty: "Dr. R. K. Sen",
    pct: 68,
    attended: 24,
    total: 35,
    neededTo75: 5,
    status: "Critical Defaulter",
    badgeVariant: "destructive",
    warningDate: "02 Aug 2026",
    advisorAction: "Counseling Mandatory"
  },
  {
    id: "se",
    name: "Software Engineering & Testing",
    code: "CS-305",
    faculty: "Prof. P. Varma",
    pct: 72,
    attended: 26,
    total: 36,
    neededTo75: 2,
    status: "Warning Zone",
    badgeVariant: "warning",
    warningDate: "05 Aug 2026",
    advisorAction: "Attendance Advisory Sent"
  }
];

export default function Attendance() {
  const [logFilter, setLogFilter] = useState("All");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | loading | active | error | success
  const [scanResult, setScanResult] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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

        // Use BarcodeDetector if available
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
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Unable to access camera: " + err.message);
      }
    }
  }, [stopCamera]);

  const closeModal = useCallback(() => {
    stopCamera();
    setCameraStatus("idle");
    setScanResult("");
    setCameraError("");
    setShowManual(false);
    setManualCode("");
    setQrModalOpen(false);
  }, [stopCamera]);

  useEffect(() => {
    if (qrModalOpen) {
      startCamera();
    }
    return () => { if (!qrModalOpen) stopCamera(); };
  }, [qrModalOpen, startCamera, stopCamera]);
  
  // Leave Form state
  const [leaveCategory, setLeaveCategory] = useState("Medical Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Verification filter state
  const [verifyFilter, setVerifyFilter] = useState("All");
  const [verifications, setVerifications] = useState(initialVerifications);
  const [logsList, setLogsList] = useState(recentLogs);

  useEffect(() => {
    apiFetch("/student/attendance")
      .then((res) => {
        if (res.data) {
          if (res.data.verifications && res.data.verifications.length > 0) {
            setVerifications(res.data.verifications);
          }
          if (res.data.recentLogs && res.data.recentLogs.length > 0) {
            setLogsList(res.data.recentLogs);
          }
        }
      })
      .catch((err) => console.error("ATTENDANCE FETCH ERROR:", err));
  }, []);

  const filteredLogs = logFilter === "All" 
    ? logsList 
    : logsList.filter(log => log.status === logFilter);

  const filteredVerifications = verifyFilter === "All"
    ? verifications
    : verifications.filter(v => v.status === verifyFilter);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!fromDate || !reason) {
      alert("Please specify the leave dates and reason.");
      return;
    }

    const calcDays = fromDate && toDate ? Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1) : 1;

    try {
      const res = await apiFetch("/student/attendance/leave", {
        method: "POST",
        body: JSON.stringify({
          category: leaveCategory,
          startDate: fromDate,
          endDate: toDate || fromDate,
          days: calcDays,
          reason,
          attachment: attachedFileName || null
        })
      });

      const newRequest = {
        id: res.data?.id || `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: `${leaveCategory} · ${reason.substring(0, 25)}${reason.length > 25 ? '...' : ''}`,
        category: leaveCategory,
        startDate: fromDate,
        endDate: toDate || fromDate,
        days: calcDays,
        status: "Pending",
        ok: false,
        mentor: "Prof. Reddy (Faculty Advisor)",
        submittedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        remarks: "Submitted and pending mentor review",
        attachment: attachedFileName || null,
        currentStep: 2
      };

      setVerifications([newRequest, ...verifications]);
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFromDate("");
        setToDate("");
        setReason("");
        setAttachedFileName("");
      }, 3500);
    } catch (err) {
      console.error("LEAVE SUBMIT ERROR:", err);
      alert("Failed to submit leave request: " + err.message);
    }
  };

  return (
    <div className="student-page-inner stack-6">
      {/* QR Scanner Modal */}
      {qrModalOpen && (
        <div className="qr-modal-backdrop" onClick={closeModal}>
          <div className="qr-modal-box" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="qr-modal-header">
              <div className="qr-modal-title-row">
                <div className="qr-modal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                    <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M14 21h4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="qr-modal-title">Scan Attendance QR</h3>
                  <p className="qr-modal-subtitle">Point your camera at the QR code displayed in class</p>
                </div>
              </div>
              <button className="qr-modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="qr-scanner-viewport">
              {/* Loading */}
              {cameraStatus === "loading" && (
                <div className="qr-camera-placeholder">
                  <div className="qr-spinner"/>
                  <p>Starting camera...</p>
                </div>
              )}

              {/* Error */}
              {cameraStatus === "error" && (
                <div className="qr-camera-placeholder qr-camera-error">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p>{cameraError}</p>
                  <button className="qr-retry-btn" onClick={startCamera}>Try Again</button>
                </div>
              )}

              {/* Success */}
              {cameraStatus === "success" && (
                <div className="qr-camera-placeholder qr-camera-success">
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <p style={{color:"#10b981",fontWeight:700}}>QR Code Scanned!</p>
                  {scanResult && <p style={{color:"#64748b",fontSize:"12px",wordBreak:"break-all",marginTop:4}}>Code: {scanResult}</p>}
                </div>
              )}

              {/* Live Camera Feed */}
              <div style={{ position: "relative", display: cameraStatus === "active" ? "block" : "none" }}>
                <video
                  ref={videoRef}
                  className="qr-video-feed"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Overlay corners */}
                <div className="qr-overlay">
                  <span className="qr-corner qr-corner--tl"/>
                  <span className="qr-corner qr-corner--tr"/>
                  <span className="qr-corner qr-corner--bl"/>
                  <span className="qr-corner qr-corner--br"/>
                  <div className="qr-scan-line"/>
                </div>
              </div>

              {cameraStatus === "active" && (
                <p className="qr-scanner-hint">Align the QR code within the corners</p>
              )}
            </div>

            {/* Manual Entry */}
            {showManual && (
              <div className="qr-manual-section">
                <p className="qr-manual-label">Enter attendance code manually</p>
                <div className="qr-manual-row">
                  <input
                    className="qr-manual-input"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="e.g. ATT-2026-0827"
                    autoFocus
                  />
                  <button
                    className="qr-manual-submit"
                    disabled={!manualCode.trim()}
                    onClick={() => { setScanResult(manualCode); setCameraStatus("success"); stopCamera(); setShowManual(false); }}
                  >
                    Mark Present
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="qr-modal-footer">
              {cameraStatus === "active" && (
                <div className="qr-status-pill">
                  <span className="qr-status-dot"/>
                  Scanning...
                </div>
              )}
              {cameraStatus === "success" && (
                <div className="qr-status-pill" style={{color:"#10b981",background:"rgba(16,185,129,0.1)"}}>
                  <span className="qr-status-dot" style={{background:"#10b981"}}/>
                  Attendance Marked!
                </div>
              )}
              {(cameraStatus === "idle" || cameraStatus === "error") && <div/>}
              {cameraStatus === "loading" && <div/>}

              {cameraStatus === "success" ? (
                <button className="qr-enter-code-btn" style={{background:"#4f46e5",color:"#fff",border:"none"}} onClick={closeModal}>Done</button>
              ) : (
                <button className="qr-enter-code-btn" onClick={() => { setShowManual(v => !v); }}>
                  {showManual ? "Hide Manual Entry" : "Enter Code Manually"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <SectionHeader
          eyebrow="Attendance Management"
          title="Attendance & Leave"
          description="Review attendance reports, track subject-wise percentage and submit absence reasons for mentor verification."
        />
        <button className="qr-scan-trigger-btn" onClick={() => setQrModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M14 21h4"/>
          </svg>
          Scan QR for Attendance
        </button>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="leave">Leave / Absence</TabsTrigger>
          <TabsTrigger value="verify">Verification</TabsTrigger>
        </TabsList>

        {/* Reports */}
        <TabsContent value="reports" className="attendance-reports-container stack-6">
          {/* KPI Summary Cards */}
          <div className="attendance-kpi-grid">
            {kpiData.map((kpi, idx) => {
              const IconComponent = kpi.icon;
              return (
                <Card key={idx} className="attendance-kpi-card">
                  <CardContent className="attendance-kpi-content">
                    <div className="attendance-kpi-header">
                      <span className="attendance-kpi-title">{kpi.title}</span>
                      <div className="attendance-kpi-icon-box" style={{ background: kpi.bgColor, color: kpi.color }}>
                        <IconComponent size={18} />
                      </div>
                    </div>
                    <div className="attendance-kpi-value-row">
                      <h3 className="attendance-kpi-value">{kpi.value}</h3>
                      <Badge className="attendance-kpi-badge" style={{ backgroundColor: kpi.bgColor, color: kpi.color, borderColor: kpi.color + '40' }}>
                        {kpi.status}
                      </Badge>
                    </div>
                    <p className="attendance-kpi-subtext">{kpi.subtext}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Section Heading for Subject Reports */}
          <div className="attendance-section-title-row">
            <div>
              <h3 className="attendance-section-heading">Subject Wise Attendance</h3>
              <p className="attendance-section-subheading">Detailed breakdown of attendance per course subject & margin status</p>
            </div>
          </div>

          {/* Enhanced Subject Cards Grid */}
          <div className="attendance-subject-grid">
            {subjects.map((s) => {
              const SubjectIcon = s.icon;
              return (
                <Card key={s.id} className="attendance-subject-card">
                  <CardContent className="attendance-subject-content">
                    <div className="attendance-subject-header">
                      <div className="attendance-subject-info">
                        <div className="attendance-subject-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                          <SubjectIcon size={20} />
                        </div>
                        <div>
                          <p className="attendance-subject-code">{s.code} · {s.faculty}</p>
                          <h4 className="attendance-subject-name">{s.name}</h4>
                        </div>
                      </div>
                      <Badge variant={s.pct >= 85 ? "secondary" : "destructive"} className="attendance-pct-badge">
                        {s.pct}%
                      </Badge>
                    </div>

                    {/* Progress bar with custom color styling */}
                    <div className="attendance-progress-wrapper">
                      <Progress value={s.pct} className="attendance-custom-progress" />
                    </div>

                    {/* Subject Class Stats */}
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
                        <span className="attendance-stat-val attendance-val-red">{s.absent}</span>
                      </div>
                      <div className="attendance-stat-box">
                        <span className="attendance-stat-label">Excused</span>
                        <span className="attendance-stat-val attendance-val-purple">{s.excused}</span>
                      </div>
                    </div>

                    {/* Safety Margin Indicator */}
                    <div className="attendance-margin-footer">
                      <Info size={13} className="attendance-info-icon" />
                      <span>{s.safeMargin}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Graphical Analytics Section */}
          <div className="attendance-analytics-grid">
            <Card className="attendance-analytics-card">
              <CardHeader className="attendance-analytics-header">
                <CardTitle className="attendance-chart-title">
                  <TrendingUp size={16} /> Monthly Attendance Trend
                </CardTitle>
                <CardDescription>Tracking overall attendance percentage over semester months</CardDescription>
              </CardHeader>
              <CardContent className="attendance-chart-content">
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <YAxis domain={[50, 100]} tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: 8,
                          fontSize: 12
                        }}
                        formatter={(val) => [`${val}%`, "Attendance"]}
                      />
                      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "75% Min Req", fill: "#ef4444", fontSize: 11, position: "insideTopRight" }} />
                      <Area type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="attendance-analytics-card">
              <CardHeader className="attendance-analytics-header">
                <CardTitle className="attendance-chart-title">
                  <BarChart3 size={16} /> Day-wise Presence Rate
                </CardTitle>
                <CardDescription>Average attendance percentage across weekdays</CardDescription>
              </CardHeader>
              <CardContent className="attendance-chart-content">
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daywiseAttendance} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                      <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} activeBar={false}>
                        <LabelList dataKey="rate" position="top" style={{ fontSize: 10, fontWeight: 700, fill: "#3b82f6" }} formatter={(v) => `${v}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance Log Table */}
          <Card className="attendance-log-card">
            <CardHeader className="attendance-log-header">
              <div className="attendance-row-between">
                <div>
                  <CardTitle className="attendance-chart-title">
                    <Calendar size={16} /> Recent Class Attendance Log
                  </CardTitle>
                  <CardDescription>Daily automated presence records & verify status</CardDescription>
                </div>
                <div className="attendance-filter-btns">
                  {["All", "Present", "Absent", "Excused"].map(filter => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={logFilter === filter ? "default" : "outline"}
                      className="attendance-filter-btn"
                      onClick={() => setLogFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="attendance-table-responsive">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Subject</th>
                      <th>Session Slot</th>
                      <th>Faculty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <div className="attendance-cell-datetime">
                            <span className="attendance-date">{log.date}</span>
                            <span className="attendance-time">{log.time}</span>
                          </div>
                        </td>
                        <td className="attendance-font-medium">{log.subject}</td>
                        <td><Badge variant="outline">{log.slot}</Badge></td>
                        <td className="attendance-text-muted">{log.faculty}</td>
                        <td>
                          <Badge
                            className={
                              log.status === "Present"
                                ? "attendance-status-badge-present"
                                : log.status === "Absent"
                                ? "attendance-status-badge-absent"
                                : "attendance-status-badge-excused"
                            }
                          >
                            {log.status === "Present" && <CheckCircle2 size={12} />}
                            {log.status === "Absent" && <XCircle size={12} />}
                            {log.status === "Excused" && <ShieldCheck size={12} />}
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave / Absence Tab */}
        <TabsContent value="leave" className="attendance-leave-container">
          {formSubmitted && (
            <div className="attendance-alert-success">
              <CheckCircle size={18} />
              <span>Leave Application submitted successfully! Your mentor has been notified. You can track progress under the Verification tab.</span>
            </div>
          )}

          <div className="attendance-leave-layout">
            {/* Left Column: Form */}
            <Card className="attendance-leave-form-card">
              <CardHeader>
                <CardTitle className="attendance-card-title flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" /> Apply for Leave / Absence
                </CardTitle>
                <CardDescription>
                  Submit official leave application for mentor verification and attendance regularization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaveSubmit} className="attendance-stack-4">
                  {/* Category Pills Selection */}
                  <div className="attendance-stack-2">
                    <Label className="attendance-label-bold">Select Leave Category</Label>
                    <div className="attendance-category-pills">
                      {[
                        { name: "Medical Leave", icon: ShieldCheck, desc: "Doctor note required" },
                        { name: "Academic Duty", icon: BookOpen, desc: "Events / Contests" },
                        { name: "Personal / Family", icon: Clock, desc: "Emergency / Events" },
                      ].map((cat) => {
                        const CatIcon = cat.icon;
                        const isSelected = leaveCategory === cat.name;
                        return (
                          <div
                            key={cat.name}
                            className={`attendance-category-pill ${isSelected ? 'pill-active' : ''}`}
                            onClick={() => setLeaveCategory(cat.name)}
                          >
                            <CatIcon size={16} />
                            <div>
                              <div className="pill-title">{cat.name}</div>
                              <div className="pill-desc">{cat.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dates Selection */}
                  <div className="attendance-grid-2 attendance-leave-dates">
                    <div className="attendance-stack-2">
                      <Label>From Date</Label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="attendance-stack-2">
                      <Label>To Date (Inclusive)</Label>
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Course / Subject Scope */}
                  <div className="attendance-stack-2">
                    <Label>Affected Course / Subject</Label>
                    <select
                      className="attendance-select-input"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="All Subjects">All Subjects (Full Day Leave)</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Detailed Reason */}
                  <div className="attendance-stack-2">
                    <Label>Reason & Description</Label>
                    <Textarea
                      rows={4}
                      placeholder="Describe your reason in detail for mentor review..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>

                  {/* File Upload Attachment Box */}
                  <div className="attendance-stack-2">
                    <Label>Supporting Document / Proof (Optional)</Label>
                    <div className="attendance-file-dropzone">
                      <input
                        type="file"
                        id="leave-file-input"
                        className="attendance-file-hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="leave-file-input" className="attendance-dropzone-label">
                        <Upload size={22} className="attendance-dropzone-icon" />
                        <div>
                          {attachedFileName ? (
                            <span className="attendance-file-attached">
                              <Paperclip size={14} /> {attachedFileName}
                            </span>
                          ) : (
                            <>
                              <span className="attendance-upload-text">Click to upload document or proof</span>
                              <span className="attendance-upload-hint">PDF, PNG, JPG up to 5MB (Medical Certificate, Event Invite, Ticket)</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Mentor Info Footer */}
                  <div className="attendance-mentor-info-box">
                    <UserCheck size={16} className="text-indigo-600" />
                    <span>Assigned Reviewer: <strong>Prof. Reddy (Faculty Advisor)</strong></span>
                  </div>

                  <Button type="submit" className="attendance-submit-btn">
                    <Send size={15} /> Submit Leave Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Column: Quota & Guidelines */}
            <div className="attendance-leave-sidebar stack-4">
              <Card className="attendance-quota-card">
                <CardHeader className="pb-2">
                  <CardTitle className="attendance-card-title flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" /> Semester Leave Quotas
                  </CardTitle>
                  <CardDescription>Allowance & utilization balance</CardDescription>
                </CardHeader>
                <CardContent className="attendance-stack-4">
                  {leaveQuotas.map((q, idx) => {
                    const QuotaIcon = q.icon;
                    const pct = Math.round((q.used / q.total) * 100);
                    return (
                      <div key={idx} className="attendance-quota-item">
                        <div className="attendance-quota-header">
                          <div className="attendance-row gap-2">
                            <QuotaIcon size={15} style={{ color: q.color }} />
                            <span className="attendance-quota-name">{q.type}</span>
                          </div>
                          <span className="attendance-quota-count">{q.used} / {q.total} Used</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Leave Policy Guidelines Card */}
              <Card className="attendance-policy-card">
                <CardHeader className="pb-2">
                  <CardTitle className="attendance-card-title flex items-center gap-2">
                    <Info size={16} className="text-blue-500" /> Leave Guidelines & Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="attendance-policy-list">
                    <li>Submit medical leave applications within <strong>3 working days</strong> of resuming classes.</li>
                    <li>Medical certificates must be signed by a registered medical practitioner.</li>
                    <li>Academic duty leave must be pre-approved by HOD or C2C training coordinator.</li>
                    <li>Maximum <strong>6 medical leaves</strong> can be regularized per semester.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verify" className="attendance-verify-container stack-6">
          {/* Verification Statistics Header */}
          <div className="attendance-kpi-grid">
            <Card className="attendance-kpi-card">
              <CardContent className="attendance-kpi-content">
                <div className="attendance-kpi-header">
                  <span className="attendance-kpi-title">Total Applications</span>
                  <FileText size={18} className="text-indigo-600" />
                </div>
                <h3 className="attendance-kpi-value">{verifications.length}</h3>
                <p className="attendance-kpi-subtext">Submitted this semester</p>
              </CardContent>
            </Card>

            <Card className="attendance-kpi-card">
              <CardContent className="attendance-kpi-content">
                <div className="attendance-kpi-header">
                  <span className="attendance-kpi-title">Approved</span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <h3 className="attendance-kpi-value text-emerald-600">
                  {verifications.filter(v => v.status === "Approved").length}
                </h3>
                <p className="attendance-kpi-subtext">Attendance regularized</p>
              </CardContent>
            </Card>

            <Card className="attendance-kpi-card">
              <CardContent className="attendance-kpi-content">
                <div className="attendance-kpi-header">
                  <span className="attendance-kpi-title">Pending Review</span>
                  <Clock3 size={18} className="text-amber-500" />
                </div>
                <h3 className="attendance-kpi-value text-amber-500">
                  {verifications.filter(v => v.status === "Pending").length}
                </h3>
                <p className="attendance-kpi-subtext">Under mentor review</p>
              </CardContent>
            </Card>

            <Card className="attendance-kpi-card">
              <CardContent className="attendance-kpi-content">
                <div className="attendance-kpi-header">
                  <span className="attendance-kpi-title">Rejected / Queries</span>
                  <XCircle size={18} className="text-rose-500" />
                </div>
                <h3 className="attendance-kpi-value text-rose-500">
                  {verifications.filter(v => v.status === "Rejected").length}
                </h3>
                <p className="attendance-kpi-subtext">Requires action</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar */}
          <div className="attendance-row-between attendance-verify-filter-row">
            <div>
              <h3 className="attendance-section-heading">Verification Tracker</h3>
              <p className="attendance-section-subheading">Track step-by-step approval progress & mentor notes</p>
            </div>
            <div className="attendance-filter-btns">
              {["All", "Approved", "Pending", "Rejected"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={verifyFilter === status ? "default" : "outline"}
                  className="attendance-filter-btn"
                  onClick={() => setVerifyFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Verification Cards */}
          <div className="attendance-stack-4">
            {filteredVerifications.map((v) => (
              <Card key={v.id} className="attendance-verify-card">
                <CardContent className="attendance-verify-card-content">
                  <div className="attendance-verify-card-header">
                    <div className="attendance-verify-title-block">
                      <div className="attendance-row gap-2">
                        <Badge variant="outline" className="attendance-id-badge">{v.id}</Badge>
                        <Badge variant="secondary" className="attendance-cat-badge">{v.category}</Badge>
                      </div>
                      <h4 className="attendance-verify-card-title">{v.title}</h4>
                      <p className="attendance-verify-dates-text">
                        <CalendarDays size={13} /> {v.startDate} {v.startDate !== v.endDate ? `to ${v.endDate}` : ''} ({v.days} Day{v.days > 1 ? 's' : ''})
                      </p>
                    </div>

                    <div className="attendance-verify-status-box">
                      <Badge
                        className={
                          v.status === "Approved"
                            ? "attendance-status-badge-present"
                            : v.status === "Pending"
                            ? "attendance-status-badge-excused"
                            : "attendance-status-badge-absent"
                        }
                      >
                        {v.status === "Approved" && <CheckCircle2 size={13} />}
                        {v.status === "Pending" && <Clock3 size={13} />}
                        {v.status === "Rejected" && <XCircle size={13} />}
                        {v.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Multi-step Timeline Progress Bar */}
                  <div className="attendance-verify-timeline">
                    <div className={`timeline-step ${v.currentStep >= 1 ? 'step-completed' : ''}`}>
                      <div className="step-circle">{v.currentStep >= 1 ? <Check size={12} /> : "1"}</div>
                      <span className="step-label">Submitted ({v.submittedDate})</span>
                    </div>
                    <div className="timeline-line"></div>
                    <div className={`timeline-step ${v.currentStep >= 2 ? (v.status === "Rejected" ? 'step-rejected' : 'step-completed') : ''}`}>
                      <div className="step-circle">{v.currentStep >= 2 ? <Check size={12} /> : "2"}</div>
                      <span className="step-label">Mentor Review</span>
                    </div>
                    <div className="timeline-line"></div>
                    <div className={`timeline-step ${v.currentStep >= 3 ? 'step-completed' : ''}`}>
                      <div className="step-circle">{v.currentStep >= 3 ? <Check size={12} /> : "3"}</div>
                      <span className="step-label">HOD Approval & Regularized</span>
                    </div>
                  </div>

                  {/* Mentor Remarks & Attachment Footer */}
                  <div className="attendance-verify-card-footer">
                    <div className="attendance-remarks-box">
                      <MessageSquare size={15} className="attendance-remarks-icon" />
                      <div>
                        <span className="remarks-reviewer">Reviewer Remarks ({v.mentor}):</span>
                        <p className="remarks-text">{v.remarks}</p>
                      </div>
                    </div>

                    {v.attachment && (
                      <div className="attendance-attachment-pill">
                        <Paperclip size={13} />
                        <span>{v.attachment}</span>
                        <Download size={12} className="ml-1 cursor-pointer hover:text-indigo-600" />
                      </div>
                    )}
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


