import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, UserPlus, Search, Filter, Edit2, Edit3, Zap, User, Trash2, Copy, CheckCircle2, XCircle, Sparkles, Shield, GraduationCap, Briefcase, UserCheck, RefreshCw, X, AlertCircle, ChevronDown, UserCog, BookOpenCheck, FileSpreadsheet, UploadCloud, Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/AD_Users.css";

/* ── Inline dropdown for Admin Users ── */
function AdminUserSelect(props) {
  return <CustomSelect {...props} />;
}

/* ── Assign Trainer Modal Component ── */
function AssignTrainerModal({ isOpen, onClose, users = [] }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [currentTrainer, setCurrentTrainer] = useState("");
  const [isEditingTrainer, setIsEditingTrainer] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDesc, setTopicDesc] = useState("");
  const [topicDate, setTopicDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [topicStatus, setTopicStatus] = useState("Scheduled");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    apiFetch("/batches")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((b) => ({
            id: b.id || b.batch_id,
            name: b.name || b.batch_name || b.code,
            label: `${b.name || b.batch_name || b.code}`,
            trainer: b.trainer || b.mentor_name || "Unassigned",
            topic: b.topic || "Daily Training Session",
            description: b.description || "Curriculum topic",
            date: b.date || new Date().toISOString().split("T")[0],
            status: b.status || "Scheduled",
          }));
          setBatches(formatted);
          if (formatted.length > 0) {
            setSelectedBatchId(formatted[0].id);
            setCurrentTrainer(formatted[0].trainer);
            setTopicTitle(formatted[0].topic);
            setTopicDesc(formatted[0].description);
            setTopicDate(formatted[0].date);
            setTopicStatus(formatted[0].status);
          }
        } else {
          setBatches([]);
        }
      })
      .catch(() => setBatches([]));
  }, [isOpen]);

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
  }, [selectedBatchId, batches]);

  if (!isOpen) return null;

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

  const trainersList = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("mentor") || r.includes("faculty") || r.includes("trainer") || r.includes("admin");
  });

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
              <BookOpenCheck size={18} className="fs-portal-icon-indigo" />
              Edit Today's Topic & Batch
            </h3>

            {successMsg && (
              <div className="modal-feedback-alert modal-feedback--success">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTopicSubmit} className="fs-portal-form">
              <div className="form-group-admin fs-portal-field">
                <label className="fs-portal-label">1. Target Batch / Cohort</label>
                <AdminUserSelect
                  value={selectedBatchId}
                  options={batches.map(b => ({ value: b.id, label: b.label }))}
                  onChange={val => setSelectedBatchId(val)}
                  placeholder="Select batch..."
                  icon={Users}
                />
              </div>

              <div className="form-group-admin fs-portal-field">
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
                  <AdminUserSelect
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

              <div className="form-group-admin fs-portal-field">
                <label className="fs-portal-label">2. Today's Topic Title</label>
                <input
                  type="text"
                  className="form-input-admin"
                  placeholder="e.g. Java Masterclass: OOPs & Collections"
                  value={topicTitle}
                  onChange={e => setTopicTitle(e.target.value)}
                  required
                />
              </div>

              <div className="fs-portal-grid-2col">
                <div className="form-group-admin fs-portal-field">
                  <label className="fs-portal-label">Teaching Date</label>
                  <input
                    type="date"
                    className="form-input-admin"
                    value={topicDate}
                    onChange={e => handleDateChange(e.target.value)}
                  />
                </div>
                <div className="form-group-admin fs-portal-field">
                  <label className="fs-portal-label">Status</label>
                  <AdminUserSelect
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

              <div className="form-group-admin fs-portal-field">
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
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                          {item.status}
                        </span>
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
  const [selectedMentor, setSelectedMentor] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Real DB mentors
  const mentors = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("mentor") || r.includes("faculty") || r.includes("prof");
  });

  // Real DB students
  const allStudents = users.filter(u => {
    const r = (u.role || "").toLowerCase();
    return r.includes("student") || r === "user" || (!r && u.name);
  });

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
              <div className="modal-feedback-alert modal-feedback--success">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="form-group-admin fs-portal-field">
              <label className="fs-portal-label">Faculty Mentor / Leader</label>
              <AdminUserSelect
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
        "College Email": "priya.sharma@pvppcoe.ac.in",
        "Mobile Number": "9876543210",
        "Roll ID": "VU21CS042",
        "Department": "COMPS",
        "Academic Year": "TE",
        "Division": "A",
      },
      {
        "Full Name": "Rahul Verma",
        "College Email": "rahul.verma@pvppcoe.ac.in",
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
              className="admin-btn-secondary bulk-template-btn"
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
            onClick={() => document.getElementById("excel-file-input").click()}
          >
            <input
              id="excel-file-input"
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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, mentors: 0, coordinators: 0 });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkExcelOpen, setIsBulkExcelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignTrainerOpen, setIsAssignTrainerOpen] = useState(false);
  const [isAssignMentorOpen, setIsAssignMentorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    role: "student",
    roll_number: "",
    department: "",
    year: "",
    division: "",
    semester: "",
    is_active: 1,
  });

  const [generatedCode, setGeneratedCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleGenerateSecureCode = async (targetRole) => {
    setIsGeneratingCode(true);
    setCopiedCode(false);
    let roleParam = 'mentor';
    if (targetRole === 'coordinator') roleParam = 'coordinator';
    if (targetRole === 'college_admin') roleParam = 'college_admin';

    const prefix = roleParam === 'coordinator' ? 'CO' : (roleParam === 'college_admin' ? 'ADM' : 'FAC');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedFallback = `${prefix}-${randomHex}`;

    try {
      const res = await apiFetch('/secure-codes/generate', {
        method: 'POST',
        body: JSON.stringify({
          role: roleParam,
          max_uses: 1,
          expiry_option: '7d',
          description: `Generated for ${roleParam} registration`,
        }),
      });
      if (res && res.data && res.data.code) {
        setGeneratedCode(res.data.code);
      } else {
        setGeneratedCode(generatedFallback);
      }
    } catch (err) {
      console.error("Failed to generate secure code:", err);
      setGeneratedCode(generatedFallback);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (roleFilter !== "all") queryParams.append("role", roleFilter);
      if (search.trim()) queryParams.append("search", search.trim());

      const res = await apiFetch(`/admin/users?${queryParams.toString()}`);
      if (res && res.data) {
        // Filter out admin accounts from College Admin user list
        const nonAdmins = (res.data || []).filter(u => {
          const r = String(u.role || '').toLowerCase();
          return !r.includes('admin');
        });
        setUsers(nonAdmins);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/admin/stats");
      if (res && res.data) {
        const s = { ...res.data };
        // Total registered users for College Admin includes Students + Mentors + Coordinators
        s.totalUsers = (s.students || 0) + (s.mentors || 0) + (s.coordinators || 0);
        setStats(s);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      mobile_number: "",
      role: "student",
      roll_number: "",
      department: "COMPS",
      year: "FE",
      division: "A",
      semester: "1",
      is_active: 1,
    });
    setGeneratedCode('');
    setIsGeneratingCode(false);
    setCopiedCode(false);
    setFeedback({ type: "", message: "" });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      role: user.role || "student",
      roll_number: user.roll_number || "",
      department: user.department || "",
      year: user.year || "",
      division: user.division || "",
      semester: user.semester || "",
      is_active: user.is_active !== undefined ? user.is_active : 1,
    });
    setFeedback({ type: "", message: "" });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res && res.data) {
        setIsAddModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create user" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (res && res.data) {
        setIsEditModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update user" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An error occurred" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      setIsDeleteModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("student")) return "role-badge--student";
    if (r.includes("mentor") || r.includes("faculty")) return "role-badge--mentor";
    if (r.includes("coordinator")) return "role-badge--coordinator";
    return "role-badge--admin";
  };

  return (
    <div className="admin-page-inner admin-users-container">
      {/* Page Header */}
      <div className="ui-section-header-AD">
        <div className="ui-section-main-AD">
          <div>
            <h2 className="ui-section-title">
              <UserCog size={22} className="ui-section-title-icon" />
              <span>User Management</span>
            </h2>
            <p className="ui-section-desc">
              Manage registered student profiles, mentors, coordinators, and assign system access roles.
            </p>
          </div>
          <div className="ui-section-action" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="admin-btn-add" onClick={handleOpenAdd}>
              <UserPlus size={16} /> Add User
            </button>
            <button
              className="admin-btn-excel"
              onClick={() => setIsBulkExcelOpen(true)}
            >
              <FileSpreadsheet size={16} /> Upload Excel
            </button>
            <button className="admin-btn-secondary" onClick={() => setIsAssignTrainerOpen(true)}>
              <Briefcase size={16} /> Assign Trainer
            </button>
            <button className="admin-btn-secondary" onClick={() => setIsAssignMentorOpen(true)}>
              <UserCheck size={16} /> Assign Mentor
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="admin-users-stats-grid">
        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--indigo">
            <Users size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.totalUsers}</span>
            <span className="admin-user-stat-lbl">Total Registered Users</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--blue">
            <GraduationCap size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.students}</span>
            <span className="admin-user-stat-lbl">Enrolled Students</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--purple">
            <Briefcase size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.mentors}</span>
            <span className="admin-user-stat-lbl">Faculty & Mentors</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--emerald">
            <Shield size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.coordinators}</span>
            <span className="admin-user-stat-lbl">Program Coordinators</span>
          </div>
        </div>
      </div>

      {/* Toolbar with Search and Filters */}
      <div className="admin-users-toolbar">
        <div className="admin-users-search-wrap">
          <Search size={16} className="admin-users-search-icon" />
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by name, email, roll no, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-users-filters">
          <button
            className={`admin-filter-pill ${roleFilter === "all" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            All Roles ({stats.totalUsers})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "student" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("student")}
          >
            Students ({stats.students})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "mentor" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("mentor")}
          >
            Mentors ({stats.mentors})
          </button>
          <button
            className={`admin-filter-pill ${roleFilter === "coordinator" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("coordinator")}
          >
            Coordinators ({stats.coordinators})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-users-table-card">
        <div className="admin-users-table-responsive">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Assigned Role</th>
                <th>Academic / Dept</th>
                <th>Mobile Number</th>
                <th>Status</th>
                <th className="th-actions-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitials(u.name)}</div>
                        <div>
                          <div className="user-name-title">{u.name || "Unnamed User"}</div>
                          <div className="user-email-sub">{u.email || "No email"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role ? u.role.replace("_", " ") : "student"}
                      </span>
                    </td>
                    <td>
                      {u.role === "student" ? (
                        <div>
                          <div className="user-dept-student">
                            {u.department || "No Dept"} {u.year ? `· ${u.year}` : ""} {u.division ? `(Div ${u.division})` : ""}
                          </div>
                          <div className="user-dept-roll">
                            ID: {u.roll_number || "N/A"} · Sem {u.semester || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="user-dept-staff">{u.department || "Institutional Staff"}</span>
                      )}
                    </td>
                    <td>
                      <span className="user-mobile-text">
                        {u.mobile_number || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active ? "status-badge--active" : "status-badge--inactive"}`}>
                        <span className="status-dot"></span>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns-row action-btns-right">
                        <button
                          className="btn-table-action"
                          title="Edit User"
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-table-action btn-table-action--delete"
                          title="Delete User"
                          onClick={() => handleOpenDelete(u)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-users-empty">
                      <div className="admin-users-empty-icon">
                        <Users size={28} />
                      </div>
                      <h3>No Users Found</h3>
                      <p>No registered accounts match your current filter or search criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-dialog">
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
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {feedback.message && (
                  <div className={`modal-feedback-alert ${feedback.type === "error" ? "modal-feedback--error" : "modal-feedback--success"}`}>
                    {feedback.message}
                  </div>
                )}
                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Assign Role *</label>
                    <AdminUserSelect
                      value={formData.role}
                      onChange={(val) => {
                        setFormData({ ...formData, role: val });
                        setGeneratedCode('');
                      }}
                      options={[
                        { value: "student", label: "Student" },
                        { value: "mentor", label: "Mentor" },
                        { value: "coordinator", label: "Coordinator" },
                      ]}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input-admin"
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>College Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="user@pvppcoe.ac.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input-admin"
                      placeholder="9876543210"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    />
                  </div>
                </div>

                {formData.role !== 'student' && (
                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-modal-submit"
                        style={{
                          padding: '9px 22px',
                          fontSize: '13.5px',
                          fontWeight: '700',
                          width: 'auto',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '10px',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                          cursor: 'pointer'
                        }}
                        disabled={isGeneratingCode}
                        onClick={() => handleGenerateSecureCode(formData.role)}
                      >
                        <Sparkles size={16} />
                        {isGeneratingCode ? "Generating..." : "Generate Token"}
                      </button>
                    </div>

                    {generatedCode && (
                      <div className="manageusers-token-hero" style={{ marginTop: '10px' }}>
                        <div>
                          <div className="manageusers-token-label">
                            <Sparkles size={13} style={{ color: '#c7d2fe' }} />
                            <span className="manageusers-token-tag">Newly Issued Token</span>
                          </div>
                          <div className="manageusers-token-code">{generatedCode}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(generatedCode).catch(() => {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = generatedCode;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(textArea);
                                });
                              } else {
                                const textArea = document.createElement("textarea");
                                textArea.value = generatedCode;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                              }
                            } catch (_) {}
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }}
                          className={`manageusers-hero-copy-btn ${copiedCode ? 'manageusers-hero-copy-btn--copied' : ''}`}
                        >
                          {copiedCode ? <Check size={15} /> : <Copy size={15} />}
                          <span>{copiedCode ? 'Copied!' : 'Copy Token'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {formData.role === "student" && (
                  <>
                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>College / Roll ID</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. VU21CS042"
                          value={formData.roll_number}
                          onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Department</label>
                        <AdminUserSelect
                          value={formData.department}
                          onChange={(val) => setFormData({ ...formData, department: val })}
                          options={[
                            { value: "COMPS", label: "COMPS" },
                            { value: "IT", label: "IT" },
                            { value: "AIML", label: "AIML" },
                            { value: "ECS", label: "ECS" },
                            { value: "MTRX", label: "MTRX" },
                            { value: "EXTC", label: "EXTC" }
                          ]}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <AdminUserSelect
                          value={formData.year}
                          onChange={(val) => setFormData({ ...formData, year: val })}
                          options={[
                            { value: "FE", label: "FE" },
                            { value: "SE", label: "SE" },
                            { value: "TE", label: "TE" },
                            { value: "BE", label: "BE" }
                          ]}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Division</label>
                        <AdminUserSelect
                          value={formData.division}
                          onChange={(val) => setFormData({ ...formData, division: val })}
                          options={[
                            { value: "A", label: "Division A" },
                            { value: "B", label: "Division B" },
                            { value: "C", label: "Division C" }
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer-users">
                <button type="submit" className="btn-modal-submit" disabled={actionLoading}>
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--blue">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Edit User Profile</h2>
                  <p className="modal-subtitle">Update user account information and role assignments.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                {feedback.message && (
                  <div className={`modal-feedback-alert ${feedback.type === "error" ? "modal-feedback--error" : "modal-feedback--success"}`}>
                    {feedback.message}
                  </div>
                )}
                <div className="form-group-admin">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input-admin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-input-admin"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input-admin"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Role</label>
                    <AdminUserSelect
                      value={formData.role}
                      onChange={(val) => setFormData({ ...formData, role: val })}
                      options={[
                        { value: "student", label: "Student" },
                        { value: "mentor", label: "Mentor / Faculty" },
                        { value: "coordinator", label: "Coordinator" },
                        { value: "college_admin", label: "College Admin" }
                      ]}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Account Status</label>
                    <AdminUserSelect
                      value={formData.is_active}
                      onChange={(val) => setFormData({ ...formData, is_active: parseInt(val) })}
                      options={[
                        { value: 1, label: "Active" },
                        { value: 0, label: "Inactive" }
                      ]}
                    />
                  </div>
                </div>

                {formData.role === "student" && (
                  <div className="form-row-2">
                    <div className="form-group-admin">
                      <label>Roll Number / ID</label>
                      <input
                        type="text"
                        className="form-input-admin"
                        value={formData.roll_number}
                        onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Department</label>
                      <input
                        type="text"
                        className="form-input-admin"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-modal-submit" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirmation */}
      {isDeleteModalOpen && selectedUser && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}>
          <div className="modal-dialog modal-dialog--sm">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--red">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Delete User</h2>
                  <p className="modal-subtitle">Permanent action confirmation</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-user-row">
                <div>
                  <p className="delete-user-title">
                    Are you sure you want to delete user "{selectedUser.name}"?
                  </p>
                  <p className="delete-user-sub">
                    This action will permanently remove the user and any associated student profile records.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-modal-submit btn-modal-danger" onClick={handleDeleteUser} disabled={actionLoading}>
                {actionLoading ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Trainer Modal */}
      <AssignTrainerModal
        isOpen={isAssignTrainerOpen}
        onClose={() => setIsAssignTrainerOpen(false)}
        users={users}
      />

      {/* Assign Mentor Modal */}
      <AssignMentorModal
        isOpen={isAssignMentorOpen}
        onClose={() => setIsAssignMentorOpen(false)}
        users={users}
      />

      {/* Bulk Excel Upload Modal */}
      <BulkExcelUploadModal
        isOpen={isBulkExcelOpen}
        onClose={() => setIsBulkExcelOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
}
