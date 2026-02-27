import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
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

const TEMPLATES = [
  { id:'modern',  emoji:'✨', label:'Modern',  desc:'Clean & professional' },
  { id:'classic', emoji:'📜', label:'Classic', desc:'Traditional parchment' },
  { id:'elegant', emoji:'🌟', label:'Elegant', desc:'Dark luxury style' },
]
const FONTS = [
  { id:'inter',        label:'Inter (Modern Sans)' },
  { id:'playfair',     label:'Playfair Display (Serif)' },
  { id:'merriweather', label:'Merriweather (Classic)' },
  { id:'montserrat',   label:'Montserrat (Elegant)' },
]
const PATTERNS = [
  { id:'none', label:'None' }, { id:'dots', label:'Dots' },
  { id:'lines', label:'Lines' }, { id:'grid', label:'Grid' }, { id:'cross', label:'Cross-hatch' },
]
const PRESET_COLORS = [
  '#1a73e8','#0d47a1','#7b1fa2','#c62828',
  '#2e7d32','#e65100','#4e342e','#263238',
  '#c8a96e','#00838f','#558b2f','#6a1b9a',
]

/* ── Tiny live preview ─────────────────────────────────────────────────────── */
const CertificatePreview = ({ design, examTitle, instructorName, organization }) => {
  const {
    certificateTemplate='modern', primaryColor='#1a73e8',
    certificateTitle='', certificateSubtitle='',
    certificateFooterNote='', signatureLabel='Course Instructor',
    sealText='Verified Certificate', showScore=true, showGrade=true,
    showExamDate=true, showInstructor=true, showOrganization=true, showSeal=true,
    backgroundPattern='none', logoUrl='', signatureUrl='',
  } = design
  const pc = primaryColor

  const patStyle = {
    none:{},
    dots:{ backgroundImage:`radial-gradient(${pc}20 1.5px,transparent 1.5px)`, backgroundSize:'16px 16px' },
    lines:{ backgroundImage:`repeating-linear-gradient(45deg,${pc}12 0,${pc}12 1px,transparent 0,transparent 50%)`, backgroundSize:'12px 12px' },
    grid:{ backgroundImage:`linear-gradient(${pc}15 1px,transparent 1px),linear-gradient(90deg,${pc}15 1px,transparent 1px)`, backgroundSize:'20px 20px' },
    cross:{ backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 18px,${pc}12 18px,${pc}12 20px),repeating-linear-gradient(90deg,transparent,transparent 18px,${pc}12 18px,${pc}12 20px)` },
  }[backgroundPattern] || {}

  const T = certificateTitle    || 'Certificate of Achievement'
  const S = certificateSubtitle || 'This is to certify that'
  const s = { fontSize:7, fontFamily:'sans-serif', margin:0 }
  const badges = [showScore&&'95%', showGrade&&'A', showExamDate&&'Feb 2026'].filter(Boolean)

  /* Shared footer strip (3 equal columns) */
  const SigContent = ({ dark=false }) => (
    <div style={{ textAlign:'center' }}>
      {signatureUrl
        ? <img src={signatureUrl} alt="sig" style={{ height:22, maxWidth:80, objectFit:'contain', display:'block', margin:'0 auto 2px', ...(dark ? { filter:'brightness(0) invert(1) opacity(.8)' } : {}) }} />
        : <div style={{ width:70, height: dark ? 1 : 2, background: dark ? `${pc}80` : '#555', margin:'0 auto 2px' }} />}
      <div style={{ ...s, fontWeight:700, color: dark ? pc : '#333' }}>{showInstructor ? (instructorName||'Instructor') : ''}</div>
      <div style={{ ...s, color: dark ? 'rgba(255,255,255,.4)' : '#aaa', fontStyle:'italic' }}>{signatureLabel}</div>
    </div>
  )
  const SealContent = ({ color }) => showSeal ? (
    <div style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${color}`, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
      <div style={{ fontSize:4, color, textAlign:'center', fontWeight:700, textTransform:'uppercase', lineHeight:1.2, padding:2 }}>{sealText}</div>
    </div>
  ) : <div />
  const DateContent = ({ color, valColor }) => (
    <div style={{ textAlign:'center' }}>
      <div style={{ ...s, textTransform:'uppercase', letterSpacing:0.5, color }}>Issued On</div>
      <div style={{ ...s, fontWeight:700, color:valColor, marginTop:2 }}>Feb 26, 2026</div>
    </div>
  )
  const Footer = ({ dark=false, sealColor, dateColor, valColor }) => (
    <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', padding:'2% 7% 3%', display:'table' }}>
      <tbody><tr>
        <td style={{ width:'33%', textAlign:'center', verticalAlign:'bottom', padding:'0 4px' }}><SigContent dark={dark} /></td>
        <td style={{ width:'33%', textAlign:'center', verticalAlign:'bottom', padding:'0 4px' }}><SealContent color={sealColor} /></td>
        <td style={{ width:'33%', textAlign:'center', verticalAlign:'bottom', padding:'0 4px' }}><DateContent color={dateColor} valColor={valColor} /></td>
      </tr></tbody>
    </table>
  )

  if (certificateTemplate === 'modern') return (
    <div style={{ width:'100%', aspectRatio:'297/210', position:'relative', overflow:'hidden',
      background:`linear-gradient(135deg,#f4f6ff,#fff,#eef2ff)`, border:`2.5px solid ${pc}`, borderRadius:3, ...patStyle, display:'flex', flexDirection:'column' }}>
      {[[{top:6,left:6},{borderTop:`2px solid ${pc}`,borderLeft:`2px solid ${pc}`}],
        [{top:6,right:6},{borderTop:`2px solid ${pc}`,borderRight:`2px solid ${pc}`}],
        [{bottom:6,left:6},{borderBottom:`2px solid ${pc}`,borderLeft:`2px solid ${pc}`}],
        [{bottom:6,right:6},{borderBottom:`2px solid ${pc}`,borderRight:`2px solid ${pc}`}],
      ].map(([p,b],i) => <div key={i} style={{ position:'absolute', width:22, height:22, ...p, ...b }} />)}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'2% 8% 0' }}>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ height:18, objectFit:'contain', display:'block', margin:'0 auto 2px' }} />}
        {showOrganization && organization && <div style={{ ...s, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', color:pc, marginBottom:3 }}>{organization}</div>}
        <div style={{ ...s, letterSpacing:3, textTransform:'uppercase', color:'#bbb', marginBottom:2 }}>{S}</div>
        <div style={{ fontSize:16, fontWeight:700, color:pc, lineHeight:1, marginBottom:2 }}>{T}</div>
        <div style={{ width:24, height:1.5, background:pc, margin:'3px auto' }} />
        <div style={{ ...s, color:'#aaa', marginBottom:2 }}>is proudly presented to</div>
        <div style={{ fontSize:14, color:'#1a1a2e', borderBottom:`1px solid ${pc}20`, display:'inline-block', paddingBottom:1 }}>Sample Participant</div>
        <div style={{ ...s, color:'#666', margin:'3px 0 2px' }}>for completing <strong style={{ color:pc }}>{examTitle||'Exam Title'}</strong></div>
        {badges.length > 0 && <div style={{ display:'flex', gap:3, justifyContent:'center', flexWrap:'wrap', marginBottom:2 }}>
          {badges.map((b,i) => <span key={i} style={{ fontSize:5, background:`${pc}15`, border:`1px solid ${pc}30`, color:pc, padding:'1px 5px', borderRadius:6 }}>{b}</span>)}
        </div>}
        {certificateFooterNote && <div style={{ ...s, color:'#ccc', fontStyle:'italic' }}>{certificateFooterNote}</div>}
      </div>
      <Footer sealColor={pc} dateColor='#bbb' valColor='#333' />
    </div>
  )

  if (certificateTemplate === 'classic') {
    const gold='#8B6914'
    return (
      <div style={{ width:'100%', aspectRatio:'297/210', position:'relative', overflow:'hidden',
        background:'radial-gradient(ellipse at center,#fffef8,#fdf6e3)', outline:`5px double ${gold}`, outlineOffset:'-8px', ...patStyle, display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'3% 9% 0' }}>
          {logoUrl && <img src={logoUrl} alt="logo" style={{ height:18, objectFit:'contain', display:'block', margin:'0 auto 2px' }} />}
          {showOrganization && organization && <div style={{ ...s, fontWeight:700, letterSpacing:2, color:gold, textTransform:'uppercase', marginBottom:2 }}>{organization}</div>}
          <div style={{ fontSize:9, color:gold, letterSpacing:6, marginBottom:2 }}>❦ ✦ ❦</div>
          <div style={{ ...s, color:'#888', fontStyle:'italic', marginBottom:2 }}>proudly presents</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#3d2b00', lineHeight:1 }}>{T}</div>
          <div style={{ fontSize:7, color:gold, margin:'3px 0' }}>—— ✦ ——</div>
          <div style={{ ...s, color:'#888', fontStyle:'italic', marginBottom:2 }}>{S}</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#3d2b00', marginBottom:3 }}>Sample Participant</div>
          <div style={{ ...s, color:'#555' }}>for completing <em style={{ color:gold }}>{examTitle||'Exam Title'}</em></div>
          {badges.length > 0 && <div style={{ ...s, color:'#777', marginTop:3, display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap' }}>
            {badges.map((b,i) => <span key={i}>{b}</span>)}
          </div>}
        </div>
        <Footer sealColor={gold} dateColor='#bbb' valColor='#555' />
      </div>
    )
  }

  return (
    <div style={{ width:'100%', aspectRatio:'297/210', position:'relative', overflow:'hidden',
      background:'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', color:'#fff', ...patStyle, display:'flex', flexDirection:'column' }}>
      {['top','bottom'].map(p => <div key={p} style={{ position:'absolute', [p]:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${pc},#f5d78e,${pc})` }} />)}
      {['left','right'].map(p => <div key={p} style={{ position:'absolute', [p]:0, top:0, bottom:0, width:3, background:`linear-gradient(180deg,${pc},#f5d78e,${pc})` }} />)}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'3% 8% 0' }}>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ height:18, objectFit:'contain', display:'block', margin:'0 auto 3px' }} />}
        {showOrganization && organization && <div style={{ ...s, letterSpacing:3, color:pc, textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>{organization}</div>}
        <div style={{ ...s, letterSpacing:2, color:'rgba(255,255,255,.4)', textTransform:'uppercase' }}>{S}</div>
        <div style={{ fontSize:18, fontWeight:300, color:'#fff', lineHeight:1, margin:'2px 0' }}>{T}</div>
        <div style={{ width:36, height:1, background:`linear-gradient(90deg,transparent,${pc},transparent)`, margin:'5px auto' }} />
        <div style={{ ...s, letterSpacing:2.5, color:'rgba(255,255,255,.35)', textTransform:'uppercase', marginBottom:2 }}>PROUDLY AWARDED TO</div>
        <div style={{ fontSize:14, fontWeight:600, color:'#f5d78e' }}>Sample Participant</div>
        <div style={{ ...s, color:'rgba(255,255,255,.6)', fontStyle:'italic', marginTop:2 }}>for completing <strong style={{ color:pc }}>{examTitle||'Exam Title'}</strong></div>
        {badges.length > 0 && <div style={{ display:'flex', gap:3, justifyContent:'center', flexWrap:'wrap', marginTop:3 }}>
          {badges.map((b,i) => <span key={i} style={{ fontSize:5, border:`1px solid ${pc}50`, color:pc, padding:'1px 5px', borderRadius:6 }}>{b}</span>)}
        </div>}
      </div>
      <Footer dark sealColor={pc} dateColor='rgba(255,255,255,.3)' valColor={pc} />
    </div>
  )
}

/* ── Image upload field ─────────────────────────────────────────────────────── */
const ImageUploadField = ({ label, value, onUpload, onClear, hint='' }) => {
  const ref = useRef(null)
  const [uploading, setUploading] = useState(false)
  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await api.post('/uploads/image', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      onUpload(res.data.url); toast.success(`${label} uploaded!`)
    } catch(err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); e.target.value='' }
  }
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#666', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</label>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      {value ? (
        <div style={{ border:'1.5px solid #e0e0e0', borderRadius:10, padding:12, display:'flex', alignItems:'center', gap:12 }}>
          <img src={value} alt={label} style={{ height:52, maxWidth:130, objectFit:'contain', borderRadius:6, background:'#f5f5f5', padding:4 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#333', marginBottom:6 }}>✓ Uploaded</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => ref.current.click()} disabled={uploading} style={{ fontSize:11, padding:'5px 12px', border:'1px solid #ddd', borderRadius:6, cursor:'pointer', background:'#f8f8f8', color:'#555', fontFamily:'inherit' }}>Replace</button>
              <button onClick={onClear} style={{ fontSize:11, padding:'5px 12px', border:'1px solid #ffcdd2', borderRadius:6, cursor:'pointer', background:'#fff5f5', color:'#c62828', fontFamily:'inherit' }}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current.click()} disabled={uploading} style={{ width:'100%', padding:'20px', border:'2px dashed #d0d0d0', borderRadius:10, background:'#fafafa', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontFamily:'inherit', transition:'border-color 0.15s' }}>
          <span style={{ fontSize:26 }}>{uploading ? '⏳' : '📁'}</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#555' }}>{uploading ? 'Uploading...' : `Upload ${label}`}</span>
          {hint && <span style={{ fontSize:11, color:'#bbb' }}>{hint}</span>}
        </button>
      )}
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function CertificateDesignPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const width = useWindowWidth()
  const isMobile = width < 768

  const [exam, setExam]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [section, setSection] = useState('template')

  const [design, setDesign] = useState({
    certificateTemplate:'modern', primaryColor:'#1a73e8',
    fontFamily:'inter', backgroundPattern:'none',
    logoUrl:'', signatureUrl:'', signatureLabel:'Course Instructor',
    certificateTitle:'', certificateSubtitle:'',
    certificateFooterNote:'', sealText:'Verified Certificate',
    showScore:true, showGrade:true, showExamDate:true,
    showInstructor:true, showOrganization:true, showSeal:true,
  })

  const fetchExam = useCallback(async () => {
    try {
      const res = await api.get(`/exams/${id}`)
      const e = res.data.exam; setExam(e)
      setDesign({
        certificateTemplate:   e.certificateTemplate   || 'modern',
        primaryColor:          e.primaryColor          || '#1a73e8',
        fontFamily:            e.fontFamily            || 'inter',
        backgroundPattern:     e.backgroundPattern     || 'none',
        logoUrl:               e.logoUrl               || '',
        signatureUrl:          e.signatureUrl          || '',
        signatureLabel:        e.signatureLabel        || 'Course Instructor',
        certificateTitle:      e.certificateTitle      || '',
        certificateSubtitle:   e.certificateSubtitle   || '',
        certificateFooterNote: e.certificateFooterNote || '',
        sealText:              e.sealText              || 'Verified Certificate',
        showScore:             e.showScore        !== false,
        showGrade:             e.showGrade        !== false,
        showExamDate:          e.showExamDate     !== false,
        showInstructor:        e.showInstructor   !== false,
        showOrganization:      e.showOrganization !== false,
        showSeal:              e.showSeal         !== false,
      })
    } catch { toast.error('Failed to load exam') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { fetchExam() }, [fetchExam])

  const set = (k, v) => setDesign(d => ({ ...d, [k]:v }))

  const handleSave = async () => {
    setSaving(true)
    try { await api.put(`/exams/${id}/certificate-design`, design); toast.success('Design saved!') }
    catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  if (user?.role !== 'admin') return (
    <div style={{ padding:60, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <h2>Admin Only</h2>
      <Link to="/exams" style={{ color:'#1a73e8', textDecoration:'none', fontWeight:600 }}>← Back</Link>
    </div>
  )
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#aaa' }}>Loading...</div>
  if (!exam)   return <div style={{ padding:60 }}>Exam not found. <Link to="/exams">← Back</Link></div>

  const inp = { width:'100%', padding:'9px 13px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'#fff' }
  const Lbl = ({ children }) => <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#666', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>{children}</label>
  const Toggle = ({ label, desc, value, onChange }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #f5f5f5' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#333' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width:44, height:24, borderRadius:12, cursor:'pointer', background: value ? '#1a73e8' : '#ddd', position:'relative', flexShrink:0, transition:'background 0.2s', marginLeft:16 }}>
        <div style={{ width:18, height:18, borderRadius:9, background:'#fff', position:'absolute', top:3, left: value ? 23 : 3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
      </div>
    </div>
  )

  const SECTIONS = [
    { id:'template',   icon:'🖼️', label:'Template & Color' },
    { id:'typography', icon:'🔤', label:'Typography' },
    { id:'text',       icon:'✍️', label:'Text & Labels' },
    { id:'visibility', icon:'👁️', label:'Visibility' },
    { id:'branding',   icon:'🏢', label:'Logo & Signature' },
  ]

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <Link to={`/exams/${id}`} style={{ color:'#888', textDecoration:'none', fontSize:13 }}>← Back to Exam</Link>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#1a1a2e', margin:'6px 0 4px' }}>🎨 Certificate Design</h1>
          <p style={{ color:'#888', margin:0, fontSize:13 }}>
            <strong>{exam.title}</strong>
            <span style={{ marginLeft:8, background:'#e8f5e9', color:'#2e7d32', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>Admin Only</span>
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', background: saving ? '#999' : 'linear-gradient(135deg,#1a73e8,#0d47a1)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor: saving ? 'not-allowed' : 'pointer', boxShadow:'0 4px 14px rgba(26,115,232,.3)', fontFamily:'inherit' }}>
          {saving ? '⏳ Saving...' : '💾 Save Design'}
        </button>
      </div>

      {/* Section tabs — horizontal on mobile, vertical sidebar on desktop */}
      {isMobile ? (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, border:'none', cursor:'pointer', background: section===s.id ? '#1a73e8' : '#f0f0f0', color: section===s.id ? '#fff' : '#555', fontWeight: section===s.id ? 700 : 400, fontSize:12, fontFamily:'inherit' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap:16 }}>

        {/* Sidebar — hidden on mobile (tabs used instead) */}
        {!isMobile && (
          <div>
            <div style={{ background:'#fff', borderRadius:12, padding:10, boxShadow:'0 2px 12px rgba(0,0,0,.06)', marginBottom:12 }}>
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer', background: section===s.id ? '#1a73e8' : 'transparent', color: section===s.id ? '#fff' : '#555', fontWeight: section===s.id ? 700 : 400, fontSize:13, marginBottom:3, textAlign:'left', fontFamily:'inherit', transition:'all 0.15s' }}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
            {/* Quick color presets */}
            <div style={{ background:'#fff', borderRadius:12, padding:14, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Quick Colors</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                {PRESET_COLORS.map(c => (
                  <div key={c} onClick={() => set('primaryColor', c)} style={{ width:'100%', aspectRatio:'1', borderRadius:6, background:c, cursor:'pointer', border: design.primaryColor===c ? '3px solid #1a1a2e' : '2px solid transparent', transform: design.primaryColor===c ? 'scale(1.12)' : 'scale(1)', transition:'all 0.15s' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main panel */}
        <div>
          {/* Live preview */}
          <div style={{ background:'#fff', borderRadius:12, padding:16, boxShadow:'0 2px 12px rgba(0,0,0,.06)', marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>📐 Live Preview</div>
            <CertificatePreview design={design} examTitle={exam.title} instructorName={exam.instructor} organization={exam.organization} />
            <p style={{ fontSize:11, color:'#bbb', margin:'8px 0 0', textAlign:'center' }}>Preview is scaled — actual PDF fills full A4 landscape</p>
          </div>

          {/* Settings panel */}
          <div style={{ background:'#fff', borderRadius:12, padding: isMobile ? 16 : 24, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>

            {section === 'template' && (
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', margin:'0 0 18px' }}>🖼️ Template & Color</h3>
                <Lbl>Certificate Template</Lbl>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:10, marginBottom:20 }}>
                  {TEMPLATES.map(t => (
                    <div key={t.id} onClick={() => set('certificateTemplate', t.id)} style={{ padding:14, borderRadius:10, cursor:'pointer', border: design.certificateTemplate===t.id ? `2px solid ${design.primaryColor}` : '2px solid #e0e0e0', background: design.certificateTemplate===t.id ? `${design.primaryColor}08` : '#fafafa', transition:'all 0.15s' }}>
                      <div style={{ fontSize:26, marginBottom:5 }}>{t.emoji}</div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{t.label}</div>
                      <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14, marginBottom:16 }}>
                  <div>
                    <Lbl>Primary Color</Lbl>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input type="color" value={design.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ width:44, height:40, borderRadius:8, border:'1.5px solid #e0e0e0', cursor:'pointer', padding:3 }} />
                      <input style={inp} value={design.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#1a73e8" />
                    </div>
                  </div>
                  <div>
                    <Lbl>Background Pattern</Lbl>
                    <select style={inp} value={design.backgroundPattern} onChange={e => set('backgroundPattern', e.target.value)}>
                      {PATTERNS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                {isMobile && (
                  <div>
                    <Lbl>Quick Colors</Lbl>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
                      {PRESET_COLORS.map(c => (
                        <div key={c} onClick={() => set('primaryColor', c)} style={{ width:'100%', aspectRatio:'1', borderRadius:6, background:c, cursor:'pointer', border: design.primaryColor===c ? '3px solid #1a1a2e' : '2px solid transparent', transition:'all 0.15s' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {section === 'typography' && (
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', margin:'0 0 18px' }}>🔤 Typography</h3>
                <Lbl>Font Family</Lbl>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
                  {FONTS.map(f => (
                    <div key={f.id} onClick={() => set('fontFamily', f.id)} style={{ padding:'13px 16px', borderRadius:10, cursor:'pointer', border: design.fontFamily===f.id ? `2px solid ${design.primaryColor}` : '2px solid #e0e0e0', background: design.fontFamily===f.id ? `${design.primaryColor}08` : '#fafafa', transition:'all 0.15s' }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{f.label}</div>
                      <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>Aa Bb Cc 123</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'text' && (
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', margin:'0 0 6px' }}>✍️ Text & Labels</h3>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 18px' }}>Leave blank to use defaults.</p>
                <div style={{ display:'grid', gap:14 }}>
                  {[
                    { key:'certificateTitle',      label:'Certificate Title',      placeholder:'Default: Certificate of Achievement' },
                    { key:'certificateSubtitle',   label:'Subtitle / Intro',       placeholder:'Default: This is to certify that' },
                    { key:'signatureLabel',         label:'Signature Label',        placeholder:'Default: Course Instructor' },
                    { key:'sealText',               label:'Seal Text',              placeholder:'Default: Verified Certificate' },
                    { key:'certificateFooterNote',  label:'Footer Note (optional)', placeholder:'e.g. Valid for 2 years from issue date' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <Lbl>{label}</Lbl>
                      <input style={inp} value={design[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === 'visibility' && (
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', margin:'0 0 6px' }}>👁️ Field Visibility</h3>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 14px' }}>Toggle which fields appear on the certificate.</p>
                <Toggle label="Show Score"        desc="e.g. 95%"               value={design.showScore}        onChange={v => set('showScore', v)} />
                <Toggle label="Show Grade"        desc="e.g. A, Distinction"    value={design.showGrade}        onChange={v => set('showGrade', v)} />
                <Toggle label="Show Exam Date"    desc="Date the exam was taken" value={design.showExamDate}     onChange={v => set('showExamDate', v)} />
                <Toggle label="Show Instructor"   desc="Name on signature line"  value={design.showInstructor}   onChange={v => set('showInstructor', v)} />
                <Toggle label="Show Organization" desc="School / org name"       value={design.showOrganization} onChange={v => set('showOrganization', v)} />
                <Toggle label="Show Seal"         desc="Circular verified seal"  value={design.showSeal}         onChange={v => set('showSeal', v)} />
              </div>
            )}

            {section === 'branding' && (
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#1a1a2e', margin:'0 0 6px' }}>🏢 Logo & Signature</h3>
                <p style={{ color:'#888', fontSize:13, margin:'0 0 18px' }}>Upload images from your device.</p>
                <div style={{ display:'grid', gap:24 }}>
                  <ImageUploadField label="Organization Logo" value={design.logoUrl} onUpload={url => set('logoUrl', url)} onClear={() => set('logoUrl', '')} hint="PNG with transparent background recommended" />
                  <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:20 }}>
                    <ImageUploadField label="Signature Image" value={design.signatureUrl} onUpload={url => set('signatureUrl', url)} onClear={() => set('signatureUrl', '')} hint="Sign on white paper, scan/photograph, save as PNG" />
                    <div style={{ marginTop:10, background:'#f0f7ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#1a73e8' }}>
                      💡 For a clean signature: sign on white paper → photograph or scan → crop tightly → save as PNG
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
