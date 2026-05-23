import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import {
  LayoutDashboard, BookOpen, Upload, Download, ShoppingCart,
  LogOut, LogIn, ChevronLeft, ChevronRight, Trash2,
  TrendingUp, Users, DollarSign, Library, Activity, Plus,
  FileText, Image, Tag, AlertCircle, CheckCircle, Clock,
  Key, Globe, Eye, EyeOff, Shield,
} from 'lucide-react'
import {
  adminLogin, adminLogout, uploadBook, getAdminBooks,
  deleteBook, getDownloads, getPurchases, getStats, getChartData,
} from '../services/api'
import ParticleBackground from '../components/Background/ParticleBackground'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
)

/* ── animated counter ─────────────────────── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    const num = parseFloat(String(target).replace(/[^0-9.]/g, ''))
    if (!num) return
    let raf
    const start = performance.now()
    const duration = 900
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * num * 10) / 10)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return <>{typeof target === 'string' && target.includes('€') ? `${val.toFixed(2)} €` : val}{suffix}</>
}

/* ── Stat Card ───────────────────────────── */
function StatCard({ Icon, value, label, accent, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, type: 'spring', stiffness: 220 }}
      whileHover={{ scale: 1.025, y: -3 }}
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: `1px solid ${accent}44`,
        borderRadius: 18, padding: '22px 24px',
        boxShadow: `0 0 28px ${accent}18`,
        backdropFilter: 'blur(12px)',
        cursor: 'default',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* glow corner */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {label}
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", color: accent }}>
            <Counter target={value} />
          </div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${accent}18`,
          border: `1px solid ${accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={accent} />
        </div>
      </div>
    </motion.div>
  )
}

/* ── Empire SVG logo (inline) ─────────────── */
function EmpireLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0044cc"/>
          <stop offset="100%" stopColor="#00c8e0"/>
        </linearGradient>
        <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c4dff"/>
          <stop offset="100%" stopColor="#00e5ff"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#060a12"/>
      <rect x="10" y="14" width="22" height="36" rx="3" fill="url(#ag1)" opacity="0.9"/>
      <rect x="14" y="11" width="22" height="36" rx="3" fill="#0a1535"/>
      <rect x="14" y="11" width="22" height="36" rx="3" fill="none" stroke="url(#ag2)" strokeWidth="1.5"/>
      <line x1="19" y1="20" x2="31" y2="20" stroke="url(#ag2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      <line x1="19" y1="25" x2="31" y2="25" stroke="url(#ag2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      <line x1="19" y1="30" x2="27" y2="30" stroke="url(#ag2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <text x="36" y="45" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="url(#ag2)">E</text>
      <circle cx="52" cy="16" r="5" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="52" cy="16" r="2" fill="#00e5ff" opacity="0.9"/>
    </svg>
  )
}

const TABS = [
  { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'books',     Icon: Library,         label: 'Ebooks' },
  { id: 'upload',    Icon: Upload,          label: 'Ajouter' },
  { id: 'downloads', Icon: Download,        label: 'Téléchargements' },
  { id: 'purchases', Icon: ShoppingCart,    label: 'Achats' },
]

