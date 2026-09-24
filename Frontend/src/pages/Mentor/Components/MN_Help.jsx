import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Search,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
  Ticket,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  X,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Help.css";

function MentorHelpSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`student-help-select-wrap${isOpen ? ' student-help-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`student-help-select-trigger${isOpen ? ' student-help-select-trigger--open' : ''}`}>
        {Icon && <Icon className="student-help-select-icon" />}
        <span className="student-help-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`student-help-select-arrow${isOpen ? ' student-help-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="student-help-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`student-help-select-option${isSel ? ' student-help-select-option--selected' : ''}`}>
                <span className="student-help-select-option-label">{opt.label}</span>
                {isSel && <Check className="student-help-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const defaultFaqs = [
  {
    id: 1,
    category: "Attendance & QR",
    q: "How do I mark my attendance via QR code?",
    a: "Go to Attendance tab → click 'Scan QR Code' and point your camera at the dynamic QR code displayed on the faculty's lecture screen."
  },
  {
    id: 2,
    category: "Academics & Labs",
    q: "Where can I view my internal assessment marks and lab feedback?",
    a: "Navigate to Academics → select your course → click the 'Assessments & Labs' tab to view real-time marks and offline viva feedback."
  },
  {
    id: 3,
    category: "Academics & Labs",
    q: "How do I submit my practical lab assignment report?",
    a: "Open your practical experiment workspace from the Academics page. You can ask the AI Assistant to generate the lab report side-by-side, edit any section, attach your code file, and click 'Submit Assignment'."
  },
  {
    id: 4,
    category: "Account & Security",
    q: "My profile or registration details are incorrect. How do I update them?",
    a: "Navigate to Account / Settings → Profile Details. Update your roll number, phone, or email, and click 'Save Changes'. You can also raise a support ticket if your branch is locked."
  },
  {
    id: 5,
    category: "Exams & Marks",
    q: "What should I do if my attendance falls below the 75% threshold?",
    a: "Check your subject-wise breakdown in the Attendance section. If you missed classes due to medical reasons, submit a Medical Leave Request ticket along with doctor certificates."
  }
];

const kbGuides = [
  {
    title: "Faculty & Mentor Platform Manual",
    desc: "Complete guide on scheduling live sessions, evaluating submissions, and reviewing AI skill diagnostics.",
    size: "2.8 MB",
    type: "PDF Document"
  },
  {
    title: "Attendance & Defaulters Governance Rules",
    desc: "Guidelines for flagging defaulter students, issuing warnings, and managing medical leave approvals.",
    size: "1.4 MB",
    type: "PDF Document"
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [selectedCat, setSelectedCat] = useState("All");
  const [openFaqId, setOpenFaqId] = useState(1);
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState([
    {
      id: "TICK-8041",
      subject: "Unable to sync quiz scores for Batch B-CSE",
      category: "Academics & Labs",
      priority: "High",
      created: "2026-09-12",
      status: "In Progress"
    },
    {
      id: "TICK-7990",
      subject: "Request for student cohort list update",
      category: "Account & Security",
      priority: "Normal",
      created: "2026-09-08",
      status: "Resolved"
    }
  ]);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "Academics & Labs",
    priority: "Normal",
    description: ""
  });

  const categories = ["All", "Attendance & QR", "Academics & Labs", "Account & Security", "Exams & Marks"];

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
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      created: new Date().toISOString().split("T")[0],
      status: "Open"
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ subject: "", category: "Academics & Labs", priority: "Normal", description: "" });
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
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
          Help & Support
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
          Find answers to common questions or reach out to our support team.
        </p>
      </div>

      {/* Support Channel Quick Cards */}
      <div className="help-channels-grid">
        <div
          className="help-channel-card-modern"
          onClick={() => setIsTicketModalOpen(true)}
          style={{ cursor: "pointer" }}
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
          style={{ cursor: "pointer" }}
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
          style={{ cursor: "pointer" }}
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

      {/* Main Section Tabs */}
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
                      <td className="help-table-subject">{t.subject}</td>
                      <td><span className="help-faq-category-tag">{t.category}</span></td>
                      <td>
                        <span className={`help-priority-pill ${t.priority === "High" ? "help-priority-high" : "help-priority-normal"}`}>
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
                  placeholder="e.g. Attendance marked absent for OS Lecture 4"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                />
              </div>

              <div className="help-grid-2col">
                <div className="help-form-group">
                  <label className="help-form-label">Category</label>
                  <MentorHelpSelect
                    value={newTicket.category}
                    options={[
                      { value: "Attendance & QR", label: "Attendance & QR" },
                      { value: "Academics & Labs", label: "Academics & Labs" },
                      { value: "Account & Security", label: "Account & Security" },
                      { value: "Exams & Marks", label: "Exams & Marks" },
                      { value: "System / Portal Bug", label: "System / Portal Bug" },
                    ]}
                    onChange={(val) => setNewTicket({ ...newTicket, category: val })}
                  />
                </div>

                <div className="help-form-group">
                  <label className="help-form-label">Priority Level</label>
                  <MentorHelpSelect
                    value={newTicket.priority}
                    options={[
                      { value: "Normal", label: "Normal" },
                      { value: "High", label: "High Priority" },
                      { value: "Critical", label: "Critical Urgent" },
                    ]}
                    onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                  />
                </div>
              </div>

              <div className="help-form-group">
                <label className="help-form-label">Detailed Description *</label>
                <textarea
                  className="help-form-textarea"
                  rows={4}
                  placeholder="Provide all relevant details, date of class, subject name, or error messages..."
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


