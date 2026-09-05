import React, { useState, useEffect } from "react";
import { Plus, Users, Calendar, ArrowRight, Key, Copy, Check, RefreshCw, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminBatches.css";

import { apiFetch } from "../../../utils/api";

const CODE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const generateJoinCode = (batchName = "") => {
  const clean = batchName.replace(/[^a-zA-Z0-9]/g, "");
  const prefix = clean ? clean.slice(0, 4).toUpperCase() : "BTCH";
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomPart}`;
};

const formatTimeRemaining = (expiresAt, now) => {
  if (!expiresAt) return { expired: true, text: "Expired", seconds: 0 };
  const expNum = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : Number(expiresAt);
  const diffMs = expNum - now;
  if (diffMs <= 0 || isNaN(diffMs)) {
    return { expired: true, text: "Expired", seconds: 0 };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    expired: false,
    text: `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
    seconds: totalSeconds,
  };
};

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [mentor, setMentor] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        const normalized = res.data.map((b) => ({
          ...b,
          joinCode: b.join_code || b.joinCode,
          codeExpiresAt: b.code_expires_at || b.codeExpiresAt,
          students: b.students || 0,
        }));
        setBatches(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch batches from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Ticking timer for real-time countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenForm = () => {
    const nextState = !showAddForm;
    setShowAddForm(nextState);
    if (nextState && !joinCode) {
      setJoinCode(generateJoinCode(name));
    }
  };

  const handleGenerateFormCode = () => {
    setJoinCode(generateJoinCode(name || "BATCH"));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !schedule || !mentor) return;
    setSubmitting(true);
    const finalCode = joinCode.trim() || generateJoinCode(name);
    const expiresAt = Date.now() + CODE_DURATION_MS;

    const payload = {
      name: name.trim(),
      schedule: schedule.trim(),
      mentor: mentor.trim(),
      join_code: finalCode,
      code_expires_at: expiresAt,
      students: 0,
      status: "active",
      college_id: 1,
    };

    try {
      const res = await apiFetch("/batches", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        setName("");
        setSchedule("");
        setMentor("");
        setJoinCode("");
        setShowAddForm(false);
        fetchBatches();
      }
    } catch (err) {
      console.error("Failed to save batch to DB:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (id, code, isExpired) => {
    if (!code || isExpired) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerateCode = async (id, batchName) => {
    const newCode = generateJoinCode(batchName);
    const newExpiresAt = Date.now() + CODE_DURATION_MS;

    // Optimistically update UI
    setBatches(
      batches.map((b) =>
        b.id === id
          ? {
              ...b,
              joinCode: newCode,
              join_code: newCode,
              codeExpiresAt: newExpiresAt,
              code_expires_at: newExpiresAt,
            }
          : b
      )
    );

    try {
      await apiFetch(`/batches/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          join_code: newCode,
          code_expires_at: newExpiresAt,
        }),
      });
    } catch (err) {
      console.error("Failed to update regenerated code in DB:", err);
    }
  };

  return (
    <div className="admin-batches-container">
      <SectionHeader
        title="Manage Batches"
        description="Create cohorts, assign mentors, and generate unique batch join access codes."
        action={
          <Button onClick={handleOpenForm} className="create-batch-btn">
            <Plus size={16} /> {showAddForm ? "Cancel" : "Create New Batch"}
          </Button>
        }
      />

      {showAddForm && (
        <Card className="add-batch-card">
          <CardHeader>
            <CardTitle>Create Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="add-batch-form">
              <div className="form-group">
                <label>Batch Name *</label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!joinCode || joinCode.startsWith("BTCH") || joinCode.startsWith("BATC")) {
                      setJoinCode(generateJoinCode(e.target.value));
                    }
                  }}
                  placeholder="e.g. Node.js Backend - Cohort A"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weekly Schedule *</label>
                  <input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g. Mon, Wed - 11:00 AM"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Mentor / Faculty *</label>
                  <input
                    value={mentor}
                    onChange={(e) => setMentor(e.target.value)}
                    placeholder="e.g. Dr. Kulkarni"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Join Batch Code</label>
                <div className="batch-code-input-wrap">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NODE-A7X9"
                  />
                  <button type="button" className="batch-code-gen-btn" onClick={handleGenerateFormCode} title="Auto-generate join code">
                    <Sparkles size={14} /> Generate Code
                  </button>
                </div>
                <span className="form-hint">Students can use this code to self-enroll into this batch.</span>
              </div>

              <Button type="submit" className="submit-batch-btn">Create Batch</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="batches-grid">
        {batches.length === 0 ? (
          <div className="admin-empty-state-card">
            <Users size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No batches created yet</p>
            <p className="admin-empty-state-sub">Click "Create New Batch" to add cohorts, assign mentors, and create student join codes.</p>
          </div>
        ) : (
          batches.map((b) => {
            const timerInfo = formatTimeRemaining(b.codeExpiresAt, now);
            return (
              <Card key={b.id} className="batch-card">
                <CardHeader className="batch-card-header">
                  <div className="batch-icon-container">
                    <Users size={20} />
                  </div>
                  <div className="batch-header-text">
                    <CardTitle className="batch-name">{b.name}</CardTitle>
                    <p className="batch-mentor">Mentor: {b.mentor}</p>
                  </div>
                </CardHeader>
                <CardContent className="batch-card-body">
                  <div className="batch-meta-item">
                    <Users size={16} />
                    <span>{b.students} Enrolled Students</span>
                  </div>
                  <div className="batch-meta-item">
                    <Calendar size={16} />
                    <span>{b.schedule}</span>
                  </div>

                  {/* Join Code Box with Dynamic 5-Min Expiry */}
                  <div className={`batch-join-code-section ${timerInfo.expired ? "batch-join-code-section--expired" : ""}`}>
                    <div className="batch-join-code-header">
                      <span className="batch-join-code-label">
                        <Key size={13} /> Join Batch Code
                      </span>
                      <div className="batch-code-header-right">
                        <span className={`batch-code-expiry-badge ${timerInfo.expired ? "batch-code-expiry-badge--expired" : ""}`}>
                          {timerInfo.expired ? (
                            <>
                              <AlertTriangle size={11} /> Expired
                            </>
                          ) : (
                            <>
                              <Clock size={11} /> {timerInfo.text}
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          className="batch-code-refresh-btn"
                          onClick={() => handleRegenerateCode(b.id, b.name)}
                          title="Generate new 5-min code"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="batch-join-code-display">
                      <span className={`batch-join-code-val ${timerInfo.expired ? "batch-join-code-val--expired" : ""}`}>
                        {b.joinCode || "NO-CODE"}
                      </span>
                      {timerInfo.expired ? (
                        <button
                          type="button"
                          className="batch-renew-code-btn"
                          onClick={() => handleRegenerateCode(b.id, b.name)}
                          title="Generate a new active 5-minute code"
                        >
                          <RefreshCw size={12} /> Renew Code
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`batch-copy-code-btn ${copiedId === b.id ? "batch-copy-code-btn--copied" : ""}`}
                          onClick={() => handleCopyCode(b.id, b.joinCode, timerInfo.expired)}
                          title="Copy Code to Clipboard"
                        >
                          {copiedId === b.id ? (
                            <>
                              <Check size={13} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> Copy Code
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {timerInfo.expired && (
                      <span className="batch-expired-hint">This code expired after 5 minutes. Click "Renew Code" to create a fresh access code.</span>
                    )}
                  </div>

                  <div className="batch-card-actions">
                    <Button variant="outline" className="batch-view-btn">
                      View Students <ArrowRight size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
