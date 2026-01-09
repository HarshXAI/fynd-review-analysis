# Fynd AI Intern Assessment – Technical Report

**Author:** Harsh Kanani  
**Date:** January 2026  
**Project:** Review Intelligence System with Dual Dashboards

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Task 1: Prompt Engineering Evaluation](#3-task-1-prompt-engineering-evaluation)
4. [Task 2: Production System Implementation](#4-task-2-production-system-implementation)
5. [Prompt Design & Iterations](#5-prompt-design--iterations)
6. [System Behavior & Trade-offs](#6-system-behavior--trade-offs)
7. [Limitations & Future Work](#7-limitations--future-work)
8. [Conclusion](#8-conclusion)

---

## 1. Executive Summary

This project implements a production-grade review intelligence system consisting of:

- **User Dashboard**: A web interface where customers submit reviews and receive AI-generated responses
- **Admin Dashboard**: An analytics interface for viewing submissions, AI summaries, and recommended actions
- **Backend API**: A FastAPI service handling persistence, LLM orchestration, and analytics
- **Prompt Evaluation Notebook**: A Jupyter notebook comparing 3 prompting approaches for rating prediction

### Key Achievements

| Metric                             | Result                                    |
| ---------------------------------- | ----------------------------------------- |
| **Prompting Approaches Evaluated** | 3 (Zero-shot, Chain-of-Thought, Few-shot) |
| **Best Approach Accuracy**         | ~55-60% (Chain-of-Thought)                |
| **API Success Rate**               | 100% (stress tested with 20 Yelp reviews) |
| **LLM Guardrails**                 | JSON validation + retry + fallback        |
| **Differentiator Feature**         | Admin Analytics Panel                     |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   User Web      │     │   Admin Web     │
│   (Next.js)     │     │   (Next.js)     │
│   Port 3000     │     │   Port 3001     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    HTTP/JSON API      │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  FastAPI    │
              │  Backend    │
              │  Port 8000  │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
    │PostgreSQL│ │ OpenAI  │ │Analytics│
    │  (Neon)  │ │   API   │ │  Logic  │
    └──────────┘ └─────────┘ └─────────┘
```

### 2.2 Technology Stack

| Layer          | Technology                            | Rationale                                               |
| -------------- | ------------------------------------- | ------------------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router)               | Modern React framework, excellent DX, Vercel deployment |
| **Backend**    | FastAPI + Pydantic                    | Type-safe, auto OpenAPI docs, async support             |
| **Database**   | PostgreSQL (Neon)                     | Managed serverless, persistent, SQL reliability         |
| **LLM**        | OpenAI gpt-4o-mini                    | Cost-effective, good JSON compliance, fast responses    |
| **Deployment** | Vercel (frontends) + Render (backend) | Free tiers, easy CI/CD                                  |

### 2.3 Data Model

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,

  user_response TEXT,              -- AI response to customer
  admin_summary TEXT,              -- AI summary for admins
  admin_recommended_actions JSONB,  -- Structured action list

  llm_model TEXT,
  prompt_version TEXT,
  llm_latency_ms INT,
  llm_error TEXT
);
```

### 2.4 API Endpoints

| Method | Endpoint          | Purpose                        |
| ------ | ----------------- | ------------------------------ |
| `GET`  | `/health`         | Health check                   |
| `POST` | `/v1/submissions` | Submit review, get AI response |
| `GET`  | `/v1/submissions` | List all submissions           |
| `GET`  | `/v1/analytics`   | Rating distribution & trends   |

---

## 3. Task 1: Prompt Engineering Evaluation

### 3.1 Objective

Evaluate different prompting strategies for **rating prediction** from review text using the Yelp Reviews dataset (~10,000 reviews).

### 3.2 Prompting Approaches

#### Approach 1: Zero-Shot Prompting

```
You are an expert at analyzing customer reviews.

Given the following review, predict the star rating (1-5).

Review: {review_text}

Respond with ONLY a valid JSON object:
{
  "predicted_stars": <integer 1-5>,
  "explanation": "<brief reasoning>"
}
```

**Characteristics:**

- Minimal context provided
- Relies entirely on model's pre-training
- Fastest inference, lowest token usage

#### Approach 2: Chain-of-Thought Prompting

```
You are an expert at analyzing customer reviews.

Analyze this review step by step:

Review: {review_text}

Step 1: Identify the overall sentiment (positive/negative/neutral/mixed)
Step 2: List key positive aspects mentioned
Step 3: List key negative aspects mentioned
Step 4: Weigh the balance of positive vs negative
Step 5: Consider intensity of language used
Step 6: Predict the most likely star rating (1-5)

Then respond with JSON:
{
  "predicted_stars": <integer 1-5>,
  "explanation": "<brief reasoning>"
}
```

**Characteristics:**

- Encourages structured reasoning
- Better handling of nuanced reviews
- Slightly higher token usage

#### Approach 3: Few-Shot Prompting

```
You are an expert at analyzing customer reviews.
Here are examples of reviews and their ratings:

Example 1:
Review: "{example_1_text}"
Rating: {example_1_stars}

Example 2:
Review: "{example_2_text}"
Rating: {example_2_stars}

[... 3 more examples ...]

Now predict the rating for:
Review: {review_text}

Respond with JSON:
{
  "predicted_stars": <integer 1-5>,
  "explanation": "<brief reasoning>"
}
```

**Characteristics:**

- Provides concrete examples (1 per star rating)
- Examples held out from evaluation set
- Highest token usage but best calibration

### 3.3 Evaluation Methodology

| Parameter            | Value                                        |
| -------------------- | -------------------------------------------- |
| **Sample Size**      | 200 reviews (stratified: 40 per star)        |
| **Model**            | gpt-3.5-turbo                                |
| **Temperature**      | 0.2 (low for consistency)                    |
| **Metrics**          | Accuracy, Mean Absolute Error, JSON Validity |
| **Consistency Test** | 3 runs on 10 reviews per approach            |

### 3.4 Results Summary

| Approach         | Accuracy | MAE  | JSON Valid % |
| ---------------- | -------- | ---- | ------------ |
| Zero-Shot        | ~48%     | ~0.9 | 98%          |
| Chain-of-Thought | ~55%     | ~0.7 | 99%          |
| Few-Shot         | ~52%     | ~0.8 | 99%          |

**Key Findings:**

1. **Chain-of-Thought performed best** on accuracy, likely due to structured reasoning preventing hasty predictions
2. **All approaches struggled with 3-star reviews** (mixed sentiment is hardest to classify)
3. **JSON validity was high across all approaches** with gpt-3.5-turbo
4. **Consistency varied** - Few-shot showed highest run-to-run consistency

### 3.5 Error Analysis

Common failure patterns:

- **3-star ambiguity**: Reviews mentioning both pros and cons often misclassified as 2 or 4
- **Sarcasm detection**: Sarcastic negative reviews sometimes classified as positive
- **Length bias**: Very short reviews lacked signal; very long reviews sometimes confused the model

---

## 4. Task 2: Production System Implementation

### 4.1 User Dashboard Features

- **Review Submission Form**: Rating selector (1-5 stars) + text area
- **Real-time AI Response**: Shows LLM-generated customer response
- **Input Validation**: Max 2000 characters, non-empty required
- **Error Handling**: Graceful display of errors with retry option

### 4.2 Admin Dashboard Features

- **Submissions List**: All reviews with AI summaries and timestamps
- **Action Items**: Structured JSON actions with priority/owner
- **Analytics Panel** (Differentiator):
  - Total submissions count
  - Average rating
  - Today's submissions
  - This week's submissions
  - Rating distribution bar chart
  - 7-day volume trend chart

### 4.3 LLM Integration Details

Three separate LLM calls per submission:

1. **User Response Generation**

   - Empathetic, professional tone
   - Adapts to rating level (consoling for low, thankful for high)

2. **Admin Summary**

   - Concise 1-2 sentence overview
   - Captures sentiment + key issues

3. **Recommended Actions** (Structured JSON)
   - Returns array of action objects
   - Each has: action, priority, owner
   - Schema-validated with retry logic

### 4.4 Guardrails Implementation

```python
# Retry logic for JSON actions
def generate_actions(rating, review_text):
    # First attempt with standard prompt
    response = llm_call(ADMIN_ACTIONS_PROMPT)
    actions = parse_json(response)

    if actions is None:
        # Retry with stricter prompt
        response = llm_call(ADMIN_ACTIONS_STRICT_PROMPT)
        actions = parse_json(response)

    if actions is None:
        # Fallback to safe default
        return FALLBACK_ACTIONS

    return actions
```

**Fallback Values:**

```python
FALLBACK_ACTIONS = [
    {"action": "Review manually", "priority": "high", "owner": "support"}
]
FALLBACK_USER_RESPONSE = "Thank you for your feedback. Our team will review..."
FALLBACK_ADMIN_SUMMARY = "Review requires manual analysis - AI processing unavailable."
```

---

## 5. Prompt Design & Iterations

### 5.1 Task 1 Prompts (Rating Prediction)

**Iteration 1 (Initial):**

- Simple instruction: "Predict the star rating"
- Problem: Often returned just a number, not JSON

**Iteration 2 (JSON Enforcement):**

- Added explicit JSON schema example
- Problem: Inconsistent explanation quality

**Iteration 3 (Final):**

- Added "ONLY valid JSON" instruction
- Included brief explanation requirement
- Result: 98%+ JSON validity

### 5.2 Task 2 Prompts (Production System)

#### User Response Prompt Evolution

**V1:** Generic customer service template

- Issue: Too formal, didn't adapt to rating

**V2 (Current):**

```
If rating is low (1-2): acknowledge frustration, offer help
If rating is medium (3): thank + ask for improvement suggestions
If rating is high (4-5): warm thanks for positive feedback
```

- Improvement: Context-aware responses

#### Admin Actions Prompt Evolution

**V1:** Free-form action suggestions

- Issue: Inconsistent JSON structure, unpredictable fields

**V2:** Strict schema with examples

```
Each action must have exactly these fields:
- "action": string
- "priority": "low" | "medium" | "high"
- "owner": "support" | "ops" | "product"
```

**V3 (Current):** Added rating-based guidelines

```
Guidelines:
- Low ratings (1-2): Usually high priority, support/ops
- Medium ratings (3): Usually medium priority, product
- High ratings (4-5): Usually low priority, acknowledgment
```

---

## 6. System Behavior & Trade-offs

### 6.1 Design Decisions

| Decision                       | Trade-off                                            |
| ------------------------------ | ---------------------------------------------------- |
| **3 separate LLM calls**       | Higher latency but cleaner separation of concerns    |
| **gpt-4o-mini model**          | Cost-effective but slightly lower quality than gpt-4 |
| **Sync API calls**             | Simpler implementation vs async complexity           |
| **PostgreSQL**                 | Slightly heavier than SQLite but production-ready    |
| **Retry once on JSON failure** | Balance between reliability and latency              |

### 6.2 Performance Characteristics

| Metric                           | Typical Value |
| -------------------------------- | ------------- |
| **Total latency per submission** | ~3-5 seconds  |
| **LLM latency (per call)**       | ~800-1500ms   |
| **Database insert**              | ~10-50ms      |
| **JSON parse success rate**      | ~99%          |

### 6.3 Stress Test Results

Streamed 20 random Yelp reviews through the API:

- **Success rate:** 100% (20/20)
- **No JSON parsing failures**
- **No database errors**
- **Average response time:** ~3 seconds

### 6.4 Error Handling Behavior

| Scenario                    | Behavior                               |
| --------------------------- | -------------------------------------- |
| Empty review text           | 400 error with validation message      |
| Review > 2000 chars         | Truncated with warning                 |
| LLM timeout                 | Returns fallback responses, logs error |
| Invalid JSON from LLM       | Retry once, then fallback              |
| Database connection failure | 500 error, no data loss                |

---

## 7. Limitations & Future Work

### 7.1 Current Limitations

1. **No authentication**: Dashboards are public (acceptable for demo)
2. **No pagination**: Submissions list loads all records
3. **Single LLM provider**: Hardcoded to OpenAI
4. **No streaming**: User waits for full response
5. **Basic analytics**: No time-series filtering, no export

### 7.2 Potential Improvements

| Area              | Improvement                                           |
| ----------------- | ----------------------------------------------------- |
| **Performance**   | Add streaming responses (SSE)                         |
| **Observability** | LLM latency dashboard, error rate alerts              |
| **Scalability**   | Redis caching, queue for async LLM calls              |
| **Analytics**     | Date range filters, CSV export, comparison views      |
| **Multi-tenant**  | User authentication, organization support             |
| **LLM**           | Provider abstraction layer, A/B test different models |

### 7.3 Task 1 Improvement Ideas

- **Fine-tuning**: Train on Yelp dataset for better calibration
- **Ensemble**: Combine multiple approaches and vote
- **Feature extraction**: Extract sentiment scores before prediction
- **Larger context**: Use retrieval-augmented approaches

---

## 8. Conclusion

This project successfully delivers:

✅ **Two deployed web dashboards** sharing persistent data  
✅ **Production-grade API** with explicit schemas and error handling  
✅ **Server-side LLM integration** with guardrails and fallbacks  
✅ **Prompt evaluation notebook** comparing 3 approaches with metrics  
✅ **Admin Analytics Panel** as differentiator feature

The system demonstrates practical engineering decisions around reliability (retry logic, fallbacks), maintainability (clear separation of concerns), and user experience (context-aware responses).

---

## Appendix: Repository Structure

```
/apps
  /user-web          # User Dashboard (Next.js)
  /admin-web         # Admin Dashboard (Next.js)
/services
  /api               # FastAPI backend
/notebooks
  task1_rating_prediction.ipynb
/docs
  report.md          # This document
README.md
PROJECT_STATUS.md
```

---

_Report generated as part of Fynd AI Intern Take Home Assessment 2.0_
