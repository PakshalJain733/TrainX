import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../../Student/Styles/LearningContent.css";
import "../Styles/AdminLearningContent.css";
import "../Styles/AdminUsers.css";

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
    let apiDataLoaded = false;
    try {
      const res = await apiFetch("/mentor/materials");
      if (res && res.data && Array.isArray(res.data)) {
        const fetched = res.data.map(item => ({
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
        if (fetched.length > 0) {
          setResources(fetched);
          localStorage.setItem("saved_study_materials", JSON.stringify(fetched));
          apiDataLoaded = true;
        }
      }
    } catch (err) {
      console.error("Failed to load study materials:", err);
    } finally {
      if (!apiDataLoaded) {
        const saved = localStorage.getItem("saved_study_materials");
        if (saved) {
          try {
            setResources(JSON.parse(saved));
          } catch (_) {}
        }
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    apiFetch("/batches")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setBatchesList(res.data);
        }
      })
      .catch(() => {});
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

    // Optimistically show new card and save to local storage cache
    setResources(prev => {
      const updated = [tempEntry, ...prev];
      localStorage.setItem("saved_study_materials", JSON.stringify(updated));
      return updated;
    });

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
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
        // Re-fetch clean list from database so inserted DB S3 file URL is preserved
        await loadResources();
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
    setResources(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem("saved_study_materials", JSON.stringify(updated));
      return updated;
    });
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
      <SectionHeader
        title="Manage Learning Content"
        description="Upload and organize videos, documents, and learning resources."
        action={
          <button onClick={() => setShowForm(!showForm)} className="add-content-btn">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancel" : "Add Content"}
          </button>
        }
      />

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
                  <p className="modal-subtitle">Publish videos, documents, web links, or study notes for student cohorts.</p>
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
                    <select className="form-select-admin" value={newType} onChange={e => setNewType(e.target.value)}>
                      <option>Document</option>
                      <option>Video</option>
                      <option>Link</option>
                      <option>AI Notes</option>
                    </select>
                  </div>
                  <div className="form-group-admin">
                    <label>Target Cohort / Batch</label>
                    <select className="form-select-admin" value={newBatch} onChange={e => setNewBatch(e.target.value)}>
                      <option value="All Batches">All Batches</option>
                      {batchesList.map((b) => (
                        <option key={b.id} value={b.name || b.title}>
                          {b.name || b.title} ({b.code || b.join_code || b.id})
                        </option>
                      ))}
                    </select>
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
