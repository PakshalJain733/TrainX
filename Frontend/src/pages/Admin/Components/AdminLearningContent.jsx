import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../../Student/Styles/LearningContent.css";
import "../Styles/AdminLearningContent.css";
import "../Styles/AdminUsers.css";

const initialResources = [];
const allTopics = [];

export default function AdminLearningContent() {
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Video");
  const [newBatch, setNewBatch] = useState("All Batches");
  const [newStatus, setNewStatus] = useState("Draft");

  const categories = ["All resources", "Python Backend", "React Frontend", "Full Stack", "All Batches"];

  const handleAdd = (e) => {
    e.preventDefault();
    const iconMap = { Video: Video, Document: FileText, "AI Notes": Sparkles };
    setResources([...resources, {
      id: Date.now(),
      title: newTitle,
      category: newBatch,
      type: newType,
      duration: "—",
      status: newStatus,
      icon: iconMap[newType] || FileText,
    }]);
    setNewTitle("");
    setShowForm(false);
  };

  const handleDelete = (id) => setResources(resources.filter(r => r.id !== id));

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
                  <p className="modal-subtitle">Publish videos, documents, or AI study notes for student cohorts.</p>
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

                <div className="form-row-2">
                  <div className="form-group-admin">
                    <label>Resource Type</label>
                    <select className="form-select-admin" value={newType} onChange={e => setNewType(e.target.value)}>
                      <option>Video</option>
                      <option>Document</option>
                      <option>AI Notes</option>
                    </select>
                  </div>
                  <div className="form-group-admin">
                    <label>Target Cohort / Batch</label>
                    <select className="form-select-admin" value={newBatch} onChange={e => setNewBatch(e.target.value)}>
                      <option>All Batches</option>
                      <option>Python Backend</option>
                      <option>React Frontend</option>
                      <option>Full Stack</option>
                      <option>Data Science</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-admin">
                  <label>Publishing Status</label>
                  <select className="form-select-admin" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
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
        {filteredResources.length === 0 ? (
          <div className="learning-empty-state">
            <BookOpen size={36} className="learning-empty-icon" />
            <p className="learning-empty-title">No learning resources uploaded yet.</p>
          </div>
        ) : (
          filteredResources.map((item) => {
            const IconComponent = item.icon || FileText;
            return (
              <div key={item.id} className="learning-resource-card">
                <div className="learning-card-top">
                  <div className="learning-type-icon-wrap">
                    <IconComponent size={18} />
                  </div>
                  <button className="admin-lc-delete-btn" onClick={() => handleDelete(item.id)} title="Delete content">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="learning-card-body">
                  <h3 className="learning-card-title">{item.title}</h3>
                  <p className="learning-card-meta">
                    {item.category} · {item.type} · {item.duration}
                  </p>
                </div>

                <Badge variant={item.status === "Published" ? "success" : "outline"} className="learning-badge-pill">
                  {item.status}
                </Badge>
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
