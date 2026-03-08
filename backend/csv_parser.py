import pandas as pd
import numpy as np
from io import StringIO


def parse_sales_csv(content: str) -> dict:
    """Parse a sales CSV and return simulation parameters."""
    try:
        df = pd.read_csv(StringIO(content))
    except Exception as e:
        raise ValueError(f"Could not parse CSV: {e}")

    if df.empty:
        raise ValueError("CSV file is empty.")

    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

    avg_price = None
    customers_per_hour = None
    customers_std_dev = 0.0
    staff_count = None
    staff_cost_per_day = None
    business_name = None

    # detect columns
    price_col       = _find_col(df, ["avg_item_price", "price", "avg_price",
                                     "transaction_amount", "amount", "avg_sale"])
    revenue_col     = _find_col(df, ["total_revenue", "revenue", "sales"])
    customer_col    = _find_col(df, ["customers_served", "customers", "total_customers",
                                     "transactions", "orders", "covers", "visits", "count"])
    staff_col       = _find_col(df, ["staff_on_shift", "staff", "avg_staff",
                                     "staff_count", "employees"])
    staff_cost_col  = _find_col(df, ["staff_cost", "labour_cost", "labor_cost",
                                     "wage_cost", "staff_cost_per_day"])
    hour_col        = _find_col(df, ["hour"])
    name_col        = _find_col(df, ["business_name", "business", "shop", "cafe",
                                     "restaurant", "name", "location"])

    # Track which raw column each param came from (for the UI)
    columns_detected: dict[str, str | None] = {
        "avg_price":          price_col,
        "customers_per_hour": customer_col,
        "staff_count":        staff_col,
        "business_name":      name_col,
    }

    # avg price
    if price_col:
        col_data = pd.to_numeric(df[price_col], errors="coerce").dropna()
        avg_price = float(col_data.mean())
    elif revenue_col and customer_col:
        rev  = pd.to_numeric(df[revenue_col],  errors="coerce")
        cust = pd.to_numeric(df[customer_col], errors="coerce")
        ratio = (rev / cust.replace(0, np.nan)).dropna()
        avg_price = float(ratio.mean())
        columns_detected["avg_price"] = f"{revenue_col} ÷ {customer_col}"

    # customers per hour + variance
    if customer_col:
        cust_raw = pd.to_numeric(df[customer_col], errors="coerce").dropna()

        if hour_col is not None:
            # Hourly rows — values are already customers/hour
            hourly_vals = cust_raw
        else:
            # Daily rows — scale down to per-hour (assume 8-hr day)
            hourly_vals = cust_raw / 8

        customers_per_hour = float(hourly_vals.mean())
        customers_std_dev  = float(hourly_vals.std())

    # staff count
    if staff_col:
        staff_data = pd.to_numeric(df[staff_col], errors="coerce").dropna()
        staff_count = max(1, int(round(staff_data.mean())))

    # staff cost
    if staff_cost_col:
        cost_data = pd.to_numeric(df[staff_cost_col], errors="coerce").dropna()
        if len(cost_data) > 0:
            staff_cost_per_day = float(cost_data.mean())

    # operating hours
    date_col = _find_col(df, ["date"])
    avg_operating_hours = 8.0  # default
    if date_col and hour_col:
        # Count distinct hours per date, then average across dates
        daily_hour_counts = df.groupby(date_col)[hour_col].nunique()
        avg_operating_hours = round(float(daily_hour_counts.mean()), 1)
    avg_operating_hours = max(1.0, min(24.0, avg_operating_hours))

    # business name
    if name_col:
        names = df[name_col].dropna().unique()
        if len(names) > 0:
            business_name = str(names[0])

    # defaults
    if avg_price is None:
        avg_price = 5.00
    if customers_per_hour is None:
        customers_per_hour = 15.0
    if staff_count is None:
        staff_count = 2
    if staff_cost_per_day is None:
        staff_cost_per_day = staff_count * 150

    avg_price          = max(1.0,  min(50.0,  round(avg_price, 2)))
    customers_per_hour = max(1.0,  min(100.0, round(customers_per_hour, 1)))
    customers_std_dev  = max(0.0,  min(50.0,  round(customers_std_dev, 1)))
    staff_cost_per_day = max(50.0, round(staff_cost_per_day, 2))

    rows = len(df)
    summary = (
        f"Loaded {rows} rows. "
        f"Avg price ${avg_price:.2f}, "
        f"~{customers_per_hour:.0f} customers/hr, "
        f"{staff_count} staff."
    )

    return {
        "avg_price":          avg_price,
        "customers_per_hour": customers_per_hour,
        "customers_std_dev":  customers_std_dev,
        "avg_operating_hours": avg_operating_hours,
        "staff_count":        staff_count,
        "staff_cost_per_day": staff_cost_per_day,
        "business_name":      business_name,
        "rows_loaded":        rows,
        "columns_detected":   columns_detected,
        "summary":            summary,
    }


def _find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    """Return the first column name that matches any candidate keyword."""
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
    # Partial match fallback
    for candidate in candidates:
        for col in df.columns:
            if candidate in col:
                return col
    return None
