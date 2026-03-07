"""
AI Layer: Converts natural language to simulation parameters
Uses OpenAI/Gemini to extract intent from user questions
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Lazy-initialize OpenAI client only when needed
client = None

def get_openai_client():
    global client
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "your-api-key-here" and client is None:
        client = OpenAI(api_key=api_key)
    return client

SYSTEM_PROMPT = """You are an AI assistant that helps small business owners understand "what-if" scenarios.

Your job is to extract simulation parameters from natural language questions.

Given a user's question about their business, extract:
1. price_change: A decimal representing price change (e.g., 0.10 for 10% increase, -0.05 for 5% decrease). Default: 0
2. staff_change: Integer change in staff count (e.g., 1 for hiring one person, -1 for letting one go). Default: 0
3. scenario_type: One of "price", "staff", "both", or "general"

Current business state will be provided. Always respond with valid JSON only.

Examples:
- "What if I raise prices by $0.50?" (on $5 coffee) → {"price_change": 0.10, "staff_change": 0, "scenario_type": "price"}
- "Should I hire a part-time worker?" → {"price_change": 0, "staff_change": 1, "scenario_type": "staff"}
- "What if I increase prices 20% and hire 2 more people?" → {"price_change": 0.20, "staff_change": 2, "scenario_type": "both"}
- "How is my business doing?" → {"price_change": 0, "staff_change": 0, "scenario_type": "general"}
"""

def parse_user_query(
    query: str,
    current_price: float = 5.00,
    current_staff: int = 2
) -> dict:
    """
    Parse natural language query into simulation parameters.
    This is the "magic" that makes typing "hire a student" actually work.
    """
    
    # For hackathon: if no API key, use simple keyword matching as fallback
    ai_client = get_openai_client()
    if ai_client is None:
        return fallback_parser(query, current_price, current_staff)
    
    try:
        response = ai_client.chat.completions.create(
            model="gpt-4o-mini",  # Cheap and fast!
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"""
Current business state:
- Price: ${current_price:.2f}
- Staff: {current_staff}

User question: "{query}"

Extract the simulation parameters as JSON.
"""}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,  # Low temperature for consistent parsing
            max_tokens=150
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Validate and set defaults
        return {
            "price_change": float(result.get("price_change", 0)),
            "staff_change": int(result.get("staff_change", 0)),
            "scenario_type": result.get("scenario_type", "general"),
            "parsed_by": "ai"
        }
        
    except Exception as e:
        print(f"AI parsing failed: {e}")
        return fallback_parser(query, current_price, current_staff)


def fallback_parser(query: str, current_price: float, current_staff: int) -> dict:
    """
    Simple keyword-based fallback when AI is not available.
    Good enough for a hackathon demo!
    """
    query_lower = query.lower()
    
    price_change = 0
    staff_change = 0
    scenario_type = "general"
    
    # Price detection
    if any(word in query_lower for word in ["raise", "increase", "higher"]) and "price" in query_lower:
        price_change = 0.10  # Default 10% increase
        scenario_type = "price"
    elif any(word in query_lower for word in ["lower", "decrease", "reduce", "drop"]) and "price" in query_lower:
        price_change = -0.10
        scenario_type = "price"
    elif "$5.50" in query or "5.50" in query:
        price_change = (5.50 - current_price) / current_price
        scenario_type = "price"
    elif "$6" in query or "6.00" in query:
        price_change = (6.00 - current_price) / current_price
        scenario_type = "price"
    
    # Staff detection
    if any(word in query_lower for word in ["hire", "add", "another", "more staff", "extra"]):
        staff_change = 1
        scenario_type = "staff" if scenario_type == "general" else "both"
    elif any(word in query_lower for word in ["fire", "let go", "reduce staff", "cut"]):
        staff_change = -1
        scenario_type = "staff" if scenario_type == "general" else "both"
    
    # Look for specific numbers
    import re
    numbers = re.findall(r'\b(\d+)\s*(?:more|extra|new)?\s*(?:staff|people|workers|employees|baristas?)\b', query_lower)
    if numbers:
        staff_change = int(numbers[0])
        scenario_type = "staff" if price_change == 0 else "both"
    
    return {
        "price_change": price_change,
        "staff_change": staff_change,
        "scenario_type": scenario_type,
        "parsed_by": "fallback"
    }


def generate_insight(comparison_result: dict, query: str) -> str:
    """
    Generate a human-readable insight from simulation results.
    This is what makes the AI feel "smart" to judges.
    """
    comp = comparison_result['comparison']
    current = comparison_result['current']
    proposed = comparison_result['proposed']
    
    # Build insight text
    if comp['recommendation'] == 'RECOMMENDED':
        tone = "Good news! "
        emoji = "✅"
    else:
        tone = "Careful! "
        emoji = "⚠️"
    
    insight = f"{emoji} {tone}"
    
    if abs(comp['profit_change']) > 0:
        direction = "increase" if comp['profit_change'] > 0 else "decrease"
        insight += f"This change would likely {direction} your daily profit by ${abs(comp['profit_change']):.2f} "
        insight += f"({abs(comp['profit_change_percent']):.1f}%). "
    
    insight += f"\n\n📊 Based on {current['num_simulations']} simulations:\n"
    insight += f"• Current avg profit: ${current['profit']['mean']:.2f}/day\n"
    insight += f"• Projected avg profit: ${proposed['profit']['mean']:.2f}/day\n"
    insight += f"• Confidence of profit: {proposed['profit']['positive_probability']:.0f}%\n"
    
    if comp['wait_time_change'] < -1:
        insight += f"\n⏱️ Bonus: Wait times would drop by {abs(comp['wait_time_change']):.1f} minutes!"
    elif comp['wait_time_change'] > 1:
        insight += f"\n⏱️ Warning: Wait times may increase by {comp['wait_time_change']:.1f} minutes."
    
    return insight


if __name__ == "__main__":
    # Test the parser
    test_queries = [
        "What if I raise my prices to $5.50?",
        "Should I hire another barista?",
        "What happens if I add 2 more staff?",
        "How's business looking?"
    ]
    
    for q in test_queries:
        print(f"\nQuery: {q}")
        result = parse_user_query(q)
        print(f"Parsed: {result}")
