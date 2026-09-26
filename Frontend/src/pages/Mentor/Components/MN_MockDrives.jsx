import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import { ClipboardCheck, Plus } from 'lucide-react';
import "../Styles/MN_MockDrives.css";

export default function MockDrives() {
  const [drivesList, setDrivesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mock-drives")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setDrivesList(res.data);
        } else {
          setDrivesList([]);
        }
      })
      .catch(() => setDrivesList([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusClass = (status) => {
    if (status === 'Active Today') return 'mentor-mockdrive-status--active';
    if (status === 'Upcoming') return 'mentor-mockdrive-status--upcoming';
    return 'mentor-mockdrive-status--past';
  };

  return (
    <div className="mentor-mockdrives-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <ClipboardCheck size={20} color="#4f46e5" />
            <span>Placement Mock Drives & Code Tests</span>
          </h2>
          <p className="mentor-page-subtitle">Placement drive management is not configured for this workspace</p>
        </div>
      </div>
      <div className="mentor-mockdrives-grid">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>Loading mock drives...</div>
        ) : drivesList.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b", fontSize: "14px", gridColumn: "1 / -1" }}>
            No placement mock drives found in database.
          </div>
        ) : (
          drivesList.map((d, idx) => (
            <div key={d.id || idx} className="mentor-mockdrive-card">
              <div className="mentor-mockdrive-header">
                <span className={`mentor-mockdrive-status ${getStatusClass(d.status || 'Upcoming')}`}>
                  {d.status || 'Upcoming'}
                </span>
                <span className="mentor-mockdrive-date">{d.date || 'TBD'}</span>
              </div>

              <h3 className="mentor-mockdrive-title">{d.title || d.company_name || 'Placement Drive'}</h3>

              <div className="mentor-mockdrive-stats">
                <div className="mentor-mockdrive-stat-row">
                  <span>Registered Students:</span>
                  <span className="mentor-mockdrive-stat-val">{d.registered || d.enrolled_count || 0}</span>
                </div>
                <div className="mentor-mockdrive-stat-row">
                  <span>Pass Cutoff Criteria:</span>
                  <span className="mentor-mockdrive-stat-val--green">{d.passCutoff || d.cutoff_percentage || '75%'}</span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="mentor-mockdrive-empty">
          <ClipboardCheck size={36} />
          <h3>Coming Soon</h3>
          <p>Not configured</p>
        </div>

      </div>
    </div>
  );
}
