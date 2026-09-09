import React, { useState } from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
import AIRiskAuditModal from './AIRiskAuditModal';
import '../../pages/SuperAdmin/Styles/SuperAdmin.css';

export default function Header({ title = 'Super Admin Control Center', subtitle = 'Manage institutional training across colleges' }) {
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  return (
    <>
      <header className="sa-header">
        <div>
          <h1 className="sa-header-title">
            {title}
          </h1>
          <p className="sa-header-subtitle">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="sa-header-search-wrap">
            <Search className="sa-header-search-icon" />
            <input
              type="text"
              placeholder="Search colleges, admins, batches..."
              className="sa-header-search-input"
            />
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditOpen(true)}
              className="sa-audit-btn"
            >
              <Sparkles className="sa-audit-icon" />
              <span>AI Risk Audit</span>
            </button>

            <button className="sa-notif-btn" title="Notifications">
              <Bell className="sa-notif-icon" />
              <span className="sa-notif-dot"></span>
            </button>
          </div>
        </div>
      </header>

      <AIRiskAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </>
  );
}
