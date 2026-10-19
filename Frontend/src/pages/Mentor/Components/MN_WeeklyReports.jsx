import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../../../utils/api';
import { FileCheck2, Plus, Download, RefreshCw, X, FileText, CheckCircle2, Maximize2, Minimize2, AlertCircle, Calendar, Sparkles, Send, ShieldAlert, Award, Layers, BookOpen, Users, UserCheck } from "lucide-react";
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/MN_WeeklyReports.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getReports = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
};

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Mentors and Batches for Form Selectors
  const [mentorsList, setMentorsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    mentorName: "",
    batchName: "Computer Engineering - Batch A",
    weekTitle: "",
    topicsCovered: "",
    attendanceNotes: "",
    defaulterNotes: "",
    keyAchievements: "",
    nextWeekPlan: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrorBanner, setFormErrorBanner] = useState("");

  const getReportMentor = (r) => {
    if (!r) return "Assigned Mentor";
    if (r.mentorName) return r.mentorName;
    if (r.mentor) return r.mentor;
    if (Array.isArray(r.suggestions)) {
      const match = r.suggestions.find((s) => typeof s === "string" && s.startsWith("Audited By Mentor:"));
      if (match) return match.replace("Audited By Mentor:", "").trim();
    }
    return "Assigned Mentor";
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/mentor/weekly-reports");
      const list = getReports(res);
      setReports(list);
    } catch (e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load mentors and batches for form dropdowns
  useEffect(() => {
    let mounted = true;
    const fetchMentorsAndBatches = async () => {
      try {
        const [mentorsRes, batchesRes] = await Promise.allSettled([
          apiFetch("/mentor/mentors-list"),
          apiFetch("/mentor/batches"),
        ]);

        let mList = [];
        if (mentorsRes.status === "fulfilled" && mentorsRes.value) {
          const unwrapped = unwrap(mentorsRes.value);
          if (Array.isArray(unwrapped?.mentors)) mList = unwrapped.mentors;
          else if (Array.isArray(unwrapped)) mList = unwrapped;
        }

        let bList = [];
        if (batchesRes.status === "fulfilled" && batchesRes.value) {
          const unwrappedB = unwrap(batchesRes.value);
          if (Array.isArray(unwrappedB?.batches)) bList = unwrappedB.batches;
          else if (Array.isArray(unwrappedB)) bList = unwrappedB;
        }

        if (mounted) {
          setBatchesList(bList);

          // Get logged in user if available
          let localUser = {};
          try {
            localUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
          } catch (e) {
            localUser = {};
          }

          const nameSet = new Set();
          const names = [];

          if (localUser?.name) {
            nameSet.add(localUser.name);
            names.push({ value: localUser.name, label: `${localUser.name} (You)` });
          }

          mList.forEach((m) => {
            const mName = m.name || m;
            if (mName && !nameSet.has(mName)) {
              nameSet.add(mName);
              names.push({ value: mName, label: mName });
            }
          });

          bList.forEach((b) => {
            if (b.mentor && !nameSet.has(b.mentor)) {
              nameSet.add(b.mentor);
              names.push({ value: b.mentor, label: b.mentor });
            }
          });

          // Fallback known mentors from college
          const defaultMentors = ["Dr. Rajesh Sharma", "Prof. Ananya Verma", "Dr. Vikramaditya Joshi", "Mentoe"];
          defaultMentors.forEach((dm) => {
            if (!nameSet.has(dm)) {
              nameSet.add(dm);
              names.push({ value: dm, label: dm });
            }
          });

          setMentorsList(names);

          // Set default mentor name in form if not set
          setFormData((prev) => {
            if (prev.mentorName) return prev;
            const initial = localUser?.name || (names.length > 0 ? names[0].value : "");
            const initialBatch = bList.length > 0 ? (bList[0].name || bList[0].batchName || prev.batchName) : prev.batchName;
            return {
              ...prev,
              mentorName: initial,
              batchName: initialBatch,
            };
          });
        }
      } catch (err) {
        console.error("Error loading mentors/batches:", err);
      }
    };

    fetchMentorsAndBatches();
    loadReports();
    return () => {
      mounted = false;
    };
  }, [loadReports]);

  const validateForm = () => {
    const errors = {};
    if (!formData.mentorName || !formData.mentorName.trim()) {
      errors.mentorName = "Mentor Name selection is required.";
    }
    if (!formData.batchName || !formData.batchName.trim()) {
      errors.batchName = "Target Batch is required.";
    }
    if (!formData.weekTitle || formData.weekTitle.trim().length < 5) {
      errors.weekTitle = "Week Title / Number is required (minimum 5 characters, e.g. Week 4 - Systems & DSA Audit).";
    }
    if (!formData.topicsCovered || formData.topicsCovered.trim().length < 10) {
      errors.topicsCovered = "Topics & Syllabus Covered is required (minimum 10 characters detailing what was taught).";
    }
    if (!formData.attendanceNotes || formData.attendanceNotes.trim().length < 10) {
      errors.attendanceNotes = "Attendance Summary is required (minimum 10 characters describing class attendance & participation).";
    }
    if (!formData.defaulterNotes || formData.defaulterNotes.trim().length < 10) {
      errors.defaulterNotes = "Defaulter Notes are required (minimum 10 characters detailing low performance or student alerts).";
    }
    if (!formData.keyAchievements || formData.keyAchievements.trim().length < 5) {
      errors.keyAchievements = "Key Milestone Achieved is required (minimum 5 characters).";
    }
    if (!formData.nextWeekPlan || formData.nextWeekPlan.trim().length < 5) {
      errors.nextWeekPlan = "Next Week Plan / Goals are required (minimum 5 characters).";
    }
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrorBanner("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormErrorBanner("All fields are strictly required. Please select a mentor and fill in genuine details for every box.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const res = await apiFetch("/mentor/weekly-reports", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res && res.error) {
        setFormErrorBanner(res.message || "Failed to submit weekly report. Please verify all required fields.");
        return;
      }

      setShowFormModal(false);
      setFormData((prev) => ({
        mentorName: prev.mentorName,
        batchName: batchesList.length > 0 ? (batchesList[0].name || batchesList[0].batchName || "") : "Computer Engineering - Batch A",
        weekTitle: "",
        topicsCovered: "",
        attendanceNotes: "",
        defaulterNotes: "",
        keyAchievements: "",
        nextWeekPlan: "",
      }));
      loadReports();
    } catch (err) {
      console.error(err);
      setFormErrorBanner(err.message || "Failed to submit weekly report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mentor-weeklyreports-container stack-6">
      <div className="mentor-page-header-wr">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit, track, and manage weekly mentor audit forms in database</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="mentor-btn-primary" onClick={() => setShowFormModal(true)}>
            <Plus size={16} />
            <span>Fill Weekly Report Form</span>
          </button>
          <button type="button" className="mentor-btn-secondary" onClick={loadReports} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading weekly reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <FileCheck2 size={36} color="#94a3b8" />
              <h4 style={{ margin: 0, color: "#1e293b", fontSize: "15px", fontWeight: 700 }}>No Weekly Reports Submitted Yet</h4>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Click "Fill Weekly Report Form" above to submit your batch governance report.
              </p>
            </div>
          ) : (
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Faculty Mentor</th>
                  <th>Covered Batch</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td className="mentor-report-title">{r.title || r.week_label || `Weekly Performance Audit #${r.id}`}</td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{getReportMentor(r)}</td>
                    <td className="mentor-report-batch">{r.batch || r.batch_name || "All Batches"}</td>
                    <td className="mentor-report-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : r.submittedAt || "Recent"}</td>
                    <td>
                      <span className="mentor-report-status">
                        {r.trend_status || r.status || "Submitted"}
                      </span>
                    </td>
                    <td className="mentor-actions-cell">
                      <button className="mentor-btn-download" onClick={() => setSelectedReport(r)}>
                        <FileText size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Fill Weekly Report Form ── */}
      {showFormModal && createPortal(
        <div className="mentor-report-modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div
            className={`mentor-report-modal-box ${isFullScreen ? "mentor-report-modal-box--fullscreen" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mentor-report-modal-header">
              <div className="mentor-report-modal-title-wrap">
                <div className="mentor-report-modal-icon-badge">
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <h3 className="mentor-report-modal-title">Submit Weekly Mentor Audit Form</h3>
                  <p className="mentor-report-modal-subtitle">
                    Record curriculum milestones, attendance metrics, flagged defaulters, and upcoming sprint goals.
                  </p>
                </div>
              </div>

              <div className="mentor-report-modal-actions">
                <button
                  type="button"
                  className="mentor-report-fullscreen-btn"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? "Restore Window Size" : "Expand to Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowFormModal(false)}
                  title="Close Form"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div className="mentor-report-modal-body">
                {formErrorBanner && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#9f1239",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <AlertCircle size={18} />
                    <span>{formErrorBanner}</span>
                  </div>
                )}

                {/* 2-Column Grid Row 1 */}
                <div className="mentor-report-grid-2col">
                  {/* Card 1: Batch & Scope Identification */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Layers size={18} color="#4f46e5" />
                      <h4>Batch &amp; Weekly Scope</h4>
                      <span className="section-tag">Required</span>
                    </div>

                    {/* Faculty Mentor Name Selection */}
                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <UserCheck size={15} color="#4f46e5" />
                          <span>Mentor Name <span style={{ color: "#ef4444" }}>*</span></span>
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                          Select in-charge mentor
                        </span>
                      </label>
                      <CustomSelect
                        value={formData.mentorName}
                        options={mentorsList}
                        onChange={(val) => {
                          setFormData({ ...formData, mentorName: val });
                          if (fieldErrors.mentorName) setFieldErrors({ ...fieldErrors, mentorName: null });
                        }}
                        placeholder="-- Select Mentor Name --"
                        icon={UserCheck}
                      />
                      {mentorsList.length > 0 && (
                        <div className="mentor-report-pills-row">
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Quick Pick:</span>
                          {mentorsList.slice(0, 4).map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              className={`mentor-report-quick-pill ${formData.mentorName === m.value ? "active" : ""}`}
                              onClick={() => {
                                setFormData({ ...formData, mentorName: m.value });
                                if (fieldErrors.mentorName) setFieldErrors({ ...fieldErrors, mentorName: null });
                              }}
                            >
                              {m.value}
                            </button>
                          ))}
                        </div>
                      )}
                      {fieldErrors.mentorName && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.mentorName}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Target Batch <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      {batchesList.length > 0 ? (
                        <CustomSelect
                          value={formData.batchName}
                          options={batchesList.map((b) => ({
                            value: b.name || b.batchName || `Batch ${b.id}`,
                            label: b.name || b.batchName || `Batch ${b.id}`
                          }))}
                          onChange={(val) => {
                            setFormData({ ...formData, batchName: val });
                            if (fieldErrors.batchName) setFieldErrors({ ...fieldErrors, batchName: null });
                          }}
                          placeholder="-- Select Target Batch --"
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          className="mentor-report-input"
                          placeholder="e.g. Computer Engineering - Batch A"
                          style={{
                            borderColor: fieldErrors.batchName ? "#ef4444" : undefined
                          }}
                          value={formData.batchName}
                          onChange={(e) => {
                            setFormData({ ...formData, batchName: e.target.value });
                            if (fieldErrors.batchName) setFieldErrors({ ...fieldErrors, batchName: null });
                          }}
                        />
                      )}
                      {fieldErrors.batchName && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.batchName}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Week Title / Number <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Week 4 - DSA &amp; Arrays Audit"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.weekTitle ? "#ef4444" : undefined
                        }}
                        value={formData.weekTitle}
                        onChange={(e) => {
                          setFormData({ ...formData, weekTitle: e.target.value });
                          if (fieldErrors.weekTitle) setFieldErrors({ ...fieldErrors, weekTitle: null });
                        }}
                      />
                      <div className="mentor-report-pills-row">
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Quick Fill:</span>
                        {["Week 1 - Kickoff", "Week 2 - Foundations", "Week 3 - Core Concepts", "Week 4 - Advanced Algorithms", "Mid-Term Audit", "Final Sprint Review"].map((pill) => (
                          <button
                            key={pill}
                            type="button"
                            className={`mentor-report-quick-pill ${formData.weekTitle === pill ? "active" : ""}`}
                            onClick={() => {
                              setFormData({ ...formData, weekTitle: pill });
                              if (fieldErrors.weekTitle) setFieldErrors({ ...fieldErrors, weekTitle: null });
                            }}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.weekTitle && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.weekTitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Milestones & Future Plan */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Award size={18} color="#059669" />
                      <h4>Sprint Milestones &amp; Next Goals</h4>
                      <span className="section-tag" style={{ background: "#ecfdf5", color: "#059669" }}>Milestones</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Key Milestone Achieved <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Completed Array, Two-Pointer &amp; Binary Search Modules"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.keyAchievements ? "#ef4444" : undefined
                        }}
                        value={formData.keyAchievements}
                        onChange={(e) => {
                          setFormData({ ...formData, keyAchievements: e.target.value });
                          if (fieldErrors.keyAchievements) setFieldErrors({ ...fieldErrors, keyAchievements: null });
                        }}
                      />
                      {fieldErrors.keyAchievements && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.keyAchievements}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Next Week Plan / Goals <span style={{ color: "#ef4444" }}>*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Trees, Graphs &amp; Dynamic Programming Sprint"
                        className="mentor-report-input"
                        style={{
                          borderColor: fieldErrors.nextWeekPlan ? "#ef4444" : undefined
                        }}
                        value={formData.nextWeekPlan}
                        onChange={(e) => {
                          setFormData({ ...formData, nextWeekPlan: e.target.value });
                          if (fieldErrors.nextWeekPlan) setFieldErrors({ ...fieldErrors, nextWeekPlan: null });
                        }}
                      />
                      {fieldErrors.nextWeekPlan && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.nextWeekPlan}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 2 */}
                <div className="mentor-report-grid-2col">
                  {/* Card 3: Curriculum Coverage */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <BookOpen size={18} color="#2563eb" />
                      <h4>Topics &amp; Syllabus Covered</h4>
                      <span className="section-tag">Curriculum</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Detailed Topics &amp; Practical Exercises <span style={{ color: "#ef4444" }}>*</span></span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.topicsCovered.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={6}
                        required
                        minLength={10}
                        placeholder="e.g. Binary Search implementation, Two-Pointers pattern on sorted arrays, HashMap frequency counter optimization, and live LeetCode problem solving..."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.topicsCovered ? "#ef4444" : undefined
                        }}
                        value={formData.topicsCovered}
                        onChange={(e) => {
                          setFormData({ ...formData, topicsCovered: e.target.value });
                          if (fieldErrors.topicsCovered) setFieldErrors({ ...fieldErrors, topicsCovered: null });
                        }}
                      />
                      {fieldErrors.topicsCovered && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.topicsCovered}</span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Attendance & Defaulters Governance */}
                  <div className="mentor-report-section-card">
                    <div className="mentor-report-section-header">
                      <Users size={18} color="#d97706" />
                      <h4>Student Attendance &amp; Performance Governance</h4>
                      <span className="section-tag" style={{ background: "#fef3c7", color: "#d97706" }}>Audit</span>
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span>Attendance &amp; Student Engagement Summary <span style={{ color: "#ef4444" }}>*</span></span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.attendanceNotes.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={10}
                        placeholder="e.g. 92% average attendance across 4 sessions. Active participation during live coding exercises with 48/52 active submissions."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.attendanceNotes ? "#ef4444" : undefined
                        }}
                        value={formData.attendanceNotes}
                        onChange={(e) => {
                          setFormData({ ...formData, attendanceNotes: e.target.value });
                          if (fieldErrors.attendanceNotes) setFieldErrors({ ...fieldErrors, attendanceNotes: null });
                        }}
                      />
                      {fieldErrors.attendanceNotes && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.attendanceNotes}</span>
                      )}
                    </div>

                    <div className="mentor-report-field-group">
                      <label className="mentor-report-label">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShieldAlert size={14} color="#dc2626" />
                          <span>Defaulter / Low Performance Notes <span style={{ color: "#ef4444" }}>*</span></span>
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                          {formData.defaulterNotes.length}/10 min chars
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={10}
                        placeholder="e.g. 3 students flagged for consecutive missed submissions. Remedial 1-on-1 counseling scheduled for Thursday."
                        className="mentor-report-textarea"
                        style={{
                          borderColor: fieldErrors.defaulterNotes ? "#ef4444" : undefined,
                          backgroundColor: "#fffbfb"
                        }}
                        value={formData.defaulterNotes}
                        onChange={(e) => {
                          setFormData({ ...formData, defaulterNotes: e.target.value });
                          if (fieldErrors.defaulterNotes) setFieldErrors({ ...fieldErrors, defaulterNotes: null });
                        }}
                      />
                      {fieldErrors.defaulterNotes && (
                        <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>{fieldErrors.defaulterNotes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mentor-report-modal-footer">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#64748b" }}>
                  <Sparkles size={16} color="#4f46e5" />
                  <span>All fields marked with <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> are verified and archived for college compliance audits.</span>
                </div>

                <div className="mentor-report-footer-actions">
                  <button type="button" className="mentor-btn-cancel" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="mentor-btn-submit-audit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Submitting Audit...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Weekly Audit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal: View Report Details ── */}
      {selectedReport && createPortal(
        <div className="mentor-report-modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div
            className="mentor-report-modal-box"
            style={{ maxWidth: "680px", maxHeight: "85vh", height: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mentor-report-modal-header">
              <div className="mentor-report-modal-title-wrap">
                <div className="mentor-report-modal-icon-badge" style={{ background: "#ecfdf5", color: "#059669" }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="mentor-report-modal-title">
                    {selectedReport.title || selectedReport.weekLabel || "Weekly Mentor Audit"}
                  </h3>
                  <p className="mentor-report-modal-subtitle">
                    Archived weekly governance and progress record
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedReport(null)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mentor-report-modal-body" style={{ background: "#ffffff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Faculty Mentor</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {getReportMentor(selectedReport)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Target Batch</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {selectedReport.batch || selectedReport.batch_name || "All Batches"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Submitted Date</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString() : selectedReport.submittedAt || "Recent"}
                  </div>
                </div>
              </div>

              {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                    Audit Observations &amp; Recorded Notes:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155", fontSize: "13.5px" }}>
                    {selectedReport.suggestions.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mentor-report-modal-footer">
              <span style={{ fontSize: "12px", color: "#64748b" }}>Audited by Trainer / Mentor</span>
              <button className="mentor-btn-cancel" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
