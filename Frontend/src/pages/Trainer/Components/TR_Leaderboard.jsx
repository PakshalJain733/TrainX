import React, { useState, useEffect } from "react";
import { Trophy, Users, Award, Medal, Search } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/TR_Batches.css";
import "../Styles/TR_Leaderboard.css";

export function TrainerLeaderboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyBatches = async () => {
      try {
        const res = await apiFetch("/batches/my-batches");
        const list = res?.data || [];
        setBatches(list);
        if (list.length > 0) {
          setSelectedBatchId(list[0].id);
        }
      } catch (_e) {}
    };
    fetchMyBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    const fetchLb = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/leaderboard/batch?batchId=${selectedBatchId}`);
        setLeaderboard(res?.data || []);
      } catch (_e) {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLb();
  }, [selectedBatchId]);

  return (
    <div className="trainer-batches-container">
      <div className="trainer-header-row">
        <div>
          <h1 className="trainer-page-title">Batch Leaderboards</h1>
          <p className="trainer-page-sub">
            Track student rankings, problems solved, and total points across your batches.
          </p>
        </div>

        {batches.length > 0 && (
          <div className="trainer-lb-filter-group">
            <label className="trainer-lb-select-label">Select Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="trainer-lb-select"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="trainer-lb-card">
        {loading ? (
          <div className="trainer-lb-loading">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="trainer-lb-empty-box">
            <Trophy size={44} className="trainer-lb-trophy-icon" />
            <h3 className="trainer-lb-empty-title">No leaderboard activity yet</h3>
            <p className="trainer-lb-empty-sub">
              Students will be ranked here automatically as they submit solutions for batch tasks.
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
                  <th className="trainer-lb-th">Tasks Solved</th>
                  <th className="trainer-lb-th">XP / Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((lb, idx) => (
                  <tr key={lb.id || idx} className="trainer-lb-row">
                    <td className="trainer-lb-td trainer-lb-td--rank">
                      <span
                        className={`trainer-lb-rank-badge ${
                          idx === 0
                            ? "trainer-lb-rank-badge--1"
                            : idx === 1
                            ? "trainer-lb-rank-badge--2"
                            : idx === 2
                            ? "trainer-lb-rank-badge--3"
                            : ""
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="trainer-lb-td trainer-lb-td--student">
                      {lb.name || lb.student_name}
                    </td>
                    <td className="trainer-lb-td trainer-lb-td--dept">{lb.department || "Engineering"}</td>
                    <td className="trainer-lb-td trainer-lb-td--solved">{lb.problems_solved || lb.solved_tasks || 0}</td>
                    <td className="trainer-lb-td trainer-lb-td--points">
                      {lb.total_points || lb.xp || 0} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerLeaderboard;
