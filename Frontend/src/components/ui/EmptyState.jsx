import React from 'react';
import { Inbox, FolderOpen, AlertCircle, Plus } from 'lucide-react';
import './ui.css';

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There are currently no items available in this section.",
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  variant = "default" // "default" | "card"
}) {
  return (
    <div className={`ui-empty-state ${variant === "card" ? "ui-empty-state--card" : ""}`}>
      <div className="ui-empty-state-icon-wrap">
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <h3 className="ui-empty-state-title">
        {title}
      </h3>

      <p className="ui-empty-state-desc">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="ui-empty-state-btn"
        >
          {ActionIcon && <ActionIcon size={16} strokeWidth={2} />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

