import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Users, UserPlus, Search, Filter, Edit2, Edit3, Zap, User, Trash2, Copy, CheckCircle2, XCircle, Sparkles, Shield, GraduationCap, Briefcase, UserCheck, RefreshCw, X, AlertCircle, ChevronDown, UserCog, BookOpenCheck, FileSpreadsheet, UploadCloud, Download, Check, History, Clock, KeyRound, Building2, ShieldAlert, Repeat, UserX } from "lucide-react";
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
  const [dailyTopicsList, setDailyTopicsList] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingTrainers(true);
    apiFetch("/admin/users?role=trainer")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          const onlyTrainers = list.filter(u => {
            const isTrainer = String(u.role || "").toLowerCase() === "trainer";
            const isApproved = u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1";
            return isTrainer && isApproved;
          });
          setTrainers(onlyTrainers);
        }
      })
      .catch((err) => {
        console.warn("[Fetch Trainers Error]", err);
        const fallback = (users || []).filter(u => {
          const isTrainer = String(u.role || "").toLowerCase() === "trainer";
          const isApproved = u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1";
          return isTrainer && isApproved;
        });
        setTrainers(fallback);
      })
      .finally(() => setLoadingTrainers(false));
  }, [isOpen]);

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
          setTopicStatus(normalizeTopicStatus(existing.status, currentDate));
          if (existing.trainer) setCurrentTrainer(existing.trainer);
        } else if (selected) {
          setTopicTitle(selected.topic || "");
          setTopicDesc(selected.description || "");
          setTopicDate(selected.date || new Date().toISOString().split("T")[0]);
          setTopicStatus(normalizeTopicStatus(selected.status, selected.date));
        }
      })
      .catch((err) => {
        console.warn("[Fetch Daily Topics Error]", err);
        setDailyTopicsList([]);
        if (selected) {
          setTopicTitle(selected.topic || "");
          setTopicDesc(selected.description || "");
          setTopicStatus(normalizeTopicStatus(selected.status, selected.date));
        }
      })
      .finally(() => setLoadingTopics(false));
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

  const normalizeTopicStatus = (status, dateStr) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "scheduled") return "Scheduled";
    if (s === "in progress" || s === "in_progress") return "In Progress";
    if (s === "completed") return "Completed";
    return computeAutoStatus(dateStr, "Scheduled");
  };

  const handleDateChange = (newDate) => {
    setTopicDate(newDate);

    // Look up if topic exists for newDate in dailyTopicsList
    const existing = dailyTopicsList.find(t => t.topic_date === newDate || t.date === newDate);
    if (existing) {
      setTopicTitle(existing.topic || "");
      setTopicDesc(existing.description || "");
      setTopicStatus(normalizeTopicStatus(existing.status, newDate));
      if (existing.trainer) setCurrentTrainer(existing.trainer);
    } else {
      const selected = batches.find(b => b.id === selectedBatchId);
      if (selected && selected.date === newDate) {
        setTopicTitle(selected.topic || "");
        setTopicDesc(selected.description || "");
        setTopicStatus(normalizeTopicStatus(selected.status, newDate));
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

  const trainerOptions = trainers.map((t) => ({
    value: t.name,
    label: `${t.name} (Trainer)`,
  }));

  if (currentTrainer && !trainerOptions.some(o => o.value === currentTrainer)) {
    trainerOptions.unshift({
      value: currentTrainer,
      label: `${currentTrainer} (Assigned)`,
    });
  }

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
                  <>
                    <AdminUserSelect
                      value={currentTrainer}
                      options={trainerOptions}
                      onChange={val => setCurrentTrainer(val)}
                      placeholder={loadingTrainers ? "Loading trainers..." : (trainerOptions.length === 0 ? "No trainers available" : "Select trainer...")}
                      icon={UserCheck}
                    />
                    {!loadingTrainers && trainers.length === 0 && (
                      <small style={{ color: "#64748b", marginTop: "4px", display: "block", fontSize: "11px" }}>
                        No trainers registered yet. Create a user with role "Trainer" in User Management.
                      </small>
                    )}
                  </>
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
                    placeholder="Select Status"
                    icon={Clock}
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
                const displayStatus = isSelected ? topicStatus : item.status;
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
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                          {displayStatus}
                        </span>
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
function AssignMentorModal({ isOpen, onClose, onSuccess, users = [] }) {
  const [selectedMentor, setSelectedMentor] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [divFilter, setDivFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "available" | "assigned"
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentsMap, setAssignmentsMap] = useState({});

  // Reassignment modal state
  const [reassignStudent, setReassignStudent] = useState(null);
  const [reassignNewMentor, setReassignNewMentor] = useState("");
  const [reassignError, setReassignError] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  // Synchronize latest mentor assignments directly from DB when modal opens
  useEffect(() => {
    if (isOpen) {
      apiFetch("/admin/assign-mentor")
        .then((res) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          const map = {};
          if (Array.isArray(list)) {
            list.forEach((item) => {
              if (item.student_id) {
                map[String(item.student_id)] = item.mentor_name;
              }
            });
          }
          setAssignmentsMap(map);
        })
        .catch((err) => console.warn("Failed to load mentor assignments:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real DB mentors (only approved)
  const mentors = users.filter((u) => {
    const r = (u.role || "").toLowerCase();
    const isApproved = u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1";
    return (r.includes("mentor") || r.includes("faculty") || r.includes("prof")) && isApproved;
  });

  // Real DB students (only approved)
  const allStudents = users.filter((u) => {
    const r = (u.role || "").toLowerCase();
    const isApproved = u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1";
    return (r.includes("student") || r === "user" || (!r && u.name)) && isApproved;
  });

  // Filter students based on Department, Year, Division, Status, and Search input
  const filteredStudents = allStudents.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    const deptStr = (s.department || s.dept || "").toLowerCase();
    const assignedMentor = s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)] || "";
    const isAssigned = Boolean(assignedMentor && assignedMentor.trim());

    // 1. Assignment Status Filter
    if (statusFilter === "available" && isAssigned) return false;
    if (statusFilter === "assigned" && !isAssigned) return false;

    // 2. Department filter
    let matchesDept = true;
    if (deptFilter !== "all") {
      const filterLower = deptFilter.toLowerCase();
      matchesDept =
        deptStr.includes(filterLower) ||
        (filterLower.includes("computer") && (deptStr.includes("cs") || deptStr.includes("cse"))) ||
        (filterLower.includes("information") && (deptStr.includes("it") || deptStr.includes("info"))) ||
        (filterLower.includes("ai") && (deptStr.includes("data") || deptStr.includes("ds") || deptStr.includes("ai"))) ||
        (filterLower.includes("electronics") && (deptStr.includes("ec") || deptStr.includes("extc") || deptStr.includes("elec") || deptStr.includes("ecs")));
    }
    if (!matchesDept) return false;

    // 3. Year filter (FE, SE, TE, BE)
    let matchesYear = true;
    if (yearFilter !== "all") {
      const sYear = (s.year || "").toLowerCase().trim();
      const targetYear = yearFilter.toLowerCase().trim();
      matchesYear =
        sYear === targetYear ||
        (targetYear === "fe" && (sYear.includes("fe") || sYear.includes("first") || sYear === "1")) ||
        (targetYear === "se" && (sYear.includes("se") || sYear.includes("second") || sYear === "2")) ||
        (targetYear === "te" && (sYear.includes("te") || sYear.includes("third") || sYear === "3")) ||
        (targetYear === "be" && (sYear.includes("be") || sYear.includes("fourth") || sYear.includes("final") || sYear === "4"));
    }
    if (!matchesYear) return false;

    // 4. Division filter (A, B, C, D)
    let matchesDiv = true;
    if (divFilter !== "all") {
      const sDiv = (s.division || s.div || s.section || "").toLowerCase().trim();
      const targetDiv = divFilter.toLowerCase().trim();
      matchesDiv = sDiv === targetDiv || sDiv.includes(targetDiv);
    }
    if (!matchesDiv) return false;

    // 5. Search Query
    if (!q) return true;
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.roll_number || s.rollNo || s.roll || "").toLowerCase().includes(q) ||
      deptStr.includes(q) ||
      assignedMentor.toLowerCase().includes(q) ||
      (s.year || "").toLowerCase().includes(q) ||
      (s.division || s.div || "").toLowerCase().includes(q)
    );
  });

  // Sort filtered students strictly in ascending order by their College ID / Roll Number
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const idA = (a.roll_number || a.rollNo || a.roll || a.id || "").toString().toLowerCase().trim();
    const idB = (b.roll_number || b.rollNo || b.roll || b.id || "").toString().toLowerCase().trim();
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
  });

  // Calculate Available vs Already Assigned Counts
  const availableCount = allStudents.filter((s) => {
    const m = s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)];
    return !m || !m.trim();
  }).length;
  const assignedCount = allStudents.length - availableCount;

  // Toggle selection for available students only
  const toggleStudentSelect = (student) => {
    const assigned = student.mentor_name || assignmentsMap[String(student.id)] || assignmentsMap[String(student.user_id)] || "";
    if (assigned && assigned.trim()) {
      setAlertMsg("This student is already assigned to " + assigned.trim() + ".");
      return;
    }
    setAlertMsg("");
    setSelectedStudentIds((prev) =>
      prev.includes(student.id) ? prev.filter((item) => item !== student.id) : [...prev, student.id]
    );
  };

  // Select all visible AVAILABLE students (never already assigned)
  const handleSelectAll = () => {
    const availableFilteredIds = sortedStudents
      .filter((s) => {
        const m = s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)];
        return !m || !m.trim();
      })
      .map((s) => s.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...availableFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  // Submit normal assignment
  const handleAssignMentorSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg("");

    if (!selectedMentor) {
      setAlertMsg("Please select a faculty mentor first.");
      return;
    }
    if (selectedStudentIds.length === 0) {
      setAlertMsg("Please select at least one available student.");
      return;
    }

    // Client-side guard against assigning already assigned students
    for (const sid of selectedStudentIds) {
      const st = allStudents.find((s) => s.id === sid);
      const existingMentor = st?.mentor_name || assignmentsMap[String(sid)] || assignmentsMap[String(st?.user_id)];
      if (existingMentor && existingMentor.trim() && existingMentor.trim().toLowerCase() !== selectedMentor.trim().toLowerCase()) {
        setAlertMsg("This student is already assigned to " + existingMentor.trim() + ".");
        return;
      }
    }

    const activeMentor = mentors.find((m) => m.name === selectedMentor);
    setIsSubmitting(true);

    try {
      const res = await apiFetch("/admin/assign-mentor", {
        method: "POST",
        body: JSON.stringify({
          mentorId: activeMentor?.id || null,
          mentorName: selectedMentor,
          mentorEmail: activeMentor?.email || null,
          studentIds: selectedStudentIds,
          isReassignment: false,
        }),
      });

      if (res && res.error) {
        setAlertMsg(res.message || res.error || "Failed to assign mentor. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Update local assignmentsMap
      const updatedMap = { ...assignmentsMap };
      selectedStudentIds.forEach((id) => {
        updatedMap[String(id)] = selectedMentor;
      });
      setAssignmentsMap(updatedMap);

      const count = selectedStudentIds.length;
      const menteeText = count === 1 ? "mentee" : "mentees";
      setSuccessMsg("Successfully assigned " + count + " " + menteeText + " to " + selectedMentor + ".");
      setSelectedStudentIds([]);
      onSuccess?.();

      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1800);
    } catch (err) {
      console.warn("[DB Save Mentor Assignment Error]", err);
      setAlertMsg(err.message || "Failed to save mentor assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Explicit Reassign Mentor action handler
  const handleConfirmReassign = async () => {
    if (!reassignStudent || !reassignNewMentor) {
      setReassignError("Please select a new mentor.");
      return;
    }

    const activeMentor = mentors.find((m) => m.name === reassignNewMentor);
    const prevMentor =
      reassignStudent.mentor_name ||
      assignmentsMap[String(reassignStudent.id)] ||
      assignmentsMap[String(reassignStudent.user_id)] ||
      "Previous Mentor";

    setIsReassigning(true);
    setReassignError("");

    try {
      const res = await apiFetch("/admin/assign-mentor", {
        method: "POST",
        body: JSON.stringify({
          mentorId: activeMentor?.id || null,
          mentorName: reassignNewMentor,
          mentorEmail: activeMentor?.email || null,
          studentIds: [reassignStudent.id],
          isReassignment: true,
        }),
      });

      if (res && res.error) {
        setReassignError(res.message || res.error || "Failed to reassign mentor.");
        setIsReassigning(false);
        return;
      }

      // Update local state and assignmentsMap
      setAssignmentsMap((prev) => ({
        ...prev,
        [String(reassignStudent.id)]: reassignNewMentor,
        ...(reassignStudent.user_id ? { [String(reassignStudent.user_id)]: reassignNewMentor } : {}),
      }));
      reassignStudent.mentor_name = reassignNewMentor;

      setSuccessMsg("Successfully reassigned " + reassignStudent.name + " from " + prevMentor + " to " + reassignNewMentor + ".");
      setReassignStudent(null);
      setReassignNewMentor("");
      onSuccess?.();

      setTimeout(() => {
        setSuccessMsg("");
      }, 3500);
    } catch (err) {
      console.warn("[Reassign Mentor Error]", err);
      setReassignError(err.message || "Failed to reassign mentor.");
    } finally {
      setIsReassigning(false);
    }
  };

  const selectedStudentsList = allStudents.filter((s) => selectedStudentIds.includes(s.id));

  return createPortal(
    <div className="fs-portal-overlay" onClick={onClose}>
      <div className="fs-portal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="fs-portal-header">
          <div className="fs-portal-header-left">
            <div className="fs-portal-header-icon mentor-theme">
              <UserCheck size={24} />
            </div>
            <div className="fs-portal-header-title-wrap">
              <h2 className="fs-portal-header-title">Assign Faculty Mentor to Students</h2>
              <p className="fs-portal-header-subtitle">
                Allocate students to faculty mentors with live assignment verification and re-assignment controls
              </p>
            </div>
          </div>

          <div className="fs-portal-header-right">
            <button className="fs-portal-close-btn" onClick={onClose} title="Close Portal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {alertMsg && (
          <div className="modal-feedback-alert modal-feedback--warning" style={{ margin: "14px 24px 0 24px" }}>
            <AlertCircle size={18} className="shrink-0" />
            <span style={{ fontWeight: 650 }}>{alertMsg}</span>
            <button
              type="button"
              onClick={() => setAlertMsg("")}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="modal-feedback-alert modal-feedback--success" style={{ margin: "14px 24px 0 24px" }}>
            <CheckCircle2 size={18} className="shrink-0" />
            <span style={{ fontWeight: 650 }}>{successMsg}</span>
          </div>
        )}

        {/* Modal Form Grid Body */}
        <form onSubmit={handleAssignMentorSubmit} className="fs-portal-body">
          {/* Left Column: Mentor Selection & Live Summary */}
          <div className="fs-portal-panel-sidebar">
            <h3 className="fs-portal-section-title">
              <UserCheck size={18} className="fs-portal-icon-blue" />
              1. Select Faculty Mentor
            </h3>

            <div className="form-group-admin fs-portal-field">
              <label className="fs-portal-label">Faculty Mentor / Leader</label>
              <AdminUserSelect
                value={selectedMentor}
                options={mentors.map((m) => {
                  const dept = (m.department || m.dept || "").trim();
                  return {
                    value: m.name,
                    label: dept ? (m.name + " (" + dept + ")") : m.name,
                  };
                })}
                onChange={(val) => {
                  setSelectedMentor(val);
                  setAlertMsg("");
                }}
                placeholder="-- Choose Faculty Mentor --"
                icon={UserCheck}
              />
            </div>

            {/* Selected Students Chips Banner or Empty Helper */}
            {selectedStudentsList.length > 0 ? (
              <div className="fs-portal-mentees-wrapper">
                <div className="fs-portal-mentees-header">
                  <label className="fs-portal-mentees-title">
                    Selected Available Mentees ({selectedStudentsList.length})
                  </label>
                  <button type="button" onClick={handleDeselectAll} className="fs-portal-btn-clear">
                    Clear All
                  </button>
                </div>

                <div className="fs-portal-chips-container">
                  {selectedStudentsList.map((s) => (
                    <span key={s.id} className="fs-portal-mentee-chip">
                      <span>{s.name}</span>
                      <X
                        size={13}
                        className="fs-portal-chip-remove"
                        onClick={() => toggleStudentSelect(s)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="fs-portal-no-mentees-placeholder">
                <Users size={30} className="fs-portal-no-mentees-icon" />
                <p className="fs-portal-no-mentees-text">No Mentees Selected</p>
                <span className="fs-portal-no-mentees-hint">
                  Select available students from the checklist to assign them to this mentor. Already assigned students can be reassigned individually.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn-portal-submit fs-portal-submit-mt"
              disabled={isSubmitting || selectedStudentIds.length === 0 || !selectedMentor}
            >
              <UserCheck size={18} />
              {isSubmitting ? "Assigning Mentees..." : "Confirm & Assign Mentor"}
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
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{allStudents.length}</strong> students ·{" "}
                  <span style={{ color: "#059669", fontWeight: 700 }}>{availableCount} Available</span> ·{" "}
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>{assignedCount} Already Assigned</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="fs-portal-btn-select-all"
                  title="Select all currently visible available students"
                >
                  Select Available ({sortedStudents.filter((s) => !(s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)])).length})
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

            {/* Search Input & Multi-tier Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="fs-portal-search-wrap">
                <Search size={18} className="fs-portal-search-icon" />
                <input
                  type="text"
                  className="fs-portal-search-input"
                  placeholder="Search student by roll no, name, dept, email, mentor name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
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

              {/* Dropdown Filters: Assignment Status, Department, Year, Division */}
              <div className="fs-portal-filter-bar">
                <div className="fs-portal-filter-item">
                  <AdminUserSelect
                    value={statusFilter}
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "available", label: "Available Only" },
                      { value: "assigned", label: "Already Assigned Only" },
                    ]}
                    onChange={(val) => setStatusFilter(val)}
                    placeholder="All Statuses"
                  />
                </div>

                <div className="fs-portal-filter-item">
                  <AdminUserSelect
                    value={deptFilter}
                    options={[
                      { value: "all", label: "All Departments" },
                      { value: "computer science", label: "Computer Science" },
                      { value: "information tech", label: "Information Tech" },
                      { value: "ai & data science", label: "AI & Data Science" },
                      { value: "electronics", label: "Electronics & CS" },
                    ]}
                    onChange={(val) => setDeptFilter(val)}
                    placeholder="All Departments"
                  />
                </div>

                <div className="fs-portal-filter-item">
                  <AdminUserSelect
                    value={yearFilter}
                    options={[
                      { value: "all", label: "All Years" },
                      { value: "FE", label: "FE (First Year)" },
                      { value: "SE", label: "SE (Second Year)" },
                      { value: "TE", label: "TE (Third Year)" },
                      { value: "BE", label: "BE (Fourth Year)" },
                    ]}
                    onChange={(val) => setYearFilter(val)}
                    placeholder="All Years"
                  />
                </div>

                <div className="fs-portal-filter-item">
                  <AdminUserSelect
                    value={divFilter}
                    options={[
                      { value: "all", label: "All Divisions" },
                      { value: "A", label: "Division A" },
                      { value: "B", label: "Division B" },
                      { value: "C", label: "Division C" },
                      { value: "D", label: "Division D" },
                    ]}
                    onChange={(val) => setDivFilter(val)}
                    placeholder="All Divisions"
                  />
                </div>

                {(statusFilter !== "all" || deptFilter !== "all" || yearFilter !== "all" || divFilter !== "all" || studentSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setDeptFilter("all");
                      setYearFilter("all");
                      setDivFilter("all");
                      setStudentSearch("");
                      setAlertMsg("");
                    }}
                    className="fs-portal-btn-reset-filters"
                    title="Reset all filters"
                  >
                    <RefreshCw size={13} /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Multi-Select Student Checklist Table */}
            <div className="fs-portal-table-container">
              {sortedStudents.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "14px",
                    border: "2px dashed #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <Search size={32} color="#94a3b8" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#334155" }}>
                      No student profiles match your search
                    </h4>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                      Try adjusting your filter or search query.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearch("");
                      setStatusFilter("all");
                      setDeptFilter("all");
                      setYearFilter("all");
                      setDivFilter("all");
                    }}
                    className="btn-portal-submit"
                    style={{ width: "auto", padding: "8px 18px", fontSize: "12.5px" }}
                  >
                    Reset Filters & Roster
                  </button>
                </div>
              ) : (
                <table className="fs-portal-table">
                  <thead>
                    <tr>
                      <th style={{ width: "44px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="fs-portal-checkbox"
                          checked={
                            sortedStudents.filter(
                              (s) => !(s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)])
                            ).length > 0 &&
                            sortedStudents
                              .filter(
                                (s) => !(s.mentor_name || assignmentsMap[String(s.id)] || assignmentsMap[String(s.user_id)])
                              )
                              .every((s) => selectedStudentIds.includes(s.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                          title="Select / Deselect Available Visible Students"
                        />
                      </th>
                      <th style={{ width: "140px" }}>College ID / Roll No</th>
                      <th>Student Details</th>
                      <th style={{ width: "130px" }}>Department</th>
                      <th style={{ width: "95px", textAlign: "center" }}>Year/Div</th>
                      <th style={{ width: "140px", textAlign: "center" }}>Mentor Status</th>
                      <th style={{ width: "120px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => {
                      const isChecked = selectedStudentIds.includes(student.id);
                      const roll = student.roll_number || student.rollNo || student.roll || ("ID-" + student.id);
                      const assignedMentor =
                        student.mentor_name ||
                        assignmentsMap[String(student.id)] ||
                        assignmentsMap[String(student.user_id)] ||
                        "";
                      const isAlreadyAssigned = Boolean(assignedMentor && assignedMentor.trim());

                      return (
                        <tr
                          key={student.id}
                          className={"fs-portal-row " + (isChecked ? "fs-portal-row--checked " : "") + (isAlreadyAssigned ? "fs-portal-row--assigned" : "")}
                          onClick={() => toggleStudentSelect(student)}
                          style={{ cursor: isAlreadyAssigned ? "default" : "pointer" }}
                        >
                          <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="fs-portal-checkbox"
                              disabled={isAlreadyAssigned}
                              checked={isChecked}
                              onChange={() => toggleStudentSelect(student)}
                              title={
                                isAlreadyAssigned
                                  ? ("This student is already assigned to " + assignedMentor + ".")
                                  : "Select student"
                              }
                            />
                          </td>
                          <td>
                            <span className="fs-portal-student-roll">{roll}</span>
                          </td>
                          <td>
                            <div className="fs-portal-student-cell">
                              <div
                                className="fs-portal-student-avatar-sm"
                                style={isAlreadyAssigned ? { background: "#4338ca", color: "#ffffff" } : {}}
                              >
                                {(student.name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div className="fs-portal-student-info">
                                <span className="fs-portal-student-name">{student.name}</span>
                                {student.email && (
                                  <span className="fs-portal-student-email">{student.email}</span>
                                )}
                                {isAlreadyAssigned && (
                                  <div className="fs-portal-assigned-mentor-tag">
                                    <UserCheck size={11} /> Assigned Mentor: <strong>{assignedMentor}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="fs-portal-dept-text">{student.department || student.dept || "—"}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                              {student.year ? (
                                <span className="fs-portal-year-badge">{student.year}</span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              )}
                              {(student.division || student.div) && (
                                <span
                                  className="fs-portal-div-badge"
                                  title={"Division " + (student.division || student.div)}
                                >
                                  {String(student.division || student.div).replace(/^div\s*/i, "").trim()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {isAlreadyAssigned ? (
                              <span
                                className="fs-portal-status-pill fs-portal-status-pill--assigned"
                                title={"Assigned to " + assignedMentor}
                              >
                                <ShieldAlert size={11} /> Already Assigned
                              </span>
                            ) : (
                              <span className="fs-portal-status-pill fs-portal-status-pill--available">
                                <CheckCircle2 size={11} /> Available
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            {isAlreadyAssigned ? (
                              <button
                                type="button"
                                className="btn-portal-reassign"
                                onClick={() => {
                                  setAlertMsg("");
                                  setReassignStudent(student);
                                  setReassignNewMentor("");
                                  setReassignError("");
                                }}
                                title={"Reassign " + student.name + " from " + assignedMentor + " to another mentor"}
                              >
                                <Repeat size={12} /> Reassign
                              </button>
                            ) : isChecked ? (
                              <span className="fs-portal-status-pill fs-portal-status-pill--selected">Selected</span>
                            ) : (
                              <span className="fs-portal-status-pill fs-portal-status-pill--idle">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </form>

        {/* ── Separate Reassign Mentor Confirmation Modal ── */}
        {reassignStudent && (
          <div className="reassign-modal-backdrop" onClick={() => setReassignStudent(null)}>
            <div className="reassign-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="reassign-modal-header">
                <div className="reassign-modal-title-box">
                  <Repeat size={20} className="reassign-modal-icon" />
                  <div>
                    <h3 className="reassign-modal-title">Reassign Faculty Mentor</h3>
                    <p className="reassign-modal-subtitle">Update mentee allocation to a new faculty mentor</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="fs-portal-close-btn"
                  onClick={() => setReassignStudent(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="reassign-modal-body">
                {reassignError && (
                  <div className="modal-feedback-alert modal-feedback--warning">
                    <AlertCircle size={16} />
                    <span>{reassignError}</span>
                  </div>
                )}

                <div className="reassign-student-profile-box">
                  <div className="reassign-student-avatar">
                    {(reassignStudent.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="reassign-student-name">{reassignStudent.name}</div>
                    <div className="reassign-student-meta">
                      ID: {reassignStudent.roll_number || reassignStudent.rollNo || ("ID-" + reassignStudent.id)} ·{" "}
                      {reassignStudent.department || "General"} · {reassignStudent.year || "FE"} ({reassignStudent.division || "A"})
                    </div>
                  </div>
                </div>

                <div className="reassign-mentor-compare-grid">
                  <div className="reassign-compare-col prev-mentor">
                    <span className="reassign-col-label">Current Assigned Mentor</span>
                    <div className="reassign-mentor-pill-prev">
                      <UserX size={14} />
                      <span>
                        {reassignStudent.mentor_name ||
                          assignmentsMap[String(reassignStudent.id)] ||
                          assignmentsMap[String(reassignStudent.user_id)] ||
                          "Assigned Mentor"}
                      </span>
                    </div>
                  </div>

                  <div className="reassign-compare-arrow">
                    <Repeat size={18} />
                  </div>

                  <div className="reassign-compare-col next-mentor">
                    <span className="reassign-col-label">Select New Mentor</span>
                    <AdminUserSelect
                      value={reassignNewMentor}
                      options={mentors
                        .filter(
                          (m) =>
                            m.name !==
                            (reassignStudent.mentor_name ||
                              assignmentsMap[String(reassignStudent.id)] ||
                              assignmentsMap[String(reassignStudent.user_id)])
                        )
                        .map((m) => {
                          const dept = (m.department || m.dept || "").trim();
                          return {
                            value: m.name,
                            label: dept ? (m.name + " (" + dept + ")") : m.name,
                          };
                        })}
                      onChange={(val) => {
                        setReassignNewMentor(val);
                        setReassignError("");
                      }}
                      placeholder="-- Choose New Mentor --"
                      icon={UserCheck}
                    />
                  </div>
                </div>

                <div className="reassign-note-box">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>
                    This explicit reassignment will update {reassignStudent.name}'s active record from{" "}
                    <strong>
                      {reassignStudent.mentor_name ||
                        assignmentsMap[String(reassignStudent.id)] ||
                        assignmentsMap[String(reassignStudent.user_id)]}
                    </strong>{" "}
                    to the newly selected mentor without creating duplicate assignments.
                  </span>
                </div>
              </div>

              <div className="reassign-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setReassignStudent(null)}
                  disabled={isReassigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-submit reassign-confirm-btn"
                  onClick={handleConfirmReassign}
                  disabled={isReassigning || !reassignNewMentor}
                >
                  {isReassigning ? "Updating Assignment..." : "Confirm Reassignment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Bulk Excel / CSV Upload Modal Component ── */
function BulkExcelUploadModal({ isOpen, onClose, onSuccess, departments = [] }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [collegeDepts, setCollegeDepts] = useState(departments || []);

  useEffect(() => {
    if (isOpen) {
      apiFetch("/departments")
        .then((res) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list) && list.length > 0) {
            setCollegeDepts(list);
          }
        })
        .catch((err) => console.warn("Failed to load departments for bulk validation:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (Array.isArray(departments) && departments.length > 0) {
      setCollegeDepts(departments);
    }
  }, [departments]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const sampleDept1 = collegeDepts[0]?.code || collegeDepts[0]?.name || "COMPS";
    const sampleDept2 = collegeDepts[1]?.code || collegeDepts[1]?.name || sampleDept1;

    const templateData = [
      {
        "Full Name": "Priya Sharma",
        "College Email": "priya.sharma@pvppcoe.ac.in",
        "Mobile Number": "9876543210",
        "Roll ID": "VU21CS042",
        "Department": sampleDept1,
        "Academic Year": "TE",
        "Division": "A",
      },
      {
        "Full Name": "Rahul Verma",
        "College Email": "rahul.verma@pvppcoe.ac.in",
        "Mobile Number": "9876543211",
        "Roll ID": "VU21IT088",
        "Department": sampleDept2,
        "Academic Year": "SE",
        "Division": "B",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Upload_Template");
    XLSX.writeFile(workbook, "Student_Creation_Bulk_Template.xlsx");
  };

  const handleDownloadRejected = () => {
    if (!uploadResult || !uploadResult.rejectedList || uploadResult.rejectedList.length === 0) return;

    const exportData = uploadResult.rejectedList.map((item, idx) => ({
      "#": idx + 1,
      "Student Name": item.name || item.student || "—",
      "College Email": item.email || "—",
      "Mobile Number": item.mobile_number || "—",
      "Roll ID": item.roll_number || "—",
      "Department": item.department || "—",
      "Status": "Rejected",
      "Rejection Reason": item.reason || "Rejected – Department not created for this college",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rejected_Students");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    XLSX.writeFile(workbook, `Rejected_Students_${timestamp}.xlsx`);
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadStatus(null);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const seenEmails = new Set();
        const seenRolls = new Set();

        const formatted = jsonRows.map((row, idx) => {
          const name = String(row["Full Name"] || row["name"] || row["Name"] || row["fullName"] || "").trim();
          const email = String(row["College Email"] || row["email"] || row["Email"] || row["collegeEmail"] || "").trim();
          const mobile = String(row["Mobile Number"] || row["mobile_number"] || row["phone"] || row["Mobile"] || "").trim();
          const rollNo = String(row["Roll ID"] || row["roll_number"] || row["rollNo"] || row["College ID"] || "").trim();
          const dept = String(row["Department"] || row["department"] || row["dept"] || "").trim();
          const year = String(row["Academic Year"] || row["year"] || row["Year"] || "FE").trim();
          const div = String(row["Division"] || row["division"] || row["div"] || "A").trim();

          let isValid = true;
          let issue = "";

          // Strict Department Validation (case-insensitive & trimmed)
          const deptClean = dept.toLowerCase();
          const matchedDept = collegeDepts.find((d) => {
            const codeMatch = d.code && String(d.code).trim().toLowerCase() === deptClean;
            const nameMatch = d.name && String(d.name).trim().toLowerCase() === deptClean;
            return codeMatch || nameMatch;
          });

          if (!name) {
            isValid = false;
            issue = "Missing Name";
          } else if (!email || !email.includes("@")) {
            isValid = false;
            issue = "Invalid Email";
          } else if (!dept) {
            isValid = false;
            issue = "Rejected – Department is required";
          } else if (!matchedDept) {
            isValid = false;
            issue = "Rejected – Department not created";
          } else if (seenEmails.has(email.toLowerCase())) {
            isValid = false;
            issue = "Rejected – Duplicate Email in sheet";
          } else if (rollNo && seenRolls.has(rollNo.toLowerCase())) {
            isValid = false;
            issue = "Rejected – Duplicate Roll ID in sheet";
          }

          if (email) seenEmails.add(email.toLowerCase());
          if (rollNo) seenRolls.add(rollNo.toLowerCase());

          return {
            id: idx + 1,
            name,
            email,
            mobile_number: mobile,
            roll_number: rollNo,
            department: dept || "—",
            resolvedDept: matchedDept?.name || dept,
            year,
            division: div,
            isValid,
            issue: issue || "Ready",
          };
        });

        setParsedRows(formatted);
      } catch (err) {
        console.error("Failed to parse Excel file:", err);
        setUploadStatus({ type: "error", message: "Failed to read Excel file format. Please use .xlsx, .xls or .csv." });
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
    if (parsedRows.length === 0) {
      setUploadStatus({ type: "error", message: "No student records found in the uploaded file." });
      return;
    }

    setIsProcessing(true);
    setUploadStatus(null);

    try {
      // Send rows to backend for authoritative database-level validation & insertion
      const res = await apiFetch("/admin/users/bulk-upload", {
        method: "POST",
        body: JSON.stringify({ students: parsedRows }),
      });

      if (res && (res.data || res.success)) {
        const info = res.data || res;
        setUploadResult(info);
        if (onSuccess) onSuccess();
      } else {
        setUploadStatus({ type: "error", message: res?.error || res?.message || "Bulk upload failed" });
      }
    } catch (err) {
      setUploadStatus({ type: "error", message: err.message || "Bulk upload encountered an error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetUpload = () => {
    setFile(null);
    setParsedRows([]);
    setUploadResult(null);
    setUploadStatus(null);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg bulk-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon-wrap bulk-header-icon-wrap">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {uploadResult ? "Bulk Upload Summary Report" : "Bulk Student Creation via Excel / CSV"}
              </h2>
              <p className="modal-subtitle">
                {uploadResult
                  ? "Verification and processing breakdown for uploaded student records."
                  : "Upload student roster spreadsheet. Students will only be added if their department exists for your college."}
              </p>
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

          {uploadResult ? (
            <div className="bulk-result-summary-wrap">
              {/* Summary KPI Cards */}
              <div className="bulk-summary-cards-grid">
                <div className="bulk-summary-card bulk-summary-card--total">
                  <div className="bulk-summary-num">{uploadResult.totalUploaded || parsedRows.length}</div>
                  <div className="bulk-summary-lbl">Total Uploaded</div>
                </div>
                <div className="bulk-summary-card bulk-summary-card--success">
                  <div className="bulk-summary-num">{uploadResult.createdCount || 0}</div>
                  <div className="bulk-summary-lbl">Successfully Added</div>
                </div>
                <div className="bulk-summary-card bulk-summary-card--rejected">
                  <div className="bulk-summary-num">{uploadResult.rejectedCount || 0}</div>
                  <div className="bulk-summary-lbl">Rejected Records</div>
                </div>
              </div>

              {/* Download Rejected Records Button if any rejected */}
              {(uploadResult.rejectedCount > 0 || (uploadResult.rejectedList && uploadResult.rejectedList.length > 0)) && (
                <div className="bulk-rejected-banner">
                  <div>
                    <span className="bulk-rejected-banner-title">⚠️ {uploadResult.rejectedCount} Student Record(s) Rejected</span>
                    <p className="bulk-rejected-banner-sub">
                      Students with departments not registered in your college or duplicate records were safely rejected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadRejected}
                    className="bulk-download-rejected-btn"
                  >
                    <Download size={14} /> Download Rejected Records (Excel)
                  </button>
                </div>
              )}

              {/* Result Table */}
              <div className="bulk-result-table-wrap">
                <div className="bulk-preview-header">
                  <span className="bulk-preview-title">Student Processing Breakdown</span>
                  <span className="bulk-preview-subtitle">
                    {uploadResult.createdCount} Added · {uploadResult.rejectedCount} Rejected
                  </span>
                </div>
                <div className="bulk-preview-table-container">
                  <table className="bulk-preview-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Details / Rejection Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(uploadResult.results || []).map((row, idx) => {
                        const isAdded = row.status === "Added";
                        return (
                          <tr key={idx} className={isAdded ? "bulk-row-valid" : "bulk-row-invalid"}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: "600" }}>{row.student || row.name || "—"}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{row.email || "—"}</div>
                            </td>
                            <td>
                              <span className="bulk-dept-pill">{row.department || "—"}</span>
                            </td>
                            <td>
                              {isAdded ? (
                                <span className="bulk-badge-ready">
                                  <CheckCircle2 size={12} /> Added
                                </span>
                              ) : (
                                <span className="bulk-badge-error">
                                  <XCircle size={12} /> Rejected
                                </span>
                              )}
                            </td>
                            <td style={{ color: isAdded ? "#059669" : "#dc2626", fontSize: "12px", fontWeight: isAdded ? "500" : "600" }}>
                              {row.reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bulk-template-card">
                <div>
                  <span className="bulk-template-title">📥 Don't have the format template?</span>
                  <p className="bulk-template-desc">Download the official Excel template with column headers and sample data matching your college departments.</p>
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
                      Spreadsheet Preview ({validCount} valid department rows, {invalidCount} invalid)
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
                          <th>Validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r) => (
                          <tr key={r.id} className={r.isValid ? "bulk-row-valid" : "bulk-row-invalid"}>
                            <td>{r.id}</td>
                            <td style={{ fontWeight: "600" }}>{r.name || "—"}</td>
                            <td style={{ color: "#3b82f6" }}>{r.email || "—"}</td>
                            <td>{r.roll_number || "—"}</td>
                            <td>
                              <span className="bulk-dept-pill">{r.department}</span>
                            </td>
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
            </>
          )}
        </div>

        <div className="modal-footer modal-footer-users">
          {uploadResult ? (
            <>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={handleResetUpload}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <UploadCloud size={14} /> Upload Another File
              </button>
              <button
                type="button"
                className="btn-modal-submit bulk-submit-btn"
                onClick={onClose}
              >
                <Check size={14} /> Done
              </button>
            </>
          ) : (
            <>
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
                disabled={isProcessing || parsedRows.length === 0}
              >
                {isProcessing ? "Validating & Creating Accounts..." : `Process ${parsedRows.length} Students`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") || "all");
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get("department") || searchParams.get("dept") || "");
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, trainers: 0, mentors: 0, coordinators: 0 });
  const [departments, setDepartments] = useState([]);

  // Sync state when URL search parameters change
  useEffect(() => {
    const d = searchParams.get("department") || searchParams.get("dept") || "";
    const r = searchParams.get("role") || "all";
    if (d !== departmentFilter) setDepartmentFilter(d);
    if (r !== roleFilter) setRoleFilter(r);
  }, [searchParams]);

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
    if (targetRole === 'trainer') roleParam = 'trainer';
    if (targetRole === 'college_admin') roleParam = 'college_admin';

    const prefix = roleParam === 'coordinator' ? 'CO' : (roleParam === 'college_admin' ? 'ADM' : (roleParam === 'trainer' ? 'TRN' : 'FAC'));
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
      if (departmentFilter.trim() && departmentFilter !== "all") {
        queryParams.append("department", departmentFilter.trim());
      }

      const res = await apiFetch(`/admin/users?${queryParams.toString()}`);
      if (res && res.data) {
        // Filter out admin accounts from College Admin user list
        let nonAdmins = (res.data || []).filter(u => {
          const r = String(u.role || '').toLowerCase();
          return !r.includes('admin');
        });

        // Strict department filter on client as well
        if (departmentFilter.trim() && departmentFilter !== "all") {
          const targetDept = departmentFilter.trim().toLowerCase();
          nonAdmins = nonAdmins.filter(u => {
            const ud = String(u.department || '').trim().toLowerCase();
            return ud === targetDept || ud.includes(targetDept) || targetDept.includes(ud);
          });
        }

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
        s.totalUsers = (s.students || 0) + (s.trainers || 0) + (s.mentors || 0) + (s.coordinators || 0);
        setStats(s);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search, departmentFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const departmentOptions = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => ({
        value: d.code || d.name,
        label: d.name && d.code && d.name !== d.code ? `${d.name} (${d.code})` : (d.code || d.name),
      }));
    }
    return [
      { value: "CE", label: "Computer Engineering (CE)" },
      { value: "IT", label: "Information Technology (IT)" },
      { value: "ECS", label: "Electronics & Computer Science (ECS)" },
      { value: "AIDS", label: "Artificial Intelligence & Data Science (AIDS)" },
      { value: "EXTC", label: "Electronics & Telecommunication (EXTC)" },
      { value: "MECH", label: "Mechanical Engineering (MECH)" },
      { value: "CIVIL", label: "Civil Engineering (CIVIL)" },
    ];
  }, [departments]);

  // Fetch departments for the dropdown
  useEffect(() => {
    apiFetch("/departments")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setDepartments(list);
          // Set the default department in the form
          setFormData(prev => ({
            ...prev,
            department: prev.department || list[0]?.code || list[0]?.name || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    const firstDept = departments[0]?.code || departments[0]?.name || "";
    setFormData({
      name: "",
      email: "",
      mobile_number: "",
      role: "student",
      roll_number: "",
      department: firstDept,
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

  const handleQuickApprove = async (user) => {
    if (!user || !user.id) return;
    // Optimistic instant state update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_approved: 1, is_active: 1 } : u))
    );
    try {
      const res = await apiFetch(`/admin/users/${user.id}/approve`, {
        method: "PATCH",
      });
      if (res && (res.data || res.success)) {
        fetchStats();
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to approve user:", err);
      fetchUsers();
    }
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
      let finalSem = formData.semester;
      if (formData.role === "student") {
        if (formData.year === "SE") finalSem = "3";
        else if (formData.year === "TE") finalSem = "5";
        else if (formData.year === "BE") finalSem = "7";
        else if (formData.year === "FE") finalSem = "1";
      }

      const selectedDeptObj = (departments || []).find(
        (d) => (d.code && d.code === formData.department) || (d.name && d.name === formData.department)
      );

      const payload = {
        ...formData,
        department_id: selectedDeptObj?.id || formData.department_id || null,
        semester: finalSem || "1",
        secure_code: generatedCode || formData.secure_code || "",
      };
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && (res.data || res.success)) {
        setIsAddModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res?.error || res?.message || "Failed to create user" });
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
      const selectedDeptObj = (departments || []).find(
        (d) => (d.code && d.code === formData.department) || (d.name && d.name === formData.department)
      );

      const updatePayload = {
        ...formData,
        department_id: selectedDeptObj?.id || formData.department_id || null,
      };

      const res = await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updatePayload),
      });

      if (res && (res.data || res.success)) {
        setIsEditModalOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: res?.error || res?.message || "Failed to update user" });
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
      const res = await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      if (res && res.error) {
        alert(res.error || res.message || "Failed to delete user");
      } else {
        setIsDeleteModalOpen(false);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert(err.message || "Failed to delete user");
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
    if (r.includes("trainer")) return "role-badge--trainer";
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
          <div className="admin-user-stat-icon stat-icon--cyan">
            <GraduationCap size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.trainers || 0}</span>
            <span className="admin-user-stat-lbl">Trainers</span>
          </div>
        </div>

        <div className="admin-user-stat-card">
          <div className="admin-user-stat-icon stat-icon--purple">
            <Briefcase size={22} />
          </div>
          <div className="admin-user-stat-info">
            <span className="admin-user-stat-num">{stats.mentors}</span>
            <span className="admin-user-stat-lbl">Mentors</span>
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
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
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
            className={`admin-filter-pill ${roleFilter === "trainer" ? "admin-filter-pill--active" : ""}`}
            onClick={() => setRoleFilter("trainer")}
          >
            Trainers ({stats.trainers || 0})
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

      {/* Active Department Filter Banner */}
      {departmentFilter && (
        <div className="admin-active-filter-strip">
          <div className="admin-active-filter-info">
            <Building2 size={16} className="admin-active-filter-icon" />
            <span>
              Showing students from department: <strong>{departmentFilter}</strong>
            </span>
          </div>
          <button
            type="button"
            className="admin-clear-filter-btn"
            onClick={() => {
              setDepartmentFilter("");
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete("department");
              nextParams.delete("dept");
              setSearchParams(nextParams);
            }}
            title="Clear department filter"
          >
            <X size={14} />
            <span>Clear Department Filter</span>
          </button>
        </div>
      )}

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
                          {u.mentor_name && (
                            <div className="fs-portal-assigned-mentor-tag" style={{ marginTop: "4px" }}>
                              <UserCheck size={11} /> Mentor: <strong>{u.mentor_name}</strong>
                            </div>
                          )}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                        {(() => {
                          const isApproved = u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1";
                          return (
                            <span className={`status-badge ${isApproved ? "status-badge--active" : "status-badge--inactive"}`}>
                              <span className="status-dot"></span>
                              {isApproved ? "Approved" : "Pending Approval"}
                            </span>
                          );
                        })()}
                        <span 
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10.5px",
                            fontWeight: 650,
                            padding: "2px 7px",
                            borderRadius: "10px",
                            background: u.is_verified ? "#ecfdf5" : "#fffbeb",
                            color: u.is_verified ? "#059669" : "#b45309",
                            border: `1px solid ${u.is_verified ? "#a7f3d0" : "#fde68a"}`
                          }}
                        >
                          {u.is_verified ? "✓ Verified" : "⚠ Unverified"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-btns-row action-btns-right">
                        {!(u.is_approved === 1 || u.is_approved === true || String(u.is_approved) === "1") && (
                          <button
                            className="btn-table-action btn-table-action--approve"
                            title="Approve User Registration"
                            onClick={() => handleQuickApprove(u)}
                          >
                            <Check size={14} />
                          </button>
                        )}
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
                        { value: "trainer", label: "Trainer" },
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
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input-admin"
                      placeholder="user@example.com"
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

                {/* Department / Branch Selection for Mentors & Non-Students */}
                {formData.role !== 'student' && (
                  <div className="form-group-admin" style={{ marginBottom: '14px' }}>
                    <label>
                      {formData.role === 'mentor' ? 'Mentor Department / Branch *' : 'Assigned Department / Branch *'}
                    </label>
                    <AdminUserSelect
                      value={formData.department}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      options={departmentOptions}
                      placeholder="Select Department / Branch"
                    />
                  </div>
                )}

                {formData.role !== 'student' && (
                  <div className="admin-user-token-section">
                    <div className="admin-user-token-header">
                      <div className="admin-user-token-label-wrap">
                        <div className="admin-user-token-icon">
                          <KeyRound size={17} />
                        </div>
                        <div>
                          <div className="admin-user-token-title">Role Access Token</div>
                          <div className="admin-user-token-sub">
                            Required for {formData.role === 'coordinator' ? 'Coordinator' : 'Mentor'} onboarding
                          </div>
                        </div>
                      </div>

                      {!generatedCode ? (
                        <button
                          type="button"
                          className="admin-user-token-gen-btn"
                          disabled={isGeneratingCode}
                          onClick={() => handleGenerateSecureCode(formData.role)}
                        >
                          <Sparkles size={15} />
                          <span>{isGeneratingCode ? "Generating..." : "Generate Token"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-user-token-regen-btn"
                          disabled={isGeneratingCode}
                          onClick={() => handleGenerateSecureCode(formData.role)}
                          title="Generate a new token"
                        >
                          <RefreshCw size={13} className={isGeneratingCode ? "spin" : ""} />
                          <span>{isGeneratingCode ? "Regenerating..." : "Regenerate"}</span>
                        </button>
                      )}
                    </div>

                    {generatedCode ? (
                      <div className="manageusers-token-hero" style={{ marginTop: '12px' }}>
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
                    ) : (
                      <div className="admin-user-token-empty-card">
                        <span>Click <strong>Generate Token</strong> above to issue a single-use onboarding key.</span>
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
                        <label>Department *</label>
                        <AdminUserSelect
                          value={formData.department}
                          onChange={(val) => setFormData({ ...formData, department: val })}
                          options={departmentOptions}
                          placeholder="Select Department"
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Academic Year</label>
                        <AdminUserSelect
                          value={formData.year}
                          onChange={(val) => {
                            let autoSem = "1";
                            if (val === "SE") autoSem = "3";
                            else if (val === "TE") autoSem = "5";
                            else if (val === "BE") autoSem = "7";
                            setFormData((prev) => ({
                              ...prev,
                              year: val,
                              semester: autoSem,
                            }));
                          }}
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
                            { value: "A", label: "A" },
                            { value: "B", label: "B" },
                            { value: "C", label: "C" }
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer modal-footer-users">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
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
                        { value: "trainer", label: "Trainer" },
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

                {(formData.role !== "student" && formData.role !== "Student") && (
                  <div className="form-group-admin" style={{ marginTop: '14px', marginBottom: '8px' }}>
                    <label>
                      {formData.role === "mentor" ? "Mentor Department / Branch" : "Assigned Department / Branch"}
                    </label>
                    <AdminUserSelect
                      value={formData.department}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      options={departmentOptions}
                      placeholder="Select Department / Branch"
                    />
                  </div>
                )}

                {(formData.role === "student" || formData.role === "Student") && (
                  <>
                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Roll Number / ID</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. VU3F2425070"
                          value={formData.roll_number}
                          onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Department</label>
                        <AdminUserSelect
                          value={formData.department}
                          onChange={(val) => setFormData({ ...formData, department: val })}
                          options={departmentOptions}
                          placeholder="Select Department"
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
                          placeholder="Select year..."
                        />
                      </div>
                      <div className="form-group-admin">
                        <label>Division (Div)</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. A, B, C"
                          value={formData.division}
                          onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-admin">
                        <label>Semester</label>
                        <input
                          type="text"
                          className="form-input-admin"
                          placeholder="e.g. Semester 5"
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer modal-footer-users">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
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
            <div className="modal-footer modal-footer-users">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
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
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
        users={users}
      />

      {/* Bulk Excel Upload Modal */}
      <BulkExcelUploadModal
        isOpen={isBulkExcelOpen}
        departments={departments}
        onClose={() => setIsBulkExcelOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
}
