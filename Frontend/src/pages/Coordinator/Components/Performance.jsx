import { useState } from "react";
import { LineChart, Search, TrendingUp, AlertTriangle, CheckCircle, BarChart3, ArrowUpRight } from "lucide-react";
import "../Styles/Performance.css";

export default function CoordinatorPerformance() {
  const [selectedBatch, setSelectedBatch] = useState("All");

  const skillGaps = [
    {
      id: 1,
      topic: "System Design & Microservices",
      batch: "CSE-2026-A",
      studentsCount: 64,
      avgScore: 54,
      targetScore: 75,
      status: "High Gap",
      recommendedAction: "Extra Doubt Solving Lab with Industry Trainer",
    },
    {
      id: 2,
      topic: "Dynamic Programming & Trees (DSA)",
      batch: "IT-2026-Beta",
      studentsCount: 52,
      avgScore: 61,
      targetScore: 80,
      status: "Moderate Gap",
      recommendedAction: "Schedule 3 LeetCode Medium Practice Sprints",
    },
    {
      id: 3,
      topic: "PyTorch & Deep Learning Pipelines",
      batch: "AI-DS-2026-Alpha",
      studentsCount: 58,
      avgScore: 82,
      targetScore: 80,
      status: "On Track",
      recommendedAction: "Advance to MLOps deployment capstone",
    },
    {
      id: 4,
      topic: "SQL Indexing & Query Optimization",
      batch: "CSE-2026-B",
      studentsCount: 61,
      avgScore: 68,
      targetScore: 75,
      status: "Moderate Gap",
      recommendedAction: "Assign 5 complex schema hands-on assignments",
    },
  ];

  const filteredGaps = selectedBatch === "All"
    ? skillGaps
    : skillGaps.filter((g) => g.batch === selectedBatch);

  return (
    <div className="coord-perf-page">
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <LineChart size={22} className="coord-header-icon" color="#4f46e5" />
            Performance & Skill Gap Analytics
          </h1>
          <p className="coord-page-sub">
            Identify batch-level learning bottlenecks, skill radar proficiencies, and targeted mentor interventions.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Overall Dept Average</div>
          <div className="coord-stat-value coord-stat-value--blue">78.4%</div>
          <div className="coord-stat-subtext">+4.2% since mid-term audit</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Identified Skill Gaps</div>
          <div className="coord-stat-value coord-stat-value--amber">3 Critical</div>
          <div className="coord-stat-subtext">System Design & DP Algorithms</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Coding Platform Active</div>
          <div className="coord-stat-value coord-stat-value--emerald">189 / 235</div>
          <div className="coord-stat-subtext">80.4% student participation</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Remedial Labs Assigned</div>
          <div className="coord-stat-value coord-stat-value--purple">6 Sessions</div>
          <div className="coord-stat-subtext">Scheduled with Mentors</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-filter-lbl">Filter by Department Batch:</div>
        <select
          className="coord-select"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="All">All Batches</option>
          <option value="CSE-2026-A">CSE-2026-A</option>
          <option value="AI-DS-2026-Alpha">AI-DS-2026-Alpha</option>
          <option value="IT-2026-Beta">IT-2026-Beta</option>
          <option value="CSE-2026-B">CSE-2026-B</option>
        </select>
      </div>

      {/* Skill Gap Cards */}
      <div className="coord-gaps-grid">
        {filteredGaps.map((g) => (
          <div key={g.id} className="coord-gap-card">
            <div className="coord-gap-top">
              <div>
                <span className="coord-badge coord-badge--batch">{g.batch}</span>
                <h3 className="coord-gap-title">{g.topic}</h3>
              </div>
              <span className={`coord-badge coord-badge--${g.status === "High Gap" ? "danger" : g.status === "Moderate Gap" ? "warning" : "success"}`}>
                {g.status}
              </span>
            </div>

            <div className="coord-gap-progress-box">
              <div className="coord-gap-progress-labels">
                <span>Current Batch Score: <strong>{g.avgScore}%</strong></span>
                <span>Target: <strong>{g.targetScore}%</strong></span>
              </div>
              <div className="coord-gap-progress-track">
                <div
                  className="coord-gap-progress-fill"
                  style={{
                    width: `${g.avgScore}%`,
                    background: g.avgScore < 60 ? "#e11d48" : g.avgScore < 75 ? "#d97706" : "#059669",
                  }}
                />
              </div>
            </div>

            <div className="coord-gap-action-box">
              <div className="coord-gap-action-lbl">Recommended Intervention:</div>
              <div className="coord-gap-action-val">{g.recommendedAction}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
