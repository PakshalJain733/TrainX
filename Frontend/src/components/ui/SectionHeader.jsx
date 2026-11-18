import React from "react";
import "./ui.css";

export function SectionHeader({ title, description, action, icon: Icon, className = "" }) {
  return (
    <div className={className}>
      <div className="ui-section-main">
        <div>
          <h2 className="ui-section-title">
            {Icon && (
              typeof Icon === "function" || typeof Icon === "object" ? (
                React.isValidElement(Icon) ? (
                  Icon
                ) : (
                  <Icon size={22} className="ui-section-title-icon" />
                )
              ) : typeof Icon === "string" ? (
                <img src={Icon} alt="" className="ui-section-title-icon" style={{ width: 22, height: 22, objectFit: "contain" }} />
              ) : null
            )}
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
