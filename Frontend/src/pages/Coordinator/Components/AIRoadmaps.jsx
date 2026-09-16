import { useState } from "react";
import { Sparkles, Search, CheckCircle2, Clock, Users, ArrowUpRight, BookOpen, Layers } from "lucide-react";
import "../Styles/AIRoadmaps.css";

export default function CoordinatorAIRoadmaps() {
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("All");

  const roadmapsData = [
    {
      id: 1,
      role: "Full Stack Java & Spring Microservices",
      batch: "CSE-2026-A",
      studentsCount: 64,
      totalMilestones: 6,
      completedMilestones: 4,
      avgProgress: 76,
      aiModel: "Google Gemini 3.1 Flash",
      topSkill: "Spring Boot, Kafka, Docker",
      lastUpdated: "Today, 02:40 PM",
      status: "In Progress",
    },
    {
      id: 2,
      role: "AI / ML & PyTorch Deep Learning",
      batch: "AI-DS-2026-Alpha",
      studentsCount: 58,
      totalMilestones: 6,
      completedMilestones: 5,
      avgProgress: 88,
      aiModel: "Google Gemini 3.1 Flash",
      topSkill: "PyTorch, Transformers, MLOps",
      lastUpdated: "Yesterday",
      status: "Near Completion",
    },
    {
      id: 3,
      role: "Cloud Native & DevOps Infrastructure",
      batch: "IT-2026-Beta",
      studentsCount: 52,
      totalMilestones: 6,
      completedMilestones: 3,
      avgProgress: 58,
      aiModel: "Google Gemini 3.1 Flash",
      topSkill: "Kubernetes, Terraform, AWS",
      lastUpdated: "2 days ago",
      status: "In Progress",
    },
    {
      id: 4,
      role: "Fullstack MERN with Next.js 15",
      batch: "CSE-2026-B",
      studentsCount: 61,
      totalMilestones: 6,
      completedMilestones: 4,
      avgProgress: 72,
      aiModel: "Google Gemini 3.1 Flash",
      topSkill: "React, Node.js, GraphQL",
      lastUpdated: "3 days ago",
      status: "In Progress",
    },
  ];

  const filteredRoadmaps = roadmapsData.filter((r) => {
    const matchesSearch =
      r.role.toLowerCase().includes(search.toLowerCase()) ||
      r.batch.toLowerCase().includes(search.toLowerCase()) ||
      r.topSkill.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = filterBatch === "All" || r.batch === filterBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="coord-roadmaps-page">
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <Sparkles size={22} className="coord-header-icon" color="#4f46e5" />
            AI Career Roadmaps Governance
          </h1>
          <p className="coord-page-sub">
            Monitor AI-generated curriculum pathways, milestones completion, and skill adaptations across department cohorts.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Active Career Tracks</div>
          <div className="coord-stat-value" style={{ color: "#4f46e5" }}>4</div>
          <div className="coord-stat-subtext">100% powered by Gemini AI</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Enrolled Students</div>
          <div className="coord-stat-value" style={{ color: "#059669" }}>235</div>
          <div className="coord-stat-subtext">Across 4 Department Batches</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Avg Curriculum Progress</div>
          <div className="coord-stat-value" style={{ color: "#2563eb" }}>73.5%</div>
          <div className="coord-stat-subtext">+12% faster than last cycle</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Completed Milestones</div>
          <div className="coord-stat-value" style={{ color: "#7c3aed" }}>16 / 24</div>
          <div className="coord-stat-subtext">Dynamic prerequisite bypasses</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="coord-filter-bar">
        <div className="coord-search-wrap">
          <Search size={16} className="coord-search-icon" />
          <input
            type="text"
            className="coord-search-input coord-search-input--with-icon"
            placeholder="Search career role, batch or technologies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="coord-select"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        >
          <option value="All">All Batches</option>
          <option value="CSE-2026-A">CSE-2026-A</option>
          <option value="AI-DS-2026-Alpha">AI-DS-2026-Alpha</option>
          <option value="IT-2026-Beta">IT-2026-Beta</option>
          <option value="CSE-2026-B">CSE-2026-B</option>
        </select>
      </div>

      {/* Roadmaps Grid */}
      <div className="coord-roadmap-grid">
        {filteredRoadmaps.map((r) => (
          <div key={r.id} className="coord-roadmap-card">
            <div className="coord-roadmap-head">
              <span className="coord-badge coord-badge--batch">{r.batch}</span>
              <span className={`coord-badge coord-badge--${r.status === "Near Completion" ? "success" : "primary"}`}>
                {r.status}
              </span>
            </div>

            <h3 className="coord-roadmap-title">{r.role}</h3>

            <div className="coord-roadmap-skills">
              <Layers size={13} color="#64748b" />
              <span>{r.topSkill}</span>
            </div>

            <div className="coord-roadmap-meta-grid">
              <div className="coord-roadmap-meta-item">
                <Users size={14} color="#64748b" />
                <span>{r.studentsCount} Students</span>
              </div>
              <div className="coord-roadmap-meta-item">
                <BookOpen size={14} color="#64748b" />
                <span>{r.completedMilestones} / {r.totalMilestones} Milestones</span>
              </div>
            </div>

            <div className="coord-roadmap-progress-wrap">
              <div className="coord-roadmap-progress-head">
                <span className="coord-roadmap-progress-label">Batch Completion</span>
                <span className="coord-roadmap-progress-val">{r.avgProgress}%</span>
              </div>
              <div className="coord-roadmap-bar">
                <div
                  className="coord-roadmap-fill"
                  style={{ width: `${r.avgProgress}%` }}
                />
              </div>
            </div>

            <div className="coord-roadmap-footer">
              <span className="coord-roadmap-model">
                <Sparkles size={12} color="#4f46e5" /> {r.aiModel}
              </span>
              <span className="coord-roadmap-time">{r.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
