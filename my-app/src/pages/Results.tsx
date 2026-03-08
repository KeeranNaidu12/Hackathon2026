import { useNavigate } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { fetchPriceSensitivity, fetchProfitHeatmap } from '../api'
import type { SimulateResponse } from '../api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dollarFormatter = (value: any) => [`$${value}`, '']

function Results() {
  const navigate = useNavigate()
  const [sensitivityData, setSensitivityData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [heatmapBest, setHeatmapBest] = useState<any | null>(null)

  const data: SimulateResponse | null = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('simResults')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadSensitivity = async () => {
      if (!data) return

      try {
        const sensitivity = await fetchPriceSensitivity({
          business_state: {
            name: data.business_name,
            price: data.current_state.price,
            staff_count: data.current_state.staff,
            customers_per_hour: 15,
            demand_std_dev: 3.0,
            operating_hours: 8.0,
            staff_cost_per_day: 150,
          },
          start_price: 2.0,
          end_price: 8.0,
          step: 0.5,
          num_simulations: 100,
        })

        setSensitivityData(sensitivity.results.results)
      } catch (error) {
        console.error('Failed to load sensitivity data:', error)
      }
    }

    loadSensitivity()
  }, [data])

  useEffect(() => {
    const loadHeatmap = async () => {
      if (!data) return

      try {
        const heatmap = await fetchProfitHeatmap({
          business_state: {
            name: data.business_name,
            price: data.current_state.price,
            staff_count: data.current_state.staff,
            customers_per_hour: 15,
            demand_std_dev: 3.0,
            operating_hours: 8.0,
            staff_cost_per_day: 150,
          },
          min_staff: 1,
          max_staff: 5,
          start_price: 2.0,
          end_price: 8.0,
          step: 1.0,
          num_simulations: 50,
        })

        setHeatmapData(heatmap.results.cells)
        setHeatmapBest(heatmap.results.best_cell)
      } catch (error) {
        console.error('Failed to load heatmap data:', error)
      }
    }

    loadHeatmap()
  }, [data])

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

  const waitData = [
    {
      metric: 'Avg Wait (min)',
      Current: +current.wait_time.mean.toFixed(1),
      Proposed: +proposed.wait_time.mean.toFixed(1),
    },
    {
      metric: 'Max Wait (min)',
      Current: +current.wait_time.max.toFixed(1),
      Proposed: +proposed.wait_time.max.toFixed(1),
    },
    {
      metric: 'Avg Lost Customers',
      Current: +current.customer_loss.mean.toFixed(1),
      Proposed: +proposed.customer_loss.mean.toFixed(1),
    },
  ]

  const percentiles = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
  const distributionData = percentiles.map((p, i) => ({
    percentile: `${p}%`,
    Current: Math.round(current.distribution.profits[i] ?? 0),
    Proposed: Math.round(proposed.distribution.profits[i] ?? 0),
  }))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
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
                Changing from <strong>${data.current_state.price.toFixed(2)}</strong> /{' '}
                <strong>{data.current_state.staff} staff</strong> to{' '}
                <strong className="text-cyan-400">${data.proposed_state.price.toFixed(2)}</strong> /{' '}
                <strong className="text-cyan-400">{data.proposed_state.staff} staff</strong>
              </p>
              <p className="text-slate-400 mt-2 text-sm">
                Profit {comparison.profit_change >= 0 ? 'increases' : 'decreases'} by{' '}
                <strong className={comparison.profit_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${Math.abs(comparison.profit_change).toFixed(2)}/day
                </strong>{' '}
                ({comparison.profit_change_percent >= 0 ? '+' : ''}
                {comparison.profit_change_percent.toFixed(1)}%) • Confidence:{' '}
                <strong>{proposed.profit.positive_probability.toFixed(0)}%</strong> chance of profit
              </p>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {sensitivityData.length > 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 mb-8">
            <h3 className="text-white font-semibold mb-2">💡 Price Sensitivity Analysis</h3>
            <p className="text-slate-500 text-sm mb-4">
              Average daily profit across different price points, holding staffing constant.
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={sensitivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="price"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v: number) => `$${Math.round(v)}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => [`$${Number(value).toFixed(0)}`, 'Avg Profit']}
                  labelFormatter={(label) => `Price: $${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_profit"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Avg Daily Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {heatmapData.length > 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 mb-8">
            <h3 className="text-white font-semibold mb-2">🟪 Profit Heatmap: Price × Staff</h3>
            <p className="text-slate-500 text-sm mb-4">
              Color shows average daily profit for each price and staffing combination.
            </p>

            {heatmapBest && (
              <div className="mb-4 rounded-xl bg-slate-700/50 p-4">
                <p className="text-sm text-slate-400">Best Combination</p>
                <p className="text-white font-semibold mt-1">
                  Price ${heatmapBest.price} with {heatmapBest.staff} staff
                </p>
                <p className="text-green-400 text-sm mt-1">
                  Avg Profit: ${Math.round(heatmapBest.avg_profit)}/day
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: '80px repeat(7, minmax(60px, 1fr))' }}
              >
                <div></div>
                {[2, 3, 4, 5, 6, 7, 8].map((price) => (
                  <div key={price} className="text-center text-xs text-slate-400">
                    ${price}
                  </div>
                ))}

                {[1, 2, 3, 4, 5].map((staff) => (
                  <div key={`row-${staff}`} className="contents">
                    <div className="flex items-center text-xs text-slate-400">
                      {staff} staff
                    </div>

                    {[2, 3, 4, 5, 6, 7, 8].map((price) => {
                      const cell = heatmapData.find(
                        (d) => d.staff === staff && d.price === price
                      )

                      const profit = cell?.avg_profit ?? 0

                      let bg = 'bg-slate-700'
                      if (profit > 600) bg = 'bg-green-400'
                      else if (profit > 300) bg = 'bg-green-600'
                      else if (profit > 0) bg = 'bg-yellow-500'
                      else if (profit > -300) bg = 'bg-orange-500'
                      else bg = 'bg-red-500'

                      return (
                        <div
                          key={`${staff}-${price}`}
                          className={`${bg} rounded-lg h-16 flex items-center justify-center text-xs font-medium text-white`}
                          title={`Price $${price}, Staff ${staff}, Avg Profit $${Math.round(profit)}`}
                        >
                          ${Math.round(profit)}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 mb-8">
          <h3 className="text-white font-semibold mb-3">🎯 Risk Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Worst-Case Profit</p>
              <p className={`text-xl font-bold mt-1 ${proposed.profit.min >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${proposed.profit.min.toFixed(0)}/day
              </p>
              <p className="text-xs text-slate-500 mt-1">
                10th percentile: ${proposed.profit.p10.toFixed(0)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-700/50 p-4">
              <p className="text-sm text-slate-400">Best-Case Profit</p>
              <p className="text-xl font-bold mt-1 text-green-400">
                ${proposed.profit.max.toFixed(0)}/day
              </p>
              <p className="text-xs text-slate-500 mt-1">
                90th percentile: ${proposed.profit.p90.toFixed(0)}
              </p>
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