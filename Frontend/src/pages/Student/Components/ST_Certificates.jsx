import React, { useState, useEffect, useContext } from 'react';
import { Award, Download, FileText, Loader2, Calendar } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';

export default function ST_Certificates() {
  const { user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/certificates/${user?.id || user?.userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="certificates-page" style={{ padding: '2rem' }}>
      <div className="student-header-box" style={{ marginBottom: '2rem' }}>
        <h2 className="student-header-title">
          <span>My Certificates</span>
        </h2>
        <p className="student-header-desc">
          View and download your earned training completion certificates.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="spinner" size={32} />
        </div>
      ) : certificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px' }}>
          <Award size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#334155' }}>No Certificates Yet</h3>
          <p style={{ color: '#64748b' }}>Complete your training programs to earn certificates.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {certificates.map(cert => (
            <div key={cert.id} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', color: '#3b82f6' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>{cert.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem' }}>
                    <Calendar size={14} />
                    <span>Issued: {new Date(cert.issued_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <a 
                href={cert.file_url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
              >
                <Download size={18} />
                Download Certificate
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
