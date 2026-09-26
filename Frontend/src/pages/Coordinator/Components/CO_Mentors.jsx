import { useState } from "react";
import { UserCheck, Star, BookOpen, Users, Mail, Phone } from "lucide-react";
import { coordinatorMentors } from "../../../data/coordinatorMockData";
import "../Styles/CO_Mentors.css";

export default function CoordinatorMentors() {
  const [mentors] = useState(coordinatorMentors);

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Industry Trainers & Mentors</h1>
          <p className="coord-page-sub">
            Assigned specialized industry trainers for CSE & AI-DS batches, ratings, and batch allocations.
          </p>
        </div>
      </div>

      <div className="coord-mentor-grid">
        {mentors.map((m) => (
          <div key={m.id} className="coord-mentor-card">
            <div className="coord-mentor-top">
              <div className="coord-mentor-id-row">
                <div className="coord-mentor-avatar-box">
                  {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="coord-mentor-name">{m.name}</div>
                  <div className="coord-mentor-exp">{m.experience} Experience</div>
                </div>
              </div>

              <div className="coord-mentor-rating-pill">
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {m.rating}
              </div>
            </div>

            <div className="coord-mentor-spec-box">
              <div className="coord-mentor-spec-lbl">Specialization</div>
              <div className="coord-mentor-spec-val">{m.specialization}</div>
            </div>

            <div className="coord-mentor-details-list">
              <div className="coord-mentor-detail-row">
                <BookOpen size={14} color="#64748b" />
                Assigned Batch: <strong>{m.assignedBatch}</strong>
              </div>
              <div className="coord-mentor-detail-row">
                <Users size={14} color="#64748b" />
                Allocated Students: <strong>{m.studentsCount} Students</strong>
              </div>
              <div className="coord-mentor-email-row">
                <Mail size={13} /> {m.email}
              </div>
            </div>

            <button
              className="coord-btn coord-btn--primary coord-mentor-action-btn"
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
