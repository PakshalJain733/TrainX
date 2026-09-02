import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AIRiskAuditModal({ isOpen, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  if (!isOpen) return null;

  const handleRunDiagnostic = () => {
    setIsScanning(true);
    setScanned(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanned(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">AI Institutional Risk Audit</h3>
              <p className="text-xs text-indigo-300 font-medium">Real-time diagnostic across 18 colleges & 4,850 students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!scanned && !isScanning && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Run AI Governance Scan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Evaluates attendance drops, assessment failures, coordinator delays, and placement readiness across all institutional nodes.
                </p>
              </div>
              <button
                onClick={handleRunDiagnostic}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Start Diagnostic Scan</span>
              </button>
            </div>
          )}

          {isScanning && (
            <div className="text-center py-10 space-y-4">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Analyzing 18 college databases & engagement matrices...</p>
            </div>
          )}

          {scanned && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-900 text-xs">Diagnostic Completed</h5>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Scanned 4,850 active profiles across 42 departments. Overall health index is 84.2%.</p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">High Priority Risk Findings</h5>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900">42 Students at High Risk:</span>
                    <span className="text-rose-700 ml-1">Attendance below 50% in Cloud DevOps cohort at Global Institute.</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">5 Pending Admin Verifications:</span>
                    <span className="text-amber-700 ml-1">Awaiting coordinator clearance for St. Xavier Technical Campus.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Close Diagnostic
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
