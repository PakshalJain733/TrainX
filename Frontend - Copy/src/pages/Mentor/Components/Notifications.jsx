import React from 'react';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export default function Notifications() {
  const alerts = [
    { id: 1, title: "12 New Assignment Submissions", body: "Students from CSE 2026 Alpha submitted Graph Algorithms assignment.", time: "10 mins ago", unread: true },
    { id: 2, title: "Upcoming Live Session Reminder", body: "PyTorch & Neural Networks live class starts at 02:00 PM today.", time: "1 hour ago", unread: true },
    { id: 3, title: "Weekly Governance Report Approved", body: "Super Admin approved your Week 34 progress log.", time: "1 day ago", unread: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          <span>Notifications & Activity Stream</span>
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className={`p-4 rounded-xl border ${a.unread ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-100'} space-y-1`}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
              <span className="text-[11px] text-slate-400 font-medium">{a.time}</span>
            </div>
            <p className="text-xs text-slate-600">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
