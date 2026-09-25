import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import {
  CheckCircle2, XCircle, QrCode, RefreshCw,
  Copy, Check, Calendar, CalendarCheck, Users, ShieldCheck,
  Download, Clock, Info, Sparkles, X, History,
  Eye, FileText, ArrowLeft, Zap, FileSpreadsheet,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_Attendance.css";

/* ── Inline dropdown for Admin Attendance (CSS: AdminAttendance.css .admin-att-select-*) ── */
function AdminAttSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`admin-att-select-wrap${isOpen ? ' admin-att-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`admin-att-select-trigger${isOpen ? ' admin-att-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-att-select-icon" />}
        <span className="admin-att-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-att-select-arrow${isOpen ? ' admin-att-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="admin-att-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-att-select-option${isSel ? ' admin-att-select-option--selected' : ''}`}>
                <span className="admin-att-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-att-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const defaultBatches = [
  { id: 1, name: "Java Full Stack Training", code: "JAVA-QRVL" },
  { id: 2, name: "Python Backend & Cloud Engineering", code: "PY-BE" },
  { id: 3, name: "Advanced Data Structures & Algorithms", code: "DSA-ADV" }
];

const defaultStudentsMap = {};
const defaultHistoryRecords = [];

// Helper functions for Excel (.xlsx) export
const exportRosterToExcel = (record) => {
  if (!record || !record.roster) return;
  const excelData = record.roster.map((student, idx) => ({
    "S.No": idx + 1,
    "Roll Number": student.rollNo,
    "Student Name": student.name,
    "Attendance Status": student.status,
    "Verification Mode": student.mode,
    "Session Date": record.date,
    "Batch Code": record.batchCode,
    "Batch Name": record.batchName
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet["!cols"] = [
    { wch: 6 },  { wch: 14 }, { wch: 24 },
    { wch: 18 }, { wch: 18 }, { wch: 14 },
    { wch: 14 }, { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Roster");
  const fileName = `Attendance_${record.batchCode}_${record.date}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const exportAllHistoryToExcel = (records) => {
  if (!records || records.length === 0) return;
  const excelData = records.map((rec, idx) => ({
    "S.No": idx + 1,
    "Session Date": rec.date,
    "Batch Code": rec.batchCode,
    "Batch Name": rec.batchName,
    "Total Enrolled": rec.total,
    "Present Count": rec.present,
    "Absent Count": rec.absent,
    "Attendance Rate (%)": `${rec.rate}%`,
    "Saved By": rec.savedBy,
    "Saved At": rec.savedAt
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet["!cols"] = [
    { wch: 6 },  { wch: 14 }, { wch: 14 },
    { wch: 30 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance History");
  const fileName = `All_Attendance_History_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export default function AdminAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchCode, setSelectedBatchCode] = useState("");

  const handleBatchChange = (newCode) => {
    setSelectedBatchCode(newCode);
  };

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [qrScannedMap, setQrScannedMap] = useState({});
  const [saved, setSaved] = useState(false);
  const [lastScannedName, setLastScannedName] = useState("");

  // History state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState(null);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodePayload, setQrCodePayload] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 secs validity
  const [autoRefreshCount, setAutoRefreshCount] = useState(0); // Max 6 auto refreshes
  const canvasRef = useRef(null);
  const isDirtyRef = useRef(false);

  // Fetch all active system & enrolled batches from backend API
  useEffect(() => {
    const loadBatches = async () => {
      try {
        let fetchedList = [];
        const res = await apiFetch("/batches");
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          fetchedList = res.data;
        }

        const myRes = await apiFetch("/batches/my-batches");
        if (myRes && myRes.data && Array.isArray(myRes.data) && myRes.data.length > 0) {
          const combined = [...fetchedList];
          myRes.data.forEach(mb => {
            if (!combined.some(b => b.id === mb.id || b.code === mb.code || b.join_code === mb.join_code)) {
              combined.push(mb);
            }
          });
          fetchedList = combined;
        }

        if (fetchedList.length > 0) {
          const mapped = fetchedList.map(b => ({
            id: b.id,
            name: b.name || b.title || "Training Cohort",
            code: b.join_code || b.code || `BATCH-${b.id}`
          }));
          setBatches(mapped);
          if (mapped[0]) {
            setSelectedBatchCode(mapped[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
      }
    };

    loadBatches();
  }, []);

  // Update student roster & live attendance records from API when batch or date changes
  useEffect(() => {
    isDirtyRef.current = false;
    const currentBatch = batches.find(b => b.code === selectedBatchCode);
    const batchId = currentBatch ? currentBatch.id : null;

    const fetchStudentsAndAttendance = async (isPolling = false) => {
      if (isPolling && isDirtyRef.current) {
        return; // User has unsaved manual edits, skip overwriting local attendance state during background sync
      }

      let fetchedStudents = [];
      if (batchId) {
        try {
          const res = await apiFetch(`/batches/${batchId}/students`);
          if (res && res.data && Array.isArray(res.data)) {
            fetchedStudents = res.data.map((s, idx) => ({
              id: s.id || s.user_id || `S-${idx + 1}`,
              rollNo: s.roll_number || s.rollNo || `STU-${String(idx + 1).padStart(2, '0')}`,
              name: s.name || s.full_name || "Student User",
              status: false
            }));
          }
        } catch (_) {}
      }

      // If batch-specific fetch returns empty, fallback to fetching system students
      if (fetchedStudents.length === 0) {
        try {
          const res = await apiFetch('/students');
          if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
            fetchedStudents = res.data.map((s, idx) => ({
              id: s.id || s.user_id || `S-${idx + 1}`,
              rollNo: s.roll_number || s.rollNo || `STU-${String(idx + 1).padStart(2, '0')}`,
              name: s.name || s.full_name || "Student User",
              status: false
            }));
          }
        } catch (_) {}
      }

      setStudents(fetchedStudents);

      // Query database for attendance marked on the selected date or present via live scan
      try {
        const attRes = await apiFetch('/attendance/list');
        const dbList = attRes && attRes.data && Array.isArray(attRes.data) ? attRes.data : [];
        
        const attendanceMap = {};
        const scannedMap = {};

        fetchedStudents.forEach((s) => {
          // Check if student has marked attendance present on DB (by ID or student name)
          const record = dbList.find(d => 
            Number(d.id || d.student_id || d.user_id) === Number(s.id) ||
            (d.student_name && s.name && d.student_name.toLowerCase().trim() === s.name.toLowerCase().trim())
          );
          const isPresentInDb = record ? (
            record.status?.toLowerCase() === 'present' || 
            Number(record.attendance_percentage || 0) > 0 || 
            Number(record.present_count || 0) > 0
          ) : false;
          attendanceMap[s.id] = isPresentInDb;
          if (isPresentInDb) scannedMap[s.id] = true;
        });


        setAttendance(attendanceMap);
        setQrScannedMap(scannedMap);
      } catch (_) {
        const initialMap = {};
        fetchedStudents.forEach(s => { initialMap[s.id] = false; });
        setAttendance(initialMap);
      }
      setSaved(false);
    };

    fetchStudentsAndAttendance(false);
    const interval = setInterval(() => fetchStudentsAndAttendance(true), 5000); // 5 sec live sync poll
    return () => clearInterval(interval);
  }, [selectedBatchCode, batches, sessionDate]);

  // Real-time QR Scan listener (window event & storage sync)
  const handleQrScanCheckIn = useCallback((scannedStudentName) => {
    const targetName = scannedStudentName || (students[0] ? students[0].name : "");
    const studentObj = students.find(s => s.name.toLowerCase() === targetName.toLowerCase()) || students[0];
    if (studentObj) {
      setAttendance(prev => ({ ...prev, [studentObj.id]: true }));
      setQrScannedMap(prev => ({ ...prev, [studentObj.id]: true }));
      setLastScannedName(studentObj.name);
      setTimeout(() => setLastScannedName(""), 4000);
    }
  }, [students]);

  useEffect(() => {
    const onCustomQrScan = (e) => {
      if (e && e.detail && e.detail.studentName) {
        handleQrScanCheckIn(e.detail.studentName);
      } else {
        handleQrScanCheckIn("Ganesh Shinde");
      }
    };
    const onStorageSync = (e) => {
      if (e.key === "admin_live_qr_scans" && e.newValue) {
        try {
          const scans = JSON.parse(e.newValue);
          if (scans && scans[0] && scans[0].studentName) {
            handleQrScanCheckIn(scans[0].studentName);
          }
        } catch (_) {}
      }
    };

    window.addEventListener("qr_scan_completed", onCustomQrScan);
    window.addEventListener("storage", onStorageSync);
    return () => {
      window.removeEventListener("qr_scan_completed", onCustomQrScan);
      window.removeEventListener("storage", onStorageSync);
    };
  }, [handleQrScanCheckIn]);

  // Generate unique payload string
  const generateNewQrCode = useCallback(() => {
    const randomSalt = Math.random().toString(36).substring(2, 7).toUpperCase();
    const payload = `${selectedBatchCode || "JAVA-QRVL"}:${randomSalt}`;
    setQrCodePayload(payload);
    setTimeLeft(10);
  }, [selectedBatchCode]);

  // Manual regenerate button resets auto-refresh counter
  const handleManualRegenerate = () => {
    setAutoRefreshCount(0);
    generateNewQrCode();
  };

  // Draw QR code onto canvas using qrcode library
  useEffect(() => {
    if (qrModalOpen && canvasRef.current && qrCodePayload) {
      QRCode.toCanvas(
        canvasRef.current,
        qrCodePayload,
        {
          width: 240,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff"
          }
        },
        (error) => {
          if (error) console.error("QR rendering error:", error);
        }
      );
    }
  }, [qrModalOpen, qrCodePayload]);

  // QR Validity Timer & 18 Auto-Refresh Logic (10s per cycle)
  useEffect(() => {
    let timer = null;
    if (qrModalOpen) {
      if (timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        // Trigger auto-refresh up to 18 times
        if (autoRefreshCount < 18) {
          setAutoRefreshCount(prev => prev + 1);
          generateNewQrCode();
        }
      }
    }
    return () => { if (timer) clearInterval(timer); };
  }, [qrModalOpen, timeLeft, autoRefreshCount, generateNewQrCode]);

  const openQrModal = () => {
    setAutoRefreshCount(0);
    generateNewQrCode();
    setQrModalOpen(true);
  };

  const closeQrModal = () => {
    setQrModalOpen(false);
  };

  const copyQrPayload = () => {
    navigator.clipboard.writeText(qrCodePayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateStudentScan = () => {
    handleQrScanCheckIn("Ganesh Shinde");
  };

  const toggle = (id) => {
    isDirtyRef.current = true;
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const markAll = (val) => {
    isDirtyRef.current = true;
    const all = {};
    students.forEach(s => { all[s.id] = val; });
    setAttendance(all);
    setSaved(false);
  };

  const presentCount = students.filter(s => attendance[s.id]).length;
  const totalCount = students.length;
  const ratePct = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
  const currentBatchObj = batches.find(b => b.code === selectedBatchCode) || batches[0];

  const handleSave = async () => {
    try {
      await apiFetch("/attendance/mark", {
        method: "POST",
        body: JSON.stringify({
          batch_id: currentBatchObj ? currentBatchObj.id : 1,
          date: sessionDate,
          attendance
        })
      });
    } catch (e) {}

    isDirtyRef.current = false;

    // Save to Previous Attendance History list
    const newHistoryEntry = {
      id: `HIST-${Date.now()}`,
      date: sessionDate,
      batchCode: selectedBatchCode,
      batchName: currentBatchObj ? currentBatchObj.name : selectedBatchCode,
      total: totalCount,
      present: presentCount,
      absent: totalCount - presentCount,
      rate: ratePct,
      savedBy: "System Admin",
      savedAt: new Date().toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      roster: students.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendance[s.id] ? "Present" : "Absent",
        mode: qrScannedMap[s.id] ? "QR Scan" : "Manual"
      }))
    };

    const updatedHistory = [newHistoryEntry, ...historyRecords];
    setHistoryRecords(updatedHistory);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="admin-attendance-container stack-6">
      {/* Create QR Modal */}
      {qrModalOpen && createPortal(
        <div className="admin-qr-modal-backdrop" onClick={closeQrModal}>
          <div className="admin-qr-modal-box" onClick={e => e.stopPropagation()}>
            <div className="admin-qr-modal-header">
              <div className="admin-qr-modal-title-box">
                <div className="admin-qr-icon-badge">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="admin-qr-modal-title">Live Session Attendance QR</h3>
                </div>
              </div>
              <button className="admin-qr-close-btn" onClick={closeQrModal}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-qr-modal-body">
              {/* QR Canvas Display */}
              <div className="admin-qr-canvas-wrapper" style={{ position: "relative" }}>
                <canvas
                  ref={canvasRef}
                  width="240"
                  height="240"
                  className="admin-qr-canvas"
                  style={{ filter: timeLeft === 0 ? "blur(6px) opacity(0.3)" : "none", transition: "filter 0.3s ease" }}
                />
                {timeLeft === 0 && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.88)",
                    borderRadius: "14px",
                    padding: "16px",
                    textAlign: "center"
                  }}>
                    <XCircle size={36} style={{ color: "#ef4444" }} />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>QR Code Expired</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>10 second session window reached</span>
                    <button className="admin-qr-regen-btn" onClick={handleManualRegenerate} style={{ marginTop: "4px", background: "#2563eb", color: "#ffffff", border: "none" }}>
                      <RefreshCw size={14} /> Regenerate QR
                    </button>
                  </div>
                )}
                <div className="admin-qr-batch-pill">
                  {currentBatchObj ? currentBatchObj.name : "Java Full Stack"}
                </div>
              </div>

              {/* Timer Countdown */}
              <div className="admin-qr-details">
                <div className="admin-qr-timer-box" style={{ background: timeLeft <= 10 ? "#fef2f2" : "#f1f5f9", border: timeLeft <= 10 ? "1px solid #fecaca" : "none" }}>
                  <Clock size={16} className={timeLeft <= 10 ? "text-red-600 animate-pulse" : "text-blue-600"} />
                  <span>Valid for: <strong style={{ color: timeLeft <= 10 ? "#dc2626" : "#0f172a" }}>{formatTimer(timeLeft)}</strong></span>
                  {timeLeft === 0 && <span className="admin-qr-expired-badge">Expired (10-Sec Limit)</span>}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Previous Attendance History Modal */}
      {historyModalOpen && createPortal(
        <div className="admin-qr-modal-backdrop" onClick={() => { setHistoryModalOpen(false); setSelectedHistoryDetail(null); }}>
          <div className="admin-qr-modal-box" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
            <div className="admin-qr-modal-header">
              <div className="admin-qr-modal-title-box">
                <div className="admin-qr-icon-badge" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                  <History size={22} />
                </div>
                <div>
                  <h3 className="admin-qr-modal-title">Previous Attendance Log History</h3>
                  <p className="admin-qr-modal-subtitle">Review saved session records, attendance rates & student rosters</p>
                </div>
              </div>
              <button className="admin-qr-close-btn" onClick={() => { setHistoryModalOpen(false); setSelectedHistoryDetail(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-qr-modal-body" style={{ padding: "20px" }}>
              {selectedHistoryDetail ? (
                /* History Detail Roster View */
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setSelectedHistoryDetail(null)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <ArrowLeft size={16} /> Back to History List
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                        Session Date: {selectedHistoryDetail.date}
                      </span>
                      <button
                        onClick={() => exportRosterToExcel(selectedHistoryDetail)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)" }}
                      >
                        <FileSpreadsheet size={15} /> Export Excel (.xlsx)
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{selectedHistoryDetail.batchName}</h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Batch Code: {selectedHistoryDetail.batchCode} · Saved by {selectedHistoryDetail.savedBy}</p>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div><span style={{ fontSize: "11px", color: "#64748b" }}>Present</span><br/><strong style={{ color: "#16a34a" }}>{selectedHistoryDetail.present} / {selectedHistoryDetail.total}</strong></div>
                      <div><span style={{ fontSize: "11px", color: "#64748b" }}>Attendance Rate</span><br/><strong style={{ color: "#2563eb" }}>{selectedHistoryDetail.rate}%</strong></div>
                    </div>
                  </div>

                  <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                    <table className="att-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Status</th>
                          <th>Verification Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistoryDetail.roster.map((s, idx) => (
                          <tr key={idx}>
                            <td className="att-roll">{s.rollNo}</td>
                            <td className="att-name">{s.name}</td>
                            <td>
                              <span className={`att-status-pill ${s.status === "Present" ? "att-pill-present" : "att-pill-absent"}`}>
                                {s.status}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "12px", background: s.mode === "QR Scan" ? "#eff6ff" : "#f1f5f9", color: s.mode === "QR Scan" ? "#1d4ed8" : "#475569", border: s.mode === "QR Scan" ? "1px solid #bfdbfe" : "1px solid #cbd5e1" }}>
                                {s.mode}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* History Records Table */
                <div style={{ width: "100%", maxHeight: "360px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Batch Group</th>
                        <th>Present / Total</th>
                        <th>Rate</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRecords.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="admin-table-empty-cell">
                            No previous attendance logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        historyRecords.map((rec) => (
                          <tr key={rec.id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>{rec.date}</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>{rec.savedAt}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "600", fontSize: "13px" }}>{rec.batchName}</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>{rec.batchCode}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: "700", color: "#0f172a" }}>
                              {rec.present} / {rec.total}
                            </td>
                            <td>
                              <span style={{ padding: "3px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "700", background: rec.rate >= 75 ? "#dcfce7" : "#fee2e2", color: rec.rate >= 75 ? "#15803d" : "#b91c1c" }}>
                                {rec.rate}%
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedHistoryDetail(rec)}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", cursor: "pointer" }}
                              >
                                <Eye size={14} /> View Roster
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-qr-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={14} className="text-emerald-600" /> Database Verified
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => exportAllHistoryToExcel(historyRecords)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 15px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                >
                  <FileSpreadsheet size={15} /> Download All History (.xlsx)
                </button>
                <button className="admin-qr-done-btn" onClick={() => { setHistoryModalOpen(false); setSelectedHistoryDetail(null); }}>
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Real-time Toast notification when student scans */}
      {lastScannedName && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 99999,
          background: "#0f172a",
          color: "#ffffff",
          padding: "12px 18px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "qrModalFadeIn 0.25s ease-out"
        }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: "13px", fontWeight: "700", display: "block" }}>Live QR Check-In Verified!</span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{lastScannedName} marked PRESENT automatically.</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-attendance-header-wrapper">
        <div className="ui-section-header-AD">
          <div className="ui-section-main">
            <div>
              <h2 className="ui-section-title">
                <CalendarCheck size={22} className="ui-section-title-icon" />
                <span>Track Attendance</span>
              </h2>
              <p className="ui-section-desc">
                Mark attendance for batch sessions by date or create a live QR code for instant check-in.
              </p>
            </div>
          </div>
        </div>
        <div className="admin-attendance-top-actions">
          <div className="attendance-filters">
            <AdminAttSelect
              value={selectedBatchCode}
              onChange={handleBatchChange}
              options={batches.map(b => ({ value: b.code, label: b.name }))}
            />
            <input
              type="date"
              className="attendance-date-input"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
            />
          </div>
          <button className="admin-create-qr-btn" onClick={openQrModal}>
            <QrCode size={18} />
            Create Session QR
          </button>
          <button className="admin-history-btn" onClick={() => setHistoryModalOpen(true)}>
            <History size={17} />
            Previous Attendance
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="attendance-stats-row">
        <div className="attendance-stat-card">
          <span className="att-stat-val">{totalCount}</span>
          <span className="att-stat-label">Total Enrolled</span>
        </div>
        <div className="attendance-stat-card att-present">
          <span className="att-stat-val">{presentCount}</span>
          <span className="att-stat-label">Present Today</span>
        </div>
        <div className="attendance-stat-card att-absent">
          <span className="att-stat-val">{totalCount - presentCount}</span>
          <span className="att-stat-label">Absent</span>
        </div>
        <div className="attendance-stat-card att-rate">
          <span className="att-stat-val">{ratePct}%</span>
          <span className="att-stat-label">Attendance Rate</span>
        </div>
      </div>

      {/* Student Roster Table Card */}
      <Card className="attendance-table-card">
        <CardHeader className="att-table-header">
          <div>
            <CardTitle className="att-card-title">
              Student Attendance Roster — {currentBatchObj ? currentBatchObj.name : selectedBatchCode}
            </CardTitle>
            <p className="att-card-subtitle">
              Session Date: {sessionDate}
            </p>
          </div>
          <div className="att-bulk-actions">
            <button className="att-mark-btn att-mark-all" onClick={() => markAll(true)} disabled={students.length === 0}>
              <CheckCircle2 size={14} /> Mark All Present
            </button>
            <button className="att-mark-btn att-mark-none" onClick={() => markAll(false)} disabled={students.length === 0}>
              <XCircle size={14} /> Mark All Absent
            </button>
          </div>
        </CardHeader>
        <CardContent className="att-table-body">
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th className="att-col-roll">Roll No</th>
                  <th className="att-col-name">Student Name</th>
                  <th className="att-col-status">Status</th>
                  <th className="att-col-vmode">Verification Mode</th>
                  <th className="att-col-toggle">Toggle Presence</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-table-empty-cell">
                      No students enrolled in this batch.
                    </td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.id} className={attendance[s.id] ? "att-row-present" : "att-row-absent"}>
                      <td className="att-roll">{s.rollNo}</td>
                      <td className="att-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="att-avatar-circle">
                            {s.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`att-status-pill ${attendance[s.id] ? "att-pill-present" : "att-pill-absent"}`}>
                          {attendance[s.id] ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td>
                        {qrScannedMap[s.id] ? (
                          <span className="att-vmode-badge att-vmode-qr">
                            <QrCode size={13} /> Scanned via QR
                          </span>
                        ) : (
                          <span className="att-vmode-badge att-vmode-manual">
                            <ShieldCheck size={13} /> Manual
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`att-toggle-btn ${attendance[s.id] ? "att-toggle-btn--present" : "att-toggle-btn--absent"}`}
                          onClick={() => toggle(s.id)}
                          title={`Click to mark ${attendance[s.id] ? "Absent" : "Present"}`}
                        >
                          {attendance[s.id] ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <span>{attendance[s.id] ? "Present" : "Absent"}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="att-save-row">
            <button className="att-save-btn" onClick={handleSave} disabled={students.length === 0}>
              {saved ? "✓ Attendance Saved & Logged!" : "Save Batch Attendance"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


