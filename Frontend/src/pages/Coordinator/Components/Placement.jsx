import { useState } from "react";
import { Briefcase, Award, Users, CheckCircle } from "lucide-react";
import { coordinatorPlacementDrives, coordinatorStudents } from "../../../data/coordinatorMockData";
import "../Styles/Placement.css";

export default function CoordinatorPlacement() {
  const [drives] = useState(coordinatorPlacementDrives);

  const placedStudents = coordinatorStudents.filter((s) => s.placementStatus.includes("Placed"));

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Placement Readiness & Mock Recruitment Drives</h1>
          <p className="coord-page-sub">
            Track student registrations, tier-1 partner recruitment drives, and placed candidate records.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Placed Students (CSE)</div>
          <div className="coord-stat-value" style={{ color: "#059669" }}>
            {placedStudents.length} Students
          </div>
          <div className="coord-stat-subtext">Avg Package: 13.0 LPA</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Active Recruitment Drives</div>
          <div className="coord-stat-value" style={{ color: "#4f46e5" }}>
            {drives.length} Drives
          </div>
          <div className="coord-stat-subtext">Google, Goldman Sachs, TCS</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Dept Readiness Index</div>
          <div className="coord-stat-value" style={{ color: "#d97706" }}>
            84.8%
          </div>
          <div className="coord-stat-subtext">Placement Eligible: 92%</div>
        </div>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <Briefcase size={18} color="#4f46e5" />
          Partner Placement & Mock Drives
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          {drives.map((d) => (
            <div key={d.id} className="coord-drive-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>{d.company}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#4f46e5", marginTop: "2px" }}>{d.role}</div>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: d.status.includes("Active") ? "#ef4444" : "#ecfdf5",
                    color: d.status.includes("Active") ? "#ffffff" : "#047857",
                  }}
                >
                  {d.status}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "20px" }}>
                <span>Drive Date: <strong>{d.driveDate}</strong></span>
                <span>Registered: <strong>{d.registeredCount} Students</strong></span>
                <span>Cutoff: <strong>{d.cutoffScore}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
