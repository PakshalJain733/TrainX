import React, { useState, useEffect } from "react";
import { MessageSquare, HelpCircle, CheckCircle2, Clock, AlertCircle, Search, Filter, ShieldCheck, UserCheck, X, Check, Send, ShieldAlert, CornerUpRight } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import "../Styles/AD_Help.css";

const statusVariant = (s) => s === "Open" ? "destructive" : s === "In Progress" ? "default" : s === "Escalated" ? "warning" : "success";
const priorityClass = (p) => p === "High" || p === "Urgent" ? "ticket-priority--high" : p === "Medium" || p === "Normal" ? "ticket-priority--med" : "ticket-priority--low";

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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/support/tickets');
      const rawData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : (res?.data?.tickets || []);
      setTickets(rawData);
    } catch (err) {
      console.error('[AD_Help fetchTickets error]', err);
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
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          resolutionNote: resolutionText || `Resolved by College Admin`
        })
      });
      fetchTickets();
    } catch (err) {
      console.error('[AD_Help saveResolution error]', err);
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
        method: 'POST',
        body: JSON.stringify({
          escalationReason: escalationReason || 'College Admin requested assistance from Super Admin.'
        })
      });
      if (res && res.success) {
        setEscalateModalOpen(false);
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('[AD_Help escalateTicket error]', err);
    } finally {
      setEscalating(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.requesterName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.batch || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;
  const escalatedCount = tickets.filter(t => t.status === "Escalated" || t.isEscalated).length;
  const resolvedCount = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="admin-help-container">
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <HelpCircle size={22} className="ui-section-title-icon" />
              <span>College Admin Issue Resolution Center</span>
            </h2>
            <p className="ui-section-desc">
              Review, manage, and resolve tickets submitted by students, mentors, and department coordinators. Forward unresolvable issues directly to Super Admin.
            </p>
          </div>
          <div className="ui-section-action">
            <div className="help-stats">
              <span className="help-stat-badge help-stat-open">{openCount} Open</span>
              <span className="help-stat-badge help-stat-inprogress">{inProgressCount} In Progress</span>
              <span className="help-stat-badge" style={{ background: '#ffedd5', color: '#c2410c' }}>{escalatedCount} Escalated</span>
              <span className="help-stat-badge help-stat-resolved">{resolvedCount} Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-tickets-filter-bar">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by ticket ID, title, student/mentor name, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="admin-status-tabs">
          {["All", "Open", "In Progress", "Escalated", "Resolved"].map((st) => (
            <button
              key={st}
              className={`admin-status-tab ${statusFilter === st ? "active" : ""}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="help-tickets-list">
        {loading ? (
          <div className="admin-empty-state-card">
            <Clock size={28} style={{ animation: "spin 1.5s linear infinite", color: "#3b82f6" }} />
            <p className="admin-empty-state-title">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="admin-empty-state-card">
            <MessageSquare size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No support tickets found</p>
            <p className="admin-empty-state-sub">Student, mentor, and coordinator issues will appear here for resolution.</p>
          </div>
        ) : (
          filteredTickets.map(t => (
            <Card key={t.id} className={`help-ticket-card ${t.status === "Resolved" ? "ticket-resolved" : ""}`}>
              <CardContent className="help-ticket-body">
                <div className="ticket-icon-wrap">
                  {t.status === "Resolved" ? (
                    <CheckCircle2 size={20} className="ticket-icon-resolved" />
                  ) : t.isEscalated || t.status === "Escalated" ? (
                    <ShieldAlert size={20} style={{ color: "#ea580c" }} />
                  ) : (
                    <MessageSquare size={20} className="ticket-icon-open" />
                  )}
                </div>

                <div className="ticket-info">
                  <div className="ticket-top-badges">
                    <span className="ticket-id-pill">{t.id}</span>
                    <span className="ticket-role-pill">{t.role}</span>
                    <span className="ticket-category-pill">{t.category}</span>
                    {(t.isEscalated || t.status === "Escalated") && (
                      <span className="ticket-role-pill" style={{ background: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" }}>
                        <ShieldAlert size={11} style={{ marginRight: 4, display: "inline" }} /> Escalated to Super Admin
                      </span>
                    )}
                  </div>
                  <h4 className="ticket-title">{t.title}</h4>
                  <p className="ticket-desc-snippet">{t.description}</p>

                  <div className="ticket-meta">
                    <span className="ticket-student">{t.requesterName}</span>
                    <span className="ticket-sep">·</span>
                    <span className="ticket-batch">{t.batch}</span>
                    <span className="ticket-sep">·</span>
                    <Clock size={12} className="ticket-clock" />
                    <span className="ticket-time">{t.time}</span>
                  </div>

                  {t.isEscalated && t.escalationReason && (
                    <div className="ticket-resolution-note-box" style={{ background: "#fff7ed", borderColor: "#f97316", color: "#9a3412" }}>
                      <strong>Escalation Reason to Super Admin:</strong> {t.escalationReason}
                    </div>
                  )}

                  {t.resolutionNote && (
                    <div className="ticket-resolution-note-box">
                      <strong>Admin Response Note:</strong> {t.resolutionNote}
                    </div>
                  )}
                </div>

                <div className="ticket-right">
                  <span className={`ticket-priority ${priorityClass(t.priority)}`}>
                    <AlertCircle size={13} /> {t.priority}
                  </span>
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {(!t.isEscalated && t.status !== "Resolved") && (
                      <button
                        className="admin-btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "11.5px", background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" }}
                        onClick={() => handleOpenEscalateModal(t)}
                        title="Contact & Escalate ticket to Super Admin"
                      >
                        <ShieldAlert size={13} style={{ marginRight: 4 }} /> Escalate to Super Admin
                      </button>
                    )}

                    <button
                      className="ticket-resolve-btn"
                      onClick={() => handleOpenResolveModal(t)}
                    >
                      {t.status === "Resolved" ? "Edit Resolution" : "Resolve Issue"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* RESOLUTION MODAL */}
      {selectedTicket && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-badge">{selectedTicket.id}</span>
                <h3 className="admin-modal-title">Resolve Support Issue</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedTicket(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-ticket-details-summary">
                <p><strong>Title:</strong> {selectedTicket.title}</p>
                <p><strong>Submitted by:</strong> {selectedTicket.requesterName} ({selectedTicket.role} - {selectedTicket.batch})</p>
                <p><strong>Description:</strong> {selectedTicket.description}</p>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Official Admin Response & Action Taken</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  placeholder="Enter resolution details, action steps, or verification notes..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer" style={{ justifyContent: "space-between" }}>
              {!selectedTicket.isEscalated ? (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" }}
                  onClick={() => {
                    handleOpenEscalateModal(selectedTicket);
                  }}
                >
                  <ShieldAlert size={14} style={{ marginRight: 4 }} /> Contact Super Admin
                </button>
              ) : <div />}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => handleSaveResolution("In Progress")}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => handleSaveResolution("Resolved")}
                >
                  <Check size={16} /> Mark as Resolved & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATION TO SUPER ADMIN MODAL */}
      {escalateModalOpen && escalateTicketTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "500px" }}>
            <div className="admin-modal-header" style={{ background: "#9a3412" }}>
              <div>
                <span className="admin-modal-badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                  {escalateTicketTarget.id}
                </span>
                <h3 className="admin-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldAlert size={20} /> Escalate Ticket to Super Admin
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => setEscalateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmEscalate}>
              <div className="admin-modal-body">
                <div className="admin-ticket-details-summary" style={{ background: "#fff7ed", borderColor: "#fdba74" }}>
                  <p><strong>Ticket:</strong> {escalateTicketTarget.title}</p>
                  <p><strong>Requester:</strong> {escalateTicketTarget.requesterName} ({escalateTicketTarget.role})</p>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Reason for Escalation / Message to Super Admin *
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={4}
                    placeholder="Describe why this issue requires Super Admin intervention (e.g. system permissions, backend bug, user account override)..."
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
                  <Send size={15} /> {escalating ? "Forwarding..." : "Send to Super Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


