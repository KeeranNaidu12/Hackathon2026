import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { healthCheck } from '../api'
import { CoffeeCup, MatchaLatte, Croissant, StarSparkle, theme } from '../components/Illustrations'

const HYPOTHESES = [
  { icon: '👥', text: 'What if I hire 2 more staff?' },
  { icon: '🏷️', text: '20% off cold drinks' },
  { icon: '📈', text: 'Raise prices 15%' },
  { icon: '🎉', text: '5× event traffic' },
  { icon: '🌅', text: 'Open 2hrs earlier' },
  { icon: '☕', text: 'Oat latte goes viral' },
]

const FEATURES = [
  { emoji: '🎲', title: 'Monte Carlo', desc: '200+ simulated days per scenario' },
  { emoji: '⏱️', title: 'Queue Sim', desc: 'Real discrete-event server tracking' },
  { emoji: '🧠', title: 'AI Parsing', desc: 'Describe hypotheses in plain English' },
  { emoji: '📊', title: 'Full Dashboard', desc: 'Profits, waits, products & more' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [backendUp, setBackendUp] = useState<boolean | null>(null)
  const [floatIdx, setFloatIdx] = useState(0)

  useEffect(() => { healthCheck().then(setBackendUp) }, [])
  useEffect(() => {
    const t = setInterval(() => setFloatIdx(i => (i + 1) % 3), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${theme.cream} 0%, #fef3e8 40%, #f0f7e8 100%)`,
      fontFamily: "'Nunito', 'Quicksand', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #fde8d8 0%, transparent 70%)', opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #d4e8c8 0%, transparent 70%)', opacity: 0.7 }} />
      <div style={{ position: 'absolute', top: '40%', left: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #fde8e8 0%, transparent 70%)', opacity: 0.5 }} />

      {/* Floating sparkles */}
      {[
        { top: '12%', left: '8%', size: 16, color: theme.rose, delay: '0s' },
        { top: '20%', right: '10%', size: 22, color: theme.gold, delay: '0.5s' },
        { top: '55%', left: '4%', size: 14, color: theme.matcha, delay: '1s' },
        { top: '70%', right: '6%', size: 18, color: theme.lavender, delay: '0.8s' },
        { top: '35%', right: '18%', size: 12, color: theme.brownLight, delay: '1.3s' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', ...s, animation: `float 3s ease-in-out ${s.delay} infinite` }}>
          <StarSparkle size={s.size} color={s.color} />
        </div>
      ))}

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CoffeeCup size={38} />
            <span style={{ fontFamily: "'Pacifico', cursive", fontSize: '1.3rem', color: theme.brown }}>
              Brewlytics
            </span>
          </div>
          <button
            onClick={() => navigate('/simulate')}
            style={{
              background: theme.brown,
              color: '#fff',
              border: 'none',
              borderRadius: 50,
              padding: '8px 20px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Skip to Lab →
          </button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          {/* Floating cups row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32, alignItems: 'flex-end' }}>
            <div style={{ animation: 'float 2.8s ease-in-out 0s infinite', opacity: floatIdx === 0 ? 1 : 0.6, transition: 'opacity 0.5s' }}>
              <CoffeeCup size={90} />
            </div>
            <div style={{ animation: 'float 2.8s ease-in-out 0.4s infinite', opacity: floatIdx === 1 ? 1 : 0.6, transition: 'opacity 0.5s' }}>
              <MatchaLatte size={100} />
            </div>
            <div style={{ animation: 'float 2.8s ease-in-out 0.8s infinite', opacity: floatIdx === 2 ? 1 : 0.6, transition: 'opacity 0.5s' }}>
              <Croissant size={80} />
            </div>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: theme.roseLight, border: `1.5px solid ${theme.rose}`,
            borderRadius: 50, padding: '6px 18px', marginBottom: 20,
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.brown, letterSpacing: '0.08em' }}>
              ✨ CAFÉ HYPOTHESIS SIMULATOR ✨
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            color: theme.brownDark,
            lineHeight: 1.2,
            marginBottom: 16,
          }}>
            What if your café<br />
            <span style={{ color: theme.matcha }}>could predict</span> the future?
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: theme.textMuted,
            maxWidth: 520,
            margin: '0 auto 40px',
            lineHeight: 1.7,
            fontWeight: 600,
          }}>
            Run Monte Carlo simulations on any business decision.
            More staff? Discount lattes? Viral oat milk moment?
            Test it before you invest! 🎉
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/upload')}
              style={{
                background: `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})`,
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                padding: '16px 40px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                boxShadow: `0 8px 24px ${theme.brownLight}66`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-3px)'; (e.currentTarget as any).style.boxShadow = `0 14px 32px ${theme.brownLight}88` }}
              onMouseLeave={e => { (e.currentTarget as any).style.transform = 'none'; (e.currentTarget as any).style.boxShadow = `0 8px 24px ${theme.brownLight}66` }}
            >
              ☕ Start Simulating
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                background: theme.white,
                borderRadius: 24,
                padding: '24px 20px',
                border: `2px solid ${theme.border}`,
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(139,94,60,0.07)',
                animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>{f.emoji}</div>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 6, fontSize: '0.95rem' }}>{f.title}</p>
              <p style={{ color: theme.textMuted, fontSize: '0.8rem', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Backend status */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: theme.white,
            border: `2px solid ${backendUp === true ? '#7ab648' : backendUp === false ? '#f4a5a5' : theme.border}`,
            borderRadius: 50, padding: '8px 20px',
            fontSize: '0.8rem', fontWeight: 700,
            color: backendUp === true ? theme.matchaDark : backendUp === false ? '#c0392b' : theme.textMuted,
          }}>
            {backendUp === null && '⏳ Connecting to simulation engine...'}
            {backendUp === true && '🟢 Simulation engine online!'}
            {backendUp === false && '🔴 Engine offline — run: uvicorn main:app --reload'}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}