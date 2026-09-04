import { useState } from "react";
import { Plus, FileCheck2, Award, Clock } from "lucide-react";
import { coordinatorAssessments, coordinatorBatches } from "../../../data/coordinatorMockData";
import "../Styles/Assessments.css";

export default function CoordinatorAssessments() {
  const [assessments, setAssessments] = useState(coordinatorAssessments);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState(coordinatorBatches[0].name);
  const [type, setType] = useState("MCQ Quiz");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAssessment = {
      id: Date.now(),
      title,
      batch,
      type,
      dueDate: dueDate || "2026-09-10",
      submissions: "0 / 120",
      avgScore: "--",
      passRate: "--",
      status: "Active",
    };

    setAssessments([newAssessment, ...assessments]);
    setShowModal(false);
    setTitle("");
  };

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Assessments & Quiz Governance</h1>
          <p className="coord-page-sub">
            Monitor technical assessments, quiz submissions, average scores, and pass percentages.
          </p>
        </div>
        <button className="coord-btn coord-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Publish New Quiz / Test
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {assessments.map((a) => (
          <div key={a.id} className="coord-assessment-card">
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{a.title}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Target Batch: <strong style={{ color: "#334155" }}>{a.batch}</strong> · Type: {a.type} · Due: {a.dueDate}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Submissions</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{a.submissions}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Avg Score</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#4f46e5" }}>{a.avgScore}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Pass Cutoff %</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#059669" }}>{a.passRate}</div>
              </div>

              <button className="coord-btn" style={{ background: "#f1f5f9", color: "#334155", fontSize: "12px" }}>
                Scorecard
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="coord-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Publish New Assessment</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Graph Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Target Batch</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  {coordinatorBatches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Assessment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="MCQ Quiz">MCQ Quiz</option>
                  <option value="Coding Exam">Coding Exam</option>
                  <option value="Hands-on Project">Hands-on Project</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" className="coord-btn" style={{ background: "#f1f5f9" }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="coord-btn coord-btn--primary">
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
