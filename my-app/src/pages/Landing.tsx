import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { healthCheck } from '../api'

function Landing() {
  const navigate = useNavigate()
  const [backendUp, setBackendUp] = useState<boolean | null>(null)

  useEffect(() => {
    healthCheck().then(setBackendUp)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center">
        {/* Brand pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Business Intelligence
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          What-If
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> Simulator</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Your business's <strong className="text-white">Digital Twin</strong>.
          Simulate pricing changes, staffing decisions, and growth scenarios
          before committing a single dollar.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {["Monte Carlo Simulation", "SimPy Engine", "AI Natural Language", "Risk Analysis"].map((f) => (
            <span key={f} className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300">
              {f}
            </span>
          ))}
        </div>

        {/* Demo business card */}
        <div className="mt-10 mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur p-6 text-left">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">☕ Pandosy Pastries</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">$5.00</p>
              <p className="text-xs text-slate-400 mt-1">Avg Price</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">120</p>
              <p className="text-xs text-slate-400 mt-1">Customers/Day</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">2</p>
              <p className="text-xs text-slate-400 mt-1">Staff</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate('/simulation')}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer"
        >
          Launch Simulator →
        </button>

        {/* Backend status */}
        <div className="mt-6 text-sm">
          {backendUp === null && <span className="text-slate-500">Checking backend...</span>}
          {backendUp === true && <span className="text-green-400">✓ Backend connected (localhost:8000)</span>}
          {backendUp === false && (
            <span className="text-amber-400">
              ⚠ Backend offline — run: <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">cd backend && uvicorn main:app --reload</code>
            </span>
          )}
        </div>
      </div>
    </main>
  )
}

export default Landing