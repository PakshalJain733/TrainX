import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Code, Plus, Edit, Trash2, ListChecks, Send, Eye, CheckCircle2, XCircle, Clock, Award, Search, Filter, X, FileCode, FileCode2, Layers, ChevronRight, TrendingUp, Terminal, Sparkles, ChevronDown } from "lucide-react";
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

const initialCodingProblems = [];
const mockAssignments = [];
const mockSubmissions = [];

export default function AdminPracticeProblems() {
  const [activeTab, setActiveTab] = useState("bank");

  // API + Local State
  const [problems, setProblems] = useState(initialCodingProblems);
  const [batches, setBatches] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const emptyProbState = {
    title: "",
    topic: "",
    difficulty: "Easy",
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
  const [aiCompanies, setAiCompanies] = useState("Google, Amazon, TCS, Infosys");

  // Tab 2 States
  const [assignments, setAssignments] = useState(mockAssignments);
  const [assignForm, setAssignForm] = useState({
    problemId: "",
    batch: "All Batches",
    title: "",
    dueDate: "",
  });

  const handleGenerateProblemAI = async (topicToUse, diffToUse) => {
    const topic = (topicToUse || aiPromptTopic || "").trim() || "Arrays & Hashing";
    const difficulty = diffToUse || aiDifficulty || "Medium";
    setIsGeneratingAI(true);
    try {
      const res = await apiFetch("/admin/practice-problems/generate-ai", {
        method: "POST",
        body: JSON.stringify({ topic, difficulty, companies: aiCompanies }),
      });
      if (res && res.data) {
        const d = res.data;
        setNewProb({
          title: d.title || "",
          topic: d.category || d.topic || topic,
          difficulty: d.difficulty || difficulty,
          xp: d.points || (difficulty === "Easy" ? 50 : difficulty === "Medium" ? 100 : 150),
          companies: d.tags || d.companies || aiCompanies,
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
      const apiRes = await apiFetch("/admin/practice-problems");
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
          topic: normTopic,
          difficulty: normDiff,
          xp: normXp,
          companies: normCompanies,
          dueDate: p.dueDate || (p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : ""),
          timeLimit: p.timeLimit || "1.0s",
          memoryLimit: p.memoryLimit || "128 MB",
          description: p.description || "Solve the algorithmic coding challenge according to problem constraints.",
          testCases: normTestCases,
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
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchApiProblems();
    fetchBatches();
  }, []);

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!newProb.title.trim()) return;

    const payload = {
      title: newProb.title.trim(),
      topic: newProb.topic,
      category: newProb.topic,
      difficulty: newProb.difficulty,
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
      await apiFetch("/admin/practice-problems", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await fetchApiProblems();
    } catch (err) {
      console.error("Error creating practice problem in DB:", err);
    }

    setShowAddModal(false);
    setNewProb(emptyProbState);
    setFormTestCase({ input: "", output: "", isHidden: false });
  };

  const handleDeleteProblem = async (id) => {
    if (!id) return;
    try {
      await apiFetch(`/admin/practice-problems/${id}`, { method: "DELETE" });
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
    <div className="admin-page-inner admin-users-container">
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <Terminal size={22} className="ui-section-title-icon" />
              <span>Coding Practice Management</span>
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
      <div className="admin-users-filters">
        <button
          className={`admin-filter-pill ${activeTab === "bank" ? "admin-filter-pill--active" : ""}`}
          onClick={() => setActiveTab("bank")}
        >
          <Code size={15} /> Problem Bank ({problems.length})
        </button>
        <button
          className={`admin-filter-pill ${activeTab === "assign" ? "admin-filter-pill--active" : ""}`}
          onClick={() => setActiveTab("assign")}
        >
          <Send size={15} /> Assign to Batch ({assignments.length})
        </button>
        <button
          className={`admin-filter-pill ${activeTab === "submissions" ? "admin-filter-pill--active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          <ListChecks size={15} /> Submissions & Audits
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
                  <th style={{ width: "26%" }}>Problem Details</th>
                  <th style={{ width: "16%" }}>Topic</th>
                  <th className="pp-table-th-center" style={{ width: "12%" }}>Difficulty</th>
                  <th className="pp-table-th-center" style={{ width: "16%" }}>Due Date & Time</th>
                  <th className="pp-table-th-center" style={{ width: "10%" }}>XP Points</th>
                  <th className="pp-table-th-center" style={{ width: "12%" }}>Test Cases</th>
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
                    <td className="pp-table-td-center">
                      <button
                        className="pp-table-tc-btn"
                        onClick={() => {
                          setSelectedProblem(p);
                          setShowTestCaseModal(true);
                        }}
                        title="Click to edit or add test cases"
                      >
                        <ListChecks size={14} /> Edit Test Cases ({(p.testCases || []).length})
                      </button>
                    </td>
                    <td className="pp-table-td-right">
                      <div className="action-btns-row action-btns-right">
                        <button
                          className="btn-table-action"
                          onClick={() => {
                            setSelectedProblem(p);
                            setShowTestCaseModal(true);
                          }}
                          title="Edit Test Cases"
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

      {/* ─── TAB 2: ASSIGN TO COHORT ─────────────────────────────────────────── */}
      {activeTab === "assign" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          <div className="admin-users-table-card" style={{ padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "18px" }}>
              Publish Task to Batch
            </h3>
            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group-admin">
                <label>Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 4 DSA Sprint"
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  className="form-input-admin"
                />
              </div>

              <div className="form-group-admin">
                <label>Target Batch / Batch</label>
                <AdminPpSelect
                  value={assignForm.batch}
                  onChange={(val) => setAssignForm({ ...assignForm, batch: val })}
                  options={[
                    { value: "All Batches", label: "All Batches (Universal)" },
                    ...batches.map((b) => ({ value: b.name, label: b.name }))
                  ]}
                />
              </div>

              <div className="form-group-admin">
                <label>Due Date</label>
                <input
                  type="date"
                  value={assignForm.dueDate}
                  onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                  className="form-input-admin"
                />
              </div>

              <button type="submit" className="btn-modal-submit" style={{ marginTop: "6px" }}>
                <Send size={15} /> Publish Task to Batch
              </button>
            </form>
          </div>

          <div className="admin-users-table-card">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Batch Target</th>
                  <th>Assigned Date</th>
                  <th>Due Date</th>
                  <th>Submission Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="user-name-title">{a.title}</div>
                      <div className="user-email-sub">{a.problemCount} Problems Included</div>
                    </td>
                    <td><span className="user-dept-student">{a.batch}</span></td>
                    <td>{a.assignedDate}</td>
                    <td><span style={{ color: "#ef4444", fontWeight: 600 }}>{a.dueDate}</span></td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#10b981" }}>{a.submissionRate}%</span>
                    </td>
                    <td>
                      <span className="status-badge status-badge--active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SUBMISSIONS & AUDITS ─────────────────────────────────────── */}
      {activeTab === "submissions" && (
        <div className="admin-users-table-card">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Problem</th>
                <th>Language</th>
                <th>Execution Time</th>
                <th>Memory</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {mockSubmissions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="user-name-title">{s.studentName}</div>
                    <div className="user-email-sub">{s.rollNo}</div>
                  </td>
                  <td><span className="user-dept-student">{s.problemTitle}</span></td>
                  <td><span style={{ fontSize: "12px", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{s.language}</span></td>
                  <td>{s.executionTime}</td>
                  <td>{s.memory}</td>
                  <td>
                    <span className={`status-badge ${s.status === "Accepted" ? "status-badge--active" : "role-badge--admin"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td><span className="user-email-sub">{s.submittedAt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  <h2 className="modal-title">Create New Coding Problem</h2>
                  <p className="modal-subtitle">Add problem statement, sample test cases, and evaluation test cases in one place.</p>
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

                  <div className="form-row-3 add-prob-grid-4">
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
                  Save Problem & Test Cases
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
                    Target Companies
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Amazon, TCS"
                    value={aiCompanies}
                    onChange={(e) => setAiCompanies(e.target.value)}
                    className="form-input-admin"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
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
                onClick={() => handleGenerateProblemAI(aiPromptTopic, aiDifficulty)}
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
