import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, GraduationCap, Sparkles, ListPlus, CheckCircle2, X,
  Eye, HelpCircle, BookOpen, RefreshCw, Users, Trophy, BarChart2,
  FileCheck2, ChevronLeft, Zap,
} from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { addSharedQuiz, getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";
import "../../Admin/Styles/AdminQuizzes.css";
import "../../Admin/Styles/AdminUsers.css";

const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeQuestion(item, idx) {
  if (!item) return { id: idx + 1, text: `Question ${idx + 1}`, options: { a: "", b: "", c: "", d: "" }, correct: "a" };
  const text = item.question_text || item.text || `Question ${idx + 1}`;
  const opts = item.options ? item.options : {
    a: item.option_a || "", b: item.option_b || "",
    c: item.option_c || "N/A", d: item.option_d || "N/A",
  };
  const correct = (item.correct_option || item.correct || "a").toString().toLowerCase().trim();
  return { id: item.id || idx + 1, text, options: opts, correct };
}

function mapAssessment(a) {
  const rawQs = Array.isArray(a.questions) ? a.questions : [];
  return {
    id: a.id, title: a.title,
    batch: a.batch_name || "All Batches",
    questionsCount: a.total_questions || rawQs.length || 0,
    type: a.category === "AI Generated" ? "AI Generated" : "Manual",
    status: a.status === "published" ? "Active" : a.status === "draft" ? "Draft" : (a.status || "Unknown"),
    questionsList: rawQs.map(normalizeQuestion),
    description: a.description || "",
    total_marks: a.total_marks || 0,
    pass_marks: a.pass_marks || 0,
  };
}

/* ─── Results Panel ─────────────────────────────────────────── */
function QuizResultsPanel({ quiz, onBack }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/assessments/${quiz.id}/results`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.results) setResults(data.data.results);
        else if (data.success && Array.isArray(data.data)) setResults(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quiz.id]);

  const avg = results.length ? Math.round(results.reduce((s, r) => s + parseFloat(r.percentage || 0), 0) / results.length) : 0;
  const passCount = results.filter(r => parseFloat(r.percentage || 0) >= 60 || r.status === 'passed').length;

  return (
    <div className="admin-quizzes-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{quiz.title} — Results</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>{results.length} submission(s)</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[{ l: 'Submissions', v: results.length, c: '#6366f1' }, { l: 'Avg Score', v: `${avg}%`, c: '#f59e0b' }, { l: 'Passed', v: passCount, c: '#10b981' }].map(s => (
          <div key={s.l} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Loading…</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <GraduationCap size={36} style={{ color: '#64748b', marginBottom: 10 }} />
          <p style={{ color: '#64748b', margin: 0 }}>No submissions yet.</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Student', 'Score', 'Percentage', 'Correct', 'Status', 'Submitted'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pct = parseFloat(r.percentage || 0);
                const passed = pct >= 60 || r.status === 'passed';
                return (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.85rem' }}>{r.student_name || `Student #${r.user_id}`}</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{r.student_email || ''}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.85rem' }}>{r.marks_obtained ?? r.score ?? '—'} / {r.total_marks ?? quiz.total_marks ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 700, color: pct >= 60 ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>{pct}%</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.85rem' }}>{r.correct_count ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: passed ? '#059669' : '#dc2626' }}>
                        {passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.72rem' }}>
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Questions Viewer Modal ─────────────────────────────────── */
function QuestionsModal({ quiz, onClose }) {
  return createPortal(
    <div className="quiz-modal-backdrop" onClick={onClose}>
      <div className="quiz-modal-content modal-flash-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon-wrap" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <BookOpen size={20} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h2 className="modal-title">{quiz.title}</h2>
              <p className="modal-subtitle">{quiz.questionsCount} questions · {quiz.type}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: '18px 22px', maxHeight: 500, overflowY: 'auto' }}>
          {quiz.questionsList.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>No questions available.</p>
          ) : quiz.questionsList.map((q, i) => (
            <div key={q.id || i} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#1e293b', fontWeight: 600, margin: '0 0 8px', fontSize: '0.875rem' }}>Q{i + 1}. {q.text}</p>
              {['a', 'b', 'c', 'd'].filter(k => q.options[k] && q.options[k] !== 'N/A').map(opt => (
                <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, background: q.correct === opt ? 'rgba(16,185,129,0.1)' : '#ffffff', color: q.correct === opt ? '#059669' : '#64748b', border: q.correct === opt ? '1px solid #34d399' : '1px solid #cbd5e1', flexShrink: 0 }}>
                    {opt.toUpperCase()}
                  </span>
                  <span style={{ color: q.correct === opt ? '#059669' : '#475569', fontSize: '0.83rem', fontWeight: q.correct === opt ? 600 : 400 }}>{q.options[opt]}</span>
                  {q.correct === opt && <CheckCircle2 size={13} style={{ color: '#10b981' }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Main MentorQuizzes Page ────────────────────────────────── */
export default function MentorQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("ai");
  const [viewResultsFor, setViewResultsFor] = useState(null);
  const [viewQuestionsFor, setViewQuestionsFor] = useState(null);

  // Form
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [numQuestions, setNumQuestions] = useState("10");
  const [durationMins, setDurationMins] = useState("30");
  const [totalMarks, setTotalMarks] = useState("");
  const [passMarks, setPassMarks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual
  const [manualQuestions, setManualQuestions] = useState([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState(""); const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState(""); const [optD, setOptD] = useState("");
  const [correctOpt, setCorrectOpt] = useState("a");
  const [availableBatches, setAvailableBatches] = useState([]);

  const fetchBatches = async () => {
    try {
      const r = await fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        setAvailableBatches(d.data);
      } else {
        setAvailableBatches([
          { id: 1, name: "BE-CS-2026-A" },
          { id: 2, name: "TE-IT-2026-B" },
          { id: 3, name: "BE-EXTC-2026-C" },
          { id: 4, name: "CSE 2026 Alpha Cohort" },
          { id: 5, name: "Fullstack React & Node Specialization" }
        ]);
      }
    } catch {
      setAvailableBatches([
        { id: 1, name: "BE-CS-2026-A" },
        { id: 2, name: "TE-IT-2026-B" },
        { id: 3, name: "BE-EXTC-2026-C" },
        { id: 4, name: "CSE 2026 Alpha Cohort" },
        { id: 5, name: "Fullstack React & Node Specialization" }
      ]);
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/assessments`, { headers: getAuthHeaders() });
      const d = await r.json();
      let list = [];
      if (d.success && Array.isArray(d.data)) list = d.data.map(mapAssessment);
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
          questionsList: s.data?.questions || [],
          description: s.description || "",
          total_marks: s.data?.totalMarks || 100,
          pass_marks: 60,
        }));
      setQuizzes([...list, ...sharedItems]);
    } catch {
      const shared = await getSharedQuizzes([]);
      if (shared.length > 0) {
        setQuizzes(shared.map(s => ({
          id: s.id,
          title: s.title,
          batch: s.batch_name || s.data?.batch || "All Batches",
          questionsCount: s.data?.questionsCount || 10,
          type: "Manual",
          status: "Active",
          questionsList: s.data?.questions || [],
          description: s.description || "",
          total_marks: 100,
          pass_marks: 60,
        })));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchBatches();
    const handleUpdate = () => fetchQuizzes();
    window.addEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
  }, []);

  const saveQuizToDB = async (questionsList, quizType) => {
    const batchObj = availableBatches.find(b => b.name === batch);
    const qCount = questionsList.length;
    const marks = parseInt(totalMarks) || qCount * 10;
    const pass = parseInt(passMarks) || Math.round(marks * 0.6);

    await addSharedQuiz({
      title: title.trim(),
      batch: batch,
      questionsCount: qCount,
      questions: questionsList,
      description: `${quizType} quiz for ${batch}`,
      duration: `${durationMins} mins`,
      totalMarks: marks
    });

    const res = await fetch(`${API_BASE}/assessments`, {
      method: "POST", headers: getAuthHeaders(),
      body: JSON.stringify({ title: title.trim(), batch_id: batchObj?.id || null, batch_name: batch, category: quizType === "AI Generated" ? "AI Generated" : "Technical Quiz", description: `${quizType} quiz for ${batch}`, status: "published", is_published: true, total_marks: marks, pass_marks: pass, duration_minutes: parseInt(durationMins) || 30 }),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.message || "Failed to create quiz");
    const assessmentId = d.data?.id || d.data?.insertId;
    if (!assessmentId) throw new Error("No assessment ID returned");

    for (const q of questionsList) {
      await fetch(`${API_BASE}/assessments/${assessmentId}/questions`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ question_text: q.text, option_a: q.options.a, option_b: q.options.b, option_c: q.options.c !== "N/A" ? q.options.c : null, option_d: q.options.d !== "N/A" ? q.options.d : null, correct_option: q.correct, marks: Math.round(marks / qCount) }),
      });
    }
  };

  const handleAddQuestion = e => {
    e.preventDefault();
    if (!qText.trim() || !optA.trim() || !optB.trim()) { alert("Question text + Options A & B required."); return; }
    setManualQuestions([...manualQuestions, { id: Date.now(), text: qText, options: { a: optA, b: optB, c: optC || "N/A", d: optD || "N/A" }, correct: correctOpt }]);
    setQText(""); setOptA(""); setOptB(""); setOptC(""); setOptD(""); setCorrectOpt("a");
  };

  const fetchAIQuestions = async (topic, count) => {
    const res = await fetch(`${API_BASE}/assessments/generate-ai-questions`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ title: topic, count: parseInt(count, 10) || 10 }) });
    const d = await res.json();
    if (!d.success || !Array.isArray(d.data) || !d.data.length) throw new Error(d.message || "AI question generation failed");
    return d.data;
  };

  const handleCreateQuiz = async e => {
    e && e.preventDefault();
    if (!title.trim()) { alert("Quiz title is required."); return; }
    setIsGenerating(true);
    try {
      if (mode === "ai") {
        const aiQs = await fetchAIQuestions(title, numQuestions);
        await saveQuizToDB(aiQs, "AI Generated");
      } else {
        if (!manualQuestions.length) { alert("Add at least 1 question first."); setIsGenerating(false); return; }
        await saveQuizToDB(manualQuestions, "Manual");
      }
      await fetchQuizzes();
      resetForm();
    } catch (err) { alert("Error: " + err.message); }
    finally { setIsGenerating(false); }
  };

  const resetForm = () => { setTitle(""); setBatch("All Batches"); setNumQuestions("10"); setDurationMins("30"); setTotalMarks(""); setPassMarks(""); setManualQuestions([]); setShowForm(false); setShowManualModal(false); };

  const handleDelete = async id => {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/assessments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  if (viewResultsFor) return <QuizResultsPanel quiz={viewResultsFor} onBack={() => setViewResultsFor(null)} />;

  return (
    <div className="admin-quizzes-container">
      <SectionHeader
        title="Quiz Management"
        description="Create, manage, and track quiz assessments. View real-time student results."
        action={<button onClick={() => setShowForm(!showForm)} className="add-quiz-btn"><Plus size={16} /> {showForm ? "Cancel" : "Create Quiz"}</button>}
      />

      {/* Create Quiz Modal */}
      {showForm && createPortal(
        <div className="quiz-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="quiz-modal-content modal-flash-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo"><HelpCircle size={20} /></div>
                <div>
                  <h2 className="modal-title">Create New Quiz</h2>
                  <p className="modal-subtitle">Use AI generation or build manually</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div className="quiz-mode-selector">
                <button type="button" className={`mode-tab ${mode === "ai" ? "active" : ""}`} onClick={() => setMode("ai")}>
                  <Sparkles size={18} className="mode-icon ai-sparkle-icon" />
                  <div className="mode-text"><span className="mode-title">AI Generated</span><span className="mode-sub">Auto-creates questions with Google Gemini</span></div>
                </button>
                <button type="button" className={`mode-tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>
                  <ListPlus size={18} className="mode-icon" />
                  <div className="mode-text"><span className="mode-title">Manual Entry</span><span className="mode-sub">Add questions & answers yourself</span></div>
                </button>
              </div>

              <form onSubmit={handleCreateQuiz}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Quiz Title *</label>
                    <input className="form-input" placeholder="e.g. Data Structures Exam" value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-input" value={batch} onChange={e => setBatch(e.target.value)}>
                      <option value="All Batches">All Batches</option>
                      {availableBatches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (mins)</label>
                    <input className="form-input" type="number" min="5" value={durationMins} onChange={e => setDurationMins(e.target.value)} />
                  </div>
                  {mode === "ai" && (
                    <div className="form-group">
                      <label className="form-label">Number of Questions</label>
                      <input className="form-input" type="number" min="1" max="50" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Total Marks (optional)</label>
                    <input className="form-input" type="number" placeholder="Auto-calculated" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pass Marks (optional)</label>
                    <input className="form-input" type="number" placeholder="Default: 60% of total" value={passMarks} onChange={e => setPassMarks(e.target.value)} />
                  </div>
                </div>

                {mode === "manual" && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{manualQuestions.length} question(s)</span>
                      <button type="button" onClick={() => setShowManualModal(true)} className="add-quiz-btn" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                        <Plus size={13} /> Add Question
                      </button>
                    </div>
                    {manualQuestions.map((q, i) => (
                      <div key={q.id} style={{ background: '#f8fafc', borderRadius: 7, padding: '8px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#475569', fontSize: '0.82rem' }}>Q{i + 1}. {q.text.substring(0, 65)}{q.text.length > 65 ? '…' : ''}</span>
                        <button type="button" onClick={() => setManualQuestions(manualQuestions.filter(x => x.id !== q.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 3 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="quiz-cancel-btn">Cancel</button>
                  <button type="submit" className="add-quiz-btn" disabled={isGenerating}>
                    {isGenerating ? <><RefreshCw size={15} className="spin" /> {mode === "ai" ? "Generating…" : "Creating…"}</> : <><Zap size={15} /> Create & Publish</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Question Modal */}
      {showManualModal && createPortal(
        <div className="quiz-modal-backdrop" onClick={() => setShowManualModal(false)}>
          <div className="quiz-modal-content modal-flash-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)' }}><ListPlus size={20} style={{ color: '#10b981' }} /></div>
                <div><h2 className="modal-title">Add Question</h2><p className="modal-subtitle">Fill in details below</p></div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowManualModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddQuestion} style={{ padding: '18px 22px' }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Question *</label>
                <textarea className="form-input" rows={3} value={qText} onChange={e => setQText(e.target.value)} placeholder="Type the question…" required />
              </div>
              {[['a', optA, setOptA, true], ['b', optB, setOptB, true], ['c', optC, setOptC, false], ['d', optD, setOptD, false]].map(([k, v, s, req]) => (
                <div key={k} className="form-group" style={{ marginBottom: 9 }}>
                  <label className="form-label">Option {k.toUpperCase()} {!req && <span style={{ color: '#64748b' }}>(optional)</span>}</label>
                  <input className="form-input" value={v} onChange={e => s(e.target.value)} placeholder={`Option ${k.toUpperCase()}`} required={req} />
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Correct Answer *</label>
                <select className="form-input" value={correctOpt} onChange={e => setCorrectOpt(e.target.value)}>
                  {['a', 'b', 'c', 'd'].map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="quiz-cancel-btn">Cancel</button>
                <button type="submit" className="add-quiz-btn"><CheckCircle2 size={15} /> Add</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Questions Viewer */}
      {viewQuestionsFor && <QuestionsModal quiz={viewQuestionsFor} onClose={() => setViewQuestionsFor(null)} />}

      {/* Quiz Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
          <RefreshCw size={28} style={{ marginBottom: 10, color: '#475569' }} />
          <p style={{ margin: 0 }}>Loading quizzes…</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <FileCheck2 size={40} style={{ color: '#94a3b8', marginBottom: 12 }} />
          <p style={{ color: '#64748b', margin: 0 }}>No quizzes yet. Click "Create Quiz" to get started!</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Quiz Title', 'Batch', 'Questions', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q.id}
                  style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.12s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.875rem' }}>{q.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>{q.description?.substring(0, 50) || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.85rem' }}>{q.batch}</td>
                  <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.85rem' }}>{q.questionsCount}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: q.type === 'AI Generated' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', color: q.type === 'AI Generated' ? '#c4b5fd' : '#93c5fd', border: '1px solid transparent' }}>
                      {q.type === 'AI Generated' ? '✨ AI' : '📝 Manual'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: q.status === 'Active' ? 'rgba(16,185,129,0.1)' : '#f1f5f9', color: q.status === 'Active' ? '#059669' : '#64748b' }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => setViewQuestionsFor(q)} title="View Questions" style={{ padding: '5px 9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                        <Eye size={13} /> Questions
                      </button>
                      <button onClick={() => setViewResultsFor(q)} title="View Results" style={{ padding: '5px 9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, color: '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                        <BarChart2 size={13} /> Results
                      </button>
                      <button onClick={() => handleDelete(q.id)} title="Delete" style={{ padding: '5px 9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, color: '#dc2626', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
