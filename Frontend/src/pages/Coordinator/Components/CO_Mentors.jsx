import { useState, useEffect } from "react";
import { UserCheck, Star, BookOpen, Users, Mail, Phone } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/CO_Mentors.css";

export default function CoordinatorMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/coordinator/mentors")
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        setMentors(list);
      })
      .catch(() => {
        apiFetch("/mentors")
          .then((res) => {
            const list = res?.data || (Array.isArray(res) ? res : []);
            setMentors(list);
          })
          .catch(() => setMentors([]));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="coord-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <Users size={22} />
          </div>
          <div>
            <h1 className="coord-page-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Industry Trainers & Mentors</h1>
            <p className="coord-page-sub" style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
              Assigned specialized industry trainers for CSE & AI-DS cohorts, ratings, and batch allocations.
            </p>
          </div>
        </div>
      </div>

      <div className="coord-mentor-grid">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>Loading mentors...</div>
        ) : mentors.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px", gridColumn: "1 / -1" }}>
            No mentors or faculty assigned yet.
          </div>
        ) : (
          mentors.map((m, idx) => (
            <div key={m.id || idx} className="coord-mentor-card">
              <div className="coord-mentor-top">
                <div className="coord-mentor-id-row">
                  <div className="coord-mentor-avatar-box">
                    {(m.name || "FM").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="coord-mentor-name">{m.name}</div>
                    <div className="coord-mentor-exp">{m.experience || "5+ Yrs"} Experience</div>
                  </div>
                </div>

                <div className="coord-mentor-rating-pill">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  {m.rating || "4.8"}
                </div>
              </div>

              <div className="coord-mentor-spec-box">
                <div className="coord-mentor-spec-lbl">Specialization</div>
                <div className="coord-mentor-spec-val">{m.specialization || m.department || "Full Stack & AI"}</div>
              </div>

              <div className="coord-mentor-details-list">
                <div className="coord-mentor-detail-row">
                  <BookOpen size={14} color="#64748b" />
                  Assigned Batch: <strong>{m.assignedBatch || m.batch || "TBD"}</strong>
                </div>
                <div className="coord-mentor-detail-row">
                  <Users size={14} color="#64748b" />
                  Allocated Students: <strong>{m.studentsCount || 0} Students</strong>
                </div>
                <div className="coord-mentor-email-row">
                  <Mail size={13} /> {m.email || "N/A"}
                </div>
              </div>

              <button
                className="coord-btn coord-btn--primary coord-mentor-action-btn"
                onClick={() => alert(`Re-allocate batch for ${m.name}`)}
              >
                Re-allocate Batch
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
