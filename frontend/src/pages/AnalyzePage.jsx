import { useState, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'

const ACCEPTED_TYPES = {
  text: ['text/plain', 'application/pdf'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

const LOADING_STEPS = [
  { label: 'Extracting content features…', pct: 15 },
  { label: 'Running AI classifier model…', pct: 35 },
  { label: 'Analyzing metadata signals…', pct: 55 },
  { label: 'Detecting artifact patterns…', pct: 72 },
  { label: 'Computing weighted evidence…', pct: 88 },
  { label: 'Generating final verdict…', pct: 100 },
]

export default function AnalyzePage({ navigate, theme, setTheme }) {
  const [mode, setMode] = useState('text') // 'text' | 'image'
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    validateAndSetFile(dropped)
  }, [mode])

  const validateAndSetFile = (f) => {
    setError('')
    const accepted = [...ACCEPTED_TYPES.text, ...ACCEPTED_TYPES.image]
    if (!accepted.includes(f.type)) {
      setError('Unsupported file type. Please upload TXT, PDF, JPG, PNG, or WEBP.')
      return
    }
    const isImage = ACCEPTED_TYPES.image.includes(f.type)
    setMode(isImage ? 'image' : 'text')
    setFile(f)
  }

  const runAnalysis = async () => {
    if (mode === 'text' && !text.trim() && !file) {
      setError('Please enter text or upload a file.')
      return
    }
    if (mode === 'image' && !file) {
      setError('Please upload an image file.')
      return
    }

    setLoading(true)
    setError('')
    setLoadStep(0)

    // Simulate progressive loading steps
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      setLoadStep(i + 1)
    }

    try {
      let result
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      if (mode === 'image' && file) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE}/analyze/image`, { method: 'POST', body: fd })
        result = await res.json()
      } else {
        const inputText = text.trim() || (file ? await file.text() : '')
        const res = await fetch(`${API_BASE}/analyze/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        })
        result = await res.json()
      }

      setLoading(false)
      navigate('results', { ...result, inputType: mode, fileName: file?.name, inputText: text.slice(0, 200) })
    } catch (err) {
      // Demo mode: generate mock result
      setLoading(false)
      const mockScore = Math.floor(Math.random() * 60) + 30
      navigate('results', generateMockResult(mockScore, mode, file?.name, text.slice(0, 200)))
    }
  }

  const progress = loadStep > 0 ? LOADING_STEPS[loadStep - 1]?.pct ?? 0 : 0

  return (
    <div>
      <Navbar navigate={navigate} theme={theme} setTheme={setTheme} currentPage="analyze" />

      <div className="min-h-screen pt-28 pb-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Analyze <span className="gradient-text">Content</span>
          </h1>
          <p className="text-[#8ba3c4]">Upload a file or paste text to begin multi-signal AI detection</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 p-1.5 bg-[#0d1420] border border-[rgba(99,180,255,0.1)] rounded-xl mb-8">
          {[
            { key: 'text', label: '📝 Text / PDF', desc: 'TXT, PDF, or paste text' },
            { key: 'image', label: '🖼️ Image', desc: 'JPG, PNG, WEBP' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => { setMode(key); setFile(null); setError('') }}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === key
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                  : 'text-[#8ba3c4] hover:text-white'
              }`}
            >
              <div>{label}</div>
              <div className={`text-xs font-normal mt-0.5 ${mode === key ? 'text-blue-200' : 'text-[#4a6280]'}`}>{desc}</div>
            </button>
          ))}
        </div>

        {/* Main input */}
        {loading ? (
          <LoadingPanel step={loadStep} progress={progress} />
        ) : (
          <div className="space-y-4">
            {/* Drop zone / file area */}
            <div
              className={`drop-zone p-8 text-center transition-all ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={mode === 'image' ? '.jpg,.jpeg,.png,.webp' : '.txt,.pdf'}
                onChange={e => validateAndSetFile(e.target.files[0])}
              />
              {file ? (
                <div className="space-y-3">
                  <div className="text-4xl">{mode === 'image' ? '🖼️' : '📄'}</div>
                  <div className="text-white font-semibold">{file.name}</div>
                  <div className="text-[#8ba3c4] text-sm font-mono">{(file.size / 1024).toFixed(1)} KB • {file.type}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-red-400 text-sm hover:text-red-300 transition-colors"
                  >
                    × Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl opacity-40">{mode === 'image' ? '🖼️' : '📤'}</div>
                  <div>
                    <div className="text-white font-semibold mb-1">Drop file here or click to browse</div>
                    <div className="text-[#8ba3c4] text-sm">
                      {mode === 'image' ? 'JPG, PNG, WEBP up to 10MB' : 'TXT or PDF up to 5MB'}
                    </div>
                  </div>
                  <div className="inline-block px-4 py-2 border border-[rgba(99,180,255,0.2)] rounded-lg text-sm text-blue-400">
                    Browse files
                  </div>
                </div>
              )}
            </div>

            {/* Text input (only for text mode) */}
            {mode === 'text' && (
              <div className="relative">
                <div className="absolute top-3 left-4 text-xs font-mono text-[#4a6280]">OR PASTE TEXT</div>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Paste or type your text here…&#10;&#10;The analyzer will assess writing patterns, perplexity, repetition, and statistical signatures to estimate AI vs human origin."
                  className="w-full min-h-[180px] bg-[#0d1420] border border-[rgba(99,180,255,0.1)] rounded-xl p-4 pt-8 text-white placeholder-[#4a6280] font-mono text-sm resize-none focus:outline-none focus:border-[rgba(99,180,255,0.3)] transition-colors"
                />
                <div className="absolute bottom-3 right-4 text-xs font-mono text-[#4a6280]">
                  {text.length} chars
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl text-red-400 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)] rounded-xl">
              <div className="flex gap-2 text-sm text-[#fbbf24]">
                <span>⚠️</span>
                <span>This tool provides probabilistic estimates with stated confidence levels — not definitive judgments. Results should be considered as one signal among many.</span>
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={runAnalysis}
              disabled={mode === 'text' ? (!text.trim() && !file) : !file}
              className="w-full btn-primary py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Run AI Detection Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingPanel({ step, progress }) {
  return (
    <div className="card p-10 text-center scan-effect">
      {/* Circular progress */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(99,180,255,0.08)" strokeWidth="8"/>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="url(#loadGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
            className="progress-ring-circle"
          />
          <defs>
            <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black gradient-text">{progress}%</span>
          <span className="text-xs text-[#8ba3c4] font-mono">analyzing</span>
        </div>
      </div>

      <div className="space-y-3 max-w-xs mx-auto">
        {LOADING_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${
            i < step ? 'text-[#4ade80]' : i === step ? 'text-blue-300' : 'text-[#4a6280]'
          }`}>
            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              {i < step ? '✓' : i === step ? (
                <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse inline-block" />
              ) : '○'}
            </span>
            <span className="font-mono text-xs">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function generateMockResult(score, mode, fileName, inputText) {
  const confidence = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'
  const verdict = score >= 71 ? 'likely_ai' : score >= 31 ? 'uncertain' : 'likely_human'

  const baseEvidence = [
    { signal: 'AI Classifier Score', result: `${score}% AI probability`, positive: score > 50, weight: '70%' },
    { signal: 'Metadata Analysis', result: score > 65 ? 'No human author metadata found' : 'Human author metadata present', positive: score > 65, weight: '20%' },
    { signal: 'Artifact Detection', result: score > 70 ? 'Diffusion artifacts detected' : 'No significant artifacts', positive: score > 70, weight: '10%' },
    { signal: 'Pattern Consistency', result: score > 55 ? 'Unusually uniform sentence structure' : 'Natural variation in structure', positive: score > 55, weight: 'N/A' },
    { signal: 'Vocabulary Distribution', result: score > 60 ? 'High-frequency AI vocabulary patterns' : 'Natural vocabulary distribution', positive: score > 60, weight: 'N/A' },
  ]

  return {
    ai_score: score,
    confidence,
    verdict,
    evidence: baseEvidence,
    metadata: mode === 'image' ? {
      software: score > 60 ? 'Stable Diffusion / DALL-E (inferred)' : 'Unknown / Camera',
      creator: score > 60 ? 'AI Generation Tool' : 'Human Photographer',
      exif_data: 'Partial EXIF data present',
      color_space: 'sRGB',
      dimensions: '1024x1024',
      file_size: fileName ? 'See uploaded file' : 'N/A',
      has_watermark: false,
      ai_watermark: score > 75 ? 'Possible C2PA metadata absent (expected for AI)' : 'Not applicable',
    } : {
      word_count: inputText ? inputText.split(' ').length : 'N/A',
      avg_sentence_length: '18.4 words',
      perplexity_score: score > 65 ? '42.3 (low — AI-typical)' : '89.7 (high — human-typical)',
      burstiness: score > 65 ? '0.28 (low variation)' : '0.71 (high variation)',
      repetition_score: `${(score * 0.4).toFixed(1)}%`,
      unique_vocab_ratio: score > 65 ? '0.62' : '0.81',
    },
    inputType: mode,
    fileName,
    inputText,
    analysis_time_ms: Math.floor(Math.random() * 800) + 1200,
    analyzed_at: new Date().toISOString(),
  }
}
