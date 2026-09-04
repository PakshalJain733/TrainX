import React from "react";
import "./ui.css";

export function Avatar({ className = "", children, ...props }) {
  return (
    <div className={`ui-avatar ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = "", className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`ui-avatar-img ${className}`}
    />
  );
}

export function AvatarFallback({ children, className = "" }) {
  return (
    <span className={`ui-avatar-fallback ${className}`}>
      {children}
    </span>
  );
}

export default Avatar;
