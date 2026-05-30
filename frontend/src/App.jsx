import { useState } from 'react'
import HomePage from './pages/HomePage'
import AnalyzePage from './pages/AnalyzePage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  const [page, setPage] = useState('home')
  const [results, setResults] = useState(null)
  const [theme, setTheme] = useState('dark')

  const navigate = (p, data = null) => {
    if (data) setResults(data)
    setPage(p)
    window.scrollTo(0, 0)
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-[#080c14] text-white font-body transition-colors duration-300">
        {page === 'home' && <HomePage navigate={navigate} theme={theme} setTheme={setTheme} />}
        {page === 'analyze' && <AnalyzePage navigate={navigate} theme={theme} setTheme={setTheme} />}
        {page === 'results' && <ResultsPage results={results} navigate={navigate} theme={theme} setTheme={setTheme} />}
      </div>
    </div>
  )
}
