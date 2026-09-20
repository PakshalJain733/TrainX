import React, { useState, useEffect } from 'react';
import { Target, Search, CheckCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Roadmaps.css';

export default function Roadmaps() {
  const [search, setSearch] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/students/roadmaps")
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.roadmaps)) {
          setTracks(res.data.roadmaps);
        }
      })
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tracks.filter((t) =>
    (t.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.rollNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.track || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mentor-roadmaps-container">
      {/* Header */}
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Target size={20} color="#4f46e5" />
            <span>Assigned Students' AI Learning Roadmaps</span>
          </h2>
          <p className="mentor-page-subtitle">Track custom AI learning pathways, milestone progress, and active modules for all assigned students</p>
        </div>
      </div>

      {/* Styled Search Card Bar */}
      <div className="mentor-search-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search student name, roll number, or career track..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#0f172a',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: 12 }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
          <p style={{ fontSize: 13 }}>Loading student roadmaps...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center text-slate-400 text-sm">
              No roadmap data available for assigned students yet.
            </div>
          )}
          {filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {t.batch} · {t.department}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {t.status === "On Track" ? <><CheckCircle size={13} /> {t.status}</> : <><Clock size={13} /> {t.status}</>}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.studentName}</h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">{t.track}</p>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modules Completed</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {t.completedModules ?? "N/A"} <span className="text-slate-400">of {t.totalModules ?? "N/A"}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Roll No</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{t.rollNo}</span>
                  </div>
                </div>
              </div>

              <div className="mentor-roadmap-progress-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="mentor-roadmap-progress-head flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500">Curriculum Completion</span>
                  <span className="text-indigo-600">{t.completion}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, t.completionPct || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}