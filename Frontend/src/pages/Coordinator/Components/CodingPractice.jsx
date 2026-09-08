import { useState } from "react";
import {
  Code,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  BookOpen,
  Users,
  Check,
  X,
  FileCode,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Layers,
  Calendar,
  Award,
  Terminal,
  RefreshCw,
} from "lucide-react";
import {
  initialCodingProblems,
  initialAssignments,
  initialSubmissions,
} from "../../../data/codingPracticeMockData";
import { coordinatorBatches } from "../../../data/coordinatorMockData";
import CodingPerformance from "./CodingPerformance";

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

  // Form State for Assignment
  const [assignForm, setAssignForm] = useState({
    problemId: "",
    department: "Computer Science",
    batch: "CSE 2026 Alpha Cohort",
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
      tags: p.tags ? p.tags.join(", ") : "",
      companies: p.companies ? p.companies.join(", ") : "",
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
      batch: "CSE 2026 Alpha Cohort",
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Coding Practice & Assignment Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Create coding problems, manage test cases, assign practice tracks to departments/batches, and track real-time student submissions & performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setEditingProblem(null);
              resetProblemForm();
              setIsProblemModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus size={16} />
            Create Coding Problem
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Send size={15} />
            Assign Practice to Batch
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-2xl px-4 pt-3 shadow-xs">
        <div className="flex items-center gap-6 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab("problems")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "problems"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code size={18} />
            <span>Problem Bank ({problems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "assign"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send size={18} />
            <span>Assigned Practice Queue ({assignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "submissions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Terminal size={18} />
            <span>Student Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "performance"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={18} />
            <span>Performance & Diagnostics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROBLEMS BANK & MANAGEMENT */}
      {activeTab === "problems" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or topic..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <SlidersHorizontal size={14} />
                <span>Filters:</span>
              </div>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                {topicsList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setProblemSearch("");
                  setDifficultyFilter("All");
                  setTopicFilter("All");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Problems Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Department Coding Problem Bank ({filteredProblems.length})
              </h3>
              <span className="text-xs text-slate-500">Manage problem definitions, starter code & test suites</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3.5 px-6">Problem & Topic</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4">Points & Limits</th>
                    <th className="py-3.5 px-4">Test Cases</th>
                    <th className="py-3.5 px-4">Acceptance Rate</th>
                    <th className="py-3.5 px-4">Target Companies</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProblems.map((prob) => (
                    <tr key={prob.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{prob.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                              {prob.topic}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{prob.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            prob.difficulty === "Easy"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : prob.difficulty === "Medium"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">+{prob.points} XP</p>
                          <p className="text-[10px] text-slate-400">
                            {prob.timeLimit} · {prob.memoryLimit}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => {
                            setSelectedProblemForTestCases(prob);
                            setIsTestCaseModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-semibold transition"
                        >
                          <FileCode size={14} />
                          <span>{prob.testCases ? prob.testCases.length : 0} Cases</span>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">{prob.acceptanceRate}</p>
                          <p className="text-[10px] text-slate-400">{prob.totalSubmissions} attempts</p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prob.companies &&
                            prob.companies.slice(0, 3).map((comp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                              >
                                {comp}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAssignModalForProblem(prob)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            title="Assign to Batch"
                          >
                            <Send size={15} />
                          </button>
                          <button
                            onClick={() => handleEditClick(prob)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                            title="Edit Problem"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProblem(prob.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
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
                      <td colSpan={7} className="py-10 text-center text-slate-400">
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
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Department Practice Assignments</h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitor coding problem deadlines, submission rates, and pass ratios per student batch.
              </p>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus size={15} /> Assign New Problem
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((asgn) => (
              <div
                key={asgn.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        asgn.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {asgn.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Due: {asgn.dueDate}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">{asgn.problemTitle}</h4>
                  <p className="text-xs text-indigo-600 font-medium mt-1">
                    {asgn.batch} ({asgn.department})
                  </p>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {asgn.instructions}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Submission Progress</span>
                    <span className="font-bold text-slate-900">
                      {asgn.submittedCount} / {asgn.totalStudents} ({Math.round((asgn.submittedCount / asgn.totalStudents) * 100)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(asgn.submittedCount / asgn.totalStudents) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-emerald-600">
                      {asgn.passCount} Students Passed
                    </span>
                    <button
                      onClick={() => {
                        setBatchFilter(asgn.batch);
                        setActiveTab("submissions");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
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
        <div className="space-y-6">
          {/* Submissions Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, roll no, problem..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="All">All Verdicts</option>
                <option value="Accepted">Accepted</option>
                <option value="Wrong Answer">Wrong Answer</option>
                <option value="Time Limit Exceeded">Time Limit Exceeded</option>
              </select>

              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="All">All Batches</option>
                {coordinatorBatches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSubmissionSearch("");
                  setVerdictFilter("All");
                  setBatchFilter("All");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Live Submissions Log ({filteredSubmissions.length})
              </h3>
              <span className="text-xs text-slate-500">Real-time compiler results & verdict breakdowns</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Problem</th>
                    <th className="py-3.5 px-4">Language</th>
                    <th className="py-3.5 px-4">Verdict</th>
                    <th className="py-3.5 px-4">Test Cases Passed</th>
                    <th className="py-3.5 px-4">Runtime / Mem</th>
                    <th className="py-3.5 px-6 text-right">Submitted Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{sub.studentName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{sub.rollNo}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">{sub.batch}</td>

                      <td className="py-4 px-4 font-semibold text-slate-800">{sub.problemTitle}</td>

                      <td className="py-4 px-4 font-mono text-indigo-600 font-semibold">{sub.language}</td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            sub.status === "Accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : sub.status === "Time Limit Exceeded"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {sub.passedTestCases} / {sub.totalTestCases}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                        {sub.runtime} · {sub.memory}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedSubmissionCode(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-700 font-semibold transition"
                        >
                          <Eye size={14} /> View Code
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={20} className="text-indigo-400" />
                <h3 className="text-lg font-bold">
                  {editingProblem ? "Edit Coding Problem" : "Create New Coding Problem"}
                </h3>
              </div>
              <button
                onClick={() => setIsProblemModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Problem Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Two Sum Target Index Pair"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic Category *</label>
                  <select
                    value={problemForm.topic}
                    onChange={(e) => setProblemForm({ ...problemForm, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {topicsList.filter((t) => t !== "All").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Difficulty Level</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">XP Points</label>
                  <input
                    type="number"
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Limit</label>
                  <input
                    type="text"
                    value={problemForm.timeLimit}
                    onChange={(e) => setProblemForm({ ...problemForm, timeLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Memory Limit</label>
                  <input
                    type="text"
                    value={problemForm.memoryLimit}
                    onChange={(e) => setProblemForm({ ...problemForm, memoryLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Problem Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the problem, constraints, and requirements..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sample Input</label>
                  <textarea
                    rows={2}
                    placeholder="2 7 11 15\n9"
                    value={problemForm.sampleInput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleInput: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sample Output</label>
                  <textarea
                    rows={2}
                    placeholder="0 1"
                    value={problemForm.sampleOutput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleOutput: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Array, Hash Table"
                    value={problemForm.tags}
                    onChange={(e) => setProblemForm({ ...problemForm, tags: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Companies (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="TCS, Infosys, Amazon"
                    value={problemForm.companies}
                    onChange={(e) => setProblemForm({ ...problemForm, companies: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Manage Test Cases</h3>
                <p className="text-xs text-slate-400">{selectedProblemForTestCases.title}</p>
              </div>
              <button
                onClick={() => setIsTestCaseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Add Test Case Form */}
              <form onSubmit={handleAddTestCase} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Plus size={14} className="text-indigo-600" /> Add New Test Case
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Input Data *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Input format..."
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expected Output *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Expected output format..."
                      value={newTestCase.expectedOutput}
                      onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={newTestCase.isHidden}
                      onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Hidden Test Case (Used for evaluation only)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                  >
                    Add Test Case
                  </button>
                </div>
              </form>

              {/* Existing Test Cases List */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">
                  Existing Test Suite ({selectedProblemForTestCases.testCases ? selectedProblemForTestCases.testCases.length : 0})
                </h4>

                <div className="space-y-3">
                  {selectedProblemForTestCases.testCases && selectedProblemForTestCases.testCases.map((tc, idx) => (
                    <div key={tc.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Case #{idx + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              tc.isHidden ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {tc.isHidden ? "Hidden" : "Public"}
                          </span>
                        </div>
                        <p className="font-mono text-slate-600 text-[11px]">
                          <strong>Input:</strong> {tc.input} | <strong>Output:</strong> {tc.expectedOutput}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteTestCase(selectedProblemForTestCases.id, tc.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold">Assign Coding Practice to Batch</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Coding Problem *</label>
                <select
                  required
                  value={assignForm.problemId}
                  onChange={(e) => setAssignForm({ ...assignForm, problemId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Problem --</option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.difficulty} · {p.topic})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={assignForm.department}
                    onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="AI & DS">AI & DS</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Batch *</label>
                  <select
                    value={assignForm.batch}
                    onChange={(e) => setAssignForm({ ...assignForm, batch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    {coordinatorBatches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Score Weightage (XP)</label>
                  <input
                    type="number"
                    value={assignForm.scoreWeightage}
                    onChange={(e) => setAssignForm({ ...assignForm, scoreWeightage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Special Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Instructions for students (e.g. time complexity constraint, recursion requirements)..."
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Submitted Code: {selectedSubmissionCode.studentName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSubmissionCode.problemTitle} · {selectedSubmissionCode.language}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionCode(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      selectedSubmissionCode.status === "Accepted"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {selectedSubmissionCode.status}
                  </span>
                  <span className="text-slate-300">
                    Passed: {selectedSubmissionCode.passedTestCases}/{selectedSubmissionCode.totalTestCases}
                  </span>
                </div>
                <span className="font-mono text-slate-400">
                  {selectedSubmissionCode.runtime} | {selectedSubmissionCode.memory}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                <pre>{selectedSubmissionCode.codeSnippet}</pre>
              </div>
            </div>

            <div className="bg-slate-800/40 px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSubmissionCode(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl"
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
