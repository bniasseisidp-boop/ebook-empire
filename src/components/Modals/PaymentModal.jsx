import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, PaymentElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPurchase } from '../../services/api'

// Initialize Stripe with your public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')

/* ─────────────────────────────────────────────────
   Inner checkout form (rendered inside <Elements>)
───────────────────────────────────────────────── */
function CheckoutForm({ book, email, onSuccess, onError }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [errMsg,  setErrMsg]  = useState(null)

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErrMsg(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (error) {
      setErrMsg(error.message)
      setLoading(false)
      return
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        await confirmPurchase(book.id, paymentIntent.id)
        onSuccess(email)
      } catch {
        onError('Paiement reçu mais erreur de confirmation. Contactez le support.')
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handlePay}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 20,
      }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {errMsg && (
        <div style={{
          background: 'rgba(255,50,50,0.1)',
          border: '1px solid rgba(255,50,50,0.3)',
          borderRadius: 10, padding: '12px 16px',
          color: '#ff6b6b', fontSize: 13,
          marginBottom: 16,
        }}>⚠️ {errMsg}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 15 }}
        disabled={loading || !stripe}
      >
        {loading
          ? <><span className="spinner" />&nbsp;Traitement…</>
          : <>🔐 Payer {Number(book.price).toFixed(2)} € — Sécurisé Stripe</>
        }
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 14, color: 'var(--text-3)', fontSize: 11,
      }}>
        <span>🔒</span>
        <span>Paiement 100% sécurisé · Stripe SSL · Livraison par email</span>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────
   Main Payment Modal
───────────────────────────────────────────────── */
export default function PaymentModal({ book, onClose, onSuccess }) {
  const [step, setStep] = useState('email') // 'email' | 'pay' | 'done'
  const [email, setEmail] = useState('')
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await createPaymentIntent(book.id, email.trim())
      setClientSecret(data.client_secret)
      setStep('pay')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du paiement.')
    } finally {
      setLoading(false)
    }
  }

  const stripeAppearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#00e5ff',
      colorBackground: '#0a0e1a',
      colorText: '#f0f4ff',
      colorDanger: '#ff6b6b',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '10px',
    },
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
          initial={{ scale: 0.88, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 30 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          style={{ maxWidth: 520 }}
        >
          <button className="modal-close" onClick={onClose}>✕</button>

          {/* Book info */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{
              width: 48, height: 60,
              background: 'linear-gradient(135deg, #0d1b3e, #1a2a6c)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>📖</div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{book.title}</h3>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif" }}>
                <span className="gradient-text-gold">{Number(book.price).toFixed(2)} €</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                📩 Livraison par email · 🔑 Licence incluse
              </div>
            </div>
          </div>

          {/* Step: email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label>Email de livraison</label>
                <input
                  className="input"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus required
                />
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                  Votre livre + licence seront envoyés à cette adresse
                </p>
              </div>
              {error && <p style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                disabled={loading}>
                {loading ? <><span className="spinner" />&nbsp;Chargement…</> : 'Continuer vers le paiement →'}
              </button>
            </form>
          )}

          {/* Step: pay */}
          {step === 'pay' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <CheckoutForm
                book={book}
                email={email}
                onSuccess={(em) => { setStep('done'); onSuccess(em) }}
                onError={setError}
              />
            </Elements>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                Paiement <span className="gradient-text">réussi !</span>
              </h3>
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
                Votre livre est en route vers<br />
                <strong style={{ color: 'var(--cyan)' }}>{email}</strong>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
