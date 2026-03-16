import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Helper components defined OUTSIDE to prevent focus-loss re-renders ────────
const inp = {
  padding: '9px 13px', border: '1.5px solid #e0e0e0', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', width: '100%'
};
const Lbl = ({ children, required }) => (
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 700, color: '#666',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px'
  }}>
    {children}{required && <span style={{ color: '#ea4335', marginLeft: 2 }}>*</span>}
  </label>
);

const TEMPLATES = [
  { id: 'modern', label: 'Modern', emoji: '✨' },
  { id: 'classic', label: 'Classic', emoji: '📜' },
  { id: 'elegant', label: 'Elegant', emoji: '🌟' },
];

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editExam, setEditExam] = useState(null);   // exam being edited
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.exams || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete exam "${title}"? This will also remove all participants and cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      setExams(exams.filter(e => e._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (exam) => {
    setEditExam({ ...exam });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/exams/${editExam._id}`, {
        title: editExam.title,
        description: editExam.description,
        instructor: editExam.instructor,
        organization: editExam.organization,
        duration: editExam.duration,
        isActive: editExam.isActive,
      });
      setExams(prev => prev.map(e => e._id === editExam._id ? res.data.exam : e));
      toast.success('Exam updated!');
      setEditExam(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const templateEmojis = { modern: '✨', classic: '📜', elegant: '🌟' };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Edit Modal ── */}
      {editExam && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, width: '100%',
            maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>✏️ Edit Exam</h2>
              <button onClick={() => setEditExam(null)} style={{
                background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', lineHeight: 1
              }}>✕</button>
            </div>

            <form onSubmit={handleEditSave}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <Lbl required>Exam Title</Lbl>
                  <input required style={inp} value={editExam.title}
                    onChange={e => setEditExam(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Annual Mathematics Competition" />
                </div>
                <div>
                  <Lbl>Description</Lbl>
                  <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
                    value={editExam.description || ''}
                    onChange={e => setEditExam(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <Lbl required>Instructor</Lbl>
                    <input required style={inp} value={editExam.instructor || ''}
                      onChange={e => setEditExam(prev => ({ ...prev, instructor: e.target.value }))}
                      placeholder="Dr. Jane Smith" />
                  </div>
                  <div>
                    <Lbl>Organization</Lbl>
                    <input style={inp} value={editExam.organization || ''}
                      onChange={e => setEditExam(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="Tech Academy" />
                  </div>
                  <div>
                    <Lbl>Duration</Lbl>
                    <input style={inp} value={editExam.duration || ''}
                      onChange={e => setEditExam(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 3 hours" />
                  </div>
                  <div>
                    <Lbl>Status</Lbl>
                    <select style={inp} value={editExam.isActive ? 'active' : 'inactive'}
                      onChange={e => setEditExam(prev => ({ ...prev, isActive: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setEditExam(null)} style={{
                  padding: '11px 20px', background: '#f0f0f0', color: '#555',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: '11px 20px',
                  background: saving ? '#999' : 'linear-gradient(135deg,#1a73e8,#0d47a1)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14
                }}>
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Exams</h1>
          <p style={{ color: '#888', margin: '6px 0 0', fontSize: 14 }}>Manage your exams and issue certificates</p>
        </div>
        <Link to="/exams/new" style={{
          padding: '10px 20px', background: 'linear-gradient(135deg,#1a73e8,#0d47a1)',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {exams.map(exam => (
            <div key={exam._id} style={{
              background: '#fff', borderRadius: 12, padding: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: `4px solid ${exam.primaryColor || '#1a73e8'}`,
              display: 'flex', flexDirection: 'column'
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{templateEmojis[exam.certificateTemplate] || '✨'}</span>
                <span style={{
                  background: exam.isActive ? '#e8f5e9' : '#ffebee',
                  color: exam.isActive ? '#2e7d32' : '#c62828',
                  padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
                }}>{exam.isActive ? 'Active' : 'Inactive'}</span>
              </div>

              {/* Title & description */}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
                {exam.title}
              </h3>
              {exam.description && (
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {exam.description}
                </p>
              )}

              {/* All exam details */}
              <div style={{ background: '#f8f9ff', borderRadius: 8, padding: '12px 14px', marginBottom: 16, flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  {[
                    ['👤 Instructor', exam.instructor],
                    ['🏢 Organization', exam.organization || '—'],
                    ['🎨 Template', `${templateEmojis[exam.certificateTemplate] || ''} ${exam.certificateTemplate}`],
                    ['⏱ Duration', exam.duration || '—'],
                    ['📅 Created', new Date(exam.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
                    ['🔧 Custom Fields', exam.customFields?.length ? `${exam.customFields.length} field(s)` : 'None'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#333', fontWeight: 600, marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Color swatch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: exam.primaryColor || '#1a73e8', border: '1px solid #e0e0e0' }} />
                  <span style={{ fontSize: 12, color: '#666' }}>{exam.primaryColor || '#1a73e8'}</span>
                </div>

                {/* Custom fields list */}
                {exam.customFields?.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
                    <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Custom Fields</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {exam.customFields.map(f => (
                        <span key={f.key} style={{
                          background: '#e8f0fe', color: '#1a73e8',
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600
                        }}>{f.label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/exams/${exam._id}`} style={{
                  flex: 1, padding: '8px', background: '#f0f7ff', color: '#1a73e8',
                  borderRadius: 8, textDecoration: 'none', textAlign: 'center',
                  fontWeight: 600, fontSize: 13
                }}>Manage →</Link>
                <button onClick={() => openEdit(exam)} style={{
                  padding: '8px 12px', background: '#fff8e1', color: '#f57c00',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600
                }} title="Edit exam">✏️</button>
                <button onClick={() => handleDelete(exam._id, exam.title)} style={{
                  padding: '8px 12px', background: '#fff0f0', color: '#c62828',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600
                }} title="Delete exam">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}