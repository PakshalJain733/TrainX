import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Code, Plus, Edit, Trash2, ListChecks, Send, Eye, CheckCircle2, XCircle, Clock, Award, Search, Filter, X, FileCode, FileCode2, Layers, ChevronRight, TrendingUp, Terminal, Sparkles, ChevronDown, AlertCircle, AlertTriangle, Cpu, Zap, CheckCheck, RefreshCw, User, MessageSquare, History } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { getSharedCodingTasks, addSharedCodingTask, EVENTS } from "../../../utils/sharedStore";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_PracticeProblems.css";

/* ── Dropdown for Admin PracticeProblems (Uses CustomSelect) ── */
function AdminPpSelect(props) {
  return <CustomSelect {...props} />;
}

const getStudentInitials = (name) => {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
  "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
];

const getAvatarBg = (id, idx) => {
  const num = Number(id) || idx || 0;
  return AVATAR_GRADIENTS[num % AVATAR_GRADIENTS.length];
};

const getLanguageBadgeInfo = (lang) => {
  const l = String(lang || "").toLowerCase();
  if (l.includes("java") && !l.includes("script")) {
    return { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe", label: "JAVA" };
  }
  if (l.includes("python")) {
    return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "PYTHON" };
  }
  if (l.includes("c++") || l.includes("cpp")) {
    return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", label: "C++" };
  }
  if (l.includes("script") || l.includes("js")) {
    return { bg: "#fef3c7", color: "#b45309", border: "#fde68a", label: "JAVASCRIPT" };
  }
  return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", label: (lang || "CODE").toUpperCase() };
};

const getStatusBadgeInfo = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "accepted") {
    return {
      bg: "#ecfdf5",
      color: "#065f46",
      border: "#a7f3d0",
      icon: <CheckCircle2 size={13} />,
      label: "Accepted"
    };
  }
  if (s.includes("wrong")) {
    return {
      bg: "#fef2f2",
      color: "#991b1b",
      border: "#fecaca",
      icon: <XCircle size={13} />,
      label: "Wrong Answer"
    };
  }
  if (s.includes("time") || s.includes("tle")) {
    return {
      bg: "#faf5ff",
      color: "#6b21a8",
      border: "#e9d5ff",
      icon: <Clock size={13} />,
      label: "Time Limit Exceeded"
    };
  }
  return {
    bg: "#fff7ed",
    color: "#9a3412",
    border: "#ffedd5",
    icon: <AlertCircle size={13} />,
    label: status || "Runtime Error"
  };
};

const initialCodingProblems = [];
const mockAssignments = [];

