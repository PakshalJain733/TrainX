import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Check, Users, UserPlus, UserCog, Search, ShieldCheck, ShieldAlert, UserCheck, GraduationCap, Mail, Building2, Calendar, Clock, CheckCircle2, XCircle, Phone, BookOpen, Key, KeyRound, Copy, ChevronDown, X, Sparkles, Trash2, Briefcase, BookOpenCheck, Zap, User, FileSpreadsheet, UploadCloud, Download, AlertCircle, Eye, EyeOff } from "lucide-react";
import * as XLSX from 'xlsx';
import EmptyState from '../../../components/ui/EmptyState';
import CustomSelect from '../../../components/ui/CustomSelect';
import { apiFetch } from '../../../utils/api';
import { collegeAPI, departmentAPI } from '../../../services/api';
import "../Styles/SA_ManageUsers.css";

/* ── Inline dropdown for ManageUsers ── */
function MuSelect(props) {
  return <CustomSelect {...props} />;
}

/* ── Inline StatusBadge Helper ──────────────────────── */
function StatusBadge({ status }) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'Active' || status === 'Verified' || status === 'Available') {
    badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'Inactive' || status === 'Disabled') {
    badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  } else if (status === 'High' || status === 'In Progress') {
    badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (status === 'Busy' || status === 'Medium') {
    badgeStyles = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (status === 'Near Completion') {
    badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status}
    </span>
  );
}

// Mock Data for Coordinators
const mockCoordinators = [];

// Mock Data for Mentors & Trainers
const mockMentors = [];

// Mock Data for Students Risk
const mockStudentsRisk = [];

const DEFAULT_ADMINS = [];

const DEFAULT_COORDINATORS = [];

const DEFAULT_MENTORS = [];

const DEFAULT_STUDENTS = [];


