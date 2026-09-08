import React from 'react';
import { initialPerformanceData } from '../../data/superAdminMockData';
import { TrendingUp, Award, CheckCircle2, BarChart2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import './SuperAdmin.css';

export default function Performance() {
  const data = initialPerformanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sa-page-header">
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
            <TrendingUp size={20} style={{ color: "#4f46e5" }} />
            Platform Performance &amp; Benchmarks
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Cross-college pass rate analytics, subject proficiency, and institutional readiness
          </p>
        </div>
        <button className="sa-btn-primary">
          <Award size={16} />
          <span>Export Analytics Summary</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
        {/* Card 1 */}
        <div className="sa-stats-card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: "auto" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, margin: "0 0 6px 0" }}>Overall Institutional Pass Rate</p>
            <h3 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>{data.overallPassRate}%</h3>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#059669" }}>
              <ArrowUpRight size={13} /> +3.8% vs last month
            </span>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="sa-stats-card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: "auto" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, margin: "0 0 6px 0" }}>Avg Placement Readiness Score</p>
            <h3 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>{data.avgPlacementReadiness} / 100</h3>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#4f46e5" }}>
              <ShieldCheck size={13} /> Top Tier Benchmark
            </span>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
            <BarChart2 size={22} />
          </div>
        </div>
      </div>

      {/* Subject Proficiency */}
      <div className="sa-widget-card">
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>Domain Proficiency Breakdown</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {(!data.subjectProficiency || data.subjectProficiency.length === 0) ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: "13px" }}>
              No subject proficiency data calculated yet.
            </div>
          ) : (
            data.subjectProficiency.map((item) => (
              <div key={item.subject} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 600, marginBottom: "8px" }}>
                  <span style={{ color: "#0f172a" }}>{item.subject}</span>
                  <span style={{ color: "#4f46e5" }}>{item.score}%</span>
                </div>
                <div style={{ width: "100%", background: "#e2e8f0", borderRadius: "999px", height: "6px" }}>
                  <div style={{ width: `${item.score}%`, background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)", height: "100%", borderRadius: "999px", transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* College Performance Leaderboard */}
      <div className="sa-widget-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: 0 }}>College Performance Leaderboard</h3>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>Updated today</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>College Name</th>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pass Rate</th>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Readiness Index</th>
                <th style={{ padding: "10px 20px", textAlign: "left", fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Students</th>
              </tr>
            </thead>
            <tbody>
              {(!data.collegeBenchmarks || data.collegeBenchmarks.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                    No institutional benchmark data available.
                  </td>
                </tr>
              ) : (
                data.collegeBenchmarks.map((c, i) => (
                  <tr key={c.college}
                    style={{ borderBottom: i < data.collegeBenchmarks.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "13px 20px", fontWeight: 700, color: "#0f172a" }}>{c.college}</td>
                    <td style={{ padding: "13px 20px", color: "#059669", fontWeight: 700 }}>{c.passRate}%</td>
                    <td style={{ padding: "13px 20px", fontWeight: 600, color: "#475569" }}>{c.readinessScore} / 100</td>
                    <td style={{ padding: "13px 20px", color: "#64748b" }}>{c.activeStudents}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
