import React from "react";
import { Link } from "react-router-dom";
import { Wrench, ShieldAlert, Clock, Sparkles, ArrowLeft, Headphones } from "lucide-react";
import { useSystemMaintenance } from "../../context/SystemMaintenanceContext";

export default function MaintenanceGuard({ moduleKey, children }) {
  const { isModuleActive, getModuleConfig } = useSystemMaintenance();

  const active = isModuleActive(moduleKey);

  if (active) {
    return <>{children}</>;
  }

  const moduleConfig = getModuleConfig(moduleKey);

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-md my-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Ambient glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Maintenance Icon Badge */}
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Wrench className="w-10 h-10 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white rounded-full p-1 border-2 border-slate-900">
            <ShieldAlert size={14} />
          </div>
        </div>

        {/* Section Title & Status */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles size={13} className="text-amber-400" />
            <span>Scheduled Maintenance Mode</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {moduleConfig.name || "Module Temporarily Offline"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Role Target: {moduleConfig.role || "Platform System"}
          </p>
        </div>

        {/* Custom Maintenance Message from Super Admin */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Super Admin Notice:</span>
            <span className="flex items-center gap-1 text-[11px] font-mono">
              <Clock size={12} />
              {moduleConfig.updatedAt || "Active"}
            </span>
          </div>
          <p className="text-slate-200 leading-relaxed font-medium">
            "{moduleConfig.message || "This section is currently undergoing maintenance by the platform engineering team."}"
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
          >
            <ArrowLeft size={14} />
            Return Home
          </Link>
          <a
            href="mailto:support@acadnexus.edu.in"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
          >
            <Headphones size={14} />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
