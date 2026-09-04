import { useState } from "react";
import { AlertTriangle, Download, CheckCircle, RefreshCw } from "lucide-react";
import { coordinatorStudents, coordinatorBatches } from "../../../data/coordinatorMockData";
import "../Styles/Attendance.css";

export default function CoordinatorAttendance({ hideHeader }) {
  const [students, setStudents] = useState(coordinatorStudents);

  const defaulters = students.filter((s) => s.attendance < 75);

  const handleOverride = (id) => {
    setStudents(
      students.map((s) => (s.id === id ? { ...s, attendance: 76, riskStatus: "Good" } : s))
    );
  };

  return (
    <div>
      {!hideHeader && (
        <div className="coord-page-header">
          <div>
            <h1 className="coord-page-title">Attendance Governance & Defaulters</h1>
            <p className="coord-page-sub">
              Monitor batch-wise attendance rates, flag defaulters (&lt;75%), and grant attendance medical overrides.
            </p>
          </div>
          <button
            className="coord-btn coord-btn--primary"
            onClick={() => alert("Downloading Department Attendance Audit PDF...")}
          >
            <Download size={16} /> Export Attendance Report
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="coord-stats-grid" style={{ marginBottom: "24px" }}>
        {coordinatorBatches.map((b) => (
          <div key={b.id} className="coord-stat-card">
            <div className="coord-stat-label">{b.name}</div>
            <div className="coord-stat-value" style={{ color: b.avgAttendance >= 90 ? "#059669" : "#d97706" }}>
              {b.avgAttendance}%
            </div>
            <div className="coord-stat-subtext">{b.defaultersCount} Flagged Defaulters</div>
          </div>
        ))}
      </div>

      {/* Flagged Defaulters List */}
      <div className="coord-card">
        <div className="coord-card-title" style={{ color: "#be123c" }}>
          <AlertTriangle size={18} color="#e11d48" />
          Flagged Attendance Defaulters (&lt;75%)
        </div>

        {defaulters.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#059669", fontWeight: 700 }}>
            🎉 No attendance defaulters in CSE department!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", marginTop: "12px" }}>
            {defaulters.map((d) => (
              <div key={d.id} className="coord-defaulter-card">
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#881337" }}>{d.name}</div>
                  <div style={{ fontSize: "12px", color: "#9f1239", marginTop: "2px" }}>
                    Roll No: <strong>{d.rollNo}</strong> · {d.batch}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#e11d48" }}>{d.attendance}%</div>
                  <button
                    className="coord-btn"
                    style={{ background: "#ffffff", border: "1px solid #fecdd3", color: "#be123c", fontSize: "12px" }}
                    onClick={() => handleOverride(d.id)}
                  >
                    Grant Medical Override (+4%)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
