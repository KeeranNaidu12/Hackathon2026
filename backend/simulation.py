import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
from distributions import CustomerRV, ArrivalRateRV, WaitingTimeRV, PurchaseRV


@dataclass
class CafeConfig:
    products: list = field(default_factory=list)
    special_multiplier: float = 1.0
    n_staff: int = 3
    staff_hourly_wage: float = 15.0
    hours_open: float = 12.0
    open_hour: float = 7.0
    day_of_week: str = "weekday"
    daily_fixed_cost: float = 200.0
    price_change_pct: float = 0.0

    @property
    def close_hour(self) -> float:
        return self.open_hour + self.hours_open

    @property
    def daily_staff_cost(self) -> float:
        return self.n_staff * self.staff_hourly_wage * self.hours_open

    @property
    def total_daily_fixed(self) -> float:
        return self.daily_fixed_cost + self.daily_staff_cost

    @property
    def avg_discount(self) -> float:
        if not self.products:
            return 0.0
        return np.mean([p.get("discount", 0) for p in self.products])

    @property
    def day_multiplier(self) -> float:
        return {"weekday": 1.0, "weekend": 1.25, "monday": 0.75}.get(
            self.day_of_week, 1.0
        ) * self.special_multiplier


@dataclass
class DayResult:
    revenue: float = 0.0
    cogs: float = 0.0
    gross_profit: float = 0.0
    net_profit: float = 0.0
    n_customers_arrived: int = 0
    n_customers_served: int = 0
    n_customers_abandoned: int = 0
    avg_waiting_time: float = 0.0
    max_waiting_time: float = 0.0
    avg_transaction_value: float = 0.0
    items_sold: dict = field(default_factory=dict)
    utilization: float = 0.0


def simulate_day(config: CafeConfig, seed: Optional[int] = None) -> DayResult:
    rng = np.random.default_rng(seed)

    customer_rv = CustomerRV(rng=rng)
    arrival_rv  = ArrivalRateRV(rng=rng)
    waiting_rv  = WaitingTimeRV(n_staff=config.n_staff, rng=rng)
    purchase_rv = PurchaseRV(products=config.products, rng=rng)

    arrivals = arrival_rv.arrival_times(
        open_hour=config.open_hour,
        close_hour=config.close_hour,
        avg_discount=config.avg_discount,
        avg_price_change=config.price_change_pct,
        day_multiplier=config.day_multiplier,
    )
    n_arrived = len(arrivals)

    if n_arrived == 0:
        return DayResult()

    # Proper discrete-event queue: track when each server becomes free
    server_free_at = np.full(config.n_staff, config.open_hour, dtype=float)

    result = DayResult()
    result.n_customers_arrived = n_arrived

    waiting_times_served = []
    items_sold = {p["name"]: 0 for p in config.products}
    total_busy_time = 0.0

    customers    = customer_rv.sample(n_arrived, time_of_day=config.open_hour + config.hours_open / 2)
    patience_arr = waiting_rv.customer_patience(n_arrived)

    for idx in range(n_arrived):
        arrival_t = arrivals[idx]
        cust      = {k: customers[k][idx] for k in customers}
        patience  = patience_arr[idx]

        next_free_server = np.argmin(server_free_at)
        server_ready_t   = server_free_at[next_free_server]

        wait_min = max(0.0, server_ready_t - arrival_t) * 60.0

        if wait_min > patience:
            result.n_customers_abandoned += 1
            continue

        purchase_vec = purchase_rv.purchase(cust, wait_min, patience)

        if purchase_vec.sum() == 0:
            result.n_customers_abandoned += 1
            continue

        ordered_items = []
        for i, cnt in enumerate(purchase_vec):
            ordered_items.extend([config.products[i]["time_to_make"]] * cnt)

        service_time_min = waiting_rv.service_time(ordered_items)
        service_time_hrs = service_time_min / 60.0

        start_service_t = max(arrival_t, server_ready_t)
        server_free_at[next_free_server] = start_service_t + service_time_hrs
        total_busy_time += service_time_hrs

        revenue = sum(
            purchase_vec[i] * config.products[i]["price"] * (1 - config.products[i].get("discount", 0))
            for i in range(len(config.products))
        )
        cogs = sum(
            purchase_vec[i] * config.products[i]["cost"]
            for i in range(len(config.products))
        )

        result.revenue += revenue
        result.cogs    += cogs
        result.n_customers_served += 1
        waiting_times_served.append(wait_min)

        for i, cnt in enumerate(purchase_vec):
            if cnt > 0:
                items_sold[config.products[i]["name"]] += int(cnt)

    result.gross_profit = result.revenue - result.cogs
    result.net_profit   = result.gross_profit - config.total_daily_fixed
    result.items_sold   = items_sold

    if waiting_times_served:
        result.avg_waiting_time = float(np.mean(waiting_times_served))
        result.max_waiting_time = float(np.max(waiting_times_served))

    if result.n_customers_served > 0:
        result.avg_transaction_value = result.revenue / result.n_customers_served

    available_server_hours = config.n_staff * config.hours_open
    result.utilization = min(1.0, total_busy_time / available_server_hours)

    return result


