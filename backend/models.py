from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ProductOverride(BaseModel):
    name: str
    price: Optional[float] = None
    cost: Optional[float] = None
    discount: Optional[float] = Field(None, ge=0.0, le=1.0)
    popularity: Optional[float] = None
    caffeinated: Optional[bool] = None
    is_hot: Optional[bool] = None
    time_to_make: Optional[float] = None


class ScenarioRequest(BaseModel):
    description: Optional[str] = None
    n_staff: Optional[int] = Field(None, ge=1, le=50)
    staff_hourly_wage: Optional[float] = Field(None, ge=0)
    open_hour: Optional[float] = Field(None, ge=0, le=23)
    close_hour: Optional[float] = Field(None, ge=1, le=24)
    day_of_week: Optional[str] = Field(None, description="monday | weekday | friday | weekend | saturday | sunday")
    daily_fixed_cost: Optional[float] = Field(None, ge=0)
    special_multiplier: Optional[float] = Field(None, ge=0, description="Traffic multiplier for special events")

    product_overrides: Optional[List[ProductOverride]] = None
    remove_products: Optional[List[str]] = None
    apply_discount_to_all: Optional[float] = Field(None, ge=0, le=1)
    apply_discount_to_cold: Optional[float] = Field(None, ge=0, le=1)
    apply_discount_to_hot: Optional[float] = Field(None, ge=0, le=1)
    price_change_factor: Optional[float] = Field(None, gt=0, description="Multiply all prices, e.g. 1.15 = +15%")

    n_simulations: Optional[int] = Field(None, ge=10, le=2000)

    model_config = {
        "json_schema_extra": {
            "example": {
                "description": "5 staff on a weekend",
                "n_staff": 5,
                "day_of_week": "weekend",
                "n_simulations": 200
            }
        }
    }


class CompareRequest(BaseModel):
    scenarios: Dict[str, ScenarioRequest]
    n_simulations: Optional[int] = Field(200, ge=10, le=2000)

    model_config = {
        "json_schema_extra": {
            "example": {
                "n_simulations": 200,
                "scenarios": {
                    "five_staff":          {"n_staff": 5},
                    "price_hike_15pct":    {"price_change_factor": 1.15},
                    "cold_drink_discount": {"apply_discount_to_cold": 0.20}
                }
            }
        }
    }