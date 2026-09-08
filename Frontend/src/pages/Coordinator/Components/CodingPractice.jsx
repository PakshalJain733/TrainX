import React, { useState } from "react";
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
} from "lucide-react";
import {
  initialCodingProblems,
  activeAssignments as mockAssignments,
  studentSubmissions as mockSubmissions,
} from "../../../data/codingPracticeMockData";
import "../../Admin/Styles/AdminUsers.css";
import "../Styles/Assessments.css";

export default function CoordinatorCodingPractice() {
  const [activeTab, setActiveTab] = useState("bank");

  // Tab 1 States
  const [problems, setProblems] = useState(initialCodingProblems);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const [newProb, setNewProb] = useState({
    title: "",
    topic: "Arrays",
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
    department: "Computer Science",
    batch: "CSE 2026 Alpha Cohort",
    dueDate: "",
    weightage: "10 Marks",
    instructions: "",
  });
  const [assignSuccessMsg, setAssignSuccessMsg] = useState("");

  // Tab 3 States
  const [submissions] = useState(mockSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Filtered problems
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const handleCreateProblem = (e) => {
    e.preventDefault();
    const created = {
      id: `prob-${Date.now()}`,
      title: newProb.title,
      topic: newProb.topic,
      difficulty: newProb.difficulty,
      xp: Number(newProb.xp),
      companies: newProb.companies ? newProb.companies.split(",").map((s) => s.trim()) : ["TCS"],
      timeLimit: newProb.timeLimit,
      memoryLimit: newProb.memoryLimit,
      description: newProb.description,
      starterCode: { cpp: "// Write C++ code", python: "# Write Python code", java: "// Write Java code" },
      testCases: [
        { id: `tc-${Date.now()}-1`, input: "Sample input", output: "Sample output", isHidden: false }
      ],
    };
    setProblems([created, ...problems]);
    setShowAddModal(false);
    setNewProb({ title: "", topic: "Arrays", difficulty: "Easy", xp: 50, companies: "", timeLimit: "1.0s", memoryLimit: "128 MB", description: "" });
  };

  const handleDeleteProblem = (id) => {
    setProblems(problems.filter((p) => p.id !== id));
  };

  const handleAddTestCase = (e) => {
    e.preventDefault();
    if (!selectedProblem || !newTestCase.input.trim() || !newTestCase.output.trim()) return;

    const updatedTc = {
      id: `tc-${Date.now()}`,
      input: newTestCase.input,
      output: newTestCase.output,
      isHidden: newTestCase.isHidden,
    };

    setProblems(
      problems.map((p) =>
        p.id === selectedProblem.id
          ? { ...p, testCases: [...p.testCases, updatedTc] }
          : p
      )
    );
    setSelectedProblem({ ...selectedProblem, testCases: [...selectedProblem.testCases, updatedTc] });
    setNewTestCase({ input: "", output: "", isHidden: false });
  };

  const handleDeleteTestCase = (tcId) => {
    const updatedTcList = selectedProblem.testCases.filter((tc) => tc.id !== tcId);
    setProblems(
      problems.map((p) =>
        p.id === selectedProblem.id ? { ...p, testCases: updatedTcList } : p
      )
    );
    setSelectedProblem({ ...selectedProblem, testCases: updatedTcList });
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const probObj = problems.find((p) => p.id === assignForm.problemId) || problems[0];
    const newAssign = {
      id: `assign-${Date.now()}`,
      title: probObj ? probObj.title : "Custom Coding Task",
      batch: assignForm.batch,
      department: assignForm.department,
      dueDate: assignForm.dueDate || "2026-09-20",
      weightage: assignForm.weightage,
      submitted: 0,
      totalStudents: 50,
      passed: 0,
      instructions: assignForm.instructions,
    };
    setAssignments([newAssign, ...assignments]);
    setAssignSuccessMsg("Practice problem successfully assigned to batch!");
    setTimeout(() => setAssignSuccessMsg(""), 3000);
  };

  return (
    <div style={{ paddingBottom: "32px" }}>
      {/* Header */}
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Coding Practice Management</h1>
          <p className="coord-page-sub">
            Create coding challenges, manage test cases, assign problem sets to batches, and inspect student code submissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
        {[
          { id: "bank", label: "Problem Bank", icon: Code },
          { id: "assign", label: "Assign Practice", icon: Send },
          { id: "submissions", label: "Student Submissions Log", icon: FileCode2 },
          { id: "diagnostics", label: "Performance & Diagnostics", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                border: "none",
                background: isActive ? "#4f46e5" : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROBLEM BANK */}
      {activeTab === "bank" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search problem or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: "8px 12px 8px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", width: "240px" }}
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "13.5px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
              }}
            >
              <Plus size={16} /> Add New Problem
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredProblems.map((prob) => (
              <div
                key={prob.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 800,
                        background: prob.difficulty === "Easy" ? "#ecfdf5" : prob.difficulty === "Medium" ? "#fffbeb" : "#fef2f2",
                        color: prob.difficulty === "Easy" ? "#059669" : prob.difficulty === "Medium" ? "#d97706" : "#dc2626",
                        border: `1px solid ${prob.difficulty === "Easy" ? "#a7f3d0" : prob.difficulty === "Medium" ? "#fde68a" : "#fecaca"}`,
                      }}
                    >
                      {prob.difficulty}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{prob.topic}</span>
                    <span style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 700 }}>+{prob.xp} XP</span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "8px 0 4px 0" }}>{prob.title}</h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{prob.description}</p>

                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>Targeted Companies:</span>
                    {prob.companies.map((c, idx) => (
                      <span key={idx} style={{ background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setSelectedProblem(prob);
                      setShowTestCaseModal(true);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <ListChecks size={15} /> Test Cases ({prob.testCases ? prob.testCases.length : 0})
                  </button>

                  <button
                    onClick={() => handleDeleteProblem(prob.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGN PRACTICE */}
      {activeTab === "assign" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Assign Form */}
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={18} color="#4f46e5" /> Assign Problem to Batch
            </h2>

            {assignSuccessMsg && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
                {assignSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Select Coding Problem</label>
                <select
                  required
                  value={assignForm.problemId}
                  onChange={(e) => setAssignForm({ ...assignForm, problemId: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="">-- Choose Problem from Bank --</option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Department</label>
                  <select
                    value={assignForm.department}
                    onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Target Batch</label>
                  <select
                    value={assignForm.batch}
                    onChange={(e) => setAssignForm({ ...assignForm, batch: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="CSE 2026 Alpha Cohort">CSE 2026 Alpha Cohort</option>
                    <option value="CSE 2026 Beta Cohort">CSE 2026 Beta Cohort</option>
                    <option value="IT 2026 Beta Cohort">IT 2026 Beta Cohort</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Due Date</label>
                  <input
                    type="date"
                    required
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Score Weightage</label>
                  <input
                    type="text"
                    value={assignForm.weightage}
                    onChange={(e) => setAssignForm({ ...assignForm, weightage: e.target.value })}
                    placeholder="e.g. 10 Marks"
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Instructions for Students</label>
                <textarea
                  rows={3}
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  placeholder="e.g. Time complexity must be within O(N log N)..."
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "none" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: "#4f46e5",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Publish Assignment
              </button>
            </form>
          </div>

          {/* Active Assignments List */}
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>Active Batch Assignments</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {assignments.map((item) => {
                const pct = Math.round((item.submitted / item.totalStudents) * 100);
                return (
                  <div key={item.id} style={{ background: "#ffffff", borderRadius: "18px", padding: "20px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#4f46e5", background: "#e0e7ff", padding: "2px 8px", borderRadius: "6px" }}>
                          {item.batch}
                        </span>
                        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>{item.title}</h3>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Due: {item.dueDate} • Weightage: {item.weightage}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                        <span style={{ color: "#334155" }}>Batch Progress</span>
                        <span style={{ color: "#4f46e5" }}>{item.submitted}/{item.totalStudents} Submitted ({pct}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#4f46e5", borderRadius: "4px" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT SUBMISSIONS LOG */}
      {activeTab === "submissions" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>Live Student Code Submissions</h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>Student Name</th>
                  <th style={{ padding: "12px" }}>Roll No / Batch</th>
                  <th style={{ padding: "12px" }}>Problem</th>
                  <th style={{ padding: "12px" }}>Language</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Time / Memory</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700, color: "#0f172a" }}>{sub.studentName}</td>
                    <td style={{ padding: "14px 12px", color: "#64748b" }}>{sub.rollNo} ({sub.batch})</td>
                    <td style={{ padding: "14px 12px", fontWeight: 600, color: "#334155" }}>{sub.problemTitle}</td>
                    <td style={{ padding: "14px 12px", fontWeight: 700, color: "#4f46e5" }}>{sub.language}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          background: sub.status === "Accepted" ? "#ecfdf5" : "#fef2f2",
                          color: sub.status === "Accepted" ? "#059669" : "#dc2626",
                          border: `1px solid ${sub.status === "Accepted" ? "#a7f3d0" : "#fecaca"}`,
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: "12px", color: "#64748b" }}>
                      {sub.executionTime} / {sub.memoryUsed}
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Eye size={14} /> View Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS & PERFORMANCE */}
      {activeTab === "diagnostics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 700 }}>Total Solved Submissions</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>4,820 Problems</div>
              <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: 700, marginTop: "2px" }}>↑ 14% this month</div>
            </div>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 700 }}>Average Acceptance Rate</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#059669", marginTop: "4px" }}>76.4%</div>
              <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>Platform Average: 72%</div>
            </div>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 700 }}>Top Topic Mastered</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#4f46e5", marginTop: "4px" }}>Arrays & HashMaps</div>
              <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>88% Batch Mastery</div>
            </div>
          </div>

          {/* Student Leaderboard */}
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>Department Student Coding Leaderboard</h2>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Student rankings based on problems solved, XP points, and test case pass rates.</p>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                    <th style={{ padding: "12px" }}>Rank</th>
                    <th style={{ padding: "12px" }}>Student Name</th>
                    <th style={{ padding: "12px" }}>Roll No / Batch</th>
                    <th style={{ padding: "12px" }}>Problems Solved</th>
                    <th style={{ padding: "12px" }}>XP Score</th>
                    <th style={{ padding: "12px" }}>Accuracy</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Diagnostic</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, name: "Aarav Sharma", rollNo: "CSE-2026-001", batch: "CSE 2026 Alpha", solved: 142, xp: 2840, accuracy: "92.4%", status: "Top Performer" },
                    { rank: 2, name: "Ananya Iyer", rollNo: "IT-2026-031", batch: "IT 2026 Beta", solved: 135, xp: 2710, accuracy: "88.6%", status: "Top Performer" },
                    { rank: 3, name: "Riya Patel", rollNo: "CSE-2026-014", batch: "CSE 2026 Alpha", solved: 128, xp: 2590, accuracy: "86.1%", status: "Consistent" },
                    { rank: 4, name: "Rohan Kulkarni", rollNo: "CSE-2026-045", batch: "CSE 2026 Beta", solved: 119, xp: 2420, accuracy: "79.5%", status: "Good" },
                    { rank: 5, name: "Siddharth Verma", rollNo: "AI-2026-009", batch: "AI 2026 Alpha", solved: 112, xp: 2310, accuracy: "75.2%", status: "Needs Practice" },
                  ].map((s) => (
                    <tr key={s.rank} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 12px", fontWeight: 800, color: s.rank <= 3 ? "#d97706" : "#475569" }}>
                        {s.rank === 1 ? "🥇 #1" : s.rank === 2 ? "🥈 #2" : s.rank === 3 ? "🥉 #3" : `#${s.rank}`}
                      </td>
                      <td style={{ padding: "14px 12px", fontWeight: 800, color: "#0f172a" }}>{s.name}</td>
                      <td style={{ padding: "14px 12px", color: "#64748b" }}>{s.rollNo} ({s.batch})</td>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#334155" }}>{s.solved} Solved</td>
                      <td style={{ padding: "14px 12px", fontWeight: 800, color: "#4f46e5" }}>{s.xp} XP</td>
                      <td style={{ padding: "14px 12px", fontWeight: 700, color: "#059669" }}>{s.accuracy}</td>
                      <td style={{ padding: "14px 12px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedSubmission({ studentName: s.name, rollNo: s.rollNo, batch: s.batch, accuracy: s.accuracy, solved: s.solved, isDiagnostic: true })}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #c7d2fe",
                            background: "#eff6ff",
                            color: "#4f46e5",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Diagnostic Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROBLEM MODAL */}
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

      {/* TEST CASES MODAL */}
      {showTestCaseModal && selectedProblem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "28px", width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Test Case Manager</h2>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{selectedProblem.title}</div>
              </div>
              <button onClick={() => setShowTestCaseModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {/* List Existing Test Cases */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#334155", marginBottom: "10px" }}>Configured Test Cases</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedProblem.testCases && selectedProblem.testCases.map((tc, idx) => (
                  <div key={tc.id} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: tc.isHidden ? "#dc2626" : "#059669", background: tc.isHidden ? "#fef2f2" : "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>
                        {tc.isHidden ? "Hidden" : "Public"} Case #{idx + 1}
                      </span>
                      <div style={{ fontSize: "12px", color: "#334155", marginTop: "4px" }}>In: <code>{tc.input}</code> | Out: <code>{tc.output}</code></div>
                    </div>
                    <button onClick={() => handleDeleteTestCase(tc.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Test Case Form */}
            <form onSubmit={handleAddTestCase} style={{ borderTop: "2px dashed #e2e8f0", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#334155", marginBottom: "10px" }}>Add New Test Case</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Input (e.g. [2,7], 9)"
                  value={newTestCase.input}
                  onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                  style={{ padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                />
                <input
                  type="text"
                  placeholder="Expected Output (e.g. [0,1])"
                  value={newTestCase.output}
                  onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                  style={{ padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={newTestCase.isHidden}
                  onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                />
                <label htmlFor="isHidden" style={{ fontSize: "12.5px", color: "#334155", fontWeight: 600 }}>Mark as Hidden Test Case (For Evaluation Only)</label>
              </div>

              <button
                type="submit"
                style={{ marginTop: "14px", width: "100%", background: "#0f172a", color: "#ffffff", padding: "10px", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                + Add Test Case
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CODE & DIAGNOSTIC MODAL */}
      {selectedSubmission && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: selectedSubmission.isDiagnostic ? "#ffffff" : "#0f172a", borderRadius: "24px", padding: "28px", width: "90%", maxWidth: "680px", color: selectedSubmission.isDiagnostic ? "#0f172a" : "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: `1px solid ${selectedSubmission.isDiagnostic ? "#e2e8f0" : "#1e293b"}`, paddingBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: selectedSubmission.isDiagnostic ? "#0f172a" : "#f8fafc" }}>
                  {selectedSubmission.isDiagnostic ? `Diagnostic Summary — ${selectedSubmission.studentName}` : `${selectedSubmission.studentName} — Code Snippet`}
                </h2>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {selectedSubmission.rollNo} • {selectedSubmission.batch}
                </div>
              </div>
              <button onClick={() => setSelectedSubmission(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            {selectedSubmission.isDiagnostic ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Total Problems Solved</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{selectedSubmission.solved} Problems</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Submission Accuracy</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>{selectedSubmission.accuracy}</div>
                  </div>
                </div>

                <div style={{ background: "#f1f5f9", padding: "14px", borderRadius: "12px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#334155", margin: "0 0 6px 0" }}>Topic Mastery Diagnostic</h4>
                  <div style={{ fontSize: "12.5px", color: "#475569" }}>
                    • Arrays & HashMaps: <strong style={{ color: "#059669" }}>95% Mastery</strong><br />
                    • Dynamic Programming: <strong style={{ color: "#d97706" }}>62% Mastery (Needs Practice)</strong><br />
                    • Graph Algorithms: <strong style={{ color: "#2563eb" }}>78% Mastery</strong>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <pre style={{ background: "#020617", padding: "16px", borderRadius: "14px", border: "1px solid #1e293b", color: "#38bdf8", fontFamily: "monospace", fontSize: "13px", overflowX: "auto", maxHeight: "350px" }}>
                  {selectedSubmission.codeSnippet}
                </pre>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "12px", color: "#94a3b8" }}>
                  <span>Execution Time: <strong style={{ color: "#ffffff" }}>{selectedSubmission.executionTime}</strong></span>
                  <span>Memory Used: <strong style={{ color: "#ffffff" }}>{selectedSubmission.memoryUsed}</strong></span>
                  <span>Status: <strong style={{ color: selectedSubmission.status === "Accepted" ? "#4ade80" : "#f87171" }}>{selectedSubmission.status}</strong></span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
