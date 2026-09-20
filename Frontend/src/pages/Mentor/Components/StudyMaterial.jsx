import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  ExternalLink,
  X,
  FileText,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';

const hasResource = (url) => {
  const v = (url || '').trim();
  if (!v || v === '#') return false;
  try {
    const parsed = new URL(v);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function StudyMaterial() {
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    title: "",
    subject: "",
    batch_id: "",
    type: "PDF Guide",
    file_url: "",
  });

  const loadMaterials = useCallback((showSpinner = true) => {
    if (showSpinner) setLoading(true);
    Promise.all([
      apiFetch("/mentor/study-materials").then((res) => {
        if (res && res.data && Array.isArray(res.data.materials)) {
          setMaterials(res.data.materials);
        }
      }),
      apiFetch("/mentor/batches").then((res) => {
        if (res && res.data && Array.isArray(res.data.batches)) {
          setBatches(res.data.batches);
        }
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch("/mentor/study-materials")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.materials)) {
          setMaterials(res.data.materials);
        }
      })
      .catch(() => {});
    apiFetch("/mentor/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.batches)) {
          setBatches(res.data.batches);
        }
      })
      .catch(() => {});
  }, []);

  const selectedBatch = batches.find((b) => String(b.id) === form.batch_id);
  const urlValid = hasResource(form.file_url);
  const canPublish = Boolean(form.title.trim() && form.subject.trim() && urlValid);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!canPublish || saving) return;
    setSaving(true);
    setErrorMsg("");

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      batch: selectedBatch ? selectedBatch.name : "All Batches",
      batch_id: form.batch_id ? parseInt(form.batch_id, 10) : null,
      type: form.type,
      file_url: form.file_url.trim(),
    };

    apiFetch("/mentor/study-materials", { method: "POST", body: JSON.stringify(payload) })
      .then((res) => {
        if (res && res.success) {
          setShowModal(false);
          setForm({ title: "", subject: "", batch_id: "", type: "PDF Guide", file_url: "" });
          setSuccessMsg("Study material published successfully!");
          setTimeout(() => setSuccessMsg(""), 4000);
          loadMaterials();
        } else {
          setErrorMsg(res?.message || "Failed to publish study material");
        }
      })
      .catch((err) => setErrorMsg(err.message || "Failed to publish study material"))
      .finally(() => setSaving(false));
  };

  const handleDownload = (item) => {
    if (hasResource(item.file_url)) {
      window.open(item.file_url.trim(), "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      apiFetch(`/mentor/study-materials/${id}`, { method: "DELETE" })
        .then((res) => {
          if (res && res.success) {
            setMaterials((prev) => prev.filter((m) => m.id !== id));
            setSuccessMsg("Study material deleted.");
            setTimeout(() => setSuccessMsg(""), 3000);
          } else {
            alert(res?.message || "Failed to delete study material");
          }
        })
        .catch((err) => alert(err.message || "Failed to delete study material"));
    }
  };

  const linkedCount = materials.filter((m) => hasResource(m.file_url)).length;

  return (
    <div className="mentor-studymaterial-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <BookOpen size={20} color="#4f46e5" />
            <span>Study Material & Resources Library</span>
          </h2>
          <p className="mentor-page-subtitle">Publish lecture decks, repositories, cheatsheets, and study guides</p>
        </div>

        <button className="mentor-btn-primary" onClick={() => setShowModal(true)} type="button">
          <Plus size={16} />
          <span>Add Study Material</span>
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

      {!loading && materials.length > 0 && (
        <div className="mentor-material-summary">
          <div className="mentor-material-summary-item">
            <FileText size={15} />
            <span><strong>{materials.length}</strong> resources</span>
          </div>
          <div className="mentor-material-summary-item">
            <Link2 size={15} />
            <span><strong>{linkedCount}</strong> with links</span>
          </div>
        </div>
      )}

      <div className="mentor-table-card">
        {loading ? (
          <div className="mentor-card-state">
            <RefreshCw className="mentor-card-state-spinner" size={24} />
            <p className="mentor-card-state-text">Loading study materials...</p>
          </div>
        ) : (
          <div className="mentor-table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Resource Title</th>
                  <th>Subject</th>
                  <th>Target Batch</th>
                  <th>Category</th>
                  <th>Published Date</th>
                  <th className="mentor-actions-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="mentor-empty-table-cell">
                      <div className="mentor-material-empty">
                        <BookOpen size={26} />
                        <p className="mentor-material-empty-title">No study materials published yet</p>
                        <p className="mentor-material-empty-sub">
                          Click "Add Study Material" above and attach a resource link to publish the first one.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  materials.map((m) => {
                    const linked = hasResource(m.file_url);
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="mentor-material-title-cell">
                            <span className="mentor-material-file-icon"><FileText size={16} /></span>
                            <span>{m.title}</span>
                          </div>
                        </td>
                        <td className="mentor-material-subject">{m.subject}</td>
                        <td className="mentor-material-batch">{m.batch || "All Batches"}</td>
                        <td>
                          <span className="mentor-material-tag">{m.type || m.category || "PDF"}</span>
                        </td>
                        <td className="mentor-material-date">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="mentor-actions-cell">
                          <div className="mentor-material-actions">
                            <button
                              className={`mentor-btn-download${linked ? "" : " mentor-btn-download--disabled"}`}
                              onClick={() => handleDownload(m)}
                              type="button"
                              title={linked ? "Open resource link in a new tab" : "No resource link attached to this material"}
                            >
                              {linked ? <ExternalLink size={14} /> : <Link2 size={14} />}
                              {linked ? "Open" : "No Link"}
                            </button>
                            <button
                              className="mentor-btn-icon"
                              onClick={() => handleDelete(m.id)}
                              type="button"
                              title="Delete Material"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STUDY MATERIAL MODAL */}
      {showModal && (
        <div className="mentor-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="mentor-modal-card mentor-modal-card--compact">
            <div className="mentor-modal-head">
              <div className="mentor-modal-title">
                <BookOpen size={20} />
                <span>Add Study Material</span>
              </div>
              <button onClick={() => setShowModal(false)} className="mentor-modal-close" type="button" title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mentor-modal-body">
              <form onSubmit={handleUploadSubmit} className="mentor-form">
                <div className="mentor-form-grid">
                  <div className="mentor-field mentor-field--full">
                    <label className="mentor-field-label">Resource Title *</label>
                    <input
                      type="text"
                      className="mentor-input"
                      placeholder="e.g. Data Structures & Algorithms Handbook"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Subject *</label>
                    <input
                      type="text"
                      className="mentor-input"
                      placeholder="e.g. Data Structures"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mentor-field">
                    <label className="mentor-field-label">Category</label>
                    <select
                      className="mentor-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="PDF Guide">PDF Guide</option>
                      <option value="Lecture Deck">Lecture Deck</option>
                      <option value="Code Repo">Code Repo</option>
                      <option value="Cheatsheet">Cheatsheet</option>
                      <option value="Assignment Brief">Assignment Brief</option>
                    </select>
                  </div>

                  <div className="mentor-field mentor-field--full">
                    <label className="mentor-field-label">Target Batch</label>
                    <select
                      className="mentor-select"
                      value={form.batch_id}
                      onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                    >
                      <option value="">All Batches</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {batches.length === 0 && (
                      <p className="mentor-field-hint">No batches are currently assigned to you.</p>
                    )}
                  </div>

                  <div className="mentor-field mentor-field--full">
                    <label className="mentor-field-label">Resource Link (URL) *</label>
                    <input
                      type="url"
                      className="mentor-input"
                      placeholder="https://drive.google.com/... or repository URL"
                      value={form.file_url}
                      onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                      required
                    />
                    <p className="mentor-field-hint">
                      Attach the direct web link of the resource. Publishing requires a valid http(s) link.
                    </p>
                  </div>
                </div>

                <div className="mentor-modal-foot">
                  <button type="button" onClick={() => setShowModal(false)} className="mentor-btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving || !canPublish} className="mentor-btn-submit">
                    {saving ? <RefreshCw size={14} className="mentor-btn-spin" /> : <BookOpen size={14} />}
                    {saving ? "Publishing..." : "Publish Resource"}
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