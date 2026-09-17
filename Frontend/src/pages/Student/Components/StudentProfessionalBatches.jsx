import React, { useEffect, useState } from "react";
import {
  Code2,
  Users,
  CheckCircle2,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Trophy,
  ArrowLeft,
  ArrowUpRight,
  Hash,
  RefreshCw,
  FileCheck2,
  Layers,
  School,
} from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/StudentProfessionalBatches.css";

const asCode = (id) => `BATCH-${String(id).padStart(3, "0")}`;

const normalizeStatus = (s) => (String(s || "").toLowerCase() === "active" ? "Active" : "Inactive");

function StatusTag({ status }) {
  const active = status === "Active";
  return (
    <span className={active ? "pp-status pp-status--done" : "pp-status pp-status--muted"}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "currentColor",
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

function BatchCard({ batch, profile, onOpen }) {
  const yearDivision = batch.year && batch.division ? `${batch.year} · ${batch.division}` : profile.year ? (profile.division ? `${profile.year} · ${profile.division}` : profile.year) : "—";

  return (
    <div className="pp-card ppb-batch-card">
      <div>
        <div className="ppb-batch-top">
          <span className="pp-kpi-icon">
            <GraduationCap size={17} />
          </span>
          <StatusTag status={batch.status} />
        </div>
        <h3 className="ppb-batch-title">{batch.name}</h3>
        <p className="ppb-batch-sub">
          {batch.department_name || profile.department || "Department"}
          {batch.college_name ? ` · ${batch.college_name}` : ""}
        </p>
      </div>

      <div className="ppb-meta">
        <div className="ppb-meta-row">
          <span className="ppb-meta-label">
            <Hash size={14} /> Batch Code
          </span>
          <span className="ppb-meta-value">{batch.code}</span>
        </div>
        <div className="ppb-meta-row">
          <span className="ppb-meta-label">
            <CalendarDays size={14} /> Academic Year
          </span>
          <span className="ppb-meta-value">{batch.academic_year || "—"}</span>
        </div>
        <div className="ppb-meta-row">
          <span className="ppb-meta-label">
            <Layers size={14} /> Year &amp; Division
          </span>
          <span className="ppb-meta-value">{yearDivision}</span>
        </div>
      </div>

      <button type="button" className="ppb-open-btn" onClick={() => onOpen(batch)}>
        <span>Open Coursework</span>
        <ArrowUpRight size={15} />
      </button>
    </div>
  );
}

export default function StudentProfessionalBatches() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");

    const run = async () => {
      const meRes = await apiFetch("/student/me");
      const dashRes = await apiFetch("/student/dashboard");

      if (!meRes.data && meRes.error) {
        setError("We couldn't load your training details. Please try again.");
        setLoading(false);
        return;
      }

      const studentProfile = meRes.data && meRes.data.studentProfile;
      const leaderboardList = dashRes.data && Array.isArray(dashRes.data.leaderboard) ? dashRes.data.leaderboard : [];

      const loadedBatches = [];
      if (studentProfile && studentProfile.batch_id) {
        const ids = Array.isArray(studentProfile.batch_id) ? studentProfile.batch_id : [studentProfile.batch_id];
        for (const id of ids) {
          const res = await apiFetch(`/batches/${id}`);
          if (res.data) loadedBatches.push({ ...res.data, code: asCode(res.data.id), status: normalizeStatus(res.data.status) });
        }
      }

      setProfile(studentProfile);
      setLeaderboard(leaderboardList);
      setBatches(loadedBatches);
      setLoading(false);
    };

    run().catch(() => {
      setError("We couldn't load your training details. Please try again.");
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  /* ── Detail view ───────────────────────────────────────── */
  if (selectedBatch) {
    const b = selectedBatch;
    const yearDivision =
      b.year && b.division ? `${b.year} · ${b.division}` : profile && profile.year ? (profile.division ? `${profile.year} · ${profile.division}` : profile.year) : "—";

    return (
      <div className="ppb-stack">
        <button type="button" className="ppb-back" onClick={() => setSelectedBatch(null)}>
          <ArrowLeft size={15} />
          <span>Back to All Batches</span>
        </button>

        <div className="pp-card ppb-detail-banner">
          <div className="ppb-detail-left">
            <span className="ppb-detail-icon">
              <GraduationCap size={24} />
            </span>
            <div>
              <h2 className="ppb-detail-title">{b.name}</h2>
              <p className="ppb-detail-sub">
                {b.code} · {b.department_name || "Department"}
                {b.college_name ? ` · ${b.college_name}` : ""}
              </p>
            </div>
          </div>
          <div className="ppb-detail-right">
            <span className="pp-chip">
              <CalendarDays size={13} /> {b.academic_year || "—"}
            </span>
            <StatusTag status={b.status} />
          </div>
        </div>

        <div className="ppb-facts">
          <div className="pp-card ppb-fact">
            <span className="ppb-fact-label">Batch Code</span>
            <span className="ppb-fact-value">{b.code}</span>
          </div>
          <div className="pp-card ppb-fact">
            <span className="ppb-fact-label">Department</span>
            <span className="ppb-fact-value">{b.department_name || "—"}</span>
          </div>
          <div className="pp-card ppb-fact">
            <span className="ppb-fact-label">Year &amp; Division</span>
            <span className="ppb-fact-value">{yearDivision}</span>
          </div>
          <div className="pp-card ppb-fact">
            <span className="ppb-fact-label">Academic Year</span>
            <span className="ppb-fact-value">{b.academic_year || "—"}</span>
          </div>
        </div>

        <div className="ppb-split">
          {/* Coursework */}
          <section className="pp-card pp-panel">
            <div className="pp-panel-header">
              <div className="pp-panel-title">
                <span className="pp-panel-icon">
                  <FileCheck2 size={17} />
                </span>
                <div>
                  <h2 className="pp-heading">Coursework &amp; Tasks</h2>
                  <div className="pp-subheading">Assignments and deadlines for this cohort</div>
                </div>
              </div>
            </div>
            <div className="pp-panel-body">
              <div className="pp-empty" style={{ padding: "34px 16px" }}>
                <span className="pp-empty-icon">
                  <BookOpen size={16} />
                </span>
                <div className="pp-empty-text">No coursework published yet</div>
                <div className="pp-empty-sub">Assignments and deadlines will appear here once your instructor publishes them.</div>
              </div>
            </div>
          </section>

          {/* Leaderboard */}
          <section className="pp-card pp-panel">
            <div className="pp-panel-header">
              <div className="pp-panel-title">
                <span className="pp-panel-icon">
                  <Trophy size={17} />
                </span>
                <div>
                  <h2 className="pp-heading">Cohort Leaderboard</h2>
                  <div className="pp-subheading">Top performers in your college cohort</div>
                </div>
              </div>
            </div>
            <div className="pp-panel-body">
              {leaderboard.length === 0 ? (
                <div className="pp-empty">
                  <span className="pp-empty-icon">
                    <Trophy size={16} />
                  </span>
                  <div className="pp-empty-text">Leaderboard is not available yet</div>
                </div>
              ) : (
                leaderboard.slice(0, 6).map((item) => (
                  <div key={item.rank} className={`pp-rank-row ${item.you ? "pp-rank-you-row" : ""}`}>
                    <div className="pp-rank-main">
                      <span className="pp-rank-no">#{item.rank}</span>
                      <span
                        className="pp-avatar pp-avatar--sm pp-avatar--ink"
                        style={item.you ? { background: "var(--pp-brand)", color: "#fff", outline: "none" } : undefined}
                      >
                        {item.initials}
                      </span>
                      <div>
                        <div className={`pp-rank-name ${item.you ? "pp-rank-name--you" : ""}`}>{item.name}</div>
                        {item.badge && <div className="pp-rank-meta">{item.badge}</div>}
                      </div>
                    </div>
                    <span className="pp-rank-score">{item.score}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ppb-stack">
        <div className="ppb-head">
          <span className="ppb-eyebrow">
            <i /> Training Cohorts
          </span>
          <h1 className="ppb-title">Enrolled Training Batches</h1>
        </div>
        <div className="pp-card ppb-center-card">
          <span className="ppb-spinner" />
          <div className="ppb-center-title">Loading your batches…</div>
          <div className="ppb-center-sub">Fetching your enrollment from the college records.</div>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="ppb-stack">
        <div className="ppb-head">
          <span className="ppb-eyebrow">
            <i /> Training Cohorts
          </span>
          <h1 className="ppb-title">Enrolled Training Batches</h1>
        </div>
        <div className="pp-card ppb-center-card">
          <span className="ppb-center-icon">
            <Code2 size={18} />
          </span>
          <div className="ppb-center-title">Something went wrong</div>
          <div className="ppb-center-sub">{error}</div>
          <button type="button" className="ppb-retry" onClick={load}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty state: no batch assigned ────────────────────── */
  if (batches.length === 0) {
    return (
      <div className="ppb-stack">
        <div className="ppb-head">
          <span className="ppb-eyebrow">
            <i /> Training Cohorts
          </span>
          <h1 className="ppb-title">Enrolled Training Batches</h1>
          <p className="ppb-desc">Your assigned training cohorts, curriculum progress and learning resources.</p>
        </div>
        <div className="pp-card ppb-center-card">
          <span className="ppb-center-icon">
            <School size={18} />
          </span>
          <div className="ppb-center-title">No batches assigned yet</div>
          <div className="ppb-center-sub">
            Once your college assigns you to a training cohort, your batch details and coursework will appear here.
          </div>
        </div>
      </div>
    );
  }

  /* ── Batches list ──────────────────────────────────────── */
  const activeCount = batches.filter((b) => b.status === "Active").length;

  const batchesStats = [
    { label: "Enrolled Batches", value: String(batches.length), hint: "Assigned training cohorts", icon: Users },
    { label: "Active Now", value: String(activeCount), hint: "Currently running cohorts", icon: CheckCircle2 },
    { label: "Academic Year", value: batches[0].academic_year || "—", word: true, hint: "Current training cycle", icon: CalendarDays },
    { label: "Semester", value: profile && profile.semester ? profile.semester : "—", word: true, hint: "Your current semester", icon: GraduationCap },
  ];

  return (
    <div className="ppb-stack">
      <div className="ppb-head">
        <span className="ppb-eyebrow">
          <i /> Training Cohorts
        </span>
        <h1 className="ppb-title">Enrolled Training Batches</h1>
        <p className="ppb-desc">Your assigned training cohorts, curriculum progress and learning resources.</p>
      </div>

      <div className="pp-kpi-grid">
        {batchesStats.map((s) => (
          <div key={s.label} className="pp-card pp-kpi">
            <div className="pp-kpi-top">
              <span className="pp-kpi-icon">
                <s.icon size={17} />
              </span>
              <span className="pp-kpi-label">{s.label}</span>
            </div>
            <div className={s.word ? "pp-kpi-value--word" : "pp-kpi-value"}>{s.value}</div>
            <div className="pp-kpi-hint">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="ppb-batch-grid">
        {batches.map((b) => (
          <BatchCard key={b.id} batch={b} profile={profile} onOpen={setSelectedBatch} />
        ))}
      </div>
    </div>
  );
}