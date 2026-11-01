import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  PanelLeft,
  LogOut,
  PlusCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { TrainerSidebar } from "./TR_Sidebar";
import { apiFetch } from "../../../utils/api";
import ChangePasswordModal from "../../../components/ui/ChangePasswordModal";
import "../Styles/TR_Layout.css";
import "../Styles/TR_Batches.css";

export function TrainerLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (_e) {}
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const handleJoinBatchSubmit = async (e) => {
    e.preventDefault();
    const clean = joinCodeInput.trim();
    if (!clean) return;

    setJoinLoading(true);
    setJoinFeedback(null);
    try {
      const res = await apiFetch("/batches/join", {
        method: "POST",
        body: JSON.stringify({ join_code: clean }),
      });
      if (res && res.success) {
        setJoinFeedback({ type: "success", message: res.message || "Successfully joined batch as Trainer!" });
        setJoinCodeInput("");
        setTimeout(() => {
          setShowJoinModal(false);
          setJoinFeedback(null);
          window.dispatchEvent(new CustomEvent("trainer_batch_joined"));
          navigate("/trainer/batches");
        }, 1200);
      } else {
        setJoinFeedback({ type: "error", message: res?.message || "Failed to join batch. Please check the code." });
      }
    } catch (err) {
      setJoinFeedback({ type: "error", message: err?.message || "Failed to join batch. Ensure code is correct." });
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="trainer-layout-container">
      {/* Sidebar */}
      <TrainerSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenJoinModal={() => setShowJoinModal(true)}
      />

      {/* Main Content Wrapper */}
      <div className="trainer-main-wrapper">
        {/* Topbar */}
        <header className="trainer-topbar">
          <div className="trainer-topbar-left">
            <button
              type="button"
              className="trainer-toggle-btn"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              aria-label="Toggle Navigation"
            >
              <PanelLeft size={20} />
            </button>
            <span className="trainer-topbar-role-badge">
              <span>●</span> Faculty Trainer
            </span>
          </div>

          <div className="trainer-topbar-right">
            <button
              type="button"
              className="trainer-btn-primary trainer-topbar-join-btn"
              onClick={() => setShowJoinModal(true)}
            >
              <PlusCircle size={15} /> Join Batch
            </button>

            {/* Profile Pill */}
            <div className="trainer-user-pill" onClick={() => navigate("/trainer/profile")}>
              <div className="trainer-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
              </div>
              <div className="trainer-user-info">
                <span className="trainer-user-name">{user?.name || "Trainer"}</span>
                <span className="trainer-user-role">{user?.email || "Trainer Portal"}</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              className="trainer-toggle-btn trainer-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="trainer-content-area">
          <Outlet context={{ openJoinModal: () => setShowJoinModal(true) }} />
        </main>
      </div>

      {/* Join Batch Modal */}
      {showJoinModal && (
        <div className="trainer-modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="trainer-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="trainer-modal-header">
              <h3 className="trainer-modal-title">Join Training Batch</h3>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setShowJoinModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleJoinBatchSubmit}>
              <div className="trainer-modal-body">
                <p className="trainer-modal-desc">
                  Enter the <strong>Batch Join Code</strong> (e.g., <code>BTCH-0001</code>, <code>JAVA-2026</code>) provided by College Administrator to assign yourself as the Trainer for that batch.
                </p>

                {joinFeedback && (
                  <div
                    className={`trainer-feedback-alert ${
                      joinFeedback.type === "success"
                        ? "trainer-feedback-alert--success"
                        : "trainer-feedback-alert--error"
                    }`}
                  >
                    {joinFeedback.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{joinFeedback.message}</span>
                  </div>
                )}

                <div className="trainer-form-group">
                  <label className="trainer-form-label">
                    Batch Join Code:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter join code (e.g., BATCH-1 or BTCH-0001)"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="trainer-form-input"
                  />
                </div>
              </div>
              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="trainer-btn-outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="trainer-btn-primary"
                  disabled={joinLoading}
                >
                  {joinLoading ? "Joining..." : "Join Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

export default TrainerLayout;
