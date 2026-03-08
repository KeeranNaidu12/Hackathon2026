import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { healthCheck } from '../api'

type TemplateKey = 'cafe' | 'restaurant' | 'retail' | 'gym' | 'salon'

type Template = {
  id: TemplateKey
  icon: string
  name: string
  description: string
  avgPrice: number
  customersPerDay: number
  staff: number
}

const templates: Template[] = [
  {
    id: 'cafe',
    icon: '☕',
    name: 'Cafe',
    description: 'Coffee shops, bakeries, and casual beverage spots',
    avgPrice: 5,
    customersPerDay: 120,
    staff: 2,
  },
  {
    id: 'restaurant',
    icon: '🍔',
    name: 'Restaurant',
    description: 'Full-service or quick-service dining businesses',
    avgPrice: 18,
    customersPerDay: 80,
    staff: 5,
  },
  {
    id: 'retail',
    icon: '🛍',
    name: 'Retail Store',
    description: 'Clothing, gifts, electronics, and local shops',
    avgPrice: 40,
    customersPerDay: 60,
    staff: 3,
  },
  {
    id: 'gym',
    icon: '🏋',
    name: 'Gym',
    description: 'Fitness studios, training centers, and wellness clubs',
    avgPrice: 30,
    customersPerDay: 50,
    staff: 4,
  },
  {
    id: 'salon',
    icon: '💇',
    name: 'Salon',
    description: 'Hair, beauty, spa, and personal care businesses',
    avgPrice: 50,
    customersPerDay: 25,
    staff: 2,
  },
]

function Landing() {
  const navigate = useNavigate()
  const [backendUp, setBackendUp] = useState<boolean | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])

  useEffect(() => {
    healthCheck().then(setBackendUp)
  }, [])

  const handleLaunch = () => {
    navigate('/simulation', {
      state: {
        businessType: selectedTemplate.id,
        businessName: selectedTemplate.name,
        avgPrice: selectedTemplate.avgPrice,
        customersPerDay: selectedTemplate.customersPerDay,
        staff: selectedTemplate.staff,
      },
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          AI-Powered Business Intelligence
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          What-If
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> Simulator</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Your business&apos;s <strong className="text-white">Digital Twin</strong>.
          Simulate pricing changes, staffing decisions, and growth scenarios
          before committing a single dollar.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['Monte Carlo Simulation', 'SimPy Engine', 'AI Natural Language', 'Risk Analysis'].map((f) => (
            <span
              key={f}
              className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Industry templates */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Choose Your Business Type
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Start with a template and load realistic default assumptions for your simulation.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {templates.map((template) => {
              const isSelected = selectedTemplate.id === template.id

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="text-3xl">{template.icon}</div>
                  <h3 className="mt-3 text-white font-semibold text-lg">{template.name}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {template.description}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Dynamic demo business card */}
        <div className="mt-10 mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur p-6 text-left">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            {selectedTemplate.icon} {selectedTemplate.name} Template
          </h3>
          <p className="mt-2 text-sm text-slate-400">{selectedTemplate.description}</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">
                ${selectedTemplate.avgPrice.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Avg Price</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">
                {selectedTemplate.customersPerDay}
              </p>
              <p className="text-xs text-slate-400 mt-1">Customers/Day</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">{selectedTemplate.staff}</p>
              <p className="text-xs text-slate-400 mt-1">Staff</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLaunch}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer"
        >
          Launch {selectedTemplate.name} Simulator →
        </button>

        <div className="mt-6 text-sm">
          {backendUp === null && <span className="text-slate-500">Checking backend...</span>}
          {backendUp === true && (
            <span className="text-green-400">✓ Backend connected (localhost:8000)</span>
          )}
          {backendUp === false && (
            <span className="text-amber-400">
              ⚠ Backend offline — run:{' '}
              <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">
                cd backend && uvicorn main:app --reload
              </code>
            </span>
          )}
        </div>
      </div>
    </main>
  )
}

export default Landing