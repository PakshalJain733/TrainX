import React, { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AdminQuizzes.css";

const initialQuizzes = [
  { id: 1, title: "Python Basics Quiz 1", batch: "Python Backend", questions: 10, status: "Active", submissions: 38 },
  { id: 2, title: "SQL Advanced Concepts", batch: "Full Stack", questions: 8, status: "Active", submissions: 42 },
  { id: 3, title: "React Hooks Assessment", batch: "React Frontend", questions: 12, status: "Draft", submissions: 0 },
  { id: 4, title: "DSA Fundamentals Test", batch: "All Batches", questions: 15, status: "Completed", submissions: 480 },
];

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("All Batches");
  const [questions, setQuestions] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    setQuizzes([...quizzes, { id: Date.now(), title, batch, questions: parseInt(questions) || 10, status: "Draft", submissions: 0 }]);
    setTitle(""); setShowForm(false);
  };

  const handleDelete = (id) => setQuizzes(quizzes.filter(q => q.id !== id));

  const statusVariant = (s) => s === "Active" ? "success" : s === "Completed" ? "default" : "outline";

  return (
    <div className="admin-quizzes-container">
      <div className="quizzes-header-row">
        <div>
          <h2 className="quizzes-title">Manage Quizzes</h2>
          <p className="quizzes-subtitle">Create and track quiz assessments across batches.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="add-quiz-btn">
          <Plus size={16} /> {showForm ? "Cancel" : "Create Quiz"}
        </button>
      </div>

      {showForm && (
        <Card className="quiz-add-card">
          <CardContent>
            <form onSubmit={handleAdd} className="quiz-add-form">
              <div className="form-group">
                <label>Quiz Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Python OOP Assessment" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Batch</label>
                  <select value={batch} onChange={e => setBatch(e.target.value)}>
                    <option>All Batches</option>
                    <option>Python Backend</option>
                    <option>React Frontend</option>
                    <option>Full Stack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Questions</label>
                  <input type="number" value={questions} onChange={e => setQuestions(e.target.value)} placeholder="e.g. 10" />
                </div>
              </div>
              <button type="submit" className="quiz-submit-btn">Create Quiz</button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="quizzes-grid">
        {quizzes.map(q => (
          <Card key={q.id} className="quiz-card">
            <CardContent className="quiz-card-body">
              <div className="quiz-icon-wrap">
                <GraduationCap size={20} />
              </div>
              <div className="quiz-info">
                <h4 className="quiz-name">{q.title}</h4>
                <div className="quiz-meta">
                  <span className="quiz-batch-tag">{q.batch}</span>
                  <span className="quiz-questions">{q.questions} Qs</span>
                  <span className="quiz-submissions">{q.submissions} submissions</span>
                </div>
              </div>
              <div className="quiz-right">
                <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                <button className="quiz-delete-btn" onClick={() => handleDelete(q.id)}>
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
