# PROJECT_STATUS.md — Execution Contract (Copilot-Driven Build)

**Project:** Fynd AI Intern – Take Home Assessment 2.0  
**Owner:** Harsh Kanani  
**Mode:** Implemented by AI Copilot/Agent.  
**Goal:** Ship a production-style web system with two deployed dashboards + a prompt-eval notebook, with production-grade API schemas, persistence, and reliability. :contentReference[oaicite:2]{index=2}

---

## 0) Non-Negotiables (Fail Conditions)

If ANY of these are violated, the submission may be rejected:

1. **Two dashboards must be real web apps** (NOT Streamlit / HF Spaces / Gradio / notebooks). :contentReference[oaicite:3]{index=3}
2. **Both dashboards must be deployed**, public, load successfully, and work without local setup. :contentReference[oaicite:4]{index=4}
3. **Provide two public URLs**: User Dashboard URL + Admin Dashboard URL. :contentReference[oaicite:5]{index=5}
4. **Both dashboards must share the same persistent data source** (data survives refresh/redeploy). :contentReference[oaicite:6]{index=6}
5. **All LLM calls must be server-side** (no client-side direct calls). :contentReference[oaicite:7]{index=7}
6. Backend must expose **clear API endpoints** with **explicit JSON request/response schemas**. :contentReference[oaicite:8]{index=8}
7. System must handle **empty reviews, long reviews, and LLM failures gracefully**. :contentReference[oaicite:9]{index=9}
8. Deliverables include: GitHub repo, Task 1 notebook, Task 2 app code, report, deployed links. :contentReference[oaicite:10]{index=10}

---

## 1) Agent Operating Rules (READ THIS FIRST)

These rules exist because AI agents tend to:

- implement everything at once
- explode the repo structure
- hardcode secrets or assumptions
- create extra docs “helpfully”
- refactor prematurely

### 1.1 Work Mode: Phase-Only Execution

**You MUST implement one phase at a time.**

- Complete Phase N
- Run the specified tests
- Meet acceptance criteria
- ONLY THEN proceed to Phase N+1

**Hard Stop Rule:** If a phase is incomplete or failing tests, DO NOT start the next phase.

### 1.2 Repo Structure Guardrails (DO NOT BREAK)

**Never rename these directories. Never move files across boundaries.**
Only add files where explicitly allowed.

/apps
/user-web # User Dashboard (Next.js)
/apps/admin-web # Admin Dashboard (Next.js)
/services
/api # FastAPI backend
/packages
/shared # shared types/schema helpers (optional)
/notebooks
task1_rating_prediction.ipynb
/docs
report.pdf (or report.md exported to PDF)
README.md
PROJECT_STATUS.md

yaml
Copy code

**Forbidden Actions (without explicit instruction):**

- DO NOT create new top-level folders besides the ones above.
- DO NOT add random `notes.md`, `todo.md`, “architecture.md”, etc.
- DO NOT scatter configs across root. Keep configs inside each app/service.
- DO NOT hardcode deployment URLs into source code.
- DO NOT refactor structure “for cleanliness”.

### 1.3 Documentation Rule (No Doc Spam)

Only these docs may exist:

- `README.md`
- `PROJECT_STATUS.md`
- `/docs/report.md` (later exported to PDF) OR `/docs/report.pdf`

**DO NOT create additional markdown files** unless explicitly requested in this PROJECT_STATUS.

### 1.4 Config & Secrets Rule

- All secrets must be via environment variables.
- Provide `.env.example` files (no real keys).
- Never commit real API keys.
- Never paste keys into code, tests, or docs.

### 1.5 Minimal Changes Rule

Keep commits small and reversible.

- No broad refactors.
- No dependency swaps mid-build unless necessary.
- No “improve everything” edits.

---

## 2) Locked Tech Decisions (Do Not Change)

These are fixed to prevent reroutes:

### Frontend (User + Admin)

- Next.js (App Router) + TypeScript
- Deployed on Vercel
- Each dashboard is a separate deployable project -> **two URLs**.

### Backend

- FastAPI (Python) + Pydantic schemas
- Deployed on Render (or equivalent)
- All LLM calls happen here (server-side only). :contentReference[oaicite:11]{index=11}

### Database (Persistence)

