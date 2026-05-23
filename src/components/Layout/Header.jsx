import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme }  = useTheme()
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (isAdmin) return null

  const isDark = theme === 'dark'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '12px 28px',
      background: scrolled
        ? (isDark ? 'rgba(6,10,18,0.92)' : 'rgba(245,248,255,0.92)')
        : (isDark ? 'rgba(6,10,18,0.35)' : 'rgba(245,248,255,0.35)'),
      backdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      transition: 'all 0.4s ease',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* ── Logo ── */}
      <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{
          width:36, height:36,
          background: 'linear-gradient(135deg,#0044cc,#00c8e0)',
          borderRadius:10,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, boxShadow:'0 0 18px rgba(0,200,224,0.45)',
        }}>📚</div>
        <div>
          <div style={{
            fontFamily:"'Space Grotesk',sans-serif",
            fontWeight:800, fontSize:16, letterSpacing:0.5
          }}>
            <span className="gradient-text">EMPIRE</span>
            <span style={{ color:'var(--text-1)' }}> EBOOK</span>
          </div>
          <div style={{ fontSize:9, color:'var(--text-3)', letterSpacing:2, textTransform:'uppercase', marginTop:1 }}>
            Dominez le digital
          </div>
        </div>
      </Link>

      {/* ── Nav links ── */}
      <nav style={{ display:'flex', alignItems:'center', gap:4, flexGrow:1 }}>
        {[
          { label:'🏠 Accueil', href:'#hero' },
          { label:'📖 Ebooks',  href:'#books' },
          { label:'🎁 Gratuits', href:'#free' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            padding:'7px 14px',
            borderRadius:'var(--r-sm)',
            color:'var(--text-2)',
            fontSize:13, fontWeight:500,
            textDecoration:'none',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color='var(--cyan)'; e.currentTarget.style.background='var(--cyan-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text-2)'; e.currentTarget.style.background='transparent' }}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── Right side ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        {/* Theme toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>{isDark ? '🌙' : '☀️'}</span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label="Changer le thème"
          />
          <span style={{ fontSize:14 }}>{isDark ? '☀️' : '🌙'}</span>
        </div>

        {/* Admin link */}
        <Link to="/admin" style={{ textDecoration:'none' }}>
          <button className="btn btn-cyan" style={{ padding:'7px 16px', fontSize:13 }}>
            ⚙️ Admin
          </button>
        </Link>
      </div>
    </header>
  )
}
