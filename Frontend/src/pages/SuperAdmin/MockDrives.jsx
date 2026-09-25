import React, { useState } from 'react';
import {
  ClipboardCheck,
  Building2,
  Users,
  Search,
  CheckCircle2,
  BarChart3,
  Calendar,
  Filter,
  Eye,
  Award,
  BookOpen,
} from 'lucide-react';

export default function SuperAdminMockDrives() {
  // Institutional High-level Mock Drives Overview Dataset
  const [drives] = useState([
    {
      id: 1,
      college: "Apex Institute of Technology",
      driveName: "Full-Stack Software Engineering Mock Assessment",
      targetCohort: "CSE & IT 2026",
      participantsEligible: 225,
      participantsAttended: 212,
      completionRate: 94.2,
      avgResultScore: 86.4,
      status: "Live",
      date: "2026-09-18",
    },
    {
      id: 2,
      college: "Metropolitan College of Engineering",
      driveName: "Data Structures & Core CS Benchmark Assessment",
      targetCohort: "CSE 2026",
      participantsEligible: 180,
      participantsAttended: 175,
      completionRate: 97.2,
      avgResultScore: 82.1,
      status: "Completed",
      date: "2026-09-12",
    },
    {
      id: 3,
      college: "St. Xavier Institute of Technology",
      driveName: "AI Technical & System Design Mock Evaluation",
      targetCohort: "AI-DS 2026",
      participantsEligible: 140,
      participantsAttended: 132,
      completionRate: 94.2,
      avgResultScore: 88.9,
      status: "Completed",
      date: "2026-09-08",
    },
    {
      id: 4,
      college: "Apex Institute of Technology",
      driveName: "Cloud Native & DevOps Infrastructure Mock",
      targetCohort: "IT & DevOps 2026",
      participantsEligible: 120,
      participantsAttended: 0,
      completionRate: 0.0,
      avgResultScore: 0.0,
      status: "Scheduled",
      date: "2026-09-25",
    },
    {
      id: 5,
      college: "Global Tech Academy",
      driveName: "Aptitude & Logical Reasoning Campus Benchmark",
      targetCohort: "All B.Tech Batches",
      participantsEligible: 310,
      participantsAttended: 295,
      completionRate: 95.1,
      avgResultScore: 79.5,
      status: "Completed",
      date: "2026-09-02",
    },
  ]);

  // Filters State
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Drive for Detail Modal
  const [selectedDriveModal, setSelectedDriveModal] = useState(null);

  // Filtered List
  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.driveName.toLowerCase().includes(search.toLowerCase()) ||
      d.college.toLowerCase().includes(search.toLowerCase()) ||
      d.targetCohort.toLowerCase().includes(search.toLowerCase());

    const matchesCollege =
      collegeFilter === "All" || d.college === collegeFilter;
    const matchesStatus =
      statusFilter === "All" || d.status === statusFilter;

    return matchesSearch && matchesCollege && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <span>Institutional Placement Mock Drive Overview</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cross-institutional monitoring of placement mock assessments, completion rates, and average score benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-xl border border-indigo-200">
          <Building2 className="w-4 h-4" />
          <span>Institutional Governance Mode</span>
        </div>
      </div>

      {/* High-Level Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Mock Drives</div>
            <div className="text-lg font-bold text-slate-900">{drives.length} Drives</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Partner Colleges</div>
            <div className="text-lg font-bold text-slate-900">4 Institutions</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Avg Completion Rate</div>
            <div className="text-lg font-bold text-emerald-600">95.4%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Campus Avg Result</div>
            <div className="text-lg font-bold text-purple-600">84.2%</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search drive name, target cohort, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          >
            <option value="All">All Partner Colleges</option>
            <option value="Apex Institute of Technology">Apex Institute of Technology</option>
            <option value="Metropolitan College of Engineering">Metropolitan College of Engineering</option>
            <option value="St. Xavier Institute of Technology">St. Xavier Institute of Technology</option>
            <option value="Global Tech Academy">Global Tech Academy</option>
          </select>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Live">Live</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Super Admin Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3.5 px-4">College</th>
                <th className="py-3.5 px-4">Drive Name</th>
                <th className="py-3.5 px-4">Participants</th>
                <th className="py-3.5 px-4">Completion</th>
                <th className="py-3.5 px-4">Average Result</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Monitoring Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredDrives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No mock drives match the selected college or status filter.
                  </td>
                </tr>
              ) : (
                filteredDrives.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{d.college}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{d.targetCohort}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{d.driveName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Date: {d.date}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {d.participantsAttended} / {d.participantsEligible}
                      </div>
                      <div className="text-[10px] text-slate-400">Candidates</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${d.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{d.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-indigo-600 text-sm">
                        {d.avgResultScore > 0 ? `${d.avgResultScore}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.status === 'Live'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : d.status === 'Scheduled'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDriveModal(d)}
                        className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> View Breakdown
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL FOR SUPER ADMIN */}
      {selectedDriveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  {selectedDriveModal.college}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedDriveModal.driveName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDriveModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-500 font-medium">Eligible Candidates</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedDriveModal.participantsEligible}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-500 font-medium">Attended Candidates</div>
                <div className="text-base font-bold text-indigo-600 mt-0.5">
                  {selectedDriveModal.participantsAttended}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-500 font-medium">Completion Percentage</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">
                  {selectedDriveModal.completionRate}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-500 font-medium">Average Performance Score</div>
                <div className="text-base font-bold text-purple-600 mt-0.5">
                  {selectedDriveModal.avgResultScore}%
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDriveModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
