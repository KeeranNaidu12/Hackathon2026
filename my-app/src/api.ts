const API_BASE = "http://localhost:8000";

export interface BusinessState {
  name: string;
  price: number;
  staff_count: number;
  customers_per_hour: number;
  staff_cost_per_day: number;
}

export interface SimulationRequest {
  current: BusinessState;
  new_price?: number;
  new_staff?: number;
  num_simulations?: number;
}

export interface ChatRequest {
  message: string;
  business_state: BusinessState;
}

export interface StatsSummary {
  mean: number;
  min: number;
  max: number;
  p10: number;
  p50: number;
  p90: number;
  positive_probability?: number;
}

export interface SimulationResults {
  num_simulations: number;
  revenue: StatsSummary;
  profit: StatsSummary & { positive_probability: number };
  wait_time: { mean: number; max: number };
  customer_loss: { mean: number; max: number; loss_probability: number };
  distribution: { profits: number[]; revenues: number[] };
}

export interface ComparisonResult {
  current: SimulationResults;
  proposed: SimulationResults;
  comparison: {
    profit_change: number;
    profit_change_percent: number;
    revenue_change: number;
    wait_time_change: number;
    recommendation: string;
    confidence: number;
  };
}

export interface SimulateResponse {
  success: boolean;
  business_name: string;
  current_state: { price: number; staff: number };
  proposed_state: { price: number; staff: number };
  results: ComparisonResult;
}

export interface ChatResponse {
  success: boolean;
  parsed_intent: {
    price_change: number;
    staff_change: number;
    scenario_type: string;
    parsed_by: string;
  };
  proposed_changes: {
    price: number;
    price_change_percent: number;
    staff: number;
    staff_change: number;
  };
  simulation_results: ComparisonResult;
  insight: string;
}

export async function runSimulation(req: SimulationRequest): Promise<SimulateResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
