import React, { useState, useEffect } from "react";
import { Trophy, Users, Award, Medal, Search, Sparkles, Layers } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import "../Styles/TR_Batches.css";
import "../Styles/TR_Leaderboard.css";

export function TrainerLeaderboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyBatches = async () => {
      try {
        const res = await apiFetch("/batches/my-batches");
        const list = res?.data || (Array.isArray(res) ? res : []);
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId(String(list[0].id));
        }
      } catch (_e) {
        setBatches([]);
      }
    };
    fetchMyBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    const fetchLb = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/leaderboard/batch?batchId=${selectedBatchId}`);
        const list = res?.data || (Array.isArray(res) ? res : []);
        setLeaderboard(list);
      } catch (_e) {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLb();
  }, [selectedBatchId]);

  const selectedBatch = batches.find((b) => String(b.id) === String(selectedBatchId));

  const filteredLeaderboard = leaderboard.filter((st) => {
    const name = (st.name || st.student_name || "").toLowerCase();
    const roll = (st.roll_number || "").toLowerCase();
    const dept = (st.department || st.sub || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || roll.includes(q) || dept.includes(q);
  });

  const getInitials = (name) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="trainer-batches-container">
      {/* Header */}
      <div className="trainer-header-row">
        <div className="trainer-header-title-group">
          <div className="trainer-page-icon-box">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="trainer-page-title">Batch Leaderboards</h1>
            <p className="trainer-page-sub">
              Track student rankings, problems solved, and total XP points specifically for each joined batch.
            </p>
          </div>
        </div>

        {/* Batch Selector */}
        {batches.length > 0 && (
          <div className="trainer-batch-selector-box">
            <span className="trainer-batch-selector-label">
              <Layers size={15} className="trainer-selector-icon" /> Select Batch:
            </span>
            <div className="trainer-batch-selector-dropdown">
              <CustomSelect
                value={selectedBatchId}
                onChange={(val) => setSelectedBatchId(val)}
                options={batches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="Select Batch..."
                className="trainer-header-select"
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Bar for this batch */}
      {leaderboard.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "12px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
            Showing rankings for: <strong>{selectedBatch?.name || "Selected Batch"}</strong> ({filteredLeaderboard.length} students)
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
            <Search size={14} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", minWidth: "220px" }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard Table Card */}
      <div className="trainer-lb-card">
        {loading ? (
          <div className="trainer-lb-loading">Loading leaderboard for {selectedBatch?.name || "batch"}...</div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="trainer-lb-empty-box">
            <Trophy size={44} className="trainer-lb-trophy-icon" />
            <h3 className="trainer-lb-empty-title">
              No student activity in {selectedBatch?.name || "this batch"} yet
            </h3>
            <p className="trainer-lb-empty-sub">
              Students will be ranked here automatically according to their scores and solved tasks.
            </p>
          </div>
        ) : (
          <div className="trainer-lb-table-wrapper">
            <table className="trainer-lb-table">
              <thead>
                <tr className="trainer-lb-table-head-row">
                  <th className="trainer-lb-th trainer-lb-th--rank">Rank</th>
                  <th className="trainer-lb-th">Student Name</th>
                  <th className="trainer-lb-th">Department</th>
                  <th className="trainer-lb-th">Tasks / Problems Solved</th>
                  <th className="trainer-lb-th">Total XP / Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((lb, idx) => {
                  const studentName = lb.name || lb.student_name || "Student";
                  const rankNum = lb.rank || idx + 1;
                  const scoreVal = lb.score !== undefined ? lb.score : (lb.total_points || lb.xp || lb.overall_score || 0);

                  return (
                    <tr key={lb.id || lb.user_id || idx} className="trainer-lb-row">
                      <td className="trainer-lb-td trainer-lb-td--rank">
                        <span
                          className={`trainer-lb-rank-badge ${
                            rankNum === 1
                              ? "trainer-lb-rank-badge--1"
                              : rankNum === 2
                              ? "trainer-lb-rank-badge--2"
                              : rankNum === 3
                              ? "trainer-lb-rank-badge--3"
                              : ""
                          }`}
                        >
                          #{rankNum}
                        </span>
                      </td>

                      <td className="trainer-lb-td trainer-lb-td--student">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: rankNum === 1 ? "#fef3c7" : "#e0e7ff",
                            color: rankNum === 1 ? "#b45309" : "#3730a3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "12px"
                          }}>
                            {getInitials(studentName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{studentName}</div>
                            {lb.roll_number && (
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Roll: {lb.roll_number}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="trainer-lb-td trainer-lb-td--dept">
                        {lb.department || lb.sub || "—"}
                      </td>

                      <td className="trainer-lb-td trainer-lb-td--solved">
                        <strong>{lb.problems_solved || lb.solved_tasks || lb.tasks_completed || 0}</strong> solved
                      </td>

                      <td className="trainer-lb-td trainer-lb-td--points">
                        <span style={{ fontWeight: "700", color: "#0055ba" }}>{scoreVal} XP</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerLeaderboard;
