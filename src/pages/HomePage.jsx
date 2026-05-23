import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleBackground from '../components/Background/ParticleBackground'
import Header from '../components/Layout/Header'
import BookCard from '../components/Books/BookCard'
import SearchFilter from '../components/Books/SearchFilter'
import PDFReader from '../components/Reader/PDFReader'
import EmailCaptureModal from '../components/Modals/EmailCaptureModal'
import PaymentModal from '../components/Modals/PaymentModal'
import SuccessModal from '../components/Modals/SuccessModal'
import { getBooks } from '../services/api'

/* ── Typewriter effect ─────────────────────────── */
function Typewriter({ words, speed = 120, pause = 2000 }) {
  const [text, setText] = useState('')
  const [wi, setWi]     = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const word = words[wi]
    const delay = deleting ? speed / 2 : speed
    const t = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1))
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause)
      } else {
        setText(word.slice(0, text.length - 1))
        if (text.length === 1) { setDeleting(false); setWi(i => (i + 1) % words.length) }
      }
    }, delay)
    return () => clearTimeout(t)
  }, [text, deleting, wi, words, speed, pause])
  return (
    <span className="gradient-text" style={{ borderRight: '3px solid #00e5ff', paddingRight: 4 }}>
      {text}
    </span>
  )
}

