import { ClipboardCheck } from "lucide-react";
import "../Styles/MN_MockDrives.css";

export default function MockDrives() {
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
        <div className="mentor-mockdrive-empty">
          <ClipboardCheck size={36} />
          <h3>Coming Soon</h3>
          <p>Not configured</p>
        </div>
      </div>
    </div>
  );
}
