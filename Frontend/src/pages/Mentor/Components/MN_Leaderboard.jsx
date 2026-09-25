import { useEffect, useState } from "react";
import { Trophy, Flame } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Leaderboard.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getEntries = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.entries)) return payload.entries;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getNumber = (source, keys) => asNumber(firstValue(source, keys));

const formatMetric = (value, suffix = "") => {
  if (value === undefined || value === null || value === "") return "N/A";
  return `${value}${suffix}`;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch("/mentor/leaderboard")
      .then((response) => {
        if (mounted) setEntries(getEntries(response));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mentor-leaderboard-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Trophy size={20} color="#4f46e5" />
            <span>Batch Leaderboard & Rankings</span>
          </h2>
          <p className="mentor-page-subtitle">Student rankings and activity values returned by the mentor service</p>
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Cohort</th>
                <th>Coding Points</th>
                <th>Solved Problems</th>
                <th>Active Streak</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="mentor-lb-empty">Loading leaderboard...</div></td></tr>
              ) : entries.length > 0 ? (
                entries.map((entry, index) => {
                  const rank = getNumber(entry, ["rank", "position"]) ?? index + 1;
                  const name = textValue(firstValue(entry, ["name", "studentName", "student_name"])) || "N/A";
                  const batch = textValue(firstValue(entry, ["batch", "batchName", "batch_name", "cohort"])) || "N/A";
                  const points = getNumber(entry, ["points", "xp", "codingPoints", "coding_points", "totalPoints"]);
                  const solved = getNumber(entry, ["solved", "solvedProblems", "solved_problems", "problemsSolved"]);
                  const streak = getNumber(entry, ["streak", "activeStreak", "active_streak"]);
                  const badge = textValue(firstValue(entry, ["badge", "achievement", "title"])) || "N/A";
                  return (
                    <tr key={textValue(firstValue(entry, ["id", "studentId", "student_id", "userId"])) || index}>
                      <td className="mentor-lb-rank">#{rank}</td>
                      <td className="mentor-lb-name">{name}</td>
                      <td className="mentor-lb-batch">{batch}</td>
                      <td className="mentor-lb-points">{formatMetric(points, " pts")}</td>
                      <td className="mentor-lb-solved">{formatMetric(solved)}</td>
                      <td>
                        <span className="mentor-lb-streak">
                          <Flame size={14} color="#f59e0b" fill="#f59e0b" /> {formatMetric(streak)}
                        </span>
                      </td>
                      <td><span className="mentor-lb-badge">{badge}</span></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="mentor-lb-empty">
                      <Trophy size={28} />
                      <p>No records yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
