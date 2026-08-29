import React, { useState } from "react";
import { Plus, BookOpen, Video, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AdminLearningContent.css";

const initialContent = [
  { id: 1, title: "Python Fundamentals - Module 1", type: "Video", batch: "Python Backend", status: "Published" },
  { id: 2, title: "SQL Joins & Aggregations", type: "Document", batch: "Full Stack", status: "Published" },
  { id: 3, title: "React Hooks Deep Dive", type: "Video", batch: "React Frontend", status: "Draft" },
  { id: 4, title: "REST API Design Patterns", type: "Document", batch: "All Batches", status: "Published" },
];

export default function AdminLearningContent() {
  const [content, setContent] = useState(initialContent);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Video");
  const [batch, setBatch] = useState("All Batches");
  const [status, setStatus] = useState("Draft");

  const handleAdd = (e) => {
    e.preventDefault();
    setContent([...content, { id: Date.now(), title, type, batch, status }]);
    setTitle(""); setShowForm(false);
  };

  const handleDelete = (id) => setContent(content.filter(c => c.id !== id));

  return (
    <div className="admin-learning-container">
      <div className="learning-header-row">
        <div>
          <h2 className="learning-title">Manage Learning Content</h2>
          <p className="learning-subtitle">Upload and organize videos, documents, and learning resources.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="add-content-btn">
          <Plus size={16} /> {showForm ? "Cancel" : "Add Content"}
        </button>
      </div>

      {showForm && (
        <Card className="learning-add-card">
          <CardContent>
            <form onSubmit={handleAdd} className="learning-add-form">
              <div className="form-group">
                <label>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Content title..." required />
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Type</label>
                  <select value={type} onChange={e => setType(e.target.value)}>
                    <option>Video</option>
                    <option>Document</option>
                    <option>Quiz</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Batch</label>
                  <select value={batch} onChange={e => setBatch(e.target.value)}>
                    <option>All Batches</option>
                    <option>Python Backend</option>
                    <option>React Frontend</option>
                    <option>Full Stack</option>
                    <option>Data Science</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="learning-submit-btn">Add Content</button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="learning-grid">
        {content.map(c => (
          <Card key={c.id} className="learning-content-card">
            <CardContent className="learning-card-body">
              <div className="learning-card-icon">
                {c.type === "Video" ? <Video size={20} /> : <FileText size={20} />}
              </div>
              <div className="learning-card-info">
                <h4 className="learning-card-title">{c.title}</h4>
                <div className="learning-card-meta">
                  <span className="learning-card-batch">{c.batch}</span>
                  <Badge variant={c.status === "Published" ? "success" : "outline"}>{c.status}</Badge>
                </div>
              </div>
              <button className="learning-delete-btn" onClick={() => handleDelete(c.id)}>
                <Trash2 size={16} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