- Postgres (Neon/Supabase/Render Postgres)
- Shared by both dashboards via backend API
- DB migrations using Alembic OR simple SQL init script (choose one and stick).

### LLM Provider

- Use one of: OpenAI / Gemini / OpenRouter
- Must support structured JSON output or strict formatting + validation.

---

## 3) Data Model (Locked)

Create a single table `submissions`.

### SQL (reference)

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,

  user_response TEXT,                 -- AI response shown to user
  admin_summary TEXT,                 -- AI summary shown to admin
  admin_recommended_actions JSONB,     -- AI action list (structured)

  llm_model TEXT,
  prompt_version TEXT,
  llm_latency_ms INT,
  llm_error TEXT
);
Notes:

admin_recommended_actions should be JSON (list of objects).

llm_error stores last error string (for debugging).

4) API Contract (Locked)
All endpoints must have explicit request/response schemas (Pydantic + OpenAPI).

4.1 POST /v1/submissions
Request

json
Copy code
{
  "rating": 1,
  "review_text": "text..."
}
Response (success)

json
Copy code
{
  "id": "uuid",
  "rating": 1,
  "review_text": "text...",
  "user_response": "text...",
  "admin_summary": "text...",
  "admin_recommended_actions": [
    { "action": "text", "priority": "low|medium|high", "owner": "support|ops|product" }
  ],
  "created_at": "iso8601"
}
Response (error)

json
Copy code
{
  "error": { "code": "VALIDATION_ERROR|LLM_ERROR|SERVER_ERROR", "message": "..." }
}
4.2 GET /v1/submissions
Returns most recent submissions (paginated optional).

4.3 GET /v1/analytics (Optional, Phase 5)
Counts by rating, recent volume, etc.

5) Prompt Contracts (Locked)
5.1 User-facing Response Prompt
Output: plain text response suitable for a customer reply.

5.2 Admin Summary Prompt
Output: short summary.

5.3 Admin Action Prompt (Structured JSON)
Output must be JSON array of actions:

json
Copy code
[
  { "action": "Offer refund", "priority": "high", "owner": "support" }
]
Validation requirement: Backend must validate JSON; if invalid -> retry once with stricter prompt; if still invalid -> fallback to safe default.

6) Phase Plan (Execute Exactly In Order)
Each phase has:

scope

steps

tests

acceptance criteria

hard stop

PHASE 1 — Repo Skeleton + Deployability Baseline (NO LLM)
Objective: Avoid reroutes by proving deployment + routing early.

Scope
Create monorepo structure exactly as specified.

Build minimal Next.js apps (user + admin) that load.

Build FastAPI backend with /health.

Wire frontends to backend /health only.

Set up DB connection but DO NOT require DB yet.

Steps
Create directories exactly as “Repo Structure Guardrails”.

Initialize /services/api FastAPI:

GET /health returns { "status": "ok" }

Initialize /apps/user-web Next.js:

Page shows status fetched from backend /health

Initialize /apps/admin-web Next.js:

Page shows status fetched from backend /health

Add .env.example in each app/service

Tests
Backend: GET /health works locally

User web loads locally and shows backend status

Admin web loads locally and shows backend status

Acceptance Criteria
Repo structure exactly matches spec

No extra folders / docs created

Both web apps run locally

Backend runs locally

HARD STOP: Do not implement database writes, submission flow, LLM calls, or analytics in Phase 1.

PHASE 2 — Persistence + Submission Pipeline (STILL NO LLM)
Objective: End-to-end submit -> store -> admin list, without LLM complexity.

Scope
Connect Postgres

Create submissions table

Implement POST + GET endpoints

User UI can submit rating + review

Admin UI lists stored submissions (auto-refresh every ~10s)

Steps
Add DB connection in backend.

Create migration/init for submissions table.

Implement:

POST /v1/submissions:

validate rating 1–5

validate review_text non-empty

enforce max length (e.g., 2000 chars) with truncation + warning

store row with NULL AI fields for now

GET /v1/submissions (latest 50)

Update user web:

rating selector + textarea + submit

success/error banner

Update admin web:

list submissions (rating + review_text + created_at)

Tests
POST submission persists to DB

GET shows same data across refresh

Deployed environment persists across refresh

