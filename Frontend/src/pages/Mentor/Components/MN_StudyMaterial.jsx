import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Plus, Download, CheckCircle2, X } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/MN_StudyMaterial.css";

const defaultMaterials = [];

export default function StudyMaterial() {
  const [materials, setMaterials] = useState(defaultMaterials);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Document");
  const [batch, setBatch] = useState("CSE 2026 Alpha Batch");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    apiFetch("/mentor/study-materials")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setMaterials(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    const newMat = {
      id: `mat-${Date.now()}`,
      title: title || "Untitled Resource",
      batch: batch,
      category: category,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      downloads: 0,
    };
    setMaterials([newMat, ...materials]);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setIsModalOpen(false);
      setTitle("");
      setFileName("");
    }, 1500);
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
                materials.map((m) => (
                  <tr key={m.id}>
                    <td className="mentor-material-title">{m.title}</td>
                    <td className="mentor-material-batch">{m.batch}</td>
                    <td>
                      <span className="mentor-material-tag">
                        {m.category}
                      </span>
                    </td>
                    <td className="mentor-material-date">{m.date}</td>
                    <td className="mentor-material-downloads">{m.downloads || 0} downloads</td>
                    <td className="mentor-actions-cell">
                      <button className="mentor-btn-download">
                        <Download size={14} /> Download
                      </button>
                    </td>
                  </tr>
                ))
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
                          { value: "Document", label: "Document" },
                          { value: "PDF Guide", label: "PDF Guide" },
                          { value: "Video Lecture", label: "Video Lecture" },
                          { value: "Web Link / URL", label: "Web Link / URL" },
                          { value: "Code Repo", label: "Code Repo" },
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
                      Upload Document / File *
                    </label>
                    <div className="mentor-file-input-box">
                      <input
                        type="file"
                        onChange={(e) => setFileName(e.target.files[0]?.name || '')}
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
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="mentor-btn-submit-modal"
                    >
                      Add Content
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
