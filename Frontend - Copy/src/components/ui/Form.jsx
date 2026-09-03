import React from "react";
import "./ui.css";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`ui-input ${className}`}
      {...props}
    />
  );
}

export function Label({ children, className = "", ...props }) {
  return (
    <label
      className={`ui-label ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`ui-textarea ${className}`}
      {...props}
    />
  );
}
