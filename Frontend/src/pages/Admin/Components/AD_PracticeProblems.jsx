import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Code, Plus, Edit, Trash2, ListChecks, Send, Eye, CheckCircle2, XCircle, Clock, Award, Search, Filter, X, FileCode, FileCode2, Layers, ChevronRight, TrendingUp, Terminal, Sparkles, ChevronDown } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import { getSharedCodingTasks, addSharedCodingTask, EVENTS } from "../../../utils/sharedStore";
import "../Styles/AD_PracticeProblems.css";

/* ── Inline dropdown for Admin PracticeProblems (CSS: AdminPracticeProblems.css .admin-pp-select-*) ── */
function AdminPpSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, direction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const safeOptions = Array.isArray(options) ? options : [];
  const selected = safeOptions.find(o => String(o.value) === String(value));

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (direction === 'up') {
        setDropUp(true);
      } else if (direction === 'down') {
        setDropUp(false);
      } else {
        setDropUp(spaceBelow < 240);
      }
    }
    setIsOpen(v => !v);
  };

  return (
    <div className={`admin-pp-select-wrap${isOpen ? ' admin-pp-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={handleToggle} className={`admin-pp-select-trigger${isOpen ? ' admin-pp-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-pp-select-icon" />}
        <span className="admin-pp-select-text">{selected ? selected.label : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-pp-select-arrow${isOpen ? ' admin-pp-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className={`admin-pp-select-dropdown${dropUp ? ' admin-pp-select-dropdown--up' : ''}`}>
          {safeOptions.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-pp-select-option${isSel ? ' admin-pp-select-option--selected' : ''}`}>
                <span className="admin-pp-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-pp-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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

  const [newProb, setNewProb] = useState({
    title: "",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    xp: 50,
    companies: "TCS, Infosys",
    timeLimit: "1.0s",
    memoryLimit: "128 MB",
    description: "",
    dueDate: "",
    sampleInput: "",
    sampleOutput: "",
    testCases: [],
  });

  const [formTestCase, setFormTestCase] = useState({ input: "", output: "", isHidden: false });
  const [newTestCase, setNewTestCase] = useState({ input: "", output: "", isHidden: false });

  // Tab 2 States
  const [assignments, setAssignments] = useState(mockAssignments);
  const [assignForm, setAssignForm] = useState({
    problemId: "",
    batch: "All Batches",
    title: "",
    dueDate: "",
  });

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
    setNewProb({
      title: "",
      topic: "Arrays & Hashing",
      difficulty: "Easy",
      xp: 50,
      companies: "TCS, Infosys",
      timeLimit: "1.0s",
      memoryLimit: "128 MB",
      description: "",
      dueDate: "",
      sampleInput: "",
      sampleOutput: "",
      testCases: [],
    });
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
      input: newTestCase.input,
      output: newTestCase.output,
      isHidden: newTestCase.isHidden,
    };

    const updatedProblems = problems.map((p) => {
      if (p.id === selectedProblem.id) {
        return { ...p, testCases: [...(p.testCases || []), tc] };
      }
      return p;
    });

    setSelectedProblem({
      ...selectedProblem,
      testCases: [...(selectedProblem.testCases || []), tc],
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
      <SectionHeader
        icon={Terminal}
        title="Coding Practice Management"
        description="Build algorithmic question banks, configure test cases, and assign coding tasks to student cohorts."
        action={
          <button className="admin-btn-add" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Coding Problem
          </button>
        }
      />


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
                      <span className="pp-table-date">
                        {p.dueDate ? new Date(p.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "No Deadline"}
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
          <div className="admin-users-table-card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
              Publish Task to Batch
            </h3>
            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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

              <button type="submit" className="btn-modal-submit" style={{ marginTop: "10px" }}>
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
                      <label>Topic / Category *</label>
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
                      <label>XP Reward Points *</label>
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
                <button type="submit" className="btn-modal-submit add-prob-submit-btn">
                  Save Problem & Test Cases
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── TEST CASES MODAL ───────────────────────────────────────────────── */}
      {showTestCaseModal && selectedProblem && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTestCaseModal(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--blue">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Edit Test Cases: {selectedProblem.title}</h2>
                  <p className="modal-subtitle">Configure public and hidden evaluation test suites.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTestCaseModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(selectedProblem.testCases || []).length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", margin: "10px 0" }}>
                    No test cases configured yet. Add one below!
                  </p>
                ) : (
                  (selectedProblem.testCases || []).map((tc, idx) => (
                    <div key={tc.id || idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>Test Case #{idx + 1}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: tc.isHidden ? "#dc2626" : "#059669", background: tc.isHidden ? "#fee2e2" : "#d1fae5", padding: "2px 8px", borderRadius: "4px" }}>
                            {tc.isHidden ? "Hidden Test Case" : "Public Example"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestCaseInModal(tc.id || idx)}
                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                            title="Remove Test Case"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div><strong>Input:</strong> <code>{tc.input || "—"}</code></div>
                      <div><strong>Expected Output:</strong> <code>{tc.output || tc.expectedOutput || "—"}</code></div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddTestCase} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "10px" }}>
                <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                  Add New Test Case
                </h4>
                <div className="form-group-admin" style={{ marginBottom: "10px" }}>
                  <label>Input</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nums = [2,7,11,15], target = 9"
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    className="form-input-admin"
                  />
                </div>
                <div className="form-group-admin" style={{ marginBottom: "10px" }}>
                  <label>Expected Output</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. [0,1]"
                    value={newTestCase.output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                    className="form-input-admin"
                  />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newTestCase.isHidden}
                    onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                  />
                  Mark as Hidden Test Case (Used for evaluation grade)
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                  <button type="submit" className="btn-modal-submit">
                    + Add Test Case
                  </button>
                </div>
              </form>
            </div>

            <div className="modal-footer">
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
