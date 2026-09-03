import { useState } from "react";
import { UserCheck, Star, BookOpen, Users, Mail, Phone } from "lucide-react";
import { coordinatorMentors } from "../../../data/coordinatorMockData";
import "../Styles/Mentors.css";

export default function CoordinatorMentors() {
  const [mentors] = useState(coordinatorMentors);

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Industry Trainers & Mentors</h1>
          <p className="coord-page-sub">
            Assigned specialized industry trainers for CSE & AI-DS cohorts, ratings, and batch allocations.
          </p>
        </div>
      </div>

      <div className="coord-mentor-grid">
        {mentors.map((m) => (
          <div key={m.id} className="coord-mentor-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{m.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{m.experience} Experience</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#fffbeb",
                  color: "#b45309",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {m.rating}
              </div>
            </div>

            <div style={{ fontSize: "12px", background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#64748b", fontWeight: 600 }}>Specialization</div>
              <div style={{ fontWeight: 700, color: "#4f46e5", marginTop: "2px" }}>{m.specialization}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                <BookOpen size={14} color="#64748b" />
                Assigned Batch: <strong>{m.assignedBatch}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                <Users size={14} color="#64748b" />
                Allocated Students: <strong>{m.studentsCount} Students</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px" }}>
                <Mail size={13} /> {m.email}
              </div>
            </div>

            <button
              className="coord-btn coord-btn--primary"
              style={{ justifyContent: "center", width: "100%", marginTop: "4px" }}
              onClick={() => alert(`Re-allocate batch for ${m.name}`)}
            >
              Re-allocate Batch
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
