import { useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'

const FEATURES = [
  {
    icon: '🔍',
    title: 'Text Analysis',
    desc: 'Detect AI-generated text using perplexity scoring, burstiness metrics, and transformer-based classifiers.',
    tag: 'NLP'
  },
  {
    icon: '🖼️',
    title: 'Image Detection',
    desc: 'Identify diffusion model artifacts, EXIF metadata anomalies, and GAN fingerprints in images.',
    tag: 'Vision'
  },
  {
    icon: '📊',
    title: 'Evidence Breakdown',
    desc: 'Multi-signal scoring with weighted evidence from detector models, metadata, and artifact analysis.',
    tag: 'ML'
  },
  {
    icon: '📄',
    title: 'PDF Reports',
    desc: 'Download detailed analysis reports with full evidence chains, metadata, and confidence scoring.',
    tag: 'Export'
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Content', desc: 'Drop in text, images, or PDF documents. Supports drag-and-drop.' },
  { step: '02', title: 'Multi-Signal Analysis', desc: 'We run 4+ detection models in parallel, analyzing patterns and metadata.' },
  { step: '03', title: 'Weighted Scoring', desc: 'Evidence is weighted: detector model (70%), metadata (20%), artifacts (10%).' },
  { step: '04', title: 'Verdict + Report', desc: 'Get an AI likelihood score, confidence level, and downloadable report.' },
]

const STATS = [
  { value: '94%', label: 'Accuracy on GPT-4 text' },
  { value: '89%', label: 'Image detection rate' },
  { value: '<3s', label: 'Average analysis time' },
  { value: '12+', label: 'Detection signals' },
]

export default function HomePage({ navigate, theme, setTheme }) {
  const heroRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Particle canvas
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    let animId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,179,255,${p.opacity})`
        ctx.fill()
      })
      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(99,179,255,${0.08 * (1 - dist/120)})`
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="noise">
      <Navbar navigate={navigate} theme={theme} setTheme={setTheme} currentPage="home" />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-20">
        {/* Particle canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-10 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600 rounded-full blur-[150px] opacity-10 animate-float" style={{animationDelay: '2s'}} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(99,180,255,0.2)] bg-[rgba(59,130,246,0.08)] mb-8 animate-fade-up">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-mono text-blue-300 tracking-wider">DETECTION ENGINE v2.4 ACTIVE</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black leading-none mb-6 animate-fade-up delay-100">
            <span className="text-white">Detect </span>
            <span className="font-serif italic gradient-text">AI-Generated</span>
            <br />
            <span className="text-white">Content</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#8ba3c4] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Multi-signal analysis combining ML models, metadata forensics, and artifact detection — with honest confidence scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <button
              onClick={() => navigate('analyze')}
              className="btn-primary text-base px-8 py-4 flex items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Analyze Content Free
            </button>
            <button className="btn-ghost flex items-center gap-2 px-8 py-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              See How It Works
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 animate-fade-up delay-400">
            {STATS.map(({ value, label }) => (
              <div key={label} className="card p-5 text-center">
                <div className="text-3xl font-black gradient-text mb-1">{value}</div>
                <div className="text-sm text-[#8ba3c4]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(99,180,255,0.15)] text-xs font-mono text-blue-400 tracking-widest mb-4">CAPABILITIES</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Every Signal.<br />
            <span className="shimmer-text">One Verdict.</span>
          </h2>
          <p className="text-[#8ba3c4] text-lg max-w-xl mx-auto">
            We don't rely on a single model. Our weighted multi-signal approach gives you real confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc, tag }, i) => (
            <div key={title} className="card p-8 group cursor-pointer" style={{animationDelay: `${i*0.1}s`}}>
              <div className="flex items-start justify-between mb-5">
                <div className="text-4xl">{icon}</div>
                <span className="badge badge-medium">{tag}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">{title}</h3>
              <p className="text-[#8ba3c4] leading-relaxed">{desc}</p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-[rgba(13,20,32,0.5)] border-y border-[rgba(99,180,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(99,180,255,0.15)] text-xs font-mono text-blue-400 tracking-widest mb-4">HOW IT WORKS</div>
            <h2 className="text-4xl md:text-5xl font-black text-white">From Upload to Verdict</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[rgba(99,180,255,0.3)] to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="font-mono text-5xl font-bold text-[rgba(59,130,246,0.2)] mb-4">{step}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-[#8ba3c4] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <div className="card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,130,246,0.08)] to-[rgba(139,92,246,0.08)]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Start detecting <span className="gradient-text">now</span>
            </h2>
            <p className="text-[#8ba3c4] text-lg mb-8">No account required. Analyze text and images instantly.</p>
            <button onClick={() => navigate('analyze')} className="btn-primary text-base px-10 py-4">
              Analyze Your Content →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(99,180,255,0.06)] py-8 text-center text-[#4a6280] text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono">DetectAI © 2025 — Multi-signal AI content detection</span>
          <span className="text-xs">This tool provides probabilistic estimates, not certainties. Always verify important content through multiple methods.</span>
        </div>
      </footer>
    </div>
  )
}
