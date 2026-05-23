import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import {
  adminLogin, adminLogout, uploadBook, getAdminBooks,
  deleteBook, getDownloads, getPurchases, getStats, getChartData
} from '../services/api'
import ParticleBackground from '../components/Background/ParticleBackground'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const TABS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'books',     icon: '📚', label: 'Ebooks' },
  { id: 'upload',    icon: '⬆️', label: 'Ajouter' },
  { id: 'downloads', icon: '⬇️', label: 'Téléchargements' },
  { id: 'purchases', icon: '🛒', label: 'Achats' },
]

const chartDefaults = {
  plugins: { legend: { labels: { color: '#a8b2c8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6a7490' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#6a7490' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  }
}

/* ── Stat Card ────────────────────────────── */
function StatCard({ icon, value, label, color, sub }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: `1px solid rgba(${color},0.25)`,
        borderRadius: 18,
        padding: '24px 28px',
        boxShadow: `0 0 30px rgba(${color},0.1)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", color: `rgb(${color})` }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 32 }}>{icon}</div>
      </div>
    </motion.div>
  )
}

/* ── Main Admin Page ─────────────────────── */
export default function AdminPage() {
  const [token,     setToken]     = useState(() => localStorage.getItem('empire_admin_token'))
  const [tab,       setTab]       = useState('dashboard')
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [loginErr,  setLoginErr]  = useState(null)
  const [logging,   setLogging]   = useState(false)
  const [sideOpen,  setSideOpen]  = useState(true)

  // Data
  const [stats,     setStats]     = useState(null)
  const [chartData, setChartData] = useState(null)
  const [books,     setBooks]     = useState([])
  const [downloads, setDownloads] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Upload form
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
    setLogging(true)
    setLoginErr(null)
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
          const { data } = await getAdminBooks()
          setBooks(data)
        } else if (tab === 'downloads') {
          const { data } = await getDownloads()
          setDownloads(data.data || data)
        } else if (tab === 'purchases') {
          const { data } = await getPurchases()
          setPurchases(data.data || data)
        }
      } catch (err) {
        if (err.response?.status === 401) { setToken(null); localStorage.removeItem('empire_admin_token') }
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [tab, token])

  /* ── Upload book ── */
  const handleUpload = async e => {
    e.preventDefault()
    if (!upPdf) { setUpMsg({ type: 'error', text: 'PDF requis' }); return }
    setUploading(true); setUpMsg(null)
    const fd = new FormData()
    fd.append('title', upTitle)
    fd.append('description', upDesc)
    fd.append('price', upFree ? '0' : upPrice)
    fd.append('is_free', upFree ? '1' : '0')
    fd.append('category', upCat)
    fd.append('pdf', upPdf)
    if (upCover) fd.append('cover', upCover)
    try {
      await uploadBook(fd)
      setUpMsg({ type: 'success', text: '✅ Livre ajouté avec succès !' })
      setUpTitle(''); setUpDesc(''); setUpPrice('0'); setUpFree(false); setUpPdf(null); setUpCover(null)
    } catch (err) {
      setUpMsg({ type: 'error', text: err.response?.data?.message || 'Erreur upload' })
    } finally {
      setUploading(false)
    }
  }

  /* ── Delete book ── */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    try {
      await deleteBook(id)
      setBooks(prev => prev.filter(b => b.id !== id))
    } catch {}
  }

  /* ══════════════ LOGIN PAGE ═════════════════ */
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <ParticleBackground />
        <motion.div
          initial={{ opacity:0, scale:0.9, y:30 }}
          animate={{ opacity:1, scale:1, y:0 }}
          transition={{ type:'spring', stiffness:200, damping:20 }}
          style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(10,14,26,0.9)',
            backdropFilter: 'blur(30px)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '48px 40px',
            width: '100%', maxWidth: 420,
            boxShadow: '0 0 60px rgba(0,229,255,0.15)',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg,#0044cc,#00e5ff)',
              borderRadius: 18, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, boxShadow: '0 0 30px rgba(0,229,255,0.4)',
            }}>📚</div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>
              <span className="gradient-text">Empire Ebook</span>
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>Panneau d'administration</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Identifiant</label>
              <input className="input" type="text" placeholder="admin"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {loginErr && (
              <div style={{ background:'rgba(255,50,50,0.1)', border:'1px solid rgba(255,50,50,0.3)', borderRadius:10, padding:'10px 14px', color:'#ff6b6b', fontSize:13, marginBottom:16 }}>
                ⚠️ {loginErr}
              </div>
            )}
            <button type="submit" className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'14px', marginTop:8 }}
              disabled={logging}>
              {logging ? <><span className="spinner"/>&nbsp;Connexion…</> : '🔐 Se connecter'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-3)' }}>
            🔒 Accès réservé aux administrateurs autorisés
          </p>
        </motion.div>
      </div>
    )
  }

  /* ══════════════ DASHBOARD ═════════════════ */
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-void)' }}>
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sideOpen ? 240 : 70 }}
        style={{
          height: '100vh',
          position: 'sticky', top: 0,
          background: 'rgba(10,14,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:38, height:38, background:'linear-gradient(135deg,#0044cc,#00e5ff)',
            borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, flexShrink:0, boxShadow:'0 0 15px rgba(0,229,255,0.3)',
          }}>📚</div>
          {sideOpen && (
            <div>
              <div style={{ fontSize:13, fontWeight:800 }}><span className="gradient-text">EMPIRE EBOOK</span></div>
              <div style={{ fontSize:10, color:'var(--text-3)' }}>Admin Panel</div>
            </div>
          )}
          <button onClick={() => setSideOpen(o=>!o)}
            style={{ marginLeft:'auto', background:'transparent', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:18, flexShrink:0 }}>
            {sideOpen ? '◁' : '▷'}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flexGrow:1, padding:'12px 8px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'12px 12px', borderRadius:12, marginBottom:4,
                background: tab===t.id ? 'rgba(0,229,255,0.1)' : 'transparent',
                border: `1px solid ${tab===t.id ? 'rgba(0,229,255,0.25)' : 'transparent'}`,
                color: tab===t.id ? 'var(--cyan)' : 'var(--text-3)',
                cursor:'pointer', fontSize:15, fontWeight: tab===t.id ? 600 : 400,
                transition:'all 0.2s', whiteSpace:'nowrap', overflow:'hidden',
              }}
            >
              <span style={{ flexShrink:0 }}>{t.icon}</span>
              {sideOpen && <span style={{ fontSize:13 }}>{t.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          <button onClick={() => { adminLogout(); setToken(null) }}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'10px 12px', borderRadius:12,
              background:'rgba(255,50,50,0.08)', border:'1px solid rgba(255,50,50,0.2)',
              color:'#ff6b6b', cursor:'pointer', fontSize:13,
            }}
          >
            <span>🚪</span>{sideOpen && 'Déconnexion'}
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main style={{ flexGrow:1, padding:'32px', overflow:'auto', maxWidth:'calc(100vw - 70px)' }}>
        {/* ─ Dashboard ─ */}
        {tab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>
              Tableau de bord <span className="gradient-text">Analytics</span>
            </h2>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:32 }}>Vue d'ensemble de l'activité Empire Ebook</p>

            {loadingData ? (
              <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ width:40,height:40,borderWidth:3,margin:'auto' }}/></div>
            ) : stats ? (
              <>
                {/* Stats grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20, marginBottom:36 }}>
                  <StatCard icon="📚" value={stats.total_books}     label="Total Ebooks"       color="0,229,255"  sub={`${stats.free_books||0} gratuits`} />
                  <StatCard icon="⬇️" value={stats.total_downloads} label="Téléchargements"    color="0,255,127"  sub="tous les temps" />
                  <StatCard icon="🛒" value={stats.total_purchases} label="Achats"              color="255,200,0"  sub={`${stats.pending_purchases||0} en attente`} />
                  <StatCard icon="💰" value={`${Number(stats.total_revenue||0).toFixed(2)} €`} label="Revenu total" color="124,77,255" sub="paiements confirmés" />
                </div>

                {/* Charts row */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, marginBottom:36 }}>
                  {/* Activity chart */}
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, padding:24 }}>
                    <h4 style={{ marginBottom:20, fontSize:15, fontWeight:700 }}>📈 Activité 30 derniers jours</h4>
                    {chartData && (
                      <Line
                        data={{
                          labels: chartData.daily_downloads?.map(d => d.date.slice(5)) || [],
                          datasets: [
                            {
                              label: 'Téléchargements',
                              data: chartData.daily_downloads?.map(d => d.count) || [],
                              borderColor: '#00e5ff',
                              backgroundColor: 'rgba(0,229,255,0.08)',
                              fill: true, tension: 0.4,
                            },
                            {
                              label: 'Achats',
                              data: chartData.daily_purchases?.map(d => d.count) || [],
                              borderColor: '#7c4dff',
                              backgroundColor: 'rgba(124,77,255,0.08)',
                              fill: true, tension: 0.4,
                            }
                          ]
                        }}
                        options={{ ...chartDefaults, responsive:true, plugins:{ ...chartDefaults.plugins, legend:{ ...chartDefaults.plugins.legend, position:'top' } } }}
                      />
                    )}
                  </div>

                  {/* Top books doughnut */}
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, padding:24 }}>
                    <h4 style={{ marginBottom:20, fontSize:15, fontWeight:700 }}>🏆 Top Livres</h4>
                    {stats.top_books?.length > 0 && (
                      <Doughnut
                        data={{
                          labels: stats.top_books.map(b => b.title.slice(0,20)+'…'),
                          datasets: [{
                            data: stats.top_books.map(b => b.purchase_count),
                            backgroundColor: ['#00e5ff','#7c4dff','#ffd700','#00ff7f','#ff6496'],
                            borderWidth: 0,
                          }]
                        }}
                        options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#a8b2c8', font:{size:11} }, position:'bottom' } } }}
                      />
                    )}
                  </div>
                </div>

                {/* Recent activity */}
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, padding:24 }}>
                  <h4 style={{ marginBottom:16, fontSize:15, fontWeight:700 }}>⚡ Activité récente</h4>
                  <table className="data-table">
                    <thead><tr>
                      <th>Type</th><th>Email</th><th>Livre</th><th>Date</th>
                    </tr></thead>
                    <tbody>
                      {(stats.recent_activity||[]).slice(0,10).map((a,i) => (
                        <tr key={i}>
                          <td>
                            <span style={{
                              padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                              background: a.type==='download' ? 'rgba(0,255,127,0.1)' : 'rgba(255,200,0,0.1)',
                              color: a.type==='download' ? '#00ff7f' : '#ffd700',
                              border: `1px solid ${a.type==='download' ? 'rgba(0,255,127,0.3)' : 'rgba(255,200,0,0.3)'}`,
                            }}>
                              {a.type==='download' ? '⬇️ Téléch.' : '🛒 Achat'}
                            </span>
                          </td>
                          <td>{a.email}</td>
                          <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</td>
                          <td style={{ fontSize:12 }}>{new Date(a.created_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center', color:'var(--text-3)', padding:40 }}>
                <p>Aucune donnée disponible. Vérifiez la connexion au backend Laravel.</p>
                <p style={{ fontSize:12, marginTop:8 }}>API: <code style={{ color:'var(--cyan)' }}>http://localhost:8000/api/admin/stats</code></p>
              </div>
            )}
          </div>
        )}

        {/* ─ Books list ─ */}
        {tab === 'books' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
              <div>
                <h2 style={{ fontSize:24, fontWeight:800 }}>Gestion des <span className="gradient-text">Ebooks</span></h2>
                <p style={{ color:'var(--text-3)', fontSize:13 }}>{books.length} livres dans la bibliothèque</p>
              </div>
              <button className="btn btn-primary" onClick={() => setTab('upload')}>+ Ajouter un livre</button>
            </div>
            {loadingData ? (
              <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ width:40,height:40,borderWidth:3,margin:'auto' }}/></div>
            ) : (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
                <table className="data-table">
                  <thead><tr>
                    <th>Titre</th><th>Catégorie</th><th>Prix</th><th>⬇️ DL</th><th>🛒 Achats</th><th>Type</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {books.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight:600, color:'var(--text-1)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</td>
                        <td><span className="badge badge-cyan" style={{ fontSize:10 }}>{b.category}</span></td>
                        <td>{b.is_free ? <span style={{ color:'#00ff7f' }}>GRATUIT</span> : `${b.price} €`}</td>
                        <td style={{ color:'#00ff7f' }}>{b.download_count}</td>
                        <td style={{ color:'#ffd700' }}>{b.purchase_count}</td>
                        <td><span className={`badge ${b.is_free ? 'badge-free' : 'badge-paid'}`}>{b.is_free ? 'Gratuit' : 'Payant'}</span></td>
                        <td>
                          <button className="btn btn-danger" style={{ padding:'5px 12px', fontSize:11 }}
                            onClick={() => handleDelete(b.id, b.title)}>
                            🗑 Suppr.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {books.length === 0 && (
                  <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Aucun livre. <button onClick={() => setTab('upload')} style={{ color:'var(--cyan)', background:'none', border:'none', cursor:'pointer', fontSize:13 }}>Ajoutez le premier →</button></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─ Upload ─ */}
        {tab === 'upload' && (
          <div style={{ maxWidth:700 }}>
            <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>
              Ajouter un <span className="gradient-text">Ebook</span>
            </h2>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:32 }}>Uploadez votre PDF avec les informations du livre</p>

            <form onSubmit={handleUpload}>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:20, padding:32 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Titre du livre *</label>
                    <input className="input" value={upTitle} onChange={e=>setUpTitle(e.target.value)} placeholder="Ex: Marketing Digital Masterclass" required />
                  </div>
                  <div className="form-group" style={{ gridColumn:'1/-1' }}>
                    <label>Description</label>
                    <textarea className="input" value={upDesc} onChange={e=>setUpDesc(e.target.value)} placeholder="Description détaillée du livre…" rows={4} />
                  </div>
                  <div className="form-group">
                    <label>Catégorie</label>
                    <select className="input" value={upCat} onChange={e=>setUpCat(e.target.value)}
                      style={{ cursor:'pointer' }}>
                      {['Général','Marketing Digital','Entrepreneuriat','Finance','Leadership','Technologie','Développement Personnel'].map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <div style={{ display:'flex', gap:12, marginTop:4 }}>
                      {['Payant','Gratuit'].map(t => (
                        <label key={t} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'var(--text-2)', fontSize:14 }}>
                          <input type="radio" checked={t==='Gratuit'?upFree:!upFree} onChange={()=>setUpFree(t==='Gratuit')} />
                          {t==='Gratuit'?'🎁':'💳'} {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  {!upFree && (
                    <div className="form-group">
                      <label>Prix (€)</label>
                      <input className="input" type="number" step="0.01" min="0.01" value={upPrice} onChange={e=>setUpPrice(e.target.value)} placeholder="19.99" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Fichier PDF * {upPdf && <span style={{ color:'#00ff7f', fontSize:11 }}>✓ {upPdf.name}</span>}</label>
                    <label style={{
                      display:'block', padding:'20px', border:'2px dashed var(--border)',
                      borderRadius:12, cursor:'pointer', textAlign:'center',
                      color:'var(--text-3)', fontSize:13, transition:'all 0.2s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--cyan)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                    >
                      📄 Cliquez pour sélectionner (PDF max 100MB)
                      <input type="file" accept=".pdf" onChange={e=>setUpPdf(e.target.files[0])} style={{ display:'none' }} />
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Couverture (optionnel) {upCover && <span style={{ color:'#00ff7f', fontSize:11 }}>✓ {upCover.name}</span>}</label>
                    <label style={{
                      display:'block', padding:'20px', border:'2px dashed var(--border)',
                      borderRadius:12, cursor:'pointer', textAlign:'center',
                      color:'var(--text-3)', fontSize:13, transition:'all 0.2s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                    >
                      🖼️ Image (JPG/PNG)
                      <input type="file" accept="image/*" onChange={e=>setUpCover(e.target.files[0])} style={{ display:'none' }} />
                    </label>
                  </div>
                </div>

                {upMsg && (
                  <div style={{
                    margin:'20px 0', padding:'14px 18px', borderRadius:12, fontSize:14,
                    background: upMsg.type==='success' ? 'rgba(0,255,127,0.1)' : 'rgba(255,50,50,0.1)',
                    border: `1px solid ${upMsg.type==='success' ? 'rgba(0,255,127,0.3)' : 'rgba(255,50,50,0.3)'}`,
                    color: upMsg.type==='success' ? '#00ff7f' : '#ff6b6b',
                  }}>
                    {upMsg.text}
                  </div>
                )}

                <button type="submit" className="btn btn-primary"
                  style={{ width:'100%', justifyContent:'center', padding:'15px', fontSize:15, marginTop:12 }}
                  disabled={uploading}>
                  {uploading ? <><span className="spinner"/>&nbsp;Upload en cours…</> : '⬆️ Publier l\'ebook'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─ Downloads ─ */}
        {tab === 'downloads' && (
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>
              Téléchargements <span className="gradient-text">Gratuits</span>
            </h2>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:32 }}>{downloads.length} téléchargements enregistrés</p>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, overflow:'auto' }}>
              <table className="data-table">
                <thead><tr><th>Email</th><th>Livre</th><th>IP</th><th>Date</th></tr></thead>
                <tbody>
                  {downloads.map(d => (
                    <tr key={d.id}>
                      <td style={{ color:'var(--cyan)' }}>{d.email}</td>
                      <td>{d.book_title}</td>
                      <td style={{ fontSize:12, color:'var(--text-3)' }}>{d.ip_address || '—'}</td>
                      <td style={{ fontSize:12 }}>{new Date(d.created_at).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {downloads.length === 0 && !loadingData && (
                <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Aucun téléchargement enregistré.</div>
              )}
            </div>
          </div>
        )}

        {/* ─ Purchases ─ */}
        {tab === 'purchases' && (
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>
              Achats & <span className="gradient-text">Paiements</span>
            </h2>
            <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:32 }}>{purchases.length} transactions enregistrées</p>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:18, overflow:'auto' }}>
              <table className="data-table">
                <thead><tr><th>Email</th><th>Livre</th><th>Montant</th><th>Statut</th><th>Licence</th><th>Date</th></tr></thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id}>
                      <td style={{ color:'var(--cyan)' }}>{p.email}</td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.book_title}</td>
                      <td style={{ color:'#ffd700', fontWeight:700 }}>{p.amount} €</td>
                      <td>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                          background: p.status==='completed' ? 'rgba(0,255,127,0.1)' : 'rgba(255,200,0,0.1)',
                          color: p.status==='completed' ? '#00ff7f' : '#ffd700',
                          border: `1px solid ${p.status==='completed' ? 'rgba(0,255,127,0.3)' : 'rgba(255,200,0,0.3)'}`,
                        }}>
                          {p.status==='completed' ? '✅ Payé' : '⏳ Attente'}
                        </span>
                      </td>
                      <td style={{ fontSize:11, color:'var(--text-3)', fontFamily:'monospace' }}>
                        {p.license_key?.slice(0,18)}…
                      </td>
                      <td style={{ fontSize:12 }}>{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchases.length === 0 && !loadingData && (
                <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Aucun achat enregistré.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
