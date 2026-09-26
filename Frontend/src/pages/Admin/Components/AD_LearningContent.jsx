import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
  UploadCloud,
  ExternalLink,
  Download,
  Eye,
  ChevronDown,
  Check,
  BookOpenCheck,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { EVENTS, addSharedLearningContent, getSharedLearningContent } from "../../../utils/sharedStore";
import "../Styles/AD_LearningContent.css";

/* ── Inline dropdown for Admin LearningContent (CSS: AdminLearningContent.css .admin-lc-select-*) ── */
function AdminLcSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon, direction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (direction === 'up') {
        setDropUp(true);
      } else if (direction === 'down') {
        setDropUp(false);
      } else {
        setDropUp(spaceBelow < 240);
      }
    }
    setIsOpen(v => !v);
  };

  return (
    <div className={`admin-lc-select-wrap${isOpen ? ' admin-lc-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={handleToggle} className={`admin-lc-select-trigger${isOpen ? ' admin-lc-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-lc-select-icon" />}
        <span className="admin-lc-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-lc-select-arrow${isOpen ? ' admin-lc-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className={`admin-lc-select-dropdown${dropUp ? ' admin-lc-select-dropdown--up' : ''}`}>
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-lc-select-option${isSel ? ' admin-lc-select-option--selected' : ''}`}>
                <span className="admin-lc-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-lc-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminLearningContent() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("Document");
  const [newBatch, setNewBatch] = useState("All Batches");
  const [selectedFile, setSelectedFile] = useState(null);
  const [resourceLink, setResourceLink] = useState("");

  const [batchesList, setBatchesList] = useState([]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/mentor/materials");
      let fetched = [];
      if (res && res.data && Array.isArray(res.data)) {
        fetched = res.data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.batch || "All Batches",
          subject: item.subject || "General",
          type: item.type || "Document",
          file_url: item.file_url,
          link: item.link,
          file_name: item.file_url && item.file_url !== "#" ? item.file_url.split('/').pop() : null,
          duration: item.type === "Link" ? "Web Link" : "Document",
          status: "Published",
        }));
      }

      const shared = await getSharedLearningContent([]);
      const existingIds = new Set(fetched.map(f => f.id));
      const sharedMapped = shared
        .filter(s => !existingIds.has(s.id))
        .map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          category: s.batch_name || s.data?.batch || "All Batches",
          subject: s.data?.subject || "General",
          type: s.data?.type || "Document",
          file_url: s.data?.url || null,
          link: s.data?.url || null,
          file_name: null,
          duration: s.data?.type === "Link" ? "Web Link" : "Document",
          status: "Published",
        }));

      setResources([...fetched, ...sharedMapped]);
    } catch (err) {
      console.error("Failed to load study materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = () => {
    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setBatchesList(res.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadResources();
    fetchBatches();

    const handleLearningUpdate = () => loadResources();
    const handleBatchUpdate = () => fetchBatches();

    window.addEventListener(EVENTS.LEARNING_UPDATED, handleLearningUpdate);
    window.addEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    return () => {
      window.removeEventListener(EVENTS.LEARNING_UPDATED, handleLearningUpdate);
      window.removeEventListener(EVENTS.BATCH_UPDATED, handleBatchUpdate);
    };
  }, []);

  const categories = useMemo(() => {
    const names = batchesList.map((b) => b.name).filter(Boolean);
    return ["All resources", ...names, "All Batches"];
  }, [batchesList]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const fileUrl = selectedFile ? `/uploads/${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` : null;
    const iconMap = { Video: Video, Document: FileText, Link: ExternalLink, "AI Notes": Sparkles };
    
    const tempEntry = {
      id: Date.now(),
      title: newTitle,
      description: newDescription,
      category: newBatch,
      subject: "General",
      type: newType,
      file_url: fileUrl,
      link: resourceLink,
      file_name: selectedFile ? selectedFile.name : null,
      duration: selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : (resourceLink ? "Web Link" : "—"),
      status: "Published",
      icon: iconMap[newType] || FileText,
    };

    // Optimistically show new card
    setResources(prev => [tempEntry, ...prev]);

    try {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("authToken") || "";


      let res;

      if (selectedFile) {
        // Send multipart form-data for AWS S3 / disk upload
        const formData = new FormData();
        formData.append("title", newTitle);
        formData.append("description", newDescription || "");
        formData.append("subject", "General");
        formData.append("batch", newBatch);
        formData.append("type", newType);
        formData.append("link", resourceLink || "");
        formData.append("file", selectedFile);

        const response = await fetch("/api/v1/mentor/materials", {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
        res = await response.json();
      } else {
        res = await apiFetch("/mentor/materials", {
          method: "POST",
          body: JSON.stringify({
            title: newTitle,
            description: newDescription,
            subject: "General",
            batch: newBatch,
            type: newType,
            fileUrl: fileUrl,
            link: resourceLink,
          }),
        });
      }

      if (res && res.success) {
        await loadResources();
        window.dispatchEvent(new CustomEvent(EVENTS.LEARNING_UPDATED));
      } else {
        await addSharedLearningContent({
          title: newTitle,
          description: newDescription,
          batch: newBatch,
          type: newType,
          url: resourceLink || fileUrl || '#',
        });
        window.dispatchEvent(new CustomEvent(EVENTS.LEARNING_UPDATED));
      }
    } catch (err) {
      console.warn("Backend save warning:", err);
    }

    setNewTitle("");
    setNewDescription("");
    setSelectedFile(null);
    setResourceLink("");
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    setResources(prev => prev.filter(r => r.id !== id));
    try {
      await apiFetch(`/mentor/materials/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Backend delete warning:", err);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "All resources" || item.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [resources, searchQuery, selectedFilter]);

  const allTopics = useMemo(() => {
    return Array.from(new Set(resources.map(r => r.subject).filter(Boolean)));
  }, [resources]);

  return (
    <div className="learning-content-page">
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <BookOpenCheck size={22} className="ui-section-title-icon" />
              <span>Manage Learning Content</span>
            </h2>
            <p className="ui-section-desc">
              Upload and organize videos, documents, and learning resources.
            </p>
          </div>
          <div className="ui-section-action">
            <button onClick={() => setShowForm(!showForm)} className="add-content-btn">
              {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancel" : "Add Content"}
            </button>
          </div>
        </div>
      </div>

      {/* Add Content Modal / Flash Screen */}
      {showForm && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon-wrap modal-header-icon--indigo">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Upload Learning Content</h2>
                  <p className="modal-subtitle">Publish videos, documents, web links, or study notes for student batches.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForm(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group-admin">
                  <label>Content Title *</label>
                  <input
                    className="form-input-admin"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Node.js Event Loop & Async Architecture"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group-admin" style={{ marginTop: "12px" }}>
                  <label>Description (Optional)</label>
                  <textarea
                    className="form-input-admin form-textarea-admin"
                    rows={3}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Enter brief details or instructions for students..."
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Resource Type</label>
                    <AdminLcSelect
                      value={newType}
                      onChange={setNewType}
                      options={[
                        { value: "Document", label: "Document" },
                        { value: "Video", label: "Video" },
                        { value: "Link", label: "Link" },
                        { value: "AI Notes", label: "AI Notes" }
                      ]}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Target Batch / Batch</label>
                    <AdminLcSelect
                      value={newBatch}
                      onChange={setNewBatch}
                      options={[
                        { value: "All Batches", label: "All Batches" },
                        ...batchesList.map((b) => ({
                          value: b.name || b.title,
                          label: `${b.name || b.title} (${b.code || b.join_code || b.id})`
                        }))
                      ]}
                    />
                  </div>
                </div>

                {/* Clean, Full-Width Upload Document & Resource Link inputs */}
                <div className="form-group-admin" style={{ marginTop: "12px" }}>
                  <label>Upload Document / File {newType !== "Link" ? "*" : "(Optional)"}</label>
                  <input
                    type="file"
                    className="form-input-admin"
                    style={{ padding: "8px 12px", height: "auto", cursor: "pointer" }}
                    onChange={e => setSelectedFile(e.target.files[0] || null)}
                    required={newType !== "Link" && !resourceLink}
                  />
                  {selectedFile && (
                    <span className="form-hint" style={{ color: "#059669", fontWeight: "600", marginTop: "4px", display: "block" }}>
                      ✓ Selected File: {selectedFile.name}
                    </span>
                  )}
                </div>

                <div className="form-group-admin" style={{ marginTop: "12px" }}>
                  <label>Resource Link / URL {newType === "Link" ? "*" : "(Optional)"}</label>
                  <input
                    type="url"
                    className="form-input-admin"
                    value={resourceLink}
                    onChange={e => setResourceLink(e.target.value)}
                    placeholder="e.g. https://drive.google.com/... or https://..."
                    required={newType === "Link"}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Content
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Search and Category Filter */}
      <div className="learning-search-card">
        <div className="learning-search-bar">
          <Search size={18} className="learning-search-icon" />
          <input
            type="text"
            className="learning-search-input"
            placeholder="Search content by title or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="learning-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`learning-filter-btn ${selectedFilter === cat ? "active" : ""}`}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="learning-resources-grid">
        {loading ? (
          <div className="learning-empty-state">
            <p className="learning-empty-title">Loading learning content...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="learning-empty-state">
            <BookOpen size={36} className="learning-empty-icon" />
            <p className="learning-empty-title">No learning resources uploaded yet.</p>
          </div>
        ) : (
          filteredResources.map((item) => {
            const iconMap = { Video: Video, Document: FileText, Link: ExternalLink, "AI Notes": Sparkles };
            const IconComponent = iconMap[item.type] || FileText;
            const fileName = item.file_name || (item.file_url && item.file_url !== "#" ? item.file_url.split('/').pop() : null);

            return (
              <div key={item.id} className="learning-resource-card">
                <div className="learning-card-header-row">
                  <div className="learning-card-title-group">
                    <div className="learning-type-icon-wrap">
                      <IconComponent size={22} />
                    </div>
                    <div className="learning-title-meta-col">
                      <h3 className="learning-card-title">{item.title}</h3>
                      <div className="learning-card-sub-pills">
                        <span className="learning-batch-badge">{item.category}</span>
                        <span className="learning-type-chip">{item.type}</span>
                      </div>
                    </div>
                  </div>
                  <button className="admin-lc-delete-btn" onClick={() => handleDelete(item.id)} title="Delete content">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="learning-card-body-box">
                  {item.description && (
                    <p className="learning-card-description-text" style={{ fontSize: "13px", color: "#475569", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                      {item.description}
                    </p>
                  )}
                  <div className="learning-file-info-row">
                    <FileText size={14} className="learning-file-info-icon" />
                    <span className="learning-file-name-text">
                      {fileName ? fileName : (item.link ? item.link : "Study Document Resource")}
                    </span>
                  </div>
                </div>

                <div className="learning-card-footer">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-download-btn"
                    >
                      <Eye size={14} /> View Link
                    </a>
                  ) : item.file_url ? (
                    <button
                      type="button"
                      className="resource-download-btn"
                      onClick={() => {
                        let targetUrl = item.file_url;
                        if (!targetUrl.startsWith("http") && !targetUrl.startsWith("blob:")) {
                          targetUrl = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
                        }
                        window.open(targetUrl, "_blank");
                      }}
                    >
                      <Eye size={14} /> View Document
                    </button>
                  ) : (
                    <span className="resource-no-link">No Attachment</span>
                  )}
                  <Badge variant="success" className="learning-status-pill">
                    {item.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Topic Coverage */}
      <div className="topic-coverage-card">
        <div className="topic-coverage-header">
          <BookOpen size={18} className="topic-coverage-header-icon" />
          <span>Topic coverage</span>
        </div>
        <p className="topic-coverage-subtitle">
          Topics covered across all uploaded content and batches
        </p>

        <div className="topic-coverage-tags">
          {allTopics.length === 0 ? (
            <span className="topic-empty-label">No topics registered yet.</span>
          ) : (
            allTopics.map((topic, idx) => (
              <span key={idx} className="topic-coverage-tag-pill">
                {topic}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
