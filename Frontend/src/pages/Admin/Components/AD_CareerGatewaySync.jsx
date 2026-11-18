import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Shield,
  Layers,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Database,
  Calendar,
  Zap,
  Info,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  BookOpenCheck,
  Code2,
  GraduationCap,
  Award
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_CareerGatewaySync.css";

export default function AD_CareerGatewaySync() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState("all");

  // Sync action states
  const [isCollegeSyncConfirmOpen, setIsCollegeSyncConfirmOpen] = useState(false);
  const [isCollegeSyncFullScreen, setIsCollegeSyncFullScreen] = useState(true);
  const [isSubmittingSync, setIsSubmittingSync] = useState(false);
  const [individualStudentId, setIndividualStudentId] = useState("");
  const [activeSyncMessage, setActiveSyncMessage] = useState(null);
  const [activeSyncError, setActiveSyncError] = useState(null);
  const [selectedDetailExecution, setSelectedDetailExecution] = useState(null);

  // Active polling reference
  const pollingRef = useRef(null);

  // Keyboard shortcut listener (Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isCollegeSyncConfirmOpen) setIsCollegeSyncConfirmOpen(false);
        if (selectedDetailExecution) setSelectedDetailExecution(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollegeSyncConfirmOpen, selectedDetailExecution]);

  // Load Status and History
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        apiFetch("/integrations/career-gateway/monitoring/status").catch(() => null),
        apiFetch(`/integrations/career-gateway/sync/executions?page=${historyPage}&limit=15${historyFilter !== "all" ? `&status=${historyFilter}` : ""}`).catch(() => null),
      ]);

      if (statusRes && statusRes.data) {
        setStatusData(statusRes.data);
      }

      if (historyRes && historyRes.data) {
        setExecutions(historyRes.data.executions || []);
        setHistoryTotal(historyRes.data.total || 0);
      }
    } catch (err) {
      console.error("[CareerGatewaySync] Error loading status/history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [historyPage, historyFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic polling if there is a running or queued job
  useEffect(() => {
    const hasActive = executions.some(
      (e) => e.status === "processing" || e.status === "queued"
    );

    if (hasActive) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          loadData(true);
        }, 3000);
      }
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [executions, loadData]);

  // Trigger College-wide Sync (Mode B)
  const handleConfirmCollegeSync = async () => {
    setIsSubmittingSync(true);
    setActiveSyncMessage(null);
    setActiveSyncError(null);
    try {
      const res = await apiFetch("/integrations/career-gateway/sync/on-demand", {
        method: "POST",
        body: JSON.stringify({
          sync_type: "manual_college",
          request_id: `CG-COL-${Date.now()}`,
        }),
      });

      if (res && (res.status === 200 || res.status === 202 || res.success)) {
        setActiveSyncMessage(
          res.message || "College-wide synchronization queued successfully. Progress will update live."
        );
        setIsCollegeSyncConfirmOpen(false);
        loadData(true);
      } else {
        setActiveSyncError(res?.error || res?.message || "Failed to trigger synchronization.");
      }
    } catch (err) {
      setActiveSyncError(err.message || "Network error occurred.");
    } finally {
      setIsSubmittingSync(false);
    }
  };

  // Trigger Individual Student Sync (Mode B)
  const handleIndividualStudentSync = async (e) => {
    e.preventDefault();
    if (!individualStudentId.trim()) return;

    setIsSubmittingSync(true);
    setActiveSyncMessage(null);
    setActiveSyncError(null);
    try {
      const res = await apiFetch("/integrations/career-gateway/sync/on-demand", {
        method: "POST",
        body: JSON.stringify({
          sync_type: "manual_student",
          student_id: individualStudentId.trim(),
          request_id: `CG-STU-${Date.now()}`,
        }),
      });

      if (res && (res.status === 200 || res.status === 202 || res.success)) {
        setActiveSyncMessage(
          res.message || `Student ${individualStudentId} synchronization completed successfully.`
        );
        setIndividualStudentId("");
        loadData(true);
      } else {
        setActiveSyncError(res?.error || res?.message || `Failed to sync student ${individualStudentId}.`);
      }
    } catch (err) {
      setActiveSyncError(err.message || "Network error occurred.");
    } finally {
      setIsSubmittingSync(false);
    }
  };

  // Retry an eligible failed or partial execution
  const handleRetryExecution = async (syncId) => {
    try {
      const res = await apiFetch(`/integrations/career-gateway/sync/${syncId}/retry`, {
        method: "POST",
      });
      if (res && res.success) {
        setActiveSyncMessage(`Execution ${syncId} re-triggered successfully.`);
        loadData(true);
      } else {
        setActiveSyncError(res?.error || res?.message || "Failed to retry execution.");
      }
    } catch (err) {
      setActiveSyncError(err.message || "Failed to retry execution.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="cg-badge cg-badge--completed"><CheckCircle2 size={13} /> Completed</span>;
      case "processing":
        return <span className="cg-badge cg-badge--processing"><RefreshCw size={13} className="cg-spin" /> Processing</span>;
      case "queued":
        return <span className="cg-badge cg-badge--queued"><Clock size={13} /> Queued</span>;
      case "partial":
        return <span className="cg-badge cg-badge--partial"><AlertTriangle size={13} /> Partial</span>;
      case "failed":
        return <span className="cg-badge cg-badge--failed"><XCircle size={13} /> Failed</span>;
      default:
        return <span className="cg-badge cg-badge--default">{status || "Unknown"}</span>;
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Never";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="cg-sync-container">
      {/* Top Banner & Header */}
      <div className="cg-sync-header">
        <div className="cg-sync-header__left">
          <div className="cg-sync-header__icon-wrap">
            <Zap size={22} className="cg-sync-header__icon" />
          </div>
          <div>
            <h1 className="cg-sync-header__title">Career Gateway Synchronization</h1>
            <p className="cg-sync-header__desc">
              Bidirectional integration bridge between TrainX and Career Gateway. Manage on-demand synchronizations, inspect execution history, and monitor real-time training export streams.
            </p>
          </div>
        </div>
        <div className="cg-sync-header__actions">
          <button
            className={`cg-btn cg-btn--secondary ${refreshing ? "cg-btn--disabled" : ""}`}
            onClick={() => loadData()}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "cg-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>

      {/* Global Toast / Feedback Alerts */}
      {activeSyncMessage && (
        <div className="cg-alert cg-alert--success">
          <CheckCircle2 size={18} />
          <span>{activeSyncMessage}</span>
          <button className="cg-alert__close" onClick={() => setActiveSyncMessage(null)}>✕</button>
        </div>
      )}
      {activeSyncError && (
        <div className="cg-alert cg-alert--danger">
          <AlertCircle size={18} />
          <span>{activeSyncError}</span>
          <button className="cg-alert__close" onClick={() => setActiveSyncError(null)}>✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="cg-metrics-grid">
        <div className="cg-metric-card">
          <div className="cg-metric-card__header">
            <span className="cg-metric-card__label">Linked Students</span>
            <Users size={18} className="cg-metric-card__icon cg-metric-card__icon--blue" />
          </div>
          <div className="cg-metric-card__val">
            {statusData?.student_mappings?.total_mapped ?? (loading ? "..." : 0)}
          </div>
          <div className="cg-metric-card__sub">
            <span className="cg-tag cg-tag--green">
              {statusData?.student_mappings?.active_eligible ?? 0} Active Eligible
            </span>
            {Boolean(statusData?.student_mappings?.revoked) && (
              <span className="cg-tag cg-tag--red">
                {statusData?.student_mappings?.revoked} Revoked
              </span>
            )}
          </div>
        </div>

        <div className="cg-metric-card">
          <div className="cg-metric-card__header">
            <span className="cg-metric-card__label">Last Export Status</span>
            <Database size={18} className="cg-metric-card__icon cg-metric-card__icon--purple" />
          </div>
          <div className="cg-metric-card__val">
            {statusData?.last_export_batch?.status ? (
              getStatusBadge(statusData.last_export_batch.status)
            ) : (
              <span className="cg-metric-card__text-muted">Idle</span>
            )}
          </div>
          <div className="cg-metric-card__sub">
            {statusData?.last_export_batch?.total_records
              ? `${statusData.last_export_batch.total_records} records exported`
              : "No records pending export"}
          </div>
        </div>

        <div className="cg-metric-card">
          <div className="cg-metric-card__header">
            <span className="cg-metric-card__label">Daily Scheduled Sync</span>
            <Calendar size={18} className="cg-metric-card__icon cg-metric-card__icon--emerald" />
          </div>
          <div className="cg-metric-card__val cg-metric-card__val--time">
            02:00 AM IST
          </div>
          <div className="cg-metric-card__sub">
            <Shield size={12} /> MySQL Advisory Lock Active
          </div>
        </div>

        <div className="cg-metric-card">
          <div className="cg-metric-card__header">
            <span className="cg-metric-card__label">Scheduled Checkpoint</span>
            <Clock size={18} className="cg-metric-card__icon cg-metric-card__icon--amber" />
          </div>
          <div className="cg-metric-card__val cg-metric-card__val--sm">
            {formatDate(statusData?.last_checkpoint?.last_successful_sync_at)}
          </div>
          <div className="cg-metric-card__sub">
            Isolated from manual runs (Zero cursor drift)
          </div>
        </div>
      </div>

      {/* Manual Actions Card (Mode B Controls) */}
      <div className="cg-card cg-actions-card">
        <div className="cg-card__header">
          <div className="cg-card__title-wrap">
            <Zap size={18} className="cg-card__icon" />
            <h2 className="cg-card__title">Administrative Synchronization Controls (Mode B)</h2>
          </div>
          <span className="cg-card__badge">Live Integration Stream</span>
        </div>

        <div className="cg-actions-grid">
          {/* Action 1: College-wide Sync */}
          <div className="cg-action-box">
            <div className="cg-action-box__info">
              <h3 className="cg-action-box__title">College-Wide Synchronization</h3>
              <p className="cg-action-box__desc">
                Collects verified training records for all linked students in your institution (batches, attendance sessions, quiz benchmarks, coding attempts, and roadmap progress) and transmits them to Career Gateway in a background worker task.
              </p>
            </div>
            <button
              className="cg-btn cg-btn--primary cg-btn--lg"
              onClick={() => {
                setIsCollegeSyncFullScreen(true);
                setIsCollegeSyncConfirmOpen(true);
              }}
              disabled={isSubmittingSync}
            >
              <RefreshCw size={16} className={isSubmittingSync ? "cg-spin" : ""} />
              Sync College Now
            </button>
          </div>

          {/* Action 2: Individual Student Sync */}
          <div className="cg-action-box">
            <div className="cg-action-box__info">
              <h3 className="cg-action-box__title">Individual Student Synchronization</h3>
              <p className="cg-action-box__desc">
                Immediately syncs training records for a specific student using their Career Gateway Student ID or TrainX User ID. Strictly isolated to the target student.
              </p>
            </div>
            <form className="cg-student-sync-form" onSubmit={handleIndividualStudentSync}>
              <div className="cg-input-group">
                <Search size={16} className="cg-input-group__icon" />
                <input
                  type="text"
                  className="cg-input"
                  placeholder="Enter Student ID (e.g. 101 or 1042)..."
                  value={individualStudentId}
                  onChange={(e) => setIndividualStudentId(e.target.value)}
                  disabled={isSubmittingSync}
                />
              </div>
              <button
                type="submit"
                className="cg-btn cg-btn--secondary"
                disabled={!individualStudentId.trim() || isSubmittingSync}
              >
                Sync Student
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sync Executions History Table */}
      <div className="cg-card">
        <div className="cg-card__header cg-card__header--between">
          <div className="cg-card__title-wrap">
            <Layers size={18} className="cg-card__icon" />
            <h2 className="cg-card__title">Synchronization History & Audit Trail</h2>
            <span className="cg-count-pill">{historyTotal}</span>
          </div>

          {/* Filter Tabs */}
          <div className="cg-filter-tabs">
            {["all", "completed", "processing", "partial", "failed"].map((f) => (
              <button
                key={f}
                className={`cg-filter-tab ${historyFilter === f ? "cg-filter-tab--active" : ""}`}
                onClick={() => setHistoryFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="cg-table-responsive">
          <table className="cg-table">
            <thead>
              <tr>
                <th>Sync ID</th>
                <th>Type</th>
                <th>Target</th>
                <th>Trigger Source</th>
                <th>Status</th>
                <th>Processed / Failed</th>
                <th>Started At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="cg-table__empty">
                    {loading ? "Loading synchronization history..." : "No synchronization executions found matching the filter."}
                  </td>
                </tr>
              ) : (
                executions.map((e) => (
                  <tr key={e.id || e.sync_id}>
                    <td className="cg-table__cell--mono">
                      <span title={e.sync_id}>{e.sync_id?.slice(0, 16)}...</span>
                    </td>
                    <td>
                      <span className="cg-type-pill">
                        {e.sync_type === "manual_college" ? "College Wide" : "Individual Student"}
                      </span>
                    </td>
                    <td>
                      {e.sync_type === "manual_student" ? (
                        <div className="cg-target-student">
                          <span className="cg-target-student__name">{e.student_name || `Student #${e.career_gateway_student_id || e.trainx_user_id}`}</span>
                          {e.student_email && <span className="cg-target-student__email">{e.student_email}</span>}
                        </div>
                      ) : (
                        <span className="cg-target-college">All Enrolled Students</span>
                      )}
                    </td>
                    <td>
                      <span className="cg-source-badge">
                        {e.trigger_source === "career_gateway" ? "Career Gateway" : (e.trigger_source === "scheduler" ? "Scheduler" : "TrainX Admin")}
                      </span>
                    </td>
                    <td>{getStatusBadge(e.status)}</td>
                    <td>
                      <span className="cg-records-stat">
                        <strong className="cg-records-stat--success">{e.records_processed ?? 0}</strong>
                        {e.records_failed > 0 && (
                          <span className="cg-records-stat--failed"> / {e.records_failed} failed</span>
                        )}
                      </span>
                    </td>
                    <td className="cg-table__cell--date">{formatDate(e.started_at)}</td>
                    <td>
                      <div className="cg-table__actions">
                        <button
                          className="cg-btn-icon"
                          title="View Execution Payload Summary"
                          onClick={() => setSelectedDetailExecution(e)}
                        >
                          <Info size={14} />
                        </button>
                        {(e.status === "failed" || e.status === "partial") && (
                          <button
                            className="cg-btn-icon cg-btn-icon--retry"
                            title="Retry Synchronization"
                            onClick={() => handleRetryExecution(e.sync_id)}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for College-Wide Sync */}
      {isCollegeSyncConfirmOpen &&
        createPortal(
          <div
            className={`cg-modal-overlay ${isCollegeSyncFullScreen ? "cg-modal-overlay--fullscreen" : ""}`}
            onClick={() => setIsCollegeSyncConfirmOpen(false)}
          >
            <div
              className={`cg-modal ${isCollegeSyncFullScreen ? "cg-modal--fullscreen" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="cg-modal__header cg-modal__header--interactive">
                <div className="cg-modal__header-left">
                  <div className="cg-modal__icon-wrap cg-modal__icon-wrap--amber">
                    <AlertTriangle size={isCollegeSyncFullScreen ? 22 : 20} />
                  </div>
                  <div>
                    <h3 className="cg-modal__title">Confirm College-Wide Synchronization</h3>
                    {isCollegeSyncFullScreen && (
                      <span className="cg-modal__subtitle">
                        Tenant-Wide Background Batch Export &bull; Career Gateway Integration
                      </span>
                    )}
                  </div>
                </div>

                <div className="cg-modal__header-actions">
                  <button
                    type="button"
                    className="cg-modal__control-btn"
                    onClick={() => setIsCollegeSyncFullScreen((prev) => !prev)}
                    title={isCollegeSyncFullScreen ? "Restore Window Size" : "Full Screen"}
                    aria-label={isCollegeSyncFullScreen ? "Restore Window Size" : "Full Screen"}
                  >
                    {isCollegeSyncFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button
                    type="button"
                    className="cg-modal__control-btn cg-modal__control-btn--close"
                    onClick={() => setIsCollegeSyncConfirmOpen(false)}
                    title="Close Dialog (Esc)"
                    aria-label="Close Dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className={`cg-modal__body ${isCollegeSyncFullScreen ? "cg-modal__body--fullscreen" : ""}`}>
                {isCollegeSyncFullScreen ? (
                  <div className="cg-fullscreen-content">
                    {/* Hero Banner */}
                    <div className="cg-fs-hero">
                      <div className="cg-fs-hero__badge">
                        <Zap size={14} /> On-Demand Pipeline Trigger
                      </div>
                      <h2 className="cg-fs-hero__title">Initiate Full College Synchronization</h2>
                      <p className="cg-fs-hero__desc">
                        You are about to initiate an on-demand synchronization for your entire college tenant.
                        All verified learning progress, classroom attendance, assessment benchmarks, and coding milestones
                        will be compiled and transmitted asynchronously to Career Gateway.
                      </p>

                      {/* Highlighted Stat Cards */}
                      <div className="cg-fs-metrics">
                        <div className="cg-fs-metric-card">
                          <span className="cg-fs-metric-card__label">Linked Students in Scope</span>
                          <span className="cg-fs-metric-card__value">
                            {statusData?.linked_students_count ?? statusData?.summary?.linked_students ?? "—"}
                          </span>
                          <span className="cg-fs-metric-card__sub">Mapped to Career Gateway IDs</span>
                        </div>
                        <div className="cg-fs-metric-card">
                          <span className="cg-fs-metric-card__label">Active Eligible Candidates</span>
                          <span className="cg-fs-metric-card__value">
                            {statusData?.active_eligible_students ?? "—"}
                          </span>
                          <span className="cg-fs-metric-card__sub">Active in current academic cycle</span>
                        </div>
                        <div className="cg-fs-metric-card">
                          <span className="cg-fs-metric-card__label">Sync Mode</span>
                          <span className="cg-fs-metric-card__value cg-fs-metric-card__value--mode">Mode B</span>
                          <span className="cg-fs-metric-card__sub">Asynchronous Background Worker</span>
                        </div>
                        <div className="cg-fs-metric-card">
                          <span className="cg-fs-metric-card__label">Execution Route</span>
                          <span className="cg-fs-metric-card__value cg-fs-metric-card__value--target">Gateway Bridge</span>
                          <span className="cg-fs-metric-card__sub">Isolated College Tenant</span>
                        </div>
                      </div>
                    </div>

                    {/* Scope Breakdown Grid */}
                    <div className="cg-fs-section">
                      <h4 className="cg-fs-section__title">
                        <Database size={16} /> Data Categories Included in Synchronization
                      </h4>
                      <div className="cg-modal-scope-grid">
                        <div className="cg-modal-scope-card">
                          <div className="cg-modal-scope-card__icon cg-modal-scope-card__icon--blue">
                            <Users size={18} />
                          </div>
                          <div>
                            <div className="cg-modal-scope-card__title">Batches & Attendance</div>
                            <div className="cg-modal-scope-card__text">
                              Classroom presence logs, attendance percentages, batch schedules, and trainer sign-offs.
                            </div>
                          </div>
                        </div>

                        <div className="cg-modal-scope-card">
                          <div className="cg-modal-scope-card__icon cg-modal-scope-card__icon--amber">
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <div className="cg-modal-scope-card__title">Academic Quizzes</div>
                            <div className="cg-modal-scope-card__text">
                              Subject assessment scores, percentile distributions, topic proficiencies, and passing benchmarks.
                            </div>
                          </div>
                        </div>

                        <div className="cg-modal-scope-card">
                          <div className="cg-modal-scope-card__icon cg-modal-scope-card__icon--emerald">
                            <Code2 size={18} />
                          </div>
                          <div>
                            <div className="cg-modal-scope-card__title">Coding Milestones</div>
                            <div className="cg-modal-scope-card__text">
                              Problem solving submissions, test suite passes, language competencies, and streak records.
                            </div>
                          </div>
                        </div>

                        <div className="cg-modal-scope-card">
                          <div className="cg-modal-scope-card__icon cg-modal-scope-card__icon--purple">
                            <Award size={18} />
                          </div>
                          <div>
                            <div className="cg-modal-scope-card__title">Roadmaps & Certifications</div>
                            <div className="cg-modal-scope-card__text">
                              Learning journey checkpoints, completion ratios, validated skill credentials, and career readiness.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tenant Isolation Callout */}
                    <div className="cg-callout cg-callout--fullscreen">
                      <Shield size={20} className="cg-callout__icon" />
                      <div>
                        <strong>Strict Tenant Isolation & Asynchronous Execution:</strong>
                        <p style={{ margin: "4px 0 0 0" }}>
                          This export task runs safely in the background worker queue and will not interfere with active classroom
                          operations or your daily 02:00 AM scheduled sync cursor. Only students actively linked with Career Gateway IDs
                          will be transmitted.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>
                      You are about to initiate an on-demand synchronization for your entire college tenant.
                    </p>
                    <div className="cg-callout">
                      <Shield size={16} className="cg-callout__icon" />
                      <div>
                        <strong>Tenant Isolated & Asynchronous:</strong>
                        <br />
                        This export will run in the background without affecting your daily 02:00 AM scheduled sync cursor. Only students linked to Career Gateway will be processed.
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="cg-modal__footer cg-modal__footer--interactive">
                <div className="cg-modal__footer-hint">
                  <span>Press <kbd>Esc</kbd> to close</span>
                </div>
                <div className="cg-modal__footer-btns">
                  <button
                    type="button"
                    className="cg-btn cg-btn--secondary"
                    onClick={() => setIsCollegeSyncConfirmOpen(false)}
                    disabled={isSubmittingSync}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cg-btn cg-btn--primary cg-btn--confirm-sync"
                    onClick={handleConfirmCollegeSync}
                    disabled={isSubmittingSync}
                  >
                    <RefreshCw size={16} className={isSubmittingSync ? "cg-spin" : ""} />
                    {isSubmittingSync ? "Submitting..." : "Yes, Start Synchronization"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Detail / Payload Summary Modal */}
      {selectedDetailExecution &&
        createPortal(
          <div className="cg-modal-overlay" onClick={() => setSelectedDetailExecution(null)}>
            <div className="cg-modal cg-modal--lg" onClick={(e) => e.stopPropagation()}>
              <div className="cg-modal__header cg-modal__header--interactive">
                <div className="cg-modal__header-left">
                  <div className="cg-modal__icon-wrap cg-modal__icon-wrap--blue">
                    <Layers size={20} />
                  </div>
                  <h3 className="cg-modal__title">Synchronization Execution Details</h3>
                </div>
                <div className="cg-modal__header-actions">
                  <button
                    type="button"
                    className="cg-modal__control-btn cg-modal__control-btn--close"
                    onClick={() => setSelectedDetailExecution(null)}
                    title="Close Dialog"
                    aria-label="Close Dialog"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="cg-modal__body">
                <div className="cg-detail-grid">
                  <div><strong>Sync ID:</strong> <code>{selectedDetailExecution.sync_id}</code></div>
                  <div><strong>Export ID:</strong> <code>{selectedDetailExecution.export_id || "N/A"}</code></div>
                  <div><strong>Type:</strong> {selectedDetailExecution.sync_type}</div>
                  <div><strong>Trigger:</strong> {selectedDetailExecution.trigger_source}</div>
                  <div><strong>Status:</strong> {selectedDetailExecution.status}</div>
                  <div><strong>Started:</strong> {formatDate(selectedDetailExecution.started_at)}</div>
                  <div><strong>Completed:</strong> {formatDate(selectedDetailExecution.completed_at)}</div>
                  <div><strong>Requested By:</strong> {selectedDetailExecution.requested_by || "System"}</div>
                </div>

                {selectedDetailExecution.error_summary && (
                  <div className="cg-error-box">
                    <strong>Error Summary:</strong>
                    <p>{selectedDetailExecution.error_summary}</p>
                  </div>
                )}

                {selectedDetailExecution.payload_summary && (
                  <div className="cg-summary-section">
                    <strong>Payload Breakdown (6 Categories):</strong>
                    <pre className="cg-json-block">
                      {typeof selectedDetailExecution.payload_summary === "string"
                        ? selectedDetailExecution.payload_summary
                        : JSON.stringify(selectedDetailExecution.payload_summary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="cg-modal__footer">
                <button className="cg-btn cg-btn--secondary" onClick={() => setSelectedDetailExecution(null)}>
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

