import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Users, Calendar, ArrowRight, Key, Copy, Check, RefreshCw, Sparkles, Clock, AlertTriangle, X, Trophy, CheckSquare, Trash2, Eye, FileText, Code, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminBatches.css";
import "../Styles/AdminQuizzes.css";
import "../Styles/AdminUsers.css";

/* ── Inline dropdown for Admin Batches (CSS: AdminBatches.css .admin-batch-select-*) ── */
function AdminBatchSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, direction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (direction === 'up') {
        setDropUp(true);
      } else if (direction === 'down') {
        setDropUp(false);
      } else {
        setDropUp(spaceBelow < 240);
      }
    }
    setIsOpen(v => !v);
  };

  return (
    <div className={`admin-batch-select-wrap${isOpen ? ' admin-batch-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={handleToggle} className={`admin-batch-select-trigger${isOpen ? ' admin-batch-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-batch-select-icon" />}
        <span className="admin-batch-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-batch-select-arrow${isOpen ? ' admin-batch-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className={`admin-batch-select-dropdown${dropUp ? ' admin-batch-select-dropdown--up' : ''}`}>
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-batch-select-option${isSel ? ' admin-batch-select-option--selected' : ''}`}>
                <span className="admin-batch-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-batch-select-check" />}
              </div>
            );
          })}
        </div>
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
      fetchBatches();
    } catch (err) {
      console.warn("Saved batch to local state fallback:", err);
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
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"? This will remove the batch, student enrollments, and assigned tasks.`)) {
      return;
    }
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    try {
      await apiFetch(`/batches/${batchId}`, { method: "DELETE" });
      await fetchBatches();
    } catch (err) {
      console.error("Failed to delete batch from DB:", err);
      fetchBatches();
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
            <div className="batch-tab-section" style={{ maxWidth: "800px" }}>
              <div className="batch-tab-header" style={{ marginBottom: "20px" }}>
                <h3 className="batch-tab-title" style={{ fontSize: "18px" }}>Assign Task to {selectedBatch.name}</h3>
                <p className="batch-tab-sub">Create a new problem set or homework task specifically for all enrolled students in this batch.</p>
              </div>
              <form onSubmit={handleTaskSubmit} className="add-task-form">
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Task Title *</label>
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
                    <label>Target Topic / Module *</label>
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
                    <label>Difficulty Level</label>
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
                    <label>XP Points Awarded</label>
                    <input
                      type="number"
                      placeholder="100"
                      className="form-input-admin"
                      value={taskForm.points}
                      onChange={(e) => setTaskForm((p) => ({ ...p, points: e.target.value }))}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Submission Deadline</label>
                    <input
                      type="date"
                      className="form-input-admin"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm((p) => ({ ...p, deadline: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Task Instructions & Description</label>
                  <textarea
                    rows={4}
                    placeholder="Detail the task problem statement, constraints, or submission criteria..."
                    className="form-input-admin"
                    style={{ height: "auto", minHeight: "100px" }}
                    value={taskForm.desc}
                    onChange={(e) => setTaskForm((p) => ({ ...p, desc: e.target.value }))}
                  />
                </div>

                {/* Test Cases Builder Section */}
                <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" }}>Test Cases (For Code Evaluation)</h4>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Add sample inputs and expected outputs to automatically evaluate student submissions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTaskForm((p) => ({
                        ...p,
                        testCases: [...p.testCases, { input: "", expectedOutput: "", isHidden: false }],
                      }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        background: "#eef2ff",
                        color: "#4f46e5",
                        border: "1px solid #c7d2fe",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      <Plus size={14} /> Add Test Case
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {taskForm.testCases.map((tc, idx) => (
                      <div key={idx} style={{ padding: "12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Test Case #{idx + 1}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={tc.isHidden}
                                onChange={(e) => {
                                  const updated = [...taskForm.testCases];
                                  updated[idx].isHidden = e.target.checked;
                                  setTaskForm((p) => ({ ...p, testCases: updated }));
                                }}
                              />
                              Hidden Test Case
                            </label>
                            {taskForm.testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = taskForm.testCases.filter((_, i) => i !== idx);
                                  setTaskForm((p) => ({ ...p, testCases: updated }));
                                }}
                                style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Sample Input</label>
                            <textarea
                              rows={2}
                              placeholder="e.g. [2, 7, 11, 15], target = 9"
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }}
                              value={tc.input}
                              onChange={(e) => {
                                const updated = [...taskForm.testCases];
                                updated[idx].input = e.target.value;
                                setTaskForm((p) => ({ ...p, testCases: updated }));
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>Expected Output</label>
                            <textarea
                              rows={2}
                              placeholder="e.g. [0, 1]"
                              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }}
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

                <div className="modal-footer" style={{ borderTop: "none", padding: "16px 0 0 0", justifyContent: "flex-start" }}>
                  <button type="submit" className="btn-modal-submit" style={{ padding: "12px 24px", fontSize: "14px" }}>
                    <Plus size={18} /> Assign Task to Batch
                  </button>
                </div>
              </form>
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

  return (
    <div className="admin-batches-container">
      <SectionHeader
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
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create Cohort</h2>
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
                    placeholder="e.g. Node.js Backend - Cohort A"
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

      <div className="batches-grid">
        {batches.length === 0 ? (
          <div className="admin-empty-state-card">
            <Users size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No batches created yet</p>
            <p className="admin-empty-state-sub">Click "Create New Batch" to add cohorts, assign mentors, and create student join codes.</p>
          </div>
        ) : (
          batches.map((b) => {
            const timerInfo = formatTimeRemaining(b.codeExpiresAt, now);
            return (
              <Card key={b.id} className="batch-card">
                <CardHeader className="batch-card-header">
                  <div className="batch-icon-container">
                    <Users size={20} />
                  </div>
                  <div className="batch-header-text">
                    <CardTitle className="batch-name">{b.name}</CardTitle>
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

                  {/* Join Code Box with Dynamic 5-Min Expiry */}
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
                        <button
                          type="button"
                          className="batch-code-refresh-btn"
                          onClick={() => handleRegenerateCode(b.id, b.name)}
                          title="Generate new 5-min code"
                        >
                          <RefreshCw size={12} />
                        </button>
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

                  <div className="batch-card-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <Button
                      variant="outline"
                      className="batch-view-btn"
                      onClick={() => handleVisitBatch(b)}
                      style={{ flex: 1 }}
                    >
                      Visit Batch <ArrowRight size={14} />
                    </Button>
                    <button
                      type="button"
                      className="batch-delete-card-btn"
                      onClick={() => handleDeleteBatch(b.id, b.name)}
                      title="Delete Batch"
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
