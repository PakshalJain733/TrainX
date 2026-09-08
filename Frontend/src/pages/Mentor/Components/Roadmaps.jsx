import React, { useState, useEffect } from 'react';
import { Target, Search, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Roadmaps.css';

const defaultRoadmaps = [
  {
    id: 1,
    studentName: "Rahul Verma",
    rollNo: "CS202601",
    department: "Computer Engineering",
    batch: "BE-CS-2026-A",
    track: "Full Stack Web Development (MERN)",
    completion: "78%",
    status: "In Progress",
    currentModule: "Backend API Integration & JWT Auth",
    nextMilestone: "System Design & Microservices Architecture",
  },
  {
    id: 2,
    studentName: "Ananya Patel",
    rollNo: "CS202604",
    department: "Computer Engineering",
    batch: "BE-CS-2026-A",
    track: "AI & Machine Learning Engineering",
    completion: "84%",
    status: "Advanced",
    currentModule: "Deep Learning & Computer Vision",
    nextMilestone: "NLP & Large Language Models Deployment",
  },
  {
    id: 3,
    studentName: "Siddharth Rao",
    rollNo: "IT202612",
    department: "Information Technology",
    batch: "TE-IT-2026-B",
    track: "Data Structures & Competitive Programming",
    completion: "55%",
    status: "Needs Focus",
    currentModule: "Dynamic Programming & Graph Algorithms",
    nextMilestone: "LeetCode Hard & System Optimization",
  },
  {
    id: 4,
    studentName: "Pooja Deshmukh",
    rollNo: "IT202615",
    department: "Information Technology",
    batch: "TE-IT-2026-B",
    track: "Java Enterprise & Cloud Computing",
    completion: "92%",
    status: "On Track",
    currentModule: "Spring Boot Microservices & AWS Deployment",
    nextMilestone: "Kubernetes & DevOps CI/CD Pipeline",
  },
];

export default function Roadmaps() {
  const [search, setSearch] = useState('');
  const [tracks, setTracks] = useState(defaultRoadmaps);

  useEffect(() => {
    apiFetch("/students")
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setTracks(res.data.map((s, idx) => ({
            id: s.id || idx,
            studentName: s.name || s.full_name || `Student ${idx + 1}`,
            rollNo: s.roll_number || s.rollNo || `CS20260${idx + 1}`,
            department: s.department || "Computer Engineering",
            batch: s.batch_name || "BE-CS-2026-A",
            track: s.track || "Full Stack & Software Engineering",
            completion: `${s.progress || 65 + (idx % 30)}%`,
            status: (s.progress || 70) > 80 ? "On Track" : "In Progress",
            currentModule: "DSA & Core Engineering Fundamentals",
            nextMilestone: "Capstone Web Project & AI Integration",
          })));
        }
      })
      .catch(() => {});
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

      {/* Grid of Student Roadmaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {t.batch} · {t.department}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={13} /> {t.status}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t.studentName}</h3>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">{t.track}</p>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Module</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t.currentModule}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Milestone</span>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{t.nextMilestone}</span>
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
                  style={{ width: t.completion }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
