import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const TEMPLATES = [
  { id: 'modern', label: 'Modern', desc: 'Clean & minimal' },
  { id: 'classic', label: 'Classic', desc: 'Parchment style' },
  { id: 'elegant', label: 'Elegant', desc: 'Dark luxury' },
]
const FONTS = [
  { id: 'inter', label: 'Sans-Serif Modern' },
  { id: 'playfair', label: 'Playfair Serif' },
  { id: 'merriweather', label: 'Merriweather' },
  { id: 'montserrat', label: 'Montserrat' },
]
const PATTERNS = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'lines', label: 'Diagonal Lines' },
  { id: 'grid', label: 'Grid' },
  { id: 'cross', label: 'Cross-hatch' },
]
const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#475569',
  '#C8A96E', '#1E293B', '#166534', '#9333EA',
]
const NAV = [
  { id: 'template', label: 'Template' },
  { id: 'typography', label: 'Typography' },
  { id: 'content', label: 'Content' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'branding', label: 'Branding' },
]

const C = {
  bg: '#F0F2F5', sidebar: '#18181B', sidebarBorder: '#27272A',
  surface: '#FFFFFF', text: '#09090B', textSub: '#71717A', textMuted: '#52525B',
  accent: '#2563EB', accentHover: '#1D4ED8', border: '#E4E4E7', borderSubtle: '#F4F4F5',
  success: '#16A34A', navText: '#A1A1AA', navActive: '#FFFFFF',
  navActiveBg: '#27272A', inputBg: '#27272A', inputBorder: '#3F3F46',
  inputText: '#FAFAFA', inputPlaceholder: '#71717A', sectionLabel: '#52525B',
}

