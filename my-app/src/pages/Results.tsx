import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Cell,
} from 'recharts'
import type { SimulateResponse } from '../api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dollarFormatter = (value: any) => [`$${value}`, '']

function Results() {
  const navigate = useNavigate()

  const data: SimulateResponse | null = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('simResults')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  if (!data || !data.results) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">📊</p>
          <h1 className="text-2xl font-bold text-white">No Simulation Results</h1>
          <p className="text-slate-400 mt-2">Run a simulation first to see results here.</p>
          <button
            onClick={() => navigate('/simulation')}
            className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-white font-semibold transition cursor-pointer"
          >
            ← Go to Simulator
          </button>
        </div>
      </main>
    )
  }

  const { current, proposed, comparison } = data.results
  const isGood = comparison.recommendation === 'RECOMMENDED'

  // Data for the comparison bar chart
  const comparisonBarData = [
    {
      metric: 'Avg Revenue',
      Current: Math.round(current.revenue.mean),
      Proposed: Math.round(proposed.revenue.mean),
    },
    {
      metric: 'Avg Profit',
      Current: Math.round(current.profit.mean),
      Proposed: Math.round(proposed.profit.mean),
    },
    {
      metric: 'Staff Cost',
      Current: data.current_state.staff * 150,
      Proposed: data.proposed_state.staff * 150,
    },
  ]

  // Data for wait time comparison
  const waitData = [
    { metric: 'Avg Wait (min)', Current: +current.wait_time.mean.toFixed(1), Proposed: +proposed.wait_time.mean.toFixed(1) },
    { metric: 'Max Wait (min)', Current: +current.wait_time.max.toFixed(1), Proposed: +proposed.wait_time.max.toFixed(1) },
    { metric: 'Avg Lost Customers', Current: +current.customer_loss.mean.toFixed(1), Proposed: +proposed.customer_loss.mean.toFixed(1) },
  ]

  // Profit distribution (for area/heatmap chart)
  const percentiles = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
  const distributionData = percentiles.map((p, i) => ({
    percentile: `${p}%`,
    Current: Math.round(current.distribution.profits[i] ?? 0),
    Proposed: Math.round(proposed.distribution.profits[i] ?? 0),
  }))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Simulation Results</h1>
            <p className="text-slate-400 mt-1">
              {data.business_name} — {current.num_simulations} simulations run
            </p>
          </div>
          <button
            onClick={() => navigate('/simulation')}
            className="text-slate-400 hover:text-white transition text-sm cursor-pointer"
          >
            ← Back to Simulator
          </button>
        </div>

        {/* Recommendation Banner */}
        <div
          className={`rounded-2xl border p-6 mb-8 ${
            isGood
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">{isGood ? '✅' : '⚠️'}</span>
            <div>
              <h2 className={`text-xl font-bold ${isGood ? 'text-green-400' : 'text-amber-400'}`}>
                {isGood ? 'Change Recommended' : 'Proceed with Caution'}
              </h2>
              <p className="text-slate-300 mt-1">
                Changing from <strong>${data.current_state.price.toFixed(2)}</strong> / <strong>{data.current_state.staff} staff</strong> to{' '}
                <strong className="text-cyan-400">${data.proposed_state.price.toFixed(2)}</strong> /{' '}
                <strong className="text-cyan-400">{data.proposed_state.staff} staff</strong>
              </p>
              <p className="text-slate-400 mt-2 text-sm">
                Profit {comparison.profit_change >= 0 ? 'increases' : 'decreases'} by{' '}
                <strong className={comparison.profit_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${Math.abs(comparison.profit_change).toFixed(2)}/day
                </strong>{' '}
                ({comparison.profit_change_percent >= 0 ? '+' : ''}
                {comparison.profit_change_percent.toFixed(1)}%)
                • Confidence: <strong>{proposed.profit.positive_probability.toFixed(0)}%</strong> chance of profit
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Avg Daily Profit',
              current: `$${current.profit.mean.toFixed(0)}`,
              proposed: `$${proposed.profit.mean.toFixed(0)}`,
              good: proposed.profit.mean > current.profit.mean,
            },
            {
              label: 'Avg Daily Revenue',
              current: `$${current.revenue.mean.toFixed(0)}`,
              proposed: `$${proposed.revenue.mean.toFixed(0)}`,
              good: proposed.revenue.mean > current.revenue.mean,
            },
            {
              label: 'Avg Wait Time',
              current: `${current.wait_time.mean.toFixed(1)} min`,
              proposed: `${proposed.wait_time.mean.toFixed(1)} min`,
              good: proposed.wait_time.mean < current.wait_time.mean,
            },
            {
              label: 'Customers Lost/Day',
              current: current.customer_loss.mean.toFixed(1),
              proposed: proposed.customer_loss.mean.toFixed(1),
              good: proposed.customer_loss.mean < current.customer_loss.mean,
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <p className="text-xs text-slate-500 mb-2">{kpi.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-slate-400 text-sm line-through">{kpi.current}</span>
                <span className="text-lg font-bold text-white">→</span>
                <span className={`text-lg font-bold ${kpi.good ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.proposed}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue & Profit comparison */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <h3 className="text-white font-semibold mb-4">💰 Revenue & Profit Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonBarData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={dollarFormatter}
                />
                <Legend />
                <Bar dataKey="Current" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Proposed" radius={[4, 4, 0, 0]}>
                  {comparisonBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.Proposed >= entry.Current ? '#22d3ee' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Wait Time & Customer Loss */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
            <h3 className="text-white font-semibold mb-4">⏱️ Service Quality Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waitData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="Current" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Proposed" radius={[4, 4, 0, 0]}>
                  {waitData.map((entry, index) => (
                    <Cell key={index} fill={entry.Proposed <= entry.Current ? '#34d399' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Distribution Chart — the "Probability Cloud" */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 mb-8">
          <h3 className="text-white font-semibold mb-2">📈 Profit Probability Distribution</h3>
          <p className="text-slate-500 text-sm mb-4">
            Each point shows the profit at that percentile across {current.num_simulations} simulated days.
            The gap between lines is your potential gain or risk.
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="percentile" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={dollarFormatter}
              />
              <Legend />
              <Area type="monotone" dataKey="Current" stroke="#64748b" fill="#64748b" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Proposed" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Insight Box */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 mb-8">
          <h3 className="text-white font-semibold mb-3">🎯 Risk Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Worst-Case Profit</p>
              <p className={`text-xl font-bold mt-1 ${proposed.profit.min >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${proposed.profit.min.toFixed(0)}/day
              </p>
              <p className="text-xs text-slate-500 mt-1">10th percentile: ${proposed.profit.p10.toFixed(0)}</p>
            </div>
            <div className="rounded-xl bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Best-Case Profit</p>
              <p className="text-xl font-bold mt-1 text-green-400">${proposed.profit.max.toFixed(0)}/day</p>
              <p className="text-xs text-slate-500 mt-1">90th percentile: ${proposed.profit.p90.toFixed(0)}</p>
            </div>
            <div className="rounded-xl bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Customer Loss Risk</p>
              <p className={`text-xl font-bold mt-1 ${proposed.customer_loss.loss_probability < 10 ? 'text-green-400' : 'text-amber-400'}`}>
                {proposed.customer_loss.loss_probability.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Chance of losing &gt;5 customers/day</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/simulation')}
            className="rounded-xl border border-slate-600 bg-slate-800/60 hover:bg-slate-700 px-6 py-3 text-white font-semibold transition cursor-pointer"
          >
            ← Try Another Scenario
          </button>
        </div>
      </div>
    </main>
  )
}

export default Results