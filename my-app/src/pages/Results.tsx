import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Cell,
} from 'recharts'
import type { CompareResponse, ScenarioResult, StatsDist } from '../api'
import { CoffeeCup, MatchaLatte, theme } from '../components/Illustrations'

const fmt$ = (v: number) => `$${Math.round(v).toLocaleString()}`
const fmt1 = (v: number) => v.toFixed(1)
const fmtΔ = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

const TOOLTIP = {
  contentStyle: { backgroundColor: theme.white, border: `2px solid ${theme.border}`, borderRadius: 16, fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: theme.text },
  labelStyle: { color: theme.textMuted },
  cursor: { fill: `${theme.brownLight}11` },
}

function KpiCard({ label, emoji, baseline, scenario, format, lowerIsBetter = false }: {
  label: string; emoji: string; baseline: number; scenario: number
  format: (v: number) => string; lowerIsBetter?: boolean
}) {
  const delta = scenario - baseline
  const pct = baseline !== 0 ? (delta / Math.abs(baseline)) * 100 : 0
  const good = lowerIsBetter ? delta < 0 : delta > 0
  const neutral = Math.abs(pct) < 0.5

  return (
    <div style={{ background: theme.white, borderRadius: 22, padding: '18px 16px', border: `2px solid ${theme.border}`, boxShadow: '0 3px 12px rgba(139,94,60,0.06)' }}>
      <p style={{ fontSize: '0.72rem', color: theme.textLight, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 10 }}>
        {emoji} {label.toUpperCase()}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: theme.textLight, marginBottom: 2 }}>Before</p>
          <p style={{ fontWeight: 800, color: theme.textMuted, fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif" }}>{format(baseline)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.7rem', color: theme.textLight, marginBottom: 2 }}>After</p>
          <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.1rem', color: neutral ? theme.text : good ? theme.matchaDark : '#e74c3c' }}>
            {format(scenario)}
          </p>
        </div>
      </div>
      {!neutral && (
        <div style={{ marginTop: 10, borderRadius: 10, padding: '4px 10px', background: good ? `${theme.matchaLight}` : theme.roseLight, textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: good ? theme.matchaDark : '#c0392b' }}>
            {fmtΔ(pct)} {good ? '✨' : '⚠️'}
          </span>
        </div>
      )}
    </div>
  )
}

