import React, { useState } from "react";
import { Bell, Save, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/ProfilePage.css";
import "../Styles/Settings.css";

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        return {
          notifMilestones: u.notifMilestones !== undefined ? u.notifMilestones : true,
          notifWeeklyReport: u.notifWeeklyReport !== undefined ? u.notifWeeklyReport : true,
          notifInterview: u.notifInterview !== undefined ? u.notifInterview : true,
        };
      }
    } catch (e) {}

    return {
      notifMilestones: true,
      notifWeeklyReport: true,
      notifInterview: true,
    };
  });

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const u = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = { ...u, ...form };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch(e) {}
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="student-page-inner profile-container">
      <SectionHeader
        eyebrow="Account Settings"
        title="Preferences & Alerts"
        description="Manage your notification preferences, automated reports, and alert configurations."
      />

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Preferences and alerts saved successfully!</span>
        </div>
      )}

      <div className="profile-form-card settings-form-card">
        <form onSubmit={handleSave}>
          <div className="profile-form-section profile-section-toggles">
            <div className="profile-section-heading">
              <Bell size={18} className="profile-heading-icon" />
              <div>
                <h3 className="profile-heading-title">Alert Configurations</h3>
                <p className="profile-heading-desc">Control automated reports, mock interview reminders, and milestone emails.</p>
              </div>
            </div>

            <div className="profile-toggle-list">
              <div className="profile-toggle-item">
                <div className="profile-toggle-text">
                  <span className="profile-toggle-title">Milestone Progress Alerts</span>
                  <span className="profile-toggle-desc">Receive real-time notifications when a milestone is completed or unlocked.</span>
                </div>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={form.notifMilestones}
                    onChange={(e) => setForm((p) => ({ ...p, notifMilestones: e.target.checked }))}
                  />
                  <span className="profile-slider round" />
                </label>
              </div>

              <div className="profile-toggle-item">
                <div className="profile-toggle-text">
                  <span className="profile-toggle-title">Weekly Mentor Report Digest</span>
                  <span className="profile-toggle-desc">Get a PDF scorecard summary of your attendance, quizzes, and mentor feedback every Friday.</span>
                </div>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={form.notifWeeklyReport}
                    onChange={(e) => setForm((p) => ({ ...p, notifWeeklyReport: e.target.checked }))}
                  />
                  <span className="profile-slider round" />
                </label>
              </div>

              <div className="profile-toggle-item">
                <div className="profile-toggle-text">
                  <span className="profile-toggle-title">AI Mock Interview Drill Reminders</span>
                  <span className="profile-toggle-desc">Remind you 1 hour before scheduled AI technical mock drills & gap evaluation sessions.</span>
                </div>
                <label className="profile-switch">
                  <input
                    type="checkbox"
                    checked={form.notifInterview}
                    onChange={(e) => setForm((p) => ({ ...p, notifInterview: e.target.checked }))}
                  />
                  <span className="profile-slider round" />
                </label>
              </div>
            </div>
          </div>

          <div className="profile-actions-bar">
            <button type="submit" className="profile-save-btn">
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
