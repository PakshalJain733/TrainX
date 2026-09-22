import React, { useState, useEffect } from "react";
import { Bell, Save, CheckCircle2, Settings as SettingsIcon } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/ST_Settings.css";

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    notifMilestones: true,
    notifWeeklyReport: true,
    notifInterview: true,
  });

  // Load preferences from backend on mount
  useEffect(() => {
    apiFetch("/student/profile")
      .then((res) => {
        if (res && res.data) {
          const sp = res.data.studentProfile || res.data;
          setForm((prev) => ({
            notifMilestones: sp.notif_milestones !== undefined ? Boolean(sp.notif_milestones) : prev.notifMilestones,
            notifWeeklyReport: sp.notif_weekly_report !== undefined ? Boolean(sp.notif_weekly_report) : prev.notifWeeklyReport,
            notifInterview: sp.notif_interview !== undefined ? Boolean(sp.notif_interview) : prev.notifInterview,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    // Save exclusively to MySQL DB — no localStorage
    try {
      await apiFetch("/student/profile", {
        method: "PATCH",
        body: JSON.stringify({
          notif_milestones: form.notifMilestones,
          notif_weekly_report: form.notifWeeklyReport,
          notif_interview: form.notifInterview,
        }),
      });
    } catch (err) {
      console.error("[Settings] Save error:", err);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="student-page-inner profile-container">
      <div className="student-header-box">
        <h2 className="student-header-title">
          <SettingsIcon size={22} style={{ color: "#4f46e5" }} />
          <span>Preferences & Alerts</span>
        </h2>
        <p className="student-header-desc">Manage your notification preferences, automated reports, and alert configurations.</p>
      </div>

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
