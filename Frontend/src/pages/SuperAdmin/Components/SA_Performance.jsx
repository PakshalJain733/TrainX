import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  BarChart2,
  ArrowUpRight,
  ShieldCheck,
  Code,
  Target,
  Sparkles,
  ClipboardCheck,
  CalendarCheck,
  Building2,
  Search,
  Activity,
  Zap,
  Users,
  ChevronDown,
  Check,
  X,
  Filter
} from 'lucide-react';
import { collegeAPI } from '../../../services/api';
import "../Styles/SA_Performance.css";

/* ── Inline dropdown for Performance (CSS: Performance.css .perf-select-*) ── */
function PerfSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  React.useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`perf-select-wrap${isOpen ? ' perf-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`perf-select-trigger${isOpen ? ' perf-select-trigger--open' : ''}`}>
        {Icon && <Icon className="perf-select-icon" />}
        <span className="perf-select-text">{selected ? selected.label : <span className="perf-select-placeholder">{placeholder}</span>}</span>
        <ChevronDown className={`perf-select-arrow${isOpen ? ' perf-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="perf-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`perf-select-option${isSel ? ' perf-select-option--selected' : ''}`}>
                <span className="perf-select-option-label">{opt.label}</span>
                {isSel && <Check className="perf-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Comprehensive College-Wise Performance Database
const collegePerformanceDB = {
  'all': {
    kpi: {
      passRate: 0,
      readiness: 0,
      activeStudents: 0,
      trend: '0%'
    },
    features: [
      {
        id: 'coding',
        name: 'Coding Practice & Monitoring',
        description: 'Algorithm challenges, live test runner & submissions',
        icon: Code,
        colorClass: 'perf-icon-indigo',
        activeUsers: 0,
        avgAccuracy: 0,
        completionRate: 0,
        trend: '0%',
        topPerformer: 'N/A',
        metricLabel: 'Problems Solved',
        metricValue: '0',
      },
      {
        id: 'roadmaps',
        name: 'AI Learning Roadmaps',
        description: 'Personalized student career & skill progression',
        icon: Target,
        colorClass: 'perf-icon-purple',
        activeUsers: 0,
        avgAccuracy: 0,
        completionRate: 0,
        trend: '0%',
        topPerformer: 'N/A',
        metricLabel: 'Milestones Achieved',
        metricValue: '0',
      },
      {
        id: 'interviews',
        name: 'AI Mock Interviews',
        description: 'Automated technical & HR mock interview sessions',
        icon: Sparkles,
        colorClass: 'perf-icon-amber',
        activeUsers: 0,
        avgAccuracy: 0,
        completionRate: 0,
        trend: '0%',
        topPerformer: 'N/A',
        metricLabel: 'Sessions Cleared',
        metricValue: '0',
      },
      {
        id: 'drives',
        name: 'Mock Placement Drives',
        description: 'Simulated campus recruitment & company tests',
        icon: ClipboardCheck,
        colorClass: 'perf-icon-emerald',
        activeUsers: 0,
        avgAccuracy: 0,
        completionRate: 0,
        trend: '0%',
        topPerformer: 'N/A',
        metricLabel: 'Drive Qualification',
        metricValue: '0%',
      },
      {
        id: 'attendance',
        name: 'Attendance & Tracking',
        description: 'Institutional class presence & defaulter monitoring',
        icon: CalendarCheck,
        colorClass: 'perf-icon-blue',
        activeUsers: 0,
        avgAccuracy: 0,
        completionRate: 0,
        trend: '0%',
        topPerformer: 'N/A',
        metricLabel: 'Overall Attendance',
        metricValue: '0%',
      },
    ]
  },
  'PVPPCOE Mumbai': {
    kpi: { passRate: 89.2, readiness: 84.0, activeStudents: 1240, trend: '+5.4%' },
    features: [
      {
        id: 'coding',
        name: 'Coding Practice & Monitoring',
        description: 'Algorithm challenges, live test runner & submissions',
        icon: Code,
        colorClass: 'perf-icon-indigo',
        activeUsers: 1240,
        avgAccuracy: 89.4,
        completionRate: 88.5,
        trend: '+6.2%',
        topPerformer: 'PVPPCOE Mumbai',
        metricLabel: 'Problems Solved',
        metricValue: '1,890',
      },
      {
        id: 'roadmaps',
        name: 'AI Learning Roadmaps',
        description: 'Personalized student career & skill progression',
        icon: Target,
        colorClass: 'perf-icon-purple',
        activeUsers: 850,
        avgAccuracy: 91.2,
        completionRate: 85.0,
        trend: '+7.1%',
        topPerformer: 'PVPPCOE Mumbai',
        metricLabel: 'Milestones Achieved',
        metricValue: '2,900',
      },
      {
        id: 'interviews',
        name: 'AI Mock Interviews',
        description: 'Automated technical & HR mock interview sessions',
        icon: Sparkles,
        colorClass: 'perf-icon-amber',
        activeUsers: 510,
        avgAccuracy: 81.5,
        completionRate: 78.2,
        trend: '+10.5%',
        topPerformer: 'PVPPCOE Mumbai',
        metricLabel: 'Sessions Cleared',
        metricValue: '420',
      },
      {
        id: 'drives',
        name: 'Mock Placement Drives',
        description: 'Simulated campus recruitment & company tests',
        icon: ClipboardCheck,
        colorClass: 'perf-icon-emerald',
        activeUsers: 780,
        avgAccuracy: 86.0,
        completionRate: 92.4,
        trend: '+4.2%',
        topPerformer: 'PVPPCOE Mumbai',
        metricLabel: 'Drive Qualification',
        metricValue: '72%',
      },
      {
        id: 'attendance',
        name: 'Attendance & Tracking',
        description: 'Institutional class presence & defaulter monitoring',
        icon: CalendarCheck,
        colorClass: 'perf-icon-blue',
        activeUsers: 1240,
        avgAccuracy: 94.8,
        completionRate: 95.1,
        trend: '+1.8%',
        topPerformer: 'PVPPCOE Mumbai',
        metricLabel: 'Overall Attendance',
        metricValue: '94.8%',
      },
    ]
  },
  'Apex Institute of Tech': {
    kpi: { passRate: 82.6, readiness: 76.0, activeStudents: 980, trend: '+3.1%' },
    features: [
      {
        id: 'coding',
        name: 'Coding Practice & Monitoring',
        description: 'Algorithm challenges, live test runner & submissions',
        icon: Code,
        colorClass: 'perf-icon-indigo',
        activeUsers: 980,
        avgAccuracy: 76.2,
        completionRate: 81.0,
        trend: '+4.1%',
        topPerformer: 'Apex Institute of Tech',
        metricLabel: 'Problems Solved',
        metricValue: '1,420',
      },
      {
        id: 'roadmaps',
        name: 'AI Learning Roadmaps',
        description: 'Personalized student career & skill progression',
        icon: Target,
        colorClass: 'perf-icon-purple',
        activeUsers: 980,
        avgAccuracy: 88.1,
        completionRate: 79.6,
        trend: '+8.2%',
        topPerformer: 'Apex Institute of Tech',
        metricLabel: 'Milestones Achieved',
        metricValue: '3,450',
      },
      {
        id: 'interviews',
        name: 'AI Mock Interviews',
        description: 'Automated technical & HR mock interview sessions',
        icon: Sparkles,
        colorClass: 'perf-icon-amber',
        activeUsers: 420,
        avgAccuracy: 72.0,
        completionRate: 68.5,
        trend: '+9.4%',
        topPerformer: 'Apex Institute of Tech',
        metricLabel: 'Sessions Cleared',
        metricValue: '310',
      },
      {
        id: 'drives',
        name: 'Mock Placement Drives',
        description: 'Simulated campus recruitment & company tests',
        icon: ClipboardCheck,
        colorClass: 'perf-icon-emerald',
        activeUsers: 620,
        avgAccuracy: 78.5,
        completionRate: 84.0,
        trend: '+2.9%',
        topPerformer: 'Apex Institute of Tech',
        metricLabel: 'Drive Qualification',
        metricValue: '58%',
      },
      {
        id: 'attendance',
        name: 'Attendance & Tracking',
        description: 'Institutional class presence & defaulter monitoring',
        icon: CalendarCheck,
        colorClass: 'perf-icon-blue',
        activeUsers: 980,
        avgAccuracy: 89.2,
        completionRate: 90.5,
        trend: '+0.9%',
        topPerformer: 'Apex Institute of Tech',
        metricLabel: 'Overall Attendance',
        metricValue: '89.2%',
      },
    ]
  },
  'Meridian College': {
    kpi: { passRate: 86.0, readiness: 80.0, activeStudents: 640, trend: '+4.8%' },
    features: [
      {
        id: 'coding',
        name: 'Coding Practice & Monitoring',
        description: 'Algorithm challenges, live test runner & submissions',
        icon: Code,
        colorClass: 'perf-icon-indigo',
        activeUsers: 640,
        avgAccuracy: 81.0,
        completionRate: 83.2,
        trend: '+6.0%',
        topPerformer: 'Meridian College',
        metricLabel: 'Problems Solved',
        metricValue: '980',
      },
      {
        id: 'roadmaps',
        name: 'AI Learning Roadmaps',
        description: 'Personalized student career & skill progression',
        icon: Target,
        colorClass: 'perf-icon-purple',
        activeUsers: 580,
        avgAccuracy: 84.5,
        completionRate: 76.0,
        trend: '+6.8%',
        topPerformer: 'Meridian College',
        metricLabel: 'Milestones Achieved',
        metricValue: '1,850',
      },
      {
        id: 'interviews',
        name: 'AI Mock Interviews',
        description: 'Automated technical & HR mock interview sessions',
        icon: Sparkles,
        colorClass: 'perf-icon-amber',
        activeUsers: 640,
        avgAccuracy: 74.2,
        completionRate: 71.5,
        trend: '+12.1%',
        topPerformer: 'Meridian College',
        metricLabel: 'Sessions Cleared',
        metricValue: '512',
      },
      {
        id: 'drives',
        name: 'Mock Placement Drives',
        description: 'Simulated campus recruitment & company tests',
        icon: ClipboardCheck,
        colorClass: 'perf-icon-emerald',
        activeUsers: 450,
        avgAccuracy: 82.1,
        completionRate: 88.2,
        trend: '+3.5%',
        topPerformer: 'Meridian College',
        metricLabel: 'Drive Qualification',
        metricValue: '65%',
      },
      {
        id: 'attendance',
        name: 'Attendance & Tracking',
        description: 'Institutional class presence & defaulter monitoring',
        icon: CalendarCheck,
        colorClass: 'perf-icon-blue',
        activeUsers: 640,
        avgAccuracy: 92.0,
        completionRate: 93.0,
        trend: '+1.5%',
        topPerformer: 'Meridian College',
        metricLabel: 'Overall Attendance',
        metricValue: '92.0%',
      },
    ]
  },
  'Vanguard Institute': {
    kpi: { passRate: 81.4, readiness: 74.0, activeStudents: 890, trend: '+2.5%' },
    features: [
      {
        id: 'coding',
        name: 'Coding Practice & Monitoring',
        description: 'Algorithm challenges, live test runner & submissions',
        icon: Code,
        colorClass: 'perf-icon-indigo',
        activeUsers: 890,
        avgAccuracy: 74.5,
        completionRate: 78.5,
        trend: '+3.2%',
        topPerformer: 'Vanguard Institute',
        metricLabel: 'Problems Solved',
        metricValue: '1,150',
      },
      {
        id: 'roadmaps',
        name: 'AI Learning Roadmaps',
        description: 'Personalized student career & skill progression',
        icon: Target,
        colorClass: 'perf-icon-purple',
        activeUsers: 720,
        avgAccuracy: 80.2,
        completionRate: 74.2,
        trend: '+5.5%',
        topPerformer: 'Vanguard Institute',
        metricLabel: 'Milestones Achieved',
        metricValue: '2,100',
      },
      {
        id: 'interviews',
        name: 'AI Mock Interviews',
        description: 'Automated technical & HR mock interview sessions',
        icon: Sparkles,
        colorClass: 'perf-icon-amber',
        activeUsers: 380,
        avgAccuracy: 69.8,
        completionRate: 65.0,
        trend: '+8.0%',
        topPerformer: 'Vanguard Institute',
        metricLabel: 'Sessions Cleared',
        metricValue: '280',
      },
      {
        id: 'drives',
        name: 'Mock Placement Drives',
        description: 'Simulated campus recruitment & company tests',
        icon: ClipboardCheck,
        colorClass: 'perf-icon-emerald',
        activeUsers: 540,
        avgAccuracy: 75.0,
        completionRate: 80.5,
        trend: '+2.1%',
        topPerformer: 'Vanguard Institute',
        metricLabel: 'Drive Qualification',
        metricValue: '52%',
      },
      {
        id: 'attendance',
        name: 'Attendance & Tracking',
        description: 'Institutional class presence & defaulter monitoring',
        icon: CalendarCheck,
        colorClass: 'perf-icon-blue',
        activeUsers: 890,
        avgAccuracy: 91.5,
        completionRate: 92.8,
        trend: '+1.2%',
        topPerformer: 'Vanguard Institute',
        metricLabel: 'Overall Attendance',
        metricValue: '91.5%',
      },
    ]
  }
};

export default function Performance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table'
  const [dynamicColleges, setDynamicColleges] = useState([]);

  useEffect(() => {
    collegeAPI.getColleges()
      .then((data) => {
        if (Array.isArray(data)) {
          setDynamicColleges(data);
        }
      })
      .catch((err) => console.error('Failed to load colleges for performance:', err));
  }, []);

  const collegeOptions = [
    { value: 'all', label: 'All Registered Colleges (Platform Overview)' },
    ...dynamicColleges.map((c) => ({ value: c.name, label: c.name }))
  ];

  // Retrieve current active college dataset or default to 'all'
  const currentDataSet = collegePerformanceDB[selectedCollege] || collegePerformanceDB['all'];
  const currentKPI = currentDataSet.kpi;
  const currentFeatures = currentDataSet.features;

  const filteredFeatures = currentFeatures.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.topPerformer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const allBenchmarks = [];

  const filteredBenchmarks = allBenchmarks.filter((c) =>
    selectedCollege === 'all' || c.college === selectedCollege
  );

  return (
    <div className="performance-page-wrap">
      {/* Page Header */}
      <div className="performance-header-wrap">
        <div>
          <h2 className="performance-header-title">
          <span>Platform Performance &amp; Analytics</span>
          </h2>
          <p className="performance-header-subtitle">
            Cross-feature student engagement, completion rates, and institutional benchmarks
          </p>
        </div>
        <button className="sa-btn-primary ml-auto">
          <Award size={16} />
          <span>Export Analytics Summary</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Institutional Pass Rate</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{currentKPI.passRate}%</h3>
            <p className="sa-stats-change">
              <ArrowUpRight className="sa-stats-trend-icon sa-stats-trend-icon--up" />
              <span className="sa-stats-change-text--up">{currentKPI.trend} vs last month</span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Avg Readiness Score</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <BarChart2 size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{currentKPI.readiness} / 100</h3>
            <p className="sa-stats-change">
              <ShieldCheck className="sa-stats-trend-icon sa-stats-trend-icon--up" />
              <span className="sa-stats-change-text--up">Top Tier Benchmark</span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Active Enrolled Students</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <Users size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{currentKPI.activeStudents.toLocaleString()}</h3>
            <p className="sa-stats-change">
              <Activity className="sa-stats-trend-icon sa-stats-trend-icon--up" />
              <span className="sa-stats-change-text--up">
                {selectedCollege === 'all' ? 'Active Across Platform' : 'College Enrolled'}
              </span>
            </p>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Active Modules</span>
            <div className="sa-stats-icon-box sa-stats-icon-box--default">
              <Zap size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">5 Features</h3>
            <p className="sa-stats-change">
              <Activity className="sa-stats-trend-icon sa-stats-trend-icon--up" />
              <span className="sa-stats-change-text--up">100% Operational</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="departments-filter-card">
        <div className="sa-search-wrap dept-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search feature module name or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>

        {/* College-Wise Filter Dropdown */}
        <div className="flex items-center gap-2">
          <PerfSelect
            icon={Building2}
            value={selectedCollege}
            wrapperClass="perf-select"
            onChange={(val) => setSelectedCollege(val)}
            options={collegeOptions}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('cards')}
            className={`manageusers-tab-btn ${activeView === 'cards' ? 'manageusers-tab-btn--active' : ''}`}
          >
            <Zap size={14} />
            <span>Card Grid</span>
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`manageusers-tab-btn ${activeView === 'table' ? 'manageusers-tab-btn--active' : ''}`}
          >
            <Activity size={14} />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Selected College Filter Active Indicator Banner */}
      {selectedCollege !== 'all' && (
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="sa-icon-badge sa-icon-badge--indigo perf-filter-badge">
              <Filter size={14} />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              Filtered College View: <strong className="text-indigo-700 font-extrabold">{selectedCollege}</strong> Analytics
            </span>
          </div>
          <button
            onClick={() => setSelectedCollege('all')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
          >
            <span>Reset to Platform Overview</span>
            <X size={13} />
          </button>
        </div>
      )}

      {/* CARDS VIEW */}
      {activeView === 'cards' && (
        <div className="perf-grid">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="perf-card">
                <div>
                  <div className="perf-card-header">
                    <div className={feat.colorClass}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="perf-card-title">{feat.name}</h3>
                      <p className="perf-card-desc">{feat.description}</p>
                    </div>
                  </div>

                  <div className="perf-metrics-grid">
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Active Students</div>
                      <div className="perf-metric-val">{feat.activeUsers.toLocaleString()}</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Avg Accuracy</div>
                      <div className="perf-metric-val perf-val-emerald">{feat.avgAccuracy}%</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">{feat.metricLabel}</div>
                      <div className="perf-metric-val">{feat.metricValue}</div>
                    </div>
                    <div className="perf-metric-pill">
                      <div className="perf-metric-lbl">Growth Trend</div>
                      <div className="perf-metric-val perf-val-indigo-flex">
                        <ArrowUpRight size={14} /> {feat.trend}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="perf-progress-section">
                  <div className="perf-progress-meta">
                    <span>Completion Progress</span>
                    <span>{feat.completionRate}%</span>
                  </div>
                  <div className="perf-progress-bar-bg">
                    <div
                      className="perf-progress-bar-fill"
                      style={{ width: `${feat.completionRate}%` }}
                    ></div>
                  </div>

                  <div className="perf-card-footer">
                    <div className="perf-top-performer-tag">
                      <Building2 size={14} className="perf-top-performer-icon" />
                      <span>{selectedCollege === 'all' ? feat.topPerformer : selectedCollege}</span>
                    </div>
                    <span className="perf-top-performer-badge">
                      {selectedCollege === 'all' ? 'Top Institution' : 'College Metrics'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {activeView === 'table' && (
        <div className="batches-table-card">
          <div className="sa-table-header-bar">
            <div className="sa-table-header-title-wrap">
              <div className="sa-icon-badge sa-icon-badge--indigo">
                <Activity size={18} />
              </div>
              <h3 className="sa-table-header-title">
                {selectedCollege === 'all' ? 'Platform Feature Performance Breakdown' : `${selectedCollege} Feature Breakdown`}
              </h3>
            </div>
            <span className="sa-table-header-sub">Real-time metrics</span>
          </div>

          <div className="batches-table-wrap">
            <table className="batches-table">
              <thead>
                <tr className="batches-thead-row">
                  <th className="batches-th">Feature Module</th>
                  <th className="batches-th">Active Students</th>
                  <th className="batches-th">Completion Rate</th>
                  <th className="batches-th">Avg Accuracy</th>
                  <th className="batches-th">Institution</th>
                  <th className="batches-th-right">Growth Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <tr key={feat.id} className="batches-tr">
                      <td className="batches-td">
                        <div className="flex items-center gap-3">
                          <div className={`${feat.colorClass} perf-icon-badge-box`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="batches-batch-title">{feat.name}</div>
                            <div className="batches-batch-sub">{feat.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="batches-td">
                        <div className="font-bold text-slate-900">{feat.activeUsers.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{feat.metricLabel}: {feat.metricValue}</div>
                      </td>
                      <td className="batches-td">
                        <div className="batches-progress-wrap">
                          <div className="batches-progress-bar-bg">
                            <div className="batches-progress-bar-fill" style={{ width: `${feat.completionRate}%` }}></div>
                          </div>
                          <span className="batches-progress-text">{feat.completionRate}%</span>
                        </div>
                      </td>
                      <td className="batches-td">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {feat.avgAccuracy}%
                        </span>
                      </td>
                      <td className="batches-td">
                        <div className="sa-college-avatar-box">
                          <div className="sa-college-logo-icon-wrap">
                            <Building2 size={15} />
                          </div>
                          <span className="sa-college-name-text">
                            {selectedCollege === 'all' ? feat.topPerformer : selectedCollege}
                          </span>
                        </div>
                      </td>
                      <td className="batches-td-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <ArrowUpRight size={13} /> {feat.trend}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* College Benchmark Leaderboard Table */}
      <div className="batches-table-card">
        <div className="sa-table-header-bar">
          <div className="sa-table-header-title-wrap">
            <div className="sa-icon-badge sa-icon-badge--indigo">
              <Building2 size={18} />
            </div>
            <h3 className="sa-table-header-title">Institutional Benchmark Leaderboard</h3>
          </div>
          <span className="sa-table-header-sub">
            {selectedCollege === 'all' ? 'All Registered Colleges' : `Highlighted: ${selectedCollege}`}
          </span>
        </div>
        <div className="batches-table-wrap">
          <table className="batches-table">
            <thead>
              <tr className="batches-thead-row">
                <th className="batches-th">College Name</th>
                <th className="batches-th">Pass Rate</th>
                <th className="batches-th">Readiness Index</th>
                <th className="batches-th">Enrolled Students</th>
                <th className="batches-th-right">Top Performing Module</th>
              </tr>
            </thead>
            <tbody>
              {filteredBenchmarks.map((c) => {
                const isSelected = selectedCollege === c.college;
                return (
                  <tr
                    key={c.college}
                    className={`batches-tr ${isSelected ? 'bg-indigo-50/60 font-semibold' : ''}`}
                  >
                    <td className="batches-td">
                      <div className="sa-college-avatar-box">
                        <div className={`sa-college-logo-icon-wrap ${isSelected ? 'bg-indigo-600 text-white' : ''}`}>
                          <Building2 size={16} />
                        </div>
                        <span className={`sa-college-name-text ${isSelected ? 'text-indigo-900 font-extrabold' : ''}`}>
                          {c.college}
                        </span>
                        {isSelected && (
                          <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                            Active Selection
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="batches-td text-emerald-600 font-extrabold">
                      {c.passRate}%
                    </td>
                    <td className="batches-td font-bold text-slate-800">
                      {c.readinessScore} / 100
                    </td>
                    <td className="batches-td text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-slate-400" />
                        <span>{c.activeStudents.toLocaleString()} Students</span>
                      </div>
                    </td>
                    <td className="batches-td-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.topModule || 'Coding Practice'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
