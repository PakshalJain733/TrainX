import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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

const defaultKpiData = [
  {
    title: "Overall Attendance",
    value: "89.2%",
    subtext: "Eligibility Threshold: 75%",
    status: "Safe Margin",
    variant: "secondary",
    icon: UserCheck,
    color: "#2563eb",
    bgColor: "rgba(37, 99, 235, 0.12)"
  },
  {
    title: "Total Conducted",
    value: "185 / 207",
    subtext: "22 total classes missed",
    status: "89.3% Attended",
    variant: "secondary",
    icon: BookOpen,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.12)"
  },
  {
    title: "Approved Leaves",
    value: "3 Days",
    subtext: "0 pending mentor verification",
    status: "Verified",
    variant: "secondary",
    icon: ShieldCheck,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.12)"
  }
];
const leaveQuotas = [];
const initialVerifications = [];
const defaulterSubjects = [];

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

  const handleScanSuccess = useCallback((codeVal) => {
    setScanResult(codeVal);
    setCameraStatus("success");
    stopCamera();

    // 1. Submit attendance mark request to Backend Database API!
    apiFetch("/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ code: codeVal })
    })
      .then((res) => {
        if (res && res.success) {
          // Refresh student attendance state live
          apiFetch("/attendance/history").then((attRes) => {
            if (attRes && attRes.data) {
              const { summary, history } = attRes.data;
              if (summary) setApiSummary(summary);
              if (history && Array.isArray(history)) {
                const mapped = history.map((l, idx) => ({
                  id: l.id || `log-${idx}`,
                  date: l.session_date ? new Date(l.session_date).toISOString().split('T')[0] : "Today",
                  time: "10:00 AM",
                  subject: l.batch_name || l.session_title || "Training Session",
                  slot: "Validated Session",
                  faculty: l.marked_by_name || "Lead Mentor",
                  status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1)) : "Present"
                }));
                setLogsList(mapped);
              }
            }
          });
        }
      })
      .catch((err) => console.error("MARK ATTENDANCE API ERROR:", err));

    // 2. Dispatch scan completed event for Admin dashboard live feed
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const scanEvt = {
        studentName: u.name || "Ganesh Shinde",
        rollNo: u.rollNo || "JV-01",
        time: new Date().toLocaleTimeString(),
        code: codeVal
      };
      const existingScans = JSON.parse(localStorage.getItem("admin_live_qr_scans") || "[]");
      localStorage.setItem("admin_live_qr_scans", JSON.stringify([scanEvt, ...existingScans]));
      window.dispatchEvent(new CustomEvent("qr_scan_completed", { detail: scanEvt }));
    } catch (_) {}
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraStatus("loading");
    setCameraError("");
    setScanResult("");

    // Check if navigator.mediaDevices is supported on this browser context (mobile browsers require HTTPS or localhost)
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("error");
      setCameraError("Camera access requires an HTTPS or localhost connection on mobile browsers. Please enter the attendance code manually below.");
      return;
    }

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
                handleScanSuccess(codes[0].rawValue);
              }
            } catch (_) {}
          }, 300);
        }
      }
    } catch (err) {
      setCameraStatus("error");
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. Please allow camera access in browser settings.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Unable to access camera: " + err.message);
      }
    }
  }, [stopCamera, handleScanSuccess]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

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

  // Joined batch & Attendance state
  const [userBatchName, setUserBatchName] = useState("");
  const [subjectsList, setSubjectsList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [verifyFilter, setVerifyFilter] = useState("All");
  const [verifications, setVerifications] = useState(initialVerifications);
  const [apiSummary, setApiSummary] = useState(null);

  useEffect(() => {
    // 1. Get student user profile info
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u && (u.batch || u.department || u.name)) {
        const bName = u.batch || u.department || "BTech CSE · Sem 6";
        setUserBatchName(bName);
      }
    } catch (e) {}

    // 2. Fetch enrolled batches to dynamically build subject list with actual joined batch
    apiFetch("/batches/my-batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const joinedBatches = res.data;
          const dynamicBatches = joinedBatches.map((b) => {
            const batchTitle = b.name || b.title || "Joined Training Cohort";
            const batchCode = b.join_code || b.code || `BATCH-${b.id}`;
            const total = Number(b.total_sessions || b.totalClasses || 0);
            const basePct = total > 0 ? (b.attendance_pct || b.attendancePct || 0) : 0;
            const attended = total > 0 ? Math.round(total * (basePct / 100)) : 0;
            const absent = total - attended;
            const excused = b.excused !== undefined ? b.excused : 0;
            const margin = total > 0 ? Math.round(attended - total * 0.75) : 0;

            return {
              id: `batch-${b.id}`,
              code: batchCode,
              name: batchTitle.toLowerCase().includes("training") ? batchTitle : `${batchTitle} Training`,
              faculty: b.mentor || b.trainer || b.trainer_name || "Faculty Lead",
              batch: "Joined Batch",
              pct: basePct,
              total,
              attended,
              absent,
              excused,
              safeMargin: total === 0 ? "No classes conducted yet" : (margin >= 0 ? `Safe (+${margin} training sessions above 75% margin)` : `Low Threshold (-${Math.abs(margin)} sessions below 75% margin)`),
              icon: Code2
            };
          });
          setSubjectsList(dynamicBatches);
        }
      })
      .catch((err) => console.error("MY BATCHES FETCH ERROR:", err));

    // 3. Fetch attendance logs and verifications
    apiFetch("/attendance/history")
      .then((res) => {
        if (res && res.data) {
          const { summary, history } = res.data;
          if (summary) setApiSummary(summary);
          if (history && Array.isArray(history)) {
            const mappedLogs = history.map((l, idx) => ({
              id: l.id || `log-api-${idx}`,
              date: l.session_date ? new Date(l.session_date).toISOString().split('T')[0] : "Today",
              time: "10:00 AM",
              subject: l.batch_name || l.session_title || "Training Session",
              slot: "Regular Session",
              faculty: l.marked_by_name || "Faculty Lead",
              status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1)) : "Present"
            }));
            setLogsList(mappedLogs);
          }
        }
      })
      .catch((err) => console.error("ATTENDANCE FETCH ERROR:", err));
  }, []);

  // Compute live overall KPI metrics
  const totalConductedFromLogs = logsList.length;
  const totalAttendedFromLogs = logsList.filter(l => l.status === "Present" || l.status === "Late").length;
  
  const totalConductedSum = (apiSummary && Number(apiSummary.total_classes || apiSummary.totalClasses || 0) > 0)
    ? Number(apiSummary.total_classes || apiSummary.totalClasses)
    : (totalConductedFromLogs > 0 ? totalConductedFromLogs : subjectsList.reduce((acc, s) => acc + (s.total || 0), 0));

  const totalAttendedSum = (apiSummary && Number(apiSummary.present_count || apiSummary.presentClasses || 0) > 0)
    ? Number(apiSummary.present_count || apiSummary.presentClasses)
    : (totalAttendedFromLogs > 0 ? totalAttendedFromLogs : subjectsList.reduce((acc, s) => acc + (s.attended || 0), 0));

  const totalAbsentSum = totalConductedSum - totalAttendedSum;
  const overallPercentage = totalConductedSum > 0 ? ((totalAttendedSum / totalConductedSum) * 100).toFixed(1) : "0.0";

  const approvedLeavesCount = verifications.filter(v => v.status === "Approved").length;
  const pendingLeavesCount = verifications.filter(v => v.status === "Pending").length;

  const dynamicKpis = [
    {
      title: "Overall Attendance",
      value: `${overallPercentage}%`,
      subtext: totalConductedSum === 0 ? "No classes conducted yet" : "Eligibility Threshold: 75%",
      status: totalConductedSum === 0 ? "No Records" : (Number(overallPercentage) >= 75 ? "Safe Margin" : "Low Margin Alert"),
      variant: totalConductedSum === 0 ? "secondary" : (Number(overallPercentage) >= 75 ? "secondary" : "destructive"),
      icon: UserCheck,
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.12)"
    },
    {
      title: "Total Classes Conducted",
      value: `${totalAttendedSum} / ${totalConductedSum}`,
      subtext: totalConductedSum === 0 ? "0 total classes missed" : `${totalAbsentSum} total classes missed`,
      status: totalConductedSum === 0 ? "No Records" : `${overallPercentage}% Attended`,
      variant: "secondary",
      icon: BookOpen,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.12)"
    },
    {
      title: "Approved Leaves",
      value: `${approvedLeavesCount} Days`,
      subtext: `${pendingLeavesCount} pending verification`,
      status: approvedLeavesCount > 0 ? "Verified" : "No Leaves",
      variant: "secondary",
      icon: ShieldCheck,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.12)"
    }
  ];

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
      {qrModalOpen && createPortal(
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

              {/* Error State with Manual Entry Fallback */}
              {cameraStatus === "error" && (
                <div className="qr-camera-placeholder qr-camera-error">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: "12.5px", padding: "0 16px", color: "#f87171", margin: "4px 0 10px" }}>{cameraError}</p>

                  <div style={{ width: "100%", padding: "12px 16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={{ fontSize: "11.5px", color: "#cbd5e1", margin: 0, textAlign: "left", fontWeight: "600" }}>Or enter session code manually:</p>
                    <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        placeholder="Enter Session Code"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#ffffff", fontSize: "12.5px" }}
                      />
                      <button type="submit" style={{ padding: "8px 14px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                        Verify
                      </button>
                    </form>
                  </div>

                  <button className="qr-retry-btn" onClick={startCamera} style={{ marginTop: "10px" }}>Try Camera Again</button>
                </div>
              )}

              {/* Success */}
              {cameraStatus === "success" && (
                <div className="qr-camera-placeholder qr-camera-success">
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <p className="qr-scanned-title">QR Code Scanned!</p>
                </div>
              )}

              {/* Live Camera Feed */}
              <div className={cameraStatus === "active" ? "qr-video-container" : "qr-video-container--hidden"}>
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

            {/* Footer */}
            <div className="qr-modal-footer">
              {cameraStatus === "active" && (
                <div className="qr-status-pill">
                  <span className="qr-status-dot"/>
                  Scanning...
                </div>
              )}
              {cameraStatus === "success" && (
                <div className="qr-status-pill qr-status-pill--success">
                  <span className="qr-status-dot qr-status-dot--success"/>
                  Attendance Marked!
                </div>
              )}
              {cameraStatus !== "active" && cameraStatus !== "success" && <div />}

              {cameraStatus === "success" && (
                <button className="qr-enter-code-btn qr-done-btn" onClick={closeModal} style={{ padding: "8px 24px", minWidth: "100px" }}>Done</button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      <div className="attendance-header-row">
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
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="verify">Verification</TabsTrigger>
        </TabsList>

        {/* Reports */}
        <TabsContent value="reports" className="attendance-reports-container stack-6">
          {/* KPI Summary Cards */}
          <div className="attendance-kpi-grid">
            {dynamicKpis.map((kpi, idx) => {
              const IconComponent = kpi.icon;
              return (
                <Card key={idx} className="attendance-kpi-card">
                  <CardContent className="attendance-kpi-content">
                    <div className="attendance-kpi-header">
                      <span className="attendance-kpi-title">{kpi.title}</span>
                      <div className="attendance-kpi-icon-box">
                        <IconComponent size={18} />
                      </div>
                    </div>
                    <div className="attendance-kpi-value-row">
                      <h3 className="attendance-kpi-value">{kpi.value}</h3>
                      <Badge className="attendance-kpi-badge" variant={kpi.variant}>
                        {kpi.status}
                      </Badge>
                    </div>
                    <p className="attendance-kpi-subtext">{kpi.subtext}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Section Heading for Joined Training Batch Attendance */}
          <div className="attendance-section-title-row">
            <div>
              <h3 className="attendance-section-heading">Joined Training Batch Attendance Breakdown</h3>
              <p className="attendance-section-subheading">Detailed breakdown of attendance per enrolled training batch & safety threshold status</p>
            </div>
          </div>

          {/* Enhanced Training Batch Cards Grid */}
          <div className="attendance-subject-grid">
            {subjectsList.length === 0 ? (
              <div className="attendance-empty-grid-cell">
                <BookOpen size={32} className="attendance-empty-icon" />
                <p className="attendance-empty-title">No joined training batch attendance records found.</p>
              </div>
            ) : (
              subjectsList.map((s) => {
                const SubjectIcon = s.icon || BookOpen;

                // Dynamically compute card metrics from session logs if batch total is 0
                const batchLogs = logsList; // session logs for this student
                const conductedFromLogs = batchLogs.length;
                const attendedFromLogs = batchLogs.filter(l => l.status === "Present" || l.status === "Late").length;
                const absentFromLogs = conductedFromLogs - attendedFromLogs;

                const displayTotal = s.total > 0 ? s.total : conductedFromLogs;
                const displayAttended = s.total > 0 ? s.attended : attendedFromLogs;
                const displayAbsent = s.total > 0 ? s.absent : absentFromLogs;
                const displayPct = displayTotal > 0 ? Math.round((displayAttended / displayTotal) * 100) : 0;
                const margin = displayTotal > 0 ? Math.round(displayAttended - displayTotal * 0.75) : 0;
                const displayMargin = displayTotal === 0 ? "No classes conducted yet" : (margin >= 0 ? `Safe (+${margin} training sessions above 75% margin)` : `Low Threshold (-${Math.abs(margin)} sessions below 75% margin)`);

                return (
                  <Card key={s.id} className="attendance-subject-card">
                    <CardContent className="attendance-subject-content">
                      <div className="attendance-subject-header">
                        <div className="attendance-subject-info">
                          <div className="attendance-subject-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <SubjectIcon size={20} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="attendance-subject-code">{s.code}</span>
                              {s.batch && <Badge variant="outline" style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>{s.batch}</Badge>}
                            </div>
                            <h4 className="attendance-subject-name">{s.name}</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>{s.faculty}</p>
                          </div>
                        </div>
                        <Badge variant={displayPct >= 75 ? "secondary" : "destructive"} className="attendance-pct-badge">
                          {displayPct}%
                        </Badge>
                      </div>

                      {/* Progress bar with custom color styling */}
                      <div className="attendance-progress-wrapper">
                        <Progress value={displayPct} className="attendance-custom-progress" />
                      </div>

                      {/* Subject Class Stats */}
                      <div className="attendance-subject-stats-row">
                        <div className="attendance-stat-box">
                          <span className="attendance-stat-label">Conducted</span>
                          <span className="attendance-stat-val">{displayTotal}</span>
                        </div>
                        <div className="attendance-stat-box">
                          <span className="attendance-stat-label">Attended</span>
                          <span className="attendance-stat-val attendance-val-green">{displayAttended}</span>
                        </div>
                        <div className="attendance-stat-box">
                          <span className="attendance-stat-label">Absent</span>
                          <span className="attendance-stat-val attendance-val-red">{displayAbsent}</span>
                        </div>
                        <div className="attendance-stat-box">
                          <span className="attendance-stat-label">Excused</span>
                          <span className="attendance-stat-val attendance-val-purple">{s.excused}</span>
                        </div>
                      </div>

                      {/* Safety Margin Indicator */}
                      <div className="attendance-margin-footer">
                        <Info size={13} className="attendance-info-icon" />
                        <span>{displayMargin}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Recent Attendance Log Table */}
          <Card className="attendance-log-card">
            <CardHeader className="attendance-log-header">
              <div className="attendance-row-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <CardTitle className="attendance-chart-title">
                    <Calendar size={16} /> Recent Class Attendance Log
                  </CardTitle>
                  <CardDescription>Daily automated presence records & faculty verification status</CardDescription>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {["All", "Present", "Absent", "Excused"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        border: logFilter === f ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: logFilter === f ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#f1f5f9',
                        color: logFilter === f ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {f}
                    </button>
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
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="attendance-empty-table-cell">
                          No recent attendance logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
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
                      ))
                    )}
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
                  <FileText size={18} className="text-indigo-600" /> Apply for Leave
                </CardTitle>
                <CardDescription>
                  Submit official leave application for Coordinator/Mentor verification and attendance regularization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaveSubmit} className="attendance-stack-4">


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
                      {subjectsList.map((s) => (
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
          <div className="attendance-row-between attendance-verify-filter-row">
            <div>
              <h3 className="attendance-section-heading">Verification Tracker</h3>
              <p className="attendance-section-subheading">Track step-by-step approval progress & mentor notes</p>
            </div>
          </div>

          {/* Detailed Verification Cards */}
          <div className="attendance-stack-4">
            {filteredVerifications.length === 0 ? (
              <div className="attendance-empty-verify-box">
                <Clock3 size={32} className="attendance-empty-icon" />
                <p className="attendance-empty-title">No verification requests found.</p>
              </div>
            ) : (
              filteredVerifications.map((v) => (
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
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


