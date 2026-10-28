import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, GraduationCap, Sparkles, ListPlus, CheckCircle2, X, Eye, HelpCircle, BookOpen, RefreshCw, Users, Trophy, BarChart2, FileCheck2, ChevronLeft, Zap, ChevronDown, Check, UploadCloud, FileSpreadsheet, FileText, Copy, Download, FileCheck, Search, Filter, Layers } from "lucide-react";
import * as XLSX from "xlsx";
import { addSharedQuiz, getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";
import "../Styles/MN_Quizzes.css";
import "../../Admin/Styles/AD_Quizzes.css";

import CustomSelect from "../../../components/ui/CustomSelect";

/* ── Dropdown for Mentor Quizzes ── */
function MentorMqSelect(props) {
  return <CustomSelect {...props} />;
}

import { getApiBaseUrl, getAuthToken } from "../../../utils/api.js";

const API_BASE = getApiBaseUrl();

function getAuthHeaders() {
  let token = getAuthToken();
  if (!token) {
    try {
      const uSession = JSON.parse(
        sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
      );
      token = uSession.token || uSession.authToken || uSession.auth_token || uSession.accessToken || uSession.jwt || "";
    } catch (e) {}
  }

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
  let type = "Manual";
  const cat = (a.category || "").toLowerCase();
  const desc = (a.description || "").toLowerCase();
  if (cat.includes("ai") || desc.includes("ai generated")) {
    type = "AI Generated";
  } else if (cat.includes("bulk") || desc.includes("bulk upload") || desc.includes("excel")) {
    type = "Bulk Upload";
  }

  const subCount = a.submission_count !== undefined 
    ? Number(a.submission_count) 
    : a.submissions !== undefined 
    ? Number(a.submissions) 
    : 0;

  return {
    id: a.id,
    title: a.title,
    batch: a.batch_name || a.batch || "All Batches",
    questionsCount: a.total_questions || rawQs.length || 0,
    type,
    category: a.category || type,
    status: a.status === "published" ? "Active" : a.status === "draft" ? "Draft" : (a.status || "Active"),
    submissions: subCount,
    questionsList: rawQs.map(normalizeQuestion),
    description: a.description || "",
    total_marks: a.total_marks || 0,
    pass_marks: a.pass_marks || 0,
  };
}

/* ─── Results Panel with Real-Time Student Analytics ────────── */
function QuizResultsPanel({ quiz, onBack }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
  const failCount = results.length - passCount;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;

  const filteredResults = results.filter(r => {
    const pct = parseFloat(r.percentage || 0);
    const passed = pct >= 60 || r.status === 'passed';
    if (statusFilter === "Passed" && !passed) return false;
    if (statusFilter === "Failed" && passed) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const matchName = (r.student_name || "").toLowerCase().includes(q);
      const matchEmail = (r.student_email || "").toLowerCase().includes(q);
      const matchRoll = (r.roll_number || r.rollNo || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRoll) return false;
    }
    return true;
  });

  return (
    <div className="admin-quizzes-container">
      <div className="quiz-results-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} className="quiz-back-btn">
            <ChevronLeft size={16} /> Back to Quizzes
          </button>
          <div>
            <h2 className="quiz-results-title" style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {quiz.title} — Student Results
            </h2>
            <p className="quiz-results-subtitle" style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0" }}>
              Batch: <strong style={{ color: "#4f46e5" }}>{quiz.batch}</strong> • {results.length} total attempt{results.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="quiz-results-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { l: 'Total Submissions', v: results.length, c: '#4f46e5', icon: <Users size={20} /> },
          { l: 'Average Score', v: `${avg}%`, c: '#f59e0b', icon: <Trophy size={20} /> },
          { l: 'Passed Candidates', v: passCount, c: '#10b981', icon: <CheckCircle2 size={20} /> },
          { l: 'Pass Rate', v: `${passRate}%`, c: '#8b5cf6', icon: <Award size={20} /> },
        ].map(s => (
          <div key={s.l} className="quiz-results-kpi-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${s.c}15`, color: s.c, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div className="quiz-kpi-val" style={{ color: s.c, fontSize: "20px", fontWeight: 800, lineHeight: 1.1 }}>{s.v}</div>
              <div className="quiz-kpi-label" style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Filter Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div className="mq-search-box" style={{ maxWidth: "340px" }}>
          <Search size={15} style={{ color: "#6366f1" }} />
          <input
            type="text"
            className="mq-search-input"
            placeholder="Search by student name or email..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
          {studentSearch && (
            <button
              type="button"
              onClick={() => setStudentSearch("")}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[
            { id: "All", label: "All Attempts", count: results.length },
            { id: "Passed", label: "Passed", count: passCount },
            { id: "Failed", label: "Failed", count: failCount },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`mq-pill-btn ${statusFilter === st.id ? "active" : ""}`}
              onClick={() => setStatusFilter(st.id)}
            >
              <span>{st.label}</span>
              <span className="mq-pill-count">{st.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <RefreshCw size={26} className="spin" style={{ color: "#4f46e5", marginBottom: "10px" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Loading student quiz submissions...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="quiz-empty-results" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "50px 20px", textAlign: "center" }}>
          <GraduationCap size={40} className="quiz-empty-results-icon" style={{ color: "#94a3b8", marginBottom: "10px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
            {studentSearch || statusFilter !== "All" ? "No matching submissions found" : "No submissions recorded yet"}
          </h3>
          <p className="quiz-empty-results-text" style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
            {studentSearch || statusFilter !== "All" ? "Try clearing search keywords or status filters." : "When students complete this quiz, their scores and time will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="quiz-table-container" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table className="quiz-table-full" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="quiz-table-head-row" style={{ background: "#f8fafc" }}>
                {['Student', 'Score / Total', 'Percentage', 'Correct Answers', 'Result Status', 'Submitted At'].map(h => (
                  <th key={h} className="quiz-table-th" style={{ padding: "12px 16px", fontSize: "11.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r, i) => {
                const pct = parseFloat(r.percentage || 0);
                const passed = pct >= 60 || r.status === 'passed';
                return (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>{r.student_name || `Student #${r.user_id}`}</div>
                      <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: "1px" }}>{r.student_email || (r.roll_number ? `Roll: ${r.roll_number}` : 'No email')}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>
                      {r.marks_obtained ?? r.score ?? '—'} <span style={{ color: "#94a3b8", fontWeight: 400 }}>/ {r.total_marks ?? quiz.total_marks ?? '—'} pts</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 800, color: passed ? '#059669' : '#dc2626', fontSize: '13px' }}>{pct}%</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12.5px', fontWeight: 600 }}>
                      {r.correct_count ?? '—'} / {quiz.questionsCount || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: '3px 10px',
                        borderRadius: "999px",
                        fontSize: '11px',
                        fontWeight: 700,
                        background: passed ? '#ecfdf5' : '#fef2f2',
                        color: passed ? '#047857' : '#b91c1c',
                        border: passed ? '1px solid #a7f3d0' : '1px solid #fecaca'
                      }}>
                        {passed ? <CheckCircle2 size={12} /> : <X size={12} />}
                        {passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
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

  // Search & Filters
  const [quizSearch, setQuizSearch] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");

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
      const r = await fetch(`${API_BASE}/mentor/batches`, { headers: getAuthHeaders() });
      const d = await r.json();
      const list = Array.isArray(d.data?.batches) ? d.data.batches : (Array.isArray(d.data) ? d.data : []);
      if (list.length > 0) {
        setAvailableBatches(list);
      } else {
        const fallback = await fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() });
        const fb = await fallback.json();
        if (fb.success && Array.isArray(fb.data)) setAvailableBatches(fb.data);
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
      if (d.success && Array.isArray(d.data)) {
        list = d.data.map(mapAssessment);
      }

      // Single authoritative source: only fallback to sharedStore if /assessments returned 0 records
      let combined = list;
      if (list.length === 0) {
        const shared = await getSharedQuizzes([]);
        combined = (Array.isArray(shared) ? shared : []).map(s => ({
          id: s.id,
          title: s.title,
          batch: s.batch_name || s.data?.batch || "All Batches",
          questionsCount: s.data?.questionsCount || (Array.isArray(s.data?.questions) ? s.data.questions.length : 10),
          type: "Manual",
          status: s.status || "Active",
          questionsList: s.data?.questions || [],
          description: s.description || "",
          total_marks: s.data?.totalMarks || 100,
          pass_marks: 60,
        }));
      }

      // Strictly deduplicate by normalized title AND normalized batch
      // This permanently stops "one quiz many times"
      const seen = new Map();
      for (const q of combined) {
        const normTitle = (q.title || '').trim().toLowerCase();
        const normBatch = (q.batch || 'all batches').trim().toLowerCase();
        const key = `${normTitle}__${normBatch}`;

        if (!seen.has(key)) {
          seen.set(key, q);
        } else {
          // If a duplicate exists, retain the entry with more questions or richer data
          const existing = seen.get(key);
          if ((existing.questionsCount || 0) < (q.questionsCount || 0)) {
            seen.set(key, q);
          }
        }
      }
      setQuizzes(Array.from(seen.values()));
    } catch {
      const shared = await getSharedQuizzes([]);
      if (shared && shared.length > 0) {
        const seen = new Map();
        for (const s of shared) {
          const sTitle = (s.title || '').trim();
          const normTitle = sTitle.toLowerCase();
          const normBatch = (s.batch_name || s.data?.batch || "All Batches").trim().toLowerCase();
          const key = `${normTitle}__${normBatch}`;
          if (!seen.has(key)) {
            seen.set(key, {
              id: s.id,
              title: sTitle,
              batch: s.batch_name || s.data?.batch || "All Batches",
              questionsCount: s.data?.questionsCount || (Array.isArray(s.data?.questions) ? s.data.questions.length : 10),
              type: "Manual",
              status: "Active",
              questionsList: s.data?.questions || [],
              description: s.description || "",
              total_marks: 100,
              pass_marks: 60,
            });
          }
        }
        setQuizzes(Array.from(seen.values()));
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

  const saveQuizToDB = async (questionsList, quizType) => {
    const batchObj = availableBatches.find(b => b.name === batch);
    const qCount = questionsList.length;
    const marks = parseInt(totalMarks) || qCount * 10;
    const pass = parseInt(passMarks) || Math.round(marks * 0.6);

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
    if (isGenerating) return;
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

  // Filter quizzes based on search query, batch, and type
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      const matchesSearch = !quizSearch.trim() || 
        (q.title || '').toLowerCase().includes(quizSearch.trim().toLowerCase()) ||
        (q.description || '').toLowerCase().includes(quizSearch.trim().toLowerCase());

      const matchesBatch = selectedBatchFilter === "All" || 
        (q.batch || 'All Batches').toLowerCase() === selectedBatchFilter.toLowerCase();

      const matchesType = selectedTypeFilter === "All" || 
        (q.type || 'Manual').toLowerCase() === selectedTypeFilter.toLowerCase();

      return matchesSearch && matchesBatch && matchesType;
    });
  }, [quizzes, quizSearch, selectedBatchFilter, selectedTypeFilter]);

  // Executive KPI summary metrics
  const kpiStats = useMemo(() => {
    const total = quizzes.length;
    const active = quizzes.filter(q => (q.status || 'Active').toLowerCase() === 'active').length;
    const totalQuestions = quizzes.reduce((sum, q) => sum + (Number(q.questionsCount) || 0), 0);
    const aiCount = quizzes.filter(q => q.type === 'AI Generated').length;
    const manualCount = quizzes.filter(q => q.type === 'Manual').length;
    const bulkCount = quizzes.filter(q => q.type === 'Bulk Upload').length;
    return { total, active, totalQuestions, aiCount, manualCount, bulkCount };
  }, [quizzes]);

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

      {/* Executive KPI Metrics Grid */}
      <div className="mq-kpi-grid">
        <div className="mq-kpi-card">
          <div className="mq-kpi-icon mq-kpi-icon--indigo">
            <GraduationCap size={22} />
          </div>
          <div className="mq-kpi-info">
            <span className="mq-kpi-val">{kpiStats.total}</span>
            <span className="mq-kpi-label">Total Quizzes</span>
            <span className="mq-kpi-sub">Curated assessments</span>
          </div>
        </div>

        <div className="mq-kpi-card">
          <div className="mq-kpi-icon mq-kpi-icon--emerald">
            <FileCheck2 size={22} />
          </div>
          <div className="mq-kpi-info">
            <span className="mq-kpi-val">{kpiStats.active}</span>
            <span className="mq-kpi-label">Active Quizzes</span>
            <span className="mq-kpi-sub">Ready for students</span>
          </div>
        </div>

        <div className="mq-kpi-card">
          <div className="mq-kpi-icon mq-kpi-icon--amber">
            <HelpCircle size={22} />
          </div>
          <div className="mq-kpi-info">
            <span className="mq-kpi-val">{kpiStats.totalQuestions}</span>
            <span className="mq-kpi-label">Total Questions</span>
            <span className="mq-kpi-sub">Across all quizzes</span>
          </div>
        </div>

        <div className="mq-kpi-card">
          <div className="mq-kpi-icon mq-kpi-icon--purple">
            <Sparkles size={22} />
          </div>
          <div className="mq-kpi-info">
            <span className="mq-kpi-val">{kpiStats.aiCount} AI / {kpiStats.manualCount + kpiStats.bulkCount} Manual</span>
            <span className="mq-kpi-label">Quiz Generation</span>
            <span className="mq-kpi-sub">Distribution breakdown</span>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="mq-toolbar">
        <div className="mq-search-box">
          <Search size={16} className="mq-search-icon" />
          <input
            type="text"
            className="mq-search-input"
            placeholder="Search quizzes by title or topic..."
            value={quizSearch}
            onChange={e => setQuizSearch(e.target.value)}
          />
          {quizSearch && (
            <button className="mq-search-clear" onClick={() => setQuizSearch("")} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mq-filter-group">
          {/* Batch Selector */}
          <div style={{ minWidth: 170 }}>
            <MentorMqSelect
              value={selectedBatchFilter}
              options={[
                { value: "All", label: "All Batches" },
                ...availableBatches.map(b => ({ value: b.name, label: b.name }))
              ]}
              onChange={val => setSelectedBatchFilter(val)}
            />
          </div>

          {/* Quick Type Pills */}
          <div className="mq-pill-group">
            <button
              type="button"
              className={`mq-pill-btn ${selectedTypeFilter === "All" ? "mq-pill-btn--active" : ""}`}
              onClick={() => setSelectedTypeFilter("All")}
            >
              All ({quizzes.length})
            </button>
            <button
              type="button"
              className={`mq-pill-btn ${selectedTypeFilter === "AI Generated" ? "mq-pill-btn--active" : ""}`}
              onClick={() => setSelectedTypeFilter("AI Generated")}
            >
              ✨ AI ({kpiStats.aiCount})
            </button>
            <button
              type="button"
              className={`mq-pill-btn ${selectedTypeFilter === "Manual" ? "mq-pill-btn--active" : ""}`}
              onClick={() => setSelectedTypeFilter("Manual")}
            >
              📝 Manual ({kpiStats.manualCount})
            </button>
            {kpiStats.bulkCount > 0 && (
              <button
                type="button"
                className={`mq-pill-btn ${selectedTypeFilter === "Bulk Upload" ? "mq-pill-btn--active" : ""}`}
                onClick={() => setSelectedTypeFilter("Bulk Upload")}
              >
                📊 Bulk ({kpiStats.bulkCount})
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="mq-refresh-btn"
            onClick={fetchQuizzes}
            title="Refresh quizzes"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Quiz Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: 10, color: '#4f46e5' }} />
          <p style={{ margin: 0, fontWeight: 500 }}>Loading quizzes…</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <FileCheck2 size={42} style={{ color: '#94a3b8', marginBottom: 12 }} />
          <p style={{ color: '#334155', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 6px 0' }}>
            {quizSearch || selectedBatchFilter !== 'All' || selectedTypeFilter !== 'All' 
              ? "No quizzes match your filter criteria" 
              : "No quizzes created yet"}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            {quizSearch || selectedBatchFilter !== 'All' || selectedTypeFilter !== 'All' 
              ? (
                <button 
                  type="button"
                  onClick={() => { setQuizSearch(''); setSelectedBatchFilter('All'); setSelectedTypeFilter('All'); }}
                  style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              )
              : "Click \"Create Quiz\" above to generate an AI quiz or build one manually."}
          </p>
        </div>
      ) : (
        <div className="mq-table-card">
          <table className="mq-table">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Quiz Title</th>
                <th style={{ width: '18%' }}>Batch</th>
                <th style={{ width: '12%' }}>Questions</th>
                <th style={{ width: '14%' }}>Type</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuizzes.map(q => (
                <tr key={q.id}>
                  <td>
                    <div className="mq-quiz-title-cell">
                      <div className="mq-avatar-icon">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <div className="mq-quiz-name">{q.title}</div>
                        <div className="mq-quiz-sub" title={q.description}>
                          {q.description || 'Standard technical assessment'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`mq-badge-batch ${q.batch === 'All Batches' ? 'mq-badge-batch--universal' : ''}`}>
                      {q.batch || 'All Batches'}
                    </span>
                  </td>
                  <td>
                    <span className="mq-badge-qcount">
                      <HelpCircle size={12} style={{ color: '#64748b' }} />
                      {q.questionsCount} Questions
                    </span>
                  </td>
                  <td>
                    <span className={`mq-badge-type ${q.type === 'AI Generated' ? 'mq-badge-type--ai' : q.type === 'Bulk Upload' ? 'mq-badge-type--bulk' : 'mq-badge-type--manual'}`}>
                      {q.type === 'AI Generated' ? '✨ AI Generated' : q.type === 'Bulk Upload' ? '📊 Bulk Upload' : '📝 Manual'}
                    </span>
                  </td>
                  <td>
                    <span className={`mq-badge-status ${q.status === 'Active' ? 'mq-badge-status--active' : 'mq-badge-status--draft'}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.status === 'Active' ? '#10b981' : '#f59e0b', display: 'inline-block' }}></span>
                      {q.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="mq-action-group">
                      <button 
                        type="button"
                        onClick={() => setViewQuestionsFor(q)} 
                        title="View Questions" 
                        className="mq-btn-action"
                      >
                        <Eye size={13} /> Questions
                      </button>
                      <button 
                        type="button"
                        onClick={() => setViewResultsFor(q)} 
                        title="View Results & Analytics" 
                        className="mq-btn-action mq-btn-action--results"
                      >
                        <BarChart2 size={13} /> Results
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(q.id)} 
                        title="Delete Quiz" 
                        className="mq-btn-action mq-btn-action--delete"
                      >
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
