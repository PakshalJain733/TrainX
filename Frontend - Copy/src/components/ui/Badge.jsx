import React from "react";
import "./ui.css";

export function Badge({ children, variant = "default", className = "", ...props }) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
