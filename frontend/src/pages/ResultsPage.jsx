import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'

const VERDICT_CONFIG = {
  likely_ai: {
    label: 'Likely AI Generated',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    icon: '🤖',
    badgeClass: 'badge-ai',
  },
  uncertain: {
    label: 'Uncertain / Mixed Signals',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    icon: '⚖️',
    badgeClass: 'badge-uncertain',
  },
  likely_human: {
    label: 'Likely Human Created',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    icon: '👤',
    badgeClass: 'badge-human',
  },
}

function CircularScore({ score, color, animated }) {
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!animated) return
    let start = 0
    const step = () => {
      start += 2
      setDisplayed(Math.min(start, score))
      if (start < score) requestAnimationFrame(step)
    }
    const timeout = setTimeout(() => requestAnimationFrame(step), 400)
    return () => clearTimeout(timeout)
  }, [score, animated])

  const offset = circumference - (displayed / 100) * circumference

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Background ring */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(99,180,255,0.08)" strokeWidth="14"/>
        {/* Score ring */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* Tick marks */}
        {[0, 30, 70, 100].map(tick => {
          const angle = ((tick / 100) * 360 - 90) * (Math.PI / 180)
          const x1 = 100 + (radius - 8) * Math.cos(angle)
          const y1 = 100 + (radius - 8) * Math.sin(angle)
          const x2 = 100 + (radius + 2) * Math.cos(angle)
          const y2 = 100 + (radius + 2) * Math.sin(angle)
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
        })}
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={score > 70 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e'}/>
            <stop offset="100%" stopColor={score > 70 ? '#f97316' : score > 30 ? '#3b82f6' : '#06b6d4'}/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-6xl font-black" style={{ color }}>{displayed}<span className="text-3xl">%</span></div>
        <div className="text-xs font-mono text-[#8ba3c4] mt-1">AI LIKELIHOOD</div>
      </div>
    </div>
  )
}

