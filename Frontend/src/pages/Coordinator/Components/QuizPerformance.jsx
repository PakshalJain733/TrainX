import { useState } from "react";
import {
  FileCheck2,
  Zap,
  BookOpen,
  Award,
  AlertTriangle,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  BarChart2,
  LineChart,
} from "lucide-react";
import {
  coordinatorAssessments,
  coordinatorBatches,
  coordinatorStudents,
  coordinatorDetailedQuizScorecards,
} from "../../../data/coordinatorMockData";

export default function QuizPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");

  const unreadDefaulters = coordinatorStudents.filter((s) => s.attendance < 75 || s.riskStatus === "High Risk");

  const filteredQuizzes = coordinatorAssessments.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.batch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "All" || q.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Quizzes Conducted</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{coordinatorAssessments.length} Active</div>
          <div className="text-xs text-slate-500">Across 4 managed department batches</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Overall Quiz Submission</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">91.2%</div>
          <div className="text-xs text-slate-500">279 / 335 total student attempts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Avg Department Score</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600">84.5%</div>
          <div className="text-xs text-slate-500">+3.2% performance vs previous test</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Retake Required (&lt;60%)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">14 Students</div>
          <div className="text-xs text-slate-500">Scored below mandatory cutoff</div>
        </div>
      </div>

      {/* Batch Performance Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-600" /> Batch-wise Quiz Performance Governance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coordinatorBatches.map((b) => (
            <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500">{b.name}</div>
              <div className="text-xl font-extrabold text-slate-900">{b.avgAttendance}% Avg Score</div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${b.avgAttendance}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                <span>Pass Rate: <strong className="text-emerald-600">92.4%</strong></span>
                <span>Defaulters: <strong className="text-rose-600">{b.defaultersCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search quiz title or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="All">All Batches</option>
            {coordinatorBatches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={() => alert("Exporting Quiz Performance Report PDF...")}
            className="h-10 inline-flex items-center gap-2 px-4 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">

        {/* Quizzes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Quiz Title</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Avg Score</th>
                <th className="py-3 px-4">Pass Rate</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuizzes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{q.title}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{q.batch}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {q.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{q.submissions}</td>
                  <td className="py-3.5 px-4 font-bold text-purple-600">{q.avgScore}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">{q.passRate}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
