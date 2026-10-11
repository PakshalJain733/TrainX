import CustomSelect from "../../../components/ui/CustomSelect";
import { useState } from "react";
import { Code, Plus, Search, Filter, CheckCircle2, XCircle, Clock, Send, Eye, Edit, Trash2, Sparkles, BookOpen, Users, Check, X, FileCode, SlidersHorizontal, ChevronRight, AlertCircle, BarChart3, Layers, Calendar, Award, Terminal, RefreshCw } from "lucide-react";
import {
  initialCodingProblems,
  initialAssignments,
  initialSubmissions,
} from "../../../data/codingPracticeMockData";
import { coordinatorBatches } from "../../../data/coordinatorMockData";
import { CodingPerformance } from "./CO_Performances";
import "../Styles/CO_CodingPractice.css";

export default function CodingPractice() {
  const [activeTab, setActiveTab] = useState("problems"); // 'problems' | 'assign' | 'submissions' | 'performance'
  const [problems, setProblems] = useState(initialCodingProblems);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [submissions, setSubmissions] = useState(initialSubmissions);

  // Search & Filters
  const [problemSearch, setProblemSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const [submissionSearch, setSubmissionSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");

  // Modals state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);

  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [selectedProblemForTestCases, setSelectedProblemForTestCases] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProblemToAssign, setSelectedProblemToAssign] = useState(null);

  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState(null);

  // Form State for Problem (Create/Edit)
  const [problemForm, setProblemForm] = useState({
    title: "",
    topic: "",
    difficulty: "Easy",
    points: "",
    timeLimit: "",
    memoryLimit: "",
    description: "",
    inputFormat: "",
    outputFormat: "",
    sampleInput: "",
    sampleOutput: "",
    tags: "",
    companies: "",
  });

  // Form State for Assignment
  const [assignForm, setAssignForm] = useState({
    problemId: "",
    department: "Computer Science",
    batch: "All Batches",

    batch: "CSE 2026 Alpha Batch",

    dueDate: "",
    scoreWeightage: 100,
    instructions: "",
  });

  // Form State for Test Case creation
  const [newTestCase, setNewTestCase] = useState({
    input: "",
    expectedOutput: "",
    isHidden: false,
    description: "",
  });

  // Unique Topics
  const topicsList = [
    "All",
    "Arrays & Hashing",
    "Sliding Window",
    "Linked List",
    "Trees & Graphs",
    "Heap / Priority Queue",
    "Dynamic Programming",
  ];

  // Filtered Problems
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
      p.topic.toLowerCase().includes(problemSearch.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    const matchesTopic = topicFilter === "All" || p.topic === topicFilter;
    return matchesSearch && matchesDiff && matchesTopic;
  });

  // Filtered Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      sub.rollNo.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      sub.problemTitle.toLowerCase().includes(submissionSearch.toLowerCase());
    const matchesVerdict = verdictFilter === "All" || sub.status === verdictFilter;
    const matchesBatch = batchFilter === "All" || sub.batch === batchFilter;
    return matchesSearch && matchesVerdict && matchesBatch;
  });

  // Handle Save Problem
  const handleSaveProblem = (e) => {
    e.preventDefault();
    if (!problemForm.title.trim()) return;

    if (editingProblem) {
      setProblems((prev) =>
        prev.map((p) =>
          p.id === editingProblem.id
            ? {
                ...p,
                ...problemForm,
                tags: problemForm.tags.split(",").map((t) => t.trim()),
                companies: problemForm.companies.split(",").map((c) => c.trim()),
              }
            : p
        )
      );
    } else {
      const newId = `prob-${String(problems.length + 1).padStart(3, "0")}`;
      const created = {
        id: newId,
        ...problemForm,
        tags: problemForm.tags.split(",").map((t) => t.trim()),
        companies: problemForm.companies.split(",").map((c) => c.trim()),
        status: "Active",
        createdDate: new Date().toISOString().split("T")[0],
        createdBy: "Coordinator Workspace",
        college: "Apex Institute of Technology",
        acceptanceRate: "100%",
        totalSubmissions: 0,
        testCases: [
          {
            id: `tc-${Date.now()}`,
            input: problemForm.sampleInput,
            expectedOutput: problemForm.sampleOutput,
            isHidden: false,
            description: "Sample test case",
          },
        ],
        starterCode: {
          python: "def solution():\n    pass",
          cpp: "#include <iostream>\nusing namespace std;\nint main() { return 0; }",
        },
      };
      setProblems([created, ...problems]);
    }

    setIsProblemModalOpen(false);
    setEditingProblem(null);
    resetProblemForm();
  };

  const resetProblemForm = () => {
    setProblemForm({
      title: "",
      topic: "Arrays & Hashing",
      difficulty: "Easy",
      points: 100,
      timeLimit: "1.0s",
      memoryLimit: "256MB",
      description: "",
      inputFormat: "",
      outputFormat: "",
      sampleInput: "",
      sampleOutput: "",
      tags: "Array, Hash Table",
      companies: "TCS, Infosys",
    });
  };

  const handleEditClick = (p) => {
    setEditingProblem(p);
    setProblemForm({
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      points: p.points,
      timeLimit: p.timeLimit,
      memoryLimit: p.memoryLimit,
      description: p.description,
      inputFormat: p.inputFormat || "",
      outputFormat: p.outputFormat || "",
      sampleInput: p.sampleInput || "",
      sampleOutput: p.sampleOutput || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
      companies: Array.isArray(p.companies) ? p.companies.join(", ") : (p.companies || ""),
    });
    setIsProblemModalOpen(true);
  };

  const handleDeleteProblem = (id) => {
    if (window.confirm("Are you sure you want to delete this coding problem?")) {
      setProblems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Add Test Case to Selected Problem
  const handleAddTestCase = (e) => {
    e.preventDefault();
    if (!newTestCase.input.trim() || !newTestCase.expectedOutput.trim()) return;

    const tcObj = {
      id: `tc-${Date.now()}`,
      ...newTestCase,
    };

    setProblems((prev) =>
      prev.map((p) =>
        p.id === selectedProblemForTestCases.id
          ? { ...p, testCases: [...(p.testCases || []), tcObj] }
          : p
      )
    );

    setSelectedProblemForTestCases((prev) => ({
      ...prev,
      testCases: [...(prev.testCases || []), tcObj],
    }));

    setNewTestCase({ input: "", expectedOutput: "", isHidden: false, description: "" });
  };

  const handleDeleteTestCase = (problemId, tcId) => {
    setProblems((prev) =>
      prev.map((p) =>
        p.id === problemId
          ? { ...p, testCases: p.testCases.filter((tc) => tc.id !== tcId) }
          : p
      )
    );
    setSelectedProblemForTestCases((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((tc) => tc.id !== tcId),
    }));
  };

  // Assign Problem Submit
  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const prob = problems.find((p) => p.id === assignForm.problemId);
    if (!prob) return;

    const newAssign = {
      id: `assign-${Date.now()}`,
      problemId: prob.id,
      problemTitle: prob.title,
      difficulty: prob.difficulty,
      department: assignForm.department,
      batch: assignForm.batch,
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: assignForm.dueDate || "2026-09-20",
      totalStudents: 120,
      submittedCount: 0,
      passCount: 0,
      scoreWeightage: Number(assignForm.scoreWeightage),
      instructions: assignForm.instructions || "Solve & submit solution before deadline.",
      status: "Active",
    };

    setAssignments([newAssign, ...assignments]);
    setIsAssignModalOpen(false);
    setAssignForm({
      problemId: "",
      department: "Computer Science",
      batch: "All Batches",

      batch: "CSE 2026 Alpha Batch",

      dueDate: "",
      scoreWeightage: 100,
      instructions: "",
    });
  };

  const openAssignModalForProblem = (p) => {
    setAssignForm((prev) => ({ ...prev, problemId: p.id }));
    setSelectedProblemToAssign(p);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="coord-cp-container">
      {/* Header Banner */}
      <div className="coord-cp-header">
        <div className="coord-cp-header-info">
          <h1 className="coord-cp-title">
            Coding Practice & Assignment Governance
          </h1>
          <p className="coord-cp-subtitle">
            Create coding problems, manage test cases, assign practice tracks to departments/batches, and track real-time student submissions & performance.
          </p>
        </div>
        <div className="coord-cp-header-actions">
          <button
            onClick={() => {
              setEditingProblem(null);
              resetProblemForm();
              setIsProblemModalOpen(true);
            }}
            className="coord-cp-btn-primary"
          >
            <Plus size={16} />
            Create Coding Problem
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="coord-cp-btn-dark"
          >
            <Send size={15} />
            Assign Practice to Batch
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="coord-cp-tabs-bar">
        <div className="coord-cp-tabs-list">
          <button
            onClick={() => setActiveTab("problems")}
            className={`coord-cp-tab-btn ${activeTab === "problems" ? "active" : ""}`}
          >
            <Code size={18} />
            <span>Problem Bank ({problems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className={`coord-cp-tab-btn ${activeTab === "assign" ? "active" : ""}`}
          >
            <Send size={18} />
            <span>Assigned Practice Queue ({assignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`coord-cp-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
          >
            <Terminal size={18} />
            <span>Student Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`coord-cp-tab-btn ${activeTab === "performance" ? "active" : ""}`}
          >
            <BarChart3 size={18} />
            <span>Performance & Diagnostics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROBLEMS BANK & MANAGEMENT */}
      {activeTab === "problems" && (
        <div className="coord-cp-container">
          {/* Filter Bar */}
          <div className="coord-cp-filter-bar">
            <div className="coord-cp-search-box">
              <Search size={16} className="coord-cp-search-icon" />
              <input
                type="text"
                placeholder="Search by title or topic..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="coord-cp-search-input"
              />
            </div>

            <div className="coord-cp-filter-controls">
              <div className="coord-cp-filter-label">
                <SlidersHorizontal size={14} />
                <span>Filters:</span>
              </div>

              <CustomSelect
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                options={[
                  { value: "All", label: "All Difficulties" },
                  { value: "Easy", label: "Easy" },
                  { value: "Medium", label: "Medium" },
                  { value: "Hard", label: "Hard" },
                ]}
              />

              <CustomSelect
                value={topicFilter}
                onChange={setTopicFilter}
                options={topicsList.map((t) => ({ value: t, label: t }))}
              />

              <button
                onClick={() => {
                  setProblemSearch("");
                  setDifficultyFilter("All");
                  setTopicFilter("All");
                }}
                className="coord-cp-btn-reset"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Problems Table */}
          <div className="coord-cp-card">
            <div className="coord-cp-card-header">
              <h3 className="coord-cp-card-title">
                Department Coding Problem Bank ({filteredProblems.length})
              </h3>
              <span className="coord-cp-card-hint">Manage problem definitions, starter code & test suites</span>
            </div>

            <div className="coord-cp-table-wrapper">
              <table className="coord-cp-table">
                <thead>
                  <tr>
                    <th>Problem & Topic</th>
                    <th>Difficulty</th>
                    <th>Points & Limits</th>
                    <th>Test Cases</th>
                    <th>Acceptance Rate</th>
                    <th>Target Companies</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((prob) => (
                    <tr key={prob.id}>
                      <td>
                        <div>
                          <p className="coord-cp-problem-title">{prob.title}</p>
                          <div className="coord-cp-problem-meta">
                            <span className="coord-cp-topic-tag">
                              {prob.topic}
                            </span>
                            <span className="coord-cp-problem-id">{prob.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`coord-cp-diff-badge ${
                            prob.difficulty === "Easy"
                              ? "diff-easy"
                              : prob.difficulty === "Medium"
                              ? "diff-medium"
                              : "diff-hard"
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>

                      <td>
                        <div>
                          <p className="coord-cp-points-text">+{prob.points} XP</p>
                          <p className="coord-cp-limits-text">
                            {prob.timeLimit} · {prob.memoryLimit}
                          </p>
                        </div>
                      </td>

                      <td>
                        <button
                          onClick={() => {
                            setSelectedProblemForTestCases(prob);
                            setIsTestCaseModalOpen(true);
                          }}
                          className="coord-cp-tc-btn"
                        >
                          <FileCode size={14} />
                          <span>{prob.testCases ? prob.testCases.length : 0} Cases</span>
                        </button>
                      </td>

                      <td>
                        <div>
                          <p className="coord-cp-points-text">{prob.acceptanceRate}</p>
                          <p className="coord-cp-limits-text">{prob.totalSubmissions} attempts</p>
                        </div>
                      </td>

                      <td>
                        <div className="coord-cp-company-tags">
                          {prob.companies &&
                            prob.companies.slice(0, 3).map((comp, idx) => (
                              <span
                                key={idx}
                                className="coord-cp-company-tag"
                              >
                                {comp}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="text-right">
                        <div className="coord-cp-row-actions">
                          <button
                            onClick={() => openAssignModalForProblem(prob)}
                            className="coord-cp-action-btn btn-assign"
                            title="Assign to Batch"
                          >
                            <Send size={15} />
                          </button>
                          <button
                            onClick={() => handleEditClick(prob)}
                            className="coord-cp-action-btn btn-edit"
                            title="Edit Problem"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProblem(prob.id)}
                            className="coord-cp-action-btn btn-delete"
                            title="Delete Problem"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProblems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="coord-cp-empty-table-cell">
                        No coding problems match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED PRACTICE QUEUE */}
      {activeTab === "assign" && (
        <div className="coord-cp-container">
          <div className="coord-cp-assign-banner">
            <div>
              <h3 className="coord-cp-banner-title">Active Department Practice Assignments</h3>
              <p className="coord-cp-banner-desc">
                Monitor coding problem deadlines, submission rates, and pass ratios per student batch.
              </p>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="coord-cp-btn-primary"
            >
              <Plus size={15} /> Assign New Problem
            </button>
          </div>

          <div className="coord-cp-assignments-grid">
            {assignments.map((asgn) => (
              <div
                key={asgn.id}
                className="coord-cp-assignment-card"
              >
                <div>
                  <div className="coord-cp-card-top-meta">
                    <span
                      className={`coord-cp-status-badge ${
                        asgn.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {asgn.status}
                    </span>
                    <span className="coord-cp-due-text">Due: {asgn.dueDate}</span>
                  </div>

                  <h4 className="coord-cp-assignment-title">{asgn.problemTitle}</h4>
                  <p className="coord-cp-assignment-batch">
                    {asgn.batch} ({asgn.department})
                  </p>

                  <p className="coord-cp-assignment-instructions">
                    {asgn.instructions}
                  </p>
                </div>

                <div className="coord-cp-assignment-progress-section">
                  <div className="coord-cp-progress-labels">
                    <span>Submission Progress</span>
                    <strong>
                      {asgn.submittedCount} / {asgn.totalStudents} ({Math.round((asgn.submittedCount / asgn.totalStudents) * 100)}%)
                    </strong>
                  </div>

                  <div className="coord-cp-progress-track">
                    <div
                      className="coord-cp-progress-fill"
                      style={{ width: `${(asgn.submittedCount / asgn.totalStudents) * 100}%` }}
                    />
                  </div>

                  <div className="coord-cp-progress-footer">
                    <span className="coord-cp-pass-count">
                      {asgn.passCount} Students Passed
                    </span>
                    <button
                      onClick={() => {
                        setBatchFilter(asgn.batch);
                        setActiveTab("submissions");
                      }}
                      className="coord-cp-view-sub-btn"
                    >
                      View Submissions <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT SUBMISSIONS LOG */}
      {activeTab === "submissions" && (
        <div className="coord-cp-container">
          {/* Submissions Filter */}
          <div className="coord-cp-filter-bar">
            <div className="coord-cp-search-box">
              <Search size={16} className="coord-cp-search-icon" />
              <input
                type="text"
                placeholder="Search student, roll no, problem..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="coord-cp-search-input"
              />
            </div>

            <div className="coord-cp-filter-controls">
              <CustomSelect
                value={verdictFilter}
                onChange={setVerdictFilter}
                options={[
                  { value: "All", label: "All Verdicts" },
                  { value: "Accepted", label: "Accepted" },
                  { value: "Wrong Answer", label: "Wrong Answer" },
                  { value: "Time Limit Exceeded", label: "Time Limit Exceeded" },
                ]}
              />

              <CustomSelect
                value={batchFilter}
                onChange={setBatchFilter}
                options={[
                  { value: "All", label: "All Batches" },
                  ...coordinatorBatches.map((b) => ({ value: b.name, label: b.name })),
                ]}
              />

              <button
                onClick={() => {
                  setSubmissionSearch("");
                  setVerdictFilter("All");
                  setBatchFilter("All");
                }}
                className="coord-cp-btn-reset"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="coord-cp-card">
            <div className="coord-cp-card-header">
              <h3 className="coord-cp-card-title">
                Live Submissions Log ({filteredSubmissions.length})
              </h3>
              <span className="coord-cp-card-hint">Real-time compiler results & verdict breakdowns</span>
            </div>

            <div className="coord-cp-table-wrapper">
              <table className="coord-cp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Problem</th>
                    <th>Language</th>
                    <th>Verdict</th>
                    <th>Test Cases Passed</th>
                    <th>Runtime / Mem</th>
                    <th className="text-right">Submitted Code</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div>
                          <p className="coord-cp-student-name">{sub.studentName}</p>
                          <p className="coord-cp-student-roll">{sub.rollNo}</p>
                        </div>
                      </td>

                      <td>{sub.batch}</td>

                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{sub.problemTitle}</td>

                      <td>
                        <span className="coord-cp-lang-text">{sub.language}</span>
                      </td>

                      <td>
                        <span
                          className={`coord-cp-verdict-badge ${
                            sub.status === "Accepted"
                              ? "verdict-accepted"
                              : sub.status === "Time Limit Exceeded"
                              ? "verdict-tle"
                              : "verdict-wrong"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {sub.passedTestCases} / {sub.totalTestCases}
                      </td>

                      <td>
                        <span className="coord-cp-runtime-text">
                          {sub.runtime} · {sub.memory}
                        </span>
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => setSelectedSubmissionCode(sub)}
                          className="coord-cp-view-code-btn"
                        >
                          <Eye size={14} /> View Code
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="coord-cp-empty-table-cell">
                        No submissions match your active filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE & DIAGNOSTICS */}
      {activeTab === "performance" && <CodingPerformance />}

      {/* MODAL 1: CREATE / EDIT CODING PROBLEM */}
      {isProblemModalOpen && (
        <div className="coord-cp-modal-backdrop">
          <div className="coord-cp-modal-window">
            <div className="coord-cp-modal-header">
              <div className="coord-cp-modal-title-group">
                <Code size={20} className="coord-cp-modal-title-icon" />
                <h3 className="coord-cp-modal-title">
                  {editingProblem ? "Edit Coding Problem" : "Create New Coding Problem"}
                </h3>
              </div>
              <button
                onClick={() => setIsProblemModalOpen(false)}
                className="coord-cp-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="coord-cp-modal-body">
              <div className="coord-cp-form-grid-2">
                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Problem Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Two Sum Target Index Pair"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Topic Category *</label>
                  <CustomSelect
                    value={problemForm.topic}
                    onChange={(val) => setProblemForm({ ...problemForm, topic: val })}
                    options={topicsList.filter((t) => t !== "All").map((t) => ({ value: t, label: t }))}
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Difficulty Level</label>
                  <CustomSelect
                    value={problemForm.difficulty}
                    onChange={(val) => setProblemForm({ ...problemForm, difficulty: val })}
                    options={[
                      { value: "Easy", label: "Easy" },
                      { value: "Medium", label: "Medium" },
                      { value: "Hard", label: "Hard" },
                    ]}
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={problemForm.dueDate || ""}
                    onChange={(e) => setProblemForm({ ...problemForm, dueDate: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">XP Points</label>
                  <input
                    type="number"
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Time Limit</label>
                  <input
                    type="text"
                    value={problemForm.timeLimit}
                    onChange={(e) => setProblemForm({ ...problemForm, timeLimit: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Memory Limit</label>
                  <input
                    type="text"
                    value={problemForm.memoryLimit}
                    onChange={(e) => setProblemForm({ ...problemForm, memoryLimit: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>
              </div>

              <div className="coord-cp-form-group">
                <label className="coord-cp-form-label">Problem Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the problem, constraints, and requirements..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="coord-cp-form-textarea"
                />
              </div>

              <div className="coord-cp-form-grid-2">
                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Sample Input</label>
                  <textarea
                    rows={2}
                    placeholder="2 7 11 15\n9"
                    value={problemForm.sampleInput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleInput: e.target.value })}
                    className="coord-cp-form-textarea font-mono"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Sample Output</label>
                  <textarea
                    rows={2}
                    placeholder="0 1"
                    value={problemForm.sampleOutput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleOutput: e.target.value })}
                    className="coord-cp-form-textarea font-mono"
                  />
                </div>
              </div>

              <div className="coord-cp-form-grid-2">
                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Array, Hash Table"
                    value={problemForm.tags}
                    onChange={(e) => setProblemForm({ ...problemForm, tags: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Companies (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="TCS, Infosys, Amazon"
                    value={problemForm.companies}
                    onChange={(e) => setProblemForm({ ...problemForm, companies: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>
              </div>

              <div className="coord-cp-form-footer">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="coord-cp-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-cp-btn-primary"
                >
                  {editingProblem ? "Update Problem" : "Save Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE TEST CASES */}
      {isTestCaseModalOpen && selectedProblemForTestCases && (
        <div className="coord-cp-modal-backdrop">
          <div className="coord-cp-modal-window">
            <div className="coord-cp-modal-header">
              <div>
                <h3 className="coord-cp-modal-title">Manage Test Cases</h3>
                <p className="coord-cp-modal-subtitle">{selectedProblemForTestCases.title}</p>
              </div>
              <button
                onClick={() => setIsTestCaseModalOpen(false)}
                className="coord-cp-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="coord-cp-modal-body">
              {/* Add Test Case Form */}
              <form onSubmit={handleAddTestCase} className="coord-cp-tc-add-box">
                <h4 className="coord-cp-tc-box-title">
                  <Plus size={14} style={{ color: "#4f46e5" }} /> Add New Test Case
                </h4>

                <div className="coord-cp-form-grid-2">
                  <div className="coord-cp-form-group">
                    <label className="coord-cp-form-label">Input Data *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Input format..."
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                      className="coord-cp-form-textarea font-mono"
                    />
                  </div>

                  <div className="coord-cp-form-group">
                    <label className="coord-cp-form-label">Expected Output *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Expected output format..."
                      value={newTestCase.expectedOutput}
                      onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                      className="coord-cp-form-textarea font-mono"
                    />
                  </div>
                </div>

                <div className="coord-cp-tc-checkbox-row">
                  <label className="coord-cp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newTestCase.isHidden}
                      onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                    />
                    <span>Hidden Test Case (Used for evaluation only)</span>
                  </label>

                  <button
                    type="submit"
                    className="coord-cp-btn-primary"
                  >
                    Add Test Case
                  </button>
                </div>
              </form>

              {/* Existing Test Cases List */}
              <div>
                <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "12px", fontSize: "13px" }}>
                  Existing Test Suite ({selectedProblemForTestCases.testCases ? selectedProblemForTestCases.testCases.length : 0})
                </h4>

                <div>
                  {selectedProblemForTestCases.testCases && selectedProblemForTestCases.testCases.map((tc, idx) => (
                    <div key={tc.id} className="coord-cp-tc-list-item">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>Case #{idx + 1}</span>
                          <span
                            className={`coord-cp-tc-badge ${
                              tc.isHidden ? "hidden-tc" : "public-tc"
                            }`}
                          >
                            {tc.isHidden ? "Hidden" : "Public"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontFamily: "monospace", color: "#475569", fontSize: "11.5px" }}>
                          <strong>Input:</strong> {tc.input} | <strong>Output:</strong> {tc.expectedOutput}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteTestCase(selectedProblemForTestCases.id, tc.id)}
                        className="coord-cp-action-btn btn-delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN PRACTICE TO BATCH */}
      {isAssignModalOpen && (
        <div className="coord-cp-modal-backdrop">
          <div className="coord-cp-modal-window size-md">
            <div className="coord-cp-modal-header">
              <div className="coord-cp-modal-title-group">
                <Send size={18} className="coord-cp-modal-title-icon" />
                <h3 className="coord-cp-modal-title">Assign Coding Practice to Batch</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="coord-cp-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="coord-cp-modal-body">
              <div className="coord-cp-form-group">
                <label className="coord-cp-form-label">Select Coding Problem *</label>
                <CustomSelect
                  value={assignForm.problemId}
                  onChange={(val) => setAssignForm({ ...assignForm, problemId: val })}
                  placeholder="-- Choose Problem --"
                  options={problems.map((p) => ({
                    value: p.id,
                    label: `${p.title} (${p.difficulty} · ${p.topic})`,
                  }))}
                />
              </div>

              <div className="coord-cp-form-grid-2">
                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Department</label>
                  <CustomSelect
                    value={assignForm.department}
                    onChange={(val) => setAssignForm({ ...assignForm, department: val })}
                    options={[
                      { value: "Computer Science", label: "Computer Science" },
                      { value: "Information Technology", label: "Information Technology" },
                      { value: "AI & DS", label: "AI & DS" },
                      { value: "ECE", label: "ECE" },
                    ]}
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Target Batch *</label>
                  <CustomSelect
                    value={assignForm.batch}
                    onChange={(val) => setAssignForm({ ...assignForm, batch: val })}
                    options={coordinatorBatches.map((b) => ({ value: b.name, label: b.name }))}
                  />
                </div>
              </div>

              <div className="coord-cp-form-grid-2">
                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>

                <div className="coord-cp-form-group">
                  <label className="coord-cp-form-label">Score Weightage (XP)</label>
                  <input
                    type="number"
                    value={assignForm.scoreWeightage}
                    onChange={(e) => setAssignForm({ ...assignForm, scoreWeightage: e.target.value })}
                    className="coord-cp-form-input"
                  />
                </div>
              </div>

              <div className="coord-cp-form-group">
                <label className="coord-cp-form-label">Special Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Instructions for students (e.g. time complexity constraint, recursion requirements)..."
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  className="coord-cp-form-textarea"
                />
              </div>

              <div className="coord-cp-form-footer">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="coord-cp-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-cp-btn-primary"
                >
                  Assign to Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW SUBMITTED CODE */}
      {selectedSubmissionCode && (
        <div className="coord-cp-modal-backdrop">
          <div className="coord-cp-modal-window dark-theme">
            <div className="coord-cp-modal-header" style={{ borderBottom: "1px solid #1e293b" }}>
              <div>
                <h3 className="coord-cp-modal-title">
                  Submitted Code: {selectedSubmissionCode.studentName}
                </h3>
                <p className="coord-cp-modal-subtitle">
                  {selectedSubmissionCode.problemTitle} · {selectedSubmissionCode.language}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionCode(null)}
                className="coord-cp-modal-close-btn"
              >
                <X size={16} />
              </button>
            </div>

            <div className="coord-cp-modal-body">
              <div className="coord-cp-code-status-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className={`coord-cp-verdict-badge ${
                      selectedSubmissionCode.status === "Accepted"
                        ? "verdict-accepted"
                        : "verdict-wrong"
                    }`}
                  >
                    {selectedSubmissionCode.status}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>
                    Passed: {selectedSubmissionCode.passedTestCases}/{selectedSubmissionCode.totalTestCases}
                  </span>
                </div>
                <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>
                  {selectedSubmissionCode.runtime} | {selectedSubmissionCode.memory}
                </span>
              </div>

              <div className="coord-cp-code-preview-block">
                <pre>{selectedSubmissionCode.codeSnippet}</pre>
              </div>
            </div>

            <div className="coord-cp-form-footer" style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", borderTop: "1px solid #1e293b", padding: "12px 24px" }}>
              <button
                onClick={() => setSelectedSubmissionCode(null)}
                className="coord-cp-btn-primary"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
