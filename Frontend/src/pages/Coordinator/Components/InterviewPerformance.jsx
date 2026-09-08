import { useState } from "react";
import {
  Bot,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart2,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  TrendingUp,
  Clock,
  Calendar,
  FileText,
  Check,
  BookOpen,
  ArrowUpRight,
  Layers
} from "lucide-react";
import { coordinatorInterviewRecords, coordinatorBatches } from "../../../data/coordinatorMockData";

export default function InterviewPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Filters
  const filteredInterviews = coordinatorInterviewRecords.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.targetRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || rec.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || rec.batch === selectedBatch;
    const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;
    return matchesSearch && matchesDept && matchesBatch && matchesStatus;
  });

  // Calculate Dashboard Analytics (Section 4)
  const totalStudentsCount = 120;
  const completedCount = 85;
  const pendingCount = 35;
  const averageScore = "72%";

  // Basic Performance Categories
  const categoryCounts = {
    excellent: 20,
    good: 35,
    average: 22,
    needsWork: 8
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Not Attempted":
      case "Needs Retake":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryBadge = (grade) => {
    switch (grade) {
      case "Excellent":
        return "bg-emerald-500 text-white font-bold";
      case "Good":
        return "bg-indigo-600 text-white font-bold";
      case "Average":
        return "bg-amber-500 text-white font-bold";
      case "Needs Work":
      default:
        return "bg-rose-600 text-white font-bold";
    }
  };

  // FULLSCREEN IN-PLACE EVALUATION PAGE VIEW (ALIGNED IN MIDDLE)
  if (selectedInterview) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Navigation Header Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
              {selectedInterview.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedInterview.studentName}</h3>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Overall Score: {selectedInterview.overallScore}% ({selectedInterview.grade})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Roll No: <strong className="text-slate-800 font-mono">{selectedInterview.rollNo}</strong> · Dept:{" "}
                <strong className="text-slate-800">{selectedInterview.department || "CSE"}</strong> · Batch:{" "}
                <strong className="text-slate-800">{selectedInterview.batch}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedInterview(null)}
            className="p-2.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition cursor-pointer"
            title="Close Evaluation View"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section 2: Interview Details Metadata Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Interview Date</p>
            <p className="text-xs font-bold text-indigo-700 mt-1 flex items-center justify-center gap-1">
              <Calendar size={13} className="text-indigo-600" /> {selectedInterview.conductedDate}
            </p>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Interview Type</p>
            <p className="text-xs font-bold text-indigo-700 mt-1">{selectedInterview.interviewType}</p>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Questions Count</p>
            <p className="text-xs font-bold text-indigo-700 mt-1">{selectedInterview.questionsCount} Questions</p>
          </div>
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <p className="text-[11px] font-semibold text-slate-500">Duration</p>
            <p className="text-xs font-bold text-indigo-700 mt-1 flex items-center justify-center gap-1">
              <Clock size={13} className="text-indigo-600" /> {selectedInterview.duration}
            </p>
          </div>
        </div>

        {/* Section 2: Evaluation Breakdown (4 Core Scores) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-600" />
            Competency Evaluation Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <p className="text-xs font-semibold text-slate-500">Technical Knowledge</p>
              <p className="text-2xl font-extrabold text-indigo-700 mt-1">{selectedInterview.techScore}%</p>
              <div className="w-full bg-indigo-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${selectedInterview.techScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-slate-500">Communication Score</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{selectedInterview.communicationScore}%</p>
              <div className="w-full bg-emerald-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${selectedInterview.communicationScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
              <p className="text-xs font-semibold text-slate-500">Problem-Solving Score</p>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">{selectedInterview.problemSolvingScore}%</p>
              <div className="w-full bg-purple-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${selectedInterview.problemSolvingScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-slate-500">Confidence & Quality</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">{selectedInterview.confidenceScore}%</p>
              <div className="w-full bg-amber-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: `${selectedInterview.confidenceScore}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: AI Feedback Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            AI Generated Evaluation Feedback & Insights
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths */}
            <div className="p-5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
              <span className="font-bold text-xs text-emerald-800 flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Strengths:
              </span>
              <ul className="space-y-2 text-xs text-emerald-950 font-medium">
                {selectedInterview.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Needs Improvement / Weaknesses */}
            <div className="p-5 bg-rose-50/70 rounded-xl border border-rose-200/80">
              <span className="font-bold text-xs text-rose-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-600" />
                Needs Improvement:
              </span>
              <ul className="space-y-2 text-xs text-rose-950 font-medium">
                {selectedInterview.weaknesses.map((wk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="leading-relaxed">{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="p-5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-950">
            <span className="font-bold text-xs text-indigo-900 block mb-1.5">AI Recommendation:</span>
            <p className="leading-relaxed font-semibold text-xs text-indigo-900">{selectedInterview.recommendation}</p>
          </div>

          {/* Recommended Next Topics */}
          {selectedInterview.nextTopics && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2.5">
                Recommended Topics to Practice Next:
              </span>
              <div className="flex flex-wrap gap-2.5">
                {selectedInterview.nextTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 bg-slate-50 border border-purple-200 text-purple-700 font-bold rounded-xl text-xs shadow-2xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Student Interview History (Previous Attempts) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Layers size={16} className="text-purple-600" />
            Student Interview Attempt History & Progress Trajectory
          </h4>

          <div className="border border-slate-200/80 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-6">Attempt</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-6">Status & Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInterview.interviewHistory && selectedInterview.interviewHistory.length > 0 ? (
                  selectedInterview.interviewHistory.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-bold text-slate-900">{hist.attempt}</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{hist.date}</td>
                      <td className="py-4 px-4 font-extrabold text-indigo-600 text-sm">{hist.score}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs ${getCategoryBadge(hist.status)}`}>
                          {hist.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No prior interview attempts recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            AI Interview Monitoring & Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Track student AI mock interview attempts, technical competency scores, detailed AI evaluation breakdowns, and historical improvement logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDept("all");
              setSelectedBatch("all");
              setSelectedStatus("all");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={14} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Section 4: AI Interview Analytics - Overview Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalStudentsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled for AI assessment</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-200 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Interviews Completed</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{completedCount}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Evaluated by AI engine</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-blue-200 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending Interviews</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">{pendingCount}</p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Not attempted / In progress</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Average Score</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{averageScore}</p>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Overall cohort mean</p>
          </div>
        </div>
      </div>

      {/* Performance Categories Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-600" />
            Performance Categories Distribution
          </h3>
          <span className="text-xs font-medium text-slate-400">120 Total Evaluated Candidates</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-800">Excellent (≥85%)</p>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{categoryCounts.excellent} Candidates</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-indigo-800">Good (70-84%)</p>
              <p className="text-lg font-extrabold text-indigo-700 mt-0.5">{categoryCounts.good} Candidates</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800">Average (55-69%)</p>
              <p className="text-lg font-extrabold text-amber-700 mt-0.5">{categoryCounts.average} Candidates</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-800">Needs Work (&lt;55%)</p>
              <p className="text-lg font-extrabold text-rose-700 mt-0.5">{categoryCounts.needsWork} Candidates</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          </div>
        </div>
      </div>

      {/* Section 1: AI Interview Overview Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters: Department, Batch, Interview Status */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-500">
              <SlidersHorizontal size={14} className="text-purple-600" />
              <span>Filters:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="AI & DS">AI & DS</option>
              <option value="ECS">ECS</option>
            </select>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
            >
              <option value="all">All Batches</option>
              {coordinatorBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Interview Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Attempted">Not Attempted / Needs Work</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 1: AI Interview Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Interview Roster</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredInterviews.length} of {coordinatorInterviewRecords.length} student interview evaluation records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3.5 px-6">Student Details</th>
                <th className="py-3.5 px-4">Department & Batch</th>
                <th className="py-3.5 px-4">Interview Type</th>
                <th className="py-3.5 px-4">Interview Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Overall Score</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInterviews.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  {/* Student Name & Roll Number */}
                  <td className="py-4 px-6">
                    <div>
                      <p
                        className="font-bold text-slate-900 hover:text-purple-600 transition cursor-pointer"
                        onClick={() => setSelectedInterview(rec)}
                      >
                        {rec.studentName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{rec.rollNo}</p>
                    </div>
                  </td>

                  {/* Department & Batch */}
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-800">{rec.department || "CSE"}</span>
                    <p className="text-[11px] text-slate-500">{rec.batch}</p>
                  </td>

                  {/* Interview Type */}
                  <td className="py-4 px-4 font-semibold text-purple-700">
                    {rec.interviewType || "Technical Mock"}
                  </td>

                  {/* Interview Date */}
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {rec.conductedDate}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        rec.status
                      )}`}
                    >
                      {rec.status === "Completed" ? (
                        <CheckCircle2 size={12} />
                      ) : rec.status === "In Progress" ? (
                        <Clock size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {rec.status}
                    </span>
                  </td>

                  {/* Overall Score */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{rec.overallScore}%</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getCategoryBadge(rec.grade)}`}>
                        {rec.grade}
                      </span>
                    </div>
                  </td>

                  {/* View Details Button */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedInterview(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No student interview records found matching your active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
