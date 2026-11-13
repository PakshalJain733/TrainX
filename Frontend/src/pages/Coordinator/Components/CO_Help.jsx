import React, { useState } from "react";
import { HelpCircle, MessageCircle, Phone, Search, ChevronDown, Sparkles, FileText, Download, ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";
import "../../Student/Styles/ST_Help.css";
import "../Styles/CO_Help.css";

const defaultFaqs = [
  {
    id: 1,
    category: "Attendance & QR",
    q: "How does batch-level session attendance sync with the college portal?",
    a: "Whenever a mentor conducts a session, students mark attendance via the dynamic QR code scanner. Attendance logs sync automatically with the central college database and reflect in daily coordinator reports."
  },
  {
    id: 2,
    category: "Academics & Labs",
    q: "How can coordinators view overall batch academic performance?",
    a: "Navigate to Batches or Academic Support. You can view aggregate test performance, completion rates of practical assignments, and identify students who fall below the passing threshold."
  },
  {
    id: 3,
    category: "Account & Security",
    q: "How do I update coordinator profile information or credentials?",
    a: "Click on your profile avatar in the navigation bar to access Profile & Settings. Ensure your college email and emergency phone number remain up to date for campus notifications."
  },
  {
    id: 4,
    category: "Exams & Marks",
    q: "How are college-wide assessments monitored?",
    a: "Coordinators have cross-batch visibility over scheduled quizzes and coding challenges, tracking student participation percentages and average score distributions."
  },
  {
    id: 5,
    category: "Account & Security",
    q: "Where are student support tickets and grievances managed?",
    a: "All support tickets are centrally handled and resolved by College Admin and Super Admin resolution desks to ensure formal tracking and institutional audit compliance."
  }
];

const kbGuides = [
  {
    title: "TrainX Coordinator Administration Manual",
    desc: "Complete operational manual for batch scheduling, mentor allocation, and student attendance supervision.",
    type: "PDF Document",
    size: "2.1 MB",
    content: "TrainX Coordinator Administration Manual\n\n1. Batch Monitoring\n2. Academic Oversight\n3. Notice Broadcasts\n4. Performance Reports"
  },
  {
    title: "Campus Notice & Broadcast Guidelines",
    desc: "Best practices for dispatching urgent alerts, batch notifications, and circulars across departments.",
    type: "PDF Document",
    size: "1.4 MB",
    content: "Notice & Broadcast Guidelines\n\n- Department-wide announcements\n- Priority tagging\n- Scheduled notices"
  },
  {
    title: "Academic Defaulters & Intervention Protocol",
    desc: "Workflow reference for tracking students requiring improvement and coordinating mentor remediation.",
    type: "PDF Document",
    size: "1.7 MB",
    content: "Defaulter Protocol\n\n- Risk assessment\n- Intervention directives\n- Action plan monitoring"
  }
];

export default function CoordinatorHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [selectedCat, setSelectedCat] = useState("All");
  const [openFaqId, setOpenFaqId] = useState(1);
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  const categories = ["All", "Attendance & QR", "Academics & Labs", "Account & Security", "Exams & Marks"];

  const filteredFaqs = defaultFaqs.filter((f) => {
    const matchesCat = selectedCat === "All" || f.category === selectedCat;
    const matchesQuery =
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleFeedback = (faqId, type) => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: type }));
  };

  const downloadPdfGuide = (guide) => {
    const blob = new Blob([guide.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${guide.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="coord-help-wrapper">
      <div className="coord-help-header">
        <h2 className="coord-help-title">
          <HelpCircle size={24} className="coord-help-icon" />
          Coordinator Help & Support Center
        </h2>
        <p className="coord-help-desc">
          Browse coordinator FAQs, download administration manuals, or contact campus administrators.
        </p>
      </div>

      {/* Support Channel Quick Cards */}
      <div className="help-channels-grid">
        <div className="help-channel-card-modern">
          <div className="help-channel-icon-avatar help-icon-blue">
            <ShieldCheck size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-blue">CENTRAL RESOLUTION DESK</span>
            <h3 className="help-channel-title">Administration Support Desk</h3>
            <p className="help-channel-sub">Student & campus support tickets are managed directly by College Admin and Super Admin.</p>
            <span className="help-channel-action-link" style={{ color: '#2563eb' }}>Managed by Administration →</span>
          </div>
        </div>

        <div
          className="help-channel-card-modern coord-help-card-clickable"
          onClick={() => { window.location.href = "mailto:trainx.admin@gmail.com"; }}
        >
          <div className="help-channel-icon-avatar help-icon-emerald">
            <MessageCircle size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-emerald">EMAIL ASSISTANCE</span>
            <h3 className="help-channel-title">Email Admin Support</h3>
            <p className="help-channel-sub">Direct response from college administration within 24 hours.</p>
            <span className="help-channel-action-link help-link-emerald">trainx.admin@gmail.com →</span>
          </div>
        </div>

        <div
          className="help-channel-card-modern coord-help-card-clickable"
          onClick={() => { window.location.href = "tel:+918779351143"; }}
        >
          <div className="help-channel-icon-avatar help-icon-purple">
            <Phone size={22} />
          </div>
          <div className="help-channel-info">
            <span className="help-channel-badge help-badge-purple">HELPLINE</span>
            <h3 className="help-channel-title">Campus Hotline</h3>
            <p className="help-channel-sub">Mon – Fri, 9:00 AM – 6:00 PM</p>
            <span className="help-channel-action-link help-link-purple">+91 87793 51143 →</span>
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
                          <ThumbsUp size={13} /> Yes
                        </button>
                        <button
                          className={`help-helpful-btn ${helpfulFeedback[faq.id] === "no" ? "active" : ""}`}
                          onClick={() => handleFeedback(faq.id, "no")}
                          style={helpfulFeedback[faq.id] === "no" ? { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" } : {}}
                        >
                          <ThumbsDown size={13} /> No
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

      {/* TAB 2: DOWNLOADS & USER GUIDES */}
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
                onClick={() => downloadPdfGuide(guide)}
              >
                <Download size={14} /> Download PDF Guide
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