const chartOptions = {
  responsive: true,
  animation: { duration: 900, easing: 'easeInOutQuart' },
  plugins: {
    legend: { labels: { color: '#a8b2c8', font: { size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: 'rgba(0,229,255,0.2)',
      borderWidth: 1,
      titleColor: '#00e5ff',
      bodyColor: '#a8b2c8',
    },
  },
  scales: {
    x: {
      ticks: { color: '#6a7490', font: { size: 11 } },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      beginAtZero: true,
      min: 0,
      ticks: {
        color: '#6a7490',
        font: { size: 11 },
        precision: 0,          // whole numbers only
        stepSize: 1,
      },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
  },
}

/* ════════════════════════════════════════════ */
export default function AdminPage() {
  const [token,       setToken]       = useState(() => localStorage.getItem('empire_admin_token'))
  const [tab,         setTab]         = useState('dashboard')
  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [loginErr,    setLoginErr]    = useState(null)
  const [logging,     setLogging]     = useState(false)
  const [sideOpen,    setSideOpen]    = useState(true)

  const [stats,       setStats]       = useState(null)
  const [chartData,   setChartData]   = useState(null)
  const [books,       setBooks]       = useState([])
  const [downloads,   setDownloads]   = useState([])
  const [purchases,   setPurchases]   = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // upload form
  const [upTitle,   setUpTitle]   = useState('')
  const [upDesc,    setUpDesc]    = useState('')
  const [upPrice,   setUpPrice]   = useState('0')
  const [upCat,     setUpCat]     = useState('Général')
  const [upFree,    setUpFree]    = useState(false)
  const [upPdf,     setUpPdf]     = useState(null)
  const [upCover,   setUpCover]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [upMsg,     setUpMsg]     = useState(null)

  /* ── Login ── */
  const handleLogin = async e => {
    e.preventDefault()
    setLogging(true); setLoginErr(null)
    try {
      const { data } = await adminLogin({ username, password })
      localStorage.setItem('empire_admin_token', data.token)
      setToken(data.token)
    } catch (err) {
      setLoginErr(err.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLogging(false)
    }
  }

  /* ── Load data on tab change ── */
  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoadingData(true)
      try {
        if (tab === 'dashboard') {
          const [s, c] = await Promise.all([getStats(), getChartData()])
          setStats(s.data); setChartData(c.data)
        } else if (tab === 'books') {
          const { data } = await getAdminBooks(); setBooks(data)
        } else if (tab === 'downloads') {
          const { data } = await getDownloads(); setDownloads(data.data || data)
        } else if (tab === 'purchases') {
          const { data } = await getPurchases(); setPurchases(data.data || data)
        }
      } catch (err) {
        if (err.response?.status === 401) { setToken(null); localStorage.removeItem('empire_admin_token') }
      } finally { setLoadingData(false) }
    }
    load()
  }, [tab, token])

  /* ── Upload book ── */
  const handleUpload = async e => {
    e.preventDefault()
    if (!upPdf) { setUpMsg({ type: 'error', text: 'PDF requis' }); return }
    setUploading(true); setUpMsg(null)
    const fd = new FormData()
    fd.append('title', upTitle); fd.append('description', upDesc)
    fd.append('price', upFree ? '0' : upPrice)
    fd.append('is_free', upFree ? '1' : '0')
    fd.append('category', upCat); fd.append('pdf', upPdf)
    if (upCover) fd.append('cover', upCover)
    try {
      await uploadBook(fd)
      setUpMsg({ type: 'success', text: 'Livre publié avec succès !' })
      setUpTitle(''); setUpDesc(''); setUpPrice('0'); setUpFree(false); setUpPdf(null); setUpCover(null)
    } catch (err) {
      setUpMsg({ type: 'error', text: err.response?.data?.message || 'Erreur upload' })
    } finally { setUploading(false) }
  }

  /* ── Delete ── */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    try { await deleteBook(id); setBooks(prev => prev.filter(b => b.id !== id)) } catch {}
  }

  /* ══════════════ LOGIN PAGE ═════════════════ */
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <ParticleBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(10,14,26,0.92)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(0,229,255,0.18)',
            borderRadius: 28,
            padding: '52px 44px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 0 80px rgba(0,229,255,0.12)',
          }}
        >
          {/* logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260 }}
              style={{ display: 'inline-block', marginBottom: 16 }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 20, margin: '0 auto',
                boxShadow: '0 0 36px rgba(0,229,255,0.35)',
              }}>
                <EmpireLogo size={72} />
              </div>
            </motion.div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
              <span className="gradient-text">Empire Ebook</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13 }}>
              <Shield size={13} />
              Panneau d'administration sécurisé
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} /> Identifiant
              </label>
              <input className="input" type="text" placeholder="Votre identifiant"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={13} /> Mot de passe
              </label>
              <input className="input" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
                style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, bottom: 10,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 0, lineHeight: 0,
                }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <AnimatePresence>
              {loginErr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
                    borderRadius: 10, padding: '10px 14px', color: '#ff6b6b',
                    fontSize: 13, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <AlertCircle size={14} /> {loginErr}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 8, gap: 8 }}
              disabled={logging}
            >
              {logging
                ? <><span className="spinner" /> Connexion…</>
                : <><LogIn size={16} /> Se connecter</>
              }
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Shield size={11} /> Accès réservé aux administrateurs autorisés
          </p>
        </motion.div>
      </div>
    )
  }

  /* ══════════════ MAIN PANEL ═════════════════ */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sideOpen ? 240 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          height: '100vh', position: 'sticky', top: 0,
          background: 'rgba(10,14,26,0.97)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flexShrink: 0, zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flexShrink: 0, lineHeight: 0, boxShadow: '0 0 14px rgba(0,229,255,0.3)', borderRadius: 10 }}>
            <EmpireLogo size={38} />
          </div>
          <AnimatePresence>
            {sideOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ fontSize: 13, fontWeight: 800 }}><span className="gradient-text">EMPIRE EBOOK</span></div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Admin Panel</div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setSideOpen(o => !o)}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-3)', cursor: 'pointer', padding: '5px 6px', flexShrink: 0, lineHeight: 0 }}
          >
            {sideOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </motion.button>
        </div>

        {/* Nav items */}
        <nav style={{ flexGrow: 1, padding: '12px 8px' }}>
          {TABS.map((t, i) => {
            const active = tab === t.id
            return (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: 3 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 12, marginBottom: 4,
                  background: active ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(0,229,255,0.25)' : 'transparent'}`,
                  color: active ? 'var(--cyan)' : 'var(--text-3)',
                  cursor: 'pointer', fontWeight: active ? 700 : 400,
                  transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                <t.Icon size={17} style={{ flexShrink: 0 }} />
                <AnimatePresence>
                  {sideOpen && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 13 }}
                    >
                      {t.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    style={{ marginLeft: 'auto', width: 4, height: 24, borderRadius: 2, background: 'var(--cyan)', flexShrink: 0 }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { adminLogout(); setToken(null) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)',
              color: '#ff6b6b', cursor: 'pointer', fontSize: 13, overflow: 'hidden',
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sideOpen && 'Déconnexion'}
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main style={{ flexGrow: 1, padding: '32px', overflow: 'auto', maxWidth: 'calc(100vw - 72px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >

            {/* ─── DASHBOARD ─── */}
            {tab === 'dashboard' && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
                    Tableau de bord <span className="gradient-text">Analytics</span>
                  </h2>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Activity size={13} /> Vue en temps réel de l'activité Empire Ebook
                  </p>
                </div>

                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: 'auto' }} />
                  </div>
                ) : stats ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
                      <StatCard Icon={Library}      value={stats.total_books}     label="Total Ebooks"    accent="#00e5ff" sub={`${stats.free_books||0} gratuits`} delay={0} />
                      <StatCard Icon={Download}     value={stats.total_downloads} label="Téléchargements" accent="#00ff7f" sub="tous les temps"                      delay={0.07} />
                      <StatCard Icon={ShoppingCart} value={stats.total_purchases} label="Achats"          accent="#ffd700" sub={`${stats.pending_purchases||0} en attente`} delay={0.14} />
                      <StatCard Icon={DollarSign}   value={`${Number(stats.total_revenue||0).toFixed(2)} €`} label="Revenu total" accent="#b27fff" sub="paiements confirmés" delay={0.21} />
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 36 }}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}
                      >
                        <h4 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <TrendingUp size={16} color="var(--cyan)" /> Activité 30 derniers jours
                        </h4>
                        {chartData && (
                          <Line
                            data={{
                              labels: chartData.daily_downloads?.map(d => d.date.slice(5)) || [],
                              datasets: [
                                { label: 'Téléchargements', data: chartData.daily_downloads?.map(d => d.count) || [], borderColor: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.08)', fill: true, tension: 0.4 },
                                { label: 'Achats',          data: chartData.daily_purchases?.map(d => d.count) || [], borderColor: '#7c4dff', backgroundColor: 'rgba(124,77,255,0.08)', fill: true, tension: 0.4 },
                              ],
                            }}
                            options={chartOptions}
                          />
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}
                      >
                        <h4 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <BookOpen size={16} color="#ffd700" /> Top Livres
                        </h4>
                        {stats.top_books?.length > 0 ? (
                          <Doughnut
                            data={{
                              labels: stats.top_books.map(b => b.title.slice(0, 18) + '…'),
                              datasets: [{ data: stats.top_books.map(b => b.purchase_count), backgroundColor: ['#00e5ff', '#7c4dff', '#ffd700', '#00ff7f', '#ff6496'], borderWidth: 0 }],
                            }}
                            options={{ responsive: true, plugins: { legend: { labels: { color: '#a8b2c8', font: { size: 10 } }, position: 'bottom' } } }}
                          />
                        ) : (
                          <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 30, fontSize: 13 }}>Aucun achat encore</div>
                        )}
                      </motion.div>
                    </div>

                    {/* Recent activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}
                    >
                      <h4 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Activity size={16} color="var(--cyan)" /> Activité récente
                      </h4>
                      <table className="data-table">
                        <thead><tr><th>Type</th><th>Email</th><th>Livre</th><th>Date</th></tr></thead>
                        <tbody>
                          {(stats.recent_activity || []).slice(0, 10).map((a, i) => (
                            <tr key={i}>
                              <td>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: a.type === 'download' ? 'rgba(0,255,127,0.1)' : 'rgba(255,200,0,0.1)',
                                  color: a.type === 'download' ? '#00ff7f' : '#ffd700',
                                  border: `1px solid ${a.type === 'download' ? 'rgba(0,255,127,0.3)' : 'rgba(255,200,0,0.3)'}`,
                                }}>
                                  {a.type === 'download' ? <Download size={10} /> : <ShoppingCart size={10} />}
                                  {a.type === 'download' ? 'Téléch.' : 'Achat'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--cyan)', fontSize: 13 }}>{a.email}</td>
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{a.title}</td>
                              <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(a.created_at).toLocaleString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 60 }}>
                    <Globe size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <p>Aucune donnée. Vérifiez la connexion au backend Laravel.</p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      API: <code style={{ color: 'var(--cyan)' }}>http://localhost:8000/api/admin/stats</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── BOOKS LIST ─── */}
            {tab === 'books' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
                      Gestion des <span className="gradient-text">Ebooks</span>
                    </h2>
                    <p style={{ color: 'var(--text-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Library size={13} /> {books.length} livres dans la bibliothèque
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setTab('upload')}
                  >
                    <Plus size={15} /> Ajouter un livre
                  </motion.button>
                </div>

                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: 'auto' }} /></div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                    <table className="data-table">
                      <thead><tr>
                        <th>Titre</th><th>Catégorie</th><th>Prix</th>
                        <th style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={12} /> DL</th>
                        <th><ShoppingCart size={12} /></th>
                        <th>Type</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {books.map((b, i) => (
                          <motion.tr
                            key={b.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            style={{ cursor: 'default' }}
                          >
                            <td style={{ fontWeight: 600, color: 'var(--text-1)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</td>
                            <td><span className="badge badge-cyan" style={{ fontSize: 10 }}>{b.category}</span></td>
                            <td>{b.is_free ? <span style={{ color: '#00ff7f' }}>GRATUIT</span> : `${b.price} €`}</td>
                            <td style={{ color: '#00ff7f', fontWeight: 700 }}>{b.download_count}</td>
                            <td style={{ color: '#ffd700', fontWeight: 700 }}>{b.purchase_count}</td>
                            <td><span className={`badge ${b.is_free ? 'badge-free' : 'badge-paid'}`}>{b.is_free ? 'Gratuit' : 'Payant'}</span></td>
                            <td>
                              <motion.button
                                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                                className="btn btn-danger"
                                style={{ padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => handleDelete(b.id, b.title)}
                              >
                                <Trash2 size={12} /> Suppr.
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {books.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                        <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p>Aucun livre. <button onClick={() => setTab('upload')} style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Ajoutez le premier →</button></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── UPLOAD ─── */}
            {tab === 'upload' && (
              <div style={{ maxWidth: 720 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
                  Publier un <span className="gradient-text">Ebook</span>
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Upload size={13} /> Uploadez votre PDF avec les informations du livre
                </p>
                <form onSubmit={handleUpload}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 22, padding: 36 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Titre du livre *</label>
                        <input className="input" value={upTitle} onChange={e => setUpTitle(e.target.value)} placeholder="Ex: Marketing Digital Masterclass" required />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Description</label>
                        <textarea className="input" value={upDesc} onChange={e => setUpDesc(e.target.value)} placeholder="Description détaillée…" rows={4} />
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={13} /> Catégorie</label>
                        <select className="input" value={upCat} onChange={e => setUpCat(e.target.value)} style={{ cursor: 'pointer' }}>
                          {['Général', 'Marketing Digital', 'Entrepreneuriat', 'Finance', 'Leadership', 'Technologie', 'Développement Personnel'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                          {[{ label: 'Payant', Icon: ShoppingCart, free: false }, { label: 'Gratuit', Icon: Download, free: true }].map(({ label, Icon, free }) => (
                            <motion.label
                              key={label}
                              whileHover={{ scale: 1.03 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                                padding: '8px 14px', borderRadius: 10,
                                border: `1px solid ${upFree === free ? 'var(--cyan)' : 'var(--border)'}`,
                                background: upFree === free ? 'rgba(0,229,255,0.08)' : 'transparent',
                                color: upFree === free ? 'var(--cyan)' : 'var(--text-2)',
                                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                              }}
                            >
                              <input type="radio" checked={upFree === free} onChange={() => setUpFree(free)} style={{ display: 'none' }} />
                              <Icon size={14} /> {label}
                            </motion.label>
                          ))}
                        </div>
                      </div>
                      {!upFree && (
                        <div className="form-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={13} /> Prix (€)</label>
                          <input className="input" type="number" step="0.01" min="0.01" value={upPrice} onChange={e => setUpPrice(e.target.value)} placeholder="19.99" />
                        </div>
                      )}

                      {/* PDF drop zone */}
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} /> Fichier PDF *{' '}
                          {upPdf && <span style={{ color: '#00ff7f', fontSize: 11, fontWeight: 700 }}><CheckCircle size={11} /> {upPdf.name}</span>}
                        </label>
                        <motion.label
                          whileHover={{ borderColor: 'var(--cyan)', background: 'rgba(0,229,255,0.04)' }}
                          style={{
                            display: 'block', padding: '22px', border: '2px dashed var(--border)',
                            borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                            color: 'var(--text-3)', fontSize: 13, transition: 'all 0.2s',
                          }}
                        >
                          <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                          Cliquez pour sélectionner (PDF max 100MB)
                          <input type="file" accept=".pdf" onChange={e => setUpPdf(e.target.files[0])} style={{ display: 'none' }} />
                        </motion.label>
                      </div>

                      {/* Cover drop zone */}
                      <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Image size={13} /> Couverture (optionnel){' '}
                          {upCover && <span style={{ color: '#00ff7f', fontSize: 11 }}><CheckCircle size={11} /> {upCover.name}</span>}
                        </label>
                        <motion.label
                          whileHover={{ borderColor: 'var(--purple)', background: 'rgba(124,77,255,0.04)' }}
                          style={{
                            display: 'block', padding: '22px', border: '2px dashed var(--border)',
                            borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                            color: 'var(--text-3)', fontSize: 13, transition: 'all 0.2s',
                          }}
                        >
                          <Image size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                          Image de couverture (JPG/PNG)
                          <input type="file" accept="image/*" onChange={e => setUpCover(e.target.files[0])} style={{ display: 'none' }} />
                        </motion.label>
                      </div>
                    </div>

                    <AnimatePresence>
                      {upMsg && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            margin: '20px 0', padding: '14px 18px', borderRadius: 12, fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: upMsg.type === 'success' ? 'rgba(0,255,127,0.1)' : 'rgba(255,50,50,0.1)',
                            border: `1px solid ${upMsg.type === 'success' ? 'rgba(0,255,127,0.3)' : 'rgba(255,50,50,0.3)'}`,
                            color: upMsg.type === 'success' ? '#00ff7f' : '#ff6b6b',
                          }}
                        >
                          {upMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                          {upMsg.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit" className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 15, marginTop: 12, gap: 8 }}
                      disabled={uploading}
                    >
                      {uploading ? <><span className="spinner" /> Upload en cours…</> : <><Upload size={16} /> Publier l'ebook</>}
                    </motion.button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── DOWNLOADS ─── */}
            {tab === 'downloads' && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
                  Téléchargements <span className="gradient-text">Gratuits</span>
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Download size={13} /> {downloads.length} téléchargements enregistrés
                </p>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'auto' }}>
                  <table className="data-table">
                    <thead><tr>
                      <th style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> Email</th>
                      <th>Livre</th>
                      <th style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={12} /> IP</th>
                      <th style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Date</th>
                    </tr></thead>
                    <tbody>
                      {downloads.map((d, i) => (
                        <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <td style={{ color: 'var(--cyan)' }}>{d.email}</td>
                          <td>{d.book_title}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>{d.ip_address || '—'}</td>
                          <td style={{ fontSize: 12 }}>{new Date(d.created_at).toLocaleString('fr-FR')}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {downloads.length === 0 && !loadingData && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                      <Download size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      Aucun téléchargement enregistré.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── PURCHASES ─── */}
            {tab === 'purchases' && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
                  Achats & <span className="gradient-text">Paiements</span>
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShoppingCart size={13} /> {purchases.length} transactions enregistrées
                </p>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'auto' }}>
                  <table className="data-table">
                    <thead><tr>
                      <th>Email</th><th>Livre</th><th>Montant</th><th>Statut</th><th>Licence</th><th>Date</th>
                    </tr></thead>
                    <tbody>
                      {purchases.map((p, i) => (
                        <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                          <td style={{ color: 'var(--cyan)' }}>{p.email}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.book_title}</td>
                          <td style={{ color: '#ffd700', fontWeight: 700 }}>{p.amount} €</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: p.status === 'completed' ? 'rgba(0,255,127,0.1)' : 'rgba(255,200,0,0.1)',
                              color: p.status === 'completed' ? '#00ff7f' : '#ffd700',
                              border: `1px solid ${p.status === 'completed' ? 'rgba(0,255,127,0.3)' : 'rgba(255,200,0,0.3)'}`,
                            }}>
                              {p.status === 'completed' ? <CheckCircle size={10} /> : <Clock size={10} />}
                              {p.status === 'completed' ? 'Payé' : 'En attente'}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Key size={10} /> {p.license_key?.slice(0, 16)}…
                            </span>
                          </td>
                          <td style={{ fontSize: 11 }}>{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {purchases.length === 0 && !loadingData && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                      <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      Aucun achat enregistré.
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
