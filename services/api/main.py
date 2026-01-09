from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db, engine, Base
from models import Submission
from schemas import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionListResponse,
    ErrorResponse,
    ErrorDetail,
    AnalyticsResponse,
    RatingCount,
    DailyVolume
)

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fynd Review API",
    description="Backend API for the Fynd Review System",
    version="1.0.0"
)

# CORS configuration - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify API is running."""
    return HealthResponse(status="ok")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Fynd Review API",
        "version": "1.0.0",
        "health_check": "/health"
    }


@app.post(
    "/v1/submissions",
    response_model=SubmissionResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def create_submission(
    submission: SubmissionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new review submission.
    
    - **rating**: Rating from 1 to 5
    - **review_text**: Review text (max 2000 characters)
    
    Returns the created submission with AI-generated fields.
    """
    try:
        # Import LLM service (lazy import to avoid circular deps)
        from llm_service import llm_service
        
        # Generate AI outputs
        ai_outputs = llm_service.generate_all(
            rating=submission.rating,
            review_text=submission.review_text
        )
        
        # Create database record with AI outputs
        db_submission = Submission(
            rating=submission.rating,
            review_text=submission.review_text,
            user_response=ai_outputs["user_response"],
            admin_summary=ai_outputs["admin_summary"],
            admin_recommended_actions=ai_outputs["admin_recommended_actions"],
            llm_model=ai_outputs["llm_model"],
            prompt_version=ai_outputs["prompt_version"],
            llm_latency_ms=ai_outputs["llm_latency_ms"],
            llm_error=ai_outputs["llm_error"]
        )
        
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        
        return SubmissionResponse(
            id=db_submission.id,
            rating=db_submission.rating,
            review_text=db_submission.review_text,
            user_response=db_submission.user_response,
            admin_summary=db_submission.admin_summary,
            admin_recommended_actions=db_submission.admin_recommended_actions,
            created_at=db_submission.created_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@app.get(
    "/v1/submissions",
    response_model=SubmissionListResponse,
    responses={500: {"model": ErrorResponse}}
)
async def get_submissions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get the most recent submissions.
    
    - **limit**: Maximum number of submissions to return (default: 50)
    
    Returns list of submissions ordered by created_at descending.
    """
    try:
        submissions = (
            db.query(Submission)
            .order_by(Submission.created_at.desc())
            .limit(limit)
            .all()
        )
        
        return SubmissionListResponse(
            submissions=[
                SubmissionResponse(
                    id=s.id,
                    rating=s.rating,
                    review_text=s.review_text,
                    user_response=s.user_response,
                    admin_summary=s.admin_summary,
                    admin_recommended_actions=s.admin_recommended_actions,
                    created_at=s.created_at
                )
                for s in submissions
            ],
            total=len(submissions)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@app.get(
    "/v1/analytics",
    response_model=AnalyticsResponse,
    responses={500: {"model": ErrorResponse}}
)
async def get_analytics(db: Session = Depends(get_db)):
    """
    Get analytics data for admin dashboard.
    
    Returns:
    - Total submission count
    - Rating distribution (counts and percentages)
    - Average rating
    - Daily volume for last 7 days
    - Today and this week counts
    """
    try:
        # Total submissions
        total = db.query(func.count(Submission.id)).scalar() or 0
        
        # Rating distribution
        rating_counts = (
            db.query(Submission.rating, func.count(Submission.id))
            .group_by(Submission.rating)
            .all()
        )
        
        rating_distribution = []
        for rating in range(1, 6):
            count = next((c for r, c in rating_counts if r == rating), 0)
            percentage = (count / total * 100) if total > 0 else 0.0
            rating_distribution.append(RatingCount(
                rating=rating,
                count=count,
                percentage=round(percentage, 1)
            ))
        
        # Average rating
        avg_rating = db.query(func.avg(Submission.rating)).scalar() or 0.0
        
        # Daily volume for last 7 days
        today = datetime.utcnow().date()
        daily_volume = []
        
        for i in range(6, -1, -1):  # Last 7 days, oldest first
            day = today - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            
            count = (
                db.query(func.count(Submission.id))
                .filter(Submission.created_at >= day_start)
                .filter(Submission.created_at <= day_end)
                .scalar() or 0
            )
            
            daily_volume.append(DailyVolume(
                date=day.isoformat(),
                count=count
            ))
        
        # Today count
        today_start = datetime.combine(today, datetime.min.time())
        today_count = (
            db.query(func.count(Submission.id))
            .filter(Submission.created_at >= today_start)
            .scalar() or 0
        )
        
        # This week count (last 7 days)
        week_start = datetime.combine(today - timedelta(days=6), datetime.min.time())
        week_count = (
            db.query(func.count(Submission.id))
            .filter(Submission.created_at >= week_start)
            .scalar() or 0
        )
        
        return AnalyticsResponse(
            total_submissions=total,
            rating_distribution=rating_distribution,
            average_rating=round(float(avg_rating), 2),
            daily_volume=daily_volume,
            today_count=today_count,
            this_week_count=week_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )
