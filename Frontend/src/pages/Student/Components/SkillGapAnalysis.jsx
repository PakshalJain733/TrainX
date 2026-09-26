import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Gauge,
  Target,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Lightbulb,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/SkillGapAnalysis.css";

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const priorityBadgeClass = (priority) => {
  const p = String(priority || "").toLowerCase();
  if (p === "high") return "skillg-priority-badge--high";
  if (p === "medium") return "skillg-priority-badge--medium";
  return "skillg-priority-badge--low";
};

const severityClass = (severity) => {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return "skillg-severity--critical";
  return "skillg-severity--moderate";
};

const scoreColorClass = (value) => {
  if (value < 50) return "skillg-score-value--critical";
  if (value < 65) return "skillg-score-value--moderate";
  return "skillg-score-value--ok";
};

export default function SkillGapAnalysis() {
  const [status, setStatus] = useState("loading"); // loading | success | error | auth
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadGaps = useCallback(async () => {
    const token = (sessionStorage.getItem("token") || localStorage.getItem("token"));
    if (!token) {
      setErrorMsg("Your session has expired. Please log in again.");
      setStatus("auth");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const res = await apiFetch("/skill-gaps/my-gaps");

    if (res && res.data) {
      setReport(res.data);
      setStatus("success");
      return;
    }

    const message = (res && res.error) || "Could not load your skill gap data.";
    setErrorMsg(message);

    const isAuthError =
      (res && res.status === 401) ||
      /expired|invalid|unauthorized|token|session/i.test(message);

    setStatus(isAuthError ? "auth" : "error");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadGaps(), 0);
    return () => clearTimeout(timer);
  }, [loadGaps]);

  const weakTopics = report && Array.isArray(report.weakTopics) ? report.weakTopics : [];
  const totalWeak = weakTopics.length;
  const highPriority = weakTopics.filter(
    (w) => String(w.priority || "").toLowerCase() === "high"
  ).length;
  const avgSkill = totalWeak
    ? weakTopics.reduce((sum, w) => sum + toNumber(w.avgScore), 0) / totalWeak
    : 0;

  const renderLoading = () => (
    <div className="skillg-state-card skillg-state-card--center">
      <div className="skillg-spinner">
        <Loader2 size={34} className="skillg-spinner-icon" />
      </div>
      <h3 className="skillg-state-title">Analyzing your performance data...</h3>
      <p className="skillg-state-desc">
        Computing skill scores from your recent assessments and coding submissions.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="skillg-state-card skillg-state-card--center">
      <div className="skillg-state-icon-box skillg-state-icon-box--error">
        <AlertTriangle size={26} />
      </div>
      <h3 className="skillg-state-title">Could not load skill gap data</h3>
      <p className="skillg-state-desc">{errorMsg}</p>
      <button className="skillg-retry-btn" onClick={loadGaps}>
        <RefreshCw size={15} /> Try Again
      </button>
    </div>
  );

  const renderAuth = () => (
    <div className="skillg-state-card skillg-state-card--center">
      <div className="skillg-state-icon-box skillg-state-icon-box--auth">
        <ShieldCheck size={26} />
      </div>
      <h3 className="skillg-state-title">Session expired</h3>
      <p className="skillg-state-desc">
        {errorMsg} Please sign in again to view your skill gap analysis.
      </p>
      <Link to="/" className="skillg-login-btn">
        Go to Login
      </Link>
    </div>
  );

  const renderEmpty = () => (
    <div className="skillg-state-card skillg-state-card--center">
      <div className="skillg-state-icon-box skillg-state-icon-box--ok">
        <CheckCircle2 size={26} />
      </div>
      <h3 className="skillg-state-title">No skill gaps detected. Keep practicing!</h3>
      <p className="skillg-state-desc">
        Your current assessment and coding performance shows no weak areas below the 65%
        threshold. Great work — stay consistent.
      </p>
    </div>
  );

  const renderSummaryCards = () => (
    <div className="skillg-kpis-grid">
      <div className="skillg-kpi-card">
        <div className="skillg-kpi-header">
          <span className="skillg-kpi-label">Total Weak Skills</span>
          <div className="skillg-kpi-icon-box skillg-kpi-icon-box--indigo">
            <Target size={18} />
          </div>
        </div>
        <p className="skillg-kpi-val skillg-kpi-val--indigo">{totalWeak}</p>
        <p className="skillg-kpi-sub">below 65% proficiency threshold</p>
      </div>

      <div className="skillg-kpi-card">
        <div className="skillg-kpi-header">
          <span className="skillg-kpi-label">High Priority Skills</span>
          <div className="skillg-kpi-icon-box skillg-kpi-icon-box--amber">
            <AlertTriangle size={18} />
          </div>
        </div>
        <p className="skillg-kpi-val skillg-kpi-val--amber">{highPriority}</p>
        <p className="skillg-kpi-sub">need immediate attention</p>
      </div>

      <div className="skillg-kpi-card">
        <div className="skillg-kpi-header">
          <span className="skillg-kpi-label">Average Skill Score</span>
          <div className="skillg-kpi-icon-box skillg-kpi-icon-box--emerald">
            <TrendingUp size={18} />
          </div>
        </div>
        <p className={`skillg-kpi-val ${scoreColorClass(avgSkill)}`}>
          {Math.round(avgSkill)}%
        </p>
        <p className="skillg-kpi-sub">across identified weak areas</p>
      </div>
    </div>
  );

  const renderSkillList = () => (
    <div className="skillg-list-section">
      <div className="skillg-section-title-row">
        <div>
          <h3 className="skillg-section-heading">Skills Needing Improvement</h3>
          <p className="skillg-section-subheading">
            Focused areas where your performance is below the 65% target
          </p>
        </div>
        <button className="skillg-refresh-btn" onClick={loadGaps} title="Refresh data">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="skillg-list">
        {weakTopics.map((w, idx) => {
          const avg = toNumber(w.avgScore);
          const def = toNumber(w.deficiencyRate, 100 - avg);
          const priority = w.priority || (avg < 50 ? "High" : avg < 60 ? "Medium" : "Low");
          return (
            <div className="skillg-skill-card" key={`${w.topic}-${idx}`}>
              <div className="skillg-skill-top">
                <div className="skillg-skill-title-wrap">
                  <div className="skillg-skill-icon">
                    <Gauge size={20} />
                  </div>
                  <div className="skillg-skill-title-block">
                    <h4 className="skillg-skill-name">{w.topic}</h4>
                    {w.category && <span className="skillg-skill-category">{w.category}</span>}
                  </div>
                </div>
                <span className={`skillg-priority-badge ${priorityBadgeClass(priority)}`}>
                  {priority} Priority
                </span>
              </div>

              <div className="skillg-skill-metrics">
                <div className="skillg-metric skillg-metric--score">
                  <span className="skillg-metric-label">Current Score</span>
                  <span className={`skillg-metric-value ${scoreColorClass(avg)}`}>
                    {Math.round(avg)}%
                  </span>
                  <div className="skillg-score-track">
                    <div
                      className="skillg-score-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, avg))}%`,
                        background:
                          avg < 50
                            ? "#ef4444"
                            : avg < 65
                            ? "#f59e0b"
                            : "#10b981",
                      }}
                    />
                  </div>
                </div>

                <div className="skillg-metric">
                  <span className="skillg-metric-label">Deficiency</span>
                  <span className="skillg-metric-value skillg-metric-value--deficiency">
                    {Math.round(def)}%
                  </span>
                </div>

                <div className="skillg-metric">
                  <span className="skillg-metric-label">Severity</span>
                  <span className={`skillg-severity ${severityClass(w.severity)}`}>
                    {w.severity || "Moderate"}
                  </span>
                </div>
              </div>

              {w.recommendation && (
                <div className="skillg-reco">
                  <Lightbulb size={15} className="skillg-reco-icon" />
                  <span>{w.recommendation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (status === "loading") {
    return <div className="skillg-page">{renderLoading()}</div>;
  }

  if (status === "error") {
    return <div className="skillg-page">{renderError()}</div>;
  }

  if (status === "auth") {
    return <div className="skillg-page">{renderAuth()}</div>;
  }

  return (
    <div className="skillg-page">
      <div className="skillg-header-row">
        <SectionHeader
          eyebrow="AI Skill Diagnostics"
          title="Skill Gap Analysis"
          description="Personalized view of concepts where your performance needs improvement, with actionable recommendations."
        />
      </div>

      {renderSummaryCards()}

      {totalWeak === 0 ? renderEmpty() : renderSkillList()}
    </div>
  );
}