import React, { useState } from "react";
import { HelpCircle, MessageCircle, Phone, Search, ChevronDown, Sparkles, FileText, Download, ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";
import "../Styles/MN_Help.css";

const defaultFaqs = [
  {
    id: 1,
    category: "Attendance & QR",
    q: "How does the QR-based session attendance work for my classes?",
    a: "When you start a scheduled lecture session, click 'Launch Meeting & QR'. A unique dynamic QR code is displayed on your screen. Students scan the code via their mobile devices or web portals to mark verified presence."
  },
  {
    id: 2,
    category: "Attendance & QR",
    q: "Can I manually update attendance for a student who faced network issues?",
    a: "Yes. In the Live Sessions or Attendance roster, find the student's entry and click 'Mark Present' or adjust their attendance record with appropriate session notes."
  },
  {
    id: 3,
    category: "Academics & Labs",
    q: "How do I review student code submissions in practical batches?",
    a: "Navigate to Academics → Batches. Select your active batch and open Practical Tasks. You can view each student's source code, test case pass rates, and leave inline mentor feedback."
  },
  {
    id: 4,
    category: "Account & Security",
    q: "How do I update my mentor profile information or password?",
    a: "Click on your profile avatar in the top right header, navigate to Profile & Settings, make your desired updates, and click 'Save Changes'. To reset security credentials, use the Password Reset option."
  },
  {
    id: 5,
    category: "Exams & Marks",
    q: "How do I create and publish an AI-generated quiz for my batch?",
    a: "Go to Academics → Quizzes and click '+ Create Assessment'. Choose AI-Assisted Generation, select your domain, difficulty, and question count, preview the questions, and click 'Publish to Batch'."
  },
  {
    id: 6,
    category: "Account & Security",
    q: "Who handles student support tickets and campus grievances?",
    a: "All support tickets raised by students are routed directly to College Admin and Super Admin resolution desks for institutional compliance and resolution."
  }
];

const kbGuides = [
  {
    title: "TrainX Mentor Quick Start Guide",
    desc: "A step-by-step walkthrough of batch operations, student tracking, and live session setup.",
    type: "PDF Document",
    size: "1.8 MB",
    content: "TrainX Mentor Quickstart Guide\n\n1. Creating Batches\n2. Running AI Interviews\n3. Tracking Skill Gaps & Defaulters\n4. Assigning Interventions"
  },
  {
    title: "AI Assessment & Quiz Authoring Handbook",
    desc: "Complete manual on creating adaptive MCQ quizzes, coding challenges, and evaluating outcomes.",
    type: "PDF Document",
    size: "2.4 MB",
    content: "AI Assessment Handbook\n\n- Adaptive MCQ sets\n- Scoring thresholds\n- Retest configurations"
  },
  {
    title: "Skill Gap Diagnostics & Intervention Best Practices",
    desc: "Guidance on identifying critical student weaknesses and assigning targeted remedial plans.",
    type: "PDF Document",
    size: "1.2 MB",
    content: "Skill Gap Analysis Best Practices\n\n- Technical reweighting\n- Action directives\n- Weekly milestone evaluation"
  }
];

export default function MentorHelp() {
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
    <div className="help-page-wrapper">
      <div className="help-header-wrap">
        <h2 className="help-header-title">
          <span>Help & Support Center</span>
        </h2>
        <p className="help-header-desc">
          Find answers to common mentor questions, download documentation, or connect with administration.
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
            <p className="help-channel-sub">Support tickets and institutional issues are handled directly by College Admin and Super Admin.</p>
            <span className="help-channel-action-link" style={{ color: '#2563eb' }}>Managed by Administration →</span>
          </div>
        </div>

        <div
          className="help-channel-card-modern"
          onClick={() => { window.location.href = "mailto:trainx.admin@gmail.com"; }}
          style={{ cursor: "pointer" }}
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
          className="help-channel-card-modern"
          onClick={() => { window.location.href = "tel:+918779351143"; }}
          style={{ cursor: "pointer" }}
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
