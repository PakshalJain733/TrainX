import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import { apiFetch } from "../../../utils/api";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  CalendarCheck, 
  GraduationCap, 
  Sparkles, 
  Send, 
  Info, 
  ChevronDown, 
  Check, 
  FileText,
  Camera,
  ShieldAlert,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Input, Label, Textarea } from "../../../components/ui/Form";
import "../Styles/ST_Attendance.css";

/* Dropdown component */
function StudentAttSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));
  
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={`student-att-select-wrap${isOpen ? ' student-att-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`student-att-select-trigger${isOpen ? ' student-att-select-trigger--open' : ''}`}>
        {Icon && <Icon className="student-att-select-icon" />}
        <span className="student-att-select-text">{selected ? selected.label : <span className="student-att-select-placeholder">{placeholder}</span>}</span>
        <ChevronDown className={`student-att-select-arrow${isOpen ? ' student-att-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="student-att-select-dropdown">
          {safeOptions.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`student-att-select-option${isSel ? ' student-att-select-option--selected' : ''}`}>
                <span className="student-att-select-option-label">{opt.label}</span>
                {isSel && <Check className="student-att-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const defaultAttendanceData = {
  overallPercentage: 0,
  attendedClasses: 0,
  missedClasses: 0,
  totalClasses: 0,
  requiredThreshold: 75,
  status: "Good",
  isLowAttendance: false,
  warningMessage: "⚠ Attendance is below the required 75% threshold.",
  attendanceHistory: []
};

export default function StudentAttendance() {
  const [data, setData] = useState(defaultAttendanceData);

  // Filters
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // QR Modal & Camera State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | loading | active | success | error
  const [scanResultMsg, setScanResultMsg] = useState("");
  const [scanErrorMsg, setScanErrorMsg] = useState("");
  const [manualToken, setManualToken] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Leave Form state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  // Fetch Attendance Data from Backend
  const loadStudentAttendance = useCallback(async () => {
    try {
      const res = await apiFetch("/attendance/history");
      const logs = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      
      const total = logs.length;
      const presentCount = logs.filter(l => l.status === "PRESENT" || l.status === "Present").length;
      const pct = total > 0 ? Math.round((presentCount / total) * 100) : 100;

      setData({
        overallPercentage: pct,
        attendedClasses: presentCount,
        missedClasses: total - presentCount,
        totalClasses: total,
        requiredThreshold: 75,
        status: pct >= 75 ? "Good" : "Low",
        isLowAttendance: pct < 75,
        warningMessage: "⚠ Attendance is below the required 75% threshold.",
        attendanceHistory: logs
      });
    } catch (err) {
      console.error("Failed to load student attendance history:", err);
    }
  }, []);

  useEffect(() => {
    loadStudentAttendance();
  }, [loadStudentAttendance]);

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

  // Handle Scan Submission to Backend
  const submitQrTokenToBackend = useCallback(async (tokenStr) => {
    if (!tokenStr) return;
    setCameraStatus("loading");
    setScanErrorMsg("");
    setScanResultMsg("");
    stopCamera();

    try {
      // Send ONLY token in request body
      const res = await apiFetch("/attendance/mark", {
        method: "POST",
        body: JSON.stringify({ token: tokenStr.trim() })
      });

      setCameraStatus("success");
      setScanResultMsg(res?.message || "Attendance marked PRESENT successfully!");
      loadStudentAttendance();
    } catch (err) {
      setCameraStatus("error");
      const errText = err.message || "";
      if (errText.includes("already marked") || err.status === 409) {
        setScanErrorMsg("Attendance Already Marked\nYou are already marked PRESENT for this attendance session.");
      } else if (errText.includes("not a member") || errText.includes("batch") || err.status === 403) {
        setScanErrorMsg("You are not a member of this batch.\nAttendance cannot be marked.");
      } else {
        setScanErrorMsg(errText || "Invalid or expired QR code. Please scan the current live QR.");
      }
    }
  }, [stopCamera, loadStudentAttendance]);

  const startCamera = useCallback(async () => {
    setCameraStatus("loading");
    setScanErrorMsg("");
    setScanResultMsg("");

    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("error");
      setScanErrorMsg("Camera access not available. Please enter the QR token manually.");
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

        // Universal frame scanner loop using jsQR
        scanIntervalRef.current = setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const video = videoRef.current;
          try {
            const canvas = canvasRef.current || document.createElement("canvas");
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert"
                });
                if (qrCode && qrCode.data && qrCode.data.trim().length > 0) {
                  submitQrTokenToBackend(qrCode.data.trim());
                  return;
                }
              }
            }
          } catch (_) {}
        }, 300);
      }
    } catch (err) {
      setCameraStatus("error");
      setScanErrorMsg("Camera access denied or unavailable. Enter token manually below.");
    }
  }, [submitQrTokenToBackend]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken && manualToken.trim()) {
      submitQrTokenToBackend(manualToken.trim());
    }
  };

  const closeModal = useCallback(() => {
    stopCamera();
    setCameraStatus("idle");
    setScanResultMsg("");
    setScanErrorMsg("");
    setManualToken("");
    setQrModalOpen(false);
  }, [stopCamera]);

  useEffect(() => {
    if (qrModalOpen) startCamera();
    return () => {
      if (!qrModalOpen) stopCamera();
    };
  }, [qrModalOpen, startCamera, stopCamera]);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!fromDate || !reason) {
      alert("Please select dates and enter reason.");
      return;
    }
    alert("Leave request submitted successfully.");
    setFromDate("");
    setToDate("");
    setReason("");
  };

  // Filter Attendance History
  const filteredHistory = (data.attendanceHistory || []).filter((item) => {
    const itemDateStr = item.date || item.created_at || "";
    const matchesMonth = monthFilter === "All" || itemDateStr.toLowerCase().includes(monthFilter.toLowerCase());
    const matchesStatus = statusFilter === "All" || (item.status && item.status.toLowerCase() === statusFilter.toLowerCase());
    return matchesMonth && matchesStatus;
  });

  return (
    <div className="student-page-inner stack-6" style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px" }}>
      
      {/* QR Scanner Modal Portal */}
      {qrModalOpen && createPortal(
        <div className="qr-modal-backdrop" onClick={closeModal}>
          <div className="qr-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="qr-modal-header">
              <div className="qr-modal-title-row">
                <div className="qr-modal-icon">
                  <Camera size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 className="qr-modal-title">MARK ATTENDANCE</h3>
                  <p className="qr-modal-subtitle">Scan the live QR code displayed by Admin</p>
                </div>
              </div>
              <button className="qr-modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="qr-scanner-viewport" style={{ padding: "20px" }}>
              {cameraStatus === "loading" && (
                <div className="qr-camera-placeholder" style={{ padding: "30px", textAlign: "center" }}>
                  <div className="qr-spinner" />
                  <p style={{ marginTop: "12px", color: "#94a3b8" }}>Accessing camera...</p>
                </div>
              )}

              {cameraStatus === "error" && (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <ShieldAlert size={44} color="#ef4444" style={{ margin: "0 auto 12px auto" }} />
                  <div style={{ whiteSpace: "pre-line", fontSize: "14px", fontWeight: "700", color: "#f87171", marginBottom: "16px" }}>
                    {scanErrorMsg}
                  </div>

                  <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <input
                      type="text"
                      placeholder="Enter Temporary QR Token"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #475569", background: "#0f172a", color: "#ffffff", fontSize: "13.5px" }}
                    />
                    <button type="submit" style={{ padding: "10px 18px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                      Mark
                    </button>
                  </form>
                  
                  <button className="qr-retry-btn" onClick={startCamera} style={{ marginTop: "16px", background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontWeight: "600" }}>
                    Try Camera Again
                  </button>
                </div>
              )}

              {cameraStatus === "success" && (
                <div style={{ textAlign: "center", padding: "30px 16px" }}>
                  <CheckCircle2 size={54} color="#22c55e" style={{ margin: "0 auto 12px auto" }} />
                  <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#22c55e", margin: 0 }}>
                    ATTENDANCE MARKED
                  </h4>
                  <p style={{ fontSize: "14px", color: "#cbd5e1", marginTop: "6px" }}>
                    {scanResultMsg}
                  </p>
                  <button onClick={closeModal} style={{ marginTop: "20px", padding: "10px 24px", background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}>
                    Done
                  </button>
                </div>
              )}

              <div className={cameraStatus === "active" ? "qr-video-container" : "qr-video-container--hidden"}>
                <video ref={videoRef} className="qr-video-feed" autoPlay playsInline muted />
                <div className="qr-overlay">
                  <span className="qr-corner qr-corner--tl" />
                  <span className="qr-corner qr-corner--tr" />
                  <span className="qr-corner qr-corner--bl" />
                  <span className="qr-corner qr-corner--br" />
                  <div className="qr-scan-line" />
                </div>
              </div>

              {cameraStatus === "active" && (
                <p className="qr-scanner-hint" style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "10px" }}>
                  Point your camera at the QR code displayed on Admin screen
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header Row */}
      <div className="flex-between flex-wrap gap-4" style={{ marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarCheck size={28} style={{ color: "#2563eb" }} />
            Student Attendance
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            Scan the live batch QR code to mark your attendance.
          </p>
        </div>

        <button
          onClick={() => setQrModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)"
          }}
        >
          <Camera size={20} /> Scan QR Code
        </button>
      </div>

      {/* Attendance Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Overall Percentage</span>
          <h3 style={{ fontSize: "28px", fontWeight: "900", color: data.overallPercentage >= 75 ? "#16a34a" : "#dc2626", margin: "4px 0 0" }}>
            {data.overallPercentage}%
          </h3>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Attended Sessions</span>
          <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#16a34a", margin: "4px 0 0" }}>
            {data.attendedClasses}
          </h3>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Missed Sessions</span>
          <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#dc2626", margin: "4px 0 0" }}>
            {data.missedClasses}
          </h3>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Total Sessions</span>
          <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: "4px 0 0" }}>
            {data.totalClasses}
          </h3>
        </div>
      </div>

      {/* Student Attendance History Table */}
      <Card style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "20px" }}>
        <CardHeader style={{ padding: "0 0 16px 0", borderBottom: "1px solid #f1f5f9" }}>
          <CardTitle style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={20} style={{ color: "#2563eb" }} /> My Attendance History
          </CardTitle>
          <CardDescription>Your personal attendance record for college batch sessions</CardDescription>
        </CardHeader>

        <CardContent style={{ padding: "16px 0 0 0" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Batch / Session</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Marked Time</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                      No attendance history recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>
                        {item.date ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "600", color: "#334155" }}>
                        {item.batch_name || item.batch_code || `Batch ${item.batch_id || ''}`}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>
                        {item.marked_at ? new Date(item.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {item.status === "PRESENT" || item.status === "Present" ? (
                          <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={13} /> PRESENT
                          </span>
                        ) : (
                          <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#fee2e2", color: "#b91c1c", fontWeight: "800", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <XCircle size={13} /> ABSENT
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
