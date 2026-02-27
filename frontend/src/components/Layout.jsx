import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const width = useWindowWidth()
  const isMobile = width < 768
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  // Close sidebar on mobile when screen size changes
  useEffect(() => { if (isMobile) setSidebarOpen(false) }, [isMobile])

  const handleLogout = () => { logout(); navigate('/login') }
  const handleNav    = ()  => { if (isMobile) setSidebarOpen(false) }

  const NavItem = ({ to, icon, label }) => (
    <NavLink to={to} onClick={handleNav} style={({ isActive }) => ({
      display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8,
      color: isActive ? '#f5d78e' : 'rgba(255,255,255,.65)',
      background: isActive ? 'rgba(245,215,142,.12)' : 'transparent',
      textDecoration:'none', fontSize:14, fontWeight: isActive ? 600 : 400,
      marginBottom:4, transition:'all 0.15s', whiteSpace:'nowrap', overflow:'hidden',
    })}>
      <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
      {sidebarOpen && label}
    </NavLink>
  )

  const AdminItem = ({ to, icon, label }) => (
    <NavLink to={to} onClick={handleNav} style={({ isActive }) => ({
      display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8,
      color: isActive ? '#f5d78e' : 'rgba(200,169,110,.9)',
      background: isActive ? 'rgba(200,169,110,.15)' : 'rgba(200,169,110,.07)',
      textDecoration:'none', fontSize:14, fontWeight: isActive ? 700 : 500,
      marginBottom:4, transition:'all 0.15s', whiteSpace:'nowrap', overflow:'hidden',
      border:'1px solid rgba(200,169,110,.15)',
    })}>
      <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
      {sidebarOpen && label}
    </NavLink>
  )

  const sidebarW = sidebarOpen ? (isMobile ? '100vw' : 240) : (isMobile ? 0 : 64)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f2f5', fontFamily:"'Inter',-apple-system,sans-serif" }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:99 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background:'linear-gradient(180deg,#0f0c29 0%,#302b63 100%)',
        transition:'width 0.25s ease, min-width 0.25s ease',
        display:'flex', flexDirection:'column',
        boxShadow:'2px 0 12px rgba(0,0,0,.15)',
        flexShrink:0, overflow:'hidden',
        position: isMobile ? 'fixed' : 'sticky',
        top:0, left:0,
        height: isMobile ? '100vh' : '100vh',
        zIndex: isMobile ? 100 : 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding:'18px 14px', borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#c8a96e,#f5d78e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🎓</div>
            {sidebarOpen && (
              <div>
                <div style={{ color:'#fff', fontWeight:700, fontSize:15, lineHeight:1.2 }}>CertGen</div>
                <div style={{ color:'rgba(255,255,255,.45)', fontSize:11 }}>Certificate Platform</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
          <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          <NavItem to="/exams"     icon="📝" label="Exams" />

          {user?.role === 'admin' && (
            <>
              {sidebarOpen && (
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(200,169,110,.4)', textTransform:'uppercase', letterSpacing:1.5, padding:'14px 12px 6px' }}>
                  Admin Tools
                </div>
              )}
              {!sidebarOpen && <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', margin:'8px 0' }} />}
              <AdminItem to="/certificates" icon="🎓" label="Certificates" />
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
          {sidebarOpen && (
            <div style={{ padding:'4px 12px 8px' }}>
              <div style={{ color:'#fff', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                <div style={{ color:'rgba(255,255,255,.4)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{user?.email}</div>
                {user?.role === 'admin' && (
                  <span style={{ fontSize:9, fontWeight:700, background:'rgba(200,169,110,.2)', color:'#c8a96e', padding:'1px 6px', borderRadius:4, flexShrink:0, textTransform:'uppercase' }}>Admin</span>
                )}
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,80,80,.12)', border:'none', cursor:'pointer', color:'#ff8080', fontSize:14, fontFamily:'inherit', marginBottom:6, whiteSpace:'nowrap' }}>
            <span style={{ flexShrink:0 }}>🚪</span>{sidebarOpen && 'Logout'}
          </button>
          {!isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width:'100%', padding:'7px', borderRadius:8, background:'rgba(255,255,255,.08)', border:'none', cursor:'pointer', color:'rgba(255,255,255,.5)', fontSize:12, fontFamily:'inherit' }}>
              {sidebarOpen ? '← Collapse' : '→'}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ background:'linear-gradient(90deg,#0f0c29,#302b63)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0, position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', fontSize:22, padding:0, lineHeight:1 }}>☰</button>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#c8a96e,#f5d78e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎓</div>
              <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>CertGen</span>
            </div>
          </div>
        )}
        <main style={{ flex:1, overflow:'auto', padding: isMobile ? '16px' : '28px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
