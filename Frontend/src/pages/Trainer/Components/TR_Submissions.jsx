import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  MessageSquare,
  X,
  Send,
  Code2,
  Filter,
  Layers
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/TR_Submissions.css";

export function TrainerSubmissions() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal Review & Feedback State
  const [reviewModalSub, setReviewModalSub] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackMarks, setFeedbackMarks] = useState(100);
  const [feedbackStatus, setFeedbackStatus] = useState("Reviewed");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // 1. Fetch Trainer's Joined Batches
  useEffect(() => {
    const fetchJoinedBatches = async () => {
      try {
        const res = await apiFetch("/batches/my-batches");
        const list = res?.data || (Array.isArray(res) ? res : []);
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId(String(list[0].id));
        }
      } catch (_e) {
        setBatches([]);
      }
    };
    fetchJoinedBatches();
  }, []);

  // 2. Fetch Submissions for the Selected Batch
  const fetchBatchSubmissions = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/batches/${batchId}/submissions`);
      const list = res?.data || (Array.isArray(res) ? res : []);
      setSubmissions(list);
    } catch (_e) {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchSubmissions(selectedBatchId);
    }
  }, [selectedBatchId]);

  // Open Feedback Modal
  const handleOpenReview = (sub) => {
    setReviewModalSub(sub);
    setFeedbackText(sub.feedback || "");
    setFeedbackMarks(sub.marks_obtained !== undefined ? sub.marks_obtained : (sub.score || 100));
    setFeedbackStatus(sub.status || "Reviewed");
    setFeedbackMessage("");
  };

  // Submit Feedback
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!reviewModalSub) return;

    setSavingFeedback(true);
    try {
      const payload = {
        feedback: feedbackText,
        marks_obtained: Number(feedbackMarks),
        score: Number(feedbackMarks),
        status: feedbackStatus,
        submission_type: reviewModalSub.submission_type || "batch_task"
      };

      const res = await apiFetch(`/batches/submissions/${reviewModalSub.id}/feedback`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res?.success || res?.status === "success") {
        setFeedbackMessage("Feedback and evaluation saved successfully!");
        // Update local list
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === reviewModalSub.id
              ? {
                  ...s,
                  feedback: feedbackText,
                  marks_obtained: Number(feedbackMarks),
                  score: Number(feedbackMarks),
                  status: feedbackStatus
                }
              : s
          )
        );

        setTimeout(() => {
          setReviewModalSub(null);
          setFeedbackMessage("");
        }, 1200);
      } else {
        alert(res?.message || "Failed to save feedback");
      }
    } catch (err) {
      alert(err?.message || "Error submitting review feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.student_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.roll_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.student_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.task_title || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (sub.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const selectedBatch = batches.find((b) => String(b.id) === String(selectedBatchId));

  return (
    <div className="trainer-submissions-container">
      {/* Header */}
      <div className="trainer-submissions-header-row">
        <div className="trainer-submissions-title-group">
          <div className="trainer-submissions-icon-box">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h1 className="trainer-submissions-page-title">Batch Student Submissions</h1>
            <p className="trainer-submissions-page-sub">
              Inspect student code submissions for each batch, review test case performance, and provide evaluations.
            </p>
          </div>
        </div>

        {/* Batch Selector */}
        {batches.length > 0 && (
          <div className="trainer-batch-selector-box">
            <span className="trainer-batch-selector-label">
              <Layers size={15} className="trainer-selector-icon" /> Select Batch:
            </span>
            <div className="trainer-batch-selector-dropdown">
              <CustomSelect
                value={selectedBatchId}
                onChange={(val) => setSelectedBatchId(val)}
                options={batches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="Select Batch..."
                className="trainer-header-select"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="trainer-submissions-filter-bar">
        <div className="trainer-filter-item">
          <Filter size={15} className="trainer-text-muted" />
          <label className="trainer-filter-label">Status Filter:</label>
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: "All Submissions" },
              { value: "Accepted", label: "Accepted" },
              { value: "Reviewed", label: "Reviewed" },
              { value: "Pending", label: "Pending Review" },
              { value: "Needs Improvement", label: "Needs Improvement" },
              { value: "Wrong Answer", label: "Wrong Answer" },
            ]}
            placeholder="Filter by Status..."
            className="trainer-custom-select"
          />
        </div>

        <div className="trainer-submissions-search-wrap">
          <Search size={15} className="trainer-text-muted" />
          <input
            type="text"
            placeholder="Search student, roll no, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="trainer-submissions-search-input"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="trainer-submissions-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading submissions for {selectedBatch?.name || "batch"}...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <FileCheck2 size={44} style={{ color: "#94a3b8", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
              No submissions found for {selectedBatch?.name || "this batch"}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              When students complete and submit batch tasks, their code and scores will appear here.
            </p>
          </div>
        ) : (
          <div className="trainer-submissions-table-wrap">
            <table className="trainer-submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Task / Problem</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Feedback</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const isAccepted = (sub.status || "").toLowerCase().includes("accept") || (sub.status || "").toLowerCase() === "passed";
                  const isWrong = (sub.status || "").toLowerCase().includes("wrong") || (sub.status || "").toLowerCase().includes("fail");
                  const isReviewed = (sub.status || "").toLowerCase().includes("review");

                  return (
                    <tr key={`${sub.id}-${sub.submission_type || "task"}`}>
                      <td>
                        <div className="trainer-student-cell">
                          <span className="trainer-student-name">{sub.student_name || "Student"}</span>
                          <span className="trainer-student-meta">
                            {sub.roll_number ? `Roll: ${sub.roll_number} • ` : ""}{sub.student_email || ""}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="trainer-task-title-cell">
                          <strong>{sub.task_title || "Assignment"}</strong>
                          <span className="trainer-sub-lang-pill">{sub.language || "Java"}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`trainer-sub-status-pill ${
                            isAccepted
                              ? "trainer-sub-status-pill--accepted"
                              : isWrong
                              ? "trainer-sub-status-pill--wrong"
                              : isReviewed
                              ? "trainer-sub-status-pill--reviewed"
                              : "trainer-sub-status-pill--pending"
                          }`}
                        >
                          {isAccepted && <CheckCircle2 size={12} />}
                          {isWrong && <AlertCircle size={12} />}
                          {sub.status || "Submitted"}
                        </span>
                      </td>

                      <td>
                        <span className="trainer-score-badge">
                          {sub.marks_obtained !== undefined ? sub.marks_obtained : sub.score || 0} / {sub.total_marks || 100}
                        </span>
                      </td>

                      <td>
                        <div
                          className={`trainer-feedback-snippet ${!sub.feedback ? "empty" : ""}`}
                          title={sub.feedback || "No feedback provided yet"}
                        >
                          {sub.feedback || "— No feedback yet"}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "Recent"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="trainer-btn-review"
                          onClick={() => handleOpenReview(sub)}
                        >
                          <Eye size={13} /> Review & Feedback
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

      {/* Review & Feedback Modal */}
      {reviewModalSub && (
        <div className="trainer-modal-overlay" onClick={() => setReviewModalSub(null)}>
          <div className="trainer-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="trainer-modal-header">
              <h3 className="trainer-modal-title">
                Review Submission: {reviewModalSub.student_name}
              </h3>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setReviewModalSub(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback}>
              <div className="trainer-modal-body">
                {/* Meta Details */}
                <div className="trainer-modal-meta-grid">
                  <div className="trainer-meta-card">
                    <span className="trainer-meta-card-lbl">Student</span>
                    <span className="trainer-meta-card-val">{reviewModalSub.student_name}</span>
                  </div>
                  <div className="trainer-meta-card">
                    <span className="trainer-meta-card-lbl">Task Title</span>
                    <span className="trainer-meta-card-val">{reviewModalSub.task_title}</span>
                  </div>
                  <div className="trainer-meta-card">
                    <span className="trainer-meta-card-lbl">Language</span>
                    <span className="trainer-meta-card-val">{reviewModalSub.language || "Java"}</span>
                  </div>
                  <div className="trainer-meta-card">
                    <span className="trainer-meta-card-lbl">Current Score</span>
                    <span className="trainer-meta-card-val">
                      {reviewModalSub.marks_obtained !== undefined ? reviewModalSub.marks_obtained : reviewModalSub.score || 0} pts
                    </span>
                  </div>
                </div>

                {/* Submitted Code Block */}
                <div className="trainer-code-block-wrap">
                  <div className="trainer-code-block-header">
                    <span>Submitted Source Code</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Language: {reviewModalSub.language || "Java"}
                    </span>
                  </div>
                  <pre className="trainer-code-pre">
                    <code>{reviewModalSub.submitted_code || "// No code available for this submission"}</code>
                  </pre>
                </div>

                {/* Feedback Input & Score Form */}
                <div className="trainer-feedback-form">
                  <div className="form-grid-2 mobile-pair-2" style={{ gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Evaluation Score (out of {reviewModalSub.total_marks || 100})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={reviewModalSub.total_marks || 100}
                        value={feedbackMarks}
                        onChange={(e) => setFeedbackMarks(e.target.value)}
                        style={{
                          width: "100%",
                          boxParsing: "border-box",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        Evaluation Status
                      </label>
                      <CustomSelect
                        value={feedbackStatus}
                        onChange={(val) => setFeedbackStatus(val)}
                        options={[
                          { value: "Accepted", label: "Accepted" },
                          { value: "Reviewed", label: "Reviewed" },
                          { value: "Needs Improvement", label: "Needs Improvement" },
                          { value: "Wrong Answer", label: "Wrong Answer" },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Trainer Review Feedback for Student
                    </label>
                    <textarea
                      placeholder="Write actionable technical feedback, praise, or code optimization hints for the student..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="trainer-feedback-textarea"
                    />
                  </div>
                </div>

                {feedbackMessage && (
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", fontSize: "13px", fontWeight: "600" }}>
                    {feedbackMessage}
                  </div>
                )}
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="trainer-btn-outline"
                  onClick={() => setReviewModalSub(null)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#0055ba",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  <Send size={14} />
                  {savingFeedback ? "Saving..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerSubmissions;

