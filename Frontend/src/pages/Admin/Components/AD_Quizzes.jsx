import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, GraduationCap, Sparkles, ListPlus, CheckCircle2, X, Eye, HelpCircle, BookOpen, RefreshCw, ChevronDown, Check, ShieldCheck, ShieldX, AlertTriangle, Send, UploadCloud, FileSpreadsheet, FileText, Copy, Download, FileCheck } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { addSharedQuiz, getSharedQuizzes, EVENTS } from "../../../utils/sharedStore";
import "../Styles/AD_Quizzes.css";

import CustomSelect from "../../../components/ui/CustomSelect";

/* ── Dropdown for Admin Quizzes ── */
function AdminQuizSelect(props) {
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
    duration_minutes: a.duration_minutes || 15,
    duration: `${a.duration_minutes || 15} mins`,
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
  const [timeLimit, setTimeLimit] = useState("15");

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

  // Excel Bulk Upload State
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Generate & Download Sample Excel (.xlsx) Template
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        "Question": "",
        "Option A": "",
        "Option B": "",
        "Option C": "",
        "Option D": "",
        "Correct Option": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
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

  // ── Fetch quizzes & batches from DB on mount ──
  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableBatches(data.data);
      } else {
        setAvailableBatches([]);
      }
    } catch (err) {
      console.warn("Failed to fetch batches from DB:", err);
      setAvailableBatches([]);
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
      duration_minutes: parseInt(timeLimit, 10) || 15,
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
        duration_minutes: parseInt(timeLimit, 10) || Math.max(10, questionsList.length * 2),
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

    } else if (mode === "bulk") {
      if (parsedBulkQuestions.length === 0) {
        alert("No valid questions parsed. Please upload a valid Excel (.xlsx, .xls, .csv) file.");
        return;
      }
      setIsGenerating(true);
      try {
        await saveQuizToDB(parsedBulkQuestions, "Bulk Upload");
        await fetchQuizzes();
        resetForm();
      } catch (err) {
        alert("Error creating quiz from bulk upload: " + err.message);
      } finally {
        setIsGenerating(false);
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
    setParsedBulkQuestions([]); setShowBulkPreview(false); setBulkFileName("");
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
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <GraduationCap size={22} className="ui-section-title-icon" />
              <span>Manage Quizzes</span>
            </h2>
            <p className="ui-section-desc">
              Create and track quiz assessments across batches using AI, manual entry, or bulk upload.
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
          <div className="quiz-modal-content modal-flash-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create New Quiz Assessment</h2>
                  <p className="modal-subtitle">Generate questions automatically using AI, build custom sets manually, or bulk import questions.</p>
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
                    <span className="mode-sub">Enter custom questions & choices manually</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`mode-tab ${mode === "bulk" ? "active" : ""}`}
                  onClick={() => setMode("bulk")}
                >
                  <FileSpreadsheet size={18} className="mode-icon bulk-upload-icon" />
                  <div className="mode-text">
                    <span className="mode-title">Excel Bulk Upload</span>
                    <span className="mode-sub">Upload .xlsx layout file to create quiz</span>
                  </div>
                </button>
              </div>

              <form onSubmit={handleCreateQuizSubmit} className="quiz-add-form">
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label>Quiz Title</label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Python OOP Assessment & Data Structures"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
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
                </div>

                <div className="form-row">
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
                  ) : mode === "bulk" ? (
                    <div className="form-group">
                      <label>Excel File Status</label>
                      <div className="manual-status-box">
                        <span className={`q-count-badge ${parsedBulkQuestions.length > 0 ? "badge-success" : ""}`}>
                          {parsedBulkQuestions.length} Parsed Question{parsedBulkQuestions.length !== 1 ? "s" : ""}
                        </span>
                        {parsedBulkQuestions.length > 0 && (
                          <button
                            type="button"
                            className="open-modal-btn"
                            onClick={() => setShowBulkPreview(!showBulkPreview)}
                          >
                            <Eye size={15} /> {showBulkPreview ? "Hide Preview" : "Preview Questions"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Manual Questions Status</label>
                      <div className="manual-status-box">
                        <span className="q-count-badge">{manualQuestions.length} Questions</span>
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
                          <ListPlus size={15} /> Add / Edit Questions
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Time (Mins)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={timeLimit}
                      onChange={e => setTimeLimit(e.target.value)}
                      placeholder="e.g. 15"
                      required
                    />
                  </div>
                </div>

                {/* DEDICATED COMPACT EXCEL BULK UPLOAD SECTION */}
                {mode === "bulk" && (
                  <div className="compact-excel-container">
                    {/* 1. Compact Top Bar: Columns Guide & Template Download Button */}
                    <div className="excel-compact-topbar">
                      <div className="excel-topbar-left">
                        <FileSpreadsheet size={18} className="excel-green-icon" />
                        <span className="excel-topbar-title">Excel Columns:</span>
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
                            Drag & drop Excel file (<strong>.xlsx</strong>, <strong>.xls</strong>) or <span className="browse-link">Upload</span>
                          </span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        required
                        accept=".xlsx,.xls"
                        onChange={handleExcelFileUpload}
                        style={{ display: "none" }}
                      />
                    </div>

                    {/* 3. Parsed Questions Preview Section */}
                    {parsedBulkQuestions.length > 0 && showBulkPreview && (
                      <div className="bulk-preview-list">
                        <div className="bulk-preview-header">
                          <span>Parsed Questions ({parsedBulkQuestions.length})</span>
                          <span className="bulk-preview-hint">Review parsed choices & correct answers before saving</span>
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
                  ) : mode === "bulk" ? (
                    <button
                      type="submit"
                      className="quiz-submit-btn bulk-btn"
                      disabled={isGenerating || parsedBulkQuestions.length === 0}
                    >
                      <UploadCloud size={16} /> Save Quiz ({parsedBulkQuestions.length} Questions)
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
                      {q.type === "AI Generated" ? "AI Generated" : "Manual"}
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

