import React from "react";
import "./ui.css";

export function SectionHeader({ title, description, eyebrow, action, className = "" }) {
  return (
    <div className={`ui-section-header ${className}`}>
      {eyebrow && (
        <span className="ui-section-eyebrow">
          {eyebrow}
        </span>
      )}
      <div className="ui-section-main">
        <div>
          <h2 className="ui-section-title">
            {title}
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
