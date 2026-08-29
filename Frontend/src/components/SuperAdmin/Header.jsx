import React, { useState } from 'react';
import { Search, Bell, Shield, Sparkles } from 'lucide-react';
import AIRiskAuditModal from './AIRiskAuditModal';

export default function Header({ title = 'Super Admin Control Center', subtitle = 'Manage institutional training across colleges' }) {
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64 hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleges, admins, batches..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition border border-indigo-200/60 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Risk Audit</span>
            </button>

            <button className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </div>
      </header>

      <AIRiskAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </>
  );
}
