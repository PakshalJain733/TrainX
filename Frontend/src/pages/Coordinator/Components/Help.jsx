import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Search,
  Plus,
  ChevronDown,
  Ticket,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../../Student/Styles/Help.css";
import "../Styles/Help.css";

const defaultFaqs = [
  {
    id: 1,
    category: "Academics Governance",
    q: "How do I reallocate an industry trainer to a new cohort?",
    a: "Navigate to the Mentors & Trainers tab, click 'Re-allocate Batch', select the new mentor from the verified trainer roster, and submit."
  },
  {
    id: 2,
    category: "Attendance & Leave",
    q: "How do I grant medical or hackathon attendance overrides?",
    a: "Go to the Requests & Approvals section to review uploaded medical certificates or OD forms, and click 'Approve Attendance Override'."
  },
  {
    id: 3,
    category: "Practice & Coding",
    q: "What should I do if students report compiler timeouts on quiz problems?",
    a: "Check the problem test case memory limit. If the issue affects an entire batch, submit an IT Support Ticket under Practice & Coding category."
  },
  {
    id: 4,
    category: "Batch Allocation",
    q: "How can I export weekly batch performance reports for HOD review?",
    a: "Navigate to Weekly Reports → select target batch → click 'Export CSV Report' to download formatted performance metrics."
  },
  {
    id: 5,
    category: "Academics Governance",
    q: "What is the escalation SLA for Super Admin support ticket resolution?",
    a: "Critical priority system bugs are investigated within 2 hours. High and Normal tickets are resolved within 24 hours."
  }
];

const initialCoordinatorTickets = [
  {
    id: "TKT-8041",
    subject: "Python Compiler Timeout on Large Data Structure Tests",
    category: "Practice & Coding",
    priority: "High",
    status: "In Progress",
    created: "Yesterday, 04:30 PM",
    description: "Online coding compiler taking >10s to run Graph Traversal test cases for CSE 2026 Alpha Cohort.",
    resolution: "Engineering team is optimizing container execution pool."
  },
  {
    id: "TKT-7920",
    subject: "Weekly Performance Analytics Export CSV Failing",
    category: "Weekly Reports",
    priority: "Critical",
    status: "Resolved",
    created: "02 Sep 2026",
    description: "Exporting weekly report CSV for 400+ students throws 504 Gateway Timeout.",
    resolution: "Super Admin increased Nginx proxy timeout limit to 60s and optimized database query pagination."
  }
];

const kbGuides = [
  {
    title: "Department Coordinator Operations Manual",
    desc: "Comprehensive guide on managing batches, attendance overrides, and faculty roster allocations.",
    size: "3.1 MB",
    type: "PDF Document"
  },
  {
    title: "Governance & Escalation Policy",
    desc: "Official guidelines for handling student disputes, medical leave approvals, and SLA escalation paths.",
    size: "1.4 MB",
    type: "PDF Document"
  },
  {
    title: "Quiz & Code Assessment Administration Guide",
    desc: "Rules for setting test case constraints, time limits, and analyzing batch-wide score distributions.",
    size: "2.2 MB",
    type: "PDF Document"
  }
];

