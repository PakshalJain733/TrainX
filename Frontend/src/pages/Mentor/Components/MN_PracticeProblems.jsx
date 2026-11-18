import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Code,
  Plus,
  Edit,
  Trash2,
  ListChecks,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  FileCode,
  FileCode2,
  Layers,
  Terminal,
  Sparkles,
  AlertCircle,
  Zap,
  RefreshCw,
  MessageSquare,
  History,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/MN_PracticeProblems.css";

const BASE_ENDPOINT = "/mentor/practice-problems";
const BATCHES_ENDPOINT = "/mentor/batches";

/* ── Dropdown for Mentor Practice Problems (Uses CustomSelect) ── */
function MentorPpSelect(props) {
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
      label: "Accepted",
    };
  }
  if (s.includes("wrong")) {
    return {
      bg: "#fef2f2",
      color: "#991b1b",
      border: "#fecaca",
      icon: <XCircle size={13} />,
      label: "Wrong Answer",
    };
  }
  if (s.includes("time") || s.includes("tle")) {
    return {
      bg: "#faf5ff",
      color: "#6b21a8",
      border: "#e9d5ff",
      icon: <Clock size={13} />,
      label: "Time Limit Exceeded",
    };
  }
  return {
    bg: "#fff7ed",
    color: "#9a3412",
    border: "#ffedd5",
    icon: <AlertCircle size={13} />,
    label: status || "Runtime Error",
  };
};

const extractBatchId = (batchObj) => {
  if (!batchObj) return null;
  return (
    batchObj.batchId ||
    parseInt(String(batchObj.id).replace(/^b-/i, ""), 10) ||
    batchObj.id
  );
};

