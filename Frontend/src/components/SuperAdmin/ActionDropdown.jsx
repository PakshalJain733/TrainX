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

  const btnReset = {
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    margin: 0,
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ border: 'none', outline: 'none', background: 'transparent' }}
        className={`p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all cursor-pointer flex items-center justify-center ${
          open ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20' : ''
        }`}
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="origin-top-right absolute right-0 mt-1.5 w-48 rounded-2xl bg-white shadow-xl border border-slate-200/90 z-50 p-1.5 transition-all duration-150"
          style={{
            minWidth: '185px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          }}
        >
          {onView && (
            <button
              type="button"
              style={{ ...btnReset, background: 'transparent' }}
              onClick={() => { onView(); setOpen(false); }}
              className="group px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 rounded-xl transition-all cursor-pointer gap-2.5"
            >
              <Eye className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>View Details</span>
            </button>
          )}

          {onVerify && (
            <button
              type="button"
              style={{ ...btnReset, background: 'transparent' }}
              onClick={() => { onVerify(); setOpen(false); }}
              className="group px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-all cursor-pointer gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 transition-colors" />
              <span>Verify Access</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              style={{ ...btnReset, background: 'transparent' }}
              onClick={() => { onEdit(); setOpen(false); }}
              className="group px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 rounded-xl transition-all cursor-pointer gap-2.5"
            >
              <Edit2 className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Edit Record</span>
            </button>
          )}

          {customActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              style={{ ...btnReset, background: 'transparent' }}
              onClick={() => { action.onClick(); setOpen(false); }}
              className="group px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 rounded-xl transition-all cursor-pointer gap-2.5"
            >
              {action.icon && <action.icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors" />}
              <span>{action.label}</span>
            </button>
          ))}

          {onDelete && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                style={{ ...btnReset, background: 'transparent' }}
                onClick={() => { onDelete(); setOpen(false); }}
                className="group px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all cursor-pointer gap-2.5"
              >
                <Trash2 className="w-4 h-4 shrink-0 text-rose-500 group-hover:text-rose-600 transition-colors" />
                <span>Remove Record</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