export default function AdminPracticeProblems({ role = "admin" }) {
  const isMentor = role === "mentor";
  const baseEndpoint = isMentor ? "/mentor/practice-problems" : "/admin/practice-problems";

  const [activeTab, setActiveTab] = useState("bank");

  // API + Local State
  const [problems, setProblems] = useState(initialCodingProblems);
  const [batches, setBatches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("All");
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [submissionFeedback, setSubmissionFeedback] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState("");

  const handleOpenSubmission = (s) => {
    setViewingSubmission(s);
    setSubmissionFeedback(s.feedback || "");
    setFeedbackSuccessMsg("");
  };

  const handleSaveFeedback = async (submissionId) => {
    if (!submissionId) return;
    setSavingFeedback(true);
    setFeedbackSuccessMsg("");
    try {
      const res = await apiFetch(`${baseEndpoint}/submissions/${submissionId}/feedback`, {
        method: "PATCH",
        body: JSON.stringify({ feedback: submissionFeedback })
      });
      if (res && res.data) {
        setViewingSubmission(prev => ({
          ...prev,
          feedback: res.data.feedback,
          feedbackBy: res.data.feedbackBy,
          feedbackAt: res.data.feedbackAt
        }));
        setSubmissions(prev => prev.map(s => s.id === submissionId ? {
          ...s,
          feedback: res.data.feedback,
          feedbackBy: res.data.feedbackBy,
          feedbackAt: res.data.feedbackAt
        } : s));
        setFeedbackSuccessMsg("Feedback saved successfully!");
        setTimeout(() => setFeedbackSuccessMsg(""), 3500);
      }
    } catch (err) {
      alert("Failed to save feedback: " + (err.message || "Unknown error"));
    } finally {
      setSavingFeedback(false);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const emptyProbState = {
    title: "",
    batch: "All Batches",
    batchId: null,
    topic: "",
    difficulty: "Easy",
    language: "All",
    xp: "",
    companies: "",
    timeLimit: "",
    memoryLimit: "",
    description: "",
    dueDate: "",
    sampleInput: "",
    sampleOutput: "",
    testCases: [],
  };

  const [newProb, setNewProb] = useState(emptyProbState);

  const [formTestCase, setFormTestCase] = useState({ input: "", output: "", isHidden: false });
  const [newTestCase, setNewTestCase] = useState({ input: "", output: "", isHidden: false });

  // AI Problem Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiLanguage, setAiLanguage] = useState("All");
  const [aiBatch, setAiBatch] = useState("All Batches");

  // Tab 2: Problem History States
  const [historySearch, setHistorySearch] = useState("");
  const [historyBatchFilter, setHistoryBatchFilter] = useState("All");
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState("All");

  const handleGenerateProblemAI = async (topicToUse, diffToUse, langToUse, batchToUse) => {
    const topic = (topicToUse || aiPromptTopic || "").trim() || "Arrays & Hashing";
    const difficulty = diffToUse || aiDifficulty || "Medium";
    const assignedLang = langToUse || aiLanguage || "All";
    const assignedBatch = batchToUse || aiBatch || "All Batches";
    const matchedBatchObj = batches.find(b => b.name === assignedBatch);
    setIsGeneratingAI(true);
    try {
      const res = await apiFetch(`${baseEndpoint}/generate-ai`, {
        method: "POST",
        body: JSON.stringify({ topic, difficulty }),
      });
      if (res && res.data) {
        const d = res.data;
        setNewProb({
          title: d.title || "",
          batch: assignedBatch,
          batchId: matchedBatchObj ? matchedBatchObj.id : null,
          topic: d.category || d.topic || topic,
          difficulty: d.difficulty || difficulty,
          language: assignedLang,
          xp: d.points || (difficulty === "Easy" ? 50 : difficulty === "Medium" ? 100 : 150),
          companies: d.tags || d.companies || "",
          timeLimit: d.timeLimit || "1.0s",
          memoryLimit: d.memoryLimit || "256 MB",
          description: d.description || "",
          dueDate: "",
          sampleInput: d.sampleInput || "",
          sampleOutput: d.sampleOutput || "",
          testCases: Array.isArray(d.testCases) ? d.testCases : [],
        });
        setShowAiModal(false);
        setShowAddModal(true);
      }
    } catch (err) {
      console.error("AI Coding Problem Generation failed:", err);
      alert("Failed to generate AI coding problem: " + (err.message || "Unknown error"));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddTestCaseToForm = (e) => {
    e.preventDefault();
    if (!formTestCase.input.trim() && !formTestCase.output.trim()) return;
    setNewProb((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
          id: `tc-${Date.now()}-${Math.random()}`,
          input: formTestCase.input,
          output: formTestCase.output,
          expectedOutput: formTestCase.output,
          isHidden: formTestCase.isHidden,
        },
      ],
    }));
    setFormTestCase({ input: "", output: "", isHidden: false });
  };

  const handleRemoveTestCaseFromForm = (idToRemove) => {
    setNewProb((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((tc) => tc.id !== idToRemove),
    }));
  };

  const fetchApiProblems = async () => {
    try {
      const apiRes = await apiFetch(baseEndpoint);
      const rawList = (apiRes && Array.isArray(apiRes.data)) ? apiRes.data : (Array.isArray(apiRes) ? apiRes : []);
      const mapped = rawList.map((p) => {
        if (!p || typeof p !== "object") return null;
        const title = (p.title || "").trim();
        const normTopic = p.category || p.topic || "General DSA";
        const normDiff = p.difficulty || "Medium";
        const normXp = Number(p.points || p.xp || 50);

        let normCompanies = ["Core DSA"];
        const rawTags = p.tags || p.companies;
        if (Array.isArray(rawTags) && rawTags.length > 0) {
          normCompanies = rawTags.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof rawTags === 'string' && rawTags.trim()) {
          normCompanies = rawTags.split(',').map(t => t.trim()).filter(Boolean);
        }

        const normTestCases = Array.isArray(p.testCases) ? p.testCases.map((tc, idx) => ({
          id: tc?.id || idx + 1,
          input: tc?.input || "",
          output: tc?.expected_output || tc?.output || "",
          expectedOutput: tc?.expected_output || tc?.output || "",
          isHidden: Boolean(tc?.is_hidden || tc?.isHidden)
        })) : [];

        return {
          id: p.id,
          title,
          batch: p.batch || p.batch_name || p.associated_batch_name || "All Batches",
          batchId: p.batch_id || null,
          topic: normTopic,
          difficulty: normDiff,
          language: p.language || "All",
          xp: normXp,
          companies: normCompanies,
          dueDate: p.dueDate || (p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : ""),
          timeLimit: p.timeLimit || "1.0s",
          memoryLimit: p.memoryLimit || "128 MB",
          description: p.description || "Solve the algorithmic coding challenge according to problem constraints.",
          testCases: normTestCases,
          createdAt: p.created_at || p.createdAt || null,
        };
      }).filter(Boolean).filter(p => p.title);

      setProblems(mapped);
    } catch (err) {
      console.error("Failed to load practice problems from DB:", err);
      setProblems([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const endpoint = isMentor ? "/mentor/batches" : "/batches";
      const res = await apiFetch(endpoint).catch(() => apiFetch("/batches"));
      const rawList = (res && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.batches) ? res.batches : []));
      if (Array.isArray(rawList)) {
        setBatches(rawList);
      }
    } catch (err) { }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await apiFetch(`${baseEndpoint}/submissions`);
      const list = (res && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : []);
      setSubmissions(list);
    } catch (err) {
      console.warn(`Failed to load ${baseEndpoint}/submissions, trying fallback:`, err);
      try {
        const alt = await apiFetch("/coding-submissions");
        const list = (alt && Array.isArray(alt.data)) ? alt.data : (Array.isArray(alt) ? alt : []);
        setSubmissions(list);
      } catch (e) {
        setSubmissions([]);
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchApiProblems();
    fetchBatches();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeTab]);

  const filteredSubmissions = submissions.filter((s) => {
    if (submissionStatusFilter !== "All") {
      if (s.status?.toLowerCase() !== submissionStatusFilter.toLowerCase()) {
        return false;
      }
    }
    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase();
      const matchName = (s.studentName || "").toLowerCase().includes(q);
      const matchRoll = (s.rollNo || "").toLowerCase().includes(q);
      const matchEmail = (s.studentEmail || "").toLowerCase().includes(q);
      const matchProb = (s.problemTitle || "").toLowerCase().includes(q);
      const matchLang = (s.language || "").toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchEmail && !matchProb && !matchLang) {
        return false;
      }
    }
    return true;
  });

  const filteredHistoryProblems = problems.filter((p) => {
    if (historyDifficultyFilter !== "All") {
      if ((p.difficulty || "").toLowerCase() !== historyDifficultyFilter.toLowerCase()) return false;
    }
    if (historyBatchFilter !== "All") {
      if ((p.batch || "All Batches").toLowerCase() !== historyBatchFilter.toLowerCase()) return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const mTitle = (p.title || "").toLowerCase().includes(q);
      const mTopic = (p.topic || "").toLowerCase().includes(q);
      const mBatch = (p.batch || "").toLowerCase().includes(q);
      if (!mTitle && !mTopic && !mBatch) return false;
    }
    return true;
  });

  const handleOpenEditProblem = (p) => {
    setEditingProblemId(p.id);
    const assignedBatch = p.batch || "All Batches";
    const matchedBatch = batches.find(b => b.name === assignedBatch);
    setNewProb({
      title: p.title || "",
      batch: assignedBatch,
      batchId: p.batchId || p.batch_id || (matchedBatch ? matchedBatch.id : null),
      topic: p.topic || "",
      difficulty: p.difficulty || "Easy",
      language: p.language || "All",
      xp: p.xp || 50,
      companies: Array.isArray(p.companies) ? p.companies.join(", ") : (p.companies || ""),
      timeLimit: p.timeLimit || "1.0s",
      memoryLimit: p.memoryLimit || "128 MB",
      description: p.description || "",
      dueDate: p.dueDate || "",
      sampleInput: p.sampleInput || "",
      sampleOutput: p.sampleOutput || "",
      testCases: p.testCases || [],
    });
    setFormTestCase({ input: "", output: "", isHidden: false });
    setShowAddModal(true);
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!newProb.title.trim()) return;

    const chosenBatchName = newProb.batch || "All Batches";
    const matchedBatch = batches.find(b => b.name === chosenBatchName);
    const chosenBatchId = newProb.batchId || (matchedBatch ? matchedBatch.id : null);

    const payload = {
      title: newProb.title.trim(),
      batch: chosenBatchName,
      batch_id: chosenBatchId,
      batchName: chosenBatchName,
      topic: newProb.topic,
      category: newProb.topic,
      difficulty: newProb.difficulty,
      language: newProb.language === "All" ? "" : newProb.language,
      xp: Number(newProb.xp) || 50,
      points: Number(newProb.xp) || 50,
      companies: newProb.companies,
      tags: newProb.companies,
      timeLimit: newProb.timeLimit || "1.0s",
      memoryLimit: newProb.memoryLimit || "128 MB",
      description: newProb.description || "",
      dueDate: newProb.dueDate || "",
      sampleInput: newProb.sampleInput || "",
      sampleOutput: newProb.sampleOutput || "",
      testCases: newProb.testCases || [],
    };

    try {
      if (editingProblemId) {
        await apiFetch(`${baseEndpoint}/${editingProblemId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(baseEndpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await fetchApiProblems();
    } catch (err) {
      console.error("Error saving practice problem in DB:", err);
    }

    setShowAddModal(false);
    setEditingProblemId(null);
    setNewProb(emptyProbState);
    setFormTestCase({ input: "", output: "", isHidden: false });
  };

  const handleDeleteProblem = async (id) => {
    if (!id) return;
    try {
      await apiFetch(`${baseEndpoint}/${id}`, { method: "DELETE" });
      await fetchApiProblems();
    } catch (err) {
      console.error("Failed to delete problem from DB:", err);
    }
  };

  const handleAddTestCase = (e) => {
    e.preventDefault();
    if (!newTestCase.input.trim() || !selectedProblem) return;

    const tc = {
      id: Date.now(),
      input: newTestCase.input.trim(),
      output: newTestCase.output.trim(),
      isHidden: !!newTestCase.isHidden,
    };

    const updatedTestCases = [...(selectedProblem.testCases || []), tc];

    const updatedProblems = problems.map((p) => {
      if (p.id === selectedProblem.id) {
        return { ...p, testCases: updatedTestCases };
      }
      return p;
    });

    setProblems(updatedProblems);
    setSelectedProblem({
      ...selectedProblem,
      testCases: updatedTestCases,
    });
    setNewTestCase({ input: "", output: "", isHidden: false });
  };

  const handleDeleteTestCaseInModal = (tcId) => {
    if (!selectedProblem) return;
    const updatedTestCases = (selectedProblem.testCases || []).filter((tc, idx) => (tc.id ?? idx) !== tcId);
    const updatedProblems = problems.map((p) => {
      if (p.id === selectedProblem.id) {
        return { ...p, testCases: updatedTestCases };
      }
      return p;
    });
    setProblems(updatedProblems);
    setSelectedProblem({
      ...selectedProblem,
      testCases: updatedTestCases,
    });
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignForm.title.trim()) return;

    const newAssign = {
      id: Date.now(),
      title: assignForm.title,
      batch: assignForm.batch,
      problemCount: 1,
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: assignForm.dueDate || "2026-09-15",
      submissionRate: 0,
      status: "Active",
    };

    setAssignments([newAssign, ...assignments]);
    setAssignForm({ problemId: "", batch: "All Batches", title: "", dueDate: "" });
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className={`admin-page-inner admin-users-container ${isMentor ? "mentor-practice-wrapper" : ""}`}>
      <div className={isMentor ? "ui-section-header-MN" : "ui-section-header-AD"}>
        <div className={isMentor ? "ui-section-main" : "ui-section-main-AD"}>
          <div>
            <h2 className="ui-section-title">
              <Terminal size={22} className="ui-section-title-icon" />
              <span>{isMentor ? "Mentor Coding Practice Management" : "Coding Practice Management"}</span>
            </h2>
            <p className="ui-section-desc">
              Build algorithmic question banks, configure test cases, and assign coding tasks to student cohorts.
            </p>
          </div>
          <div className="ui-section-action" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="admin-btn-ai-generate"
              onClick={() => {
                setAiPromptTopic("");
                setShowAiModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                transition: "all 0.2s ease"
              }}
            >
              <Sparkles size={16} /> Generate with AI
            </button>
            <button
              className="admin-btn-add"
              onClick={() => {
                setEditingProblemId(null);
                setNewProb(emptyProbState);
                setFormTestCase({ input: "", output: "", isHidden: false });
                setShowAddModal(true);
              }}
            >
              <Plus size={16} /> Add Coding Problem
            </button>
          </div>
        </div>
      </div>


      {/* Workspace Tabs */}
      <div className="pp-tabs-wrapper">
        <button
          className={`pp-modern-tab ${activeTab === "bank" ? "active" : ""}`}
          onClick={() => setActiveTab("bank")}
        >
          <Code size={16} />
          <span>Problem Bank</span>
          <span className="pp-tab-counter">{problems.length}</span>
        </button>
        <button
          className={`pp-modern-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          <span>Problem History</span>
          <span className="pp-tab-counter">{problems.length}</span>
        </button>
        <button
          className={`pp-modern-tab ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          <ListChecks size={16} />
          <span>Submissions &amp; Audits</span>
          <span className="pp-tab-counter">{submissions.length}</span>
        </button>
      </div>

      {/* ─── TAB 1: PROBLEM BANK ────────────────────────────────────────────── */}
      {activeTab === "bank" && (
        <>
          {/* Toolbar */}
          <div className="admin-users-toolbar">
            <div className="admin-users-search-wrap">
              <Search size={16} className="admin-users-search-icon" />
              <input
                type="text"
                className="admin-users-search-input"
                placeholder="Search by problem title, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-users-filters">
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  className={`admin-filter-pill ${difficultyFilter === diff ? "admin-filter-pill--active" : ""}`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="admin-users-table-card">
            <table className="admin-users-table pp-table">
              <thead>
                <tr>
                  <th style={{ width: "32%" }}>Problem Details</th>
                  <th style={{ width: "18%" }}>Topic</th>
                  <th className="pp-table-th-center" style={{ width: "14%" }}>Difficulty</th>
                  <th className="pp-table-th-center" style={{ width: "18%" }}>Due Date & Time</th>
                  <th className="pp-table-th-center" style={{ width: "10%" }}>XP Points</th>
                  <th className="th-actions-right pp-table-th-right" style={{ width: "8%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="user-name-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Terminal size={16} color="#4f46e5" />
                        {p.title}
                      </div>
                      <div className="user-email-sub">
                        {p.description ? (p.description.length > 40 ? p.description.slice(0, 40) + "..." : p.description) : "Practice Problem"}
                      </div>
                    </td>
                    <td><span className="user-dept-student">{p.topic}</span></td>
                    <td className="pp-table-td-center">
                      <Badge variant={p.difficulty === "Easy" ? "success" : p.difficulty === "Medium" ? "default" : "destructive"}>
                        {p.difficulty}
                      </Badge>
                    </td>
                    <td className="pp-table-td-center">
                      <span className="pp-table-date" style={{ color: p.dueDate ? "#ef4444" : "#94a3b8", fontWeight: p.dueDate ? 600 : 400 }}>
                        {p.dueDate ? new Date(p.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "No Deadline"}
                      </span>
                    </td>
                    <td className="pp-table-td-center">
                      <span className="pp-table-xp">+{p.xp || 50} XP</span>
                    </td>
                    <td className="pp-table-td-right">
                      <div className="action-btns-row action-btns-right">
                        <button
                          className="btn-table-action"
                          onClick={() => handleOpenEditProblem(p)}
                          title="Edit Problem"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn-table-action btn-table-action--delete"
                          onClick={() => handleDeleteProblem(p.id, p.title)}
                          title="Delete problem"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── TAB 2: PROBLEM HISTORY & RECENTLY ADDED PROBLEMS ─────────────────── */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Executive KPI Overview Cards */}
          <div className="pp-history-kpi-grid">
            <div className="pp-history-kpi-card">
              <div className="pp-history-kpi-icon pp-history-kpi-icon--indigo">
                <Code size={22} />
              </div>
              <div className="pp-history-kpi-info">
                <span className="pp-history-kpi-val">{problems.length}</span>
                <span className="pp-history-kpi-label">Total Problems Added</span>
                <span className="pp-history-kpi-sub">Across all cohorts</span>
              </div>
            </div>

            <div className="pp-history-kpi-card">
              <div className="pp-history-kpi-icon pp-history-kpi-icon--purple">
                <Layers size={22} />
              </div>
              <div className="pp-history-kpi-info">
                <span className="pp-history-kpi-val">
                  {problems.filter(p => p.batch && p.batch !== "All Batches").length}
                </span>
                <span className="pp-history-kpi-label">Batch-Specific Tasks</span>
                <span className="pp-history-kpi-sub">Assigned to cohorts</span>
              </div>
            </div>

            <div className="pp-history-kpi-card">
              <div className="pp-history-kpi-icon pp-history-kpi-icon--emerald">
                <Zap size={22} />
              </div>
              <div className="pp-history-kpi-info">
                <span className="pp-history-kpi-val">
                  {problems.filter(p => !p.batch || p.batch === "All Batches").length}
                </span>
                <span className="pp-history-kpi-label">Universal Problems</span>
                <span className="pp-history-kpi-sub">Open to all students</span>
              </div>
            </div>

            <div className="pp-history-kpi-card">
              <div className="pp-history-kpi-icon pp-history-kpi-icon--amber">
                <ListChecks size={22} />
              </div>
              <div className="pp-history-kpi-info">
                <span className="pp-history-kpi-val">{submissions.length}</span>
                <span className="pp-history-kpi-label">Total Submissions</span>
                <span className="pp-history-kpi-sub">Evaluated student runs</span>
              </div>
            </div>
          </div>

          {/* History Search & Filter Toolbar */}
          <div className="admin-users-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div className="admin-users-search-wrap" style={{ flex: 1, minWidth: "260px" }}>
              <Search size={16} className="admin-users-search-icon" />
              <input
                type="text"
                className="admin-users-search-input"
                placeholder="Search history by problem title, topic, or batch..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
              {historySearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setHistorySearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ minWidth: "200px" }}>
              <AdminPpSelect
                value={historyBatchFilter}
                onChange={(val) => setHistoryBatchFilter(val)}
                options={[
                  { value: "All", label: "All Batches (Filter)" },
                  { value: "All Batches", label: "Universal (All Batches)" },
                  ...batches.map((b) => ({ value: b.name, label: b.name }))
                ]}
              />
            </div>

            <div className="admin-users-filters">
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  className={`admin-filter-pill ${historyDifficultyFilter === diff ? "admin-filter-pill--active" : ""}`}
                  onClick={() => setHistoryDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pp-refresh-btn"
              onClick={fetchApiProblems}
              title="Refresh problem list"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {/* History Table */}
          {filteredHistoryProblems.length === 0 ? (
            <div className="admin-users-table-card" style={{ padding: "60px 20px", textAlign: "center" }}>
              <History size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "15px", margin: "0 0 6px 0" }}>
                {historySearch || historyBatchFilter !== "All" || historyDifficultyFilter !== "All"
                  ? "No problems match your history filters"
                  : "No problems added yet"}
              </p>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
                {historySearch || historyBatchFilter !== "All" || historyDifficultyFilter !== "All" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryBatchFilter("All");
                      setHistoryDifficultyFilter("All");
                    }}
                    style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear history filters
                  </button>
                ) : (
                  "Create a problem with 'Add Coding Problem' or 'Generate with AI' to start building your history."
                )}
              </p>
            </div>
          ) : (
            <div className="admin-users-table-card">
              <table className="admin-users-table pp-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Problem Details</th>
                    <th style={{ width: "16%" }}>Target Batch</th>
                    <th style={{ width: "12%" }}>Difficulty</th>
                    <th style={{ width: "12%" }}>Language</th>
                    <th style={{ width: "12%" }}>Test Cases</th>
                    <th style={{ width: "10%" }}>Submissions</th>
                    <th style={{ width: "18%", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryProblems.map((p) => {
                    const diffLower = (p.difficulty || "medium").toLowerCase();
                    const probSubmissions = submissions.filter(
                      (s) => s.problemId === p.id || s.problemTitle === p.title
                    );
                    const isUniversal = !p.batch || p.batch === "All Batches";

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                background: isUniversal ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "2px"
                              }}
                            >
                              <Code size={16} />
                            </div>
                            <div>
                              <div className="user-name-title" style={{ fontSize: "14px", fontWeight: 700 }}>
                                {p.title}
                              </div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "4px" }}>
                                <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: "#475569" }}>
                                  {p.topic || "General DSA"}
                                </span>
                                <span style={{ background: "rgba(99, 102, 241, 0.08)", color: "#4f46e5", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                                  +{p.xp} XP
                                </span>
                                {p.dueDate && (
                                  <span style={{ fontSize: "11px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <Clock size={11} /> Due: {p.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: isUniversal ? "rgba(99, 102, 241, 0.08)" : "rgba(139, 92, 246, 0.12)",
                              color: isUniversal ? "#4f46e5" : "#6d28d9",
                              border: `1px solid ${isUniversal ? "rgba(99, 102, 241, 0.2)" : "rgba(139, 92, 246, 0.25)"}`
                            }}
                          >
                            <Layers size={12} />
                            {p.batch || "All Batches"}
                          </span>
                        </td>

                        <td>
                          <span className={`diff-badge diff-badge--${diffLower}`}>
                            {p.difficulty}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                            {p.language || "All"}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                              {p.testCases.length} Tests
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {p.testCases.filter(t => t.isHidden).length} hidden
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: probSubmissions.length > 0 ? "#ecfdf5" : "#f1f5f9",
                                color: probSubmissions.length > 0 ? "#047857" : "#64748b"
                              }}
                            >
                              {probSubmissions.length}
                            </span>
                            {probSubmissions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab("submissions");
                                  setSubmissionSearch(p.title);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#4f46e5",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  textDecoration: "underline"
                                }}
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditProblem(p)}
                              className="admin-action-btn admin-action-btn--secondary"
                              title="Edit Problem & Assigned Batch"
                              style={{ padding: "5px 9px", fontSize: "12px" }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProblem(p);
                                setShowTestCaseModal(true);
                              }}
                              className="admin-action-btn admin-action-btn--secondary"
                              title="Inspect Test Cases"
                              style={{ padding: "5px 9px", fontSize: "12px" }}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProblem(p.id)}
                              className="admin-action-btn admin-action-btn--danger"
                              title="Delete Problem"
                              style={{ padding: "5px 9px", fontSize: "12px" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: SUBMISSIONS & AUDITS ─────────────────────────────────────── */}
      {activeTab === "submissions" && (() => {
        const totalSubmissionsCount = submissions.length;
        const acceptedCount = submissions.filter(s => String(s.status || "").toLowerCase() === "accepted").length;
        const wrongCount = submissions.filter(s => String(s.status || "").toLowerCase().includes("wrong")).length;
        const otherErrorCount = submissions.filter(s => {
          const st = String(s.status || "").toLowerCase();
          return st.includes("time") || st.includes("tle") || st.includes("runtime") || st.includes("error") || st.includes("compil");
        }).length;
        const acceptedRate = totalSubmissionsCount > 0 ? Math.round((acceptedCount / totalSubmissionsCount) * 100) : 0;

        const validTimes = submissions.map(s => {
          const m = String(s.executionTime || "").match(/[\d.]+/);
          return m ? parseFloat(m[0]) : null;
        }).filter(t => t !== null && !isNaN(t));
        const avgTime = validTimes.length > 0 ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(2) + "s" : "0.00s";

        return (
          <div className="admin-submissions-wrap page-fade-in">
            {/* Executive KPI Metric Banner */}
            <div className="pp-kpi-grid">
              <div className="pp-kpi-card">
                <div className="pp-kpi-icon-wrap pp-kpi-icon--indigo">
                  <FileCode2 size={22} />
                </div>
                <div className="pp-kpi-info">
                  <div className="pp-kpi-value">{totalSubmissionsCount}</div>
                  <div className="pp-kpi-label">Total Submissions</div>
                </div>
              </div>

              <div className="pp-kpi-card">
                <div className="pp-kpi-icon-wrap pp-kpi-icon--emerald">
                  <CheckCircle2 size={22} />
                </div>
                <div className="pp-kpi-info">
                  <div className="pp-kpi-value" style={{ color: "#059669" }}>{acceptedRate}%</div>
                  <div className="pp-kpi-label">Accepted Rate ({acceptedCount})</div>
                </div>
              </div>

              <div className="pp-kpi-card">
                <div className="pp-kpi-icon-wrap pp-kpi-icon--rose">
                  <XCircle size={22} />
                </div>
                <div className="pp-kpi-info">
                  <div className="pp-kpi-value" style={{ color: "#e11d48" }}>{wrongCount}</div>
                  <div className="pp-kpi-label">Wrong Answer</div>
                </div>
              </div>

              <div className="pp-kpi-card">
                <div className="pp-kpi-icon-wrap pp-kpi-icon--violet">
                  <Clock size={22} />
                </div>
                <div className="pp-kpi-info">
                  <div className="pp-kpi-value" style={{ color: "#7c3aed" }}>{avgTime}</div>
                  <div className="pp-kpi-label">Avg Execution Time</div>
                </div>
              </div>
            </div>

            {/* Submissions Filter Toolbar */}
            <div className="pp-submissions-toolbar">
              <div className="pp-search-box">
                <Search size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
                <input
                  type="text"
                  className="pp-search-input"
                  placeholder="Search by student name, roll number, problem..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                />
                {submissionSearch && (
                  <button
                    type="button"
                    onClick={() => setSubmissionSearch("")}
                    className="admin-search-clear-btn"
                    title="Clear Search"
                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#94a3b8" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Pills Row */}
              <div className="pp-filter-pills-row">
                {[
                  { id: "All", label: "All Statuses", count: totalSubmissionsCount },
                  { id: "Accepted", label: "Accepted", count: acceptedCount },
                  { id: "Wrong Answer", label: "Wrong Answer", count: wrongCount },
                  { id: "Time Limit Exceeded", label: "TLE", count: otherErrorCount },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`pp-filter-pill-btn ${submissionStatusFilter === st.id ? "active" : ""}`}
                    onClick={() => setSubmissionStatusFilter(st.id)}
                  >
                    <span>{st.label}</span>
                    <span className="pp-filter-count">{st.count}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={fetchSubmissions}
                  className="pp-refresh-btn"
                  title="Refresh Submissions"
                >
                  <RefreshCw size={14} className={loadingSubmissions ? "spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Submissions Table Card */}
            <div className="pp-table-card">
              {loadingSubmissions ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                  <RefreshCw size={26} className="spin" style={{ color: "#4f46e5", marginBottom: "12px" }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Loading coding submissions from database...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#f1f5f9", color: "#64748b", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <ListChecks size={28} />
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>No coding submissions found</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "440px", marginInline: "auto" }}>
                    {submissionSearch || submissionStatusFilter !== "All"
                      ? "No submissions matched your search criteria. Try clearing the search or status filter."
                      : "Student submissions will appear here dynamically as students solve and submit practice coding problems."}
                  </p>
                </div>
              ) : (
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Student</th>
                      <th style={{ width: "20%" }}>Problem</th>
                      <th style={{ width: "11%" }}>Language</th>
                      <th style={{ width: "15%" }}>Test Cases / Score</th>
                      <th style={{ width: "11%" }}>Execution Time</th>
                      <th style={{ width: "12%" }}>Status</th>
                      <th style={{ width: "13%" }}>Time</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Code Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((s, idx) => {
                      const langInfo = getLanguageBadgeInfo(s.language);
                      const stInfo = getStatusBadgeInfo(s.status);
                      const passed = Number(s.passedTestCases) || 0;
                      const total = Number(s.totalTestCases) || Math.max(passed, 1);
                      const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
                      const diffClass = String(s.problemDifficulty || "easy").toLowerCase();

                      return (
                        <tr key={s.id || idx}>
                          <td>
                            <div className="pp-student-cell">
                              <div className="pp-avatar" style={{ background: getAvatarBg(s.studentId || s.id, idx) }}>
                                {getStudentInitials(s.studentName)}
                              </div>
                              <div className="pp-student-info">
                                <div className="pp-student-name">{s.studentName || "Student"}</div>
                                <div className="pp-student-meta">
                                  <span>{s.rollNo || "No Roll"}</span>
                                  {s.department && <span className="pp-dept-pill">{s.department}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="pp-problem-title">{s.problemTitle}</div>
                            <div className="pp-problem-meta">
                              <span>Problem #{s.problemId}</span>
                              <span>•</span>
                              <span className={`pp-diff-pill pp-diff--${diffClass}`}>
                                {s.problemDifficulty || "Medium"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className="pp-tech-pill"
                              style={{
                                background: langInfo.bg,
                                color: langInfo.color,
                                border: `1px solid ${langInfo.border}`
                              }}
                            >
                              {langInfo.label}
                            </span>
                          </td>

                          <td>
                            <div className="pp-testcase-wrap">
                              <div className="pp-testcase-header">
                                <span className="pp-testcase-ratio">{passed}/{total} Passed</span>
                                <span className={`pp-xp-badge ${s.score > 0 ? "pp-xp-badge--active" : "pp-xp-badge--zero"}`}>
                                  {s.score > 0 ? `+${s.score} XP` : "0 XP"}
                                </span>
                              </div>
                              <div className="pp-meter-track">
                                <div
                                  className="pp-meter-fill"
                                  style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    background: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#f43f5e"
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="pp-time-chip">
                              <Clock size={12} style={{ color: "#6366f1" }} />
                              <span>{s.executionTime || "0.00s"}</span>
                            </div>
                          </td>

                          <td>
                            <span
                              className="pp-status-chip"
                              style={{
                                background: stInfo.bg,
                                color: stInfo.color,
                                border: `1px solid ${stInfo.border}`
                              }}
                            >
                              {stInfo.icon}
                              <span>{stInfo.label}</span>
                            </span>
                          </td>

                          <td>
                            <span className="pp-date-text">{s.submittedAt || "Recent"}</span>
                            {s.feedback && (
                              <div className="pp-feedback-indicator">
                                <MessageSquare size={11} />
                                <span>Reviewed</span>
                              </div>
                            )}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenSubmission(s)}
                              className="pp-btn-review"
                              title="Inspect submitted code and review"
                            >
                              <FileCode size={14} />
                              <span>View Code</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* ─── VIEW SUBMITTED CODE MODAL ─────────────────────────────────────── */}
      {viewingSubmission && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingSubmission(null); }}>
          <div className="modal-dialog" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <FileCode size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{viewingSubmission.studentName} — {viewingSubmission.problemTitle}</h2>
                  <p className="modal-subtitle">
                    Submitted on {viewingSubmission.submittedAt} • Language: <strong style={{ textTransform: "uppercase" }}>{viewingSubmission.language}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingSubmission(null)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px" }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`status-badge ${viewingSubmission.status === "Accepted" ? "status-badge--active" : "role-badge--admin"}`}>
                    {viewingSubmission.status}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    Test Cases: {viewingSubmission.passedTestCases} / {viewingSubmission.totalTestCases} Passed
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                  <span>Execution: <strong>{viewingSubmission.executionTime}</strong></span>
                  <span>•</span>
                  <span>Memory: <strong>{viewingSubmission.memory}</strong></span>
                  <span>•</span>
                  <span>Score: <strong style={{ color: "#10b981" }}>+{viewingSubmission.score} XP</strong></span>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", color: "#94a3b8", padding: "8px 14px", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                  <span>Submitted Code ({viewingSubmission.language})</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(viewingSubmission.submittedCode || "");
                      alert("Code copied to clipboard!");
                    }}
                    style={{ background: "transparent", border: "1px solid #475569", color: "#cbd5e1", borderRadius: "4px", padding: "3px 10px", cursor: "pointer", fontSize: "11px" }}
                  >
                    Copy Code
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: "16px",
                  background: "#0f172a",
                  color: "#f8fafc",
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  borderBottomLeftRadius: "8px",
                  borderBottomRightRadius: "8px",
                  overflowX: "auto",
                  maxHeight: "380px"
                }}>
                  <code>{viewingSubmission.submittedCode || "// No code available"}</code>
                </pre>
              </div>

              {/* Optional Mentor / Admin Code Review Feedback Section */}
              <div style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                      Instructor &amp; Mentor Code Review Feedback
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#64748b",
                      background: "#e2e8f0",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      Optional
                    </span>
                  </div>
                  {viewingSubmission.feedbackBy && (
                    <span style={{ fontSize: "11.5px", color: "#6366f1", fontWeight: 600 }}>
                      Last reviewed by {viewingSubmission.feedbackBy} {viewingSubmission.feedbackAt ? `(${viewingSubmission.feedbackAt})` : ""}
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#64748b" }}>
                  Provide optional comments, code quality feedback, edge-case guidance, or optimization tips for the student.
                </p>

                {feedbackSuccessMsg && (
                  <div style={{
                    marginBottom: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <CheckCircle2 size={16} />
                    <span>{feedbackSuccessMsg}</span>
                  </div>
                )}

                {/* Quick feedback chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {[
                    "Clean solution & optimal time complexity!",
                    "Check edge cases with empty or 1-element input.",
                    "Optimize space complexity: aim for O(1) auxiliary memory.",
                    "Watch out for potential integer overflow or index out of bounds.",
                    "Good attempt! Consider reviewing time limit constraints."
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="pp-quick-chip"
                      onClick={() => setSubmissionFeedback(prev => prev ? `${prev.trim()} ${chip}` : chip)}
                      title="Click to insert into feedback"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  value={submissionFeedback}
                  onChange={(e) => setSubmissionFeedback(e.target.value)}
                  placeholder="e.g. Clean solution! Consider edge cases with duplicate array values and optimizing space from O(N) to O(1) in-place..."
                  rows={3}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    color: "#1e293b",
                    resize: "vertical",
                    outline: "none"
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {viewingSubmission.feedback ? "Feedback currently saved for this student" : "Feedback will be visible on the student's dashboard"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveFeedback(viewingSubmission.id)}
                    disabled={savingFeedback}
                    className="admin-action-btn admin-action-btn--primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 18px",
                      background: savingFeedback ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: savingFeedback ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 5px rgba(79, 70, 229, 0.25)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { if (!savingFeedback) e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                  >
                    {savingFeedback ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                    <span>{savingFeedback ? "Saving..." : (viewingSubmission.feedback ? "Update Feedback" : "Save Feedback (Optional)")}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc"
            }}>
              <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                <span>Language: <strong style={{ color: "#334155" }}>{viewingSubmission.language}</strong> • Score: <strong style={{ color: "#10b981" }}>+{viewingSubmission.score} XP</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--secondary"
                  onClick={() => setViewingSubmission(null)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    background: "#ffffff",
                    color: "#475569",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#94a3b8";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveFeedback(viewingSubmission.id)}
                  disabled={savingFeedback}
                  className="admin-action-btn admin-action-btn--primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 20px",
                    background: savingFeedback ? "#94a3b8" : "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: savingFeedback ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!savingFeedback) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!savingFeedback) {
                      e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)";
                      e.currentTarget.style.transform = "none";
                    }
                  }}
                >
                  {savingFeedback ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                  <span>{savingFeedback ? "Saving..." : (viewingSubmission.feedback ? "Update Feedback" : "Save Feedback")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── ADD PROBLEM MODAL (WITH UNIFIED TEST CASES BUILDER) ──────────────── */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "780px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Code size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{editingProblemId ? "Edit Coding Problem" : "Create New Coding Problem"}</h2>
                  <p className="modal-subtitle">{editingProblemId ? "Update problem details, difficulty, constraints, and test cases." : "Add problem statement, sample test cases, and evaluation test cases in one place."}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProblem}>
              <div className="modal-body add-prob-modal-body">

                {/* AI AUTO-FILL BANNER */}
                <div style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px dashed #818cf8",
                  marginBottom: "20px"
                }}>
                  <Sparkles size={18} color="#6366f1" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#4f46e5" }}>AI Quick-Fill:</span>
                    <input
                      type="text"
                      placeholder="e.g. Graph BFS Shortest Path, Sliding Window, DP..."
                      value={aiPromptTopic}
                      onChange={(e) => setAiPromptTopic(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: "180px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#fff"
                      }}
                      disabled={isGeneratingAI}
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAI}
                      onClick={() => handleGenerateProblemAI(aiPromptTopic, newProb.difficulty)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: isGeneratingAI ? "not-allowed" : "pointer"
                      }}
                    >
                      <Sparkles size={13} /> {isGeneratingAI ? "Generating..." : "Generate & Fill"}
                    </button>
                  </div>
                </div>
                
                {/* SECTION 1: PROBLEM DETAILS */}
                <div className="add-prob-section">
                  <h4 className="add-prob-section-title">
                    <FileCode size={16} color="#6366f1" /> Problem Details & Metadata
                  </h4>
                  
                  <div className="form-group-admin add-prob-form-group">
                    <label>Problem Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Two Sum Target Index Pair"
                      value={newProb.title}
                      onChange={(e) => setNewProb({ ...newProb, title: e.target.value })}
                      className="form-input-admin"
                      autoFocus
                    />
                  </div>

                  <div className="add-prob-grid-3" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr", gap: "12px", marginBottom: "12px" }}>
                    <div className="form-group-admin">
                      <label>Topic / Category</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Arrays & Hashing"
                        value={newProb.topic}
                        onChange={(e) => setNewProb({ ...newProb, topic: e.target.value })}
                        className="form-input-admin"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Difficulty</label>
                      <AdminPpSelect
                        value={newProb.difficulty}
                        onChange={(val) => setNewProb({ ...newProb, difficulty: val })}
                        options={[
                          { value: "Easy", label: "Easy" },
                          { value: "Medium", label: "Medium" },
                          { value: "Hard", label: "Hard" }
                        ]}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Target Batch *</label>
                      <AdminPpSelect
                        value={newProb.batch || "All Batches"}
                        onChange={(val) => {
                          const bObj = batches.find(b => b.name === val);
                          setNewProb({ ...newProb, batch: val, batchId: bObj ? bObj.id : null });
                        }}
                        options={[
                          { value: "All Batches", label: "All Batches (Universal)" },
                          ...batches.map(b => ({ value: b.name, label: b.name }))
                        ]}
                      />
                    </div>
                  </div>

                  <div className="add-prob-grid-3" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div className="form-group-admin">
                      <label>Allowed Language</label>
                      <AdminPpSelect
                        value={newProb.language || "All"}
                        onChange={(val) => setNewProb({ ...newProb, language: val })}
                        options={[
                          { value: "All", label: "All Languages (Student's Choice)" },
                          { value: "Python", label: "Python (Python 3)" },
                          { value: "Java", label: "Java (Java 17)" },
                          { value: "C++", label: "C++ (C++ 20)" },
                          { value: "C", label: "C (C11)" },
                          { value: "JavaScript", label: "JavaScript (Node.js)" },
                          { value: "SQL", label: "SQL (SQLite3)" }
                        ]}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Due Date & Time</label>
                      <input
                        type="datetime-local"
                        value={newProb.dueDate}
                        onChange={(e) => setNewProb({ ...newProb, dueDate: e.target.value })}
                        className="form-input-admin"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>XP Reward Points</label>
                      <input
                        required
                        type="number"
                        placeholder="50"
                        value={newProb.xp}
                        onChange={(e) => setNewProb({ ...newProb, xp: e.target.value })}
                        className="form-input-admin"
                      />
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label>Problem Description</label>
                    <textarea
                      rows={3}
                      placeholder="Explain problem statement, constraints, and instructions..."
                      value={newProb.description}
                      onChange={(e) => setNewProb({ ...newProb, description: e.target.value })}
                      className="form-input-admin add-prob-textarea"
                    />
                  </div>
                </div>

                {/* SECTION 2: SAMPLE I/O */}
                <div className="add-prob-sample-box">
                  <h4 className="add-prob-sample-title">
                    📌 Sample Input & Output (For Display)
                  </h4>
                  <div className="add-prob-grid-2">
                    <div className="form-group-admin">
                      <label style={{ fontSize: "12px" }}>Sample Input</label>
                      <textarea
                        rows={2}
                        placeholder="[2, 7, 11, 15], target = 9"
                        value={newProb.sampleInput}
                        onChange={(e) => setNewProb({ ...newProb, sampleInput: e.target.value })}
                        className="form-input-admin add-prob-code-textarea"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label style={{ fontSize: "12px" }}>Sample Output</label>
                      <textarea
                        rows={2}
                        placeholder="[0, 1]"
                        value={newProb.sampleOutput}
                        onChange={(e) => setNewProb({ ...newProb, sampleOutput: e.target.value })}
                        className="form-input-admin add-prob-code-textarea"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: TEST CASES BUILDER */}
                <div className="tc-builder-box">
                  <div className="tc-builder-header">
                    <div>
                      <h4 className="tc-builder-title">
                        <ListChecks size={18} color="#4f46e5" /> Test Cases Builder
                      </h4>
                      <p className="tc-builder-subtitle">
                        Add test cases below. These will be stored directly in MySQL and evaluated during submissions.
                      </p>
                    </div>
                    <span className="tc-builder-count-badge">
                      {newProb.testCases.length} Configured
                    </span>
                  </div>

                  {/* Add Test Case Inputs */}
                  <div className="tc-builder-input-card">
                    <div className="tc-builder-input-grid">
                      <div>
                        <label className="tc-builder-input-label">Input Data</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. 5 10 15"
                          value={formTestCase.input}
                          onChange={(e) => setFormTestCase({ ...formTestCase, input: e.target.value })}
                          className="form-input-admin add-prob-code-textarea"
                        />
                      </div>
                      <div>
                        <label className="tc-builder-input-label">Expected Output</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. 30"
                          value={formTestCase.output}
                          onChange={(e) => setFormTestCase({ ...formTestCase, output: e.target.value })}
                          className="form-input-admin add-prob-code-textarea"
                        />
                      </div>
                    </div>

                    <div className="tc-builder-controls">
                      <label className="tc-builder-hidden-check">
                        <input
                          type="checkbox"
                          checked={formTestCase.isHidden}
                          onChange={(e) => setFormTestCase({ ...formTestCase, isHidden: e.target.checked })}
                          className="tc-builder-hidden-checkbox"
                        />
                        <span>Hidden Test Case (Used for evaluation score)</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddTestCaseToForm}
                        disabled={!formTestCase.input.trim() && !formTestCase.output.trim()}
                        className={`tc-builder-add-btn ${formTestCase.input.trim() || formTestCase.output.trim() ? "tc-builder-add-btn--active" : "tc-builder-add-btn--disabled"}`}
                      >
                        <Plus size={14} /> Add Test Case
                      </button>
                    </div>
                  </div>

                  {/* List of Test Cases Added */}
                  {newProb.testCases.length > 0 ? (
                    <div className="tc-builder-list">
                      {newProb.testCases.map((tc, idx) => (
                        <div key={tc.id || idx} className="tc-builder-item">
                          <div className="tc-builder-item-info">
                            <span className={`tc-builder-type-badge ${tc.isHidden ? "tc-builder-type-badge--hidden" : "tc-builder-type-badge--sample"}`}>
                              {tc.isHidden ? "Hidden" : "Sample"} #{idx + 1}
                            </span>
                            <div className="tc-builder-item-data">
                              <strong>In:</strong> {tc.input || "—"} &nbsp;|&nbsp; <strong>Out:</strong> {tc.output || tc.expectedOutput || "—"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTestCaseFromForm(tc.id)}
                            className="tc-builder-remove-btn"
                            title="Remove Test Case"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="tc-builder-empty-msg">
                      No test cases added yet. Use the form above to add test cases before saving!
                    </p>
                  )}
                </div>

              </div>

              <div className="modal-footer add-prob-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingProblemId ? "Update Problem" : "Save Problem & Test Cases"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── DEDICATED AI PROBLEM GENERATOR MODAL ────────────────────────────── */}
      {showAiModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap" style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "#fff" }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="modal-title">AI Coding Problem Generator</h2>
                  <p className="modal-subtitle">Generate complete algorithmic problems with test cases using Groq & Gemini AI.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAiModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "24px" }}>
              <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Algorithm / Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming (0/1 Knapsack), Trie, Linked List Cycle"
                  value={aiPromptTopic}
                  onChange={(e) => setAiPromptTopic(e.target.value)}
                  className="form-input-admin"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div className="form-group-admin">
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                    Difficulty Level
                  </label>
                  <AdminPpSelect
                    value={aiDifficulty}
                    onChange={(val) => setAiDifficulty(val)}
                    options={[
                      { value: "Easy", label: "🟢 Easy (50 XP)" },
                      { value: "Medium", label: "🟡 Medium (100 XP)" },
                      { value: "Hard", label: "🔴 Hard (150 XP)" },
                    ]}
                  />
                </div>

                <div className="form-group-admin">
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                    Allowed Language
                  </label>
                  <AdminPpSelect
                    value={aiLanguage}
                    onChange={(val) => setAiLanguage(val)}
                    options={[
                      { value: "All", label: "All Languages (Student's Choice)" },
                      { value: "Python", label: "Python (Python 3)" },
                      { value: "Java", label: "Java (Java 17)" },
                      { value: "C++", label: "C++ (C++ 20)" },
                      { value: "C", label: "C (C11)" },
                      { value: "JavaScript", label: "JavaScript (Node.js)" },
                      { value: "SQL", label: "SQL (SQLite3)" }
                    ]}
                  />
                </div>
              </div>

              <div className="form-group-admin" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  Target Batch / Cohort
                </label>
                <AdminPpSelect
                  value={aiBatch}
                  onChange={(val) => setAiBatch(val)}
                  options={[
                    { value: "All Batches", label: "All Batches (Universal)" },
                    ...batches.map((b) => ({ value: b.name, label: b.name }))
                  ]}
                />
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>
                💡 The AI will generate a complete problem specification, problem description, constraints, sample input/output, and 4 test cases (including hidden edge cases). You will be able to review and edit before saving to the database.
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowAiModal(false)}
                disabled={isGeneratingAI}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={() => handleGenerateProblemAI(aiPromptTopic, aiDifficulty, aiLanguage)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: isGeneratingAI ? "not-allowed" : "pointer"
                }}
              >
                <Sparkles size={16} />
                {isGeneratingAI ? "Generating Problem with AI..." : "Generate Problem"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── TEST CASES MODAL ───────────────────────────────────────────────── */}
      {showTestCaseModal && selectedProblem && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTestCaseModal(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "680px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--blue">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h2 className="modal-title">
                    <span>Edit Test Cases:</span>
                    <span style={{ color: "#2563eb" }}>{selectedProblem.title}</span>
                  </h2>
                  <p className="modal-subtitle">Configure public example test cases and hidden evaluation suites.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTestCaseModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* TOP: Add New Test Case Container */}
              <form onSubmit={handleAddTestCase} className="tc-add-container">
                <div className="tc-add-header">
                  <h4 className="tc-add-heading">
                    <Plus size={16} color="#2563eb" />
                    <span>Add New Test Case</span>
                  </h4>
                  <span className="tc-add-hint">Auto-evaluated against student code</span>
                </div>

                <div className="tc-grid-2">
                  <div className="form-group-admin">
                    <label>Input (Stdin / Arguments) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. nums = [2,7,11,15], target = 9"
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                      className="form-input-admin tc-code-input"
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Expected Output *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. [0,1]"
                      value={newTestCase.output}
                      onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                      className="form-input-admin tc-code-input"
                    />
                  </div>
                </div>

                <div className="tc-form-footer">
                  <label className="tc-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={newTestCase.isHidden}
                      onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                    />
                    <span>Mark as Hidden Test Case (Used for evaluation grade)</span>
                  </label>

                  <button type="submit" className="tc-add-btn">
                    <Plus size={15} />
                    <span>Add Test Case</span>
                  </button>
                </div>
              </form>

              {/* BOTTOM: Configured Test Cases List */}
              <div className="tc-list-section">
                <div className="tc-section-header">
                  <div className="tc-section-title-wrap">
                    <span className="tc-section-title">Configured Test Cases</span>
                    <span className="tc-count-badge">{(selectedProblem.testCases || []).length}</span>
                  </div>
                  {(selectedProblem.testCases || []).length > 0 && (
                    <span className="tc-section-subtext">Students see public cases; hidden cases are for grading</span>
                  )}
                </div>

                <div className="tc-list-wrap">
                  {(selectedProblem.testCases || []).length === 0 ? (
                    <div className="tc-empty-state">
                      <div className="tc-empty-icon">
                        <FileCode2 size={22} />
                      </div>
                      <div className="tc-empty-title">No test cases configured yet</div>
                      <p className="tc-empty-desc">
                        Use the form above to add your first public example or hidden evaluation case.
                      </p>
                    </div>
                  ) : (
                    (selectedProblem.testCases || []).map((tc, idx) => (
                      <div key={tc.id || idx} className="tc-card">
                        <div className="tc-card-header">
                          <div className="tc-card-title-group">
                            <span className="tc-card-num">Test Case #{idx + 1}</span>
                            <span className={tc.isHidden ? "tc-badge--hidden" : "tc-badge--public"}>
                              {tc.isHidden ? "Hidden Evaluation" : "Public Example"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCaseInModal(tc.id ?? idx)}
                            className="tc-card-delete-btn"
                            title="Remove Test Case"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="tc-grid-2">
                          <div className="tc-code-preview">
                            <span className="tc-code-preview-lbl">Input (Stdin / Args)</span>
                            <pre className="tc-code-preview-code">{tc.input || "—"}</pre>
                          </div>
                          <div className="tc-code-preview">
                            <span className="tc-code-preview-lbl">Expected Output</span>
                            <pre className="tc-code-preview-code">{tc.output || tc.expectedOutput || "—"}</pre>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                {(selectedProblem.testCases || []).length} Test Cases configured
              </span>
              <button type="button" className="btn-modal-cancel" onClick={() => setShowTestCaseModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