export default function MentorPracticeProblems() {
  const [activeTab, setActiveTab] = useState("bank");

  // API + Local State
  const [problems, setProblems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("All");
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [submissionFeedback, setSubmissionFeedback] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState("");

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
      const res = await apiFetch(`${BASE_ENDPOINT}/submissions/${submissionId}/feedback`, {
        method: "PATCH",
        body: JSON.stringify({ feedback: submissionFeedback }),
      });
      if (res && res.data) {
        setViewingSubmission((prev) => ({
          ...prev,
          feedback: res.data.feedback,
          feedbackBy: res.data.feedbackBy,
          feedbackAt: res.data.feedbackAt,
        }));
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  feedback: res.data.feedback,
                  feedbackBy: res.data.feedbackBy,
                  feedbackAt: res.data.feedbackAt,
                }
              : s
          )
        );
        setFeedbackSuccessMsg("Feedback saved successfully!");
        setTimeout(() => setFeedbackSuccessMsg(""), 3500);
      }
    } catch (err) {
      alert("Failed to save feedback: " + (err.message || "Unknown error"));
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleGenerateProblemAI = async (topicToUse, diffToUse, langToUse, batchToUse) => {
    const topic = (topicToUse || aiPromptTopic || "").trim() || "Arrays & Hashing";
    const difficulty = diffToUse || aiDifficulty || "Medium";
    const assignedLang = langToUse || aiLanguage || "All";
    const assignedBatch = batchToUse || aiBatch || "All Batches";
    const matchedBatchObj = batches.find((b) => b.name === assignedBatch);
    setIsGeneratingAI(true);
    try {
      const res = await apiFetch(`${BASE_ENDPOINT}/generate-ai`, {
        method: "POST",
        body: JSON.stringify({ topic, difficulty }),
      });
      if (res && res.data) {
        const d = res.data;
        setNewProb({
          title: d.title || "",
          batch: assignedBatch,
          batchId: matchedBatchObj ? extractBatchId(matchedBatchObj) : null,
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
          expected_output: formTestCase.output,
          isHidden: Boolean(formTestCase.isHidden),
          is_hidden: Boolean(formTestCase.isHidden),
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
      const apiRes = await apiFetch(BASE_ENDPOINT);
      const rawList =
        apiRes && Array.isArray(apiRes.data)
          ? apiRes.data
          : Array.isArray(apiRes)
            ? apiRes
            : [];
      const mapped = rawList
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const title = (p.title || "").trim();
          const normTopic = p.category || p.topic || "General DSA";
          const normDiff = p.difficulty || "Medium";
          const normXp = Number(p.points || p.xp || 50);

          let normCompanies = ["Core DSA"];
          const rawTags = p.tags || p.companies;
          if (Array.isArray(rawTags) && rawTags.length > 0) {
            normCompanies = rawTags.map((t) => String(t).trim()).filter(Boolean);
          } else if (typeof rawTags === "string" && rawTags.trim()) {
            normCompanies = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
          }

          const normTestCases = Array.isArray(p.testCases)
            ? p.testCases.map((tc, idx) => ({
                id: tc?.id || idx + 1,
                input: tc?.input || "",
                output: tc?.expected_output || tc?.output || "",
                expectedOutput: tc?.expected_output || tc?.output || "",
                isHidden: Boolean(tc?.is_hidden || tc?.isHidden),
              }))
            : [];

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
            description:
              p.description || "Solve the algorithmic coding challenge according to problem constraints.",
            testCases: normTestCases,
            createdAt: p.created_at || p.createdAt || null,
          };
        })
        .filter(Boolean)
        .filter((p) => p.title);

      setProblems(mapped);
    } catch (err) {
      console.error("Failed to load practice problems from DB:", err);
      setProblems([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch(BATCHES_ENDPOINT);
      const rawList = Array.isArray(res?.data?.batches)
        ? res.data.batches
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.batches)
            ? res.batches
            : Array.isArray(res)
              ? res
              : [];
      if (Array.isArray(rawList)) {
        setBatches(rawList);
        const firstBatch = rawList[0];
        const defaultBatchName = firstBatch ? firstBatch.name : "";
        const defaultBatchId = extractBatchId(firstBatch);
        setNewProb((prev) => {
          if (!prev.batch || prev.batch === "All Batches") {
            return { ...prev, batch: defaultBatchName, batchId: defaultBatchId };
          }
          return prev;
        });
        setAiBatch((prev) => (!prev || prev === "All Batches" ? defaultBatchName : prev));
      }
    } catch (err) {
      console.error("Failed to load mentor batches:", err);
      setBatches([]);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await apiFetch(`${BASE_ENDPOINT}/submissions`);
      const list = res && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setSubmissions(list);
    } catch (err) {
      console.warn(`Failed to load ${BASE_ENDPOINT}/submissions, trying fallback:`, err);
      try {
        const alt = await apiFetch("/coding-submissions");
        const list = alt && Array.isArray(alt.data) ? alt.data : Array.isArray(alt) ? alt : [];
        setSubmissions(list);
      } catch {
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
    const matchedBatch = batches.find((b) => b.name === assignedBatch);
    const rawTestCases = Array.isArray(p.testCases) ? p.testCases : [];
    setNewProb({
      title: p.title || "",
      batch: assignedBatch,
      batchId: p.batchId || p.batch_id || extractBatchId(matchedBatch),
      topic: p.topic || "",
      difficulty: p.difficulty || "Easy",
      language: p.language || "All",
      xp: p.xp || 50,
      companies: Array.isArray(p.companies) ? p.companies.join(", ") : p.companies || "",
      timeLimit: p.timeLimit || "1.0s",
      memoryLimit: p.memoryLimit || "128 MB",
      description: p.description || "",
      dueDate: p.dueDate || "",
      sampleInput: "",
      sampleOutput: "",
      testCases: rawTestCases.map((tc, idx) => ({
        id: tc.id || `tc-${idx}-${Date.now()}`,
        input: tc.input || "",
        output: tc.output || tc.expectedOutput || tc.expected_output || "",
        expectedOutput: tc.expectedOutput || tc.output || tc.expected_output || "",
        expected_output: tc.expected_output || tc.output || tc.expectedOutput || "",
        isHidden: Boolean(tc.isHidden ?? tc.is_hidden),
        is_hidden: Boolean(tc.isHidden ?? tc.is_hidden),
      })),
    });
    setFormTestCase({ input: "", output: "", isHidden: false });
    setShowAddModal(true);
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!newProb.title.trim()) return;

    if (batches.length === 0) {
      alert("Cannot create problem: No batches assigned to you.");
      return;
    }

    const chosenBatchName =
      batches.length > 0 && (!newProb.batch || newProb.batch === "All Batches")
        ? batches[0].name
        : newProb.batch || "";
    const matchedBatch = batches.find((b) => b.name === chosenBatchName);
    const chosenBatchId = newProb.batchId || extractBatchId(matchedBatch);

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
      sampleInput: "",
      sampleOutput: "",
      testCases: (newProb.testCases || []).map((tc) => ({
        input: tc.input || "",
        expected_output: tc.expectedOutput || tc.output || tc.expected_output || "",
        expectedOutput: tc.expectedOutput || tc.output || tc.expected_output || "",
        output: tc.output || tc.expectedOutput || tc.expected_output || "",
        isHidden: Boolean(tc.isHidden ?? tc.is_hidden),
        is_hidden: Boolean(tc.isHidden ?? tc.is_hidden),
      })),
    };

    try {
      if (editingProblemId) {
        await apiFetch(`${BASE_ENDPOINT}/${editingProblemId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(BASE_ENDPOINT, {
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
      await apiFetch(`${BASE_ENDPOINT}/${id}`, { method: "DELETE" });
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
    const updatedTestCases = (selectedProblem.testCases || []).filter(
      (tc, idx) => (tc.id ?? idx) !== tcId
    );
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

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="mentor-practice-container-MN mentor-practice-wrapper-MN">
      <div className="ui-section-header-MN">
        <div className="ui-section-main-MN">
          <div>
            <h2 className="ui-section-title-MN">
              <Terminal size={22} className="ui-section-title-icon-MN" />
              <span>Mentor Coding Practice Management</span>
            </h2>
            <p className="ui-section-desc-MN">
              Build algorithmic question banks, configure test cases, and assign coding tasks to student cohorts.
            </p>
          </div>
          <div className="ui-section-action-MN">
            <button
              type="button"
              className="mentor-btn-ai-generate-MN"
              onClick={() => {
                setAiPromptTopic("");
                setShowAiModal(true);
              }}
            >
              <Sparkles size={16} /> Generate with AI
            </button>
            <button
              type="button"
              className="mentor-btn-add-MN"
              onClick={() => {
                setEditingProblemId(null);
                const firstBatch = batches[0];
                const defaultBatchName = firstBatch ? firstBatch.name : "";
                const defaultBatchId = extractBatchId(firstBatch);
                setNewProb({
                  ...emptyProbState,
                  batch: defaultBatchName,
                  batchId: defaultBatchId,
                });
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
      <div className="pp-tabs-wrapper-MN">
        <button
          type="button"
          className={`pp-modern-tab-MN ${activeTab === "bank" ? "active-MN" : ""}`}
          onClick={() => setActiveTab("bank")}
        >
          <Code size={16} />
          <span>Problem Bank</span>
          <span className="pp-tab-counter-MN">{problems.length}</span>
        </button>
        <button
          type="button"
          className={`pp-modern-tab-MN ${activeTab === "history" ? "active-MN" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          <span>Problem History</span>
          <span className="pp-tab-counter-MN">{problems.length}</span>
        </button>
        <button
          type="button"
          className={`pp-modern-tab-MN ${activeTab === "submissions" ? "active-MN" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          <ListChecks size={16} />
          <span>Submissions &amp; Audits</span>
          <span className="pp-tab-counter-MN">{submissions.length}</span>
        </button>
      </div>

      {/* ─── TAB 1: PROBLEM BANK ────────────────────────────────────────────── */}
      {activeTab === "bank" && (
        <>
          {/* Toolbar */}
          <div className="mentor-users-toolbar-MN">
            <div className="mentor-users-search-wrap-MN">
              <Search size={16} className="mentor-users-search-icon-MN" />
              <input
                type="text"
                className="mentor-users-search-input-MN"
                placeholder="Search by problem title, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn-MN"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mentor-users-filters-MN">
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`mentor-filter-pill-MN ${
                    difficultyFilter === diff ? "mentor-filter-pill--active-MN" : ""
                  }`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="mentor-users-table-card-MN">
            <table className="mentor-users-table-MN pp-table-MN">
              <thead>
                <tr>
                  <th style={{ width: "32%" }}>Problem Details</th>
                  <th style={{ width: "18%" }}>Topic</th>
                  <th className="pp-table-th-center-MN" style={{ width: "14%" }}>
                    Difficulty
                  </th>
                  <th className="pp-table-th-center-MN" style={{ width: "18%" }}>
                    Due Date &amp; Time
                  </th>
                  <th className="pp-table-th-center-MN" style={{ width: "10%" }}>
                    XP Points
                  </th>
                  <th className="th-actions-right-MN pp-table-th-right-MN" style={{ width: "8%" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="user-name-title-MN" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Terminal size={16} color="#4f46e5" />
                        {p.title}
                      </div>
                      <div className="user-email-sub-MN">
                        {p.description
                          ? p.description.length > 40
                            ? p.description.slice(0, 40) + "..."
                            : p.description
                          : "Practice Problem"}
                      </div>
                    </td>
                    <td>
                      <span className="user-dept-student-MN">{p.topic}</span>
                    </td>
                    <td className="pp-table-td-center-MN">
                      <Badge
                        variant={
                          p.difficulty === "Easy"
                            ? "success"
                            : p.difficulty === "Medium"
                              ? "default"
                              : "destructive"
                        }
                        className="diff-badge-MN"
                      >
                        {p.difficulty}
                      </Badge>
                    </td>
                    <td className="pp-table-td-center-MN">
                      <span
                        className="pp-table-date-MN"
                        style={{
                          color: p.dueDate ? "#ef4444" : "#94a3b8",
                          fontWeight: p.dueDate ? 600 : 400,
                        }}
                      >
                        {p.dueDate
                          ? new Date(p.dueDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "No Deadline"}
                      </span>
                    </td>
                    <td className="pp-table-td-center-MN">
                      <span className="pp-table-xp-MN">+{p.xp || 50} XP</span>
                    </td>
                    <td className="pp-table-td-right-MN">
                      <div className="action-btns-row-MN action-btns-right-MN">
                        <button
                          type="button"
                          className="btn-table-action-MN"
                          onClick={() => handleOpenEditProblem(p)}
                          title="Edit Problem"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-table-action-MN btn-table-action--delete-MN"
                          onClick={() => handleDeleteProblem(p.id)}
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
          <div className="pp-history-kpi-grid-MN">
            <div className="pp-history-kpi-card-MN">
              <div className="pp-history-kpi-icon-MN pp-history-kpi-icon--indigo-MN">
                <Code size={22} />
              </div>
              <div className="pp-history-kpi-info-MN">
                <span className="pp-history-kpi-val-MN">{problems.length}</span>
                <span className="pp-history-kpi-label-MN">Total Problems Added</span>
                <span className="pp-history-kpi-sub-MN">Across your cohorts</span>
              </div>
            </div>

            <div className="pp-history-kpi-card-MN">
              <div className="pp-history-kpi-icon-MN pp-history-kpi-icon--purple-MN">
                <Layers size={22} />
              </div>
              <div className="pp-history-kpi-info-MN">
                <span className="pp-history-kpi-val-MN">
                  {problems.filter((p) => p.batch && p.batch !== "All Batches").length}
                </span>
                <span className="pp-history-kpi-label-MN">Batch-Specific Tasks</span>
                <span className="pp-history-kpi-sub-MN">Assigned to cohorts</span>
              </div>
            </div>

            <div className="pp-history-kpi-card-MN">
              <div className="pp-history-kpi-icon-MN pp-history-kpi-icon--emerald-MN">
                <Zap size={22} />
              </div>
              <div className="pp-history-kpi-info-MN">
                <span className="pp-history-kpi-val-MN">
                  {problems.filter((p) => !p.batch || p.batch === "All Batches").length}
                </span>
                <span className="pp-history-kpi-label-MN">Universal Problems</span>
                <span className="pp-history-kpi-sub-MN">Open to all students</span>
              </div>
            </div>

            <div className="pp-history-kpi-card-MN">
              <div className="pp-history-kpi-icon-MN pp-history-kpi-icon--amber-MN">
                <ListChecks size={22} />
              </div>
              <div className="pp-history-kpi-info-MN">
                <span className="pp-history-kpi-val-MN">{submissions.length}</span>
                <span className="pp-history-kpi-label-MN">Total Submissions</span>
                <span className="pp-history-kpi-sub-MN">Evaluated student runs</span>
              </div>
            </div>
          </div>

          {/* History Search & Filter Toolbar */}
          <div className="mentor-users-toolbar-MN" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div className="mentor-users-search-wrap-MN" style={{ flex: 1, minWidth: "260px" }}>
              <Search size={16} className="mentor-users-search-icon-MN" />
              <input
                type="text"
                className="mentor-users-search-input-MN"
                placeholder="Search history by problem title, topic, or batch..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
              {historySearch && (
                <button
                  type="button"
                  className="search-clear-btn-MN"
                  onClick={() => setHistorySearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ minWidth: "200px" }}>
              <MentorPpSelect
                value={historyBatchFilter}
                onChange={(val) => setHistoryBatchFilter(val)}
                options={[
                  { value: "All", label: "All Batches (Filter)" },
                  { value: "All Batches", label: "Universal (All Batches)" },
                  ...batches.map((b) => ({ value: b.name, label: b.name })),
                ]}
              />
            </div>

            <div className="mentor-users-filters-MN">
              {["All", "Easy", "Medium", "Hard"].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`mentor-filter-pill-MN ${
                    historyDifficultyFilter === diff ? "mentor-filter-pill--active-MN" : ""
                  }`}
                  onClick={() => setHistoryDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pp-refresh-btn-MN"
              onClick={fetchApiProblems}
              title="Refresh problem list"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {/* History Table */}
          {filteredHistoryProblems.length === 0 ? (
            <div className="mentor-users-table-card-MN" style={{ padding: "60px 20px", textAlign: "center" }}>
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
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Clear history filters
                  </button>
                ) : (
                  "Create a problem with 'Add Coding Problem' or 'Generate with AI' to start building your history."
                )}
              </p>
            </div>
          ) : (
            <div className="mentor-users-table-card-MN">
              <table className="mentor-users-table-MN pp-table-MN">
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
                                background: isUniversal
                                  ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                                  : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "2px",
                              }}
                            >
                              <Code size={16} />
                            </div>
                            <div>
                              <div className="user-name-title-MN" style={{ fontSize: "14px", fontWeight: 700 }}>
                                {p.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  marginTop: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    background: "#f1f5f9",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#475569",
                                  }}
                                >
                                  {p.topic || "General DSA"}
                                </span>
                                <span
                                  style={{
                                    background: "rgba(99, 102, 241, 0.08)",
                                    color: "#4f46e5",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  +{p.xp} XP
                                </span>
                                {p.dueDate && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#64748b",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
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
                              border: `1px solid ${
                                isUniversal ? "rgba(99, 102, 241, 0.2)" : "rgba(139, 92, 246, 0.25)"
                              }`,
                            }}
                          >
                            <Layers size={12} />
                            {p.batch || "All Batches"}
                          </span>
                        </td>

                        <td>
                          <span className={`diff-badge-MN diff-badge--${diffLower}-MN`}>
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
                              {p.testCases.filter((t) => t.isHidden).length} hidden
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
                                color: probSubmissions.length > 0 ? "#047857" : "#64748b",
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
                                  textDecoration: "underline",
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
                              className="mentor-action-btn-MN mentor-action-btn--secondary-MN"
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
                              className="mentor-action-btn-MN mentor-action-btn--secondary-MN"
                              title="Inspect Test Cases"
                              style={{ padding: "5px 9px", fontSize: "12px" }}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProblem(p.id)}
                              className="mentor-action-btn-MN mentor-action-btn--danger-MN"
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
      {activeTab === "submissions" &&
        (() => {
          const totalSubmissionsCount = submissions.length;
          const acceptedCount = submissions.filter(
            (s) => String(s.status || "").toLowerCase() === "accepted"
          ).length;
          const wrongCount = submissions.filter((s) =>
            String(s.status || "").toLowerCase().includes("wrong")
          ).length;
          const otherErrorCount = submissions.filter((s) => {
            const st = String(s.status || "").toLowerCase();
            return (
              st.includes("time") ||
              st.includes("tle") ||
              st.includes("runtime") ||
              st.includes("error") ||
              st.includes("compil")
            );
          }).length;
          const acceptedRate =
            totalSubmissionsCount > 0 ? Math.round((acceptedCount / totalSubmissionsCount) * 100) : 0;

          const validTimes = submissions
            .map((s) => {
              const m = String(s.executionTime || "").match(/[\d.]+/);
              return m ? parseFloat(m[0]) : null;
            })
            .filter((t) => t !== null && !isNaN(t));
          const avgTime =
            validTimes.length > 0
              ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(2) + "s"
              : "0.00s";

          return (
            <div className="mentor-submissions-wrap-MN page-fade-in-MN">
              {/* Executive KPI Metric Banner */}
              <div className="pp-kpi-grid-MN">
                <div className="pp-kpi-card-MN">
                  <div className="pp-kpi-icon-wrap-MN pp-kpi-icon--indigo-MN">
                    <FileCode2 size={22} />
                  </div>
                  <div className="pp-kpi-info-MN">
                    <div className="pp-kpi-value-MN">{totalSubmissionsCount}</div>
                    <div className="pp-kpi-label-MN">Total Submissions</div>
                  </div>
                </div>

                <div className="pp-kpi-card-MN">
                  <div className="pp-kpi-icon-wrap-MN pp-kpi-icon--emerald-MN">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="pp-kpi-info-MN">
                    <div className="pp-kpi-value-MN" style={{ color: "#059669" }}>
                      {acceptedRate}%
                    </div>
                    <div className="pp-kpi-label-MN">Accepted Rate ({acceptedCount})</div>
                  </div>
                </div>

                <div className="pp-kpi-card-MN">
                  <div className="pp-kpi-icon-wrap-MN pp-kpi-icon--rose-MN">
                    <XCircle size={22} />
                  </div>
                  <div className="pp-kpi-info-MN">
                    <div className="pp-kpi-value-MN" style={{ color: "#e11d48" }}>
                      {wrongCount}
                    </div>
                    <div className="pp-kpi-label-MN">Wrong Answer</div>
                  </div>
                </div>

                <div className="pp-kpi-card-MN">
                  <div className="pp-kpi-icon-wrap-MN pp-kpi-icon--violet-MN">
                    <Clock size={22} />
                  </div>
                  <div className="pp-kpi-info-MN">
                    <div className="pp-kpi-value-MN" style={{ color: "#7c3aed" }}>
                      {avgTime}
                    </div>
                    <div className="pp-kpi-label-MN">Avg Execution Time</div>
                  </div>
                </div>
              </div>

              {/* Submissions Filter Toolbar */}
              <div className="pp-submissions-toolbar-MN">
                <div className="pp-search-box-MN">
                  <Search size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <input
                    type="text"
                    className="pp-search-input-MN"
                    placeholder="Search by student name, roll number, problem..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                  />
                  {submissionSearch && (
                    <button
                      type="button"
                      onClick={() => setSubmissionSearch("")}
                      className="pp-search-clear-btn-MN"
                      title="Clear Search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status Filter Pills Row */}
                <div className="pp-filter-pills-row-MN">
                  {[
                    { id: "All", label: "All Statuses", count: totalSubmissionsCount },
                    { id: "Accepted", label: "Accepted", count: acceptedCount },
                    { id: "Wrong Answer", label: "Wrong Answer", count: wrongCount },
                    { id: "Time Limit Exceeded", label: "TLE", count: otherErrorCount },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`pp-filter-pill-btn-MN ${submissionStatusFilter === st.id ? "active-MN" : ""}`}
                      onClick={() => setSubmissionStatusFilter(st.id)}
                    >
                      <span>{st.label}</span>
                      <span className="pp-filter-count-MN">{st.count}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={fetchSubmissions}
                    className="pp-refresh-btn-MN"
                    title="Refresh Submissions"
                  >
                    <RefreshCw size={14} className={loadingSubmissions ? "spin-MN" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Submissions Table Card */}
              <div className="pp-table-card-MN">
                {loadingSubmissions ? (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                    <RefreshCw size={26} className="spin-MN" style={{ color: "#4f46e5", marginBottom: "12px" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Loading coding submissions from database...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "16px",
                        background: "#f1f5f9",
                        color: "#64748b",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <ListChecks size={28} />
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                      No coding submissions found
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "440px", marginInline: "auto" }}>
                      {submissionSearch || submissionStatusFilter !== "All"
                        ? "No submissions matched your search criteria. Try clearing the search or status filter."
                        : "Student submissions will appear here dynamically as students solve and submit practice coding problems."}
                    </p>
                  </div>
                ) : (
                  <table className="pp-table-MN">
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
                              <div className="pp-student-cell-MN">
                                <div className="pp-avatar-MN" style={{ background: getAvatarBg(s.studentId || s.id, idx) }}>
                                  {getStudentInitials(s.studentName)}
                                </div>
                                <div className="pp-student-info-MN">
                                  <div className="pp-student-name-MN">{s.studentName || "Student"}</div>
                                  <div className="pp-student-meta-MN">
                                    <span>{s.rollNo || "No Roll"}</span>
                                    {s.department && <span className="pp-dept-pill-MN">{s.department}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="pp-problem-title-MN">{s.problemTitle}</div>
                              <div className="pp-problem-meta-MN">
                                <span>Problem #{s.problemId}</span>
                                <span>•</span>
                                <span className={`pp-diff-pill-MN pp-diff--${diffClass}-MN`}>
                                  {s.problemDifficulty || "Medium"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className="pp-tech-pill-MN"
                                style={{
                                  background: langInfo.bg,
                                  color: langInfo.color,
                                  border: `1px solid ${langInfo.border}`,
                                }}
                              >
                                {langInfo.label}
                              </span>
                            </td>

                            <td>
                              <div className="pp-testcase-wrap-MN">
                                <div className="pp-testcase-header-MN">
                                  <span className="pp-testcase-ratio-MN">
                                    {passed}/{total} Passed
                                  </span>
                                  <span className={`pp-xp-badge-MN ${s.score > 0 ? "pp-xp-badge--active-MN" : "pp-xp-badge--zero-MN"}`}>
                                    {s.score > 0 ? `+${s.score} XP` : "0 XP"}
                                  </span>
                                </div>
                                <div className="pp-meter-track-MN">
                                  <div
                                    className="pp-meter-fill-MN"
                                    style={{
                                      width: `${Math.min(pct, 100)}%`,
                                      background: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#f43f5e",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="pp-time-chip-MN">
                                <Clock size={12} style={{ color: "#6366f1" }} />
                                <span>{s.executionTime || "0.00s"}</span>
                              </div>
                            </td>

                            <td>
                              <span
                                className="pp-status-chip-MN"
                                style={{
                                  background: stInfo.bg,
                                  color: stInfo.color,
                                  border: `1px solid ${stInfo.border}`,
                                }}
                              >
                                {stInfo.icon}
                                <span>{stInfo.label}</span>
                              </span>
                            </td>

                            <td>
                              <span className="pp-date-text-MN">{s.submittedAt || "Recent"}</span>
                              {s.feedback && (
                                <div className="pp-feedback-indicator-MN">
                                  <MessageSquare size={11} />
                                  <span>Reviewed</span>
                                </div>
                              )}
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => handleOpenSubmission(s)}
                                className="pp-btn-review-MN"
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
      {viewingSubmission &&
        createPortal(
          <div
            className="modal-overlay-MN"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingSubmission(null);
            }}
          >
            <div className="modal-dialog-MN" style={{ maxWidth: "800px" }}>
              <div className="modal-header-MN">
                <div className="modal-header-left-MN">
                  <div className="modal-header-icon-wrap-MN modal-header-icon--indigo-MN">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title-MN">
                      {viewingSubmission.studentName} — {viewingSubmission.problemTitle}
                    </h2>
                    <p className="modal-subtitle-MN">
                      Submitted on {viewingSubmission.submittedAt} • Language:{" "}
                      <strong style={{ textTransform: "uppercase" }}>{viewingSubmission.language}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn-MN"
                  onClick={() => setViewingSubmission(null)}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-MN" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f8fafc",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span
                      className={`status-badge-MN ${
                        viewingSubmission.status === "Accepted" ? "status-badge--active-MN" : "status-badge--error-MN"
                      }`}
                    >
                      {viewingSubmission.status}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                      Test Cases: {viewingSubmission.passedTestCases} / {viewingSubmission.totalTestCases} Passed
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                    <span>
                      Execution: <strong>{viewingSubmission.executionTime}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Memory: <strong>{viewingSubmission.memory}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Score: <strong style={{ color: "#10b981" }}>+{viewingSubmission.score} XP</strong>
                    </span>
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#1e293b",
                      color: "#94a3b8",
                      padding: "8px 14px",
                      borderTopLeftRadius: "8px",
                      borderTopRightRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span>Submitted Code ({viewingSubmission.language})</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(viewingSubmission.submittedCode || "");
                        alert("Code copied to clipboard!");
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #475569",
                        color: "#cbd5e1",
                        borderRadius: "4px",
                        padding: "3px 10px",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre
                    style={{
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
                      maxHeight: "380px",
                    }}
                  >
                    <code>{viewingSubmission.submittedCode || "// No code available"}</code>
                  </pre>
                </div>

                {/* Optional Mentor Code Review Feedback Section */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                        Mentor Code Review Feedback
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#64748b",
                          background: "#e2e8f0",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        Optional
                      </span>
                    </div>
                    {viewingSubmission.feedbackBy && (
                      <span style={{ fontSize: "11.5px", color: "#6366f1", fontWeight: 600 }}>
                        Last reviewed by {viewingSubmission.feedbackBy}{" "}
                        {viewingSubmission.feedbackAt ? `(${viewingSubmission.feedbackAt})` : ""}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#64748b" }}>
                    Provide optional comments, code quality feedback, edge-case guidance, or optimization tips for the
                    student.
                  </p>

                  {feedbackSuccessMsg && (
                    <div
                      style={{
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
                        gap: "6px",
                      }}
                    >
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
                      "Good attempt! Consider reviewing time limit constraints.",
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="pp-quick-chip-MN"
                        onClick={() => setSubmissionFeedback((prev) => (prev ? `${prev.trim()} ${chip}` : chip))}
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
                      outline: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "12px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {viewingSubmission.feedback
                        ? "Feedback currently saved for this student"
                        : "Feedback will be visible on the student's dashboard"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveFeedback(viewingSubmission.id)}
                      disabled={savingFeedback}
                      className="mentor-action-btn-MN mentor-action-btn--primary-MN"
                      style={{ padding: "8px 18px", fontSize: "13px" }}
                    >
                      {savingFeedback ? <RefreshCw size={14} className="spin-MN" /> : <Check size={14} />}
                      <span>
                        {savingFeedback
                          ? "Saving..."
                          : viewingSubmission.feedback
                            ? "Update Feedback"
                            : "Save Feedback (Optional)"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer-MN">
                <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                  <span>
                    Language: <strong style={{ color: "#334155" }}>{viewingSubmission.language}</strong> • Score:{" "}
                    <strong style={{ color: "#10b981" }}>+{viewingSubmission.score} XP</strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="mentor-action-btn-MN mentor-action-btn--secondary-MN"
                    onClick={() => setViewingSubmission(null)}
                    style={{ padding: "8px 18px", fontSize: "13px" }}
                  >
                    <X size={15} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveFeedback(viewingSubmission.id)}
                    disabled={savingFeedback}
                    className="mentor-action-btn-MN mentor-action-btn--primary-MN"
                    style={{ padding: "8px 20px", fontSize: "13px" }}
                  >
                    {savingFeedback ? <RefreshCw size={14} className="spin-MN" /> : <Check size={14} />}
                    <span>
                      {savingFeedback ? "Saving..." : viewingSubmission.feedback ? "Update Feedback" : "Save Feedback"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── ADD PROBLEM MODAL (WITH UNIFIED TEST CASES BUILDER) ──────────────── */}
      {showAddModal &&
        createPortal(
          <div
            className="modal-overlay-MN"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddModal(false);
            }}
          >
            <div className="modal-dialog-MN" style={{ maxWidth: "780px" }}>
              <div className="modal-header-MN">
                <div className="modal-header-left-MN">
                  <div className="modal-header-icon-wrap-MN modal-header-icon--indigo-MN">
                    <Code size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title-MN">
                      {editingProblemId ? "Edit Coding Problem" : "Create New Coding Problem"}
                    </h2>
                    <p className="modal-subtitle-MN">
                      {editingProblemId
                        ? "Update problem details, difficulty, constraints, and test cases."
                        : "Add problem statement, sample test cases, and evaluation test cases in one place."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn-MN"
                  onClick={() => setShowAddModal(false)}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProblem}>
                <div className="modal-body-MN add-prob-modal-body-MN">
                  {/* AI AUTO-FILL BANNER */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px dashed #818cf8",
                      marginBottom: "4px",
                    }}
                  >
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
                          background: "#fff",
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
                          cursor: isGeneratingAI ? "not-allowed" : "pointer",
                        }}
                      >
                        <Sparkles size={13} /> {isGeneratingAI ? "Generating..." : "Generate & Fill"}
                      </button>
                    </div>
                  </div>

                  {/* SECTION 1: PROBLEM DETAILS */}
                  <div className="add-prob-section-MN">
                    <h4 className="add-prob-section-title-MN">
                      <FileCode size={16} color="#6366f1" /> Problem Details &amp; Metadata
                    </h4>

                    <div className="form-group-MN add-prob-form-group-MN">
                      <label>Problem Title *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Two Sum Target Index Pair"
                        value={newProb.title}
                        onChange={(e) => setNewProb({ ...newProb, title: e.target.value })}
                        className="form-input-MN"
                        autoFocus
                      />
                    </div>

                    <div className="add-prob-grid-3-MN form-grid-3-MN mobile-pair-2-MN">
                      <div className="form-group-MN">
                        <label>Topic / Category</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Arrays & Hashing"
                          value={newProb.topic}
                          onChange={(e) => setNewProb({ ...newProb, topic: e.target.value })}
                          className="form-input-MN"
                        />
                      </div>
                      <div className="form-group-MN">
                        <label>Difficulty</label>
                        <MentorPpSelect
                          value={newProb.difficulty}
                          onChange={(val) => setNewProb({ ...newProb, difficulty: val })}
                          options={[
                            { value: "Easy", label: "Easy" },
                            { value: "Medium", label: "Medium" },
                            { value: "Hard", label: "Hard" },
                          ]}
                        />
                      </div>
                      <div className="form-group-MN mobile-field-full-MN">
                        <label>Target Batch *</label>
                        {batches.length === 0 ? (
                          <div
                            style={{
                              padding: "8px 12px",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              color: "#dc2626",
                              fontSize: "13px",
                              fontWeight: "500",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            No batches assigned to you.
                          </div>
                        ) : (
                          <MentorPpSelect
                            value={newProb.batch || (batches.length > 0 ? batches[0].name : "")}
                            onChange={(val) => {
                              const bObj = batches.find((b) => b.name === val);
                              const bId = extractBatchId(bObj);
                              setNewProb({ ...newProb, batch: val, batchId: bId });
                            }}
                            options={batches.map((b) => ({
                              value: b.name,
                              label: b.code ? `${b.name} (${b.code})` : b.name,
                            }))}
                          />
                        )}
                        {batches.length === 0 && (
                          <small style={{ color: "#ef4444", display: "block", marginTop: "4px" }}>
                            Please contact your administrator to assign a batch to your mentor profile.
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="add-prob-grid-3-MN form-grid-3-MN mobile-pair-2-MN">
                      <div className="form-group-MN mobile-field-full-MN">
                        <label>Allowed Language</label>
                        <MentorPpSelect
                          value={newProb.language || "All"}
                          onChange={(val) => setNewProb({ ...newProb, language: val })}
                          options={[
                            { value: "All", label: "All Languages (Student's Choice)" },
                            { value: "Python", label: "Python (Python 3)" },
                            { value: "Java", label: "Java (Java 17)" },
                            { value: "C++", label: "C++ (C++ 20)" },
                            { value: "C", label: "C (C11)" },
                            { value: "JavaScript", label: "JavaScript (Node.js)" },
                            { value: "SQL", label: "SQL (SQLite3)" },
                          ]}
                        />
                      </div>
                      <div className="form-group-MN">
                        <label>Due Date &amp; Time</label>
                        <input
                          type="datetime-local"
                          value={newProb.dueDate}
                          onChange={(e) => setNewProb({ ...newProb, dueDate: e.target.value })}
                          className="form-input-MN"
                        />
                      </div>
                      <div className="form-group-MN">
                        <label>XP Reward Points</label>
                        <input
                          required
                          type="number"
                          placeholder="50"
                          value={newProb.xp}
                          onChange={(e) => setNewProb({ ...newProb, xp: e.target.value })}
                          className="form-input-MN"
                        />
                      </div>
                    </div>

                    <div className="form-group-MN">
                      <label>Problem Description</label>
                      <textarea
                        rows={3}
                        placeholder="Explain problem statement, constraints, and instructions..."
                        value={newProb.description}
                        onChange={(e) => setNewProb({ ...newProb, description: e.target.value })}
                        className="form-input-MN add-prob-textarea-MN"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: TEST CASES BUILDER */}
                  <div className="tc-builder-box-MN">
                    <div className="tc-builder-header-MN">
                      <div>
                        <h4 className="tc-builder-title-MN">
                          <ListChecks size={18} color="#4f46e5" /> Test Cases Builder
                        </h4>
                        <p className="tc-builder-subtitle-MN">
                          Add public sample and hidden evaluation test cases. Evaluated during student code submissions.
                        </p>
                      </div>
                      <span className="tc-builder-count-badge-MN">{newProb.testCases.length} Configured</span>
                    </div>

                    {/* Add Test Case Inputs */}
                    <div className="tc-builder-input-card-MN">
                      <div className="tc-builder-input-grid-MN">
                        <div>
                          <label className="tc-builder-input-label-MN">Input Data</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. 5 10 15"
                            value={formTestCase.input}
                            onChange={(e) => setFormTestCase({ ...formTestCase, input: e.target.value })}
                            className="form-input-MN add-prob-code-textarea-MN"
                          />
                        </div>
                        <div>
                          <label className="tc-builder-input-label-MN">Expected Output</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. 30"
                            value={formTestCase.output}
                            onChange={(e) => setFormTestCase({ ...formTestCase, output: e.target.value })}
                            className="form-input-MN add-prob-code-textarea-MN"
                          />
                        </div>
                      </div>

                      <div className="tc-builder-controls-MN">
                        <label className="tc-builder-hidden-check-MN">
                          <input
                            type="checkbox"
                            checked={formTestCase.isHidden}
                            onChange={(e) => setFormTestCase({ ...formTestCase, isHidden: e.target.checked })}
                            className="tc-builder-hidden-checkbox-MN"
                          />
                          <span>Hidden Test Case (Used for evaluation score)</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleAddTestCaseToForm}
                          disabled={!formTestCase.input.trim() && !formTestCase.output.trim()}
                          className={`tc-builder-add-btn-MN ${
                            formTestCase.input.trim() || formTestCase.output.trim()
                              ? "tc-builder-add-btn--active-MN"
                              : "tc-builder-add-btn--disabled-MN"
                          }`}
                        >
                          <Plus size={14} /> Add Test Case
                        </button>
                      </div>
                    </div>

                    {/* List of Test Cases Added */}
                    {newProb.testCases.length > 0 ? (
                      <div className="tc-builder-list-MN">
                        {newProb.testCases.map((tc, idx) => (
                          <div key={tc.id || idx} className="tc-builder-item-MN">
                            <div className="tc-builder-item-info-MN">
                              <span
                                className={`tc-builder-type-badge-MN ${
                                  tc.isHidden
                                    ? "tc-builder-type-badge--hidden-MN"
                                    : "tc-builder-type-badge--public-MN"
                                }`}
                              >
                                {tc.isHidden ? "Hidden" : "Public"} #{idx + 1}
                              </span>
                              <div className="tc-builder-item-data-MN">
                                <strong>In:</strong> {tc.input || "—"} &nbsp;|&nbsp; <strong>Out:</strong>{" "}
                                {tc.output || tc.expectedOutput || "—"}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTestCaseFromForm(tc.id)}
                              className="tc-builder-remove-btn-MN"
                              title="Remove Test Case"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="tc-builder-empty-msg-MN">
                        No test cases added yet. Use the form above to add test cases before saving!
                      </p>
                    )}
                  </div>
                </div>

                <div className="modal-footer-MN add-prob-modal-footer-MN">
                  <button
                    type="button"
                    className="btn-modal-cancel-MN"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit-MN">
                    {editingProblemId ? "Update Problem" : "Save Problem & Test Cases"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ─── DEDICATED AI PROBLEM GENERATOR MODAL ────────────────────────────── */}
      {showAiModal &&
        createPortal(
          <div
            className="modal-overlay-MN"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAiModal(false);
            }}
          >
            <div className="modal-dialog-MN" style={{ maxWidth: "560px" }}>
              <div className="modal-header-MN">
                <div className="modal-header-left-MN">
                  <div
                    className="modal-header-icon-wrap-MN"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                      color: "#fff",
                      border: "none",
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title-MN">AI Coding Problem Generator</h2>
                    <p className="modal-subtitle-MN">
                      Generate complete algorithmic problems with test cases using Groq &amp; Gemini AI.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn-MN"
                  onClick={() => setShowAiModal(false)}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-MN" style={{ padding: "24px" }}>
                <div className="form-group-MN" style={{ marginBottom: "4px" }}>
                  <label>Algorithm / Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Programming (0/1 Knapsack), Trie, Linked List Cycle"
                    value={aiPromptTopic}
                    onChange={(e) => setAiPromptTopic(e.target.value)}
                    className="form-input-MN"
                    autoFocus
                  />
                </div>

                <div className="form-grid-2-MN mobile-pair-2-MN">
                  <div className="form-group-MN">
                    <label>Difficulty Level</label>
                    <MentorPpSelect
                      value={aiDifficulty}
                      onChange={(val) => setAiDifficulty(val)}
                      options={[
                        { value: "Easy", label: "🟢 Easy (50 XP)" },
                        { value: "Medium", label: "🟡 Medium (100 XP)" },
                        { value: "Hard", label: "🔴 Hard (150 XP)" },
                      ]}
                    />
                  </div>

                  <div className="form-group-MN">
                    <label>Allowed Language</label>
                    <MentorPpSelect
                      value={aiLanguage}
                      onChange={(val) => setAiLanguage(val)}
                      options={[
                        { value: "All", label: "All Languages (Student's Choice)" },
                        { value: "Python", label: "Python (Python 3)" },
                        { value: "Java", label: "Java (Java 17)" },
                        { value: "C++", label: "C++ (C++ 20)" },
                        { value: "C", label: "C (C11)" },
                        { value: "JavaScript", label: "JavaScript (Node.js)" },
                        { value: "SQL", label: "SQL (SQLite3)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="form-group-MN">
                  <label>Target Batch / Cohort</label>
                  {batches.length === 0 ? (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: "500",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      No batches assigned to you.
                    </div>
                  ) : (
                    <MentorPpSelect
                      value={aiBatch || (batches.length > 0 ? batches[0].name : "")}
                      onChange={(val) => setAiBatch(val)}
                      options={batches.map((b) => ({
                        value: b.name,
                        label: b.code ? `${b.name} (${b.code})` : b.name,
                      }))}
                    />
                  )}
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  💡 The AI will generate a complete problem specification, problem description, constraints, sample
                  input/output, and 4 test cases (including hidden edge cases). You will be able to review and edit
                  before saving to the database.
                </div>
              </div>

              <div className="modal-footer-MN" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-modal-cancel-MN"
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
                    cursor: isGeneratingAI ? "not-allowed" : "pointer",
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
      {showTestCaseModal &&
        selectedProblem &&
        createPortal(
          <div
            className="modal-overlay-MN"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowTestCaseModal(false);
            }}
          >
            <div className="modal-dialog-MN" style={{ maxWidth: "680px" }}>
              <div className="modal-header-MN">
                <div className="modal-header-left-MN">
                  <div className="modal-header-icon-wrap-MN modal-header-icon--blue-MN">
                    <ListChecks size={20} />
                  </div>
                  <div>
                    <h2 className="modal-title-MN">
                      <span>Edit Test Cases:</span>
                      <span style={{ color: "#2563eb" }}>{selectedProblem.title}</span>
                    </h2>
                    <p className="modal-subtitle-MN">
                      Configure public example test cases and hidden evaluation suites.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn-MN"
                  onClick={() => setShowTestCaseModal(false)}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-MN">
                {/* TOP: Add New Test Case Container */}
                <form onSubmit={handleAddTestCase} className="tc-add-container-MN">
                  <div className="tc-add-header-MN">
                    <h4 className="tc-add-heading-MN">
                      <Plus size={16} color="#2563eb" />
                      <span>Add New Test Case</span>
                    </h4>
                    <span className="tc-add-hint-MN">Auto-evaluated against student code</span>
                  </div>

                  <div className="tc-grid-2-MN">
                    <div className="form-group-MN">
                      <label>Input (Stdin / Arguments) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. nums = [2,7,11,15], target = 9"
                        value={newTestCase.input}
                        onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                        className="form-input-MN tc-code-input-MN"
                      />
                    </div>
                    <div className="form-group-MN">
                      <label>Expected Output *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. [0,1]"
                        value={newTestCase.output}
                        onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                        className="form-input-MN tc-code-input-MN"
                      />
                    </div>
                  </div>

                  <div className="tc-form-footer-MN">
                    <label className="tc-checkbox-wrap-MN">
                      <input
                        type="checkbox"
                        checked={newTestCase.isHidden}
                        onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                      />
                      <span>Mark as Hidden Test Case (Used for evaluation grade)</span>
                    </label>

                    <button type="submit" className="tc-add-btn-MN">
                      <Plus size={15} />
                      <span>Add Test Case</span>
                    </button>
                  </div>
                </form>

                {/* BOTTOM: Configured Test Cases List */}
                <div className="tc-list-section-MN">
                  <div className="tc-section-header-MN">
                    <div className="tc-section-title-wrap-MN">
                      <span className="tc-section-title-MN">Configured Test Cases</span>
                      <span className="tc-count-badge-MN">{(selectedProblem.testCases || []).length}</span>
                    </div>
                    {(selectedProblem.testCases || []).length > 0 && (
                      <span className="tc-section-subtext-MN">
                        Students see public cases; hidden cases are for grading
                      </span>
                    )}
                  </div>

                  <div className="tc-list-wrap-MN">
                    {(selectedProblem.testCases || []).length === 0 ? (
                      <div className="tc-empty-state-MN">
                        <div className="tc-empty-icon-MN">
                          <FileCode2 size={22} />
                        </div>
                        <div className="tc-empty-title-MN">No test cases configured yet</div>
                        <p className="tc-empty-desc-MN">
                          Use the form above to add your first public example or hidden evaluation case.
                        </p>
                      </div>
                    ) : (
                      (selectedProblem.testCases || []).map((tc, idx) => (
                        <div key={tc.id || idx} className="tc-card-MN">
                          <div className="tc-card-header-MN">
                            <div className="tc-card-title-group-MN">
                              <span className="tc-card-num-MN">Test Case #{idx + 1}</span>
                              <span className={tc.isHidden ? "tc-badge--hidden-MN" : "tc-badge--public-MN"}>
                                {tc.isHidden ? "Hidden Evaluation" : "Public Example"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestCaseInModal(tc.id ?? idx)}
                              className="tc-card-delete-btn-MN"
                              title="Remove Test Case"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="tc-grid-2-MN">
                            <div className="tc-code-preview-MN">
                              <span className="tc-code-preview-lbl-MN">Input (Stdin / Args)</span>
                              <pre className="tc-code-preview-code-MN">{tc.input || "—"}</pre>
                            </div>
                            <div className="tc-code-preview-MN">
                              <span className="tc-code-preview-lbl-MN">Expected Output</span>
                              <pre className="tc-code-preview-code-MN">
                                {tc.output || tc.expectedOutput || "—"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer-MN">
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                  {(selectedProblem.testCases || []).length} Test Cases configured
                </span>
                <button
                  type="button"
                  className="btn-modal-cancel-MN"
                  onClick={() => setShowTestCaseModal(false)}
                >
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
