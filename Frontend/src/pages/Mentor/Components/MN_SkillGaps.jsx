import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Sparkles,
  Search,
  RefreshCw,
  Filter,
  Layers,
  Users,
  GraduationCap,
  CheckCircle2,
  X,
  Send,
  BookOpen,
  Target,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Check,
  ShieldAlert,
  ChevronRight,
  Activity,
  Calendar,
  Award,
  Flame,
  Info
} from "lucide-react";
import CustomSelect from "../../../components/ui/CustomSelect";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_SkillGaps.css";

export default function MentorSkillGaps() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentGaps, setStudentGaps] = useState([]);
  const [batchGaps, setBatchGaps] = useState([]);
  const [batches, setBatches] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [kpis, setKpis] = useState({
    totalGapsIdentified: 0,
    highPriorityCount: 0,
    mediumPriorityCount: 0,
    lowPriorityCount: 0,
    uniqueStudentsAffected: 0,
    avgDeficiencyRate: '0%',
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'batches' | 'interventions'

  // Trigger Remedial Modal states
  const [isRemedialModalOpen, setIsRemedialModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState("all");
  const [assignmentTopic, setAssignmentTopic] = useState("");
  const [assignmentBatchName, setAssignmentBatchName] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSubmittingRemedial, setIsSubmittingRemedial] = useState(false);

  // AI Diagnostic Modal states
  const [diagnosticModal, setDiagnosticModal] = useState({
    isOpen: false,
    loading: false,
    data: null,
    topic: "",
    batchName: "",
    deficiencyRate: "",
    avgScore: "",
    studentName: "",
  });

  // Notification Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 5000);
  };

  // Fetch skill gaps from backend
  const fetchSkillGaps = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFetch('/skill-gaps');
      if (res && res.data) {
        const d = res.data;
        const students = d.studentGaps || [];
        setStudentGaps(students);
        setBatchGaps(d.skillGaps || []);
        setBatches(d.batches || []);
        setInterventions(d.interventions || []);

        const uniqueStudents = new Set(students.map(s => s.studentId));
        setKpis({
          totalGapsIdentified: d.totalGapsIdentified || students.length,
          highPriorityCount: d.highPriorityCount || students.filter(s => s.priority === 'High').length,
          mediumPriorityCount: d.mediumPriorityCount || students.filter(s => s.priority === 'Medium').length,
          lowPriorityCount: d.lowPriorityCount || students.filter(s => s.priority === 'Low').length,
          uniqueStudentsAffected: d.uniqueStudentsAffected || uniqueStudents.size,
          avgDeficiencyRate: d.avgDeficiencyRate || '0%',
        });
      }
    } catch (err) {
      console.error("Error fetching skill gaps:", err);
      showToast("Unable to load latest diagnostics. Please refresh.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  // Filtered Student Gaps
  const filteredStudentGaps = useMemo(() => {
    return studentGaps.filter((g) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (g.studentName && g.studentName.toLowerCase().includes(q)) ||
        (g.rollNo && g.rollNo.toLowerCase().includes(q)) ||
        (g.topic && g.topic.toLowerCase().includes(q)) ||
        (g.batch && g.batch.toLowerCase().includes(q));

      const matchBatch =
        selectedBatch === "all" ||
        String(g.batchId) === String(selectedBatch) ||
        g.batch === selectedBatch;

      const matchPriority =
        selectedPriority === "all" ||
        g.priority?.toLowerCase() === selectedPriority.toLowerCase();

      return matchSearch && matchBatch && matchPriority;
    });
  }, [studentGaps, searchTerm, selectedBatch, selectedPriority]);

  // Filtered Batch Gaps
  const filteredBatchGaps = useMemo(() => {
    return batchGaps.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        (b.topic && b.topic.toLowerCase().includes(q)) ||
        (b.batch && b.batch.toLowerCase().includes(q));

      const matchBatch =
        selectedBatch === "all" ||
        String(b.batchId) === String(selectedBatch) ||
        b.batch === selectedBatch;

      const matchPriority =
        selectedPriority === "all" ||
        b.priority?.toLowerCase() === selectedPriority.toLowerCase();

      return matchSearch && matchBatch && matchPriority;
    });
  }, [batchGaps, searchTerm, selectedBatch, selectedPriority]);

  // Open Remedial Modal for specific row or general
  const handleOpenRemedialModal = (prefill = null) => {
    if (prefill) {
      setTargetStudentId(prefill.studentId || "all");
      setAssignmentTopic(prefill.topic || "");
      setAssignmentBatchName(prefill.batch || "");
    } else {
      setTargetStudentId("all");
      setAssignmentTopic("");
      setAssignmentBatchName("");
    }
    setDifficultyLevel("Medium");
    setDueDate("");
    setCustomInstructions("");
    setIsRemedialModalOpen(true);
  };

  // Submit Remedial Assignment
  const handleSendRemedial = async (e) => {
    e.preventDefault();
    if (!assignmentTopic.trim()) {
      showToast("Please enter a remedial assignment topic", "error");
      return;
    }

    setIsSubmittingRemedial(true);
    try {
      const payload = {
        topic: assignmentTopic,
        studentId: targetStudentId === "all" ? null : targetStudentId,
        batchName: assignmentBatchName || "All Cohorts",
        difficultyLevel,
        dueDate,
        customInstructions,
      };

      const res = await apiFetch("/skill-gaps/remedial", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && (res.data || res.success)) {
        showToast(
          `AI Remedial Assignment "${assignmentTopic}" successfully generated and dispatched!`,
          "success"
        );
        setIsRemedialModalOpen(false);
        fetchSkillGaps(true);
      } else {
        showToast(res?.message || "Failed to dispatch remedial assignment.", "error");
      }
    } catch (err) {
      console.error("Error triggering remedial assignment:", err);
      showToast("Network error while generating remedial assignment.", "error");
    } finally {
      setIsSubmittingRemedial(false);
    }
  };

  // Run or view AI Diagnostic
  const handleOpenAIDiagnostic = async (item) => {
    setDiagnosticModal({
      isOpen: true,
      loading: true,
      data: null,
      topic: item.topic,
      batchName: item.batch || "Cohort",
      deficiencyRate: item.deficiencyRate || "40%",
      avgScore: item.avgScore || "55%",
      studentName: item.studentName || null,
    });

    try {
      const res = await apiFetch("/skill-gaps/diagnostics", {
        method: "POST",
        body: JSON.stringify({
          topic: item.topic,
          batchName: item.batch,
          deficiencyRate: item.deficiencyRate,
          avgScore: item.avgScore,
        }),
      });

      if (res && res.data) {
        setDiagnosticModal((prev) => ({
          ...prev,
          loading: false,
          data: res.data,
        }));
      } else {
        // Fallback diagnostic data if AI is offline
        setDiagnosticModal((prev) => ({
          ...prev,
          loading: false,
          data: {
            rootCauses: [
              `Knowledge gap in core foundations of ${item.topic}`,
              "Difficulty debugging complex edge cases and edge condition logic",
              "Low retention on multi-step reasoning questions under timed pressure",
            ],
            recommendedFocusAreas: [
              `${item.topic} Fundamentals & Visual Tracing`,
              "Step-by-step Dry Runs with Real-world Edge Cases",
              "15-minute Timed Drill Exercises",
            ],
            remedialActionPlan: `Initiate a focused 3-tier remedial intervention starting with guided conceptual slides followed by 3 incremental coding problems.`,
            suggestedExerciseTypes: [
              "Interactive Code Tracing Challenge",
              "Find-the-Bug Debugging Session",
              "Targeted Concept Booster Quiz",
            ],
          },
        }));
      }
    } catch (err) {
      console.error("Error loading diagnostic:", err);
      setDiagnosticModal((prev) => ({
        ...prev,
        loading: false,
        data: {
          rootCauses: [
            `Frequent misconceptions in ${item.topic} principles`,
            "Lack of hands-on syntax and algorithmic drill exposure",
            "Sub-optimal test-taking pacing on analytical questions",
          ],
          recommendedFocusAreas: [
            "Concept refresh video walkthrough",
            "Interactive unit practice set",
            "Peer code review workshop",
          ],
          remedialActionPlan: `Assign a tailored practice sprint for ${item.topic} with instant AI feedback enabled.`,
          suggestedExerciseTypes: [
            "Algorithmic Implementation Task",
            "Conceptual MCQ Checkpoint",
            "Timed Coding Sprint",
          ],
        },
      }));
    }
  };

  // Helper for priority badge styling
  const getPriorityBadge = (priority) => {
    const p = String(priority || 'Medium').toLowerCase();
    if (p === 'high') {
      return (
        <span className="msg-priority-pill msg-priority-pill--high">
          <span className="msg-priority-dot msg-priority-dot--high" />
          High Priority
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="msg-priority-pill msg-priority-pill--medium">
          <span className="msg-priority-dot msg-priority-dot--medium" />
          Medium Priority
        </span>
      );
    }
    return (
      <span className="msg-priority-pill msg-priority-pill--low">
        <span className="msg-priority-dot msg-priority-dot--low" />
        Low Priority
      </span>
    );
  };

  // Helper for student initials
  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="mentor-skillgaps-container">
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className={`msg-toast-banner msg-toast-banner--${toast.type}`}>
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="msg-toast-icon" />
          ) : (
            <AlertCircle size={18} className="msg-toast-icon" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="msg-toast-close"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="msg-page-header">
        <div className="msg-page-header__left">
          <div className="msg-title-wrap">
            <div className="msg-header-icon-badge">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h1 className="msg-page-title">AI Skill Gap Diagnostics & Weak Spot Mapping</h1>
              <p className="msg-page-subtitle">
                Automated continuous evaluation across quizzes & coding tasks to detect weak concepts and deploy remedial interventions.
              </p>
            </div>
          </div>
        </div>

        <div className="msg-page-header__actions">
          <button
            className={`msg-btn-secondary ${refreshing ? "msg-btn--loading" : ""}`}
            onClick={() => fetchSkillGaps(true)}
            disabled={refreshing}
            title="Re-scan student assessments"
          >
            <RefreshCw size={15} className={refreshing ? "msg-spin" : ""} />
            <span>{refreshing ? "Re-scanning..." : "Refresh Diagnostics"}</span>
          </button>

          <button
            className="msg-btn-primary"
            onClick={() => handleOpenRemedialModal()}
          >
            <Sparkles size={16} />
            <span>Trigger Remedial Assignment</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="msg-kpi-grid">
        <div className="msg-kpi-card">
          <div className="msg-kpi-card__header">
            <span className="msg-kpi-card__label">Identified Weak Spots</span>
            <div className="msg-kpi-card__icon msg-kpi-card__icon--indigo">
              <Target size={18} />
            </div>
          </div>
          <div className="msg-kpi-card__value">{kpis.totalGapsIdentified}</div>
          <div className="msg-kpi-card__footer">
            <span className="msg-kpi-card__pill msg-kpi-card__pill--info">
              Across active cohorts
            </span>
          </div>
        </div>

        <div className="msg-kpi-card">
          <div className="msg-kpi-card__header">
            <span className="msg-kpi-card__label">Critical Deficiencies</span>
            <div className="msg-kpi-card__icon msg-kpi-card__icon--rose">
              <Flame size={18} />
            </div>
          </div>
          <div className="msg-kpi-card__value msg-text-rose">{kpis.highPriorityCount}</div>
          <div className="msg-kpi-card__footer">
            <span className="msg-kpi-card__pill msg-kpi-card__pill--danger">
              Urgent action needed
            </span>
          </div>
        </div>

        <div className="msg-kpi-card">
          <div className="msg-kpi-card__header">
            <span className="msg-kpi-card__label">Students Requiring Support</span>
            <div className="msg-kpi-card__icon msg-kpi-card__icon--blue">
              <Users size={18} />
            </div>
          </div>
          <div className="msg-kpi-card__value">{kpis.uniqueStudentsAffected}</div>
          <div className="msg-kpi-card__footer">
            <span className="msg-kpi-card__pill msg-kpi-card__pill--neutral">
              Unique learners
            </span>
          </div>
        </div>

        <div className="msg-kpi-card">
          <div className="msg-kpi-card__header">
            <span className="msg-kpi-card__label">Avg Deficiency Rate</span>
            <div className="msg-kpi-card__icon msg-kpi-card__icon--amber">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="msg-kpi-card__value msg-text-amber">{kpis.avgDeficiencyRate}</div>
          <div className="msg-kpi-card__footer">
            <span className="msg-kpi-card__pill msg-kpi-card__pill--warning">
              {kpis.mediumPriorityCount} moderate cases
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs & Filter Toolbar */}
      <div className="msg-toolbar-card">
        <div className="msg-view-tabs">
          <button
            className={`msg-tab-btn ${activeTab === "students" ? "msg-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <GraduationCap size={15} />
            <span>Student Diagnostics</span>
            <span className="msg-tab-badge">{studentGaps.length}</span>
          </button>

          <button
            className={`msg-tab-btn ${activeTab === "batches" ? "msg-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("batches")}
          >
            <Layers size={15} />
            <span>Batch Concepts</span>
            <span className="msg-tab-badge">{batchGaps.length}</span>
          </button>

          <button
            className={`msg-tab-btn ${activeTab === "interventions" ? "msg-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("interventions")}
          >
            <Sparkles size={15} />
            <span>Remedial Interventions</span>
            <span className="msg-tab-badge">{interventions.length}</span>
          </button>
        </div>

        <div className="msg-filter-row">
          {/* Search Box */}
          <div className="msg-search-box">
            <Search size={16} className="msg-search-icon" />
            <input
              type="text"
              placeholder={
                activeTab === "students"
                  ? "Search student name, roll no, or topic..."
                  : "Search concept or batch name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="msg-search-input"
            />
            {searchTerm && (
              <button
                className="msg-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Batch Selector */}
          <div className="msg-filter-select">
            <CustomSelect
              value={selectedBatch}
              onChange={setSelectedBatch}
              placeholder="All Batches"
              options={[
                { value: "all", label: "All Batches" },
                ...batches.map((b) => ({
                  value: b.name,
                  label: b.name,
                })),
              ]}
            />
          </div>

          {/* Priority Selector */}
          <div className="msg-filter-select msg-filter-select--priority">
            <CustomSelect
              value={selectedPriority}
              onChange={setSelectedPriority}
              placeholder="All Priorities"
              options={[
                { value: "all", label: "All Priorities" },
                { value: "High", label: "High Priority" },
                { value: "Medium", label: "Medium Priority" },
                { value: "Low", label: "Low Priority" },
              ]}
            />
          </div>

          {(searchTerm || selectedBatch !== "all" || selectedPriority !== "all") && (
            <button
              className="msg-btn-clear"
              onClick={() => {
                setSearchTerm("");
                setSelectedBatch("all");
                setSelectedPriority("all");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="msg-loading-card">
          <RefreshCw size={28} className="msg-spin msg-text-indigo" />
          <p className="msg-loading-title">Analyzing Student Assessment Data...</p>
          <p className="msg-loading-sub">Scanning quiz submissions and coding benchmarks for concept deficiencies</p>
        </div>
      ) : activeTab === "students" ? (
        /* Tab 1: Student Diagnostics Table */
        <div className="msg-table-card">
          <div className="msg-table-card__top">
            <div className="msg-table-card__title-group">
              <h3 className="msg-table-card__title">Per-Student Weak Spot Roster</h3>
              <span className="msg-table-card__subtitle">
                Showing {filteredStudentGaps.length} diagnosed weakness{filteredStudentGaps.length !== 1 ? "es" : ""}
              </span>
            </div>
          </div>

          <div className="msg-table-responsive">
            <table className="msg-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Student Name & Roll No</th>
                  <th style={{ width: "24%" }}>Topic / Concept Area</th>
                  <th style={{ width: "16%" }}>Affected Batch</th>
                  <th style={{ width: "13%" }}>Deficiency Rate</th>
                  <th style={{ width: "11%" }}>Avg Test Score</th>
                  <th style={{ width: "14%" }}>Remedial Priority</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudentGaps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="msg-empty-row">
                      <div className="msg-empty-state">
                        <div className="msg-empty-icon">
                          <CheckCircle2 size={32} />
                        </div>
                        <h4 className="msg-empty-title">
                          {searchTerm || selectedBatch !== "all" || selectedPriority !== "all"
                            ? "No matching skill gaps found"
                            : "No critical skill gaps identified"}
                        </h4>
                        <p className="msg-empty-desc">
                          {searchTerm || selectedBatch !== "all" || selectedPriority !== "all"
                            ? "Try refining your search terms or resetting the filter options."
                            : "All students are performing comfortably above the deficiency benchmark (<60%)."}
                        </p>
                        {(searchTerm || selectedBatch !== "all" || selectedPriority !== "all") && (
                          <button
                            className="msg-btn-secondary"
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedBatch("all");
                              setSelectedPriority("all");
                            }}
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudentGaps.map((item) => (
                    <tr key={item.id} className="msg-table-row">
                      {/* Student Info */}
                      <td>
                        <div className="msg-student-cell">
                          <div className="msg-avatar-badge">
                            {getInitials(item.studentName)}
                          </div>
                          <div className="msg-student-details">
                            <span className="msg-student-name">{item.studentName}</span>
                            <span className="msg-student-roll">{item.rollNo || "No Roll #"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Topic & Category */}
                      <td>
                        <div className="msg-topic-cell">
                          <span className="msg-topic-title" title={item.topic}>{item.topic}</span>
                          <span className="msg-category-tag">{item.category || "Quiz & Conceptual"}</span>
                        </div>
                      </td>

                      {/* Batch */}
                      <td>
                        <span className="msg-batch-pill">
                          <Users size={12} />
                          <span>{item.batch}</span>
                        </span>
                      </td>

                      {/* Deficiency Rate with mini bar */}
                      <td>
                        <div className="msg-rate-cell">
                          <div className="msg-rate-header">
                            <span className="msg-rate-num msg-rate-num--deficiency">
                              {item.deficiencyRate}
                            </span>
                          </div>
                          <div className="msg-progress-track">
                            <div
                              className="msg-progress-fill msg-progress-fill--deficiency"
                              style={{ width: item.deficiencyRate }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Avg Score */}
                      <td>
                        <div className="msg-rate-cell">
                          <div className="msg-rate-header">
                            <span className="msg-rate-num msg-rate-num--score">
                              {item.avgScore}
                            </span>
                          </div>
                          <div className="msg-progress-track">
                            <div
                              className="msg-progress-fill msg-progress-fill--score"
                              style={{ width: item.avgScore }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td>
                        {getPriorityBadge(item.priority)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="msg-row-actions">
                          <button
                            className="msg-action-btn msg-action-btn--diagnostic"
                            onClick={() => handleOpenAIDiagnostic(item)}
                            title="Run live AI root cause diagnostic"
                          >
                            <Sparkles size={13} />
                            <span>AI Diagnosis</span>
                          </button>

                          <button
                            className="msg-action-btn msg-action-btn--remedial"
                            onClick={() => handleOpenRemedialModal(item)}
                            title="Generate remedial assignment"
                          >
                            <Send size={13} />
                            <span>Remedy</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "batches" ? (
        /* Tab 2: Batch Concept Area Map */
        <div className="msg-table-card">
          <div className="msg-table-card__top">
            <div className="msg-table-card__title-group">
              <h3 className="msg-table-card__title">Cohort-Wide Concept Deficiency Map</h3>
              <span className="msg-table-card__subtitle">
                Aggregated topics where student batches performed below passing thresholds
              </span>
            </div>
          </div>

          <div className="msg-table-responsive">
            <table className="msg-table">
              <thead>
                <tr>
                  <th>Concept / Assessment Topic</th>
                  <th>Affected Batch</th>
                  <th>Deficiency Rate</th>
                  <th>Batch Avg Score</th>
                  <th>Affected Students</th>
                  <th>Priority</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatchGaps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="msg-empty-row">
                      <div className="msg-empty-state">
                        <CheckCircle2 size={32} className="msg-empty-icon" />
                        <h4 className="msg-empty-title">No batch concept deficiencies found</h4>
                        <p className="msg-empty-desc">All batches are currently demonstrating mastery on tested concepts.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBatchGaps.map((b) => (
                    <tr key={b.id} className="msg-table-row">
                      <td>
                        <div className="msg-topic-cell">
                          <span className="msg-topic-title">{b.topic}</span>
                          <span className="msg-category-tag">Assessment Assessment</span>
                        </div>
                      </td>
                      <td>
                        <span className="msg-batch-pill">
                          <Users size={12} />
                          <span>{b.batch}</span>
                        </span>
                      </td>
                      <td>
                        <div className="msg-rate-cell">
                          <span className="msg-rate-num msg-rate-num--deficiency">{b.deficiencyRate}</span>
                          <div className="msg-progress-track">
                            <div className="msg-progress-fill msg-progress-fill--deficiency" style={{ width: b.deficiencyRate }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="msg-rate-cell">
                          <span className="msg-rate-num msg-rate-num--score">{b.avgScore}</span>
                          <div className="msg-progress-track">
                            <div className="msg-progress-fill msg-progress-fill--score" style={{ width: b.avgScore }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="msg-students-affected-badge">
                          <Users size={13} />
                          <span>{b.affectedStudentsCount || 0} students</span>
                        </span>
                      </td>
                      <td>{getPriorityBadge(b.priority)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="msg-row-actions">
                          <button
                            className="msg-action-btn msg-action-btn--diagnostic"
                            onClick={() => handleOpenAIDiagnostic(b)}
                          >
                            <Sparkles size={13} />
                            <span>AI Report</span>
                          </button>
                          <button
                            className="msg-action-btn msg-action-btn--remedial"
                            onClick={() => handleOpenRemedialModal({ topic: b.topic, batch: b.batch, studentId: 'all' })}
                          >
                            <Send size={13} />
                            <span>Batch Assignment</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 3: Remedial Interventions History */
        <div className="msg-table-card">
          <div className="msg-table-card__top">
            <div className="msg-table-card__title-group">
              <h3 className="msg-table-card__title">Dispatched Remedial Interventions</h3>
              <span className="msg-table-card__subtitle">
                Record of AI-generated remedial sprint assignments deployed to batches and students
              </span>
            </div>
          </div>

          <div className="msg-table-responsive">
            <table className="msg-table">
              <thead>
                <tr>
                  <th>Assignment Title & Topic</th>
                  <th>Target Cohort / Student</th>
                  <th>Learning Objectives</th>
                  <th>Practice Problems</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {interventions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="msg-empty-row">
                      <div className="msg-empty-state">
                        <Sparkles size={32} className="msg-empty-icon" />
                        <h4 className="msg-empty-title">No remedial assignments dispatched yet</h4>
                        <p className="msg-empty-desc">
                          Click "Trigger Remedial Assignment" above to automatically generate AI practice modules for struggling students.
                        </p>
                        <button
                          className="msg-btn-primary"
                          onClick={() => handleOpenRemedialModal()}
                          style={{ marginTop: "12px" }}
                        >
                          <Sparkles size={15} />
                          <span>Trigger First Remedial Task</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  interventions.map((iv) => {
                    let objectives = [];
                    let problems = [];
                    try {
                      if (iv.assignment_details) {
                        const parsed = typeof iv.assignment_details === 'string' ? JSON.parse(iv.assignment_details) : iv.assignment_details;
                        objectives = parsed.learningObjectives || [];
                      }
                      if (iv.recommended_problems) {
                        problems = typeof iv.recommended_problems === 'string' ? JSON.parse(iv.recommended_problems) : iv.recommended_problems;
                      }
                    } catch (e) {}

                    return (
                      <tr key={iv.id} className="msg-table-row">
                        <td>
                          <div className="msg-topic-cell">
                            <span className="msg-topic-title">{iv.title || `Remedial Sprint: ${iv.topic}`}</span>
                            <span className="msg-category-tag">{iv.topic}</span>
                          </div>
                        </td>
                        <td>
                          <span className="msg-batch-pill">
                            <Users size={12} />
                            <span>{iv.batch_name || (iv.student_name ? `${iv.student_name} (Individual)` : "Target Cohort")}</span>
                          </span>
                        </td>
                        <td>
                          <span className="msg-text-muted" style={{ fontSize: "12.5px" }}>
                            {objectives.length > 0 ? `${objectives.length} AI objectives defined` : "Conceptual review & practice"}
                          </span>
                        </td>
                        <td>
                          <span className="msg-problems-badge">
                            <BookOpen size={13} />
                            <span>{Array.isArray(problems) ? problems.length : 3} Practice Problems</span>
                          </span>
                        </td>
                        <td>
                          <span className="msg-status-pill msg-status-pill--assigned">
                            <CheckCircle2 size={12} />
                            <span>{iv.status || "Assigned"}</span>
                          </span>
                        </td>
                        <td>
                          <span className="msg-text-muted" style={{ fontSize: "12.5px" }}>
                            {iv.created_at ? new Date(iv.created_at).toLocaleDateString() : "Recent"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AI Diagnostics Breakdown Modal ── */}
      {diagnosticModal.isOpen && createPortal(
        <div className="msg-modal-backdrop" onClick={() => setDiagnosticModal({ ...diagnosticModal, isOpen: false })}>
          <div className="msg-diagnostic-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-header">
              <div className="msg-modal-header__title-wrap">
                <div className="msg-modal-icon-badge">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="msg-modal-title">AI Skill Gap Diagnostics Report</h3>
                  <p className="msg-modal-sub">
                    In-depth conceptual root cause breakdown and personalized remedial recommendations
                  </p>
                </div>
              </div>
              <button
                className="msg-modal-close"
                onClick={() => setDiagnosticModal({ ...diagnosticModal, isOpen: false })}
              >
                <X size={18} />
              </button>
            </div>

            <div className="msg-modal-body">
              {/* Context Summary Card */}
              <div className="msg-diag-summary-card">
                <div className="msg-diag-summary-topic">
                  <span className="msg-diag-tag">Target Concept</span>
                  <h4 className="msg-diag-concept-title">{diagnosticModal.topic}</h4>
                  <div className="msg-diag-meta-pills">
                    <span className="msg-diag-pill">
                      <Users size={12} />
                      <span>{diagnosticModal.batchName}</span>
                    </span>
                    {diagnosticModal.studentName && (
                      <span className="msg-diag-pill msg-diag-pill--student">
                        <GraduationCap size={12} />
                        <span>{diagnosticModal.studentName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="msg-diag-summary-stats">
                  <div className="msg-diag-stat">
                    <span className="msg-diag-stat__label">Deficiency Rate</span>
                    <span className="msg-diag-stat__val msg-text-rose">{diagnosticModal.deficiencyRate}</span>
                  </div>
                  <div className="msg-diag-stat">
                    <span className="msg-diag-stat__label">Class / Test Score</span>
                    <span className="msg-diag-stat__val msg-text-indigo">{diagnosticModal.avgScore}</span>
                  </div>
                </div>
              </div>

              {diagnosticModal.loading ? (
                <div className="msg-diag-loading">
                  <RefreshCw size={26} className="msg-spin msg-text-indigo" />
                  <p className="msg-diag-loading__title">Running Neural Curriculum Diagnostic...</p>
                  <p className="msg-diag-loading__sub">Evaluating assessment errors and generating targeted remedy plan</p>
                </div>
              ) : diagnosticModal.data ? (
                <div className="msg-diag-content">
                  {/* Root Causes */}
                  <div className="msg-diag-section">
                    <div className="msg-diag-section__title">
                      <AlertCircle size={16} className="msg-text-rose" />
                      <span>Identified Conceptual Root Causes</span>
                    </div>
                    <div className="msg-diag-causes-grid">
                      {(diagnosticModal.data.rootCauses || []).map((cause, idx) => (
                        <div key={idx} className="msg-diag-cause-card">
                          <span className="msg-cause-number">0{idx + 1}</span>
                          <p className="msg-cause-text">{cause}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remedial Action Plan */}
                  {diagnosticModal.data.remedialActionPlan && (
                    <div className="msg-diag-section">
                      <div className="msg-diag-section__title">
                        <Target size={16} className="msg-text-indigo" />
                        <span>Prescribed AI Remedial Action Plan</span>
                      </div>
                      <div className="msg-action-plan-box">
                        <p className="msg-action-plan-text">{diagnosticModal.data.remedialActionPlan}</p>
                      </div>
                    </div>
                  )}

                  {/* Recommended Focus Areas */}
                  <div className="msg-diag-section">
                    <div className="msg-diag-section__title">
                      <BookOpen size={16} className="msg-text-amber" />
                      <span>Recommended Sub-Topics to Reinforce</span>
                    </div>
                    <div className="msg-focus-chips">
                      {(diagnosticModal.data.recommendedFocusAreas || []).map((area, idx) => (
                        <div key={idx} className="msg-focus-chip">
                          <CheckCircle2 size={13} className="msg-text-emerald" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Exercise Types */}
                  {(diagnosticModal.data.suggestedExerciseTypes || []).length > 0 && (
                    <div className="msg-diag-section">
                      <div className="msg-diag-section__title">
                        <Activity size={16} className="msg-text-blue" />
                        <span>Suggested Hands-on Exercises</span>
                      </div>
                      <div className="msg-exercises-list">
                        {diagnosticModal.data.suggestedExerciseTypes.map((ex, idx) => (
                          <div key={idx} className="msg-exercise-item">
                            <span className="msg-exercise-bullet">•</span>
                            <span>{ex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="msg-empty-state">
                  <p>Diagnostic data unavailable.</p>
                </div>
              )}
            </div>

            <div className="msg-modal-footer">
              <button
                className="msg-btn-secondary"
                onClick={() => setDiagnosticModal({ ...diagnosticModal, isOpen: false })}
              >
                Close Report
              </button>
              <button
                className="msg-btn-primary"
                onClick={() => {
                  const topic = diagnosticModal.topic;
                  const batch = diagnosticModal.batchName;
                  const student = diagnosticModal.studentName;
                  setDiagnosticModal({ ...diagnosticModal, isOpen: false });
                  handleOpenRemedialModal({ topic, batch, studentName: student });
                }}
              >
                <Sparkles size={15} />
                <span>Trigger Remedial Assignment for this Topic</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Trigger Remedial Assignment Modal ── */}
      {isRemedialModalOpen && createPortal(
        <div className="msg-modal-backdrop" onClick={() => setIsRemedialModalOpen(false)}>
          <div className="msg-remedial-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-header">
              <div className="msg-modal-header__title-wrap">
                <div className="msg-modal-icon-badge msg-modal-icon-badge--purple">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="msg-modal-title">Trigger AI Remedial Assignment</h3>
                  <p className="msg-modal-sub">
                    Generate an AI practice sprint tailored to bridge concept deficiencies with adaptive problems.
                  </p>
                </div>
              </div>
              <button
                className="msg-modal-close"
                onClick={() => setIsRemedialModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRemedial} className="msg-modal-form">
              <div className="msg-form-grid">
                {/* Target Audience */}
                <div className="msg-form-group">
                  <label className="msg-form-label">
                    Target Student or Batch <span className="msg-required">*</span>
                  </label>
                  <CustomSelect
                    value={targetStudentId}
                    onChange={setTargetStudentId}
                    options={[
                      { value: "all", label: "All Students Deficient in this Topic (Cohort-wide)" },
                      ...studentGaps.map((s) => ({
                        value: s.studentId,
                        label: `${s.studentName} (${s.rollNo || s.studentEmail}) - ${s.topic}`,
                      })),
                    ]}
                    placeholder="Select target students..."
                  />
                  <span className="msg-form-hint">
                    Choose an individual student or assign to all candidates needing reinforcement.
                  </span>
                </div>

                {/* Remedial Topic */}
                <div className="msg-form-group">
                  <label className="msg-form-label">
                    Concept / Topic to Reinforce <span className="msg-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignmentTopic}
                    onChange={(e) => setAssignmentTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming & Memoization Patterns"
                    className="msg-form-input"
                    required
                  />
                </div>

                <div className="msg-form-row">
                  {/* Difficulty */}
                  <div className="msg-form-group" style={{ flex: 1 }}>
                    <label className="msg-form-label">Difficulty Target</label>
                    <CustomSelect
                      value={difficultyLevel}
                      onChange={setDifficultyLevel}
                      options={[
                        { value: "Easy", label: "Beginner / Foundation" },
                        { value: "Medium", label: "Intermediate / Standard" },
                        { value: "Hard", label: "Advanced / Comprehensive" },
                      ]}
                    />
                  </div>

                  {/* Submission Due Date */}
                  <div className="msg-form-group" style={{ flex: 1 }}>
                    <label className="msg-form-label">Submission Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="msg-form-input"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Custom Notes / Instructions */}
                <div className="msg-form-group">
                  <label className="msg-form-label">
                    Custom Mentor Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add special instructions, e.g.: 'Focus on time complexity explanations in the solution comments before submitting.'"
                    className="msg-form-textarea"
                  />
                </div>
              </div>

              <div className="msg-modal-footer">
                <button
                  type="button"
                  className="msg-btn-secondary"
                  onClick={() => setIsRemedialModalOpen(false)}
                  disabled={isSubmittingRemedial}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="msg-btn-primary"
                  disabled={isSubmittingRemedial}
                >
                  {isSubmittingRemedial ? (
                    <>
                      <RefreshCw size={15} className="msg-spin" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Generate & Dispatch Assignment</span>
                    </>
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
