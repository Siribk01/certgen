import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.exams || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete exam "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      setExams(exams.filter(e => e._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const templateEmojis = { modern: '✨', classic: '📜', elegant: '🌟', professional: '💼' };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Exams</h1>
          <p style={{ color: '#888', margin: '6px 0 0', fontSize: 14 }}>Manage your exams and issue certificates</p>
        </div>
        <Link to="/exams/new" style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
          color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14
        }}>+ New Exam</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading exams...</div>
      ) : exams.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 8px' }}>No exams yet</h2>
          <p style={{ color: '#888', margin: '0 0 24px' }}>Create your first exam to start issuing certificates</p>
          <Link to="/exams/new" style={{
            padding: '12px 28px', background: '#1a73e8', color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontWeight: 600
          }}>Create First Exam</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {exams.map(exam => (
            <div key={exam._id} style={{
              background: '#fff', borderRadius: 12, padding: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: `4px solid ${exam.primaryColor || '#1a73e8'}`,
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{templateEmojis[exam.certificateTemplate] || '✨'}</span>
                <span style={{
                  background: exam.isActive ? '#e8f5e9' : '#ffebee',
                  color: exam.isActive ? '#2e7d32' : '#c62828',
                  padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
                }}>{exam.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>{exam.title}</h3>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px', flex: 1 }}>
                {exam.description || 'No description'}
              </p>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                👤 {exam.instructor}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
                🏆 Passing: {exam.passingScore}% &nbsp;|&nbsp; {exam.certificateTemplate} template
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/exams/${exam._id}`} style={{
                  flex: 1, padding: '8px', background: '#f0f7ff', color: '#1a73e8',
                  borderRadius: 8, textDecoration: 'none', textAlign: 'center',
                  fontWeight: 600, fontSize: 13
                }}>Manage →</Link>
                <button onClick={() => handleDelete(exam._id, exam.title)} style={{
                  padding: '8px 12px', background: '#fff0f0', color: '#c62828',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
