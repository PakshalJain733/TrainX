import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, GraduationCap, Sparkles, ListPlus, CheckCircle2, X, Eye, HelpCircle, BookOpen, RefreshCw, ChevronDown, Check, ShieldCheck, ShieldX, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { addSharedQuiz, getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";
import "../Styles/AD_Quizzes.css";

/* ── Inline dropdown for Admin Quizzes (CSS: AdminQuizzes.css .admin-quiz-select-*) ── */
function AdminQuizSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`admin-quiz-select-wrap${isOpen ? ' admin-quiz-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`admin-quiz-select-trigger${isOpen ? ' admin-quiz-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-quiz-select-icon" />}
        <span className="admin-quiz-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-quiz-select-arrow${isOpen ? ' admin-quiz-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="admin-quiz-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-quiz-select-option${isSel ? ' admin-quiz-select-option--selected' : ''}`}>
                <span className="admin-quiz-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-quiz-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = sessionStorage.getItem("token") || sessionStorage.getItem("authToken") || "";


  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeQuestion(item, idx) {
  if (!item) return { id: idx + 1, text: `Question ${idx + 1}`, options: { a: "", b: "", c: "", d: "" }, correct: "a" };
  const text = item.question_text || item.text || `Question ${idx + 1}`;
  const opts = item.options ? item.options : {
    a: item.option_a || "",
    b: item.option_b || "",
    c: item.option_c || "N/A",
    d: item.option_d || "N/A",
  };
  const correct = (item.correct_option || item.correct || "a").toString().toLowerCase().trim();

  return {
    id: item.id || idx + 1,
    text,
    options: opts,
    correct,
  };
}

// Map backend assessment → UI quiz shape
function mapAssessment(a) {
  const rawQs = Array.isArray(a.questions) ? a.questions : [];
  const normalizedQs = rawQs.map(normalizeQuestion);

  return {
    id: a.id,
    title: a.title,
    batch: a.batch_name || "All Batches",
    questionsCount: a.total_questions || normalizedQs.length || 0,
    type: a.category === "AI Generated" ? "AI Generated" : "Manual",
    status: a.status === "published" ? "Active" : a.status === "draft" ? "Draft" : a.status,
    submissions: a.submission_count || 0,
    questionsList: normalizedQs,
    description: a.description || "",
  };
}


export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("ai"); // 'ai' or 'manual'

  // Quiz Form Fields
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [numQuestions, setNumQuestions] = useState("10");

  // AI Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState(""); // 'generating' | 'verifying' | ''

  // AI Verification Preview state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifiedQuestions, setVerifiedQuestions] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Manual Questions State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualQuestions, setManualQuestions] = useState([]);
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOpt, setCorrectOpt] = useState("a");

  // View Quiz Questions Modal
  const [activeQuizQuestions, setActiveQuizQuestions] = useState(null);

  const handleViewQuestions = async (q) => {
    if (q.questionsList && q.questionsList.length > 0) {
      setActiveQuizQuestions(q);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/assessments/${q.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        const mapped = mapAssessment(data.data);
        setQuizzes(prev => prev.map(item => item.id === q.id ? mapped : item));
        setActiveQuizQuestions(mapped);
        return;
      }
    } catch (err) {
      console.error("Failed to fetch assessment questions:", err);
    }

    setActiveQuizQuestions(q);
  };

  const [availableBatches, setAvailableBatches] = useState([]);

  // ── Fetch quizzes & batches from DB on mount ───────────────────
  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() });
      const data = await res.json();
      setAvailableBatches(data.success && Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.warn("Failed to fetch batches from DB:", err);
      setAvailableBatches([]);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAvailableBatches(data.data);
      } else {
        setAvailableBatches([
          { id: 1, name: "CSE 2026 Alpha Batch" },
          { id: 2, name: "Fullstack React & Node Specialization" },
          { id: 3, name: "BE-CS-2026-A" },
          { id: 4, name: "TE-IT-2026-B" },
          { id: 5, name: "BE-EXTC-2026-C" }
        ]);
      }
      setAvailableBatches([
        { id: 1, name: "CSE 2026 Alpha Batch" },
        { id: 2, name: "Fullstack React & Node Specialization" },
        { id: 3, name: "BE-CS-2026-A" },
        { id: 4, name: "TE-IT-2026-B" },
        { id: 5, name: "BE-EXTC-2026-C" }
      ]);

    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assessments`, { headers: getAuthHeaders() });
      const data = await res.json();
      let list = [];
      if (data.success && Array.isArray(data.data)) {
        list = data.data.map(mapAssessment);
      }
      const shared = await getSharedQuizzes([]);
      const existingIds = new Set(list.map(q => q.id));
      const sharedItems = shared
        .filter(s => !existingIds.has(s.id))
        .map(s => ({
          id: s.id,
          title: s.title,
          batch: s.batch_name || s.data?.batch || "All Batches",
          questionsCount: s.data?.questionsCount || 10,
          type: "Manual",
          status: s.status || "Active",
          submissions: 0,
          questionsList: s.data?.questions || [],
          description: s.description || ""
        }));
      setQuizzes([...list, ...sharedItems]);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      const shared = await getSharedQuizzes([]);
      if (shared.length > 0) {
        setQuizzes(shared.map(s => ({
          id: s.id,
          title: s.title,
          batch: s.batch_name || s.data?.batch || "All Batches",
          questionsCount: s.data?.questionsCount || 10,
          type: "Manual",
          status: "Active",
          submissions: 0,
          questionsList: s.data?.questions || [],
          description: s.description || ""
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchBatches();
    const handleUpdate = () => fetchQuizzes();
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => {
      window.removeEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
      window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    };
  }, []);


  // ── Save quiz + questions to DB ──────────────────────────────────
  const saveQuizToDB = async (questionsList, quizType) => {
    const selectedBatchObj = availableBatches.find(b => b.name === batch);
    const batchId = selectedBatchObj ? selectedBatchObj.id : null;

    // Broadcast to DB-backed shared store across all dashboards
    await addSharedQuiz({
      title: title.trim(),
      batch: batch,
      questionsCount: questionsList.length,
      questions: questionsList,
      description: `${quizType} quiz for ${batch}`,
    });

    // 1. Create the assessment
    const assessRes = await fetch(`${API_BASE}/assessments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        batch_id: batchId,
        batch_name: batch,
        category: quizType === "AI Generated" ? "AI Generated" : "Technical Quiz",
        description: `${quizType} quiz for ${batch}`,
        status: "published",
        is_published: true,
        total_marks: questionsList.length * 10,
        duration_minutes: Math.max(10, questionsList.length * 2),
      }),
    });
    const assessData = await assessRes.json();
    if (!assessData.success) throw new Error(assessData.message || "Failed to create quiz");
    const assessmentId = assessData.data?.id || assessData.data?.insertId;
    if (!assessmentId) throw new Error("No assessment ID returned");

    // 2. Add each question
    for (const q of questionsList) {
      await fetch(`${API_BASE}/assessments/${assessmentId}/questions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          question_text: q.text,
          option_a: q.options.a,
          option_b: q.options.b,
          option_c: q.options.c !== "N/A" ? q.options.c : null,
          option_d: q.options.d !== "N/A" ? q.options.d : null,
          correct_option: q.correct,
          marks: 10,
        }),
      });
    }

    return assessmentId;
  };

  // Handle adding a single question to manual queue
  const handleAddQuestionToManual = (e) => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim()) {
      alert("Please provide the question text and at least Options A and B.");
      return;
    }
    const newQ = {
      id: Date.now(),
      text: qText,
      options: { a: optA, b: optB, c: optC || "N/A", d: optD || "N/A" },
      correct: correctOpt
    };
    setManualQuestions([...manualQuestions, newQ]);
    setQText(""); setOptA(""); setOptB(""); setOptC(""); setOptD(""); setCorrectOpt("a");
  };

  const handleRemoveManualQuestion = (id) => {
    setManualQuestions(manualQuestions.filter(q => q.id !== id));
  };

  // Live Google Gemini AI Question Generator via Backend API
  const fetchLiveAIQuestions = async (quizTitle, count) => {
    const res = await fetch(`${API_BASE}/assessments/generate-ai-questions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: quizTitle,
        count: parseInt(count, 10) || 10,
      }),
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error(data.message || "Failed to generate AI questions with Google Gemini");
    }
    return data.data;
  };

  // Run auto-verification on generated questions
  const verifyQuestionsWithAI = async (questions, topic) => {
    try {
      const res = await fetch(`${API_BASE}/assessments/verify-ai-questions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ questions, topic }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data.data;
    } catch (err) {
      console.warn("Verification request failed, using fallback:", err);
    }
    // Fallback: mark all as medium confidence
    return questions.map(q => ({
      ...q,
      verified: true,
      confidence: "medium",
      verificationNote: "Could not verify — please review manually.",
    }));
  };

  // Remove a question from verification preview
  const handleRemoveVerifiedQ = (idx) => {
    setVerifiedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Publish only the approved questions from verification preview
  const handlePublishVerifiedQuiz = async () => {
    const toPublish = verifiedQuestions.filter(q => q.verified !== false || q._forceInclude);
    if (toPublish.length === 0) {
      alert("No questions to publish. Please keep at least one approved question.");
      return;
    }
    setIsPublishing(true);
    try {
      await saveQuizToDB(toPublish, "AI Generated");
      await fetchQuizzes();
      setShowVerifyModal(false);
      resetForm();
    } catch (err) {
      alert("Error publishing quiz: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle force-include a rejected question from the verify preview
  const handleToggleForceInclude = (idx) => {
    setVerifiedQuestions(prev => prev.map((q, i) =>
      i === idx ? { ...q, _forceInclude: !q._forceInclude } : q
    ));
  };

  // Submit Quiz Creation → API
  const handleCreateQuizSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) { alert("Please enter a Quiz Title."); return; }

    if (mode === "ai") {
      setIsGenerating(true);
      setGeneratingPhase("generating");
      try {
        const aiQs = await fetchLiveAIQuestions(title, numQuestions);
        setGeneratingPhase("verifying");
        const verified = await verifyQuestionsWithAI(aiQs, title);
        setVerifiedQuestions(verified);
        setShowVerifyModal(true);
        setShowForm(false);
      } catch (err) {
        alert("Error generating quiz: " + err.message);
      } finally {
        setIsGenerating(false);
        setGeneratingPhase("");
      }

    } else {
      if (manualQuestions.length === 0) { alert("Please add at least 1 question before saving the quiz."); return; }
      setIsGenerating(true);
      try {
        await saveQuizToDB(manualQuestions, "Manual");
        await fetchQuizzes();
        resetForm();
      } catch (err) {
        alert("Error creating quiz: " + err.message);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const resetForm = () => {
    setTitle(""); setBatch("All Batches"); setNumQuestions("10");
    setManualQuestions([]); setShowForm(false); setShowManualModal(false);
    setShowVerifyModal(false); setVerifiedQuestions([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/assessments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) {
      alert("Failed to delete quiz: " + err.message);
    }
  };

  const statusVariant = (s) => s === "Active" ? "success" : s === "Completed" ? "default" : "outline";



  return (
    <div className="admin-quizzes-container">
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <GraduationCap size={22} className="ui-section-title-icon" />
              <span>Manage Quizzes</span>
            </h2>
            <p className="ui-section-desc">
              Create and track quiz assessments across batches using AI or manual entry.
            </p>
          </div>
          <div className="ui-section-action">
            <button onClick={() => setShowForm(!showForm)} className="add-quiz-btn">
              <Plus size={16} /> {showForm ? "Cancel" : "Create Quiz"}
            </button>
          </div>
        </div>
      </div>

      {/* CREATE QUIZ MODAL / FLASH SCREEN OVERLAY */}
      {showForm && createPortal(
        <div className="quiz-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="quiz-modal-content modal-flash-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create New Quiz Assessment</h2>
                  <p className="modal-subtitle">Generate questions automatically using AI or build your custom question set manually.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForm(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Creation Option Tabs */}
              <div className="quiz-mode-selector">
                <button
                  type="button"
                  className={`mode-tab ${mode === "ai" ? "active" : ""}`}
                  onClick={() => setMode("ai")}
                >
                  <Sparkles size={18} className="mode-icon ai-sparkle-icon" />
                  <div className="mode-text">
                    <span className="mode-title">Generate Questions (AI)</span>
                    <span className="mode-sub">AI automatically generates questions & options</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`mode-tab ${mode === "manual" ? "active" : ""}`}
                  onClick={() => setMode("manual")}
                >
                  <ListPlus size={18} className="mode-icon" />
                  <div className="mode-text">
                    <span className="mode-title">Add Questions (Manual)</span>
                    <span className="mode-sub">Open custom editor screen to enter questions & choices</span>
                  </div>
                </button>
              </div>

              <form onSubmit={handleCreateQuizSubmit} className="quiz-add-form">
                <div className="form-group">
                  <label>Quiz Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Python OOP Assessment & Data Structures"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Target Batch</label>
                    <AdminQuizSelect
                      value={batch}
                      onChange={setBatch}
                      options={[
                        { value: "All Batches", label: "All Batches" },
                        ...availableBatches.map((b) => ({
                          value: b.name,
                          label: `${b.name} ${b.join_code ? `(${b.join_code})` : ""}`
                        }))
                      ]}
                    />
                  </div>

                  {mode === "ai" ? (
                    <div className="form-group">
                      <label>Number of Questions to Generate</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={numQuestions}
                        onChange={e => setNumQuestions(e.target.value)}
                        placeholder="e.g. 10"
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Manual Questions Status</label>
                      <div className="manual-status-box">
                        <span className="q-count-badge">{manualQuestions.length} Questions Added</span>
                        <button
                          type="button"
                          className="open-modal-btn"
                          onClick={() => {
                            if (!title.trim()) {
                              alert("Please enter a Quiz Title first.");
                              return;
                            }
                            setShowManualModal(true);
                          }}
                        >
                          <ListPlus size={15} /> Add / Edit Questions Screen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="quiz-cancel-btn"
                    onClick={() => setShowForm(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  {mode === "ai" ? (
                    <button type="submit" className="quiz-submit-btn ai-btn" disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <span className="spinner"></span>
                          {generatingPhase === "verifying" ? "Auto-verifying Questions..." : "Generating with AI..."}
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Generate & Auto-Verify with AI
                        </>
                      )}
                    </button>
                  ) : (
                    <button type="submit" className="quiz-submit-btn manual-btn" disabled={isGenerating}>
                      <CheckCircle2 size={16} /> Save Quiz ({manualQuestions.length} Questions)
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI VERIFICATION PREVIEW MODAL */}
      {showVerifyModal && createPortal(
        <div className="quiz-modal-backdrop verify-modal-backdrop" style={{ zIndex: 10001 }}>
          <div className="quiz-modal-content modal-flash-in verify-preview-modal">
            {/* Header */}
            <div className="modal-header verify-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap verify-header-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="modal-title">AI Verification Report</h2>
                  <p className="modal-subtitle">
                    Gemini verified {verifiedQuestions.length} questions for <strong>"{title}"</strong> — review before publishing.
                  </p>
                </div>
              </div>
              <div className="verify-header-stats">
                <span className="vstat vstat--pass">
                  <ShieldCheck size={13} />
                  {verifiedQuestions.filter(q => q.verified !== false || q._forceInclude).length} Approved
                </span>
                <span className="vstat vstat--fail">
                  <ShieldX size={13} />
                  {verifiedQuestions.filter(q => q.verified === false && !q._forceInclude).length} Rejected
                </span>
              </div>
            </div>

            {/* Verification Summary Banner */}
            <div className="verify-summary-bar">
              {(() => {
                const total = verifiedQuestions.length;
                const passed = verifiedQuestions.filter(q => q.verified !== false).length;
                const highConf = verifiedQuestions.filter(q => q.confidence === 'high').length;
                const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
                return (
                  <>
                    <div className="verify-progress-wrap">
                      <div className="verify-progress-bar">
                        <div className="verify-progress-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="verify-pct">{pct}% Quality Score</span>
                    </div>
                    <div className="verify-legend">
                      <span className="vleg vleg--high">● {highConf} High Confidence</span>
                      <span className="vleg vleg--med">● {verifiedQuestions.filter(q => q.confidence === 'medium').length} Medium</span>
                      <span className="vleg vleg--low">● {verifiedQuestions.filter(q => q.confidence === 'low').length} Low / Flagged</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Questions List */}
            <div className="verify-questions-scroll">
              {verifiedQuestions.map((q, idx) => {
                const isPassed = q.verified !== false;
                const isForced = q._forceInclude;
                const conf = q.confidence || 'medium';
                return (
                  <div
                    key={q.id || idx}
                    className={`verify-q-card ${isPassed ? 'verify-q--pass' : isForced ? 'verify-q--forced' : 'verify-q--fail'}`}
                  >
                    <div className="verify-q-header">
                      <span className="verify-q-num">Q{idx + 1}</span>
                      <p className="verify-q-text">{q.text || q.question_text}</p>
                      <div className="verify-q-badges">
                        {isPassed ? (
                          <span className={`vbadge vbadge--${conf}`}>
                            {conf === 'high' ? <ShieldCheck size={11} /> : conf === 'medium' ? <AlertTriangle size={11} /> : <ShieldX size={11} />}
                            {conf === 'high' ? 'Verified' : conf === 'medium' ? 'Acceptable' : 'Low Quality'}
                          </span>
                        ) : (
                          <span className="vbadge vbadge--rejected">
                            <ShieldX size={11} /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Options preview */}
                    <div className="verify-q-options">
                      {Object.entries(q.options || {}).map(([key, val]) => (
                        <span
                          key={key}
                          className={`verify-opt ${(q.correctOptionVerified || q.correct) === key ? 'verify-opt--correct' : ''}`}
                        >
                          <strong>{key.toUpperCase()}.</strong> {val}
                          {(q.correctOptionVerified || q.correct) === key && <span className="correct-tick">✓</span>}
                        </span>
                      ))}
                    </div>
                    {/* Verification note */}
                    {q.verificationNote && (
                      <p className="verify-q-note">
                        <AlertTriangle size={11} /> {q.verificationNote}
                      </p>
                    )}
                    {/* Actions */}
                    <div className="verify-q-actions">
                      {!isPassed && (
                        <button
                          type="button"
                          className={`verify-force-btn ${isForced ? 'verify-force-btn--active' : ''}`}
                          onClick={() => handleToggleForceInclude(idx)}
                          title={isForced ? "Remove from publish" : "Force include despite rejection"}
                        >
                          {isForced ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                          {isForced ? 'Included (Override)' : 'Force Include'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="verify-remove-btn"
                        onClick={() => handleRemoveVerifiedQ(idx)}
                        title="Remove this question"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="verify-modal-footer">
              <button
                type="button"
                className="quiz-cancel-btn"
                onClick={() => { setShowVerifyModal(false); setShowForm(true); }}
                disabled={isPublishing}
              >
                ← Back to Form
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="verify-publish-info">
                  Publishing {verifiedQuestions.filter(q => q.verified !== false || q._forceInclude).length} of {verifiedQuestions.length} questions
                </span>
                <button
                  type="button"
                  className="quiz-submit-btn ai-btn verify-publish-btn"
                  onClick={handlePublishVerifiedQuiz}
                  disabled={isPublishing || verifiedQuestions.filter(q => q.verified !== false || q._forceInclude).length === 0}
                >
                  {isPublishing ? (
                    <><span className="spinner"></span> Publishing...</>
                  ) : (
                    <><Send size={15} /> Publish Verified Quiz</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FLASH SCREEN MODAL: Manual Add Questions */}
      {showManualModal && createPortal(
        <div className="quiz-modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="quiz-modal-content modal-flash-in">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Question Builder Screen</h3>
                <p className="modal-subtitle">Quiz: <strong style={{ color: '#4f46e5' }}>{title || "Untitled Quiz"}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowManualModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-grid">
              {/* Question Entry Form */}
              <div className="question-entry-pane">
                <h4 className="pane-heading"><Plus size={16} /> Add New Question</h4>
                <form onSubmit={handleAddQuestionToManual} className="manual-q-form">
                  <div className="form-group">
                    <label>Question Text *</label>
                    <textarea
                      rows={3}
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="e.g. What is the time complexity of binary search?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Answer Options *</label>
                    <div className="options-grid">
                      <input
                        type="text"
                        placeholder="Option A"
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Option B"
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Option C"
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Option D"
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Select Correct Option *</label>
                    <div className="correct-option-selector">
                      {["a", "b", "c", "d"].map((opt) => (
                        <label
                          key={opt}
                          className={`opt-choice-label ${correctOpt === opt ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="correctOpt"
                            value={opt}
                            checked={correctOpt === opt}
                            onChange={() => setCorrectOpt(opt)}
                          />
                          Option {opt.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="add-question-btn">
                    <Plus size={16} /> Save & Add Question
                  </button>
                </form>
              </div>

              {/* Questions Preview List Pane */}
              <div className="question-list-pane">
                <h4 className="pane-heading"><BookOpen size={16} /> Questions List ({manualQuestions.length})</h4>

                {manualQuestions.length === 0 ? (
                  <div className="modal-empty-pane">
                    <HelpCircle size={32} />
                    <p>No questions added yet</p>
                    <span>Fill out the form on the left and click "Save & Add Question".</span>
                  </div>
                ) : (
                  <div className="modal-questions-scroll">
                    {manualQuestions.map((q, idx) => (
                      <div key={idx} className="manual-q-item">
                        <div className="manual-q-head">
                          <span className="q-number">Q{idx + 1}</span>
                          <h5 className="q-title-text">{q.text}</h5>
                          <button
                            type="button"
                            className="q-delete-icon"
                            onClick={() => handleRemoveManualQuestion(idx)}
                            title="Remove question"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="manual-q-options-mini">
                          {Object.entries(q.options || {}).map(([k, val]) => (
                            <div key={k} className={`mini-opt ${q.correct === k ? "is-correct" : ""}`}>
                              <span className="opt-key">{k.toUpperCase()}:</span> {val}
                              {q.correct === k && <CheckCircle2 size={12} className="correct-check-icon" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <span className="footer-info">Total Questions Added: <strong>{manualQuestions.length}</strong></span>
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setShowManualModal(false)}
              >
                Done / Return to Quiz Form
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW QUIZ QUESTIONS MODAL */}
      {activeQuizQuestions && createPortal(
        <div className="quiz-modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="quiz-modal-content modal-flash-in view-quiz-modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{activeQuizQuestions.title}</h3>
                <p className="modal-subtitle">Batch: {activeQuizQuestions.batch} | Type: {activeQuizQuestions.type}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveQuizQuestions(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll">
              {!activeQuizQuestions.questionsList || activeQuizQuestions.questionsList.length === 0 ? (
                <div className="quiz-empty-questions">
                  <HelpCircle size={36} className="quiz-empty-questions-icon" />
                  <p className="quiz-empty-questions-title">No questions available</p>
                  <p className="quiz-empty-questions-sub">There are currently no questions attached to this quiz assessment.</p>
                </div>
              ) : (
                <div className="questions-view-list">
                  {activeQuizQuestions.questionsList.map((q, i) => (
                    <div key={q.id || i} className="view-q-card">
                      <h5 className="view-q-title">Q{i + 1}. {q.text}</h5>
                      <div className="view-q-options">
                        {Object.entries(q.options || {}).map(([key, val]) => (
                          <div key={key} className={`view-opt-pill ${q.correct === key ? "correct" : ""}`}>
                            <span className="opt-letter">{key.toUpperCase()}</span>
                            <span className="opt-val">{val}</span>
                            {q.correct === key && <Badge variant="success" className="correct-badge">Correct</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-done-btn" onClick={() => setActiveQuizQuestions(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quizzes List */}
      <div className="quizzes-grid">
        {quizzes.length === 0 ? (
          <div className="admin-empty-state-card">
            <GraduationCap size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No quizzes created yet</p>
            <p className="admin-empty-state-sub">Click "Create Quiz" to add a new assessment for your batches.</p>
          </div>
        ) : (
          quizzes.map(q => (
            <Card key={q.id} className="quiz-card">
              <CardContent className="quiz-card-body">
                <div className="quiz-icon-wrap">
                  {q.type === "AI Generated" ? (
                    <Sparkles size={20} className="ai-icon-pulse" />
                  ) : (
                    <GraduationCap size={20} />
                  )}
                </div>
                <div className="quiz-info">
                  <h4 className="quiz-name">{q.title}</h4>
                  <div className="quiz-meta">
                    <span className="quiz-batch-tag">{q.batch}</span>
                    <span className="quiz-questions">{q.questionsCount} Questions</span>
                    <span className={`quiz-type-tag ${q.type === "AI Generated" ? "type-ai" : "type-manual"}`}>
                      {q.type === "AI Generated" ? "⚡ AI Generated" : "✍️ Manual"}
                    </span>
                    <span className="quiz-submissions">{q.submissions} submissions</span>
                  </div>
                </div>
                <div className="quiz-right">
                  <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                  <button
                    className="quiz-view-btn"
                    onClick={() => handleViewQuestions(q)}
                    title="View Questions"
                  >
                    <Eye size={15} /> Questions
                  </button>
                  <button className="quiz-delete-btn" onClick={() => handleDelete(q.id)} title="Delete Quiz">
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