Acceptance Criteria
User can submit review -> stored -> appears in admin list

Both dashboards read/write same DB via backend

Deployed baseline works reliably (no local-only behavior)

HARD STOP: Do not add LLM calls until Phase 2 is fully passing.

PHASE 3 — LLM Integration + Guardrails (REQUIRED)
Objective: Add required AI behaviors safely: summary, actions, user response.

Scope
Server-side LLM calls only

On POST submission:

generate user_response

generate admin_summary

generate admin_recommended_actions (JSON)

Persist AI outputs to DB

Guardrails (Mandatory)
Validate AI JSON output via schema

Retry once on invalid JSON

On repeated failure: store fallback actions like:

[{"action":"Review manually","priority":"high","owner":"support"}]

Handle LLM outage:

Return success but with fallback texts + llm_error logged

UI should show a non-crashing warning

Tests
Submit valid review -> returns AI outputs -> saved in DB

Submit empty review -> returns validation error

Simulate LLM failure -> graceful fallback (no crash)

Acceptance Criteria
Meets Task 2 LLM requirements: summarization, actions, user response.
Fynd AI Intern – Take Home Asse…


All LLM calls are server-side.
Fynd AI Intern – Take Home Asse…


Admin list shows AI summary + actions.

HARD STOP: No streaming/observability extras until Phase 3 passes.

PHASE 4 — Task 1 Notebook (Prompting + Evaluation)
Objective: Task 1 is a research-style experiment with 3+ prompting approaches.

Scope
Notebook at /notebooks/task1_rating_prediction.ipynb

Use ~200 samples

Implement 3 prompting approaches

Measure:

accuracy

JSON validity rate

consistency/reliability (repeat runs)

Produce comparison table + discussion

Acceptance Criteria
Notebook is runnable and produces metrics + table.
Fynd AI Intern – Take Home Asse…


PHASE 5 — Differentiator (Choose ONE Hero Feature)
Objective: Add ONE standout feature without breaking stability.

Allowed choices (pick exactly one)
A) Admin Analytics panel (counts by rating, trends)
B) Streaming response UX (SSE/websocket) for user reply
C) Prompt versioning + LLM observability panel (latency, errors)

Rule
Pick one. Implement it fully. Do not partially implement multiple.

Acceptance Criteria
Feature works in deployed env

Doesn’t break Phase 1–4 requirements

Minimal code footprint, no structure changes

PHASE 6 — Report + Final Polish
Objective: Package deliverables cleanly.

Scope
/docs/report.md (export see README) OR /docs/report.pdf

Include:

approach

architecture

prompt iterations (Task 1 + Task 2 prompts)

eval methodology + results (Task 1)

system behavior, trade-offs, limitations (Task 2)

README includes:

both URLs

setup steps

env vars

demo admin access (if gated)

7) Deployment Contract
User Dashboard URL: (Vercel deployment)

Admin Dashboard URL: (Vercel deployment)

Backend API URL: (Render deployment)

Do not hardcode URLs.
Use environment variables:

NEXT_PUBLIC_API_BASE_URL for frontends (public)

DATABASE_URL, LLM_API_KEY, etc. for backend (private)

8) Progress Checklist (Update Only Here — No New Docs)
- [x] Phase 1 complete + tested

- [x] Phase 2 complete + tested

- [x] Phase 3 complete + tested

- [x] Phase 4 complete + tested

- [x] Phase 5 complete + tested (Option A: Admin Analytics Panel)

- [x] Phase 6 complete + tested

- [ ] Deployed URLs added to README (pending deployment)

9) Final Reminder to Agent
Do not try to implement everything at once.
Follow phases in order. Keep structure intact. Avoid doc sprawl. Validate outputs. Ship stable increments.

pgsql
Copy code

---

### CTO/PM notes (why this will prevent reroutes)
- The **Phase 1 → Phase 2 → Phase 3** sequencing forces Copilot to first prove deployment + persistence before touching LLM chaos (this is where most people derail).
- The **Repo Structure Guardrails** stop the “broken structure” problem cold.
- The **No Doc Spam** rule prevents Copilot from generating 12 markdown files and forgetting what matters.
- The **HARD STOP** gates act like a release train: Copilot cannot “skip ahead”.
```
