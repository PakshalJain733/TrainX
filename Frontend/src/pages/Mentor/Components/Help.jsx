import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare, Mail, AlertTriangle, Send, CheckCircle2, Search, Filter, ShieldCheck, UserCheck } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import '../Styles/Help.css';

const defaultGrievances = [
  {
    id: 1,
    studentName: "Siddharth Rao",
    rollNo: "IT202612",
    batch: "TE-IT-2026-B",
    category: "Assessment Doubt",
    title: "Clarification required regarding Graph Traversal Test Case #4",
    description: "The time limit on Test Case 4 seems too strict for standard BFS in C++. Could you please verify the hidden test bounds?",
    date: "2026-09-05",
    status: "Pending",
    priority: "High"
  },
  {
    id: 2,
    studentName: "Neha Sharma",
    rollNo: "CS202611",
    batch: "BE-CS-2026-A",
    category: "Attendance Dispute",
    title: "Attendance marked Absent for Live Class on Sept 3rd",
    description: "I attended the live session from 10:00 AM to 11:30 AM via Google Meet link, but my status shows Absent in portal stats.",
    date: "2026-09-04",
    status: "In Progress",
    priority: "Medium"
  },
  {
    id: 3,
    studentName: "Priya Nair",
    rollNo: "EXT202607",
    batch: "BE-EXTC-2026-C",
    category: "Lab & Study Material",
    title: "Missing solution notebook for Machine Learning Module 3",
    description: "The code notebooks for Convolutional Neural Networks are giving 404 in the Study Material section.",
    date: "2026-09-02",
    status: "Resolved",
    priority: "Low"
  }
];

export default function Help() {
  const [grievances, setGrievances] = useState(defaultGrievances);
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'docs' | 'contact'
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState({});
  const [resolvedId, setResolvedId] = useState(null);

  const handleResolveGrievance = (id) => {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: 'Resolved' } : g));
    setResolvedId(id);
    setTimeout(() => setResolvedId(null), 3000);
  };

  const filteredGrievances = grievances.filter(g =>
    (g.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.rollNo || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.batch || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mentor-help-container">
      {/* Header */}
      <div className="mentor-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="mentor-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={22} color="#4f46e5" />
            <span>Mentor Support Desk & Student Grievance Portal</span>
          </h2>
          <p className="mentor-page-subtitle">
            Review and resolve student grievances, access trainer documentation, and reach out to system administrators.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('grievances')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'grievances' ? '#4f46e5' : 'transparent',
            color: activeTab === 'grievances' ? '#fff' : '#64748b',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <MessageSquare size={16} /> Student Grievances & Tickets ({grievances.filter(g => g.status !== 'Resolved').length} Active)
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'docs' ? '#4f46e5' : 'transparent',
            color: activeTab === 'docs' ? '#fff' : '#64748b',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BookOpen size={16} /> Trainer Guidelines & Docs
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'contact' ? '#4f46e5' : 'transparent',
            color: activeTab === 'contact' ? '#fff' : '#64748b',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Mail size={16} /> Super Admin Support
        </button>
      </div>

      {/* Tab Content: Student Grievances */}
      {activeTab === 'grievances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search student grievance by student name, roll no, batch, or issue title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent' }}
            />
          </div>

          {/* Grievances List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredGrievances.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
                No grievances match your search query.
              </div>
            ) : (
              filteredGrievances.map((g) => (
                <div key={g.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px' }}>
                          {g.batch}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                          {g.category}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: g.priority === 'High' ? '#ffe4e6' : '#fef3c7',
                          color: g.priority === 'High' ? '#e11d48' : '#d97706'
                        }}>
                          {g.priority} Priority
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {g.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                        Submitted by <strong>{g.studentName}</strong> ({g.rollNo}) on {g.date}
                      </p>
                    </div>

                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: g.status === 'Resolved' ? '#ecfdf5' : g.status === 'In Progress' ? '#eff6ff' : '#fffbeb',
                      color: g.status === 'Resolved' ? '#047857' : g.status === 'In Progress' ? '#1d4ed8' : '#b45309',
                      border: `1px solid ${g.status === 'Resolved' ? '#a7f3d0' : '#bfdbfe'}`
                    }}>
                      {g.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#334155', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                    "{g.description}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {g.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleResolveGrievance(g.id)}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={14} /> Mark as Resolved & Respond
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Resolved by Mentor
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Trainer Guidelines */}
      {activeTab === 'docs' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Portal Trainer Guidelines & Code Evaluation Criteria</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>1. Attendance Marking Policy</h4>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Attendance logs must be submitted within 24 hours of each live training session. Students with &lt;75% attendance are automatically flagged for intervention.</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>2. Live Session Guidelines</h4>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Always publish Google Meet / Zoom links at least 2 hours before session start. Deleted sessions sync instantly across student calendars.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Super Admin Support */}
      {activeTab === 'contact' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Contact Super Admin & System Administration</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>For batch reassignments, student transfers, or institutional portal escalations, email support directly.</p>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={24} color="#2563eb" />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Super Admin Help Desk</p>
              <p style={{ fontSize: '13px', color: '#2563eb', margin: 0 }}>admin-support@trainingportal.edu | Response time: &lt; 4 hours</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
