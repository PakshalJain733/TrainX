import React, { useState } from "react";
import {
  Code,
  Building2,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Cpu,
  Layers,
  Globe,
  PieChart,
  Eye,
  X,
  TrendingUp,
} from "lucide-react";
import {
  initialCodingProblems,
  globalPlatformStats,
  collegePerformanceList,
} from "../../data/codingPracticeMockData";

export default function SuperAdminCodingPractice() {
  const [activeTab, setActiveTab] = useState("bank");
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);

  const filteredProblems = (initialCodingProblems || []).filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-[#090d16]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code className="text-indigo-400" size={24} /> Global Coding Practice Monitoring
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor platform-wide problem bank, institutional performance analytics, language compilers, and verdict ratios.
        </p>
      </div>

      {/* Top Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-semibold">Total Problems</div>
          <div className="text-2xl font-extrabold text-white mt-1">{globalPlatformStats?.totalProblems || 184}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-semibold">Total Submissions</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">{globalPlatformStats?.totalSubmissions || "28,450"}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-semibold">Platform Accuracy</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{globalPlatformStats?.accuracyRate || "74.8%"}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-semibold">Active Coders</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{globalPlatformStats?.activeCoders || "3,420"}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-semibold">Top Language</div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1">{globalPlatformStats?.topLanguage || "C++"}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "bank", label: "Global Problem Bank", icon: Code },
          { id: "colleges", label: "College-Wise Performance", icon: Building2 },
          { id: "analytics", label: "Platform Usage & Analytics", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GLOBAL PROBLEM BANK */}
      {activeTab === "bank" && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search global problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProblems.map((prob) => (
              <div key={prob.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        prob.difficulty === "Easy"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : prob.difficulty === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                    <span className="text-xs text-indigo-400 font-bold">+{prob.xp} XP</span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2">{prob.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prob.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-xs text-slate-500 font-medium">Topic: {prob.topic}</span>
                  <button
                    onClick={() => setSelectedProblem(prob)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all"
                  >
                    <Eye size={14} /> View Specification
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COLLEGE-WISE PERFORMANCE */}
      {activeTab === "colleges" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
          <h2 className="text-base font-bold text-white mb-4">Institutional Coding Analytics</h2>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="pb-3 px-3">College Name</th>
                <th className="pb-3 px-3">Active Coders</th>
                <th className="pb-3 px-3">Problems Solved (E / M / H)</th>
                <th className="pb-3 px-3">Submissions</th>
                <th className="pb-3 px-3">Accuracy %</th>
                <th className="pb-3 px-3">Top Language</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(collegePerformanceList || []).map((col) => (
                <tr key={col.id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-3 font-bold text-white">{col.collegeName}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-300">{col.activeCoders}</td>
                  <td className="py-3.5 px-3 text-xs font-mono text-slate-400">
                    <span className="text-emerald-400 font-bold">{col.problemsSolved.easy}</span> /{" "}
                    <span className="text-amber-400 font-bold">{col.problemsSolved.medium}</span> /{" "}
                    <span className="text-rose-400 font-bold">{col.problemsSolved.hard}</span>
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-300">{col.totalSubmissions}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-400">{col.accuracyRate}</td>
                  <td className="py-3.5 px-3 font-semibold text-indigo-400">{col.topLanguage}</td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedCollege(col)}
                      className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20"
                    >
                      Diagnostic
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PLATFORM USAGE & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compiler Language Distribution */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="text-indigo-400" size={18} /> Compiler Language Distribution
            </h3>
            <div className="space-y-3">
              {(globalPlatformStats?.languageDistribution || []).map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{lang.name}</span>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }} className="h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Verdict Ratios */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="text-emerald-400" size={18} /> Submission Verdict Ratios
            </h3>
            <div className="space-y-3">
              {(globalPlatformStats?.verdictRatios || []).map((verdict) => (
                <div key={verdict.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{verdict.name}</span>
                    <span>{verdict.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${verdict.percentage}%`, backgroundColor: verdict.color }} className="h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPECIFICATION MODAL */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">{selectedProblem.title}</h3>
              <button onClick={() => setSelectedProblem(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="text-xs text-slate-400 space-y-2">
              <div><strong className="text-white">Topic:</strong> {selectedProblem.topic}</div>
              <div><strong className="text-white">Difficulty:</strong> {selectedProblem.difficulty}</div>
              <div><strong className="text-white">Time Limit:</strong> {selectedProblem.timeLimit}</div>
              <div><strong className="text-white">Memory Limit:</strong> {selectedProblem.memoryLimit}</div>
              <div className="pt-2"><strong className="text-white">Description:</strong> {selectedProblem.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* COLLEGE DIAGNOSTIC MODAL */}
      {selectedCollege && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{selectedCollege.collegeName}</h3>
              <button onClick={() => setSelectedCollege(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between"><span>Active Coders:</span> <strong className="text-white">{selectedCollege.activeCoders}</strong></div>
              <div className="flex justify-between"><span>Total Submissions:</span> <strong className="text-white">{selectedCollege.totalSubmissions}</strong></div>
              <div className="flex justify-between"><span>Accuracy Rate:</span> <strong className="text-emerald-400">{selectedCollege.accuracyRate}</strong></div>
              <div className="flex justify-between"><span>Top Language:</span> <strong className="text-indigo-400">{selectedCollege.topLanguage}</strong></div>
              <div className="flex justify-between"><span>Status:</span> <strong className="text-amber-400">{selectedCollege.status}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
