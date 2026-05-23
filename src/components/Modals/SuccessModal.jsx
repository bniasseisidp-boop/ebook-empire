import { motion, AnimatePresence } from 'framer-motion'

export default function SuccessModal({ type, email, bookTitle, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-box"
          initial={{ scale: 0.7, y: 40, rotate: -3 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          style={{ textAlign: 'center' }}
        >
          <button className="modal-close" onClick={onClose}>✕</button>

          <div style={{
            width: 80, height: 80,
            background: type === 'download'
              ? 'rgba(0,255,127,0.15)'
              : 'linear-gradient(135deg,rgba(0,68,204,0.3),rgba(0,229,255,0.2))',
            border: `1px solid ${type === 'download' ? 'rgba(0,255,127,0.4)' : 'rgba(0,229,255,0.4)'}`,
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            boxShadow: type === 'download' ? '0 0 30px rgba(0,255,127,0.3)' : '0 0 30px rgba(0,229,255,0.3)',
          }}>
            {type === 'download' ? '✅' : '🎉'}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
            {type === 'download'
              ? <>Email <span className="gradient-text">envoyé !</span></>
              : <>Achat <span className="gradient-text">confirmé !</span></>
            }
          </h2>

          {bookTitle && (
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 8 }}>
              <strong style={{ color: 'var(--text-1)' }}>«&nbsp;{bookTitle}&nbsp;»</strong>
            </p>
          )}

          <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.7 }}>
            {type === 'download'
              ? <>Un lien de téléchargement a été envoyé à<br/><strong style={{ color: '#00ff7f' }}>{email}</strong></>
              : <>Votre livre + licence ont été envoyés à<br/><strong style={{ color: 'var(--cyan)' }}>{email}</strong><br/>
                <span style={{ fontSize: 11 }}>Vérifiez votre boîte mail (et spams)</span></>
            }
          </p>

          <button
            className="btn btn-cyan"
            style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
            onClick={onClose}
          >
            Parfait, merci ! 🚀
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
