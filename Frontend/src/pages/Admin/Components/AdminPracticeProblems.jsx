import React, { useState, useEffect } from "react";
import { Plus, Trash2, Terminal, Tag, Layers, Award } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/AdminPracticeProblems.css";

const diffVariant = (d) => (d === "Easy" ? "success" : d === "Medium" ? "default" : "destructive");

export default function AdminPracticeProblems() {
  const [problems, setProblems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [difficulty, setDifficulty] = useState("Medium");
  const [category, setCategory] = useState("General DSA");
  const [tags, setTags] = useState("");
  const [points, setPoints] = useState(100);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/practice-problems");
      if (res && res.data && Array.isArray(res.data)) {
        setProblems(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch practice problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchBatches();
  }, []);

  const [formError, setFormError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setFormError("");
    const selectedBatchObj = batches.find((b) => b.name === batch);

    const payload = {
      title: title.trim(),
      batch,
      batch_id: selectedBatchObj ? selectedBatchObj.id : null,
      difficulty,
      category,
      tags: tags.trim(),
      points: Number(points) || 100,
    };

    try {
      const res = await apiFetch("/admin/practice-problems", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        setTitle("");
        setTags("");
        setCategory("General DSA");
        setPoints(100);
        setShowForm(false);
        fetchProblems();
      } else {
        setFormError(res.error || "Failed to create problem. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save coding problem:", err);
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/admin/practice-problems/${id}`, {
        method: "DELETE",
      });
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete coding problem:", err);
    }
  };

  return (
    <div className="admin-practice-container">
      <SectionHeader
        title="Coding Tasks"
        description="Add and manage coding practice challenges and algorithmic tasks for student cohorts."
        action={
          <button onClick={() => setShowForm(!showForm)} className="add-problem-btn">
            <Plus size={16} /> {showForm ? "Cancel" : "Add Problem"}
          </button>
        }
      />

      {showForm && (
        <Card className="practice-add-card">
          <CardContent>
            <form onSubmit={handleAdd} className="practice-add-form">
              <div className="form-group">
                <label>Problem Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dijkstra's Shortest Path Algorithm"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assign to Batch</label>
                  <select value={batch} onChange={(e) => setBatch(e.target.value)}>
                    <option value="All Batches">All Batches (Universal)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Topic / Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Arrays & Hashing">Arrays & Hashing</option>
                    <option value="Two Pointers">Two Pointers</option>
                    <option value="Sliding Window">Sliding Window</option>
                    <option value="Linked List">Linked List</option>
                    <option value="Trees & Graphs">Trees & Graphs</option>
                    <option value="Dynamic Programming">Dynamic Programming</option>
                    <option value="Heap / Priority Queue">Heap / Priority Queue</option>
                    <option value="General DSA">General DSA</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reward Points</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. Graphs, BFS, Shortest Path, Greedy"
                />
              </div>

              {formError && (
                <div className="practice-form-error">
                  {formError}
                </div>
              )}

              <button type="submit" className="practice-submit-btn" disabled={submitting}>
                {submitting ? "Saving to Database..." : "Add Problem"}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="practice-problems-list">
        {loading ? (
          <div className="admin-empty-state-card">
            <p className="admin-empty-state-title">Loading coding tasks...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="admin-empty-state-card">
            <Terminal size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No coding tasks added yet</p>
            <p className="admin-empty-state-sub">Click "Add Problem" to create and assign coding challenges to cohorts.</p>
          </div>
        ) : (
          problems.map((p) => (
            <Card key={p.id} className="problem-card">
              <CardContent className="problem-card-body">
                <div className="problem-icon-wrap">
                  <Terminal size={18} />
                </div>
                <div className="problem-info">
                  <h4 className="problem-name">{p.title}</h4>
                  <div className="problem-meta-row">
                    <span className="problem-category-badge">
                      <Layers size={11} /> {p.category || "General DSA"}
                    </span>
                    <span className="problem-points-badge">
                      <Award size={11} /> {p.points || 100} pts
                    </span>
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="problem-tags">
                      {p.tags.map((t) => (
                        <span key={t} className="problem-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="problem-right">
                  <span className="problem-batch">{p.batch}</span>
                  <Badge variant={diffVariant(p.difficulty)}>{p.difficulty}</Badge>
                  <button
                    className="problem-delete-btn"
                    onClick={() => handleDelete(p.id)}
                    title="Delete Coding Task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
