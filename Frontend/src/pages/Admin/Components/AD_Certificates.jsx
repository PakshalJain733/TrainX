import React, { useState, useEffect, useContext } from 'react';
import { Upload, FileText, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';

export default function AD_Certificates() {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/v1/students', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !title || !file) return;

    try {
      setLoading(true);
      setStatus(null);
      const formData = new FormData();
      formData.append('studentId', selectedStudent.id);
      formData.append('title', title);
      formData.append('file', file);

      const res = await fetch('/api/v1/certificates/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Certificate uploaded successfully!' });
        setTitle('');
        setFile(null);
        setSelectedStudent(null);
      } else {
        setStatus({ type: 'error', message: data.message || 'Upload failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An error occurred during upload.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-certificates" style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h2 className="page-title">Manage Certificates</h2>
        <p className="page-subtitle">Upload training completion certificates for students.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Col - Select Student */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>1. Select Student</h3>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No students found.</div>
            ) : (
              filteredStudents.map(student => (
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudent(student)}
                  style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #e2e8f0', 
                    cursor: 'pointer',
                    background: selectedStudent?.id === student.id ? '#eff6ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: '#0f172a' }}>{student.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{student.email}</div>
                  </div>
                  {selectedStudent?.id === student.id && <CheckCircle2 size={18} color="#3b82f6" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col - Upload Form */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>2. Upload Details</h3>
          
          {!selectedStudent ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Please select a student from the list first.</p>
            </div>
          ) : (
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Selected Student</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {selectedStudent.name} ({selectedStudent.email})
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Certificate Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., C2C Java Masterclass"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Certificate File (PDF/Image)</label>
                <input 
                  type="file" 
                  onChange={e => setFile(e.target.files[0])}
                  required
                  accept=".pdf,image/*"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc' }}
                />
              </div>

              {status && (
                <div style={{ 
                  padding: '10px', 
                  marginBottom: '1rem', 
                  borderRadius: '6px',
                  background: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: status.type === 'success' ? '#166534' : '#991b1b'
                }}>
                  {status.message}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !file || !title}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading || !file || !title ? '#94a3b8' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: loading || !file || !title ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
                Upload Certificate
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
