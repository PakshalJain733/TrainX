import { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  UserX,
  UserCheck,
  Calendar,
  BookOpen,
  Send,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  PlusCircle,
  FileWarning,
} from "lucide-react";
import { coordinatorStudentsNeedImprovement, coordinatorBatches } from "../../../data/coordinatorMockData";

export default function StudentsNeedImprovement() {
  const [dataList, setDataList] = useState(coordinatorStudentsNeedImprovement);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  // Modal Form State
  const [planType, setPlanType] = useState("Custom Practice Set & Mentor Counseling");
  const [planDeadline, setPlanDeadline] = useState("2026-09-15");
  const [planNotes, setPlanNotes] = useState("");

  // Filters
  const filteredData = dataList.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignedMentor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
    const matchesRisk = selectedRisk === "all" || s.riskLevel === selectedRisk;
    return matchesSearch && matchesBatch && matchesRisk;
  });

  // Calculate Metrics
  const totalHighRisk = dataList.filter((s) => s.riskLevel === "High Risk").length;
  const totalModerateRisk = dataList.filter((s) => s.riskLevel === "Moderate Risk").length;
  const attendanceDefaulters = dataList.filter((s) => s.attendance < 75).length;
  const interviewDefaulters = dataList.filter((s) => s.interviewScore < 60).length;

  const handleAssignPlan = (e) => {
    e.preventDefault();
    if (!selectedStudentForModal) return;

    const updated = dataList.map((s) => {
      if (s.id === selectedStudentForModal.id) {
        return {
          ...s,
          remediationStatus: "Remediation Plan Assigned",
          assignedPlan: planType,
          targetDeadline: planDeadline,
          notes: planNotes || s.notes,
        };
      }
      return s;
    });

    setDataList(updated);
    alert(`Remedial action plan assigned to ${selectedStudentForModal.studentName} successfully!`);
    setSelectedStudentForModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <AlertTriangle size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-700/50 border border-rose-500/30 text-xs font-semibold text-rose-200 mb-3 backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-400" />
              <span>Coordinator Risk Remediation & Defaulter Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Students Needing Improvement
            </h1>
            <p className="text-sm text-rose-200 mt-1 max-w-2xl">
              Identify struggling students across attendance, coding accuracy, quiz performance, and mock interviews to assign targeted support plans.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedBatch("all");
                setSelectedRisk("all");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700/40 hover:bg-rose-700/60 border border-rose-500/30 rounded-xl text-xs font-medium text-white transition backdrop-blur-sm"
            >
              <RefreshCw size={14} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-rose-200 transition">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">High Risk Students</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{totalHighRisk} Students</p>
            <p className="text-[11px] text-rose-500 mt-0.5">Requires immediate intervention</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-rose-200 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Moderate Risk</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{totalModerateRisk} Students</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Borderline metrics</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-rose-200 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <UserX size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Attendance Defaulters</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{attendanceDefaulters} Students</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Attendance &lt; 75%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-rose-200 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileWarning size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Interview Defaulters</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{interviewDefaulters} Students</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Mock Score &lt; 60%</p>
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
              placeholder="Search student, roll no, mentor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Batches</option>
              {coordinatorBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Risk Level Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="High Risk">High Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Risk Cards List */}
      <div className="space-y-4">
        {filteredData.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 hover:shadow-md transition space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              {/* Left: Student Basic Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl font-bold text-lg flex items-center justify-center ${
                    student.riskLevel === "High Risk"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}
                >
                  {student.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{student.studentName}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        student.riskLevel === "High Risk"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {student.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {student.rollNo} · {student.batch} · Mentor:{" "}
                    <strong className="text-slate-700">{student.assignedMentor}</strong>
                  </p>
                </div>
              </div>

              {/* Right: Remediation Status & Action */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Remediation Status</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 mt-0.5">
                    <Clock size={13} />
                    {student.remediationStatus}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudentForModal(student);
                    setPlanNotes(student.notes || "");
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <PlusCircle size={14} />
                  Assign Remedial Plan
                </button>
              </div>
            </div>

            {/* Metrics Breakdown Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Attendance</span>
                <span
                  className={`text-sm font-bold ${
                    student.attendance < 75 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {student.attendance}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Avg Quiz Score</span>
                <span
                  className={`text-sm font-bold ${
                    student.avgQuizScore < 60 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {student.avgQuizScore}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Coding Accuracy</span>
                <span
                  className={`text-sm font-bold ${
                    student.codingAccuracy < 60 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {student.codingAccuracy}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Interview Score</span>
                <span
                  className={`text-sm font-bold ${
                    student.interviewScore < 60 ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {student.interviewScore}%
                </span>
              </div>
            </div>

            {/* Risk Factors & Support Plan Detail */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs pt-1">
              <div>
                <span className="font-semibold text-slate-500 block mb-1.5">Identified Risk Factors:</span>
                <div className="flex flex-wrap gap-2">
                  {student.riskFactors.map((rf, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200"
                    >
                      {rf}
                    </span>
                  ))}
                </div>
              </div>

              {student.assignedPlan && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl max-w-md">
                  <span className="font-bold text-amber-900 block text-[11px]">Active Support Plan:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">{student.assignedPlan}</p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Target Deadline: <strong>{student.targetDeadline}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No students needing improvement match your active search filter options.
          </div>
        )}
      </div>

      {/* Remediation Plan Assignment Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold text-white">Assign Remedial Support Plan</h3>
              <p className="text-xs text-rose-200 mt-1">
                Student: <strong>{selectedStudentForModal.studentName}</strong> ({selectedStudentForModal.rollNo})
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignPlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Action Plan Type</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Remedial Linear Algebra & PyTorch Practice Set + 1-on-1 Mentor Counseling">
                    Custom Practice Set & Mentor Counseling
                  </option>
                  <option value="Mandatory DSA Bootcamp (Arrays, Stacks & Recursion)">
                    Mandatory Coding Bootcamp
                  </option>
                  <option value="Official Attendance Defaulter Warning + Catchup Labs">
                    Attendance Defaulter Warning Notice
                  </option>
                  <option value="Retake AI Mock Interview Round #2">
                    Retake AI Mock Interview Round
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Remediation Deadline</label>
                <input
                  type="date"
                  value={planDeadline}
                  onChange={(e) => setPlanDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Coordinator Directives & Notes</label>
                <textarea
                  rows={3}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Enter specific instructions for student and assigned mentor..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  Confirm & Trigger Remediation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
