import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { parseHypothesisWithGPT, runCompare, type ScenarioRequest, type CompareResponse } from '../api'
import { CoffeeCup, MatchaLatte, theme } from '../components/Illustrations'

const PRODUCTS = [
  { name: 'Espresso',          price: 3.00, emoji: '☕', category: 'hot-caf' },
  { name: 'Americano',         price: 3.50, emoji: '☕', category: 'hot-caf' },
  { name: 'Flat White',        price: 4.00, emoji: '☕', category: 'hot-caf' },
  { name: 'Cappuccino',        price: 4.25, emoji: '☕', category: 'hot-caf' },
  { name: 'Latte',             price: 4.50, emoji: '☕', category: 'hot-caf' },
  { name: 'Oat Milk Latte',    price: 5.50, emoji: '🌿', category: 'hot-caf' },
  { name: 'Mocha',             price: 4.75, emoji: '🍫', category: 'hot-caf' },
  { name: 'Iced Latte',        price: 5.00, emoji: '🧊', category: 'cold-caf' },
  { name: 'Cold Brew',         price: 5.50, emoji: '🧊', category: 'cold-caf' },
  { name: 'Iced Matcha Latte', price: 5.75, emoji: '🍵', category: 'cold-caf' },
  { name: 'Hot Chocolate',     price: 4.00, emoji: '🍫', category: 'hot-decaf' },
  { name: 'Chai Latte',        price: 4.50, emoji: '🌿', category: 'hot-decaf' },
  { name: 'Herbal Tea',        price: 3.00, emoji: '🍃', category: 'hot-decaf' },
  { name: 'Fresh OJ',          price: 4.50, emoji: '🍊', category: 'cold-decaf' },
  { name: 'Smoothie',          price: 6.00, emoji: '🥤', category: 'cold-decaf' },
  { name: 'Croissant',         price: 3.50, emoji: '🥐', category: 'food' },
  { name: 'Avocado Toast',     price: 9.00, emoji: '🥑', category: 'food' },
  { name: 'Banana Bread',      price: 4.00, emoji: '🍌', category: 'food' },
]

const CATEGORIES = [
  { id: 'all',        label: 'All Items' },
  { id: 'hot-caf',   label: '☕ Hot' },
  { id: 'cold-caf',  label: '🧊 Cold' },
  { id: 'hot-decaf', label: '🍵 Herbal' },
  { id: 'cold-decaf',label: '🍊 Juice' },
  { id: 'food',      label: '🥐 Food' },
]

const QUICK_CHIPS = [
  { emoji: '👥', text: 'Hire 2 more staff' },
  { emoji: '🏷️', text: '20% discount on cold drinks' },
  { emoji: '📈', text: 'Raise all prices 15%' },
  { emoji: '🎉', text: 'Special event 5x traffic' },
  { emoji: '🌅', text: 'Open 2 hours earlier at 5am' },
  { emoji: '✂️', text: 'Remove food items from menu' },
  { emoji: '⭐', text: 'Oat Milk Latte goes viral' },
  { emoji: '📉', text: 'Cut staff to 2 to save costs' },
]

const DAY_OPTS = [
  { val: 'weekday', label: '💼 Weekday', color: theme.brownLight },
  { val: 'monday',  label: '😩 Monday',  color: theme.rose },
  { val: 'friday',  label: '🎉 Friday',  color: theme.gold },
  { val: 'weekend', label: '☀️ Weekend', color: theme.matcha },
]

interface ItemOverride { newPrice: number; discount: number; removed: boolean }
type ItemOverrides = Record<string, ItemOverride>

interface Form {
  n_staff: number; open_hour: number; close_hour: number
  day_of_week: string; special_multiplier: number
  price_change_factor: number; apply_discount_to_all: number
  apply_discount_to_cold: number; n_simulations: number
}

