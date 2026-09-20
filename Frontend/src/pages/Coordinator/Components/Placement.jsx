import { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import apiFetch from "../../../utils/api";
import "../Styles/Placement.css";

export default function CoordinatorPlacement({ hideHeader }) {
  const [drives, setDrives] = useState([]);
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch("/drives"),
      apiFetch("/coordinator/students"),
    ])
      .then(([driveRes, studentRes]) => {
        if (!mounted) return;
        setDrives(driveRes?.drives || driveRes?.results || []);
        setSchoolStudents(studentRes?.students || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load placement data");
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading placement data...</div>;
  }

  if (error) {
    return <div style={{ padding: "48px", textAlign: "center", color: "#e11d48" }}>{error}</div>;
  }

  return (
    <div>
      {!hideHeader && (
        <div className="coord-page-header">
          <div>
            <h1 className="coord-page-title">Placement Readiness & Mock Recruitment Drives</h1>
            <p className="coord-page-sub">
              Track student registrations, tier-1 partner recruitment drives, and placed candidate records.
            </p>
          </div>
        </div>
      )}

      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Placed Students (CSE)</div>
          <div className="coord-stat-value coord-stat-val--emerald">
            0 Students
          </div>
          <div className="coord-stat-subtext">Placement records not available yet</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Active Recruitment Drives</div>
          <div className="coord-stat-value coord-stat-val--indigo">
            {drives.length} Drives
          </div>
          <div className="coord-stat-subtext">Partner drives</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Dept Readiness Index</div>
          <div className="coord-stat-value coord-stat-val--amber" style={{ color: "#e11d48" }}>
            N/A
          </div>
          <div className="coord-stat-subtext">No readiness assessment data available</div>
        </div>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <Briefcase size={18} color="#4f46e5" />
          Partner Placement & Mock Drives
        </div>

        {drives.length === 0 ? (
          <p style={{ padding: "28px", textAlign: "center", color: "#94a3b8", margin: 0 }}>
            No partner placement or mock drives are available at this time.
          </p>
        ) : (
          <div className="coord-drive-list">
            {drives.map((d) => (
              <div key={d.id} className="coord-drive-card">
                <div className="coord-drive-header">
                  <div>
                    <div className="coord-drive-company">{d.company || d.title}</div>
                    <div className="coord-drive-role">{d.role || d.description || "Placement Drive"}</div>
                  </div>
                  <span
                    className={String(d.status || "Active").includes("Active") ? "coord-drive-status--active" : "coord-drive-status--placed"}
                  >
                    {d.status || "Active"}
                  </span>
                </div>

                <div className="coord-drive-meta">
                  <span>Drive Date: <strong>{d.driveDate || d.date || "—"}</strong></span>
                  <span>Registered: <strong>{d.registeredCount || 0} Students</strong></span>
                  <span>Cutoff: <strong>{d.cutoffScore || "—"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}