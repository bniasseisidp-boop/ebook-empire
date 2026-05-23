import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { requestDownload } from '../../services/api'

export default function EmailCaptureModal({ book, onClose, onSuccess }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
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
          <button className="modal-close" onClick={onClose}>✕</button>

          <div style={{ fontSize: 56, marginBottom: 12 }}>🎁</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Téléchargement <span className="gradient-text">Gratuit</span>
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Entrez votre email pour recevoir le lien de téléchargement de<br />
            <strong style={{ color: 'var(--text-1)' }}>«&nbsp;{book.title}&nbsp;»</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                className="input"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ textAlign: 'center', fontSize: 15 }}
                autoFocus
                required
              />
            </div>
            {error && (
              <p style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              className="btn btn-cyan"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" />&nbsp;Envoi…</> : '📩 Recevoir mon ebook gratuit'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-3)' }}>
            🔒 Votre email ne sera jamais partagé
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
