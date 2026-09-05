import React, { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/LearningContent.css";

const initialResources = [];
const allTopics = [];

export default function LearningContent() {
  const [resources, setResources] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");

  const categories = ["All resources", "SQL & Databases", "REST APIs with FastAPI", "Object Oriented Programming"];

  const toggleStatus = (id) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Completed" ? "Pending" : "Completed" }
          : r
      )
    );
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

  return (
    <div className="learning-content-page">
      {/* Search and Category Filter Card */}
      <div className="learning-search-card">
        <div className="learning-search-bar">
          <Search size={18} className="learning-search-icon" />
          <input
            type="text"
            className="learning-search-input"
            placeholder="Search topics or study resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="learning-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`learning-filter-btn ${
                selectedFilter === cat ? "active" : ""
              }`}
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
            <p className="learning-empty-title">No learning resources available yet.</p>
          </div>
        ) : (
          filteredResources.map((item) => {
            const IconComponent = item.icon;
            const isCompleted = item.status === "Completed";
            return (
              <div key={item.id} className="learning-resource-card">
                <div className="learning-card-top">
                  <div className="learning-type-icon-wrap">
                    {IconComponent ? <IconComponent size={18} /> : <FileText size={18} />}
                  </div>
                </div>

                <div className="learning-card-body">
                  <h3 className="learning-card-title">{item.title}</h3>
                  <p className="learning-card-meta">
                    {item.category} · {item.type} · {item.duration}
                  </p>
                </div>

                {isCompleted ? (
                  <div className="learning-completed-label">
                    <CheckCircle2 size={15} className="learning-completed-icon" />
                    Completed
                  </div>
                ) : (
                  <button
                    className="learning-toggle-btn btn-mark-complete"
                    onClick={() => toggleStatus(item.id)}
                  >
                    Mark complete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Topic Mastery Coverage */}
      <div className="topic-coverage-card">
        <div className="topic-coverage-header">
          <BookOpen size={18} className="topic-coverage-header-icon" />
          <span>Topic coverage</span>
        </div>
        <p className="topic-coverage-subtitle">
          Topics and skills unlocked across your personal curriculum roadmap
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
