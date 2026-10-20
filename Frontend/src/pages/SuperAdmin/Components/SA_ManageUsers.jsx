import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Check, Users, UserPlus, UserCog, Search, ShieldCheck, UserCheck, GraduationCap, Mail, Building2, Calendar, Clock, CheckCircle2, XCircle, Phone, BookOpen, Key, KeyRound, Copy, ChevronDown, X, Sparkles, Trash2, Briefcase, BookOpenCheck, Zap, User, FileSpreadsheet, UploadCloud, Download, AlertCircle, Eye, EyeOff, History } from "lucide-react";
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
  let modifier = '';
  const normalized = (status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'verified' || normalized === 'approved' || normalized === 'available') {
    modifier = 'manageusers-status--active';
  } else if (normalized === 'inactive' || normalized === 'disabled' || normalized === 'rejected') {
    modifier = 'manageusers-status--inactive';
  } else if (normalized === 'high' || normalized === 'in progress' || normalized === 'pending') {
    modifier = 'manageusers-status--warning';
  } else if (normalized === 'busy' || normalized === 'medium') {
    modifier = 'manageusers-status--warning';
  } else if (normalized === 'near completion') {
    modifier = 'manageusers-status--purple';
  }

  const displayStatus = status === 'Verified' ? 'Approved' : status;

  return (
    <span className={`manageusers-status-badge ${modifier}`}>
      <span className="manageusers-status-badge-dot"></span>
      {displayStatus}
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

function formatDateDMY(dateVal) {
  if (!dateVal) return '—';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const [y, m, d] = dateVal.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
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
  const [dailyTopicsList, setDailyTopicsList] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    apiFetch("/batches")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const activeOnly = list.filter((b) => {
            const st = String(b.status || "").toLowerCase().trim();
            return st === "active";
          });
          const formatted = activeOnly.map((b) => ({
            id: b.id || b.batch_id,
            name: b.name || b.batch_name || b.code,
            label: `${b.name || b.batch_name || b.code}`,
            trainer: b.trainer || b.mentor_name || "Unassigned",
            topic: b.topic || "Daily Training Session",
            description: b.description || "Curriculum topic",
            date: b.date || new Date().toISOString().split("T")[0],
            status: b.status || "Active",
          }));
          setBatches(formatted);
          if (formatted.length > 0) {
            setSelectedBatchId(formatted[0].id);
          } else {
            setSelectedBatchId("");
          }
        } else {
          setBatches([]);
          setSelectedBatchId("");
        }
      })
      .catch(() => {
        setBatches([]);
        setSelectedBatchId("");
      });
  }, [isOpen]);

  // Fetch daily topics history whenever selectedBatchId changes
  useEffect(() => {
    if (!selectedBatchId) return;
    const selected = batches.find(b => b.id === selectedBatchId);
    if (selected) {
      setCurrentTrainer(selected.trainer);
      setIsEditingTrainer(false);
    }

    setLoadingTopics(true);
    apiFetch(`/batches/${selectedBatchId}/daily-topics`)
      .then((res) => {
        const topics = res?.data || (Array.isArray(res) ? res : []);
        const topicsArr = Array.isArray(topics) ? topics : [];
        setDailyTopicsList(topicsArr);

        const currentDate = topicDate || selected?.date || new Date().toISOString().split("T")[0];
        const existing = topicsArr.find(t => t.topic_date === currentDate || t.date === currentDate);
        if (existing) {
          setTopicTitle(existing.topic || "");
          setTopicDesc(existing.description || "");
          setTopicStatus(existing.status || computeAutoStatus(currentDate));
          if (existing.trainer) setCurrentTrainer(existing.trainer);
        } else if (selected) {
          setTopicTitle(selected.topic || "");
          setTopicDesc(selected.description || "");
          setTopicDate(selected.date || new Date().toISOString().split("T")[0]);
          setTopicStatus(selected.status || "Scheduled");
        }
      })
      .catch((err) => {
        console.warn("[Fetch Daily Topics Error]", err);
        setDailyTopicsList([]);
        if (selected) {
          setTopicTitle(selected.topic || "");
          setTopicDesc(selected.description || "");
          setTopicStatus(selected.status || "Scheduled");
        }
      })
      .finally(() => setLoadingTopics(false));
  }, [selectedBatchId, batches]);

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

    // Look up if topic exists for newDate in dailyTopicsList
    const existing = dailyTopicsList.find(t => t.topic_date === newDate || t.date === newDate);
    if (existing) {
      setTopicTitle(existing.topic || "");
      setTopicDesc(existing.description || "");
      setTopicStatus(existing.status || computeAutoStatus(newDate));
      if (existing.trainer) setCurrentTrainer(existing.trainer);
    } else {
      const selected = batches.find(b => b.id === selectedBatchId);
      if (selected && selected.date === newDate) {
        setTopicTitle(selected.topic || "");
        setTopicDesc(selected.description || "");
        setTopicStatus(selected.status || computeAutoStatus(newDate));
      } else {
        // Reset topic fields for new date entry
        setTopicTitle("");
        setTopicDesc("");
        setTopicStatus(computeAutoStatus(newDate, "Scheduled"));
      }
    }
  };

  const handleSelectPreviousTopic = (tItem) => {
    const itemDate = tItem.topic_date || tItem.date;
    setTopicDate(itemDate);
    setTopicTitle(tItem.topic || "");
    setTopicDesc(tItem.description || "");
    setTopicStatus(tItem.status || computeAutoStatus(itemDate));
    if (tItem.trainer) setCurrentTrainer(tItem.trainer);
  };

  const handleUpdateTopicSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !topicTitle) return;

    const today = new Date().toISOString().split("T")[0];
    let updatedStatus = topicStatus;

    if (topicDate === today && topicStatus === "Scheduled") {
      updatedStatus = "In Progress";
    } else if (!topicStatus) {
      updatedStatus = computeAutoStatus(topicDate);
    }

    setTopicStatus(updatedStatus);

    const payload = {
      topic_date: topicDate,
      topic: topicTitle,
      description: topicDesc || "Daily curriculum topic",
      status: updatedStatus,
      trainer: currentTrainer,
    };

    try {
      const res = await apiFetch(`/batches/${selectedBatchId}/daily-topics`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const updatedTopics = res?.data || [];
      if (Array.isArray(updatedTopics) && updatedTopics.length > 0) {
        setDailyTopicsList(updatedTopics);
      } else {
        setDailyTopicsList(prev => {
          const filtered = prev.filter(t => (t.topic_date || t.date) !== topicDate);
          return [{ ...payload, id: Date.now() }, ...filtered];
        });
      }
    } catch (err) {
      console.warn("[Save Daily Topic Error]", err);
    }

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

    const activeBatchObj = batches.find(b => b.id === selectedBatchId);
    setSuccessMsg(`Topic for ${topicDate} saved to database for ${activeBatchObj?.name || 'batch'}!`);
    setTimeout(() => setSuccessMsg(""), 3500);
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
    setBatches(prev =>
      prev
        .map(b => b.id === batchId ? { ...b, status: newStatus } : b)
        .filter(b => String(b.status || "").toLowerCase().trim() === "active")
    );
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
                <BookOpenCheck size={18} /> Save Taught Topic for {topicDate}
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
              {batches.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", width: "100%", gridColumn: "1 / -1", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                  No active batches available.
                </div>
              ) : (
                batches.map(item => {
                const isSelected = item.id === selectedBatchId;
                const displayTopic = isSelected ? (topicTitle || item.topic) : item.topic;
                const displayDesc = isSelected ? (topicDesc || item.description) : item.description;
                const displayTrainer = isSelected ? currentTrainer : item.trainer;

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
                          value={isSelected ? topicStatus : item.status}
                          onChange={e => { e.stopPropagation(); handleStatusQuickChange(item.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <h4 className="fs-portal-batch-title">
                        {displayTopic}
                      </h4>

                      <p className="fs-portal-batch-desc">
                        {displayDesc}
                      </p>
                    </div>

                    <div className="fs-portal-batch-footer">
                      <div className="fs-portal-trainer-info">
                        <div className="fs-portal-trainer-avatar">
                          {(displayTrainer || "T").charAt(0)}
                        </div>
                        <span className="fs-portal-trainer-name">{displayTrainer}</span>
                      </div>
                      <span className={isSelected ? "fs-portal-batch-status-active" : "fs-portal-batch-status-idle"}>
                        {isSelected ? "Active Batch ✓" : "Click to Edit"}
                      </span>
                    </div>
                  </div>
                );
              }))}
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
      const res = await apiFetch('/admin/assign-mentor', {
        method: 'POST',
        body: JSON.stringify({
          mentorId: activeMentor?.id || null,
          mentorName: selectedMentor,
          mentorEmail: activeMentor?.email || null,
          studentIds: selectedStudentIds
        })
      });
      if (res && res.error) {
        alert(res.message || res.error || "Failed to assign mentor. Please try again.");
        return;
      }
    } catch (err) {
      console.warn('[DB Save Mentor Assignment Error]', err);
      alert("Failed to save mentor assignment. Please try again.");
      return;
    }

    const count = selectedStudentIds.length;
    const menteeText = count === 1 ? 'mentee' : 'mentees';
    setSuccessMsg(`Successfully assigned ${count} ${menteeText} to ${selectedMentor}.`);
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
              <h2 className="fs-portal-header-title">Assign Mentor to Students</h2>
              <p className="fs-portal-header-subtitle">
                Multi-select student profiles via real-time roll number search and allocate to a mentor
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
              1. Select Mentor
            </h3>

            {successMsg && (
              <div className="fs-portal-alert-success">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="fs-portal-field">
              <label className="fs-portal-label">Mentor / Leader</label>
              <MuSelect
                value={selectedMentor}
                options={mentors.map(m => ({ value: m.name, label: `${m.name} (${m.department || 'Computer Science'})` }))}
                onChange={val => setSelectedMentor(val)}
                placeholder="-- Choose Mentor --"
                icon={UserCheck}
              />
            </div>



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

        <div className="modal-footer modal-footer-users">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
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
          setCodeCollege(prev => (!prev || prev === 'Partner Campus') ? data[0].name : prev);
        }
      })
      .catch(err => console.error("Error loading colleges for ManageUsers modal:", err));

    apiFetch('/admin/pending-users')
      .then(res => {
        if (res && res.data && Array.isArray(res.data)) {
          const adminOnly = res.data.filter(u => {
            const r = String(u.role || '').toLowerCase();
            return r === 'college_admin' || r === 'admin' || r === 'hod' || r.includes('admin');
          });
          setPendingUsersList(adminOnly);
          setPendingUsersCount(adminOnly.length);
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
              name: u.name || 'Admin',
              adminName: u.name || 'Admin',
              email: u.email,
              phone: u.mobile_number || u.phone || '',
              college: u.college_name || u.college || 'Direct / Institutional',
              designation: u.designation || (u.role === 'hod' ? 'Head of Department' : u.role === 'college_admin' ? 'College Admin' : 'Institutional Admin'),
              date: u.created_at ? (typeof u.created_at === 'string' ? u.created_at.split('T')[0] : new Date(u.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
              status: u.is_active ? 'Approved' : 'Pending'
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
        setAdminRequests(adminRequests.map((r) => r.id === id ? { ...r, status: 'Approved' } : r));
        setPendingUsersList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(res?.error || "Failed to verify admin account");
      }
    } catch (err) {
      setAdminRequests(adminRequests.map((r) => r.id === id ? { ...r, status: 'Approved' } : r));
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

  const handleDeleteAdmin = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete admin account "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res && (res.success || !res.error)) {
        alert(res?.message || `Admin account "${userName}" deleted successfully.`);
        setAdminRequests((prev) => prev.filter((r) => r.id !== userId));
      } else {
        alert(res?.error || res?.message || 'Failed to delete admin account.');
      }
    } catch (err) {
      console.error('Delete admin error:', err);
      alert(err?.message || 'Failed to delete admin account.');
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

  const [codeRequests, setCodeRequests] = useState([]);

  const loadCodeRequests = async () => {
    try {
      const res = await apiFetch('/auth/secure-code-requests');
      if (res && res.data && Array.isArray(res.data)) {
        setCodeRequests(res.data.filter(r => r.status === 'Pending'));
      }
    } catch (_) {}
  };

  const requestedColleges = Array.from(
    new Set(codeRequests.map((r) => (r.college_name || "").trim()).filter(Boolean))
  );

  const targetCollegeOptions = (() => {
    if (requestedColleges.length > 0) {
      const reqOpts = requestedColleges.map((name) => ({
        value: name,
        label: `🏛️ ${name} (Requested by College Admin)`,
      }));
      const otherOpts = collegesList
        .filter((c) => !requestedColleges.includes(c.name))
        .map((c) => ({ value: c.name, label: c.name }));
      return [...reqOpts, ...otherOpts];
    }
    if (collegesList.length > 0) {
      return collegesList.map((c) => ({ value: c.name, label: c.name }));
    }
    return [{ value: "Awaiting College Admin Request...", label: "Awaiting College Admin Request..." }];
  })();

  useEffect(() => {
    if (requestedColleges.length > 0) {
      if (!codeCollege || codeCollege === 'Partner Campus' || !targetCollegeOptions.some(o => o.value === codeCollege)) {
        setCodeCollege(requestedColleges[0]);
      }
    } else if (collegesList.length > 0 && (!codeCollege || codeCollege === 'Partner Campus')) {
      setCodeCollege(collegesList[0].name);
    }
  }, [codeRequests, collegesList]);

  useEffect(() => {
    loadSecureCodes();
    loadCodeRequests();
    const interval = setInterval(loadCodeRequests, 4000);
    return () => clearInterval(interval);
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

      // Automatically resolve / clear pending code requests for admins once code is generated
      if (codeRole === 'admins' || targetRole === 'college_admin') {
        try {
          await apiFetch('/auth/secure-code-requests/all', { method: 'DELETE' });
        } catch (_) {}
        await loadCodeRequests();
      }
    } catch (err) {
      console.error("Error generating secure code:", err);
      setGeneratedCode(generatedFallback);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDismissCodeRequest = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await apiFetch(`/auth/secure-code-requests/${id}`, { method: 'DELETE' });
      setCodeRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to dismiss code request:", err);
    }
  };

  const handleClearAllCodeRequests = async () => {
    try {
      await apiFetch('/auth/secure-code-requests/all', { method: 'DELETE' });
      setCodeRequests([]);
    } catch (err) {
      console.error("Failed to clear code requests:", err);
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
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {
          const textArea = document.createElement("textarea");
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (_) {}
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

    const targetRole = roleMapping[newUserForm.role] || 'college_admin';
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
          <h2 className="manageusers-header-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "inherit" }}>
            <span>Manage Users &amp; Registration Codes</span>
          </h2>
          <p className="manageusers-header-subtitle">View system users, issue role-based registration invitation codes, and provision institutional users</p>
        </div>

        <div className="sa-header-actions">
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
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT: HODs & College Admins */}
      {activeTab === "admins" && (
        <div className="manageusers-tab-content">
          {codeRequests.length > 0 && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <KeyRound size={18} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {codeRequests.length} Admin Secure Code Request{codeRequests.length > 1 ? 's' : ''} Pending
                    </h4>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fcd34d'
                    }}>
                      Action Required
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearAllCodeRequests}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Clear all pending requests"
                >
                  <X size={13} />
                  <span>Dismiss All</span>
                </button>
              </div>

              {/* Individual Requester Badges */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                paddingTop: '8px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Requesters:
                </span>
                {codeRequests.map((r, i) => (
                  <div
                    key={r.id || i}
                    onClick={() => {
                      if (r.college_name) setCodeCollege(r.college_name);
                      setIsGenerateCodeModalOpen(true);
                    }}
                    title={`Click to generate registration code for ${r.college_name || r.name}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px 4px 10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0fdf4';
                      e.currentTarget.style.borderColor = '#86efac';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <User size={12} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.name}</span>
                    <span style={{ color: '#64748b', fontSize: '11.5px' }}>({r.email})</span>
                    {r.college_name && (
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontWeight: 700,
                        fontSize: '11px',
                        border: '1px solid #bae6fd'
                      }}>
                        🏛️ {r.college_name}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDismissCodeRequest(r.id, e)}
                      title="Remove request"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        marginLeft: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


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
                      <th className="manageusers-th">Admin Details</th>
                      <th className="manageusers-th">Institution / College</th>
                      <th className="manageusers-th">Designation</th>
                      <th className="manageusers-th">Requested On</th>
                      <th className="manageusers-th">Status</th>
                      <th className="manageusers-th-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((req) => (
                      <tr key={req.id} className="manageusers-tr">
                        <td className="manageusers-td">
                          <div className="manageusers-cell-title">{req.name}</div>
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
                        <td className="manageusers-td manageusers-cell-text-slate">{req.designation}</td>
                        <td className="manageusers-td">
                          <div className="manageusers-contact-row">
                            <Calendar size={14} className="manageusers-contact-icon" />
                            <span className="manageusers-contact-text">{formatDateDMY(req.date)}</span>
                          </div>
                        </td>
                        <td className="manageusers-td">
                          <StatusBadge status={req.status} />
                        </td>
                          <td className="manageusers-td-center">
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(req.id, req.name)}
                                  className="manageusers-btn-delete-admin"
                                  title="Delete this Admin account"
                                  aria-label="Delete this Admin account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="manageusers-actions-row">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(req.id, req.name)}
                                  className="manageusers-btn-delete-admin"
                                  title="Delete this Admin account"
                                  aria-label="Delete this Admin account"
                                >
                                  <Trash2 size={14} />
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
                    <td className="manageusers-td manageusers-cell-title">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="manageusers-td manageusers-cell-text-muted">{c.college}</td>
                    <td className="manageusers-td manageusers-dept-text">{c.department}</td>
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
                    <td className="manageusers-td manageusers-cell-title">
                      <div className="manageusers-user-flex">
                        <div className="manageusers-avatar manageusers-avatar--emerald">
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          <div className="manageusers-cell-email">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="manageusers-td manageusers-track-text">{m.track}</td>
                    <td className="manageusers-td manageusers-cell-text-muted">{m.college}</td>
                    <td className="manageusers-td manageusers-cell-text-bold">{m.studentsAssigned} Students</td>
                    <td className="manageusers-td-right">
                      <span className="manageusers-rating-pill">
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
              <div style={{ fontWeight: 700, color: "#334155" }}>No mentors match your search.</div>
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
                    <div className="manageusers-cell-text-dark">{s.rollNo}</div>
                    <div className="manageusers-cell-subtext">{s.batch}</div>
                  </td>
                  <td className="manageusers-td manageusers-cell-text-slate">{s.college}</td>
                  <td className="manageusers-td manageusers-cell-attendance">{s.attendance}</td>
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
              {/* College Admin Request Notification Banner */}
              {requestedColleges.length > 0 && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '9px 13px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#15803d',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <span>
                      <strong>Admin Request Pending:</strong> {codeRequests[0]?.name} submitted <strong>{codeRequests[0]?.college_name}</strong> on registration.
                    </span>
                  </div>
                  {codeCollege !== codeRequests[0]?.college_name && codeRequests[0]?.college_name && (
                    <button
                      type="button"
                      onClick={() => setCodeCollege(codeRequests[0]?.college_name)}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '3px 9px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '11px'
                      }}
                    >
                      Select {codeRequests[0]?.college_name}
                    </button>
                  )}
                </div>
              )}

              {/* Row 1: Role Box & Target College (Side-by-Side) */}
              <div className="form-row-2 sa-form-row-2" style={{ marginBottom: '14px' }}>
                <div className="form-group-admin">
                  <label>Assign Target Role *</label>
                  <div
                    className="form-input-admin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      color: '#1e293b',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      height: '42px',
                      padding: '0 14px',
                      boxSizing: 'border-box',
                      cursor: 'default',
                      userSelect: 'none'
                    }}
                  >
                    Admin
                  </div>
                </div>

                <div className="form-group-admin" style={{ minWidth: 0 }}>
                  <label>Target College *</label>
                  <MuSelect
                    value={codeCollege}
                    wrapperClass="mu-select mu-select-scrollable-label"
                    options={targetCollegeOptions}
                    onChange={(val) => setCodeCollege(val)}
                  />
                </div>
              </div>

              {/* Row 2: Usage Limit (below role) & Expiry Duration (besides usage limit) */}
              <div className="form-row-2 sa-form-row-2">
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
                      { value: "3 Days", label: "3 Days" },
                      { value: "7 Days", label: "7 Days" },
                      { value: "30 Days", label: "30 Days" },
                      { value: "Never / Unlimited", label: "Never / Unlimited" },
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
              <div className="manageusers-tokens-container">
                <div className="manageusers-tokens-header">
                  <span className="manageusers-tokens-title">Recently Issued Tokens</span>
                  <span className="manageusers-tokens-badge">{generatedCodesList.length} Active</span>
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
                {/* College Selection (Full Width) */}
                <div className="form-group-admin sa-form-group-full">
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
                    <div className="password-input-wrap">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        required
                        className="form-input-admin"
                        placeholder="••••••••"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="password-toggle-btn"
                        tabIndex={-1}
                        aria-label={showNewUserPassword ? "Hide password" : "Show password"}
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
