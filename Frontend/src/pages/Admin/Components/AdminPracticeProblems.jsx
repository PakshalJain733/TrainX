import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Code,
  Plus,
  Edit,
  Trash2,
  ListChecks,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Search,
  Filter,
  X,
  FileCode2,
  Layers,
  ChevronRight,
  TrendingUp,
  Terminal,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { addSharedCodingTask, getSharedCodingTasks, EVENTS } from "../../../utils/sharedStore";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AdminUsers.css";
import "../Styles/AdminPracticeProblems.css";

const initialCodingProblems = [
  {
    id: 1,
    title: "Two Sum",
    topic: "Arrays & Hashing",
    difficulty: "Easy",
    xp: 50,
    companies: ["Google", "Amazon", "Meta"],
    timeLimit: "1.0s",
    memoryLimit: "128 MB",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    testCases: [
      { id: 1, input: "nums = [2,7,11,15], target = 9", output: "[0,1]", isHidden: false },
      { id: 2, input: "nums = [3,2,4], target = 6", output: "[1,2]", isHidden: true },
    ],
  },
  {
    id: 2,
    title: "Reverse Linked List",
    topic: "Linked Lists",
    difficulty: "Medium",
    xp: 100,
    companies: ["Microsoft", "Apple"],
    timeLimit: "1.0s",
    memoryLimit: "128 MB",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    testCases: [
      { id: 1, input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", isHidden: false },
    ],
  },
  {
    id: 3,
    title: "LRU Cache Implementation",
    topic: "Design / Data Structures",
    difficulty: "Hard",
    xp: 200,
    companies: ["Netflix", "Uber", "Amazon"],
    timeLimit: "2.0s",
    memoryLimit: "256 MB",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    testCases: [
      { id: 1, input: '["LRUCache", "put", "put", "get"]', output: "[null, null, null, 1]", isHidden: false },
    ],
  },
];

const mockAssignments = [
  {
    id: 101,
    title: "Week 4 DSA Sprint: Two Sum & Valid Palindrome",
    batch: "Node.js Backend - Cohort A",
    problemCount: 2,
    assignedDate: "2026-09-01",
    dueDate: "2026-09-10",
    submissionRate: 88,
    status: "Active",
  },
  {
    id: 102,
    title: "Advanced Data Structures: LRU Cache Practice",
    batch: "React Frontend - Cohort B",
    problemCount: 1,
    assignedDate: "2026-08-25",
    dueDate: "2026-09-05",
    submissionRate: 64,
    status: "Active",
  },
];

const mockSubmissions = [
  {
    id: 501,
    studentName: "Priya Sharma",
    rollNo: "VU21CS042",
    problemTitle: "Two Sum",
    language: "Python 3",
    status: "Accepted",
    executionTime: "42 ms",
    memory: "14.2 MB",
    submittedAt: "10 min ago",
  },
  {
    id: 502,
    studentName: "Rahul Deshmukh",
    rollNo: "VU21CS089",
    problemTitle: "Reverse Linked List",
    language: "C++ 17",
    status: "Wrong Answer",
    executionTime: "0 ms",
    memory: "8.1 MB",
    submittedAt: "25 min ago",
  },
  {
    id: 503,
    studentName: "Ananya Mehta",
    rollNo: "VU21CS014",
    problemTitle: "LRU Cache Implementation",
    language: "Java 11",
    status: "Accepted",
    executionTime: "118 ms",
    memory: "48.5 MB",
    submittedAt: "1 hour ago",
  },
];

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
    companies: "",
    timeLimit: "1.0s",
    memoryLimit: "128 MB",
    description: "",
  });

  const [newTestCase, setNewTestCase] = useState({ input: "", output: "", isHidden: false });

  // Tab 2 States
  const [assignments, setAssignments] = useState(mockAssignments);
  const [assignForm, setAssignForm] = useState({
    problemId: "",
    batch: "All Batches",
    title: "",
    dueDate: "",
  });

  const fetchApiProblems = async () => {
    try {
      const res = await apiFetch("/admin/practice-problems");
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setProblems(res.data.map(p => ({
          id: p.id,
          title: p.title,
          topic: p.category || "General DSA",
          difficulty: p.difficulty || "Medium",
          xp: p.points || 100,
          companies: p.tags || ["Core DSA"],
          timeLimit: "1.0s",
          memoryLimit: "128 MB",
          description: "Solve the algorithmic coding challenge according to problem constraints.",
          testCases: [
            { id: 1, input: "Sample input", output: "Sample output", isHidden: false },
          ]
        })));
      }
    } catch (err) {
      console.error("Using default practice problems:", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchApiProblems();
    fetchBatches();
    const handleUpdate = async () => {
      const shared = await getSharedCodingTasks([]);
      setProblems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = shared.filter((s) => !existingIds.has(s.id));
        return [...newItems, ...prev];
      });
    };
    window.addEventListener(EVENTS.CODING_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.CODING_UPDATED, handleUpdate);
  }, []);

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!newProb.title.trim()) return;

    const created = {
      id: Date.now(),
      title: newProb.title,
      topic: newProb.topic,
      difficulty: newProb.difficulty,
      xp: Number(newProb.xp) || 50,
      companies: newProb.companies ? newProb.companies.split(",").map((c) => c.trim()) : ["Core DSA"],
      timeLimit: newProb.timeLimit,
      memoryLimit: newProb.memoryLimit,
      description: newProb.description,
      testCases: [],
    };

    await addSharedCodingTask(created);

    setProblems([created, ...problems]);
    setShowAddModal(false);
    setNewProb({
      title: "",
      topic: "Arrays & Hashing",
      difficulty: "Easy",
      xp: 50,
      companies: "",
      timeLimit: "1.0s",
      memoryLimit: "128 MB",
      description: "",
    });
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

    setProblems(updatedProblems);
    setSelectedProblem({
      ...selectedProblem,
      testCases: [...(selectedProblem.testCases || []), tc],
    });
    setNewTestCase({ input: "", output: "", isHidden: false });
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
        title="Coding Practice Management"
        description="Build algorithmic question banks, configure test cases, and assign coding tasks to student cohorts."
        action={
          <button className="admin-btn-add" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Coding Problem
          </button>
        }
      />

      {/* Workspace Tabs */}
      <div className="admin-users-filters" style={{ marginBottom: "20px" }}>
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
          <Send size={15} /> Assign to Cohort ({assignments.length})
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
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Problem Details</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>XP Points</th>
                  <th>Target Companies</th>
                  <th>Test Cases</th>
                  <th className="th-actions-right">Actions</th>
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
                      <div className="user-email-sub">{p.timeLimit} · {p.memoryLimit}</div>
                    </td>
                    <td><span className="user-dept-student">{p.topic}</span></td>
                    <td>
                      <Badge variant={p.difficulty === "Easy" ? "success" : p.difficulty === "Medium" ? "default" : "destructive"}>
                        {p.difficulty}
                      </Badge>
                    </td>
                    <td><span style={{ fontWeight: 800, color: "#4f46e5" }}>+{p.xp} XP</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {Array.isArray(p.companies) ? p.companies.map((c, i) => (
                          <span key={i} style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>
                            {c}
                          </span>
                        )) : "General"}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-table-action"
                        style={{ width: "auto", padding: "0 10px", gap: "6px", fontSize: "12px" }}
                        onClick={() => {
                          setSelectedProblem(p);
                          setShowTestCaseModal(true);
                        }}
                      >
                        <ListChecks size={13} /> {(p.testCases || []).length} Test Cases
                      </button>
                    </td>
                    <td>
                      <div className="action-btns-row action-btns-right">
                        <button
                          className="btn-table-action btn-table-action--delete"
                          onClick={() => setProblems(problems.filter((x) => x.id !== p.id))}
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
              Publish Task to Cohort
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
                <label>Target Cohort / Batch</label>
                <select
                  value={assignForm.batch}
                  onChange={(e) => setAssignForm({ ...assignForm, batch: e.target.value })}
                  className="form-select-admin"
                >
                  <option value="All Batches">All Batches (Universal)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
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

      {/* ─── ADD PROBLEM MODAL ──────────────────────────────────────────────── */}
      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-dialog" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Code size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Add New Coding Problem</h2>
                  <p className="modal-subtitle">Create algorithmic practice challenges for student cohorts.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProblem}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Problem Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Valid Palindrome"
                    value={newProb.title}
                    onChange={(e) => setNewProb({ ...newProb, title: e.target.value })}
                    className="form-input-admin"
                    autoFocus
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Topic / Category</label>
                    <input
                      type="text"
                      value={newProb.topic}
                      onChange={(e) => setNewProb({ ...newProb, topic: e.target.value })}
                      className="form-input-admin"
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Difficulty</label>
                    <select
                      value={newProb.difficulty}
                      onChange={(e) => setNewProb({ ...newProb, difficulty: e.target.value })}
                      className="form-select-admin"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>XP Points</label>
                    <input
                      type="number"
                      value={newProb.xp}
                      onChange={(e) => setNewProb({ ...newProb, xp: e.target.value })}
                      className="form-input-admin"
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Target Companies</label>
                    <input
                      type="text"
                      placeholder="TCS, Infosys, Wipro"
                      value={newProb.companies}
                      onChange={(e) => setNewProb({ ...newProb, companies: e.target.value })}
                      className="form-input-admin"
                    />
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Problem Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explain problem statement..."
                    value={newProb.description}
                    onChange={(e) => setNewProb({ ...newProb, description: e.target.value })}
                    className="form-input-admin"
                    style={{ height: "auto", padding: "10px", resize: "none" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Save Problem
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
                  <h2 className="modal-title">Test Cases: {selectedProblem.title}</h2>
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
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>Test Case #{idx + 1}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: tc.isHidden ? "#dc2626" : "#059669", background: tc.isHidden ? "#fee2e2" : "#d1fae5", padding: "2px 8px", borderRadius: "4px" }}>
                          {tc.isHidden ? "Hidden Test Case" : "Public Example"}
                        </span>
                      </div>
                      <div><strong>Input:</strong> <code>{tc.input}</code></div>
                      <div><strong>Expected Output:</strong> <code>{tc.output}</code></div>
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
