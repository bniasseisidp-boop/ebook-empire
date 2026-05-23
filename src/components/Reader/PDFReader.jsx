import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'

// Use exact installed version from unpkg to avoid version mismatch
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`

const PREVIEW_SECONDS = 300 // 5 minutes

export default function PDFReader({ book, onClose, onBuy, onDownload }) {
  const containerRef = useRef(null)
  const pdfRef       = useRef(null)
  const timerRef     = useRef(null)

  const [timeLeft,  setTimeLeft]  = useState(PREVIEW_SECONDS)
  const [expired,   setExpired]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [pages,     setPages]     = useState(0)
  const [curPage,   setCurPage]   = useState(1)
  const [blurred,   setBlurred]   = useState(false)
  const [zoom,      setZoom]      = useState(1.2)
  const [email,     setEmail]     = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // ── Screenshot / print protection ──────────────────
  useEffect(() => {
    const blockPrint = e => {
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        showProtect()
      }
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('').catch(() => {})
        showProtect()
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        showProtect()
      }
      // Escape closes reader
      if (e.key === 'Escape') onClose()
    }

    const onVisChange = () => {
      if (document.hidden && !expired) setBlurred(true)
      else if (!document.hidden && !expired) setBlurred(false)
    }

    document.addEventListener('keydown', blockPrint)
    document.addEventListener('visibilitychange', onVisChange)
    document.addEventListener('contextmenu', e => e.preventDefault())

    return () => {
      document.removeEventListener('keydown', blockPrint)
      document.removeEventListener('visibilitychange', onVisChange)
      document.removeEventListener('contextmenu', e => e.preventDefault())
    }
  }, [expired, onClose])

  const showProtect = () => {
    setBlurred(true)
    setTimeout(() => setBlurred(false), 2000)
  }

  // ── Timer ───────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setExpired(true)
          setBlurred(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // ── Load PDF ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `/api/books/${book.id}/preview`
        const pdf = await pdfjsLib.getDocument({ url }).promise
        pdfRef.current = pdf
        setPages(pdf.numPages)
        await renderPage(1, pdf)
      } catch (err) {
        setError('Impossible de charger le PDF. ' + (err.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { pdfRef.current?.destroy() }
  }, [book.id])

  // ── Render page ──────────────────────────────────────
  const renderPage = useCallback(async (num, pdfDoc) => {
    const doc = pdfDoc || pdfRef.current
    if (!doc) return
    const page  = await doc.getPage(num)
    const vp    = page.getViewport({ scale: zoom })
    const canvas = document.getElementById('pdf-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = vp.width
    canvas.height = vp.height

    await page.render({ canvasContext: ctx, viewport: vp }).promise

    // Watermark
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.font = 'bold 42px Space Grotesk, sans-serif'
    ctx.fillStyle = '#00e5ff'
    ctx.textAlign  = 'center'
    ctx.translate(vp.width / 2, vp.height / 2)
    ctx.rotate(-30 * Math.PI / 180)
    ctx.fillText('EMPIRE EBOOK — APERÇU', 0, 0)
    ctx.fillText('EMPIRE EBOOK — APERÇU', 0, 80)
    ctx.fillText('EMPIRE EBOOK — APERÇU', 0, -80)
    ctx.restore()
  }, [zoom])

  useEffect(() => {
    if (!loading) renderPage(curPage)
  }, [curPage, zoom, loading])

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pct  = ((PREVIEW_SECONDS - timeLeft) / PREVIEW_SECONDS) * 100
  const urgent = timeLeft <= 60

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: '#060a12',
          display: 'flex', flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {/* ── Top bar ── */}
        <div style={{
          height: 60,
          background: 'rgba(10,14,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 16,
          flexShrink: 0,
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 16,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>

          {/* Title */}
          <div style={{ flexGrow: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📖 {book.title}
          </div>

          {/* Zoom */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[0.8,1.0,1.2,1.5].map(z => (
              <button key={z}
                onClick={() => setZoom(z)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11, fontWeight: 700,
                  cursor: 'pointer',
                  border: `1px solid ${zoom === z ? 'var(--cyan)' : 'var(--border)'}`,
                  background: zoom === z ? 'var(--cyan-dim)' : 'transparent',
                  color: zoom === z ? 'var(--cyan)' : 'var(--text-3)',
                }}
              >{Math.round(z*100)}%</button>
            ))}
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 16px',
            borderRadius: 30,
            background: urgent ? 'rgba(255,50,50,0.15)' : 'rgba(0,229,255,0.08)',
            border: `1px solid ${urgent ? 'rgba(255,50,50,0.4)' : 'rgba(0,229,255,0.25)'}`,
            boxShadow: urgent ? '0 0 20px rgba(255,50,50,0.3)' : '0 0 15px rgba(0,229,255,0.15)',
          }}>
            <span style={{ fontSize: 14 }}>{urgent ? '⚠️' : '⏱️'}</span>
            <span style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: 18, fontWeight: 800,
              color: urgent ? '#ff6b6b' : 'var(--cyan)',
              letterSpacing: 2,
              animation: urgent ? 'pulse 1s infinite' : 'none',
            }}>
              {fmt(timeLeft)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>restant</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: urgent
              ? 'linear-gradient(90deg,#ff6b6b,#ff0000)'
              : 'linear-gradient(90deg,var(--cyan),var(--purple))',
            transition: 'width 1s linear',
          }} />
        </div>

        {/* ── PDF area ── */}
        <div
          ref={containerRef}
          style={{
            flexGrow: 1, overflow: 'auto',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px',
            position: 'relative',
          }}
        >
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16,
            }}>
              <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Chargement du livre…</p>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📵</div>
              <p style={{ color: '#ff6b6b' }}>{error}</p>
            </div>
          )}

          {/* Blur overlay when expired or tab hidden */}
          {blurred && !expired && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              backdropFilter: 'blur(20px)',
              background: 'rgba(6,10,18,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
                <p>Revenez sur cet onglet</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div style={{
              boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
              borderRadius: 6,
              overflow: 'hidden',
              filter: blurred ? 'blur(30px)' : 'none',
              transition: 'filter 0.5s ease',
            }}>
              <canvas id="pdf-canvas" style={{ display: 'block', maxWidth: '100%' }} />
            </div>
          )}
        </div>

        {/* ── Page controls ── */}
        {!expired && (
          <div style={{
            height: 56, background: 'rgba(10,14,26,0.95)',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, flexShrink: 0,
          }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 16px', fontSize: 12 }}
              disabled={curPage <= 1}
              onClick={() => setCurPage(p => Math.max(1, p - 1))}
            >← Précédent</button>
            <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
              Page <strong style={{ color: 'var(--text-1)' }}>{curPage}</strong> / {pages}
            </span>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 16px', fontSize: 12 }}
              disabled={curPage >= pages}
              onClick={() => setCurPage(p => Math.min(pages, p + 1))}
            >Suivant →</button>
          </div>
        )}

        {/* ── Expiry CTA ── */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 50,
                background: 'rgba(6,10,18,0.92)',
                backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border)',
                  borderRadius: 24,
                  padding: 40,
                  maxWidth: 480, width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 0 60px rgba(0,229,255,0.2)',
                }}
              >
                {/* Animated book closing */}
                <div style={{ fontSize: 64, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>📚</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                  Votre aperçu est <span className="gradient-text">terminé !</span>
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                  Vous avez lu <strong style={{ color: 'var(--cyan)' }}>5 minutes gratuites</strong> de «&nbsp;{book.title}&nbsp;».
                  <br/>
                  {book.is_free
                    ? 'Téléchargez ce livre gratuitement !'
                    : `Obtenez l'accès complet pour seulement ${Number(book.price).toFixed(2)} €`
                  }
                </p>

                {!book.is_free && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 32, fontWeight: 900,
                      fontFamily: "'Space Grotesk',sans-serif",
                      marginBottom: 4,
                    }}>
                      <span className="gradient-text-gold">{Number(book.price).toFixed(2)} €</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Accès illimité + Licence + Email de livraison
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {book.is_free ? (
                    <>
                      <input
                        className="input"
                        type="email"
                        placeholder="Votre email pour télécharger"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ textAlign: 'center' }}
                      />
                      <button
                        className="btn btn-cyan"
                        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                        onClick={() => { if (email) { onDownload(book, email); setEmailSent(true) } }}
                        disabled={emailSent}
                      >
                        {emailSent ? '✅ Lien envoyé !' : '⬇️ Télécharger gratuitement'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
                      onClick={() => onBuy(book)}
                    >
                      💳 Acheter maintenant — {Number(book.price).toFixed(2)} €
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-3)', fontSize: 12,
                      cursor: 'pointer', padding: '8px',
                      textDecoration: 'underline',
                    }}
                  >
                    Retour à la boutique
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        `}</style>
      </motion.div>
    </AnimatePresence>
  )
}
