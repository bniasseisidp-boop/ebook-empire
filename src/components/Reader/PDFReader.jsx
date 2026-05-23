import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Lock, BookOpen, Download, ShoppingCart, Clock, AlertTriangle, CheckCircle,
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`

const PREVIEW_SECONDS = 300  // 5 minutes
const MAX_PREVIEW_PAGES = 5  // first 5 pages only

export default function PDFReader({ book, onClose, onBuy, onDownload }) {
  const pdfRef      = useRef(null)
  const canvasRef   = useRef(null)
  const renderTask  = useRef(null)

  const [timeLeft,   setTimeLeft]   = useState(PREVIEW_SECONDS)
  const [expired,    setExpired]    = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [rendering,  setRendering]  = useState(false)
  const [error,      setError]      = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [curPage,    setCurPage]    = useState(1)
  const [blurred,    setBlurred]    = useState(false)
  const [zoom,       setZoom]       = useState(1.2)
  const [email,      setEmail]      = useState('')
  const [emailSent,  setEmailSent]  = useState(false)

  const allowedPages = Math.min(totalPages, MAX_PREVIEW_PAGES)
  const urgent       = timeLeft <= 60
  const pct          = ((PREVIEW_SECONDS - timeLeft) / PREVIEW_SECONDS) * 100
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  /* ── Screenshot / print protection ── */
  useEffect(() => {
    const blockKeys = e => {
      if ((e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
          (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault(); showBlur()
      }
      if (e.key === 'PrintScreen') { navigator.clipboard.writeText('').catch(() => {}); showBlur() }
      if (e.key === 'Escape') onClose()
      // Keyboard page navigation
      if (!expired) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage()
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevPage()
      }
    }
    const onVis = () => {
      if (document.hidden && !expired) setBlurred(true)
      else if (!document.hidden) setBlurred(false)
    }
    const noCtx = e => e.preventDefault()

    document.addEventListener('keydown', blockKeys)
    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('contextmenu', noCtx)
    return () => {
      document.removeEventListener('keydown', blockKeys)
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('contextmenu', noCtx)
    }
  }, [expired, curPage, totalPages, onClose])

  const showBlur = () => { setBlurred(true); setTimeout(() => setBlurred(false), 2000) }

  /* ── Timer ── */
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); setExpired(true); setBlurred(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  /* ── Load PDF ── */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const pdf = await pdfjsLib.getDocument({ url: `/api/books/${book.id}/preview` }).promise
        if (cancelled) return
        pdfRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurPage(1)
      } catch (err) {
        if (!cancelled) setError('Impossible de charger le PDF. ' + (err.message || ''))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; pdfRef.current?.destroy() }
  }, [book.id])

  /* ── Render page ── */
  const renderPage = useCallback(async (num) => {
    const pdf = pdfRef.current
    if (!pdf || !canvasRef.current) return
    // cancel previous render
    if (renderTask.current) { renderTask.current.cancel(); renderTask.current = null }
    setRendering(true)
    try {
      const page = await pdf.getPage(num)
      const vp   = page.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      const ctx    = canvas.getContext('2d')
      canvas.width  = vp.width
      canvas.height = vp.height

      const task = page.render({ canvasContext: ctx, viewport: vp })
      renderTask.current = task
      await task.promise

      // Watermark
      ctx.save()
      ctx.globalAlpha = 0.07
      ctx.font = 'bold 40px Space Grotesk, Arial, sans-serif'
      ctx.fillStyle = '#00e5ff'
      ctx.textAlign  = 'center'
      ctx.translate(vp.width / 2, vp.height / 2)
      ctx.rotate(-25 * Math.PI / 180)
      for (let y = -vp.height; y < vp.height; y += 90) {
        ctx.fillText('EMPIRE EBOOK — APERÇU', 0, y)
      }
      ctx.restore()
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        console.error('Render error:', e)
      }
    } finally {
      setRendering(false)
    }
  }, [zoom])

  useEffect(() => {
    if (!loading && totalPages > 0) renderPage(curPage)
  }, [curPage, zoom, loading, totalPages, renderPage])

  /* ── Page nav helpers ── */
  const prevPage = () => setCurPage(p => Math.max(1, p - 1))
  const nextPage = () => setCurPage(p => Math.min(allowedPages, p + 1))

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
          height: 60, background: 'rgba(10,14,26,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 14, flexShrink: 0,
        }}>
          {/* Close */}
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255,100,100,0.15)' }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              lineHeight: 0,
            }}
          >
            <X size={15} />
          </motion.button>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1, overflow: 'hidden' }}>
            <BookOpen size={15} color="var(--cyan)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {book.title}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20,
              background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)',
              border: '1px solid rgba(0,229,255,0.2)', flexShrink: 0,
              fontWeight: 700, letterSpacing: 0.5,
            }}>
              APERÇU
            </span>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)))}
              style={{ padding: '5px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', lineHeight: 0 }}>
              <ZoomOut size={14} />
            </motion.button>
            <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 36, textAlign: 'center', fontWeight: 700 }}>
              {Math.round(zoom * 100)}%
            </span>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setZoom(z => Math.min(2.0, +(z + 0.2).toFixed(1)))}
              style={{ padding: '5px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', lineHeight: 0 }}>
              <ZoomIn size={14} />
            </motion.button>
          </div>

          {/* Page indicator */}
          {totalPages > 0 && (
            <div style={{
              fontSize: 12, color: 'var(--text-2)',
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              fontWeight: 600,
            }}>
              Page <strong style={{ color: 'var(--text-1)' }}>{curPage}</strong> / <strong style={{ color: 'var(--cyan)' }}>{allowedPages}</strong>
              {totalPages > MAX_PREVIEW_PAGES && <span style={{ color: 'var(--text-3)', fontSize: 10 }}> (aperçu)</span>}
            </div>
          )}

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 30,
            background: urgent ? 'rgba(255,50,50,0.18)' : 'rgba(0,229,255,0.08)',
            border: `1px solid ${urgent ? 'rgba(255,50,50,0.45)' : 'rgba(0,229,255,0.25)'}`,
            boxShadow: urgent ? '0 0 20px rgba(255,50,50,0.2)' : '0 0 15px rgba(0,229,255,0.1)',
          }}>
            {urgent ? <AlertTriangle size={14} color="#ff6b6b" /> : <Clock size={14} color="var(--cyan)" />}
            <span style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: 17, fontWeight: 800,
              color: urgent ? '#ff6b6b' : 'var(--cyan)',
              letterSpacing: 2,
            }}>
              {fmt(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <motion.div
            style={{
              height: '100%',
              background: urgent ? 'linear-gradient(90deg,#ff6b6b,#ff0000)' : 'linear-gradient(90deg,var(--cyan),var(--purple))',
              originX: 0,
            }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* ── PDF area with side nav ── */}
        <div style={{ flexGrow: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* Left nav arrow */}
          <AnimatePresence>
            {!expired && curPage > 1 && (
              <motion.button
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.08, background: 'rgba(0,229,255,0.15)' }}
                whileTap={{ scale: 0.93 }}
                onClick={prevPage}
                style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(10,14,26,0.88)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: 'var(--cyan)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                  lineHeight: 0,
                }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Right nav arrow */}
          <AnimatePresence>
            {!expired && curPage < allowedPages && (
              <motion.button
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.08, background: 'rgba(0,229,255,0.15)' }}
                whileTap={{ scale: 0.93 }}
                onClick={nextPage}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(10,14,26,0.88)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: 'var(--cyan)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                  lineHeight: 0,
                }}
              >
                <ChevronRight size={24} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Scrollable canvas area */}
          <div style={{
            flexGrow: 1, overflow: 'auto',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '28px 80px',
            position: 'relative',
          }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
                <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Chargement du livre…</p>
              </div>
            )}

            {error && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Lock size={48} color="#ff6b6b" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#ff6b6b', marginBottom: 8 }}>{error}</p>
                <p style={{ color: 'var(--text-3)', fontSize: 12 }}>Vérifiez que le serveur Laravel est démarré sur le port 8000.</p>
              </div>
            )}

            {/* Blur overlay (tab switch) */}
            {blurred && !expired && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  backdropFilter: 'blur(20px)', background: 'rgba(6,10,18,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                }}
              >
                <Lock size={40} color="var(--cyan)" />
                <p style={{ color: 'var(--text-2)', fontWeight: 600 }}>Revenez sur cet onglet</p>
              </motion.div>
            )}

            {!loading && !error && (
              <motion.div
                animate={{ filter: blurred ? 'blur(30px)' : 'blur(0px)', opacity: rendering ? 0.7 : 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                  borderRadius: 6, overflow: 'hidden',
                  maxWidth: '100%',
                }}
              >
                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Bottom page control bar ── */}
        {!expired && totalPages > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              height: 58, background: 'rgba(10,14,26,0.97)',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 20, flexShrink: 0,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn btn-ghost"
              style={{ padding: '6px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={curPage <= 1}
              onClick={prevPage}
            >
              <ChevronLeft size={15} /> Précédent
            </motion.button>

            {/* Page dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Array.from({ length: allowedPages }, (_, i) => i + 1).map(p => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setCurPage(p)}
                  style={{
                    width: p === curPage ? 24 : 8,
                    height: 8, borderRadius: 99,
                    background: p === curPage ? 'var(--cyan)' : 'rgba(255,255,255,0.15)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: p === curPage ? '0 0 10px rgba(0,229,255,0.5)' : 'none',
                  }}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn btn-ghost"
              style={{ padding: '6px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={curPage >= allowedPages}
              onClick={nextPage}
            >
              Suivant <ChevronRight size={15} />
            </motion.button>
          </motion.div>
        )}

        {/* ── Expiry modal ── */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 50,
                background: 'rgba(6,10,18,0.94)',
                backdropFilter: 'blur(18px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0.82, opacity: 0, y: 36 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: 26, padding: '44px 40px',
                  maxWidth: 500, width: '100%', textAlign: 'center',
                  boxShadow: '0 0 80px rgba(0,229,255,0.18)',
                }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  style={{ marginBottom: 16 }}
                >
                  <BookOpen size={60} color="var(--cyan)" style={{ margin: '0 auto' }} />
                </motion.div>

                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>
                  Aperçu <span className="gradient-text">terminé !</span>
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
                  Vous avez lu <strong style={{ color: 'var(--cyan)' }}>5 minutes gratuites</strong> de<br/>
                  «&nbsp;{book.title}&nbsp;»
                  <br />
                  {book.is_free
                    ? 'Ce livre est 100% gratuit — entrez votre email !'
                    : `Obtenez l'accès complet pour ${Number(book.price).toFixed(2)} €`}
                </p>

                {!book.is_free && (
                  <div style={{ marginBottom: 24, padding: '14px', background: 'rgba(0,229,255,0.06)', borderRadius: 14, border: '1px solid rgba(0,229,255,0.15)' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", color: '#ffd700' }}>
                      {Number(book.price).toFixed(2)} €
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                      Accès illimité · Licence · Livraison email immédiate
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {book.is_free ? (
                    <>
                      <input
                        className="input" type="email"
                        placeholder="votre@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        style={{ textAlign: 'center' }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn btn-cyan"
                        style={{ width: '100%', justifyContent: 'center', padding: '14px', gap: 8 }}
                        onClick={() => { if (email) { onDownload(book, email); setEmailSent(true) } }}
                        disabled={emailSent}
                      >
                        {emailSent ? <><CheckCircle size={16} /> Lien envoyé !</> : <><Download size={16} /> Télécharger gratuitement</>}
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 15, gap: 8 }}
                      onClick={() => onBuy(book)}
                    >
                      <ShoppingCart size={17} /> Acheter — {Number(book.price).toFixed(2)} €
                    </motion.button>
                  )}

                  <button
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
                  >
                    Retour à la boutique
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
