import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Eye, ShieldCheck } from 'lucide-react';

export default function ActionDropdown({ onEdit, onDelete, onView, onVerify, customActions = [] }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus:outline-none"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-200 z-20 py-1.5">
          {onView && (
            <button
              onClick={() => { onView(); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
          )}

          {onVerify && (
            <button
              onClick={() => { onVerify(); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Access</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          )}

          {customActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              <span>{action.label}</span>
            </button>
          ))}

          {onDelete && (
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Record</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
