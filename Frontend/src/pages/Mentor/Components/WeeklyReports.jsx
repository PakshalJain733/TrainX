import { useState, useEffect, useCallback } from 'react';
import { FileCheck2, Plus, X, RefreshCw, CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';
import '../Styles/WeeklyReports.css';

const formatPct = (value) => {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)}%`;
  return '—';
};

const statusClass = (status) => {
  const s = (status || "submitted").toLowerCase();
  if (s === "draft") return "mentor-report-status--draft";
  if (s === "reviewed") return "mentor-report-status--reviewed";
  return "mentor-report-status--submitted";
};

export default function WeeklyReports() {
  const [reports, setReports] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    batch_id: "",
    week_number: 1,
    year: new Date().getFullYear(),
    summary: "",
    topics_covered: "",
    challenges_faced: "",
    recommendations: "",
  });

  const loadData = useCallback((showSpinner = true) => {
    if (showSpinner) setLoading(true);
    Promise.all([
      apiFetch("/mentor/weekly-reports"),
      apiFetch("/mentor/batches"),
    ])
      .then(([repRes, batchRes]) => {
        const repData = (repRes && repRes.data && Array.isArray(repRes.data.reports)) ? repRes.data.reports : [];
        const batchData = (batchRes && batchRes.data && Array.isArray(batchRes.data.batches)) ? batchRes.data.batches : [];
        setReports(repData);
        setBatches(batchData);
        if (batchData.length > 0) {
          setForm((p) => (p.batch_id ? p : { ...p, batch_id: String(batchData[0].id) }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch("/mentor/weekly-reports")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.reports)) {
          setReports(res.data.reports);
        }
      })
      .catch(() => {});
    apiFetch("/mentor/batches")
      .then((res) => {
        const batchData = (res && res.data && Array.isArray(res.data.batches)) ? res.data.batches : [];
        setBatches(batchData);
        if (batchData.length > 0) {
          setForm((p) => (p.batch_id ? p : { ...p, batch_id: String(batchData[0].id) }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    setErrorMsg("");

    const payload = {
      title: form.title.trim(),
      batch_id: form.batch_id ? parseInt(form.batch_id, 10) : null,
      week_number: parseInt(form.week_number, 10) || 1,
      year: parseInt(form.year, 10) || new Date().getFullYear(),
      summary: form.summary.trim(),
      topics_covered: form.topics_covered.trim(),
      challenges_faced: form.challenges_faced.trim(),
      recommendations: form.recommendations.trim(),
    };

    apiFetch("/mentor/weekly-reports", { method: "POST", body: JSON.stringify(payload) })
      .then((res) => {
        if (res && res.success) {
          setShowModal(false);
          setSuccessMsg("Weekly report submitted successfully!");
          setTimeout(() => setSuccessMsg(""), 4000);
          setForm((p) => ({
            ...p,
            title: "",
            week_number: 1,
            summary: "",
            topics_covered: "",
            challenges_faced: "",
            recommendations: "",
          }));
          loadData();
        } else {
          setErrorMsg(res?.message || "Failed to submit weekly report");
        }
      })
      .catch((err) => setErrorMsg(err.message || "Failed to submit weekly report"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="mentor-weeklyreports-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <FileCheck2 size={20} color="#4f46e5" />
            <span>Weekly Batch Progress & Governance Reports</span>
          </h2>
          <p className="mentor-page-subtitle">Submit weekly batch audit reports built from real attendance & assessment data</p>
        </div>

        <button
          className="mentor-btn-primary"
          onClick={() => setShowModal(true)}
          type="button"
          disabled={batches.length === 0}
          style={{ opacity: batches.length === 0 ? 0.5 : 1, cursor: batches.length === 0 ? 'not-allowed' : 'pointer' }}
          title={batches.length === 0 ? "You need at least one assigned batch first" : ""}
        >
          <Plus size={16} />
          <span>Submit Weekly Report</span>
        </button>
      </div>

      {successMsg && (
        <div className="mentor-alert-success">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mentor-alert-error">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Reports Table */}
      <div className="mentor-table-card">
        {loading ? (
          <div className="mentor-card-state">
            <RefreshCw className="mentor-card-state-spinner" size={24} />
            <p className="mentor-card-state-text">Loading weekly reports...</p>
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Covered Batch</th>
                  <th>Period</th>
                  <th>Attendance</th>
                  <th>Avg Quiz</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="mentor-empty-table-cell">
                      <div className="mentor-report-empty">
                        <ClipboardList size={26} />
                        <p className="mentor-report-empty-title">No weekly reports submitted yet</p>
                        <p className="mentor-report-empty-sub">
                          Click "Submit Weekly Report" above to create the first report for your batch.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td className="mentor-report-title">{r.title}</td>
                      <td className="mentor-report-batch">{r.batch_name || "—"}</td>
                      <td className="mentor-report-date">
                        Week {r.week_number} · {r.year}
                      </td>
                      <td>
                        <span className="mentor-report-metric">{formatPct(r.attendance_rate)}</span>
                      </td>
                      <td>
                        <span className="mentor-report-metric">{formatPct(r.avg_quiz_score)}</span>
                      </td>
                      <td className="mentor-report-date">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <span className={`mentor-report-status ${statusClass(r.status)}`}>
                          {(r.status || "submitted").toUpperCase()}
                        </span>
                      </td>
                      <td className="mentor-actions-cell">
                        <span className="mentor-report-export-note" title="PDF export not available yet">
                          PDF export coming soon
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Weekly Report Modal */}
      {showModal && (
        <div className="mentor-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="mentor-modal-card">
            <div className="mentor-modal-head">
              <div className="mentor-modal-title">
                <FileCheck2 size={20} />
                <span>Submit Weekly Report</span>
              </div>
              <button onClick={() => setShowModal(false)} className="mentor-modal-close" type="button" title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mentor-modal-body">
              <form onSubmit={handleSubmit} className="mentor-form">
                <div className="mentor-form-grid">
                  <div className="mentor-field">
                    <label className="mentor-field-label">Report Title *</label>
                    <input
                      type="text"
                      required
                      className="mentor-input"
                      placeholder="e.g. Week 12 Progress Report - Full Stack Web"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Week Number *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="mentor-input"
                      value={form.week_number}
                      onChange={(e) => setForm({ ...form, week_number: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Covered Batch *</label>
                    <select
                      className="mentor-select"
                      required
                      value={form.batch_id}
                      onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                    >
                      {batches.length === 0 && <option value="">No batches available</option>}
                      {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Report Year *</label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      required
                      className="mentor-input"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field mentor-field--full">
                    <label className="mentor-field-label">Summary</label>
                    <textarea
                      rows="3"
                      className="mentor-textarea"
                      placeholder="Key highlights and outcome of the week"
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Topics Covered</label>
                    <textarea
                      rows="4"
                      className="mentor-textarea"
                      placeholder="Topics, modules, and sessions delivered this week"
                      value={form.topics_covered}
                      onChange={(e) => setForm({ ...form, topics_covered: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Challenges Faced</label>
                    <textarea
                      rows="4"
                      className="mentor-textarea"
                      placeholder="Attendance dips, difficult topics, or blockers"
                      value={form.challenges_faced}
                      onChange={(e) => setForm({ ...form, challenges_faced: e.target.value })}
                    />
                  </div>

                  <div className="mentor-field mentor-field--full">
                    <label className="mentor-field-label">Recommendations</label>
                    <textarea
                      rows="3"
                      className="mentor-textarea"
                      placeholder="Suggested actions for the next week"
                      value={form.recommendations}
                      onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                    />
                  </div>

                  <p className="mentor-field-hint mentor-field--full">
                    Attendance rate and average quiz score are calculated automatically from live student data.
                  </p>
                </div>

                <div className="mentor-modal-foot">
                  <button type="button" onClick={() => setShowModal(false)} className="mentor-btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="mentor-btn-submit">
                    {saving ? <RefreshCw size={14} className="mentor-btn-spin" /> : <FileCheck2 size={14} />}
                    {saving ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}