import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type BusinessState,
  type ChatResponse,
  type SimulateResponse,
  runSimulation,
  sendChat,
} from '../api'

function Simulator() {
  const navigate = useNavigate()

  // Business state (sliders)
  const [price, setPrice] = useState(5.0)
  const [staff, setStaff] = useState(2)
  const [customersPerHour, setCustomersPerHour] = useState(15)

  // Proposed changes
  const [newPrice, setNewPrice] = useState(5.5)
  const [newStaff, setNewStaff] = useState(3)

  // AI Chat
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([])

  // Loading / results
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const businessState: BusinessState = {
    name: 'Pandosy Pastries',
    price,
    staff_count: staff,
    customers_per_hour: customersPerHour,
    staff_cost_per_day: 150,
  }

  // Fake progress bar for "running 500 simulations" effect
  const simulateProgress = () => {
    setProgress(0)
    const steps = [10, 25, 40, 55, 70, 82, 90, 95]
    steps.forEach((val, i) => {
      setTimeout(() => setProgress(val), (i + 1) * 200)
    })
  }

  // Run simulation from sliders
  const handleRunSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    simulateProgress()
    try {
      const result: SimulateResponse = await runSimulation({
        current: businessState,
        new_price: newPrice,
        new_staff: newStaff,
        num_simulations: 500,
      })
      setProgress(100)
      setTimeout(() => {
        // Pass data to Results page via sessionStorage
        sessionStorage.setItem('simResults', JSON.stringify(result))
        navigate('/results')
      }, 400)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend. Is it running on localhost:8000?')
      setLoading(false)
      setProgress(0)
    }
  }, [businessState, newPrice, newStaff, navigate])

  // Run simulation from AI chat
  const handleChat = useCallback(async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setChatInput('')
    setLoading(true)
    setError(null)
    simulateProgress()
    try {
      const result: ChatResponse = await sendChat({
        message: userMsg,
        business_state: businessState,
      })
      setProgress(100)

      // Update sliders to match what the AI parsed
      if (result.proposed_changes.price > 0) setNewPrice(Math.round(result.proposed_changes.price * 100) / 100)
      if (result.proposed_changes.staff > 0) setNewStaff(result.proposed_changes.staff)

      setChatMessages((prev) => [...prev, { role: 'ai', text: result.insight }])

      // Store full results for the Results page
      sessionStorage.setItem(
        'simResults',
        JSON.stringify({
          success: true,
          business_name: businessState.name,
          current_state: { price, staff },
          proposed_state: {
            price: result.proposed_changes.price,
            staff: result.proposed_changes.staff,
          },
          results: result.simulation_results,
        })
      )
      setLoading(false)
      setProgress(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend.')
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: '❌ Could not reach the simulation backend. Make sure it is running.' },
      ])
      setLoading(false)
      setProgress(0)
    }
  }, [chatInput, businessState, price, staff])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">☕ Pandosy Pastries</h1>
            <p className="text-slate-400 mt-1">Digital Twin Simulator</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition text-sm cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Current State */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">📊 Current State</h2>

            <div className="space-y-5">
              {/* Price slider */}
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Coffee Price</span>
                  <span className="text-white font-mono">${price.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={0.25}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Staff slider */}
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Staff Count</span>
                  <span className="text-white font-mono">{staff}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={staff}
                  onChange={(e) => setStaff(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Customers slider */}
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Customers / Hour</span>
                  <span className="text-white font-mono">{customersPerHour}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={customersPerHour}
                  onChange={(e) => setCustomersPerHour(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-700 my-5" />

            <h2 className="text-lg font-semibold text-white mb-4">🔮 Proposed Changes</h2>
            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>New Price</span>
                  <span className="text-cyan-400 font-mono">${newPrice.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={0.25}
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>New Staff Count</span>
                  <span className="text-cyan-400 font-mono">{newStaff}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={newStaff}
                  onChange={(e) => setNewStaff(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 px-6 py-3 text-white font-semibold transition cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Running Simulation...' : 'Run Simulation →'}
            </button>

            {/* Progress bar */}
            {loading && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  Simulating 500 business days... {progress}%
                </p>
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-400 bg-red-400/10 rounded-lg p-3">{error}</p>
            )}
          </div>

          {/* MIDDLE + RIGHT: AI Chat */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">💬 AI Business Advisor</h2>
            <p className="text-slate-500 text-sm mb-4">
              Ask in plain English: "What if I raise my prices to $5.50?" or "Should I hire another barista?"
            </p>

            {/* Chat messages */}
            <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto space-y-3 mb-4 pr-1">
              {chatMessages.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🤖</p>
                  <p className="text-slate-500">Ask me anything about your business decisions.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      "What if I raise prices to $5.50?",
                      "Should I hire another barista?",
                      "What if I add 2 more staff?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setChatInput(suggestion)}
                        className="rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500 hover:text-blue-400 transition cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'ml-auto bg-blue-600/20 border border-blue-500/30 text-blue-100'
                      : 'mr-auto bg-slate-700/50 border border-slate-600 text-slate-200'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-60">
                    {msg.role === 'user' ? 'You' : '🤖 AI Advisor'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder='Try: "What if I raise my prices to $5.50?"'
                className="flex-1 rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 ring-blue-500/50 transition"
              />
              <button
                onClick={handleChat}
                disabled={loading || !chatInput.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 px-6 py-3 text-white font-semibold transition cursor-pointer disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>

            {/* View Results button (only if results exist) */}
            {chatMessages.some((m) => m.role === 'ai') && (
              <button
                onClick={() => navigate('/results')}
                className="mt-4 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-6 py-3 text-cyan-400 font-semibold transition cursor-pointer"
              >
                📊 View Full Results Dashboard →
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Simulator
