import React, { useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowLeft,
  Send
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import "../Style/CoordinatorHelp.css";

const initialTickets = [
  {
    id: 1,
    student: "Ganesh Shinde",
    rollNo: "ECS-042",
    batch: "Python Backend (PY-BE)",
    category: "Coding Lab Error",
    subject: "Task 02: Pydantic Validation error for nested models",
    description: "I am getting a ValidationError when submitting the nested JSON schema in Task 2. Can you please check if the test case expects exact string match or custom objects?",
    time: "3 hours ago",
    status: "Open",
    replies: []
  },
  {
    id: 2,
    student: "Riya Shah",
    rollNo: "ECS-001",
    batch: "Python Backend (PY-BE)",
    category: "Attendance Correction",
    subject: "Marked absent on Oct 05 due to duty leave approval delay",
    description: "My duty leave application for Smart India Hackathon on Oct 5 was approved yesterday, but my attendance record still shows absent. Please help update the logs.",
    time: "1 day ago",
    status: "Resolved",
    replies: [
      {
        sender: "Coordinator",
        text: "Attendance record updated. It should reflect 'Present (Duty Leave)' now. Please check."
      }
    ]
  },
  {
    id: 3,
    student: "Kabir Menon",
    rollNo: "COMPS-015",
    batch: "DSA Algorithms (DSA-ADV)",
    category: "Practice Platform Issue",
    subject: "Leetcode submission error for tree inversion",
    description: "When submitting my code for Invert Binary Tree, it shows 'Internal Server Error (Compile failure)'. Other codes compile fine. Is the backend compile server online?",
    time: "2 days ago",
    status: "Open",
    replies: []
  }
];

export default function CoordinatorHelp() {
  const [tickets, setTickets] = useState(initialTickets);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText) return;

    setTickets(
      tickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: "Resolved",
              replies: [...t.replies, { sender: "Coordinator", text: replyText }]
            }
          : t
      )
    );

    setSelectedTicket({
      ...selectedTicket,
      status: "Resolved",
      replies: [...selectedTicket.replies, { sender: "Coordinator", text: replyText }]
    });

    setReplyText("");
    alert("Reply sent! Ticket status updated to Resolved.");
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="student-page-inner stack-6 help-wrapper">
      {selectedTicket ? (
        <div className="stack-6 animate-fade-in">
          {/* Header */}
          <div className="ticket-detail-header">
            <button className="back-btn" onClick={() => setSelectedTicket(null)}>
              <ArrowLeft size={16} /> Back to Desk
            </button>
            <div className="ticket-detail-meta">
              <h1 className="ticket-detail-title">Support Ticket #{selectedTicket.id}</h1>
              <p className="ticket-detail-sub">
                Submitted by {selectedTicket.student} · {selectedTicket.time}
              </p>
            </div>
          </div>

          <div className="ticket-detail-grid">
            {/* Left Content Card */}
            <div className="ticket-content-card shadow-sm stack-5">
              <div className="ticket-info-header-row">
                <div className="meta-block">
                  <span className="info-label">Category</span>
                  <span className="info-value">{selectedTicket.category}</span>
                </div>
                <div className="meta-block">
                  <span className="info-label">Batch</span>
                  <span className="info-value">{selectedTicket.batch}</span>
                </div>
                <div className="meta-block">
                  <span className="info-label">Status</span>
                  <span className={`status-tag ${selectedTicket.status === "Resolved" ? "status-tag--success" : "status-tag--warning"}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <div className="detail-section stack-2">
                <span className="info-label">Subject</span>
                <h3 className="ticket-detail-subject">{selectedTicket.subject}</h3>
              </div>

              <div className="detail-section stack-2">
                <span className="info-label">Student Message</span>
                <p className="detail-text-value">{selectedTicket.description}</p>
              </div>

              {/* Chat Thread */}
              {selectedTicket.replies.length > 0 && (
                <div className="detail-section stack-3">
                  <span className="info-label">Resolution Thread</span>
                  <div className="replies-list stack-2">
                    {selectedTicket.replies.map((rep, idx) => (
                      <div key={idx} className="reply-bubble coordinator">
                        <span className="reply-sender">{rep.sender} Response</span>
                        <p className="reply-text-content">{rep.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Action Panel */}
            <div className="reply-panel-card shadow-sm stack-4">
              <h3 className="panel-title">Solve Ticket</h3>
              <div className="divider"></div>

              {selectedTicket.status === "Resolved" ? (
                <div className="resolved-status-box stack-2">
                  <CheckCircle size={28} className="resolved-icon" />
                  <h4>Ticket Resolved</h4>
                  <p>A response has been sent and this support ticket is marked as closed.</p>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="stack-4">
                  <div className="form-group">
                    <label>Your Response Message</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Write your explanation or resolution details..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="btn-send-reply">
                    <Send size={14} /> Send Reply & Close
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div>
            <h1 className="help-page-title">Support Tickets Desk</h1>
            <p className="help-page-subtitle">Resolve coding doubts, platform bugs, and administrative queries from students</p>
          </div>

          {/* Filters */}
          <div className="help-filters-bar shadow-sm">
            <div className="filter-item">
              <Filter size={14} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Tickets</option>
                <option value="Open">Open Queries</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* List Card */}
          <div className="tickets-list-card shadow-sm">
            <div className="tickets-list-header">
              <h3 className="list-title">Active Queries</h3>
            </div>
            <div className="tickets-list stack-2">
              {filteredTickets.length === 0 ? (
                <div className="empty-tickets">
                  All support queries have been solved!
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="ticket-list-row"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <div className="row-left-wrap">
                      <div className={`ticket-status-icon ${t.status === "Resolved" ? "resolved" : "open"}`}>
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <h4 className="ticket-row-subject">{t.subject}</h4>
                        <p className="ticket-row-meta">
                          {t.student} · {t.batch} · {t.category}
                        </p>
                      </div>
                    </div>
                    <div className="row-right-wrap">
                      <span className="ticket-time-badge">{t.time}</span>
                      <span className={`status-tag ${t.status === "Resolved" ? "status-tag--success" : "status-tag--warning"}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
