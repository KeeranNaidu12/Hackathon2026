"""
SimPy-based Coffee Shop Simulation Engine
This is the "Digital Twin" of a small business
"""
import simpy
import random
import numpy as np
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class SimulationResult:
    revenue: float
    avg_wait_time: float
    customers_served: int
    customers_lost: int  # Left due to long wait
    total_customers: int

def coffee_shop_customer(env, customer_id, baristas, stats, price, patience_minutes=10):
    """Simulate a single customer's journey through the coffee shop."""
    arrival_time = env.now
    stats['total_customers'] += 1
    
    with baristas.request() as request:
        # Customer waits, but has limited patience
        result = yield request | env.timeout(patience_minutes)
        
        if request in result:
            # Customer got served
            wait_time = env.now - arrival_time
            stats['wait_times'].append(wait_time)
            
            # Service takes 2-5 minutes
            service_time = random.uniform(2, 5)
            yield env.timeout(service_time)
            
            stats['revenue'] += price
            stats['customers_served'] += 1
        else:
            # Customer left (reneged) due to long wait
            stats['customers_lost'] += 1

def customer_generator(env, baristas, stats, arrival_rate, price):
    """Generate customers with Poisson arrival pattern."""
    customer_id = 0
    while True:
        # Poisson process: time between arrivals follows exponential distribution
        yield env.timeout(random.expovariate(arrival_rate))
        customer_id += 1
        env.process(coffee_shop_customer(env, customer_id, baristas, stats, price))

def run_single_day(
    num_staff: int = 2,
    price: float = 5.00,
    base_customers_per_hour: float = 15,
    shift_hours: int = 8
) -> SimulationResult:
    """Run a single day simulation."""
    env = simpy.Environment()
    baristas = simpy.Resource(env, capacity=num_staff)
    
    stats = {
        'wait_times': [],
        'revenue': 0,
        'customers_served': 0,
        'customers_lost': 0,
        'total_customers': 0
    }
    
    # Arrival rate: customers per minute
    arrival_rate = base_customers_per_hour / 60
    
    env.process(customer_generator(env, baristas, stats, arrival_rate, price))
    env.run(until=shift_hours * 60)  # Convert hours to minutes
    
    avg_wait = np.mean(stats['wait_times']) if stats['wait_times'] else 0
    
    return SimulationResult(
        revenue=stats['revenue'],
        avg_wait_time=avg_wait,
        customers_served=stats['customers_served'],
        customers_lost=stats['customers_lost'],
        total_customers=stats['total_customers']
    )

def run_monte_carlo(
    num_simulations: int = 500,
    num_staff: int = 2,
    price: float = 5.00,
    base_customers_per_hour: float = 15,
    staff_cost_per_day: float = 150
) -> Dict:
    """
    Run Monte Carlo simulation - the CORE of your "What-If" engine.
    Runs the business hundreds of times to show probability distributions.
    """
    results = []
    
    for _ in range(num_simulations):
        day_result = run_single_day(
            num_staff=num_staff,
            price=price,
            base_customers_per_hour=base_customers_per_hour
        )
        
        # Calculate profit
        total_staff_cost = num_staff * staff_cost_per_day
        profit = day_result.revenue - total_staff_cost
        
        results.append({
            'revenue': day_result.revenue,
            'profit': profit,
            'avg_wait_time': day_result.avg_wait_time,
            'customers_served': day_result.customers_served,
            'customers_lost': day_result.customers_lost,
            'total_customers': day_result.total_customers
        })
    
    # Aggregate results into probability insights
    revenues = [r['revenue'] for r in results]
    profits = [r['profit'] for r in results]
    wait_times = [r['avg_wait_time'] for r in results]
    lost_customers = [r['customers_lost'] for r in results]
    
    return {
        'num_simulations': num_simulations,
        'revenue': {
            'mean': np.mean(revenues),
            'min': np.min(revenues),
            'max': np.max(revenues),
            'p10': np.percentile(revenues, 10),
            'p50': np.percentile(revenues, 50),
            'p90': np.percentile(revenues, 90),
        },
        'profit': {
            'mean': np.mean(profits),
            'min': np.min(profits),
            'max': np.max(profits),
            'p10': np.percentile(profits, 10),
            'p50': np.percentile(profits, 50),
            'p90': np.percentile(profits, 90),
            'positive_probability': sum(1 for p in profits if p > 0) / len(profits) * 100
        },
        'wait_time': {
            'mean': np.mean(wait_times),
            'max': np.max(wait_times),
        },
        'customer_loss': {
            'mean': np.mean(lost_customers),
            'max': np.max(lost_customers),
            'loss_probability': sum(1 for l in lost_customers if l > 5) / len(lost_customers) * 100
        },
        # For histogram/distribution chart
        'distribution': {
            'profits': [float(p) for p in np.percentile(profits, range(0, 101, 5))],
            'revenues': [float(r) for r in np.percentile(revenues, range(0, 101, 5))]
        }
    }

def compare_scenarios(
    current_staff: int,
    current_price: float,
    new_staff: int,
    new_price: float,
    base_customers_per_hour: float = 15,
    num_simulations: int = 500
) -> Dict:
    """
    The KILLER feature: Compare current vs proposed scenario.
    This is what makes the demo "wow" the judges.
    """
    current = run_monte_carlo(
        num_simulations=num_simulations,
        num_staff=current_staff,
        price=current_price,
        base_customers_per_hour=base_customers_per_hour
    )
    
    proposed = run_monte_carlo(
        num_simulations=num_simulations,
        num_staff=new_staff,
        price=new_price,
        base_customers_per_hour=base_customers_per_hour
    )
    
    # Calculate improvement metrics
    profit_improvement = proposed['profit']['mean'] - current['profit']['mean']
    revenue_improvement = proposed['revenue']['mean'] - current['revenue']['mean']
    wait_time_change = proposed['wait_time']['mean'] - current['wait_time']['mean']
    
    return {
        'current': current,
        'proposed': proposed,
        'comparison': {
            'profit_change': profit_improvement,
            'profit_change_percent': (profit_improvement / abs(current['profit']['mean'])) * 100 if current['profit']['mean'] != 0 else 0,
            'revenue_change': revenue_improvement,
            'wait_time_change': wait_time_change,
            'recommendation': 'RECOMMENDED' if profit_improvement > 0 else 'NOT RECOMMENDED',
            'confidence': proposed['profit']['positive_probability']
        }
    }


# Quick test
if __name__ == "__main__":
    print("Running simulation test...")
    result = compare_scenarios(
        current_staff=2,
        current_price=5.00,
        new_staff=3,
        new_price=5.00,
        num_simulations=100
    )
    print(f"Current avg profit: ${result['current']['profit']['mean']:.2f}")
    print(f"Proposed avg profit: ${result['proposed']['profit']['mean']:.2f}")
    print(f"Recommendation: {result['comparison']['recommendation']}")
