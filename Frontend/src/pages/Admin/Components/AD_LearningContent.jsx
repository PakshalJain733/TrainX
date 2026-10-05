import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Search, BookOpen, FileText, Video, Sparkles, Plus, Trash2, X, Link as LinkIcon, UploadCloud, ExternalLink, Download, Eye, ChevronDown, BookOpenCheck } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch, getApiBaseUrl } from "../../../utils/api";
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
  const [viewingDocument, setViewingDocument] = useState(null);

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

        const response = await fetch(`${getApiBaseUrl()}/mentor/materials`, {
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

  
  const resolveUrl = (rawUrl) => {
    if (!rawUrl || rawUrl === "#") return null;
    if (
      rawUrl.startsWith("http://") ||
      rawUrl.startsWith("https://") ||
      rawUrl.startsWith("blob:") ||
      rawUrl.startsWith("data:")
    ) {
      return rawUrl;
    }
    const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    const apiBase = getApiBaseUrl();
    const origin = apiBase.startsWith("http") ? new URL(apiBase).origin : window.location.origin;
    const backendHost = (origin.includes(":5173") || origin.includes(":3000")) ? "http://localhost:5000" : origin;
    return `${backendHost}${normalizedPath}`;
  };

  const getEmbedVideoUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return url;
  };

  const handleOpenLink = (item) => {
    let targetUrl = resolveUrl(item.link || item.file_url);
    if (!targetUrl) {
      alert("No valid web link found for this item.");
      return;
    }
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenVideo = (item) => {
    const videoUrl = resolveUrl(item.link || item.file_url);
    if (!videoUrl) {
      alert("No video source found for this item.");
      return;
    }
    setViewingDocument({
      type: "video",
      title: item.title,
      url: videoUrl,
      originalItem: item,
    });
  };

  const handleViewDocument = (item) => {
    const docUrl = resolveUrl(item.file_url || item.link);
    if (!docUrl) {
      alert("No viewable document file attached to this resource.");
      return;
    }
    setViewingDocument({
      type: "document",
      title: item.title,
      url: docUrl,
      originalItem: item,
    });
  };

  const handleDownloadDocument = (item) => {
    let targetUrl = resolveUrl(item.file_url || item.link);
    if (!targetUrl) {
      alert("No downloadable document file attached to this resource.");
      return;
    }

    const a = document.createElement("a");
    a.href = targetUrl;
    const filename = (item.title || "document").replace(/[^a-zA-Z0-9_\-]/g, "_");
    a.setAttribute("download", filename);
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        <div className="ui-section-main-AD">
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
        <div className="sa-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="sa-modal-dialog dept-modal-540">
            <div className="sa-modal-header">
              <div className="sa-modal-header-left">
                <div className="sa-modal-icon-wrap" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="sa-modal-title">Upload Learning Content</h2>
                  <p className="sa-modal-subtitle">Publish videos, documents, web links, or study notes for student batches.</p>
                </div>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowForm(false)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="sa-modal-body">
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

              <div className="sa-modal-footer">
                <button type="button" className="sa-modal-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="sa-modal-btn-submit">
                  Publish Resource
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

            const typeLower = (item.type || "").toLowerCase();
            const fileUrl = item.file_url || "";
            const linkUrl = item.link || "";

            const isLink = typeLower.includes("link") || (!fileUrl && linkUrl && !linkUrl.includes("youtube") && !linkUrl.includes("youtu.be") && !linkUrl.includes("vimeo"));
            const isVideo = typeLower.includes("video") || fileUrl.match(/\.(mp4|webm|mov|mkv)$/i) || linkUrl.includes("youtube.com") || linkUrl.includes("youtu.be") || linkUrl.includes("vimeo.com");
            const isDocument = !isLink && !isVideo;

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
                  {isLink && (
                    <button
                      type="button"
                      className="resource-action-btn resource-btn-link"
                      onClick={() => handleOpenLink(item)}
                    >
                      <ExternalLink size={14} /> Open Link
                    </button>
                  )}

                  {isVideo && (
                    <button
                      type="button"
                      className="resource-action-btn resource-btn-video"
                      onClick={() => handleOpenVideo(item)}
                    >
                      <Video size={14} /> Watch Video
                    </button>
                  )}

                  {isDocument && (
                    <div className="resource-doc-btn-group">
                      <button
                        type="button"
                        className="resource-action-btn resource-btn-view"
                        onClick={() => handleViewDocument(item)}
                      >
                        <Eye size={14} /> View Document
                      </button>
                      <button
                        type="button"
                        className="resource-action-btn resource-btn-download"
                        onClick={() => handleDownloadDocument(item)}
                        title="Download document file"
                      >
                        <Download size={14} />
                      </button>
                    </div>
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

      {/* Dynamic File & Video Viewer Modal */}
      {viewingDocument && createPortal(
        <div className="lc-viewer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingDocument(null); }}>
          <div className="lc-viewer-modal">
            <div className="lc-viewer-header">
              <div className="lc-viewer-title-group">
                {viewingDocument.type === "video" ? (
                  <div className="lc-viewer-icon-wrap lc-icon--video"><Video size={20} /></div>
                ) : (
                  <div className="lc-viewer-icon-wrap lc-icon--doc"><FileText size={20} /></div>
                )}
                <div>
                  <h3 className="lc-viewer-title">{viewingDocument.title}</h3>
                  <span className="lc-viewer-subtitle">
                    {viewingDocument.type === "video" ? "Interactive Video Player" : "Document & File Viewer"}
                  </span>
                </div>
              </div>

              <div className="lc-viewer-actions">
                <button
                  className="lc-viewer-action-btn"
                  onClick={() => window.open(viewingDocument.url, "_blank", "noopener,noreferrer")}
                  title="Open in new window"
                >
                  <ExternalLink size={15} /> Open in New Tab
                </button>
                {viewingDocument.type === "document" && (
                  <button
                    className="lc-viewer-action-btn lc-viewer-btn-primary"
                    onClick={() => handleDownloadDocument(viewingDocument.originalItem)}
                    title="Download File"
                  >
                    <Download size={15} /> Download
                  </button>
                )}
                <button className="lc-viewer-close-btn" onClick={() => setViewingDocument(null)} title="Close Viewer">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="lc-viewer-body">
              {viewingDocument.type === "video" ? (
                getEmbedVideoUrl(viewingDocument.url) !== viewingDocument.url ? (
                  <iframe
                    src={getEmbedVideoUrl(viewingDocument.url)}
                    title={viewingDocument.title}
                    className="lc-viewer-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : viewingDocument.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video controls autoPlay src={viewingDocument.url} className="lc-viewer-video" />
                ) : (
                  <iframe
                    src={viewingDocument.url}
                    title={viewingDocument.title}
                    className="lc-viewer-iframe"
                    allowFullScreen
                  />
                )
              ) : (
                viewingDocument.url.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ? (
                  <div className="lc-viewer-image-wrap">
                    <img src={viewingDocument.url} alt={viewingDocument.title} className="lc-viewer-img" />
                  </div>
                ) : viewingDocument.url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video controls autoPlay src={viewingDocument.url} className="lc-viewer-video" />
                ) : (
                  <iframe
                    src={viewingDocument.url}
                    title={viewingDocument.title}
                    className="lc-viewer-iframe"
                  />
                )
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
