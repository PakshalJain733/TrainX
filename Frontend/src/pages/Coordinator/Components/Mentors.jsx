import { useState, useEffect } from "react";
import { UserCheck, Star, BookOpen, Users, Mail, Phone, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/Mentors.css";

export default function CoordinatorMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/coordinator/mentors")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.mentors)) setMentors(res.data.mentors);
      })
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#64748b", gap: 12 }}>
        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} />
        <p style={{ fontSize: 13 }}>Loading mentors...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Industry Trainers & Mentors</h1>
          <p className="coord-page-sub">
            Assigned faculty and industry mentors for your cohorts, batch allocations, and reachable contacts.
          </p>
        </div>
      </div>

      {mentors.length === 0 ? (
        <div className="coord-table-card" style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          No mentors assigned yet.
        </div>
      ) : (
        <div className="coord-mentor-grid">
          {mentors.map((m) => (
            <div key={m.id} className="coord-mentor-card">
              <div className="coord-mentor-top">
                <div className="coord-mentor-id-row">
                  <div className="coord-mentor-avatar-box">
                    {String(m.name || "Mentor").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="coord-mentor-name">{m.name}</div>
                    <div className="coord-mentor-exp">
                      {m.assigned_batches_count != null ? `${m.assigned_batches_count} Batch(es) Assigned` : "No batches assigned"}
                    </div>
                  </div>
                </div>

                <div className="coord-mentor-rating-pill">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  N/A
                </div>
              </div>

              <div className="coord-mentor-spec-box">
                <div className="coord-mentor-spec-lbl">Designation</div>
                <div className="coord-mentor-spec-val">Mentor</div>
              </div>

              <div className="coord-mentor-details-list">
                <div className="coord-mentor-detail-row">
                  <BookOpen size={14} color="#64748b" />
                  Assigned Batches: <strong>{(m.assigned_batches_count || 0) > 0 ? `${m.assigned_batches_count} batch(es)` : "None"}</strong>
                </div>
                <div className="coord-mentor-detail-row">
                  <Phone size={14} color="#64748b" />
                  Contact: <strong>{m.mobile_number || "—"}</strong>
                </div>
                <div className="coord-mentor-email-row">
                  <Mail size={13} /> {m.email || "—"}
                </div>
              </div>

              <button
                className="coord-btn coord-btn--primary coord-mentor-action-btn"
                onClick={() => alert(`Batch re-allocation for ${m.name} is managed by the college admin.`)}
              >
                Re-allocate Batch
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}