import { useState } from "react";
import {
  Code,
  Search,
  Filter,
  CheckCircle2,
  Zap,
  Flame,
  Trophy,
  BarChart3,
  Eye,
  X,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { coordinatorCodingPerformance, coordinatorBatches } from "../../../data/coordinatorMockData";

export default function CodingPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filtered Students
  const filteredData = coordinatorCodingPerformance.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
    const matchesLang = selectedLanguage === "all" || s.primaryLanguage === selectedLanguage;
    const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
    return matchesSearch && matchesBatch && matchesLang && matchesStatus;
  });

  // Calculate high-level metrics
  const totalSubmissionsSum = coordinatorCodingPerformance.reduce((acc, curr) => acc + curr.totalSubmissions, 0);
  const totalSolvedSum = coordinatorCodingPerformance.reduce((acc, curr) => acc + curr.totalSolved, 0);
  const avgAccuracy = (
    coordinatorCodingPerformance.reduce((acc, curr) => acc + curr.accuracyRate, 0) /
    coordinatorCodingPerformance.length
  ).toFixed(1);
  const hardSolvedSum = coordinatorCodingPerformance.reduce((acc, curr) => acc + curr.hardSolved, 0);
  const activeCoders = coordinatorCodingPerformance.filter((s) => s.streakDays > 0).length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Top Performer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Good":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Average":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Struggling":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Code size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-700/50 border border-indigo-500/30 text-xs font-semibold text-indigo-200 mb-3 backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-400" />
              <span>Department Coding Analytics & Leaderboard Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Student Coding Performance
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
              Track algorithm submission metrics, problem accuracy rates, language proficiency, and target coders needing remediation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedBatch("all");
                setSelectedLanguage("all");
                setSelectedStatus("all");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-700/40 hover:bg-indigo-700/60 border border-indigo-500/30 rounded-xl text-xs font-medium text-white transition backdrop-blur-sm"
            >
              <RefreshCw size={14} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Code size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Solved</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalSolvedSum}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalSubmissionsSum} submissions</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg Accuracy Rate</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{avgAccuracy}%</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">+2.4% vs last week</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Hard Solved</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{hardSolvedSum}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">High difficulty problems</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Coders</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{activeCoders} Students</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active daily streaks</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Struggling Coders</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">
              {coordinatorCodingPerformance.filter((s) => s.status === "Struggling").length}
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5">Requires remediation</p>
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
              placeholder="Search student or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Batches</option>
              {coordinatorBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Languages</option>
              <option value="C++">C++</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
              <option value="Go">Go</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="Top Performer">Top Performer</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Struggling">Struggling</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Coding Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Coding Matrix</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredData.length} of {coordinatorCodingPerformance.length} enrolled coders
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3.5 px-6">Rank & Student</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Problems Solved</th>
                <th className="py-3.5 px-4">Accuracy Rate</th>
                <th className="py-3.5 px-4">Top Language</th>
                <th className="py-3.5 px-4">Streak</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  {/* Student */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        #{s.leaderboardRank}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer" onClick={() => setSelectedStudent(s)}>
                          {s.studentName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{s.rollNo}</p>
                      </div>
                    </div>
                  </td>

                  {/* Batch */}
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {s.batch}
                  </td>

                  {/* Solved pills */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{s.totalSolved}</span>
                        <span className="text-[11px] text-slate-400">total</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold" title="Easy">
                          E: {s.easySolved}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold" title="Medium">
                          M: {s.mediumSolved}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold" title="Hard">
                          H: {s.hardSolved}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Accuracy */}
                  <td className="py-4 px-4">
                    <div className="w-28">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span>{s.accuracyRate}%</span>
                        <span className="text-[10px] text-slate-400 font-normal">{s.totalSubmissions} subs</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.accuracyRate >= 85
                              ? "bg-emerald-500"
                              : s.accuracyRate >= 70
                              ? "bg-blue-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${s.accuracyRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Primary Language */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s.primaryLanguage}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="py-4 px-4">
                    {s.streakDays > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                        <Flame size={14} className="fill-amber-500" />
                        {s.streakDays} days
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">0 days</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                        s.status
                      )}`}
                    >
                      {s.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition"
                    >
                      <Eye size={14} />
                      Diagnostics
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No coding performance records match your active search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Coding Diagnostic Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                  {selectedStudent.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedStudent.studentName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                      Rank #{selectedStudent.leaderboardRank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedStudent.rollNo} · {selectedStudent.batch}
                  </p>
                </div>
              </div>

              {/* Stats overview banner */}
              <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800 text-center">
                <div>
                  <p className="text-[11px] text-slate-400">Total Solved</p>
                  <p className="text-lg font-bold text-white mt-0.5">{selectedStudent.totalSolved}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Accuracy Rate</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{selectedStudent.accuracyRate}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Current Streak</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">{selectedStudent.streakDays} Days</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Primary Lang</p>
                  <p className="text-lg font-bold text-indigo-300 mt-0.5">{selectedStudent.primaryLanguage}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Topic Mastery breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Topic Mastery & Skill Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(selectedStudent.topics).map(([topic, pct]) => (
                    <div key={topic} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <span>{topic}</span>
                        <span className="font-bold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Submissions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Recent Code Submissions
                </h4>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-500">
                        <th className="py-2.5 px-4">Problem</th>
                        <th className="py-2.5 px-3">Difficulty</th>
                        <th className="py-2.5 px-3">Lang</th>
                        <th className="py-2.5 px-3">Verdict</th>
                        <th className="py-2.5 px-3">Runtime</th>
                        <th className="py-2.5 px-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedStudent.recentSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white transition">
                          <td className="py-3 px-4 font-semibold text-slate-800">{sub.problem}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.difficulty === "Easy"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : sub.difficulty === "Medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {sub.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">{sub.language}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-semibold ${
                                sub.status === "Accepted"
                                  ? "text-emerald-600"
                                  : sub.status === "Time Limit Exceeded"
                                  ? "text-amber-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">{sub.time}</td>
                          <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                            {sub.submittedAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Last active: <strong className="text-slate-700">{selectedStudent.lastActive}</strong>
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
