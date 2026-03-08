import { useNavigate } from 'react-router-dom'
import { useState, useRef, useCallback } from 'react'
import { CoffeeCup, theme } from '../components/Illustrations'

const SAMPLE_COLS = ['date', 'customers_served', 'avg_item_price', 'staff_on_shift', 'latte_qty', 'revenue']

export default function Upload() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadProcess = useCallback((name: string) => {
    setFileName(name); setLoading(true); setProgress(0)
    const steps = [20, 45, 65, 82, 100]
    steps.forEach((v, i) =>
      setTimeout(() => {
        setProgress(v)
        if (v === 100) { setLoading(false); setUploaded(true) }
      }, (i + 1) * 320)
    )
  }, [])

  const handleFile = (file: File) => { if (file.name.endsWith('.csv')) uploadProcess(file.name) }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }

  return (
    <main style={{
      minHeight: '100vh',
      background: `linear-gradient(150deg, ${theme.cream} 0%, #fef3e8 50%, ${theme.matchaLight}44 100%)`,
      fontFamily: "'Nunito', system-ui, sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, #fde8d8 0%, transparent 70%)', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, #d4e8c8 0%, transparent 70%)', opacity: 0.6 }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 560, width: '100%' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontWeight: 700, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif" }}
        >
          ← Back to home
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <CoffeeCup size={72} className="" />
          <h1 style={{ fontFamily: "'Pacifico', cursive", fontSize: '2rem', color: theme.brownDark, marginTop: 12, marginBottom: 8 }}>
            Load Your Data ☕
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 600 }}>
            Upload your sales CSV to calibrate the simulation.<br />
            Or just skip and use our cute defaults! 🍪
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !loading && !uploaded && fileRef.current?.click()}
          style={{
            borderRadius: 28,
            border: `3px dashed ${dragging ? theme.matcha : uploaded ? theme.matcha : theme.brownLight}`,
            background: dragging ? `${theme.matchaLight}44` : uploaded ? `${theme.matchaLight}33` : theme.white,
            padding: '48px 32px',
            textAlign: 'center',
            cursor: uploaded || loading ? 'default' : 'pointer',
            transition: 'all 0.25s',
            boxShadow: '0 4px 24px rgba(139,94,60,0.08)',
            marginBottom: 16,
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />

          {loading ? (
            <div>
              <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>☕</div>
              <p style={{ fontWeight: 800, color: theme.brown, margin: '12px 0 4px' }}>Brewing your data...</p>
              <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: 16 }}>{fileName}</p>
              <div style={{ height: 10, borderRadius: 10, background: theme.creamDark, overflow: 'hidden', maxWidth: 240, margin: '0 auto' }}>
                <div style={{ height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${theme.brown}, ${theme.brownLight})`, width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: theme.textLight, fontSize: '0.75rem', marginTop: 8 }}>{progress}%</p>
            </div>
          ) : uploaded ? (
            <div>
              <div style={{ fontSize: '3.5rem' }}>✅</div>
              <p style={{ fontWeight: 800, color: theme.matchaDark, margin: '8px 0 4px' }}>Data loaded!</p>
              <p style={{ color: theme.textMuted, fontSize: '0.85rem' }}>{fileName}</p>
              <p style={{ color: theme.textLight, fontSize: '0.78rem', marginTop: 8 }}>
                Note: demo uses built-in café model regardless of CSV ✨
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
              <p style={{ fontWeight: 800, color: theme.text, marginBottom: 6 }}>Drop your CSV here or click to browse</p>
              <p style={{ color: theme.textMuted, fontSize: '0.82rem', marginBottom: 20 }}>
                Auto-detects prices, quantities, staff counts & hours
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {SAMPLE_COLS.map(c => (
                  <span key={c} style={{ background: theme.creamDark, color: theme.textMuted, borderRadius: 8, padding: '3px 10px', fontSize: '0.73rem', fontFamily: 'monospace', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sample CSV */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.white, border: `2px solid ${theme.border}`, borderRadius: 18, padding: '12px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(139,94,60,0.06)' }}>
          <div>
            <p style={{ fontWeight: 800, color: theme.text, fontSize: '0.9rem' }}>📄 Sample CSV template</p>
            <p style={{ color: theme.textMuted, fontSize: '0.78rem', marginTop: 2 }}>See the expected column format</p>
          </div>
          <button
            onClick={() => {
              const csv = `date,customers_served,avg_item_price,staff_on_shift,latte_qty,latte_price,revenue\n2024-01-01,128,4.85,3,42,4.50,620.80\n2024-01-02,135,4.92,3,45,4.50,664.20\n`
              const a = document.createElement('a')
              a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
              a.download = 'cafe_sample.csv'; a.click()
            }}
            style={{ background: theme.creamDark, color: theme.brown, border: `2px solid ${theme.brownLight}`, borderRadius: 12, padding: '7px 16px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
          >
            ⬇ Download
          </button>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            disabled={!uploaded}
            onClick={() => navigate('/simulate')}
            style={{
              flex: 1,
              background: uploaded ? `linear-gradient(135deg, ${theme.brown}, ${theme.brownLight})` : theme.border,
              color: uploaded ? '#fff' : theme.textLight,
              border: 'none', borderRadius: 50, padding: '15px',
              fontSize: '1rem', fontWeight: 800, cursor: uploaded ? 'pointer' : 'not-allowed',
              fontFamily: "'Nunito', sans-serif",
              boxShadow: uploaded ? `0 6px 20px ${theme.brownLight}55` : 'none',
              transition: 'all 0.2s',
            }}
          >
            Continue with Data →
          </button>
          <button
            onClick={() => navigate('/simulate')}
            style={{
              background: theme.matchaLight, color: theme.matchaDark,
              border: `2px solid ${theme.matcha}`, borderRadius: 50,
              padding: '13px 24px', fontSize: '0.9rem', fontWeight: 800,
              cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as any).style.transform = 'translateY(-2px)')}
            onMouseLeave={e => ((e.currentTarget as any).style.transform = 'none')}
          >
            Skip →
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </main>
  )
}