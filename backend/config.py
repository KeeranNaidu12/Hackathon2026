# Defaults (FOR TESTING)
NUM_STAFF = 3
STAFF_HOURLY_WAGE = 15.0
START_HOUR = 7.0
CLOSE_HOUR = 19.0
DAY_OF_WEEK = "weekday"
DAILY_FIXED_COST = 200.0

PRODUCTS = [
    {"name": "Espresso",           "price": 3.00, "cost": 0.40, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 1.5, "popularity": 1.2},
    {"name": "Americano",          "price": 3.50, "cost": 0.50, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 2.0, "popularity": 1.8},
    {"name": "Flat White",         "price": 4.00, "cost": 0.75, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 2.5, "popularity": 2.0},
    {"name": "Cappuccino",         "price": 4.25, "cost": 0.80, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 2.5, "popularity": 1.9},
    {"name": "Latte",              "price": 4.50, "cost": 0.85, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 2.5, "popularity": 2.2},
    {"name": "Oat Milk Latte",     "price": 5.50, "cost": 1.20, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 2.5, "popularity": 1.7},
    {"name": "Mocha",              "price": 4.75, "cost": 1.00, "caffeinated": True,  "is_hot": True,  "discount": 0.00, "time_to_make": 3.0, "popularity": 1.5},
    {"name": "Iced Latte",         "price": 5.00, "cost": 1.00, "caffeinated": True,  "is_hot": False, "discount": 0.00, "time_to_make": 2.0, "popularity": 1.8},
    {"name": "Cold Brew",          "price": 5.50, "cost": 0.90, "caffeinated": True,  "is_hot": False, "discount": 0.00, "time_to_make": 1.0, "popularity": 1.6},
    {"name": "Iced Matcha Latte",  "price": 5.75, "cost": 1.30, "caffeinated": True,  "is_hot": False, "discount": 0.00, "time_to_make": 2.5, "popularity": 1.4},
    {"name": "Hot Chocolate",      "price": 4.00, "cost": 0.90, "caffeinated": False, "is_hot": True,  "discount": 0.00, "time_to_make": 2.0, "popularity": 1.3},
    {"name": "Chai Latte",         "price": 4.50, "cost": 0.95, "caffeinated": False, "is_hot": True,  "discount": 0.00, "time_to_make": 2.0, "popularity": 1.2},
    {"name": "Herbal Tea",         "price": 3.00, "cost": 0.30, "caffeinated": False, "is_hot": True,  "discount": 0.00, "time_to_make": 1.0, "popularity": 0.9},
    {"name": "Fresh OJ",           "price": 4.50, "cost": 1.20, "caffeinated": False, "is_hot": False, "discount": 0.00, "time_to_make": 1.5, "popularity": 1.0},
    {"name": "Smoothie",           "price": 6.00, "cost": 1.80, "caffeinated": False, "is_hot": False, "discount": 0.00, "time_to_make": 3.5, "popularity": 1.1},
    {"name": "Croissant",          "price": 3.50, "cost": 1.00, "caffeinated": False, "is_hot": True,  "discount": 0.00, "time_to_make": 1.0, "popularity": 1.6},
    {"name": "Avocado Toast",      "price": 9.00, "cost": 2.50, "caffeinated": False, "is_hot": True,  "discount": 0.00, "time_to_make": 5.0, "popularity": 1.3},
    {"name": "Banana Bread",       "price": 4.00, "cost": 0.90, "caffeinated": False, "is_hot": False, "discount": 0.00, "time_to_make": 0.5, "popularity": 1.4},
]

N_SIMS = 200