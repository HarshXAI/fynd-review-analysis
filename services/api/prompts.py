"""
Prompt templates for LLM calls.
"""

# Prompt for generating user-facing response
USER_RESPONSE_PROMPT = """You are a helpful customer service representative for an e-commerce company.

A customer has submitted the following review:

Rating: {rating}/5 stars
Review: {review_text}

Write a brief, empathetic, and professional response to the customer. 
- If the rating is low (1-2), acknowledge their frustration and offer to help resolve the issue.
- If the rating is medium (3), thank them for their feedback and ask if there's anything that could be improved.
- If the rating is high (4-5), thank them warmly for their positive feedback.

Keep the response concise (2-4 sentences) and friendly.
Do not include any greetings like "Dear Customer" - start directly with your response.

Response:"""

# Prompt for generating admin summary
ADMIN_SUMMARY_PROMPT = """You are an AI assistant helping an admin team understand customer feedback.

Analyze this customer review and provide a brief summary for the admin team:

Rating: {rating}/5 stars
Review: {review_text}

Provide a 1-2 sentence summary that captures:
1. The main sentiment (positive/negative/mixed)
2. Key issues or praise mentioned
3. Urgency level if any problems exist

Summary:"""

# Prompt for generating recommended actions (structured JSON)
ADMIN_ACTIONS_PROMPT = """You are an AI assistant helping an admin team prioritize customer service actions.

Analyze this customer review and recommend actions:

Rating: {rating}/5 stars
Review: {review_text}

Based on the review, provide 1-3 recommended actions as a JSON array.
Each action must have exactly these fields:
- "action": A specific action to take (string)
- "priority": One of "low", "medium", or "high" (string)
- "owner": One of "support", "ops", or "product" (string)

Guidelines:
- Low ratings (1-2): Usually high priority, may need support or ops intervention
- Medium ratings (3): Usually medium priority, may need product feedback
- High ratings (4-5): Usually low priority, may just need acknowledgment

Respond with ONLY a valid JSON array, no other text. Example format:
[{{"action": "Send apology email", "priority": "high", "owner": "support"}}]

JSON:"""

# Stricter prompt for retry on JSON parse failure
ADMIN_ACTIONS_STRICT_PROMPT = """You must respond with ONLY a valid JSON array. No explanations, no markdown, no code blocks.

Customer review - Rating: {rating}/5, Review: "{review_text}"

Provide 1-3 recommended actions. Each object must have exactly:
- "action": string describing the action
- "priority": exactly one of "low", "medium", "high"
- "owner": exactly one of "support", "ops", "product"

RESPOND WITH ONLY THE JSON ARRAY:"""

# Fallback actions when LLM fails
FALLBACK_ACTIONS = [
    {"action": "Review manually", "priority": "high", "owner": "support"}
]

FALLBACK_USER_RESPONSE = "Thank you for your feedback. Our team will review your comments and get back to you if needed."

FALLBACK_ADMIN_SUMMARY = "Review requires manual analysis - AI processing unavailable."
