import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric'
});

/* ── Standalone verification page — accessible without login ─────────────────
   Routes:
     /verify          → show search form only
     /verify/:certId  → auto-verify the ID in the URL
──────────────────────────────────────────────────────────────────────────────── */
export default function VerifyPage() {
  const { certificateId: paramId } = useParams();
  const navigate = useNavigate();

  const [inputId, setInputId] = useState(paramId || '');
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Auto-verify if ID in URL
  useEffect(() => {
    if (paramId) { doVerify(paramId); }
  }, [paramId]);

  const doVerify = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setCert(null);
    setError(null);
    setSearched(true);
    try {
      const res = await api.get(`/certificates/verify/${id.trim().toUpperCase()}`);
      setCert(res.data.certificate);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found or has been revoked');
    } finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    // Update URL so the link is shareable
    navigate(`/verify/${inputId.trim().toUpperCase()}`, { replace: true });
    doVerify(inputId.trim());
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── Top nav bar ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,.08)'
      }}>
        <Link to="/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <span style={{ color: '#c8a96e', fontWeight: 800, fontSize: 18 }}>CertGen</span>
        </Link>
        <Link to="/login" style={{
          padding: '7px 16px', background: 'rgba(255,255,255,.1)', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          border: '1px solid rgba(255,255,255,.15)'
        }}>Sign In →</Link>
      </nav>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Hero text */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🔍</div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>
              Certificate Verification
            </h1>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Enter a certificate ID to instantly verify its authenticity.<br />
              Every certificate issued by CertGen can be verified here.
            </p>
          </div>

          {/* Search card */}
          <div style={{
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)', marginBottom: 20
          }}>
            <form onSubmit={handleSubmit}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)',
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8
              }}>
                Certificate ID
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={inputId}
                  onChange={e => setInputId(e.target.value.toUpperCase())}
                  placeholder="e.g. CERT-A1B2C3D4E5F6"
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: 'rgba(255,255,255,.08)',
                    border: '1.5px solid rgba(255,255,255,.2)',
                    borderRadius: 10, color: '#fff', fontSize: 14,
                    fontFamily: 'monospace', outline: 'none',
                    letterSpacing: 1,
                  }}
                />
                <button type="submit" disabled={loading || !inputId.trim()} style={{
                  padding: '12px 20px',
                  background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#c8a96e,#8B6914)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(200,169,110,.3)'
                }}>
                  {loading ? '⏳' : '🔍 Verify'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', margin: '8px 0 0' }}>
                Certificate IDs are printed on every certificate and included in the email
              </p>
            </form>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,.5)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              Verifying certificate...
            </div>
          )}

          {/* Error */}
          {!loading && error && searched && (
            <div style={{
              background: 'rgba(198,40,40,.15)', border: '1px solid rgba(198,40,40,.4)',
              borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ background: 'rgba(198,40,40,.2)', padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
                <h2 style={{ color: '#ff8a80', margin: '0 0 4px', fontSize: 18 }}>Certificate Not Found</h2>
                <p style={{ color: 'rgba(255,255,255,.5)', margin: 0, fontSize: 13 }}>{error}</p>
              </div>
              <div style={{ padding: '16px 24px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, margin: 0 }}>
                  Searched for: <code style={{ background: 'rgba(255,255,255,.1)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{paramId || inputId}</code>
                </p>
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, margin: '8px 0 0' }}>
                  Please check the certificate ID and try again. Certificate IDs are case-insensitive.
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {!loading && cert && (
            <div style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
            }}>
              {/* Green header */}
              <div style={{
                background: 'linear-gradient(135deg,#34a853,#1b8a3b)',
                padding: '24px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 44 }}>✅</div>
                <h2 style={{ color: '#fff', margin: '10px 0 4px', fontSize: 20, fontWeight: 800 }}>
                  Certificate Verified
                </h2>
                <p style={{ color: 'rgba(255,255,255,.8)', margin: 0, fontSize: 13 }}>
                  This is a valid, authentic certificate issued by CertGen
                </p>
              </div>

              {/* Certificate details */}
              <div style={{ padding: '24px' }}>
                {/* Participant */}
                <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    Awarded To
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 }}>{cert.participantName}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{cert.participantEmail}</div>
                </div>

                {/* Details table */}
                <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
                  {[
                    { label: '📚 Exam / Course', value: cert.examTitle },
                    { label: '👤 Instructor', value: cert.instructorName },
                    cert.organization && { label: '🏢 Organization', value: cert.organization },
                    cert.score !== undefined && { label: '📊 Score', value: `${cert.score}%` },
                    cert.grade && { label: '🏆 Grade', value: cert.grade },
                    cert.examDate && { label: '📅 Exam Date', value: formatDate(cert.examDate) },
                    { label: '🗓 Issue Date', value: formatDate(cert.issueDate || cert.createdAt) },
                    { label: '🔑 Certificate ID', value: cert.certificateId },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '8px 0', borderBottom: '1px solid #eef0f8'
                    }}>
                      <span style={{
                        fontSize: label.includes('ID') ? 12 : 13,
                        color: '#1a1a2e',
                        fontWeight: 600,
                        textAlign: 'right',
                        fontFamily: label.includes('ID') ? 'monospace' : 'inherit'
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Authenticity badge */}
                <div style={{
                  background: '#f0f9f4', border: '1px solid #a5d6a7',
                  borderRadius: 10, padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#2e7d32'
                }}>
                  🔒 Verified by CertGen — This certificate's authenticity has been confirmed
                </div>

                {/* Verify another */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => { setCert(null); setError(null); setSearched(false); setInputId(''); navigate('/verify'); }}
                    style={{
                      padding: '8px 20px', background: '#f0f0f0', color: '#555', border: 'none',
                      borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit'
                    }}>
                    🔍 Verify Another Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* How it works — shown when no search yet */}
          {!searched && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 8 }}>
              {[
                { icon: '📜', title: 'Find Your ID', desc: 'Check your certificate PDF or the email you received' },
                { icon: '🔍', title: 'Enter & Search', desc: 'Type the ID above and click Verify' },
                { icon: '✅', title: 'Instant Result', desc: 'See all certificate details confirmed' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 12, padding: 16, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, margin: 0 }}>
          CertGen Certificate Verification System · All certificates are cryptographically secured
        </p>
      </div>
    </div>
  );
}