import { useState } from "react";
import {
  Bot,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Award,
  BarChart2,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Send,
} from "lucide-react";
import { coordinatorInterviewRecords, coordinatorBatches } from "../../../data/coordinatorMockData";

export default function InterviewPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Filters
  const filteredInterviews = coordinatorInterviewRecords.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.targetRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || rec.batch === selectedBatch;
    const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;
    const matchesRole = selectedRole === "all" || rec.targetRole === selectedRole;
    return matchesSearch && matchesBatch && matchesStatus && matchesRole;
  });

  // Calculate Metrics
  const totalCount = coordinatorInterviewRecords.length;
  const completedCount = coordinatorInterviewRecords.filter((r) => r.status === "Completed").length;
  const retakeCount = coordinatorInterviewRecords.filter((r) => r.status === "Needs Retake").length;
  const completionRate = ((completedCount / totalCount) * 100).toFixed(1);
  const avgTechScore = (
    coordinatorInterviewRecords.reduce((acc, curr) => acc + curr.techScore, 0) / totalCount
  ).toFixed(1);
  const avgBehavioralScore = (
    coordinatorInterviewRecords.reduce((acc, curr) => acc + curr.behavioralScore, 0) / totalCount
  ).toFixed(1);

  const getGradeBadge = (grade) => {
    switch (grade) {
      case "A+":
      case "A":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "B+":
      case "B":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "C":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700 mb-2">
            <Sparkles size={14} className="text-purple-600" />
            <span>AI Evaluation & Candidate Feedback Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            AI Interview Completion & Feedback
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Monitor candidate mock interview progress, technical depth scores, AI evaluator insights, and identify retake candidates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedBatch("all");
              setSelectedStatus("all");
              setSelectedRole("all");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw size={14} />
            Reset Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Bot size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Completion Rate</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{completionRate}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{completedCount} of {totalCount} completed</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BarChart2 size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg Tech Score</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{avgTechScore}%</p>
            <p className="text-[11px] text-indigo-600/70 mt-0.5">Technical & DSA</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg Soft Skills</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{avgBehavioralScore}%</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">Behavioral rating</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Retakes Flagged</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{retakeCount}</p>
            <p className="text-[11px] text-rose-500 mt-0.5">Needs re-interview</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-200 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Drive Approved</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">
              {coordinatorInterviewRecords.filter((r) => r.overallScore >= 80).length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Score ≥ 80%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, roll no, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Filter:</span>
            </div>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Batches</option>
              {coordinatorBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Needs Retake">Needs Retake</option>
            </select>

            {/* Target Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Target Roles</option>
              <option value="Full Stack Engineer">Full Stack Engineer</option>
              <option value="Python Backend Developer">Python Backend Developer</option>
              <option value="Data Science & AI Engineer">Data Science & AI Engineer</option>
              <option value="React Frontend Developer">React Frontend Developer</option>
              <option value="Cloud & DevOps Specialist">Cloud & DevOps Specialist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interview Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Candidate Interview Audit Log</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredInterviews.length} of {coordinatorInterviewRecords.length} evaluations
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4">Tech / Soft Score</th>
                <th className="py-3.5 px-4">Overall Grade</th>
                <th className="py-3.5 px-4">Identified Weak Spot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInterviews.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  {/* Candidate */}
                  <td className="py-4 px-6">
                    <div>
                      <p
                        className="font-bold text-slate-900 hover:text-purple-600 transition cursor-pointer"
                        onClick={() => setSelectedInterview(rec)}
                      >
                        {rec.studentName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {rec.rollNo} · {rec.batch}
                      </p>
                    </div>
                  </td>

                  {/* Target Role */}
                  <td className="py-4 px-4 font-semibold text-purple-700">
                    {rec.targetRole}
                  </td>

                  {/* Tech / Soft Score */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Tech:</span>
                        <span className="font-bold text-slate-800">{rec.techScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Soft:</span>
                        <span className="font-bold text-slate-800">{rec.behavioralScore}%</span>
                      </div>
                    </div>
                  </td>

                  {/* Overall Grade */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{rec.overallScore}%</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadge(
                          rec.grade
                        )}`}
                      >
                        {rec.grade}
                      </span>
                    </div>
                  </td>

                  {/* Weak Spot */}
                  <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={rec.weakSpot}>
                    {rec.weakSpot}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        rec.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {rec.status === "Completed" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {rec.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedInterview(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                    >
                      <Eye size={14} />
                      Scorecard
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No interview records found matching your active filter options.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Interview Scorecard Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedInterview(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                  {selectedInterview.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedInterview.studentName}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedInterview.overallScore >= 80
                          ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                          : "bg-rose-500/30 text-rose-300 border border-rose-400/30"
                      }`}
                    >
                      Overall Grade: {selectedInterview.grade} ({selectedInterview.overallScore}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedInterview.rollNo} · {selectedInterview.batch} · Target:{" "}
                    <strong className="text-purple-300">{selectedInterview.targetRole}</strong>
                  </p>
                </div>
              </div>

              {/* Top Banner Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800 text-center">
                <div>
                  <p className="text-[11px] text-slate-400">Technical Depth</p>
                  <p className="text-lg font-bold text-indigo-400 mt-0.5">{selectedInterview.techScore}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Behavioral & Soft Skills</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{selectedInterview.behavioralScore}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Evaluator</p>
                  <p className="text-xs font-bold text-purple-300 mt-1 truncate">{selectedInterview.interviewer}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Evaluator Executive Summary */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  AI & Mentor Evaluation Summary
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">{selectedInterview.summary}</p>

                {/* Key Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-purple-100 text-xs">
                  <div>
                    <span className="font-bold text-emerald-700 block mb-1">Key Strengths:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                      {selectedInterview.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-rose-700 block mb-1">Identified Weak Spot:</span>
                    <p className="text-[11px] text-slate-600">{selectedInterview.weakSpot}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Skill Breakdown Progress Bars */}
              {selectedInterview.detailedScores && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Competency Scorecard Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedInterview.detailedScores).map(([skill, val]) => (
                      <div key={skill} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span className="capitalize">{skill.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-bold text-purple-700">{val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Feedback Breakdown */}
              {selectedInterview.questionFeedback && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Question-by-Question Feedback & Transcript
                  </h4>
                  <div className="space-y-3">
                    {selectedInterview.questionFeedback.map((qf, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-slate-800 text-xs">{qf.q}</p>
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[11px]">
                            {qf.score}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 italic">"{qf.notes}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Conducted date: <strong className="text-slate-700">{selectedInterview.conductedDate}</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedInterview.status === "Needs Retake" && (
                  <button
                    onClick={() => {
                      alert(`Retake mock interview request sent to ${selectedInterview.studentName}`);
                      setSelectedInterview(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                  >
                    Trigger Mandatory Retake
                  </button>
                )}
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  Close Scorecard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
