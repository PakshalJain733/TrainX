import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Download, UploadCloud, X, FileText, CheckCircle2, Trash2, ChevronDown, Check } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';

/* ── Inline dropdown for Mentor StudyMaterial (CSS: StudyMaterial.css .mentor-sm-select-*) ── */
function MentorSmSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-sm-select-wrap${isOpen ? ' mentor-sm-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-sm-select-trigger${isOpen ? ' mentor-sm-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-sm-select-icon" />}
        <span className="mentor-sm-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-sm-select-arrow${isOpen ? ' mentor-sm-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-sm-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-sm-select-option${isSel ? ' mentor-sm-select-option--selected' : ''}`}>
                <span className="mentor-sm-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-sm-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudyMaterial() {
  const [materials, setMaterials] = useState([]);
  const [dbBatches, setDbBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    batch: "All Batches",
    category: "PDF Guide",
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/mentor/materials');
      if (res && res.success && Array.isArray(res.data)) {
        setMaterials(res.data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('[StudyMaterial API error]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch('/batches');
      if (res && res.data && Array.isArray(res.data)) {
        setDbBatches(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMaterials();
    fetchBatches();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const res = await apiFetch('/mentor/materials', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          subject: form.category,
          batch: form.batch,
          type: form.category,
          fileUrl: '#'
        })
      });

      if (res && res.success) {
        setShowModal(false);
        setForm({ title: "", batch: "Batch-A (CS)", category: "PDF Guide" });
        setSelectedFile(null);
        setSuccessMsg("Study material uploaded & published to database successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
        fetchMaterials();
      }
    } catch (err) {
      console.error('[StudyMaterial upload error]', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        const res = await apiFetch(`/mentor/materials/${id}`, { method: 'DELETE' });
        if (res && res.success) {
          fetchMaterials();
        }
      } catch (err) {
        console.error('[StudyMaterial delete error]', err);
      }
    }
  };

  return (
    <div className="mentor-studymaterial-container">
      <div className="studymaterial-header-row">
        <div>
          <h2 className="studymaterial-page-title">
            <BookOpen size={24} color="#4f46e5" /> Mentor Study Material & Resources
          </h2>
          <p className="studymaterial-page-subtitle">
            Upload notes, lecture decks, and reference guides for assigned student batches.
          </p>
        </div>
        <button className="studymaterial-upload-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Upload Resource
        </button>
      </div>

      {successMsg && (
        <div className="studymaterial-alert-success">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div className="studymaterial-grid">
        {loading ? (
          <p>Loading study materials from database...</p>
        ) : materials.length === 0 ? (
          <p>No study materials found.</p>
        ) : (
          materials.map((item) => (
            <div key={item.id} className="studymaterial-card">
              <div className="studymaterial-card-header">
                <div className="studymaterial-icon-wrap">
                  <FileText size={22} color="#4f46e5" />
                </div>
                <div className="studymaterial-batch-tag">{item.batch}</div>
              </div>
              <h3 className="studymaterial-card-title">{item.title}</h3>
              <div className="studymaterial-card-meta">
                <span>{item.type || item.category || 'PDF'}</span>
                <span>•</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Sep 2026'}</span>
              </div>
              <div className="studymaterial-card-actions">
                <a href={item.file_url || '#'} download className="studymaterial-download-btn">
                  <Download size={16} /> Download
                </a>
                <button
                  className="studymaterial-delete-btn"
                  onClick={() => handleDelete(item.id)}
                  title="Delete Resource"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="studymaterial-modal-overlay">
          <div className="studymaterial-modal-box">
            <div className="studymaterial-modal-header">
              <h3 className="studymaterial-modal-title">Upload New Study Resource</h3>
              <button className="studymaterial-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="studymaterial-form">
              <div className="studymaterial-form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming Problem Set"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="studymaterial-form-row">
                <div className="studymaterial-form-group">
                  <label>Assign Batch</label>
                  <MentorSmSelect
                    value={form.batch}
                    onChange={(val) => setForm({ ...form, batch: val })}
                    options={[
                      { value: "All Batches", label: "All Batches" },
                      ...dbBatches.map((b) => ({
                        value: b.name || b.code,
                        label: `${b.name || b.code} (${b.code || b.join_code || b.id})`
                      }))
                    ]}
                  />
                </div>
                <div className="studymaterial-form-group">
                  <label>Category</label>
                  <MentorSmSelect
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    options={[
                      { value: "PDF Guide", label: "PDF Guide" },
                      { value: "Lecture Deck", label: "Lecture Deck" },
                      { value: "Code Repo", label: "Code Repo" },
                      { value: "Practice Sheet", label: "Practice Sheet" }
                    ]}
                  />
                </div>
              </div>

              <div
                className="studymaterial-file-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} color="#4f46e5" />
                {selectedFile ? (
                  <p className="studymaterial-file-selected">{selectedFile.name}</p>
                ) : (
                  <p className="studymaterial-dropzone-text">Click to choose a file (PDF, PPT, ZIP)</p>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>

              <div className="studymaterial-modal-footer">
                <button
                  type="button"
                  className="studymaterial-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="studymaterial-submit-btn">
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