const DEF: Form = {
  n_staff: 3, open_hour: 7, close_hour: 19, day_of_week: 'weekday',
  special_multiplier: 1, price_change_factor: 1,
  apply_discount_to_all: 0, apply_discount_to_cold: 0, n_simulations: 200,
}

function KawaiiSlider({ label, emoji, value, min, max, step, format, onChange, accentColor }: {
  label: string; emoji: string; value: number; min: number; max: number; step: number
  format: (v: number) => string; onChange: (v: number) => void; accentColor?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  const color = accentColor ?? theme.brown
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: theme.text, fontSize: '0.9rem' }}>{emoji} {label}</span>
        <span style={{ background: color + '22', color, borderRadius: 20, padding: '3px 12px', fontSize: '0.82rem', fontWeight: 800, border: `1.5px solid ${color}44` }}>
          {format(value)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 8, background: theme.creamDark }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${color}99, ${color})`, width: `${pct}%`, transition: 'width 0.15s' }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: theme.textLight }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  )
}

function ItemRow({ product, override, onChange }: {
  product: typeof PRODUCTS[number]
  override: ItemOverride
  onChange: (o: ItemOverride) => void
}) {
  const effectivePrice = override.newPrice * (1 - override.discount)
  const priceChanged = Math.abs(override.newPrice - product.price) > 0.001
  const hasDiscount = override.discount > 0
  const anyChange = priceChanged || hasDiscount || override.removed

  return (
    <div style={{
      borderRadius: 16, padding: '12px 14px', marginBottom: 8,
      background: override.removed ? theme.roseLight : anyChange ? `${theme.gold}18` : theme.cream,
      border: `2px solid ${override.removed ? theme.rose : anyChange ? theme.gold : theme.border}`,
      opacity: override.removed ? 0.65 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: !override.removed ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>{product.emoji}</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.88rem', color: override.removed ? theme.textLight : theme.text, textDecoration: override.removed ? 'line-through' : 'none' }}>
              {product.name}
            </p>
            <p style={{ fontSize: '0.72rem', color: theme.textLight, fontWeight: 600 }}>
              Base ${product.price.toFixed(2)}
              {(priceChanged || hasDiscount) && !override.removed && (
                <span style={{ color: theme.brownLight, marginLeft: 6 }}>→ ${effectivePrice.toFixed(2)} effective</span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {anyChange && !override.removed && (
            <button onClick={() => onChange({ newPrice: product.price, discount: 0, removed: false })}
              style={{ fontSize: '0.7rem', color: theme.textLight, background: theme.creamDark, border: `1.5px solid ${theme.border}`, borderRadius: 8, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
              Reset
            </button>
          )}
          <button onClick={() => onChange({ ...override, removed: !override.removed })}
            style={{ fontSize: '0.72rem', fontWeight: 800, borderRadius: 10, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", border: 'none', background: override.removed ? theme.rose : theme.roseLight, color: override.removed ? '#fff' : '#c0392b', transition: 'all 0.15s' }}>
            {override.removed ? '↩ Restore' : '✕ Remove'}
          </button>
        </div>
      </div>

      {!override.removed && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textMuted }}>💰 New Price</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: priceChanged ? theme.brownLight : theme.textLight }}>
                ${override.newPrice.toFixed(2)}
                {priceChanged && <span style={{ marginLeft: 4, color: override.newPrice > product.price ? '#e74c3c' : theme.matchaDark }}>
                  ({override.newPrice > product.price ? '+' : ''}{(((override.newPrice - product.price) / product.price) * 100).toFixed(0)}%)
                </span>}
              </span>
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 6, background: theme.border }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 6, background: priceChanged ? theme.brownLight : theme.creamDark, width: `${((override.newPrice - 1) / (15 - 1)) * 100}%`, transition: 'width 0.1s' }} />
              <input type="range" min={1} max={15} step={0.25} value={override.newPrice}
                onChange={e => onChange({ ...override, newPrice: parseFloat(e.target.value) })}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textMuted }}>🏷️ Discount</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: hasDiscount ? theme.rose : theme.textLight }}>
                {hasDiscount ? `${(override.discount * 100).toFixed(0)}% off` : 'None'}
              </span>
            </div>
            <div style={{ position: 'relative', height: 6, borderRadius: 6, background: theme.border }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 6, background: hasDiscount ? theme.rose : theme.creamDark, width: `${(override.discount / 0.5) * 100}%`, transition: 'width 0.1s' }} />
              <input type="range" min={0} max={0.5} step={0.05} value={override.discount}
                onChange={e => onChange({ ...override, discount: parseFloat(e.target.value) })}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Simulator() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'ai' | 'form'>('ai')
  const [formTab, setFormTab] = useState<'global' | 'items'>('global')
  const [catFilter, setCatFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')
  const [apiKey, setApiKey] = useState(localStorage.getItem('oai_key') ?? '')
  const [showKey, setShowKey] = useState(false)
  const [form, setForm] = useState<Form>(DEF)
  const [itemOverrides, setItemOverrides] = useState<ItemOverrides>(() =>
    Object.fromEntries(PRODUCTS.map(p => [p.name, { newPrice: p.price, discount: 0, removed: false }]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])

  const fmtH = (v: number) => { const h = Math.floor(v); const m = v % 1 === 0.5 ? '30' : '00'; return `${h > 12 ? h - 12 : h}:${m}${h >= 12 ? 'pm' : 'am'}` }

  const changedItemCount = Object.entries(itemOverrides).filter(([name, o]) => {
    const base = PRODUCTS.find(p => p.name === name)!
    return o.removed || o.discount > 0 || Math.abs(o.newPrice - base.price) > 0.001
  }).length

  const animProgress = (labels: string[]) => {
    setProgress(0)
    labels.forEach((lbl, i) => setTimeout(() => { setProgress(Math.round(((i + 1) / labels.length) * 88)); setProgressLabel(lbl) }, i * 420))
  }

  const buildScenario = useCallback((base: Form): ScenarioRequest => {
    const overrides: ScenarioRequest['product_overrides'] = []
    const removeList: string[] = []
    for (const [name, o] of Object.entries(itemOverrides)) {
      const baseProduct = PRODUCTS.find(p => p.name === name)!
      if (o.removed) { removeList.push(name); continue }
      const priceChanged = Math.abs(o.newPrice - baseProduct.price) > 0.001
      const hasDiscount = o.discount > 0
      if (priceChanged || hasDiscount) overrides.push({ name, ...(priceChanged ? { price: o.newPrice } : {}), ...(hasDiscount ? { discount: o.discount } : {}) })
    }
    return {
      n_staff: base.n_staff, open_hour: base.open_hour, close_hour: base.close_hour,
      day_of_week: base.day_of_week, description: 'Custom scenario',
      special_multiplier: base.special_multiplier !== 1 ? base.special_multiplier : undefined,
      price_change_factor: base.price_change_factor !== 1 ? base.price_change_factor : undefined,
      apply_discount_to_all: base.apply_discount_to_all > 0 ? base.apply_discount_to_all : undefined,
      apply_discount_to_cold: base.apply_discount_to_cold > 0 ? base.apply_discount_to_cold : undefined,
      remove_products: removeList.length > 0 ? removeList : undefined,
      product_overrides: overrides.length > 0 ? overrides : undefined,
      n_simulations: base.n_simulations,
    }
  }, [itemOverrides])

  const runScenario = useCallback(async (scenario: ScenarioRequest, desc: string) => {
    setLoading(true); setError(null)
    animProgress(['Generating arrivals ☕', 'Simulating the queue 🧑‍🍳', 'Crunching days 📊', 'Compiling results ✨'])
    try {
      const result: CompareResponse = await runCompare({ scenarios: { scenario }, n_simulations: scenario.n_simulations ?? 200 })
      setProgress(100)
      setTimeout(() => { sessionStorage.setItem('cafeResults', JSON.stringify({ result, description: desc })); navigate('/results') }, 350)
    } catch (e: any) {
      setError(e.message ?? 'Simulation failed. Is the backend running?'); setLoading(false); setProgress(0)
    }
  }, [navigate])

  const handleAI = useCallback(async (text: string) => {
    if (!text.trim()) return
    if (!apiKey.trim()) { setShowKey(true); return }
    setMessages(p => [...p, { role: 'user', text }]); setAiInput(''); setLoading(true); setError(null)
    setProgressLabel('Asking GPT-4o-mini 🤖'); setProgress(15)
    try {
      const parsed = await parseHypothesisWithGPT(text, apiKey)
      setProgress(40)
      setMessages(p => [...p, { role: 'ai', text: `${parsed.description}\n\n💡 ${parsed.reasoning}` }])
      await runScenario({ ...parsed.scenario, description: parsed.description }, parsed.description)
    } catch (e: any) {
      setError(e.message); setMessages(p => [...p, { role: 'ai', text: `😵 ${e.message}` }]); setLoading(false); setProgress(0)
    }
  }, [apiKey, runScenario])

  const sf = (k: keyof Form) => (v: number) => setForm(p => ({ ...p, [k]: v }))
  const filteredProducts = catFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === catFilter)

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(150deg, ${theme.cream} 0%, #fef3e8 60%, ${theme.matchaLight}33 100%)`, fontFamily: "'Nunito', system-ui, sans-serif", padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoffeeCup size={36} />
              <span style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.2rem', color: theme.brown }}>Brewlytics</span>
            </button>
            <span style={{ background: theme.creamDark, color: theme.textMuted, borderRadius: 12, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>🧪 Hypothesis Lab</span>
          </div>
          <button onClick={() => setShowKey(v => !v)} style={{ background: apiKey ? theme.matchaLight : theme.goldLight, color: apiKey ? theme.matchaDark : '#996600', border: `2px solid ${apiKey ? theme.matcha : theme.gold}`, borderRadius: 50, padding: '7px 16px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
            {apiKey ? '🔑 OpenAI ✓' : '⚠️ Set OpenAI Key'}
          </button>
        </div>

        {showKey && (
          <div style={{ background: theme.goldLight, border: `2px solid ${theme.gold}`, borderRadius: 20, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#996600' }}>🔑 OpenAI API Key</span>
            <input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)}
              style={{ flex: 1, borderRadius: 12, border: `2px solid ${theme.gold}`, padding: '8px 14px', fontSize: '0.9rem', background: theme.white, color: theme.text, fontFamily: "'Nunito', sans-serif", outline: 'none' }} />
            <button onClick={() => { localStorage.setItem('oai_key', apiKey); setShowKey(false) }}
              style={{ background: theme.brown, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 20px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Save</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>

          {/* LEFT PANEL */}
          <div style={{ background: theme.white, borderRadius: 28, padding: 24, border: `2px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(139,94,60,0.08)', display: 'flex', flexDirection: 'column' }}>

            {/* Main tab switcher */}
            <div style={{ display: 'flex', background: theme.creamDark, borderRadius: 16, padding: 4, gap: 4, marginBottom: 20 }}>
              {[{ id: 'ai', label: '💬 AI Chat' }, { id: 'form', label: '🎛️ Controls' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  style={{ flex: 1, borderRadius: 12, padding: '8px', fontSize: '0.85rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s', background: tab === t.id ? `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})` : 'transparent', color: tab === t.id ? '#fff' : theme.textMuted }}
                >{t.label}</button>
              ))}
            </div>

            {/* AI TAB */}
            {tab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{ fontSize: '0.82rem', color: theme.textMuted, marginBottom: 16, fontWeight: 600, lineHeight: 1.5 }}>
                  Describe any scenario in plain English — GPT-4o-mini configures it ✨
                </p>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: theme.textLight }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🤖☕</div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Type a scenario or pick a suggestion!</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} style={{ borderRadius: 16, padding: '10px 14px', fontSize: '0.83rem', lineHeight: 1.5, background: m.role === 'user' ? `${theme.brownLight}22` : theme.creamDark, border: `1.5px solid ${m.role === 'user' ? theme.brownLight : theme.border}`, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', color: theme.text, fontWeight: 600 }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, marginBottom: 4 }}>{m.role === 'user' ? '🧑 You' : '🤖 GPT-4o-mini'}</p>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {QUICK_CHIPS.map(c => (
                    <button key={c.text} onClick={() => setAiInput(c.text)}
                      style={{ background: theme.creamDark, color: theme.textMuted, border: `1.5px solid ${theme.border}`, borderRadius: 50, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
                      onMouseEnter={e => { (e.currentTarget as any).style.borderColor = theme.brownLight; (e.currentTarget as any).style.color = theme.brown }}
                      onMouseLeave={e => { (e.currentTarget as any).style.borderColor = theme.border; (e.currentTarget as any).style.color = theme.textMuted }}
                    >{c.emoji} {c.text}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAI(aiInput)}
                    placeholder="e.g. 15% off lattes on Fridays?"
                    style={{ flex: 1, borderRadius: 16, border: `2px solid ${theme.border}`, padding: '10px 14px', fontSize: '0.85rem', background: theme.cream, color: theme.text, fontFamily: "'Nunito', sans-serif", outline: 'none', fontWeight: 600 }}
                    onFocus={e => (e.currentTarget.style.borderColor = theme.brownLight)}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
                  />
                  <button onClick={() => handleAI(aiInput)} disabled={loading || !aiInput.trim()}
                    style={{ background: loading || !aiInput.trim() ? theme.border : `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})`, color: loading || !aiInput.trim() ? theme.textLight : '#fff', border: 'none', borderRadius: 16, padding: '10px 18px', fontSize: '1.1rem', cursor: loading || !aiInput.trim() ? 'not-allowed' : 'pointer' }}
                  >☕</button>
                </div>
              </div>
            )}

            {/* FORM TAB */}
            {tab === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <button onClick={() => setFormTab('global')}
                    style={{ flex: 1, borderRadius: 12, padding: '9px 12px', fontSize: '0.82rem', fontWeight: 800, border: `2px solid ${formTab === 'global' ? theme.brown : theme.border}`, background: formTab === 'global' ? `${theme.brown}15` : theme.cream, color: formTab === 'global' ? theme.brown : theme.textMuted, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s' }}>
                    ⚙️ Global
                  </button>
                  <button onClick={() => setFormTab('items')}
                    style={{ flex: 1, borderRadius: 12, padding: '9px 12px', fontSize: '0.82rem', fontWeight: 800, border: `2px solid ${formTab === 'items' ? theme.brownLight : theme.border}`, background: formTab === 'items' ? `${theme.brownLight}15` : theme.cream, color: formTab === 'items' ? theme.brownLight : theme.textMuted, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s', position: 'relative' }}>
                    ☕ Per Item
                    {changedItemCount > 0 && (
                      <span style={{ position: 'absolute', top: -7, right: -7, background: theme.rose, color: '#fff', borderRadius: 50, width: 19, height: 19, fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {changedItemCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* GLOBAL */}
                {formTab === 'global' && (
                  <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                    <KawaiiSlider label="Staff on Shift" emoji="👥" value={form.n_staff} min={1} max={10} step={1} format={v => `${v} staff`} onChange={sf('n_staff')} accentColor={theme.brown} />
                    <KawaiiSlider label="Opening Hour" emoji="🌅" value={form.open_hour} min={5} max={12} step={0.5} format={fmtH} onChange={sf('open_hour')} accentColor={theme.gold} />
                    <KawaiiSlider label="Closing Hour" emoji="🌙" value={form.close_hour} min={14} max={23} step={0.5} format={fmtH} onChange={sf('close_hour')} accentColor={theme.lavender} />
                    <KawaiiSlider label="Global Price Change" emoji="💰" value={form.price_change_factor} min={0.7} max={1.5} step={0.05}
                      format={v => v === 1 ? 'No change' : `${v > 1 ? '+' : ''}${((v - 1) * 100).toFixed(0)}% all`}
                      onChange={sf('price_change_factor')} accentColor={theme.brownLight} />
                    <KawaiiSlider label="Discount — All Items" emoji="🏷️" value={form.apply_discount_to_all} min={0} max={0.5} step={0.05}
                      format={v => v === 0 ? 'None' : `${(v * 100).toFixed(0)}% off`} onChange={sf('apply_discount_to_all')} accentColor={theme.rose} />
                    <KawaiiSlider label="Discount — Cold Only" emoji="❄️" value={form.apply_discount_to_cold} min={0} max={0.5} step={0.05}
                      format={v => v === 0 ? 'None' : `${(v * 100).toFixed(0)}% off`} onChange={sf('apply_discount_to_cold')} accentColor='#60a5fa' />
                    <KawaiiSlider label="Traffic Multiplier" emoji="🎪" value={form.special_multiplier} min={0.5} max={8} step={0.5}
                      format={v => v === 1 ? 'Normal' : `${v}× traffic`} onChange={sf('special_multiplier')} accentColor={theme.matcha} />
                    <KawaiiSlider label="Simulations" emoji="🎲" value={form.n_simulations} min={50} max={1000} step={50}
                      format={v => `${v} days`} onChange={sf('n_simulations')} accentColor={theme.brownDark} />
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, color: theme.text, fontSize: '0.9rem', marginBottom: 10 }}>📅 Day of Week</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {DAY_OPTS.map(d => (
                          <button key={d.val} onClick={() => setForm(p => ({ ...p, day_of_week: d.val }))}
                            style={{ borderRadius: 50, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, border: `2px solid ${form.day_of_week === d.val ? d.color : theme.border}`, background: form.day_of_week === d.val ? d.color + '22' : theme.creamDark, color: form.day_of_week === d.val ? d.color : theme.textMuted, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s' }}
                          >{d.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PER ITEM */}
                {formTab === 'items' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: 600 }}>
                        Tweak price or discount per item ✏️
                      </p>
                      {changedItemCount > 0 && (
                        <button onClick={() => setItemOverrides(Object.fromEntries(PRODUCTS.map(p => [p.name, { newPrice: p.price, discount: 0, removed: false }])))}
                          style={{ fontSize: '0.72rem', color: theme.textLight, background: theme.creamDark, border: `1.5px solid ${theme.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Reset All
                        </button>
                      )}
                    </div>
                    {/* Category pills */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                      {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setCatFilter(c.id)}
                          style={{ borderRadius: 50, padding: '4px 11px', fontSize: '0.73rem', fontWeight: 700, border: `1.5px solid ${catFilter === c.id ? theme.brownLight : theme.border}`, background: catFilter === c.id ? `${theme.brownLight}22` : theme.cream, color: catFilter === c.id ? theme.brownLight : theme.textMuted, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s' }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {filteredProducts.map(p => (
                        <ItemRow key={p.name} product={p} override={itemOverrides[p.name]}
                          onChange={o => setItemOverrides(prev => ({ ...prev, [p.name]: o }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => runScenario(buildScenario(form), 'Custom scenario')} disabled={loading}
                  style={{ marginTop: 16, width: '100%', background: loading ? theme.border : `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})`, color: loading ? theme.textLight : '#fff', border: 'none', borderRadius: 50, padding: '14px', fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: loading ? 'none' : `0 6px 20px ${theme.brownLight}55`, flexShrink: 0 }}>
                  ☕ Run Simulation{changedItemCount > 0 ? ` · ${changedItemCount} item${changedItemCount > 1 ? 's' : ''} modified` : ''}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div>
            {loading ? (
              <div style={{ background: theme.white, borderRadius: 28, padding: 48, border: `2px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 24 }}>
                <div style={{ animation: 'float 1.5s ease-in-out infinite', position: 'relative' }}>
                  <CoffeeCup size={100} />
                  <div style={{ position: 'absolute', top: -8, right: -8, fontSize: '1.5rem', animation: 'spin 2s linear infinite' }}>✨</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.4rem', color: theme.brownDark, marginBottom: 8 }}>Brewing your results...</p>
                  <p style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: 600 }}>{progressLabel}</p>
                </div>
                <div style={{ width: 280, height: 12, borderRadius: 12, background: theme.creamDark, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 12, background: `linear-gradient(90deg, ${theme.brown}, ${theme.brownLight}, ${theme.matcha})`, width: `${progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <p style={{ color: theme.textLight, fontSize: '0.8rem', fontWeight: 700 }}>{progress}% complete ☕</p>
              </div>
            ) : error ? (
              <div style={{ background: theme.roseLight, borderRadius: 28, padding: 40, border: `2px solid ${theme.rose}`, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: '3rem' }}>😵‍💫</div>
                <p style={{ fontWeight: 800, color: '#c0392b' }}>Oops! Something went wrong</p>
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', maxWidth: 320, lineHeight: 1.6 }}>{error}</p>
                <button onClick={() => setError(null)} style={{ background: theme.rose, color: '#fff', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Try Again 💪</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: `linear-gradient(135deg, ${theme.brownDark}, ${theme.brown})`, borderRadius: 28, padding: 32, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>READY TO SIMULATE</p>
                    <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.6rem', marginBottom: 8 }}>Café Hypothesis Lab</p>
                    <p style={{ opacity: 0.7, fontSize: '0.88rem', lineHeight: 1.6 }}>Adjust global settings and per-item prices,<br />then run to see full Δ metrics vs baseline.</p>
                    {changedItemCount > 0 && (
                      <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 50, padding: '5px 14px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>🏷️ {changedItemCount} item{changedItemCount > 1 ? 's' : ''} modified</span>
                      </div>
                    )}
                  </div>
                  <div style={{ animation: 'float 3s ease-in-out infinite', flexShrink: 0 }}><MatchaLatte size={90} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Baseline Revenue', val: '$1,430/day', color: theme.brown, bg: theme.creamDark },
                    { label: 'Baseline Profit', val: '$396/day', color: theme.matchaDark, bg: theme.matchaLight },
                    { label: 'Customers/Day', val: '~132', color: '#7c3aed', bg: theme.lavenderLight },
                    { label: 'Avg Wait', val: '0.31 min', color: '#d97706', bg: theme.goldLight },
                    { label: 'Gross Margin', val: '79.4%', color: theme.brown, bg: theme.creamDark },
                    { label: 'Staff Util.', val: '31.9%', color: '#0284c7', bg: '#e0f2fe' },
                  ].map(m => (
                    <div key={m.label} style={{ background: m.bg, borderRadius: 18, padding: '14px 16px', border: `2px solid ${m.color}22` }}>
                      <p style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 700, marginBottom: 4 }}>{m.label}</p>
                      <p style={{ fontFamily: "'Pacifico', cursive", fontSize: '1rem', color: m.color }}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: theme.white, borderRadius: 24, padding: '16px 20px', border: `2px solid ${theme.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>💡</span>
                  <p style={{ color: theme.textMuted, fontSize: '0.83rem', lineHeight: 1.5, fontWeight: 600 }}>
                    Use <strong style={{ color: theme.brown }}>Global</strong> for staff, hours & bulk pricing — or <strong style={{ color: theme.brownLight }}>Per Item</strong> to set individual drink/food prices and discounts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </main>
  )
}