def _summarise(arr: np.ndarray) -> dict:
    return {
        "mean":   float(np.mean(arr)),
        "median": float(np.median(arr)),
        "std":    float(np.std(arr)),
        "p5":     float(np.percentile(arr, 5)),
        "p25":    float(np.percentile(arr, 25)),
        "p75":    float(np.percentile(arr, 75)),
        "p95":    float(np.percentile(arr, 95)),
    }


def run_simulation(config: CafeConfig, n_simulations: int = 200, base_seed: int = 42) -> dict:
    """Run n_simulations days and return aggregated statistics dict."""
    results = [simulate_day(config, seed=base_seed + i) for i in range(n_simulations)]

    rows = []
    for r in results:
        row = {
            "revenue":               r.revenue,
            "cogs":                  r.cogs,
            "gross_profit":          r.gross_profit,
            "net_profit":            r.net_profit,
            "n_customers_arrived":   r.n_customers_arrived,
            "n_customers_served":    r.n_customers_served,
            "n_customers_abandoned": r.n_customers_abandoned,
            "avg_waiting_time":      r.avg_waiting_time,
            "max_waiting_time":      r.max_waiting_time,
            "avg_transaction_value": r.avg_transaction_value,
            "utilization":           r.utilization,
        }
        for prod_name, cnt in r.items_sold.items():
            row[f"sold_{prod_name}"] = cnt
        rows.append(row)

    df = pd.DataFrame(rows)
    item_cols = [c for c in df.columns if c.startswith("sold_")]

    return {
        "n_simulations":        n_simulations,
        "revenue":              _summarise(df["revenue"].values),
        "net_profit":           _summarise(df["net_profit"].values),
        "gross_profit":         _summarise(df["gross_profit"].values),
        "avg_waiting_time":     _summarise(df["avg_waiting_time"].values),
        "max_waiting_time":     _summarise(df["max_waiting_time"].values),
        "customers_served":     _summarise(df["n_customers_served"].values),
        "customers_abandoned":  _summarise(df["n_customers_abandoned"].values),
        "utilization":          _summarise(df["utilization"].values),
        "avg_transaction":      _summarise(df["avg_transaction_value"].values),
        "gross_margin_pct":     100 * df["gross_profit"].mean() / max(df["revenue"].mean(), 1),
        "abandonment_rate_pct": 100 * df["n_customers_abandoned"].mean() /
                                max(df["n_customers_served"].mean() + df["n_customers_abandoned"].mean(), 1),
        "product_sales": {
            c.replace("sold_", ""): {
                "mean_daily_sales": float(df[c].mean()),
                "total_sales":      int(df[c].sum()),
            }
            for c in item_cols
        },
    }


def compare_scenarios(
    base_config: CafeConfig,
    scenarios: dict,
    n_simulations: int = 200,
    base_seed: int = 42,
) -> dict:
    results = {"baseline": run_simulation(base_config, n_simulations, base_seed)}
    for name, cfg in scenarios.items():
        results[name] = run_simulation(cfg, n_simulations, base_seed)

    baseline_profit = results["baseline"]["net_profit"]["mean"]
    baseline_wait   = results["baseline"]["avg_waiting_time"]["mean"]
    for name, res in results.items():
        res["delta_net_profit_pct"] = (
            (res["net_profit"]["mean"] - baseline_profit) / abs(baseline_profit) * 100
            if baseline_profit != 0 else 0.0
        )
        res["delta_avg_wait_min"] = res["avg_waiting_time"]["mean"] - baseline_wait

    return results