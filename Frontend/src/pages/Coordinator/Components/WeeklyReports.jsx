import { useState } from "react";
import { FileSpreadsheet, Download, CheckCircle, FileText } from "lucide-react";
import { coordinatorWeeklyReports } from "../../../data/coordinatorMockData";
import "../Styles/WeeklyReports.css";

export default function CoordinatorWeeklyReports() {
  const [reports] = useState(coordinatorWeeklyReports);

  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">Governance & Audit Reports</h1>
          <p className="coord-page-sub">
            Weekly department training governance logs, defaulter counseling audits, and PDF compliance reports.
          </p>
        </div>
        <button
          className="coord-btn coord-btn--primary"
          onClick={() => alert("Generating & Downloading Week 36 Governance PDF Audit Report...")}
        >
          <Download size={16} /> Generate Audit PDF
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {reports.map((rep) => (
          <div key={rep.id} className="coord-report-card">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{rep.title}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Target: {rep.batch} · Date: {rep.date} · Size: {rep.fileSize}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#ecfdf5",
                  color: "#047857",
                }}
              >
                {rep.status}
              </span>
              <button
                className="coord-btn"
                style={{ background: "#f1f5f9", color: "#334155", fontSize: "12px" }}
                onClick={() => alert(`Downloading ${rep.title}`)}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
