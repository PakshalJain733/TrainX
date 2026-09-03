import React, { useState } from "react";
import { Plus, Trash2, Terminal } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AdminPracticeProblems.css";

const initialProblems = [
  { id: 1, title: "Two Sum - Array Manipulation", batch: "All Batches", difficulty: "Easy", tags: ["Arrays", "HashMaps"] },
  { id: 2, title: "Reverse a Linked List", batch: "Full Stack", difficulty: "Medium", tags: ["Linked Lists"] },
  { id: 3, title: "Binary Search Tree - Inorder", batch: "Python Backend", difficulty: "Medium", tags: ["Trees", "Recursion"] },
  { id: 4, title: "LRU Cache Implementation", batch: "All Batches", difficulty: "Hard", tags: ["Design", "HashMaps"] },
];

const diffVariant = (d) => d === "Easy" ? "success" : d === "Medium" ? "default" : "destructive";

export default function AdminPracticeProblems() {
  const [problems, setProblems] = useState(initialProblems);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [difficulty, setDifficulty] = useState("Medium");
  const [tags, setTags] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    setProblems([...problems, { id: Date.now(), title, batch, difficulty, tags: tags.split(",").map(t => t.trim()) }]);
    setTitle(""); setTags(""); setShowForm(false);
  };

  return (
    <div className="admin-practice-container">
      <div className="practice-header-row">
        <div>
          <h2 className="practice-title">Coding Tasks</h2>
          <p className="practice-subtitle">Add and manage coding practice problems for students.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="add-problem-btn">
          <Plus size={16} /> {showForm ? "Cancel" : "Add Problem"}
        </button>
      </div>

      {showForm && (
        <Card className="practice-add-card">
          <CardContent>
            <form onSubmit={handleAdd} className="practice-add-form">
              <div className="form-group">
                <label>Problem Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dijkstra's Shortest Path" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Batch</label>
                  <select value={batch} onChange={e => setBatch(e.target.value)}>
                    <option>All Batches</option>
                    <option>Python Backend</option>
                    <option>React Frontend</option>
                    <option>Full Stack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Graphs, BFS, Shortest Path" />
              </div>
              <button type="submit" className="practice-submit-btn">Add Problem</button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="practice-problems-list">
        {problems.map(p => (
          <Card key={p.id} className="problem-card">
            <CardContent className="problem-card-body">
              <div className="problem-icon-wrap">
                <Terminal size={18} />
              </div>
              <div className="problem-info">
                <h4 className="problem-name">{p.title}</h4>
                <div className="problem-tags">
                  {p.tags.map(t => <span key={t} className="problem-tag">{t}</span>)}
                </div>
              </div>
              <div className="problem-right">
                <span className="problem-batch">{p.batch}</span>
                <Badge variant={diffVariant(p.difficulty)}>{p.difficulty}</Badge>
                <button className="problem-delete-btn" onClick={() => setProblems(problems.filter(x => x.id !== p.id))}>
                  <Trash2 size={15} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
