import { useState } from "react";
import { Briefcase, Award, Users, CheckCircle } from "lucide-react";
import { coordinatorPlacementDrives, coordinatorStudents } from "../../../data/coordinatorMockData";
import "../Styles/Placement.css";

export default function CoordinatorPlacement({ hideHeader }) {
  const [drives] = useState(coordinatorPlacementDrives);

  const placedStudents = coordinatorStudents.filter((s) => s.placementStatus.includes("Placed"));

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
            {placedStudents.length} Students
          </div>
          <div className="coord-stat-subtext">Avg Package: 13.0 LPA</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Active Recruitment Drives</div>
          <div className="coord-stat-value coord-stat-val--indigo">
            {drives.length} Drives
          </div>
          <div className="coord-stat-subtext">Google, Goldman Sachs, TCS</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Dept Readiness Index</div>
          <div className="coord-stat-value coord-stat-val--amber">
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

        <div className="coord-drive-list">
          {drives.map((d) => (
            <div key={d.id} className="coord-drive-card">
              <div className="coord-drive-header">
                <div>
                  <div className="coord-drive-company">{d.company}</div>
                  <div className="coord-drive-role">{d.role}</div>
                </div>
                <span
                  className={d.status.includes("Active") ? "coord-drive-status--active" : "coord-drive-status--placed"}
                >
                  {d.status}
                </span>
              </div>

              <div className="coord-drive-meta">
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
