import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Plus, Download, CheckCircle2, X } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { batchAPI } from "../../../services/api";
import { EVENTS, addSharedLearningContent, getSharedLearningContent } from "../../../utils/sharedStore";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/MN_StudyMaterial.css";

const defaultMaterials = [];

export default function StudyMaterial() {
  const [materials, setMaterials] = useState(defaultMaterials);
  const [batchesList, setBatchesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PDF Guide");
  const [batch, setBatch] = useState("All Batches");
  const [selectedFile, setSelectedFile] = useState(null);
  const [resourceLink, setResourceLink] = useState("");

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getBatches();
      if (Array.isArray(data) && data.length > 0) setBatchesList(data);
    } catch {}
  };

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch("/mentor/study-materials");
      const shared = await getSharedLearningContent([]);
      let dbMaterials = (res && res.data && Array.isArray(res.data)) ? res.data : [];

      const mappedShared = shared.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        batch: s.batch_name || s.data?.batch || "All Batches",
        category: s.data?.type || "Document",
        date: "Recently Added",
        file_url: s.data?.url !== '#' ? s.data?.url : null,
        link: s.data?.url !== '#' ? s.data?.url : null,
        downloads: 0,
      }));

      const existingIds = new Set(dbMaterials.map(m => String(m.id)));
      const combined = [...dbMaterials, ...mappedShared.filter(s => !existingIds.has(String(s.id)))];

      if (combined.length > 0) {
        setMaterials(combined);
      }
    } catch (err) {
      console.warn("[StudyMaterial] load error:", err);
    }
  };

  const [fileName, setFileName] = useState("");


  useEffect(() => {
    fetchMaterials();
    fetchBatches();
    const handleUpdate = () => fetchMaterials();
    window.addEventListener(EVENTS.LEARNING_UPDATED, handleUpdate);
    window.addEventListener(EVENTS.BATCH_UPDATED, fetchBatches);
    return () => {
      window.removeEventListener(EVENTS.LEARNING_UPDATED, handleUpdate);
      window.removeEventListener(EVENTS.BATCH_UPDATED, fetchBatches);
    };
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const token = sessionStorage.getItem("token") || sessionStorage.getItem("authToken") || "";
    let uploadedUrl = resourceLink || "";

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description || "");
        formData.append("subject", category || "General");
        formData.append("batch", batch);
        formData.append("type", category);
        formData.append("link", resourceLink || "");
        formData.append("file", selectedFile);

        const res = await fetch("/api/v1/mentor/materials", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const json = await res.json();
        if (json && json.data) {
          uploadedUrl = json.data.file_url || json.data.link || uploadedUrl;
        }
      } else {
        await apiFetch("/mentor/materials", {
          method: "POST",
          body: JSON.stringify({
            title,
            description,
            subject: category || "General",
            batch,
            type: category,
            link: resourceLink,
          }),
        });
      }

      await addSharedLearningContent({
        title,
        description,
        batch,
        type: category,
        url: uploadedUrl,
      });

      window.dispatchEvent(new CustomEvent(EVENTS.LEARNING_UPDATED));
      fetchMaterials();
    } catch (err) {
      console.warn("Upload fallback local:", err);
    }

    setIsSubmitting(false);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setResourceLink("");
    }, 1200);
  };

  return (
    <div className="mentor-studymaterial-container">
      {/* Header */}
      <div className="mentor-page-header-sm">
        <div>
          <h2 className="mentor-page-title">
            <BookOpen size={20} color="#4f46e5" />
            <span>Study Material & Resources</span>
          </h2>
          <p className="mentor-page-subtitle">Upload reference guides, cheat sheets, and curriculum materials for your students</p>
        </div>
        <button className="mentor-btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Upload New Study Material</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Target Batch</th>
                <th>Type</th>
                <th>Uploaded Date</th>
                <th>Downloads</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mentor-empty-materials-cell">
                    <BookOpen size={28} className="mentor-empty-icon" />
                    <p className="mentor-empty-title">No study materials uploaded yet.</p>
                    <p className="mentor-empty-subtitle">Click "Upload New Study Material" above to publish resources.</p>
                  </td>
                </tr>
              ) : (
                materials.map((m) => {
                  const targetUrl = m.file_url || m.link || "#";
                  return (
                    <tr key={m.id}>
                      <td className="mentor-material-title">
                        <div style={{ fontWeight: 700 }}>{m.title}</div>
                        {m.description && <div style={{ fontSize: "12px", color: "#64748b" }}>{m.description}</div>}
                      </td>
                      <td className="mentor-material-batch">{m.batch || "All Batches"}</td>
                      <td>
                        <span className="mentor-material-tag">
                          {m.type || m.category || "Document"}
                        </span>
                      </td>
                      <td className="mentor-material-date">{m.created_at ? new Date(m.created_at).toLocaleDateString("en-IN") : (m.date || "Today")}</td>
                      <td className="mentor-material-downloads">{m.downloads || 0} downloads</td>
                      <td className="mentor-actions-cell" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {targetUrl !== "#" ? (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="mentor-btn-download"
                            style={{ textDecoration: "none" }}
                          >
                            <Download size={14} /> Download
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>N/A</span>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiFetch(`/mentor/materials/${m.id}`, { method: "DELETE" });
                              window.dispatchEvent(new CustomEvent(EVENTS.LEARNING_UPDATED));
                              fetchMaterials();
                            } catch {}
                          }}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && createPortal(
        <div className="mentor-modal-overlay">
          <div className="mentor-modal-container">
            {/* Modal Header */}
            <div className="mentor-modal-top">
              <div className="mentor-modal-title-wrap">
                <div className="mentor-modal-icon-wrap">
                  <BookOpen size={20} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="mentor-modal-heading">
                    Upload Learning Content
                  </h3>
                  <p className="mentor-modal-subtext">
                    Publish videos, documents, web links, or study notes for student batches.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="mentor-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mentor-modal-body">
              {uploadSuccess ? (
                <div className="mentor-success-wrap">
                  <CheckCircle2 size={48} color="#10b981" className="mentor-success-icon" />
                  <h4 className="mentor-success-title">Content Added Successfully!</h4>
                  <p className="mentor-success-subtext">The resource is now available to selected student batches.</p>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="mentor-form-flex">
                  {/* Content Title */}
                  <div>
                    <label className="mentor-form-label">
                      Content Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Node.js Event Loop & Async Architecture"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mentor-input-text"
                    />
                  </div>

                  {/* Description (Optional) */}
                  <div>
                    <label className="mentor-form-label">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter brief details or instructions for students..."
                      className="mentor-textarea"
                    />
                  </div>

                  {/* Resource Type & Target Batch Row */}
                  <div className="mentor-grid-2">
                    <div>
                      <label className="mentor-form-label">
                        Resource Type
                      </label>
                      <CustomSelect
                        value={category}
                        options={[
                          { value: "PDF Guide", label: "PDF Guide" },
                          { value: "Document", label: "Document" },
                          { value: "Video Lecture", label: "Video Lecture" },
                          { value: "Web Link / URL", label: "Web Link / URL" },
                          { value: "Cheat Sheet", label: "Cheat Sheet" },
                        ]}
                        onChange={(val) => setCategory(val)}
                        placeholder="Select type..."
                      />
                    </div>

                    <div>
                      <label className="mentor-form-label">
                        Target Batch / Batch
                      </label>
                      <CustomSelect
                        value={batch}
                        options={[
                          { value: "All Batches", label: "All Batches" },
                          ...batchesList.map(b => ({ value: b.name, label: b.name })),
                          { value: "CSE 2026 Alpha Batch", label: "CSE 2026 Alpha Batch" },
                          { value: "Fullstack React & Node Track", label: "Fullstack React & Node Track" },
                          { value: "Data Science & AI/ML 2025", label: "Data Science & AI/ML 2025" },
                        ]}
                        onChange={(val) => setBatch(val)}
                        placeholder="Select batch..."
                      />
                    </div>
                  </div>

                  {/* Upload Document / File */}
                  <div>
                    <label className="mentor-form-label">
                      Upload Document / File (PDF, DOCX, ZIP)
                    </label>
                    <div className="mentor-file-input-box">
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        className="mentor-file-input"
                      />
                    </div>
                  </div>

                  {/* Resource Link / URL (Optional) */}
                  <div>
                    <label className="mentor-form-label">
                      Resource Link / URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={resourceLink}
                      onChange={(e) => setResourceLink(e.target.value)}
                      placeholder="e.g. https://drive.google.com/... or https://..."
                      className="mentor-input-text"
                    />
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="mentor-modal-footer">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mentor-btn-cancel-modal"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="mentor-btn-submit-modal"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Uploading..." : "Publish Resource"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
