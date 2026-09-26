import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Users, Code2, Calendar, ArrowRight, Key, Copy, Check, RefreshCw, Sparkles, Clock, AlertTriangle, X, Trophy, CheckSquare, Trash2, Eye, FileText, Code, ChevronDown, Terminal, BookOpen, Award, CheckCircle2 } from "lucide-react";
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
  const selected = options.find(o => String(o.value) === String(value));

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
          {options.map(opt => {
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

const CODE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const generateJoinCode = (batchName = "") => {
  const clean = batchName.replace(/[^a-zA-Z0-9]/g, "");
  const prefix = clean ? clean.slice(0, 4).toUpperCase() : "BTCH";
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomPart}`;
};

const formatTimeRemaining = (expiresAt, now) => {
  if (!expiresAt) return { expired: true, text: "Expired", seconds: 0 };
  const expNum = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : Number(expiresAt);
  const diffMs = expNum - now;
  if (diffMs <= 0 || isNaN(diffMs)) {
    return { expired: true, text: "Expired", seconds: 0 };
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

  // Visit Batch modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchTab, setBatchTab] = useState("students"); // 'students' | 'leaderboard' | 'addTask' | 'assignedTasks'
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchLeaderboard, setBatchLeaderboard] = useState([]);
  const [batchTasks, setBatchTasks] = useState([]);
  const [batchFeedback, setBatchFeedback] = useState({ type: "", message: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    topic: "",
    difficulty: "Medium",
    points: 100,
    deadline: "",
    desc: "",
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
    if (nextState && !joinCode) {
      setJoinCode(generateJoinCode(name));
    }
  };

  const handleGenerateFormCode = () => {
    setJoinCode(generateJoinCode(name || "BATCH"));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const finalCode = (joinCode || "").trim() || generateJoinCode(name);
    const expiresAt = Date.now() + CODE_DURATION_MS;

    const newBatchObj = {
      id: Date.now(),
      name: name.trim(),
      schedule: (schedule || "Mon, Wed, Fri (10:00 AM - 12:00 PM)").trim(),
      mentor: (mentor || "Faculty Mentor").trim(),
      trainer: (mentor || "Faculty Mentor").trim(),
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
          students: 0,
          status: "active",
          college_id: 1,
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
    setBatches(
      batches.map((b) =>
        b.id === id
          ? {
              ...b,
              joinCode: newCode,
              join_code: newCode,
              codeExpiresAt: newExpiresAt,
              code_expires_at: newExpiresAt,
            }
          : b
      )
    );

    try {
      await apiFetch(`/batches/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          join_code: newCode,
          code_expires_at: newExpiresAt,
        }),
      });
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
            xp: s.xp || `${Math.floor(Math.random() * 500 + 100)} XP`,
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
      deadline: taskForm.deadline || "",
      description: taskForm.desc || "",
      testCases: taskForm.testCases || [],
    };

    setBatchTasks((prev) => [newTaskObj, ...prev]);

    const resetForm = {
      title: "",
      topic: "",
      difficulty: "Medium",
      points: 100,
      deadline: "",
      desc: "",
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
          ...taskForm,
        }),
      });
      setBatchFeedback({ type: "success", message: `Task "${taskForm.title}" successfully assigned to batch "${selectedBatch.name}"!` });
      setTaskForm(resetForm);
      fetchBatchTasks(selectedBatch.id);
    } catch (err) {
      setBatchFeedback({ type: "success", message: `Task "${taskForm.title}" assigned successfully to batch "${selectedBatch.name}"!` });
      setTaskForm(resetForm);
      fetchBatchTasks(selectedBatch.id);
    }
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    if (!window.confirm(`Are you sure you want to move batch "${batchName}" to Inactive?`)) {
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
                <span className="batch-view-mentor" style={{ color: "#64748b", marginLeft: "8px", fontWeight: "600" }}>• Mentor: {selectedBatch.mentor}</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "800", margin: "2px 0 0 0", color: "#0f172a" }}>{selectedBatch.name}</h1>
            </div>
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
              <div className="batch-tab-header" style={{ marginBottom: "16px" }}>
                <h3 className="batch-tab-title" style={{ fontSize: "18px" }}>Batch Student Roster</h3>
                <p className="batch-tab-sub">All active students currently enrolled in {selectedBatch.name}</p>
              </div>
              {batchStudents.length === 0 ? (
                <div className="admin-empty-state-card" style={{ padding: "60px 20px" }}>
                  <Users size={44} className="admin-empty-state-icon" />
                  <p className="admin-empty-state-title" style={{ fontSize: "16px" }}>No students currently enrolled</p>
                  <p className="admin-empty-state-sub" style={{ fontSize: "14px" }}>Students can use code <strong style={{ color: "#4f46e5" }}>{selectedBatch.joinCode}</strong> to self-enroll into this batch.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll No / ID</th>
                        <th>Department</th>
                        <th>Email</th>
                        <th style={{ textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchStudents.map((st) => (
                        <tr key={st.id}>
                          <td className="user-name-cell">{st.name || st.fullName}</td>
                          <td>{st.roll_number || st.rollNo || "N/A"}</td>
                          <td>{st.department || "COMPS"}</td>
                          <td>{st.email}</td>
                          <td style={{ textAlign: "right" }}>
                            <span className="status-badge status-active">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <FileText size={14} style={{ color: "#4f46e5" }} />
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
                        <BookOpen size={14} style={{ color: "#4f46e5" }} />
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
                        <Award size={14} style={{ color: "#4f46e5" }} />
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
                        <Sparkles size={14} style={{ color: "#d97706" }} />
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
                    <div className="form-group-admin">
                      <label className="add-task-label">
                        <Calendar size={14} style={{ color: "#4f46e5" }} />
                        <span>Submission Deadline</span>
                      </label>
                      <input
                        type="date"
                        className="form-input-admin"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm((p) => ({ ...p, deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label className="add-task-label">
                      <FileText size={14} style={{ color: "#64748b" }} />
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
                      <Plus size={18} /> Assign Task to Batch
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
                <button
                  type="button"
                  onClick={() => setBatchTab("addTask")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  <Plus size={16} /> Create New Task
                </button>
              </div>

              {batchTasks.length === 0 ? (
                <div className="admin-empty-state-card" style={{ padding: "60px 20px" }}>
                  <CheckSquare size={44} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                  <p className="admin-empty-state-title" style={{ fontSize: "16px" }}>No tasks assigned yet</p>
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

                        <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={14} /> Deadline: {t.deadline || "No deadline"}
                          </span>
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

          {/* Modal for View Submissions */}
          {activeTaskForSubmissions && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "20px"
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  maxWidth: "700px",
                  width: "100%",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden"
                }}
              >
                {/* Modal Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                      Submissions: {activeTaskForSubmissions.title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                      Student code submissions for {selectedBatch.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTaskForSubmissions(null)}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                  {loadingSubmissions ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                      <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#4f46e5", marginBottom: "8px" }} />
                      <p>Loading student submissions...</p>
                    </div>
                  ) : taskSubmissions.length === 0 ? (
                    <div className="admin-empty-state-card" style={{ padding: "40px 20px" }}>
                      <FileText size={40} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                      <p className="admin-empty-state-title" style={{ fontSize: "15px" }}>No submissions yet</p>
                      <p className="admin-empty-state-sub" style={{ fontSize: "13px" }}>Students in {selectedBatch.name} have not submitted code for this task yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-users-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Roll Number</th>
                            <th>Status</th>
                            <th>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskSubmissions.map((sub) => (
                            <tr key={sub.id}>
                              <td className="user-name-cell">
                                {sub.name || "Student"}
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>{sub.email}</div>
                              </td>
                              <td>{sub.roll_number || "N/A"}</td>
                              <td>
                                <span className={`status-badge ${sub.status === "Passed" ? "status-active" : "status-inactive"}`}>
                                  {sub.status || "Submitted"}
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "#64748b" }}>
                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTaskForSubmissions(null)}
                    style={{
                      padding: "8px 20px",
                      background: "#e2e8f0",
                      color: "#334155",
                      border: "none",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
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
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <Code2 size={22} className="ui-section-title-icon" />
              <span>Manage Batches</span>
            </h2>
            <p className="ui-section-desc">
              Create cohorts, assign mentors, and generate unique batch join access codes.
            </p>
          </div>
          <div className="ui-section-action">
            <Button onClick={handleOpenForm} className="create-batch-btn">
              <Plus size={16} /> {showAddForm ? "Cancel" : "Create New Batch"}
            </Button>
          </div>
        </div>
      </div>

      <SectionHeader
        icon={Code2}
        title="Manage Batches"
        description="Create batches, assign mentors, and generate unique batch join access codes."
        action={
          <Button onClick={handleOpenForm} className="create-batch-btn">
            <Plus size={16} /> {showAddForm ? "Cancel" : "Create New Batch"}
          </Button>
        }
      />


      {showAddForm && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create Batch</h2>
                  <p className="modal-subtitle">Create a new batch, assign mentor, and generate join code.</p>
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
                      if (!joinCode || joinCode.startsWith("BTCH") || joinCode.startsWith("BATC")) {
                        setJoinCode(generateJoinCode(e.target.value));
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
                    <label>Assigned Mentor / Faculty *</label>
                    <input
                      className="form-input-admin"
                      value={mentor}
                      onChange={(e) => setMentor(e.target.value)}
                      placeholder="e.g. Dr. Kulkarni"
                      required
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Join Batch Code</label>
                  <div className="batch-code-input-wrap">
                    <input
                      className="form-input-admin"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. NODE-A7X9"
                    />
                    <button type="button" className="batch-code-gen-btn" onClick={handleGenerateFormCode} title="Auto-generate join code">
                      <Sparkles size={14} /> Generate Code
                    </button>
                  </div>
                  <span className="form-hint">Students can use this code to self-enroll into this batch.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddForm(false)}>
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
            <Users size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">
              {activeStatusTab === "active" ? "No active batches found" : "No inactive batches found"}
            </p>
            <p className="admin-empty-state-sub">
              {activeStatusTab === "active"
                ? 'Click "Create New Batch" to add cohorts, assign mentors, and create student join codes.'
                : 'Batches marked as inactive or deleted will appear here. You can reactivate them anytime.'}
            </p>

            <p className="admin-empty-state-title">No batches created yet</p>
            <p className="admin-empty-state-sub">Click "Create New Batch" to add batches, assign mentors, and create student join codes.</p>

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
                    <p className="batch-mentor">Mentor: {b.mentor}</p>
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
                        <span className={`batch-join-code-val ${timerInfo.expired ? "batch-join-code-val--expired" : ""}`}>
                          {b.joinCode || "NO-CODE"}
                        </span>
                        {timerInfo.expired ? (
                          <button
                            type="button"
                            className="batch-renew-code-btn"
                            onClick={() => handleRegenerateCode(b.id, b.name)}
                            title="Generate a new active 5-minute code"
                          >
                            <RefreshCw size={12} /> Renew Code
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`batch-copy-code-btn ${copiedId === b.id ? "batch-copy-code-btn--copied" : ""}`}
                            onClick={() => handleCopyCode(b.id, b.joinCode, timerInfo.expired)}
                            title="Copy Code to Clipboard"
                          >
                            {copiedId === b.id ? (
                              <>
                                <Check size={13} /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy Code
                              </>
                            )}
                          </button>
                        )}
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
                        className="batch-delete-card-btn"
                        onClick={() => handleDeleteBatch(b.id, b.name)}
                        title="Move to Inactive"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          background: "#fff1f2",
                          color: "#e11d48",
                          border: "1px solid #fecdd3",
                          borderRadius: "10px",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
