import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { Layers, Plus } from 'lucide-react';

import "../Styles/MN_Batches.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getBatches = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.batches)) return payload.batches;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") {
    const nested = value.name || value.code || value.title;
    return nested ? String(nested) : null;
  }
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

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch("/mentor/batches")
      .then((res) => {
        if (!mounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        setBatches(list);
      })
      .catch(() => {
        if (mounted) {
          setBatches([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mentor-batches-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Layers size={20} color="#4f46e5" />
            <span>My Allocated Batches</span>
          </h2>
          <p className="mentor-page-subtitle">Assigned course records, schedules, and batch details</p>
        </div>
      </div>

      {loading ? (
        <div className="mentor-batch-empty">
          <Layers size={28} />
          <p className="mentor-batch-empty-title">Loading assigned batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="mentor-batch-empty">
          <Layers size={28} />
          <p className="mentor-batch-empty-title">No records yet</p>
          <p className="mentor-batch-empty-sub">No assigned batches were returned.</p>
        </div>
      ) : (
        <div className="mentor-batches-grid">
          {batches.map((batch, index) => {
            const code = textValue(firstValue(batch, ["code", "batchCode", "batch_code", "programCode"])) || "N/A";
            const name = textValue(firstValue(batch, ["name", "batchName", "batch_name"])) || "N/A";
            const college = textValue(firstValue(batch, ["college", "collegeName", "college_name", "institution"])) || "N/A";
            const department = textValue(firstValue(batch, ["department", "dept", "branch"])) || "N/A";
            const status = textValue(firstValue(batch, ["status", "state"])) || "N/A";
            const enrolled = getNumber(batch, ["enrolledStudents", "studentCount", "studentsCount", "totalStudents", "assignedStudents"])
              ?? (Array.isArray(batch.students) ? batch.students.length : 0);
            const topicsCovered = getNumber(batch, ["topicsCovered", "modulesCovered", "completedTopics"]);
            const totalTopics = getNumber(batch, ["totalTopics", "moduleCount", "topicCount"]);
            const schedule = textValue(firstValue(batch, ["schedule", "classSchedule", "timing"])) || "N/A";
            const progress = getNumber(batch, ["progress", "completion", "completionPercentage", "overallProgress"]);
            return (
              <div key={textValue(firstValue(batch, ["id", "batchId", "batch_id"])) || index} className="mentor-batch-card-main">
                <div className="mentor-batch-top-row">
                  <span className="mentor-batch-code-tag">{code}</span>
                  <span className="mentor-status-tag mentor-status-tag--slate">{status}</span>
                </div>
                <div className="mentor-batch-details-block">
                  <h3 className="mentor-batch-main-title">{name}</h3>
                  <p className="mentor-batch-college-sub">{college}</p>
                  <p className="mentor-batch-dept-sub">{department}</p>
                </div>
                <div className="mentor-batch-stats-stack">
                  <div className="mentor-batch-stat-line">
                    <span>Enrolled Students:</span>
                    <span className="mentor-batch-stat-strong">{enrolled}</span>
                  </div>
                  <div className="mentor-batch-stat-line">
                    <span>Modules Covered:</span>
                    <span className="mentor-batch-stat-strong">
                      {topicsCovered === null || totalTopics === null ? "N/A" : `${topicsCovered} / ${totalTopics}`}
                    </span>
                  </div>
                  <div className="mentor-batch-stat-line">
                    <span>Class Schedule:</span>
                    <span className="mentor-batch-schedule-text">{schedule}</span>
                  </div>
                </div>
                <div className="mentor-progress-section">
                  <div className="mentor-progress-head">
                    <span className="mentor-progress-label">Overall Completion</span>
                    <span className="mentor-progress-val">{progress === null ? "N/A" : `${progress}%`}</span>
                  </div>
                  {progress === null ? null : (
                    <div className="mentor-progress-track">
                      <div className="mentor-progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