export default function HomePage() {
  const [books,       setBooks]       = useState([])
  const [filtered,    setFiltered]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('')
  const [freeOnly,    setFreeOnly]    = useState(false)
  const [readerBook,  setReaderBook]  = useState(null)
  const [emailBook,   setEmailBook]   = useState(null)
  const [payBook,     setPayBook]     = useState(null)
  const [successInfo, setSuccessInfo] = useState(null)

  // Load books
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getBooks()
        setBooks(data)
        setFiltered(data)
      } catch {
        // Demo books if API not available
        const demo = [
          { id:1, title:'Marketing Digital Masterclass', description:'Dominez le marketing digital avec les stratégies des millionnaires du web. SEO, réseaux sociaux, email marketing, publicité payante.', price:29.99, is_free:0, category:'Marketing Digital', download_count:0, purchase_count:142, cover_image:null },
          { id:2, title:'Devenir Entrepreneur en 90 Jours', description:'De zéro à votre première entreprise rentable en 90 jours. Un plan d\'action concret et prouvé.', price:19.99, is_free:0, category:'Entrepreneuriat', download_count:0, purchase_count:89, cover_image:null },
          { id:3, title:'Guide Gratuit: Mindset Millionnaire', description:'Transformez votre état d\'esprit pour attirer la richesse et le succès. 10 principes fondamentaux.', price:0, is_free:1, category:'Développement Personnel', download_count:534, purchase_count:0, cover_image:null },
          { id:4, title:'Finance Personnelle: Investir en 2025', description:'Construisez votre portefeuille d\'investissement avec les meilleures stratégies actuelles.', price:34.99, is_free:0, category:'Finance', download_count:0, purchase_count:67, cover_image:null },
          { id:5, title:'Leadership & Management 3.0', description:'Les techniques des leaders du 21ème siècle pour inspirer et diriger des équipes performantes.', price:24.99, is_free:0, category:'Leadership', download_count:0, purchase_count:103, cover_image:null },
          { id:6, title:'IA & Business: Le Guide Complet', description:'Intégrez l\'intelligence artificielle dans votre entreprise pour automatiser et dominer votre marché.', price:0, is_free:1, category:'Technologie', download_count:892, purchase_count:0, cover_image:null },
        ]
        setBooks(demo); setFiltered(demo)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter logic
  useEffect(() => {
    let f = books
    if (search)    f = f.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase()))
    if (category)  f = f.filter(b => b.category === category)
    if (freeOnly)  f = f.filter(b => b.is_free)
    setFiltered(f)
  }, [search, category, freeOnly, books])

  const freeBooks = filtered.filter(b => b.is_free)
  const paidBooks = filtered.filter(b => !b.is_free)

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ParticleBackground />
      <Header />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ────────── HERO ────────── */}
        <section id="hero" style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label" style={{ justifyContent: 'center', marginBottom: 24 }}>
              ✦ NOTRE UNIVERS NUMÉRIQUE ✦
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontSize: 'clamp(38px, 7vw, 82px)',
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.1,
              maxWidth: 900,
              marginBottom: 20,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            L'Empire sur{' '}
            <Typewriter
              words={['4 piliers', 'le Digital', 'vos Ebooks', 'le Success']}
              speed={100}
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontSize: 'clamp(15px, 2.5vw, 19px)',
              color: 'var(--text-2)',
              maxWidth: 620,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            Un écosystème technologique complet pour dominer chaque dimension du digital.
            Ebooks premium, stratégies éprouvées, accès immédiat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <a href="#books" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary" style={{ padding: '15px 32px', fontSize: 15 }}>
                🚀 Explorer les Ebooks
              </button>
            </a>
            <a href="#free" style={{ textDecoration: 'none' }}>
              <button className="btn btn-cyan" style={{ padding: '15px 32px', fontSize: 15 }}>
                🎁 Gratuits aujourd'hui
              </button>
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={{
              display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center',
              marginTop: 64,
              padding: '24px 40px',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 20,
            }}
          >
            {[
              { n: books.length, label: 'Ebooks disponibles', icon: '📚' },
              { n: books.reduce((a,b)=>a+(b.download_count||0),0), label: 'Téléchargements', icon: '⬇️' },
              { n: books.reduce((a,b)=>a+(b.purchase_count||0),0), label: 'Achats confirmés', icon: '🛒' },
              { n: '100%', label: 'Satisfaits', icon: '⭐' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif" }}>
                  <span className="gradient-text">{s.n}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ────────── BOOKS SECTION ────────── */}
        <section id="books" style={{ padding: '80px 32px', maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div className="section-label" style={{ justifyContent: 'center' }}>📖 BIBLIOTHÈQUE PREMIUM</div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, marginBottom: 12 }}>
              Nos Ebooks <span className="gradient-text">Best-sellers</span>
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Chaque livre est un condensé de connaissance pour transformer votre vie numérique
            </p>
          </motion.div>

          <SearchFilter
            onSearch={setSearch}
            onCategory={setCategory}
            onFree={setFreeOnly}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-3)' }}>Chargement des ebooks…</p>
            </div>
          ) : (
            <>
              {paidBooks.length > 0 && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-2)' }}>
                      💎 Ebooks Premium ({paidBooks.length})
                    </h3>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 24,
                    marginBottom: 60,
                  }}>
                    {paidBooks.map(book => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onRead={b => setReaderBook(b)}
                        onBuy={b => setPayBook(b)}
                        onDownload={b => setEmailBook(b)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ────────── FREE SECTION ────────── */}
        <section id="free" style={{ padding: '60px 32px 100px', maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div className="section-label" style={{ justifyContent: 'center', background: 'rgba(0,255,127,0.1)', borderColor: 'rgba(0,255,127,0.3)', color: '#00ff7f' }}>
              🎁 ACCÈS GRATUIT
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, marginBottom: 12 }}>
              Ebooks <span style={{ color: '#00ff7f' }}>100% Gratuits</span>
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              Entrez votre email et recevez le lien de téléchargement instantanément
            </p>
          </motion.div>

          {!loading && freeBooks.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}>
              {freeBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRead={b => setReaderBook(b)}
                  onBuy={() => {}}
                  onDownload={b => setEmailBook(b)}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                Aucun livre gratuit trouvé avec ces filtres.
              </div>
            )
          )}
        </section>

        {/* ────────── HOW IT WORKS ────────── */}
        <section style={{
          padding: '80px 32px',
          background: 'rgba(255,255,255,0.015)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>💡 COMMENT ÇA MARCHE</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 48 }}>
              Simple, <span className="gradient-text">rapide & sécurisé</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
              {[
                { n: '01', icon: '👁', title: 'Lisez 5 minutes', desc: 'Testez gratuitement chaque livre pendant 5 minutes' },
                { n: '02', icon: '💳', title: 'Achetez / Téléchargez', desc: 'Payez en sécurité via Stripe ou téléchargez gratuitement' },
                { n: '03', icon: '📩', title: 'Recevez par email', desc: 'Votre livre + licence arrivent en quelques secondes' },
                { n: '04', icon: '🚀', title: 'Progressez', desc: 'Appliquez les stratégies et dominez votre domaine' },
              ].map(step => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: parseInt(step.n) * 0.1 }}
                  style={{
                    padding: '28px 24px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--cyan)', marginBottom: 12 }}>{step.n}</div>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{step.title}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '40px 32px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-3)',
          fontSize: 13,
        }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            <span className="gradient-text">EMPIRE EBOOK</span>
          </div>
          <p>© 2025 Empire Ebook · Tous droits réservés ·{' '}
            <a href="/admin" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Admin</a>
          </p>
        </footer>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {readerBook && (
          <PDFReader
            book={readerBook}
            onClose={() => setReaderBook(null)}
            onBuy={b => { setReaderBook(null); setPayBook(b) }}
            onDownload={(b, em) => {
              if (em) {
                setReaderBook(null)
                setSuccessInfo({ type: 'download', email: em, bookTitle: b.title })
              } else {
                setReaderBook(null)
                setEmailBook(b)
              }
            }}
          />
        )}
      </AnimatePresence>

      {emailBook && (
        <EmailCaptureModal
          book={emailBook}
          onClose={() => setEmailBook(null)}
          onSuccess={em => {
            setEmailBook(null)
            setSuccessInfo({ type: 'download', email: em, bookTitle: emailBook.title })
          }}
        />
      )}

      {payBook && (
        <PaymentModal
          book={payBook}
          onClose={() => setPayBook(null)}
          onSuccess={em => {
            setPayBook(null)
            setSuccessInfo({ type: 'purchase', email: em, bookTitle: payBook.title })
          }}
        />
      )}

      {successInfo && (
        <SuccessModal
          type={successInfo.type}
          email={successInfo.email}
          bookTitle={successInfo.bookTitle}
          onClose={() => setSuccessInfo(null)}
        />
      )}
    </div>
  )
}
