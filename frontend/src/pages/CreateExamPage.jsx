import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'modern', label: 'Modern', desc: 'Clean with corner accents & gradient', emoji: '✨' },
  { id: 'classic', label: 'Classic', desc: 'Traditional parchment with ornaments', emoji: '📜' },
  { id: 'elegant', label: 'Elegant', desc: 'Dark luxury with gold accents', emoji: '🌟' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

// ── Shared input style ────────────────────────────────────────────────────────
const s = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none',
};

// ── IMPORTANT: Label and Card are defined OUTSIDE the component ───────────────
// If defined inside, React recreates them on every keystroke, unmounting inputs
// and causing focus loss after each character typed.

const Label = ({ children, required }) => (
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 700, color: '#666',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px'
  }}>
    {children}
    {required && <span style={{ color: '#ea4335', marginLeft: 2 }}>*</span>}
  </label>
);

const Card = ({ title, children }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: 28,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20
  }}>
    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px' }}>
      {title}
    </h2>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', instructor: '', organization: '',
    passingScore: 60, duration: '', certificateTemplate: 'modern',
    primaryColor: '#1a73e8',
  });
  const [customFields, setCustomFields] = useState([]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── custom field helpers ──────────────────────────────────────────────────
  const addField = () => setCustomFields(prev => [...prev, {
    key: `field_${Date.now()}`, label: '', type: 'text',
    showOnCertificate: true, required: false,
  }]);

  const updateField = (idx, patch) => {
    setCustomFields(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      if (patch.label !== undefined) {
        next[idx].key = patch.label.toLowerCase().replace(/[^a-z0-9]/g, '_') || `field_${idx}`;
      }
      return next;
    });
  };

  const removeField = (idx) => setCustomFields(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (customFields.some(f => !f.label.trim())) {
      toast.error('All custom fields need a label');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, passingScore: Number(form.passingScore), customFields };
      const res = await api.post('/exams', payload);
      toast.success('Exam created!');
      navigate(`/exams/${res.data.exam._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 740 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
          Create New Exam
        </h1>
        <p style={{ color: '#888', margin: '6px 0 0', fontSize: 14 }}>
          Configure exam details, certificate design, and custom fields
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Exam Details ── */}
        <Card title="📝 Exam Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label required>Exam Title</Label>
              <input
                required style={s}
                value={form.title} onChange={set('title')}
                placeholder="e.g., Web Development Fundamentals"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Description</Label>
              <textarea
                style={{ ...s, minHeight: 72, resize: 'vertical' }}
                value={form.description} onChange={set('description')}
                placeholder="Brief description..."
              />
            </div>
            <div>
              <Label required>Instructor Name</Label>
              <input
                required style={s}
                value={form.instructor} onChange={set('instructor')}
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <Label>Organization</Label>
              <input
                style={s}
                value={form.organization} onChange={set('organization')}
                placeholder="Tech Academy"
              />
            </div>
            <div>
              <Label required>Passing Score (%)</Label>
              <input
                required type="number" min="0" max="100" style={s}
                value={form.passingScore} onChange={set('passingScore')}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <input
                style={s}
                value={form.duration} onChange={set('duration')}
                placeholder="e.g., 3 hours"
              />
            </div>
          </div>
        </Card>

        {/* ── Certificate Design ── */}
        <Card title="🎨 Certificate Design">
          <Label>Template</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                onClick={() => setForm(prev => ({ ...prev, certificateTemplate: t.id }))}
                style={{
                  padding: 16, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  border: form.certificateTemplate === t.id ? '2px solid #1a73e8' : '2px solid #e0e0e0',
                  background: form.certificateTemplate === t.id ? '#f0f7ff' : '#fafafa',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{t.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <Label>Primary Color</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color" value={form.primaryColor}
              onChange={set('primaryColor')}
              style={{ width: 44, height: 40, borderRadius: 8, border: '1.5px solid #e0e0e0', cursor: 'pointer', padding: 3 }}
            />
            <input
              style={{ ...s, flex: 1 }}
              value={form.primaryColor} onChange={set('primaryColor')}
              placeholder="#1a73e8"
            />
          </div>
        </Card>

        {/* ── Custom Fields ── */}
        <Card title="⚙️ Custom Certificate Fields">
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.5 }}>
            Add extra fields that will appear on each participant's form and optionally
            print on the certificate. Examples: <em>Batch / Cohort, Venue, Department, Student ID</em>.
          </p>

          {customFields.map((field, idx) => (
            <div key={field.key} style={{
              border: '1.5px solid #e8e8e8', borderRadius: 10, padding: 16,
              marginBottom: 12, background: '#fafafa', position: 'relative',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <Label required>Field Label</Label>
                  <input
                    style={s}
                    value={field.label}
                    placeholder="e.g., Batch / Cohort"
                    onChange={e => updateField(idx, { label: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Type</Label>
                  <select
                    style={s}
                    value={field.type}
                    onChange={e => updateField(idx, { type: e.target.value })}
                  >
                    {FIELD_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button" onClick={() => removeField(idx)}
                  style={{
                    width: 36, height: 40, background: '#fff0f0', color: '#c62828',
                    border: '1.5px solid #ffcdd2', borderRadius: 8, cursor: 'pointer', fontSize: 16,
                  }}
                >✕</button>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#444' }}>
                  <input
                    type="checkbox"
                    checked={field.showOnCertificate}
                    onChange={e => updateField(idx, { showOnCertificate: e.target.checked })}
                  />
                  Print on certificate PDF
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#444' }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(idx, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                Key: <code>{field.key}</code>
              </div>
            </div>
          ))}

          <button
            type="button" onClick={addField}
            style={{
              padding: '10px 20px', background: '#f0f7ff', color: '#1a73e8',
              border: '1.5px dashed #1a73e8', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, width: '100%',
            }}
          >+ Add Custom Field</button>
        </Card>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button" onClick={() => navigate('/exams')}
            style={{
              padding: '12px 24px', background: '#f0f0f0', color: '#555',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >Cancel</button>
          <button
            type="submit" disabled={loading}
            style={{
              flex: 1, padding: '12px 24px',
              background: loading ? '#999' : 'linear-gradient(135deg, #1a73e8, #0d47a1)',
              color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
            }}
          >
            {loading ? 'Creating...' : '✓ Create Exam'}
          </button>
        </div>

      </form>
    </div>
  );
}