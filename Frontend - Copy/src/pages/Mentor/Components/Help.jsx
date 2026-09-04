import React from 'react';
import { HelpCircle, BookOpen, MessageSquare, Mail } from 'lucide-react';

export default function Help() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <span>Mentor Support & Help Desk</span>
        </h2>
        <p className="text-xs text-slate-500">Contact institutional support, review trainer guidelines, and access portal documentation</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Trainer Documentation</h3>
            <p className="text-slate-600">Access guides for live session hosting, code evaluation criteria, and attendance submission.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Super Admin Support</h3>
            <p className="text-slate-600">Need batch adjustments or student transfers? Reach out directly to system administration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
