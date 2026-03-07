
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import time

from simulation import run_monte_carlo, compare_scenarios
from ai_parser import parse_user_query, generate_insight
from csv_parser import parse_sales_csv

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

class BusinessState(BaseModel):
    """Current state of the business"""
    name: str = "Pandosy Pastries"
    price: float = 5.00
    staff_count: int = 2
    customers_per_hour: float = 15
    demand_std_dev: float = 3.0
    operating_hours: float = 8.0
    staff_cost_per_day: float = 150

class SimulationRequest(BaseModel):
    """Request to run a simulation"""
    current: BusinessState
    new_price: Optional[float] = None
    new_staff: Optional[int] = None
    new_operating_hours: Optional[float] = None
    num_simulations: int = 500

class ChatRequest(BaseModel):
    """Natural language query from user"""
    message: str
    business_state: BusinessState

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
        new_hours = request.new_operating_hours if request.new_operating_hours is not None else request.current.operating_hours
        
        # Run the comparison
        result = compare_scenarios(
            current_staff=request.current.staff_count,
            current_price=request.current.price,
            new_staff=new_staff,
            new_price=new_price,
            base_customers_per_hour=request.current.customers_per_hour,
            demand_std_dev=request.current.demand_std_dev,
            current_shift_hours=int(request.current.operating_hours),
            new_shift_hours=int(new_hours),
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
    """Natural language to simulation: parse intent, run comparison, return insight."""
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

@app.get("/download-sample/{filename}")
def download_sample(filename: str):
    """
    Serve a sample CSV file for download.
    Allowed filenames: sample_coffee_shop.csv, sample_data.csv
    """
    allowed = {"pandosy_pastries_sample.csv", "sample_coffee_shop.csv", "sample_data.csv"}
    if filename not in allowed:
        raise HTTPException(status_code=404, detail="Sample file not found.")
    path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample file not found.")
    return FileResponse(path, media_type="text/csv", filename=filename)


class CSVUploadRequest(BaseModel):
    content: str

@app.post("/upload-csv")
def upload_csv(request: CSVUploadRequest):
    """
    Accept CSV file content as a JSON string and extract simulation parameters.
    """
    try:
        params = parse_sales_csv(request.content)
        return {"success": True, **params}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
