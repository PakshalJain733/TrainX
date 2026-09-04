import React from 'react';

export default function StatusBadge({ status }) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status === 'Active' || status === 'Verified' || status === 'Available') {
    badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'Pending Verification' || status === 'Pending') {
    badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'High' || status === 'In Progress') {
    badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (status === 'Busy' || status === 'Medium') {
    badgeStyles = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (status === 'Near Completion') {
    badgeStyles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status}
    </span>
  );
}
