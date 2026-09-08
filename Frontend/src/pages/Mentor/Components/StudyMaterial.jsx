import React, { useState, useRef } from 'react';
import { mentorStudyMaterial as initialMaterials } from '../../../data/mentorMockData';
import { BookOpen, Plus, Download, UploadCloud, X, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import '../Styles/Students.css';
import '../Styles/SkillGaps.css';
import '../Styles/StudyMaterial.css';

export default function StudyMaterial() {
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem("mentor_study_materials");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialMaterials.length > 0 ? initialMaterials : [
      { id: 1, title: "Data Structures & Algorithms Handbook", batch: "Batch-A (CS)", category: "PDF Guide", date: "2026-08-20", downloads: 42, fileUrl: "#" },
      { id: 2, title: "React.js & Full-Stack Notes", batch: "Batch-B (IT)", category: "Lecture Deck", date: "2026-08-25", downloads: 28, fileUrl: "#" }
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    batch: "Batch-A (CS)",
    category: "PDF Guide",
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const fileUrl = selectedFile ? URL.createObjectURL(selectedFile) : "#";

    const newItem = {
      id: Date.now(),
      title: form.title.trim(),
      batch: form.batch,
      category: form.category,
      date: new Date().toISOString().split("T")[0],
      downloads: 0,
      fileName: selectedFile ? selectedFile.name : "Document.pdf",
      fileUrl: fileUrl,
    };

    const updated = [newItem, ...materials];
    setMaterials(updated);
    localStorage.setItem("mentor_study_materials", JSON.stringify(updated));

    setShowModal(false);
    setForm({ title: "", batch: "Batch-A (CS)", category: "PDF Guide" });
    setSelectedFile(null);

    setSuccessMsg("Study material uploaded & published successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDownload = (item) => {
    // Increment downloads count
    const updated = materials.map((m) =>
      m.id === item.id ? { ...m, downloads: m.downloads + 1 } : m
    );
    setMaterials(updated);
    localStorage.setItem("mentor_study_materials", JSON.stringify(updated));

    // Trigger file download
    if (item.fileUrl && item.fileUrl !== "#") {
      const a = document.createElement("a");
      a.href = item.fileUrl;
      a.download = item.fileName || `${item.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Downloading resource: "${item.title}"`);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      const updated = materials.filter((m) => m.id !== id);
      setMaterials(updated);
      localStorage.setItem("mentor_study_materials", JSON.stringify(updated));
    }
  };

  return (
    <div className="mentor-studymaterial-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <BookOpen size={20} color="#4f46e5" />
            <span>Study Material & Resources Library</span>
          </h2>
          <p className="mentor-page-subtitle">Publish lecture decks, code repositories, cheatsheets, and PDF study guides</p>
        </div>

        <button className="mentor-btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Upload New Study Material</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Resource Title</th>
                <th>Target Batch</th>
                <th>Category</th>
                <th>Published Date</th>
                <th>Total Downloads</th>
                <th className="mentor-actions-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="mentor-material-title">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" />
                      <span>{m.title}</span>
                    </div>
                  </td>
                  <td className="mentor-material-batch">{m.batch}</td>
                  <td>
                    <span className="mentor-material-tag">
                      {m.category}
                    </span>
                  </td>
                  <td className="mentor-material-date">{m.date}</td>
                  <td className="mentor-material-downloads">{m.downloads} downloads</td>
                  <td className="mentor-actions-cell">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="mentor-btn-download" onClick={() => handleDownload(m)}>
                        <Download size={14} /> Download
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => handleDelete(m.id)}
                        title="Delete Material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No study materials uploaded yet. Click "Upload New Study Material" above to add resources.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD STUDY MATERIAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <UploadCloud size={20} />
                <span>Upload Study Material</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Data Structures & Algorithms Complete Handbook"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Target Batch
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  >
                    <option value="Batch-A (CS)">Batch-A (CS)</option>
                    <option value="Batch-B (IT)">Batch-B (IT)</option>
                    <option value="Batch-C (EXTC)">Batch-C (EXTC)</option>
                    <option value="All Batches">All Batches</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="PDF Guide">PDF Guide</option>
                    <option value="Lecture Deck">Lecture Deck</option>
                    <option value="Code Repo">Code Repo</option>
                    <option value="Cheatsheet">Cheatsheet</option>
                    <option value="Assignment Brief">Assignment Brief</option>
                  </select>
                </div>
              </div>

              {/* Drag & Drop File Select Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Attach Document / File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5 text-center bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                >
                  <UploadCloud size={28} className="mx-auto text-indigo-500 mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-indigo-600">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to choose a file</p>
                      <p className="text-[10px] text-slate-400">Supports PDF, PPTX, DOCX, ZIP (Max 50MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  <UploadCloud size={14} /> Upload & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
