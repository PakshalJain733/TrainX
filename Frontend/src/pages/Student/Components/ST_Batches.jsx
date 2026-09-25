import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  ArrowUpRight,
  Code2,
  Database,
  Layers,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Video,
  PlayCircle,
  Trophy,
  AlertCircle,
  Clock3,
  CalendarDays,
  CheckSquare,
  Square,
  Award,
  Flame,
  Check,
  Plus,
  X,
  KeyRound,
  Loader2
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/ST_Batches.css";

const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = (sessionStorage.getItem("token") || (sessionStorage.getItem("token") || localStorage.getItem("token"))) || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Built-in catalog details map to enrich API batches
const defaultBatchTemplates = [];

function mapApiBatch(b) {
  const code = b.join_code || b.code || `BATCH-${b.id}`;

  return {
    id: b.id || `batch-${b.id}`,
    title: b.name || b.title,
    code: code,
    track: b.track || "Training Cohort",
    trainer: b.mentor || b.trainer || "Faculty Lead",
    timing: b.schedule || b.timing || "Regular Sessions",
    studentsEnrolled: b.students || b.studentsEnrolled || 1,
    progress: b.progress || 0,
    status: b.status === "active" ? "Active" : b.status || "Active",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: Code2,
    description: b.description || `${b.name} training cohort curriculum and assignments.`,
    stats: { completedTasks: 0, pendingTasks: 0, urgentTaskNumber: "None", urgentTaskDeadline: "No Deadline" },
    leaderboard: [
      { rank: 1, name: "Student (You)", xp: 0, initials: "ST", self: true },
    ],
    modules: [],
    apiTasks: [],
  };
}

