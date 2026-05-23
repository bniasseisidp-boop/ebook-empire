import { useState } from 'react'
import { Search, Gift, LayoutGrid } from 'lucide-react'

const CATEGORIES = [
  'Tous', 'Marketing Digital', 'Entrepreneuriat', 'Finance',
  'Leadership', 'Technologie', 'Développement Personnel', 'Général',
]

export default function SearchFilter({ onSearch, onCategory, onFree }) {
  const [q,    setQ]    = useState('')
  const [cat,  setCat]  = useState('Tous')
  const [free, setFree] = useState(false)

  const handleSearch = (v) => { setQ(v); onSearch(v) }
  const handleCat    = (c) => { setCat(c); onCategory(c === 'Tous' ? '' : c) }
  const handleFree   = ()  => { const nf = !free; setFree(nf); onFree(nf) }

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Search bar + free toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: 220 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none', lineHeight: 0,
          }}>
            <Search size={15} />
          </span>
          <input
            className="input"
            type="text"
            placeholder="Rechercher un ebook..."
            value={q}
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>

        <button
          className="btn"
          onClick={handleFree}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: free ? 'rgba(0,255,127,0.15)' : 'var(--bg-input)',
            color: free ? '#00ff7f' : 'var(--text-2)',
            border: `1px solid ${free ? 'rgba(0,255,127,0.4)' : 'var(--border)'}`,
            fontSize: 13,
          }}
        >
          <Gift size={14} />
          Gratuits seulement
        </button>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <LayoutGrid size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => handleCat(c)}
            style={{
              padding: '6px 16px', borderRadius: 30,
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: 'none', outline: 'none',
              transition: 'all 0.2s',
              background: cat === c ? 'linear-gradient(135deg,#0044cc,#00e5ff)' : 'rgba(255,255,255,0.05)',
              color: cat === c ? '#fff' : 'var(--text-3)',
              boxShadow: cat === c ? '0 4px 15px rgba(0,229,255,0.3)' : 'none',
              transform: cat === c ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