function ProductRows({ baseline, scenario }: { baseline: ScenarioResult; scenario: ScenarioResult }) {
  const rows = useMemo(() => Object.entries(baseline.product_sales)
    .map(([name, b]) => {
      const s = scenario.product_sales[name] ?? { mean_daily_sales: 0 }
      const delta = s.mean_daily_sales - b.mean_daily_sales
      const pct = b.mean_daily_sales > 0 ? (delta / b.mean_daily_sales) * 100 : 0
      return { name, b: b.mean_daily_sales, s: s.mean_daily_sales, delta, pct }
    })
    .sort((a, b) => b.s - a.s), [baseline, scenario])

  const maxVal = Math.max(...rows.map(r => Math.max(r.b, r.s)))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 70px 70px', gap: 8, padding: '0 8px 8px', fontSize: '0.7rem', fontWeight: 800, color: theme.textLight, letterSpacing: '0.07em' }}>
        <span>PRODUCT</span><span>DAILY SALES</span><span style={{ textAlign: 'right' }}>BASE</span><span style={{ textAlign: 'right' }}>NEW</span><span style={{ textAlign: 'right' }}>Δ%</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px 70px 70px', gap: 8, alignItems: 'center', padding: '8px', borderRadius: 14, marginBottom: 4, background: i % 2 === 0 ? theme.cream : theme.white }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 12 }}>
            <div style={{ height: '100%', borderRadius: 4, background: theme.creamDark, width: `${(r.b / maxVal) * 100}%`, minWidth: 2 }} />
            <div style={{ height: '100%', borderRadius: 4, background: r.delta >= 0 ? theme.brownLight : theme.rose, width: `${(r.s / maxVal) * 100}%`, minWidth: 2 }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMuted, textAlign: 'right' }}>{r.b.toFixed(1)}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: theme.text, textAlign: 'right' }}>{r.s.toFixed(1)}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, textAlign: 'right', color: Math.abs(r.pct) < 1 ? theme.textLight : r.pct > 0 ? theme.matchaDark : '#e74c3c' }}>
            {r.pct >= 0 ? '+' : ''}{r.pct.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function DistChart({ b, s, label }: { b: StatsDist; s: StatsDist; label: string }) {
  const data = [
    { p: 'P5', baseline: Math.round(b.p5), scenario: Math.round(s.p5) },
    { p: 'P25', baseline: Math.round(b.p25 ?? b.p5), scenario: Math.round(s.p25 ?? s.p5) },
    { p: 'P50', baseline: Math.round(b.median), scenario: Math.round(s.median) },
    { p: 'P75', baseline: Math.round(b.p75 ?? b.p95), scenario: Math.round(s.p75 ?? s.p95) },
    { p: 'P95', baseline: Math.round(b.p95), scenario: Math.round(s.p95) },
  ]
  return (
    <div style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}` }}>
      <p style={{ fontWeight: 800, color: theme.text, marginBottom: 16, fontSize: '0.9rem' }}>📊 {label}</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gb_${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.creamDark} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={theme.creamDark} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id={`gs_${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.brownLight} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={theme.brownLight} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}88`} />
          <XAxis dataKey="p" stroke={theme.textLight} fontSize={11} fontFamily="Nunito" fontWeight={700} />
          <YAxis stroke={theme.textLight} fontSize={11} fontFamily="Nunito" fontWeight={700} tickFormatter={v => `$${v}`} />
          <Tooltip {...TOOLTIP} formatter={(v: any) => [`$${v}`, '']} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }} />
          <Area type="monotone" dataKey="baseline" name="Baseline" stroke={theme.textMuted} fill={`url(#gb_${label})`} strokeWidth={2} />
          <Area type="monotone" dataKey="scenario" name="Scenario" stroke={theme.brownLight} fill={`url(#gs_${label})`} strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: '☕ Overview' },
  { id: 'distribution', label: '📈 Distribution' },
  { id: 'products', label: '🧋 Products' },
  { id: 'radar', label: '🕸️ Radar' },
]

