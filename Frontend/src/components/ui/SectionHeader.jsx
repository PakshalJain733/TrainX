import React from "react";
import "./ui.css";

export function SectionHeader({ title, description, action, icon: Icon, className = "" }) {
  return (
    <div className={`ui-section-header ${className}`}>
      <div className="ui-section-main">
        <div>
          <h2 className="ui-section-title">
            {Icon && <Icon size={22} className="ui-section-title-icon" />}
            <span>{title}</span>
          </h2>
          {description && (
            <p className="ui-section-desc">
              {description}
            </p>
          )}
        </div>
        {action && <div className="ui-section-action">{action}</div>}
      </div>
    </div>
  );
}

export default SectionHeader;
