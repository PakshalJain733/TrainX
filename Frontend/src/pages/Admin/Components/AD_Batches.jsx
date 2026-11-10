import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Users, Code2, Calendar, ArrowRight, Key, Copy, Check, RefreshCw, Sparkles, Clock, AlertTriangle, X, Trophy, CheckSquare, Trash2, Eye, FileText, Code, ChevronDown, Terminal, BookOpen, Award, CheckCircle2, Search, Mail, GraduationCap, Maximize2, Minimize2, Download, MessageSquare, PowerOff, FileSpreadsheet } from "lucide-react";
import { downloadBatchTaskReport } from "../../../utils/batchReportExporter";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { EVENTS } from "../../../utils/sharedStore";
import "../Styles/AD_Batches.css";

/* ── Inline dropdown for Admin Batches (CSS: AdminBatches.css .admin-batch-select-*) ── */
function AdminBatchSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, direction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, dropUp: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isUp = direction === 'up' || (direction !== 'down' && spaceBelow < 240);
      setCoords({
        top: isUp ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        dropUp: isUp,
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) updateCoords();
    setIsOpen(v => !v);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleScrollOrResize() {
      if (isOpen) updateCoords();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className={`admin-batch-select-wrap${isOpen ? ' admin-batch-select-wrap--open' : ''}`} ref={triggerRef}>
      <button type="button" onClick={handleToggle} className={`admin-batch-select-trigger${isOpen ? ' admin-batch-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-batch-select-icon" />}
        <span className="admin-batch-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-batch-select-arrow${isOpen ? ' admin-batch-select-arrow--rotate' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="admin-batch-select-dropdown"
          style={{
            position: 'fixed',
            top: coords.dropUp ? 'auto' : `${coords.top}px`,
            bottom: coords.dropUp ? `${window.innerHeight - coords.top}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 99999,
          }}
        >
          {safeOptions.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-batch-select-option${isSel ? ' admin-batch-select-option--selected' : ''}`}>
                <span className="admin-batch-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-batch-select-check" />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

import { apiFetch } from "../../../utils/api";

const CODE_DURATION_MS = 5 * 60 * 1000; // 5 minutes validity for batch join codes

const generateJoinCode = (length = 8) => {
  // Generate a clean 8-character uppercase alphanumeric code (e.g. 8K2P9X4M)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getInitials = (name) => {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatTimeRemaining = (expiresAt, now) => {
  if (!expiresAt) return { expired: true, text: "Expired", seconds: 0 };
  const expNum = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : Number(expiresAt);
  let diffMs = expNum - now;
  if (diffMs <= 0 || isNaN(diffMs)) {
    return { expired: true, text: "Expired", seconds: 0 };
  }
  // Cap at 5 minutes if it was saved with a legacy 30-day duration
  if (diffMs > CODE_DURATION_MS) {
    diffMs = CODE_DURATION_MS;
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    expired: false,
    text: `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
    seconds: totalSeconds,
  };
};

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [activeStatusTab, setActiveStatusTab] = useState("active"); // 'active' | 'inactive'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [mentor, setMentor] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [enlargedBatchCode, setEnlargedBatchCode] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  // Visit Batch modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchTab, setBatchTab] = useState("students"); // 'students' | 'leaderboard' | 'addTask' | 'assignedTasks'
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchLeaderboard, setBatchLeaderboard] = useState([]);
  const [batchTasks, setBatchTasks] = useState([]);
  const [batchFeedback, setBatchFeedback] = useState({ type: "", message: "" });
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    topic: "",
    difficulty: "Medium",
    points: 100,
    taskDate: new Date().toISOString().split("T")[0],
    deadline: "",
    desc: "",
    language: "Java",
    testCases: [
      { input: "", expectedOutput: "", isHidden: false },
      { input: "", expectedOutput: "", isHidden: true },
    ],
  });

  // Task Submissions Modal state
  const [activeTaskForSubmissions, setActiveTaskForSubmissions] = useState(null);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [viewingCodeSubmission, setViewingCodeSubmission] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isSubmissionsFullScreen, setIsSubmissionsFullScreen] = useState(false);
  const [isCodeFullScreen, setIsCodeFullScreen] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("all"); // 'all' | 'passed' | 'failed'
  const [submissionFeedbackText, setSubmissionFeedbackText] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackSaveSuccess, setFeedbackSaveSuccess] = useState(false);

  const handleSaveSubmissionFeedback = async () => {
    if (!viewingCodeSubmission) return;
    setIsSavingFeedback(true);
    setFeedbackSaveSuccess(false);
    try {
      await apiFetch(`/batches/submissions/${viewingCodeSubmission.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ feedback: submissionFeedbackText })
      });
      const updatedSub = { ...viewingCodeSubmission, feedback: submissionFeedbackText };
      setViewingCodeSubmission(updatedSub);
      setTaskSubmissions((prev) =>
        prev.map((s) => (s.id === viewingCodeSubmission.id ? { ...s, feedback: submissionFeedbackText } : s))
      );
      setFeedbackSaveSuccess(true);
      setTimeout(() => setFeedbackSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Saved feedback locally fallback:", err);
      const updatedSub = { ...viewingCodeSubmission, feedback: submissionFeedbackText };
      setViewingCodeSubmission(updatedSub);
      setTaskSubmissions((prev) =>
        prev.map((s) => (s.id === viewingCodeSubmission.id ? { ...s, feedback: submissionFeedbackText } : s))
      );
      setFeedbackSaveSuccess(true);
      setTimeout(() => setFeedbackSaveSuccess(false), 3000);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const downloadSubmissionCode = (sub, task) => {
    if (!sub) return;
    const code = sub.code_submission || sub.submitted_code || "";
    const lang = (sub.language || task?.language || "java").toLowerCase();
    const ext = lang === "python" ? "py" : lang.includes("c++") || lang.includes("cpp") ? "cpp" : "java";
    const studentName = (sub.name || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const taskName = (task?.title || sub.task_title || "Solution").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${studentName}_${taskName}.${ext}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      const res = await apiFetch("/admin/users?role=trainer");
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const onlyTrainers = list.filter(u => String(u.role || "").toLowerCase() === "trainer");
        setTrainers(onlyTrainers);
      }
    } catch (err) {
      console.warn("Failed to fetch trainers for batch creation:", err);
    } finally {
      setLoadingTrainers(false);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        const normalized = res.data.map((b) => ({
          ...b,
          joinCode: b.join_code || b.joinCode,
          codeExpiresAt: b.code_expires_at || b.codeExpiresAt,
          students: b.students || 0,
        }));
        setBatches(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch batches from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchTrainers();
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
  }, []);

  // Ticking timer for real-time countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenForm = () => {
    const nextState = !showAddForm;
    setShowAddForm(nextState);
    if (nextState) {
      fetchTrainers();
      if (!joinCode) {
        setJoinCode(generateJoinCode());
      }
    }
  };

  const handleGenerateFormCode = () => {
    setJoinCode(generateJoinCode());
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const finalCode = (joinCode || "").trim() || generateJoinCode();
    const expiresAt = Date.now() + CODE_DURATION_MS;

    const newBatchObj = {
      id: Date.now(),
      name: name.trim(),
      schedule: (schedule || "Mon, Wed, Fri (10:00 AM - 12:00 PM)").trim(),
      mentor: (mentor || "Mentor").trim(),
      trainer: (mentor || "Mentor").trim(),
      joinCode: finalCode,
      join_code: finalCode,
      codeExpiresAt: expiresAt,
      code_expires_at: expiresAt,
      students: 0,
      studentsCount: 0,
      status: "Active",
    };

    // Optimistically update batches list in UI immediately
    setBatches((prev) => [newBatchObj, ...prev]);

    // Clear form state and close modal
    setName("");
    setSchedule("");
    setMentor("");
    setJoinCode("");
    setShowAddForm(false);
    setSubmitting(false);

    try {
      const selectedTrainerObj = trainers.find(t => t.name === mentor);
      await apiFetch("/batches", {
        method: "POST",
        body: JSON.stringify({
          name: newBatchObj.name,
          code: finalCode,
          join_code: finalCode,
          code_expires_at: expiresAt,
          schedule: newBatchObj.schedule,
          mentor: newBatchObj.mentor,
          trainer: newBatchObj.mentor,
          trainer_id: selectedTrainerObj?.id || null,
          students: 0,
          status: "active",
        }),
      });
      window.dispatchEvent(new CustomEvent(EVENTS.BATCH_UPDATED, { detail: newBatchObj }));
      fetchBatches();
    } catch (err) {
      console.warn("Saved batch to local state fallback:", err);
      window.dispatchEvent(new CustomEvent(EVENTS.BATCH_UPDATED, { detail: newBatchObj }));
    }
  };

  const handleCopyCode = (id, code, isExpired) => {
    if (!code || isExpired) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerateCode = async (id, batchName) => {
    const newCode = generateJoinCode(batchName);
    const newExpiresAt = Date.now() + CODE_DURATION_MS;

    // Optimistically update UI
    setBatches((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              code: newCode,
              joinCode: newCode,
              join_code: newCode,
              codeExpiresAt: newExpiresAt,
              code_expires_at: newExpiresAt,
            }
          : b
      )
    );

    // If enlarged modal is active for this batch, update its code immediately
    setEnlargedBatchCode((prev) =>
      prev && (prev.batchId === id || prev.id === id || prev.name === batchName)
        ? { ...prev, code: newCode }
        : prev
    );

    try {
      const payload = {
        code: newCode,
        join_code: newCode,
        joinCode: newCode,
        code_expires_at: newExpiresAt,
        codeExpiresAt: newExpiresAt,
      };

      const res = await apiFetch(`/batches/${id}/regenerate-code`, {
        method: "POST",
        body: JSON.stringify(payload),
      }).catch(() =>
        apiFetch(`/batches/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );

      if (res && (res.data || res.success)) {
        const saved = res.data || {};
        const savedCode = saved.join_code || saved.code || saved.joinCode || newCode;
        const savedExpires = saved.code_expires_at || saved.codeExpiresAt || newExpiresAt;

        setBatches((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...saved,
                  code: savedCode,
                  joinCode: savedCode,
                  join_code: savedCode,
                  codeExpiresAt: Number(savedExpires),
                  code_expires_at: Number(savedExpires),
                }
              : b
          )
        );

        setEnlargedBatchCode((prev) =>
          prev && (prev.batchId === id || prev.id === id || prev.name === batchName)
            ? { ...prev, code: savedCode }
            : prev
        );

        window.dispatchEvent(
          new CustomEvent(EVENTS.BATCH_UPDATED, {
            detail: { id, code: savedCode, join_code: savedCode, joinCode: savedCode },
          })
        );
      }
    } catch (err) {
      console.error("Failed to update regenerated code in DB:", err);
    }
  };

  const fetchBatchTasks = async (batchId) => {
    try {
      const res = await apiFetch(`/batches/${batchId}/tasks`);
      if (res && res.data && Array.isArray(res.data)) {
        setBatchTasks(res.data);
      } else {
        setBatchTasks([]);
      }
    } catch (err) {
      console.error("Error fetching batch tasks:", err);
      setBatchTasks([]);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    setDeletingTaskId(taskId);
    try {
      await apiFetch(`/batches/tasks/${taskId}`, { method: "DELETE" });
      setBatchFeedback({ type: "success", message: "Task deleted successfully!" });
      if (selectedBatch) {
        fetchBatchTasks(selectedBatch.id);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      setBatchFeedback({ type: "error", message: "Failed to delete task." });
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleViewSubmissions = async (task) => {
    setActiveTaskForSubmissions(task);
    setLoadingSubmissions(true);
    setTaskSubmissions([]);
    setSubmissionSearch("");
    setSubmissionFilter("all");
    try {
      const res = await apiFetch(`/batches/tasks/${task.id}/submissions`);
      if (res && res.data && Array.isArray(res.data)) {
        setTaskSubmissions(res.data);
      } else {
        setTaskSubmissions([]);
      }
    } catch (err) {
      console.error("Failed to fetch task submissions:", err);
      setTaskSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleVisitBatch = async (batch) => {
    setSelectedBatch(batch);
    setBatchTab("students");
    setBatchFeedback({ type: "", message: "" });
    fetchBatchTasks(batch.id);
    try {
      // Fetch students for batch
      const res = await apiFetch(`/batches/${batch.id}/students`);
      if (res && res.data && Array.isArray(res.data)) {
        setBatchStudents(res.data);
        // Build batch leaderboard from student list
        const sorted = [...res.data]
          .map((s) => ({
            ...s,
            xp: s.xp !== undefined && s.xp !== null ? (typeof s.xp === 'number' ? `${s.xp} XP` : (String(s.xp).includes("XP") ? String(s.xp) : `${s.xp} XP`)) : "0 XP",
          }))
          .sort((a, b) => parseInt(b.xp || 0) - parseInt(a.xp || 0));
        setBatchLeaderboard(sorted);
      } else {
        setBatchStudents([]);
        setBatchLeaderboard([]);
      }
    } catch (err) {
      console.error("Error fetching batch details:", err);
      setBatchStudents([]);
      setBatchLeaderboard([]);
    }
  };

  const handleDownloadTaskReport = async () => {
    if (!selectedBatch?.id) return;
    setDownloadingReport(true);
    try {
      const result = await downloadBatchTaskReport(selectedBatch.id, selectedBatch.name);
      setBatchFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setBatchFeedback({
        type: "error",
        message: err.message || "Failed to download task submission report.",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !selectedBatch) return;

    const newTaskObj = {
      id: Date.now(),
      batch_id: selectedBatch.id,
      title: taskForm.title,
      topic: taskForm.topic || "General Assignment",
      difficulty: taskForm.difficulty || "Medium",
      points: taskForm.points || 100,
      task_date: taskForm.taskDate || new Date().toISOString().split("T")[0],
      taskDate: taskForm.taskDate || new Date().toISOString().split("T")[0],
      deadline: taskForm.deadline || "",
      description: taskForm.desc || "",
      language: taskForm.language || "Java",
      testCases: taskForm.testCases || [],
    };

    setBatchTasks((prev) => [newTaskObj, ...prev]);

    const resetForm = {
      title: "",
      topic: "",
      difficulty: "Medium",
      points: 100,
      taskDate: new Date().toISOString().split("T")[0],
      deadline: "",
      desc: "",
      language: "Java",
      testCases: [
        { input: "", expectedOutput: "", isHidden: false },
        { input: "", expectedOutput: "", isHidden: true },
      ],
    };

    try {
      const res = await apiFetch(`/batches/${selectedBatch.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          batch_id: selectedBatch.id,
          task_date: taskForm.taskDate || new Date().toISOString().split("T")[0],
          ...taskForm,
        }),
      });
      setBatchFeedback({
        type: "success",
        message: `Task "${taskForm.title}" successfully assigned to batch "${selectedBatch.name}"!`,
      });
      setTaskForm(resetForm);
      fetchBatchTasks(selectedBatch.id);
    } catch (err) {
      console.error("Failed to assign task:", err);
      setBatchFeedback({
        type: "error",
        message: err?.message || `Failed to assign task "${taskForm.title}".`,
      });
      fetchBatchTasks(selectedBatch.id);
    }
  };

  const handleDeactivateBatch = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to make batch "${batchName}" inactive?`)) {
      return;
    }
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: "Inactive" } : b))
    );
    try {
      await apiFetch(`/batches/${batchId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "inactive" }),
      });
    } catch (err) {
      console.warn("Updated batch status in local state fallback:", err);
    }
  };
  const handleDeleteBatch = handleDeactivateBatch;

  const handleReactivateBatch = async (batchId, batchName) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: "Active" } : b))
    );
    try {
      await apiFetch(`/batches/${batchId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "active" }),
      });
    } catch (err) {
      console.warn("Reactivated batch in local state fallback:", err);
    }
  };

  const handlePermanentDeleteBatch = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to permanently delete batch "${batchName}"? This action cannot be undone.`)) {
      return;
    }
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    try {
      await apiFetch(`/batches/${batchId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Permanently deleted batch from local state fallback:", err);
    }
  };

  if (selectedBatch) {
    return (
      <div className="admin-batches-container animate-fade-in" style={{ padding: "0" }}>
        {/* Full-Screen Header with Partition */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "16px 16px 0 0",
          borderBottom: "1px solid #cbd5e1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              type="button"
              onClick={() => setSelectedBatch(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to Batches
            </button>
            <div style={{ height: "36px", width: "1px", background: "#e2e8f0" }}></div>
            <div>
              <div className="batch-view-tag" style={{ color: "#4f46e5", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }}>
                <span>BATCH DASHBOARD</span>
                <span className="batch-view-mentor" style={{ color: "#64748b", marginLeft: "8px", fontWeight: "600" }}>• Trainer: {selectedBatch.trainer || selectedBatch.mentor || "Not Assigned"}</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "800", margin: "2px 0 0 0", color: "#0f172a" }}>{selectedBatch.name}</h1>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleDownloadTaskReport}
              disabled={downloadingReport}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                background: "#059669",
                border: "1px solid #059669",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: downloadingReport ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)"
              }}
              title="Download Task Submission Report (.xlsx)"
            >
              <FileSpreadsheet size={16} />
              {downloadingReport ? "Generating Report..." : "Download Report"}
            </button>
          </div>
        </div>

        {/* Full Screen Tabs Bar with Rounded Pill Buttons */}
        <div className="batch-detail-tabs" style={{ background: "#ffffff", padding: "16px 28px", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", gap: "12px", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            className={`batch-detail-tab-btn ${batchTab === "students" ? "active" : ""}`}
            onClick={() => setBatchTab("students")}
          >
            <Users size={17} /> Enrolled Students ({batchStudents.length})
          </button>
          <button
            type="button"
            className={`batch-detail-tab-btn ${batchTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setBatchTab("leaderboard")}
          >
            <Trophy size={17} /> Batch Leaderboard
          </button>
          <button
            type="button"
            className={`batch-detail-tab-btn ${batchTab === "addTask" ? "active" : ""}`}
            onClick={() => setBatchTab("addTask")}
          >
            <Plus size={17} /> Add Batch Task
          </button>
          <button
            type="button"
            className={`batch-detail-tab-btn ${batchTab === "assignedTasks" ? "active" : ""}`}
            onClick={() => setBatchTab("assignedTasks")}
          >
            <CheckSquare size={17} /> Assigned Tasks ({batchTasks.length})
          </button>
        </div>

        {/* Full Screen Body Content with Outer Frame */}
        <div style={{ padding: "32px", background: "#ffffff", minHeight: "calc(100vh - 240px)", borderRadius: "0 0 16px 16px", border: "1px solid #e2e8f0", borderTop: "none" }}>
          {/* Feedback Alert */}
          {batchFeedback.message && (
            <div className={`batch-alert-box ${batchFeedback.type === "success" ? "batch-alert-box--success" : "batch-alert-box--error"}`}>
              <Check size={18} />
              <span>{batchFeedback.message}</span>
            </div>
          )}

          {/* TAB 1: Enrolled Students */}
          {batchTab === "students" && (
            <div className="batch-tab-section">
              <div className="batch-tab-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 className="batch-tab-title" style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px" }}>Batch Student Roster</h3>
                  <p className="batch-tab-sub" style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                    All active students currently enrolled in <strong style={{ color: "#334155" }}>{selectedBatch.name}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#4f46e5", background: "#eef2ff", padding: "6px 14px", borderRadius: "20px", border: "1px solid #c7d2fe", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Users size={14} /> {batchStudents.length} {batchStudents.length === 1 ? "Student" : "Students"} Enrolled
                  </span>
                </div>
              </div>
              {batchStudents.length === 0 ? (
                <div className="admin-empty-state-card" style={{ padding: "60px 20px" }}>
                  <Users size={44} className="admin-empty-state-icon" />
                  <p className="admin-empty-state-title" style={{ fontSize: "16px" }}>No students currently enrolled</p>
                  <p className="admin-empty-state-sub" style={{ fontSize: "14px" }}>Students can use code <strong style={{ color: "#4f46e5" }}>{selectedBatch.joinCode}</strong> to self-enroll into this batch.</p>
                </div>
              ) : (
                <div className="admin-users-table-card">
                  <div className="admin-users-table-responsive">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th>Roll No / ID</th>
                          <th>Department</th>
                          <th>Email Address</th>
                          <th style={{ textAlign: "right" }}>Enrollment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchStudents.map((st) => (
                          <tr key={st.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{getInitials(st.name || st.fullName)}</div>
                                <div>
                                  <div className="user-name-title">{st.name || st.fullName || "Student"}</div>
                                  <div className="user-email-sub">{st.email || "No email registered"}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="roster-badge-roll">
                                {st.roll_number || st.rollNo || "N/A"}
                              </span>
                            </td>
                            <td>
                              <span className="roster-badge-dept">
                                <GraduationCap size={13} />
                                <span>{st.department || "COMPS"}</span>
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "13px" }}>
                                <Mail size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                                <span>{st.email}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="status-badge status-badge--active">
                                <span className="status-dot"></span> Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Batch Leaderboard */}
          {batchTab === "leaderboard" && (
            <div className="batch-tab-section">
              <div className="batch-tab-header" style={{ marginBottom: "16px" }}>
                <h3 className="batch-tab-title" style={{ fontSize: "18px" }}>Batch Performance Leaderboard</h3>
                <p className="batch-tab-sub">Rankings based on XP points, problem solving & quiz scores for {selectedBatch.name}</p>
              </div>
              <div className="batch-leaderboard-list">
                {batchLeaderboard.length === 0 ? (
                  <div className="admin-empty-state-card" style={{ padding: "60px 20px" }}>
                    <Trophy size={44} style={{ color: "#f59e0b", margin: "0 auto 12px" }} />
                    <p className="admin-empty-state-title" style={{ fontSize: "16px" }}>No leaderboard data available</p>
                    <p className="admin-empty-state-sub" style={{ fontSize: "14px" }}>Scores will update automatically as enrolled students complete tasks & quizzes.</p>
                  </div>
                ) : (
                  batchLeaderboard.map((item, idx) => (
                    <div
                      key={idx}
                      className={`leaderboard-rank-card ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : ""}`}
                      style={{ padding: "16px 20px" }}
                    >
                      <div className="leaderboard-rank-left">
                        <span className="rank-badge" style={{ width: "36px", height: "36px", fontSize: "14px" }}>#{idx + 1}</span>
                        <div>
                          <div className="rank-student-name" style={{ fontSize: "15px" }}>{item.name}</div>
                          <div className="rank-student-dept">{item.department || "Enrolled Student"}</div>
                        </div>
                      </div>
                      <span className="rank-xp-pill" style={{ padding: "6px 16px", fontSize: "13px" }}>{item.xp || "0 XP"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Add Batch Task */}
          {batchTab === "addTask" && (
            <div className="batch-tab-section" style={{ width: "100%" }}>
              <div className="add-task-card-container">
                <div className="add-task-header-banner">
                  <div className="add-task-banner-icon">
                    <Code2 size={24} />
                  </div>
                  <div>
                    <h3 className="add-task-banner-title">Assign Task to {selectedBatch.name}</h3>
                    <p className="add-task-banner-sub">Create a new problem set or homework task specifically for all enrolled students in this batch.</p>
                  </div>
                </div>

                <form onSubmit={handleTaskSubmit} className="add-task-form-body">
                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <FileText size={14} color="#4f46e5" />
                        <span>Task Title *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Solve Binary Tree Traversal & Recursion"
                        className="form-input-admin"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <BookOpen size={14} color="#4f46e5" />
                        <span>Target Topic / Module *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Data Structures - Trees"
                        className="form-input-admin"
                        value={taskForm.topic}
                        onChange={(e) => setTaskForm((p) => ({ ...p, topic: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Code size={14} color="#4f46e5" />
                        <span>Coding Language *</span>
                      </label>
                      <AdminBatchSelect
                        value={taskForm.language}
                        onChange={(val) => setTaskForm((p) => ({ ...p, language: val }))}
                        options={[
                          { value: "Java", label: "Java" },
                          { value: "Python", label: "Python" },
                          { value: "C++", label: "C++" },
                          { value: "C", label: "C" },
                          { value: "JavaScript", label: "JavaScript" },
                          { value: "TypeScript", label: "TypeScript" },
                          { value: "Go", label: "Go" },
                          { value: "SQL", label: "SQL" },
                          { value: "Any Language", label: "Any Language" }
                        ]}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Award size={14} color="#4f46e5" />
                        <span>Difficulty Level</span>
                      </label>
                      <AdminBatchSelect
                        value={taskForm.difficulty}
                        onChange={(val) => setTaskForm((p) => ({ ...p, difficulty: val }))}
                        options={[
                          { value: "Easy", label: "Easy" },
                          { value: "Medium", label: "Medium" },
                          { value: "Hard", label: "Hard" }
                        ]}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Sparkles size={14} color="#d97706" />
                        <span>XP Points Awarded</span>
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        className="form-input-admin"
                        value={taskForm.points}
                        onChange={(e) => setTaskForm((p) => ({ ...p, points: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Calendar size={14} color="#4f46e5" />
                        <span>Task Date / Scheduled For *</span>
                      </label>
                      <input
                        type="date"
                        required
                        className="form-input-admin"
                        value={taskForm.taskDate}
                        onChange={(e) => setTaskForm((p) => ({ ...p, taskDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Clock size={14} color="#4f46e5" />
                        <span>Submission Deadline</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="form-input-admin"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm((p) => ({ ...p, deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label className="add-task-label">
                      <FileText size={14} color="#64748b" />
                      <span>Task Instructions & Description</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Detail the task problem statement, constraints, or submission criteria..."
                      className="form-input-admin add-task-textarea"
                      value={taskForm.desc}
                      onChange={(e) => setTaskForm((p) => ({ ...p, desc: e.target.value }))}
                    />
                  </div>

                  {/* Test Cases Builder Section */}
                  <div className="test-cases-builder-card">
                    <div className="test-cases-header">
                      <div className="test-cases-header-left">
                        <div className="test-cases-header-icon">
                          <Terminal size={18} />
                        </div>
                        <div>
                          <h4>Test Cases (For Code Evaluation)</h4>
                          <p>Add sample inputs and expected outputs to automatically evaluate student submissions.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="add-test-case-btn"
                        onClick={() => setTaskForm((p) => ({
                          ...p,
                          testCases: [...p.testCases, { input: "", expectedOutput: "", isHidden: false }],
                        }))}
                      >
                        <Plus size={14} /> Add Test Case
                      </button>
                    </div>

                    <div className="test-cases-list">
                      {taskForm.testCases.map((tc, idx) => (
                        <div key={idx} className="test-case-box">
                          <div className="test-case-top-bar">
                            <span className="test-case-badge">Test Case #{idx + 1}</span>
                            <div className="test-case-top-right">
                              <label className="test-case-hidden-toggle">
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden}
                                  onChange={(e) => {
                                    const updated = [...taskForm.testCases];
                                    updated[idx].isHidden = e.target.checked;
                                    setTaskForm((p) => ({ ...p, testCases: updated }));
                                  }}
                                />
                                <span>Hidden Test Case</span>
                              </label>
                              {taskForm.testCases.length > 1 && (
                                <button
                                  type="button"
                                  className="test-case-remove-btn"
                                  onClick={() => {
                                    const updated = taskForm.testCases.filter((_, i) => i !== idx);
                                    setTaskForm((p) => ({ ...p, testCases: updated }));
                                  }}
                                >
                                  <Trash2 size={14} /> Remove
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="test-case-inputs-grid">
                            <div>
                              <label className="test-case-field-label">Sample Input</label>
                              <textarea
                                rows={2}
                                placeholder="e.g. [2, 7, 11, 15], target = 9"
                                className="test-case-code-input"
                                value={tc.input}
                                onChange={(e) => {
                                  const updated = [...taskForm.testCases];
                                  updated[idx].input = e.target.value;
                                  setTaskForm((p) => ({ ...p, testCases: updated }));
                                }}
                              />
                            </div>
                            <div>
                              <label className="test-case-field-label">Expected Output</label>
                              <textarea
                                rows={2}
                                placeholder="e.g. [0, 1]"
                                className="test-case-code-input"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const updated = [...taskForm.testCases];
                                  updated[idx].expectedOutput = e.target.value;
                                  setTaskForm((p) => ({ ...p, testCases: updated }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="add-task-form-footer">
                    <button type="submit" className="add-task-submit-btn">
                      <Plus size={18} />
                      <span>Assign Task to Batch</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: Assigned Batch Tasks */}
          {batchTab === "assignedTasks" && (
            <div className="batch-tab-section">
              <div className="batch-tab-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 className="batch-tab-title" style={{ fontSize: "18px" }}>Assigned Tasks for {selectedBatch.name}</h3>
                  <p className="batch-tab-sub">All coding problems and assignments created for students in this batch.</p>
                </div>
              </div>

              {batchTasks.length === 0 ? (
                <div className="admin-empty-state-card" style={{ padding: "60px 20px" }}>
                  <CheckSquare size={44} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                  <p className="admin-empty-state-title" style={{ fontSize: "16px" }}>No tasks assigned to this batch yet</p>
                  <p className="admin-empty-state-sub" style={{ fontSize: "14px" }}>Click "Create New Task" or "Add Batch Task" above to assign problem sets to this batch.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                  {batchTasks.map((t) => {
                    const parsedTestCases = typeof t.test_cases === "string" ? JSON.parse(t.test_cases || "[]") : (t.test_cases || []);
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "20px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          justify: "space-between",
                          gap: "14px"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "4px 10px",
                                  borderRadius: "9999px",
                                  background: t.difficulty === "Easy" ? "#dcfce7" : t.difficulty === "Hard" ? "#fee2e2" : "#fef3c7",
                                  color: t.difficulty === "Easy" ? "#166534" : t.difficulty === "Hard" ? "#991b1b" : "#92400e"
                                }}
                              >
                                {t.difficulty || "Medium"}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "4px 10px",
                                  borderRadius: "9999px",
                                  background: "#e0e7ff",
                                  color: "#3730a3",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <Code size={12} /> {t.language || "Java"}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#4f46e5", background: "#eef2ff", padding: "4px 10px", borderRadius: "9999px" }}>
                              +{t.points || 100} XP
                            </span>
                          </div>
                          <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>{t.title}</h4>
                          {t.topic && <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "8px" }}>Topic: {t.topic}</div>}
                          {t.description && (
                            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#64748b", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            {(t.task_date || t.taskDate || t.date) && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#4f46e5", fontWeight: "600" }}>
                                <Calendar size={14} /> Date: {t.task_date || t.taskDate || t.date}
                              </span>
                            )}
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={14} /> Deadline: {t.deadline || "No deadline"}
                            </span>
                          </div>
                          <span style={{ fontWeight: "600", color: "#334155" }}>
                            {parsedTestCases.length} Test Case{parsedTestCases.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Action Buttons: View Submissions & Delete Task */}
                        <div style={{ paddingTop: "12px", borderTop: "1px dashed #e2e8f0", display: "flex", gap: "10px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleViewSubmissions(t)}
                            style={{
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              padding: "8px 12px",
                              background: "#eef2ff",
                              color: "#4f46e5",
                              border: "1px solid #c7d2fe",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <Eye size={15} /> View Submissions
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            disabled={deletingTaskId === t.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              padding: "8px 12px",
                              background: "#fef2f2",
                              color: "#ef4444",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            title="Delete Task"
                          >
                            <Trash2 size={15} /> {deletingTaskId === t.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal for View Submissions (Full Viewport Portal Covering Sidebar) */}
          {activeTaskForSubmissions && (() => {
            const totalSubmissionsCount = taskSubmissions.length;
            const passedSubmissionsCount = taskSubmissions.filter((s) => s.status === "Passed" || s.status === "Completed").length;
            const passRatePercent = totalSubmissionsCount > 0 ? Math.round((passedSubmissionsCount / totalSubmissionsCount) * 100) : 0;
            const avgScoreVal = totalSubmissionsCount > 0 ? (taskSubmissions.reduce((acc, s) => acc + Number(s.marks_obtained ?? s.score ?? 0), 0) / totalSubmissionsCount).toFixed(1) : 0;
            const maxPossiblePoints = activeTaskForSubmissions?.points || 100;

            const filteredSubs = taskSubmissions.filter((sub) => {
              const q = (submissionSearch || "").trim().toLowerCase();
              const matchesSearch = !q ||
                (sub.name && sub.name.toLowerCase().includes(q)) ||
                (sub.email && sub.email.toLowerCase().includes(q)) ||
                (sub.roll_number && sub.roll_number.toLowerCase().includes(q));

              if (!matchesSearch) return false;
              const isPassed = sub.status === "Passed" || sub.status === "Completed";
              if (submissionFilter === "passed") return isPassed;
              if (submissionFilter === "failed") return !isPassed;
              return true;
            });

            return createPortal(
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.65)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 99999,
                  padding: isSubmissionsFullScreen ? "0px" : "16px",
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setActiveTaskForSubmissions(null);
                  setIsSubmissionsFullScreen(false);
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: isSubmissionsFullScreen ? "0px" : "18px",
                    width: isSubmissionsFullScreen ? "100vw" : "min(1440px, calc(100vw - 32px))",
                    height: isSubmissionsFullScreen ? "100vh" : "min(880px, calc(100vh - 32px))",
                    maxWidth: isSubmissionsFullScreen ? "100vw" : "1440px",
                    maxHeight: isSubmissionsFullScreen ? "100vh" : "880px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                    overflow: "hidden",
                    border: isSubmissionsFullScreen ? "none" : "1px solid #cbd5e1"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Clean White Modal Header matching Assign Topics Portal */}
                  <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    flexShrink: 0
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "rgba(79, 70, 229, 0.08)",
                        color: "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Code2 size={24} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            Submissions: {activeTaskForSubmissions.title}
                          </h3>
                          <span style={{
                            background: "#e0e7ff",
                            color: "#4338ca",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700
                          }}>
                            {selectedBatch?.name || "Batch"}
                          </span>
                          <span style={{
                            background: "#f1f5f9",
                            color: "#475569",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600
                          }}>
                            Language: {(activeTaskForSubmissions?.language || "Java").toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "3px 0 0 0" }}>
                          Student code submissions & auto-evaluation results • Max Score: {maxPossiblePoints} pts
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setIsSubmissionsFullScreen(!isSubmissionsFullScreen)}
                        title={isSubmissionsFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "10px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
                      >
                        {isSubmissionsFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTaskForSubmissions(null);
                          setIsSubmissionsFullScreen(false);
                        }}
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: "10px",
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Summary KPI Banner & Filters Bar */}
                  <div style={{
                    padding: "16px 28px",
                    background: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                  }}>
                    {/* KPI Cards Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Users size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Submissions</div>
                          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{totalSubmissionsCount}</div>
                        </div>
                      </div>

                      <div style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "12px",
                        padding: "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>Pass Rate</div>
                          <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534" }}>
                            {passedSubmissionsCount} / {totalSubmissionsCount} ({passRatePercent}%)
                          </div>
                        </div>
                      </div>

                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Award size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Average Score</div>
                          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                            {avgScoreVal} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>/ {maxPossiblePoints} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "450px" }}>
                        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                          type="text"
                          value={submissionSearch}
                          onChange={(e) => setSubmissionSearch(e.target.value)}
                          placeholder="Search student name, email, or roll number..."
                          style={{
                            width: "100%",
                            padding: "8px 14px 8px 36px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            background: "#ffffff",
                            transition: "border-color 0.15s ease"
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                          onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                        />
                      </div>

                      {/* Filter Tabs */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                        {[
                          { id: "all", label: `All (${totalSubmissionsCount})` },
                          { id: "passed", label: `Passed (${passedSubmissionsCount})` },
                          { id: "failed", label: `Needs Review (${totalSubmissionsCount - passedSubmissionsCount})` },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSubmissionFilter(tab.id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: "none",
                              fontSize: "12.5px",
                              fontWeight: submissionFilter === tab.id ? 700 : 500,
                              background: submissionFilter === tab.id ? "#ffffff" : "transparent",
                              color: submissionFilter === tab.id ? "#4f46e5" : "#64748b",
                              boxShadow: submissionFilter === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modal Content / Submissions Table */}
                  <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1, background: "#f8fafc" }}>
                    {loadingSubmissions ? (
                      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
                        <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", color: "#4f46e5", marginBottom: "12px" }} />
                        <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading student submissions...</p>
                      </div>
                    ) : taskSubmissions.length === 0 ? (
                      <div className="admin-empty-state-card" style={{ padding: "60px 20px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                        <FileText size={48} style={{ color: "#94a3b8", margin: "0 auto 14px" }} />
                        <p className="admin-empty-state-title" style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>No submissions yet</p>
                        <p className="admin-empty-state-sub" style={{ fontSize: "13px", color: "#64748b" }}>Students in {selectedBatch?.name || "this batch"} have not submitted code for this task yet.</p>
                      </div>
                    ) : filteredSubs.length === 0 ? (
                      <div className="admin-empty-state-card" style={{ padding: "50px 20px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                        <Search size={40} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: 0 }}>No matching submissions</p>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 12px 0" }}>No students match &quot;{submissionSearch}&quot; with filter &quot;{submissionFilter}&quot;.</p>
                        <button
                          type="button"
                          onClick={() => { setSubmissionSearch(""); setSubmissionFilter("all"); }}
                          style={{
                            padding: "6px 14px",
                            background: "#e0e7ff",
                            color: "#4338ca",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              <th style={{ padding: "14px 20px" }}>Student Details</th>
                              <th style={{ padding: "14px 18px" }}>Roll Number</th>
                              <th style={{ padding: "14px 18px" }}>Submission Result</th>
                              <th style={{ padding: "14px 18px" }}>Marks & Test Cases</th>
                              <th style={{ padding: "14px 18px" }}>Submitted At</th>
                              <th style={{ padding: "14px 20px", textAlign: "center" }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSubs.map((sub, idx) => {
                              const isPassed = sub.status === "Passed" || sub.status === "Completed";
                              const isPartial = sub.status === "Partial";
                              const marksVal = sub.marks_obtained ?? sub.score ?? 0;
                              const maxPoints = sub.total_marks || maxPossiblePoints;
                              const scorePercent = maxPoints > 0 ? Math.round((marksVal / maxPoints) * 100) : 0;

                              return (
                                <tr
                                  key={sub.id || idx}
                                  style={{
                                    borderBottom: idx === filteredSubs.length - 1 ? "none" : "1px solid #f1f5f9",
                                    transition: "background 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                >
                                  {/* Student Details */}
                                  <td style={{ padding: "16px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <div style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "13px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                      }}>
                                        {getInitials(sub.name)}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                          {sub.name || "Student"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                                          {sub.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Roll Number */}
                                  <td style={{ padding: "16px 18px" }}>
                                    <span style={{
                                      fontFamily: "monospace",
                                      fontWeight: 700,
                                      fontSize: "12px",
                                      background: "#f1f5f9",
                                      color: "#334155",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid #e2e8f0"
                                    }}>
                                      {sub.roll_number || "N/A"}
                                    </span>
                                  </td>

                                  {/* Submission Result */}
                                  <td style={{ padding: "16px 18px" }}>
                                    <span style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "5px 12px",
                                      borderRadius: "9999px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      background: isPassed ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                                      color: isPassed ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                                      border: `1px solid ${isPassed ? "#bbf7d0" : isPartial ? "#fde68a" : "#fecaca"}`
                                    }}>
                                      <span style={{
                                        width: "7px",
                                        height: "7px",
                                        borderRadius: "50%",
                                        background: "currentColor"
                                      }} />
                                      {sub.status || "Submitted"}
                                    </span>
                                  </td>

                                  {/* Marks & Feedback */}
                                  <td style={{ padding: "16px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                      <span style={{
                                        fontSize: "15px",
                                        fontWeight: 800,
                                        color: isPassed ? "#15803d" : isPartial ? "#b45309" : "#b91c1c"
                                      }}>
                                        {marksVal} / {maxPoints} pts
                                      </span>
                                      <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>
                                        ({scorePercent}%)
                                      </span>
                                    </div>
                                    {sub.feedback && (
                                      <div style={{
                                        fontSize: "11.5px",
                                        color: "#64748b",
                                        marginTop: "4px",
                                        maxWidth: "260px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                      }} title={sub.feedback}>
                                        {sub.feedback}
                                      </div>
                                    )}
                                  </td>

                                  {/* Submitted At */}
                                  <td style={{ padding: "16px 18px", fontSize: "12.5px", color: "#64748b" }}>
                                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}
                                  </td>

                                  {/* Action: View Code */}
                                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingCodeSubmission(sub);
                                        setCodeCopied(false);
                                        setSubmissionFeedbackText(sub.feedback || "");
                                        setFeedbackSaveSuccess(false);
                                      }}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 16px",
                                        background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "12.5px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                                        transition: "all 0.15s ease",
                                        whiteSpace: "nowrap"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(79, 70, 229, 0.35)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 2px 6px rgba(79, 70, 229, 0.25)";
                                      }}
                                    >
                                      <Code2 size={15} />
                                      View Code
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{
                    padding: "16px 28px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                      Showing {filteredSubs.length} of {totalSubmissionsCount} total submissions
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTaskForSubmissions(null);
                        setIsSubmissionsFullScreen(false);
                      }}
                      style={{
                        padding: "9px 24px",
                        background: "#e2e8f0",
                        color: "#334155",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#cbd5e1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            );
          })()}

          {/* Modal for Viewing Student Submitted Code (Plain Clean Code Viewer) */}
          {viewingCodeSubmission && (() => {
            const rawCode = viewingCodeSubmission.code_submission || viewingCodeSubmission.submitted_code || "";
            const submissionLang = (viewingCodeSubmission.language || activeTaskForSubmissions?.language || "java").toLowerCase();
            const fileExtension = submissionLang === "python" ? "py" : submissionLang.includes("c++") || submissionLang.includes("cpp") ? "cpp" : "java";
            const fileName = `Solution.${fileExtension}`;
            const isPassed = viewingCodeSubmission.status === "Passed" || viewingCodeSubmission.status === "Completed";
            const isPartial = viewingCodeSubmission.status === "Partial";
            const marksVal = viewingCodeSubmission.marks_obtained ?? viewingCodeSubmission.score ?? 0;
            const maxPoints = viewingCodeSubmission.total_marks || activeTaskForSubmissions?.points || 100;

            return createPortal(
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.65)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100000,
                  padding: isCodeFullScreen ? "0px" : "16px",
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setViewingCodeSubmission(null);
                  setIsCodeFullScreen(false);
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: isCodeFullScreen ? "0px" : "16px",
                    width: isCodeFullScreen ? "100vw" : "min(940px, calc(100vw - 32px))",
                    height: isCodeFullScreen ? "100vh" : "auto",
                    maxWidth: isCodeFullScreen ? "100vw" : "940px",
                    maxHeight: isCodeFullScreen ? "100vh" : "90vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                    overflow: "hidden",
                    border: isCodeFullScreen ? "none" : "1px solid #cbd5e1"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Clean Header Bar */}
                  <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    flexWrap: "wrap",
                    gap: "12px",
                    flexShrink: 0
                  }}>
                    {/* Left: Student Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "rgba(79, 70, 229, 0.08)",
                        color: "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Code2 size={22} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            {viewingCodeSubmission.name || "Student"}&apos;s Submitted Code
                          </h3>
                          <span style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontFamily: "monospace"
                          }}>
                            {viewingCodeSubmission.roll_number || "N/A"}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                          Task: <strong style={{ color: "#334155" }}>{activeTaskForSubmissions?.title || viewingCodeSubmission.task_title || "Assignment"}</strong>
                          {viewingCodeSubmission.department ? ` • ${viewingCodeSubmission.department}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Right: Badges & Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        background: "#4f46e5",
                        color: "#ffffff",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "11.5px"
                      }}>
                        {(viewingCodeSubmission.language || activeTaskForSubmissions?.language || "Java").toUpperCase()}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "11.5px",
                        background: isPassed ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2",
                        color: isPassed ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
                        border: `1px solid ${isPassed ? "#bbf7d0" : isPartial ? "#fde68a" : "#fecaca"}`
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
                        {viewingCodeSubmission.status || "Submitted"}
                      </span>
                      <span style={{
                        background: "#f8fafc",
                        color: "#0f172a",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "12px",
                        border: "1px solid #e2e8f0"
                      }}>
                        Score: {marksVal} / {maxPoints} pts
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rawCode);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 12px",
                          background: codeCopied ? "#16a34a" : "#ffffff",
                          color: codeCopied ? "#ffffff" : "#334155",
                          border: `1px solid ${codeCopied ? "#16a34a" : "#cbd5e1"}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                        {codeCopied ? "Copied!" : "Copy Code"}
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadSubmissionCode(viewingCodeSubmission, activeTaskForSubmissions)}
                        title="Download Solution"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 12px",
                          background: "#ffffff",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <Download size={13} />
                        Download
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCodeFullScreen(!isCodeFullScreen)}
                        title={isCodeFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                          cursor: "pointer"
                        }}
                      >
                        {isCodeFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewingCodeSubmission(null);
                          setIsCodeFullScreen(false);
                        }}
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: "6px",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body: Plain Code + Evaluation */}
                  <div style={{
                    padding: "20px 24px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "#f8fafc"
                  }}>
                    {/* Plain Code Snippet Box */}
                    <div style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #1e293b",
                      background: "#0f172a",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}>
                      <div style={{
                        padding: "8px 16px",
                        background: "#1e293b",
                        borderBottom: "1px solid #334155",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace", fontWeight: 600 }}>
                          {fileName}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                          {rawCode.length} characters
                        </span>
                      </div>
                      <pre style={{
                        margin: 0,
                        padding: "16px 20px",
                        color: "#f8fafc",
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
                        fontSize: "13.5px",
                        lineHeight: "1.65",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        maxHeight: isCodeFullScreen ? "calc(100vh - 280px)" : "420px",
                        overflowY: "auto"
                      }}>
                        <code>{rawCode || "// No code submitted by student"}</code>
                      </pre>
                    </div>

                    {/* Auto-Evaluation Result Banner */}
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: isPassed ? "#f0fdf4" : viewingCodeSubmission.status === "Compilation Error" ? "#fef2f2" : "#ffffff",
                      border: `1px solid ${isPassed ? "#bbf7d0" : viewingCodeSubmission.status === "Compilation Error" ? "#fecaca" : "#e2e8f0"}`
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: viewingCodeSubmission.feedback ? "8px" : "0"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isPassed ? "#15803d" : viewingCodeSubmission.status === "Compilation Error" ? "#991b1b" : "#334155"
                        }}>
                          <Terminal size={15} />
                          <span>
                            {viewingCodeSubmission.status === "Compilation Error"
                              ? "Compilation / Runtime Error Details"
                              : "Auto-Evaluation: " + (viewingCodeSubmission.status || "Submitted")}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isPassed ? "#15803d" : "#475569"
                        }}>
                          Score: {marksVal} / {maxPoints} pts
                        </span>
                      </div>
                      {viewingCodeSubmission.feedback && (
                        <pre style={{
                          margin: 0,
                          padding: "10px 14px",
                          background: "#0f172a",
                          color: isPassed ? "#86efac" : viewingCodeSubmission.status === "Compilation Error" ? "#fca5a5" : "#94a3b8",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          maxHeight: "140px",
                          overflowY: "auto"
                        }}>
                          {viewingCodeSubmission.feedback}
                        </pre>
                      )}
                    </div>

                    {/* Evaluator / Admin Code Review Feedback (Optional) */}
                    <div style={{
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      padding: "16px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MessageSquare size={16} color="#4f46e5" />
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                            Instructor Feedback
                          </span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "#f1f5f9",
                            color: "#64748b"
                          }}>
                            Optional
                          </span>
                        </div>
                        {feedbackSaveSuccess && (
                          <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#16a34a",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <Check size={14} /> Feedback saved successfully!
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>
                        Give optional comments, edge-case suggestions, or performance feedback to the student.
                      </p>
                      <textarea
                        value={submissionFeedbackText}
                        onChange={(e) => setSubmissionFeedbackText(e.target.value)}
                        placeholder="Write code feedback, suggestions, or pointers for the student (optional)..."
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontFamily: "inherit",
                          outline: "none",
                          resize: "vertical",
                          background: "#f8fafc",
                          color: "#0f172a",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s ease"
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                        onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={handleSaveSubmissionFeedback}
                          disabled={isSavingFeedback}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 16px",
                            background: "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isSavingFeedback ? "not-allowed" : "pointer",
                            opacity: isSavingFeedback ? 0.7 : 1,
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => { if (!isSavingFeedback) e.currentTarget.style.background = "#4338ca"; }}
                          onMouseLeave={(e) => { if (!isSavingFeedback) e.currentTarget.style.background = "#4f46e5"; }}
                        >
                          {isSavingFeedback ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
                          {isSavingFeedback ? "Saving..." : viewingCodeSubmission.feedback ? "Update Feedback" : "Save Feedback"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div style={{
                    padding: "12px 24px",
                    borderTop: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                      <Clock size={14} />
                      <span>Submitted: {viewingCodeSubmission.submitted_at ? new Date(viewingCodeSubmission.submitted_at).toLocaleString() : "N/A"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingCodeSubmission(null);
                        setIsCodeFullScreen(false);
                      }}
                      style={{
                        padding: "8px 20px",
                        background: "#e2e8f0",
                        color: "#334155",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#cbd5e1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                    >
                      Close Code Viewer
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            );
          })()}
        </div>
      </div>
    );
  }

  const activeBatches = batches.filter(
    (b) => b.status !== "Inactive" && b.status !== "inactive"
  );
  const inactiveBatches = batches.filter(
    (b) => b.status === "Inactive" || b.status === "inactive"
  );
  const visibleBatches = activeStatusTab === "active" ? activeBatches : inactiveBatches;

  return (
    <div className="admin-batches-container">
      <SectionHeader
        icon={Code2}
        title="Manage Batches"
        description="Create cohorts, assign mentors, and generate unique batch join access codes."
        action={
          <Button onClick={handleOpenForm} className="create-batch-btn">
            <Plus size={16} /> {showAddForm ? "Cancel" : "Create New Batch"}
          </Button>
        }
      />


      {showAddForm && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="modal-dialog create-batch-modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create Batch</h2>
                  <p className="modal-subtitle">Create a new batch, assign trainer, and generate join code.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddForm(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Batch Name *</label>
                  <input
                    className="form-input-admin"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!joinCode) {
                        setJoinCode(generateJoinCode());
                      }
                    }}
                    placeholder="e.g. Node.js Backend - Batch A"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Weekly Schedule *</label>
                    <input
                      className="form-input-admin"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      placeholder="e.g. Mon, Wed - 11:00 AM"
                      required
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Assigned Trainer *</label>
                    <AdminBatchSelect
                      value={mentor}
                      options={trainers.map((t) => ({
                        value: t.name,
                        label: t.name,
                      }))}
                      onChange={(val) => setMentor(val)}
                      placeholder={loadingTrainers ? "Loading registered trainers..." : (trainers.length === 0 ? "No registered trainers found" : "Select Trainer...")}
                      icon={Users}
                    />
                    {!loadingTrainers && trainers.length === 0 && (
                      <span className="form-hint" style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block" }}>
                        No registered trainers found. Please add a user with role "Trainer" in User Management.
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Join Batch Code</label>
                  <div className="batch-code-input-wrap">
                    <input
                      className="form-input-admin"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 8K2P9X4M"
                    />
                    <button type="button" className="batch-code-gen-btn" onClick={handleGenerateFormCode} title="Auto-generate join code">
                      <Sparkles size={14} /> Generate Code
                    </button>
                  </div>
                  <span className="form-hint">Students can use this code to self-enroll into this batch.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Active vs Inactive Batch Status Tabs */}
      <div className="batch-status-tabs-container">
        <button
          type="button"
          className={`batch-status-tab-btn ${activeStatusTab === "active" ? "batch-status-tab-btn--active" : ""}`}
          onClick={() => setActiveStatusTab("active")}
        >
          <CheckCircle2 size={16} />
          <span>Active Batches</span>
          <span className="batch-status-tab-count batch-status-tab-count--active">
            {activeBatches.length}
          </span>
        </button>

        <button
          type="button"
          className={`batch-status-tab-btn ${activeStatusTab === "inactive" ? "batch-status-tab-btn--active" : ""}`}
          onClick={() => setActiveStatusTab("inactive")}
        >
          <AlertTriangle size={16} />
          <span>Inactive Batches</span>
          <span className="batch-status-tab-count batch-status-tab-count--inactive">
            {inactiveBatches.length}
          </span>
        </button>
      </div>

      <div className="batches-grid">
        {visibleBatches.length === 0 ? (
          <div className="admin-empty-state-card" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-empty-state-icon-wrap">
              <Users size={32} />
            </div>
            <p className="admin-empty-state-title">
              {activeStatusTab === "active" ? "No Active Batches Found" : "No Inactive Batches Found"}
            </p>
            <p className="admin-empty-state-sub">
              {activeStatusTab === "active"
                ? 'Get started by creating your first batch cohort. Assign trainers, schedules, and generate 5-minute dynamic access codes for student enrollment.'
                : 'Batches marked as inactive or archived will appear here. You can reactivate them anytime with full access restoration.'}
            </p>
            {activeStatusTab === "active" && (
              <button
                type="button"
                onClick={handleOpenForm}
                className="admin-empty-state-cta-btn"
              >
                <Plus size={16} /> Create Your First Batch
              </button>
            )}
          </div>
        ) : (
          visibleBatches.map((b) => {
            const timerInfo = formatTimeRemaining(b.codeExpiresAt, now);
            const isInactive = b.status === "Inactive" || b.status === "inactive";

            return (
              <Card key={b.id} className={`batch-card ${isInactive ? "batch-card--inactive" : ""}`}>
                <CardHeader className="batch-card-header">
                  <div className="batch-icon-container">
                    <Users size={20} />
                  </div>
                  <div className="batch-header-text" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <CardTitle className="batch-name">{b.name}</CardTitle>
                      <Badge variant={isInactive ? "destructive" : "primary"}>
                        {isInactive ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                    <p className="batch-mentor">Trainer: {b.trainer || b.mentor || "Not Assigned"}</p>
                  </div>
                </CardHeader>
                <CardContent className="batch-card-body">
                  <div className="batch-meta-item">
                    <Users size={16} />
                    <span>{b.students} Enrolled Students</span>
                  </div>
                  <div className="batch-meta-item">
                    <Calendar size={16} />
                    <span>{b.schedule}</span>
                  </div>

                  {/* Join Code Box with Dynamic 5-Min Expiry (Active Batches Only) */}
                  {!isInactive && (
                    <div className={`batch-join-code-section ${timerInfo.expired ? "batch-join-code-section--expired" : ""}`}>
                      <div className="batch-join-code-header">
                        <span className="batch-join-code-label">
                          <Key size={13} /> Join Batch Code
                        </span>
                        <div className="batch-code-header-right">
                          <button
                            type="button"
                            className="batch-enlarge-icon-btn"
                            onClick={() => setEnlargedBatchCode({ code: b.joinCode || b.join_code || b.code || "NO-CODE", name: b.name, trainer: b.trainer || b.mentor, batchId: b.id })}
                            title="Enlarge Join Code for presentation"
                            aria-label="Enlarge Join Code"
                          >
                            <Maximize2 size={12} />
                          </button>
                          <span className={`batch-code-expiry-badge ${timerInfo.expired ? "batch-code-expiry-badge--expired" : ""}`}>
                            {timerInfo.expired ? (
                              <>
                                <AlertTriangle size={11} /> Expired
                              </>
                            ) : (
                              <>
                                <Clock size={11} /> {timerInfo.text}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="batch-join-code-display">
                        <span 
                          className={`batch-join-code-val ${timerInfo.expired ? "batch-join-code-val--expired" : ""}`}
                          onClick={() => setEnlargedBatchCode({ code: b.joinCode || b.join_code || b.code || "NO-CODE", name: b.name, trainer: b.trainer || b.mentor, batchId: b.id })}
                          title="Click to enlarge join code"
                          style={{ cursor: "pointer" }}
                        >
                          {b.joinCode || b.join_code || b.code || "NO-CODE"}
                        </span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            className={`batch-copy-code-btn ${copiedId === b.id ? "batch-copy-code-btn--copied" : ""}`}
                            onClick={() => handleCopyCode(b.id, b.joinCode || b.join_code || b.code, timerInfo.expired)}
                            title={copiedId === b.id ? "Copied!" : "Copy Code"}
                            aria-label="Copy Code"
                          >
                            {copiedId === b.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            type="button"
                            className={`batch-renew-code-btn ${!timerInfo.expired ? "batch-renew-code-btn--active" : ""}`}
                            onClick={() => handleRegenerateCode(b.id, b.name)}
                            title={timerInfo.expired ? "Renew expired join code" : "Regenerate join code"}
                            aria-label="Regenerate Join Code"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                      {timerInfo.expired && (
                        <span className="batch-expired-hint">This code expired after 5 minutes. Click "Renew Code" to create a fresh access code.</span>
                      )}
                    </div>
                  )}

                  <div className="batch-card-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <Button
                      variant="outline"
                      className="batch-view-btn"
                      onClick={() => handleVisitBatch(b)}
                      style={{ flex: 1 }}
                    >
                      Visit Batch <ArrowRight size={14} />
                    </Button>
                    
                    {isInactive ? (
                      <button
                        type="button"
                        onClick={() => handleReactivateBatch(b.id, b.name)}
                        title="Reactivate Batch"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                          borderRadius: "10px",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <RefreshCw size={14} /> Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="batch-inactive-card-btn"
                        onClick={() => handleDeactivateBatch(b.id, b.name)}
                        title="Make Batch Inactive"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          background: "#fffbeb",
                          color: "#b45309",
                          border: "1px solid #fde68a",
                          borderRadius: "10px",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <PowerOff size={15} /> Make Inactive
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Enlarge Batch Code Modal */}
      {enlargedBatchCode && createPortal(
        <div 
          className="batch-enlarge-overlay"
          onClick={() => setEnlargedBatchCode(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div 
            className="batch-enlarge-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "24px",
              padding: "36px 32px 32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setEnlargedBatchCode(null)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#f1f5f9",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}>
              <Key size={28} />
            </div>

            <div style={{ fontSize: "12px", fontWeight: "800", color: "#6366f1", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              JOIN BATCH ACCESS CODE
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
              {enlargedBatchCode.name}
            </h2>

            {enlargedBatchCode.trainer && (
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px" }}>
                Trainer: <strong style={{ color: "#334155" }}>{enlargedBatchCode.trainer}</strong>
              </p>
            )}

            {/* Giant Enlarge Code Pill */}
            <div style={{
              width: "100%",
              padding: "24px 20px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
              border: "2px dashed #93c5fd",
              borderRadius: "18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
            }}>
              <span style={{
                fontFamily: "monospace, 'Courier New', sans-serif",
                fontSize: "44px",
                fontWeight: "900",
                letterSpacing: "4px",
                color: "#1e40af",
                textShadow: "0 2px 4px rgba(30, 64, 175, 0.1)",
                userSelect: "all",
              }}>
                {enlargedBatchCode.code}
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                Students enter this code in their portal to join
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", width: "100%", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(enlargedBatchCode.code);
                  setCopiedId(enlargedBatchCode.code);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: copiedId === enlargedBatchCode.code ? "#16a34a" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                {copiedId === enlargedBatchCode.code ? (
                  <><Check size={16} /> Copied to Clipboard!</>
                ) : (
                  <><Copy size={16} /> Copy Join Code</>
                )}
              </button>
              {enlargedBatchCode.batchId && (
                <button
                  type="button"
                  onClick={() => handleRegenerateCode(enlargedBatchCode.batchId, enlargedBatchCode.name)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 18px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title="Generate and update new code in database"
                >
                  <RefreshCw size={15} /> Regenerate
                </button>
              )}
              <button
                type="button"
                onClick={() => setEnlargedBatchCode(null)}
                style={{
                  padding: "12px 20px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
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
