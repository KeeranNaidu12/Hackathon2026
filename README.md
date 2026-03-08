# 🔮 What-If Simulator — AI-Powered Digital Twin for Small Business

> **Hackathon 2026** — Simulate pricing changes, staffing decisions, and growth scenarios *before* committing a single dollar.

![Python](https://img.shields.io/badge/Python-3.11+-blue) ![React](https://img.shields.io/badge/React-19-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688) ![SimPy](https://img.shields.io/badge/SimPy-4.1-orange)

---

## 📌 What Is This?

A **Digital Twin** for small businesses. Instead of guessing whether raising prices or hiring staff is a good idea, this tool runs **500 Monte Carlo simulations** using a discrete-event simulation engine (**SimPy**) to show:

- The **range of possible outcomes** (not just one number)
- **Before vs. After** comparison charts
- **Risk analysis** — probability of profit, worst-case, best-case
- **AI-powered natural language** — type "What if I hire a student?" and the system figures out the rest

### Demo Business: ☕ Pandosy Pastries
- Coffee price: $5.00
- Customers per hour: 15
- Staff: 2 baristas
- Staff cost: $150/day each

---

## 🏗️ Architecture

```
┌─────────────────────┐      HTTP/JSON       ┌──────────────────────┐
│   React Frontend     │ ◄──────────────────► │   FastAPI Backend     │
│   (Vite + Tailwind)  │    localhost:5173     │   localhost:8000      │
│                      │    ───────────►       │                      │
│  • Landing Page      │    /simulate          │  • SimPy Engine       │
│  • Simulator (Chat   │    /chat              │  • Monte Carlo Loop   │
│    + Sliders)        │    /health            │  • AI Parser (GPT /   │
│  • Results Dashboard │                      │    Fallback)          │
│    (Recharts)        │                      │                      │
└─────────────────────┘                      └──────────────────────┘
```

---

## 📂 Project Structure

```
Hackathon2026/
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # API endpoints (/simulate, /chat, /health)
│   ├── simulation.py           # SimPy discrete-event simulation + Monte Carlo engine
│   ├── ai_parser.py            # NLP → simulation params (OpenAI or keyword fallback)
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Template for API keys
│
├── my-app/                     # React + TypeScript frontend
│   ├── src/
│   │   ├── api.ts              # Type-safe API client to talk to FastAPI
│   │   ├── pages/
│   │   │   ├── Landing.tsx     # Landing page with backend status check
│   │   │   ├── Simulator.tsx   # Sliders + AI chatbox + progress bar
│   │   │   └── Results.tsx     # Charts dashboard (Recharts)
│   │   ├── App.tsx             # React Router (/ → /simulation → /results)
│   │   ├── main.tsx            # App entry point
│   │   └── index.css           # Tailwind CSS imports
│   ├── package.json
│   └── vite.config.ts
│
├── .venv/                      # Python virtual environment (not committed)
└── README.md                   # ← You are here
```

---

## 🚀 How to Run

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- (Optional) An **OpenAI API key** for GPT-powered NL parsing

### 1. Backend Setup

```bash
# From the project root
cd backend

# Create and activate virtual environment (if not already done)
python3 -m venv ../.venv
source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set up OpenAI key for AI-powered chat
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
# If you skip this, the fallback keyword parser still works fine for demos

# Start the server
uvicorn main:app --reload --port 8000
```

Backend will be at **http://localhost:8000**. API docs at **http://localhost:8000/docs**.

### 2. Frontend Setup

```bash
# From the project root
cd my-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be at **http://localhost:5173**.

### 3. Use the App
1. Open **http://localhost:5173**
2. Landing page shows backend connection status (green = connected)
3. Click **"Launch Simulator"**
4. Use **sliders** to set current/proposed business params, OR
5. Type in the **AI chat**: *"What if I raise prices to $5.50?"*
6. Click **"View Full Results Dashboard"** for charts

---

## 🧠 How It Works (Technical Deep Dive)

### The Simulation Engine (`simulation.py`)

1. **SimPy Discrete-Event Simulation** — Every customer is an individual object that:
   - Arrives following a **Poisson distribution** (realistic random arrivals)
   - Waits in a **queue** for an available barista
   - Has a **patience limit** (10 min) — leaves if wait is too long ("reneging")
   - Gets served (2–5 min service time)

2. **Monte Carlo Loop** — The single-day simulation runs **500 times** with different random seeds. This produces a **probability distribution** of outcomes, not just one number.

3. **Compare Scenarios** — Runs Monte Carlo for BOTH the current state and the proposed change, then calculates:
   - Profit/revenue change
   - Wait time improvement
   - Customer loss risk
   - Recommendation (RECOMMENDED / NOT RECOMMENDED)

### The AI Parser (`ai_parser.py`)

- **With OpenAI API key**: Uses GPT-4o-mini to extract `price_change` and `staff_change` from plain English
- **Without API key**: Falls back to keyword matching (detects "hire", "raise", "$5.50", etc.)
- Both paths produce the same JSON format that feeds into the simulation

### The API (`main.py`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if backend is running |
| `/simulate` | POST | Run simulation with explicit slider values |
| `/chat` | POST | Parse natural language → simulate → return insight |
| `/quick-simulate` | POST | Lightweight single-scenario simulation |

### The Frontend

| Page | Route | What It Does |
|------|-------|-------------|
| Landing | `/` | Hero page, shows backend connection status |
| Simulator | `/simulation` | Sliders for price/staff/customers + AI chatbox |
| Results | `/results` | Bar charts, area charts, KPI cards, risk insights |

---

## 📋 What's Done vs. What's Left

### ✅ Done (Working Prototype)
- [x] SimPy discrete-event simulation engine
- [x] Monte Carlo (500 simulations per scenario)
- [x] Customer reneging (patience-based queue leaving)
- [x] FastAPI with CORS, 3 main endpoints
- [x] AI chat parser (OpenAI + keyword fallback)
- [x] Human-readable insight generation
- [x] React frontend with dark theme
- [x] Landing page with backend status check
- [x] Simulator page with sliders + AI chat + progress animation
- [x] Results dashboard with Recharts (bar charts, area charts, KPI cards)
- [x] Before vs. After comparison
- [x] Profit probability distribution chart
- [x] Risk insights panel

### 🔧 TODO — Polish & Enhancements (Next Steps)

#### High Priority (Before Demo)
- [ ] **Add `.env` file** with your actual OpenAI API key (if you want GPT-powered chat)
- [ ] **Test the full flow end-to-end** (Landing → Simulator → chat → Results)
- [ ] **Tune the simulation parameters** — the current model has 2 staff handling 15 customers/hr; hiring a 3rd often *reduces* profit because staff cost ($150/day) outweighs the small customer-loss reduction at this traffic level. Consider lowering `staff_cost_per_day` or increasing `customers_per_hour` to make the "hire" scenario more interesting
- [ ] **Add error toasts** on the frontend instead of just red text

#### Medium Priority (If Time Allows)
- [ ] **Heatmap visualization** — A proper risk heatmap showing probability × impact
- [ ] **Multiple scenarios side-by-side** — Compare 3+ scenarios at once
- [ ] **Save/load scenarios** — localStorage or a simple DB
- [ ] **Loading skeleton UI** — Instead of just the progress bar
- [ ] **Mobile responsive** — The current layout works but could be tighter on mobile
- [ ] **Customizable business type** — Let user pick "cafe", "retail", "salon" with different defaults

#### Stretch Goals (Impress the Judges)
- [ ] **Square/Shopify POS API integration** — Pull real historical data
- [ ] **Time-series charts** — Show projected revenue over 30/60/90 days
- [ ] **Seasonality modeling** — Morning rush, weekend spikes
- [ ] **AI-generated executive summary** — Use GPT to write a paragraph summary of the simulation results
- [ ] **Export to PDF** — One-click report generation
- [ ] **Deploy** — Backend on Railway/Render, frontend on Vercel

---

## 🎤 Demo Script (For Judges)

1. **"Meet Sarah, she owns Pandosy Pastries."** → Show the landing page
2. **"She's thinking about raising her coffee price from $5 to $5.50."** → Navigate to Simulator
3. **Type in chat**: *"What if I raise my prices to $5.50?"*
4. **Show the AI parsing it** → Progress bar → Insight appears
5. **Click "View Full Results Dashboard"** → Show the charts
6. **Point out**: *"We didn't give her one number — we gave her 500 simulated outcomes. There's an X% chance her profit goes up."*
7. **"Now she asks a different question"** → Go back, type *"Should I hire another barista?"*
8. **"The system advises against it"** → Show why (staff cost vs. minimal customer loss)
9. **Closing**: *"For real deployment, we'd plug into their Square POS API to use actual sales data instead of industry benchmarks."*

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + TypeScript + Vite | Fast dev, type safety |
| Styling | Tailwind CSS v4 | Utility-first, fast to prototype |
| Charts | Recharts | React-native charting, good for bar/area charts |
| Routing | React Router v7 | SPA navigation |
| Backend | FastAPI (Python) | Async, auto-docs, Pydantic validation |
| Simulation | SimPy | Discrete-event simulation (queues, resources) |
| Math | NumPy | Monte Carlo aggregation, percentile calculations |
| AI | OpenAI GPT-4o-mini | NLP → structured JSON extraction |
| AI Fallback | Regex/Keyword | Works without API key for demo |

---

## 👥 Team

Built for Hackathon 2026.

---

## 📄 License

See [LICENSE](LICENSE).