function RiskBadge({ risk }) {
  const color =
    risk === "Low Risk" ? { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" } :
      risk === "Moderate Risk" ? { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" } :
        { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" };
  return (
    <span style={{
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
      borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700,
      display: "inline-block", whiteSpace: "nowrap"
    }}>
      {risk}
    </span>
  );
}

/* ── Assign Trainer Modal Component ── */
function AssignTrainerModal({ isOpen, onClose, users = [] }) {
  const [batches, setBatches] = useState([
    { id: "batch-1", name: "BE-CS-2026-A", label: "BE-CS-2026-A (Computer Science)", trainer: "Rahul Verma", topic: "DSA Marathon: Trees & Graphs", description: "BST insertion, Graph traversals (BFS/DFS), shortest paths", date: new Date().toISOString().split("T")[0], status: "Completed" },
    { id: "batch-2", name: "TE-IT-2025-B", label: "TE-IT-2025-B (Information Tech)", trainer: "Dr. Priya Sharma", topic: "React Architecture & Custom Hooks", description: "State management, Context API, Redux Toolkit & performance", date: new Date().toISOString().split("T")[0], status: "In Progress" },
    { id: "batch-3", name: "SE-ECS-2027-C", label: "SE-ECS-2027-C (Electronics & CS)", trainer: "Prof. Anish Deshmukh", topic: "Embedded Systems & Microcontrollers", description: "8051 Architecture, Timers, Interrupts & Assembly language", date: new Date().toISOString().split("T")[0], status: "Scheduled" },
    { id: "batch-4", name: "BE-AI-2026-X", label: "BE-AI-2026-X (AI & Data Science)", trainer: "Er. Amit Kulkarni", topic: "Machine Learning: Supervised Algorithms", description: "Linear Regression, Logistic Regression, Decision Trees", date: new Date().toISOString().split("T")[0], status: "Scheduled" },
  ]);

  const [selectedBatchId, setSelectedBatchId] = useState("batch-1");
  const [currentTrainer, setCurrentTrainer] = useState("Rahul Verma");
  const [isEditingTrainer, setIsEditingTrainer] = useState(false);
  const [topicTitle, setTopicTitle] = useState("DSA Marathon: Trees & Graphs");
  const [topicDesc, setTopicDesc] = useState("BST insertion, Graph traversals (BFS/DFS), shortest paths");
  const [topicDate, setTopicDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [topicStatus, setTopicStatus] = useState("Completed");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-fill trainer and today's topic when selected batch changes
  useEffect(() => {
    const selected = batches.find(b => b.id === selectedBatchId);
    if (selected) {
      setCurrentTrainer(selected.trainer);
      setTopicTitle(selected.topic || "");
      setTopicDesc(selected.description || "");
      setTopicDate(selected.date || new Date().toISOString().split("T")[0]);
      setTopicStatus(selected.status || "Scheduled");
      setIsEditingTrainer(false);
    }
  }, [selectedBatchId]);

  if (!isOpen) return null;

  const trainersList = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("mentor") || r.includes("faculty") || r.includes("trainer") || r.includes("admin");
  });

  const computeAutoStatus = (dateStr, fallbackStatus) => {
    if (!dateStr) return fallbackStatus || "Scheduled";
    const today = new Date().toISOString().split("T")[0];
    if (dateStr > today) return "Scheduled";
    if (dateStr === today) return fallbackStatus === "Completed" ? "Completed" : "In Progress";
    if (dateStr < today) return "Completed";
    return fallbackStatus || "Scheduled";
  };

  const handleDateChange = (newDate) => {
    setTopicDate(newDate);
    setTopicStatus(computeAutoStatus(newDate, topicStatus));
  };

  const handleUpdateTopicSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !topicTitle) return;

    const today = new Date().toISOString().split("T")[0];
    let updatedStatus = topicStatus;

    // When editing topic for today's date, automatically set status to In Progress if currently Scheduled
    if (topicDate === today && topicStatus === "Scheduled") {
      updatedStatus = "In Progress";
    } else if (!topicStatus) {
      updatedStatus = computeAutoStatus(topicDate);
    }

    setTopicStatus(updatedStatus);

    setBatches(prevBatches =>
      prevBatches.map(b => {
        if (b.id === selectedBatchId) {
          return {
            ...b,
            trainer: currentTrainer,
            topic: topicTitle,
            description: topicDesc || "Daily curriculum topic",
            date: topicDate,
            status: updatedStatus,
          };
        }
        return b;
      })
    );

    // Save to Database via API
    try {
      await apiFetch(`/batches/${selectedBatchId}`, {
        method: "PUT",
        body: JSON.stringify({
          trainer: currentTrainer,
          topic: topicTitle,
          description: topicDesc || "Daily curriculum topic",
          date: topicDate,
          status: updatedStatus
        })
      });
    } catch (err) {
      console.warn("[DB Save Batch Topic Error]", err);
    }

    const activeBatchObj = batches.find(b => b.id === selectedBatchId);
    setSuccessMsg(`Topic & status saved to database for ${activeBatchObj?.name || 'batch'}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleQuickEditTopic = (batchItem) => {
    setSelectedBatchId(batchItem.id);
    setCurrentTrainer(batchItem.trainer);
    setTopicTitle(batchItem.topic || "");
    setTopicDesc(batchItem.description || "");
    const itemDate = batchItem.date || new Date().toISOString().split("T")[0];
    setTopicDate(itemDate);
    setTopicStatus(batchItem.status || computeAutoStatus(itemDate));
    setIsEditingTrainer(false);
  };

  const handleStatusQuickChange = async (batchId, newStatus) => {
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: newStatus } : b));
    try {
      await apiFetch(`/batches/${batchId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn("[DB Save Quick Status Error]", err);
    }
  };

  return createPortal(
    <div className="fs-portal-overlay" onClick={onClose}>
      <div className="fs-portal-dialog" onClick={e => e.stopPropagation()}>

        {/* Header Bar */}
        <div className="fs-portal-header">
          <div className="fs-portal-header-left">
            <div className="fs-portal-header-icon">
              <Briefcase size={24} />
            </div>
            <div className="fs-portal-header-title-wrap">
              <h2 className="fs-portal-header-title">Assign Trainer & Today's Taught Topics</h2>
              <p className="fs-portal-header-subtitle">
                Select a batch cohort to update today's curriculum topic and manage assigned trainers
              </p>
            </div>
          </div>

          <div className="fs-portal-header-right">
            <button className="fs-portal-close-btn" onClick={onClose} title="Close Portal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Full-Screen Split Body */}
        <div className="fs-portal-body">

          {/* Left Column: Topic & Trainer Editor */}
          <div className="fs-portal-panel-sidebar">
            <h3 className="fs-portal-section-title">
              <BookOpenCheck size={18} color="#4f46e5" />
              Edit Today's Topic & Batch
            </h3>

            {successMsg && (
              <div className="fs-portal-alert-success">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTopicSubmit} className="fs-portal-form">
              <div className="fs-portal-field">
                <label className="fs-portal-label">1. Target Batch / Cohort</label>
                <MuSelect
                  value={selectedBatchId}
                  options={batches.map(b => ({ value: b.id, label: b.label }))}
                  onChange={val => setSelectedBatchId(val)}
                  placeholder="Select batch..."
                  icon={Users}
                />
              </div>

              <div className="fs-portal-field">
                <div className="fs-portal-field-row">
                  <label className="fs-portal-label">Assigned Trainer</label>
                  <button
                    type="button"
                    onClick={() => setIsEditingTrainer(!isEditingTrainer)}
                    className="fs-portal-btn-link"
                  >
                    {isEditingTrainer ? "Keep Current" : "Change Trainer"}
                  </button>
                </div>

                {isEditingTrainer ? (
                  <MuSelect
                    value={currentTrainer}
                    options={[
                      ...trainersList.map(t => ({ value: t.name, label: `${t.name} (${t.role || 'Faculty'})` })),
                      { value: "Rahul Verma", label: "Rahul Verma (DSA Specialist)" },
                      { value: "Dr. Priya Sharma", label: "Dr. Priya Sharma (React Architect)" },
                      { value: "Prof. Anish Deshmukh", label: "Prof. Anish Deshmukh (Faculty)" },
                      { value: "Er. Amit Kulkarni", label: "Er. Amit Kulkarni (ML Engineer)" }
                    ]}
                    onChange={val => setCurrentTrainer(val)}
                    placeholder="Select trainer..."
                    icon={UserCheck}
                  />
                ) : (
                  <div className="fs-portal-preassigned-box">
                    <span className="fs-portal-flex-center-gap"><User size={15} className="fs-portal-icon-indigo" /> {currentTrainer}</span>
                    <span className="fs-portal-preassigned-tag">Pre-Assigned</span>
                  </div>
                )}
              </div>

              <div className="fs-portal-field">
                <label className="fs-portal-label">2. Today's Topic Title</label>
                <input
                  type="text"
                  className="form-input-admin fs-portal-input-height"
                  placeholder="e.g. Java Masterclass: OOPs & Collections"
                  value={topicTitle}
                  onChange={e => setTopicTitle(e.target.value)}
                  required
                />
              </div>

              <div className="fs-portal-grid-2col">
                <div className="fs-portal-field">
                  <label className="fs-portal-label">Teaching Date</label>
                  <input
                    type="date"
                    className="form-input-admin fs-portal-input-height"
                    value={topicDate}
                    onChange={e => handleDateChange(e.target.value)}
                  />
                </div>
                <div className="fs-portal-field">
                  <label className="fs-portal-label">Status</label>
                  <MuSelect
                    value={topicStatus}
                    options={[
                      { value: "Scheduled", label: "Scheduled" },
                      { value: "In Progress", label: "In Progress" },
                      { value: "Completed", label: "Completed" }
                    ]}
                    onChange={val => setTopicStatus(val)}
                  />
                </div>
              </div>

              <div className="fs-portal-field">
                <label className="fs-portal-label">Subtopics & Daily Notes</label>
                <textarea
                  rows={3}
                  className="form-input-admin fs-portal-textarea"
                  placeholder="e.g. Interfaces, Abstract classes, HashMap vs ConcurrentHashMap..."
                  value={topicDesc}
                  onChange={e => setTopicDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-portal-submit fs-portal-submit-mt">
                <BookOpenCheck size={18} /> Save Today's Taught Topic
              </button>
            </form>
          </div>

          {/* Right Column: Full Widescreen Dashboard Grid of Batches */}
          <div className="fs-portal-panel-main">
            <div className="fs-portal-section-header">
              <h3 className="fs-portal-section-title">
                <Briefcase size={18} className="fs-portal-icon-indigo" />
                Active Batches Dashboard ({batches.length} Batches)
              </h3>
              <span className="fs-portal-panel-subtitle">Click "Edit Today's Topic" on any batch to edit directly</span>
            </div>

            <div className="fs-portal-batch-grid">
              {batches.map(item => {
                const isSelected = item.id === selectedBatchId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleQuickEditTopic(item)}
                    className={`fs-portal-batch-card ${isSelected ? 'fs-portal-batch-card--selected' : ''}`}
                  >
                    <div>
                      <div className="fs-portal-batch-card-top">
                        <span className="fs-portal-batch-badge">
                          {item.name}
                        </span>
                        <select
                          className="fs-portal-select-small"
                          value={item.status}
                          onChange={e => { e.stopPropagation(); handleStatusQuickChange(item.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <h4 className="fs-portal-batch-title">
                        {item.topic}
                      </h4>

                      <p className="fs-portal-batch-desc">
                        {item.description}
                      </p>
                    </div>

                    <div className="fs-portal-batch-footer">
                      <div className="fs-portal-trainer-info">
                        <div className="fs-portal-trainer-avatar">
                          {(item.trainer || "T").charAt(0)}
                        </div>
                        <span className="fs-portal-trainer-name">{item.trainer}</span>
                      </div>
                      <span className={isSelected ? "fs-portal-batch-status-active" : "fs-portal-batch-status-idle"}>
                        {isSelected ? "Active Batch ✓" : "Click to Edit"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

/* ── Assign Mentor Modal Component ── */
function AssignMentorModal({ isOpen, onClose, users = [] }) {
  const DEFAULT_MENTORS = [];

  const DEFAULT_STUDENTS = [];

  const [selectedMentor, setSelectedMentor] = useState("Prof. Anish Deshmukh");
  const [studentSearch, setStudentSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState(["st-101", "st-102"]);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Filter or fall back to mentors
  const rawMentors = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("mentor") || r.includes("faculty") || r.includes("prof");
  });
  const mentors = rawMentors.length > 0
    ? [...rawMentors, ...DEFAULT_MENTORS.filter(d => !rawMentors.some(u => u.email === d.email || u.id === d.id))]
    : DEFAULT_MENTORS;

  // Merge real DB students with DEFAULT_STUDENTS so roster is ALWAYS complete and fallback ready
  const rawStudents = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("student") || r === "user" || (!r && u.name);
  });
  const allStudents = rawStudents.length > 0
    ? [...rawStudents, ...DEFAULT_STUDENTS.filter(d => !rawStudents.some(u => u.email === d.email || u.id === d.id))]
    : DEFAULT_STUDENTS;

  // Filter students based on department pills and search input
  const filteredStudents = allStudents.filter(s => {
    const q = studentSearch.toLowerCase().trim();
    const deptStr = (s.department || s.dept || "").toLowerCase();

    let matchesDept = true;
    if (deptFilter !== "all") {
      const filterLower = deptFilter.toLowerCase();
      matchesDept = deptStr.includes(filterLower) ||
        (filterLower.includes("computer") && (deptStr.includes("cs") || deptStr.includes("cse"))) ||
        (filterLower.includes("information") && (deptStr.includes("it") || deptStr.includes("info"))) ||
        (filterLower.includes("ai") && (deptStr.includes("data") || deptStr.includes("ds") || deptStr.includes("ai"))) ||
        (filterLower.includes("electronics") && (deptStr.includes("ec") || deptStr.includes("extc") || deptStr.includes("elec")));
    }

    if (!matchesDept) return false;
    if (!q) return true;

    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.roll_number || s.rollNo || s.roll || "").toLowerCase().includes(q) ||
      deptStr.includes(q) ||
      (s.year || "").toLowerCase().includes(q)
    );
  });

  const getDeptCount = (filterKey) => {
    if (filterKey === "all") return allStudents.length;
    return allStudents.filter(s => {
      const deptStr = (s.department || s.dept || "").toLowerCase();
      const filterLower = filterKey.toLowerCase();
      return deptStr.includes(filterLower) ||
        (filterLower.includes("computer") && (deptStr.includes("cs") || deptStr.includes("cse"))) ||
        (filterLower.includes("information") && (deptStr.includes("it") || deptStr.includes("info"))) ||
        (filterLower.includes("ai") && (deptStr.includes("data") || deptStr.includes("ds") || deptStr.includes("ai"))) ||
        (filterLower.includes("electronics") && (deptStr.includes("ec") || deptStr.includes("extc") || deptStr.includes("elec")));
    }).length;
  };

  const toggleStudentSelect = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleAssignMentorSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMentor) {
      alert("Please select a mentor first.");
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const activeMentor = mentors.find(m => m.name === selectedMentor);

    try {
      await apiFetch('/admin/assign-mentor', {
        method: 'POST',
        body: JSON.stringify({
          mentorName: selectedMentor,
          mentorEmail: activeMentor?.email || null,
          studentIds: selectedStudentIds
        })
      });
    } catch (err) {
      console.warn('[DB Save Mentor Assignment Error]', err);
    }

    setSuccessMsg(`Successfully assigned ${selectedStudentIds.length} mentees to ${selectedMentor} in database!`);
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1800);
  };

  const selectedStudentsList = allStudents.filter(s => selectedStudentIds.includes(s.id));
  const activeMentorObj = mentors.find(m => m.name === selectedMentor) || mentors[0];

  return createPortal(
    <div className="fs-portal-overlay" onClick={onClose}>
      <div className="fs-portal-dialog" onClick={e => e.stopPropagation()}>

        {/* Top Header Bar */}
        <div className="fs-portal-header">
          <div className="fs-portal-header-left">
            <div className="fs-portal-header-icon">
              <UserCheck size={24} />
            </div>
            <div className="fs-portal-header-title-wrap">
              <h2 className="fs-portal-header-title">Assign Faculty Mentor to Students</h2>
              <p className="fs-portal-header-subtitle">
                Multi-select student profiles via real-time roll number search and allocate to a faculty mentor
              </p>
            </div>
          </div>

          <div className="fs-portal-header-right">
            <button className="fs-portal-close-btn" onClick={onClose} title="Close Portal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Form Grid Body */}
        <form onSubmit={handleAssignMentorSubmit} className="fs-portal-body">

          {/* Left Column: Mentor Selection & Live Summary */}
          <div className="fs-portal-panel-sidebar">
            <h3 className="fs-portal-section-title">
              <UserCheck size={18} className="fs-portal-icon-blue" />
              1. Select Faculty Mentor
            </h3>

            {successMsg && (
              <div className="fs-portal-alert-info">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="fs-portal-field">
              <label className="fs-portal-label">Faculty Mentor / Leader</label>
              <MuSelect
                value={selectedMentor}
                options={mentors.map(m => ({ value: m.name, label: `${m.name} (${m.department || 'Computer Science'})` }))}
                onChange={val => setSelectedMentor(val)}
                placeholder="-- Choose Faculty Mentor --"
                icon={UserCheck}
              />
            </div>

            {/* Active Selected Mentor Info Card */}
            {activeMentorObj && (
              <div className="fs-portal-mentor-active-card">
                <div className="fs-portal-mentor-avatar">
                  {(activeMentorObj.name || 'M').charAt(0)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="fs-portal-mentor-name">
                    {activeMentorObj.name}
                  </div>
                  <div className="fs-portal-mentor-meta">
                    <span className="fs-portal-dept-pill">
                      {activeMentorObj.department || 'CSE'}
                    </span>
                    <span>·</span>
                    <span>{activeMentorObj.email || 'mentor@college.edu'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Students Chips Banner */}
            {selectedStudentsList.length > 0 && (
              <div className="fs-portal-mentees-wrapper">
                <div className="fs-portal-mentees-header">
                  <label className="fs-portal-mentees-title">
                    Selected Mentees List ({selectedStudentsList.length})
                  </label>
                  <button type="button" onClick={handleDeselectAll} className="fs-portal-btn-clear">
                    Clear All
                  </button>
                </div>

                <div className="fs-portal-chips-container">
                  {selectedStudentsList.map(s => (
                    <span
                      key={s.id}
                      className="fs-portal-mentee-chip"
                    >
                      <span>{s.name}</span>
                      <X
                        size={13}
                        className="fs-portal-chip-remove"
                        onClick={() => toggleStudentSelect(s.id)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-portal-submit fs-portal-submit-mt">
              <UserCheck size={18} /> Confirm & Assign Mentor
            </button>
          </div>

          {/* Right Column: Multi-Select Student Selection Dashboard */}
          <div className="fs-portal-panel-main">

            {/* Action Bar Header */}
            <div className="fs-portal-main-bar">
              <div>
                <label className="fs-portal-checklist-title">
                  2. Select Students Checklist
                  <span className="fs-portal-count-badge">
                    {selectedStudentIds.length} Selected
                  </span>
                </label>
                <div className="fs-portal-checklist-meta">
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{allStudents.length}</strong> students · <strong>{selectedStudentIds.length}</strong> mapped
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="fs-portal-btn-select-all"
                >
                  Select All Filtered ({filteredStudents.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="fs-portal-btn-deselect-all"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Search Input & Department Pills Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="fs-portal-search-wrap">
                <Search size={18} className="fs-portal-search-icon" />
                <input
                  type="text"
                  className="fs-portal-search-input"
                  placeholder="Search student by roll no, name, dept, email, year..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="fs-portal-search-clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Department Filter Badges */}
              <div className="fs-portal-dept-filters">
                {[
                  { id: "all", label: "All Depts" },
                  { id: "computer science", label: "Computer Science" },
                  { id: "information tech", label: "Information Tech" },
                  { id: "ai & data science", label: "AI & Data Science" },
                  { id: "electronics", label: "Electronics & CS" },
                ].map(dept => {
                  const isActive = deptFilter === dept.id;
                  const count = getDeptCount(dept.id);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setDeptFilter(dept.id)}
                      className={`fs-portal-dept-btn ${isActive ? 'fs-portal-dept-btn--active' : ''}`}
                    >
                      <span>{dept.label}</span>
                      <span className="fs-portal-dept-count">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Select Student Checklist Grid */}
            <div className="fs-portal-students-grid">
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Search size={32} color="#94a3b8" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#334155' }}>No student profiles match your search</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                      Try adjusting query "{studentSearch}" or changing department filter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStudentSearch(""); setDeptFilter("all"); }}
                    className="btn-portal-submit"
                    style={{ width: 'auto', padding: '8px 18px', fontSize: '12.5px' }}
                  >
                    Reset Filters & Roster
                  </button>
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className={`fs-portal-student-card ${isChecked ? 'fs-portal-student-card--checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="fs-portal-checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudentSelect(student.id)}
                      />

                      <div className="fs-portal-student-avatar">
                        {(student.name || 'S').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, fontSize: '12.5px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</span>
                          {student.year && (
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#334155' }}>
                              {student.year}
                            </span>
                          )}
                        </div>

                        <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                          <span className="fs-portal-student-roll">
                            {student.roll_number || student.rollNo || `ID-${student.id}`}
                          </span>
                          <span>·</span>
                          <span style={{ fontWeight: 600, color: '#475569' }}>{student.department || 'Computer Science'}</span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>


      </div>
    </div>,
    document.body
  );
}

/* ── Bulk Excel / CSV Upload Modal Component ── */
function BulkExcelUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Full Name": "Priya Sharma",
        "College Email": "priya.sharma@institution.edu",
        "Mobile Number": "9876543210",
        "Roll ID": "VU21CS042",
        "Department": "COMPS",
        "Academic Year": "TE",
        "Division": "A",
      },
      {
        "Full Name": "Rahul Verma",
        "College Email": "rahul.verma@institution.edu",
        "Mobile Number": "9876543211",
        "Roll ID": "VU21IT088",
        "Department": "IT",
        "Academic Year": "SE",
        "Division": "B",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Upload_Template");
    XLSX.writeFile(workbook, "Student_Creation_Bulk_Template.xlsx");
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const formatted = jsonRows.map((row, idx) => {
          const name = String(row["Full Name"] || row["name"] || row["Name"] || row["fullName"] || "").trim();
          const email = String(row["College Email"] || row["email"] || row["Email"] || row["collegeEmail"] || "").trim();
          const mobile = String(row["Mobile Number"] || row["mobile_number"] || row["phone"] || row["Mobile"] || "").trim();
          const rollNo = String(row["Roll ID"] || row["roll_number"] || row["rollNo"] || row["College ID"] || "").trim();
          const dept = String(row["Department"] || row["department"] || row["dept"] || "COMPS").trim();
          const year = String(row["Academic Year"] || row["year"] || row["Year"] || "FE").trim();
          const div = String(row["Division"] || row["division"] || row["div"] || "A").trim();

          let isValid = true;
          let issue = "";
          if (!name) {
            isValid = false;
            issue = "Missing Name";
          } else if (!email || !email.includes("@")) {
            isValid = false;
            issue = "Invalid Email";
          }

          return {
            id: idx + 1,
            name,
            email,
            mobile_number: mobile,
            roll_number: rollNo,
            department: dept,
            year,
            division: div,
            isValid,
            issue,
          };
        });

        setParsedRows(formatted);
      } catch (err) {
        console.error("Failed to parse Excel file:", err);
        setUploadStatus({ type: "error", message: "Failed to read Excel file format. Please use .xlsx or .csv." });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleBulkSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setUploadStatus({ type: "error", message: "No valid student rows found in the uploaded file." });
      return;
    }

    setIsProcessing(true);
    setUploadStatus(null);

    try {
      const res = await apiFetch("/admin/users/bulk-upload", {
        method: "POST",
        body: JSON.stringify({ students: validRows }),
      });

      if (res && (res.data || res.success)) {
        const info = res.data || res;
        setUploadStatus({
          type: "success",
          message: `🎉 Success! Created ${info.createdCount || validRows.length} student accounts and dispatched registration emails. ${info.skippedCount ? `(${info.skippedCount} skipped as already existing)` : ""}`,
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2200);
      } else {
        setUploadStatus({ type: "error", message: res.error || "Bulk upload failed" });
      }
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message || "Bulk upload encountered an error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg bulk-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon-wrap bulk-header-icon-wrap">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="modal-title">Bulk Student Creation via Excel / CSV</h2>
              <p className="modal-subtitle">Upload student roster spreadsheet to create accounts & auto-send email registration invitations.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {uploadStatus && (
            <div className={`modal-feedback-alert ${uploadStatus.type === "error" ? "modal-feedback--error" : "modal-feedback--success"}`}>
              {uploadStatus.message}
            </div>
          )}

          <div className="bulk-template-card">
            <div>
              <span className="bulk-template-title">📥 Don't have the format template?</span>
              <p className="bulk-template-desc">Download the official Excel template with column headers and sample data.</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="sa-btn-secondary bulk-template-btn"
            >
              <Download size={14} /> Download Sample Template
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bulk-dropzone ${dragActive ? "bulk-dropzone--drag" : file ? "bulk-dropzone--hasfile" : ""}`}
            onClick={() => document.getElementById("sa-excel-file-input").click()}
          >
            <input
              id="sa-excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="bulk-dropzone-icon">
              <UploadCloud size={24} />
            </div>
            <h4 className="bulk-dropzone-title">
              {file ? file.name : "Click or drag & drop Excel / CSV spreadsheet here"}
            </h4>
            <p className="bulk-dropzone-desc">
              Supports .xlsx, .xls, or .csv (Headers: Full Name, College Email, Mobile Number, Roll ID, Department, Academic Year, Division)
            </p>
          </div>

          {parsedRows.length > 0 && (
            <div className="bulk-preview-wrap">
              <div className="bulk-preview-header">
                <span className="bulk-preview-title">
                  Spreadsheet Preview ({validCount} valid rows ready for import)
                </span>
                <span className="bulk-preview-subtitle">
                  Total detected: {parsedRows.length} rows
                </span>
              </div>

              <div className="bulk-preview-table-container">
                <table className="bulk-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>College Email</th>
                      <th>Roll ID</th>
                      <th>Dept</th>
                      <th>Year/Div</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r) => (
                      <tr key={r.id} className={r.isValid ? "bulk-row-valid" : "bulk-row-invalid"}>
                        <td>{r.id}</td>
                        <td style={{ fontWeight: "600" }}>{r.name || "—"}</td>
                        <td style={{ color: "#3b82f6" }}>{r.email || "—"}</td>
                        <td>{r.roll_number || "—"}</td>
                        <td>{r.department}</td>
                        <td>{r.year} ({r.division})</td>
                        <td>
                          {r.isValid ? (
                            <span className="bulk-badge-ready">
                              <CheckCircle2 size={12} /> Ready
                            </span>
                          ) : (
                            <span className="bulk-badge-error">
                              <AlertCircle size={12} /> {r.issue}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-modal-submit bulk-submit-btn"
            onClick={handleBulkSubmit}
            disabled={isProcessing || validCount === 0}
          >
            {isProcessing ? "Processing & Dispatching Emails..." : `Import ${validCount} Students & Send Registration Emails`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ManageUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("admins"); // 'admins' | 'coordinators' | 'mentors' | 'students'
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkExcelOpen, setIsBulkExcelOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [pendingUsersList, setPendingUsersList] = useState([]);

  // Tab Data States
  const [adminRequests, setAdminRequests] = useState(DEFAULT_ADMINS);
  const [coordinators, setCoordinators] = useState(DEFAULT_COORDINATORS);
  const [mentors, setMentors] = useState(DEFAULT_MENTORS);
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [collegesList, setCollegesList] = useState([]);
  const [allRawUsers, setAllRawUsers] = useState([]);

  // Modal States
  const [isAssignTrainerOpen, setIsAssignTrainerOpen] = useState(false);
  const [isAssignMentorOpen, setIsAssignMentorOpen] = useState(false);

  const handleApprovePendingUser = async (user) => {
    try {
      const res = await apiFetch(`/admin/users/${user.id}/approve`, { method: 'PATCH' });
      if (res && (res.success || !res.error)) {
        alert(`Account approved successfully for ${user.name}! They can now log in.`);
        setPendingUsersList(prev => prev.filter(u => u.id !== user.id));
        setPendingUsersCount(prev => Math.max(0, prev - 1));
      } else {
        alert(res?.error || res?.message || 'Failed to approve user.');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve user account.');
    }
  };

  const handleRejectPendingUser = async (user) => {
    if (!window.confirm(`Are you sure you want to reject registration for ${user.name}?`)) return;
    try {
      const res = await apiFetch(`/admin/users/${user.id}/reject`, { method: 'PATCH' });
      if (res && (res.success || !res.error)) {
        alert(`Registration rejected for ${user.name}.`);
        setPendingUsersList(prev => prev.filter(u => u.id !== user.id));
        setPendingUsersCount(prev => Math.max(0, prev - 1));
      } else {
        alert(res?.error || res?.message || 'Failed to reject user.');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject user account.');
    }
  };

  useEffect(() => {
    collegeAPI.getColleges()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCollegesList(data);
        }
      })
      .catch(err => console.error("Error loading colleges for ManageUsers modal:", err));

    apiFetch('/admin/pending-users')
      .then(res => {
        if (res && res.data && Array.isArray(res.data)) {
          setPendingUsersList(res.data);
          setPendingUsersCount(res.data.length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {

    const fetchUsers = async () => {
      try {
        const [res, pendingRes] = await Promise.all([
          apiFetch('/admin/users').catch(() => null),
          apiFetch('/admin/pending-users').catch(() => null)
        ]);

        const pendingData = pendingRes && pendingRes.data && Array.isArray(pendingRes.data)
          ? pendingRes.data
          : (Array.isArray(pendingRes) ? pendingRes : []);

        setPendingUsersList(pendingData);
        setPendingUsersCount(pendingData.length);

        const usersData = res && res.data && Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res) ? res : (res && Array.isArray(res.users) ? res.users : []));

        if (usersData.length > 0 || pendingData.length > 0) {
          setAllRawUsers(usersData);

          // Combine active users with pending users
          const allCombined = [...usersData];
          pendingData.forEach(p => {
            if (!allCombined.some(u => u.id === p.id)) {
              allCombined.push({ ...p, is_active: 0 });
            }
          });

          const dbAdmins = allCombined.filter(u => u.role === 'college_admin' || u.role === 'admin' || u.role === 'hod');
          const dbCoords = allCombined.filter(u => u.role === 'coordinator');
          const dbMentors = allCombined.filter(u => u.role === 'mentor' || u.role === 'faculty');
          const dbStudents = allCombined.filter(u => u.role === 'student');

          if (dbAdmins.length > 0) {
            setAdminRequests(dbAdmins.map(u => ({
              id: u.id,
              name: u.name || 'College Admin',
              adminName: u.name || 'College Admin',
              email: u.email,
              phone: u.mobile_number || u.phone || '',
              college: u.college_name || u.college || 'Partner Institution',
              designation: 'Institutional Admin',
              date: u.created_at ? u.created_at.split('T')[0] : '2026-09-20',
              status: u.is_active ? 'Verified' : 'Pending'
            })));
          }

          if (dbCoords.length > 0) {
            setCoordinators(dbCoords.map(u => ({
              id: u.id,
              name: u.name || 'Coordinator',
              email: u.email,
              phone: u.mobile_number || u.phone || '',
              college: u.college_name || u.college || 'Partner Institution',
              department: u.department_name || u.department || 'Computer Engineering',
              status: u.is_active ? 'Active' : 'Inactive'
            })));
          }

          if (dbMentors.length > 0) {
            setMentors(dbMentors.map(u => ({
              id: u.id,
              name: u.name || 'Mentor',
              email: u.email,
              phone: u.mobile_number || u.phone || '',
              college: u.college_name || u.college || 'Apex Institute of Technology',
              track: u.target_track || 'Fullstack Web & AI',
              studentsAssigned: 35,
              rating: '4.8'
            })));
          }

          if (dbStudents.length > 0) {
            setStudents(dbStudents.map(u => ({
              id: u.id,
              name: u.name || 'Student',
              rollNo: u.roll_number || u.rollNo || `STD-${u.id}`,
              college: u.college_name || u.college || 'PVPP College of Engineering',
              batch: u.batch || 'CSE 2026 Cohort',
              attendance: u.attendance || '90%',
              risk: u.risk || 'Low Risk',
              status: u.is_active ? 'Active' : 'Pending'
            })));
          }
        }
      } catch (err) {
        console.warn("Error fetching users from database:", err);
      }
    };

    fetchUsers();
  }, []);


  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/super-admin/coordinators")) {
      setActiveTab("coordinators");
    } else if (path.includes("/super-admin/mentors")) {
      setActiveTab("mentors");
    } else if (path.includes("/super-admin/students")) {
      setActiveTab("students");
    } else if (path.includes("/super-admin/verification")) {
      setActiveTab("admins");
    }
  }, [location.pathname]);

  // Admin Verification handlers
  const handleVerifyAdmin = async (id) => {
    try {
      const res = await apiFetch(`/admin/users/${id}/approve`, { method: "PATCH" });
      if (res && (res.success || !res.error)) {
        setAdminRequests(adminRequests.map((r) => r.id === id ? { ...r, status: 'Verified' } : r));
        setPendingUsersList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(res?.error || "Failed to verify admin account");
      }
    } catch (err) {
      setAdminRequests(adminRequests.map((r) => r.id === id ? { ...r, status: 'Verified' } : r));
    }
  };

  const handleRejectAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to reject this admin request?")) return;
    try {
      const res = await apiFetch(`/admin/users/${id}/reject`, { method: "PATCH" });
      if (res && (res.success || !res.error)) {
        setAdminRequests(adminRequests.filter((r) => r.id !== id));
        setPendingUsersList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(res?.error || "Failed to reject admin account");
      }
    } catch (err) {
      setAdminRequests(adminRequests.filter((r) => r.id !== id));
    }
  };

  const handleTrigger2FA = async (userId, userName) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/trigger-2fa`, {
        method: 'POST',
      });
      if (res && (res.success || res.status === 200 || (res.data && !res.error))) {
        alert(res.message || `Two-step verification has been re-triggered for ${userName}. 2FA setup will be required on their next login.`);
      } else {
        alert(res?.error || res?.message || 'Failed to trigger two-step verification.');
      }
    } catch (err) {
      console.error('Trigger 2FA error:', err);
      alert(err?.message || 'Failed to trigger two-step verification.');
    }
  };

  // Filtering
  const filteredAdmins = adminRequests.filter(req =>
    (req?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req?.college || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoordinators = coordinators.filter(c =>
    (c?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c?.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c?.department || c?.dept || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentors.filter(m =>
    (m?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m?.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m?.track || m?.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    (s?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s?.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s?.college || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "admins", label: "Admin", icon: ShieldCheck, count: adminRequests.length },
  ];

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isGenerateCodeModalOpen, setIsGenerateCodeModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    password: '',
    email: '',
    role: 'admins',
    collegeId: '',
    college: '',
    departmentId: '',
    department: '',
    phone: '',
    rollNo: '',
    year: 'FE',
    division: 'A',
  });
  const [collegeDepartments, setCollegeDepartments] = useState([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  const handleCollegeChange = async (colId) => {
    const selectedCol = collegesList.find((c) => String(c.id) === String(colId));
    setNewUserForm((prev) => ({
      ...prev,
      collegeId: colId,
      college: selectedCol ? selectedCol.name : '',
      departmentId: '',
      department: '',
    }));
    setCollegeDepartments([]);

    if (!colId) return;

    setIsLoadingDepts(true);
    try {
      const depts = await departmentAPI.getDepartments(colId);
      if (Array.isArray(depts)) {
        setCollegeDepartments(depts);
      }
    } catch (err) {
      console.error("Error fetching departments for college:", err);
    } finally {
      setIsLoadingDepts(false);
    }
  };

  // Generate Code Form State
  const [codeRole, setCodeRole] = useState('admins');
  const [codeCollege, setCodeCollege] = useState('Partner Campus');
  const [codeExpiry, setCodeExpiry] = useState('1 Day');
  const [codeMaxUses, setCodeMaxUses] = useState('1');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generatedCodesList, setGeneratedCodesList] = useState([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const loadSecureCodes = async () => {
    try {
      const res = await apiFetch('/secure-codes');
      if (res && Array.isArray(res.data)) {
        setGeneratedCodesList(res.data.map(c => ({
          id: c.id,
          code: c.code,
          role: c.role === 'college_admin' ? 'Admin' : c.role === 'coordinator' ? 'Coordinator' : c.role === 'mentor' ? 'Mentor' : c.role === 'company' ? 'Company' : c.role,
          college: c.college_name || 'All Colleges',
          maxUses: c.max_uses,
          usesCount: c.uses_count || 0,
          status: c.status,
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'
        })));
      }
    } catch (err) {
      console.warn("Failed to load secure codes from DB:", err);
    }
  };

  useEffect(() => {
    loadSecureCodes();
  }, []);

  const handleGenerateCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGeneratingCode) return;

    setIsGeneratingCode(true);

    const roleMapping = {
      admins: 'college_admin',
      coordinators: 'coordinator',
      mentors: 'mentor',
      students: 'student',
    };
    const targetRole = roleMapping[codeRole] || codeRole;

    const prefixMap = {
      admins: 'ADM',
      coordinators: 'CRD',
      mentors: 'MTR',
      students: 'STD',
    };
    const prefix = prefixMap[codeRole] || 'USR';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const colCode = codeCollege ? String(codeCollege).split(' ')[0].substring(0, 4).toUpperCase() : 'PVPP';
    const generatedFallback = `${prefix}-${randomHex}-${colCode}`;

    try {
      const res = await apiFetch('/secure-codes/generate', {
        method: 'POST',
        body: JSON.stringify({
          code: generatedFallback,
          role: targetRole,
          college_name: codeCollege,
          max_uses: parseInt(codeMaxUses, 10) || 1,
          expiry_option: codeExpiry,
          description: `Generated for ${codeCollege} - Max Uses: ${codeMaxUses === '0' ? 'Unlimited' : codeMaxUses} - Expiry: ${codeExpiry}`,
        }),
      });

      if (res && res.data && res.data.code) {
        setGeneratedCode(res.data.code);
      } else {
        setGeneratedCode(generatedFallback);
      }
      await loadSecureCodes();
    } catch (err) {
      console.error("Error generating secure code:", err);
      setGeneratedCode(generatedFallback);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDeleteCode = async (id) => {
    try {
      await apiFetch(`/secure-codes/${id}`, { method: 'DELETE' });
      await loadSecureCodes();
    } catch (err) {
      console.error("Error deleting secure code:", err);
    }
  };

  const handleCopyCode = (code, id = 'hero') => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };


  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const roleMapping = {
      admins: 'college_admin',
      coordinators: 'coordinator',
      mentors: 'mentor',
      students: 'student'
    };

    const targetRole = roleMapping[newUserForm.role] || 'student';
    const payload = {
      name: newUserForm.name,
      password: newUserForm.password,
      email: newUserForm.email,
      mobile_number: newUserForm.phone,
      role: targetRole,
      college_id: newUserForm.collegeId,
      college_name: newUserForm.college,
      department_id: newUserForm.departmentId,
      department: newUserForm.department,
      roll_number: newUserForm.rollNo,
      year: newUserForm.year,
      division: newUserForm.division
    };

    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("User created in local state:", err);
    }

    if (newUserForm.role === 'admins') {
      const newAdmin = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        college: newUserForm.college || 'College',
        designation: 'Institutional Admin',
        date: new Date().toISOString().split('T')[0],
        status: 'Verified',
      };
      setAdminRequests([newAdmin, ...adminRequests]);
    } else if (newUserForm.role === 'coordinators') {
      const newCoord = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '',
        college: newUserForm.college || 'College',
        department: newUserForm.department || 'Department',
        status: 'Active',
      };
      setCoordinators([newCoord, ...coordinators]);
    } else if (newUserForm.role === 'mentors') {
      const newMentor = {
        id: Date.now(),
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone || '',
        college: newUserForm.college || 'College',
        track: newUserForm.department ? `${newUserForm.department} Faculty` : 'Full Stack Web Engineering',
        studentsAssigned: 0,
        rating: '5.0/5',
      };
      setMentors([newMentor, ...mentors]);
    } else {
      const newStudent = {
        id: Date.now(),
        name: newUserForm.name,
        rollNo: newUserForm.rollNo || `STD-${Math.floor(100 + Math.random() * 900)}`,
        college: newUserForm.college || 'College',
        batch: `${newUserForm.department || 'Dept'} ${newUserForm.year || 'FE'} ${newUserForm.division || 'A'}`,
        attendance: '100%',
        risk: 'Low Risk',
        status: 'Active',
      };
      setStudents([newStudent, ...students]);
    }

    setIsAddUserModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      role: 'admins',
      collegeId: '',
      college: '',
      departmentId: '',
      department: '',
      phone: '',
      rollNo: '',
      year: 'FE',
      division: 'A',
    });
    setCollegeDepartments([]);
  };


  return (
    <div className="manageusers-page-wrap">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h2 className="manageusers-header-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "inherit" }}>
            <UserCog size={24} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span>Manage Users &amp; Registration Codes</span>
          </h2>
          <p className="manageusers-header-subtitle">View system users, issue role-based registration invitation codes, and provision institutional users</p>
        </div>

        <div className="sa-header-actions">
          <button
            type="button"
            onClick={() => navigate('/super-admin/approve-users')}
            className="manageusers-btn-secondary"
            style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0", fontWeight: 700 }}
          >
            <UserCheck size={16} />
            <span>Approve Registrations {pendingUsersCount > 0 && `(${pendingUsersCount})`}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGeneratedCode(null);
              setIsGenerateCodeModalOpen(true);
            }}
            className="manageusers-btn-secondary"
          >
            <KeyRound size={16} />
            <span>Generate Code</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="sa-btn-primary"
          >
            <Users size={16} />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {pendingUsersCount > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: '#b45309', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                {pendingUsersCount} User Registration(s) Pending Approval
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#b45309' }}>
                New user accounts have completed registration &amp; 2FA setup and are waiting for administrator review and approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/super-admin/approve-users')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={15} />
            <span>Review &amp; Approve Users</span>
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="sa-search-card">
        <div className="sa-search-wrap mu-search-wrap-full">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* PENDING REGISTRATIONS APPROVAL SECTION */}
      {pendingUsersList.length > 0 && (
        <div className="manageusers-table-card mb-6" style={{ border: '1px solid #fcd34d', background: '#fffefb', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#d97706" />
              <span>Pending User Registrations Awaiting Approval ({pendingUsersList.length})</span>
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
              Action Required
            </span>
          </div>
          <div className="manageusers-table-wrap">
            <table className="manageusers-table">
              <thead>
                <tr className="manageusers-thead-row">
                  <th className="manageusers-th">Applicant Name &amp; Contact</th>
                  <th className="manageusers-th">Requested Role</th>
                  <th className="manageusers-th">College / Dept</th>
                  <th className="manageusers-th">Status</th>
                  <th className="manageusers-th-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsersList.map((user) => (
                  <tr key={user.id} className="manageusers-tr">
                    <td className="manageusers-td">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="manageusers-contact-row mt-1">
                        <Mail size={14} className="manageusers-contact-icon" />
                        <span className="manageusers-contact-text">{user.email || user.mobile_number || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="manageusers-td">
                      <span style={{ textTransform: 'capitalize', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#3730a3', fontSize: '12px' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="manageusers-td">
                      <div className="manageusers-contact-row manageusers-contact-row--bold">
                        <Building2 size={15} className="manageusers-contact-icon manageusers-contact-icon--indigo" />
                        <span>{user.college_name || user.department || 'Apex Institution'}</span>
                      </div>
                    </td>
                    <td className="manageusers-td">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                        Pending Admin Approval
                      </span>
                    </td>
                    <td className="manageusers-td-right">
                      <div className="manageusers-actions-row">
                        <button
                          type="button"
                          onClick={() => handleApprovePendingUser(user)}
                          className="manageusers-btn-verify"
                          style={{ background: '#16a34a', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Approve Account</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPendingUser(user)}
                          className="manageusers-btn-reject"
                          style={{ background: '#ef4444', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
                        >
                          <XCircle size={15} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HODs & College Admins */}
      {activeTab === "admins" && (
        <div className="manageusers-tab-content">


          <div className="manageusers-table-card">
            {filteredAdmins.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No Admin Accounts Found"
                description="College Admin register using secure invitation codes. No manual verification required."
              />
            ) : (
              <div className="manageusers-table-wrap">
                <table className="manageusers-table">
                  <thead>
                    <tr className="manageusers-thead-row">
                      <th className="manageusers-th">Applicant Name</th>
                      <th className="manageusers-th">Institution / College</th>
                      <th className="manageusers-th">Designation</th>
                      <th className="manageusers-th">Requested On</th>
                      <th className="manageusers-th">Status</th>
                      <th className="manageusers-th-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((req) => (
                      <tr key={req.id} className="manageusers-tr">
                        <td className="manageusers-td">
                          <div className="font-bold text-slate-900">{req.name}</div>
                          <div className="manageusers-contact-row mt-1">
                            <Mail size={14} className="manageusers-contact-icon" />
                            <span className="manageusers-contact-text">{req.email}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <div className="manageusers-contact-row manageusers-contact-row--bold">
                            <Building2 size={15} className="manageusers-contact-icon manageusers-contact-icon--indigo" />
                            <span>{req.college}</span>
                          </div>
                        </td>
                        <td className="manageusers-td font-medium text-slate-700">{req.designation}</td>
                        <td className="manageusers-td">
                          <div className="manageusers-contact-row">
                            <Calendar size={14} className="manageusers-contact-icon" />
                            <span className="manageusers-contact-text">{req.date}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="manageusers-td-right">
                          {req.status === 'Pending' ? (
                            <div className="manageusers-actions-row">
                              <button
                                type="button"
                                onClick={() => handleVerifyAdmin(req.id)}
                                className="manageusers-btn-verify"
                              >
                                <CheckCircle2 size={15} />
                                <span>Verify Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAdmin(req.id)}
                                className="manageusers-btn-reject"
                              >
                                <XCircle size={15} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="manageusers-actions-row">
                              <span className="manageusers-badge-approved">
                                <CheckCircle2 size={14} /> Approved
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTrigger2FA(req.id, req.name)}
                                className="manageusers-btn-retrigger-2fa"
                                title="Re-trigger 2-Step Verification setup for this Admin"
                              >
                                <ShieldAlert size={13} />
                                <span>Re-trigger 2FA</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Coordinators */}
      {activeTab === "coordinators" && (
        <div className="manageusers-table-card">
          <div className="manageusers-table-wrap">
            <table className="manageusers-table">
              <thead>
                <tr className="manageusers-thead-row">
                  <th className="manageusers-th">Coordinator Name</th>
                  <th className="manageusers-th">College</th>
                  <th className="manageusers-th">Department</th>
                  <th className="manageusers-th">Contact Details</th>
                  <th className="manageusers-th-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoordinators.map((c) => (
                  <tr key={c.id} className="manageusers-tr">
                    <td className="manageusers-td font-bold text-slate-900">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="manageusers-td text-slate-600 font-medium">{c.college}</td>
                    <td className="manageusers-td text-indigo-600 font-medium">{c.department}</td>
                    <td className="manageusers-td">
                      <div className="manageusers-contact-box">
                        <div className="manageusers-contact-row">
                          <Mail size={14} className="manageusers-contact-icon" />
                          <span className="manageusers-contact-text">{c.email}</span>
                        </div>
                        <div className="manageusers-contact-row">
                          <Phone size={14} className="manageusers-contact-icon" />
                          <span className="manageusers-contact-text">{c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="manageusers-td-right">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCoordinators.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <Users size={36} color="#94a3b8" />
              <div style={{ fontWeight: 700, color: "#334155" }}>No coordinators match your search or filter.</div>
              <p style={{ margin: 0, fontSize: "12px" }}>Try updating your search query or click "+ Add User" to provision a new coordinator.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Mentors */}
      {activeTab === "mentors" && (
        <div className="manageusers-table-card">
          <div className="manageusers-table-wrap">
            <table className="manageusers-table">
              <thead>
                <tr className="manageusers-thead-row">
                  <th className="manageusers-th">Mentor Name</th>
                  <th className="manageusers-th">Domain Track</th>
                  <th className="manageusers-th">College</th>
                  <th className="manageusers-th">Mentees Enrolled</th>
                  <th className="manageusers-th-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredMentors.map((m) => (
                  <tr key={m.id} className="manageusers-tr">
                    <td className="manageusers-td font-bold text-slate-900">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar manageusers-avatar--emerald">
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="manageusers-td text-indigo-600 font-medium">{m.track}</td>
                    <td className="manageusers-td text-slate-600 font-medium">{m.college}</td>
                    <td className="manageusers-td text-slate-700 font-bold">{m.studentsAssigned} Students</td>
                    <td className="manageusers-td-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        ★ {m.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMentors.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <Users size={36} color="#94a3b8" />
              <div style={{ fontWeight: 700, color: "#334155" }}>No mentors or faculty match your search.</div>
              <p style={{ margin: 0, fontSize: "12px" }}>Try updating your search query or click "+ Add User" to provision a new mentor.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Students Risk */}
      {activeTab === "students" && (
        <div className="manageusers-risk-card">
          <table className="manageusers-table">
            <thead>
              <tr className="manageusers-thead-row">
                <th className="manageusers-th">Student Name</th>
                <th className="manageusers-th">Roll No / Batch</th>
                <th className="manageusers-th">College</th>
                <th className="manageusers-th">Attendance</th>
                <th className="manageusers-th-right">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="manageusers-tr">
                  <td className="manageusers-td">
                    <div className="manageusers-user-flex">
                      <div className="manageusers-avatar">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="manageusers-name">{s.name}</span>
                    </div>
                  </td>
                  <td className="manageusers-td">
                    <div className="font-semibold text-slate-800">{s.rollNo}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.batch}</div>
                  </td>
                  <td className="manageusers-td font-medium text-slate-700">{s.college}</td>
                  <td className="manageusers-td font-bold text-emerald-600">{s.attendance}</td>
                  <td className="manageusers-td-right">
                    <RiskBadge risk={s.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <Users size={36} color="#94a3b8" />
              <div style={{ fontWeight: 700, color: "#334155" }}>No students match your search.</div>
              <p style={{ margin: 0, fontSize: "12px" }}>Try updating your search query or click "+ Add User" to provision a new student profile.</p>
            </div>
          )}
        </div>
      )}

      {/* Generate Access Code Modal */}
      {isGenerateCodeModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsGenerateCodeModalOpen(false); }}>
          <form onSubmit={handleGenerateCode} className="modal-dialog modal-dialog-overflow-visible">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <Key size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Generate Registration Code</h2>
                  <p className="modal-subtitle">Issue single-use or multi-use invitation tokens for selected roles</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsGenerateCodeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body modal-body-overflow-visible">
              <div className="form-group-admin">
                <label>Assign Target Role *</label>
                <MuSelect
                  value={codeRole}
                  wrapperClass="mu-select"
                  options={[
                    { value: "admins", label: "Admin" },
                  ]}
                  onChange={(val) => setCodeRole(val)}
                />
              </div>

              <div className="form-group-admin">
                <label>Target College *</label>
                <MuSelect
                  value={codeCollege}
                  wrapperClass="mu-select"
                  options={collegesList.length > 0
                    ? collegesList.map(c => ({ value: c.name, label: c.name }))
                    : [{ value: "No colleges registered", label: "No colleges registered" }]
                  }
                  onChange={(val) => setCodeCollege(val)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group-admin">
                  <label>Usage Limit (Max Uses) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    className="form-input-admin"
                    placeholder="1 (Single-use token)"
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                  />
                </div>

                <div className="form-group-admin">
                  <label>Expiry Time Duration *</label>
                  <MuSelect
                    value={codeExpiry}
                    direction="up"
                    wrapperClass="mu-select"
                    options={[
                      { value: "1 Day", label: "1 Day" },
                    ]}
                    onChange={(val) => setCodeExpiry(val)}
                  />
                </div>
              </div>

              {/* Display Newly Generated Code Hero Banner */}
              {generatedCode && (
                <div className="manageusers-token-hero">
                  <div>
                    <div className="manageusers-token-label">
                      <Sparkles size={13} className="mu-sparkles-icon" />
                      <span className="manageusers-token-tag">Newly Issued Token</span>
                    </div>
                    <div className="manageusers-token-code">{generatedCode}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(generatedCode, 'hero')}
                    className={`manageusers-hero-copy-btn ${copiedCodeId === 'hero' ? 'manageusers-hero-copy-btn--copied' : ''}`}
                  >
                    {copiedCodeId === 'hero' ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedCodeId === 'hero' ? 'Copied!' : 'Copy Token'}</span>
                  </button>
                </div>
              )}

              {/* Recent Active Codes List */}
              <div className="flex flex-col gap-2.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Recently Issued Tokens</span>
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{generatedCodesList.length} Active</span>
                </div>
                <div className="manageusers-token-list">
                  {generatedCodesList.map((c) => (
                    <div key={c.id} className="manageusers-token-item">
                      <div className="manageusers-item-left">
                        <span className="manageusers-code-text">{c.code}</span>
                        <span className="manageusers-role-tag">{c.role}</span>
                        <span className="manageusers-uses-tag">
                          Uses: {c.usesCount || 0}/{c.maxUses === 0 ? '∞' : (c.maxUses || 1)}
                        </span>
                      </div>
                      <div className="manageusers-item-actions">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code, c.id)}
                          className={`manageusers-item-copy-btn ${copiedCodeId === c.id ? 'manageusers-item-copy-btn--copied' : ''}`}
                        >
                          {copiedCodeId === c.id ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedCodeId === c.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCode(c.id)}
                          title="Delete / Revoke Code"
                          className="manageusers-item-delete-btn"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="submit"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="btn-modal-submit inline-flex items-center gap-1.5"
              >
                <Sparkles size={16} />
                <span>{isGeneratingCode ? 'Generating...' : 'Generate Code'}</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Create New User Modal */}
      {isAddUserModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddUserModalOpen(false); }}>
          <div className="modal-dialog sa-create-user-modal">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Create New User</h2>
                  <p className="modal-subtitle">Provision account credentials and access privileges.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body">
                {/* Row 1: College Selection & Role Assignment (Side by Side) */}
                <div className="form-row-2 sa-form-row-2">
                  <div className="form-group-admin">
                    <label>Select College Institution *</label>
                    <MuSelect
                      value={newUserForm.collegeId}
                      placeholder="Select College Institution"
                      wrapperClass="mu-select"
                      options={collegesList.map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.code || ''})`
                      }))}
                      onChange={(val) => handleCollegeChange(val)}
                    />
                  </div>

                  <div className="form-group-admin">
                    <label>Assign Role *</label>
                    <MuSelect
                      value={newUserForm.role}
                      wrapperClass="mu-select"
                      options={[
                        { value: "admins", label: "College Administrator (Admin)" },
                      ]}
                      onChange={(val) => setNewUserForm({ ...newUserForm, role: val })}
                    />
                  </div>
                </div>

                {/* Full Name & Password (Side-by-Side) */}
                <div className="form-row-2 sa-form-row-2">
                  <div className="form-group-admin">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Priya Sharma"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        required
                        className="form-input-admin"
                        style={{ paddingRight: '40px' }}
                        placeholder="••••••••"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0
                        }}
                        tabIndex={-1}
                      >
                        {showNewUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email & Mobile Number (Mobile Number included for non-students) */}
                {newUserForm.role === 'students' ? (
                  <div className="form-group-admin sa-form-group-full">
                    <label>College Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="user@pvppcoe.ac.in"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="form-row-2 sa-form-row-2">
                    <div className="form-group-admin">
                      <label>College Email *</label>
                      <input
                        type="email"
                        required
                        className="form-input-admin"
                        placeholder="user@pvppcoe.ac.in"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        className="form-input-admin"
                        placeholder="9876543210"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Student specific fields */}
                {newUserForm.role === 'students' && (
                  <>
                    <div className="form-row-2 sa-form-row-2">
                      <div className="form-group-admin">
                        <label>College / Roll ID</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. VU21CS042"
                          value={newUserForm.rollNo || ''}
                          onChange={(e) => setNewUserForm({ ...newUserForm, rollNo: e.target.value })}
                        />
                      </div>

                      <div className="form-group-admin">
                        <label>Department *</label>
                        <MuSelect
                          value={newUserForm.departmentId}
                          direction="up"
                          placeholder={
                            !newUserForm.collegeId
                              ? "Select College First"
                              : (isLoadingDepts ? "Loading Departments..." : (collegeDepartments.length === 0 ? "No Departments Found" : "Select Department"))
                          }
                          wrapperClass="mu-select"
                          disabled={!newUserForm.collegeId || collegeDepartments.length === 0 || isLoadingDepts}
                          options={collegeDepartments.map((d) => ({
                            value: d.id,
                            label: `${d.name} (${d.code || ''})`
                          }))}
                          onChange={(val) => {
                            const selectedDep = collegeDepartments.find((d) => String(d.id) === String(val));
                            setNewUserForm((prev) => ({
                              ...prev,
                              departmentId: val,
                              department: selectedDep ? selectedDep.name : ''
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-row-2 sa-form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <MuSelect
                          value={newUserForm.year || 'FE'}
                          direction="up"
                          wrapperClass="mu-select"
                          options={[
                            { value: "FE", label: "FE" },
                            { value: "SE", label: "SE" },
                            { value: "TE", label: "TE" },
                            { value: "BE", label: "BE" },
                          ]}
                          onChange={(val) => setNewUserForm({ ...newUserForm, year: val })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Division</label>
                        <MuSelect
                          value={newUserForm.division || 'A'}
                          direction="up"
                          wrapperClass="mu-select"
                          options={[
                            { value: "A", label: "Division A" },
                            { value: "B", label: "Division B" },
                            { value: "C", label: "Division C" },
                          ]}
                          onChange={(val) => setNewUserForm({ ...newUserForm, division: val })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Coordinator Department Selection (Department removed for Mentors) */}
                {newUserForm.role === 'coordinators' && (
                  <div className="form-group-admin sa-form-group-full">
                    <label>Department *</label>
                    <MuSelect
                      value={newUserForm.departmentId}
                      direction="up"
                      placeholder={
                        !newUserForm.collegeId
                          ? "Select College First"
                          : (isLoadingDepts ? "Loading Departments..." : (collegeDepartments.length === 0 ? "No Departments Found" : "Select Department"))
                      }
                      wrapperClass="mu-select"
                      disabled={!newUserForm.collegeId || collegeDepartments.length === 0 || isLoadingDepts}
                      options={collegeDepartments.map((d) => ({
                        value: d.id,
                        label: `${d.name} (${d.code || ''})`
                      }))}
                      onChange={(val) => {
                        const selectedDep = collegeDepartments.find((d) => String(d.id) === String(val));
                        setNewUserForm((prev) => ({
                          ...prev,
                          departmentId: val,
                          department: selectedDep ? selectedDep.name : ''
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-modal-submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Trainer Modal */}
      <AssignTrainerModal
        isOpen={isAssignTrainerOpen}
        onClose={() => setIsAssignTrainerOpen(false)}
        users={allRawUsers.length > 0 ? allRawUsers : [...students, ...mentors, ...coordinators]}
      />

      {/* Assign Mentor Modal */}
      <AssignMentorModal
        isOpen={isAssignMentorOpen}
        onClose={() => setIsAssignMentorOpen(false)}
        users={allRawUsers.length > 0 ? allRawUsers : [...students, ...mentors, ...coordinators]}
      />

      {/* Bulk Excel Upload Modal */}
      <BulkExcelUploadModal
        isOpen={isBulkExcelOpen}
        onClose={() => setIsBulkExcelOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