/* ─── Global styles injected once ───────────────────────────────────────────── */
function useGlobalStyles() {
  useEffect(() => {
    const id = 'cdp-styles'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .cdp-root { position: fixed; inset: 0; z-index: 100; display: flex; font-family: -apple-system, 'Segoe UI', sans-serif; }
      .cdp-sidebar { width: 280px; min-width: 280px; background: #18181B; border-right: 1px solid #27272A; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
      .cdp-sidebar-scroll { flex: 1; overflow-y: auto; padding: 16px 14px; }
      .cdp-sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .cdp-sidebar-scroll::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 2px; }
      .cdp-canvas { flex: 1; display: flex; flex-direction: column; background: #F0F2F5; overflow: hidden; }
      .cdp-canvas-body { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 32px; }
      .cdp-inp { background: #27272A; border: 1px solid #3F3F46; color: #FAFAFA; border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; width: 100%; box-sizing: border-box; outline: none; transition: border-color .15s; }
      .cdp-inp:focus { border-color: #2563EB; }
      .cdp-inp::placeholder { color: #71717A; }
      .cdp-inp option { background: #18181B; }
      .cdp-nav-btn { display: block; width: 100%; text-align: left; padding: 8px 10px; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 13px; margin-bottom: 1px; transition: background .12s, color .12s; }
      .cdp-nav-btn:hover { background: #232326 !important; }
      .cdp-card { border-radius: 8px; cursor: pointer; transition: all .15s; }
      .cdp-card:hover { border-color: #52525B !important; }
      .cdp-swatch { border-radius: 6px; cursor: pointer; transition: all .15s; aspect-ratio: 1; }
      .cdp-swatch:hover { transform: scale(1.12) !important; }
      .cdp-save-btn { width: 100%; padding: 10px 0; border: none; border-radius: 8px; font-family: inherit; font-weight: 600; font-size: 13px; transition: background .15s; }
      .cdp-save-btn:hover:not(:disabled) { background: #1D4ED8 !important; }
      .cdp-upload-btn { border-radius: 8px; cursor: pointer; font-family: inherit; transition: border-color .15s; }
      .cdp-upload-btn:hover { border-color: #52525B !important; }
      .cdp-toggle-row { border-radius: 6px; cursor: pointer; transition: background .12s; }
      .cdp-toggle-row:hover { background: #232326; }
    `
    document.head.appendChild(style)
    return () => { const el = document.getElementById(id); el && el.remove() }
  }, [])
}

/* ─── Module-level sub-components ───────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.sectionLabel, marginBottom: 10 }}>
    {children}
  </div>
)
const Divider = () => <div style={{ height: 1, background: C.sidebarBorder, margin: '18px 0' }} />
const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 500, color: C.navText, marginBottom: 5, letterSpacing: '0.03em' }}>{children}</div>
)
const Toggle = ({ label, desc, value, onChange }) => (
  <div className="cdp-toggle-row" onClick={() => onChange(!value)}
    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 6px' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.inputText }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: C.navText, marginTop: 1 }}>{desc}</div>}
    </div>
    <div style={{ width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginLeft: 12, background: value ? C.accent : '#3F3F46', position: 'relative', transition: 'background .2s' }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', position: 'absolute', top: 3, left: value ? 19 : 3, transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
    </div>
  </div>
)

/* ─── Signature Canvas ───────────────────────────────────────────────────────── */
const SignatureCanvas = ({ onSave, onClose }) => {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const lastPos = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#18181B'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width, sy = canvas.height / r.height
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }
  const startDraw = e => {
    e.preventDefault(); const c = canvasRef.current; const pos = getPos(e, c)
    setDrawing(true); setIsEmpty(false); lastPos.current = pos
    const ctx = c.getContext('2d'); ctx.beginPath(); ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#18181B'; ctx.fill()
  }
  const draw = e => {
    e.preventDefault(); if (!drawing) return
    const c = canvasRef.current; const ctx = c.getContext('2d'); const pos = getPos(e, c)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    lastPos.current = pos
  }
  const stopDraw = e => { e?.preventDefault(); setDrawing(false); lastPos.current = null }
  const clearCanvas = () => {
    const c = canvasRef.current; const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); setIsEmpty(true)
  }
  const handleSave = () => {
    if (isEmpty) { toast.error('Please draw your signature first'); return }
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: 14, padding: 24, width: '100%', maxWidth: 500, boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#FAFAFA' }}>Draw Signature</div>
            <div style={{ fontSize: 12, color: C.navText, marginTop: 3 }}>Sign using your mouse or finger</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.navText, fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', touchAction: 'none', cursor: 'crosshair', border: '1px solid #3F3F46' }}>
          <canvas ref={canvasRef} width={600} height={200}
            style={{ width: '100%', height: 150, display: 'block', touchAction: 'none' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={clearCanvas} style={{ padding: '8px 16px', background: '#27272A', color: C.navText, border: '1px solid #3F3F46', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>Clear</button>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#27272A', color: C.navText, border: '1px solid #3F3F46', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '8px 16px', background: C.accent, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>Use Signature</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Certificate Preview ────────────────────────────────────────────────────── */
const CertificatePreview = ({ design, examTitle, instructorName, organization }) => {
  const {
    certificateTemplate = 'modern', primaryColor = '#2563EB',
    certificateTitle = '', certificateSubtitle = '', certificateFooterNote = '',
    signatureLabel = 'Course Instructor', sealText = 'Verified Certificate',
    showScore = true, showGrade = true, showExamDate = true,
    showInstructor = true, showOrganization = true, showSeal = true,
    backgroundPattern = 'none', logoUrl = '', logoUrl2 = '', signatureUrl = '',
  } = design
  const pc = primaryColor

  const patStyle = ({
    none: {},
    dots: { backgroundImage: `radial-gradient(${pc}22 1.5px,transparent 1.5px)`, backgroundSize: '18px 18px' },
    lines: { backgroundImage: `repeating-linear-gradient(45deg,${pc}14 0,${pc}14 1px,transparent 0,transparent 50%)`, backgroundSize: '14px 14px' },
    grid: { backgroundImage: `linear-gradient(${pc}18 1px,transparent 1px),linear-gradient(90deg,${pc}18 1px,transparent 1px)`, backgroundSize: '22px 22px' },
    cross: { backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 18px,${pc}14 18px,${pc}14 20px),repeating-linear-gradient(90deg,transparent,transparent 18px,${pc}14 18px,${pc}14 20px)` },
  })[backgroundPattern] || {}

  const TT = certificateTitle || 'Certificate of Achievement'
  const SS = certificateSubtitle || 'This is to certify that'
  const badges = [showScore && '95%', showGrade && 'A', showExamDate && 'Feb 2026'].filter(Boolean)

  /* ── Dual/single logo ── */
  const LogoBlock = ({ dark = false }) => {
    if (!logoUrl && !logoUrl2) return null
    const imgS = (extra = {}) => ({ height: 18, objectFit: 'contain', ...(dark ? { filter: 'brightness(0) invert(1)' } : {}), ...extra })
    if (logoUrl && logoUrl2) return (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 8%', marginBottom: 4 }}>
        <img src={logoUrl} alt="logo1" style={imgS({ maxWidth: 60 })} />
        <img src={logoUrl2} alt="logo2" style={imgS({ maxWidth: 60 })} />
      </div>
    )
    return <div style={{ marginBottom: 4 }}><img src={logoUrl || logoUrl2} alt="logo" style={imgS({ display: 'block', margin: '0 auto' })} /></div>
  }

  const SigContent = ({ dark = false }) => (
    <div style={{ textAlign: 'center' }}>
      {signatureUrl
        ? <img src={signatureUrl} alt="sig" style={{ height: 22, maxWidth: 80, objectFit: 'contain', display: 'block', margin: '0 auto 2px', ...(dark ? { filter: 'brightness(0) invert(1) opacity(.8)' } : {}) }} />
        : <div style={{ width: 70, height: 1.5, background: dark ? `${pc}80` : '#aaa', margin: '0 auto 2px' }} />}
      <div style={{ fontSize: 10, fontWeight: 700, color: dark ? pc : '#333' }}>{showInstructor ? (instructorName || 'Instructor') : ''}</div>
      <div style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,.4)' : '#aaa', fontStyle: 'italic' }}>{signatureLabel}</div>
    </div>
  )
  const SealContent = ({ color }) => showSeal ? (
    <div style={{ width: 34, height: 34, borderRadius: '50%', border: `2px solid ${color}`, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <div style={{ fontSize: 6, color, textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.2 }}>{sealText}</div>
    </div>
  ) : null
  const DateContent = ({ color, valColor }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color }}>Issued On</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: valColor, marginTop: 2 }}>Feb 26, 2026</div>
    </div>
  )
  const Footer = ({ dark = false, sealColor, dateColor, valColor }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', padding: '3% 8% 4%' }}>
      <tbody><tr>
        <td style={{ width: '33%', textAlign: 'center' }}><SigContent dark={dark} /></td>
        <td style={{ width: '33%', textAlign: 'center' }}><SealContent color={sealColor} /></td>
        <td style={{ width: '33%', textAlign: 'center' }}><DateContent color={dateColor} valColor={valColor} /></td>
      </tr></tbody>
    </table>
  )

  if (certificateTemplate === 'modern') return (
    <div style={{ width: '100%', aspectRatio: '297/210', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#f7faff,#ffffff,#f2f6ff)', border: `1.5px solid ${pc}55`, borderRadius: 4, ...patStyle, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3% 10%', gap: 5 }}>
        <LogoBlock />
        {showOrganization && organization && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: pc }}>{organization}</div>}
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.65 }}>{SS}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.2 }}>{TT}</div>
        <div style={{ width: 30, height: 2, background: pc, margin: '4px auto' }} />
        <div style={{ fontSize: 10, opacity: 0.6 }}>is proudly presented to</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5, padding: '2px 12px', borderBottom: `2px solid ${pc}55`, display: 'inline-block', marginTop: 4 }}>Sample Participant</div>
        <div style={{ fontSize: 10, opacity: 0.75 }}>for successfully completing <span style={{ fontWeight: 700, color: pc }}>{examTitle || 'Exam Title'}</span></div>
        {badges.length > 0 && <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>{badges.map((b, i) => <span key={i} style={{ fontSize: 9, background: `${pc}12`, border: `1px solid ${pc}35`, color: pc, padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>{b}</span>)}</div>}
        {certificateFooterNote && <div style={{ fontSize: 9, opacity: 0.5, fontStyle: 'italic' }}>{certificateFooterNote}</div>}
      </div>
      <Footer sealColor={pc} dateColor="#bbb" valColor="#333" />
    </div>
  )

  if (certificateTemplate === 'classic') {
    const gold = '#8B6914'
    return (
      <div style={{ width: '100%', aspectRatio: '297/210', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at center,#fffef8,#fdf6e3)', outline: `5px double ${gold}`, outlineOffset: '-8px', ...patStyle, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3% 9%' }}>
          <LogoBlock />
          {showOrganization && organization && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: gold, textTransform: 'uppercase' }}>{organization}</div>}
          <div style={{ fontSize: 10, color: gold, letterSpacing: 6, margin: '4px 0' }}>❦ ✦ ❦</div>
          <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>proudly presents</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3d2b00' }}>{TT}</div>
          <div style={{ fontSize: 10, color: gold }}>—— ✦ ——</div>
          <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>{SS}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3d2b00' }}>Sample Participant</div>
          <div style={{ fontSize: 10 }}>for completing <span style={{ color: gold }}>{examTitle || 'Exam Title'}</span></div>
        </div>
        <Footer sealColor={gold} dateColor="#bbb" valColor="#555" />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', aspectRatio: '297/210', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', color: '#fff', ...patStyle, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3% 10%' }}>
        <LogoBlock dark />
        {showOrganization && organization && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: pc, textTransform: 'uppercase' }}>{organization}</div>}
        <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2 }}>{SS}</div>
        <div style={{ fontSize: 22, fontWeight: 300 }}>{TT}</div>
        <div style={{ width: 40, height: 1, background: pc, margin: '6px auto' }} />
        <div style={{ fontSize: 10, opacity: 0.5 }}>PROUDLY AWARDED TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f5d78e' }}>Sample Participant</div>
        <div style={{ fontSize: 10, opacity: 0.6 }}>for completing <span style={{ color: pc }}>{examTitle || 'Exam Title'}</span></div>
      </div>
      <Footer dark sealColor={pc} dateColor="rgba(255,255,255,.3)" valColor={pc} />
    </div>
  )
}

