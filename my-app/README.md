# ☕ Brewlytics — Café Business Digital Twin

> **Hackathon 2026** — Simulate pricing changes, staffing decisions, and growth scenarios *before* committing a single dollar.

![Python](https://img.shields.io/badge/Python-3.11+-blue) ![React](https://img.shields.io/badge/React-19-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688) ![NumPy](https://img.shields.io/badge/NumPy-1.26-013243)

---

# 📌 What Is This?

Brewlytics is a **Digital Twin simulation engine for cafés and small food businesses**.

Instead of guessing whether raising prices or hiring staff is a good idea, Brewlytics runs **Monte Carlo simulations of entire business days** using a **stochastic discrete-event simulation (DES)** model.

The system predicts **full distributions of outcomes** rather than a single forecast.

### It answers questions like

* *What happens if I raise latte prices by 10%?*
* *Should I hire another barista during lunch rush?*
* *Will a 20% cold drink discount increase profit or hurt margins?*

Each scenario simulates **hundreds of possible business days** and reports:

* Revenue distribution (P5–P95)
* Profit distribution
* Wait time distribution
* Abandonment rate
* Per-product demand changes

---

# 🎯 Key Features

### 📊 Monte Carlo Business Simulation

Runs hundreds of simulated days to produce **risk distributions**.

### 🧠 AI Hypothesis Builder

Users can type natural language scenarios:

> “Run a 20% discount on cold drinks Friday afternoons”

GPT converts this into a simulation configuration automatically.

### 🧮 Queue + Demand Modeling

Captures realistic operational dynamics:

* Customer arrivals
* Queue waiting
* Purchase behavior
* Abandonment when waits are too long

### 📦 Product-Level Insights

Shows which products **gain or lose sales** under pricing changes.

---

# 🏗️ Architecture

```
┌─────────────────────┐      HTTP/JSON       ┌──────────────────────────────┐
│   React Frontend     │ ◄──────────────────► │   FastAPI Backend             │
│   (Vite + TypeScript)│                      │                                │
│                      │                      │  • Monte Carlo Engine         │
│  • Hypothesis Lab    │    POST /simulate    │  • Discrete Event Simulation  │
│  • AI Chat           │    POST /compare     │  • Queue Model (M/G/c)        │
│  • Sliders           │    GET  /baseline    │  • NHPP Arrival Model         │
│  • Results Dashboard │    GET  /products    │  • Multinomial Logit Demand   │
│                      │                      │                                │
└─────────────────────┘                      └──────────────────────────────┘
```

---

# 📂 Project Structure

```
Brewlytics/
├── backend/
│   ├── server.py
│   ├── simulation.py
│   ├── distributions.py
│   ├── scenario_builder.py
│   ├── models.py
│   └── config.py
│
├── frontend/
│   ├── src/
│   │   ├── api.ts
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Simulator.tsx
│   │   │   └── Results.tsx
│   │   └── components/
│
└── README.md
```

---

# 🚀 Running the Project

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

Backend runs at:

```
http://localhost:8000
```

Docs:

```
http://localhost:8000/docs
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 🧠 Statistical Model

The simulation models a café using **four coupled stochastic processes**.

| Symbol | Component           | Distribution                      |
| ------ | ------------------- | --------------------------------- |
| C      | Customer attributes | Gaussian Mixture, LogNormal, Beta |
| E      | Arrival process     | Non-Homogeneous Poisson Process   |
| W      | Waiting time        | M/G/c Queue                       |
| P      | Purchase decisions  | Multinomial Logit                 |

The dependencies form the following structure:

```
Arrival process → Customer → Queue → Purchase decisions
```

More formally:

$$
P(P \mid C, W, products)
\rightarrow
W(queue \mid P, staff)
\rightarrow
E(t \mid prices, discounts)
$$

---

# 📈 Customer Model

Each arriving customer has a vector of attributes:

$$
C = (age, spending, price_sensitivity, caffeine_pref, hot_pref)
$$

### Age Distribution

A **two-component Gaussian mixture**

$$
Age \sim \pi_1 N(\mu_1, \sigma_1^2) + (1-\pi_1)N(\mu_2,\sigma_2^2)
$$

Example parameters:

```
55%: N(25, 5²)
45%: N(40, 8²)
```

This models **student vs professional demographics**.

---

### Spending Distribution

Spending is **LogNormal**:

$$
X \sim LogNormal(\mu, \sigma)
$$

MLE estimation:

$$
\hat{\mu} = \frac{1}{n}\sum \ln x_i
$$

$$
\hat{\sigma}^2 =
\frac{1}{n}\sum (\ln x_i - \hat{\mu})^2
$$

This captures the **right-skewed nature of transaction sizes**. 

---

### Price Sensitivity

$$
PriceSensitivity \sim Beta(\alpha,\beta)
$$

Estimated using **method of moments**:

$$
\kappa = \frac{\bar{x}(1-\bar{x})}{s^2} - 1
$$

$$
\alpha = \bar{x}\kappa
$$

$$
\beta = (1-\bar{x})\kappa
$$

This constrains sensitivity to **[0,1]**. 

---

### Caffeine Preference

Modeled with **logistic regression**:

$$
p_{caff}(age)
=============

\frac{1}{1 + e^{-(\beta_0 + \beta_1 age)}}
$$

Older customers are more likely to choose caffeinated drinks. 

---

### Hot vs Cold Preference

Time-of-day dependence:

$$
p_{hot}(t) =
A + B\cos\left(\frac{\pi(t-\phi)}{10}\right)
$$

Morning customers prefer hot drinks; afternoon customers prefer cold drinks. 

---

# 👥 Arrival Model

Customer arrivals follow a **Non-Homogeneous Poisson Process (NHPP)**.

$$
N(t) \sim Poisson(\lambda(t))
$$

The rate varies over the day:

$$
\lambda(t) =
\sum_{k=1}^{3}
A_k
\exp
\left(
-\frac{(t-\mu_k)^2}{2\sigma_k^2}
\right)
$$

representing:

* morning rush
* lunch rush
* afternoon traffic. 

---

### Demand Modifiers

The arrival rate adjusts dynamically:

$$
\lambda_{eff}(t)
================

\lambda(t)
\times
discount_lift
\times
price_drag
\times
day_multiplier
$$

Example:

```
discount_lift = 1 + 0.8 × discount
price_drag = 1 − 0.5 × price_change
```

---

# ⏱️ Queue Model

Service is modeled as an **M/G/c queue**.

* **M** — Poisson arrivals
* **G** — General service distribution
* **c** — number of staff

Waiting time:

$$
W_q =
\max(0, t_{server_free} - t_{arrival})
$$

---

### Service Time

Per-item service time:

$$
ServiceTime \sim LogNormal(\ln t_{make}, \sigma)
$$

Total service time:

$$
T = \sum_i ServiceTime_i
$$

This captures **barista variability** and occasional slowdowns. 

---

### Customer Patience

$$
Patience \sim LogNormal(\ln(8), 0.5)
$$

Customers abandon if:

$$
wait > patience
$$

Median patience ≈ **8 minutes**. 

---

# 🛒 Purchase Model

Customers choose products using a **Multinomial Logit model**.

Utility of product (i):

$$
u_i =
pop_i

* 0.5[caff\ match]
* 0.4[temp\ match]

- 2 s \frac{price_i}{budget}

* 1.5 discount

- 0.5 \frac{wait}{patience}
$$

Choice probability:

$$
P(i)
====

\frac{e^{u_i}}{\sum_j e^{u_j}}
$$

A **“no purchase” option** is included with utility 0. 

---

### Number of Items Purchased

$$
N \sim Poisson(\lambda = 1.4) + 1
$$

Each customer makes **at least one purchase decision**. 

---

# 🎲 Monte Carlo Simulation

Each simulation generates a full business day.

Algorithm:

```
1. Sample arrival times (NHPP)
2. For each arrival:
      sample customer attributes
      compute queue wait
      sample patience
      if wait > patience → abandon
      sample purchases
      update server schedule
3. Aggregate revenue, profit, wait metrics
```

This is repeated **N times** (default 200–1000).

Outputs:

```
mean
std
p5
p25
p50
p75
p95
```

This gives a **risk distribution** for business outcomes.

---

# 🛠️ Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Frontend   | React + TypeScript + Vite |
| Charts     | Recharts                  |
| Backend    | FastAPI                   |
| Simulation | NumPy                     |
| AI         | GPT-4o-mini               |

---

# 🎤 Demo Script

1️⃣ Run baseline simulation
2️⃣ Ask AI:

> “Increase latte prices 10%”

3️⃣ Show profit distribution change

4️⃣ Add another staff member

5️⃣ Show wait time collapse

6️⃣ Highlight product-level demand changes

---

# 👥 Team

Built for **Hackathon 2026**.

---

If you'd like, I can also help you add **two extremely powerful sections** that judges love:

1️⃣ **“Model Calibration from Real POS Data”** (how the parameters are estimated from logs)
2️⃣ **A diagram explaining the stochastic pipeline** (arrival → queue → choice → revenue)

Those two sections would make this README look **much more like a research project than a hackathon demo**, which judges tend to reward.
