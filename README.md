# Fynd AI Intern – Take Home Assessment

A production-style review intelligence system with two deployed dashboards and a prompt evaluation notebook.

## 🎯 Overview

This project implements a complete review management system where:

- **Customers** submit reviews and receive AI-generated responses
- **Admins** view submissions with AI summaries, recommended actions, and analytics

## Project Structure

```
/apps
  /user-web          # User Dashboard (Next.js) - Submit reviews
  /admin-web         # Admin Dashboard (Next.js) - View submissions & AI insights
/services
  /api               # FastAPI backend - Handles submissions & LLM calls
/notebooks
  task1_rating_prediction.ipynb    # Prompt evaluation notebook (3 approaches)
/docs
  report.md          # Technical report
```

## 🚀 Deployed URLs

| Service             | URL                             |
| ------------------- | ------------------------------- |
| **User Dashboard**  | `https://fynd-user.vercel.app`  |
| **Admin Dashboard** | `https://fynd-admin.vercel.app` |
| **Backend API**     | `https://fynd-api.onrender.com` |

> ⚠️ **Note:** If URLs show placeholders, deployment is pending. See [Local Development](#local-development-setup) to run locally.

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL (or connection to cloud Postgres)

### Backend (FastAPI)

```bash
cd services/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your database URL and LLM API key

# Run development server
uvicorn main:app --reload --port 8000
```

### User Dashboard (Next.js)

```bash
cd apps/user-web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL

# Run development server
npm run dev
```

The user dashboard will be available at `http://localhost:3000`

### Admin Dashboard (Next.js)

```bash
cd apps/admin-web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL

# Run development server
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

## Environment Variables

### Backend (`/services/api/.env`)

| Variable       | Description                               |
| -------------- | ----------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string              |
| `LLM_API_KEY`  | API key for OpenAI/Gemini/OpenRouter      |
| `LLM_PROVIDER` | LLM provider (openai, gemini, openrouter) |

### Frontends (`/apps/*/env.local`)

| Variable                   | Description          |
| -------------------------- | -------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |

## API Endpoints

| Method | Endpoint          | Description                  |
| ------ | ----------------- | ---------------------------- |
| GET    | `/health`         | Health check                 |
| POST   | `/v1/submissions` | Submit a review              |
| GET    | `/v1/submissions` | Get all submissions          |
| GET    | `/v1/analytics`   | Rating distribution & trends |

## Features

### User Dashboard

- ⭐ Star rating selector (1-5)
- 📝 Review text input with validation
- 🤖 AI-generated personalized response
- ✅ Success/error feedback

### Admin Dashboard

- 📋 List of all submissions with timestamps
- 📊 AI-generated summaries and recommended actions
- 📈 **Analytics Panel** (Differentiator Feature):
  - Total submissions count
  - Average rating
  - Today's & this week's submissions
  - Rating distribution chart
  - 7-day volume trend

### Task 1 Notebook

- 3 prompting approaches for rating prediction
- ~200 sample evaluation (stratified)
- Metrics: Accuracy, MAE, JSON validity
- Comparison table and analysis

## Progress

- [x] Phase 1: Repo Skeleton + Deployability Baseline
- [x] Phase 2: Persistence + Submission Pipeline
- [x] Phase 3: LLM Integration + Guardrails
- [x] Phase 4: Task 1 Notebook
- [x] Phase 5: Differentiator Feature (Admin Analytics)
- [x] Phase 6: Report + Final Polish

## 📖 Documentation

- [Technical Report](docs/report.md) - Full architecture, prompts, evaluation results
- [Project Status](PROJECT_STATUS.md) - Phase execution contract

## Author

Harsh Kanani
