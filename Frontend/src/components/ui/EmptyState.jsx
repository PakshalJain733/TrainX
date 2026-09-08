import React from 'react';
import { Inbox, FolderOpen, AlertCircle, Plus } from 'lucide-react';


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
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${
      variant === "card" ? "bg-white border border-slate-200 rounded-2xl shadow-xs" : ""
    }`}>
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
        <Icon size={26} strokeWidth={1.8} />
      </div>

      <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          {ActionIcon && <ActionIcon size={14} />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
