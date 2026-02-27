import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsRes = await api.get('/exams');
        const exams = examsRes.data.exams || [];
        setRecentExams(exams.slice(0, 5));

        // Aggregate stats
        let totalParticipants = 0, totalCerts = 0;
        for (const exam of exams) {
          try {
            const pRes = await api.get(`/participants/exam/${exam._id}`);
            const participants = pRes.data.participants || [];
            totalParticipants += participants.length;
            totalCerts += participants.filter(p => p.certificateIssued).length;
          } catch {}
        }
        setStats({ exams: exams.length, participants: totalParticipants, certificates: totalCerts });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1,
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: '#888', margin: '6px 0 0', fontSize: 14 }}>
          Here's an overview of your certificate activity
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard icon="📝" label="Total Exams" value={stats?.exams} color="#1a73e8" />
        <StatCard icon="👥" label="Total Participants" value={stats?.participants} color="#34a853" />
        <StatCard icon="🎓" label="Certificates Issued" value={stats?.certificates} color="#c8a96e" />
      </div>

      {/* Recent exams */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Recent Exams</h2>
          <Link to="/exams/new" style={{
            padding: '8px 18px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
            color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600
          }}>+ New Exam</Link>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        ) : recentExams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: '#888', margin: 0 }}>No exams yet. Create your first exam!</p>
            <Link to="/exams/new" style={{
              display: 'inline-block', marginTop: 16, padding: '10px 24px',
              background: '#1a73e8', color: '#fff', borderRadius: 8,
              textDecoration: 'none', fontWeight: 600, fontSize: 14
            }}>Create Exam</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Exam Title', 'Instructor', 'Passing Score', 'Template', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExams.map(exam => (
                <tr key={exam._id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{exam.title}</td>
                  <td style={{ padding: '12px', color: '#555', fontSize: 13 }}>{exam.instructor}</td>
                  <td style={{ padding: '12px', fontSize: 13 }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 12, fontWeight: 600, fontSize: 12 }}>{exam.passingScore}%</span>
                  </td>
                  <td style={{ padding: '12px', color: '#555', fontSize: 13, textTransform: 'capitalize' }}>{exam.certificateTemplate}</td>
                  <td style={{ padding: '12px' }}>
                    <Link to={`/exams/${exam._id}`} style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
