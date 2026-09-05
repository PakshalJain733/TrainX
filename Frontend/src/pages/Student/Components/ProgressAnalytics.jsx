import React from "react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/ProgressAnalytics.css";

const weeklyData = [
  { week: "W1", value: 15 },
  { week: "W2", value: 28 },
  { week: "W3", value: 38 },
  { week: "W4", value: 45 },
  { week: "W5", value: 52 },
  { week: "W6", value: 58 },
  { week: "W7", value: 62 },
];

const quizScores = [
  { label: "Quiz 1", score: 82, color: "#4f46e5" },
  { label: "Quiz 2", score: 91, color: "#10b981" },
  { label: "Quiz 3", score: 64, color: "#f59e0b" },
];

function DonutSegment({ cx, cy, r, strokeWidth, pct, color, offset }) {
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const gap = circumference - dash;
  const rotation = -90 + (offset / 100) * 360;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={`${dash} ${gap}`}
      strokeLinecap="round"
      transform={`rotate(${rotation} ${cx} ${cy})`}
      style={{ transition: "stroke-dasharray 0.6s ease" }}
    />
  );
}

export default function ProgressAnalytics() {
  const avgQuiz = Math.round(quizScores.reduce((a, q) => a + q.score, 0) / quizScores.length);

  return (
    <div className="progress-analytics-page stack-6">
      <SectionHeader
        eyebrow="PERFORMANCE METRICS"
        title="Student Progress Analytics"
        description="Track problem solving velocity, weekly milestones completion, accuracy trends, and quiz performance analytics."
      />

      {/* 3 Top KPIs */}
      <div className="progress-kpis-grid">
        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Problems Solved</div>
          <p className="progress-kpi-val">48</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Learning Progress</div>
          <p className="progress-kpi-val progress-kpi-val--blue">62%</p>
        </div>

        <div className="progress-kpi-card">
          <div className="progress-kpi-label">Avg Quiz Score</div>
          <p className="progress-kpi-val progress-kpi-val--emerald">{avgQuiz}%</p>
        </div>
      </div>

      {/* Charts Grid — now 1x2 */}
      <div className="progress-charts-grid progress-charts-grid--two">
        {/* Weekly Progress — Bar Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Weekly progress</h3>
          <p className="progress-chart-desc">Cumulative roadmap completion over time</p>
          <div className="progress-chart-container">
            <svg viewBox="0 0 400 210" width="100%" height="100%">
              {/* Grid */}
              <line x1="45" y1="20" x2="385" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="55" x2="385" y2="55" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="90" x2="385" y2="90" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="125" x2="385" y2="125" stroke="#f1f5f9" strokeDasharray="4" />
              <line x1="45" y1="160" x2="385" y2="160" stroke="#cbd5e1" />

              {/* Y labels */}
              <text x="35" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">80</text>
              <text x="35" y="59" fontSize="10" fill="#94a3b8" textAnchor="end">60</text>
              <text x="35" y="94" fontSize="10" fill="#94a3b8" textAnchor="end">40</text>
              <text x="35" y="129" fontSize="10" fill="#94a3b8" textAnchor="end">20</text>
              <text x="35" y="164" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

              {/* Gradient definition */}
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {/* Bars */}
              {weeklyData.map((d, i) => {
                const barH = (d.value / 80) * 140;
                const x = 60 + i * 48;
                const y = 160 - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="30" height={barH} rx="4" fill="url(#barGrad)" />
                    <text x={x + 15} y={y - 6} fontSize="10" fontWeight="700" fill="#4f46e5" textAnchor="middle">{d.value}%</text>
                    <text x={x + 15} y="178" fontSize="11" fill="#64748b" textAnchor="middle">{d.week}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Quiz Performance — Donut / Cyclic Graph */}
        <div className="progress-chart-card">
          <h3 className="progress-chart-title">Quiz performance</h3>
          <p className="progress-chart-desc">Best score per milestone quiz</p>
          <div className="progress-chart-container progress-donut-container">
            <div className="progress-donut-wrap">
              <svg viewBox="0 0 200 200" width="180" height="180">
                {/* Background track */}
                <circle cx="100" cy="100" r="75" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                {/* Segments */}
                {(() => {
                  const total = quizScores.reduce((a, q) => a + q.score, 0);
                  let offset = 0;
                  return quizScores.map((q, i) => {
                    const pct = (q.score / total) * 100;
                    const seg = (
                      <DonutSegment
                        key={i}
                        cx={100}
                        cy={100}
                        r={75}
                        strokeWidth={18}
                        pct={pct}
                        color={q.color}
                        offset={offset}
                      />
                    );
                    offset += pct;
                    return seg;
                  });
                })()}

                {/* Center Label */}
                <text x="100" y="93" textAnchor="middle" fontSize="28" fontWeight="800" fill="#0f172a">{avgQuiz}%</text>
                <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">Avg Score</text>
              </svg>
            </div>

            {/* Legend */}
            <div className="progress-donut-legend">
              {quizScores.map((q, i) => (
                <div key={i} className="donut-legend-item">
                  <span className="donut-legend-dot" style={{ background: q.color }}></span>
                  <span className="donut-legend-label">{q.label}</span>
                  <span className="donut-legend-val">{q.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

