import { useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════
   EMPIRE NEURAL PARTICLE BACKGROUND
   Inspired by: constellation network with glowing nodes,
   floating binary symbols, pulsing halos — cyan & violet
═══════════════════════════════════════════════════════ */

const COLORS = {
  cyan:   { r: 0,   g: 229, b: 255 },
  violet: { r: 124, g: 77,  b: 255 },
  blue:   { r: 0,   g: 140, b: 255 },
}

function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})` }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function createParticle(w, h) {
  const colorKey = pick(['cyan','cyan','violet','blue'])
  const color = COLORS[colorKey]
  return {
    x:     Math.random() * w,
    y:     Math.random() * h,
    vx:    (Math.random() - 0.5) * 0.35,
    vy:    (Math.random() - 0.5) * 0.35,
    r:     Math.random() * 2.5 + 1.5,
    color,
    pulse: Math.random() * Math.PI * 2,
    hasHalo:  Math.random() > 0.65,
    hasCross: Math.random() > 0.85,
    glowSize: Math.random() * 12 + 8,
  }
}

function createSymbol(w, h) {
  const chars = ['0','1','0','1','0','1','+','~','@','#','<','>','/','\\']
  return {
    x:   Math.random() * w,
    y:   Math.random() * h,
    char: pick(chars),
    opacity: Math.random() * 0.22 + 0.04,
    size:    Math.floor(Math.random() * 8) + 9,
    vy: -(Math.random() * 0.25 + 0.08),
    vx:  (Math.random() - 0.5) * 0.15,
    color: Math.random() > 0.5
      ? `rgba(0,229,255,`
      : `rgba(124,77,255,`
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    const PARTICLE_COUNT = Math.min(90, Math.floor(W * H / 14000))
    const SYMBOL_COUNT   = Math.min(30, Math.floor(W * H / 22000))
    const CONNECT_DIST   = 140

    let particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(W, H))
    let symbols   = Array.from({ length: SYMBOL_COUNT },   () => createSymbol(W, H))

    let raf = null

    const draw = () => {
      // Deep space background
      ctx.fillStyle = '#060a12'
      ctx.fillRect(0, 0, W, H)

      // ── Subtle radial nebula glow in center ──
      const nebula = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.55)
      nebula.addColorStop(0, 'rgba(0,80,180,0.07)')
      nebula.addColorStop(0.5, 'rgba(60,0,120,0.04)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, W, H)

      // ── Draw connection lines ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx*dx + dy*dy)
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.28
            const ci = particles[i].color
            ctx.strokeStyle = rgba(ci, alpha)
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // ── Draw floating symbols ──
      symbols.forEach(s => {
        ctx.font = `${s.size}px 'Courier New', monospace`
        ctx.fillStyle = s.color + s.opacity + ')'
        ctx.fillText(s.char, s.x, s.y)

        s.y += s.vy
        s.x += s.vx

        if (s.y < -20) {
          s.y = H + 20
          s.x = Math.random() * W
          s.char = pick(['0','1','0','1','+','~'])
        }
        if (s.x < -20 || s.x > W + 20) s.x = Math.random() * W
      })

      // ── Draw particles ──
      particles.forEach(p => {
        p.pulse += 0.018
        const pulseOff = Math.sin(p.pulse) * 0.5
        const r = p.r + pulseOff

        // Outer ambient glow
        const glow1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize * 3)
        glow1.addColorStop(0, rgba(p.color, 0.18))
        glow1.addColorStop(0.5, rgba(p.color, 0.04))
        glow1.addColorStop(1, 'transparent')
        ctx.fillStyle = glow1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.glowSize * 3, 0, Math.PI * 2)
        ctx.fill()

        // Halo ring (for some nodes)
        if (p.hasHalo) {
          const ringSize = r * 4 + Math.sin(p.pulse * 0.7) * 2
          ctx.strokeStyle = rgba(p.color, 0.25)
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(p.x, p.y, ringSize, 0, Math.PI * 2)
          ctx.stroke()

          ctx.strokeStyle = rgba(p.color, 0.1)
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(p.x, p.y, ringSize * 1.8, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Cross marker (like in the reference image)
        if (p.hasCross) {
          const cs = r * 3
          ctx.strokeStyle = rgba(p.color, 0.4)
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(p.x - cs, p.y); ctx.lineTo(p.x + cs, p.y)
          ctx.moveTo(p.x, p.y - cs); ctx.lineTo(p.x, p.y + cs)
          ctx.stroke()
        }

        // Core dot gradient
        const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5)
        core.addColorStop(0, '#ffffff')
        core.addColorStop(0.3, rgba(p.color, 1))
        core.addColorStop(1, rgba(p.color, 0))
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Move
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10)     { p.x = W + 10 }
        if (p.x > W + 10)  { p.x = -10 }
        if (p.y < -10)     { p.y = H + 10 }
        if (p.y > H + 10)  { p.y = -10 }
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
