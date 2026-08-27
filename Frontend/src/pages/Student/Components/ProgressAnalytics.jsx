import React from "react";
import {
  TrendingUp,
  Activity,
  Award,
  CheckCircle2,
  BarChart3,
  Radar,
} from "lucide-react";
import "../Styles/ProgressAnalytics.css";

const milestonesList = [
  { name: "Python Fundamentals", pct: 100 },
  { name: "Object Oriented Programming", pct: 100 },
  { name: "SQL & Databases", pct: 55 },
  { name: "REST APIs with FastAPI", pct: 20 },
  { name: "React Frontend Basics", pct: 0 },
  { name: "Capstone Projects", pct: 0 },
  { name: "Interview Preparation", pct: 0 },
];

export default function ProgressAnalytics() {
  return (
    <div className="progress-analytics-page">
      {/* 3 Top KPIs */}
      <div className="progress-kpis-grid">
        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Milestones Completed</div>
          <p className="progress-kpi-val">2/7</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Learning Progress</div>
          <p className="progress-kpi-val progress-kpi-val--blue">62%</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Milestone Rank</div>
          <p className="progress-kpi-val progress-kpi-val--emerald">#7</p>
        </div>
      </div>

      {/* 2x2 Analytics Arena */}
      <div className="progress-charts-grid">
        {/* Weekly Progress Trajectory */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Weekly progress</h3>
          <p className="progress-chart-desc">Cumulative roadmap completion over time</p>
          <div className="progress-chart-container">
            <svg viewBox="0 0 400 200" width="100%" height="100%">
              {/* Grid lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#cbd5e1" />

              {/* Y Axis Labels */}
              <text x="25" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">80</text>
              <text x="25" y="64" fontSize="10" fill="#94a3b8" textAnchor="end">60</text>
              <text x="25" y="104" fontSize="10" fill="#94a3b8" textAnchor="end">40</text>
              <text x="25" y="144" fontSize="10" fill="#94a3b8" textAnchor="end">20</text>
              <text x="25" y="174" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

              {/* Data Line */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="
                  60,150
                  110,130
                  160,110
                  210,95
                  260,80
                  310,68
                  360,55
                "
              />

              {/* Points */}
              {[[60,150],[110,130],[160,110],[210,95],[260,80],[310,68],[360,55]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              ))}

              {/* X Axis Labels */}
              <text x="60" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W1</text>
              <text x="110" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W2</text>
              <text x="160" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W3</text>
              <text x="210" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W4</text>
              <text x="260" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W5</text>
              <text x="310" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W6</text>
              <text x="360" y="190" fontSize="11" fill="#64748b" textAnchor="middle">W7</text>
            </svg>
          </div>
        </div>

        {/* Skill Radar (Spider Chart) */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Skill radar</h3>
          <p className="progress-chart-desc">Current proficiency across target dimensions</p>
          <div className="progress-chart-container">
            <svg viewBox="0 0 300 220" width="100%" height="100%">
              {/* Concentric Polygons */}
              {[0.25, 0.5, 0.75, 1].map((scale, idx) => {
                const r = 70 * scale;
                const points = [
                  [150, 110 - r],
                  [150 + r * Math.sin(0.4 * Math.PI * 1), 110 - r * Math.cos(0.4 * Math.PI * 1)],
                  [150 + r * Math.sin(0.4 * Math.PI * 2), 110 - r * Math.cos(0.4 * Math.PI * 2)],
                  [150 + r * Math.sin(0.4 * Math.PI * 3), 110 - r * Math.cos(0.4 * Math.PI * 3)],
                  [150 + r * Math.sin(0.4 * Math.PI * 4), 110 - r * Math.cos(0.4 * Math.PI * 4)],
                ].map(p => `${p[0]},${p[1]}`).join(" ");
                return (
                  <polygon
                    key={idx}
                    points={points}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axis Spoke Lines */}
              {[0, 1, 2, 3, 4].map(i => {
                const angle = 0.4 * Math.PI * i;
                const x = 150 + 70 * Math.sin(angle);
                const y = 110 - 70 * Math.cos(angle);
                return <line key={i} x1="150" y1="110" x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
              })}

              {/* Skill Polygon Fill */}
              {/* Values: SQL (0.75), API (0.8), Data Struct (0.85), Python (0.95), Comm (0.85) */}
              <polygon
                points={`
                  ${150},${110 - 70 * 0.75}
                  ${150 + 70 * 0.8 * Math.sin(0.4 * Math.PI * 1)},${110 - 70 * 0.8 * Math.cos(0.4 * Math.PI * 1)}
                  ${150 + 70 * 0.85 * Math.sin(0.4 * Math.PI * 2)},${110 - 70 * 0.85 * Math.cos(0.4 * Math.PI * 2)}
                  ${150 + 70 * 0.95 * Math.sin(0.4 * Math.PI * 3)},${110 - 70 * 0.95 * Math.cos(0.4 * Math.PI * 3)}
                  ${150 + 70 * 0.85 * Math.sin(0.4 * Math.PI * 4)},${110 - 70 * 0.85 * Math.cos(0.4 * Math.PI * 4)}
                `}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Labels */}
              <text x="150" y="24" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">SQL Optimisation</text>
              <text x="240" y="85" fontSize="10" fontWeight="600" fill="#475569" textAnchor="start">API Design</text>
              <text x="210" y="195" fontSize="10" fontWeight="600" fill="#475569" textAnchor="start">Data Structures</text>
              <text x="90" y="195" fontSize="10" fontWeight="600" fill="#475569" textAnchor="end">Python Core</text>
              <text x="60" y="85" fontSize="10" fontWeight="600" fill="#475569" textAnchor="end">Communication</text>
            </svg>
          </div>
        </div>

        {/* Quiz Performance Bar Histogram */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Quiz performance</h3>
          <p className="progress-chart-desc">Best score per milestone quiz</p>
          <div className="progress-chart-container">
            <svg viewBox="0 0 360 200" width="100%" height="100%">
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="340" y2="30" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="75" x2="340" y2="75" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="120" x2="340" y2="120" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="40" y1="165" x2="340" y2="165" stroke="#cbd5e1" />

              {/* Y Axis Labels */}
              <text x="30" y="34" fontSize="10" fill="#94a3b8" textAnchor="end">100</text>
              <text x="30" y="79" fontSize="10" fill="#94a3b8" textAnchor="end">75</text>
              <text x="30" y="124" fontSize="10" fill="#94a3b8" textAnchor="end">50</text>
              <text x="30" y="169" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

              {/* Bar 1 - SQL 82% */}
              <rect x="75" y={165 - (82 * 1.35)} width="55" height={82 * 1.35} rx="4" fill="#2563eb" />
              <text x="102" y="185" fontSize="10" fill="#64748b" textAnchor="middle">Quiz 1</text>

              {/* Bar 2 - OOP 91% */}
              <rect x="165" y={165 - (91 * 1.35)} width="55" height={91 * 1.35} rx="4" fill="#2563eb" />
              <text x="192" y="185" fontSize="10" fill="#64748b" textAnchor="middle">Quiz 2</text>

              {/* Bar 3 - REST 64% */}
              <rect x="255" y={165 - (64 * 1.35)} width="55" height={64 * 1.35} rx="4" fill="#2563eb" />
              <text x="282" y="185" fontSize="10" fill="#64748b" textAnchor="middle">Quiz 3</text>
            </svg>
          </div>
        </div>

        {/* Milestone Breakdown Bars */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Milestone breakdown</h3>
          <p className="progress-chart-desc">Progress per milestone stage</p>
          <div className="milestone-breakdown-list">
            {milestonesList.map((m) => (
              <div key={m.name} className="milestone-breakdown-item">
                <div className="milestone-breakdown-top">
                  <span>{m.name}</span>
                  <span className="milestone-breakdown-pct">{m.pct}%</span>
                </div>
                <div className="milestone-breakdown-bar">
                  <div
                    className={`milestone-breakdown-fill ${m.pct === 100 ? "completed" : ""}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
