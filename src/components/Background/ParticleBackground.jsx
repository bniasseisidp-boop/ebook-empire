import { useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════
   EMPIRE NEURAL BACKGROUND — Premium v2
   • Réseau neural (nodes + connexions)
   • Bulles montantes (soap-bubble style — stroke only, tiny)
   • Chiffres & symboles flottants
   • Adaptatif dark/light theme via CSS variable
════════════════════════════════════════════════════════════════ */

const CYAN   = { r: 0,   g: 229, b: 255 }
const VIOLET = { r: 124, g: 77,  b: 255 }
const BLUE   = { r: 0,   g: 140, b: 255 }

function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})` }
function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)] }

// ── Neural node ──────────────────────────────────────────────
function makeNode(W, H) {
  const col = pick([CYAN, CYAN, VIOLET, BLUE])
  return {
    x:      Math.random() * W,
    y:      Math.random() * H,
    vx:     (Math.random() - 0.5) * 0.3,
    vy:     (Math.random() - 0.5) * 0.3,
    r:      Math.random() * 2 + 1.2,
    color:  col,
    pulse:  Math.random() * Math.PI * 2,
    hasRing:  Math.random() > 0.7,
    hasCross: Math.random() > 0.85,
    glow:   Math.random() * 10 + 6,
  }
}

// ── Rising bubble ────────────────────────────────────────────
function makeBubble(W, H, fromBottom = true) {
  const col = pick([CYAN, VIOLET, BLUE])
  return {
    x:     Math.random() * W,
    y:     fromBottom ? H + Math.random() * 80 : Math.random() * H,
    r:     Math.random() * 10 + 3,          // 3–13 px — small!
    vx:    (Math.random() - 0.5) * 0.3,
    vy:    -(Math.random() * 0.6 + 0.2),    // rise up
    alpha: Math.random() * 0.35 + 0.08,
    color: col,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: (Math.random() - 0.5) * 0.04,
  }
}

// ── Floating symbol ──────────────────────────────────────────
function makeSymbol(W, H) {
  const CHARS = [
    '0','1','0','1','0','1','2','3','7','8',
    '+','~','×','÷','∑','π','∞','#','@','<','>',
  ]
  const col = pick([CYAN, VIOLET, BLUE])
  return {
    x:     Math.random() * W,
    y:     Math.random() * H,
    char:  pick(CHARS),
    size:  Math.floor(Math.random() * 9) + 8,  // 8–16px
    alpha: Math.random() * 0.22 + 0.04,
    vy:    -(Math.random() * 0.18 + 0.06),
    vx:    (Math.random() - 0.5) * 0.12,
    color: col,
  }
}

export default function ParticleBackground({ theme = 'dark' }) {
  const canvasRef = useRef(null)
  const themeRef  = useRef(theme)

  useEffect(() => { themeRef.current = theme }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    const NODE_COUNT   = Math.min(70,  Math.floor(W * H / 16000))
    const BUBBLE_COUNT = Math.min(50,  Math.floor(W * H / 18000))
    const SYMBOL_COUNT = Math.min(35,  Math.floor(W * H / 20000))
    const CONNECT_DIST = 130

    let nodes   = Array.from({ length: NODE_COUNT },   () => makeNode(W, H))
    let bubbles = Array.from({ length: BUBBLE_COUNT }, () => makeBubble(W, H, false))
    let symbols = Array.from({ length: SYMBOL_COUNT }, () => makeSymbol(W, H))

    let raf = null

    const draw = () => {
      const isDark = themeRef.current === 'dark'

      // ── Background ──
      if (isDark) {
        ctx.fillStyle = '#060a12'
        ctx.fillRect(0, 0, W, H)

        // Nebula glow center
        const neb = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.55)
        neb.addColorStop(0,   'rgba(0,60,160,0.06)')
        neb.addColorStop(0.5, 'rgba(50,0,100,0.03)')
        neb.addColorStop(1,   'transparent')
        ctx.fillStyle = neb
        ctx.fillRect(0, 0, W, H)
      } else {
        // Light mode — clean white
        ctx.fillStyle = '#f8faff'
        ctx.fillRect(0, 0, W, H)

        // Soft radial gradient
        const neb = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7)
        neb.addColorStop(0,   'rgba(200,230,255,0.5)')
        neb.addColorStop(0.5, 'rgba(220,200,255,0.2)')
        neb.addColorStop(1,   'transparent')
        ctx.fillStyle = neb
        ctx.fillRect(0, 0, W, H)
      }

      const lineAlpha  = isDark ? 0.22 : 0.14
      const nodeAlpha  = isDark ? 1    : 0.85
      const symAlpha   = isDark ? 1    : 0.6

      // ── Connection lines ──
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < CONNECT_DIST) {
            const a = (1 - d / CONNECT_DIST) * lineAlpha
            ctx.strokeStyle = rgba(nodes[i].color, a)
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // ── Floating symbols ──
      symbols.forEach(s => {
        ctx.font = `${s.size}px 'Courier New', monospace`
        ctx.fillStyle = rgba(s.color, s.alpha * symAlpha)
        ctx.fillText(s.char, s.x, s.y)
        s.y += s.vy
        s.x += s.vx
        if (s.y < -20) {
          s.y = H + 20
          s.x = Math.random() * W
          s.char = pick(['0','1','0','1','+','~','π','∞','×'])
        }
        if (s.x < -20 || s.x > W + 20) s.x = Math.random() * W
      })

      // ── Soap bubbles (rising) ──
      bubbles.forEach(b => {
        b.wobble += b.wobbleSpeed
        b.x += b.vx + Math.sin(b.wobble) * 0.3
        b.y += b.vy

        if (b.y + b.r < 0) {
          Object.assign(b, makeBubble(W, H, true))
        }

        const a = b.alpha * (isDark ? 1 : 0.7)

        // Bubble outer ring
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(b.color, a)
        ctx.lineWidth   = 0.8
        ctx.stroke()

        // Bubble inner subtle fill
        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.3, b.y - b.r * 0.3, 0,
          b.x, b.y, b.r
        )
        grad.addColorStop(0,   rgba(b.color, a * 0.25))
        grad.addColorStop(0.5, rgba(b.color, a * 0.06))
        grad.addColorStop(1,   'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()

        // Tiny specular highlight
        ctx.beginPath()
        ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.18, 0, Math.PI * 2)
        ctx.fillStyle = rgba({ r:255, g:255, b:255 }, isDark ? 0.4 : 0.6)
        ctx.fill()
      })

      // ── Neural nodes ──
      nodes.forEach(n => {
        n.pulse += 0.016
        const pr = n.r + Math.sin(n.pulse) * 0.4

        // Ambient glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.glow * 2.5)
        glow.addColorStop(0, rgba(n.color, isDark ? 0.16 : 0.1))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.glow * 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Halo ring
        if (n.hasRing) {
          const ring = pr * 4 + Math.sin(n.pulse * 0.7) * 1.5
          ctx.strokeStyle = rgba(n.color, isDark ? 0.22 : 0.16)
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.arc(n.x, n.y, ring, 0, Math.PI * 2)
          ctx.stroke()
          ctx.strokeStyle = rgba(n.color, isDark ? 0.08 : 0.05)
          ctx.lineWidth = 0.4
          ctx.beginPath()
          ctx.arc(n.x, n.y, ring * 1.9, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Cross marker
        if (n.hasCross) {
          const cs = pr * 3
          ctx.strokeStyle = rgba(n.color, isDark ? 0.4 : 0.3)
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.moveTo(n.x - cs, n.y); ctx.lineTo(n.x + cs, n.y)
          ctx.moveTo(n.x, n.y - cs); ctx.lineTo(n.x, n.y + cs)
          ctx.stroke()
        }

        // Core dot
        const core = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pr * 2.2)
        core.addColorStop(0,   `rgba(255,255,255,${nodeAlpha})`)
        core.addColorStop(0.3, rgba(n.color, nodeAlpha))
        core.addColorStop(1,   rgba(n.color, 0))
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(n.x, n.y, pr * 2.2, 0, Math.PI * 2)
        ctx.fill()

        // Move (wrap around edges)
        n.x += n.vx;  n.y += n.vy
        if (n.x < -10) n.x = W + 10
        if (n.x > W + 10) n.x = -10
        if (n.y < -10) n.y = H + 10
        if (n.y > H + 10) n.y = -10
      })

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
