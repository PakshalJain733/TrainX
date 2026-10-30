import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../../utils/api';
import {
  Layers,
  Code2,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Copy,
  Check,
  X,
  Terminal,
  RefreshCw,
  Award,
  Calendar,
  Sparkles,
  CheckSquare,
  AlertTriangle
} from "lucide-react";

import "../Styles/MN_Batches.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getBatches = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.batches)) return payload.batches;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") {
    const nested = value.name || value.code || value.title;
    return nested ? String(nested) : null;
  }
  const text = String(value).trim();
  return text || null;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getNumber = (source, keys) => asNumber(firstValue(source, keys));

const getInitials = (name) => {
  if (!name) return "ST";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const QUICK_FEEDBACK_OPTIONS = [
  "+ Clean solution & optimal time complexity!",
  "+ Check edge cases with empty or 1-element input.",
  "+ Optimize space complexity: aim for O(1) auxiliary memory.",
  "+ Watch out for potential integer overflow or index out of bounds.",
  "+ Good attempt! Consider reviewing time limit constraints."
];

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected batch detail view state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState("students"); // 'students' | 'submissions' | 'tasks'

  // Search & filter states inside batch detail
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Code inspection modal state
  const [viewingCodeSubmission, setViewingCodeSubmission] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [reviewFeedbackText, setReviewFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch("/mentor/batches")
      .then((res) => {
        if (!mounted) return;
        const list = getBatches(res);
        setBatches(list);
      })
      .catch(() => {
        if (mounted) setBatches([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenBatch = async (batch) => {
    setSelectedBatch(batch);
    setLoadingDetails(true);
    setBatchDetails(null);
    setDetailTab("students");
    setSearchTerm("");
    setStatusFilter("all");

    const batchIdParam = batch.batchId || batch.id;
    try {
      const res = await apiFetch(`/mentor/batches/${batchIdParam}/details`);
      const data = unwrap(res);
      if (data) {
        setBatchDetails(data);
      } else {
        setBatchDetails({
          batch: batch,
          students: [],
          tasks: [],
          submissions: [],
          summary: { totalAllocatedStudents: 0, totalTasks: 0, totalSubmissions: 0, totalPendingTasks: 0 }
        });
      }
    } catch (err) {
      console.error("Failed to load batch details:", err);
      setBatchDetails({
        batch: batch,
        students: [],
        tasks: [],
        submissions: [],
        summary: { totalAllocatedStudents: 0, totalTasks: 0, totalSubmissions: 0, totalPendingTasks: 0 }
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackToBatches = () => {
    setSelectedBatch(null);
    setBatchDetails(null);
    setViewingCodeSubmission(null);
  };

  const handleOpenCodeModal = (submission) => {
    setViewingCodeSubmission(submission);
    setCodeCopied(false);
    setReviewFeedbackText(submission.feedback || "");
    setFeedbackSuccess(false);
  };

  const handleAddQuickFeedback = (text) => {
    const clean = text.replace(/^\+\s*/, "");
    setReviewFeedbackText((prev) => (prev ? `${prev}\n• ${clean}` : `• ${clean}`));
  };

  const handleSaveFeedback = async () => {
    if (!viewingCodeSubmission) return;
    setSavingFeedback(true);
    setFeedbackSuccess(false);
    try {
      await apiFetch(`/mentor/submissions/${viewingCodeSubmission.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ feedback: reviewFeedbackText })
      });

      // Update state locally
      if (batchDetails && Array.isArray(batchDetails.submissions)) {
        setBatchDetails((prev) => ({
          ...prev,
          submissions: prev.submissions.map((sub) =>
            sub.id === viewingCodeSubmission.id ? { ...sub, feedback: reviewFeedbackText } : sub
          )
        }));
      }
      setViewingCodeSubmission((prev) => (prev ? { ...prev, feedback: reviewFeedbackText } : null));
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save feedback:", err);
      alert("Failed to save feedback. Please try again.");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    if (!batchDetails || !Array.isArray(batchDetails.submissions)) return [];
    return batchDetails.submissions.filter((sub) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (sub.name && sub.name.toLowerCase().includes(q)) ||
        (sub.roll_number && sub.roll_number.toLowerCase().includes(q)) ||
        (sub.task_title && sub.task_title.toLowerCase().includes(q)) ||
        (sub.language && sub.language.toLowerCase().includes(q));

      const statusLower = String(sub.status || "").toLowerCase();
      let matchStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "passed") {
          matchStatus = statusLower === "passed" || statusLower === "completed" || statusLower === "accepted";
        } else if (statusFilter === "failed") {
          matchStatus = statusLower === "failed" || statusLower === "wrong_answer";
        } else if (statusFilter === "error") {
          matchStatus = statusLower.includes("error") || statusLower.includes("compilation");
        } else if (statusFilter === "partial") {
          matchStatus = statusLower === "partial";
        } else if (statusFilter === "submitted") {
          matchStatus = statusLower === "submitted" || statusLower === "pending";
        }
      }

      return matchSearch && matchStatus;
    });
  }, [batchDetails, searchTerm, statusFilter]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!batchDetails || !Array.isArray(batchDetails.students)) return [];
    return batchDetails.students.filter((st) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        (st.name && st.name.toLowerCase().includes(q)) ||
        (st.rollNumber && st.rollNumber.toLowerCase().includes(q)) ||
        (st.email && st.email.toLowerCase().includes(q)) ||
        (st.department && st.department.toLowerCase().includes(q))
      );
    });
  }, [batchDetails, searchTerm]);

  const safeBatches = Array.isArray(batches) ? batches : [];

  return (
    <div className="mentor-batches-container">
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: DETAILED BATCH VIEW (OPENED BATCH)
      ───────────────────────────────────────────────────────────── */}
      {selectedBatch ? (
        <div className="mentor-batch-detail-view">
          {/* Header & Back Navigation */}
          <div className="mentor-batch-detail-header">
            <button type="button" onClick={handleBackToBatches} className="mentor-batch-back-btn">
              <ArrowLeft size={16} />
              <span>Back to All Batches</span>
            </button>

            <div className="mentor-batch-title-row">
              <div className="mentor-batch-heading-block">
                <div className="mentor-batch-eyebrow">
                  <span className="mentor-batch-code-pill">
                    {textValue(firstValue(selectedBatch, ["code", "batchCode", "batch_code"])) || "BATCH"}
                  </span>
                  <span className="mentor-status-tag mentor-status-tag--active">
                    {selectedBatch.status || "Active"}
                  </span>
                </div>
                <h1 className="mentor-batch-detail-title">{selectedBatch.name || "Batch Workspace"}</h1>
                <p className="mentor-batch-detail-meta">
                  {selectedBatch.college || "College"} • {selectedBatch.department || "Department"} •{" "}
                  {selectedBatch.schedule || "Regular Schedule"}
                </p>
              </div>

              <div className="mentor-batch-quick-refresh">
                <button
                  type="button"
                  onClick={() => handleOpenBatch(selectedBatch)}
                  className="mentor-refresh-btn"
                  title="Reload Batch Data"
                >
                  <RefreshCw size={15} className={loadingDetails ? "mentor-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Summary */}
            <div className="mentor-batch-kpis-grid">
              <div className="mentor-kpi-card mentor-kpi-card--indigo">
                <div className="mentor-kpi-icon-wrap">
                  <Users size={20} />
                </div>
                <div className="mentor-kpi-info">
                  <span className="mentor-kpi-num">
                    {batchDetails?.summary?.totalAllocatedStudents ?? selectedBatch.enrolledStudents ?? 0}
                  </span>
                  <span className="mentor-kpi-label">Allocated Students</span>
                </div>
              </div>

              <div className="mentor-kpi-card mentor-kpi-card--blue">
                <div className="mentor-kpi-icon-wrap">
                  <FileText size={20} />
                </div>
                <div className="mentor-kpi-info">
                  <span className="mentor-kpi-num">
                    {batchDetails?.summary?.totalTasks ?? batchDetails?.tasks?.length ?? 0}
                  </span>
                  <span className="mentor-kpi-label">Tasks Assigned</span>
                </div>
              </div>

              <div className="mentor-kpi-card mentor-kpi-card--emerald">
                <div className="mentor-kpi-icon-wrap">
                  <CheckCircle2 size={20} />
                </div>
                <div className="mentor-kpi-info">
                  <span className="mentor-kpi-num">
                    {batchDetails?.summary?.totalSubmissions ?? batchDetails?.submissions?.length ?? 0}
                  </span>
                  <span className="mentor-kpi-label">Code Submissions</span>
                </div>
              </div>

              <div className="mentor-kpi-card mentor-kpi-card--amber">
                <div className="mentor-kpi-icon-wrap">
                  <Clock size={20} />
                </div>
                <div className="mentor-kpi-info">
                  <span className="mentor-kpi-num">
                    {batchDetails?.summary?.totalPendingTasks ?? 0}
                  </span>
                  <span className="mentor-kpi-label">Tasks Pending</span>
                </div>
              </div>
            </div>

            {/* Detail Tabs Navigation */}
            <div className="mentor-batch-tabs-bar">
              <button
                type="button"
                className={`mentor-tab-pill ${detailTab === "students" ? "mentor-tab-pill--active" : ""}`}
                onClick={() => {
                  setDetailTab("students");
                  setSearchTerm("");
                }}
              >
                <Users size={16} />
                <span>Allocated Students & Task Progress</span>
                <span className="mentor-tab-count">
                  {batchDetails?.students?.length ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`mentor-tab-pill ${detailTab === "submissions" ? "mentor-tab-pill--active" : ""}`}
                onClick={() => {
                  setDetailTab("submissions");
                  setSearchTerm("");
                }}
              >
                <Code2 size={16} />
                <span>Student Code Submissions</span>
                <span className="mentor-tab-count">
                  {batchDetails?.submissions?.length ?? 0}
                </span>
              </button>

              <button
                type="button"
                className={`mentor-tab-pill ${detailTab === "tasks" ? "mentor-tab-pill--active" : ""}`}
                onClick={() => {
                  setDetailTab("tasks");
                  setSearchTerm("");
                }}
              >
                <CheckSquare size={16} />
                <span>Assigned Tasks</span>
                <span className="mentor-tab-count">
                  {batchDetails?.tasks?.length ?? 0}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content Section */}
          <div className="mentor-batch-tab-body">
            {loadingDetails ? (
              <div className="mentor-batch-empty" style={{ padding: "64px 20px" }}>
                <RefreshCw size={32} className="mentor-spin" style={{ color: "#4f46e5" }} />
                <p className="mentor-batch-empty-title">Loading batch records & submissions...</p>
                <p className="mentor-batch-empty-sub">Fetching your allocated students and code history</p>
              </div>
            ) : detailTab === "students" ? (
              /* ─── TAB 1: ALLOCATED STUDENTS & PENDING TASKS ─── */
              <div className="mentor-tab-container">
                <div className="mentor-filter-head">
                  <div>
                    <h3 className="mentor-sub-heading">Allocated Students & Pending Work</h3>
                    <p className="mentor-sub-desc">
                      Tasks completed vs pending for each student assigned to you in this batch
                    </p>
                  </div>
                  <div className="mentor-search-wrapper">
                    <Search size={16} className="mentor-search-icon" />
                    <input
                      type="text"
                      placeholder="Search by student name, roll no..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mentor-search-input"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mentor-search-clear-btn"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="mentor-batch-empty">
                    <Users size={36} />
                    <p className="mentor-batch-empty-title">No allocated students found</p>
                    <p className="mentor-batch-empty-sub">
                      {searchTerm
                        ? "No students match your search filter."
                        : "No students are currently allocated to you in this batch."}
                    </p>
                  </div>
                ) : (
                  <div className="mentor-table-card">
                    <div className="mentor-table-responsive">
                      <table className="mentor-data-table">
                        <thead>
                          <tr>
                            <th>Student Details</th>
                            <th>Roll Number</th>
                            <th>Assigned Tasks</th>
                            <th>Completed Tasks</th>
                            <th>Pending Tasks</th>
                            <th>Completion Rate</th>
                            <th style={{ textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((st) => {
                            const isAllDone = st.pendingTasksCount === 0;
                            const hasPending = st.pendingTasksCount > 0;
                            return (
                              <tr key={st.userId}>
                                <td>
                                  <div className="mentor-student-cell">
                                    <div className="mentor-student-avatar">
                                      {getInitials(st.name)}
                                    </div>
                                    <div>
                                      <div className="mentor-student-name">{st.name}</div>
                                      <div className="mentor-student-email">{st.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="mentor-roll-badge">{st.rollNumber}</span>
                                </td>
                                <td>
                                  <span className="mentor-badge-neutral">
                                    {st.totalAssignedTasks} {st.totalAssignedTasks === 1 ? "task" : "tasks"}
                                  </span>
                                </td>
                                <td>
                                  <span className="mentor-badge-success">
                                    <CheckCircle2 size={13} />
                                    <span>{st.completedTasksCount} Completed</span>
                                  </span>
                                </td>
                                <td>
                                  {isAllDone ? (
                                    <span className="mentor-badge-success-solid">
                                      <Check size={12} />
                                      <span>All Done (0 Pending)</span>
                                    </span>
                                  ) : (
                                    <div className="mentor-pending-stack">
                                      <span className="mentor-badge-warning-solid">
                                        <Clock size={12} />
                                        <span>{st.pendingTasksCount} Pending</span>
                                      </span>
                                      {Array.isArray(st.pendingTaskTitles) && st.pendingTaskTitles.length > 0 && (
                                        <div className="mentor-pending-task-preview" title={st.pendingTaskTitles.join(", ")}>
                                          Pending: {st.pendingTaskTitles.slice(0, 2).join(", ")}
                                          {st.pendingTaskTitles.length > 2 ? ` +${st.pendingTaskTitles.length - 2} more` : ""}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td style={{ minWidth: "150px" }}>
                                  <div className="mentor-progress-wrapper">
                                    <div className="mentor-progress-head-sm">
                                      <span>{st.completionPercentage}%</span>
                                    </div>
                                    <div className="mentor-progress-track">
                                      <div
                                        className={`mentor-progress-fill ${
                                          st.completionPercentage === 100
                                            ? "mentor-progress-fill--emerald"
                                            : st.completionPercentage >= 50
                                            ? "mentor-progress-fill--indigo"
                                            : "mentor-progress-fill--amber"
                                        }`}
                                        style={{ width: `${st.completionPercentage}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDetailTab("submissions");
                                      setSearchTerm(st.name);
                                    }}
                                    className="mentor-row-btn"
                                    title={`View code submissions by ${st.name}`}
                                  >
                                    <Code2 size={13} />
                                    <span>View Submissions ({st.submissionsCount})</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : detailTab === "submissions" ? (
              /* ─── TAB 2: CODE SUBMISSIONS OF ALLOCATED STUDENTS ONLY ─── */
              <div className="mentor-tab-container">
                <div className="mentor-filter-head">
                  <div>
                    <h3 className="mentor-sub-heading">Code Submissions</h3>
                    <p className="mentor-sub-desc">
                      Submissions made by your allocated students for this batch. Click "View Code" to review their code and provide feedback.
                    </p>
                  </div>
                  <div className="mentor-controls-row">
                    <div className="mentor-search-wrapper">
                      <Search size={16} className="mentor-search-icon" />
                      <input
                        type="text"
                        placeholder="Search student, roll no, problem..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mentor-search-input"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="mentor-search-clear-btn"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="mentor-select-wrapper">
                      <Filter size={14} className="mentor-filter-icon" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="mentor-status-select"
                      >
                        <option value="all">All Results</option>
                        <option value="passed">Passed / Accepted</option>
                        <option value="partial">Partial</option>
                        <option value="error">Compilation Errors</option>
                        <option value="failed">Failed / Wrong Answer</option>
                        <option value="submitted">Submitted</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="mentor-batch-empty">
                    <Code2 size={36} />
                    <p className="mentor-batch-empty-title">No code submissions found</p>
                    <p className="mentor-batch-empty-sub">
                      {searchTerm || statusFilter !== "all"
                        ? "No code submissions matched your filter criteria."
                        : "Your allocated students have not submitted code for this batch's tasks yet."}
                    </p>
                  </div>
                ) : (
                  <div className="mentor-table-card">
                    <div className="mentor-table-responsive">
                      <table className="mentor-data-table">
                        <thead>
                          <tr>
                            <th>Student Details</th>
                            <th>Roll Number</th>
                            <th>Problem / Task</th>
                            <th>Submission Result</th>
                            <th>Marks / Score</th>
                            <th>Submitted At</th>
                            <th style={{ textAlign: "center" }}>Code Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubmissions.map((sub) => {
                            const statusLower = String(sub.status || "").toLowerCase();
                            const isPassed =
                              statusLower === "passed" ||
                              statusLower === "completed" ||
                              statusLower === "accepted";
                            const isPartial = statusLower === "partial";
                            const isError =
                              statusLower.includes("error") || statusLower.includes("compilation");

                            const statusClass = isPassed
                              ? "mentor-sub-status--passed"
                              : isPartial
                              ? "mentor-sub-status--partial"
                              : isError
                              ? "mentor-sub-status--error"
                              : "mentor-sub-status--failed";

                            const marksVal = sub.marks_obtained ?? sub.score ?? 0;
                            const maxPoints = sub.total_marks || 100;

                            return (
                              <tr key={sub.id}>
                                <td>
                                  <div className="mentor-student-cell">
                                    <div className="mentor-student-avatar mentor-student-avatar--sub">
                                      {getInitials(sub.name)}
                                    </div>
                                    <div>
                                      <div className="mentor-student-name">{sub.name || "Student"}</div>
                                      <div className="mentor-student-email">{sub.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="mentor-roll-badge">{sub.roll_number || "N/A"}</span>
                                </td>
                                <td>
                                  <div className="mentor-task-title-cell">
                                    <span className="mentor-task-name">{sub.task_title || "Assignment"}</span>
                                    <span className="mentor-task-lang-tag">
                                      {sub.language || "Java"}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`mentor-sub-status-badge ${statusClass}`}>
                                    <span className="mentor-sub-dot"></span>
                                    <span>{sub.status || "Submitted"}</span>
                                  </span>
                                </td>
                                <td>
                                  <div
                                    className="mentor-marks-text"
                                    style={{
                                      color: isPassed ? "#16a34a" : isPartial ? "#d97706" : isError ? "#dc2626" : "#475569"
                                    }}
                                  >
                                    {marksVal} / {maxPoints} pts
                                  </div>
                                  {sub.feedback && (
                                    <div className="mentor-has-feedback-badge" title={sub.feedback}>
                                      Feedback provided
                                    </div>
                                  )}
                                </td>
                                <td style={{ fontSize: "12.5px", color: "#64748b" }}>
                                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "N/A"}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCodeModal(sub)}
                                    className="mentor-view-code-btn"
                                  >
                                    <Code2 size={13} />
                                    <span>View Code</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── TAB 3: ASSIGNED TASKS ─── */
              <div className="mentor-tab-container">
                <div className="mentor-filter-head">
                  <div>
                    <h3 className="mentor-sub-heading">Curriculum Tasks</h3>
                    <p className="mentor-sub-desc">
                      All coding tasks, problems, and practice assignments assigned to this batch
                    </p>
                  </div>
                </div>

                {(!batchDetails?.tasks || batchDetails.tasks.length === 0) ? (
                  <div className="mentor-batch-empty">
                    <FileText size={36} />
                    <p className="mentor-batch-empty-title">No tasks assigned yet</p>
                    <p className="mentor-batch-empty-sub">
                      There are no active tasks registered for this batch yet.
                    </p>
                  </div>
                ) : (
                  <div className="mentor-tasks-grid">
                    {batchDetails.tasks.map((task) => {
                      const totalStudents = batchDetails?.students?.length || 1;
                      const passedCount = task.passedSubmissions || 0;
                      const pct = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;
                      return (
                        <div key={task.id} className="mentor-task-card">
                          <div className="mentor-task-card-top">
                            <span className="mentor-task-difficulty-tag mentor-task-difficulty-tag--medium">
                              {task.difficulty || "Medium"}
                            </span>
                            <span className="mentor-task-points-tag">
                              {task.points || 100} pts
                            </span>
                          </div>

                          <h4 className="mentor-task-card-title">{task.title}</h4>
                          <p className="mentor-task-card-topic">{task.topic || "General Assignment"}</p>

                          {task.deadline && (
                            <div className="mentor-task-deadline-row">
                              <Calendar size={13} />
                              <span>{task.deadline.startsWith("Due") ? task.deadline : `Due: ${task.deadline}`}</span>
                            </div>
                          )}

                          <div className="mentor-task-progress-box">
                            <div className="mentor-task-progress-labels">
                              <span>Allocated Submissions:</span>
                              <strong>
                                {passedCount} / {totalStudents} completed ({pct}%)
                              </strong>
                            </div>
                            <div className="mentor-progress-track">
                              <div
                                className="mentor-progress-fill mentor-progress-fill--indigo"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>

                          <div className="mentor-task-card-footer">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTab("submissions");
                                setSearchTerm(task.title);
                              }}
                              className="mentor-task-view-sub-btn"
                            >
                              <span>Inspect Submissions ({task.totalSubmissions || 0})</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW 2: MAIN LIST OF ALLOCATED BATCHES (CARDS)
        ───────────────────────────────────────────────────────────── */
        <>
          <div className="mentor-page-header">
            <div>
              <h2 className="mentor-page-title">
                <Code2 size={20} color="#4f46e5" />
                <span>My Allocated Batches</span>
              </h2>
              <p className="mentor-page-subtitle">
                Assigned course records, schedules, allocated students, and code submission tracking
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mentor-batch-empty">
              <Layers size={28} />
              <p className="mentor-batch-empty-title">Loading assigned batches...</p>
            </div>
          ) : safeBatches.length === 0 ? (
            <div className="mentor-batch-empty">
              <Layers size={28} />
              <p className="mentor-batch-empty-title">No records yet</p>
              <p className="mentor-batch-empty-sub">No assigned batches were returned for your account.</p>
            </div>
          ) : (
            <div className="mentor-batches-grid">
              {safeBatches.map((batch, index) => {
                const code =
                  textValue(firstValue(batch, ["code", "batchCode", "batch_code", "programCode"])) || "N/A";
                const name = textValue(firstValue(batch, ["name", "batchName", "batch_name"])) || "N/A";
                const college =
                  textValue(firstValue(batch, ["college", "collegeName", "college_name", "institution"])) || "N/A";
                const department =
                  textValue(firstValue(batch, ["department", "dept", "branch"])) || "N/A";
                const status = textValue(firstValue(batch, ["status", "state"])) || "Active";
                const enrolled =
                  getNumber(batch, [
                    "enrolledStudents",
                    "studentCount",
                    "studentsCount",
                    "totalStudents",
                    "assignedStudents"
                  ]) ?? (Array.isArray(batch.students) ? batch.students.length : 0);
                const topicsCovered = getNumber(batch, ["topicsCovered", "modulesCovered", "completedTopics"]);
                const totalTopics = getNumber(batch, ["totalTopics", "moduleCount", "topicCount"]);
                const schedule =
                  textValue(firstValue(batch, ["schedule", "classSchedule", "timing"])) || "Mon";
                const progress = getNumber(batch, [
                  "progress",
                  "completion",
                  "completionPercentage",
                  "overallProgress"
                ]);

                return (
                  <div
                    key={textValue(firstValue(batch, ["id", "batchId", "batch_id"])) || index}
                    className="mentor-batch-card-main"
                  >
                    <div className="mentor-batch-top-row">
                      <span className="mentor-batch-code-tag">{code}</span>
                      <span className="mentor-status-tag mentor-status-tag--active">{status}</span>
                    </div>

                    <div className="mentor-batch-details-block">
                      <h3 className="mentor-batch-main-title">{name}</h3>
                      <p className="mentor-batch-college-sub">{college}</p>
                      <p className="mentor-batch-dept-sub">{department}</p>
                    </div>

                    <div className="mentor-batch-stats-stack">
                      <div className="mentor-batch-stat-line">
                        <span>Enrolled Students:</span>
                        <span className="mentor-batch-stat-strong">{enrolled}</span>
                      </div>
                      <div className="mentor-batch-stat-line">
                        <span>Modules Covered:</span>
                        <span className="mentor-batch-stat-strong">
                          {topicsCovered === null || totalTopics === null
                            ? "N/A"
                            : `${topicsCovered} / ${totalTopics}`}
                        </span>
                      </div>
                      <div className="mentor-batch-stat-line">
                        <span>Class Schedule:</span>
                        <span className="mentor-batch-schedule-text">{schedule}</span>
                      </div>
                    </div>

                    <div className="mentor-progress-section">
                      <div className="mentor-progress-head">
                        <span className="mentor-progress-label">Overall Completion</span>
                        <span className="mentor-progress-val">
                          {progress === null ? "N/A" : `${progress}%`}
                        </span>
                      </div>
                      {progress === null ? null : (
                        <div className="mentor-progress-track">
                          <div
                            className="mentor-progress-fill"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Batch Action: Open Batch Option */}
                    <div className="mentor-batch-card-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenBatch(batch)}
                        className="mentor-batch-open-btn"
                      >
                        <FolderOpen size={16} />
                        <span>Open Batch & Submissions</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: VIEW CODE SUBMISSION & MENTOR REVIEW FEEDBACK
      ───────────────────────────────────────────────────────────── */}
      {viewingCodeSubmission && (
        <div className="mentor-code-modal-backdrop" onClick={() => setViewingCodeSubmission(null)}>
          <div className="mentor-code-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="mentor-code-modal-header">
              <div className="mentor-code-modal-title-wrap">
                <div className="mentor-code-modal-icon">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="mentor-code-modal-heading">
                    {viewingCodeSubmission.name || "Student"} — {viewingCodeSubmission.task_title || "Assignment"}
                  </h3>
                  <p className="mentor-code-modal-meta">
                    Submitted on{" "}
                    {viewingCodeSubmission.submitted_at
                      ? new Date(viewingCodeSubmission.submitted_at).toLocaleString()
                      : "Recently"}{" "}
                    • Language: <strong>{String(viewingCodeSubmission.language || "Java").toUpperCase()}</strong> •
                    Score: <strong>{viewingCodeSubmission.marks_obtained ?? viewingCodeSubmission.score ?? 0} pts</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCodeSubmission(null)}
                className="mentor-code-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mentor-code-modal-body">
              {/* Code Pre Box */}
              <div className="mentor-code-box">
                <div className="mentor-code-box-header">
                  <span className="mentor-code-box-lang">
                    {String(viewingCodeSubmission.language || "Java").toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        viewingCodeSubmission.code_submission || viewingCodeSubmission.submitted_code
                      )
                    }
                    className="mentor-code-copy-btn"
                  >
                    {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{codeCopied ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="mentor-code-pre">
                  <code>
                    {viewingCodeSubmission.code_submission ||
                      viewingCodeSubmission.submitted_code ||
                      "// No code submitted"}
                  </code>
                </pre>
              </div>

              {/* Mentor Code Review Feedback Section */}
              <div className="mentor-feedback-card">
                <div className="mentor-feedback-header">
                  <div className="mentor-feedback-title-row">
                    <span className="mentor-feedback-title">Instructor & Mentor Code Review Feedback</span>
                    <span className="mentor-feedback-optional-pill">Optional</span>
                  </div>
                  <p className="mentor-feedback-subtitle">
                    Provide optional comments, code quality feedback, edge-case guidance, or optimization tips for the student.
                  </p>
                </div>

                {/* Quick Feedback Suggestions */}
                <div className="mentor-quick-feedback-row">
                  {QUICK_FEEDBACK_OPTIONS.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddQuickFeedback(opt)}
                      className="mentor-quick-feedback-pill"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Feedback Input Area */}
                <textarea
                  rows={4}
                  placeholder="Enter code review feedback, recommendations, or algorithmic guidance..."
                  value={reviewFeedbackText}
                  onChange={(e) => setReviewFeedbackText(e.target.value)}
                  className="mentor-feedback-textarea"
                />

                <div className="mentor-feedback-action-row">
                  {feedbackSuccess && (
                    <span className="mentor-feedback-success-msg">
                      <Check size={14} />
                      <span>Feedback saved successfully and updated for student!</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback}
                    className="mentor-save-feedback-btn"
                  >
                    {savingFeedback ? (
                      <>
                        <RefreshCw size={14} className="mentor-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>
                          {viewingCodeSubmission.feedback ? "Update Feedback" : "Save Feedback (Optional)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mentor-code-modal-footer">
              <button
                type="button"
                onClick={() => setViewingCodeSubmission(null)}
                className="mentor-modal-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
