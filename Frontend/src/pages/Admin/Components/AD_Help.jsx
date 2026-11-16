import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ShieldCheck,
  X,
  Check,
  Send,
  ShieldAlert,
  RefreshCw,
  Ticket,
  ChevronDown,
  Layers,
  GraduationCap
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_Help.css";

const statusVariant = (s) => (s === "Open" ? "destructive" : s === "In Progress" ? "default" : s === "Escalated" ? "warning" : "success");
const priorityClass = (p) => {
  const norm = String(p || "").toLowerCase();
  if (norm === "urgent" || norm === "critical") return "ticket-priority--urgent";
  if (norm === "high") return "ticket-priority--high";
  if (norm === "low") return "ticket-priority--low";
  return "ticket-priority--med";
};

export default function AdminHelp() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionText, setResolutionText] = useState("");

  // Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateTicketTarget, setEscalateTicketTarget] = useState(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalating, setEscalating] = useState(false);

  // Create Ticket Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("Batches & Coursework");
  const [newPriority, setNewPriority] = useState("Normal");
  const [newDescription, setNewDescription] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/support/tickets");
      const rawData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : (res?.data?.tickets || []);
      setTickets(rawData);
    } catch (err) {
      console.error("[AD_Help fetchTickets error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenResolveModal = (ticket) => {
    setSelectedTicket(ticket);
    setResolutionText(ticket.resolutionNote || "");
  };

  const handleSaveResolution = async (newStatus) => {
    if (!selectedTicket) return;
    const cleanId = selectedTicket.dbId || selectedTicket.id;

    try {
      await apiFetch(`/admin/support/tickets/${cleanId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          resolutionNote: resolutionText || "Resolved by College Admin",
        }),
      });
      fetchTickets();
    } catch (err) {
      console.error("[AD_Help saveResolution error]", err);
    }

    setSelectedTicket(null);
    setResolutionText("");
  };

  const handleOpenEscalateModal = (ticket) => {
    setEscalateTicketTarget(ticket);
    setEscalationReason("");
    setEscalateModalOpen(true);
  };

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalateTicketTarget) return;
    setEscalating(true);
    const cleanId = escalateTicketTarget.dbId || escalateTicketTarget.id;

    try {
      const res = await apiFetch(`/admin/support/tickets/${cleanId}/escalate`, {
        method: "POST",
        body: JSON.stringify({
          escalationReason: escalationReason || "College Admin requested assistance from Super Admin.",
        }),
      });
      if (res && res.success) {
        setEscalateModalOpen(false);
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error("[AD_Help escalateTicket error]", err);
    } finally {
      setEscalating(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setCreatingTicket(true);
    try {
      const res = await apiFetch("/admin/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
        }),
      });
      if (res && res.success) {
        setCreateModalOpen(false);
        setNewSubject("");
        setNewDescription("");
        fetchTickets();
      }
    } catch (err) {
      console.error("[AD_Help createTicket error]", err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.requesterName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.batch || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const escalatedCount = tickets.filter((t) => t.status === "Escalated" || t.isEscalated).length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="admin-help-container">
      {/* ── Top Header Bar ── */}
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <span className="ui-section-badge">INSTITUTIONAL RESOLUTION DESK</span>
            <h2 className="ui-section-title">
              <HelpCircle size={22} className="ui-section-title-icon" />
              <span>College Admin Issue Resolution Center</span>
            </h2>
            <p className="ui-section-desc">
              Monitor student support requests, review academic issues, resolve department grievances, and escalate unresolved bottlenecks directly to Super Admin.
            </p>
          </div>
          <div className="ui-section-action">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={fetchTickets}
              disabled={loading}
              title="Refresh queue"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Send size={14} />
              <span>Raise Ticket to Super Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Top KPI Stat Cards Grid ── */}
      <div className="ad-help-kpi-grid">
        <div className="ad-help-kpi-card ad-help-kpi-card--open">
          <div className="ad-help-kpi-header">
            <span className="ad-help-kpi-label">Open Tickets</span>
            <div className="ad-help-kpi-icon-wrap ad-help-kpi-icon--rose">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="ad-help-kpi-value">{openCount}</div>
          <div className="ad-help-kpi-sub">Awaiting admin review</div>
        </div>

        <div className="ad-help-kpi-card ad-help-kpi-card--progress">
          <div className="ad-help-kpi-header">
            <span className="ad-help-kpi-label">In Progress</span>
            <div className="ad-help-kpi-icon-wrap ad-help-kpi-icon--amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="ad-help-kpi-value">{inProgressCount}</div>
          <div className="ad-help-kpi-sub">Under active investigation</div>
        </div>

        <div className="ad-help-kpi-card ad-help-kpi-card--escalated">
          <div className="ad-help-kpi-header">
            <span className="ad-help-kpi-label">Escalated Tickets</span>
            <div className="ad-help-kpi-icon-wrap ad-help-kpi-icon--purple">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="ad-help-kpi-value">{escalatedCount}</div>
          <div className="ad-help-kpi-sub">Transferred to Super Admin</div>
        </div>

        <div className="ad-help-kpi-card ad-help-kpi-card--resolved">
          <div className="ad-help-kpi-header">
            <span className="ad-help-kpi-label">Resolved Issues</span>
            <div className="ad-help-kpi-icon-wrap ad-help-kpi-icon--emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="ad-help-kpi-value">{resolvedCount}</div>
          <div className="ad-help-kpi-sub">Successfully addressed</div>
        </div>
      </div>

      {/* ── Role Security Notice Banner ── */}
      <div className="ad-help-notice-banner">
        <div className="ad-help-notice-icon-wrap">
          <ShieldCheck size={20} />
        </div>
        <div className="ad-help-notice-content">
          <div className="ad-help-notice-pill">ROLE-SECURED RESOLUTION PIPELINE</div>
          <div className="ad-help-notice-text">
            All tickets raised by students are routed directly to this College Admin resolution desk. Mentors and coordinators do not have access to these tickets. You can document resolutions or escalate complex platform queries to Super Admin.
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="admin-tickets-filter-bar">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by ticket ID, title, student name, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-status-tabs">
          {[
            { key: "All", label: "All", count: tickets.length },
            { key: "Open", label: "Open", count: openCount },
            { key: "In Progress", label: "In Progress", count: inProgressCount },
            { key: "Escalated", label: "Escalated", count: escalatedCount },
            { key: "Resolved", label: "Resolved", count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-status-tab ${statusFilter === tab.key ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="admin-tab-count-badge">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tickets List or Empty State ── */}
      <div className="help-tickets-list">
        {loading ? (
          <div className="ad-help-empty-card">
            <Clock size={32} style={{ animation: "spin 1.5s linear infinite", color: "#3b82f6", marginBottom: "16px" }} />
            <h3 className="ad-help-empty-title">Loading Support Queue...</h3>
            <p className="ad-help-empty-sub">Fetching real-time support tickets from the central database.</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="ad-help-empty-card">
            <div className="ad-help-empty-icon-wrap">
              <ShieldCheck size={36} />
            </div>
            <span className="ad-help-empty-badge">RESOLUTION QUEUE CLEAR</span>
            <h3 className="ad-help-empty-title">No Active Support Tickets</h3>
            <p className="ad-help-empty-sub">
              All student support requests and campus queries are currently resolved. Any new issues submitted through the Student Help desk will appear here automatically for review.
            </p>
            <div className="ad-help-empty-actions">
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setCreateModalOpen(true)}
              >
                <Send size={14} />
                <span>Raise Ticket to Super Admin</span>
              </button>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={fetchTickets}
              >
                <RefreshCw size={14} />
                <span>Refresh Queue</span>
              </button>
            </div>

            <div className="ad-help-feature-cards">
              <div className="ad-help-feature-card">
                <h4 className="ad-help-feature-title">
                  <GraduationCap size={15} style={{ color: "#4f46e5" }} /> Direct Student Routing
                </h4>
                <p className="ad-help-feature-desc">
                  Tickets submitted by enrolled students land in this queue with verified student IDs and batch tags.
                </p>
              </div>
              <div className="ad-help-feature-card">
                <h4 className="ad-help-feature-title">
                  <ShieldAlert size={15} style={{ color: "#ea580c" }} /> 1-Click Escalation
                </h4>
                <p className="ad-help-feature-desc">
                  Forward unresolved infrastructure, permissions, or system issues directly to the Super Admin platform desk.
                </p>
              </div>
              <div className="ad-help-feature-card">
                <h4 className="ad-help-feature-title">
                  <Layers size={15} style={{ color: "#059669" }} /> Audit-Ready Logs
                </h4>
                <p className="ad-help-feature-desc">
                  Every resolution note, status update, and timestamp is stored permanently in MySQL for campus records.
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isResolved = t.status === "Resolved";
            const isEsc = t.isEscalated || t.status === "Escalated";
            const pClass = priorityClass(t.priority);

            return (
              <div key={t.id} className={`help-ticket-card ${pClass} ${isResolved ? "ticket-resolved" : ""}`}>
                <div className="help-ticket-body">
                  <div className="ticket-icon-wrap">
                    {isResolved ? (
                      <CheckCircle2 size={22} className="ticket-icon-resolved" />
                    ) : isEsc ? (
                      <ShieldAlert size={22} style={{ color: "#ea580c" }} />
                    ) : (
                      <MessageSquare size={22} className="ticket-icon-open" />
                    )}
                  </div>

                  <div className="ticket-info">
                    <div className="ticket-top-badges">
                      <span className="ticket-id-pill">{t.id}</span>
                      <span className="ticket-role-pill">{t.role || "STUDENT"}</span>
                      <span className="ticket-category-pill">{t.category || "General"}</span>
                      {isEsc && (
                        <span className="ticket-role-pill" style={{ background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }}>
                          <ShieldAlert size={11} style={{ marginRight: 4, display: "inline" }} /> Escalated to Super Admin
                        </span>
                      )}
                    </div>
                    <h4 className="ticket-title">{t.title}</h4>
                    {t.description && <p className="ticket-desc-snippet">{t.description}</p>}

                    <div className="ticket-meta">
                      <span className="ticket-student-avatar">
                        {(t.requesterName || "S")[0].toUpperCase()}
                      </span>
                      <span className="ticket-student">{t.requesterName || "Student"}</span>
                      <span className="ticket-sep">·</span>
                      <span className="ticket-batch">{t.batch || "General"}</span>
                      <span className="ticket-sep">·</span>
                      <Clock size={12} className="ticket-clock" />
                      <span className="ticket-time">{t.time || "Recently"}</span>
                    </div>

                    {isEsc && t.escalationReason && (
                      <div className="ticket-escalation-note-box">
                        <strong>Escalation Directive to Super Admin:</strong> {t.escalationReason}
                      </div>
                    )}

                    {t.resolutionNote && (
                      <div className="ticket-resolution-note-box">
                        <strong>Admin Resolution Note:</strong> {t.resolutionNote}
                      </div>
                    )}
                  </div>

                  <div className="ticket-right">
                    <span className={`ticket-priority ${pClass}`}>
                      <AlertCircle size={13} /> {t.priority || "Normal"}
                    </span>
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {!isEsc && !isResolved && (
                        <button
                          type="button"
                          className="ticket-escalate-btn"
                          onClick={() => handleOpenEscalateModal(t)}
                          title="Forward ticket to Super Admin desk"
                        >
                          <ShieldAlert size={13} />
                          <span>Escalate</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="ticket-resolve-btn"
                        onClick={() => handleOpenResolveModal(t)}
                      >
                        <Check size={14} />
                        <span>{isResolved ? "Edit Resolution" : "Resolve Issue"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL 1: RESOLVE SUPPORT ISSUE (PORTALED TO BODY) ── */}
      {selectedTicket &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTicket(null);
            }}
          >
            <div className="admin-modal-card">
              <div className="admin-modal-header">
                <div className="admin-modal-header-left">
                  <div className="admin-modal-icon-wrap admin-modal-icon-wrap--emerald">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="admin-modal-title">Resolve Support Issue</h3>
                    <p className="admin-modal-subtitle">
                      {selectedTicket.id} • Review requester details and log resolution action.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedTicket(null)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-ticket-details-summary">
                  <p>
                    <strong>Subject:</strong> {selectedTicket.title}
                  </p>
                  <p>
                    <strong>Requester:</strong> {selectedTicket.requesterName} (
                    {selectedTicket.role || "Student"} - {selectedTicket.batch || "General"})
                  </p>
                  {selectedTicket.description && (
                    <p>
                      <strong>Description:</strong> {selectedTicket.description}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <span className="ticket-category-pill">{selectedTicket.category || "General"}</span>
                    <span className="ticket-id-pill">{selectedTicket.priority || "Normal"} Priority</span>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Official Admin Response & Action Taken *
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    placeholder="Provide details on the action taken, steps resolved, or notes for the student..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                {!selectedTicket.isEscalated && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }}
                    onClick={() => {
                      const t = selectedTicket;
                      setSelectedTicket(null);
                      handleOpenEscalateModal(t);
                    }}
                  >
                    <ShieldAlert size={14} />
                    <span>Contact Super Admin</span>
                  </button>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => handleSaveResolution("In Progress")}
                  >
                    <Clock size={14} />
                    <span>Mark In Progress</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{ background: "#10b981" }}
                    onClick={() => handleSaveResolution("Resolved")}
                  >
                    <Check size={16} />
                    <span>Mark as Resolved & Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 2: ESCALATE TO SUPER ADMIN (PORTALED TO BODY) ── */}
      {escalateModalOpen &&
        escalateTicketTarget &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEscalateModalOpen(false);
            }}
          >
            <div className="admin-modal-card">
              <div className="admin-modal-header">
                <div className="admin-modal-header-left">
                  <div className="admin-modal-icon-wrap admin-modal-icon-wrap--orange">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="admin-modal-title">Escalate Ticket to Super Admin</h3>
                    <p className="admin-modal-subtitle">
                      {escalateTicketTarget.id} • Transfer this issue to the Super Admin platform desk.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setEscalateModalOpen(false)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmEscalate}>
                <div className="admin-modal-body">
                  <div className="admin-ticket-details-summary" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                    <p>
                      <strong>Subject:</strong> {escalateTicketTarget.title}
                    </p>
                    <p>
                      <strong>Requester:</strong> {escalateTicketTarget.requesterName} (
                      {escalateTicketTarget.role || "Student"})
                    </p>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Reason for Escalation / Message to Super Admin *
                    </label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      placeholder="Describe why this requires Super Admin intervention (e.g. system permissions, database adjustment, platform bug)..."
                      value={escalationReason}
                      onChange={(e) => setEscalationReason(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setEscalateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={escalating}
                    style={{ background: "#ea580c" }}
                  >
                    <Send size={14} />
                    <span>{escalating ? "Forwarding..." : "Confirm Escalation to Super Admin"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 3: RAISE TICKET DIRECTLY TO SUPER ADMIN (PORTALED TO BODY) ── */}
      {createModalOpen &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCreateModalOpen(false);
            }}
          >
            <div className="admin-modal-card">
              <div className="admin-modal-header">
                <div className="admin-modal-header-left">
                  <div className="admin-modal-icon-wrap">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="admin-modal-title">Raise Ticket to Super Admin</h3>
                    <p className="admin-modal-subtitle">
                      Submit platform bugs, account overrides, or technical inquiries to Super Admin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setCreateModalOpen(false)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTicketSubmit}>
                <div className="admin-modal-body">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Subject / Issue Title *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Brief summary of the issue..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-grid-2 mobile-pair-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Category</label>
                      <select
                        className="admin-form-select"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      >
                        <option value="Batches & Coursework">Batches & Coursework</option>
                        <option value="Attendance & QR">Attendance & QR</option>
                        <option value="Platform / System Bug">Platform / System Bug</option>
                        <option value="Access & Permissions">Access & Permissions</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Priority</label>
                      <select
                        className="admin-form-select"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Detailed Description & Context *</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      placeholder="Provide full details, context, or steps to reproduce for the Super Admin..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={creatingTicket}
                  >
                    <Send size={14} />
                    <span>{creatingTicket ? "Submitting..." : "Submit to Super Admin"}</span>
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
