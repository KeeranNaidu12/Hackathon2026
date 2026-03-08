import copy
import config as default_cfg
from simulation import CafeConfig
from models import ScenarioRequest


def build_config(req: ScenarioRequest) -> CafeConfig:
    # Start with copies of default products
    products = [p.copy() for p in default_cfg.PRODUCTS]

    # Remove products
    if req.remove_products:
        products = [p for p in products if p["name"] not in req.remove_products]

    # Apply blanket price change
    if req.price_change_factor is not None:
        for p in products:
            p["price"] = round(p["price"] * req.price_change_factor, 2)

    # Apply discounts
    if req.apply_discount_to_all is not None:
        for p in products:
            p["discount"] = req.apply_discount_to_all

    if req.apply_discount_to_cold is not None:
        for p in products:
            if not p["is_hot"]:
                p["discount"] = req.apply_discount_to_cold

    if req.apply_discount_to_hot is not None:
        for p in products:
            if p["is_hot"]:
                p["discount"] = req.apply_discount_to_hot

    # Apply per-product overrides
    if req.product_overrides:
        product_map = {p["name"]: p for p in products}
        for override in req.product_overrides:
            if override.name in product_map:
                prod = product_map[override.name]
                for field in ["price", "cost", "discount", "popularity",
                              "caffeinated", "is_hot", "time_to_make"]:
                    val = getattr(override, field, None)
                    if val is not None:
                        prod[field] = val

    # Resolve hours
    open_hour  = req.open_hour  if req.open_hour  is not None else default_cfg.START_HOUR
    close_hour = req.close_hour if req.close_hour is not None else default_cfg.CLOSE_HOUR
    hours_open = close_hour - open_hour

    original_avg = sum(p["price"] for p in default_cfg.PRODUCTS) / len(default_cfg.PRODUCTS)
    new_avg = sum(p["price"] for p in products) / len(products)
    effective_price_change = (new_avg - original_avg) / original_avg

    return CafeConfig(
        products=products,
        n_staff=req.n_staff if req.n_staff is not None else default_cfg.NUM_STAFF,
        staff_hourly_wage=req.staff_hourly_wage if req.staff_hourly_wage is not None else default_cfg.STAFF_HOURLY_WAGE,
        hours_open=hours_open,
        open_hour=open_hour,
        day_of_week=req.day_of_week if req.day_of_week is not None else default_cfg.DAY_OF_WEEK,
        daily_fixed_cost=req.daily_fixed_cost if req.daily_fixed_cost is not None else default_cfg.DAILY_FIXED_COST,
        special_multiplier=req.special_multiplier if req.special_multiplier is not None else 1.0,
        price_change_pct=effective_price_change,
    )