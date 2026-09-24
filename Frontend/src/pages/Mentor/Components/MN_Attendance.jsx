import React, { useState, useEffect } from 'react';
import { CalendarCheck, Upload, Users, Save, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import CustomSelect from '../../../components/ui/CustomSelect';
import "../Styles/MN_Attendance.css";

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [sessionName, setSessionName] = useState('Data Structures & Algorithms');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [roster, setRoster] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch("/mentor/attendance/batches")
      .then(res => {
        if (res && res.data && res.data.batches) {
          setBatches(res.data.batches);
          if (res.data.batches.length > 0) {
            setSelectedBatchId(res.data.batches[0].id);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBatchId && batches.length > 0) {
      const batch = batches.find(b => b.id === selectedBatchId);
      if (batch && batch.students) {
        // Initialize local roster state for marking
        setRoster(batch.students.map(st => ({ ...st, marked: 'Present' })));
      }
    }
  }, [selectedBatchId, batches]);

  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(st => ({ ...st, marked: status })));
  };

  const handleToggleStudent = (id, status) => {
    setRoster(prev => prev.map(st => st.id === id ? { ...st, marked: status } : st));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiFetch("/mentor/attendance/save", {
        method: "POST",
        body: JSON.stringify({
          batchId: selectedBatchId,
          session: sessionName,
          date: sessionDate,
          attendance: roster.map(r => ({ studentId: r.id, status: r.marked }))
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b' }}>
        <RefreshCw size={28} style={{ animation: 'spin 1.2s linear infinite', color: '#4f46e5', marginBottom: 14 }} />
        <p>Loading attendance rosters...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  const activeBatch = batches.find(b => b.id === selectedBatchId);
  const presentCount = roster.filter(r => r.marked === 'Present').length;
  const absentCount = roster.filter(r => r.marked === 'Absent').length;

  return (
    <div className="mentor-attendance-container">
      {/* Inline Mentor Attendance Page Header */}
      <div className="mentor-attendance-page-header">
        <div>
          <h2 className="mentor-attendance-page-title">
            <CalendarCheck size={20} color="#4f46e5" />
            <span>Attendance Management</span>
          </h2>
          <p className="mentor-attendance-page-subtitle">
            Record daily live session attendance and monitor student presence
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '6px', color: '#047857', marginBottom: '24px', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 500, fontSize: '14px' }}>Attendance recorded successfully for {activeBatch?.name}!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        
        {/* Controls Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '15px' }}>Session Details</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#475569' }}>Select Batch</label>
                <CustomSelect
                  value={selectedBatchId}
                  options={batches.map(b => ({ value: b.id, label: b.name }))}
                  onChange={val => setSelectedBatchId(val)}
                  placeholder="Select batch..."
                  icon={Users}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#475569' }}>Session / Subject</label>
                <input 
                  type="text" 
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#475569' }}>Date</label>
                <input 
                  type="date" 
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Total Students</span>
                <span style={{ fontWeight: 600 }}>{roster.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Present</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{presentCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Absent</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{absentCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roster Area */}
        <Card>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <CardTitle style={{ fontSize: '16px', marginBottom: '4px' }}>Mark Attendance</CardTitle>
              <CardDescription>{activeBatch?.name}</CardDescription>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('Present')}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('Absent')}>
                Mark All Absent
              </Button>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {roster.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No students found in this batch.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                    <tr>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Roll / PRN</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Student Name</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 24px', fontSize: '14px', color: '#64748b' }}>{st.roll}</td>
                        <td style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{st.name}</td>
                        <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '4px' }}>
                            <button 
                              onClick={() => handleToggleStudent(st.id, 'Present')}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '13px', 
                                fontWeight: 500, 
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: st.marked === 'Present' ? '#10b981' : 'transparent',
                                color: st.marked === 'Present' ? 'white' : '#64748b'
                              }}
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => handleToggleStudent(st.id, 'Absent')}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '13px', 
                                fontWeight: 500, 
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: st.marked === 'Absent' ? '#ef4444' : 'transparent',
                                color: st.marked === 'Absent' ? 'white' : '#64748b'
                              }}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {roster.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                <Button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
