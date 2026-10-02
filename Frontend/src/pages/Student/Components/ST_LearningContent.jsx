import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  BookOpen,
  BookOpenCheck,
  FileText,
  Video,
  Sparkles,
  ExternalLink,
  Download,
  Eye,
  X,
  Play,
} from "lucide-react";
import { apiFetch, getApiBaseUrl } from "../../../utils/api";
import { Badge } from "../../../components/ui/Badge";
import { EVENTS, getSharedLearningContent } from "../../../utils/sharedStore";
import "../Styles/ST_LearningContent.css";

export default function LearningContent() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All resources");
  const [viewerModal, setViewerModal] = useState(null);

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
    setViewerModal({
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
    setViewerModal({
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
    <div className="learning-content-page stack-6">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <BookOpenCheck size={24} style={{ color: "#2563eb", flexShrink: 0, marginRight: "10px" }} />
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
            const fileName = item.file_url && item.file_url !== "#" ? item.file_url.split('/').pop() : null;

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

      {/* Dynamic File & Video Viewer Modal */}
      {viewerModal && createPortal(
        <div className="lc-viewer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewerModal(null); }}>
          <div className="lc-viewer-modal">
            <div className="lc-viewer-header">
              <div className="lc-viewer-title-group">
                {viewerModal.type === "video" ? (
                  <div className="lc-viewer-icon-wrap lc-icon--video"><Video size={20} /></div>
                ) : (
                  <div className="lc-viewer-icon-wrap lc-icon--doc"><FileText size={20} /></div>
                )}
                <div>
                  <h3 className="lc-viewer-title">{viewerModal.title}</h3>
                  <span className="lc-viewer-subtitle">
                    {viewerModal.type === "video" ? "Interactive Video Player" : "Document & File Viewer"}
                  </span>
                </div>
              </div>

              <div className="lc-viewer-actions">
                <button
                  className="lc-viewer-action-btn"
                  onClick={() => window.open(viewerModal.url, "_blank", "noopener,noreferrer")}
                  title="Open in new window"
                >
                  <ExternalLink size={15} /> Open in New Tab
                </button>
                {viewerModal.type === "document" && (
                  <button
                    className="lc-viewer-action-btn lc-viewer-btn-primary"
                    onClick={() => handleDownloadDocument(viewerModal.originalItem)}
                    title="Download File"
                  >
                    <Download size={15} /> Download
                  </button>
                )}
                <button className="lc-viewer-close-btn" onClick={() => setViewerModal(null)} title="Close Viewer">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="lc-viewer-body">
              {viewerModal.type === "video" ? (
                getEmbedVideoUrl(viewerModal.url) !== viewerModal.url ? (
                  <iframe
                    src={getEmbedVideoUrl(viewerModal.url)}
                    title={viewerModal.title}
                    className="lc-viewer-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : viewerModal.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video controls autoPlay src={viewerModal.url} className="lc-viewer-video" />
                ) : (
                  <iframe
                    src={viewerModal.url}
                    title={viewerModal.title}
                    className="lc-viewer-iframe"
                    allowFullScreen
                  />
                )
              ) : (
                viewerModal.url.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ? (
                  <div className="lc-viewer-image-wrap">
                    <img src={viewerModal.url} alt={viewerModal.title} className="lc-viewer-img" />
                  </div>
                ) : viewerModal.url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video controls autoPlay src={viewerModal.url} className="lc-viewer-video" />
                ) : (
                  <iframe
                    src={viewerModal.url}
                    title={viewerModal.title}
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

