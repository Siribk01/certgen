import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyPage() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/certificates/verify/${certificateId}`);
        setCert(res.data.certificate);
      } catch (err) {
        setError(err.response?.data?.message || 'Certificate not found');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateId]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
            <div style={{ color: '#c8a96e', fontWeight: 700, fontSize: 18 }}>CertGen</div>
          </Link>
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
        }}>
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <p>Verifying certificate...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 style={{ color: '#c62828', margin: '0 0 8px' }}>Invalid Certificate</h2>
              <p style={{ color: '#888', margin: '0 0 24px' }}>{error}</p>
              <p style={{ color: '#888', fontSize: 13 }}>Certificate ID: <code>{certificateId}</code></p>
            </div>
          )}

          {cert && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #34a853, #1b8a3b)',
                padding: '32px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 52 }}>✅</div>
                <h2 style={{ color: '#fff', margin: '12px 0 4px', fontSize: 22 }}>Certificate Verified</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 14 }}>
                  This is a valid, authentic certificate
                </p>
              </div>

              <div style={{ padding: '32px' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Awarded To</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{cert.participantName}</div>
                  <div style={{ fontSize: 14, color: '#888' }}>{cert.participantEmail}</div>
                </div>

                <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
                  {[
                    { label: 'Exam / Course', value: cert.examTitle },
                    { label: 'Instructor', value: cert.instructorName },
                    cert.score !== undefined && { label: 'Score', value: `${cert.score}%` },
                    { label: 'Issue Date', value: formatDate(cert.issueDate) },
                    { label: 'Certificate ID', value: cert.certificateId },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#fffbf0', border: '1px solid #ffe082', borderRadius: 8,
                  padding: '12px 16px', fontSize: 13, color: '#795548', textAlign: 'center'
                }}>
                  🔒 This certificate's authenticity has been verified by CertGen
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
