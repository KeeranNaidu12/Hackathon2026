const API_BASE = "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatsDist {
  mean: number;
  median: number;
  std: number;
  p5: number;
  p25?: number;
  p75?: number;
  p95: number;
}

export interface ProductStat {
  mean_daily_sales: number;
  total_sales: number;
}

export interface ScenarioResult {
  scenario_description: string | null;
  n_simulations: number;
  revenue: StatsDist;
  net_profit: StatsDist;
  gross_profit: StatsDist;
  avg_wait_min: StatsDist;
  max_wait_min: StatsDist;
  customers_served: StatsDist;
  customers_abandoned: StatsDist;
  staff_utilization: StatsDist;
  avg_transaction: StatsDist;
  gross_margin_pct: number;
  abandonment_rate_pct: number;
  product_sales: Record<string, ProductStat>;
  delta_net_profit_pct: number | null;
  delta_avg_wait_min: number | null;
}

export interface CompareResponse {
  baseline: ScenarioResult;
  [key: string]: ScenarioResult;
}

export interface ScenarioRequest {
  description?: string;
  n_staff?: number;
  staff_hourly_wage?: number;
  open_hour?: number;
  close_hour?: number;
  day_of_week?: string;
  daily_fixed_cost?: number;
  special_multiplier?: number;
  product_overrides?: { name: string; price?: number; discount?: number; popularity?: number }[];
  remove_products?: string[];
  apply_discount_to_all?: number;
  apply_discount_to_cold?: number;
  apply_discount_to_hot?: number;
  price_change_factor?: number;
  n_simulations?: number;
}

export interface CompareRequest {
  scenarios: Record<string, ScenarioRequest>;
  n_simulations?: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function runBaseline(n: number = 200): Promise<ScenarioResult> {
  const res = await fetch(`${API_BASE}/baseline?n_simulations=${n}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function runSimulate(req: ScenarioRequest): Promise<ScenarioResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function runCompare(req: CompareRequest): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getProducts(): Promise<{ products: any[] }> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── GPT-4o-mini: parse natural language hypothesis ────────────────────────────

export interface ParsedHypothesis {
  description: string;
  scenario: ScenarioRequest;
  reasoning: string;
}

export async function parseHypothesisWithGPT(
  userText: string,
  apiKey: string
): Promise<ParsedHypothesis> {
  const systemPrompt = `You are a cafe business analyst. The user describes a business hypothesis in natural language.
Your job is to convert it into a structured JSON scenario for a Monte Carlo simulation.

Available scenario fields:
- n_staff: integer (number of staff, default 3)
- staff_hourly_wage: float (default 15.0)
- open_hour: float (e.g. 7.0 = 7am, default 7.0)
- close_hour: float (e.g. 19.0 = 7pm, default 19.0)
- day_of_week: "monday" | "weekday" | "friday" | "weekend" | "saturday" | "sunday"
- daily_fixed_cost: float (default 200.0)
- special_multiplier: float (traffic multiplier, e.g. 5.0 = 5x traffic for events)
- apply_discount_to_all: float 0–1 (e.g. 0.2 = 20% off everything)
- apply_discount_to_cold: float 0–1 (discount only cold drinks)
- apply_discount_to_hot: float 0–1 (discount only hot drinks)
- price_change_factor: float (e.g. 1.15 = raise all prices 15%)
- remove_products: array of product names to remove (e.g. ["Croissant", "Avocado Toast"])
- product_overrides: array of {name, price?, discount?, popularity?} for specific item changes
- n_simulations: integer (how many days to simulate, default 200)

Available products: Espresso, Americano, Flat White, Cappuccino, Latte, Oat Milk Latte, Mocha, Iced Latte, Cold Brew, Iced Matcha Latte, Hot Chocolate, Chai Latte, Herbal Tea, Fresh OJ, Smoothie, Croissant, Avocado Toast, Banana Bread

Respond ONLY with a JSON object with exactly these fields:
{
  "description": "short human-readable description of this scenario",
  "scenario": { ...only the relevant fields... },
  "reasoning": "one sentence explaining what this tests"
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const raw = data.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}