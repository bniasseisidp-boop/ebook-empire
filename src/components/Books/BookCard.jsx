import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Download, ShoppingCart, Eye, Star,
  TrendingUp, Clock, Shield, Zap, Award, Users,
} from 'lucide-react'

const CATEGORY_META = {
  'Marketing Digital':      { bg: 'rgba(0,229,255,0.12)',    color: '#00e5ff',  border: 'rgba(0,229,255,0.3)',    icon: TrendingUp },
  'Entrepreneuriat':        { bg: 'rgba(124,77,255,0.12)',   color: '#b27fff',  border: 'rgba(124,77,255,0.3)',   icon: Zap },
  'Finance':                { bg: 'rgba(255,200,0,0.12)',    color: '#ffd700',  border: 'rgba(255,200,0,0.3)',    icon: Award },
  'Leadership':             { bg: 'rgba(0,255,127,0.1)',     color: '#00ff7f',  border: 'rgba(0,255,127,0.25)',   icon: Users },
  'Technologie':            { bg: 'rgba(0,140,255,0.12)',    color: '#4db8ff',  border: 'rgba(0,140,255,0.3)',    icon: Shield },
  'Développement Personnel':{ bg: 'rgba(255,100,150,0.1)',   color: '#ff6496',  border: 'rgba(255,100,150,0.25)', icon: Star },
  'Général':                { bg: 'rgba(255,255,255,0.06)',  color: '#a8b2c8',  border: 'rgba(255,255,255,0.15)', icon: BookOpen },
}

/* animated progress bar */
function StatBar({ value, max, color, label, delay = 0 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
        <span>{label}</span>
        <strong style={{ color }}>{value}</strong>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  )
}

export default function BookCard({ book, onRead, onBuy, onDownload }) {
  const [hovered, setHovered] = useState(false)
  const cat = CATEGORY_META[book.category] || CATEGORY_META['Général']
  const CatIcon = cat.icon
  const coverUrl = book.cover_image ? `/storage/covers/${book.cover_image}` : null
  const maxStat = 1000

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.028)',
        border: `1px solid ${hovered ? cat.color + '55' : 'rgba(0,229,255,0.1)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
        transform: hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 28px 70px rgba(0,0,0,0.55), 0 0 36px ${cat.color}22`
          : '0 4px 20px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        willChange: 'transform',
      }}
    >
      {/* ── COVER ── */}
      <div style={{
        height: 220,
        background: coverUrl
          ? `url(${coverUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, #0d1b3e 0%, #1a2a6c 50%, #0d2247 100%)`,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* animated gradient sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '200%', opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '50%', height: '100%',
                background: `linear-gradient(90deg, transparent, ${cat.color}80, transparent)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* No-cover placeholder */}
        {!coverUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <motion.div
              animate={hovered ? { scale: 1.15, rotate: [-3, 3, -3, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.6 }}
              style={{ filter: `drop-shadow(0 0 20px ${cat.color}99)` }}
            >
              <BookOpen size={52} color={cat.color} strokeWidth={1.5} />
            </motion.div>
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '0 16px',
              color: cat.color, letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              {book.title.length > 40 ? book.title.slice(0, 37) + '…' : book.title}
            </div>
          </div>
        )}

        {/* Top badges */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
            backdropFilter: 'blur(8px)',
          }}>
            <CatIcon size={10} />
            {book.category || 'Général'}
          </span>
          <motion.span
            animate={hovered ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              padding: '4px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 800,
              background: book.is_free ? 'rgba(0,255,127,0.2)' : 'rgba(255,200,0,0.2)',
              color: book.is_free ? '#00ff7f' : '#ffd700',
              border: `1px solid ${book.is_free ? 'rgba(0,255,127,0.4)' : 'rgba(255,200,0,0.4)'}`,
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {book.is_free ? <Download size={11} /> : <ShoppingCart size={11} />}
            {book.is_free ? 'GRATUIT' : `${Number(book.price).toFixed(2)} €`}
          </motion.span>
        </div>

        {/* Bottom preview tag */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          padding: '3px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 600,
          background: 'rgba(0,0,0,0.7)',
          color: 'rgba(0,229,255,0.9)',
          border: '1px solid rgba(0,229,255,0.25)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Clock size={10} />
          5 min gratuit
        </div>

        {/* ── HOVER OVERLAY — detail panel slides up ── */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(6,10,18,0.94)',
                backdropFilter: 'blur(20px)',
                padding: '16px 16px 14px',
                borderTop: `1px solid ${cat.color}44`,
              }}
            >
              {/* rating stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 10, justifyContent: 'center' }}>
                {[1,2,3,4,5].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
                  >
                    <Star size={13} fill={i <= 4 ? '#ffd700' : 'none'} color='#ffd700' />
                  </motion.div>
                ))}
                <span style={{ fontSize: 10, color: 'rgba(255,215,0,0.7)', marginLeft: 4, alignSelf: 'center' }}>
                  4.8 / 5
                </span>
              </div>

              {/* stat bars */}
              <StatBar
                value={book.download_count || 0} max={maxStat}
                color='#00e5ff' label='Téléchargements' delay={0.05}
              />
              <StatBar
                value={book.purchase_count || 0} max={maxStat}
                color='#ffd700' label='Achats' delay={0.12}
              />

              {/* feature pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {['PDF HD', 'Livraison immédiate', 'Licence incluse'].map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.07, type: 'spring' }}
                    style={{
                      padding: '3px 9px', borderRadius: 20,
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                      background: 'rgba(0,229,255,0.1)',
                      color: cat.color,
                      border: `1px solid ${cat.color}33`,
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: '18px 20px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700,
          color: 'var(--text-1)', marginBottom: 8,
          lineHeight: 1.35, fontFamily: "'Space Grotesk',sans-serif",
          transition: 'color 0.25s',
          ...(hovered && { color: cat.color }),
        }}>
          {book.title}
        </h3>

        <p style={{
          fontSize: 12, color: 'var(--text-3)',
          lineHeight: 1.65, marginBottom: 14, flexGrow: 1,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}>
          {book.description || 'Découvrez ce livre fascinant qui transformera votre vision du monde digital.'}
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {book.is_free
              ? <><Download size={11} color='#00ff7f' /> <strong style={{ color: '#00ff7f' }}>{book.download_count || 0}</strong> télécharg.</>
              : <><ShoppingCart size={11} color='#ffd700' /> <strong style={{ color: '#ffd700' }}>{book.purchase_count || 0}</strong> ventes</>
            }
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={11} color='#00e5ff' />
            <strong style={{ color: '#00e5ff' }}>5</strong> min preview
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn btn-ghost"
            style={{ flex: 1, fontSize: 12, padding: '9px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={e => { e.stopPropagation(); onRead(book) }}
          >
            <Eye size={13} />
            Lire 5 min
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={book.is_free ? 'btn btn-cyan' : 'btn btn-primary'}
            style={{ flex: 1, fontSize: 12, padding: '9px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={e => { e.stopPropagation(); book.is_free ? onDownload(book) : onBuy(book) }}
          >
            {book.is_free ? <Download size={13} /> : <ShoppingCart size={13} />}
            {book.is_free ? 'Télécharger' : 'Acheter'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
