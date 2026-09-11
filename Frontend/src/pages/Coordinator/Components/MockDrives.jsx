import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Code,
  Bot,
  Brain,
  ChevronRight,
  Filter,
  X,
  Eye,
  Award,
  BarChart2,
  SlidersHorizontal,
} from 'lucide-react';
import '../Styles/MockDrives.css';

export default function CoordinatorMockDrives() {
  // Initial Mock Drives State
  const [drives, setDrives] = useState([
    {
      id: 1,
      name: "Full-Stack Software Engineering Mock Assessment",
      date: "2026-09-18",
      targetBatch: "CSE 2026 Alpha Cohort",
      department: "Computer Science & Engineering",
      status: "Live",
      eligibleCount: 120,
      startedCount: 108,
      completedCount: 94,
      aptitudeEnabled: true,
      codingEnabled: true,
      interviewEnabled: true,
    },
    {
      id: 2,
      name: "Data Structures & Core CS Aptitude Drive",
      date: "2026-09-22",
      targetBatch: "IT 2026 Beta",
      department: "Information Technology",
      status: "Upcoming",
      eligibleCount: 105,
      startedCount: 0,
      completedCount: 0,
      aptitudeEnabled: true,
      codingEnabled: true,
      interviewEnabled: false,
    },
    {
      id: 3,
      name: "AI Technical & System Design Mock Evaluation",
      date: "2026-09-05",
      targetBatch: "AI-DS-2026-Alpha",
      department: "AI & Data Science",
      status: "Completed",
      eligibleCount: 110,
      startedCount: 106,
      completedCount: 102,
      aptitudeEnabled: false,
      codingEnabled: true,
      interviewEnabled: true,
    },
  ]);

  // Selected Drive for Details / Results View
  const [selectedDrive, setSelectedDrive] = useState(drives[0]);

  // Participants & Results Data State
  const [participants] = useState([
    {
      id: 101,
      driveId: 1,
      name: "Aarav Sharma",
      rollNo: "CSE26-001",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 88,
      codingScore: 95,
      interviewScore: 92,
      finalScore: 91.6,
      status: "Completed",
      avatar: "AS",
    },
    {
      id: 102,
      driveId: 1,
      name: "Ananya Iyer",
      rollNo: "CSE26-031",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 92,
      codingScore: 90,
      interviewScore: 88,
      finalScore: 90.0,
      status: "Completed",
      avatar: "AI",
    },
    {
      id: 103,
      driveId: 1,
      name: "Riya Patel",
      rollNo: "CSE26-014",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 80,
      codingScore: 85,
      interviewScore: 84,
      finalScore: 83.0,
      status: "Completed",
      avatar: "RP",
    },
    {
      id: 104,
      driveId: 1,
      name: "Rohan Kulkarni",
      rollNo: "CSE26-045",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 74,
      codingScore: 68,
      interviewScore: 72,
      finalScore: 71.3,
      status: "Completed",
      avatar: "RK",
    },
    {
      id: 105,
      driveId: 1,
      name: "Siddharth Verma",
      rollNo: "CSE26-089",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 65,
      codingScore: 70,
      interviewScore: 0,
      finalScore: 45.0,
      status: "In Progress",
      avatar: "SV",
    },
    {
      id: 106,
      driveId: 1,
      name: "Neha Gupta",
      rollNo: "CSE26-022",
      batch: "CSE 2026 Alpha Cohort",
      aptitudeScore: 0,
      codingScore: 0,
      interviewScore: 0,
      finalScore: 0.0,
      status: "Not Started",
      avatar: "NG",
    },
  ]);

  // Filters State
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);

  // Form State for New Drive
  const [newDriveForm, setNewDriveForm] = useState({
    name: "",
    date: "",
    targetBatch: "CSE 2026 Alpha Cohort",
    department: "Computer Science & Engineering",
    aptitudeEnabled: true,
    aptitudeCutoff: 70,
    codingEnabled: true,
    codingDifficulty: "Medium",
    interviewEnabled: true,
    interviewDuration: "30 Mins",
  });

  // Handle Form Submit
  const handleCreateDrive = (e) => {
    e.preventDefault();
    if (!newDriveForm.name || !newDriveForm.date) return;

    const createdDrive = {
      id: Date.now(),
      name: newDriveForm.name,
      date: newDriveForm.date,
      targetBatch: newDriveForm.targetBatch,
      department: newDriveForm.department,
      status: "Upcoming",
      eligibleCount: 120,
      startedCount: 0,
      completedCount: 0,
      aptitudeEnabled: newDriveForm.aptitudeEnabled,
      codingEnabled: newDriveForm.codingEnabled,
      interviewEnabled: newDriveForm.interviewEnabled,
    };

    setDrives([createdDrive, ...drives]);
    setSelectedDrive(createdDrive);
    setIsCreateModalOpen(false);
    setNewDriveForm({
      name: "",
      date: "",
      targetBatch: "CSE 2026 Alpha Cohort",
      department: "Computer Science & Engineering",
      aptitudeEnabled: true,
      aptitudeCutoff: 70,
      codingEnabled: true,
      codingDifficulty: "Medium",
      interviewEnabled: true,
      interviewDuration: "30 Mins",
    });
  };

  // Filtered Participants List
  const filteredParticipants = participants.filter((p) => {
    const matchesDrive = p.driveId === selectedDrive?.id;
    const matchesSearch =
      p.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      p.rollNo.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || p.status === statusFilter;
    const matchesBatch =
      batchFilter === "All" || p.batch === batchFilter;

    return matchesDrive && matchesSearch && matchesStatus && matchesBatch;
  });

  return (
    <div className="coord-mockdrives-container">
      {/* Header */}
      <div className="coord-mockdrives-header">
        <div>
          <h1 className="coord-mockdrives-title">
            <ClipboardCheck size={24} className="text-indigo-600 inline-block mr-2" />
            Mock Drive Governance & Assessment Center
          </h1>
          <p className="coord-mockdrives-sub">
            Schedule, monitor, and evaluate comprehensive student mock placement drives across Aptitude, Coding, and AI Interviews.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="coord-mockdrives-stats-grid">
        <div className="coord-mockdrives-stat-card">
          <div className="stat-icon-wrapper bg-indigo-50 text-indigo-600">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <div className="stat-label">Total Mock Drives</div>
            <div className="stat-value">{drives.length} Drives</div>
            <div className="stat-sub">Across 4 active cohorts</div>
          </div>
        </div>

        <div className="coord-mockdrives-stat-card">
          <div className="stat-icon-wrapper bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-label">Active / Completed</div>
            <div className="stat-value">
              {drives.filter((d) => d.status === "Live" || d.status === "Completed").length} Drives
            </div>
            <div className="stat-sub">
              {drives.reduce((acc, d) => acc + d.completedCount, 0)} Total Candidates Evaluated
            </div>
          </div>
        </div>

        <div className="coord-mockdrives-stat-card">
          <div className="stat-icon-wrapper bg-purple-50 text-purple-600">
            <BarChart2 size={20} />
          </div>
          <div>
            <div className="stat-label">Average Benchmark</div>
            <div className="stat-value">84.5%</div>
            <div className="stat-sub">+3.2% vs last month</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Drive Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drive Selection List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Scheduled Drives</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {drives.length}
            </span>
          </h2>

          <div className="space-y-3">
            {drives.map((drive) => {
              const isSelected = selectedDrive?.id === drive.id;
              return (
                <div
                  key={drive.id}
                  onClick={() => setSelectedDrive(drive)}
                  className={`p-4 rounded-xl border transition cursor-pointer bg-white shadow-xs ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        drive.status === "Live"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : drive.status === "Upcoming"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {drive.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar size={12} /> {drive.date}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {drive.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{drive.targetBatch}</p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-indigo-500" /> {drive.eligibleCount} Eligible
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 size={12} /> {drive.completedCount} Completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Drive Details & Result Table */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDrive ? (
            <>
              {/* Selected Drive Overview Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {selectedDrive.department}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Target: {selectedDrive.targetBatch}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedDrive.name}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
                      selectedDrive.status === "Live"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedDrive.status === "Upcoming"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {selectedDrive.status}
                  </span>
                </div>

                {/* Drive Progress Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="p-2">
                    <div className="text-xs text-slate-500 font-medium">Eligible Students</div>
                    <div className="text-lg font-bold text-slate-900">{selectedDrive.eligibleCount}</div>
                  </div>
                  <div className="p-2 border-x border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Started Assessment</div>
                    <div className="text-lg font-bold text-indigo-600">{selectedDrive.startedCount}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs text-slate-500 font-medium">Completed All Modules</div>
                    <div className="text-lg font-bold text-emerald-600">{selectedDrive.completedCount}</div>
                  </div>
                </div>

                {/* Active Modules Indicators */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                  <span className="text-slate-400">Configured Components:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    selectedDrive.aptitudeEnabled ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400 line-through"
                  }`}>
                    <Brain size={13} /> Aptitude
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    selectedDrive.codingEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400 line-through"
                  }`}>
                    <Code size={13} /> Coding
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    selectedDrive.interviewEnabled ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-400 line-through"
                  }`}>
                    <Bot size={13} /> AI Interview
                  </span>
                </div>
              </div>

              {/* Candidate Results Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Filter Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Search student or roll no..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Not Started">Not Started</option>
                    </select>

                    <select
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                      value={batchFilter}
                      onChange={(e) => setBatchFilter(e.target.value)}
                    >
                      <option value="All">All Batches</option>
                      <option value="CSE 2026 Alpha Cohort">CSE 2026 Alpha Cohort</option>
                      <option value="IT 2026 Beta">IT 2026 Beta</option>
                      <option value="AI-DS-2026-Alpha">AI-DS-2026-Alpha</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Aptitude</th>
                        <th className="py-3 px-4">Coding</th>
                        <th className="py-3 px-4">AI Interview</th>
                        <th className="py-3 px-4">Final Score</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No candidate results found matching current criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                                  {p.avatar}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{p.name}</div>
                                  <div className="text-[10px] text-slate-400">{p.rollNo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {selectedDrive.aptitudeEnabled ? (
                                <span className="font-bold text-slate-800">{p.aptitudeScore}%</span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {selectedDrive.codingEnabled ? (
                                <span className="font-bold text-emerald-700">{p.codingScore}%</span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {selectedDrive.interviewEnabled ? (
                                <span className="font-bold text-purple-700">{p.interviewScore}%</span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-indigo-600 text-sm">
                                {p.finalScore}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  p.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : p.status === "In Progress"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedStudentResult(p)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                              >
                                <Eye size={12} /> View Result
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a mock drive to view full results and details.
            </div>
          )}
        </div>
      </div>

      {/* CREATE MOCK DRIVE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" /> Schedule New Mock Drive
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drive Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fullstack Developer Placement Mock Assessment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={newDriveForm.name}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drive Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={newDriveForm.date}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Cohort / Batch</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold text-slate-700"
                    value={newDriveForm.targetBatch}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, targetBatch: e.target.value })}
                  >
                    <option value="CSE 2026 Alpha Cohort">CSE 2026 Alpha Cohort</option>
                    <option value="IT 2026 Beta">IT 2026 Beta</option>
                    <option value="AI-DS-2026-Alpha">AI-DS-2026-Alpha</option>
                  </select>
                </div>
              </div>

              {/* Components Enable Toggles */}
              <div className="pt-2 space-y-3">
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Assessment Components Config
                </label>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Brain size={14} className="text-indigo-600" /> Aptitude Assessment Component
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={newDriveForm.aptitudeEnabled}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, aptitudeEnabled: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Code size={14} className="text-emerald-600" /> Coding & Data Structures Component
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={newDriveForm.codingEnabled}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, codingEnabled: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Bot size={14} className="text-purple-600" /> AI Technical Interview Component
                    </span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={newDriveForm.interviewEnabled}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, interviewEnabled: e.target.checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-xs"
                >
                  Create Mock Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT RESULT SCORECARD MODAL */}
      {selectedStudentResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Candidate Mock Scorecard
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentResult(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedStudentResult.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedStudentResult.name}</div>
                  <div className="text-xs text-slate-500">{selectedStudentResult.rollNo} • {selectedStudentResult.batch}</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Brain size={14} className="text-indigo-600" /> Aptitude Score
                  </span>
                  <span className="font-bold text-slate-900">{selectedStudentResult.aptitudeScore}%</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Code size={14} className="text-emerald-600" /> Coding & Data Structures Score
                  </span>
                  <span className="font-bold text-emerald-600">{selectedStudentResult.codingScore}%</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Bot size={14} className="text-purple-600" /> AI Interview Rating
                  </span>
                  <span className="font-bold text-purple-600">{selectedStudentResult.interviewScore}%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Final Aggregated Score:</span>
                <span className="text-lg font-bold text-indigo-600">{selectedStudentResult.finalScore}%</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedStudentResult(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
