import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header({ onOpenSearch }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isAdmin) return null

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '14px 32px',
      background: scrolled
        ? 'rgba(6,10,18,0.92)'
        : 'rgba(6,10,18,0.4)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(0,229,255,0.12)' : 'transparent'}`,
      transition: 'all 0.4s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38,
          background: 'linear-gradient(135deg, #0044cc, #00e5ff)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 0 20px rgba(0,229,255,0.4)',
        }}>📚</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>
            <span className="gradient-text">EMPIRE</span>{' '}
            <span style={{ color: '#f0f4ff' }}>EBOOK</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>
            Dominez le digital
          </div>
        </div>
      </Link>

      {/* Desktop nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[
          { label: '🏠 Accueil', href: '#hero' },
          { label: '📖 Ebooks', href: '#books' },
          { label: '🎁 Gratuits', href: '#free' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            padding: '8px 16px',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-2)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.target.style.color='var(--cyan)'; e.target.style.background='var(--cyan-dim)' }}
          onMouseLeave={e => { e.target.style.color='var(--text-2)'; e.target.style.background='transparent' }}>
            {item.label}
          </a>
        ))}
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <button className="btn btn-cyan" style={{ padding: '8px 18px', fontSize: 13, marginLeft: 8 }}>
            ⚙️ Admin
          </button>
        </Link>
      </nav>
    </header>
  )
}
