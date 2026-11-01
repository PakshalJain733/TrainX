import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building2, Key, ShieldCheck, Edit3, CheckCircle2, AlertCircle, X } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/TR_Batches.css";
import "../Styles/TR_Profile.css";

export function TrainerProfile() {
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", department: "", specialization: "" });
  const [saving, setSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Load fresh user record directly from database
  const loadProfile = async () => {
    try {
      const res = await apiFetch("/auth/me");
      if (res?.data) {
        setUser(res.data);
        sessionStorage.setItem("user", JSON.stringify(res.data));
        setEditForm({
          name: res.data.name || "",
          phone: res.data.phone || res.data.mobile_number || "",
          department: res.data.department || "",
          specialization: res.data.specialization || res.data.area_of_expertise || "",
        });
      }
    } catch (_err) {
      // Fallback to stored session
      try {
        const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setEditForm({
            name: parsed.name || "",
            phone: parsed.phone || parsed.mobile_number || "",
            department: parsed.department || "",
            specialization: parsed.specialization || "",
          });
        }
      } catch (_e) {}
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileFeedback(null);
    try {
      const res = await apiFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          mobile_number: editForm.phone,
          department: editForm.department,
          area_of_expertise: editForm.specialization,
          specialization: editForm.specialization,
        }),
      });
      if (res?.success) {
        setProfileFeedback({ type: "success", message: "Profile updated and saved to database successfully!" });
        await loadProfile();
        setTimeout(() => {
          setShowEditModal(false);
          setProfileFeedback(null);
        }, 1200);
      } else {
        setProfileFeedback({ type: "error", message: res?.message || "Failed to save profile." });
      }
    } catch (err) {
      setProfileFeedback({ type: "error", message: err?.message || "Error saving profile to database." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="trainer-batches-container trainer-profile-container">
      <div className="trainer-header-row">
        <div>
          <h1 className="trainer-page-title">Trainer Profile</h1>
          <p className="trainer-page-sub">Your personal details and training credentials saved in the system.</p>
        </div>

        <button
          type="button"
          className="trainer-btn-primary"
          onClick={() => {
            setEditForm({
              name: user?.name || "",
              phone: user?.phone || user?.mobile_number || "",
              department: user?.department || "",
              specialization: user?.specialization || user?.area_of_expertise || "",
            });
            setShowEditModal(true);
          }}
        >
          <Edit3 size={15} /> Edit Profile
        </button>
      </div>

      <div className="trainer-profile-card">
        <div className="trainer-profile-hero">
          <div className="trainer-profile-hero-left">
            <div className="trainer-profile-avatar-large">
              {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
            </div>

            <div>
              <h2 className="trainer-profile-name">{user?.name || "Trainer"}</h2>
              <div className="trainer-profile-badge-row">
                <span className="trainer-batch-badge joined">
                  <ShieldCheck size={13} className="trainer-profile-badge-icon" />
                  Authorized Faculty Trainer
                </span>
                <span className="trainer-profile-campus">
                  {user?.collegeName || user?.college_name || "College Campus"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="trainer-profile-grid">
          <div className="trainer-profile-info-block">
            <span className="trainer-profile-info-lbl">Email Address</span>
            <strong className="trainer-profile-info-val">{user?.email || "—"}</strong>
          </div>

          <div className="trainer-profile-info-block">
            <span className="trainer-profile-info-lbl">Contact Phone</span>
            <strong className="trainer-profile-info-val">
              {user?.phone || user?.mobile_number || "—"}
            </strong>
          </div>

          <div className="trainer-profile-info-block">
            <span className="trainer-profile-info-lbl">Department</span>
            <strong className="trainer-profile-info-val">
              {user?.department || "Computer Engineering / IT"}
            </strong>
          </div>

          <div className="trainer-profile-info-block">
            <span className="trainer-profile-info-lbl">Account Role</span>
            <strong className="trainer-profile-info-val--accent">Trainer</strong>
          </div>

          <div className="trainer-profile-info-block trainer-profile-info-block--full">
            <span className="trainer-profile-info-lbl">Area of Expertise / Specialization</span>
            <strong className="trainer-profile-info-val">
              {user?.specialization || user?.area_of_expertise || user?.target_track || "Full Stack Development & Data Structures"}
            </strong>
          </div>
        </div>

        <div className="trainer-profile-security-footer">
          <div>
            <h4 className="trainer-profile-security-title">Security & Credentials</h4>
            <span className="trainer-profile-security-sub">
              Update your account login password anytime.
            </span>
          </div>

          <div className="trainer-profile-footer-actions">
            <button
              type="button"
              className="trainer-btn-outline"
              onClick={() => setShowPasswordModal(true)}
            >
              <Key size={15} /> Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="trainer-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="trainer-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="trainer-modal-header">
              <h3 className="trainer-modal-title">Edit Trainer Profile</h3>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="trainer-modal-body">
                {profileFeedback && (
                  <div
                    className={`trainer-feedback-alert ${
                      profileFeedback.type === "success"
                        ? "trainer-feedback-alert--success"
                        : "trainer-feedback-alert--error"
                    }`}
                  >
                    {profileFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{profileFeedback.message}</span>
                  </div>
                )}

                <div className="trainer-task-form">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="trainer-field-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="trainer-field-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Department</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="trainer-field-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Specialization / Expertise</label>
                    <input
                      type="text"
                      placeholder="e.g., Java Backend, Cloud Computing, DSA"
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="trainer-field-input"
                    />
                  </div>
                </div>
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="trainer-btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="trainer-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving to Database..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

export default TrainerProfile;
