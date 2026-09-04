import React from "react";
import "./ui.css";

export function Progress({ value = 0, max = 100, className = "" }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`ui-progress ${className}`}>
      <div
        className="ui-progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default Progress;
