import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Home, BookOpen, Gift, Sun, Moon } from 'lucide-react'

/* Empire du Web SVG logo */
function EmpireLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0044cc"/>
          <stop offset="100%" stopColor="#00c8e0"/>
        </linearGradient>
        <linearGradient id="hg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c4dff"/>
          <stop offset="100%" stopColor="#00e5ff"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#060a12"/>
      <rect x="10" y="14" width="22" height="36" rx="3" fill="url(#hg1)" opacity="0.9"/>
      <rect x="14" y="11" width="22" height="36" rx="3" fill="#0a1535"/>
      <rect x="14" y="11" width="22" height="36" rx="3" fill="none" stroke="url(#hg2)" strokeWidth="1.5"/>
      <line x1="19" y1="20" x2="31" y2="20" stroke="url(#hg2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      <line x1="19" y1="25" x2="31" y2="25" stroke="url(#hg2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <line x1="19" y1="30" x2="27" y2="30" stroke="url(#hg2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <text x="36" y="45" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="url(#hg2)">E</text>
      <circle cx="52" cy="16" r="5" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="52" cy="16" r="2" fill="#00e5ff" opacity="0.9"/>
    </svg>
  )
}

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

  const navLinks = [
    { label: 'Accueil',  href: '#hero',  Icon: Home },
    { label: 'Ebooks',   href: '#books', Icon: BookOpen },
    { label: 'Gratuits', href: '#free',  Icon: Gift },
  ]

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
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{
          borderRadius: 10,
          boxShadow: '0 0 18px rgba(0,200,224,0.45)',
          lineHeight: 0,
        }}>
          <EmpireLogo size={36} />
        </div>
        <div>
          <div style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
          }}>
            <span className="gradient-text">EMPIRE</span>
            <span style={{ color: 'var(--text-1)' }}> EBOOK</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>
            By Empire du Web
          </div>
        </div>
      </Link>

      {/* ── Nav links ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexGrow: 1 }}>
        {navLinks.map(({ label, href, Icon }) => (
          <a key={href} href={href} style={{
            padding: '7px 14px',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-2)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--cyan)'
            e.currentTarget.style.background = 'var(--cyan-dim)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-2)'
            e.currentTarget.style.background = 'transparent'
          }}>
            <Icon size={14} />
            {label}
          </a>
        ))}
      </nav>

      {/* ── Theme toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ color: 'var(--text-3)', lineHeight: 0 }}>
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label="Changer le thème"
        />
        <span style={{ color: 'var(--text-3)', lineHeight: 0 }}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </span>
      </div>
    </header>
  )
}
