import { useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  type BusinessState,
  type ChatResponse,
  type SimulateResponse,
  type CSVUploadResponse,
  runSimulation,
  sendChat,
  uploadCSV,
} from '../api'

type TemplateState = {
  businessType?: string
  businessName?: string
  avgPrice?: number
  customersPerDay?: number
  staff?: number
}

function Simulator() {
  const navigate = useNavigate()
  const location = useLocation()
  const templateState = (location.state as TemplateState | null) ?? null

  const initialPrice = templateState?.avgPrice ?? 5.0
  const initialStaff = templateState?.staff ?? 2
  const initialOperatingHours = 8.0
  const initialCustomersPerHour = templateState?.customersPerDay
    ? Math.max(1, Math.round(templateState.customersPerDay / initialOperatingHours))
    : 15
  const initialBusinessName = templateState?.businessName ?? 'My Business'

  // Step 1 = CSV upload gate, Step 2 = full simulator
  const [step, setStep] = useState<'upload' | 'simulate'>('upload')

  // Business state (filled from CSV or defaults)
  const [price, setPrice] = useState(initialPrice)
  const [staff, setStaff] = useState(initialStaff)
  const [customersPerHour, setCustomersPerHour] = useState(initialCustomersPerHour)
  const [demandStdDev, setDemandStdDev] = useState(3.0)
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours)
  const [businessName, setBusinessName] = useState(initialBusinessName)

  // Proposed changes
  const [newPrice, setNewPrice] = useState(
    Math.round(initialPrice * 1.1 * 100) / 100
  )
  const [newStaff, setNewStaff] = useState(initialStaff + 1)
  const [newOperatingHours, setNewOperatingHours] = useState(initialOperatingHours)

  // CSV upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvResult, setCsvResult] = useState<CSVUploadResponse | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  // AI Chat
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([])

  // Simulation loading
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const businessState: BusinessState = {
    name: businessName,
    price,
    staff_count: staff,
    customers_per_hour: customersPerHour,
    demand_std_dev: demandStdDev,
    operating_hours: operatingHours,
    staff_cost_per_day: staff * 150,
  }

  // ── CSV upload handler ────────────────────────────────────────────────────
  const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvLoading(true)
    setCsvError(null)
    setCsvResult(null)
    try {
      const result = await uploadCSV(file)
      setCsvResult(result)
      // Pre-fill parameters from CSV
      setPrice(result.avg_price)
      setNewPrice(Math.round((result.avg_price * 1.1) * 100) / 100)
      setCustomersPerHour(result.customers_per_hour)
      setDemandStdDev(result.customers_std_dev ?? 3.0)
      setOperatingHours(result.avg_operating_hours ?? 8.0)
      setNewOperatingHours(result.avg_operating_hours ?? 8.0)
      setStaff(result.staff_count)
      setNewStaff(result.staff_count)
      if (result.business_name) setBusinessName(result.business_name)
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV.')
    } finally {
      setCsvLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  // ── Simulation helpers ────────────────────────────────────────────────────
  const simulateProgress = () => {
    setProgress(0)
    const steps = [10, 25, 40, 55, 70, 82, 90, 95]
    steps.forEach((val, i) => setTimeout(() => setProgress(val), (i + 1) * 200))
  }

  const handleRunSimulation = useCallback(async () => {
    setLoading(true); setError(null); simulateProgress()
    try {
      const result: SimulateResponse = await runSimulation({
        current: businessState,
        new_price: newPrice,
        new_staff: newStaff,
        new_operating_hours: newOperatingHours,
        num_simulations: 500,
      })
      setProgress(100)
      setTimeout(() => {
        sessionStorage.setItem('simResults', JSON.stringify(result))
        navigate('/results')
      }, 400)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend. Is it running on localhost:8000?')
      setLoading(false); setProgress(0)
    }
  }, [businessState, newPrice, newStaff, navigate])

  const handleChat = useCallback(async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setChatInput(''); setLoading(true); setError(null); simulateProgress()
    try {
      const result: ChatResponse = await sendChat({ message: userMsg, business_state: businessState })
      setProgress(100)
      if (result.proposed_changes.price > 0) setNewPrice(Math.round(result.proposed_changes.price * 100) / 100)
      if (result.proposed_changes.staff > 0) setNewStaff(result.proposed_changes.staff)
      setChatMessages((prev) => [...prev, { role: 'ai', text: result.insight }])
      sessionStorage.setItem('simResults', JSON.stringify({
        success: true,
        business_name: businessState.name,
        current_state: { price, staff },
        proposed_state: { price: result.proposed_changes.price, staff: result.proposed_changes.staff },
        results: result.simulation_results,
      }))
      setLoading(false); setProgress(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend.')
      setChatMessages((prev) => [...prev, { role: 'ai', text: '❌ Could not reach the simulation backend. Make sure it is running.' }])
      setLoading(false); setProgress(0)
    }
  }, [chatInput, businessState, price, staff])

  // ── STEP 1: CSV Upload Gate ───────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="mx-auto max-w-2xl w-full">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm mb-8 block transition">
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">Upload Your Sales Data</h1>
          <p className="text-slate-400 mb-8">
            We'll read your CSV and automatically set the simulation parameters based on your real business data.
          </p>

          {/* Drop zone */}
          <label
            htmlFor="csv-upload-gate"
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer p-12"
          >
            <div className="text-5xl">{csvLoading ? '⏳' : '📂'}</div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {csvLoading ? 'Parsing your data...' : 'Drop your CSV here, or click to browse'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Columns like <code className="bg-slate-700 px-1 rounded">avg_item_price</code>,{' '}
                <code className="bg-slate-700 px-1 rounded">customers_served</code>,{' '}
                <code className="bg-slate-700 px-1 rounded">staff_on_shift</code> are auto-detected
              </p>
            </div>
            <input
              ref={fileInputRef}
              id="csv-upload-gate"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>

          {csvError && (
            <p className="mt-4 text-red-400 text-sm bg-red-400/10 rounded-xl p-3">✗ CSV failed to upload. Please check your file and try again.</p>
          )}

          {csvResult && (
            <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 px-6 py-4">
              <p className="text-green-400 font-semibold">✓ CSV successfully uploaded</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep('simulate')}
              disabled={csvLoading || !csvResult}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 px-6 py-3 text-white font-semibold transition cursor-pointer disabled:cursor-not-allowed"
            >
              Start Simulation with This Data →
            </button>
            <a
              href="http://localhost:8000/download-sample/pandosy_pastries_sample.csv"
              download="pandosy_pastries_sample.csv"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-slate-300 hover:text-white text-sm font-medium transition"
            >
              ⬇ Download Sample CSV
            </a>
          </div>

        </div>
      </main>
    )
  }

  // ── STEP 2: Full Simulator ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">☕ {businessName}</h1>
            <p className="text-slate-400 mt-1">
              Digital Twin Simulator
              {csvResult && (
                <span className="ml-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                  📂 {csvResult.rows_loaded} rows loaded
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="text-slate-400 hover:text-white transition text-sm cursor-pointer"
            >
              ← Change Data
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition text-sm cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 flex flex-col gap-5">

            {/* Current State */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">Current State</h2>
                {csvResult && (
                  <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">From CSV</span>
                )}
              </div>

              {csvResult ? (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Price',        value: `$${price.toFixed(2)}` },
                    { label: 'Staff',        value: `${staff}` },
                    { label: 'Cust / hr',   value: `${customersPerHour}` },
                    { label: 'Open hrs',    value: `${operatingHours.toFixed(1)}h` },
                  ]).map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-slate-700/50 border border-slate-700 px-3 py-3">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="text-white font-bold text-lg font-mono">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {([
                    { label: 'Price',             val: `$${price.toFixed(2)}`,  input: <input type="range" min={2}  max={10} step={0.25} value={price}           onChange={(e) => setPrice(parseFloat(e.target.value))}           className="w-full accent-blue-500" /> },
                    { label: 'Staff Count',        val: `${staff}`,              input: <input type="range" min={1}  max={8}  step={1}    value={staff}           onChange={(e) => setStaff(parseInt(e.target.value))}             className="w-full accent-blue-500" /> },
                    { label: 'Customers / Hour',   val: `${customersPerHour}`,   input: <input type="range" min={5}  max={40} step={1}    value={customersPerHour}onChange={(e) => setCustomersPerHour(parseInt(e.target.value))}  className="w-full accent-blue-500" /> },
                    { label: 'Opening Hours / Day',val: `${operatingHours}h`,    input: <input type="range" min={1}  max={16} step={0.5}  value={operatingHours}  onChange={(e) => setOperatingHours(parseFloat(e.target.value))}  className="w-full accent-blue-500" /> },
                  ]).map(({ label, val, input }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white font-mono">{val}</span>
                      </div>
                      {input}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-700" />

            {/* What-If Scenario */}
            <div>
              <h2 className="text-base font-semibold text-white mb-3">What-If Scenario</h2>
              <div className="space-y-4">

                {/* Price */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">Price</span>
                    <div className="flex items-center gap-2">
                      {newPrice !== price && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                          newPrice > price ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        }`}>{newPrice > price ? '+' : ''}{(newPrice - price).toFixed(2)}</span>
                      )}
                      <span className="text-cyan-400 font-mono text-sm">${newPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <input type="range" min={2} max={10} step={0.25} value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500" />
                </div>

                {/* Staff */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">Staff Count</span>
                    <div className="flex items-center gap-2">
                      {newStaff !== staff && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                          newStaff > staff ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        }`}>{newStaff > staff ? '+' : ''}{newStaff - staff}</span>
                      )}
                      <span className="text-cyan-400 font-mono text-sm">{newStaff}</span>
                    </div>
                  </div>
                  <input type="range" min={1} max={8} step={1} value={newStaff}
                    onChange={(e) => setNewStaff(parseInt(e.target.value))}
                    className="w-full accent-cyan-500" />
                </div>

                {/* Opening hours */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400">Opening Hours / Day</span>
                    <div className="flex items-center gap-2">
                      {newOperatingHours !== operatingHours && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                          newOperatingHours > operatingHours ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        }`}>{newOperatingHours > operatingHours ? '+' : ''}{(newOperatingHours - operatingHours).toFixed(1)}h</span>
                      )}
                      <span className="text-cyan-400 font-mono text-sm">{newOperatingHours}h</span>
                    </div>
                  </div>
                  <input type="range" min={1} max={16} step={0.5} value={newOperatingHours}
                    onChange={(e) => setNewOperatingHours(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500" />
                </div>

              </div>
            </div>

            {/* Run button */}
            <button onClick={handleRunSimulation} disabled={loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 px-6 py-3.5 text-white font-semibold transition cursor-pointer disabled:cursor-not-allowed">
              {loading ? 'Running...' : 'Run Simulation →'}
            </button>

            {loading && (
              <div className="-mt-2">
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1 text-center">{progress}% — simulating 500 days</p>
              </div>
            )}

            {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">{error}</p>}
          </div>

          {/* MIDDLE + RIGHT: AI Chat */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">💬 AI Business Advisor</h2>

            <div className="flex-1 min-h-75 max-h-125 overflow-y-auto space-y-3 mb-4 pr-1">
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
                      <button key={suggestion} onClick={() => setChatInput(suggestion)}
                        className="rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500 hover:text-blue-400 transition cursor-pointer">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`rounded-xl p-4 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'ml-auto bg-blue-600/20 border border-blue-500/30 text-blue-100'
                    : 'mr-auto bg-slate-700/50 border border-slate-600 text-slate-200'
                }`}>
                  <p className="text-xs font-semibold mb-1 opacity-60">{msg.role === 'user' ? 'You' : '🤖 AI Advisor'}</p>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input type="text" value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder='Try: "What if I raise my prices to $5.50?"'
                className="flex-1 rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 ring-blue-500/50 transition" />
              <button onClick={handleChat} disabled={loading || !chatInput.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 px-6 py-3 text-white font-semibold transition cursor-pointer disabled:cursor-not-allowed">
                Send
              </button>
            </div>

            {chatMessages.some((m) => m.role === 'ai') && (
              <button onClick={() => navigate('/results')}
                className="mt-4 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-6 py-3 text-cyan-400 font-semibold transition cursor-pointer">
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
