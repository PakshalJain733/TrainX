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
        <div className="coord-profile-avatar">
          AM
        </div>
        <div>
          <h1 className="coord-profile-name">{profile.name}</h1>
          <p className="coord-profile-sub">
            {profile.role} · {profile.department} ({profile.college})
          </p>
        </div>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <User size={18} color="#4f46e5" />
          Edit Coordinator Information
        </div>

        <form onSubmit={handleSubmit} className="coord-profile-form">
          <div className="coord-form-grid-2">
            <div>
              <label className="coord-form-label">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="coord-profile-input"
              />
            </div>

            <div>
              <label className="coord-form-label">Official Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="coord-profile-input"
              />
            </div>

            <div>
              <label className="coord-form-label">Contact Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="coord-profile-input"
              />
            </div>

            <div>
              <label className="coord-form-label">Department / College</label>
              <input
                type="text"
                disabled
                value={`${profile.department} (${profile.college})`}
                className="coord-profile-input coord-profile-input--disabled"
              />
            </div>
          </div>

          <div className="coord-profile-actions">
            <button type="submit" className="coord-btn coord-btn--primary">
              <Save size={14} /> Save Profile Changes
            </button>
          </div>

          {saved && (
            <div className="coord-profile-saved-msg">
              ✓ Profile information saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