export default function Batches() {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Fetch enrolled batches from backend API
  const fetchMyBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/batches/my-batches`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map(mapApiBatch);
        setEnrolledBatches(mapped);
      } else {
        setEnrolledBatches([]);
      }
    } catch (err) {
      console.error("Failed to load enrolled batches:", err);
      setEnrolledBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle batch selection and load assigned tasks dynamically
  const handleOpenBatch = async (batch) => {
    setSelectedBatch(batch);
    try {
      const res = await fetch(`${API_BASE}/batches/${batch.id}/tasks`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const customTasks = data.data.map((t, idx) => ({
          id: t.id,
          taskNumber: `Task ${String(idx + 1).padStart(2, "0")}`,
          title: t.title,
          type: `${t.difficulty || "Medium"} · ${t.topic || "Assignment"} (${t.points || 100} XP)`,
          due: t.deadline ? `Due ${t.deadline}` : "No Deadline",
          status: t.status || "Pending",
          platform: t.platform || "coding",
        }));
        setSelectedBatch((prev) => ({
          ...prev,
          apiTasks: customTasks,
          stats: {
            ...prev.stats,
            pendingTasks: customTasks.filter(t => t.status !== "Completed").length,
            completedTasks: customTasks.filter(t => t.status === "Completed").length,
            urgentTaskNumber: customTasks.length > 0 ? customTasks[0].taskNumber : "None",
            urgentTaskDeadline: customTasks.length > 0 ? customTasks[0].due : "No Deadline",
          }
        }));
      }
    } catch (err) {
      console.error("Failed to load batch tasks:", err);
    }
  };

  useEffect(() => {
    fetchMyBatches();
  }, []);

  // Handle batch join submission
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setModalError("Please enter a valid batch code.");
      return;
    }

    setJoining(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`${API_BASE}/batches/join`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ join_code: joinCodeInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setModalSuccess(data.message || "Successfully joined batch!");
        setJoinCodeInput("");
        await fetchMyBatches();
        setTimeout(() => {
          setShowJoinModal(false);
          setModalSuccess("");
        }, 1500);
      } else {
        setModalError(data.message || "Failed to join batch. Please check code.");
      }
    } catch (err) {
      setModalError("Server connection error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (selectedBatch) {
    const Icon = selectedBatch.icon;
    const batchTasksList = selectedBatch.apiTasks || selectedBatch.modules.flatMap(m => m.tasks);
    const totalBatchTasks = batchTasksList.length;
    return (
      <div className="student-page-inner coursework-view-container">
        <button
          type="button"
          className="coursework-back-btn"
          onClick={() => setSelectedBatch(null)}
        >
          <ArrowLeft size={16} />
          <span>Back to My Batches</span>
        </button>

        {/* Coursework Banner */}
        <div className="coursework-header-banner">
          <div className="coursework-header-left">
            <div
              className="coursework-header-icon"
              style={{ background: selectedBatch.bg, color: selectedBatch.color }}
            >
              <Icon size={28} />
            </div>
            <div>
              <h2 className="coursework-header-title">{selectedBatch.title}</h2>
              <p className="coursework-header-subtitle">
                {selectedBatch.code} · Instructor: {selectedBatch.trainer} · {selectedBatch.timing}
              </p>
            </div>
          </div>

          <div className="coursework-header-meta">
            <div className="coursework-meta-stat">
              <span className="coursework-meta-stat-label">Syllabus Progress</span>
              <span className="coursework-meta-stat-value">{selectedBatch.progress}%</span>
            </div>
            <div className="coursework-meta-stat">
              <span className="coursework-meta-stat-label">Batch Status</span>
              <Badge variant={selectedBatch.status === "Active" ? "primary" : "success"}>
                {selectedBatch.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* 4 KPI Stats Row */}
        <div className="cw-stats-row">
          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--emerald">
              <CheckCircle2 size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Completed Tasks</p>
              <h4 className="cw-stat-value">{selectedBatch.stats.completedTasks}</h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--amber">
              <Clock3 size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Pending Tasks</p>
              <h4 className="cw-stat-value">{selectedBatch.stats.pendingTasks}</h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--blue">
              <CheckSquare size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">Task Completion Rate</p>
              <h4 className="cw-stat-value">
                {totalBatchTasks > 0 ? Math.round((selectedBatch.stats.completedTasks / totalBatchTasks) * 100) : 100}%
              </h4>
            </div>
          </div>

          <div className="cw-stat-card">
            <div className="cw-stat-icon-wrap cw-stat-icon--red">
              <AlertCircle size={20} />
            </div>
            <div className="cw-stat-info-col">
              <p className="cw-stat-label">
                Next Deadline ({selectedBatch.stats.urgentTaskNumber})
              </p>
              <div className="cw-stat-due-wrapper">
                <span className="cw-stat-due-text">
                  {selectedBatch.stats.urgentTaskDeadline}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Split Arena */}
        <div className="cw-content-split-grid">
          <div className="cw-left-pane">
            <div className="cw-unified-container">
              <div className="cw-unified-header">
                <div className="cw-unified-title-wrap">
                  <BookOpen size={20} className="cw-unified-title-icon" />
                  <h3 className="cw-unified-title">Coursework & Tasks</h3>
                </div>
                <Badge variant="primary">{totalBatchTasks} Total Tasks Assigned</Badge>
              </div>

              <div className="cw-unified-modules-stack">
                <div className="cw-module-items-stack">
                  {batchTasksList.length === 0 ? (
                    <div className="admin-empty-state-card" style={{ padding: "40px 20px" }}>
                      <BookOpen size={36} className="admin-empty-state-icon" style={{ margin: "0 auto 8px" }} />
                      <p className="admin-empty-state-title">No tasks currently assigned</p>
                      <p className="admin-empty-state-sub">Your mentor/admin will post new problem sets and assignments here.</p>
                    </div>
                  ) : (
                    batchTasksList.map((task, idx) => {
                      const taskSlug = task.taskNumber.replace(/\s+/g, '-').toLowerCase();
                      const platform = task.platform || "coding";
                      let taskHref = `/student/coding-platform/${taskSlug}`;
                      if (platform === "mcq") taskHref = `/student/quiz`;
                      else if (platform === "gd") taskHref = `/student/ai-interview`;
                      else if (platform === "submission") taskHref = `/student/coding-platform`;

                      return (
                        <Link
                          to={taskHref}
                          state={{ task }}
                          key={idx}
                          className={`cw-item-row ${task.urgent ? "cw-item-row--urgent" : ""}`}
                        >
                          <div className="cw-item-left">
                            <span className="cw-task-num-badge">{task.taskNumber}</span>
                            {task.status === "Completed" ? (
                              <CheckCircle2 size={18} className="cw-item-icon-done" />
                            ) : (
                              <Clock3 size={18} className="cw-item-icon-pending" />
                            )}
                            <div className="cw-item-title-col">
                              <h5 className="cw-item-title">{task.title}</h5>
                              <p className="cw-item-meta-sub">
                                <span>{task.type}</span>
                                <span>•</span>
                                <span className={task.urgent ? "cw-item-due--urgent" : ""}>
                                  {task.due}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="cw-item-right">
                            <Badge
                              variant={
                                task.status === "Completed"
                                  ? "success"
                                  : task.urgent
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="cw-right-pane">
            <div className="cw-leaderboard-card">
              <div className="cw-section-header-row">
                <div className="cw-lb-title-wrap">
                  <Trophy size={18} className="cw-lb-icon" />
                  <h3 className="cw-section-title">Cohort Leaderboard</h3>
                </div>
                <Badge variant="outline">Top Performers</Badge>
              </div>

              <div className="cw-lb-list">
                {selectedBatch.leaderboard.map((student) => (
                  <div
                    key={student.rank}
                    className={`cw-lb-item ${student.self ? "cw-lb-item--self" : ""}`}
                  >
                    <div className="cw-lb-item-left">
                      <span className={`cw-lb-rank ${student.rank <= 3 ? "cw-lb-rank--top" : ""}`}>
                        #{student.rank}
                      </span>
                      <div className={`cw-lb-avatar ${student.self ? "cw-lb-avatar--self" : ""}`}>
                        {student.initials}
                      </div>
                      <span className="cw-lb-name">{student.name}</span>
                    </div>

                    <span className="cw-lb-xp">{student.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page-inner batches-page-container">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <Code2 size={22} style={{ color: "#4f46e5" }} />
          <span>Enrolled Training Batches</span>
        </h2>
        <p className="student-header-desc">
          View your active C2C cohorts, faculty-led sessions, curriculum completion rates, and learning resources.
        </p>
      </div>

      {/* Summary KPI Bar */}
      <div className="batches-summary-grid">
        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--blue">
            <Users size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Total Enrolled</p>
            <h4 className="batches-summary-val">{enrolledBatches.length} Batch{enrolledBatches.length !== 1 ? "es" : ""}</h4>
          </div>
        </div>

        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--emerald">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Average Completion</p>
            <h4 className="batches-summary-val">{enrolledBatches.length > 0 ? "78%" : "0%"}</h4>
          </div>
        </div>

        <div className="batches-summary-card">
          <div className="batches-summary-icon-box batches-summary-icon-box--purple">
            <Clock size={22} />
          </div>
          <div>
            <p className="batches-summary-label">Weekly Hours</p>
            <h4 className="batches-summary-val">{enrolledBatches.length > 0 ? "12 Hours / Wk" : "0 Hours"}</h4>
          </div>
        </div>
      </div>

      {/* Batches Content / Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading enrolled batches...
        </div>
      ) : enrolledBatches.length === 0 ? (
        /* Empty state when student is not enrolled in any batch */
        <div className="batches-empty-state">
          <div className="batches-empty-icon">
            <Users size={28} />
          </div>
          <h3 className="batches-empty-title">You Have Not Joined Any Batch Yet</h3>
          <p className="batches-empty-desc">
            To view your training curriculum, faculty sessions, and assignments, enter your batch join code provided by your admin or faculty lead.
          </p>
          <button
            type="button"
            className="join-batch-header-btn"
            style={{ marginTop: "8px" }}
            onClick={() => {
              setModalError("");
              setModalSuccess("");
              setShowJoinModal(true);
            }}
          >
            <KeyRound size={16} /> Join a Batch Now
          </button>
        </div>
      ) : (
        /* Enrolled Batches Grid */
        <div className="batches-cards-grid">
          {enrolledBatches.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.id} className="batch-card" style={{ "--accent-color": b.color, "--accent-bg": b.bg }}>
                <div>
                  <div className="batch-card-top">
                    <div
                      className="batch-card-icon-wrap"
                      style={{ background: b.bg, color: b.color }}
                    >
                      <Icon size={22} />
                    </div>
                    <Badge
                      variant={b.status === "Active" ? "primary" : "success"}
                      className="batch-card-status-badge"
                    >
                      {b.status}
                    </Badge>
                  </div>

                  <h3 className="batch-card-title">{b.title}</h3>
                  <p className="batch-card-desc">{b.description}</p>
                </div>

                <div className="batch-meta-list">
                  <div className="batch-meta-item">
                    <span className="batch-meta-label">
                      <BookOpen size={14} /> Batch Code
                    </span>
                    <span className="batch-meta-value">{b.code}</span>
                  </div>

                  <div className="batch-meta-item">
                    <span className="batch-meta-label">
                      <Users size={14} /> Instructor
                    </span>
                    <span className="batch-meta-value">{b.trainer}</span>
                  </div>

                  <div className="batch-meta-item">
                    <span className="batch-meta-label">
                      <Calendar size={14} /> Schedule
                    </span>
                    <span className="batch-meta-value">{b.timing}</span>
                  </div>
                </div>

                <div className="batch-progress-section">
                  <div className="batch-progress-top">
                    <span className="batch-progress-label">Syllabus Progress</span>
                    <span className="batch-progress-pct">{b.progress}%</span>
                  </div>
                  <div className="batch-progress-bar-bg">
                    <div
                      className="batch-progress-bar-fill"
                      style={{
                        width: `${b.progress}%`,
                        background:
                          b.status === "Completed"
                            ? "linear-gradient(90deg, #059669 0%, #10b981 100%)"
                            : "linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)",
                      }}
                    />
                  </div>
                </div>

                <div className="batch-card-actions">
                  <button
                    type="button"
                    className="batch-open-btn"
                    onClick={() => handleOpenBatch(b)}
                  >
                    <span>Open Coursework</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Join Batch Flash Overlay Modal ───────────────────────── */}
      {showJoinModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Join a Training Batch</h2>
                  <p className="modal-subtitle">Enter secret join access code assigned to your cohort.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowJoinModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit}>
              <div className="modal-body">
                {modalError && <div className="modal-feedback-alert modal-feedback--error">{modalError}</div>}
                {modalSuccess && <div className="modal-feedback-alert modal-feedback--success">{modalSuccess}</div>}

                <div className="form-group-admin">
                  <label>Enter Batch Join Code *</label>
                  <input
                    type="text"
                    className="form-input-admin"
                    placeholder="e.g. BTCH-D3BX"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowJoinModal(false)}
                  disabled={joining}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Joining...
                    </>
                  ) : (
                    "Join Batch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

