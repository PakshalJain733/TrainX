import React, { useState, useMemo } from "react";
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
import "../../Student/Styles/LearningContent.css";
import "../Styles/AdminLearningContent.css";

const initialResources = [
  {
    id: 1,
    title: "Python Fundamentals - Module 1",
    category: "Python Backend",
    type: "Video",
    duration: "35 min",
    status: "Published",
    icon: Video,
  },
  {
    id: 2,
    title: "SQL Joins & Aggregations",
    category: "Full Stack",
    type: "Document",
    duration: "20 min",
    status: "Published",
    icon: FileText,
  },
  {
    id: 3,
    title: "React Hooks Deep Dive",
    category: "React Frontend",
    type: "Video",
    duration: "28 min",
    status: "Draft",
    icon: Video,
  },
  {
    id: 4,
    title: "REST API Design Patterns",
    category: "All Batches",
    type: "AI Notes",
    duration: "25 min",
    status: "Published",
    icon: Sparkles,
  },
  {
    id: 5,
    title: "Advanced Pydantic Validation",
    category: "Python Backend",
    type: "Document",
    duration: "18 min",
    status: "Published",
    icon: FileText,
  },
  {
    id: 6,
    title: "Database Sharding & Replication",
    category: "Full Stack",
    type: "AI Notes",
    duration: "30 min",
    status: "Draft",
    icon: Sparkles,
  },
];

const allTopics = [
  "Python Basics", "Data Types", "OOP", "SQL", "Joins",
  "REST APIs", "React", "Hooks", "State", "Routing",
  "Authentication", "Deployment", "Testing", "Docker",
];

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
      {/* Header with Add button */}
      <div className="learning-header-row">
        <div>
          <h2 className="learning-title">Manage Learning Content</h2>
          <p className="learning-subtitle">Upload and organize videos, documents, and learning resources.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="add-content-btn">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancel" : "Add Content"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="learning-add-card" style={{ background: "#f5f3ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <form onSubmit={handleAdd} className="learning-add-form">
            <div className="form-group">
              <label>Title</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Content title..." required />
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value)}>
                  <option>Video</option>
                  <option>Document</option>
                  <option>AI Notes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Batch</label>
                <select value={newBatch} onChange={e => setNewBatch(e.target.value)}>
                  <option>All Batches</option>
                  <option>Python Backend</option>
                  <option>React Frontend</option>
                  <option>Full Stack</option>
                  <option>Data Science</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>
            </div>
            <button type="submit" className="learning-submit-btn">Add Content</button>
          </form>
        </div>
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
        {filteredResources.map((item) => {
          const IconComponent = item.icon;
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

              <Badge variant={item.status === "Published" ? "success" : "outline"}>
                {item.status}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Topic Coverage */}
      <div className="topic-coverage-card">
        <div className="topic-coverage-header">
          <BookOpen size={18} className="text-blue-600" />
          <span>Topic coverage</span>
        </div>
        <p className="topic-coverage-subtitle">
          Topics covered across all uploaded content and batches
        </p>

        <div className="topic-coverage-tags">
          {allTopics.map((topic, idx) => (
            <span key={idx} className="topic-coverage-tag-pill">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