export default function ResultsPage({ results, navigate, theme, setTheme }) {
  const [animated, setAnimated] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8ba3c4] mb-4">No results to display.</p>
          <button onClick={() => navigate('analyze')} className="btn-primary">Start Analysis</button>
        </div>
      </div>
    )
  }

  const { ai_score, confidence, verdict, evidence = [], metadata = {}, inputType, fileName, inputText, analyzed_at } = results
  const vc = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.uncertain
  const confClass = `badge-${confidence}`

  const downloadReport = () => {
    const reportLines = [
      '═══════════════════════════════════════════════════════',
      '          DETECTAI — AI CONTENT ANALYSIS REPORT',
      '═══════════════════════════════════════════════════════',
      '',
      `Analyzed: ${new Date(analyzed_at).toLocaleString()}`,
      `Input Type: ${inputType?.toUpperCase()}`,
      fileName ? `File: ${fileName}` : '',
      '',
      '──────────────────────────────────────────────────────',
      'DETECTION RESULTS',
      '──────────────────────────────────────────────────────',
      `AI Likelihood Score: ${ai_score}%`,
      `Confidence Level:    ${confidence?.toUpperCase()}`,
      `Final Verdict:       ${vc.label}`,
      '',
      '──────────────────────────────────────────────────────',
      'EVIDENCE BREAKDOWN',
      '──────────────────────────────────────────────────────',
      ...(evidence.map(e => `${e.positive ? '[+]' : '[-]'} ${e.signal}: ${e.result}${e.weight ? ` (weight: ${e.weight})` : ''}`)),
      '',
      '──────────────────────────────────────────────────────',
      'METADATA',
      '──────────────────────────────────────────────────────',
      ...(Object.entries(metadata).map(([k, v]) => `${k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)),
      '',
      '──────────────────────────────────────────────────────',
      'SCORING METHODOLOGY',
      '──────────────────────────────────────────────────────',
      'AI Detector Model:  70% weight',
      'Metadata Evidence:  20% weight',
      'Artifact Detection: 10% weight',
      '',
      'Score Interpretation:',
      '  0–30%:  Likely Human Created',
      '  31–70%: Uncertain / Mixed Signals',
      '  71–100%: Likely AI Generated',
      '',
      '──────────────────────────────────────────────────────',
      'DISCLAIMER',
      '──────────────────────────────────────────────────────',
      'This report provides probabilistic estimates based on',
      'multiple detection signals. It does not constitute a',
      'definitive judgment. Always verify through additional',
      'methods when accuracy is critical.',
      '',
      `Generated by DetectAI — ${new Date().toISOString()}`,
      '═══════════════════════════════════════════════════════',
    ].filter(l => l !== undefined).join('\n')

    const blob = new Blob([reportLines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detectai-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Navbar navigate={navigate} theme={theme} setTheme={setTheme} currentPage="results" />

      <div className="min-h-screen pt-28 pb-20 max-w-5xl mx-auto px-6" ref={printRef}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <button
              onClick={() => navigate('analyze')}
              className="flex items-center gap-2 text-[#8ba3c4] text-sm hover:text-white transition-colors mb-4"
            >
              ← Back to Analyzer
            </button>
            <h1 className="text-3xl font-black text-white">Analysis Results</h1>
            <p className="text-[#8ba3c4] text-sm font-mono mt-1">
              {analyzed_at ? new Date(analyzed_at).toLocaleString() : 'Just now'}
              {fileName && ` · ${fileName}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadReport} className="btn-ghost flex items-center gap-2 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Report
            </button>
            <button onClick={() => navigate('analyze')} className="btn-primary text-sm px-5 py-2">
              New Analysis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Score + Verdict */}
          <div className="lg:col-span-1 space-y-5">
            {/* Score card */}
            <div className="card p-8 text-center animate-fade-up">
              <CircularScore score={ai_score} color={vc.color} animated={animated} />
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className={`badge ${vc.badgeClass}`}>{vc.icon} {vc.label}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-[#8ba3c4]">
                  Confidence:
                  <span className={`badge ${confClass}`}>{confidence?.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Score bands */}
            <div className="card p-5 animate-fade-up delay-100">
              <h3 className="text-sm font-semibold text-[#8ba3c4] mb-4 uppercase tracking-wider">Score Scale</h3>
              {[
                { label: 'Human Likely', range: '0–30', color: '#22c55e', active: ai_score <= 30 },
                { label: 'Uncertain', range: '31–70', color: '#f59e0b', active: ai_score > 30 && ai_score <= 70 },
                { label: 'AI Likely', range: '71–100', color: '#ef4444', active: ai_score > 70 },
              ].map(band => (
                <div key={band.label} className={`flex items-center justify-between p-2.5 rounded-lg mb-1.5 transition-all ${band.active ? 'bg-[rgba(255,255,255,0.05)]' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color, opacity: band.active ? 1 : 0.3 }} />
                    <span className={`text-sm ${band.active ? 'text-white font-semibold' : 'text-[#4a6280]'}`}>{band.label}</span>
                    {band.active && <span className="text-xs text-blue-400 font-mono">← current</span>}
                  </div>
                  <span className={`text-xs font-mono ${band.active ? 'text-white' : 'text-[#4a6280]'}`}>{band.range}%</span>
                </div>
              ))}
            </div>

            {/* Input preview */}
            {inputText && (
              <div className="card p-5 animate-fade-up delay-200">
                <h3 className="text-sm font-semibold text-[#8ba3c4] mb-3 uppercase tracking-wider">Input Preview</h3>
                <p className="text-xs font-mono text-[#8ba3c4] leading-relaxed line-clamp-4">
                  "{inputText}…"
                </p>
              </div>
            )}
          </div>

          {/* Right: Evidence + Metadata */}
          <div className="lg:col-span-2 space-y-5">
            {/* Final verdict banner */}
            <div
              className="card p-6 animate-fade-up"
              style={{ background: vc.bg, borderColor: vc.border }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-mono text-[#8ba3c4] uppercase tracking-wider mb-1">Final Verdict</div>
                  <div className="text-2xl font-black" style={{ color: vc.color }}>
                    {vc.icon} {vc.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-[#8ba3c4] uppercase tracking-wider mb-1">AI Score</div>
                  <div className="text-4xl font-black" style={{ color: vc.color }}>{ai_score}%</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-[rgba(0,0,0,0.2)] rounded-lg">
                <p className="text-sm text-[#8ba3c4]">
                  <strong className="text-white">Important:</strong> This is a probabilistic estimate based on {evidence.length} detection signals.
                  {confidence === 'low' && ' Low confidence — insufficient signals for a strong determination.'}
                  {confidence === 'medium' && ' Medium confidence — signals point in a general direction but with notable uncertainty.'}
                  {confidence === 'high' && ' High confidence — multiple independent signals converge on this verdict.'}
                </p>
              </div>
            </div>

            {/* Evidence breakdown */}
            <div className="card p-6 animate-fade-up delay-200">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Evidence Breakdown
              </h3>
              <div className="space-y-3">
                {evidence.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      background: e.positive ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                      border: `1px solid ${e.positive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`,
                    }}
                  >
                    <span className={`mt-0.5 text-lg ${e.positive ? 'text-red-400' : 'text-green-400'}`}>
                      {e.positive ? '✗' : '✓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{e.signal}</span>
                        {e.weight && (
                          <span className="text-xs font-mono text-[#8ba3c4]">weight: {e.weight}</span>
                        )}
                      </div>
                      <p className="text-sm text-[#8ba3c4] mt-0.5">{e.result}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Weight legend */}
              <div className="mt-5 p-4 bg-[rgba(99,180,255,0.05)] border border-[rgba(99,180,255,0.1)] rounded-xl">
                <div className="text-xs font-mono text-[#8ba3c4] mb-2 uppercase tracking-wider">Scoring Weights</div>
                <div className="flex gap-4 flex-wrap text-xs font-mono">
                  <span className="text-blue-300">AI Detector: 70%</span>
                  <span className="text-violet-300">Metadata: 20%</span>
                  <span className="text-cyan-300">Artifacts: 10%</span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="card p-6 animate-fade-up delay-300">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Metadata Analysis
                <span className="badge badge-medium ml-2">{inputType?.toUpperCase()}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(99,180,255,0.06)] rounded-lg">
                    <div className="text-xs font-mono text-[#4a6280] uppercase tracking-wider mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-white font-medium truncate">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis summary */}
            <div className="card p-6 animate-fade-up delay-400">
              <h3 className="text-lg font-bold text-white mb-4">Analysis Summary</h3>
              <div className="prose-sm text-[#8ba3c4] space-y-2 leading-relaxed">
                <p>
                  The content was analyzed using a multi-signal detection pipeline combining transformer-based AI classifiers, statistical language models, and metadata forensics.
                </p>
                <p>
                  The AI likelihood score of <strong className="text-white">{ai_score}%</strong> was derived by weighting evidence across {evidence.length} distinct detection signals. The confidence level of <strong className="text-white">{confidence}</strong> reflects the degree of signal agreement.
                </p>
                <p className="text-xs text-[#4a6280]">
                  Note: No AI detection system achieves 100% accuracy. This verdict should be treated as one data point in a broader assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
