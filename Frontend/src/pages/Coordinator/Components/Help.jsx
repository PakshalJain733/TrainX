import { HelpCircle, Mail, MessageSquare, BookOpen, ShieldAlert, FileText, Phone } from "lucide-react";
import "../Styles/Requests.css";

export default function CoordinatorHelp() {
  return (
    <div>
      <div className="coord-page-header">
        <div>
          <h1 className="coord-page-title">
            <HelpCircle size={22} className="coord-header-icon" color="#4f46e5" />
            Coordinator Support & Escalation Desk
          </h1>
          <p className="coord-page-sub">
            Governance documentation, platform escalation channels, and system support contacts.
          </p>
        </div>
      </div>

      <div className="coord-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Platform Admin Contact</div>
          <div className="coord-stat-value" style={{ fontSize: "16px", color: "#0f172a" }}>admin@acadnexus.edu</div>
          <div className="coord-stat-subtext">Immediate technical resolution</div>
        </div>
        <div className="coord-stat-card">
          <div className="coord-stat-label">Training Coordinator Helpline</div>
          <div className="coord-stat-value" style={{ fontSize: "16px", color: "#059669" }}>+91 98200 12345</div>
          <div className="coord-stat-subtext">Mon-Sat, 09:00 AM - 06:00 PM</div>
        </div>
      </div>

      <div className="coord-card">
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#0f172a" }}>
          Frequently Asked Governance Workflows
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              How do I assign or reallocate an industry trainer to a new cohort?
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Navigate to the <strong>Batches Governance</strong> or <strong>Industry Trainers</strong> tab, click "Edit Batch" or "Re-allocate Batch", and select the new mentor from the verified trainer roster.
            </div>
          </div>

          <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              How are AI Career Roadmaps generated?
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Students submit their career goal or target role in their dashboard. Google Gemini AI dynamically tailors 5-6 milestones based on their mastered skills and academic semester.
            </div>
          </div>

          <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              How do I grant medical or hackathon attendance overrides?
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
              Go to the <strong>Attendance Governance</strong> or <strong>Requests & Approvals</strong> section to review uploaded medical certificates or OD forms, and click "Approve".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
