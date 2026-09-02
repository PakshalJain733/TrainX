import { useState } from "react";
import { User, Mail, Phone, Building, Save, ShieldCheck } from "lucide-react";
import { coordinatorProfile } from "../../../data/coordinatorMockData";
import "../Styles/ProfilePage.css";

export default function CoordinatorProfilePage() {
  const [profile, setProfile] = useState(coordinatorProfile);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="coord-profile-header">
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#ffffff",
            color: "#4f46e5",
            fontSize: "24px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          AM
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800 }}>{profile.name}</h1>
          <p style={{ fontSize: "13px", opacity: 0.85, marginTop: "2px" }}>
            {profile.role} · {profile.department} ({profile.college})
          </p>
        </div>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <User size={18} color="#4f46e5" />
          Edit Coordinator Information
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Official Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Contact Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Department / College</label>
              <input
                type="text"
                disabled
                value={`${profile.department} (${profile.college})`}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", marginTop: "4px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="submit" className="coord-btn coord-btn--primary">
              <Save size={14} /> Save Profile Changes
            </button>
          </div>

          {saved && (
            <div style={{ color: "#059669", fontWeight: 700, fontSize: "13px" }}>
              ✓ Profile information saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
