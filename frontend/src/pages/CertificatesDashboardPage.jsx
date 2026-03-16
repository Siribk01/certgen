import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

export default function CertificatesDashboardPage() {
  const { user } = useAuth()
  const width = useWindowWidth()
  const isMobile = width < 640
  const isTablet = width < 1024

  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [participants, setParticipants] = useState([])
  const [certificates, setCertificates] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loadingExams, setLoadingExams] = useState(true)
  const [loadingParts, setLoadingParts] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showExamList, setShowExamList] = useState(true)

  useEffect(() => {
    api.get('/exams')
      .then(r => setExams(r.data.exams || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoadingExams(false))
  }, [])

  const loadExamData = useCallback(async (examId) => {
    setLoadingParts(true)
    setSelected(new Set())
    setSearchTerm('')
    setFilterStatus('all')
    try {
      const [pRes, cRes] = await Promise.all([
        api.get(`/participants/exam/${examId}`),
        api.get(`/certificates?exam=${examId}`),
      ])
      setParticipants(pRes.data.participants || [])
      setCertificates(cRes.data.certificates || [])
    } catch { toast.error('Failed to load data') }
    finally { setLoadingParts(false) }
  }, [])

  const selectExam = (exam) => {
    setSelectedExam(exam)
    loadExamData(exam._id)
    if (isMobile) setShowExamList(false)
  }

  // participantId → cert map
  const certMap = {}
  certificates.forEach(c => {
    if (c.participant) certMap[c.participant._id || c.participant] = c
  })

  const issuedCount = participants.filter(p => certMap[p._id]).length
  const pendingCount = participants.filter(p => !certMap[p._id]).length

  // ── Filters: all / issued / not_issued only (no "passed" filter) ──────────
  const filtered = participants.filter(p => {
    const q = searchTerm.toLowerCase()
    const match = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    if (filterStatus === 'issued') return match && !!certMap[p._id]
    if (filterStatus === 'not_issued') return match && !certMap[p._id]
    return match // 'all'
  })

  // selection helpers — all participants eligible
  const toggleSelect = id => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s) }
  const selectPending = () => setSelected(new Set(filtered.filter(p => !certMap[p._id]).map(p => p._id)))
  const selectAll = () => setSelected(new Set(filtered.map(p => p._id)))
  const clearSel = () => setSelected(new Set())

  // generate / send
  const handleBulkGenerate = async (sendEmail = true) => {
    if (!selected.size) return toast.error('Select at least one participant')
    setGenerating(true)
    try {
      const res = await api.post('/certificates/bulk-generate', {
        participantIds: Array.from(selected), sendEmail
      })
      const { successful = 0, failed = 0 } = res.data
      toast.success(`✅ ${successful} certificate(s) ${sendEmail ? 'generated & sent' : 'generated'}!`)
      if (failed > 0) toast.error(`${failed} failed`)
      await loadExamData(selectedExam._id)
      clearSel()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed')
    } finally { setGenerating(false) }
  }

  // single download
  const handleDownload = async (participantId) => {
    setActionLoading(a => ({ ...a, [participantId]: 'downloading' }))
    try {
      await api.post(`/certificates/generate/${participantId}`, { sendEmail: false })
      const cRes = await api.get(`/certificates?exam=${selectedExam._id}`)
      const updated = cRes.data.certificates || []
      setCertificates(updated)
      const map = {}
      updated.forEach(c => { if (c.participant) map[c.participant._id || c.participant] = c })
      const cert = map[participantId]
      if (cert?.pdfPath) {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
        const file = cert.pdfPath.split(/[\\/]/).pop()
        window.open(`${base}/certificates/${file}`, '_blank')
      }
      toast.success('Certificate ready!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed')
    } finally { setActionLoading(a => ({ ...a, [participantId]: null })) }
  }

  // single email
  const handleSendEmail = async (participantId) => {
    setActionLoading(a => ({ ...a, [participantId]: 'sending' }))
    try {
      await api.post(`/certificates/generate/${participantId}`, { sendEmail: true })
      toast.success('Certificate sent!')
      await loadExamData(selectedExam._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed')
    } finally { setActionLoading(a => ({ ...a, [participantId]: null })) }
  }

  // bulk zip download
  const handleBulkDownload = async () => {
    if (!selectedExam) return
    if (issuedCount === 0) {
      toast.error('No issued certificates to download yet. Generate some first.')
      return
    }
    setZipping(true)
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
      const token = localStorage.getItem('token')
      const res = await fetch(
        `${base}/api/certificates/download-zip?exam=${selectedExam._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        let msg = 'Download failed'
        try { const j = await res.json(); msg = j.message || msg } catch { }
        toast.error(msg); return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `certificates_${selectedExam.title.replace(/\s+/g, '_')}.zip`
      })
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`📦 ZIP downloaded (${issuedCount} certificate${issuedCount !== 1 ? 's' : ''})`)
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    } finally { setZipping(false) }
  }

  // revoke
  const handleRevoke = async (certId) => {
    if (!window.confirm('Revoke this certificate?')) return
    try {
      await api.delete(`/certificates/${certId}`)
      toast.success('Certificate revoked')
      await loadExamData(selectedExam._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Revoke failed')
    }
  }

  const btn = (bg, color, border = 'none') => ({
    padding: isMobile ? '8px 12px' : '8px 16px',
    background: bg, color, border, borderRadius: 8,
    fontSize: isMobile ? 12 : 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1.4, fontFamily: 'inherit',
  })

  const StatCard = ({ label, value, color, emoji }) => (
    <div style={{
      background: '#fff', borderRadius: 12,
      padding: isMobile ? '12px 14px' : '16px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  )

  if (user?.role !== 'admin') return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2>Admin Access Required</h2>
      <Link to="/dashboard" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</Link>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", minHeight: '100vh' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
          🎓 Certificate Management
        </h1>
        <p style={{ color: '#888', margin: 0, fontSize: 13 }}>
          Generate, download and email certificates to all participants
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '260px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Exam list ── */}
        <div>
          {isTablet && selectedExam && (
            <button onClick={() => setShowExamList(v => !v)}
              style={{
                ...btn('#f0f7ff', '#1a73e8', '1px solid #c5d9f7'), width: '100%', marginBottom: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              {showExamList ? '▲ Hide exam list' : `▼ Change exam: ${selectedExam.title}`}
            </button>
          )}
          {(!isTablet || showExamList) && (
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
                📝 Select Exam
              </div>
              <div style={{ maxHeight: isTablet ? 220 : 540, overflowY: 'auto' }}>
                {loadingExams ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>Loading...</div>
                ) : exams.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                    No exams yet. <Link to="/exams/new" style={{ color: '#1a73e8' }}>Create one →</Link>
                  </div>
                ) : exams.map(exam => (
                  <div key={exam._id} onClick={() => selectExam(exam)} style={{
                    padding: '13px 18px', cursor: 'pointer', borderBottom: '1px solid #f8f8f8',
                    borderLeft: selectedExam?._id === exam._id ? '3px solid #1a73e8' : '3px solid transparent',
                    background: selectedExam?._id === exam._id ? '#e8f0fe' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedExam?._id === exam._id ? '#1a73e8' : '#333' }}>
                      {exam.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{exam.instructor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div>
          {!selectedExam ? (
            <div style={{
              background: '#fff', borderRadius: 12, padding: isMobile ? 32 : 60,
              textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.06)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
              <h3 style={{ color: '#1a1a2e', margin: '0 0 8px' }}>Select an exam to manage certificates</h3>
              <p style={{ color: '#aaa', margin: 0, fontSize: 13 }}>Choose from the exam list {isTablet ? 'above' : 'on the left'}</p>
            </div>
          ) : (
            <>
              {/* Exam header */}
              <div style={{
                background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', borderRadius: 12,
                padding: isMobile ? 16 : '18px 24px', marginBottom: 14, color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
              }}>
                <div>
                  <h2 style={{ margin: '0 0 3px', fontSize: isMobile ? 15 : 18, fontWeight: 800 }}>{selectedExam.title}</h2>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                    {selectedExam.instructor}{selectedExam.organization ? ` · ${selectedExam.organization}` : ''}
                  </p>
                </div>
                <Link to={`/exams/${selectedExam._id}/certificate-design`} style={{
                  padding: '7px 14px', background: 'rgba(255,255,255,.15)', color: '#fff',
                  borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700,
                  backdropFilter: 'blur(4px)', whiteSpace: 'nowrap'
                }}>🎨 Edit Design</Link>
              </div>

              {/* Stats */}
              {!loadingParts && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
                  gap: 10, marginBottom: 14
                }}>
                  <StatCard label="Total" value={participants.length} color="#1a73e8" emoji="👥" />
                  <StatCard label="Passed" value={participants.filter(p => p.passed).length} color="#2e7d32" emoji="✅" />
                  <StatCard label="Issued" value={issuedCount} color="#c8a96e" emoji="🎓" />
                  <StatCard label="Pending" value={pendingCount} color="#e65100" emoji="⏳" />
                </div>
              )}

              {/* Bulk ZIP download */}
              {!loadingParts && (
                <div style={{
                  background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)',
                  border: '1.5px solid #a5d6a7', borderRadius: 12,
                  padding: isMobile ? 14 : '16px 20px', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1b5e20' }}>📦 Bulk Download All Certificates</div>
                    <div style={{ fontSize: 12, color: '#388e3c', marginTop: 3 }}>
                      {issuedCount > 0
                        ? `${issuedCount} issued certificate${issuedCount !== 1 ? 's' : ''} ready — downloads as ZIP`
                        : 'No certificates issued yet for this exam'}
                    </div>
                  </div>
                  <button onClick={handleBulkDownload} disabled={zipping || issuedCount === 0} style={{
                    ...btn(issuedCount === 0 ? '#ccc' : 'linear-gradient(135deg,#2e7d32,#1b5e20)', '#fff'),
                    opacity: issuedCount === 0 ? 0.6 : 1,
                    cursor: issuedCount === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: issuedCount > 0 ? '0 4px 14px rgba(46,125,50,.3)' : 'none',
                    padding: '10px 20px', fontSize: 13,
                  }}>
                    {zipping ? '⏳ Preparing ZIP...' : `⬇️ Download All ZIP (${issuedCount})`}
                  </button>
                </div>
              )}

              {/* Bulk generate actions */}
              {!loadingParts && (
                <div style={{
                  background: '#fff', borderRadius: 12, padding: isMobile ? 12 : '14px 18px',
                  marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)'
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 10
                  }}>Bulk Generate</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={selectPending} style={{ ...btn('#f0f7ff', '#1a73e8', '1px solid #c5d9f7') }}>
                      Select Pending ({pendingCount})
                    </button>
                    <button onClick={selectAll} style={{ ...btn('#f5f5f5', '#555', '1px solid #e0e0e0') }}>
                      Select All ({participants.length})
                    </button>
                    {selected.size > 0 && (
                      <button onClick={clearSel} style={{ ...btn('#fff5f5', '#c62828', '1px solid #ffcdd2') }}>
                        ✕ Clear ({selected.size})
                      </button>
                    )}
                    {selected.size > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <button onClick={() => handleBulkGenerate(false)} disabled={generating} style={{
                          ...btn('#f0f7ff', '#1a73e8', '1px solid #c5d9f7'),
                          opacity: generating ? 0.6 : 1, cursor: generating ? 'not-allowed' : 'pointer'
                        }}>
                          {generating ? '⏳' : '📄'} Generate ({selected.size})
                        </button>
                        <button onClick={() => handleBulkGenerate(true)} disabled={generating} style={{
                          ...btn('linear-gradient(135deg,#1a73e8,#0d47a1)', '#fff'),
                          opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(26,115,232,.25)',
                        }}>
                          {generating ? '⏳ Processing...' : `📧 Generate & Email (${selected.size})`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search + filter — only All / Issued / Not Issued */}
              {!loadingParts && (
                <div style={{
                  background: '#fff', borderRadius: 12, padding: isMobile ? 10 : '11px 16px',
                  marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                  display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'
                }}>
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="🔍 Search name or email..." style={{
                      flex: 1, minWidth: 160, padding: '8px 12px',
                      border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13,
                      outline: 'none', fontFamily: 'inherit'
                    }} />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { v: 'all', label: `All (${participants.length})` },
                      { v: 'issued', label: `Issued (${issuedCount})` },
                      { v: 'not_issued', label: `Not Issued (${pendingCount})` },
                    ].map(({ v, label }) => (
                      <button key={v} onClick={() => setFilterStatus(v)} style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: filterStatus === v ? 700 : 400, fontFamily: 'inherit',
                        background: filterStatus === v ? '#1a73e8' : '#f5f5f5',
                        color: filterStatus === v ? '#fff' : '#555',
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants list */}
              {loadingParts ? (
                <div style={{
                  background: '#fff', borderRadius: 12, padding: 48,
                  textAlign: 'center', color: '#aaa', boxShadow: '0 2px 12px rgba(0,0,0,.06)'
                }}>
                  Loading participants...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{
                  background: '#fff', borderRadius: 12, padding: 40,
                  textAlign: 'center', color: '#aaa', boxShadow: '0 2px 12px rgba(0,0,0,.06)', fontSize: 13
                }}>
                  No participants match the current filter
                </div>
              ) : isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map(p => {
                    const cert = certMap[p._id]
                    const al = actionLoading[p._id]
                    return (
                      <div key={p._id} style={{
                        background: selected.has(p._id) ? '#e8f0fe' : '#fff',
                        borderRadius: 12, padding: '14px 16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,.06)',
                        border: selected.has(p._id) ? '1.5px solid #1a73e8' : '1.5px solid transparent',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)}
                              style={{ width: 16, height: 16, accentColor: '#1a73e8', cursor: 'pointer', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: '#aaa' }}>{p.email}</div>
                            </div>
                          </div>
                          {cert ? (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff8e1', color: '#c8a96e' }}>🎓 Issued</span>
                          ) : (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3e0', color: '#e65100' }}>⏳ Pending</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>
                            {p.score !== undefined ? `${p.score}%` : '—'}
                            {p.grade && <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 5 }}>{p.grade}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => handleDownload(p._id)} disabled={!!al}
                            style={{ ...btn('#f0f7ff', '#1a73e8', '1px solid #c5d9f7'), flex: 1 }}>
                            {al === 'downloading' ? '⏳' : '⬇️'} Download
                          </button>
                          <button onClick={() => handleSendEmail(p._id)} disabled={!!al}
                            style={{ ...btn('#e8f5e9', '#2e7d32', '1px solid #c8e6c9'), flex: 1 }}>
                            {al === 'sending' ? '⏳' : '📧'} Email
                          </button>
                          {cert && (
                            <button onClick={() => handleRevoke(cert._id)}
                              style={{ ...btn('#fff5f5', '#c62828', '1px solid #ffcdd2'), padding: '8px 12px' }}>🗑️</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead>
                        <tr style={{ background: '#f8f9ff', borderBottom: '2px solid #e8eaf0' }}>
                          {['', 'Participant', 'Score', 'Certificate', 'Actions'].map((h, i) => (
                            <th key={i} style={{
                              padding: '12px 14px', textAlign: i <= 1 ? 'left' : 'center',
                              fontSize: 11, fontWeight: 700, color: '#888',
                              textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                              width: i === 0 ? 36 : undefined,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => {
                          const cert = certMap[p._id]
                          const al = actionLoading[p._id]
                          return (
                            <tr key={p._id} style={{
                              borderBottom: '1px solid #f5f5f5',
                              background: selected.has(p._id) ? '#e8f0fe' : i % 2 === 0 ? '#fff' : '#fafafa'
                            }}>
                              <td style={{ padding: '11px 14px' }}>
                                <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)}
                                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#1a73e8' }} />
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{p.email}</div>
                              </td>
                              <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: p.passed ? '#2e7d32' : '#e65100' }}>
                                  {p.score !== undefined ? `${p.score}%` : '—'}
                                </span>
                                {p.grade && <div style={{ fontSize: 10, color: '#aaa' }}>{p.grade}</div>}
                              </td>
                              <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                {cert ? (
                                  <>
                                    <span style={{
                                      padding: '3px 10px', borderRadius: 20, fontSize: 11,
                                      fontWeight: 700, background: '#fff8e1', color: '#c8a96e'
                                    }}>🎓 Issued</span>
                                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>
                                      {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                                    </div>
                                  </>
                                ) : (
                                  <span style={{
                                    padding: '3px 10px', borderRadius: 20, fontSize: 11,
                                    fontWeight: 700, background: '#fff3e0', color: '#e65100'
                                  }}>⏳ Pending</span>
                                )}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                  <button onClick={() => handleDownload(p._id)} disabled={!!al} title="Generate & download PDF"
                                    style={{
                                      ...btn('#f0f7ff', '#1a73e8', '1px solid #c5d9f7'),
                                      opacity: al ? 0.6 : 1, cursor: al ? 'not-allowed' : 'pointer'
                                    }}>
                                    {al === 'downloading' ? '⏳' : '⬇️'} PDF
                                  </button>
                                  <button onClick={() => handleSendEmail(p._id)} disabled={!!al} title="Send by email"
                                    style={{
                                      ...btn('#e8f5e9', '#2e7d32', '1px solid #c8e6c9'),
                                      opacity: al ? 0.6 : 1, cursor: al ? 'not-allowed' : 'pointer'
                                    }}>
                                    {al === 'sending' ? '⏳' : '📧'} Email
                                  </button>
                                  {cert && (
                                    <button onClick={() => handleRevoke(cert._id)} title="Revoke"
                                      style={{ ...btn('#fff5f5', '#c62828', '1px solid #ffcdd2') }}>🗑️</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}