/* ─── Image Upload ───────────────────────────────────────────────────────────── */
const ImageUploadField = ({ label, value, onUpload, onClear, hint }) => {
  const ref = useRef(null)
  const [uploading, setUploading] = useState(false)
  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return; setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUpload(res.data.url); toast.success(`${label} uploaded!`)
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); if (e.target) e.target.value = '' }
  }
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {value ? (
        <div style={{ background: '#27272A', border: '1px solid #3F3F46', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={value} alt={label} style={{ height: 40, maxWidth: 100, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.success, marginBottom: 8 }}>✓ Uploaded</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => ref.current.click()} disabled={uploading} style={{ fontSize: 11, padding: '4px 10px', background: '#3F3F46', color: C.navText, border: '1px solid #52525B', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Replace</button>
              <button onClick={onClear} style={{ fontSize: 11, padding: '4px 10px', background: 'transparent', color: '#F87171', border: '1px solid #7F1D1D', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button className="cdp-upload-btn" onClick={() => ref.current.click()} disabled={uploading}
          style={{ width: '100%', padding: '14px 12px', border: '1px dashed #3F3F46', background: '#27272A', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 16, color: C.navText }}>{uploading ? '↻' : '↑'}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.navText }}>{uploading ? 'Uploading…' : `Upload ${label}`}</span>
          {hint && <span style={{ fontSize: 11, color: '#52525B' }}>{hint}</span>}
        </button>
      )}
    </div>
  )
}

/* ─── Signature Field ────────────────────────────────────────────────────────── */
const SignatureField = ({ value, onUpload, onClear }) => {
  const [showCanvas, setShowCanvas] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleDrawSave = async (dataUrl) => {
    setShowCanvas(false); setUploading(true)
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const fd = new FormData(); fd.append('image', blob, 'signature.png')
      const res = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUpload(res.data.url); toast.success('Signature saved!')
    } catch { toast.error('Failed to save signature') }
    finally { setUploading(false) }
  }
  const handleFileUpload = async e => {
    const file = e.target.files[0]; if (!file) return; setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const res = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUpload(res.data.url); toast.success('Signature uploaded!')
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); if (e.target) e.target.value = '' }
  }

  return (
    <>
      {showCanvas && <SignatureCanvas onSave={handleDrawSave} onClose={() => setShowCanvas(false)} />}
      <div>
        <FieldLabel>Instructor Signature</FieldLabel>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        {value ? (
          <div style={{ background: '#27272A', border: '1px solid #3F3F46', borderRadius: 8, padding: 14 }}>
            <img src={value} alt="Signature" style={{ height: 50, maxWidth: 180, objectFit: 'contain', display: 'block', margin: '0 auto 12px', background: '#fff', padding: 6, borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <button onClick={() => setShowCanvas(true)} style={{ fontSize: 11, padding: '5px 12px', background: '#3F3F46', color: C.navText, border: '1px solid #52525B', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Redraw</button>
              <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ fontSize: 11, padding: '5px 12px', background: '#3F3F46', color: C.navText, border: '1px solid #52525B', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Re-upload</button>
              <button onClick={onClear} style={{ fontSize: 11, padding: '5px 12px', background: 'transparent', color: '#F87171', border: '1px solid #7F1D1D', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Remove</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="cdp-upload-btn" onClick={() => setShowCanvas(true)} disabled={uploading}
              style={{ padding: '16px 10px', border: `1px dashed ${C.accent}55`, background: '#1E3A5F22', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
              <span style={{ fontSize: 16, color: C.accent }}>✍</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Draw</span>
              <span style={{ fontSize: 10, color: C.navText }}>Mouse / finger</span>
            </button>
            <button className="cdp-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}
              style={{ padding: '16px 10px', border: '1px dashed #3F3F46', background: '#27272A', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
              <span style={{ fontSize: 16, color: C.navText }}>{uploading ? '↻' : '↑'}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.navText }}>{uploading ? 'Uploading…' : 'Upload'}</span>
              <span style={{ fontSize: 10, color: '#52525B' }}>PNG, JPG, GIF</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   Uses position:fixed to break out of Layout completely — this is the correct
   approach for a full-screen editor that manages its own scroll/overflow.
═══════════════════════════════════════════════════════════════════════════════ */
export default function CertificateDesignPage() {
  const { id } = useParams()
  const { user } = useAuth()
  useGlobalStyles()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeNav, setActiveNav] = useState('template')

  const [design, setDesign] = useState({
    certificateTemplate: 'modern', primaryColor: '#2563EB',
    fontFamily: 'inter', backgroundPattern: 'none',
    logoUrl: '', logoUrl2: '', signatureUrl: '', signatureLabel: 'Course Instructor',
    certificateTitle: '', certificateSubtitle: '', certificateFooterNote: '',
    sealText: 'Verified Certificate',
    showScore: true, showGrade: true, showExamDate: true,
    showInstructor: true, showOrganization: true, showSeal: true,
  })

  const fetchExam = useCallback(async () => {
    try {
      const res = await api.get(`/exams/${id}`)
      const e = res.data.exam; setExam(e)
      setDesign({
        certificateTemplate: e.certificateTemplate || 'modern',
        primaryColor: e.primaryColor || '#2563EB',
        fontFamily: e.fontFamily || 'inter',
        backgroundPattern: e.backgroundPattern || 'none',
        logoUrl: e.logoUrl || '',
        logoUrl2: e.logoUrl2 || '',
        signatureUrl: e.signatureUrl || '',
        signatureLabel: e.signatureLabel || 'Course Instructor',
        certificateTitle: e.certificateTitle || '',
        certificateSubtitle: e.certificateSubtitle || '',
        certificateFooterNote: e.certificateFooterNote || '',
        sealText: e.sealText || 'Verified Certificate',
        showScore: e.showScore !== false,
        showGrade: e.showGrade !== false,
        showExamDate: e.showExamDate !== false,
        showInstructor: e.showInstructor !== false,
        showOrganization: e.showOrganization !== false,
        showSeal: e.showSeal !== false,
      })
    } catch { toast.error('Failed to load exam') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchExam() }, [fetchExam])

  const set = (k, v) => setDesign(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try { await api.put(`/exams/${id}/certificate-design`, design); toast.success('Design saved!') }
    catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  if (user?.role !== 'admin') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32 }}>⊘</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Admin access required</div>
      <Link to="/exams" style={{ color: C.accent, textDecoration: 'none', fontSize: 14 }}>← Back to Exams</Link>
    </div>
  )
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>Loading…</div>
  if (!exam) return <div style={{ padding: 60 }}>Exam not found. <Link to="/exams" style={{ color: C.accent }}>← Back</Link></div>

  /* ── Section panels ── */
  const renderPanel = () => {
    if (activeNav === 'template') return (
      <>
        <SectionLabel>Style</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
          {TEMPLATES.map(t => {
            const active = design.certificateTemplate === t.id
            return (
              <div key={t.id} className="cdp-card" onClick={() => set('certificateTemplate', t.id)} style={{
                padding: '12px 8px', textAlign: 'center',
                border: active ? `1.5px solid ${design.primaryColor}` : '1.5px solid #3F3F46',
                background: active ? `${design.primaryColor}18` : '#27272A',
              }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: active ? design.primaryColor : '#D4D4D8' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>{t.desc}</div>
              </div>
            )
          })}
        </div>
        <Divider />
        <SectionLabel>Primary Color</SectionLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <input type="color" value={design.primaryColor} onChange={e => set('primaryColor', e.target.value)}
            style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #3F3F46', cursor: 'pointer', padding: 2, background: 'none', flexShrink: 0 }} />
          <input className="cdp-inp" value={design.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#2563EB" style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 7, marginBottom: 20 }}>
          {PRESET_COLORS.map(c => (
            <div key={c} className="cdp-swatch" onClick={() => set('primaryColor', c)} style={{
              aspectRatio: '1', background: c,
              border: design.primaryColor === c ? '2.5px solid #FAFAFA' : '2px solid transparent',
              transform: design.primaryColor === c ? 'scale(1.1)' : 'scale(1)',
            }} />
          ))}
        </div>
        <Divider />
        <SectionLabel>Background Pattern</SectionLabel>
        <select className="cdp-inp" value={design.backgroundPattern} onChange={e => set('backgroundPattern', e.target.value)}>
          {PATTERNS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </>
    )

    if (activeNav === 'typography') return (
      <>
        <SectionLabel>Font Family</SectionLabel>
        <div style={{ display: 'grid', gap: 7 }}>
          {FONTS.map(f => {
            const active = design.fontFamily === f.id
            return (
              <div key={f.id} className="cdp-card" onClick={() => set('fontFamily', f.id)} style={{
                padding: '11px 14px',
                border: active ? `1.5px solid ${design.primaryColor}` : '1.5px solid #3F3F46',
                background: active ? `${design.primaryColor}18` : '#27272A',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: active ? design.primaryColor : '#D4D4D8' }}>{f.label}</div>
                <div style={{ fontSize: 12, color: '#71717A', fontStyle: 'italic' }}>Aa</div>
              </div>
            )
          })}
        </div>
      </>
    )

    if (activeNav === 'content') return (
      <>
        <SectionLabel>Text & Labels</SectionLabel>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { key: 'certificateTitle', label: 'Certificate Title', placeholder: 'Certificate of Achievement' },
            { key: 'certificateSubtitle', label: 'Subtitle / Intro', placeholder: 'This is to certify that' },
            { key: 'signatureLabel', label: 'Signature Label', placeholder: 'Course Instructor' },
            { key: 'sealText', label: 'Seal Text', placeholder: 'Verified Certificate' },
            { key: 'certificateFooterNote', label: 'Footer Note', placeholder: 'e.g. Valid for 2 years…' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input className="cdp-inp" value={design[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </>
    )

    if (activeNav === 'visibility') return (
      <>
        <SectionLabel>Field Visibility</SectionLabel>
        <Toggle label="Score" desc="e.g. 95%" value={design.showScore} onChange={v => set('showScore', v)} />
        <Toggle label="Grade" desc="e.g. A, Distinction" value={design.showGrade} onChange={v => set('showGrade', v)} />
        <Toggle label="Exam Date" desc="Date the exam was taken" value={design.showExamDate} onChange={v => set('showExamDate', v)} />
        <Toggle label="Instructor" desc="Name on signature line" value={design.showInstructor} onChange={v => set('showInstructor', v)} />
        <Toggle label="Organization" desc="School / org name" value={design.showOrganization} onChange={v => set('showOrganization', v)} />
        <Toggle label="Seal" desc="Circular verified seal" value={design.showSeal} onChange={v => set('showSeal', v)} />
      </>
    )

    if (activeNav === 'branding') return (
      <>
        <SectionLabel>Logos</SectionLabel>
        <p style={{ fontSize: 11, color: '#52525B', marginBottom: 14, lineHeight: 1.6, marginTop: 0 }}>
          Two logos appear left &amp; right. One logo appears centred.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          <ImageUploadField label="Left / Centre Logo" value={design.logoUrl} onUpload={url => set('logoUrl', url)} onClear={() => set('logoUrl', '')} hint="Transparent PNG recommended" />
          <ImageUploadField label="Right Logo (optional)" value={design.logoUrl2} onUpload={url => set('logoUrl2', url)} onClear={() => set('logoUrl2', '')} hint="Only shown if left logo is set" />
        </div>
        <Divider />
        <SectionLabel>Signature</SectionLabel>
        <SignatureField value={design.signatureUrl} onUpload={url => set('signatureUrl', url)} onClear={() => set('signatureUrl', '')} />
      </>
    )

    return null
  }

  /* ─── RENDER — position:fixed breaks out of Layout entirely ─── */
  return (
    <div className="cdp-root">

      {/* ══ LEFT SIDEBAR ══ */}
      <div className="cdp-sidebar">

        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
          <Link to={`/exams/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.navText, textDecoration: 'none', fontSize: 12, fontWeight: 500, marginBottom: 14, opacity: 0.8 }}>← Back</Link>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.02em' }}>Certificate Design</div>
          <div style={{ fontSize: 11, color: '#52525B', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 8px', borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} className="cdp-nav-btn" onClick={() => setActiveNav(n.id)} style={{
              background: activeNav === n.id ? C.navActiveBg : 'transparent',
              color: activeNav === n.id ? C.navActive : C.navText,
              fontWeight: activeNav === n.id ? 600 : 400,
            }}>
              {n.label}
            </button>
          ))}
        </div>

        {/* Scrollable panel */}
        <div className="cdp-sidebar-scroll">{renderPanel()}</div>

        {/* Save button — pinned to bottom */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
          <button className="cdp-save-btn" onClick={handleSave} disabled={saving} style={{
            background: saving ? '#374151' : C.accent, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Save Design'}
          </button>
        </div>
      </div>

      {/* ══ RIGHT CANVAS ══ */}
      <div className="cdp-canvas">

        {/* Toolbar */}
        <div style={{ height: 50, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: design.primaryColor, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted }}>{TEMPLATES.find(t => t.id === design.certificateTemplate)?.label}</span>
          </div>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 12, color: C.textSub }}>A4 Landscape · 297 × 210 mm</span>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: C.textSub, background: C.borderSubtle, border: `1px solid ${C.border}`, padding: '3px 8px', borderRadius: 4 }}>Live Preview</span>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="cdp-canvas-body">
          <div style={{ width: '100%', maxWidth: 860 }}>
            <div style={{ borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <CertificatePreview design={design} examTitle={exam.title} instructorName={exam.instructor} organization={exam.organization} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: C.textSub }}>
              Scaled preview — actual PDF fills full A4 landscape
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ height: 34, background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20, flexShrink: 0 }}>
          {[
            ['Color', design.primaryColor],
            ['Font', design.fontFamily],
            ['Pattern', design.backgroundPattern],
            ['Logo 1', design.logoUrl ? '✓' : '—'],
            ['Logo 2', design.logoUrl2 ? '✓' : '—'],
            ['Signature', design.signatureUrl ? '✓' : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ color: C.textSub }}>{k}</span>
              {k === 'Color' && <span style={{ width: 9, height: 9, borderRadius: 2, background: v, display: 'inline-block', border: `1px solid ${C.border}` }} />}
              <span style={{ color: C.textMuted, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}