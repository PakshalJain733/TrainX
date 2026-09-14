import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
  Check
} from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import '../../Student/Styles/Help.css';
import '../Styles/Help.css';

/* ── Inline dropdown for Mentor Help (CSS: Help.css .mentor-help-select-*) ── */
function MentorHelpSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-help-select-wrap${isOpen ? ' mentor-help-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-help-select-trigger${isOpen ? ' mentor-help-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-help-select-icon" />}
        <span className="mentor-help-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-help-select-arrow${isOpen ? ' mentor-help-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-help-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-help-select-option${isSel ? ' mentor-help-select-option--selected' : ''}`}>
                <span className="mentor-help-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-help-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const defaultMentorFaqs = [
  {
    id: 1,
    category: "Lab & Infrastructure",
    q: "How do I request software or compiler upgrades on lab workstations?",
    a: "Submit an IT Support Ticket under 'Lab & Infrastructure' specifying workstation numbers, software version, and lab schedule."
  },
  {
    id: 2,
    category: "Attendance & Roster",
    q: "What should I do if a live training session attendance lock expires?",
    a: "If session lock has passed (24h SLA), raise a support ticket under 'Attendance & Roster' to request administrative unlock."
  },
  {
    id: 3,
    category: "Curriculum & Study Material",
    q: "How do I publish new code notebooks or dataset files for my batch?",
    a: "Navigate to the Study Material section in your Mentor Workspace, select your subject module, and click 'Upload Resource'."
  },
  {
    id: 4,
    category: "Portal / System Error",
    q: "Why are AI Mock Interview evaluation reports showing pending status?",
    a: "AI evaluation jobs process asynchronously within 15 minutes of interview completion. If pending > 1 hour, raise a support ticket."
  }
];

const initialMentorTickets = [
  {
    id: "TKT-MNT-301",
    subject: "Requesting Linux GCC Compiler update on Lab 03 Workstations",
    category: "Lab & Infrastructure",
    priority: "High",
    status: "In Progress",
    created: "2026-09-08",
    description: "BE-CS-A students require gcc-11 version for C++20 features during upcoming lab exams. Currently installed version is gcc-9.",
    resolution: "IT Admin is updating lab workstation images. Expected resolution by tomorrow 10 AM."
  },
  {
    id: "TKT-MNT-302",
    subject: "Attendance record lock correction for Sept 2nd Live Session",
    category: "Attendance & Roster",
    priority: "Normal",
    status: "Resolved",
    created: "2026-09-05",
    description: "Internet disruption caused session log sync delay. Need manual unlock to submit attendance for 14 students.",
    resolution: "Attendance lock opened by College Admin. Session status updated."
  }
];

const kbGuides = [
  {
    title: "Mentor & Trainer Code Evaluation Guidelines",
    desc: "Rubric and rules for evaluating student programming assignments, mock viva, and automated test cases.",
    size: "2.4 MB",
    type: "PDF Document"
  },
  {
    title: "Attendance & Classroom Conduct Policy",
    desc: "Mandatory 75% attendance criteria, medical leave verifications, and defaulter list generation steps.",
    size: "1.1 MB",
    type: "PDF Document"
  },
  {
    title: "Lab Machine Hardware & IDE Setup Manual",
    desc: "Configuring VS Code, Python virtualenv, MySQL Server, and Docker containers in campus computer centers.",
    size: "1.8 MB",
    type: "PDF Document"
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq"); // 'faq' | 'tickets' | 'guides'
  const [selectedCat, setSelectedCat] = useState("All");
  const [openFaqId, setOpenFaqId] = useState(1);
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState(initialMentorTickets);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "Lab & Infrastructure",
    priority: "Normal",
    description: ""
  });

  const categories = ["All", "Lab & Infrastructure", "Attendance & Roster", "Curriculum & Study Material", "Portal / System Error"];

  const filteredFaqs = defaultMentorFaqs.filter((f) => {
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
      id: `TKT-MNT-${Math.floor(100 + Math.random() * 900)}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: "Open",
      created: new Date().toISOString().split("T")[0],
      description: newTicket.description,
      resolution: ""
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ subject: "", category: "Lab & Infrastructure", priority: "Normal", description: "" });
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
                  placeholder="e.g. Need GCC 11 update on Lab 3 machines"
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
                      { value: "Lab & Infrastructure", label: "Lab & Infrastructure" },
                      { value: "Attendance & Roster", label: "Attendance & Roster" },
                      { value: "Curriculum & Study Material", label: "Curriculum & Study Material" },
                      { value: "Portal / System Error", label: "Portal / System Error" },
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
                  placeholder="Provide all relevant details, workstation numbers, affected lab hours..."
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

