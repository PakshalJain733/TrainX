import React, { useState } from 'react';
import { Users, Search, AlertTriangle, CheckCircle2, ShieldAlert, TrendingDown } from 'lucide-react';
import './SuperAdmin.css';

const mockStudentsRisk = [
  { id: 1, name: "Aarav Sharma",    rollNo: "CSE-2026-001", college: "PVPPCOE Mumbai",    batch: "CSE 2026 Alpha", attendance: "98%", risk: "Low Risk",      status: "Active" },
  { id: 2, name: "Tanvi Deshmukh", rollNo: "IT-2026-012",  college: "Apex Institute",     batch: "IT 2026 Beta",  attendance: "62%", risk: "High Risk",     status: "Defaulter" },
  { id: 3, name: "Karan Mehta",    rollNo: "ECS-2026-044", college: "PVPPCOE Mumbai",    batch: "ECS 2026 Alpha",attendance: "88%", risk: "Low Risk",      status: "Active" },
  { id: 4, name: "Rohan Kulkarni", rollNo: "AI-2026-033",  college: "Meridian College",  batch: "AI-DS 2026",    attendance: "71%", risk: "Moderate Risk", status: "Needs Monitoring" },
];

function RiskBadge({ risk }) {
  const color =
    risk === "Low Risk"      ? { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" } :
    risk === "Moderate Risk" ? { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" } :
                               { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" };
  return (
    <span style={{
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
      borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700,
      display: "inline-block", whiteSpace: "nowrap"
    }}>
      {risk}
    </span>
  );
}

export default function Students() {
  const [students] = useState(mockStudentsRisk);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
            <Users size={20} style={{ color: "#4f46e5" }} />
            Students Risk &amp; Participation Monitoring
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Track student engagement, attendance risk factors, and platform metrics
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sa-search-card">
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search student name, roll number, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student Name</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Roll No / Batch</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>College</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendance</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "10px",
                      background: "#eef2ff", color: "#4f46e5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "12px", flexShrink: 0
                    }}>
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", color: "#475569", fontSize: "12px" }}>
                  <div style={{ fontWeight: 600 }}>{s.rollNo}</div>
                  <div style={{ color: "#94a3b8", marginTop: "2px" }}>{s.batch}</div>
                </td>
                <td style={{ padding: "14px 16px", color: "#475569", fontWeight: 500 }}>{s.college}</td>
                <td style={{ padding: "14px 16px", color: "#059669", fontWeight: 700 }}>{s.attendance}</td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <RiskBadge risk={s.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8" }}>
            <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
            <p style={{ fontWeight: 600, margin: 0 }}>No students found</p>
          </div>
        )}
      </div>
    </div>
  );
}
