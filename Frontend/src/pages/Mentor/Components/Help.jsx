import React from 'react';
import { HelpCircle, BookOpen, MessageSquare, Mail } from 'lucide-react';
import '../Styles/Help.css';

export default function Help() {
  return (
    <div className="mentor-help-container">
      <div className="mentor-help-card">
        <h2 className="mentor-help-title">
          <HelpCircle className="mentor-help-icon" />
          <span>Mentor Support & Help Desk</span>
        </h2>
        <p className="mentor-help-desc">Contact institutional support, review trainer guidelines, and access portal documentation</p>

        <div className="mentor-help-grid">
          <div className="mentor-help-item">
            <h3 className="mentor-help-item-title">Trainer Documentation</h3>
            <p className="mentor-help-item-desc">Access guides for live session hosting, code evaluation criteria, and attendance submission.</p>
          </div>
          <div className="mentor-help-item">
            <h3 className="mentor-help-item-title">Super Admin Support</h3>
            <p className="mentor-help-item-desc">Need batch adjustments or student transfers? Reach out directly to system administration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

