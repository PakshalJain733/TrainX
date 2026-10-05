import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import { FileCheck2, Plus, Download, RefreshCw, X, FileText, CheckCircle2 } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const validateForm = () => {
    const errors = {};
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
      setFormErrorBanner("All fields are strictly required. Please fill in genuine details for every box before submitting.");
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
      setFormData({
        batchName: "Computer Engineering - Batch A",
        weekTitle: "",
        topicsCovered: "",
        attendanceNotes: "",
        defaulterNotes: "",
        keyAchievements: "",
        nextWeekPlan: "",
      });
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
      {showFormModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "640px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", pb: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileCheck2 size={20} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>Submit Weekly Mentor Audit Form</h3>
              </div>
              <button style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {formErrorBanner && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#9f1239",
                  fontSize: "13px",
                  fontWeight: 600
                }}>
                  ⚠️ {formErrorBanner}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Target Batch <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "8px",
                      border: fieldErrors.batchName ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                      fontSize: "14px"
                    }}
                    value={formData.batchName}
                    onChange={(e) => {
                      setFormData({ ...formData, batchName: e.target.value });
                      if (fieldErrors.batchName) setFieldErrors({ ...fieldErrors, batchName: null });
                    }}
                  />
                  {fieldErrors.batchName && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.batchName}</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Week Title / Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    placeholder="e.g. Week 4 - DSA & Arrays Audit"
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "8px",
                      border: fieldErrors.weekTitle ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                      fontSize: "14px"
                    }}
                    value={formData.weekTitle}
                    onChange={(e) => {
                      setFormData({ ...formData, weekTitle: e.target.value });
                      if (fieldErrors.weekTitle) setFieldErrors({ ...fieldErrors, weekTitle: null });
                    }}
                  />
                  {fieldErrors.weekTitle && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.weekTitle}</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Topics & Syllabus Covered <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  minLength={10}
                  placeholder="e.g. Binary Search, Two Pointers, HashMap Optimization (min 10 chars)"
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: fieldErrors.topicsCovered ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                    fontSize: "14px", fontFamily: "inherit"
                  }}
                  value={formData.topicsCovered}
                  onChange={(e) => {
                    setFormData({ ...formData, topicsCovered: e.target.value });
                    if (fieldErrors.topicsCovered) setFieldErrors({ ...fieldErrors, topicsCovered: null });
                  }}
                />
                {fieldErrors.topicsCovered && (
                  <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.topicsCovered}</span>
                )}
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Attendance & Student Engagement Summary <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  minLength={10}
                  placeholder="e.g. 92% average attendance across 4 sessions. Active participation in live coding (min 10 chars)."
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: fieldErrors.attendanceNotes ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                    fontSize: "14px", fontFamily: "inherit"
                  }}
                  value={formData.attendanceNotes}
                  onChange={(e) => {
                    setFormData({ ...formData, attendanceNotes: e.target.value });
                    if (fieldErrors.attendanceNotes) setFieldErrors({ ...fieldErrors, attendanceNotes: null });
                  }}
                />
                {fieldErrors.attendanceNotes && (
                  <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.attendanceNotes}</span>
                )}
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Defaulter / Low Performance Notes <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  minLength={10}
                  placeholder="e.g. 3 students flagged for missing coding submissions (reminders issued) (min 10 chars)."
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: fieldErrors.defaulterNotes ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                    fontSize: "14px", fontFamily: "inherit"
                  }}
                  value={formData.defaulterNotes}
                  onChange={(e) => {
                    setFormData({ ...formData, defaulterNotes: e.target.value });
                    if (fieldErrors.defaulterNotes) setFieldErrors({ ...fieldErrors, defaulterNotes: null });
                  }}
                />
                {fieldErrors.defaulterNotes && (
                  <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.defaulterNotes}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Key Milestone Achieved <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    placeholder="e.g. Completed Array module"
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "8px",
                      border: fieldErrors.keyAchievements ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                      fontSize: "14px"
                    }}
                    value={formData.keyAchievements}
                    onChange={(e) => {
                      setFormData({ ...formData, keyAchievements: e.target.value });
                      if (fieldErrors.keyAchievements) setFieldErrors({ ...fieldErrors, keyAchievements: null });
                    }}
                  />
                  {fieldErrors.keyAchievements && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.keyAchievements}</span>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Next Week Plan / Goals <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    placeholder="e.g. Trees & Linked Lists"
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "8px",
                      border: fieldErrors.nextWeekPlan ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                      fontSize: "14px"
                    }}
                    value={formData.nextWeekPlan}
                    onChange={(e) => {
                      setFormData({ ...formData, nextWeekPlan: e.target.value });
                      if (fieldErrors.nextWeekPlan) setFieldErrors({ ...fieldErrors, nextWeekPlan: null });
                    }}
                  />
                  {fieldErrors.nextWeekPlan && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px", display: "block" }}>{fieldErrors.nextWeekPlan}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="mentor-btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mentor-btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Form"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Report Details ── */}
      {selectedReport && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "540px",
            maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", pb: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {selectedReport.title || selectedReport.weekLabel || "Weekly Mentor Audit"}
                </h3>
              </div>
              <button style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }} onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div><strong>Batch:</strong> {selectedReport.batch || selectedReport.batch_name || "All Batches"}</div>
              <div><strong>Date:</strong> {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString() : selectedReport.submittedAt || "Recent"}</div>
              {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                <div>
                  <strong>Report Details & Notes:</strong>
                  <ul style={{ marginTop: "6px", paddingLeft: "20px", color: "#334155" }}>
                    {selectedReport.suggestions.map((note, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="mentor-btn-secondary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
