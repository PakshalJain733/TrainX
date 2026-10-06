import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { 
  QrCode, 
  RefreshCw, 
  Calendar, 
  CalendarCheck, 
  Users, 
  ShieldCheck, 
  Clock, 
  Info, 
  X, 
  History, 
  Eye, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Play,
  Square
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_Attendance.css";

export default function AdminAttendance() {
  const [activeTab, setActiveTab] = useState("create"); // "create" | "history"

  // Form State
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [formError, setFormError] = useState("");
  const [existingSessionNotice, setExistingSessionNotice] = useState(null);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [qrCountdown, setQrCountdown] = useState(5);
  const [sessionStats, setSessionStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0, roster: [] });
  const canvasRef = useRef(null);

  // History State
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState(null);

  // Timers
  const qrRefreshTimerRef = useRef(null);
  const statusPollTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 1. Fetch Batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await apiFetch("/batches");
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        if (list.length > 0) {
          const formatted = list.map(b => ({
            id: b.id,
            name: b.name || b.title || `Batch ${b.id}`,
            code: b.code || b.join_code || `BATCH-${b.id}`
          }));
          setBatches(formatted);
          setSelectedBatchId(formatted[0].id);
        } else {
          setBatches([]);
        }
      } catch (err) {
        console.error("Error fetching batches:", err);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
    checkActiveSessionsOnLoad();
  }, []);

  // Check if any active session exists to resume automatically
  const checkActiveSessionsOnLoad = async () => {
    try {
      const res = await apiFetch("/attendance/sessions/active");
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      if (list.length > 0) {
        const active = list[0];
        setActiveSession(active);
        setQrToken(active.current_qr_token || "");
        fetchSessionStatus(active.id);
      }
    } catch (_) {}
  };

  // 2. Fetch Session Status & Roster
  const fetchSessionStatus = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await apiFetch(`/attendance/sessions/${sessionId}/status`);
      if (res && res.data) {
        setSessionStats({
          total: res.data.total || 0,
          present: res.data.present || 0,
          absent: res.data.absent || 0,
          percentage: res.data.percentage || 0,
          roster: Array.isArray(res.data.roster) ? res.data.roster : []
        });
      }
    } catch (err) {
      console.error("Failed to fetch session status:", err);
    }
  }, []);

  // 3. Refresh QR Token from Backend
  const refreshQrToken = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await apiFetch(`/attendance/sessions/${sessionId}/refresh-qr`, { method: "POST" });
      if (res && res.data && res.data.token) {
        setQrToken(res.data.token);
        setQrCountdown(5);
      }
    } catch (err) {
      console.error("Failed to refresh QR token:", err);
    }
  }, []);

  // Draw QR code onto canvas when qrToken changes
  useEffect(() => {
    if (activeSession && qrToken && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrToken,
        {
          width: 240,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" }
        },
        (err) => {
          if (err) console.error("QR draw error:", err);
        }
      );
    }
  }, [activeSession, qrToken]);

  // Handle active session timers (5s QR refresh, 1s countdown ticker, 3s roster poll)
  useEffect(() => {
    if (!activeSession) {
      if (qrRefreshTimerRef.current) clearInterval(qrRefreshTimerRef.current);
      if (statusPollTimerRef.current) clearInterval(statusPollTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    const sessionId = activeSession.id;

    // Initial fetch & token setup
    fetchSessionStatus(sessionId);

    // 1-second ticker for countdown
    setQrCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setQrCountdown((prev) => (prev > 1 ? prev - 1 : 5));
    }, 1000);

    // 5-second QR auto refresh loop
    qrRefreshTimerRef.current = setInterval(() => {
      refreshQrToken(sessionId);
    }, 5000);

    // 3-second live status polling loop
    statusPollTimerRef.current = setInterval(() => {
      fetchSessionStatus(sessionId);
    }, 3000);

    return () => {
      if (qrRefreshTimerRef.current) clearInterval(qrRefreshTimerRef.current);
      if (statusPollTimerRef.current) clearInterval(statusPollTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [activeSession, fetchSessionStatus, refreshQrToken]);

  // 4. Handle Admin "Start Attendance" Button
  const handleStartAttendance = async (e) => {
    e.preventDefault();
    setFormError("");
    setExistingSessionNotice(null);

    if (!selectedBatchId) {
      setFormError("Please select a batch.");
      return;
    }
    if (!sessionDate) {
      setFormError("Please select a date.");
      return;
    }

    try {
      const res = await apiFetch("/attendance/sessions", {
        method: "POST",
        body: JSON.stringify({
          batch_id: Number(selectedBatchId),
          date: sessionDate
        })
      });

      if (res && res.data) {
        const session = res.data;
        setActiveSession(session);
        setQrToken(session.current_qr_token || "");
        setQrCountdown(5);
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes("already exists") || err.data?.existingSession) {
        const existing = err.data?.existingSession || { batch_id: selectedBatchId, date: sessionDate };
        setExistingSessionNotice(existing);
      } else {
        setFormError(err.message || "Failed to start attendance session.");
      }
    }
  };

  // 5. Open Existing Session
  const handleOpenExistingSession = async () => {
    setExistingSessionNotice(null);
    try {
      const res = await apiFetch("/attendance/sessions/active");
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      const match = list.find(s => String(s.batch_id) === String(selectedBatchId) && String(s.date).startsWith(sessionDate));
      if (match) {
        setActiveSession(match);
        setQrToken(match.current_qr_token || "");
        fetchSessionStatus(match.id);
      } else if (list.length > 0) {
        setActiveSession(list[0]);
        setQrToken(list[0].current_qr_token || "");
        fetchSessionStatus(list[0].id);
      } else {
        setFormError("Could not locate existing active session.");
      }
    } catch (err) {
      setFormError("Failed to open existing session.");
    }
  };

  // 6. Handle "Close Attendance" Button
  const handleCloseAttendance = async () => {
    if (!activeSession) return;
    try {
      await apiFetch(`/attendance/sessions/${activeSession.id}/close`, { method: "POST" });
    } catch (err) {
      console.error("Error closing session:", err);
    } finally {
      setActiveSession(null);
      setQrToken("");
      setSessionStats({ total: 0, present: 0, absent: 0, percentage: 0, roster: [] });
    }
  };

  // 7. Load History Sessions
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch("/attendance/sessions/history");
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      setHistorySessions(list);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  const selectedBatchObj = batches.find(b => String(b.id) === String(selectedBatchId)) || batches[0];

  return (
    <div className="admin-attendance-container stack-6" style={{ maxWidth: "1000px", margin: "0 auto", padding: "16px" }}>
      {/* Top Header & Tab Switcher */}
      <div className="flex-between flex-wrap gap-4" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <CalendarCheck size={28} style={{ color: "#2563eb" }} />
            General Attendance System
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            Create dynamic QR attendance sessions for college student batches.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setActiveTab("create"); setSelectedHistoryDetail(null); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              border: activeTab === "create" ? "none" : "1.5px solid #cbd5e1",
              background: activeTab === "create" ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" : "#ffffff",
              color: activeTab === "create" ? "#ffffff" : "#475569",
              boxShadow: activeTab === "create" ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none"
            }}
          >
            <QrCode size={18} /> Create Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              border: activeTab === "history" ? "none" : "1.5px solid #cbd5e1",
              background: activeTab === "history" ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" : "#ffffff",
              color: activeTab === "history" ? "#ffffff" : "#475569",
              boxShadow: activeTab === "history" ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none"
            }}
          >
            <History size={18} /> Attendance History
          </button>
        </div>
      </div>

      {activeTab === "create" && (
        <>
          {/* SCREEN 1: CREATE ATTENDANCE FORM (Displayed when no active session) */}
          {!activeSession ? (
            <Card style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
              <CardHeader style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", borderBottom: "1px solid #e2e8f0", padding: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0, tracking: "tight" }}>
                    CREATE ATTENDANCE
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "#64748b", margin: "6px 0 0" }}>
                    Select the target batch and session date to start live attendance.
                  </p>
                </div>
              </CardHeader>

              <CardContent style={{ padding: "32px 24px" }}>
                <form onSubmit={handleStartAttendance} style={{ maxWidth: "440px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {formError && (
                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={18} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {existingSessionNotice && (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "#fffbe6", border: "1px solid #ffe58f", color: "#873800", textAlign: "center" }}>
                      <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700" }}>
                        Attendance session already exists for this batch and date.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenExistingSession}
                        style={{ padding: "9px 20px", background: "#fa8c16", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13.5px", cursor: "pointer" }}
                      >
                        OPEN EXISTING SESSION
                      </button>
                    </div>
                  )}

                  {/* Batch Selection */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "700", color: "#334155" }}>
                      Batch:
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      disabled={loadingBatches}
                      style={{
                        height: "46px",
                        padding: "0 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14.5px",
                        fontWeight: "600",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "700", color: "#334155" }}>
                      Date:
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      style={{
                        height: "46px",
                        padding: "0 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "14.5px",
                        fontWeight: "600",
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    />
                  </div>

                  {/* Start Attendance Action Button */}
                  <button
                    type="submit"
                    style={{
                      marginTop: "10px",
                      height: "50px",
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "800",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <Play size={20} fill="#ffffff" /> START ATTENDANCE
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* SCREEN 2: LIVE ATTENDANCE DASHBOARD (Displayed when session is active) */
            <Card style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)", overflow: "hidden" }}>
              <CardHeader style={{ background: "#0f172a", color: "#ffffff", padding: "20px 24px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "1.5px", color: "#38bdf8", textTransform: "uppercase" }}>
                    LIVE ATTENDANCE SESSION
                  </span>
                  <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", margin: "4px 0 0" }}>
                    {activeSession.batch_name || selectedBatchObj?.name || `Batch ${activeSession.batch_id}`}
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: "4px 0 0" }}>
                    Date: <strong>{new Date(activeSession.date).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</strong>
                  </p>
                </div>
              </CardHeader>

              <CardContent style={{ padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "center" }}>
                  
                  {/* Left Column: Dynamic 5-second QR Display */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ padding: "16px", background: "#ffffff", borderRadius: "16px", border: "2px solid #3b82f6", boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}>
                      <canvas ref={canvasRef} width="240" height="240" style={{ display: "block" }} />
                    </div>

                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "20px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "14px", fontWeight: "700" }}>
                        <Clock size={16} className="animate-spin" />
                        <span>QR changes in: <strong>{qrCountdown} seconds</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Real-time Stats & Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Live Stats Box */}
                    <div style={{ padding: "20px", borderRadius: "14px", background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#166534" }}>Present Count:</span>
                        <span style={{ fontSize: "32px", fontWeight: "900", color: "#15803d" }}>
                          {sessionStats.present} / {sessionStats.total}
                        </span>
                      </div>
                      
                      <div style={{ marginTop: "12px", width: "100%", background: "#dcfce7", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                        <div style={{ width: `${sessionStats.percentage}%`, height: "100%", background: "#16a34a", transition: "width 0.4s ease" }} />
                      </div>

                      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#15803d", fontWeight: "700" }}>
                        <span>Absent: {sessionStats.absent}</span>
                        <span>Percentage: {sessionStats.percentage}%</span>
                      </div>
                    </div>

                    {/* Close Attendance Button */}
                    <button
                      onClick={handleCloseAttendance}
                      style={{
                        height: "48px",
                        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "15px",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                      }}
                    >
                      <Square size={18} fill="#ffffff" /> CLOSE ATTENDANCE
                    </button>
                  </div>
                </div>

                {/* Live Student Roster Table */}
                <div style={{ marginTop: "30px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
                    Student Attendance Roster ({sessionStats.roster.length} Enrolled)
                  </h4>

                  <div style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "12px 16px", fontWeight: "700" }}>Roll No.</th>
                          <th style={{ padding: "12px 16px", fontWeight: "700" }}>Student Name</th>
                          <th style={{ padding: "12px 16px", fontWeight: "700" }}>Status</th>
                          <th style={{ padding: "12px 16px", fontWeight: "700" }}>Marked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionStats.roster.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                              No students registered in this batch.
                            </td>
                          </tr>
                        ) : (
                          sessionStats.roster.map((st) => (
                            <tr key={st.user_id || st.student_id || st.roll_number} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "12px 16px", fontWeight: "700", color: "#334155" }}>
                                {st.roll_number || st.rollNo || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>
                                {st.name}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                {st.status === "PRESENT" ? (
                                  <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle2 size={13} /> PRESENT
                                  </span>
                                ) : (
                                  <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#fee2e2", color: "#b91c1c", fontWeight: "800", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <XCircle size={13} /> ABSENT
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12.5px" }}>
                                {st.marked_at ? new Date(st.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* SCREEN 3: ATTENDANCE HISTORY TAB */}
      {activeTab === "history" && (
        <Card style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "24px" }}>
          {selectedHistoryDetail ? (
            /* History Roster Detail View */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <button
                  onClick={() => setSelectedHistoryDetail(null)}
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft size={16} /> Back to Session History List
                </button>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                  Session Date: {new Date(selectedHistoryDetail.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                </span>
              </div>

              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    {selectedHistoryDetail.batch_name || `Batch ${selectedHistoryDetail.batch_id}`}
                  </h4>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Status: {selectedHistoryDetail.status}</span>
                </div>
                <div style={{ display: "flex", gap: "20px", textAlign: "right" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Present</span><br/>
                    <strong style={{ fontSize: "16px", color: "#16a34a" }}>{selectedHistoryDetail.present_count || 0} / {selectedHistoryDetail.total_students || 0}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Rate</span><br/>
                    <strong style={{ fontSize: "16px", color: "#2563eb" }}>{selectedHistoryDetail.percentage || 0}%</strong>
                  </div>
                </div>
              </div>

              <div style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", color: "#475569" }}>
                      <th style={{ padding: "12px 16px" }}>Roll No.</th>
                      <th style={{ padding: "12px 16px" }}>Student Name</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedHistoryDetail.roster || []).map((st) => (
                      <tr key={st.user_id || st.student_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 16px", fontWeight: "700" }}>{st.roll_number || st.rollNo || "—"}</td>
                        <td style={{ padding: "10px 16px", fontWeight: "600" }}>{st.name}</td>
                        <td style={{ padding: "10px 16px" }}>
                          {st.status === "PRESENT" ? (
                            <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", fontWeight: "800", fontSize: "12px" }}>PRESENT</span>
                          ) : (
                            <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#fee2e2", color: "#b91c1c", fontWeight: "800", fontSize: "12px" }}>ABSENT</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#64748b" }}>
                          {st.marked_at ? new Date(st.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* History Sessions List Table */
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
                Previous Attendance Sessions
              </h3>

              {loadingHistory ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>Loading session history...</p>
              ) : historySessions.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No previous attendance sessions found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569" }}>
                        <th style={{ padding: "12px 16px" }}>Date</th>
                        <th style={{ padding: "12px 16px" }}>Batch</th>
                        <th style={{ padding: "12px 16px" }}>Present / Total</th>
                        <th style={{ padding: "12px 16px" }}>Attendance Rate</th>
                        <th style={{ padding: "12px 16px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historySessions.map((rec) => (
                        <tr key={rec.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0f172a" }}>
                            {new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#334155" }}>
                            {rec.batch_name || `Batch ${rec.batch_id}`}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "700" }}>
                            {rec.present_count || 0} / {rec.total_students || 0}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "4px 10px", borderRadius: "12px", background: (rec.percentage || 0) >= 75 ? "#dcfce7" : "#fee2e2", color: (rec.percentage || 0) >= 75 ? "#15803d" : "#b91c1c", fontWeight: "800", fontSize: "12px" }}>
                              {rec.percentage || 0}%
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await apiFetch(`/attendance/sessions/${rec.id}/status`);
                                  setSelectedHistoryDetail({ ...rec, roster: res.data?.roster || [] });
                                } catch (_) {
                                  setSelectedHistoryDetail(rec);
                                }
                              }}
                              style={{ padding: "6px 12px", borderRadius: "6px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: "600", fontSize: "12.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Eye size={14} /> View Roster
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
