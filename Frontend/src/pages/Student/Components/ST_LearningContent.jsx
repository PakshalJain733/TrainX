import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  BookOpenCheck,
  FileText,
  Video,
  Sparkles,
  ExternalLink,
  Download,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { Badge } from "../../../components/ui/Badge";
import { EVENTS, getSharedLearningContent } from "../../../utils/sharedStore";
import "../Styles/ST_LearningContent.css";

export default function LearningContent() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");

  const loadResources = async () => {
    setLoading(true);
    let loadedItems = [];
    try {
      const res = await apiFetch("/student/materials");
      const shared = await getSharedLearningContent([]);

      let dbMaterials = (res && res.data && Array.isArray(res.data)) ? res.data : [];
      if (dbMaterials.length === 0) {
        const fallbackRes = await apiFetch("/mentor/materials");
        if (fallbackRes && fallbackRes.data && Array.isArray(fallbackRes.data)) {
          dbMaterials = fallbackRes.data;
        }
      }

      const mappedShared = shared.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        batch: s.batch_name || s.data?.batch || "All Batches",
        subject: s.data?.subject || "General",
        type: s.data?.type || "Document",
        file_url: s.data?.url !== '#' ? s.data?.url : null,
        link: s.data?.url !== '#' ? s.data?.url : null,
      }));

      const existingIds = new Set(dbMaterials.map(m => String(m.id)));
      loadedItems = [...dbMaterials, ...mappedShared.filter(s => !existingIds.has(String(s.id)))];
    } catch (err) {
      console.error("Failed to load student learning content:", err);
    }

    if (loadedItems.length > 0) {
      const mapped = loadedItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.batch || item.category || "All Batches",
        subject: item.subject || "General",
        type: item.type || "Document",
        file_url: item.file_url,
        link: item.link,
        status: "Published",
      }));
      setResources(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResources();
    const handleUpdate = () => loadResources();
    window.addEventListener(EVENTS.LEARNING_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.LEARNING_UPDATED, handleUpdate);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(resources.map(r => r.category).filter(Boolean)));
    return ["All resources", ...cats];
  }, [resources]);

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

  const allTopics = useMemo(() => {
    return Array.from(new Set(resources.map(r => r.subject).filter(Boolean)));
  }, [resources]);

  return (
    <div className="learning-content-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <span>Learning Resources & Documentation</span>
        </h2>
        <p className="student-header-desc">Access module lecture notes, reference guides, coding cheatsheets, and faculty curriculum resources.</p>
      </div>
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
            <p className="learning-empty-title">Loading study materials...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="learning-empty-state">
            <BookOpen size={36} className="learning-empty-icon" />
            <p className="learning-empty-title">No learning resources available yet.</p>
          </div>
        ) : (
          filteredResources.map((item) => {
            const iconMap = { Video: Video, Document: FileText, Link: ExternalLink, "AI Notes": Sparkles };
            const IconComponent = iconMap[item.type] || FileText;
            const isCompleted = item.status === "Completed";
            const fileName = item.file_url && item.file_url !== "#" ? item.file_url.split('/').pop() : null;

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
                      {fileName ? fileName : (item.link ? item.link : "Curriculum Learning Document")}
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
                    Published
                  </Badge>
                </div>
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
