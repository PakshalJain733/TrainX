import { useState } from "react";
import {
  AlertTriangle,
  Search,
  UserX,
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
  ChevronRight,
  Eye,
  BarChart3,
  BrainCircuit,
  Filter,
  CheckCircle,
  HelpCircle,
  GraduationCap
} from "lucide-react";
import { coordinatorSkillGapStudents, coordinatorBatches } from "../../../data/coordinatorMockData";

export default function StudentsNeedImprovement() {
  const [dataList, setDataList] = useState(coordinatorSkillGapStudents);
  const [activeTab, setActiveTab] = useState("all"); // "all", "immediate", "commonSkills", "improving", "notImproving"
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  
  // Detail Modal State (Task 2)
  const [selectedSkillGapStudent, setSelectedSkillGapStudent] = useState(null);
  
  // Remediation Plan Modal State
  const [remediationStudent, setRemediationStudent] = useState(null);
  const [planType, setPlanType] = useState("Custom Practice Set & Mentor Counseling");
  const [planDeadline, setPlanDeadline] = useState("2026-09-15");
  const [planNotes, setPlanNotes] = useState("");

  // Extract Unique Departments & Batches for Filters
  const departments = Array.from(new Set(dataList.map((s) => s.department)));
  const batches = Array.from(new Set(dataList.map((s) => s.batch)));

  // Filter Logic
  const filteredStudents = dataList.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.assignedMentor && student.assignedMentor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = selectedDept === "all" || student.department === selectedDept;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    const matchesPriority = selectedPriority === "all" || student.priority === selectedPriority;

    if (activeTab === "immediate") {
      return matchesSearch && matchesDept && matchesBatch && student.priority === "High";
    }
    if (activeTab === "improving") {
      return matchesSearch && matchesDept && matchesBatch && matchesPriority && student.trendStatus === "Improving";
    }
    if (activeTab === "notImproving") {
      return matchesSearch && matchesDept && matchesBatch && matchesPriority && student.trendStatus === "Not Improving";
    }

    return matchesSearch && matchesDept && matchesBatch && matchesPriority;
  });

  // Calculate Improvement Monitoring Metrics (Task 3)
  const immediateAttentionStudents = dataList.filter((s) => s.priority === "High");
  const improvingStudents = dataList.filter((s) => s.trendStatus === "Improving");
  const notImprovingStudents = dataList.filter((s) => s.trendStatus === "Not Improving");

  // Most Common Weak Skills Aggregation
  const skillCountMap = {};
  dataList.forEach((student) => {
    student.weakSkills.forEach((ws) => {
      if (!skillCountMap[ws.skillName]) {
        skillCountMap[ws.skillName] = {
          skillName: ws.skillName,
          count: 0,
          totalScore: 0,
          sources: new Set(),
          levels: { Critical: 0, High: 0, Moderate: 0 }
        };
      }
      skillCountMap[ws.skillName].count += 1;
      skillCountMap[ws.skillName].totalScore += ws.currentScore;
      skillCountMap[ws.skillName].sources.add(ws.source);
      if (skillCountMap[ws.skillName].levels[ws.level] !== undefined) {
        skillCountMap[ws.skillName].levels[ws.level] += 1;
      }
    });
  });

  const commonWeakSkills = Object.values(skillCountMap).map((item) => ({
    ...item,
    avgScore: Math.round(item.totalScore / item.count),
    sourcesList: Array.from(item.sources).join(", ")
  })).sort((a, b) => b.count - a.count);

  const handleAssignPlan = (e) => {
    e.preventDefault();
    if (!remediationStudent) return;

    const updated = dataList.map((s) => {
      if (s.id === remediationStudent.id) {
        return {
          ...s,
          trendStatus: "Improving",
          assignedPlan: planType,
          targetDeadline: planDeadline,
          notes: planNotes || "Remediation plan assigned by coordinator."
        };
      }
      return s;
    });

    setDataList(updated);
    alert(`Remedial action plan assigned to ${remediationStudent.studentName} successfully!`);
    setRemediationStudent(null);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getWeaknessLevelBadge = (level) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200 font-bold";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200 font-semibold";
      case "Moderate":
        return "bg-amber-100 text-amber-800 border-amber-200 font-medium";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Coordinator Skill-Gap Analysis
            </h1>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              Harshad Workflow
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Identify students with weak skill areas, inspect granular scores across quizzes, coding & interviews, and assign targeted remediation plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDept("all");
              setSelectedBatch("all");
              setSelectedPriority("all");
              setActiveTab("all");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={14} />
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Task 3: Improvement Monitoring Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab("immediate")}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === "immediate"
              ? "bg-rose-50/90 border-rose-400 ring-2 ring-rose-400/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-rose-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              High Priority
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Needing Immediate Attention</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{immediateAttentionStudents.length} Students</p>
            <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
              <AlertTriangle size={12} /> High risk priority skills
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("commonSkills")}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === "commonSkills"
              ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-indigo-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BrainCircuit size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {commonWeakSkills.length} Topics
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Most Common Weak Skills</p>
            <p className="text-2xl font-black text-indigo-700 mt-0.5">
              {commonWeakSkills[0]?.skillName || "DBMS"}
            </p>
            <p className="text-[11px] text-indigo-600 mt-1 font-medium">
              Affecting {commonWeakSkills[0]?.count || 0} students
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("improving")}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === "improving"
              ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Positive Growth
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Students Improving</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{improvingStudents.length} Students</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <CheckCircle size={12} /> Positive response to practice
            </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("notImproving")}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === "notImproving"
              ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-sm"
              : "bg-white border-slate-200/80 hover:border-amber-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <TrendingDown size={22} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Action Needed
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Performance Not Improving</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{notImprovingStudents.length} Students</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">
              Stagnant or declining trend
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Students Needing Improvement ({dataList.length})
        </button>
        <button
          onClick={() => setActiveTab("immediate")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "immediate"
              ? "bg-rose-700 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          <ShieldAlert size={14} />
          Immediate Attention ({immediateAttentionStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("commonSkills")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "commonSkills"
              ? "bg-indigo-700 text-white shadow-xs"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          }`}
        >
          <BarChart3 size={14} />
          Most Common Weak Skills
        </button>
        <button
          onClick={() => setActiveTab("improving")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "improving"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <TrendingUp size={14} />
          Improving ({improvingStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("notImproving")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === "notImproving"
              ? "bg-amber-700 text-white shadow-xs"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <TrendingDown size={14} />
          Not Improving ({notImprovingStudents.length})
        </button>
      </div>

      {/* View Content based on Tab */}
      {activeTab === "commonSkills" ? (
        /* Task 3: Most Common Weak Skills Analysis Breakdown */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="text-indigo-600" size={20} />
              Most Common Weak Skills Analysis across Department
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Aggregated frequency of skill gaps to guide department workshop scheduling and faculty interventions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commonWeakSkills.map((skill, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:shadow-md transition space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{skill.skillName}</h3>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200">
                    {skill.count} Students Weak
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Average Student Score:</span>
                    <span className={skill.avgScore < 50 ? "text-rose-600 font-bold" : "text-amber-600"}>
                      {skill.avgScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        skill.avgScore < 50 ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${skill.avgScore}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 text-xs space-y-1 text-slate-500">
                  <p>
                    <strong>Primary Sources:</strong> {skill.sourcesList}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>Severity:</span>
                    <span className="text-rose-600 font-semibold">{skill.levels.Critical} Critical</span> · 
                    <span className="text-amber-600 font-semibold">{skill.levels.High} High</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Task 1 & Task 3: Filterable Students List */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-start gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, roll no, mentor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 ml-1">
                <Filter size={14} />
                <span>Filters:</span>
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} Department
                  </option>
                ))}
              </select>

              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Task 1 Table View for Students Needing Improvement */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Roll Number</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4 text-center">Overall Performance</th>
                    <th className="py-3.5 px-4 text-center">Weak Skills</th>
                    <th className="py-3.5 px-4 text-center">Improvement Priority</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition">
                      {/* Student Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 text-xs">
                            {student.studentName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{student.studentName}</span>
                            <span className="text-[11px] text-slate-400 font-normal">Mentor: {student.assignedMentor || "Assigned"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {student.rollNo}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                          {student.department}
                        </span>
                      </td>

                      {/* Batch */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {student.batch}
                      </td>

                      {/* Overall Performance */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-bold text-sm ${
                            student.overallPerformance < 65 ? "text-rose-600" : "text-amber-600"
                          }`}>
                            {student.overallPerformance}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                student.overallPerformance < 65 ? "bg-rose-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${student.overallPerformance}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Number of Weak Skills */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                          {student.weakSkillsCount} Weak Skills
                        </span>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityBadgeClass(student.priority)}`}>
                          {student.priority} Priority
                        </span>
                      </td>

                      {/* View Skill Gap Button */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSkillGapStudent(student)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={14} />
                            View Skill Gap
                          </button>
                          <button
                            onClick={() => setRemediationStudent(student)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                            title="Assign Remediation Plan"
                          >
                            <PlusCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No students found matching your selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Task 2: Student Skill-Gap Details Modal */}
      {selectedSkillGapStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-0">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">Student Skill-Gap Details</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(selectedSkillGapStudent.priority)}`}>
                    {selectedSkillGapStudent.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Student: <strong className="text-white">{selectedSkillGapStudent.studentName}</strong> (Roll: {selectedSkillGapStudent.rollNo}) · Dept: {selectedSkillGapStudent.department} · Batch: {selectedSkillGapStudent.batch}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall Performance</span>
                  <span className="text-xl font-black text-rose-400">{selectedSkillGapStudent.overallPerformance}%</span>
                </div>
                <button
                  onClick={() => setSelectedSkillGapStudent(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Task 2 Content Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldAlert className="text-rose-600" size={18} />
                  Identified Weak Skills ({selectedSkillGapStudent.weakSkills.length})
                </h4>
                <span className="text-xs text-slate-500">
                  Assigned Mentor: <strong className="text-slate-800">{selectedSkillGapStudent.assignedMentor || "Not Assigned"}</strong>
                </span>
              </div>

              {/* Weak Skills Cards / Table */}
              <div className="space-y-4">
                {selectedSkillGapStudent.weakSkills.map((skill, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{skill.skillName}</h5>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getWeaknessLevelBadge(skill.level)}`}>
                            {skill.level} Weakness
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Source of Weakness: <strong className="text-slate-700">{skill.source}</strong> (Quizzes, Submissions & Interviews)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Current Score:</span>
                        <span className="text-base font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                          {skill.currentScore}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${skill.currentScore}%` }}
                      />
                    </div>

                    {/* Task 2: Suggested Improvement */}
                    <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-600" />
                        Suggested Actionable Improvement:
                      </span>
                      <p className="text-amber-800 leading-relaxed">
                        {skill.suggestedImprovement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Harshad Flow: <strong className="text-slate-700">Coordinator → Skill-Gap → Student → Weak Skills + Scores → Improvement Suggestions</strong>
              </span>
              <button
                onClick={() => {
                  setRemediationStudent(selectedSkillGapStudent);
                  setSelectedSkillGapStudent(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle size={15} />
                Assign Formal Support Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Plan Assignment Modal */}
      {remediationStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setRemediationStudent(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold text-white">Assign Remedial Support Plan</h3>
              <p className="text-xs text-rose-200 mt-1">
                Student: <strong>{remediationStudent.studentName}</strong> ({remediationStudent.rollNo})
              </p>
            </div>

            <form onSubmit={handleAssignPlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Action Plan Type</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Custom DBMS & Data Structures Practice Set + 1-on-1 Mentor Counseling">
                    Custom Practice Set & Mentor Counseling
                  </option>
                  <option value="Mandatory DSA & System Design Coding Bootcamp">
                    Mandatory Coding Bootcamp
                  </option>
                  <option value="Official Skill Defaulter Warning + Catchup Labs">
                    Academic Skill Warning Notice
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRemediationStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
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
