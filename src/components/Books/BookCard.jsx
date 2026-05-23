import { useState } from 'react'
import { motion } from 'framer-motion'

const CATEGORY_COLORS = {
  'Marketing Digital': { bg: 'rgba(0,229,255,0.12)', color: '#00e5ff', border: 'rgba(0,229,255,0.3)' },
  'Entrepreneuriat':   { bg: 'rgba(124,77,255,0.12)', color: '#b27fff', border: 'rgba(124,77,255,0.3)' },
  'Finance':           { bg: 'rgba(255,200,0,0.12)', color: '#ffd700', border: 'rgba(255,200,0,0.3)' },
  'Leadership':        { bg: 'rgba(0,255,127,0.1)', color: '#00ff7f', border: 'rgba(0,255,127,0.25)' },
  'Technologie':       { bg: 'rgba(0,140,255,0.12)', color: '#4db8ff', border: 'rgba(0,140,255,0.3)' },
  'Développement Personnel': { bg: 'rgba(255,100,150,0.1)', color: '#ff6496', border: 'rgba(255,100,150,0.25)' },
  'Général':           { bg: 'rgba(255,255,255,0.06)', color: '#a8b2c8', border: 'rgba(255,255,255,0.15)' },
}

export default function BookCard({ book, onRead, onBuy, onDownload }) {
  const [hovered, setHovered] = useState(false)
  const catStyle = CATEGORY_COLORS[book.category] || CATEGORY_COLORS['Général']

  const coverUrl = book.cover_image
    ? `/storage/covers/${book.cover_image}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered
          ? 'rgba(255,255,255,0.055)'
          : 'rgba(255,255,255,0.028)',
        border: `1px solid ${hovered ? 'rgba(0,229,255,0.35)' : 'rgba(0,229,255,0.1)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,229,255,0.15)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover */}
      <div style={{
        height: 200,
        background: coverUrl
          ? `url(${coverUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, #0d1b3e 0%, #1a2a6c 50%, #0d2247 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Shimmer overlay if no cover */}
        {!coverUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.6))' }}>
              📖
            </div>
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 13, fontWeight: 700,
              textAlign: 'center', padding: '0 16px',
              color: 'rgba(0,229,255,0.8)',
              letterSpacing: 1,
              textTransform: 'uppercase',
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
          {/* Category */}
          <span style={{
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 10, fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            background: catStyle.bg,
            color: catStyle.color,
            border: `1px solid ${catStyle.border}`,
            backdropFilter: 'blur(8px)',
          }}>
            {book.category || 'Général'}
          </span>

          {/* Price / Free */}
          <span style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12, fontWeight: 800,
            background: book.is_free
              ? 'rgba(0,255,127,0.2)'
              : 'rgba(255,200,0,0.2)',
            color: book.is_free ? '#00ff7f' : '#ffd700',
            border: `1px solid ${book.is_free ? 'rgba(0,255,127,0.4)' : 'rgba(255,200,0,0.4)'}`,
            backdropFilter: 'blur(8px)',
          }}>
            {book.is_free ? '🎁 GRATUIT' : `${Number(book.price).toFixed(2)} €`}
          </span>
        </div>

        {/* Preview tag */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 10, fontWeight: 600,
          background: 'rgba(0,0,0,0.7)',
          color: 'rgba(0,229,255,0.8)',
          border: '1px solid rgba(0,229,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}>
          👁 5 min gratuit
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700,
          color: 'var(--text-1)',
          marginBottom: 8,
          lineHeight: 1.35,
          fontFamily: "'Space Grotesk',sans-serif",
        }}>
          {book.title}
        </h3>

        <p style={{
          fontSize: 12, color: 'var(--text-3)',
          lineHeight: 1.6, marginBottom: 14,
          flexGrow: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {book.description || 'Découvrez ce livre fascinant qui transformera votre vision du monde digital.'}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {book.is_free ? (
            <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⬇️ <strong style={{ color: 'var(--text-2)' }}>{book.download_count || 0}</strong> télécharg.
            </span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              🛒 <strong style={{ color: 'var(--text-2)' }}>{book.purchase_count || 0}</strong> ventes
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, fontSize: 12, padding: '9px 10px' }}
            onClick={e => { e.stopPropagation(); onRead(book) }}
          >
            👁 Lire 5 min
          </button>
          <button
            className={book.is_free ? 'btn btn-cyan' : 'btn btn-primary'}
            style={{ flex: 1, fontSize: 12, padding: '9px 10px' }}
            onClick={e => { e.stopPropagation(); book.is_free ? onDownload(book) : onBuy(book) }}
          >
            {book.is_free ? '⬇️ Télécharger' : '💳 Acheter'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
