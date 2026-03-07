"""
FastAPI Backend - The API that connects everything
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time

from simulation import run_monte_carlo, compare_scenarios
from ai_parser import parse_user_query, generate_insight

app = FastAPI(
    title="What-If Business Simulator",
    description="AI-powered digital twin for small business decision making",
    version="1.0.0"
)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Data Models ==============

class BusinessState(BaseModel):
    """Current state of the business"""
    name: str = "Pandosy Pastries"
    price: float = 5.00
    staff_count: int = 2
    customers_per_hour: float = 15
    staff_cost_per_day: float = 150

class SimulationRequest(BaseModel):
    """Request to run a simulation"""
    current: BusinessState
    new_price: Optional[float] = None
    new_staff: Optional[int] = None
    num_simulations: int = 500

class ChatRequest(BaseModel):
    """Natural language query from user"""
    message: str
    business_state: BusinessState

# ============== API Endpoints ==============

@app.get("/")
def root():
    return {
        "message": "What-If Business Simulator API",
        "status": "running",
        "endpoints": ["/simulate", "/chat", "/health"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/simulate")
def run_simulation(request: SimulationRequest):
    """
    Run a what-if simulation comparing current state to proposed changes.
    This is the core endpoint that powers the dashboard.
    """
    try:
        # Use current values if no changes specified
        new_price = request.new_price if request.new_price is not None else request.current.price
        new_staff = request.new_staff if request.new_staff is not None else request.current.staff_count
        
        # Run the comparison
        result = compare_scenarios(
            current_staff=request.current.staff_count,
            current_price=request.current.price,
            new_staff=new_staff,
            new_price=new_price,
            base_customers_per_hour=request.current.customers_per_hour,
            num_simulations=request.num_simulations
        )
        
        return {
            "success": True,
            "business_name": request.current.name,
            "current_state": {
                "price": request.current.price,
                "staff": request.current.staff_count
            },
            "proposed_state": {
                "price": new_price,
                "staff": new_staff
            },
            "results": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_simulation(request: ChatRequest):
    """
    The "magic" endpoint: Natural language to simulation.
    User types "What if I hire someone?" → We parse, simulate, and respond.
    """
    try:
        # Step 1: Parse the natural language query
        parsed = parse_user_query(
            query=request.message,
            current_price=request.business_state.price,
            current_staff=request.business_state.staff_count
        )
        
        # Step 2: Calculate new values
        new_price = request.business_state.price * (1 + parsed['price_change'])
        new_staff = max(1, request.business_state.staff_count + parsed['staff_change'])
        
        # Step 3: Run simulation
        result = compare_scenarios(
            current_staff=request.business_state.staff_count,
            current_price=request.business_state.price,
            new_staff=new_staff,
            new_price=new_price,
            base_customers_per_hour=request.business_state.customers_per_hour,
            num_simulations=500
        )
        
        # Step 4: Generate human-readable insight
        insight = generate_insight(result, request.message)
        
        return {
            "success": True,
            "parsed_intent": parsed,
            "proposed_changes": {
                "price": new_price,
                "price_change_percent": parsed['price_change'] * 100,
                "staff": new_staff,
                "staff_change": parsed['staff_change']
            },
            "simulation_results": result,
            "insight": insight
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quick-simulate")
def quick_simulate(
    staff: int = 2,
    price: float = 5.00,
    customers_per_hour: float = 15,
    simulations: int = 200
):
    """
    Quick simulation endpoint for sliders.
    Simpler than the full simulation - just returns results for one scenario.
    """
    try:
        result = run_monte_carlo(
            num_simulations=simulations,
            num_staff=staff,
            price=price,
            base_customers_per_hour=customers_per_hour
        )
        
        return {
            "success": True,
            "params": {
                "staff": staff,
                "price": price,
                "customers_per_hour": customers_per_hour
            },
            "results": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
