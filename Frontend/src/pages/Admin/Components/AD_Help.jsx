import React, { useState } from "react";
import { MessageSquare, HelpCircle, CheckCircle2, Clock, AlertCircle, Search, Filter, ShieldCheck, UserCheck, X, Check, Send } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AD_Help.css";

const initialTickets = [];

const statusVariant = (s) => s === "Open" ? "destructive" : s === "In Progress" ? "default" : "success";
const priorityClass = (p) => p === "High" ? "ticket-priority--high" : p === "Medium" ? "ticket-priority--med" : "ticket-priority--low";

export default function AdminHelp() {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionText, setResolutionText] = useState("");

  const handleOpenResolveModal = (ticket) => {
    setSelectedTicket(ticket);
    setResolutionText(ticket.resolutionNote || "");
  };

  const handleSaveResolution = (newStatus) => {
    if (!selectedTicket) return;
    setTickets(tickets.map(t => t.id === selectedTicket.id ? {
      ...t,
      status: newStatus,
      resolutionNote: resolutionText || `Resolved by College Admin`
    } : t));
    setSelectedTicket(null);
    setResolutionText("");
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.batch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="admin-help-container">
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <HelpCircle size={22} className="ui-section-title-icon" />
              <span>College Admin Issue Resolution Center</span>
            </h2>
            <p className="ui-section-desc">
              Review, manage, and resolve tickets submitted by students, mentors, and department coordinators.
            </p>
          </div>
          <div className="ui-section-action">
            <div className="help-stats">
              <span className="help-stat-badge help-stat-open">{openCount} Open</span>
              <span className="help-stat-badge help-stat-inprogress">{inProgressCount} In Progress</span>
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
          {["All", "Open", "In Progress", "Resolved"].map((st) => (
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
        {filteredTickets.length === 0 ? (
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
                  ) : (
                    <MessageSquare size={20} className="ticket-icon-open" />
                  )}
                </div>

                <div className="ticket-info">
                  <div className="ticket-top-badges">
                    <span className="ticket-id-pill">{t.id}</span>
                    <span className="ticket-role-pill">{t.role}</span>
                    <span className="ticket-category-pill">{t.category}</span>
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

                  {t.resolutionNote && (
                    <div className="ticket-resolution-note-box">
                      <strong>Admin Resolution Note:</strong> {t.resolutionNote}
                    </div>
                  )}
                </div>

                <div className="ticket-right">
                  <span className={`ticket-priority ${priorityClass(t.priority)}`}>
                    <AlertCircle size={13} /> {t.priority}
                  </span>
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>

                  <button
                    className="ticket-resolve-btn"
                    onClick={() => handleOpenResolveModal(t)}
                  >
                    {t.status === "Resolved" ? "Edit Resolution" : "Resolve Issue"}
                  </button>
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

            <div className="admin-modal-footer">
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
      )}
    </div>
  );
}