export default function CoordinatorHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq"); // 'faq' | 'tickets' | 'guides'
  const [selectedCat, setSelectedCat] = useState("All");
  const [openFaqId, setOpenFaqId] = useState(1);
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState(initialCoordinatorTickets);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "Academics Governance",
    priority: "Normal",
    description: ""
  });

  const categories = ["All", "Academics Governance", "Attendance & Leave", "Practice & Coding", "Batch Allocation"];

  const filteredFaqs = defaultFaqs.filter((f) => {
    const matchesCat = selectedCat === "All" || f.category === selectedCat;
    const matchesQuery =
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    const createdTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: "Open",
      created: "Just now",
      description: newTicket.description,
      resolution: ""
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ subject: "", category: "Academics Governance", priority: "Normal", description: "" });
    setIsTicketModalOpen(false);
    setActiveTab("tickets");
  };

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleFeedback = (faqId, type) => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: type }));
  };

  return (
    <div className="help-page-wrapper">
      <SectionHeader
        title="Help & Support"
        description="Find answers to common questions or reach out to our support team."
      />

      {/* Support Channel Quick Cards */}
      <div className="help-channels-grid">
        <div
          className="help-channel-card-modern"
          onClick={() => setIsTicketModalOpen(true)}
        >
          <div className="help-channel-icon-avatar help-icon-blue">
            <Ticket size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-blue">IT SUPPORT DESK</span>
            <h3 className="help-channel-title">Raise Support Ticket</h3>
            <p className="help-channel-sub">Report system bugs, login errors, or missing attendance records.</p>
            <span className="help-channel-action-link">+ Create New Ticket →</span>
          </div>
        </div>

        <div
          className="help-channel-card-modern"
          onClick={() => { window.location.href = "mailto:support@acadnexus.com"; }}
        >
          <div className="help-channel-icon-avatar help-icon-emerald">
            <MessageCircle size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-emerald">EMAIL ASSISTANCE</span>
            <h3 className="help-channel-title">Email Support</h3>
            <p className="help-channel-sub">Direct response from department coordinator within 24 hours.</p>
            <span className="help-channel-action-link help-link-emerald">support@acadnexus.com →</span>
          </div>
        </div>

        <div
          className="help-channel-card-modern"
          onClick={() => { window.location.href = "tel:+919876543210"; }}
        >
          <div className="help-channel-icon-avatar help-icon-purple">
            <Phone size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-purple">HELPLINE</span>
            <h3 className="help-channel-title">Campus Hotline</h3>
            <p className="help-channel-sub">Mon – Fri, 9:00 AM – 6:00 PM</p>
            <span className="help-channel-action-link help-link-purple">+91 98765 43210 →</span>
          </div>
        </div>
      </div>

      {/* Main Section Header with Tabs */}
      <div className="help-section-bar">
        <div className="help-tabs-row">
          <button
            className={`help-tab-btn ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            <HelpCircle size={15} /> Knowledge Base & FAQs
          </button>
          <button
            className={`help-tab-btn ${activeTab === "tickets" ? "active" : ""}`}
            onClick={() => setActiveTab("tickets")}
          >
            <Ticket size={15} /> My Support Tickets ({tickets.length})
          </button>
          <button
            className={`help-tab-btn ${activeTab === "guides" ? "active" : ""}`}
            onClick={() => setActiveTab("guides")}
          >
            <FileText size={15} /> Downloads & Manuals
          </button>
        </div>
      </div>

      {/* TAB 1: KNOWLEDGE BASE & FAQS */}
      {activeTab === "faq" && (
        <div className="help-faq-column">
          {/* Category Filter Pills */}
          <div className="help-cat-pills-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`help-cat-pill ${selectedCat === cat ? "active" : ""}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion Items */}
          {filteredFaqs.length === 0 ? (
            <div className="help-empty-state">
              <HelpCircle size={36} className="help-empty-icon" />
              <h4 className="help-empty-title">No FAQs found matching "{searchQuery}"</h4>
              <p className="help-empty-desc">Try clearing your search query or submit a support ticket to our IT team.</p>
            </div>
          ) : (
            <div className="help-faq-list">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className={`help-faq-item-card ${isOpen ? "open" : ""}`}>
                    <div className="help-faq-header" onClick={() => toggleFaq(faq.id)}>
                      <h4 className="help-faq-question">
                        <HelpCircle size={18} color="#3b82f6" />
                        {faq.q}
                      </h4>
                      <div className="help-faq-actions">
                        <span className="help-faq-category-tag">{faq.category}</span>
                        <ChevronDown size={18} className="help-faq-toggle-icon" />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="help-faq-body">
                        <p>{faq.a}</p>
                        <div className="help-faq-helpful-row">
                          <span>Was this answer helpful?</span>
                          <button
                            className={`help-helpful-btn ${helpfulFeedback[faq.id] === "yes" ? "active" : ""}`}
                            onClick={() => handleFeedback(faq.id, "yes")}
                            style={helpfulFeedback[faq.id] === "yes" ? { background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" } : {}}
                          >
                            <ThumbsUp size={12} /> Yes
                          </button>
                          <button
                            className={`help-helpful-btn ${helpfulFeedback[faq.id] === "no" ? "active" : ""}`}
                            onClick={() => handleFeedback(faq.id, "no")}
                            style={helpfulFeedback[faq.id] === "no" ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" } : {}}
                          >
                            <ThumbsDown size={12} /> No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUPPORT TICKETS */}
      {activeTab === "tickets" && (
        <div className="help-tickets-card">
          <div className="help-tickets-table-wrapper">
            <table className="help-tickets-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject & Details</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Date Raised</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="help-table-empty-cell">
                      No support tickets raised yet.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td><span className="help-ticket-id">{t.id}</span></td>
                      <td className="help-table-subject">
                        <div>{t.subject}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.description}</div>
                        {t.resolution && (
                          <div style={{ marginTop: '6px', background: '#ecfdf5', color: '#065f46', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            <strong>Resolution:</strong> {t.resolution}
                          </div>
                        )}
                      </td>
                      <td><span className="help-faq-category-tag">{t.category}</span></td>
                      <td>
                        <span className={`help-priority-pill ${t.priority === "High" || t.priority === "Critical" ? "help-priority-high" : "help-priority-normal"}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="help-table-date">{t.created}</td>
                      <td>
                        <span className={`help-ticket-status-pill ${t.status === "In Progress"
                            ? "help-status-in-progress"
                            : t.status === "Resolved"
                              ? "help-status-resolved"
                              : "help-status-open"
                          }`}>
                          {t.status === "In Progress" && "⏳ "}
                          {t.status === "Resolved" && "✓ "}
                          {t.status === "Open" && "● "}
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOWNLOADS & USER GUIDES */}
      {activeTab === "guides" && (
        <div className="help-kb-grid">
          {kbGuides.map((guide, idx) => (
            <div key={idx} className="help-kb-card">
              <div className="help-kb-header">
                <div className="help-kb-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="help-kb-title">{guide.title}</h4>
                  <span className="help-guide-meta">{guide.type} • {guide.size}</span>
                </div>
              </div>
              <p className="help-kb-desc">{guide.desc}</p>
              <button
                className="help-kb-download-btn"
                onClick={() => {
                  alert(`Downloading ${guide.title}...`);
                }}
              >
                <Download size={14} /> Download PDF Guide
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: RAISE SUPPORT TICKET */}
      {isTicketModalOpen && (
        <div className="help-modal-overlay">
          <div className="help-modal-card">
            <div className="help-modal-header">
              <h3 className="help-modal-title">
                <Ticket size={18} color="#60a5fa" /> Raise New Support Ticket
              </h3>
              <button className="help-modal-close-btn" onClick={() => setIsTicketModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="help-modal-form">
              <div className="help-form-group">
                <label className="help-form-label">Subject / Issue Summary *</label>
                <input
                  type="text"
                  className="help-form-input"
                  placeholder="e.g. Compiler pool size limit reached during semester exam"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                />
              </div>

              <div className="help-grid-2col">
                <div className="help-form-group">
                  <label className="help-form-label">Category</label>
                  <select
                    className="help-form-select"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="Academics Governance">Academics Governance</option>
                    <option value="Attendance & Leave">Attendance & Leave</option>
                    <option value="Practice & Coding">Practice & Coding</option>
                    <option value="Batch Allocation">Batch Allocation</option>
                    <option value="System Bug">System Bug</option>
                  </select>
                </div>

                <div className="help-form-group">
                  <label className="help-form-label">Priority Level</label>
                  <select
                    className="help-form-select"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Urgent</option>
                  </select>
                </div>
              </div>

              <div className="help-form-group">
                <label className="help-form-label">Detailed Description *</label>
                <textarea
                  className="help-form-textarea"
                  rows={4}
                  placeholder="Provide all relevant details, affected batch, error logs, or urgent details..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                />
              </div>

              <div className="help-modal-footer">
                <button type="button" className="help-cancel-btn" onClick={() => setIsTicketModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="help-submit-btn">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

