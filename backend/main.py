from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config as default_cfg
from models import ScenarioRequest, CompareRequest
from simulation import CafeConfig, run_simulation, compare_scenarios
from scenario_builder import build_config


def _baseline_config() -> CafeConfig:
    return CafeConfig(
        products=[p.copy() for p in default_cfg.PRODUCTS],
        n_staff=default_cfg.NUM_STAFF,
        staff_hourly_wage=default_cfg.STAFF_HOURLY_WAGE,
        hours_open=default_cfg.CLOSE_HOUR - default_cfg.START_HOUR,
        open_hour=default_cfg.START_HOUR,
        day_of_week=default_cfg.DAY_OF_WEEK,
        daily_fixed_cost=default_cfg.DAILY_FIXED_COST,
    )


def _format_result(raw: dict, description: Optional[str] = None) -> dict:
    """Reshape simulation output into clean API response."""
    return {
        "scenario_description":  description,
        "n_simulations":         raw["n_simulations"],

        # Per-metric distribution stats
        "revenue":               raw["revenue"],
        "net_profit":            raw["net_profit"],
        "gross_profit":          raw["gross_profit"],
        "avg_wait_min":          raw["avg_waiting_time"],
        "max_wait_min":          raw["max_waiting_time"],
        "customers_served":      raw["customers_served"],
        "customers_abandoned":   raw["customers_abandoned"],
        "staff_utilization":     raw["utilization"],
        "avg_transaction":       raw["avg_transaction"],

        # Scalar summaries
        "gross_margin_pct":      raw["gross_margin_pct"],
        "abandonment_rate_pct":  raw["abandonment_rate_pct"],

        # Product breakdown
        "product_sales":         raw["product_sales"],

        # Deltas vs baseline (None for baseline itself)
        "delta_net_profit_pct":  raw.get("delta_net_profit_pct"),
        "delta_avg_wait_min":    raw.get("delta_avg_wait_min"),
    }


app = FastAPI(
    title="Cafe Simulation API",
    description="Monte Carlo discrete-event simulation for cafe hypothesis testing.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Info"])
def root():
    return {
        "message": "Cafe Simulation API",
        "docs": "/docs",
        "endpoints": ["/baseline", "/simulate", "/compare", "/products"],
    }


@app.get("/products", tags=["Info"])
def list_products():
    return {"products": default_cfg.PRODUCTS}


@app.get("/baseline", tags=["Simulation"])
def run_baseline(n_simulations: int = default_cfg.N_SIMS):
    """Run simulation with all default settings."""
    raw = run_simulation(_baseline_config(), n_simulations=n_simulations)
    return _format_result(raw, description="Baseline (default settings)")


@app.post("/simulate", tags=["Simulation"])
def simulate_scenario(req: ScenarioRequest):
    """Run a single custom scenario. Omitted fields fall back to defaults."""
    n_sims = req.n_simulations or default_cfg.N_SIMS
    raw    = run_simulation(build_config(req), n_simulations=n_sims)
    return _format_result(raw, description=req.description)


@app.post("/compare", tags=["Simulation"])
def compare(req: CompareRequest):
    """
    Compare multiple named scenarios against the baseline in one call.
    Returns baseline + all scenarios, each with delta_net_profit_pct and delta_avg_wait_min.
    """
    n_sims        = req.n_simulations or default_cfg.N_SIMS
    scenario_cfgs = {name: build_config(s) for name, s in req.scenarios.items()}
    raw_results   = compare_scenarios(_baseline_config(), scenario_cfgs, n_simulations=n_sims)

    return {
        name: _format_result(
            raw,
            description=req.scenarios[name].description if name != "baseline" else "Baseline",
        )
        for name, raw in raw_results.items()
    }