export default function Results() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const stored = useMemo(() => {
    try { const r = sessionStorage.getItem('cafeResults'); return r ? JSON.parse(r) as { result: CompareResponse; description: string } : null }
    catch { return null }
  }, [])

  if (!stored) return (
    <main style={{ minHeight: '100vh', background: theme.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <CoffeeCup size={80} /><br />
        <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.8rem', color: theme.brownDark, margin: '16px 0 8px' }}>No results yet!</p>
        <p style={{ color: theme.textMuted, marginBottom: 24 }}>Run a simulation first ☕</p>
        <button onClick={() => navigate('/simulate')} style={{ background: `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})`, color: '#fff', border: 'none', borderRadius: 50, padding: '14px 32px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
          Go to Simulator →
        </button>
      </div>
    </main>
  )

  const { result, description } = stored
  const bl = result.baseline
  const sk = Object.keys(result).find(k => k !== 'baseline') ?? 'baseline'
  const sc = result[sk]
  const profitΔ = sc.delta_net_profit_pct ?? 0
  const waitΔ = sc.delta_avg_wait_min ?? 0
  const isGood = profitΔ >= 0

  const barData = [
    { name: 'Revenue', Baseline: Math.round(bl.revenue.mean), Scenario: Math.round(sc.revenue.mean) },
    { name: 'Gross Profit', Baseline: Math.round(bl.gross_profit.mean), Scenario: Math.round(sc.gross_profit.mean) },
    { name: 'Net Profit', Baseline: Math.round(bl.net_profit.mean), Scenario: Math.round(sc.net_profit.mean) },
  ]

  const serviceData = [
    { name: 'Avg Wait', Baseline: +bl.avg_wait_min.mean.toFixed(2), Scenario: +sc.avg_wait_min.mean.toFixed(2) },
    { name: 'Abandon %', Baseline: +bl.abandonment_rate_pct.toFixed(1), Scenario: +sc.abandonment_rate_pct.toFixed(1) },
    { name: 'Util %', Baseline: +(bl.staff_utilization.mean * 100).toFixed(1), Scenario: +(sc.staff_utilization.mean * 100).toFixed(1) },
  ]

  const radarData = [
    { m: 'Revenue', b: 100, s: (sc.revenue.mean / bl.revenue.mean) * 100 },
    { m: 'Profit', b: 100, s: Math.max(0, (sc.net_profit.mean / (bl.net_profit.mean || 1)) * 100) },
    { m: 'Customers', b: 100, s: (sc.customers_served.mean / bl.customers_served.mean) * 100 },
    { m: 'Speed', b: 100, s: bl.avg_wait_min.mean > 0 ? Math.min(200, (bl.avg_wait_min.mean / Math.max(sc.avg_wait_min.mean, 0.01)) * 100) : 100 },
    { m: 'Basket', b: 100, s: (sc.avg_transaction.mean / bl.avg_transaction.mean) * 100 },
    { m: 'Margin', b: 100, s: (sc.gross_margin_pct / bl.gross_margin_pct) * 100 },
  ]

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(150deg, ${theme.cream} 0%, #fef3e8 60%, ${theme.matchaLight}33 100%)`, fontFamily: "'Nunito', system-ui, sans-serif", padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoffeeCup size={32} />
              <span style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.1rem', color: theme.brown }}>Brewlytics</span>
            </button>
          </div>
          <button onClick={() => navigate('/simulate')} style={{ background: theme.creamDark, color: theme.brown, border: `2px solid ${theme.border}`, borderRadius: 50, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
            ← New Scenario
          </button>
        </div>

        {/* Verdict banner */}
        <div style={{
          borderRadius: 28, padding: '24px 28px', marginBottom: 24,
          background: isGood ? `linear-gradient(135deg, ${theme.matchaLight}, #e8f8d8)` : `linear-gradient(135deg, ${theme.roseLight}, #fff0f0)`,
          border: `3px solid ${isGood ? theme.matcha : theme.rose}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          boxShadow: `0 6px 24px ${isGood ? theme.matcha : theme.rose}33`,
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>{isGood ? '✅' : '⚠️'}</div>
            <div>
              <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.4rem', color: isGood ? theme.matchaDark : '#c0392b', marginBottom: 6 }}>
                {isGood ? 'Great news! This helps your café!' : 'Hmm, this hurts profitability...'}
              </p>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: 600 }}>
                {description} · {sc.n_simulations} days simulated
              </p>
              <p style={{ color: isGood ? theme.matchaDark : '#e74c3c', fontSize: '0.85rem', fontWeight: 700, marginTop: 4 }}>
                Profit {fmtΔ(profitΔ)} · Wait time {waitΔ >= 0 ? '+' : ''}{waitΔ.toFixed(2)} min
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: '0.75rem', color: theme.textMuted, fontWeight: 700, marginBottom: 4 }}>Daily Profit Change</p>
            <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '2rem', color: isGood ? theme.matchaDark : '#e74c3c' }}>
              {fmt$(sc.net_profit.mean - bl.net_profit.mean)}
            </p>
            <div style={{ animation: 'float 2.5s ease-in-out 0.5s infinite' }}>
              {isGood ? <MatchaLatte size={60} /> : <CoffeeCup size={60} />}
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Revenue / Day" emoji="💰" baseline={bl.revenue.mean} scenario={sc.revenue.mean} format={fmt$} />
          <KpiCard label="Net Profit / Day" emoji="✨" baseline={bl.net_profit.mean} scenario={sc.net_profit.mean} format={fmt$} />
          <KpiCard label="Avg Wait" emoji="⏱️" baseline={bl.avg_wait_min.mean} scenario={sc.avg_wait_min.mean} format={v => `${fmt1(v)}m`} lowerIsBetter />
          <KpiCard label="Customers" emoji="👥" baseline={bl.customers_served.mean} scenario={sc.customers_served.mean} format={v => `${Math.round(v)}/day`} />
          <KpiCard label="Abandonment" emoji="😔" baseline={bl.abandonment_rate_pct} scenario={sc.abandonment_rate_pct} format={v => `${fmt1(v)}%`} lowerIsBetter />
          <KpiCard label="Gross Margin" emoji="📊" baseline={bl.gross_margin_pct} scenario={sc.gross_margin_pct} format={v => `${fmt1(v)}%`} />
          <KpiCard label="Staff Utiliz." emoji="🧑‍🍳" baseline={bl.staff_utilization.mean * 100} scenario={sc.staff_utilization.mean * 100} format={v => `${fmt1(v)}%`} />
          <KpiCard label="Avg Basket" emoji="🛒" baseline={bl.avg_transaction.mean} scenario={sc.avg_transaction.mean} format={fmt$} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ borderRadius: 50, padding: '9px 20px', fontSize: '0.85rem', fontWeight: 800, border: `2px solid ${tab === t.id ? theme.brown : theme.border}`, background: tab === t.id ? `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})` : theme.white, color: tab === t.id ? '#fff' : theme.textMuted, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s', boxShadow: tab === t.id ? `0 4px 16px ${theme.brownLight}55` : 'none' }}
            >{t.label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}`, boxShadow: '0 3px 12px rgba(139,94,60,0.06)' }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 16, fontSize: '0.9rem' }}>💰 Revenue & Profit</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}88`} />
                  <XAxis dataKey="name" stroke={theme.textLight} fontSize={11} fontFamily="Nunito" fontWeight={700} />
                  <YAxis stroke={theme.textLight} fontSize={11} tickFormatter={v => `$${v}`} fontFamily="Nunito" />
                  <Tooltip {...TOOLTIP} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }} />
                  <Bar dataKey="Baseline" fill={theme.creamDark} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Scenario" radius={[8, 8, 0, 0]}>
                    {barData.map((e, i) => <Cell key={i} fill={e.Scenario >= e.Baseline ? theme.brownLight : theme.rose} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}`, boxShadow: '0 3px 12px rgba(139,94,60,0.06)' }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 16, fontSize: '0.9rem' }}>⏱️ Service Quality</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={serviceData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}88`} />
                  <XAxis dataKey="name" stroke={theme.textLight} fontSize={11} fontFamily="Nunito" fontWeight={700} />
                  <YAxis stroke={theme.textLight} fontSize={11} fontFamily="Nunito" />
                  <Tooltip {...TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }} />
                  <Bar dataKey="Baseline" fill={theme.creamDark} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Scenario" radius={[8, 8, 0, 0]}>
                    {serviceData.map((e, i) => {
                      const lowerBetter = i < 2
                      return <Cell key={i} fill={lowerBetter ? (e.Scenario <= e.Baseline ? theme.matcha : theme.rose) : (e.Scenario >= e.Baseline ? '#60a5fa' : '#f59e0b')} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk box */}
            <div style={{ gridColumn: '1/-1', background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}` }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 16, fontSize: '0.9rem' }}>🎯 Profit Risk Range (Scenario)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {([['😱 Worst P5', sc.net_profit.p5, theme.rose], ['😟 Low P25', sc.net_profit.p25 ?? sc.net_profit.p5, '#f59e0b'], ['😐 Median', sc.net_profit.median, theme.brownLight], ['😊 High P75', sc.net_profit.p75 ?? sc.net_profit.p95, theme.matcha], ['🎉 Best P95', sc.net_profit.p95, theme.matchaDark]] as [string, number, string][]).map(([lbl, val, color]) => (
                  <div key={lbl} style={{ borderRadius: 18, padding: '14px', textAlign: 'center', background: `${color}11`, border: `2px solid ${color}33` }}>
                    <p style={{ fontSize: '0.75rem', color: theme.textMuted, fontWeight: 700, marginBottom: 8 }}>{lbl}</p>
                    <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.05rem', color }}>{fmt$(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISTRIBUTION */}
        {tab === 'distribution' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <DistChart b={bl.net_profit} s={sc.net_profit} label="Net Profit Distribution" />
            <DistChart b={bl.revenue} s={sc.revenue} label="Revenue Distribution" />
            <div style={{ gridColumn: '1/-1' }}>
              <DistChart b={bl.avg_wait_min} s={sc.avg_wait_min} label="Avg Wait Time Distribution (minutes)" />
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: theme.white, borderRadius: 24, padding: 24, border: `2px solid ${theme.border}`, boxShadow: '0 3px 12px rgba(139,94,60,0.06)' }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 4, fontSize: '0.95rem' }}>🧋 Product Sales — Before vs After</p>
              <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: 20, fontWeight: 600 }}>Mean daily units. Brown bar = scenario, grey = baseline.</p>
              <ProductRows baseline={bl} scenario={sc} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(['📈 Top Gainers', '📉 Top Drops'] as const).map((title, side) => {
                const rows = Object.entries(bl.product_sales)
                  .map(([name, b]) => ({ name, delta: (sc.product_sales[name]?.mean_daily_sales ?? 0) - b.mean_daily_sales }))
                  .sort((a, b) => side === 0 ? b.delta - a.delta : a.delta - b.delta)
                  .slice(0, 5)
                return (
                  <div key={title} style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}` }}>
                    <p style={{ fontWeight: 800, color: theme.text, marginBottom: 14, fontSize: '0.9rem' }}>{title}</p>
                    {rows.map(r => (
                      <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text }}>{r.name}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: "'Nunito', sans-serif", color: r.delta > 0 ? theme.matchaDark : '#e74c3c' }}>
                          {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(1)}/day
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* RADAR */}
        {tab === 'radar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}` }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 4, fontSize: '0.9rem' }}>🕸️ Scenario Profile</p>
              <p style={{ color: theme.textMuted, fontSize: '0.78rem', marginBottom: 16, fontWeight: 600 }}>Normalized to baseline = 100. Bigger = better!</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={`${theme.border}cc`} />
                  <PolarAngleAxis dataKey="m" tick={{ fill: theme.textMuted, fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }} />
                  <Radar name="Baseline" dataKey="b" stroke={theme.creamDark} fill={theme.creamDark} fillOpacity={0.4} />
                  <Radar name="Scenario" dataKey="s" stroke={theme.brownLight} fill={theme.brownLight} fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Nunito', fontWeight: 700 }} />
                  <Tooltip {...TOOLTIP} formatter={(v: any) => [`${Number(v).toFixed(0)}`, '']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: theme.white, borderRadius: 24, padding: 20, border: `2px solid ${theme.border}` }}>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 16, fontSize: '0.9rem' }}>📋 Full Comparison Table</p>
              {[
                ['💰 Revenue', fmt$(bl.revenue.mean), fmt$(sc.revenue.mean), sc.revenue.mean >= bl.revenue.mean],
                ['✨ Net Profit', fmt$(bl.net_profit.mean), fmt$(sc.net_profit.mean), sc.net_profit.mean >= bl.net_profit.mean],
                ['📊 Gross Margin', `${fmt1(bl.gross_margin_pct)}%`, `${fmt1(sc.gross_margin_pct)}%`, sc.gross_margin_pct >= bl.gross_margin_pct],
                ['👥 Customers', `${Math.round(bl.customers_served.mean)}`, `${Math.round(sc.customers_served.mean)}`, sc.customers_served.mean >= bl.customers_served.mean],
                ['😔 Abandonment', `${fmt1(bl.abandonment_rate_pct)}%`, `${fmt1(sc.abandonment_rate_pct)}%`, sc.abandonment_rate_pct <= bl.abandonment_rate_pct],
                ['⏱️ Avg Wait', `${fmt1(bl.avg_wait_min.mean)}m`, `${fmt1(sc.avg_wait_min.mean)}m`, sc.avg_wait_min.mean <= bl.avg_wait_min.mean],
                ['🧑‍🍳 Staff Util', `${fmt1(bl.staff_utilization.mean * 100)}%`, `${fmt1(sc.staff_utilization.mean * 100)}%`, true],
                ['🛒 Avg Basket', fmt$(bl.avg_transaction.mean), fmt$(sc.avg_transaction.mean), sc.avg_transaction.mean >= bl.avg_transaction.mean],
              ].map(([label, bv, sv, good]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: '0.83rem', fontWeight: 700, color: theme.textMuted }}>{label}</span>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: theme.textLight, fontWeight: 700 }}>{bv}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: (good as boolean) ? theme.matchaDark : '#e74c3c' }}>→ {sv}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button onClick={() => navigate('/simulate')}
            style={{ background: `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})`, color: '#fff', border: 'none', borderRadius: 50, padding: '16px 40px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: `0 8px 24px ${theme.brownLight}55` }}
            onMouseEnter={e => ((e.currentTarget as any).style.transform = 'translateY(-3px)')}
            onMouseLeave={e => ((e.currentTarget as any).style.transform = 'none')}
          >
            ☕ Test Another Hypothesis
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </main>
  )
}