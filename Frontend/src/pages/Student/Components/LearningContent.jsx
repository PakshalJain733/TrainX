import React, { useState, useEffect, useMemo } from "react";
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
import { SectionHeader } from "../../../components/ui/SectionHeader";
import apiFetch from "../../../utils/api";
import "../Styles/LearningContent.css";

const typeToIcon = {
  PDF: FileText,
  Video: Video,
  DOC: FileText,
};

export default function LearningContent() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await apiFetch("/study-materials");
        if (mounted && response && Array.isArray(response.data)) {
          setResources(response.data);
        }
      } catch (err) {
        console.error("Study materials load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categories = [
    "All resources",
    ...Array.from(new Set(resources.map((r) => r.category).filter(Boolean))),
  ];

  const allTopics = Array.from(
    new Set(resources.map((r) => r.category).filter(Boolean))
  );

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
    <div className="learning-content-page stack-6">
      <SectionHeader
        eyebrow="STUDY MATERIALS & CURRICULUM"
        title="Learning Resources & Documentation"
        description="Access module lecture notes, reference guides, coding cheatsheets, and faculty curriculum resources."
      />
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
        {loading ? (
          <div className="learning-empty-state">
            <BookOpen size={36} className="learning-empty-icon" />
            <p className="learning-empty-title">Loading study materials…</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="learning-empty-state">
            <BookOpen size={36} className="learning-empty-icon" />
            <p className="learning-empty-title">No learning resources available yet.</p>
          </div>
        ) : (
          filteredResources.map((item) => {
            const IconComponent = typeToIcon[item.type] || FileText;
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
