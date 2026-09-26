import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../../utils/api';
import { AlertCircle, Search, Filter, ShieldAlert, UserX } from 'lucide-react';
import "../Styles/MN_Defaulters.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getPayload = (response) => {
  const payload = unwrap(response);
  return payload && typeof payload === "object" ? payload : {};
};

const getDefaulters = (response) => {
  const payload = getPayload(response);
  return Array.isArray(payload.defaulters) ? payload.defaulters : [];
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

const formatNumber = (value, suffix = "") => {
  const number = asNumber(value);
  return number === null ? "N/A" : `${number}${suffix}`;
};

const riskClass = (risk) => {
  const value = textValue(risk)?.toLowerCase() || "";
  return value.includes("high") || value.includes("critical")
    ? "mentor-defaulter-risk-badge--high"
    : "mentor-defaulter-risk-badge--medium";
};

export default function Defaulters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [defaulters, setDefaulters] = useState([]);
  const [hasAttendanceData, setHasAttendanceData] = useState(null);
  const [attendanceThreshold, setAttendanceThreshold] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch("/mentor/defaulters")
      .then((response) => {
        if (!mounted) return;
        const payload = getPayload(response);
        setDefaulters(getDefaulters(response));
        setHasAttendanceData(typeof payload.hasAttendanceData === "boolean" ? payload.hasAttendanceData : null);
        setAttendanceThreshold(asNumber(payload.attendanceThreshold));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const riskLevels = useMemo(
    () => ["All", ...new Set(defaulters.map((student) => textValue(firstValue(student, ["riskLevel", "risk_level", "risk", "status"]))).filter(Boolean))],
    [defaulters],
  );

  const filteredDefaulters = defaulters.filter((student) => {
    const values = [
      student.name,
      student.rollNo,
      student.rollNumber,
      student.batch,
      student.reason,
      student.reasons,
    ].map(textValue);
    const matchesSearch = values.some((value) => value?.toLowerCase().includes(searchTerm.trim().toLowerCase()));
    const risk = textValue(firstValue(student, ["riskLevel", "risk_level", "risk", "status"])) || "N/A";
    const matchesRisk = selectedRisk === "All" || risk === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="mentor-defaulters-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title mentor-defaulter-header-title">
          <span>Defaulters &amp; Performance Risk Queue</span>
          </h2>
          <p className="mentor-page-subtitle mentor-defaulter-header-sub">
            Students currently flagged by the mentor service
            {attendanceThreshold === null ? "." : ` using the ${attendanceThreshold}% attendance threshold.`}
          </p>
        </div>
      </div>

      {hasAttendanceData === false && (
        <div className="mentor-defaulter-alert-banner">
          <AlertCircle size={18} color="#b45309" />
          <span>Attendance data is not available yet.</span>
        </div>
      )}

      <div className="mentor-defaulter-card">
        <div className="mentor-defaulter-controls">
          <div className="mentor-defaulter-search-wrap">
            <Search size={18} className="mentor-defaulter-search-icon" />
            <input
              type="text"
              placeholder="Search defaulters by student name, roll number, or reason..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="mentor-defaulter-search-input"
            />
          </div>
          <div className="mentor-defaulter-filter-wrap">
            <Filter size={16} color="#64748b" />
            <select
              value={selectedRisk}
              onChange={(event) => setSelectedRisk(event.target.value)}
              className="mentor-defaulter-select"
              aria-label="Filter by risk level"
            >
              {riskLevels.map((risk) => <option key={risk} value={risk}>{risk === "All" ? "All Risk Levels" : risk}</option>)}
            </select>
          </div>
        </div>

        <div className="mentor-table-responsive">
          <table className="mentor-defaulter-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Batch</th>
                <th>Attendance</th>
                <th>Missed Assignments</th>
                <th>Last Test Score</th>
                <th>Defaulter Reason</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem 1rem" }}>Loading defaulters...</td></tr>
              ) : filteredDefaulters.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <UserX size={36} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
                    <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
                      {defaulters.length === 0 ? "No records yet" : "No records match the current filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDefaulters.map((student, index) => {
                  const name = textValue(student.name) || "N/A";
                  const rollNo = textValue(student.rollNo || student.rollNumber) || "N/A";
                  const batch = textValue(student.batch || student.batchName) || "N/A";
                  const attendance = formatNumber(student.attendance, "%");
                  const missed = asNumber(student.missedAssignments ?? student.missed_assignments);
                  const missedAssignments = missed === null ? textValue(student.missedAssignments ?? student.missed_assignments) || "N/A" : `${missed} missed`;
                  const lastTestScore = formatNumber(student.lastTestScore ?? student.last_test_score, "%");
                  const reason = textValue(student.reason || student.reasons) || "N/A";
                  const risk = textValue(firstValue(student, ["riskLevel", "risk_level", "risk", "status"])) || "N/A";
                  return (
                    <tr key={textValue(student.id || student.studentId) || index}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{name}</td>
                      <td style={{ color: "#475569", fontWeight: 500 }}>{rollNo}</td>
                      <td style={{ color: "#334155", fontWeight: 500 }}>{batch}</td>
                      <td style={{ color: "#e11d48", fontWeight: 800 }}>{attendance}</td>
                      <td style={{ color: "#d97706", fontWeight: 700 }}>{missedAssignments}</td>
                      <td style={{ color: "#0f172a", fontWeight: 800 }}>{lastTestScore}</td>
                      <td style={{ color: "#be123c", fontWeight: 600, maxWidth: "280px", lineHeight: 1.4 }}>{reason}</td>
                      <td>
                        <span className={`mentor-defaulter-risk-badge ${riskClass(risk)}`}>
                          <ShieldAlert size={13} />
                          {risk}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
