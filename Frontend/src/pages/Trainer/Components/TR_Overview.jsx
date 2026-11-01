import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Users,
  Code2,
  FileCheck2,
  PlusCircle,
  Calendar,
  ArrowRight,
  Award
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/TR_Overview.css";
import "../Styles/TR_Batches.css";

export function TrainerOverview() {
  const { openJoinModal } = useOutletContext() || {};
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (_e) {}

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/batches/my-batches");
        setBatches(res?.data || []);
      } catch (err) {
        console.error("Error loading trainer overview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalStudents = batches.reduce(
    (sum, b) => sum + (Number(b.dynamicStudentsCount || b.students || 0)),
    0
  );
  const totalTasks = batches.reduce(
    (sum, b) => sum + (Number(b.tasksCount || 0)),
    0
  );

  return (
    <div className="trainer-overview-container">
      {/* Hero Welcome Banner */}
      <div className="trainer-hero-banner">
        <div>
          <span className="trainer-hero-tag">Trainer Workspace</span>
          <h1 className="trainer-hero-title">Welcome back, {user?.name || "Trainer"}!</h1>
          <p className="trainer-hero-sub">
            Track your assigned batches, publish targeted coding challenges with custom test cases, and evaluate student submissions in real-time.
          </p>
        </div>

        <div className="trainer-hero-actions">
          <button
            type="button"
            className="trainer-btn-primary trainer-btn-hero-action"
            onClick={openJoinModal}
          >
            <PlusCircle size={16} /> Join Another Batch
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="trainer-stats-grid">
        <div className="trainer-stat-card">
          <div className="trainer-stat-icon-wrapper trainer-stat-icon--blue">
            <Users size={24} />
          </div>
          <div>
            <div className="trainer-stat-number">{batches.length}</div>
            <div className="trainer-stat-label">Joined Batches</div>
          </div>
        </div>

        <div className="trainer-stat-card">
          <div className="trainer-stat-icon-wrapper trainer-stat-icon--green">
            <Award size={24} />
          </div>
          <div>
            <div className="trainer-stat-number">{totalStudents}</div>
            <div className="trainer-stat-label">Enrolled Students</div>
          </div>
        </div>

        <div className="trainer-stat-card">
          <div className="trainer-stat-icon-wrapper trainer-stat-icon--amber">
            <Code2 size={24} />
          </div>
          <div>
            <div className="trainer-stat-number">{totalTasks}</div>
            <div className="trainer-stat-label">Batch Tasks Published</div>
          </div>
        </div>

        <div className="trainer-stat-card">
          <div className="trainer-stat-icon-wrapper trainer-stat-icon--purple">
            <FileCheck2 size={24} />
          </div>
          <div>
            <div className="trainer-stat-number">{batches.length > 0 ? "Active" : "Ready"}</div>
            <div className="trainer-stat-label">Compiler Status</div>
          </div>
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="trainer-card-panel">
        <div className="trainer-panel-header">
          <div>
            <h3 className="trainer-panel-title">My Training Batches</h3>
            <span className="trainer-panel-sub">
              Batches you have joined where you can assign tasks and view submissions.
            </span>
          </div>

          <Link to="/trainer/batches" className="trainer-btn-outline">
            Manage All Batches <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="trainer-loading-state">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="trainer-empty-state-box">
            <Users size={36} className="trainer-empty-state-icon" />
            <h4 className="trainer-empty-state-title">No batches joined yet</h4>
            <p className="trainer-empty-state-desc">
              Join batches created by your College Administrator to begin publishing problem sets.
            </p>
            <button type="button" className="trainer-btn-primary" onClick={openJoinModal}>
              <PlusCircle size={15} /> Join Batch with Code
            </button>
          </div>
        ) : (
          <div className="trainer-batch-grid">
            {batches.slice(0, 3).map((b) => (
              <div key={b.id} className="trainer-batch-card">
                <div className="trainer-batch-card-header">
                  <div>
                    <h4 className="trainer-batch-name">{b.name}</h4>
                    <span className="trainer-batch-meta">
                      <Calendar size={13} /> {b.schedule || "Scheduled Sessions"}
                    </span>
                  </div>
                  <span className="trainer-batch-badge joined">Joined</span>
                </div>

                <div className="trainer-batch-stats-row">
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val">{b.dynamicStudentsCount || b.students || 0}</span>
                    <span className="trainer-batch-stat-lbl">Students</span>
                  </div>
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val">{b.tasksCount || 0}</span>
                    <span className="trainer-batch-stat-lbl">Tasks</span>
                  </div>
                  <div className="trainer-batch-stat-item">
                    <span className="trainer-batch-stat-val trainer-text-accent">
                      {b.progress || 0}%
                    </span>
                    <span className="trainer-batch-stat-lbl">Progress</span>
                  </div>
                </div>

                <Link
                  to="/trainer/batches"
                  className="trainer-btn-primary trainer-btn-full"
                >
                  Open Workspace <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerOverview;
