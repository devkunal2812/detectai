import { useState, useEffect } from 'react'

export default function Navbar({ navigate, theme, setTheme, currentPage }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'py-3' : 'py-5'
    }`}>
      <div className={`mx-auto max-w-7xl px-6 flex items-center justify-between transition-all duration-300 ${
        scrolled ? 'bg-[rgba(8,12,20,0.9)] backdrop-blur-xl border border-[rgba(99,180,255,0.08)] rounded-2xl shadow-2xl' : ''
      }`} style={scrolled ? {padding: '12px 24px'} : {}}>
        
        {/* Logo */}
        <button onClick={() => navigate('home')} className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="10" cy="10" r="3" fill="white"/>
                <circle cx="10" cy="4" r="1.5" fill="white" opacity="0.6"/>
                <circle cx="16" cy="8" r="1" fill="white" opacity="0.4"/>
                <circle cx="16" cy="13" r="1" fill="white" opacity="0.4"/>
              </svg>
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Detect</span>
            <span className="gradient-text">AI</span>
          </span>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Home', page: 'home' },
            { label: 'Analyze', page: 'analyze' },
          ].map(({ label, page }) => (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-[rgba(59,130,246,0.15)] text-blue-400'
                  : 'text-[#8ba3c4] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg border border-[rgba(99,180,255,0.1)] flex items-center justify-center text-[#8ba3c4] hover:text-white hover:border-[rgba(99,180,255,0.25)] transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button onClick={() => navigate('analyze')} className="btn-primary text-sm px-5 py-2.5">
            Try Free
          </button>
        </div>
      </div>
    </nav>
  )
}
