import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ExamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [tab, setTab] = useState('participants');
  const [selected, setSelected] = useState(new Set());          // selected participant IDs
  const [newP, setNewP] = useState({ name: '', email: '', score: '', grade: '', examDate: '', customFieldValues: {} });
  const [bulkText, setBulkText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [eRes, pRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/participants/exam/${id}`)
      ]);
      setExam(eRes.data.exam);
      setParticipants(pRes.data.participants || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (pid) => {
    const next = new Set(selected);
    next.has(pid) ? next.delete(pid) : next.add(pid);
    setSelected(next);
  };

  const selectAll = () => {
    const passedIds = participants.filter(p => p.passed).map(p => p._id);
    setSelected(new Set(passedIds));
  };

  const clearSelection = () => setSelected(new Set());

  // ── Add participant ───────────────────────────────────────────────────────
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/participants', {
        examId: id,
        name: newP.name,
        email: newP.email,
        score: newP.score !== '' ? Number(newP.score) : undefined,
        grade: newP.grade || undefined,
        examDate: newP.examDate || undefined,
        customFieldValues: newP.customFieldValues
      });
      toast.success('Participant added');
      setNewP({ name: '', email: '', score: '', grade: '', examDate: '', customFieldValues: {} });
      setTab('participants');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add participant');
    }
  };

  // ── Bulk import ───────────────────────────────────────────────────────────
  const handleBulkImport = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const customKeys = (exam?.customFields || []).map(f => f.key);
    const parsed = lines.map(line => {
      const cols = line.split(',').map(s => s.trim());
      const [name, email, score, grade, ...rest] = cols;
      const customFieldValues = {};
      customKeys.forEach((k, i) => { if (rest[i]) customFieldValues[k] = rest[i]; });
      return { name, email, score: score ? Number(score) : undefined, grade: grade || undefined, customFieldValues };
    }).filter(p => p.name && p.email);
    if (!parsed.length) { toast.error('No valid rows found'); return; }
    try {
      await api.post('/participants/bulk', { examId: id, participants: parsed });
      toast.success(`${parsed.length} participants imported`);
      setBulkText('');
      setTab('participants');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk import failed'); }
  };

  // ── Issue certificate for one participant ─────────────────────────────────
  const handleIssueOne = async (participantId, name) => {
    setActionLoading(a => ({ ...a, [participantId]: true }));
    try {
      await api.post(`/certificates/generate/${participantId}`, { sendEmail: true });
      toast.success(`Certificate issued & emailed to ${name}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(a => ({ ...a, [participantId]: false }));
    }
  };

  // ── Bulk issue certificates for selected participants ──────────────────────
  const handleBulkSend = async () => {
    if (!selected.size) { toast.error('Select at least one participant'); return; }
    if (!window.confirm(`Issue & email certificates to ${selected.size} selected participant(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await api.post('/certificates/bulk-generate', {
        participantIds: Array.from(selected),
        sendEmail: true
      });
      const ok = res.data.results?.filter(r => r.success).length || 0;
      const fail = res.data.results?.filter(r => !r.success) || [];
      toast.success(`${ok} certificate(s) issued and emailed`);
      if (fail.length) toast.error(`${fail.length} failed: ${fail.map(r => r.error).join(', ')}`);
      setSelected(new Set());
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk send failed');
    } finally { setBulkLoading(false); }
  };

  // ── Delete participant ─────────────────────────────────────────────────────
  const handleDelete = async (pid) => {
    if (!window.confirm('Remove this participant?')) return;
    try {
      await api.delete(`/participants/${pid}`);
      toast.success('Removed');
      fetchData();
    } catch { toast.error('Failed to remove'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#888', fontFamily: 'Inter,sans-serif' }}>Loading...</div>;
  if (!exam) return <div style={{ padding: 40, fontFamily: 'Inter,sans-serif' }}>Exam not found. <Link to="/exams">← Back</Link></div>;

  const passed = participants.filter(p => p.passed).length;
  const withCerts = participants.filter(p => p.certificateIssued).length;
  const customFields = exam.customFields || [];

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 18px',
      background: tab === id ? '#1a73e8' : 'transparent',
      color: tab === id ? '#fff' : '#555',
      border: tab === id ? 'none' : '1.5px solid #e0e0e0',
      borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13
    }}>{label}</button>
  );

  const inp = {
    padding: '9px 13px', border: '1.5px solid #e0e0e0',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%'
  };

  const Lbl = ({ children }) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666',
      marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</label>
  );

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/exams" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Back to Exams</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{exam.title}</h1>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>
              {exam.instructor}{exam.organization ? ` · ${exam.organization}` : ''} &nbsp;|&nbsp; Passing: {exam.passingScore}%
            </p>
            {user?.role === 'admin' && (
              <Link to={`/exams/${id}/certificate-design`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                padding: '7px 16px', background: 'linear-gradient(135deg, #c8a96e, #8B6914)',
                color: '#fff', borderRadius: 8, textDecoration: 'none',
                fontWeight: 700, fontSize: 12, boxShadow: '0 2px 8px rgba(200,169,110,0.35)'
              }}>
                🎨 Customise Certificate Design
              </Link>
            )}
          </div>
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={clearSelection} style={{
                padding: '9px 16px', background: '#f5f5f5', color: '#555',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13
              }}>✕ Clear ({selected.size})</button>
              <button onClick={handleBulkSend} disabled={bulkLoading} style={{
                padding: '9px 20px', background: bulkLoading ? '#999' : 'linear-gradient(135deg,#c8a96e,#8B6914)',
                color: '#fff', border: 'none', borderRadius: 8, cursor: bulkLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 13
              }}>
                {bulkLoading ? '⏳ Sending...' : `🎓 Issue & Send (${selected.size})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { v: participants.length, l: 'Total', c: '#1a73e8' },
          { v: passed, l: 'Passed', c: '#34a853' },
          { v: participants.length - passed, l: 'Failed', c: '#ea4335' },
          { v: withCerts, l: 'Certs Issued', c: '#c8a96e' },
        ].map(({ v, l, c }) => (
          <div key={l} style={{
            background: '#fff', borderRadius: 10, padding: '14px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,.06)', borderLeft: `4px solid ${c}`, flex: '1 1 120px'
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e' }}>{v}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabBtn('participants', `👥 Participants (${participants.length})`)}
        {tabBtn('add', '➕ Add Participant')}
        {tabBtn('bulk', '📥 Bulk Import')}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>

        {/* ── Participants Table ── */}
        {tab === 'participants' && (
          <>
            {passed > 0 && selected.size === 0 && (
              <div style={{ background: '#fffbf0', border: '1px solid #ffe082', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#795548', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📌 Check the boxes next to participants to select them, then click <strong>Issue &amp; Send</strong>.</span>
                <button onClick={selectAll} style={{
                  padding: '6px 14px', background: '#1a73e8', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12
                }}>Select All Passed ({passed})</button>
              </div>
            )}
            {participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ color: '#888' }}>No participants yet. Add some!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                      <th style={{ width: 40, padding: '8px 8px 8px 0' }}>
                        <input type="checkbox"
                          checked={selected.size === passed && passed > 0}
                          onChange={e => e.target.checked ? selectAll() : clearSelection()} />
                      </th>
                      {['Name', 'Email', 'Score', 'Grade', 'Status',
                        ...customFields.map(f => f.label),
                        'Certificate', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700,
                          color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f8f8f8',
                        background: selected.has(p._id) ? '#f0f7ff' : 'transparent' }}>
                        <td style={{ padding: '10px 8px 10px 0' }}>
                          {p.passed && (
                            <input type="checkbox"
                              checked={selected.has(p._id)}
                              onChange={() => toggleSelect(p._id)} />
                          )}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600, color: '#1a1a2e', fontSize: 13, whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '10px', color: '#666', fontSize: 12 }}>{p.email}</td>
                        <td style={{ padding: '10px', fontSize: 13 }}>
                          {p.score !== undefined
                            ? <span style={{ background: p.passed ? '#e8f5e9' : '#ffebee', color: p.passed ? '#2e7d32' : '#c62828', padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: 12 }}>{p.score}%</span>
                            : <span style={{ color: '#ccc' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px', color: '#555', fontSize: 12 }}>{p.grade || <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: p.passed ? '#e8f5e9' : '#ffebee', color: p.passed ? '#2e7d32' : '#c62828',
                            padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>
                            {p.passed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                        {customFields.map(f => (
                          <td key={f.key} style={{ padding: '10px', fontSize: 12, color: '#555' }}>
                            {(p.customFieldValues instanceof Map
                              ? p.customFieldValues.get(f.key)
                              : p.customFieldValues?.[f.key]) || <span style={{ color: '#ccc' }}>—</span>}
                          </td>
                        ))}
                        <td style={{ padding: '10px', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {p.certificateIssued
                            ? <span style={{ color: '#2e7d32', fontWeight: 600 }}>✓ {p.certificateSentAt ? 'Sent' : 'Issued'}</span>
                            : <span style={{ color: '#ccc' }}>Pending</span>}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {p.passed && (
                              <button
                                onClick={() => handleIssueOne(p._id, p.name)}
                                disabled={actionLoading[p._id]}
                                title={p.certificateIssued ? 'Re-generate & re-send' : 'Issue & email certificate'}
                                style={{
                                  padding: '4px 10px',
                                  background: p.certificateIssued ? '#f0f7ff' : 'linear-gradient(135deg,#c8a96e,#8B6914)',
                                  color: p.certificateIssued ? '#1a73e8' : '#fff',
                                  border: 'none', borderRadius: 6,
                                  cursor: actionLoading[p._id] ? 'wait' : 'pointer',
                                  fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap'
                                }}>
                                {actionLoading[p._id] ? '⏳' : p.certificateIssued ? '🔄' : '🎓'}
                              </button>
                            )}
                            {p.certificateId && (
                              <a href={`/verify/${p.certificateId}`} target="_blank" rel="noreferrer"
                                title="Verify certificate"
                                style={{ padding: '4px 8px', background: '#f5f5f5', color: '#555',
                                  borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>🔍</a>
                            )}
                            <button onClick={() => handleDelete(p._id)} title="Remove participant"
                              style={{ padding: '4px 8px', background: '#fff0f0', color: '#c62828',
                                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Add Participant Form ── */}
        {tab === 'add' && (
          <form onSubmit={handleAddParticipant} style={{ maxWidth: 520 }}>
            <h3 style={{ margin: '0 0 20px', color: '#1a1a2e', fontSize: 16 }}>Add Participant</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <Lbl>Full Name *</Lbl>
                <input required style={inp} value={newP.name} onChange={e => setNewP({ ...newP, name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <Lbl>Email *</Lbl>
                <input required type="email" style={inp} value={newP.email} onChange={e => setNewP({ ...newP, email: e.target.value })} placeholder="jane@example.com" />
              </div>
              <div>
                <Lbl>Score (%) — passing: {exam.passingScore}%</Lbl>
                <input type="number" min="0" max="100" style={inp} value={newP.score} onChange={e => setNewP({ ...newP, score: e.target.value })} placeholder="85" />
              </div>
              <div>
                <Lbl>Grade</Lbl>
                <input style={inp} value={newP.grade} onChange={e => setNewP({ ...newP, grade: e.target.value })} placeholder="A, Distinction, Pass…" />
              </div>
              <div>
                <Lbl>Exam Date</Lbl>
                <input type="date" style={inp} value={newP.examDate} onChange={e => setNewP({ ...newP, examDate: e.target.value })} />
              </div>
            </div>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '16px 0 12px' }}>
                  Custom Fields
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {customFields.map(f => (
                    <div key={f.key}>
                      <Lbl>{f.label}{f.required && ' *'}</Lbl>
                      <input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        required={f.required}
                        style={inp}
                        value={newP.customFieldValues[f.key] || ''}
                        onChange={e => setNewP({ ...newP, customFieldValues: { ...newP.customFieldValues, [f.key]: e.target.value } })}
                        placeholder={f.label}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <button type="submit" style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg,#1a73e8,#0d47a1)',
              color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
            }}>Add Participant</button>
          </form>
        )}

        {/* ── Bulk Import ── */}
        {tab === 'bulk' && (
          <div style={{ maxWidth: 580 }}>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: 16 }}>Bulk Import</h3>
            <div style={{ background: '#f8f9ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#555' }}>
              <strong>CSV format (one row per participant):</strong><br />
              <code style={{ fontSize: 12 }}>
                Name, Email, Score, Grade
                {customFields.map(f => `, ${f.label}`).join('')}
              </code><br />
              <span style={{ color: '#888', fontSize: 12 }}>Score and Grade are optional. Custom field columns must be in the order shown above.</span>
            </div>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={`Jane Doe, jane@example.com, 85, A${customFields.map(f => `, ${f.label} value`).join('')}\nJohn Smith, john@example.com, 72, B${customFields.map(f => ', ').join('')}`}
              style={{
                ...inp, minHeight: 180, resize: 'vertical',
                fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6
              }}
            />
            <button onClick={handleBulkImport} style={{
              marginTop: 12, width: '100%', padding: '12px',
              background: 'linear-gradient(135deg,#1a73e8,#0d47a1)',
              color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
            }}>📥 Import Participants</button>
          </div>
        )}

      </div>
    </div>
  );
}
