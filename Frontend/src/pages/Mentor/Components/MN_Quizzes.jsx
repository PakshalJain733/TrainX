import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, GraduationCap, Sparkles, ListPlus, CheckCircle2, X, Eye, HelpCircle, BookOpen, RefreshCw, Users, Trophy, BarChart2, FileCheck2, ChevronLeft, Zap, ChevronDown, Check, UploadCloud, FileSpreadsheet, FileText, Copy, Download, FileCheck } from "lucide-react";
import * as XLSX from "xlsx";
import { addSharedQuiz, getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";
import "../Styles/MN_Quizzes.css";

import CustomSelect from "../../../components/ui/CustomSelect";

/* ── Dropdown for Mentor Quizzes ── */
function MentorMqSelect(props) {
  return <CustomSelect {...props} />;
}

import { getApiBaseUrl } from "../../../utils/api.js";

const API_BASE = getApiBaseUrl();

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
      <div className="quiz-results-header">
        <button onClick={onBack} className="quiz-back-btn">
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h2 className="quiz-results-title">{quiz.title} — Results</h2>
          <p className="quiz-results-subtitle">{results.length} submission(s)</p>
        </div>
      </div>
      <div className="quiz-results-kpi-grid">
        {[{ l: 'Submissions', v: results.length, c: '#6366f1' }, { l: 'Avg Score', v: `${avg}%`, c: '#f59e0b' }, { l: 'Passed', v: passCount, c: '#10b981' }].map(s => (
          <div key={s.l} className="quiz-results-kpi-card">
            <div className="quiz-kpi-val" style={{ color: s.c }}>{s.v}</div>
            <div className="quiz-kpi-label">{s.l}</div>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="mentor-empty-table-cell">Loading…</div>
      ) : results.length === 0 ? (
        <div className="quiz-empty-results">
          <GraduationCap size={36} className="quiz-empty-results-icon" />
          <p className="quiz-empty-results-text">No submissions yet.</p>
        </div>
      ) : (
        <div className="quiz-table-container">
          <table className="quiz-table-full">
            <thead>
              <tr className="quiz-table-head-row">
                {['Student', 'Score', 'Percentage', 'Correct', 'Status', 'Submitted'].map(h => (
                  <th key={h} className="quiz-table-th">{h}</th>
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
              <BookOpen size={20} color="#818cf8" />
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
                  {q.correct === opt && <CheckCircle2 size={13} color="#10b981" />}
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

  // Excel Bulk Upload State
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Generate & Download Sample Excel (.xlsx) Template
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        "Question": "What is the primary function of React?",
        "Option A": "Building user interfaces",
        "Option B": "Managing databases",
        "Option C": "Compiling C++ code",
        "Option D": "Handling HTTP requests",
        "Correct Option": "A"
      },
      {
        "Question": "Which operator is used for strict equality in JavaScript?",
        "Option A": "==",
        "Option B": "===",
        "Option C": "=",
        "Option D": "!=",
        "Correct Option": "B"
      },
      {
        "Question": "What is the return type of typeof NaN in JavaScript?",
        "Option A": "number",
        "Option B": "nan",
        "Option C": "undefined",
        "Option D": "object",
        "Correct Option": "A"
      },
      {
        "Question": "Which data structure operates on a FIFO basis?",
        "Option A": "Stack",
        "Option B": "Queue",
        "Option C": "Tree",
        "Option D": "Graph",
        "Correct Option": "B"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Option"]
    });
    worksheet['!cols'] = [
      { wch: 45 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Questions");
    XLSX.writeFile(workbook, "Quiz_Questions_Template.xlsx");
  };

  // Parse Uploaded Excel (.xlsx, .xls, .csv) File
  const handleExcelFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonRows || jsonRows.length === 0) {
          alert("The uploaded file appears to be empty.");
          return;
        }

        const parsedQuestions = jsonRows.map((row, idx) => {
          const qText = row["Question"] || row["question"] || row["Question Text"] || row["Q"] || Object.values(row)[0] || "";
          const optA = row["Option A"] || row["option_a"] || row["OptionA"] || row["A"] || Object.values(row)[1] || "";
          const optB = row["Option B"] || row["option_b"] || row["OptionB"] || row["B"] || Object.values(row)[2] || "";
          const optC = row["Option C"] || row["option_c"] || row["OptionC"] || row["C"] || Object.values(row)[3] || "N/A";
          const optD = row["Option D"] || row["option_d"] || row["OptionD"] || row["D"] || Object.values(row)[4] || "N/A";
          let rawAns = (row["Correct Option"] || row["correct_option"] || row["Correct"] || row["Answer"] || Object.values(row)[5] || "A").toString().toLowerCase().trim();

          let correct = "a";
          if (["a", "1", "option a", "option_a"].includes(rawAns)) correct = "a";
          else if (["b", "2", "option b", "option_b"].includes(rawAns)) correct = "b";
          else if (["c", "3", "option c", "option_c"].includes(rawAns)) correct = "c";
          else if (["d", "4", "option d", "option_d"].includes(rawAns)) correct = "d";
          else if (optA && rawAns === optA.toLowerCase()) correct = "a";
          else if (optB && rawAns === optB.toLowerCase()) correct = "b";
          else if (optC && rawAns === optC.toLowerCase()) correct = "c";
          else if (optD && rawAns === optD.toLowerCase()) correct = "d";

          return {
            id: Date.now() + idx,
            text: String(qText).trim(),
            options: { a: String(optA).trim(), b: String(optB).trim(), c: String(optC).trim(), d: String(optD).trim() },
            correct
          };
        }).filter(q => q.text && q.options.a && q.options.b);

        if (parsedQuestions.length === 0) {
          alert("Could not parse valid questions. Please ensure row 1 has column headers: Question, Option A, Option B, Option C, Option D, Correct Option.");
          return;
        }

        setParsedBulkQuestions(parsedQuestions);
        setBulkFileName(file.name);
        setShowBulkPreview(true);
      } catch (err) {
        alert("Error reading Excel file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const fetchBatches = async () => {
    try {
      const r = await fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success && Array.isArray(d.data)) {
        setAvailableBatches(d.data);
      } else {
        setAvailableBatches([]);
      }
    } catch {
      setAvailableBatches([]);
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
    const handleBatchUpdate = () => fetchBatches();
    window.addEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => {
      window.removeEventListener(EVENTS.QUIZ_UPDATED, handleUpdate);
      window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    };
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
      } else if (mode === "bulk") {
        if (!parsedBulkQuestions.length) { alert("No valid questions parsed. Please upload a valid Excel (.xlsx, .xls, .csv) file."); setIsGenerating(false); return; }
        await saveQuizToDB(parsedBulkQuestions, "Bulk Upload");
      } else {
        if (!manualQuestions.length) { alert("Add at least 1 question first."); setIsGenerating(false); return; }
        await saveQuizToDB(manualQuestions, "Manual");
      }
      await fetchQuizzes();
      resetForm();
    } catch (err) { alert("Error: " + err.message); }
    finally { setIsGenerating(false); }
  };

  const resetForm = () => {
    setTitle(""); setBatch("All Batches"); setNumQuestions("10"); setDurationMins("30");
    setTotalMarks(""); setPassMarks(""); setManualQuestions([]); setShowForm(false); setShowManualModal(false);
    setParsedBulkQuestions([]); setShowBulkPreview(false); setBulkFileName("");
  };

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
      <div className="ui-section-header-MN">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <GraduationCap size={22} className="ui-section-title-icon" />
              <span>Quiz Management</span>
            </h2>
            <p className="ui-section-desc">
              Create, manage, and track quiz assessments. View real-time student results.
            </p>
          </div>
          <div className="ui-section-action">
            <button onClick={() => setShowForm(!showForm)} className="add-quiz-btn"><Plus size={16} /> {showForm ? "Cancel" : "Create Quiz"}</button>
          </div>
        </div>
      </div>

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
                  <div className="mode-text"><span className="mode-title">AI Generated</span><span className="mode-sub">Auto-creates with Google Gemini</span></div>
                </button>
                <button type="button" className={`mode-tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>
                  <ListPlus size={18} className="mode-icon" />
                  <div className="mode-text"><span className="mode-title">Manual Entry</span><span className="mode-sub">Add questions yourself</span></div>
                </button>
                <button type="button" className={`mode-tab ${mode === "bulk" ? "active" : ""}`} onClick={() => setMode("bulk")}>
                  <FileSpreadsheet size={18} className="mode-icon bulk-upload-icon" />
                  <div className="mode-text"><span className="mode-title">Excel Bulk Upload</span><span className="mode-sub">Upload .xlsx layout file to create quiz</span></div>
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
                    <MentorMqSelect
                      value={batch}
                      options={[
                        { value: "All Batches", label: "All Batches" },
                        ...availableBatches.map(b => ({ value: b.name, label: b.name }))
                      ]}
                      onChange={(val) => setBatch(val)}
                    />
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
                  {mode === "bulk" && (
                    <div className="form-group">
                      <label className="form-label">Excel File Status</label>
                      <div className="manual-status-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`q-count-badge ${parsedBulkQuestions.length > 0 ? "badge-success" : ""}`}>
                          {parsedBulkQuestions.length} Parsed Question{parsedBulkQuestions.length !== 1 ? "s" : ""}
                        </span>
                        {parsedBulkQuestions.length > 0 && (
                          <button type="button" className="open-modal-btn" onClick={() => setShowBulkPreview(!showBulkPreview)}>
                            <Eye size={13} /> {showBulkPreview ? "Hide Preview" : "Preview"}
                          </button>
                        )}
                      </div>
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

                {/* DEDICATED COMPACT EXCEL BULK UPLOAD SECTION */}
                {mode === "bulk" && (
                  <div className="compact-excel-container">
                    {/* 1. Compact Top Bar: Columns Guide & Template Download Button */}
                    <div className="excel-compact-topbar">
                      <div className="excel-topbar-left">
                        <FileSpreadsheet size={18} className="excel-green-icon" />
                        <span className="excel-topbar-title">Excel Columns (Row 1):</span>
                        <div className="compact-col-pills">
                          <span className="col-pill req" title="Question text (Required)">Question</span>
                          <span className="col-pill req" title="Choice A (Required)">Option A</span>
                          <span className="col-pill req" title="Choice B (Required)">Option B</span>
                          <span className="col-pill opt" title="Choice C (Optional)">Option C</span>
                          <span className="col-pill opt" title="Choice D (Optional)">Option D</span>
                          <span className="col-pill req" title="Correct Key A/B/C/D (Required)">Correct Option</span>
                        </div>
                      </div>
                      <button type="button" className="excel-download-btn-sm" onClick={downloadExcelTemplate} title="Download standard template layout">
                        <Download size={14} /> Download Layout (.xlsx)
                      </button>
                    </div>

                    {/* 2. Compact Drag & Drop Upload Zone */}
                    <div className="excel-dropzone-compact" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                      {bulkFileName ? (
                        <div className="upload-success-compact">
                          <CheckCircle2 size={18} color="#10b981" />
                          <span className="filename-text">{bulkFileName}</span>
                          <span className="parsed-badge">✓ {parsedBulkQuestions.length} Questions Loaded</span>
                          <button type="button" className="browse-btn-sm">Change File</button>
                        </div>
                      ) : (
                        <div className="dropzone-content-compact">
                          <UploadCloud size={20} className="dropzone-icon-sm" />
                          <span>
                            Drag & drop Excel file (<strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>) or <span className="browse-link">browse computer</span>
                          </span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelFileUpload}
                        style={{ display: "none" }}
                      />
                    </div>

                    {/* 3. Parsed Questions Preview Section */}
                    {parsedBulkQuestions.length > 0 && showBulkPreview && (
                      <div className="bulk-preview-list">
                        <div className="bulk-preview-header">
                          <span>Parsed Questions ({parsedBulkQuestions.length})</span>
                          <span className="bulk-preview-hint">Review parsed choices & correct answer</span>
                        </div>
                        <div className="bulk-preview-items">
                          {parsedBulkQuestions.map((q, idx) => (
                            <div key={q.id || idx} className="bulk-preview-card">
                              <div className="bulk-preview-qtext">
                                <span className="q-num">Q{idx + 1}.</span> {q.text}
                              </div>
                              <div className="bulk-preview-options-grid">
                                <div className={`bulk-opt-item ${q.correct === "a" ? "is-correct" : ""}`}>
                                  <span className="opt-key">A:</span> {q.options.a}
                                  {q.correct === "a" && <CheckCircle2 size={13} className="correct-check" />}
                                </div>
                                <div className={`bulk-opt-item ${q.correct === "b" ? "is-correct" : ""}`}>
                                  <span className="opt-key">B:</span> {q.options.b}
                                  {q.correct === "b" && <CheckCircle2 size={13} className="correct-check" />}
                                </div>
                                <div className={`bulk-opt-item ${q.correct === "c" ? "is-correct" : ""}`}>
                                  <span className="opt-key">C:</span> {q.options.c}
                                  {q.correct === "c" && <CheckCircle2 size={13} className="correct-check" />}
                                </div>
                                <div className={`bulk-opt-item ${q.correct === "d" ? "is-correct" : ""}`}>
                                  <span className="opt-key">D:</span> {q.options.d}
                                  {q.correct === "d" && <CheckCircle2 size={13} className="correct-check" />}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                  <button type="submit" className="add-quiz-btn" disabled={isGenerating || (mode === "bulk" && parsedBulkQuestions.length === 0)}>
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
                <div className="modal-header-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)' }}><ListPlus size={20} color="#10b981" /></div>
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
                <MentorMqSelect
                  value={correctOpt}
                  options={['a', 'b', 'c', 'd'].map(o => ({ value: o, label: `Option ${o.toUpperCase()}` }))}
                  onChange={(val) => setCorrectOpt(val)}
                />
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
                  <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Actions' ? 'center' : 'left', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
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
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
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
