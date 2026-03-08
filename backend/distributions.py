import numpy as np
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CustomerRV:
    rng: np.random.Generator = field(default_factory=lambda: np.random.default_rng())

    def sample(self, n: int = 1, time_of_day: float = 12.0) -> dict:
        mask = self.rng.random(n) < 0.55
        ages = np.where(
            mask,
            self.rng.normal(25, 5, n),
            self.rng.normal(40, 8, n),
        ).clip(16, 80)
        avg_spending = self.rng.lognormal(mean=np.log(8), sigma=0.4, size=n).clip(3, 50)
        price_sensitivity = self.rng.beta(2, 5, n)
        p_caffeine = 1 / (1 + np.exp(-0.05 * (ages - 20)))
        caffeine_pref = self.rng.random(n) < p_caffeine
        p_hot = 0.5 + 0.3 * np.cos(np.pi * (time_of_day - 8) / 10)
        p_hot = float(np.clip(p_hot, 0.2, 0.85))
        hot_pref = self.rng.random(n) < p_hot
        return {
            "age": ages,
            "avg_spending": avg_spending,
            "price_sensitivity": price_sensitivity,
            "caffeine_pref": caffeine_pref,
            "hot_pref": hot_pref,
        }


class ArrivalRateRV:
    def __init__(self, rng: Optional[np.random.Generator] = None):
        self.rng = rng or np.random.default_rng()
        self.peaks = [
            (8.0,  20.0, 1.0),
            (12.5, 18.0, 1.2),
            (15.5, 10.0, 1.5),
        ]

    def base_rate(self, t: float) -> float:
        rate = sum(A * np.exp(-0.5 * ((t - mu) / sigma) ** 2) for mu, A, sigma in self.peaks)
        return max(rate, 0.5)

    def arrival_times(self, open_hour, close_hour, avg_discount=0.0,
                      avg_price_change=0.0, day_multiplier=1.0) -> np.ndarray:
        discount_lift = 1 + 0.8 * avg_discount
        price_drag    = 1 - 0.9 * avg_price_change
        multiplier    = day_multiplier * discount_lift * price_drag
        t_vals = np.linspace(open_hour, close_hour, 1000)
        lambda_max = max(self.base_rate(t) for t in t_vals) * multiplier
        arrivals = []
        t = open_hour
        while t < close_hour:
            t += self.rng.exponential(1.0 / lambda_max)
            if t >= close_hour:
                break
            if self.rng.random() < (self.base_rate(t) * multiplier) / lambda_max:
                arrivals.append(t)
        return np.array(arrivals)


class WaitingTimeRV:
    def __init__(self, n_staff: int, rng: Optional[np.random.Generator] = None):
        self.n_staff = n_staff
        self.rng = rng or np.random.default_rng()

    def service_time(self, items_times: list) -> float:
        if not items_times:
            return self.rng.lognormal(np.log(0.5), 0.2)
        return sum(self.rng.lognormal(np.log(max(t, 0.1)), 0.2) for t in items_times)

    def waiting_time(self, queue_length: int, avg_service_time: float) -> float:
        if queue_length == 0:
            return abs(self.rng.normal(0.3, 0.2))
        throughput_rate = self.n_staff / avg_service_time
        base_wait = queue_length / throughput_rate
        return max(0.0, base_wait + self.rng.normal(0, 0.3))

    def customer_patience(self, n: int = 1) -> np.ndarray:
        return self.rng.lognormal(np.log(8), 0.5, n).clip(1, 45)


class PurchaseRV:
    def __init__(self, products: list, rng: Optional[np.random.Generator] = None):
        self.products = products
        self.n = len(products)
        self.rng = rng or np.random.default_rng()

    def purchase(self, customer: dict, waiting_time: float, patience: float) -> np.ndarray:
        if waiting_time > patience:
            return np.zeros(self.n, dtype=int)
        utilities = np.zeros(self.n)
        for i, prod in enumerate(self.products):
            u = prod.get("popularity", 1.0)
            if prod["caffeinated"] and customer["caffeine_pref"]:
                u += 0.5
            elif not prod["caffeinated"] and not customer["caffeine_pref"]:
                u += 0.3
            if prod["is_hot"] == customer["hot_pref"]:
                u += 0.4
            normalized_price = prod["price"] * (1 - prod.get("discount", 0))
            u -= customer["price_sensitivity"] * (normalized_price / max(customer["avg_spending"], 1)) * 4
            u += prod.get("discount", 0) * 1.5
            u -= 0.5 * (waiting_time / max(patience, 1))
            utilities[i] = u
        utilities_with_exit = np.append(utilities, 0.0)
        probs = self._softmax(utilities_with_exit)
        n_decisions = self.rng.poisson(1.4) + 1
        purchases = np.zeros(self.n, dtype=int)
        for _ in range(n_decisions):
            choice = self.rng.choice(self.n + 1, p=probs)
            if choice < self.n:
                purchases[choice] += 1
        return purchases

    @staticmethod
    def _softmax(x: np.ndarray) -> np.ndarray:
        e = np.exp(x - x.max())
        return e / e.sum()