import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Mail, Lock, X, CheckCircle, AlertCircle } from 'lucide-react'
import { requestDownload } from '../../services/api'

export default function EmailCaptureModal({ book, onClose, onSuccess }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError(null)
    try {
      await requestDownload(book.id, email.trim())
      onSuccess(email.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-box"
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          style={{ textAlign: 'center' }}
        >
          <motion.button
            whileHover={{ scale: 1.1, background: 'rgba(255,100,100,0.15)' }}
            whileTap={{ scale: 0.9 }}
            className="modal-close"
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}
          >
            <X size={16} />
          </motion.button>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,229,255,0.05))',
              border: '1px solid rgba(0,229,255,0.3)',
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(0,229,255,0.2)',
            }}
          >
            <Download size={34} color="#00e5ff" strokeWidth={1.5} />
          </motion.div>

          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
            Téléchargement <span className="gradient-text">Gratuit</span>
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
            Entrez votre email pour recevoir le lien de téléchargement de<br />
            <strong style={{ color: 'var(--text-1)' }}>«&nbsp;{book.title}&nbsp;»</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', lineHeight: 0, pointerEvents: 'none' }}>
                <Mail size={15} color="var(--text-3)" />
              </span>
              <input
                className="input"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 40, fontSize: 15 }}
                autoFocus required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <AlertCircle size={12} /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-cyan"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, gap: 8 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" /> Envoi en cours…</>
                : <><Mail size={15} /> Recevoir mon ebook gratuit</>
              }
            </motion.button>
          </form>

          <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Lock size={11} /> Votre email ne sera jamais partagé
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
