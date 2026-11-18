import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  CheckSquare,
  Trophy,
  ArrowLeft,
  Calendar,
  Code2,
  Trash2,
  Eye,
  Copy,
  Check,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  X
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { downloadBatchTaskReport } from "../../../utils/batchReportExporter";
import "../Styles/TR_Batches.css";

export function TrainerBatches() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("myBatches"); // 'myBatches' | 'available'
  const [myBatches, setMyBatches] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Detail view state for selected batch (Only Enrolled Students & Assigned Tasks)
  const [batchDetailTab, setBatchDetailTab] = useState("students"); // 'students' | 'assignedTasks'
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchLeaderboard, setBatchLeaderboard] = useState([]);
  const [batchTasks, setBatchTasks] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Task form state
  const initialTaskForm = {
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
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Submissions Modal State
  const [activeTaskForSubmissions, setActiveTaskForSubmissions] = useState(null);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [viewingCodeSubmission, setViewingCodeSubmission] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Load batches
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const allRes = await apiFetch("/batches");
      setAllBatches(allRes?.data || []);

      const myRes = await apiFetch("/batches/my-batches");
      setMyBatches(myRes?.data || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch details of selected batch
  const fetchBatchDetails = async (batchId) => {
    try {
      const studRes = await apiFetch(`/batches/${batchId}/students`);
      setBatchStudents(studRes?.data || []);
    } catch (_e) {
      setBatchStudents([]);
    }

    try {
      const taskRes = await apiFetch(`/batches/${batchId}/tasks`);
      setBatchTasks(taskRes?.data || []);
    } catch (_e) {
      setBatchTasks([]);
    }

    try {
      const lbRes = await apiFetch(`/leaderboard/batch?batchId=${batchId}`);
      setBatchLeaderboard(lbRes?.data || []);
    } catch (_e) {
      setBatchLeaderboard([]);
    }
  };

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    setBatchDetailTab("students");
    setFeedback({ type: "", message: "" });
    fetchBatchDetails(batch.id);
  };

  const handleDownloadTaskReport = async () => {
    if (!selectedBatch?.id) return;
    setDownloadingReport(true);
    try {
      const result = await downloadBatchTaskReport(selectedBatch.id, selectedBatch.name);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to download task submission report.",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  // Handle Task Submit
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !selectedBatch) return;

    setSubmittingTask(true);
    const newTaskObj = {
      id: Date.now(),
      batch_id: selectedBatch.id,
      title: taskForm.title,
      topic: taskForm.topic || "General Assignment",
      difficulty: taskForm.difficulty || "Medium",
      points: taskForm.points || 100,
      task_date: taskForm.taskDate,
      deadline: taskForm.deadline || "",
      description: taskForm.desc || "",
      language: taskForm.language || "Java",
      testCases: taskForm.testCases || [],
    };

    setBatchTasks((prev) => [newTaskObj, ...prev]);

    try {
      await apiFetch(`/batches/${selectedBatch.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          batch_id: selectedBatch.id,
          task_date: taskForm.taskDate,
          ...taskForm,
        }),
      });
      setFeedback({
        type: "success",
        message: `Task "${taskForm.title}" successfully assigned to batch "${selectedBatch.name}"!`,
      });
      setTaskForm(initialTaskForm);
      setBatchDetailTab("assignedTasks");
      const refreshed = await apiFetch(`/batches/${selectedBatch.id}/tasks`);
      setBatchTasks(refreshed?.data || []);
    } catch (err) {
      console.error("Failed to assign task:", err);
      setFeedback({
        type: "error",
        message: err?.message || `Failed to assign task "${taskForm.title}".`,
      });
      const refreshed = await apiFetch(`/batches/${selectedBatch.id}/tasks`);
      setBatchTasks(refreshed?.data || []);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? All student submissions will be permanently deleted.")) {
      return;
    }
    setBatchTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiFetch(`/batches/tasks/${taskId}`, { method: "DELETE" });
      setFeedback({ type: "success", message: "Task deleted successfully!" });
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to delete task." });
      const refreshed = await apiFetch(`/batches/${selectedBatch.id}/tasks`);
      setBatchTasks(refreshed?.data || []);
    }
  };

  // Handle View Submissions Modal
  const handleViewSubmissions = async (task) => {
    setActiveTaskForSubmissions(task);
    setLoadingSubmissions(true);
    setTaskSubmissions([]);
    try {
      const res = await apiFetch(`/batches/tasks/${task.id}/submissions`);
      setTaskSubmissions(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch task submissions:", err);
      setTaskSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Add/Remove Test Cases
  const handleAddTestCase = () => {
    setTaskForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: false }],
    }));
  };

  const handleRemoveTestCase = (index) => {
    setTaskForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setTaskForm((prev) => {
      const updated = [...prev.testCases];
      updated[index][field] = value;
      return { ...prev, testCases: updated };
    });
  };

  const filteredMyBatches = myBatches.filter((b) =>
    (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.code || b.join_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myBatchIds = new Set(myBatches.map((b) => b.id));
  const availableBatches = allBatches.filter((b) => !myBatchIds.has(b.id));
  const filteredAvailable = availableBatches.filter((b) =>
    (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.code || b.join_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═════════════════════════════════════════════════════════════════
  // 1. DETAIL VIEW: WHEN A BATCH IS SELECTED
  // ═════════════════════════════════════════════════════════════════
  if (selectedBatch) {
    return (
      <div className="trainer-batches-container">
        {/* Top Back & Header */}
        <div className="trainer-detail-top-nav">
          <button
            type="button"
            className="trainer-btn-outline"
            onClick={() => setSelectedBatch(null)}
          >
            <ArrowLeft size={16} /> Back to All Batches
          </button>
          <span className="trainer-batch-code-pill">
            Code: {selectedBatch.code || selectedBatch.join_code || (selectedBatch.id ? `B-${selectedBatch.id}` : '—')}
          </span>
        </div>

        {/* Selected Batch Hero Header */}
        <div className="trainer-batch-hero">
          <div>
            <div className="trainer-batch-hero-title-row">
              <h2 className="trainer-batch-hero-title">{selectedBatch.name}</h2>
              <span className="trainer-batch-hero-status-pill">
                Trainer Assigned
              </span>
            </div>
            <p className="trainer-batch-hero-sub">
              Schedule: <strong>{selectedBatch.schedule || "—"}</strong>
              {[selectedBatch.year, selectedBatch.division].filter(Boolean).length > 0 && (
                <> • Year/Div: <strong>{[selectedBatch.year, selectedBatch.division].filter(Boolean).join(' ')}</strong></>
              )}
            </p>
          </div>

          <div className="trainer-batch-hero-actions">
            <button
              type="button"
              className="trainer-btn-outline"
              onClick={handleDownloadTaskReport}
              disabled={downloadingReport}
              title="Download Task Submission Report (.xlsx)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                color: "#059669",
                borderColor: "#a7f3d0",
                fontWeight: "700",
                cursor: downloadingReport ? "not-allowed" : "pointer"
              }}
            >
              <FileSpreadsheet size={16} />
              {downloadingReport ? "Generating Report..." : "Download Report"}
            </button>
            <button
              type="button"
              className="trainer-btn-primary trainer-btn-hero-assign"
              onClick={() => navigate("/trainer/tasks")}
            >
              <Plus size={16} /> Assign New Task
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            className={`trainer-feedback-banner ${
              feedback.type === "success"
                ? "trainer-feedback-banner--success"
                : "trainer-feedback-banner--error"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Sub-Tabs Navigation (Only Enrolled Students & Assigned Tasks) */}
        <div className="trainer-tabs-bar">
          <button
            type="button"
            className={`trainer-tab-btn ${batchDetailTab === "students" ? "active" : ""}`}
            onClick={() => setBatchDetailTab("students")}
          >
            <Users size={17} /> Enrolled Students ({batchStudents.length})
          </button>
          <button
            type="button"
            className={`trainer-tab-btn ${batchDetailTab === "assignedTasks" ? "active" : ""}`}
            onClick={() => setBatchDetailTab("assignedTasks")}
          >
            <CheckSquare size={17} /> Assigned Tasks ({batchTasks.length})
          </button>
        </div>

        {/* TAB 1: Assigned Tasks */}
        {batchDetailTab === "assignedTasks" && (
          <div className="trainer-tasks-list-wrap">
            <div className="trainer-tasks-list-header">
              <h3 className="trainer-tasks-list-title">
                Assigned Tasks for {selectedBatch.name}
              </h3>
              <button
                type="button"
                className="trainer-btn-primary trainer-btn-compact"
                onClick={() => navigate("/trainer/tasks")}
              >
                <Plus size={15} /> Add Task
              </button>
            </div>

            {batchTasks.length === 0 ? (
              <div className="trainer-task-empty-card">
                <Code2 size={42} className="trainer-task-empty-icon" />
                <h4 className="trainer-task-empty-title">
                  No tasks assigned to this batch yet
                </h4>
                <p className="trainer-task-empty-sub">
                  Create practice problems and coding assignments for students in {selectedBatch.name}.
                </p>
                <button
                  type="button"
                  className="trainer-btn-primary"
                  onClick={() => navigate("/trainer/tasks")}
                >
                  <Plus size={16} /> Create First Batch Task
                </button>
              </div>
            ) : (
              <div className="trainer-tasks-cards-list">
                {batchTasks.map((task) => (
                  <div key={task.id} className="trainer-task-item-card">
                    <div className="trainer-task-item-top">
                      <div>
                        <div className="trainer-task-item-meta-row">
                          <h4 className="trainer-task-item-title">
                            {task.title}
                          </h4>
                          <span
                            className={`trainer-task-diff-badge ${
                              task.difficulty === "Easy"
                                ? "trainer-task-diff-badge--easy"
                                : task.difficulty === "Hard"
                                ? "trainer-task-diff-badge--hard"
                                : "trainer-task-diff-badge--medium"
                            }`}
                          >
                            {task.difficulty || "Medium"}
                          </span>
                          <span className="trainer-task-lang-badge">
                            {task.language || "Java"}
                          </span>
                        </div>
                        <p className="trainer-task-item-sub">
                          Topic: <strong>{task.topic || "General Assignment"}</strong> • Points:{" "}
                          <strong>{task.points || 100} pts</strong>
                          {task.deadline && ` • Due: ${task.deadline}`}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="trainer-task-item-actions">
                        <button
                          type="button"
                          className="trainer-btn-primary trainer-btn-compact"
                          onClick={() => handleViewSubmissions(task)}
                        >
                          <Eye size={15} /> View Submissions
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="trainer-task-delete-btn"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="trainer-task-desc-text">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* TAB 3: Enrolled Students */}
        {batchDetailTab === "students" && (
          <div className="trainer-roster-card">
            <div className="trainer-roster-header">
              <h3 className="trainer-roster-title">
                Enrolled Students in {selectedBatch.name}
              </h3>
            </div>
            {batchStudents.length === 0 ? (
              <div className="trainer-roster-empty">
                No students enrolled in this batch yet.
              </div>
            ) : (
              <div className="trainer-table-responsive">
                <table className="trainer-table">
                  <thead>
                    <tr className="trainer-table-head-row">
                      <th className="trainer-th">Roll No</th>
                      <th className="trainer-th">Student Name</th>
                      <th className="trainer-th">Email</th>
                      <th className="trainer-th">Department</th>
                      <th className="trainer-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchStudents.map((st, i) => (
                      <tr key={st.id || i} className="trainer-table-row">
                        <td className="trainer-td-roll">
                          {st.roll_number || st.rollNumber || `STU-${st.id}`}
                        </td>
                        <td className="trainer-td-name">{st.name || "Student"}</td>
                        <td className="trainer-td-email">{st.email || "—"}</td>
                        <td className="trainer-td-dept">{st.department || "—"}</td>
                        <td className="trainer-td">
                          <span className="trainer-status-badge--active">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SUBMISSIONS MODAL
           ═══════════════════════════════════════════════════════════════ */}
        {activeTaskForSubmissions && (
          <div className="trainer-modal-backdrop" onClick={() => setActiveTaskForSubmissions(null)}>
            <div className="trainer-modal-box large" onClick={(e) => e.stopPropagation()}>
              <div className="trainer-modal-header">
                <div>
                  <h3 className="trainer-modal-title">Submissions: {activeTaskForSubmissions.title}</h3>
                  <span className="trainer-modal-header-sub">
                    Batch: {selectedBatch.name} • Total Marks: {activeTaskForSubmissions.points || 100} pts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTaskForSubmissions(null)}
                  className="trainer-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="trainer-modal-body trainer-modal-body--compact">
                {loadingSubmissions ? (
                  <div className="trainer-sub-loading">
                    Loading student submissions...
                  </div>
                ) : taskSubmissions.length === 0 ? (
                  <div className="trainer-sub-empty">
                    <CheckSquare size={38} className="trainer-sub-empty-icon" />
                    <h4 className="trainer-sub-empty-title">
                      No submissions received yet
                    </h4>
                    <p className="trainer-sub-empty-sub">
                      When students write and submit their solutions in the coding compiler, their code and scores will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="trainer-table-responsive">
                    <table className="trainer-table">
                      <thead>
                        <tr className="trainer-table-head-row">
                          <th className="trainer-sub-th">Student</th>
                          <th className="trainer-sub-th">Roll No</th>
                          <th className="trainer-sub-th">Status</th>
                          <th className="trainer-sub-th">Score</th>
                          <th className="trainer-sub-th">Submitted At</th>
                          <th className="trainer-sub-th">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskSubmissions.map((sub, idx) => (
                          <tr key={sub.id || idx} className="trainer-table-row">
                            <td className="trainer-sub-td--student">
                              {sub.name || "Student"}
                            </td>
                            <td className="trainer-sub-td--roll">
                              {sub.roll_number || "—"}
                            </td>
                            <td className="trainer-sub-td">
                              <span
                                className={`trainer-sub-status-badge ${
                                  (sub.status || "").toLowerCase() === "passed" || (sub.status || "").toLowerCase() === "completed"
                                    ? "trainer-sub-status-badge--passed"
                                    : (sub.status || "").toLowerCase() === "partial"
                                    ? "trainer-sub-status-badge--partial"
                                    : "trainer-sub-status-badge--failed"
                                }`}
                              >
                                {sub.status || "Submitted"}
                              </span>
                            </td>
                            <td className="trainer-sub-score">
                              {sub.marks_obtained ?? sub.score ?? 0} / {activeTaskForSubmissions.points || 100}
                            </td>
                            <td className="trainer-sub-date">
                              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "Recently"}
                            </td>
                            <td className="trainer-sub-td">
                              <button
                                type="button"
                                className="trainer-btn-outline"
                                onClick={() => setViewingCodeSubmission(sub)}
                              >
                                <Code2 size={13} /> View Code
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="trainer-btn-outline"
                  onClick={() => setActiveTaskForSubmissions(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            CODE VIEWER MODAL
           ═══════════════════════════════════════════════════════════════ */}
        {viewingCodeSubmission && (
          <div className="trainer-modal-backdrop--high" onClick={() => setViewingCodeSubmission(null)}>
            <div className="trainer-modal-box large" onClick={(e) => e.stopPropagation()}>
              <div className="trainer-code-viewer-header">
                <div>
                  <h3 className="trainer-code-viewer-title">
                    Solution Code: {viewingCodeSubmission.name || "Student"}
                  </h3>
                  <span className="trainer-code-viewer-sub">
                    Task: {activeTaskForSubmissions?.title} • Score: {viewingCodeSubmission.marks_obtained ?? viewingCodeSubmission.score ?? 0} pts
                  </span>
                </div>
                <div className="trainer-code-viewer-actions">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(viewingCodeSubmission.code_submission || viewingCodeSubmission.submitted_code || "");
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="trainer-code-copy-btn"
                  >
                    {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                    {codeCopied ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingCodeSubmission(null)}
                    className="trainer-code-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="trainer-code-viewer-body">
                <pre className="trainer-code-pre">
                  {viewingCodeSubmission.code_submission || viewingCodeSubmission.submitted_code || "// No code content captured."}
                </pre>
              </div>

              {viewingCodeSubmission.feedback && (
                <div className="trainer-code-feedback-bar">
                  <strong>Evaluator Feedback:</strong> {viewingCodeSubmission.feedback}
                </div>
              )}

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="trainer-btn-outline"
                  onClick={() => setViewingCodeSubmission(null)}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. MAIN BATCH EXPLORER VIEW (My Batches & Available Batches)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="trainer-batches-container">
      {/* Header */}
      <div className="trainer-header-row">
        <div className="trainer-header-title-group">
          <div className="trainer-page-icon-box">
            <Users size={22} />
          </div>
          <div>
            <h1 className="trainer-page-title">Training Batches</h1>
            <p className="trainer-page-sub">
              Manage assigned batches, monitor enrolled students, and assign tasks with test cases.
            </p>
          </div>
        </div>

        <div className="trainer-header-actions">
          <div className="trainer-search-wrap">
            <Search size={16} className="trainer-search-icon" />
            <input
              type="text"
              placeholder="Search batches by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="trainer-search-input"
            />
          </div>
        </div>
      </div>

      {/* JOINED BATCHES LIST */}
      <div>
        {loading ? (
          <div className="trainer-loading-state">Loading your batches...</div>
        ) : filteredMyBatches.length === 0 ? (
          <div className="trainer-task-empty-card">
            <Users size={44} className="trainer-task-empty-icon" />
            <h3 className="trainer-empty-state-title">
              No assigned batches found
            </h3>
            <p className="trainer-empty-state-desc">
              You are not currently assigned to any batches. Batches assigned to you by your Administrator will appear here.
            </p>
          </div>
        ) : (
          <div className="trainer-batch-grid">
            {filteredMyBatches.map((batch) => (
              <div key={batch.id} className="trainer-batch-card">
                <div className="trainer-batch-card-header">
                  <div>
                    <h3 className="trainer-batch-name">{batch.name}</h3>
                    <div className="trainer-batch-meta">
                      <Calendar size={13} /> {batch.schedule || "Mon, Wed, Fri"}
                    </div>
                  </div>
                  <span className="trainer-batch-badge joined">Joined</span>
                </div>

                <div className="trainer-batch-stats-row">
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val">
                      {batch.dynamicStudentsCount || batch.students || 0}
                    </span>
                    <span className="trainer-batch-stat-lbl">Enrolled Students</span>
                  </div>
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val">{batch.tasksCount || 0}</span>
                    <span className="trainer-batch-stat-lbl">Batch Tasks</span>
                  </div>
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val trainer-text-accent">
                      {batch.progress || 0}%
                    </span>
                    <span className="trainer-batch-stat-lbl">Progress</span>
                  </div>
                </div>

                <div className="trainer-batch-meta-bottom">
                  <span className="trainer-batch-code-pill">
                    Code: {batch.code || batch.join_code || (batch.id ? `B-${batch.id}` : '—')}
                  </span>
                  {[batch.year, batch.division].filter(Boolean).length > 0 && (
                    <span className="trainer-batch-dept-text">
                      {[batch.year, batch.division].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>

                <div className="trainer-batch-card-actions">
                  <button
                    type="button"
                    className="trainer-btn-primary trainer-batch-open-btn"
                    onClick={() => handleSelectBatch(batch)}
                  >
                    Open Batch Workspace <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerBatches;
