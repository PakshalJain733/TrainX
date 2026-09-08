import { useState } from "react";
import {
  Code,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Trophy,
  BarChart3,
  Globe,
  Flame,
  Zap,
  Eye,
  X,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  FileCode2,
  PieChart,
  Layers,
  RefreshCw,
  Award,
  Terminal,
  ChevronRight,
} from "lucide-react";
import {
  initialCodingProblems,
  globalCodingStats,
  collegeWiseCodingPerformance,
} from "../../data/codingPracticeMockData";

export default function SuperAdminCodingPracticeMonitoring() {
  const [activeTab, setActiveTab] = useState("bank"); // 'bank' | 'colleges' | 'analytics'

  // Bank filters
  const [bankSearch, setBankSearch] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("All");
  const [bankCollege, setBankCollege] = useState("All");

  // College performance filters
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeStatusFilter, setCollegeStatusFilter] = useState("All");

  // Modal State
  const [selectedProblemModal, setSelectedProblemModal] = useState(null);
  const [selectedCollegeModal, setSelectedCollegeModal] = useState(null);

  // Filtered Problem Bank
  const filteredBank = initialCodingProblems.filter((prob) => {
    const matchesSearch =
      prob.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
      prob.topic.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesDiff = bankDifficulty === "All" || prob.difficulty === bankDifficulty;
    const matchesCollege = bankCollege === "All" || prob.college === bankCollege;
    return matchesSearch && matchesDiff && matchesCollege;
  });

  // Filtered College Performance
  const filteredColleges = collegeWiseCodingPerformance.filter((col) => {
    const matchesSearch =
      col.collegeName.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      col.location.toLowerCase().includes(collegeSearch.toLowerCase());
    const matchesStatus = collegeStatusFilter === "All" || col.status === collegeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Top Performer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Good":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Average":
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Platform-Wide Coding Practice Governance & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Global Coding Practice Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Monitor coding problem distribution across 18+ affiliated colleges, evaluate college-wise practice accuracy, track global submission metrics, and audit topic mastery.
          </p>
        </div>
      </div>

      {/* High-Level Global Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Code size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Global Problems Bank</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{globalCodingStats.totalPlatformProblems}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {globalCodingStats.collegesCount} Colleges</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Terminal size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Submissions</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{globalCodingStats.totalSubmissionsCount}</p>
            <p className="text-[11px] text-blue-700/70 mt-0.5">+14% this month</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Platform Accuracy</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{globalCodingStats.avgPlatformAccuracy}</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">Passed test cases</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Coders</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{globalCodingStats.activeCodersCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Students practicing</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-indigo-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Globe size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Top Preferred Lang</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{globalCodingStats.topLanguage}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Most submitted</p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 bg-white rounded-2xl px-4 pt-3 shadow-xs">
        <div className="flex items-center gap-6 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab("bank")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "bank"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Globe size={18} />
            <span>Global Problem Bank</span>
          </button>

          <button
            onClick={() => setActiveTab("colleges")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "colleges"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={18} />
            <span>College-Wise Performance ({collegeWiseCodingPerformance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PieChart size={18} />
            <span>Platform Usage & Submission Analytics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GLOBAL PROBLEM BANK */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search platform problem title or topic..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <SlidersHorizontal size={14} />
                <span>Filter:</span>
              </div>

              <select
                value={bankDifficulty}
                onChange={(e) => setBankDifficulty(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={bankCollege}
                onChange={(e) => setBankCollege(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 max-w-xs truncate"
              >
                <option value="All">All Colleges</option>
                <option value="Apex Institute of Technology">Apex Institute of Technology</option>
                <option value="Meridian Engineering College">Meridian Engineering College</option>
                <option value="Vanguard Academy of Science">Vanguard Academy of Science</option>
              </select>

              <button
                onClick={() => {
                  setBankSearch("");
                  setBankDifficulty("All");
                  setBankCollege("All");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Global Problems Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Platform Coding Problems ({filteredBank.length})</h3>
              <span className="text-xs text-slate-500">Cross-college problem bank monitoring</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3.5 px-6">Problem & Topic</th>
                    <th className="py-3.5 px-4">Origin College</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4">Acceptance Rate</th>
                    <th className="py-3.5 px-4">Test Cases</th>
                    <th className="py-3.5 px-4">Company Tags</th>
                    <th className="py-3.5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBank.map((prob) => (
                    <tr key={prob.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{prob.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                              {prob.topic}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{prob.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <span className="truncate block max-w-xs" title={prob.college}>
                          {prob.college}
                        </span>
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

                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {prob.acceptanceRate}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {prob.totalSubmissions} attempts
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {prob.testCases ? prob.testCases.length : 0} Cases
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {prob.companies &&
                            prob.companies.map((c, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                              >
                                {c}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedProblemModal(prob)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-700 font-semibold transition"
                        >
                          <Eye size={14} /> View Specification
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

      {/* TAB 2: COLLEGE-WISE PERFORMANCE */}
      {activeTab === "colleges" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search college name or location..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={collegeStatusFilter}
                onChange={(e) => setCollegeStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Top Performer">Top Performer</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Needs Attention">Needs Attention</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Institutional Coding Practice Comparison ({filteredColleges.length})
              </h3>
              <span className="text-xs text-slate-500">Cross-college solver metrics & accuracy audit</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3.5 px-6">College</th>
                    <th className="py-3.5 px-4">Active Coders</th>
                    <th className="py-3.5 px-4">Problems Solved</th>
                    <th className="py-3.5 px-4">Submissions</th>
                    <th className="py-3.5 px-4">Accuracy Rate</th>
                    <th className="py-3.5 px-4">Top Language</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredColleges.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{col.collegeName}</p>
                          <p className="text-[11px] text-slate-400">{col.location}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">{col.activeCoders} Students</td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-600">{col.totalProblemsSolved}</p>
                          <p className="text-[10px] text-slate-400">
                            E: {col.easySolved} | M: {col.mediumSolved} | H: {col.hardSolved}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600">{col.totalSubmissions}</td>

                      <td className="py-4 px-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                            <span>{col.accuracyRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                col.accuracyRate >= 78
                                  ? "bg-emerald-500"
                                  : col.accuracyRate >= 70
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${col.accuracyRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                          {col.topLanguage}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                            col.status
                          )}`}
                        >
                          {col.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedCollegeModal(col)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold transition"
                        >
                          <Eye size={14} /> Diagnostic
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

      {/* TAB 3: PLATFORM USAGE & SUBMISSION ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code size={18} className="text-indigo-600" />
                Compiler Language Preference Breakdown
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>C++ (GCC 12)</span>
                  <span>46% (13,087 Submissions)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "46%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Python 3.11</span>
                  <span>38% (10,811 Submissions)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "38%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Java (OpenJDK 17)</span>
                  <span>12% (3,414 Submissions)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "12%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>JavaScript (Node 20)</span>
                  <span>4% (1,138 Submissions)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "4%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Submission Verdict Ratios */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart size={18} className="text-emerald-600" />
                Global Submission Verdict Ratios
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800">Accepted (AC)</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">74.8%</p>
                <p className="text-[11px] text-emerald-700/70 mt-1">21,280 Passed</p>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                <p className="text-xs font-bold text-rose-800">Wrong Answer (WA)</p>
                <p className="text-2xl font-black text-rose-600 mt-1">15.2%</p>
                <p className="text-[11px] text-rose-700/70 mt-1">4,324 Failed</p>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800">Time Limit Exceeded</p>
                <p className="text-2xl font-black text-amber-600 mt-1">7.0%</p>
                <p className="text-[11px] text-amber-700/70 mt-1">1,991 TLE</p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800">Runtime Error (RE)</p>
                <p className="text-2xl font-black text-slate-700 mt-1">3.0%</p>
                <p className="text-[11px] text-slate-500 mt-1">855 Exceptions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PROBLEM SPECIFICATION */}
      {selectedProblemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold">{selectedProblemModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProblemModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-600">Origin College: </span>
                  <strong className="text-indigo-700">{selectedProblemModal.college}</strong>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">
                  {selectedProblemModal.difficulty}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Problem Description</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {selectedProblemModal.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Sample Input</h4>
                  <pre className="p-2.5 bg-slate-900 text-indigo-300 rounded-xl font-mono text-[11px]">
                    {selectedProblemModal.sampleInput}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Sample Output</h4>
                  <pre className="p-2.5 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px]">
                    {selectedProblemModal.sampleOutput}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProblemModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLLEGE DIAGNOSTIC */}
      {selectedCollegeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold">{selectedCollegeModal.collegeName}</h3>
              </div>
              <button
                onClick={() => setSelectedCollegeModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-slate-500 font-medium">Active Coders</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1">{selectedCollegeModal.activeCoders}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-slate-500 font-medium">Problems Solved</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{selectedCollegeModal.totalProblemsSolved}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-slate-500 font-medium">Accuracy Rate</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{selectedCollegeModal.accuracyRate}%</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Difficulty Breakdown</h4>
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>Easy Solved: <strong>{selectedCollegeModal.easySolved}</strong></span>
                  <span>Medium Solved: <strong>{selectedCollegeModal.mediumSolved}</strong></span>
                  <span>Hard Solved: <strong>{selectedCollegeModal.hardSolved}</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCollegeModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl"
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
